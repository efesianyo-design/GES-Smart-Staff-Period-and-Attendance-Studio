import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SCHOOL_THEMES, SchoolTheme } from '../../../../config/schoolThemes';
import { GesLogo } from '../page';
import { Tv, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { soundSynthesizer } from '../../../../utils/audio';

export default function KioskSetupPage() {
  const navigate = useNavigate();

  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(() => {
    return (
      localStorage.getItem('schoolCode') ||
      localStorage.getItem('ges_active_school_code_v1') ||
      'MAWULI01'
    );
  });

  const [deviceId, setDeviceId] = useState<string>(() => {
    return localStorage.getItem('kiosk_device_id') || 'KIOSK-TV-COMM-01';
  });

  const [deviceLocation, setDeviceLocation] = useState<string>(() => {
    return localStorage.getItem('kiosk_device_location') || 'Common Room TV Screen #1';
  });

  const [isSaved, setIsSaved] = useState(false);

  const selectedTheme: SchoolTheme = SCHOOL_THEMES[selectedSchoolCode] || SCHOOL_THEMES.DEFAULT_GES;

  const handleSaveAndLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    soundSynthesizer.playClockInChime();

    // Save to localStorage
    localStorage.setItem('schoolCode', selectedSchoolCode);
    localStorage.setItem('ges_active_school_code_v1', selectedSchoolCode);
    localStorage.setItem('kiosk_device_id', deviceId);
    localStorage.setItem('kiosk_device_location', deviceLocation);

    setIsSaved(true);

    setTimeout(() => {
      navigate(`/kiosk?schoolCode=${selectedSchoolCode}`);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between select-none font-sans">
      {/* Kente border top */}
      <div
        className="w-full h-2.5"
        style={{
          background:
            'repeating-linear-gradient(90deg, #CE1126 0 16px, #FCD116 16px 32px, #006B3F 32px 48px, #1E293B 48px 64px)',
        }}
      />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-100 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <GesLogo />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              GHANA EDUCATION SERVICE
            </h1>
            <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase">
              Common Room Kiosk Hardware Setup
            </p>
          </div>

          <form onSubmit={handleSaveAndLaunch} className="space-y-4">
            {/* School Selector Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Select Institution / SHS
              </label>
              <select
                value={selectedSchoolCode}
                onChange={(e) => setSelectedSchoolCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition cursor-pointer"
              >
                {Object.values(SCHOOL_THEMES).map((theme) => (
                  <option key={theme.code} value={theme.code}>
                    {theme.name} ({theme.code}) — {theme.region}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 italic">
                Theme Colors: Primary{' '}
                <span
                  className="inline-block w-3 h-3 rounded-full align-middle border border-slate-400 mx-1"
                  style={{ backgroundColor: selectedTheme.primary }}
                />{' '}
                Secondary{' '}
                <span
                  className="inline-block w-3 h-3 rounded-full align-middle border border-slate-400 mx-1"
                  style={{ backgroundColor: selectedTheme.secondary }}
                />
              </p>
            </div>

            {/* Device ID Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Kiosk Terminal Device ID
              </label>
              <div className="relative">
                <Tv className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="e.g. KIOSK-TV-COMM-01"
                  className="w-full pl-9 pr-3 py-2.5 text-sm font-mono font-bold bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Location Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Mounting Location / Screen Tag
              </label>
              <input
                type="text"
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                placeholder="e.g. Staff Common Room TV Screen #1"
                className="w-full px-3.5 py-2 text-sm font-medium bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            {/* Hardware Geofence Verification Pill */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-semibold">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Campus cryptographic beacon generator configured with 20s token rotation.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaved}
              style={{ backgroundColor: selectedTheme.primary }}
              className="w-full py-3.5 px-4 text-white font-black text-sm rounded-xl shadow-lg hover:opacity-95 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer duration-200"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Launching Terminal...</span>
                </>
              ) : (
                <>
                  <span>Save &amp; Launch Kiosk TV</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono">
              Ghana Data Protection Act 843 • Terminal ID: {deviceId}
            </span>
          </div>
        </div>
      </main>

      {/* Kente border bottom */}
      <div
        className="w-full h-2.5"
        style={{
          background:
            'repeating-linear-gradient(90deg, #CE1126 0 16px, #FCD116 16px 32px, #006B3F 32px 48px, #1E293B 48px 64px)',
        }}
      />
    </div>
  );
}
