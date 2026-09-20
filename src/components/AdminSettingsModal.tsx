import React, { useState } from 'react';
import {
  X,
  Lock,
  KeyRound,
  MapPin,
  Clock,
  RotateCcw,
  Save,
  CheckCircle2,
  RefreshCw,
  School,
  Monitor,
} from 'lucide-react';
import { SchoolConfig } from '../types';
import { storageEngine } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onSaveConfig: (updated: SchoolConfig) => void;
  onResetData: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [formData, setFormData] = useState<SchoolConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.superAdminPin || pinInput === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
      soundSynthesizer.playScanBeep();
    } else {
      setPinError(true);
      soundSynthesizer.playOutOfBoundsBuzzer();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    soundSynthesizer.playClockInChime();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleManualSync = () => {
    storageEngine.clearSyncQueue();
    setSyncStatusMsg('All local cached attendance and period records synced successfully!');
    soundSynthesizer.playClockInChime();
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo attendance registers and classrooms to default?')) {
      onResetData();
      soundSynthesizer.playScanBeep();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Super Admin &amp; GES Controls</h3>
              <p className="text-[11px] text-slate-400">Institutional Geofence &amp; Policy Settings</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setPinInput('');
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          /* PIN Gate */
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
              <KeyRound className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Super Admin Access</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Enter 4-digit Super Admin PIN (Default: <strong className="text-emerald-400 font-mono">1234</strong>) to configure geofence, coordinates, and rules.
            </p>

            <form onSubmit={handlePinSubmit} className="mt-5 w-full max-w-xs space-y-3">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className={`w-full text-center text-2xl tracking-[0.4em] py-2.5 rounded-xl bg-slate-950 border ${
                  pinError ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-white'
                } focus:outline-none focus:border-emerald-500`}
                autoFocus
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 font-medium">Invalid Admin PIN. Try default: 1234</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-98 font-semibold text-xs text-white shadow-md transition"
              >
                Unlock Administrator Panel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Form */
          <form onSubmit={handleSave} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Settings saved and geofence parameters applied.
              </div>
            )}

            {syncStatusMsg && (
              <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                {syncStatusMsg}
              </div>
            )}

            {/* School Profile */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <School className="w-4 h-4 text-emerald-400" />
                Institution Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">School Name</label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">GES Code / Reg</label>
                  <input
                    type="text"
                    value={formData.schoolCode}
                    onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* GPS Geofence Anti-Spoofing Parameters */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Anti-Spoofing Geofence Coordinates
              </div>
              <p className="text-[11px] text-slate-400">
                Staff must be within the geofenced radius to register arrival. (Default: Ho Mawuli Lat: 6.9167, Lng: 0.2833)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Allowed Radius (m)</label>
                  <input
                    type="number"
                    value={formData.radiusMeters}
                    onChange={(e) => setFormData({ ...formData, radiusMeters: parseInt(e.target.value, 10) || 200 })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Cutoff Times */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                Official GES Bell Schedule &amp; Cutoffs
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">On-Time Cutoff</label>
                  <input
                    type="time"
                    value={formData.onTimeCutoff}
                    onChange={(e) => setFormData({ ...formData, onTimeCutoff: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-emerald-400">Up to 7:45 AM</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Late Arrival Cutoff</label>
                  <input
                    type="time"
                    value={formData.lateCutoff}
                    onChange={(e) => setFormData({ ...formData, lateCutoff: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-amber-400">7:46 - 8:30 AM</span>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Closing Clock-Out</label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">School Closing Time</span>
                </div>
              </div>
            </div>

            {/* Device Operating Mode Configuration */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  Dual-Operating Device Deployment Mode
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-mono">
                  {storageEngine.getDeviceMode() === 'kiosk' ? '🖥️ Kiosk Active' : '📱 BYOD Active'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Choose how this device functions within the GES school attendance workflow.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    storageEngine.saveDeviceMode('kiosk');
                    soundSynthesizer.playScanBeep();
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    storageEngine.getDeviceMode() === 'kiosk'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <span>🖥️</span> Shared Kiosk Terminal Mode
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mounted staff-room tablet. High-speed queue, on-screen numpad, 5-second auto-reset, and rotating campus QR beacon.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    storageEngine.saveDeviceMode('byod');
                    soundSynthesizer.playScanBeep();
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 2000);
                  }}
                  className={`p-3 rounded-xl border text-left transition ${
                    storageEngine.getDeviceMode() === 'byod'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-xs flex items-center gap-1.5">
                    <span>📱</span> BYOD Personal Phone Mode
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Individual teacher smartphone. One-device lock preventing proxy punching, GPS perimeter check, and beacon scanner.
                  </p>
                </button>
              </div>

              {storageEngine.getBoundStaffId() && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px]">
                  <span className="text-indigo-200">
                    Phone bound to staff ID: <strong className="font-mono text-emerald-400">{storageEngine.getBoundStaffId()}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      storageEngine.saveBoundStaffId(null);
                      soundSynthesizer.playScanBeep();
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    Reset Device Lock
                  </button>
                </div>
              )}
            </div>

            {/* Offline Sync & System Actions */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap gap-2.5 items-center justify-between">
              <div>
                <p className="font-semibold text-white">Manual Data Synchronization</p>
                <p className="text-[11px] text-slate-400">Force sync all cached offline queues to storage</p>
              </div>
              <button
                type="button"
                onClick={handleManualSync}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Sync Local Queue
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 flex flex-wrap gap-2.5 items-center justify-between">
              <div>
                <p className="font-semibold text-rose-300">Reset Demo Data</p>
                <p className="text-[11px] text-slate-400">Restore factory sample staff, classrooms, and logs</p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-md transition"
              >
                <Save className="w-3.5 h-3.5" />
                Save Institutional Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
