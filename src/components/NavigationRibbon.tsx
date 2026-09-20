import React, { useState, useEffect } from 'react';
import {
  Clock,
  School,
  Users,
  BarChart3,
  QrCode,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Wifi,
  WifiOff,
  Sparkles,
  Radio,
  Lock,
  Link2,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';
import { AppMode, DeviceOperatingMode } from '../types';
import { soundSynthesizer } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';
import { PortalType } from '../utils/routes';

interface NavigationRibbonProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onCampusStaffCount: number;
  totalStaffCount: number;
  activeClassroomsCount: number;
  onClickOnCampus?: () => void;
  onClickInSession?: () => void;
  onOpenBeaconRadar?: () => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  deviceMode?: DeviceOperatingMode;
  onToggleDeviceMode?: (mode: DeviceOperatingMode) => void;
  schoolName?: string;
  schoolCode?: string;
  isStaffOnlyView?: boolean;
  activePortal?: PortalType;
  onNavigateToPortal?: (portal: PortalType, subType?: 'teaching' | 'non_teaching') => void;
  onToggleStaffOnlyView?: () => void;
}

export const NavigationRibbon: React.FC<NavigationRibbonProps> = ({
  currentMode,
  onSelectMode,
  onCampusStaffCount,
  totalStaffCount,
  activeClassroomsCount,
  onClickOnCampus,
  onClickInSession,
  onOpenBeaconRadar,
  onOpenScanner,
  onOpenSettings,
  onOpenHelp,
  isOnline,
  pendingSyncCount,
  deviceMode = 'kiosk',
  onToggleDeviceMode,
  schoolName = 'Mawuli Senior High School',
  schoolCode = 'ges-vr-mhs-01',
  isStaffOnlyView = false,
  activePortal = 'attendance',
  onNavigateToPortal,
  onToggleStaffOnlyView,
}) => {
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const [isMuted, setIsMuted] = useState(soundSynthesizer.getIsMuted());

  // Live ticking clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundSynthesizer.setMuted(next);
    if (!next) {
      soundSynthesizer.playScanBeep();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg select-none">
      {/* Upper Brand & Live Status Row */}
      <div className="px-3 sm:px-4 py-2 flex items-center justify-between border-b border-slate-800/40 gap-2">
        {/* Institutional Identity & Sir Eugene Technologies Branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xs shrink-0">
            <School className="w-4 h-4 text-slate-950" />
          </div>
          <div className="min-w-0">
            {/* Bold Institution Name prominently at the top */}
            <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-wide truncate flex items-center gap-1.5 uppercase">
              <span className="truncate">{schoolName}</span>
              {schoolCode && (
                <span className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300 font-bold lowercase tracking-normal">
                  {schoolCode}
                </span>
              )}
            </h1>
            {/* Sir Eugene Technologies right below the institution name */}
            <p className="text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate flex items-center gap-1.5">
              <span>GES Smart Attendance Studio</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Sir Eugene Technologies
              </span>
            </p>
          </div>
        </div>

        {/* Live Status Indicators & Actions */}
        <div className="flex items-center gap-2">
          {/* Online/Offline Status Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
              isOnline
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-300'
            }`}
            title={isOnline ? 'Online - Cloud Sync Live' : 'Offline - 100% Cache Mode Active'}
          >
            {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
            {pendingSyncCount > 0 && (
              <span className="px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px]">
                {pendingSyncCount}
              </span>
            )}
          </div>

          {/* Dual-Operating Device Mode Toggle (Kiosk vs BYOD) */}
          {onToggleDeviceMode && (
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onToggleDeviceMode('kiosk')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                  deviceMode === 'kiosk'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Shared Kiosk Terminal Mode (Staff-room mounted tablet)"
              >
                <span>🖥️</span>
                <span className="hidden sm:inline">Kiosk</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleDeviceMode('byod')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold transition ${
                  deviceMode === 'byod'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="BYOD Personal Phone Mode (Individual teacher device)"
              >
                <span>📱</span>
                <span className="hidden sm:inline">BYOD</span>
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isMuted ? 'Unmute Synthesizer' : 'Mute Synthesizer'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Door QR Scanner Shortcut */}
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-semibold transition"
            title="Scan Classroom Door QR"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">QR Door Scan</span>
          </button>

          {/* PWA Install */}
          <PWAInstallButton />

          {/* Super Admin Settings - Only shown in full admin view */}
          {!isStaffOnlyView && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Admin Settings (PIN: 1234)"
              aria-label="Admin Settings"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
            </button>
          )}

          {/* If in Staff Only View, provide a clean link to switch to Admin */}
          {isStaffOnlyView ? (
            <button
              type="button"
              onClick={() => {
                if (onNavigateToPortal) onNavigateToPortal('admin');
                else onSelectMode('admin_reports');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 text-xs font-semibold transition"
              title="Switch to Admin Portal & Reports (Requires Admin PIN)"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          ) : (
            onToggleStaffOnlyView && (
              <button
                type="button"
                onClick={onToggleStaffOnlyView}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold transition"
                title="Switch to Staff-Only Distraction-Free Portal"
              >
                <EyeOff className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Staff View</span>
              </button>
            )
          )}

          {/* Help Guide */}
          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="GES Attendance Protocol Guide"
            aria-label="Help Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lower Sticky Ribbon with Live Badges & Mode Switchers (Scrollable on narrow mobile screens) */}
      <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
        {/* Live Badges & Quick Filters */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          {/* Clock Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 font-mono text-[11px]">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold text-white">{timeString || '08:00:00'}</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">{dateString}</span>
          </div>

          {/* Show On-Campus badge if not restricted or if staff wants to verify their presence */}
          <button
            type="button"
            onClick={() => {
              if (onClickOnCampus) onClickOnCampus();
              else onSelectMode('master_roster');
              soundSynthesizer.playScanBeep();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-slate-300 text-[11px] font-medium transition cursor-pointer active:scale-95 group shadow-xs"
            title="Campus Attendance Status"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse group-hover:scale-125 transition" />
            <span className="text-slate-400 font-normal">Campus Presence:</span>
            <strong className="text-emerald-400 font-bold">
              {onCampusStaffCount} / {totalStaffCount}
            </strong>
          </button>

          {!isStaffOnlyView && (
            <button
              type="button"
              onClick={() => {
                if (onClickInSession) onClickInSession();
                else onSelectMode('period_tracker');
                soundSynthesizer.playScanBeep();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/40 hover:border-indigo-400 text-slate-300 text-[11px] font-medium transition cursor-pointer active:scale-95 group shadow-xs"
              title="Click to open Period Tracker filtered by active in-session classrooms"
            >
              <span className="text-xs group-hover:scale-110 transition">🏫</span>
              <span className="text-slate-400 font-normal">In Session:</span>
              <strong className="text-indigo-400 font-bold">{activeClassroomsCount} Classes</strong>
            </button>
          )}

          {/* Staff Common Room Beacon Radar Quick Button */}
          {onOpenBeaconRadar && (
            <button
              type="button"
              onClick={() => {
                onOpenBeaconRadar();
                soundSynthesizer.playScanBeep();
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-medium transition cursor-pointer active:scale-95"
              title="Staff Common Room Proximity Radar (BLE & Optical Beacon Verification)"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Common Room:</span>
              <strong className="text-emerald-400 font-bold">Verified Zone</strong>
            </button>
          )}
        </div>

        {/* Dynamic Mode Switcher Buttons based on Route / Role */}
        <nav className="flex items-center gap-1.5 flex-shrink-0">
          {isStaffOnlyView ? (
            /* Staff Only Clean Navigation: Only shows relevant attendance & class links */
            <>
              <button
                type="button"
                onClick={() => {
                  onSelectMode('gate_clock');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'gate_clock'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>👨‍🏫</span>
                <span>Teaching Staff Clock</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectMode('non_teaching');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'non_teaching'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>👷</span>
                <span>Non-Teaching Staff</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onNavigateToPortal) onNavigateToPortal('period_class_tracker');
                  else onSelectMode('period_tracker');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'period_tracker'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                <span>🏫</span>
                <span>Period Tracker</span>
              </button>
            </>
          ) : (
            /* Full Admin Navigation: Shows All Tabs */
            <>
              <button
                onClick={() => {
                  onSelectMode('gate_clock');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'gate_clock'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>⏱️</span>
                <span>Staff Gate Clock</span>
              </button>

              <button
                onClick={() => {
                  onSelectMode('period_tracker');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'period_tracker'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>🏫</span>
                <span>Period &amp; Class Tracker</span>
              </button>

              <button
                onClick={() => {
                  onSelectMode('master_roster');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'master_roster'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Master Staff Roster</span>
              </button>

              <button
                onClick={() => {
                  onSelectMode('non_teaching');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'non_teaching'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <span>🧹</span>
                <span>Non-Teaching Staff</span>
              </button>

              <button
                onClick={() => {
                  onSelectMode('admin_reports');
                  soundSynthesizer.playScanBeep();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  currentMode === 'admin_reports'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Admin &amp; GES Reports</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
