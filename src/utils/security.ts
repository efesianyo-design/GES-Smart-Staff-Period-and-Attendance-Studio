/**
 * GES Smart Attendance - Security, Brute-Force Protection & Multi-School Governance
 * Sir Eugene Technologies
 * Compliant with Ghana Data Protection Act, 2012 (Act 843)
 */

export interface SecurityIncident {
  id: string;
  timestamp: number;
  dateTime: string;
  schoolCode: string;
  staffIdAttempted?: string;
  staffNameAttempted?: string;
  type:
    | 'brute_force_pin'
    | 'multiple_failed_otp'
    | 'invalid_beacon_replay'
    | 'unauthorized_admin_attempt'
    | 'rate_limit_lockout';
  details: string;
  severity: 'medium' | 'high' | 'critical';
  deviceSignature: string;
  ipAddress?: string;
  coordinates?: { lat: number; lng: number };
  status: 'active_alert' | 'reviewed' | 'cleared';
}

export interface SchoolDirectoryItem {
  code: string;
  name: string;
  district: string;
  region: string;
  lat: number;
  lng: number;
  staffCount: number;
  nonTeachingCount: number;
  classCount: number;
  status: 'active' | 'synced';
}

export const OFFICIAL_GES_SCHOOLS: SchoolDirectoryItem[] = [
  {
    code: 'GES-VR-HO-002',
    name: 'Mawuli Senior High School',
    district: 'Ho Municipal',
    region: 'Volta Region',
    lat: 6.9167,
    lng: 0.2833,
    staffCount: 84,
    nonTeachingCount: 22,
    classCount: 38,
    status: 'active',
  },
  {
    code: 'GES-GAR-ACC-001',
    name: 'Achimota School',
    district: 'Okaikwei North',
    region: 'Greater Accra',
    lat: 5.6178,
    lng: -0.2189,
    staffCount: 112,
    nonTeachingCount: 35,
    classCount: 45,
    status: 'synced',
  },
  {
    code: 'GES-AR-KUM-003',
    name: 'Prempeh College',
    district: 'Kumasi Metro',
    region: 'Ashanti Region',
    lat: 6.7022,
    lng: -1.6514,
    staffCount: 120,
    nonTeachingCount: 40,
    classCount: 50,
    status: 'synced',
  },
  {
    code: 'GES-NR-TAM-004',
    name: 'Tamale Senior High School (TAMASCO)',
    district: 'Tamale Metro',
    region: 'Northern Region',
    lat: 9.4074,
    lng: -0.8393,
    staffCount: 96,
    nonTeachingCount: 28,
    classCount: 42,
    status: 'synced',
  },
  {
    code: 'GES-CR-CAP-005',
    name: 'Wesley Girls\' High School',
    district: 'Cape Coast Metro',
    region: 'Central Region',
    lat: 5.1278,
    lng: -1.2644,
    staffCount: 98,
    nonTeachingCount: 30,
    classCount: 40,
    status: 'synced',
  },
];

const SECURITY_STORAGE_KEYS = {
  INCIDENTS: 'ges_security_incidents_v1',
  FAILED_ATTEMPTS: 'ges_failed_attempts_tracker_v1',
  LOCKOUTS: 'ges_security_lockouts_v1',
  CURRENT_SCHOOL_CODE: 'ges_active_school_code_v1',
};

interface FailedAttemptRecord {
  count: number;
  lastAttemptTime: number;
}

class SecurityEngine {
  private failedAttempts: Map<string, FailedAttemptRecord> = new Map();
  private lockouts: Map<string, number> = new Map(); // identifier -> unlockTimestamp

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') return;
    try {
      const rawLockouts = localStorage.getItem(SECURITY_STORAGE_KEYS.LOCKOUTS);
      if (rawLockouts) {
        const parsed = JSON.parse(rawLockouts);
        Object.entries(parsed).forEach(([k, v]) => {
          if (typeof v === 'number' && v > Date.now()) {
            this.lockouts.set(k, v);
          }
        });
      }
    } catch (e) {
      console.warn('Security state load error:', e);
    }
  }

  private saveLockouts() {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, number> = {};
      this.lockouts.forEach((v, k) => {
        if (v > Date.now()) obj[k] = v;
      });
      localStorage.setItem(SECURITY_STORAGE_KEYS.LOCKOUTS, JSON.stringify(obj));
    } catch (e) {
      console.warn('Security lockout save error:', e);
    }
  }

  /**
   * Check if an identifier (staffId, IP, or deviceSignature) is currently locked out
   */
  public isLockedOut(identifier: string): { locked: boolean; remainingSeconds: number } {
    const unlockTime = this.lockouts.get(identifier);
    if (!unlockTime) return { locked: false, remainingSeconds: 0 };

    const remainingMs = unlockTime - Date.now();
    if (remainingMs <= 0) {
      this.lockouts.delete(identifier);
      this.saveLockouts();
      return { locked: false, remainingSeconds: 0 };
    }

    return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
  }

  /**
   * Record a failed PIN or OTP attempt.
   * Returns current failed count and whether a lockout was triggered.
   */
  public recordFailedAttempt(
    identifier: string,
    schoolCode: string,
    metadata: {
      staffId?: string;
      staffName?: string;
      type: SecurityIncident['type'];
      deviceSignature: string;
      coordinates?: { lat: number; lng: number };
    }
  ): { count: number; locked: boolean; remainingSeconds: number; triggeredIncident?: SecurityIncident } {
    const existing = this.failedAttempts.get(identifier) || { count: 0, lastAttemptTime: 0 };
    const now = Date.now();

    // Reset count if last attempt was over 10 minutes ago
    const count = now - existing.lastAttemptTime > 600000 ? 1 : existing.count + 1;
    this.failedAttempts.set(identifier, { count, lastAttemptTime: now });

    let triggeredIncident: SecurityIncident | undefined;

    // Threshold 1: 3 Failed Attempts -> Warning Log
    if (count === 3) {
      triggeredIncident = this.logIncident({
        schoolCode,
        staffIdAttempted: metadata.staffId,
        staffNameAttempted: metadata.staffName,
        type: metadata.type,
        details: `Warning: 3 consecutive failed verification attempts detected on device [${metadata.deviceSignature.slice(0, 8)}]. Throttling input.`,
        severity: 'medium',
        deviceSignature: metadata.deviceSignature,
        coordinates: metadata.coordinates,
        status: 'active_alert',
      });
    }

    // Threshold 2: 5 Failed Attempts -> 5-Minute Critical Lockout
    if (count >= 5) {
      const lockoutDurationMs = 300000; // 5 minutes
      const unlockTime = now + lockoutDurationMs;
      this.lockouts.set(identifier, unlockTime);
      this.saveLockouts();

      triggeredIncident = this.logIncident({
        schoolCode,
        staffIdAttempted: metadata.staffId,
        staffNameAttempted: metadata.staffName,
        type: 'brute_force_pin',
        details: `CRITICAL BRUTE-FORCE LOCKOUT: 5 consecutive failed verification attempts detected. Target device throttled and locked for 5 minutes. Audit flagged for GES Administrative review.`,
        severity: 'critical',
        deviceSignature: metadata.deviceSignature,
        coordinates: metadata.coordinates,
        status: 'active_alert',
      });

      return {
        count,
        locked: true,
        remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
        triggeredIncident,
      };
    }

    return {
      count,
      locked: false,
      remainingSeconds: 0,
      triggeredIncident,
    };
  }

  /**
   * Reset failed attempts upon successful login/verification
   */
  public clearFailedAttempts(identifier: string) {
    this.failedAttempts.delete(identifier);
    this.lockouts.delete(identifier);
    this.saveLockouts();
  }

  /**
   * Log a security incident to local persistent audit log
   */
  public logIncident(
    incident: Omit<SecurityIncident, 'id' | 'timestamp' | 'dateTime'>
  ): SecurityIncident {
    const list = this.getIncidents();
    const newIncident: SecurityIncident = {
      ...incident,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      dateTime: new Date().toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'medium',
      }),
    };
    list.unshift(newIncident);
    // Keep last 100 incidents
    const trimmed = list.slice(0, 100);
    this.saveIncidents(trimmed);

    // Dispatch global event for live toast notifications
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('ges_security_alert', { detail: newIncident })
      );
    }

    return newIncident;
  }

  public getIncidents(): SecurityIncident[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(SECURITY_STORAGE_KEYS.INCIDENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse security incidents:', e);
    }
    return [];
  }

  public saveIncidents(incidents: SecurityIncident[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        SECURITY_STORAGE_KEYS.INCIDENTS,
        JSON.stringify(incidents)
      );
    } catch (e) {
      console.warn('Failed to save security incidents:', e);
    }
  }

  public resolveIncident(id: string): boolean {
    const list = this.getIncidents();
    const idx = list.findIndex((i) => i.id === id);
    if (idx >= 0) {
      list[idx].status = 'cleared';
      this.saveIncidents(list);
      return true;
    }
    return false;
  }

  public clearAllIncidents() {
    this.saveIncidents([]);
  }
}

export const securityEngine = new SecurityEngine();
