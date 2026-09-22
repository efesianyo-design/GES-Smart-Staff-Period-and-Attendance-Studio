import React, { useState } from 'react';
import {
  UserX,
  X,
  AlertTriangle,
  Lock,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';
import { GateAttendanceRecord, NonTeachingAttendanceRecord } from '../types';
import { storageEngine } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

interface UnclockAuditHubProps {
  schoolName: string;
  schoolCode: string;
  superAdminPin?: string;
  onRefresh?: () => void;
}

const PRESET_REASONS = [
  'Clocked in by mistake on colleague’s terminal',
  'Selected wrong staff member name from selector',
  'Emergency departure from school before official duty start',
  'Device / scanner hardware calibration test punch',
  'Accidental double entry or duplicate tablet scan',
  'Other administrative justification (specify below)',
];

export const UnclockAuditHub: React.FC<UnclockAuditHubProps> = ({
  schoolName,
  schoolCode,
  superAdminPin = '1234',
  onRefresh,
}) => {
  const [records, setRecords] = useState<GateAttendanceRecord[]>(() => {
    return storageEngine.getGateAttendance();
  });
  const [selectedRecord, setSelectedRecord] = useState<GateAttendanceRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [adminName, setAdminName] = useState('School Administrator');
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const reloadRecords = () => {
    const updated = storageEngine.getGateAttendance();
    setRecords(updated);
    onRefresh?.();
  };

  const handleOpenUnclock = (rec: GateAttendanceRecord) => {
    setSelectedRecord(rec);
    setSelectedPreset(PRESET_REASONS[0]);
    setCustomReason('');
    setAdminPin('');
    setPinError(false);
    setReasonError(null);
    setModalOpen(true);
  };

  const handleConfirmUnclock = () => {
    if (!selectedRecord) return;

    if (adminPin.trim() && adminPin.trim() !== superAdminPin) {
      setPinError(true);
      soundSynthesizer.playOutOfBoundsBuzzer();
      return;
    }

    const finalReason = selectedPreset.includes('Other')
      ? customReason.trim()
      : customReason.trim()
      ? `${selectedPreset} - ${customReason.trim()}`
      : selectedPreset;

    if (!finalReason || finalReason.length < 5) {
      setReasonError('A valid administrative reason (minimum 5 characters) is required by GES audit regulations.');
      return;
    }

    storageEngine.voidGateRecord(selectedRecord.id, finalReason, adminName.trim() || 'School Administrator');
    soundSynthesizer.playScanBeep();
    setSuccessToast(`Attendance record for ${selectedRecord.staffName} successfully revoked with audit justification.`);
    setModalOpen(false);
    reloadRecords();

    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleRestore = (id: string) => {
    storageEngine.restoreGateRecord(id);
    soundSynthesizer.playScanBeep();
    setSuccessToast('Attendance record successfully restored.');
    reloadRecords();
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === todayStr);

  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#0F172A] tracking-tight flex items-center gap-2">
              <span>Unclock Hub &amp; Gate Audit Log</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                {schoolCode}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Mandatory administrative justification required to void erroneous arrivals • Audited per GES Act 843
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {todayRecords.filter((r) => !r.isVoided).length} active •{' '}
            <strong className="text-rose-600">{todayRecords.filter((r) => r.isVoided).length} unclocked</strong>
          </span>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase bg-slate-50/50">
              <th className="py-2 px-3">Staff Name &amp; ID</th>
              <th className="py-2 px-3">Department</th>
              <th className="py-2 px-3">Clock-In Time</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {todayRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                  No gate clock-ins logged today for campus {schoolCode}.
                </td>
              </tr>
            ) : (
              todayRecords.map((rec) => (
                <tr
                  key={rec.id}
                  className={`transition ${rec.isVoided ? 'bg-rose-50/40 text-slate-400' : 'hover:bg-slate-50/60'}`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-extrabold text-[#0F172A]">{rec.staffName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{rec.staffId}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-600">
                    {rec.department}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={rec.isVoided ? 'line-through text-rose-400' : 'text-[#0F172A]'}>
                      {rec.clockInTime}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {rec.isVoided ? (
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          UNCLOCKED
                        </span>
                        <p className="text-[10px] text-rose-600 font-medium max-w-xs truncate" title={rec.voidReason}>
                          Reason: {rec.voidReason}
                        </p>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        {rec.punctualityStatus === 'on_time' ? 'ON TIME' : 'LATE'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    {rec.isVoided ? (
                      <button
                        onClick={() => handleRestore(rec.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-600" />
                        <span>Restore Punch</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenUnclock(rec)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] inline-flex items-center gap-1 transition"
                      >
                        <UserX className="w-3 h-3 text-rose-500" />
                        <span>Unclock / Void</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Unclock Modal */}
      {modalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white border border-rose-300 p-5 sm:p-6 shadow-2xl space-y-4 text-slate-900 animate-fade-in">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F172A] flex items-center gap-2">
                    <span>Unclock Staff Member</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-mono font-bold">
                      AUDIT VOID
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cancel an accidental or erroneous attendance entry with mandatory audit justification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Staff Member:</span>
                <span className="font-extrabold text-slate-900">{selectedRecord.staffName} ({selectedRecord.staffId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Campus:</span>
                <span className="font-bold text-slate-900">{schoolName} ({schoolCode})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Clock-In Registered:</span>
                <span className="font-mono font-bold text-emerald-600">{selectedRecord.clockInTime}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Audit Reason (Required by GES Policy) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 cursor-pointer"
                >
                  {PRESET_REASONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes / Justification
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Provide detailed explanation for inspectorate log..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Authorizing Admin Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Admin PIN (Default: 1234)
                  </label>
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Enter PIN"
                    className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 ${
                      pinError ? 'border-rose-500 ring-rose-400' : 'border-[#E2E8F0] focus:ring-rose-400'
                    }`}
                  />
                </div>
              </div>

              {reasonError && (
                <p className="text-xs text-rose-600 font-bold">{reasonError}</p>
              )}
              {pinError && (
                <p className="text-xs text-rose-600 font-bold">Incorrect Admin PIN. Please check and try again.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUnclock}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 active:scale-95 transition"
              >
                Confirm Unclock &amp; Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
