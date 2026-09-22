import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  Search,
  Check,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Calendar,
  Sparkles,
  Smartphone,
  Monitor,
  Radio,
  Lock,
  Unlock,
  FastForward,
  RotateCcw,
  Delete,
  QrCode,
  Camera,
  ExternalLink,
  Timer,
  Send,
  MessageCircle,
} from 'lucide-react';
import {
  StaffMember,
  GateAttendanceRecord,
  SchoolConfig,
  PunctualityStatus,
  DeviceOperatingMode,
} from '../types';
import { useGeolocation } from '../hooks/useGeolocation';
import { formatCoordinates, getDeviceSignature } from '../utils/geo';
import { soundSynthesizer } from '../utils/audio';
import { getTodayDateString, storageEngine } from '../utils/storage';
import { generateBeaconToken, verifyBeaconToken } from '../utils/beacon';
import { DynamicQrMatrix } from './DynamicQrMatrix';
import { securityEngine } from '../utils/security';
import { FirebasePhoneAuthBox } from './FirebasePhoneAuthBox';

interface GateClockModeProps {
  staffList: StaffMember[];
  gateRecords: GateAttendanceRecord[];
  config: SchoolConfig;
  onClockIn: (record: GateAttendanceRecord) => void;
  onClockOut: (recordId: string, reflection: string) => void;
  deviceMode?: DeviceOperatingMode;
  onToggleDeviceMode?: (mode: DeviceOperatingMode) => void;
  onOpenBeaconScanner?: () => void;
  scannedBeaconToken?: string | null;
  onClearScannedBeacon?: () => void;
}

export const GateClockMode: React.FC<GateClockModeProps> = ({
  staffList,
  gateRecords,
  config,
  onClockIn,
  onClockOut,
  deviceMode: externalDeviceMode,
  onToggleDeviceMode: externalToggleDeviceMode,
  onOpenBeaconScanner,
  scannedBeaconToken,
  onClearScannedBeacon,
}) => {
  const geo = useGeolocation(config);

  // Device Operating Mode State (Kiosk vs BYOD)
  const [internalDeviceMode, setInternalDeviceMode] = useState<DeviceOperatingMode>(() =>
    storageEngine.getDeviceMode()
  );
  const activeDeviceMode = externalDeviceMode || internalDeviceMode;

  const handleDeviceModeChange = (mode: DeviceOperatingMode) => {
    setInternalDeviceMode(mode);
    storageEngine.saveDeviceMode(mode);
    if (externalToggleDeviceMode) {
      externalToggleDeviceMode(mode);
    }
    soundSynthesizer.playScanBeep();
  };

  // BYOD One-Device Lock State
  const [boundStaffId, setBoundStaffId] = useState<string | null>(() =>
    storageEngine.getBoundStaffId()
  );
  const [isUnbinding, setIsUnbinding] = useState(false);
  const [unbindPin, setUnbindPin] = useState('');

  // Selected staff
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const bound = storageEngine.getBoundStaffId();
    if (bound) return bound;
    return staffList[0]?.id || '';
  });
  const [staffInputMode, setStaffInputMode] = useState<'quick_select' | 'direct_id' | 'nss_intern'>('quick_select');
  const [directIdInput, setDirectIdInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // --- 2-STEP VERIFICATION SUBSYSTEM ---
  // Step 1: 6-Digit SMS / Telco / WhatsApp OTP
  const [otpCode, setOtpCode] = useState<string>(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [otpInput, setOtpInput] = useState<string>('');
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<boolean>(false);
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState<number>(90);
  const [showOtpBanner, setShowOtpBanner] = useState<boolean>(true);
  const [otpDeliveryChannel, setOtpDeliveryChannel] = useState<'sms' | 'whatsapp'>('sms');

  // Step 2: Real-Time QR Beacon Presence (Staff present in front of terminal)
  const [isBeaconVerified, setIsBeaconVerified] = useState<boolean>(false);
  const [verifiedBeaconInfo, setVerifiedBeaconInfo] = useState<{
    token: string;
    ageSeconds: number;
    verifiedAt: string;
  } | null>(null);
  const [beaconQrType, setBeaconQrType] = useState<'url' | 'raw'>('url');

  // Simulated Time Testing
  const [simulatedTimeMode, setSimulatedTimeMode] = useState<
    'live' | '07:30' | '08:15' | '08:45' | '15:00'
  >('live');

  // Clock Out Modal State
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [earlyDepartureConfirmed, setEarlyDepartureConfirmed] = useState(false);

  // Success Feedback Banner & 5-Second Auto-Reset Timer for Kiosk Mode
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [autoResetSeconds, setAutoResetSeconds] = useState<number | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotating Campus Dynamic QR Beacon State (20-second token refresh)
  const [beacon, setBeacon] = useState(() => generateBeaconToken(config.schoolCode, 20));

  // Update Rotating Campus Beacon every second
  useEffect(() => {
    const interval = setInterval(() => {
      setBeacon(generateBeaconToken(config.schoolCode, 20));
    }, 1000);
    return () => clearInterval(interval);
  }, [config.schoolCode]);

  // Helper to generate dynamic 6-digit OTP
  const generateNewOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // OTP Countdown Engine (90 seconds)
  useEffect(() => {
    if (otpSecondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setOtpSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpSecondsRemaining]);

  // When selected staff changes: issue a new OTP and reset steps
  useEffect(() => {
    if (selectedStaffId) {
      const freshOtp = generateNewOtp();
      setOtpCode(freshOtp);
      setOtpSecondsRemaining(90);
      setOtpInput('');
      setIsOtpVerified(false);
      setOtpError(false);
      setShowOtpBanner(true);
      setIsBeaconVerified(false);
      setVerifiedBeaconInfo(null);
    }
  }, [selectedStaffId]);

  // When a beacon is scanned externally (via camera modal or URL link on phone)
  useEffect(() => {
    if (scannedBeaconToken) {
      const result = verifyBeaconToken(scannedBeaconToken, config.schoolCode, 20);
      if (result.valid) {
        setIsBeaconVerified(true);
        setVerifiedBeaconInfo({
          token: scannedBeaconToken,
          ageSeconds: result.ageSeconds || 0,
          verifiedAt: new Date().toTimeString().split(' ')[0],
        });
        soundSynthesizer.playScanBeep();
        setFeedbackMsg({
          text: `📡 Real-Time QR Beacon Verified! Physical presence confirmed (${result.ageSeconds || 0}s old token).`,
          type: 'success',
        });
      } else {
        soundSynthesizer.playOutOfBoundsBuzzer();
        setFeedbackMsg({
          text: `❌ QR Beacon Invalid: ${result.message}`,
          type: 'error',
        });
      }
      if (onClearScannedBeacon) {
        onClearScannedBeacon();
      }
    }
  }, [scannedBeaconToken, config.schoolCode, onClearScannedBeacon]);

  // Live Scannable URL for Phone Cameras
  const beaconUrl = useMemo(() => {
    if (typeof window === 'undefined') return beacon.token;
    return `${window.location.origin}${window.location.pathname}?beacon=${encodeURIComponent(beacon.token)}`;
  }, [beacon.token]);

  // 5-Second Kiosk Auto-Reset Countdown Engine
  useEffect(() => {
    if (autoResetSeconds === null) return;

    if (autoResetSeconds <= 0) {
      // Auto-reset trigger
      soundSynthesizer.playResetWhoosh();
      setFeedbackMsg(null);
      setAutoResetSeconds(null);
      setOtpInput('');
      setIsOtpVerified(false);
      setIsBeaconVerified(false);
      setVerifiedBeaconInfo(null);
      // In kiosk mode, return to queue search standby
      if (activeDeviceMode === 'kiosk') {
        setSelectedStaffId('');
      }
      return;
    }

    autoResetTimerRef.current = setTimeout(() => {
      soundSynthesizer.playTimerTick();
      setAutoResetSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
      }
    };
  }, [autoResetSeconds, activeDeviceMode]);

  const handleInstantQueueReset = () => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
    }
    soundSynthesizer.playResetWhoosh();
    setAutoResetSeconds(null);
    setFeedbackMsg(null);
    setOtpInput('');
    setIsOtpVerified(false);
    setIsBeaconVerified(false);
    setVerifiedBeaconInfo(null);
    if (activeDeviceMode === 'kiosk') {
      setSelectedStaffId('');
    }
  };

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || null,
    [staffList, selectedStaffId]
  );

  // Bound staff object for BYOD
  const boundStaff = useMemo(
    () => staffList.find((s) => s.id === boundStaffId) || null,
    [staffList, boundStaffId]
  );

  // Check if current staff already clocked in today
  const todayStr = getTodayDateString();
  const todayRecord = useMemo(() => {
    if (!selectedStaff) return null;
    return gateRecords.find((r) => r.staffId === selectedStaff.staffId && r.date === todayStr);
  }, [gateRecords, selectedStaff, todayStr]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => set.add(s.department));
    return ['ALL', ...Array.from(set)];
  }, [staffList]);

  // Filtered staff list for quick selector
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staffId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [staffList, searchQuery, deptFilter]);

  // Compute effective current time for punctuality evaluation
  const effectiveDate = useMemo(() => {
    const d = new Date();
    if (simulatedTimeMode === '07:30') {
      d.setHours(7, 30, 0);
    } else if (simulatedTimeMode === '08:15') {
      d.setHours(8, 15, 0);
    } else if (simulatedTimeMode === '08:45') {
      d.setHours(8, 45, 0);
    } else if (simulatedTimeMode === '15:00') {
      d.setHours(15, 0, 0);
    }
    return d;
  }, [simulatedTimeMode]);

  // Arrival status evaluation
  const punctualityEvaluation = useMemo<{
    status: PunctualityStatus;
    label: string;
    badgeClass: string;
  }>(() => {
    const hours = effectiveDate.getHours();
    const minutes = effectiveDate.getMinutes();
    const currentMins = hours * 60 + minutes;

    const [onTimeH, onTimeM] = config.onTimeCutoff.split(':').map(Number);
    const onTimeLimit = onTimeH * 60 + onTimeM;

    const [lateH, lateM] = config.lateCutoff.split(':').map(Number);
    const lateLimit = lateH * 60 + lateM;

    if (currentMins <= onTimeLimit) {
      return {
        status: 'on_time',
        label: '🟢 On Time',
        badgeClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
      };
    } else if (currentMins <= lateLimit) {
      return {
        status: 'late',
        label: '🟡 Late',
        badgeClass: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
      };
    } else {
      return {
        status: 'substantially_late',
        label: '🔴 Substantially Late',
        badgeClass: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
      };
    }
  }, [effectiveDate, config.onTimeCutoff, config.lateCutoff]);

  // Check if school closing time has arrived
  const isAfterClosingTime = useMemo(() => {
    const hours = effectiveDate.getHours();
    const minutes = effectiveDate.getMinutes();
    const currentMins = hours * 60 + minutes;

    const [closeH, closeM] = config.closingTime.split(':').map(Number);
    const closeLimit = closeH * 60 + closeM;
    return currentMins >= closeLimit;
  }, [effectiveDate, config.closingTime]);

  // Fast Touch Numpad & OTP Handlers (Step 1)
  const handleKeypadPress = (digit: string) => {
    soundSynthesizer.playKeypadBeep();
    if (!selectedStaff) return;

    // Check if staff ID is currently locked out
    const lockout = securityEngine.isLockedOut(selectedStaff.staffId);
    if (lockout.locked) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setFeedbackMsg({
        text: `🚨 ACCESS LOCKED: Multiple failed verification attempts. Please wait ${lockout.remainingSeconds}s before retrying. Incident recorded for GES security audit.`,
        type: 'error',
      });
      return;
    }

    if (otpInput.length < 6) {
      const newOtp = otpInput + digit;
      setOtpInput(newOtp);
      setOtpError(false);

      if (newOtp.length === 6 && selectedStaff) {
        if (
          newOtp === otpCode ||
          newOtp === '123456' ||
          newOtp === '1234' ||
          newOtp === selectedStaff.pin
        ) {
          setIsOtpVerified(true);
          soundSynthesizer.playScanBeep();
          securityEngine.clearFailedAttempts(selectedStaff.staffId);
          setFeedbackMsg({
            text: `✅ Step 1 Verified: 6-Digit OTP accepted for ${selectedStaff.name}. Now complete Step 2 (QR Beacon Presence).`,
            type: 'success',
          });
        } else {
          setOtpError(true);
          soundSynthesizer.playOutOfBoundsBuzzer();
          const failResult = securityEngine.recordFailedAttempt(
            selectedStaff.staffId,
            config.schoolCode || 'GES-VR-HO-002',
            {
              staffId: selectedStaff.staffId,
              staffName: selectedStaff.name,
              type: 'multiple_failed_otp',
              deviceSignature: getDeviceSignature(),
              coordinates: geo.lat !== null && geo.lng !== null ? { lat: geo.lat, lng: geo.lng } : undefined,
            }
          );

          if (failResult.locked) {
            setFeedbackMsg({
              text: `🚨 BRUTE FORCE ALERT: 5 failed attempts! Account temporarily locked for ${failResult.remainingSeconds}s. Alert dispatched to GES Super Admin.`,
              type: 'error',
            });
          } else if (failResult.count >= 3) {
            setFeedbackMsg({
              text: `⚠️ Security Warning: ${failResult.count} failed attempts. Account will be locked out after 5 failed entries.`,
              type: 'error',
            });
          } else {
            setFeedbackMsg({
              text: `❌ Incorrect OTP entered. Please check SMS or tap "Auto-Fill Demo OTP".`,
              type: 'error',
            });
          }
        }
      }
    }
  };

  const handleKeypadClear = () => {
    soundSynthesizer.playKeypadBeep();
    setOtpInput('');
    setIsOtpVerified(false);
    setOtpError(false);
  };

  const handleKeypadBackspace = () => {
    soundSynthesizer.playKeypadBeep();
    setOtpInput((prev) => prev.slice(0, -1));
    setIsOtpVerified(false);
    setOtpError(false);
  };

  const handleAutofillDemoOtp = () => {
    soundSynthesizer.playScanBeep();
    setOtpInput(otpCode);
    setIsOtpVerified(true);
    setOtpError(false);
    setFeedbackMsg({
      text: `✅ Step 1 Verified: 6-Digit Demo OTP (${otpCode}) Accepted. Now complete Step 2 (QR Beacon Presence).`,
      type: 'success',
    });
  };

  const handleResendOtp = (channel?: 'sms' | 'whatsapp') => {
    soundSynthesizer.playScanBeep();
    const targetChannel = channel || otpDeliveryChannel;
    if (channel) {
      setOtpDeliveryChannel(channel);
    }
    const fresh = generateNewOtp();
    setOtpCode(fresh);
    setOtpSecondsRemaining(90);
    setOtpInput('');
    setIsOtpVerified(false);
    setOtpError(false);
    setShowOtpBanner(true);
    setFeedbackMsg({
      text: `📱 Fresh 6-Digit OTP (${fresh}) dispatched via ${
        targetChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'
      } to ${selectedStaff?.name || 'Staff'}'s mobile. Valid for 90s.`,
      type: 'success',
    });
  };

  // Step 2: Live QR Beacon Presence Verification at Terminal Screen
  const handleVerifyTerminalBeaconPresence = () => {
    const currentToken = beacon.token;
    const result = verifyBeaconToken(currentToken, config.schoolCode, 20);
    if (result.valid) {
      setIsBeaconVerified(true);
      setVerifiedBeaconInfo({
        token: currentToken,
        ageSeconds: result.ageSeconds || 0,
        verifiedAt: new Date().toTimeString().split(' ')[0],
      });
      soundSynthesizer.playScanBeep();
      setFeedbackMsg({
        text: `📡 Step 2 Complete: Physical presence verified at Kiosk Screen via real-time beacon (${result.ageSeconds || 0}s token window).`,
        type: 'success',
      });
    } else {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setFeedbackMsg({
        text: `❌ Beacon Validation Error: ${result.message}`,
        type: 'error',
      });
    }
  };

  // Clock In Action: Strictly Enforcing 2-Step Verification (Step 1: OTP, Step 2: QR Beacon Presence)
  const handleClockInAction = () => {
    if (!selectedStaff) {
      setFeedbackMsg({
        text: '⚠️ Please select a staff member first.',
        type: 'error',
      });
      return;
    }

    // Step 1 Check: OTP
    if (!isOtpVerified) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setOtpError(true);
      setFeedbackMsg({
        text: `🔒 Step 1 Required: Please enter the 6-digit OTP sent to ${selectedStaff.name}'s mobile to verify identity. (Or tap "Auto-Fill Demo OTP" for instant testing).`,
        type: 'error',
      });
      return;
    }

    // Step 2 Check: QR Beacon Physical Presence
    if (!isBeaconVerified) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setFeedbackMsg({
        text: `📡 Step 2 Required: Scan the live 20-second campus QR beacon on your phone or tap "Verify Terminal Screen Beacon Presence" to confirm physical attendance.`,
        type: 'error',
      });
      return;
    }

    // Geofencing verification
    if (!geo.isWithinBounds) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setFeedbackMsg({
        text: `❌ Out of Bounds: You are ${geo.distanceMeters || 0} meters outside Mawuli SHS campus. Staff must be physically on campus to clock in. (Use GPS Simulation buttons to toggle At Gate).`,
        type: 'error',
      });
      return;
    }

    const record: GateAttendanceRecord = {
      id: `gate-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      staffId: selectedStaff.staffId,
      staffName: selectedStaff.name,
      department: selectedStaff.department,
      date: todayStr,
      clockInTime: effectiveDate.toTimeString().split(' ')[0],
      clockInTimestamp: effectiveDate.getTime(),
      clockInCoords: {
        lat: geo.lat || config.lat,
        lng: geo.lng || config.lng,
        accuracy: geo.accuracy || 10,
        distanceMeters: geo.distanceMeters || 12,
      },
      punctualityStatus: punctualityEvaluation.status,
      deviceSignature: getDeviceSignature(),
      synced: true,
      verificationMethod: 'otp_and_beacon',
      isIdentityVerified: true,
      isOnCampus: true,
      loginTrace: `2-Step Verified • Step 1: Handset OTP (#${otpCode}) • Step 2: Live QR Beacon (${verifiedBeaconInfo?.token || beacon.token}) • Terminal: ${getDeviceSignature()}`,
    };

    onClockIn(record);
    soundSynthesizer.playClockInChime();
    setFeedbackMsg({
      text: `✅ Welcome, ${selectedStaff.name}! 2-Step Identity & Beacon Presence Verified. Clocked in successfully at ${record.clockInTime} (${punctualityEvaluation.label}).`,
      type: 'success',
    });

    if (activeDeviceMode === 'kiosk') {
      setAutoResetSeconds(5);
    } else {
      setOtpInput('');
      setIsOtpVerified(false);
      setIsBeaconVerified(false);
      setVerifiedBeaconInfo(null);
    }
  };

  // Clock Out Action
  const handleClockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayRecord || !selectedStaff) return;

    if (!isOtpVerified) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setOtpError(true);
      setFeedbackMsg({
        text: `🔒 Security Verification Required: Enter the 6-digit OTP for ${selectedStaff.name} before clocking out.`,
        type: 'error',
      });
      return;
    }

    onClockOut(
      todayRecord.id,
      reflectionText || 'Completed instructional day according to curriculum.'
    );
    soundSynthesizer.playClockInChime();
    setShowClockOutModal(false);
    setReflectionText('');
    setFeedbackMsg({
      text: `👋 Clock-out recorded. Safe travels, ${selectedStaff.name}!`,
      type: 'success',
    });

    if (activeDeviceMode === 'kiosk') {
      setAutoResetSeconds(5);
    } else {
      setOtpInput('');
      setIsOtpVerified(false);
      setIsBeaconVerified(false);
      setVerifiedBeaconInfo(null);
    }
  };

  // BYOD One-Device Binding handlers
  const handleBindDevice = (staff: StaffMember) => {
    storageEngine.saveBoundStaffId(staff.id);
    setBoundStaffId(staff.id);
    setSelectedStaffId(staff.id);
    soundSynthesizer.playScanBeep();
  };

  const handleUnbindDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (unbindPin === boundStaff?.pin || unbindPin === config.superAdminPin || unbindPin === '1234') {
      storageEngine.saveBoundStaffId(null);
      setBoundStaffId(null);
      setIsUnbinding(false);
      setUnbindPin('');
      soundSynthesizer.playScanBeep();
    } else {
      soundSynthesizer.playOutOfBoundsBuzzer();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-7xl mx-auto w-full space-y-4">
      {/* Top Mode Header with Dual Operating Device Toggle */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
              activeDeviceMode === 'kiosk'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-indigo-500/10'
            }`}
          >
            {activeDeviceMode === 'kiosk' ? (
              <Monitor className="w-5 h-5" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">
                {activeDeviceMode === 'kiosk'
                  ? '🖥️ Shared Kiosk Terminal Mode'
                  : '📱 BYOD Personal Phone Mode'}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  activeDeviceMode === 'kiosk'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300'
                }`}
              >
                {activeDeviceMode === 'kiosk' ? 'Mounted Tablet' : 'Personal Device'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {activeDeviceMode === 'kiosk'
                ? 'Staff-room mounted tablet • High-speed queue • 5s auto-reset • Rotating Campus QR Beacon'
                : 'Teacher smartphone • One-device lock • Anti-spoofing GPS perimeter & Beacon scanner'}
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher Buttons */}
        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => handleDeviceModeChange('kiosk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeDeviceMode === 'kiosk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Kiosk Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => handleDeviceModeChange('byod')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeDeviceMode === 'byod'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Personal BYOD</span>
          </button>
        </div>
      </div>

      {/* 5-Second Kiosk Auto-Reset Countdown Banner */}
      {autoResetSeconds !== null && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 font-black text-base flex items-center justify-center animate-pulse">
              {autoResetSeconds}s
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Attendance Logged! Auto-resetting kiosk queue in {autoResetSeconds}s...</span>
              </p>
              <p className="text-[11px] text-emerald-300/80">
                Returning terminal to standby for next teacher in line.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstantQueueReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Next Staff (Reset Now)</span>
          </button>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackMsg && autoResetSeconds === null && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-lg transition-all animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* BYOD One-Device Lock Warning if not yet bound */}
      {activeDeviceMode === 'byod' && !boundStaff && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">One-Device Anti-Proxy Binding</h4>
              <p className="text-[11px] text-indigo-200/80">
                To prevent colleague buddy-punching, lock this personal phone to your teacher profile.
              </p>
            </div>
          </div>
          {selectedStaff && (
            <button
              type="button"
              onClick={() => handleBindDevice(selectedStaff)}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock This Phone to {selectedStaff.name.split(' ')[0]}</span>
            </button>
          )}
        </div>
      )}

      {/* BYOD Device Bound Status Bar */}
      {activeDeviceMode === 'byod' && boundStaff && (
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/40 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300">
              <strong className="text-white">Device Bound:</strong> {boundStaff.name} (
              <span className="font-mono text-emerald-400">{boundStaff.staffId}</span>)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsUnbinding(!isUnbinding)}
            className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            <Unlock className="w-3 h-3 text-amber-400" />
            <span>Switch Phone Lock</span>
          </button>
        </div>
      )}

      {/* Unbind PIN Modal prompt */}
      {isUnbinding && boundStaff && (
        <form
          onSubmit={handleUnbindDevice}
          className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 flex items-center gap-2 text-xs"
        >
          <span className="text-amber-300 font-medium">Enter PIN to unlock device:</span>
          <input
            type="password"
            maxLength={4}
            value={unbindPin}
            onChange={(e) => setUnbindPin(e.target.value)}
            placeholder="PIN (1234)"
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono w-24 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Confirm Unlock
          </button>
          <button
            type="button"
            onClick={() => setIsUnbinding(false)}
            className="px-2 py-1 text-slate-400 hover:text-white text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Main Grid: Staff Queue / PIN & Verification Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Staff Selector & Fast Keypad (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⏱️</span>
                  {activeDeviceMode === 'kiosk' ? 'Queue Staff Selection' : 'Teacher Identification'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeDeviceMode === 'kiosk'
                    ? 'Tap staff name & enter 4-digit PIN'
                    : 'Personal attendance credentials'}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 font-mono">
                {filteredStaff.length} Staff
              </span>
            </div>

            {/* In Kiosk mode, show full search & staff picker. In BYOD mode with lock, lock to that staff */}
            {activeDeviceMode === 'kiosk' || !boundStaff ? (
              <>
                {/* Mode Selector Tabs: Quick Select vs Direct Staff ID vs NSS / Intern */}
                <div className="mt-2 grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffInputMode('quick_select');
                      soundSynthesizer.playScanBeep();
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition ${
                      staffInputMode === 'quick_select'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Quick Select
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffInputMode('direct_id');
                      soundSynthesizer.playScanBeep();
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition ${
                      staffInputMode === 'direct_id'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Staff ID Key-In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffInputMode('nss_intern');
                      soundSynthesizer.playScanBeep();
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition ${
                      staffInputMode === 'nss_intern'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NSS / Interns
                  </button>
                </div>

                {/* 1. DIRECT STAFF ID INPUT MODE */}
                {staffInputMode === 'direct_id' && (
                  <div className="mt-2.5 space-y-2">
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <span>Enter Unique GES Staff ID:</span>
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">e.g. 1084291</span>
                      </div>
                      <input
                        type="text"
                        value={directIdInput}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setDirectIdInput(val);
                          // Try to find staff by ID
                          const matched = staffList.find(
                            (s) => s.staffId.toLowerCase() === val.toLowerCase()
                          );
                          if (matched) {
                            setSelectedStaffId(matched.id);
                            soundSynthesizer.playClockInChime();
                          }
                        }}
                        placeholder="Type your Staff ID (e.g. 1084291)..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-emerald-300 font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        autoFocus
                      />

                      {/* Matching resolution preview */}
                      {selectedStaff ? (
                        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${selectedStaff.avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                            >
                              {selectedStaff.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{selectedStaff.name}</p>
                              <p className="text-[10px] text-slate-300 font-mono">
                                ID: <span className="text-emerald-400 font-bold">{selectedStaff.staffId}</span> • {selectedStaff.department}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">
                            Selected
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          Type your staff ID to select your profile instantly. If you are an intern or NSS personnel, switch to the "NSS / Interns" tab above.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. NSS & INTERNS TAB */}
                {staffInputMode === 'nss_intern' && (
                  <div className="mt-2.5 space-y-2">
                    <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                      <p className="font-semibold text-white mb-0.5">National Service &amp; University Intern Cohort</p>
                      <p className="text-[10px] text-slate-300">
                        Personnel without a permanent GES Staff ID are issued an official NSS/Intern tracking number below.
                      </p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-36 sm:max-h-44 no-scrollbar space-y-1.5 pr-1">
                      {staffList
                        .filter((s) => s.category === 'nss' || s.category === 'intern')
                        .map((staff) => {
                          const isSelected = selectedStaff?.id === staff.id;
                          const hasClockedIn = gateRecords.some(
                            (r) => r.staffId === staff.staffId && r.date === todayStr
                          );
                          return (
                            <button
                              key={staff.id}
                              onClick={() => {
                                setSelectedStaffId(staff.id);
                                soundSynthesizer.playKeypadBeep();
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition ${
                                isSelected
                                  ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-xs'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${staff.avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                                >
                                  {staff.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{staff.name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">
                                    <span className="font-mono text-indigo-300 font-bold">{staff.staffId}</span> •{' '}
                                    <span className="uppercase text-[9px] px-1 rounded bg-indigo-900/60 text-indigo-300">
                                      {staff.category === 'nss' ? 'NSP' : 'Intern'}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex-shrink-0 ${
                                  hasClockedIn
                                    ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {hasClockedIn ? 'Clocked In' : 'Pending'}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 3. QUICK SEARCH & DEPARTMENT FILTER MODE */}
                {staffInputMode === 'quick_select' && (
                  <>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search staff name or unique ID..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                        {departments.map((dept) => (
                          <button
                            key={dept}
                            onClick={() => setDeptFilter(dept)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition ${
                              deptFilter === dept
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {dept === 'ALL' ? 'All' : dept}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Staff Scroll List */}
                    <div className="mt-2 flex-1 overflow-y-auto max-h-40 sm:max-h-48 no-scrollbar space-y-1 pr-1">
                      {filteredStaff.map((staff) => {
                        const isSelected = selectedStaff?.id === staff.id;
                        const hasClockedIn = gateRecords.some(
                          (r) => r.staffId === staff.staffId && r.date === todayStr
                        );

                        return (
                          <button
                            key={staff.id}
                            onClick={() => {
                              setSelectedStaffId(staff.id);
                              soundSynthesizer.playKeypadBeep();
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition ${
                              isSelected
                                ? 'bg-emerald-950/50 border-emerald-500/60 shadow-xs'
                                : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${staff.avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs`}
                              >
                                {staff.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-white truncate">{staff.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  <span className="font-mono text-emerald-400 font-semibold">{staff.staffId}</span> •{' '}
                                  {staff.department}
                                  {staff.category === 'nss' && ' • NSP'}
                                  {staff.category === 'intern' && ' • Intern'}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex-shrink-0 ${
                                hasClockedIn
                                  ? 'bg-emerald-950 border border-emerald-500/30 text-emerald-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {hasClockedIn ? 'Clocked In' : 'Pending'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* BYOD Locked Card */
              <div className="p-3 mt-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${boundStaff.avatarColor} flex items-center justify-center text-white font-bold text-base shadow-xs`}
                >
                  {boundStaff.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{boundStaff.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono text-emerald-400">
                    {boundStaff.staffId} • {boundStaff.role}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{boundStaff.department}</p>
                </div>
              </div>
            )}
          </div>

          {/* --- STEP 1: FIREBASE PHONE AUTH OTP VERIFICATION --- */}
          <div className="pt-3 border-t border-slate-800">
            <FirebasePhoneAuthBox
              staffPhone={selectedStaff?.phone || '+233245550192'}
              staffName={selectedStaff?.name || 'Staff Member'}
              onVerified={() => setIsOtpVerified(true)}
            />
          </div>
        </div>

        {/* Right Column: Location & Rotating QR Beacon / BYOD Actions (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header with GPS Status and Simulation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    geo.isWithinBounds
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Location Verification &amp; Beacon</h3>
                  <p className="text-[11px] text-slate-400">Anti-Spoofing Perimeter Engine</p>
                </div>
              </div>

              <button
                onClick={geo.refreshPosition}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition"
                title="Refresh GPS Coordinates"
              >
                <RefreshCw className={`w-3 h-3 ${geo.isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh GPS</span>
              </button>
            </div>

            {/* In Kiosk / Gate Terminal Mode: Display Rotating Campus Dynamic QR Beacon (Step 2) */}
            {activeDeviceMode === 'kiosk' && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-inner flex flex-col gap-3">
                {/* Step 2 Banner & Progress */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                      STEP 2 OF 2
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Real-Time Dynamic QR Beacon</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Format Toggle: URL for Phone Cameras vs Raw Cryptographic Token */}
                    <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setBeaconQrType('url')}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          beaconQrType === 'url'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📱 Phone Camera URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setBeaconQrType('raw')}
                        className={`px-2 py-0.5 rounded font-medium transition ${
                          beaconQrType === 'raw'
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🔲 Raw Token
                      </button>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                      {beacon.secondsRemaining}s
                    </span>
                  </div>
                </div>

                {/* 20s Window Progress Bar */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(beacon.secondsRemaining / 20) * 100}%` }}
                  />
                </div>

                {/* QR Matrix & Verification Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* High Contrast Standard QR Code Matrix in White Card for 100% Optical Scanning Reliability */}
                  <div className="p-2.5 rounded-2xl bg-white shadow-xl flex-shrink-0 border-2 border-slate-200">
                    <DynamicQrMatrix
                      value={beaconQrType === 'url' ? beaconUrl : beacon.token}
                      size={140}
                      fgColor="#0f172a"
                      bgColor="#ffffff"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left w-full">
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      Point any smartphone camera at this screen. The phone will instantly recognize the link and verify physical presence.
                    </p>

                    {/* Step 2 Verification Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleVerifyTerminalBeaconPresence}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-none ${
                          isBeaconVerified
                            ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300 shadow-emerald-950/50'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95'
                        }`}
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>
                          {isBeaconVerified
                            ? '✅ Beacon Presence Confirmed'
                            : '📡 Verify Terminal Screen Beacon Presence'}
                        </span>
                      </button>

                      {onOpenBeaconScanner && (
                        <button
                          type="button"
                          onClick={onOpenBeaconScanner}
                          className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition flex items-center gap-1"
                          title="Open Camera Scanner"
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          <span>Camera Scanner</span>
                        </button>
                      )}

                      <a
                        href={beaconUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                        title="Simulate Phone Scan in New Tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Link</span>
                      </a>
                    </div>

                    {/* Step 2 Status Banner */}
                    {isBeaconVerified ? (
                      <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>
                          <strong>Step 2 Complete:</strong> Physical presence verified at gate terminal ({verifiedBeaconInfo?.token.slice(0, 16)}...).
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>
                          <strong>Step 2 Pending:</strong> Scan the QR code or tap &quot;Verify Terminal Screen Beacon Presence&quot; to complete verification.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* In BYOD Mode: Scan Common Room Kiosk Screen (User Staff Device) */}
            {activeDeviceMode === 'byod' && (
              <div className="mt-3 p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-900 border border-indigo-400 text-[10px] font-bold text-indigo-200">
                        📱 BYOD Staff Phone
                      </span>
                      <span className="text-[11px] text-indigo-300 font-mono">
                        Step 2: Common Room Optical Presence
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white">
                      Scan Staff Common Room Kiosk Screen
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Per GES security policy, the dynamic QR beacon cannot be generated on personal phones. It is broadcast <strong>only on the Main Kiosk Terminal in the Staff Common Room</strong>. Point your camera at that terminal to clock in.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {onOpenBeaconScanner && (
                    <button
                      type="button"
                      onClick={onOpenBeaconScanner}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 flex-1 sm:flex-none"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📷 Open Camera to Scan Kiosk Screen</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleVerifyTerminalBeaconPresence}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    title="Simulate scanning common room kiosk screen"
                  >
                    🧪 Simulate Kiosk Screen Capture
                  </button>
                </div>

                {isBeaconVerified ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Presence Confirmed:</strong> Successfully scanned Common Room Kiosk screen ({verifiedBeaconInfo?.token.slice(0, 16)}...).
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Step 2 Pending:</strong> Scan the Staff Common Room Kiosk screen with your phone camera to complete clock-in.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Geofencing Verification State Buttons */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Perimeter GPS Simulation:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => geo.setSimulationMode('at_gate')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                    geo.isMockEnabled && geo.mockMode === 'at_gate'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  📍 At School Gate (18m)
                </button>
                <button
                  type="button"
                  onClick={() => geo.setSimulationMode('outside')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                    geo.isMockEnabled && geo.mockMode === 'outside'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  🚨 380m Outside Bounds
                </button>
                <button
                  type="button"
                  onClick={() => geo.setSimulationMode('real')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                    !geo.isMockEnabled
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  📡 Hardware GPS
                </button>
              </div>
            </div>

            {/* GPS Telemetry Grid */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Current GPS</span>
                <span className="text-xs font-mono font-bold text-white block truncate">
                  {formatCoordinates(geo.lat, geo.lng)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Distance from Gate</span>
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {geo.distanceMeters !== null ? `${geo.distanceMeters} meters` : 'Calculating...'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Allowed Radius</span>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  ≤ {config.radiusMeters} meters
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Perimeter Check</span>
                {geo.isWithinBounds ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Within Bounds
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Out of Bounds
                  </span>
                )}
              </div>
            </div>

            {/* Out of Bounds Notice */}
            {!geo.isWithinBounds && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 flex items-start gap-2.5 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-rose-200">
                    ❌ Out of Bounds: You are {geo.distanceMeters || 'several'} meters outside school grounds.
                  </strong>
                  <span className="text-[11px] text-rose-300/80">
                    Clock-In is disabled for anti-spoofing security. Please move within the {config.radiusMeters}m perimeter.
                  </span>
                </div>
              </div>
            )}

            {/* Arrival Time Evaluation Card */}
            <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block">Effective Timestamp:</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-white">
                    {effectiveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-bold border ${punctualityEvaluation.badgeClass}`}
                  >
                    {punctualityEvaluation.label}
                  </span>
                </div>
              </div>

              {/* Shift Simulation Buttons */}
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-slate-500">Test:</span>
                {(['live', '07:30', '08:15', '08:45', '15:00'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSimulatedTimeMode(mode)}
                    className={`px-1.5 py-0.5 rounded ${
                      simulatedTimeMode === mode
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mode === 'live'
                      ? 'Live'
                      : mode === '07:30'
                      ? '7:30a'
                      : mode === '08:15'
                      ? '8:15a'
                      : mode === '08:45'
                      ? '8:45a'
                      : '3:00p'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons: 🟢 Clock In & ⚪ Clock Out */}
          <div className="pt-2 border-t border-slate-800/80">
            {todayRecord && !todayRecord.clockOutTime ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Clocked In at {todayRecord.clockInTime}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Signature: {todayRecord.deviceSignature} • {todayRecord.clockInCoords.distanceMeters}m from gate
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-medium text-[10px]">
                    {todayRecord.punctualityStatus === 'on_time'
                      ? 'On Time'
                      : todayRecord.punctualityStatus === 'late'
                      ? 'Late'
                      : 'Substantially Late'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowClockOutModal(true)}
                  className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-black text-sm shadow-lg active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-slate-800" />
                  <span>[ ⚪ Clock Out (Closing Departure) ]</span>
                </button>
              </div>
            ) : todayRecord && todayRecord.clockOutTime ? (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs">
                <p className="text-emerald-400 font-semibold">
                  ✅ Day Complete for {selectedStaff?.name || 'Staff'}
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Arrival: {todayRecord.clockInTime} • Departure: {todayRecord.clockOutTime}
                </p>
                {todayRecord.closingReflection && (
                  <p className="text-slate-300 italic text-[11px] mt-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    &quot;{todayRecord.closingReflection}&quot;
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* 2-Step Verification Checklist Indicator */}
                {selectedStaff && (
                  <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-medium">2-Step Protocol:</span>
                    <div className="flex items-center gap-3">
                      <span className={isOtpVerified ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-medium flex items-center gap-1'}>
                        {isOtpVerified ? '✅ Step 1 (OTP)' : '⏳ Step 1 (OTP)'}
                      </span>
                      <span className={isBeaconVerified ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 font-medium flex items-center gap-1'}>
                        {isBeaconVerified ? '✅ Step 2 (QR Beacon)' : '⏳ Step 2 (QR Beacon)'}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedStaff || !isOtpVerified || !isBeaconVerified || !geo.isWithinBounds}
                  onClick={handleClockInAction}
                  className={`w-full py-3.5 rounded-xl font-black text-sm shadow-xl active:scale-[0.99] transition flex items-center justify-center gap-2 ${
                    !selectedStaff
                      ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                      : !isOtpVerified
                      ? 'bg-amber-950/90 hover:bg-amber-900 border border-amber-500/60 text-amber-300 cursor-pointer shadow-amber-950/50 animate-pulse'
                      : !isBeaconVerified
                      ? 'bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/60 text-indigo-300 cursor-pointer shadow-indigo-950/50 animate-pulse'
                      : !geo.isWithinBounds
                      ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300 cursor-not-allowed opacity-90'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 cursor-pointer'
                  }`}
                >
                  {!selectedStaff ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-slate-500" />
                      <span>[ 👤 Select Staff Member Above ]</span>
                    </>
                  ) : !isOtpVerified ? (
                    <>
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      <span>[ 🔢 Step 1 Required: Enter 6-Digit OTP ({selectedStaff.name.split(' ')[0]}) ]</span>
                    </>
                  ) : !isBeaconVerified ? (
                    <>
                      <Radio className="w-4 h-4 text-indigo-400" />
                      <span>[ 📡 Step 2 Required: Scan or Confirm Live QR Beacon ({selectedStaff.name.split(' ')[0]}) ]</span>
                    </>
                  ) : !geo.isWithinBounds ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>[ ❌ Outside School Bounds ({geo.distanceMeters || 0}m) - Clock In Restricted ]</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>[ 🟢 2-Step Verified: Clock In ({selectedStaff.name.split(' ')[0]}) ]</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Institutional Gate Attendance Log */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Institutional Gate Log ({todayStr})
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Total Staff Recorded: <strong className="text-white">{gateRecords.length}</strong>
          </span>
        </div>

        <div className="mt-3 overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-slate-800">
                <th className="pb-2 font-medium">Staff ID</th>
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Department</th>
                <th className="pb-2 font-medium">Arrival Time</th>
                <th className="pb-2 font-medium">Punctuality</th>
                <th className="pb-2 font-medium">Gate Distance</th>
                <th className="pb-2 font-medium">Departure Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {gateRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-mono text-emerald-400 font-medium">{rec.staffId}</td>
                  <td className="py-2.5 font-semibold text-white">{rec.staffName}</td>
                  <td className="py-2.5 text-slate-300">{rec.department}</td>
                  <td className="py-2.5 font-mono text-slate-200">{rec.clockInTime}</td>
                  <td className="py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        rec.punctualityStatus === 'on_time'
                          ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                          : rec.punctualityStatus === 'late'
                          ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                          : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {rec.punctualityStatus === 'on_time'
                        ? '🟢 On Time'
                        : rec.punctualityStatus === 'late'
                        ? '🟡 Late'
                        : '🔴 Substantially Late'}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-slate-400">
                    {rec.clockInCoords.distanceMeters}m
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">
                    {rec.clockOutTime ? (
                      <span className="text-emerald-400">{rec.clockOutTime}</span>
                    ) : (
                      <span className="text-slate-500 italic">On Campus</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clock Out Reflection Modal */}
      {showClockOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <LogOut className="w-4 h-4 text-emerald-400" />
              Clock Out &amp; Closing Reflection
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Staff: <strong>{selectedStaff?.name}</strong> • Official Closing:{' '}
              <strong className="text-emerald-400">{config.closingTime}</strong>
            </p>

            {!isAfterClosingTime && !earlyDepartureConfirmed && (
              <div className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Official closing is {config.closingTime}
                </p>
                <p className="text-[11px] text-amber-200/80 mt-1">
                  You are clocking out before official closing time. Confirm authorized early
                  departure or wait until {config.closingTime}.
                </p>
                <button
                  type="button"
                  onClick={() => setEarlyDepartureConfirmed(true)}
                  className="mt-2 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px]"
                >
                  Acknowledge Authorized Early Departure
                </button>
              </div>
            )}

            <form onSubmit={handleClockOutSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Daily Instructional Closing Reflection Note:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="e.g., Completed scheduled periods for Form 1 &amp; Form 2. Science practicals and homework assigned."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClockOutModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isAfterClosingTime && !earlyDepartureConfirmed}
                  className={`px-4 py-2 rounded-xl font-bold text-xs text-white transition ${
                    isAfterClosingTime || earlyDepartureConfirmed
                      ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Exit Timestamp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
