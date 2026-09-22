import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../utils/authContext';
import { OFFICIAL_GES_SCHOOLS, getAllSchools } from '../../../utils/security';
import { soundSynthesizer } from '../../../utils/audio';
import { Building2, ArrowRight, AlertTriangle, Key, Shield } from 'lucide-react';

export default function SchoolLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('from') || '/admin';

  // If role=super_admin was requested, redirect to the dedicated Super Admin login page
  if (searchParams.get('role') === 'super_admin') {
    return <Navigate to={`/super/login?from=${encodeURIComponent(returnUrl)}`} replace />;
  }

  const { loginAsSchoolAdmin, config } = useAuth();

  const [schoolsList, setSchoolsList] = useState(() => getAllSchools());

  useEffect(() => {
    const handleUpdate = () => {
      setSchoolsList(getAllSchools());
    };
    window.addEventListener('ges_schools_updated', handleUpdate);
    return () => window.removeEventListener('ges_schools_updated', handleUpdate);
  }, []);

  const [selectedSchoolCode, setSelectedSchoolCode] = useState(() => {
    const lastActive = localStorage.getItem('schoolCode') || localStorage.getItem('ges_active_school_code_v1');
    if (lastActive && getAllSchools().some((s) => s.code === lastActive)) {
      return lastActive;
    }
    return config.schoolCode || 'GES-VR-HO-002';
  });
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockout, setIsLockout] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginAsSchoolAdmin(selectedSchoolCode, pin);
    if (res.success) {
      soundSynthesizer.playClockInChime();
      navigate(returnUrl.startsWith('/super') ? '/admin' : returnUrl);
    } else {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setErrorMsg(res.error || 'Invalid credentials');
      setIsLockout(!!res.lockout);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 backdrop-blur-md">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <Building2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Protected School Console</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              School Admin Console Login
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Sign in to manage institutional attendance, staff hubs, unclock authorization, and local GES reports.
            </p>
          </div>
        </div>

        {/* Error Alert with Brute Force Throttling */}
        {errorMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium border flex items-start gap-2.5 ${
              isLockout
                ? 'bg-red-950/90 border-red-500 text-red-200 animate-pulse'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Select School Campus</span>
            </label>
            <select
              value={selectedSchoolCode}
              onChange={(e) => setSelectedSchoolCode(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-hidden transition font-medium"
            >
              {schoolsList.map((school) => (
                <option key={school.code} value={school.code}>
                  {school.name} ({school.code}) • {school.region}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span>School Admin PIN</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Demo: 1234</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN (e.g. 1234)"
              required
              autoFocus
              className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl py-3 px-4 text-center font-mono text-lg tracking-widest text-white focus:outline-hidden transition"
            />
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Authorize School Console Entry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Console Separation Navigation */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <div className="text-[11px] text-slate-300">
                GES National Directorate Officer?
              </div>
            </div>
            <Link
              to="/super/login"
              className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
            >
              <span>Go to Super Admin Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
            <Link to="/attendance" className="hover:text-emerald-400 transition">
              ← Staff Attendance
            </Link>
            <Link to="/kiosk" className="hover:text-emerald-400 transition">
              Launch Common Room Kiosk →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
