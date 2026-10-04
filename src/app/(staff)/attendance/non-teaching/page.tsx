import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageEngine } from '../../../../utils/storage';
import {
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
  SchoolConfig,
} from '../../../../types';
import { soundSynthesizer } from '../../../../utils/audio';
import { securityEngine } from '../../../../utils/security';
import { useGeolocation } from '../../../../hooks/useGeolocation';
import { getDeviceSignature, calibrateCampusGateGps } from '../../../../utils/geo';
import { verifyBeaconToken } from '../../../../utils/beacon';
import { useSchoolTheme } from '../../../../hooks/useSchoolTheme';
import { FirebasePhoneAuthBox } from '../../../../components/FirebasePhoneAuthBox';
import { LiveBeaconScanner } from '../../../../components/LiveBeaconScanner';
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Camera,
  IdCard,
  KeyRound,
  Delete,
  X,
  RotateCw,
  ArrowLeft,
  Scan,
  MessageCircle,
  Smartphone,
  Monitor,
  Users,
  Clock,
  Sparkles,
  LogOut,
  BadgeCheck,
  Filter,
} from 'lucide-react';

// Helper to compute active shift duration (handles overnight shifts too)
function calculateShiftDuration(inTime?: string, outTime?: string): string {
  if (!inTime) return '0h 0m';
  const now = new Date();
  const [inH, inM] = inTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(inH || 0, inM || 0, 0, 0);

  let endDate = now;
  if (outTime) {
    const [outH, outM] = outTime.split(':').map(Number);
    endDate = new Date();
    endDate.setHours(outH || 0, outM || 0, 0, 0);
  }

  let diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
  const totalMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs}h ${mins}m`;
}

export default function NonTeachingAttendancePage() {
  const navigate = useNavigate();
  const { theme, schoolCode } = useSchoolTheme();
  const [config] = useState<SchoolConfig>(() => storageEngine.getSchoolConfig());
  const geo = useGeolocation(config, schoolCode);
  const coords = geo.lat && geo.lng ? { latitude: geo.lat, longitude: geo.lng } : null;

  // View Mode: 'individual' (regular clock in/out) vs 'muster_roll' (Supervisor roll call)
  const [viewMode, setViewMode] = useState<'individual' | 'muster_roll'>('individual');

  // Iteration 1: Dual Device Mode
  // 'byod': Staff smartphone (scans campus beacon QR)
  // 'station': Shared Gate / Station Terminal (supports basic Yam Phone users via SMS OTP without personal camera)
  const [deviceMode, setDeviceMode] = useState<'byod' | 'station'>('byod');

  // Iteration 5: Voice Guidance Toggle
  const [voiceGuidance, setVoiceGuidance] = useState<boolean>(true);

  // Step 1: Staff ID input state (No names pool or dropdown - manual input)
  const [staffIdInput, setStaffIdInput] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<NonTeachingStaffMember | null>(null);

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
  const [lastActionType, setLastActionType] = useState<'clock_in' | 'clock_out'>('clock_in');

  const [feedback, setFeedback] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [todayRecord, setTodayRecord] = useState<NonTeachingAttendanceRecord | null>(null);

  // Iteration 4: Supervisor Muster Roll State
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units');
  const [allNonTeachingList, setAllNonTeachingList] = useState<NonTeachingStaffMember[]>([]);
  const [allTodayRecords, setAllTodayRecords] = useState<NonTeachingAttendanceRecord[]>([]);

  // Clear legacy cached IDs
  useEffect(() => {
    try {
      localStorage.removeItem('ges_last_staff_id');
      localStorage.removeItem('ges_last_non_teaching_staff_id');
    } catch {
      // ignore
    }
  }, []);

  // Voice Guidance speaker helper
  const speakInstruction = useCallback(
    (text: string) => {
      if (!voiceGuidance || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis unavailable', e);
      }
    },
    [voiceGuidance]
  );

  // Refresh non-teaching list & today records
  const refreshRecords = useCallback(() => {
    const list = storageEngine.getNonTeachingStaff();
    const todayStr = new Date().toISOString().split('T')[0];
    const records = storageEngine.getNonTeachingAttendance().filter((r) => r.date === todayStr);
    setAllNonTeachingList(list);
    setAllTodayRecords(records);

    if (selectedStaff) {
      const match = records.find((r) => r.staffId === selectedStaff.staffId);
      setTodayRecord(match || null);
    }
  }, [selectedStaff]);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Welcome prompt on initial mount
  useEffect(() => {
    if (voiceGuidance) {
      const timer = setTimeout(() => {
        speakInstruction(
          'Welcome to Non-Teaching Staff Attendance. Please enter your unique Staff ID to begin.'
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [speakInstruction, voiceGuidance]);

  // Check today's status whenever a staff member is selected
  useEffect(() => {
    if (!selectedStaff) {
      setTodayRecord(null);
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const records = storageEngine.getNonTeachingAttendance();
    const match = records.find((r) => r.staffId === selectedStaff.staffId && r.date === todayStr);
    setTodayRecord(match || null);
  }, [selectedStaff?.staffId]);

  // Touch keypad clicks
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
      setFeedback({ type: 'error', text: 'Please enter your unique Non-Teaching Staff ID.' });
      speakInstruction('Please enter your Staff ID.');
      return;
    }

    const allNonTeaching = storageEngine.getNonTeachingStaff();
    const matched = allNonTeaching.find(
      (s) => s.staffId.toLowerCase().trim() === rawId.toLowerCase().trim()
    );

    if (!matched) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Staff ID '${rawId}' not found in Non-Teaching records. Please verify your Staff ID or contact School Administration.`,
      });
      speakInstruction('Staff ID not found. Please verify your ID with administration.');
      return;
    }

    // Security lockout check
    const lockStatus = securityEngine.isLockedOut(matched.staffId);
    if (lockStatus.locked) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Account locked due to recent attempts. Try again in ${lockStatus.remainingSeconds}s.`,
      });
      speakInstruction('Account temporarily locked due to failed attempts.');
      return;
    }

    securityEngine.clearFailedAttempts(matched.staffId);
    setSelectedStaff(matched);
    soundSynthesizer.playKeypadBeep();

    // Check if staff is already on duty today (Iteration 3: Shift Handover Clock-Out)
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = storageEngine
      .getNonTeachingAttendance()
      .find((r) => r.staffId === matched.staffId && r.date === todayStr);

    if (existing && !existing.clockOutTime) {
      setLastActionType('clock_out');
      speakInstruction(
        `Hello ${matched.name}. You are currently on duty. Sending SMS code to complete your shift clock out.`
      );
    } else {
      setLastActionType('clock_in');
      speakInstruction(
        `Hello ${matched.name}. Sending 2FA code to your phone for shift clock in.`
      );
    }

    initiateOtpFlow(matched);
  };

  // Dispatch OTP via Arkesel SMS gateway
  const initiateOtpFlow = async (
    staff: NonTeachingStaffMember,
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
              ? `💬 2FA Code dispatched via WhatsApp to ${staff.phone}`
              : `📱 2FA OTP SMS sent to ${staff.phone}. Please enter the 4-digit code.`,
        });
        speakInstruction('A 4-digit code has been sent to your phone. Please enter it now.');
      } else {
        throw new Error(data.message || 'Failed to dispatch 2FA SMS');
      }
    } catch (err: any) {
      setIsSendingOtp(false);
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: err?.message || 'SMS gateway delay. You can use Headmaster override or retry.',
      });
      setAuthStep('otp_verification');
    }
  };

  // Step 2 OTP Verified Handler
  const handleOtpVerified = () => {
    soundSynthesizer.playSuccessChime();

    // In Station Mode (Iteration 1: Yam Phone users):
    // Station tablet is already on campus, so OTP entry directly confirms attendance without needing a phone camera!
    if (deviceMode === 'station') {
      finalizeAttendanceRecord('sms_yam_phone');
    } else {
      // In BYOD Mode: Open integrated live camera in Step 3 to scan Beacon QR
      setAuthStep('scan_verification');
      speakInstruction('Please point camera at the rotating Campus Beacon QR code to complete verification.');
    }
  };

  // Step 3: Optical scan of physical Campus Beacon QR (BYOD mode)
  const handleBeaconScanned = (tokenString: string) => {
    if (!selectedStaff) return;

    const verification = verifyBeaconToken(tokenString, schoolCode || config.schoolCode);
    if (!verification.valid) {
      soundSynthesizer.playWarningBeep();
      setFeedback({
        type: 'error',
        text: `Beacon Scan Error: ${verification.message || 'Invalid QR code'}`,
      });
      speakInstruction('Beacon QR code invalid or expired. Please rescan the screen.');
      return;
    }

    soundSynthesizer.playScanBeep();

    if (coords) {
      calibrateCampusGateGps(
        verification.detectedSchoolCode || schoolCode || config.schoolCode,
        coords.latitude,
        coords.longitude,
        600
      );
    }

    finalizeAttendanceRecord('firebase_phone_auth');
  };

  // Finalize either Shift Clock-In or Shift Clock-Out (Iteration 3)
  const finalizeAttendanceRecord = (method: NonTeachingAttendanceRecord['method']) => {
    if (!selectedStaff) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GH', { hour12: false });
    const todayStr = now.toISOString().split('T')[0];

    const records = storageEngine.getNonTeachingAttendance();
    const existing = records.find(
      (r) => r.staffId === selectedStaff.staffId && r.date === todayStr
    );

    if (existing && !existing.clockOutTime) {
      // Shift Clock-Out (Shift Handover)
      const duration = calculateShiftDuration(existing.clockInTime, timeStr);
      storageEngine.updateNonTeachingRecord(existing.id, {
        clockOutTime: timeStr,
        clockOutTimestamp: Date.now(),
      });
      soundSynthesizer.playClockInChime();

      const confirmedText = `Shift Handover Confirmed for ${selectedStaff.name}`;
      setConfirmationMessage(confirmedText);
      setLastActionType('clock_out');
      setFeedback({
        type: 'success',
        text: `✓ ${confirmedText} (Clocked out at ${timeStr.slice(0, 5)} • On duty for ${duration})`,
      });
      speakInstruction(
        `Shift ended for ${selectedStaff.name}. You served ${duration}. Enjoy your rest.`
      );
    } else {
      // Shift Clock-In
      const newRecord: NonTeachingAttendanceRecord = {
        id: `non-teach-${Date.now()}`,
        staffId: selectedStaff.staffId,
        staffName: selectedStaff.name,
        role: selectedStaff.role,
        unit: selectedStaff.unit,
        shift: selectedStaff.shift,
        method: method || (deviceMode === 'station' ? 'sms_yam_phone' : 'firebase_phone_auth'),
        date: todayStr,
        clockInTime: timeStr,
        clockInTimestamp: Date.now(),
        punctualityStatus: 'on_time',
        deviceSignature: getDeviceSignature(),
        synced: true,
        isOnCampus: true,
        isIdentityVerified: true,
      };

      storageEngine.addNonTeachingRecord(newRecord);
      soundSynthesizer.playClockInChime();

      const confirmedText = `Shift Arrival Confirmed for ${selectedStaff.name}`;
      setConfirmationMessage(confirmedText);
      setLastActionType('clock_in');
      setFeedback({
        type: 'success',
        text: `✓ ${confirmedText} (${selectedStaff.role} • ${timeStr.slice(0, 5)} • ${selectedStaff.shift})`,
      });
      speakInstruction(
        `Arrival confirmed for ${selectedStaff.name}. Have a productive shift.`
      );
    }

    refreshRecords();
    setAuthStep('success');
  };

  // Supervisor Quick Endorse (Iteration 4)
  const handleSupervisorEndorse = (staff: NonTeachingStaffMember) => {
    soundSynthesizer.playScanBeep();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GH', { hour12: false });
    const todayStr = now.toISOString().split('T')[0];

    const records = storageEngine.getNonTeachingAttendance();
    const existing = records.find((r) => r.staffId === staff.staffId && r.date === todayStr);

    if (existing && !existing.clockOutTime) {
      // Clock out
      storageEngine.updateNonTeachingRecord(existing.id, {
        clockOutTime: timeStr,
        clockOutTimestamp: Date.now(),
        verifiedBy: 'Unit Supervisor',
      });
      setFeedback({
        type: 'success',
        text: `✓ Supervisor marked Clock-Out for ${staff.name} at ${timeStr.slice(0, 5)}`,
      });
      speakInstruction(`Supervisor endorsed shift handover for ${staff.name}`);
    } else {
      // Clock in
      const record: NonTeachingAttendanceRecord = {
        id: `non-teach-sup-${Date.now()}`,
        staffId: staff.staffId,
        staffName: staff.name,
        role: staff.role,
        unit: staff.unit,
        shift: staff.shift,
        method: 'supervisor_rollcall',
        date: todayStr,
        clockInTime: timeStr,
        clockInTimestamp: Date.now(),
        punctualityStatus: 'on_time',
        deviceSignature: getDeviceSignature(),
        synced: true,
        isOnCampus: true,
        isIdentityVerified: true,
        verifiedBy: 'Unit Head Muster Roll',
      };
      storageEngine.addNonTeachingRecord(record);
      setFeedback({
        type: 'success',
        text: `✓ Supervisor endorsed muster roll arrival for ${staff.name} at ${timeStr.slice(0, 5)}`,
      });
      speakInstruction(`Arrival confirmed for ${staff.name} by unit supervisor`);
    }

    refreshRecords();
  };

  const isOffCampus = !geo.isLoading && geo.distanceMeters !== null && geo.distanceMeters > config.radiusMeters;
  const distanceKm = geo.distanceMeters ? (geo.distanceMeters / 1000).toFixed(1) : '0';

  // Filter staff by unit for Supervisor Muster Roll
  const filteredMusterStaff = allNonTeachingList.filter((s) => {
    if (selectedUnit === 'All Units') return true;
    return s.unit.toLowerCase().includes(selectedUnit.toLowerCase());
  });

  return (
    <div className="w-full max-w-[440px] mx-auto min-h-screen py-3 sm:py-6 px-3 sm:px-0 flex flex-col justify-center font-sans select-none">
      {/* Centered Mobile Card: Rounded 30px, White, Border #E2E8F0 */}
      <div className="w-full bg-white rounded-[30px] border border-[#E2E8F0] shadow-xl overflow-hidden p-4 sm:p-5 space-y-3.5 relative">
        
        {/* TOP STATUS BAR: Theme primary with Voice guidance & Mode switcher */}
        <div
          className="h-[56px] rounded-[14px] px-3.5 flex items-center justify-between shadow-xs text-white transition-colors duration-300"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
              {theme.code.charAt(0)}
            </div>
            <div>
              <h1 className="text-[11px] font-bold text-white tracking-wide leading-tight truncate max-w-[170px]">
                {theme.shortName || theme.name} • Auxiliary
              </h1>
              <p className="text-[9px] text-[#BBF7D0] font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>
                  {deviceMode === 'station' ? '🖥️ Gate Station Terminal' : '📱 BYOD Mobile Mode'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Iteration 5: Voice Guidance Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !voiceGuidance;
                setVoiceGuidance(next);
                if (next) speakInstruction('Voice guidance activated.');
              }}
              className={`p-1.5 rounded-lg border transition ${
                voiceGuidance
                  ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-bold'
                  : 'bg-white/10 text-white border-white/20'
              }`}
              title={voiceGuidance ? 'Mute Voice Guidance' : 'Enable Voice Guidance'}
            >
              {voiceGuidance ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Switch to Teaching Attendance */}
            <button
              type="button"
              onClick={() => navigate('/attendance?type=teaching')}
              className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold transition"
            >
              Teaching →
            </button>
          </div>
        </div>

        {/* INDIVIDUAL ATTENDANCE PUNCH (Iter 1, 3, 5) */}
          <div className="space-y-3">
            {/* Iteration 1: Dual Device Mode Selector */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
              <span className="text-[11px] font-bold text-amber-950 flex items-center gap-1">
                <span>Operating Device:</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setDeviceMode('byod');
                    soundSynthesizer.playKeypadBeep();
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    deviceMode === 'byod'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white/80 text-amber-900 hover:bg-white'
                  }`}
                  title="Use your smartphone to enter ID, receive SMS, and scan Beacon QR"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>BYOD Phone</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeviceMode('station');
                    soundSynthesizer.playKeypadBeep();
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    deviceMode === 'station'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white/80 text-amber-900 hover:bg-white'
                  }`}
                  title="Shared gate/pantry terminal: punches ID on screen, receives SMS on button phone"
                >
                  <Monitor className="w-3 h-3" />
                  <span>Station (Yam Phone)</span>
                </button>
              </div>
            </div>

            {/* GEOFENCE CHECK */}
            {isOffCampus && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col gap-1.5 text-amber-900 text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="text-[11px] leading-tight flex-1">
                    <strong>Distance: {distanceKm}km from Campus</strong>
                    <p className="text-[10px] text-amber-700">Anchor gate GPS to 0m for UAT:</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const success = geo.calibrateToCurrentPosition();
                    if (success) {
                      soundSynthesizer.playScanBeep();
                      setFeedback({
                        type: 'success',
                        text: `✓ Campus gate calibrated to your location (0m).`,
                      });
                    }
                  }}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-xs"
                >
                  <MapPin className="w-3 h-3" />
                  <span>📍 Set Campus Gate to My Location (0m)</span>
                </button>
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

            {/* STEP 1: STAFF ID ENTRY */}
            {authStep === 'staff_id_entry' && (
              <div className="space-y-3">
                {/* Progress Pill */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 ring-2 ring-amber-200">
                    <IdCard className="w-3 h-3" /> Step 1: Staff ID
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Step 2: 2FA OTP
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    {deviceMode === 'station' ? (
                      <Monitor className="w-3 h-3" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <span>{deviceMode === 'station' ? 'Step 3: Station Confirm' : 'Step 3: Scan Beacon'}</span>
                  </span>
                </div>

                {/* Staff ID Input Card */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Enter Non-Teaching Staff ID
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      Supports all auxiliary personnel (Security, Catering, Cleaners, Bursary, Lab).
                    </p>
                  </div>

                  {/* Input Box */}
                  <div className="relative">
                    <input
                      type="text"
                      value={staffIdInput}
                      onChange={(e) => setStaffIdInput(e.target.value.trim())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleVerifyStaffId();
                      }}
                      placeholder="e.g. GES-NT-001"
                      className="w-full text-center text-lg font-mono font-black text-slate-900 tracking-wider py-2.5 px-4 bg-white border-2 border-amber-300 rounded-xl focus:border-amber-600 focus:outline-none shadow-xs uppercase"
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

                  {/* Fast Touch Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadClick(digit)}
                        className="h-10 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-base font-bold text-slate-800 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                      >
                        {digit}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleKeypadClick('clear')}
                      className="h-10 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-xs font-bold text-slate-500 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => handleKeypadClick('0')}
                      className="h-10 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-base font-bold text-slate-800 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      onClick={() => handleKeypadClick('back')}
                      className="h-10 bg-white hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-slate-700 shadow-2xs flex items-center justify-center transition active:scale-95 duration-100"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Test Shortcuts for 0248793773 and 0246397354 */}
                  <div className="flex gap-1.5 justify-center pt-1 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setStaffIdInput('GES-NT-001')}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-mono font-bold text-amber-900"
                      title="Mr. Eugene Fafali Esianyo (0248793773)"
                    >
                      GES-NT-001 (0248793773)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffIdInput('GES-NT-002')}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-900"
                      title="Mrs. Charity Sabbath (0246397354)"
                    >
                      GES-NT-002 (0246397354)
                    </button>
                  </div>

                  {/* VERIFY BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleVerifyStaffId()}
                    disabled={staffIdInput.trim().length === 0 || isSendingOtp}
                    style={{
                      backgroundColor: staffIdInput.trim().length > 0 ? theme.primary : '#CBD5E1',
                    }}
                    className="w-full h-12 text-white font-black text-xs rounded-full shadow-md flex items-center justify-center gap-2 transition active:scale-98 duration-150 cursor-pointer disabled:cursor-not-allowed"
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

            {/* STEP 2: 2FA OTP SCREEN */}
            {authStep === 'otp_verification' && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3.5 shadow-sm">
                {/* Progress Pill */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Step 1: Staff ID
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ring-2 ring-amber-200">
                    <ShieldCheck className="w-3 h-3" /> Step 2: 2FA OTP
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                    {deviceMode === 'station' ? (
                      <Monitor className="w-3 h-3" />
                    ) : (
                      <Camera className="w-3 h-3" />
                    )}
                    <span>{deviceMode === 'station' ? 'Step 3: Station Confirm' : 'Step 3: Scan Beacon'}</span>
                  </span>
                </div>

                {/* Verified Staff ID Banner */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Verified Staff ID</span>
                    <span className="font-mono font-black text-slate-900">{selectedStaff?.staffId}</span>
                    <span className="block text-[11px] font-bold text-slate-800">{selectedStaff?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block">Action Required</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        lastActionType === 'clock_out'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {lastActionType === 'clock_out' ? 'Shift Clock Out' : 'Shift Clock In'}
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-3">
                  <FirebasePhoneAuthBox
                    staffPhone={otpPhone || '+233240000000'}
                    staffName={selectedStaff?.name || 'Auxiliary Staff'}
                    staffId={selectedStaff?.staffId || 'GES-NT-001'}
                    schoolCode={schoolCode || config.schoolCode}
                    initialStep="otp"
                    devOtp={devOtpReceived || undefined}
                    onVerified={handleOtpVerified}
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

            {/* STEP 3: PHYSICAL CAMPUS BEACON SCAN (BYOD Camera Mode) */}
            {authStep === 'scan_verification' && (
              <div className="bg-white border-2 border-amber-400/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md animate-scale">
                {/* Progress Pill */}
                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Step 1: ID
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Step 2: OTP
                  </span>
                  <span>→</span>
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300 ring-2 ring-amber-200">
                    <Camera className="w-3 h-3" /> Step 3: Scan Beacon
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-700 shadow-inner mb-0.5">
                    <Scan className="w-5 h-5 animate-pulse" />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Step 3: Point Camera at Campus Beacon QR
                  </h2>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Aim your camera at the physical Beacon QR code on campus to finalize your{' '}
                    <strong>{lastActionType === 'clock_out' ? 'Clock-Out' : 'Clock-In'}</strong>.
                  </p>
                </div>

                {/* LIVE OPTICAL SCANNER */}
                <LiveBeaconScanner
                  schoolCode={schoolCode || config.schoolCode}
                  staffName={selectedStaff?.name}
                  staffId={selectedStaff?.staffId}
                  onBeaconVerified={handleBeaconScanned}
                />

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthStep('otp_verification')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Back to Step 2 (OTP)</span>
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
                  <h2 className="text-base font-black text-slate-900">
                    {confirmationMessage || `Attendance Confirmed for ${selectedStaff?.name}`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Staff ID: <strong className="font-mono text-slate-700">{selectedStaff?.staffId}</strong> •{' '}
                    {selectedStaff?.role} ({selectedStaff?.unit})
                  </p>
                </div>

                {/* Shift Details Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl text-left text-xs space-y-2 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Action:</span>
                    <span className="font-bold text-emerald-700">
                      {lastActionType === 'clock_out' ? '✓ Shift Clocked Out (Handover)' : '✓ Shift Clocked In (Arrival)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Verification Method:</span>
                    <span className="font-bold text-indigo-700">
                      {deviceMode === 'station' ? 'Station Kiosk SMS OTP' : 'BYOD Optical Beacon Scan'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Shift Name:</span>
                    <span className="font-bold text-slate-800">{selectedStaff?.shift}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Arrival / Departure:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {todayRecord?.clockInTime || 'Recorded'}
                      {todayRecord?.clockOutTime ? ` → ${todayRecord.clockOutTime}` : ''}
                    </span>
                  </div>
                  {todayRecord?.clockInTime && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">Duration Served:</span>
                      <span className="font-bold text-amber-800">
                        {calculateShiftDuration(todayRecord.clockInTime, todayRecord.clockOutTime)}
                      </span>
                    </div>
                  )}
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
                  Process Another Non-Teaching Staff
                </button>
              </div>
            )}
          </div>


      </div>
    </div>
  );
}
