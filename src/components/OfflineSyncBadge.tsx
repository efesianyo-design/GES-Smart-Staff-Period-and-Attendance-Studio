import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { offlineQueueEngine } from '../utils/offlineQueue';

export const OfflineSyncBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = offlineQueueEngine.subscribe((count, syncing) => {
      setPendingCount(count);
      setIsSyncing(syncing);
      if (count === 0 && syncing === false && pendingCount > 0) {
        setSyncNotice('All offline records successfully synced!');
        setTimeout(() => setSyncNotice(null), 4000);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [pendingCount]);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    const { synced, failed } = await offlineQueueEngine.syncAll();
    setIsSyncing(false);
    if (synced > 0) {
      setSyncNotice(`✓ Synced ${synced} record${synced > 1 ? 's' : ''} to GES ledger!`);
      setTimeout(() => setSyncNotice(null), 4000);
    } else if (failed > 0) {
      setSyncNotice(`⚠️ ${failed} record${failed > 1 ? 's' : ''} failed to sync.`);
      setTimeout(() => setSyncNotice(null), 4000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Network Connectivity Pill */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition shadow-xs ${
          isOnline
            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
            : 'bg-rose-950/60 text-rose-300 border-rose-800 animate-pulse'
        }`}
        title={isOnline ? 'Internet connection active' : 'Offline: Local IndexedDB queue active'}
      >
        {isOnline ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Queue</span>
          </>
        )}
      </div>

      {/* Queued Records Badge */}
      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-600/40 rounded-full text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          title="Click to sync offline records"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {pendingCount} Queued
          </span>
          <RefreshCw className={`w-3 h-3 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Sync Toast Notice */}
      {syncNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500 text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}
    </div>
  );
};
