/**
 * GES Smart Attendance - Offline Queue & Auto-Sync Engine
 * Stores attendance records in browser IndexedDB when connectivity fails
 * Automatically syncs with GES cloud ledger when network is restored.
 */

export interface QueuedAttendanceRecord {
  id: string;
  type: 'gate_checkin' | 'period_attendance' | 'non_teaching';
  payload: any;
  queuedAt: number;
  attempts: number;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  error?: string;
}

const DB_NAME = 'ges_smart_attendance_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_queue';

class OfflineQueueEngine {
  private db: IDBDatabase | null = null;
  private isSyncing = false;
  private listeners: Array<(count: number, isSyncing: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDB();
      window.addEventListener('online', () => {
        console.log('[Offline Queue] Network restored. Triggering auto-sync...');
        this.syncAll();
      });
    }
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('queuedAt', 'queuedAt', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        const db: IDBDatabase = event.target.result;
        this.db = db;
        this.notifyListeners();
        resolve(db);
      };

      request.onerror = (event: any) => {
        console.error('[Offline DB Error]:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  public subscribe(callback: (count: number, isSyncing: boolean) => void): () => void {
    this.listeners.push(callback);
    this.getPendingCount().then((count) => callback(count, this.isSyncing));
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyListeners() {
    try {
      const count = await this.getPendingCount();
      this.listeners.forEach((cb) => cb(count, this.isSyncing));
    } catch {
      // ignore
    }
  }

  public async enqueue(type: 'gate_checkin' | 'period_attendance' | 'non_teaching', payload: any): Promise<string> {
    const db = await this.initDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: QueuedAttendanceRecord = {
      id,
      type,
      payload: {
        ...payload,
        isOfflineQueued: true,
        offlineQueuedAt: new Date().toISOString(),
      },
      queuedAt: Date.now(),
      attempts: 0,
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(record);

      req.onsuccess = () => {
        this.notifyListeners();
        // If online, try syncing right away
        if (navigator.onLine) {
          setTimeout(() => this.syncAll(), 500);
        }
        resolve(id);
      };

      req.onerror = () => reject(req.error);
    });
  }

  public async getPendingCount(): Promise<number> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  public async getAllPending(): Promise<QueuedAttendanceRecord[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async remove(id: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => {
        this.notifyListeners();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async syncAll(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let synced = 0;
    let failed = 0;

    try {
      const records = await this.getAllPending();
      for (const item of records) {
        try {
          // Sync endpoint depending on record type
          let endpoint = '/api/attendance/offline-sync';
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: item.id,
              type: item.type,
              payload: item.payload,
              queuedAt: item.queuedAt,
            }),
          });

          if (response.ok) {
            await this.remove(item.id);
            synced++;
          } else {
            failed++;
          }
        } catch (err) {
          console.warn('[Offline Sync] Failed to sync item:', item.id, err);
          failed++;
        }
      }
    } catch (err) {
      console.error('[Offline Sync Error]:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { synced, failed };
  }
}

export const offlineQueueEngine = new OfflineQueueEngine();
