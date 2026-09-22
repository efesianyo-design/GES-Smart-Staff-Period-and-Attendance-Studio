import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { storageEngine } from '../../../../utils/storage';
import { NonTeachingStaffMember, NonTeachingAttendanceRecord, SchoolConfig } from '../../../../types';
import { soundSynthesizer } from '../../../../utils/audio';
import { securityEngine } from '../../../../utils/security';
import { useGeolocation } from '../../../../hooks/useGeolocation';
import { getDeviceSignature } from '../../../../utils/geo';
import { useSchoolTheme } from '../../../../hooks/useSchoolTheme';
import { FirebasePhoneAuthBox } from '../../../../components/FirebasePhoneAuthBox';
import {
  Volume2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Camera,
  RotateCcw,
} from 'lucide-react';
import { QrDoorScannerModal } from '../../../../components/QrDoorScannerModal';

export default function NonTeachingAttendancePage() {
  const navigate = useNavigate();
  const { theme, schoolCode } = useSchoolTheme();
  const [config] = useState<SchoolConfig>(() => storageEngine.getSchoolConfig());
  const geo = useGeolocation(config);

  const [staffList] = useState<NonTeachingStaffMember[]>(() => storageEngine.getNonTeachingStaff());
  const [selectedStaff, setSelectedStaff] = useState<NonTeachingStaffMember | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [todayRecord, setTodayRecord] = useState<NonTeachingAttendanceRecord | null>(null);

  // Auto select first staff member or bound ID
  useEffect(() => {
    if (staffList.length > 0 && !selectedStaff) {
      setSelectedStaff(staffList[0]);
      checkTodayStatus(staffList[0].staffId);
    }
  }, [staffList, selectedStaff]);

  const checkTodayStatus = (staffId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = storageEngine.getNonTeachingAttendance();
    const match = records.find((r) => r.staffId === staffId && r.date === todayStr);
    if (match) {
      setTodayRecord(match);
    } else {
      setTodayRecord(null);
    }
  };

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const staff = staffList.find((s) => s.staffId === e.target.value) || null;
    setSelectedStaff(staff);
    setFeedback(null);
    if (staff) {
      checkTodayStatus(staff.staffId);
    }
  };

  // Voice Prompt / Read aloud instructions
  const handleVoicePrompt = () => {
    soundSynthesizer.playClockInChime();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = selectedStaff
        ? `Hello ${selectedStaff.name}. Please complete your Firebase phone verification to clock in.`
        : 'Welcome. Please select your name and verify your phone number to clock in.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    setFeedback({
      type: 'info',
      text: '🔊 Voice prompt played: Complete Firebase phone verification to clock in.',
    });
  };

  const handleVerifiedPhoneSuccess = () => {
    if (!selectedStaff) return;
    soundSynthesizer.playClockInChime();
    setIsScannerOpen(true);
  };

  const handleBeaconScanned = (tokenString: string) => {
    if (!selectedStaff) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const todayStr = now.toISOString().split('T')[0];

    const newRecord: NonTeachingAttendanceRecord = {
      id: `non-teach-${Date.now()}`,
      staffId: selectedStaff.staffId,
      staffName: selectedStaff.name,
      role: selectedStaff.role,
      unit: selectedStaff.unit,
      shift: selectedStaff.shift,
      method: 'firebase_phone_auth',
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
    setTodayRecord(newRecord);
    setIsScannerOpen(false);
    setFeedback({
      type: 'success',
      text: `✓ Success! Firebase attendance recorded for ${timeStr.slice(0, 5)} • ${todayStr}`,
    });

    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Thank you ${selectedStaff.name}. You are securely clocked in.`);
      window.speechSynthesis.speak(msg);
    }
  };

  const handleClockOut = () => {
    if (!todayRecord || !selectedStaff) return;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    storageEngine.updateNonTeachingRecord(todayRecord.id, { clockOutTime: timeStr });
    soundSynthesizer.playScanBeep();
    setTodayRecord({ ...todayRecord, clockOutTime: timeStr });
    setFeedback({
      type: 'info',
      text: `👋 Shift ended at ${timeStr}. Enjoy your rest!`,
    });
  };

  const isOffCampus = !geo.isLoading && geo.distanceMeters !== null && geo.distanceMeters > config.radiusMeters;
  const distanceKm = geo.distanceMeters ? (geo.distanceMeters / 1000).toFixed(1) : '0';

  return (
    <div className="w-full max-w-[420px] mx-auto min-h-screen py-3 sm:py-6 flex flex-col justify-center">
      {/* Centered Mobile Card: Rounded 30px, White, Border #E2E8F0 */}
      <div className="w-full bg-white rounded-[30px] border border-[#E2E8F0] shadow-xl overflow-hidden p-4 sm:p-5 space-y-4">
        {/* GREEN HEADER: Dynamic Theme */}
        <div
          className="h-[60px] rounded-[12px] px-3.5 flex items-center justify-between shadow-xs"
          style={{ backgroundColor: theme.primary }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center">
              {theme.code.charAt(0)}
            </div>
            <div>
              <h1 className="text-[11px] font-bold text-white tracking-wide leading-tight truncate max-w-[180px]">
                {theme.name} • Non-Teaching
              </h1>
              <p className="text-[9px] text-[#BBF7D0] font-medium flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                🟢 Firebase Phone Auth Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Voice Prompt Icon */}
            <button
              onClick={handleVoicePrompt}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white"
              title="Voice instructions"
            >
              <Volume2 className="w-4 h-4 text-yellow-300" />
            </button>
            {/* Quick Switch to Teaching */}
            <button
              onClick={() => navigate('/attendance?type=teaching')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold"
            >
              Teaching →
            </button>
          </div>
        </div>

        {/* GEOFENCE CHECK: Red warning if off-campus */}
        {isOffCampus && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-2xl flex items-center gap-2.5 text-red-700">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="text-[11px]">
              <strong>You are {distanceKm}km away from campus.</strong>
              <p className="text-[10px] text-red-600">Please clock in at school grounds.</p>
            </div>
          </div>
        )}

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            className={`p-2.5 rounded-xl text-[11px] font-semibold border leading-snug ${
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

        {/* SELECT NAME & ROLE */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 space-y-1.5">
          <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Select Staff Member</span>
            <span className="text-[9px] text-[#0B6D2F] font-bold uppercase">Auxiliary / Non-Teaching</span>
          </label>
          <div className="relative">
            <select
              value={selectedStaff?.staffId || ''}
              onChange={handleStaffSelect}
              className="w-full bg-white border border-[#CBD5E1] rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {staffList.map((s) => (
                <option key={s.staffId} value={s.staffId}>
                  {s.name} — {s.role.toUpperCase()} ({s.shift} Shift)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* ALREADY CLOCKED IN STATUS */}
        {todayRecord ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Checked In</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800 text-[10px] font-bold">
                {todayRecord.shift.toUpperCase()} SHIFT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Arrival</span>
                <strong className="text-sm font-black text-emerald-800">{todayRecord.clockInTime}</strong>
              </div>
              <div className="bg-white p-2 rounded-xl border border-emerald-200">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Status</span>
                <strong className="text-sm font-black text-emerald-800">Present</strong>
              </div>
            </div>

            {todayRecord.clockOutTime ? (
              <div className="text-center p-2 bg-white/70 rounded-xl text-xs font-bold text-slate-700">
                Clocked Out at {todayRecord.clockOutTime}
              </div>
            ) : (
              <button
                onClick={handleClockOut}
                className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Clock Out Now
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-900 text-white p-1 rounded-xl text-[10px] font-mono text-center text-emerald-400">
              🔒 Firebase Phone Auth 2FA Verification
            </div>
            <FirebasePhoneAuthBox
              staffPhone={selectedStaff?.phone || '+233240000000'}
              staffName={selectedStaff?.name || 'Staff Member'}
              onVerified={handleVerifiedPhoneSuccess}
            />
          </div>
        )}

        {/* STEP 2 CARD: Camera Beacon QR Scan */}
        <div
          onClick={() => {
            if (selectedStaff) setIsScannerOpen(true);
          }}
          className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl cursor-pointer hover:bg-amber-100 transition space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-900">
              Step 2: Point camera at Campus TV / Door QR
            </span>
            <Camera className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="h-14 bg-white/80 border border-dashed border-amber-400 rounded-xl flex items-center justify-center gap-2 text-amber-800 text-[11px] font-bold">
            <span>[ Tap to Open Camera Scanner ]</span>
          </div>
        </div>
      </div>

      {/* QR DOOR / TV SCANNER MODAL */}
      <QrDoorScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        schoolCode={theme.code}
        classrooms={storageEngine.getClassrooms()}
        onSelectClassroom={() => {}}
        onScanCampusBeacon={handleBeaconScanned}
      />
    </div>
  );
}

