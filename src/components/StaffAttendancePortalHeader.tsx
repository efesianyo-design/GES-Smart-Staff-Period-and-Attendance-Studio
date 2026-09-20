import React from 'react';
import {
  Clock,
  School,
  Lock,
  ArrowRight,
  BookOpen,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { SchoolConfig } from '../types';

interface StaffAttendancePortalHeaderProps {
  config: SchoolConfig;
  activeStaffType: 'teaching' | 'non_teaching';
  onSelectStaffType: (type: 'teaching' | 'non_teaching') => void;
  onNavigateToPeriodTracker: () => void;
  onOpenAdminPortal: () => void;
}

export const StaffAttendancePortalHeader: React.FC<StaffAttendancePortalHeaderProps> = ({
  config,
  activeStaffType,
  onSelectStaffType,
  onNavigateToPeriodTracker,
  onOpenAdminPortal,
}) => {
  return (
    <header className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl backdrop-blur-md mb-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-950/60 font-bold font-mono text-base border border-emerald-400/30">
            {config.schoolCode || 'MSHS'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {config.schoolName || 'Mawuli Senior High School'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                GES Official Portal
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Staff Daily Duty Clock-In • Instant 2-Step OTP &amp; QR Beacon Verification
            </p>
          </div>
        </div>

        {/* Right Controls: Period Tracker Link & Admin Portal Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick link for teachers ready to log their class */}
          <button
            type="button"
            onClick={onNavigateToPeriodTracker}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold transition shadow-xs"
            title="Jump directly to Period & Class Tracker"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Go to</span>
            <span>Period Tracker</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Secure Admin Portal Link */}
          <button
            type="button"
            onClick={onOpenAdminPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700"
            title="Administrator Login / Reports / Unclock Portal"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>

      {/* Staff Role Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Clock-In Category:</span>
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => onSelectStaffType('teaching')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeStaffType === 'teaching'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>👨‍🏫 Teaching Staff</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStaffType('non_teaching')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                activeStaffType === 'non_teaching'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>👷 Non-Teaching Staff</span>
            </button>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Campus Gate Kiosk Online</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-300">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
};
