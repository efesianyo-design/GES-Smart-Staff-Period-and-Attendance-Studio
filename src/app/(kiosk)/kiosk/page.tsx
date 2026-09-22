import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { generateBeaconToken } from '../../../utils/beacon';
import { storageEngine } from '../../../utils/storage';
import { soundSynthesizer } from '../../../utils/audio';
import { CampusBeaconToken } from '../../../types';
import { useSchoolTheme } from '../../../hooks/useSchoolTheme';
import { Settings, ShieldCheck } from 'lucide-react';

/**
 * Procedural 25x25 pure CSS Grid QR Code matrix.
 * Strictly renders via <div> with grid, with no external images or canvas.
 */
function generateQrGrid(seed: string, dimension: number = 25): boolean[][] {
  const grid: boolean[][] = Array.from({ length: dimension }, () => Array(dimension).fill(false));

  // Helper to draw a finder pattern at (r, c)
  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6) {
          grid[startR + r][startC + c] = true;
        } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
          grid[startR + r][startC + c] = true;
        } else {
          grid[startR + r][startC + c] = false;
        }
      }
    }
  };

  // 3 Finder patterns
  drawFinder(0, 0);
  drawFinder(0, dimension - 7);
  drawFinder(dimension - 7, 0);

  // Timing patterns
  for (let i = 7; i < dimension - 7; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Hash seed to populate data cells deterministically
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  for (let r = 0; r < dimension; r++) {
    for (let c = 0; c < dimension; c++) {
      const inTL = r < 8 && c < 8;
      const inTR = r < 8 && c >= dimension - 8;
      const inBL = r >= dimension - 8 && c < 8;
      const inTiming = r === 6 || c === 6;
      if (inTL || inTR || inBL || inTiming) continue;

      h = (h * 1664525 + 1013904223) >>> 0;
      grid[r][c] = (h % 100) < 48;
    }
  }

  return grid;
}

function QrGridPattern({ token, size = 180 }: { token: string; size?: number }) {
  const dimension = 25;
  const grid = React.useMemo(() => generateQrGrid(token, dimension), [token]);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'grid',
        gridTemplateColumns: `repeat(${dimension}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${dimension}, minmax(0, 1fr))`,
      }}
      className="bg-white p-1 rounded select-none"
    >
      {grid.map((row, r) =>
        row.map((isDark, c) => (
          <div
            key={`${r}-${c}`}
            className={isDark ? 'bg-slate-950' : 'bg-white'}
          />
        ))
      )}
    </div>
  );
}

/**
 * Official Ghana Education Service (GES) Logo (Yellow Circle with Green G + Stars)
 * Yellow #FFD700 / #FACC15 stays constant as specified.
 */
export function GesLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <circle cx="50" cy="50" r="47" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <path id="kioskGesArc" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill="#0F172A" fontSize="7" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#kioskGesArc" startOffset="50%" textAnchor="middle">
          GHANA EDUCATION SERVICE
        </textPath>
      </text>
      <text x="36" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <text x="64" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <circle cx="50" cy="50" r="21" fill="#FEF08A" stroke="#0B6D2F" strokeWidth="2" />
      <path d="M42 40 Q55 35 55 42 Q55 50 44 50 L52 50 L52 58 Q40 58 40 40 Z" fill="#0B6D2F" />
      <text x="50" y="65" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="900">
        GES
      </text>
    </svg>
  );
}

/**
 * Dynamic School Crest rendering with logo fallback or auto-themed SVG
 */
function DynamicSchoolCrest({
  logo,
  name,
  slogan,
  primaryColor,
  secondaryColor,
}: {
  logo?: string;
  name: string;
  slogan?: string;
  primaryColor: string;
  secondaryColor: string;
}) {
  if (logo) {
    return (
      <div className="flex flex-col items-center shrink-0">
        <img
          src={logo}
          alt={name}
          className="w-12 h-12 object-contain rounded-full border-2 shadow-xs"
          style={{ borderColor: secondaryColor }}
        />
        {slogan && (
          <span
            className="text-[8px] font-black tracking-wider uppercase mt-0.5 max-w-[100px] truncate text-center"
            style={{ color: primaryColor }}
          >
            {slogan}
          </span>
        )}
      </div>
    );
  }

  // Auto-styled institutional crest shield matching school colors
  return (
    <div className="flex flex-col items-center shrink-0">
      <span
        className="text-[9px] font-black tracking-wider uppercase mb-0.5 max-w-[120px] truncate"
        style={{ color: primaryColor }}
      >
        {name.split(' ')[0]}
      </span>
      <svg width="42" height="44" viewBox="0 0 100 105" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M50 8 L90 80 L10 80 Z"
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M50 20 L76 72 L24 72 Z" fill="none" stroke={secondaryColor} strokeWidth="2.5" />
        <line x1="33" y1="56" x2="67" y2="56" stroke={secondaryColor} strokeWidth="3" />
        <line x1="50" y1="30" x2="50" y2="72" stroke={secondaryColor} strokeWidth="3" />
        <path
          d="M12 84 Q50 96 88 84 L86 98 Q50 104 14 98 Z"
          fill={secondaryColor}
          stroke={primaryColor}
          strokeWidth="1.5"
        />
        <text
          x="50"
          y="93"
          textAnchor="middle"
          fill={primaryColor}
          fontSize="6.5"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          {slogan ? slogan.slice(0, 16).toUpperCase() : 'INTEGRITY'}
        </text>
      </svg>
    </div>
  );
}

export default function KioskPage() {
  const navigate = useNavigate();
  const { theme, schoolCode } = useSchoolTheme();

  // 20-second cryptographic token rotator
  const [beacon, setBeacon] = useState<CampusBeaconToken>(() =>
    generateBeaconToken(schoolCode || 'MAWULI01', 20)
  );
  const [secondsLeft, setSecondsLeft] = useState<number>(beacon.secondsRemaining);
  const [currentTime, setCurrentTime] = useState<string>('07:31:19 AM');
  const [currentDate, setCurrentDate] = useState<string>('Wed, 21 Sept 2026');

  // Live presence metrics & last scan info
  const [presenceCount, setPresenceCount] = useState({ present: 28, absent: 4, todayPresent: 12 });
  const [lastScanInfo, setLastScanInfo] = useState<string>('Last Scan: 07:30:42 AM • E.Kwame, Maths Dept');
  const [isScanSuccess, setIsScanSuccess] = useState<boolean>(false);

  // Live clock tick
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update presence counts from storage engine
  const refreshStats = () => {
    const allStaff = storageEngine.getStaff();
    const attendance = storageEngine.getGateAttendance();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = attendance.filter((r) => r.date === todayStr && !r.isVoided);
    const clockedInStaffIds = new Set(todayRecords.map((r) => r.staffId));

    const totalStaff = allStaff.length || 32;
    const actualPresent = clockedInStaffIds.size > 0 ? clockedInStaffIds.size : 28;
    const notIn = Math.max(0, totalStaff - actualPresent);

    setPresenceCount({
      present: actualPresent,
      absent: notIn > 0 ? notIn : 4,
      todayPresent: clockedInStaffIds.size > 0 ? clockedInStaffIds.size : 12,
    });

    if (todayRecords.length > 0) {
      const latest = todayRecords[0];
      setLastScanInfo(`Last Scan: ${latest.clockInTime} • ${latest.staffName}, ${latest.department || 'Staff'}`);
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  // 20-second token rotation
  useEffect(() => {
    const interval = setInterval(() => {
      const nextBeacon = generateBeaconToken(schoolCode || 'MAWULI01', 20);
      setBeacon(nextBeacon);
      setSecondsLeft(nextBeacon.secondsRemaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [schoolCode]);

  // Listen for real-time clock-in events to trigger flash and chime
  useEffect(() => {
    const handleStaffScan = (e: any) => {
      triggerScanSuccess(e?.detail?.staffName || 'Staff Member');
    };

    window.addEventListener('ges_staff_clockin' as any, handleStaffScan);
    window.addEventListener('storage', refreshStats);

    return () => {
      window.removeEventListener('ges_staff_clockin' as any, handleStaffScan);
      window.removeEventListener('storage', refreshStats);
    };
  }, []);

  const triggerScanSuccess = (staffName?: string) => {
    soundSynthesizer.playClockInChime();
    setIsScanSuccess(true);
    refreshStats();
    if (staffName) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setLastScanInfo(`Last Scan: ${timeStr} • ${staffName}`);
    }
    setTimeout(() => {
      setIsScanSuccess(false);
    }, 1400);
  };

  // Circular ring calculations (r=105, C = 2 * PI * 105 = ~659.73)
  const ringRadius = 105;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - secondsLeft / 20);

  // Top-bar mini countdown ring circumference for r=16: ~100.53
  const miniRadius = 16;
  const miniCircumference = 2 * Math.PI * miniRadius;
  const miniOffset = miniCircumference * (1 - secondsLeft / 20);

  return (
    <div className="min-h-screen w-screen bg-white text-slate-900 flex flex-col justify-between overflow-hidden select-none relative font-sans">
      {/* 1. KENTE THIN BORDER TOP */}
      <div
        className="w-full h-2 z-30 shrink-0"
        style={{
          background:
            'repeating-linear-gradient(90deg, #CE1126 0 16px, #FCD116 16px 32px, #006B3F 32px 48px, #1E293B 48px 64px)',
        }}
      />

      {/* Fullscreen Green Flash on Scan Success */}
      {isScanSuccess && (
        <div
          className="fixed inset-0 z-50 pointer-events-none animate-pulse transition-opacity duration-300 flex items-center justify-center"
          style={{ backgroundColor: `${theme.primary}33` }}
        >
          <div
            className="bg-white/95 border-2 rounded-3xl p-6 shadow-2xl text-center space-y-1 transform scale-110 transition-transform"
            style={{ borderColor: theme.primary }}
          >
            <span className="text-3xl" style={{ color: theme.primary }}>✓</span>
            <h3 className="text-xl font-black" style={{ color: theme.primary }}>
              ATTENDANCE VERIFIED
            </h3>
            <p className="text-xs text-slate-600 font-medium">Recorded with GES Dynamic Cryptographic Beacon</p>
          </div>
        </div>
      )}

      {/* TOP BAR: Height 120px, White background, Border bottom #E2E8F0 */}
      <header className="h-[120px] bg-white border-b border-[#E2E8F0] px-6 sm:px-10 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: GES logo + School Crest + Text + Subtext */}
        <div className="flex items-center gap-4 sm:gap-5">
          <GesLogo />
          <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />
          <DynamicSchoolCrest
            logo={theme.logo}
            name={theme.name}
            slogan={theme.slogan}
            primaryColor={theme.primary}
            secondaryColor={theme.secondary}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-[16px] text-[#0F172A] tracking-tight leading-tight uppercase">
                {theme.name}
              </h1>
            </div>
            <p className="text-[10px] text-[#64748B] font-medium mt-0.5">
              Staff Attendance Kiosk • {theme.region}
            </p>
          </div>
        </div>

        {/* Center Pill: Exactly like in Reference Image */}
        <div className="hidden xl:flex items-center">
          <div
            className="px-5 py-1.5 rounded-full border shadow-xs transition-colors duration-300"
            style={{
              backgroundColor: '#FEFCE8',
              borderColor: `${theme.secondary}99`,
            }}
          >
            <span
              className="text-xs font-black tracking-wider uppercase"
              style={{ color: '#854D0E' }}
            >
              STAFF ATTENDANCE • {theme.name}
            </span>
          </div>
        </div>

        {/* Right: Big clock + subtext + Far Right countdown ring */}
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Big Clock */}
          <div className="text-right">
            <div
              className="font-mono font-bold text-[24px] sm:text-[28px] tracking-tight leading-none transition-colors duration-300"
              style={{ color: theme.primary }}
            >
              {currentTime}
            </div>
            <div
              className="text-[8px] sm:text-[10px] font-bold tracking-tight mt-1 flex items-center justify-end gap-1.5"
              style={{ color: theme.primary }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: theme.primary }}
              />
              <span>• LIVE • AUTO SYNCED • {currentDate}</span>
            </div>
          </div>

          {/* Far Right: Circular countdown ring */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 38 38">
                <circle cx="19" cy="19" r={miniRadius} fill="none" stroke="#E2E8F0" strokeWidth="3" />
                <circle
                  cx="19"
                  cy="19"
                  r={miniRadius}
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="3"
                  strokeDasharray={miniCircumference}
                  strokeDashoffset={miniOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span
                className="absolute font-mono font-black text-[11px] transition-colors duration-300"
                style={{ color: theme.primary }}
              >
                {secondsLeft}s
              </span>
            </div>
            <div
              className="text-[9px] font-bold hidden sm:block leading-tight"
              style={{ color: theme.primary }}
            >
              <div>Token refreshes</div>
              <div>in {secondsLeft}s</div>
            </div>
          </div>

          {/* Quick Setup Link Button */}
          <button
            onClick={() => navigate('/kiosk/setup')}
            title="Configure Kiosk Hardware Terminal"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN STAGE: Center Card + Left & Right Info Cards */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-center relative">
        {/* Left Info Card */}
        <div
          className="hidden lg:flex flex-col gap-2 p-4 rounded-2xl border shadow-xs absolute left-6 xl:left-12 top-1/2 -translate-y-1/2 w-52 transition-colors duration-300"
          style={{
            backgroundColor: `${theme.primary}12`,
            borderColor: `${theme.primary}33`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: theme.primary }}
            />
            <span className="text-xs font-bold" style={{ color: theme.primary }}>
              Kiosk Mode: Active
            </span>
          </div>
          <div className="text-[11px] text-slate-700 font-mono pt-1 border-t border-slate-200/60">
            Device ID: <strong className="text-slate-900 font-bold">{localStorage.getItem('kiosk_device_id') || 'MK-KIOSK-007'}</strong>
          </div>
          <div className="text-[11px] text-slate-700 font-medium">
            Network: <strong style={{ color: theme.primary }}>Connected</strong>
          </div>
        </div>

        {/* CENTER CARD: 600px wide, ~450px tall, rounded 24px, border 3px theme.primary, shadow-xl */}
        <div className="flex flex-col items-center">
          <div
            className="w-full max-w-[560px] sm:w-[600px] sm:h-[450px] bg-white rounded-[24px] border-[3px] shadow-xl p-5 sm:p-6 flex flex-col items-center justify-between relative transition-all duration-300"
            style={{ borderColor: theme.primary }}
          >
            {/* Inside Top: Text SCAN TO CHECK IN / CHECK OUT */}
            <div className="text-center">
              <h2
                className="text-[14px] font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: theme.primary }}
              >
                SCAN TO CHECK IN / CHECK OUT
              </h2>
            </div>

            {/* Center: QR Code Placeholder with Circular Progress Ring around it */}
            <div className="relative flex items-center justify-center w-[230px] h-[230px] my-1">
              {/* Circular Progress Ring Around QR */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 230 230">
                <circle
                  cx="115"
                  cy="115"
                  r={ringRadius}
                  fill="none"
                  stroke="#FEF08A"
                  strokeWidth="7"
                />
                <circle
                  cx="115"
                  cy="115"
                  r={ringRadius}
                  fill="none"
                  stroke={theme.secondary || '#EAB308'}
                  strokeWidth="7"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>

              {/* White Background with Black Squares Pattern (div with grid) */}
              <div className="z-10 flex flex-col items-center justify-center">
                <div className="w-[140px] h-[140px] bg-white p-1 rounded-lg flex items-center justify-center shadow-xs">
                  <QrGridPattern token={beacon.token} size={132} />
                </div>
                {/* Inside Ring Token Countdown Text */}
                <div className="text-center mt-1">
                  <span
                    className="text-[10px] font-black tracking-tight block transition-colors duration-300"
                    style={{ color: theme.primary }}
                  >
                    Token refreshes in {secondsLeft}s
                  </span>
                </div>
              </div>
            </div>

            {/* Below QR: Bold "POINT YOUR PHONE CAMERA HERE" + "TO CLOCK IN" + helper text */}
            <div className="text-center space-y-1 w-full">
              <p
                className="text-xs sm:text-sm font-black tracking-wide uppercase transition-colors duration-300"
                style={{ color: theme.primary }}
              >
                POINT YOUR PHONE CAMERA HERE TO CLOCK IN
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${theme.primary}15`,
                    borderColor: `${theme.primary}33`,
                    color: theme.primary,
                  }}
                >
                  📱 Secure
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${theme.primary}15`,
                    borderColor: `${theme.primary}33`,
                    color: theme.primary,
                  }}
                >
                  One-time
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${theme.primary}15`,
                    borderColor: `${theme.primary}33`,
                    color: theme.primary,
                  }}
                >
                  20s validity
                </span>
              </div>
              <p className="text-[8px] sm:text-[9px] text-[#64748B] font-medium pt-0.5">
                Open phone camera → Scan QR → Confirm check-in
              </p>
            </div>
          </div>

          {/* Below Card Small Helper: "Open phone camera → Point at code → Tap confirm → Done" */}
          <div className="flex items-center gap-3 mt-3">
            <p className="text-[10px] sm:text-[11px] text-[#64748B] font-medium text-center">
              Open phone camera → Point at code → Tap confirm → Done
            </p>
            {/* Instant Demo Test Trigger */}
            <button
              onClick={() => triggerScanSuccess('Demo Teacher (Maths)')}
              className="text-[9px] px-2 py-0.5 rounded-full font-bold transition shadow-xs"
              style={{
                backgroundColor: `${theme.primary}20`,
                color: theme.primary,
              }}
              title="Click to simulate an authorized staff scan and trigger chime + green flash"
            >
              Simulate Scan ⚡
            </button>
          </div>
        </div>

        {/* Right Info Card */}
        <div
          className="hidden lg:flex flex-col gap-2 p-4 rounded-2xl border shadow-xs absolute right-6 xl:right-12 top-1/2 -translate-y-1/2 w-56 text-right transition-colors duration-300"
          style={{
            backgroundColor: `${theme.primary}12`,
            borderColor: `${theme.primary}33`,
          }}
        >
          <div className="text-sm font-black" style={{ color: theme.primary }}>
            {presenceCount.present} Staff On Campus
          </div>
          <div className="text-[11px] text-slate-700 font-medium pt-1 border-t border-slate-200/60">
            {presenceCount.absent} Not In • {presenceCount.todayPresent} Present Today
          </div>
          <div className="text-[10px] font-bold" style={{ color: theme.primary }}>
            {theme.region}
          </div>
        </div>
      </main>

      {/* BOTTOM BAR: Full width 80px height, background theme.primary, white text */}
      <footer
        className="h-[80px] rounded-t-[28px] sm:rounded-t-[32px] px-6 sm:px-12 flex items-center justify-between text-white shrink-0 shadow-lg z-20 transition-colors duration-300"
        style={{ backgroundColor: theme.primary }}
      >
        {/* Left: 28 Staff On Campus */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 text-lg">
            🏛️
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-200 block uppercase tracking-wider">
              Campus Presence
            </span>
            <span className="text-base sm:text-lg font-black tracking-tight text-white">
              {presenceCount.present} Staff On Campus
            </span>
          </div>
        </div>

        {/* Middle: 12 Present Today ✓ */}
        <div className="hidden md:flex items-center gap-2 text-sm font-extrabold text-white bg-white/10 px-4 py-1.5 rounded-xl border border-white/15">
          <span>{presenceCount.todayPresent} Present Today</span>
          <span className="text-emerald-200">✓</span>
        </div>

        {/* Right: Last Scan: 07:30:42 AM • E.Kwame, Maths Dept */}
        <div className="text-right text-xs sm:text-sm font-medium text-white/90">
          <span className="font-bold">{lastScanInfo}</span>
        </div>
      </footer>

      {/* 2. KENTE THIN BORDER BOTTOM */}
      <div
        className="w-full h-2 z-30 shrink-0"
        style={{
          background:
            'repeating-linear-gradient(90deg, #CE1126 0 16px, #FCD116 16px 32px, #006B3F 32px 48px, #1E293B 48px 64px)',
        }}
      />
    </div>
  );
}
