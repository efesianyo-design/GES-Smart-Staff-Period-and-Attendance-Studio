import React from 'react';
import { X, ShieldAlert, Clock, MapPin, BookOpen, WifiOff, FileSpreadsheet, Monitor } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[88dvh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">GES Attendance &amp; Period Guide</h3>
              <p className="text-[11px] text-slate-400">Sir Eugene Technologies Official Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
          {/* Anti-Spoofing */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1 text-[13px]">
              <MapPin className="w-4 h-4" />
              1. GPS Anti-Spoofing &amp; Perimeter Security
            </div>
            <p className="text-slate-300 leading-relaxed">
              Clock-In is strictly enforced via high-precision Haversine coordinates. You must be physically within <strong>200 meters</strong> of the school gate coordinates (default: Mawuli Senior High School, Ho). If you are outside this perimeter, the Clock-In button is locked with a warning buzzer.
            </p>
          </div>

          {/* Dual Operating Device Modes */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1 text-[13px]">
              <Monitor className="w-4 h-4" />
              2. Dual-Operating Device Architecture
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
              <li><strong className="text-emerald-400">🖥️ Shared Kiosk Terminal Mode:</strong> Mounted staff-room tablet featuring high-speed queue processing, on-screen touch numpad for PIN entry, 5-second auto-reset timer, and a 20-second rotating campus QR beacon.</li>
              <li><strong className="text-indigo-400">📱 BYOD Personal Phone Mode:</strong> Configured for individual teacher smartphones with One-Device Lock (anti buddy-punching), GPS geofencing, and camera scanning of the staff-room kiosk beacon.</li>
            </ul>
          </div>

          {/* Punctuality Thresholds */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1 text-[13px]">
              <Clock className="w-4 h-4" />
              2. Official GES Punctuality Thresholds
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-slate-300">
              <li><strong className="text-emerald-400">🟢 On Time:</strong> Arrival recorded before <strong>7:45 AM</strong>.</li>
              <li><strong className="text-amber-400">🟡 Late:</strong> Arrival between <strong>7:46 AM and 8:30 AM</strong>.</li>
              <li><strong className="text-rose-400">🔴 Substantially Late:</strong> Arrival after <strong>8:30 AM</strong> (flagged for Academic Board review).</li>
            </ul>
          </div>

          {/* Period Tracker */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1 text-[13px]">
              <ShieldAlert className="w-4 h-4" />
              3. Period &amp; Classroom Contact Hours
            </div>
            <p className="text-slate-300 leading-relaxed">
              When entering the classroom, select or scan the room door badge and start the session. Record rapid learner attendance by tapping present/absent counts. Upon concluding, contact minutes and student attendance are logged into the audit trail.
            </p>
          </div>

          {/* Offline Engine */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1 text-[13px]">
              <WifiOff className="w-4 h-4" />
              4. 100% Offline-First Operation
            </div>
            <p className="text-slate-300 leading-relaxed">
              The application caches all assets via the Service Worker. Even in remote staff rooms without network connectivity, all gate arrivals and class periods are saved locally and auto-synced once connection is restored.
            </p>
          </div>

          {/* Compliance Reporting */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1 text-[13px]">
              <FileSpreadsheet className="w-4 h-4" />
              5. GES Official Inspection CSV Exports
            </div>
            <p className="text-slate-300 leading-relaxed">
              Headmasters and Academic Supervisors can export daily and monthly staff attendance logs and instructional contact hours reports formatted according to Ghana Education Service audit standards.
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
