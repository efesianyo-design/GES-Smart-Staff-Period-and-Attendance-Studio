import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import {
  Radio,
  UserCheck,
  Building2,
  Shield,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';

export default function RootHomePage() {
  const { config } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md">
            GES
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight">
              {config.schoolName || 'Mawuli Senior High School'}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Smart Attendance &amp; Academic Governance • {config.schoolCode || 'GES-VR-HO-002'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-[11px] font-bold text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </span>
        </div>
      </header>

      {/* Main Role Selection Grid */}
      <main className="max-w-5xl mx-auto w-full py-8 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            Ghana Education Service (GES) Architecture
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Role-Based Route Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Access dedicated portals with strict role boundaries, tamper-proof verification, and zero data leakage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Card 1: Kiosk Terminal */}
          <Link
            to="/kiosk"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                  Dedicated Screen Terminal
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition">
                  Common Room Kiosk
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fullscreen rotating 20-second cryptographic optical beacon. Broadcasts only; never accepts clock-ins directly.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition">
              <span>Launch Kiosk (/kiosk)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 2: Staff BYOD Teaching Attendance */}
          <Link
            to="/attendance?type=teaching"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Staff BYOD Mode
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition">
                  Teaching Staff Portal
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile-first card. 2-Step: PIN/OTP entry + Scan Common Room Kiosk. Staff can ONLY see their own status.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Open Staff Portal (/attendance)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 3: Non-Teaching Staff */}
          <Link
            to="/attendance?type=non_teaching"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Simplified Yam-Phone UI
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition">
                  Non-Teaching Portal
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Large PIN keypad, shift-hour tracking, and USSD keypad simulation for Security, Cooks, and Grounds staff.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:translate-x-1 transition">
              <span>Non-Teaching Portal</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 4: Period & Class Tracker */}
          <Link
            to="/period_tracker"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                  Academic Timetable
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition">
                  Period &amp; Class Tracker
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                8-period daily timetable, door QR scanner for classroom check-in, and learner roll call.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition">
              <span>Track Classes (/period_tracker)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 5: School Admin Console */}
          <Link
            to="/admin"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Protected School Console
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-200 transition">
                  School Admin Console
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scoped strictly to {config.schoolCode}. Unclock Staff Hub with mandatory audit reason, geofence radius &amp; GES CSV exports.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Admin Console (/admin)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Card 6: Super Admin Directorate */}
          <Link
            to="/super_admin"
            className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-950/60 transition group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block">
                  GES Headquarters
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition">
                  Super Admin Directorate
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-school oversight across Mawuli, Achimota, Prempeh, Tamale. Brute-force security alerts &amp; punctuality benchmarks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition">
              <span>Directorate (/super_admin)</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Compliant with Ghana Data Protection Act 2012 (Act 843)</span>
        </div>
        <span>Sir Eugene Technologies • Ghana Education Service</span>
      </footer>
    </div>
  );
}
