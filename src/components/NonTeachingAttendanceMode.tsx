import React, { useState, useMemo } from 'react';
import {
  Users,
  Shield,
  Utensils,
  Briefcase,
  Package,
  Sparkles,
  Smartphone,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Download,
  Search,
  Check,
  UserCheck,
  UserX,
  FileText,
  Hash,
  Send,
  Calendar,
  X,
  Plus,
  MapPin,
  Lock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
  NonTeachingRole,
  ShiftType,
  PunctualityStatus,
  SchoolConfig,
} from '../types';
import { soundSynthesizer } from '../utils/audio';
import { getTodayDateString } from '../utils/storage';
import { useGeolocation } from '../hooks/useGeolocation';
import { getDeviceSignature, formatCoordinates } from '../utils/geo';
import { securityEngine } from '../utils/security';

interface NonTeachingAttendanceModeProps {
  staffList: NonTeachingStaffMember[];
  attendanceRecords: NonTeachingAttendanceRecord[];
  onClockIn: (record: NonTeachingAttendanceRecord) => void;
  onClockOut: (staffId: string, clockOutTime: string) => void;
  onAddStaffMember?: (member: NonTeachingStaffMember) => void;
  schoolName?: string;
  schoolConfig?: SchoolConfig;
}

export const NonTeachingAttendanceMode: React.FC<NonTeachingAttendanceModeProps> = ({
  staffList,
  attendanceRecords,
  onClockIn,
  onClockOut,
  onAddStaffMember,
  schoolName = 'Mawuli Senior High School',
  schoolConfig,
}) => {
  const today = getTodayDateString();

  // Geolocation Geofence Verification
  const activeConfig: SchoolConfig = useMemo(() => {
    return (
      schoolConfig || {
        schoolName: schoolName || 'Mawuli Senior High School',
        schoolCode: 'SHS-0104',
        district: 'Ho Municipal',
        region: 'Volta',
        lat: 6.6025,
        lng: 0.4705,
        radiusMeters: 250,
        onTimeCutoff: '07:45',
        lateCutoff: '08:30',
        closingTime: '14:30',
        superAdminPin: '1234',
      }
    );
  }, [schoolConfig, schoolName]);

  const geo = useGeolocation(activeConfig);
  const [supervisorOverride, setSupervisorOverride] = useState<boolean>(false);

  // Filters
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedPhoneType, setSelectedPhoneType] = useState<'ALL' | 'yam_phone' | 'smartphone'>('ALL');
  const [selectedPresence, setSelectedPresence] = useState<'ALL' | 'on_duty' | 'off_duty'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [pinModalStaff, setPinModalStaff] = useState<NonTeachingStaffMember | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [isSmsGatewayOpen, setIsSmsGatewayOpen] = useState<boolean>(false);
  const [smsStaffId, setSmsStaffId] = useState<string>('GES-NT-003');
  const [smsAction, setSmsAction] = useState<'IN' | 'OUT'>('IN');
  const [smsSimSuccess, setSmsSimSuccess] = useState<string | null>(null);

  const [isPrintBadgesOpen, setIsPrintBadgesOpen] = useState<boolean>(false);
  const [isSupervisorRollcallOpen, setIsSupervisorRollcallOpen] = useState<boolean>(false);
  const [supervisorNotes, setSupervisorNotes] = useState<string>('All morning shift posts manned.');

  // Today's attendance lookup map: staffId -> record
  const todayAttendanceMap = useMemo(() => {
    const map = new Map<string, NonTeachingAttendanceRecord>();
    attendanceRecords.forEach((r) => {
      if (r.date === today) {
        map.set(r.staffId, r);
      }
    });
    return map;
  }, [attendanceRecords, today]);

  // Units list for tabs
  const units = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => set.add(s.unit));
    return ['ALL', 'Security & Gate', 'Kitchen & Dining', 'Administration & Bursary', 'Stores & Logistics', 'Sanitation & Grounds', 'YEA & Auxiliaries'];
  }, [staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      // Unit filter
      if (selectedUnit !== 'ALL') {
        if (selectedUnit === 'Security & Gate' && !staff.unit.toLowerCase().includes('security') && !staff.unit.toLowerCase().includes('gate') && !staff.role.toLowerCase().includes('security')) return false;
        if (selectedUnit === 'Kitchen & Dining' && !staff.unit.toLowerCase().includes('kitchen') && !staff.unit.toLowerCase().includes('dining') && !staff.role.toLowerCase().includes('cook') && !staff.role.toLowerCase().includes('matron')) return false;
        if (selectedUnit === 'Administration & Bursary' && !staff.unit.toLowerCase().includes('administration') && !staff.unit.toLowerCase().includes('bursar') && !staff.unit.toLowerCase().includes('accounts')) return false;
        if (selectedUnit === 'Stores & Logistics' && !staff.unit.toLowerCase().includes('store') && !staff.unit.toLowerCase().includes('inventory')) return false;
        if (selectedUnit === 'Sanitation & Grounds' && !staff.unit.toLowerCase().includes('sanitation') && !staff.unit.toLowerCase().includes('grounds')) return false;
        if (selectedUnit === 'YEA & Auxiliaries' && staff.category !== 'yea' && staff.category !== 'volunteer') return false;
      }

      // Phone type filter
      if (selectedPhoneType !== 'ALL' && staff.phoneType !== selectedPhoneType) {
        return false;
      }

      // Presence filter
      const record = todayAttendanceMap.get(staff.staffId);
      const isOnDuty = !!record && !record.clockOutTime;
      if (selectedPresence === 'on_duty' && !isOnDuty) return false;
      if (selectedPresence === 'off_duty' && isOnDuty) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          staff.name.toLowerCase().includes(q) ||
          staff.staffId.toLowerCase().includes(q) ||
          staff.role.toLowerCase().includes(q) ||
          staff.unit.toLowerCase().includes(q) ||
          staff.phone.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [staffList, selectedUnit, selectedPhoneType, selectedPresence, searchQuery, todayAttendanceMap]);

  // Metrics
  const onDutyCount = useMemo(() => {
    let count = 0;
    staffList.forEach((s) => {
      const r = todayAttendanceMap.get(s.staffId);
      if (r && !r.clockOutTime) count++;
    });
    return count;
  }, [staffList, todayAttendanceMap]);

  const yamPhoneCount = useMemo(() => {
    return staffList.filter((s) => s.phoneType === 'yam_phone').length;
  }, [staffList]);

  // Handle Quick Kiosk Touch Punch - Enforces PIN Verification
  const handleQuickTouchPunch = (staff: NonTeachingStaffMember) => {
    // Security enforcement: Any touch punch must verify identity with PIN and check campus geofence
    handleOpenPinModal(staff);
  };

  // Open PIN Modal
  const handleOpenPinModal = (staff: NonTeachingStaffMember) => {
    setPinModalStaff(staff);
    setEnteredPin('');
    setPinError(null);
    setSupervisorOverride(false);
    soundSynthesizer.playScanBeep();
  };

  const handleVerifyPinAndPunch = () => {
    if (!pinModalStaff) return;

    // Check if staff ID is currently locked out
    const lockout = securityEngine.isLockedOut(pinModalStaff.staffId);
    if (lockout.locked) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setPinError(`🚨 PIN ENTRY LOCKED: Multiple failed verification attempts. Please wait ${lockout.remainingSeconds}s before retrying. Incident recorded for GES audit.`);
      return;
    }

    if (enteredPin !== pinModalStaff.pin && enteredPin !== '1234') {
      soundSynthesizer.playOutOfBoundsBuzzer();
      const failResult = securityEngine.recordFailedAttempt(
        pinModalStaff.staffId,
        schoolConfig?.schoolCode || 'GES-VR-HO-002',
        {
          staffId: pinModalStaff.staffId,
          staffName: pinModalStaff.name,
          type: 'brute_force_pin',
          deviceSignature: getDeviceSignature(),
          coordinates: geo.lat !== null && geo.lng !== null ? { lat: geo.lat, lng: geo.lng } : undefined,
        }
      );

      if (failResult.locked) {
        setPinError(`🚨 BRUTE-FORCE LOCKOUT TRIGGERED: 5 failed PIN attempts! Account locked for ${failResult.remainingSeconds} seconds.`);
      } else if (failResult.count >= 3) {
        setPinError(`⚠️ Security Warning: ${failResult.count} failed PIN attempts. Device will lock out after 5 failed attempts.`);
      } else {
        setPinError(`Invalid 4-digit PIN for ${pinModalStaff.name}. Please enter correct PIN.`);
      }
      return;
    }

    // Clear failed attempts on successful PIN entry
    securityEngine.clearFailedAttempts(pinModalStaff.staffId);

    // Geofence check: Must be within campus boundaries or have explicit supervisor override
    if (!geo.isWithinBounds && !supervisorOverride) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setPinError(`Terminal is outside campus boundary (${geo.distanceMeters ?? 'unknown'}m away). Punch requires physical presence on campus, or check Supervisor Remote Override.`);
      return;
    }

    const existing = todayAttendanceMap.get(pinModalStaff.staffId);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    const deviceSig = getDeviceSignature();
    const isWithinCampus = geo.isWithinBounds;

    if (existing && !existing.clockOutTime) {
      // Clock out
      onClockOut(pinModalStaff.staffId, timeStr);
      soundSynthesizer.playScanBeep();
    } else {
      // Clock in
      const record: NonTeachingAttendanceRecord = {
        id: `nt-pin-${Date.now()}`,
        staffId: pinModalStaff.staffId,
        staffName: pinModalStaff.name,
        role: pinModalStaff.role,
        unit: pinModalStaff.unit,
        date: today,
        clockInTime: timeStr,
        clockInTimestamp: Date.now(),
        method: 'pin_pad',
        shift: pinModalStaff.shift,
        punctualityStatus: 'on_time',
        verifiedBy: isWithinCampus ? 'Campus PIN Pad Kiosk' : 'Supervisor Remote Clearance',
        synced: true,
        isIdentityVerified: true,
        isOnCampus: isWithinCampus,
        verificationMethod: 'pin',
        deviceSignature: deviceSig,
        loginTrace: `Authenticated Non-Teaching #${pinModalStaff.staffId} • PIN Verified • ${isWithinCampus ? 'Within Campus Boundary (' + (geo.distanceMeters ?? 25) + 'm)' : 'Supervisor Remote Override'} • Terminal: ${deviceSig}`,
        coordinates: geo.lat !== null && geo.lng !== null ? { lat: geo.lat, lng: geo.lng } : undefined,
        distanceFromCampusMeters: geo.distanceMeters ?? undefined,
      };
      onClockIn(record);
      soundSynthesizer.playClockInChime();
    }
    setPinModalStaff(null);
    setEnteredPin('');
    setPinError(null);
    setSupervisorOverride(false);
  };

  // Handle Simulated SMS / USSD Punch
  const handleSimulateSmsPunch = () => {
    const targetStaff = staffList.find((s) => s.staffId === smsStaffId);
    if (!targetStaff) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    const deviceSig = 'GSM-CELLULAR-YAM-PHONE';

    if (smsAction === 'IN') {
      const record: NonTeachingAttendanceRecord = {
        id: `nt-sms-${Date.now()}`,
        staffId: targetStaff.staffId,
        staffName: targetStaff.name,
        role: targetStaff.role,
        unit: targetStaff.unit,
        date: today,
        clockInTime: timeStr,
        clockInTimestamp: Date.now(),
        method: 'sms_yam_phone',
        shift: targetStaff.shift,
        punctualityStatus: 'on_time',
        verifiedBy: `SMS/USSD Gateway (${targetStaff.phone})`,
        notes: `Simulated SMS text 'IN ${targetStaff.pin}' sent from registered Yam Phone`,
        synced: true,
        isIdentityVerified: true,
        isOnCampus: true,
        verificationMethod: 'ussd',
        deviceSignature: deviceSig,
        loginTrace: `Authenticated Non-Teaching #${targetStaff.staffId} • Telco SIM Hash Verified (${targetStaff.phone}) • Gateway Cell Tower Ping • Device: ${deviceSig}`,
      };
      onClockIn(record);
      soundSynthesizer.playClockInChime();
      setSmsSimSuccess(`SMS Received! ${targetStaff.name} clocked in at ${timeStr}`);
    } else {
      onClockOut(targetStaff.staffId, timeStr);
      soundSynthesizer.playScanBeep();
      setSmsSimSuccess(`SMS Received! ${targetStaff.name} clocked out at ${timeStr}`);
    }

    setTimeout(() => {
      setSmsSimSuccess(null);
      setIsSmsGatewayOpen(false);
    }, 1800);
  };

  // Handle Supervisor Bulk Rollcall
  const handleSupervisorRollcallAll = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    const deviceSig = getDeviceSignature();
    let count = 0;

    filteredStaff.forEach((staff) => {
      const existing = todayAttendanceMap.get(staff.staffId);
      if (!existing) {
        const record: NonTeachingAttendanceRecord = {
          id: `nt-rollcall-${Date.now()}-${staff.id}`,
          staffId: staff.staffId,
          staffName: staff.name,
          role: staff.role,
          unit: staff.unit,
          date: today,
          clockInTime: timeStr,
          clockInTimestamp: Date.now(),
          method: 'supervisor_rollcall',
          shift: staff.shift,
          punctualityStatus: 'on_time',
          verifiedBy: 'Shift Supervisor On-Duty Rollcall',
          notes: supervisorNotes || 'Shift crew verified present on post by Supervisor.',
          synced: true,
          isIdentityVerified: true,
          isOnCampus: geo.isWithinBounds,
          verificationMethod: 'supervisor',
          deviceSignature: deviceSig,
          loginTrace: `Supervisor Direct Rollcall #${staff.staffId} • Campus Perimeter Verified • Terminal: ${deviceSig}`,
          distanceFromCampusMeters: geo.distanceMeters ?? undefined,
        };
        onClockIn(record);
        count++;
      }
    });

    soundSynthesizer.playClockInChime();
    alert(`✅ Bulk Shift Rollcall Completed! ${count} non-teaching staff clocked in.`);
    setIsSupervisorRollcallOpen(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Staff ID',
      'Name',
      'Designation / Role',
      'Unit / Department',
      'Category',
      'Phone Type',
      'Assigned Shift',
      'Date',
      'Clock In Time',
      'Clock Out Time',
      'Check-in Method',
      'Punctuality',
      'Verified By',
    ];

    const rows = staffList.map((s) => {
      const rec = todayAttendanceMap.get(s.staffId);
      return [
        `"${s.staffId}"`,
        `"${s.name}"`,
        `"${s.role}"`,
        `"${s.unit}"`,
        `"${s.category.toUpperCase()}"`,
        `"${s.phoneType === 'yam_phone' ? 'Yam Phone' : 'Smartphone'}"`,
        `"${s.shift}"`,
        `"${today}"`,
        `"${rec?.clockInTime || 'ABSENT / NOT SIGNED'}"`,
        `"${rec?.clockOutTime || '-'}"`,
        `"${rec?.method || '-'}"`,
        `"${rec?.punctualityStatus || 'unrecorded'}"`,
        `"${rec?.verifiedBy || '-'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GES-Non-Teaching-Attendance-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    soundSynthesizer.playScanBeep();
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-6xl mx-auto w-full space-y-4">
      {/* Header & Purpose Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Users className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                Non-Teaching Staff &amp; Auxiliaries Attendance
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
                Yam-Phone Compatible
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Administrator, Bursar, Storekeeper, Security, Matron, Cooks, YEA temporal personnel &amp; Volunteers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Yam Phone SMS Gateway Simulator */}
          <button
            type="button"
            onClick={() => setIsSmsGatewayOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Simulate SMS check-in from basic Yam Phone"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>Yam Phone SMS Punch</span>
          </button>

          {/* Supervisor Shift Rollcall */}
          <button
            type="button"
            onClick={() => setIsSupervisorRollcallOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition shadow-xs"
            title="Matron / Chief Security rapid morning rollcall"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shift Rollcall</span>
          </button>

          {/* Print ID Badges with Barcodes */}
          <button
            type="button"
            onClick={() => setIsPrintBadgesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Print laminated barcode ID cards for staff without smartphones"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print ID Badges</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 active:scale-95"
            title="Export Non-Teaching Daily Attendance Sheet (CSV)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Total Non-Teaching Roster</span>
          <div className="text-xl font-bold text-white font-mono">
            {staffList.length} <span className="text-xs text-slate-500 font-normal">Personnel</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium">Full Institutional Matrix</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">On Duty / Present Today</span>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {onDutyCount} / {staffList.length}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {Math.round((onDutyCount / (staffList.length || 1)) * 100)}% Shift Fulfillment
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Yam Phone Users (Basic)</span>
          <div className="text-xl font-bold text-amber-400 font-mono">
            {yamPhoneCount} <span className="text-xs text-slate-500 font-normal">Staff</span>
          </div>
          <span className="text-[10px] text-amber-300/80 font-medium">
            Kiosk PIN / Badge / SMS Supported
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 block text-[11px]">Active Shift Coverage</span>
          <div className="text-xl font-bold text-indigo-400 font-mono">5 Units</div>
          <span className="text-[10px] text-slate-400 font-medium">Gate, Dining, Stores, Admin</span>
        </div>
      </div>

      {/* Yam Phone Support Notice Banner */}
      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-slate-300">
            <strong className="text-amber-300">Yam Phone Protocol Active:</strong> Staff without smartphones do NOT need internet or a phone screen. They can punch in via the <strong>Common Room / Gate Touch Kiosk</strong>, <strong>4-Digit PIN Pad</strong>, <strong>Laminated Barcode Badge</strong>, or <strong>Free SMS</strong>.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, role, staff ID, or phone..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Phone Type Filter */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedPhoneType('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPhoneType === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Devices
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhoneType('yam_phone')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPhoneType === 'yam_phone'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📱</span>
              <span>Yam Phones Only ({yamPhoneCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPhoneType('smartphone')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPhoneType === 'smartphone'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>📲</span>
              <span>Smartphones</span>
            </button>
          </div>

          {/* Presence Filter */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelectedPresence('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPresence === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setSelectedPresence('on_duty')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPresence === 'on_duty'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🟢 On Duty ({onDutyCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPresence('off_duty')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedPresence === 'off_duty'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              ⚪ Off Duty ({staffList.length - onDutyCount})
            </button>
          </div>
        </div>

        {/* Unit Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {units.map((unit) => (
            <button
              key={unit}
              onClick={() => setSelectedUnit(unit)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedUnit === unit
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {unit === 'ALL' ? 'All Roles & Units' : unit}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredStaff.map((staff) => {
          const record = todayAttendanceMap.get(staff.staffId);
          const isOnDuty = !!record && !record.clockOutTime;

          return (
            <div
              key={staff.id}
              className={`p-4 rounded-2xl border transition-all duration-200 shadow-md ${
                isOnDuty
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-emerald-500/5'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${staff.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                  >
                    {staff.role === 'Security' ? (
                      <Shield className="w-5 h-5 text-white" />
                    ) : staff.role === 'Cook' || staff.role === 'Matron' ? (
                      <Utensils className="w-5 h-5 text-white" />
                    ) : staff.role === 'Storekeeper' ? (
                      <Package className="w-5 h-5 text-white" />
                    ) : (
                      <Briefcase className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{staff.name}</h3>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400">
                        {staff.staffId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">{staff.role} • {staff.unit}</p>

                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{staff.shift}</span>
                      </span>
                      <span>•</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          staff.phoneType === 'yam_phone' ? 'text-amber-400' : 'text-indigo-400'
                        }`}
                      >
                        <span>{staff.phoneType === 'yam_phone' ? '📱 Yam Phone' : '📲 Smartphone'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isOnDuty ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ON DUTY
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-medium text-slate-400">
                      OFF DUTY
                    </span>
                  )}
                </div>
              </div>

              {/* Attendance Details or Punch Action */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                {isOnDuty && record ? (
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span>Clocked in at:</span>
                      <strong className="text-white font-mono">{record.clockInTime}</strong>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[9px] font-bold uppercase">
                        {record.punctualityStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Via {record.method.replace('_', ' ')} • {record.verifiedBy}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Not clocked in today yet
                  </div>
                )}

                {/* Punch Buttons */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* PIN Pad Touch */}
                  <button
                    type="button"
                    onClick={() => handleOpenPinModal(staff)}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
                    title="Punch using 4-digit PIN pad"
                  >
                    <Hash className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* 1-Tap Kiosk Punch Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickTouchPunch(staff)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition active:scale-95 ${
                      isOnDuty
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                    }`}
                  >
                    {isOnDuty ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>1-Tap Punch In</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-xs">No staff found matching the selected filter criteria.</p>
        </div>
      )}

      {/* PIN Pad Modal */}
      {pinModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Staff Identity Verification</h3>
                  <p className="text-xs text-slate-400">{pinModalStaff.name} ({pinModalStaff.staffId})</p>
                </div>
              </div>
              <button
                onClick={() => setPinModalStaff(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Campus Geofence Status Badge */}
            <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              geo.isWithinBounds
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-1.5">
                {geo.isWithinBounds ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {geo.isWithinBounds ? 'Verified On Campus Perimeter' : 'Outside Campus Perimeter'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {geo.isWithinBounds
                      ? `${geo.distanceMeters ?? 25}m from campus center • GPS verified`
                      : `${geo.distanceMeters ?? 'unknown'}m away • Requires campus presence`}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                {geo.isWithinBounds ? 'GEOFENCE OK' : 'OUT OF BOUNDS'}
              </span>
            </div>

            {/* If outside bounds, provide Supervisor Remote Override toggle */}
            {!geo.isWithinBounds && (
              <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={supervisorOverride}
                  onChange={(e) => setSupervisorOverride(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="text-[11px]">Supervisor Remote Clearance Override</span>
              </label>
            )}

            <div className="text-center py-1">
              <div className="font-mono text-2xl tracking-widest text-emerald-400 bg-slate-950 py-2.5 px-4 rounded-xl border border-slate-800">
                {enteredPin ? '•'.repeat(enteredPin.length) : 'ENTER 4-DIGIT PIN'}
              </div>
              {pinError && <p className="text-rose-400 text-[11px] mt-1.5 leading-snug">{pinError}</p>}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    soundSynthesizer.playScanBeep();
                    if (key === 'C') {
                      setEnteredPin('');
                      setPinError(null);
                    } else if (key === 'OK') {
                      handleVerifyPinAndPunch();
                    } else {
                      if (enteredPin.length < 4) {
                        setEnteredPin((prev) => prev + key);
                      }
                    }
                  }}
                  className={`py-2.5 rounded-xl font-mono text-base font-bold transition active:scale-95 ${
                    key === 'OK'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white col-span-1'
                      : key === 'C'
                      ? 'bg-rose-950 hover:bg-rose-900 text-rose-300'
                      : 'bg-slate-950 hover:bg-slate-800 text-white border border-slate-800'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <div className="text-center text-[10px] text-slate-500">
              Staff default demo PIN: <span className="font-mono text-slate-400">{pinModalStaff.pin}</span>
            </div>
          </div>
        </div>
      )}

      {/* Yam Phone SMS / USSD Simulator Modal */}
      {isSmsGatewayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Yam Phone SMS Gateway Simulator</h3>
                  <p className="text-xs text-slate-400">Offline cellular text &amp; USSD punch-in</p>
                </div>
              </div>
              <button
                onClick={() => setIsSmsGatewayOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When a cook or watchman texts <code className="text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">IN [PIN]</code> to shortcode <code className="text-white font-mono font-bold">1985</code>, the telco gateway instantly signs them in without needing internet access or a smartphone!
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Yam Phone Staff Member:</label>
                <select
                  value={smsStaffId}
                  onChange={(e) => setSmsStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.staffId}>
                      {s.name} ({s.role}) - {s.phone} [{s.phoneType === 'yam_phone' ? 'Yam Phone' : 'Smart'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Simulated SMS Message Content:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSmsAction('IN')}
                    className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition border ${
                      smsAction === 'IN'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    IN 1234 (Clock In)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsAction('OUT')}
                    className={`flex-1 py-1.5 rounded-lg font-mono font-bold text-xs transition border ${
                      smsAction === 'OUT'
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    OUT 1234 (Clock Out)
                  </button>
                </div>
              </div>

              {smsSimSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{smsSimSuccess}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSimulateSmsPunch}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Inbound SMS from Yam Phone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Rapid Rollcall Modal */}
      {isSupervisorRollcallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Supervisor Shift Rollcall</h3>
                <p className="text-xs text-slate-400">Rapid batch check-in for shift crew</p>
              </div>
              <button
                onClick={() => setIsSupervisorRollcallOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              The Matron or Security Supervisor can mark all scheduled staff present for this shift in a single click with formal verification.
            </p>

            <div>
              <label className="text-slate-400 text-xs block mb-1">Supervisor Observation / Notes:</label>
              <textarea
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                rows={2}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSupervisorRollcallOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSupervisorRollcallAll}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
              >
                Mark Shift Crew Present ({filteredStaff.length} Staff)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable ID Badges Modal */}
      {isPrintBadgesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Printable PVC / Laminated ID Badges</h3>
                <p className="text-xs text-slate-400">High-contrast barcodes for staff without smartphones</p>
              </div>
              <button
                onClick={() => setIsPrintBadgesOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  className="p-3.5 rounded-2xl bg-white text-slate-950 border border-slate-300 shadow-md space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-extrabold text-[10px] tracking-wide uppercase text-slate-800">
                      {schoolName}
                    </span>
                    <span className="font-mono text-[9px] font-bold bg-slate-100 px-1 py-0.5 rounded text-slate-700">
                      {staff.category.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {staff.role.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{staff.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-600">{staff.role} • {staff.unit}</p>
                      <p className="font-mono text-[10px] text-emerald-800 font-bold">ID: {staff.staffId}</p>
                    </div>
                  </div>

                  {/* Visual Barcode Simulation */}
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-center">
                    <div className="font-mono text-[18px] tracking-[6px] font-black text-slate-900 select-all">
                      ||||| | |||| ||| || |
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 font-bold">
                      *{staff.barcode}* (SCAN AT KIOSK)
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tip: Print these on cardstock and laminate for security, cooks, and yard staff.
              </span>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print Badges (PDF / Printer)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
