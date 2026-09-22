import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/authContext';
import { ShieldCheck, UserCheck, BookOpen, LogOut, Wifi } from 'lucide-react';

/**
 * (staff) Layout
 * Minimal top ribbon only (Campus Gate Online, Teaching Staff Clock button, Class Tracker)
 * No admin links, no super admin links, no logs, no sensitive administrative controls.
 */
export default function StaffLayout() {
  const { user, logout, config } = useAuth();
  const location = useLocation();

  const isAttendance = location.pathname === '/attendance' || location.pathname === '/attendance/';
  const isPeriodTracker =
    location.pathname === '/period_tracker' ||
    location.pathname === '/period-tracker' ||
    location.pathname.startsWith('/period');
  const isTeaching = !location.search.includes('type=non_teaching') && !location.pathname.includes('non-teaching');

  // If on /attendance, render pristine full-height mobile-friendly canvas without distracting navbar/footer
  if (isAttendance) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-center p-2 sm:p-4 selection:bg-emerald-500 selection:text-white">
        <Outlet />
      </div>
    );
  }

  // If on /period_tracker, render full-canvas 1:1 layout
  if (isPeriodTracker) {
    return (
      <div className="min-h-screen bg-[#EEF2F6] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Minimal Top Ribbon for Staff */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & School info */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              GES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {config.schoolName || 'Mawuli Senior High School'}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800">
                  <Wifi className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                  Campus Gate Online
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                Staff BYOD Portal • {config.schoolCode || 'GES-VR-HO-002'}
              </p>
            </div>
          </div>

          {/* Staff Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/attendance?type=teaching"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive && isTeaching
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`
              }
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Teaching Clock</span>
            </NavLink>

            <NavLink
              to="/attendance?type=non_teaching"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive && !isTeaching
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`
              }
            >
              <span>Non-Teaching</span>
            </NavLink>

            <NavLink
              to="/period_tracker"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`
              }
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Period Tracker</span>
            </NavLink>

            {user.role === 'staff' && (
              <button
                onClick={logout}
                title="Log out of staff session"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Staff Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 flex flex-col items-center">
        <Outlet />
      </main>

      {/* Discreet Institutional Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-center gap-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Ghana Education Service (GES) • Sir Eugene Technologies • Act 843 Protected</span>
        </div>
      </footer>
    </div>
  );
}
