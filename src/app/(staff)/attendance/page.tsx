import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import NonTeachingAttendancePage from './non-teaching/page';
import { storageEngine } from '../../../utils/storage';
import { StaffMember, GateAttendanceRecord, SchoolConfig } from '../../../types';
import { soundSynthesizer } from '../../../utils/audio';
import { securityEngine } from '../../../utils/security';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { getDeviceSignature, calibrateCampusGateGps } from '../../../utils/geo';
import { verifyBeaconToken } from '../../../utils/beacon';
import { FirebasePhoneAuthBox } from '../../../components/FirebasePhoneAuthBox';
import { LiveBeaconScanner } from '../../../components/LiveBeaconScanner';
import { useSchoolTheme } from '../../../hooks/useSchoolTheme';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  ShieldCheck,
  Delete,
  Scan,
  MessageCircle,
  RotateCw,
  ArrowLeft,
  MapPin,
  X,
  KeyRound,
  IdCard,
} from 'lucide-react';

/**
 * Official Ghana Education Service (GES) Logo SVG
 */
function GesRoundLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <circle cx="50" cy="50" r="47" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <path id="gesArcMobile" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill="#0F172A" fontSize="7" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#gesArcMobile" startOffset="50%" textAnchor="middle">
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

export default function StaffAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const staffType = searchParams.get('type');

  if (staffType === 'non_teaching') {
    return <NonTeachingAttendancePage />;
  }

  const { theme, schoolCode } = useSchoolTheme();
  const [config] = useState<SchoolConfig>(() => storageEngine.getSchoolConfig());

  // Geolocation state (resolves active school coordinates & supports campus calibration)
  const { lat, lng, isWithinBounds, distanceMeters, calibrateToCurrentPosition } = useGeolocation(
    config,
    schoolCode || config.schoolCode
  );
  const isWithinGeofence = isWithinBounds;
  const coords = lat && lng ? { latitude: lat, longitude: lng } : null;

  // Step 1: Staff ID Input State (No names pool or dropdown - must be entered manually)
  const [staffIdInput, setStaffIdInput] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Clear any legacy cached staff IDs to ensure manual entry
  useEffect(() => {
    try {
      localStorage.removeItem('ges_last_staff_id');
      localStorage.removeItem('ges_last_non_teaching_staff_id');
    } catch {
      // ignore
    }
  }, []);

  // 3-Step Verification Sequence:
  // Step 1: 'staff_id_entry' -> Step 2: 'otp_verification' -> Step 3: 'scan_verification' -> 'success'
  const [authStep, setAuthStep] = useState<
    'staff_id_entry' | 'otp_verification' | 'scan_verification' | 'success'
  >('staff_id_entry');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [devOtpReceived, setDevOtpReceived] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState<string>('+233240000000');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Today's attendance record
  const [todayRecord, setTodayRecord] = useState<GateAttendanceRecord | null>(null);

  // Check today's record when staff is selected
  useEffect(() => {
    if (!selectedStaff) {
      setTodayRecord(null);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const records = storageEngine.getGateAttendance();
    const existing = records.find(
      (r) => r.staffId === selectedStaff.staffId && r.date === todayStr && !r.isVoided
    );
    setTodayRecord(existing || null);
  }, [selectedStaff?.staffId]);

  // Handle on-screen keypad clicks for Staff ID
  const handleKeypadClick = (val: string) => {
    soundSynthesizer.playKeypadBeep();
    if (val === 'back') {
      setStaffIdInput((prev) => prev.slice(0, -1));
      return;
    }
    if (val === 'clear') {
      setStaffIdInput('');
      return;
    }
    setStaffIdInput((prev) => prev + val);
  };

  // Step 1 Verification: Lookup unique Staff ID and dispatch 2FA SMS
  const handleVerifyStaffId = (overrideId?: string) => {
    const rawId = (overrideId || staffIdInput).trim();
    if (!rawId) {
      soundSynthesizer.playWarningBeep();
      setFeedback({ type: 'error', text: 'Please enter your unique Staff ID.' });
      return;
    }

    const allStaff = storageEngine.getStaff();
    const matched = allStaff.find(
      (s) => s.staffId.toLowerCase().trim() === rawId.toLowerCase().trim()
    );

    if (!matched) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Staff ID '${rawId}' not found. Please verify your Staff ID or contact School Administration.`,
      });
      return;
    }

    // Check brute-force lockout
    const lockStatus = securityEngine.isLockedOut(matched.staffId);
    if (lockStatus.locked) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Account locked due to recent attempts. Try again in ${lockStatus.remainingSeconds}s.`,
      });
      return;
    }

    // Clear failed security counters on recognized staff ID
    securityEngine.clearFailedAttempts(matched.staffId);
    setSelectedStaff(matched);
    soundSynthesizer.playKeypadBeep();

    // Trigger 2FA OTP dispatch to their registered phone number
    initiateOtpFlow(matched);
  };

  // Dispatch OTP via Arkesel SMS gateway
  const initiateOtpFlow = async (
    staff: StaffMember,
    channel: 'sms' | 'whatsapp' = otpChannel
  ) => {
    setIsSendingOtp(true);
    setOtpChannel(channel);
    const targetPhone = staff.phone || '+233240000000';
    setOtpPhone(targetPhone);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staff.staffId,
          phone: targetPhone,
          schoolCode: schoolCode || config.schoolCode,
          staffName: staff.name,
          channel,
        }),
      });

      const data = await res.json();
      setIsSendingOtp(false);

      if (res.ok && data.success) {
        setDevOtpReceived(data.devOtp || '4821');
        setAuthStep('otp_verification');
        setFeedback({
          type: 'info',
          text:
            channel === 'whatsapp'
              ? `💬 2FA Code dispatched via WhatsApp to registered number.`
              : `📱 2FA OTP SMS dispatched to registered number. Please enter the 4-digit code.`,
        });
      } else {
        throw new Error(data.message || 'Failed to dispatch 2FA SMS');
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: err?.message || 'Network delay connecting to SMS gateway. You can request a 10-Min Headmaster Override PIN.',
      });
      // Advance to step 2 so user can input code or use Headmaster Override
      setAuthStep('otp_verification');
    }
  };

  // Step 3 Physical Scan: Requires genuine optical scan of campus beacon
  const handleBeaconScanned = (token: string) => {
    if (!selectedStaff) return;

    const verification = verifyBeaconToken(token, schoolCode || config.schoolCode);
    if (!verification.valid) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Beacon Scan Error: ${verification.message || 'Invalid QR code'}`,
      });
      return;
    }

    soundSynthesizer.playScanBeep();

    // Auto-anchor gate GPS to current position on valid beacon authentication
    if (coords) {
      calibrateCampusGateGps(
        verification.detectedSchoolCode || schoolCode || config.schoolCode,
        coords.latitude,
        coords.longitude,
        600
      );
    }

    // Finalize attendance check-in
    finalizeClockIn('qr_badge');
  };

  const finalizeClockIn = (method: 'qr_badge' | 'face_liveness') => {
    if (!selectedStaff) return;

    const clockDate = new Date();
    const timeStr = clockDate.toLocaleTimeString('en-GH');
    const dateStr = clockDate.toISOString().split('T')[0];
    const isLate = clockDate.getHours() > 8 || (clockDate.getHours() === 8 && clockDate.getMinutes() > 0);

    const newRecord: GateAttendanceRecord = {
      id: `gate_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      staffId: selectedStaff.staffId,
      staffName: selectedStaff.name,
      department: selectedStaff.department,
      date: dateStr,
      clockInTime: timeStr,
      clockInTimestamp: Date.now(),
      clockInCoords: {
        lat: coords ? coords.latitude : config.lat,
        lng: coords ? coords.longitude : config.lng,
        accuracy: 10,
        distanceMeters: distanceMeters || 0,
      },
      punctualityStatus: isLate ? 'late' : 'on_time',
      deviceSignature: getDeviceSignature(),
      synced: true,
      verificationMethod: 'otp_and_beacon',
      isOnCampus: isWithinGeofence,
      isIdentityVerified: true,
    };

    storageEngine.addGateRecord(newRecord);
    setTodayRecord(newRecord);
    soundSynthesizer.playClockInChime();

    window.dispatchEvent(
      new CustomEvent('ges_staff_clockin', {
        detail: { staffName: selectedStaff.name, time: timeStr },
      })
    );

    const confirmedText = `Check-in confirmed for ${selectedStaff.name}`;
    setConfirmationMessage(confirmedText);
    setFeedback({
      type: 'success',
      text: `✓ ${confirmedText} (${isLate ? 'LATE' : 'ON-TIME'} at ${timeStr})`,
    });
    setAuthStep('success');
  };

  const isOffCampus = coords && !isWithinGeofence;

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen py-3 sm:py-6 px-3 sm:px-0 flex flex-col justify-center font-sans select-none">
      {/* Centered Mobile Card: Rounded 30px, White, Border #E2E8F0 */}
      <div className="w-full bg-white rounded-[30px] border border-[#E2E8F0] shadow-xl overflow-hidden p-4 sm:p-5 space-y-3.5 relative">
        {/* INSTITUTIONAL PILL HEADER: GES logo + GES | School Name */}
        <div className="bg-white/90 border border-slate-100 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <GesRoundLogo />
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#0F172A] tracking-tight">GES</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-700 truncate max-w-[170px]">
                {theme.shortName || theme.name}
              </span>
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: `${theme.primary}15`,
              borderColor: `${theme.secondary}66`,
              color: theme.primary,
            }}
          >
            👤
          </div>
        </div>

        {/* SUB-HEADER: theme.primary */}
        <div
          className="h-[52px] rounded-[12px] px-3.5 flex items-center justify-between shadow-xs text-white transition-colors duration-300"
          style={{ backgroundColor: theme.primary }}
        >
          <div>
            <h1 className="text-[11px] font-bold text-white tracking-wide leading-tight uppercase">
              {theme.shortName || theme.name} • Staff Attendance
            </h1>
            <p className="text-[9px] text-emerald-100 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              <span>🟢 Gate Online • {theme.region}</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/attendance?type=non_teaching')}
            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 transition"
          >
            Auxiliary →
          </button>
        </div>

        {/* GEOFENCE CHECK: Campus presence & 1-tap UAT campus anchor */}
        {isOffCampus && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col gap-2 text-amber-900 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-700">
                <MapPin className="w-4 h-4 animate-bounce" />
              </div>
              <div className="text-[11px] leading-tight flex-1">
                <strong className="block text-amber-950 font-bold">
                  📍 Campus Location: Performing UAT with Beacon QR
                </strong>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Device GPS active. Tap below to anchor gate coordinates to your location (0m), or scan the Beacon QR code in Step 3.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
              <button
                type="button"
                onClick={() => {
                  const success = calibrateToCurrentPosition();
                  if (success) {
                    soundSynthesizer.playScanBeep();
                    setFeedback({
                      type: 'success',
                      text: `✓ Campus gate GPS calibrated to your exact location! Distance reset to 0m (Within Geofence).`,
                    });
                  } else {
                    setFeedback({
                      type: 'error',
                      text: 'Could not obtain device GPS coordinates. Please ensure Location is enabled in phone settings.',
                    });
                  }
                }}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>📍 Set Campus Gate to My Current Location (Reset to 0m)</span>
              </button>
            </div>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-semibold border leading-snug transition-all ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {/* STEP 1: STAFF ID ENTRY (NO NAMES POOL OR DROPDOWN) */}
        {authStep === 'staff_id_entry' && (
          <div className="space-y-3">
            {/* Step Progress Pill */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-300 ring-2 ring-indigo-200">
                <IdCard className="w-3 h-3" /> Step 1: Staff ID
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" /> Step 2: 2FA OTP
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" /> Step 3: Scan Beacon
              </span>
            </div>

            {/* Unique Staff ID Input Card */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h2
                  className="text-base font-extrabold tracking-tight"
                  style={{ color: theme.primary }}
                >
                  Enter Your GES Staff ID
                </h2>
                <p className="text-[11px] text-slate-500">
                  Enter your unique Staff ID to verify identity and dispatch your 2FA OTP code.
                </p>
              </div>

              {/* Staff ID Input Display */}
              <div className="relative">
                <input
                  type="text"
                  value={staffIdInput}
                  onChange={(e) => setStaffIdInput(e.target.value.trim())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerifyStaffId();
                  }}
                  placeholder="e.g. 1304201"
                  className="w-full text-center text-xl font-mono font-black text-slate-900 tracking-wider py-3 px-4 bg-white border-2 border-indigo-300 rounded-xl focus:border-indigo-600 focus:outline-none shadow-xs"
                  autoFocus
                />
                {staffIdInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStaffIdInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* On-Screen Touch Keypad for Fast Mobile Punch */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadClick(digit)}
                    className="h-11 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-base font-bold text-slate-800 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => handleKeypadClick('clear')}
                  className="h-11 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-500 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => handleKeypadClick('0')}
                  className="h-11 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-base font-bold text-slate-800 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={() => handleKeypadClick('back')}
                  className="h-11 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-slate-700 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>

              {/* VERIFY STAFF ID & SEND 2FA SMS BUTTON */}
              <button
                type="button"
                onClick={() => handleVerifyStaffId()}
                disabled={staffIdInput.trim().length === 0 || isSendingOtp}
                style={{
                  backgroundColor: staffIdInput.trim().length > 0 ? theme.primary : '#CBD5E1',
                }}
                className="w-full h-13 text-white font-black text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition active:scale-98 duration-150 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSendingOtp ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Verifying ID &amp; Dispatching SMS...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-yellow-300" />
                    <span>Verify Staff ID &amp; Send 2FA SMS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: 2FA OTP SCREEN (SMS or WhatsApp) */}
        {authStep === 'otp_verification' && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3.5 shadow-sm">
            {/* Step Progress Pill */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Step 1: Staff ID
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 ring-2 ring-indigo-200">
                <ShieldCheck className="w-3 h-3" /> Step 2: 2FA OTP
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" /> Step 3: Scan Beacon
              </span>
            </div>

            {/* Verified Staff ID Banner (Masked phone for privacy) */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Verified Staff ID</span>
                <span className="font-mono font-black text-slate-900">{selectedStaff?.staffId}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">Registered Phone</span>
                <span className="font-mono font-bold text-indigo-700">
                  {selectedStaff?.phone
                    ? `${selectedStaff.phone.slice(0, 7)}••••${selectedStaff.phone.slice(-2)}`
                    : 'Registered Number'}
                </span>
              </div>
            </div>

            <div className="py-1 space-y-3">
              <FirebasePhoneAuthBox
                staffPhone={otpPhone || '+233245550192'}
                staffName={selectedStaff?.name || 'Staff Member'}
                staffId={selectedStaff?.staffId || '1304201'}
                schoolCode={schoolCode || config.schoolCode}
                initialStep="otp"
                devOtp={devOtpReceived || undefined}
                onVerified={() => {
                  soundSynthesizer.playSuccessChime();
                  setAuthStep('scan_verification');
                }}
              />

              {/* Instant WhatsApp fallback prompt if on SMS */}
              {otpChannel === 'sms' && (
                <div className="text-center pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => selectedStaff && initiateOtpFlow(selectedStaff, 'whatsapp')}
                    className="text-[11px] font-bold text-[#128C7E] hover:underline inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>SMS delayed? Tap to receive OTP via WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Back to Step 1 */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('staff_id_entry');
                    setFeedback(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Change Staff ID</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PHYSICAL CAMPUS BEACON SCAN (INTEGRATED LIVE CAMERA) */}
        {authStep === 'scan_verification' && (
          <div className="bg-white border-2 border-indigo-400/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md animate-scale">
            {/* Step Progress Pill */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Step 1: Staff ID
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Step 2: OTP
              </span>
              <span>→</span>
              <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-300 ring-2 ring-indigo-200">
                <Camera className="w-3 h-3" /> Step 3: Scan Beacon
              </span>
            </div>

            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 shadow-inner mb-1">
                <Scan className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Step 3: Point Camera at Campus Beacon QR
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Aim your camera at the physical <strong className="text-slate-800">Campus Beacon QR Code</strong> in front of you on campus to complete attendance.
              </p>
            </div>

            {/* LIVE OPTICAL CAMERA QR SCANNER */}
            <LiveBeaconScanner
              schoolCode={schoolCode || config.schoolCode}
              staffName={selectedStaff?.name}
              staffId={selectedStaff?.staffId}
              onBeaconVerified={handleBeaconScanned}
            />

            {/* Back to Step 2 */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setAuthStep('otp_verification')}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Step 2 (OTP Verification)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION CARD */}
        {authStep === 'success' && (
          <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-5 text-center space-y-3.5 shadow-md animate-scale">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">
                {confirmationMessage || `Check-in confirmed for ${selectedStaff?.name}`}
              </h2>
              <p className="text-xs text-slate-500">
                Staff ID: <strong className="font-mono text-slate-700">{selectedStaff?.staffId}</strong> •{' '}
                {selectedStaff?.department}
              </p>
            </div>

            {/* Verified Credentials Breakdown */}
            <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Step 1 Staff ID:</span>
                <span className="font-bold text-emerald-700">✓ Unique ID Verified</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Step 2 2FA OTP:</span>
                <span className="font-bold text-indigo-700">
                  ✓ {otpChannel === 'whatsapp' ? 'WhatsApp OTP Verified' : 'SMS OTP Verified'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Step 3 Beacon Scan:</span>
                <span className="font-bold text-emerald-700">✓ Physical Beacon Authenticated</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Official Timestamp:</span>
                <span className="font-mono font-bold text-slate-900">
                  {todayRecord?.clockInTime || 'Recorded Just Now'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAuthStep('staff_id_entry');
                setStaffIdInput('');
                setSelectedStaff(null);
                setTodayRecord(null);
                setFeedback(null);
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
            >
              Clock In Another Staff Member
            </button>
          </div>
        )}

        {/* TODAY'S PREVIOUS RECORD BADGE (If already clocked in today) */}
        {todayRecord && authStep === 'staff_id_entry' && (
          <div className="bg-[#FEF9C3] border border-amber-200 rounded-full px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-amber-950">
            <div className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">
                Recorded at {todayRecord.clockInTime} • {todayRecord.date}
              </span>
            </div>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full text-white font-bold shrink-0 ml-1"
              style={{ backgroundColor: theme.primary }}
            >
              Present
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
