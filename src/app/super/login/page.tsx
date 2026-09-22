import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../../utils/authContext';
import { soundSynthesizer } from '../../../utils/audio';
import { Shield, Lock, ArrowRight, AlertTriangle, Key, Building2 } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('from') || '/super_admin';

  // If someone passed role=school_admin, redirect to /school/login
  if (searchParams.get('role') === 'school_admin') {
    return <Navigate to={`/school/login?from=${encodeURIComponent(returnUrl)}`} replace />;
  }

  const { loginAsSuperAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLockout, setIsLockout] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = loginAsSuperAdmin(pin);
    if (res.success) {
      soundSynthesizer.playClockInChime();
      navigate(returnUrl);
    } else {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setErrorMsg(res.error || 'Invalid Super Admin credentials');
      setIsLockout(!!res.lockout);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/4 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-[#0F172A]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 backdrop-blur-md">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border-2 border-indigo-500/50 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-950/50 relative">
            <Shield className="w-8 h-8 text-indigo-400" />
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-[9px] font-black text-amber-300">
              GES
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>GES Headquarters Directorate</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Super Admin Directorate Login
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              National &amp; Regional governance console for cross-school inspection, security radar, and nationwide benchmarks.
            </p>
          </div>
        </div>

        {/* Security Clearance Notice */}
        <div className="p-3.5 rounded-2xl bg-[#131C2E] border border-indigo-500/30 text-xs text-indigo-200/90 flex items-start gap-3">
          <Lock className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-white block font-semibold">Strict Directorate Clearance</strong>
            Access to all 3,241 senior high institutions across Ghana, including Tamale, Prempeh, Mawuli, and Accra High.
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Super Admin Master PIN</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Demo: 1234</span>
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Master PIN (e.g. 1234)"
              required
              autoFocus
              className="w-full bg-[#070B14] border-2 border-slate-800 focus:border-indigo-500 rounded-2xl py-3.5 px-4 text-center font-mono text-xl tracking-widest text-white focus:outline-hidden transition"
            />
          </div>

          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Authorize Directorate Entry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Console Separation Navigation */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <div className="text-[11px] text-slate-300">
                School Administrator?
              </div>
            </div>
            <Link
              to="/school/login"
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
            >
              <span>Go to School Admin Login</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 px-1">
            <Link to="/attendance" className="hover:text-emerald-400 transition">
              ← Staff Attendance
            </Link>
            <Link to="/kiosk" className="hover:text-indigo-400 transition">
              Launch Kiosk →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
