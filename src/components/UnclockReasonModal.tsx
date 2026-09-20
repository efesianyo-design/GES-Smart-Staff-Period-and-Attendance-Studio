import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  ShieldAlert,
  CheckCircle2,
  Clock,
  UserX,
  FileText,
  Lock,
} from 'lucide-react';
import { GateAttendanceRecord, NonTeachingAttendanceRecord } from '../types';
import { soundSynthesizer } from '../utils/audio';

interface UnclockReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: GateAttendanceRecord | NonTeachingAttendanceRecord | null;
  recordType: 'gate' | 'non_teaching';
  onConfirmUnclock: (recordId: string, reason: string, adminName: string) => void;
  superAdminPin?: string;
}

const PRESET_REASONS = [
  'Clocked in by mistake on colleague’s terminal',
  'Selected wrong staff member name from selector',
  'Emergency departure from school before official duty start',
  'Device / scanner hardware calibration test punch',
  'Accidental double entry or duplicate tablet scan',
  'Other administrative justification (specify below)',
];

export const UnclockReasonModal: React.FC<UnclockReasonModalProps> = ({
  isOpen,
  onClose,
  record,
  recordType,
  onConfirmUnclock,
  superAdminPin = '1234',
}) => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [adminName, setAdminName] = useState('Super Administrator / Headmaster');
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const staffName = record.staffName;
  const staffId = record.staffId;
  const clockInTime = record.clockInTime;

  const handleConfirm = () => {
    // 1. Verify PIN if provided
    if (adminPin.trim() && adminPin.trim() !== superAdminPin) {
      setPinError(true);
      soundSynthesizer.playOutOfBoundsBuzzer();
      return;
    }

    // 2. Reason validation
    const finalReason = selectedPreset.includes('Other')
      ? customReason.trim()
      : customReason.trim()
      ? `${selectedPreset} - ${customReason.trim()}`
      : selectedPreset;

    if (!finalReason || finalReason.length < 5) {
      setReasonError('A valid administrative reason (minimum 5 characters) is required by GES audit regulations.');
      return;
    }

    soundSynthesizer.playOutOfBoundsBuzzer();
    onConfirmUnclock(record.id, finalReason, adminName.trim() || 'Super Administrator');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-rose-500/40 p-5 sm:p-6 shadow-2xl shadow-rose-950/50 space-y-4 text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Unclock Staff Member</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-bold">
                  REVOKE CLOCK-IN
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cancel an accidental or erroneous attendance entry with mandatory audit justification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Affected Staff Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-mono">Target Staff Record</div>
            <div className="font-bold text-white text-sm">{staffName}</div>
            <div className="text-slate-400 font-mono text-[11px]">
              ID: {staffId} • {recordType === 'gate' ? 'Teaching Gate' : 'Non-Teaching'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Logged Clock-In</div>
            <div className="font-mono text-rose-400 font-bold flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5" />
              <span>{clockInTime}</span>
            </div>
            <div className="text-[10px] text-amber-400">Will be set to: Off-Campus</div>
          </div>
        </div>

        {/* Mandatory Reason Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Mandatory Reason for Unclocking</span>
            </span>
            <span className="text-[10px] text-rose-400 font-mono">* Required by GES Audit</span>
          </label>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            {PRESET_REASONS.map((reason) => (
              <label
                key={reason}
                onClick={() => setSelectedPreset(reason)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                  selectedPreset === reason
                    ? 'bg-rose-950/40 border-rose-500/60 text-white font-medium shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-950'
                }`}
              >
                <input
                  type="radio"
                  name="unclock_preset"
                  checked={selectedPreset === reason}
                  onChange={() => setSelectedPreset(reason)}
                  className="text-rose-500 focus:ring-rose-500 h-3.5 w-3.5 bg-slate-900 border-slate-700"
                />
                <span className="text-[11px] leading-tight">{reason}</span>
              </label>
            ))}
          </div>

          {/* Additional Specific Explanation */}
          <div className="pt-1">
            <textarea
              value={customReason}
              onChange={(e) => {
                setCustomReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Provide specific details (e.g., 'Staff mistakenly selected Mr. Samuel instead of Mr. Sylvanus on gate tablet at 07:35 AM')..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-rose-500 transition"
            />
            {reasonError && (
              <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{reasonError}</span>
              </p>
            )}
          </div>
        </div>

        {/* Authorizing Admin Designation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              Authorized By (Admin Designation)
            </label>
            <input
              type="text"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center justify-between">
              <span>Super Admin PIN</span>
              <span className="text-[10px] text-slate-500 font-mono">Default: 1234</span>
            </label>
            <input
              type="password"
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value);
                setPinError(false);
              }}
              placeholder="Enter PIN (1234)"
              maxLength={6}
              className={`w-full px-3 py-2 rounded-xl bg-slate-950 border text-xs text-white focus:outline-hidden ${
                pinError ? 'border-rose-500 animate-shake' : 'border-slate-800 focus:border-rose-500'
              }`}
            />
            {pinError && (
              <span className="text-[10px] text-rose-400 mt-0.5 block">Incorrect Admin PIN</span>
            )}
          </div>
        </div>

        {/* Audit Notice Warning */}
        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>GES Audit Ledger Impact:</strong> This record will be marked as <span className="font-mono font-bold text-white">[VOIDED]</span> with your stated reason. The staff member will be immediately reset to &quot;Off Campus&quot; and allowed to clock in again cleanly if needed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 active:scale-95"
          >
            <UserX className="w-4 h-4" />
            <span>Confirm Unclock &amp; Void Record</span>
          </button>
        </div>
      </div>
    </div>
  );
};
