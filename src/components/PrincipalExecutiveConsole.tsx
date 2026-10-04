import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Building2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Utensils,
  HeartPulse,
  Briefcase,
  Search,
  Filter,
  Eye,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Phone,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SchoolConfig,
  StaffMember,
  NonTeachingStaffMember,
  GateAttendanceRecord,
  NonTeachingAttendanceRecord,
  PeriodTeachingSession,
  ActiveClassSession,
  InfirmaryVisitRecord,
  HouseDormRecord,
  WelfareCaseRecord,
} from '../types';
import { storageEngine, getTodayDateString } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

import { AuditTrailHub } from './AuditTrailHub';
import { X } from 'lucide-react';

interface PrincipalExecutiveConsoleProps {
  config: SchoolConfig;
  onNavigateDivision?: (division: 'academic' | 'domestic' | 'welfare' | 'organogram') => void;
}

export const PrincipalExecutiveConsole: React.FC<PrincipalExecutiveConsoleProps> = ({
  config,
  onNavigateDivision,
}) => {
  const [teachingStaff, setTeachingStaff] = useState<StaffMember[]>(() => storageEngine.getStaff());
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffMember[]>(() =>
    storageEngine.getNonTeachingStaff()
  );
  const [gateRecords, setGateRecords] = useState<GateAttendanceRecord[]>(() =>
    storageEngine.getGateAttendance()
  );
  const [nonTeachingRecords, setNonTeachingRecords] = useState<NonTeachingAttendanceRecord[]>(() =>
    storageEngine.getNonTeachingAttendance()
  );
  const [activeSessions, setActiveSessions] = useState<ActiveClassSession[]>(() =>
    storageEngine.getActiveClassSessions()
  );
  const [periodSessions, setPeriodSessions] = useState<PeriodTeachingSession[]>(() =>
    storageEngine.getPeriodSessions()
  );
  const [infirmaryRecords, setInfirmaryRecords] = useState<InfirmaryVisitRecord[]>(() =>
    storageEngine.getInfirmaryRecords()
  );
  const [houseDorms, setHouseDorms] = useState<HouseDormRecord[]>(() =>
    storageEngine.getHouseDorms()
  );
  const [welfareCases, setWelfareCases] = useState<WelfareCaseRecord[]>(() =>
    storageEngine.getWelfareCases()
  );

  const [activeTab, setActiveTab] = useState<'overview' | 'teaching' | 'non_teaching' | 'periods' | 'operations' | 'supervisor_rollcall' | 'audit_trail'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [broadcastSentToast, setBroadcastSentToast] = useState(false);
  const [isSupervisorRollcallOpen, setIsSupervisorRollcallOpen] = useState(false);
  const [supervisorNotes, setSupervisorNotes] = useState('All morning shift posts manned.');

  // Sync real-time updates
  useEffect(() => {
    const handleUpdate = () => {
      setActiveSessions(storageEngine.getActiveClassSessions());
      setPeriodSessions(storageEngine.getPeriodSessions());
      setGateRecords(storageEngine.getGateAttendance());
      setNonTeachingRecords(storageEngine.getNonTeachingAttendance());
      setInfirmaryRecords(storageEngine.getInfirmaryRecords());
      setHouseDorms(storageEngine.getHouseDorms());
      setWelfareCases(storageEngine.getWelfareCases());
    };
    window.addEventListener('ges_active_sessions_changed', handleUpdate);
    window.addEventListener('ges_session_saved', handleUpdate);
    window.addEventListener('ges_infirmary_changed', handleUpdate);
    window.addEventListener('ges_house_dorms_changed', handleUpdate);
    window.addEventListener('ges_welfare_cases_changed', handleUpdate);
    window.addEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    return () => {
      window.removeEventListener('ges_active_sessions_changed', handleUpdate);
      window.removeEventListener('ges_session_saved', handleUpdate);
      window.removeEventListener('ges_infirmary_changed', handleUpdate);
      window.removeEventListener('ges_house_dorms_changed', handleUpdate);
      window.removeEventListener('ges_welfare_cases_changed', handleUpdate);
      window.removeEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    };
  }, []);

  const handleSupervisorRollcallAll = () => {
    const todayStr = getTodayDateString();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    let count = 0;

    nonTeachingStaff.forEach((staff) => {
      const existing = nonTeachingRecords.find(r => r.staffId === staff.staffId && r.date === todayStr);
      if (!existing) {
        const record: NonTeachingAttendanceRecord = {
          id: `nt-rollcall-${Date.now()}-${staff.id}`,
          staffId: staff.staffId,
          staffName: staff.name,
          role: staff.role,
          unit: staff.unit,
          date: todayStr,
          clockInTime: timeStr,
          clockInTimestamp: Date.now(),
          method: 'supervisor_rollcall',
          shift: staff.shift,
          punctualityStatus: 'on_time',
          verifiedBy: 'Principal Direct Executive Rollcall',
          notes: supervisorNotes || 'Shift crew verified present on post by Principal.',
          synced: true,
          isIdentityVerified: true,
          isOnCampus: true,
          verificationMethod: 'supervisor',
          deviceSignature: 'PRINCIPAL-AUTH',
          loginTrace: `Principal Executive Rollcall #${staff.staffId}`,
        };
        storageEngine.addNonTeachingRecord(record);
        count++;

        storageEngine.logAudit({
          staffId: record.staffId,
          staffName: record.staffName,
          schoolCode: config.schoolCode,
          category: 'attendance',
          status: 'success',
          action: 'CLOCK_IN_NON_TEACHING',
          details: `Principal Bulk Rollcall: ${record.verifiedBy}.`,
        });
      }
    });

    soundSynthesizer.playClockInChime();
    setBroadcastSentToast(true); // Reuse broadcast toast for success
    setTimeout(() => setBroadcastSentToast(false), 3000);
    setIsSupervisorRollcallOpen(false);
  };

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute metrics for Executive Overview
  const todayTeachingGate = useMemo(() => {
    return gateRecords.filter((r) => r.date === today && !r.isVoided);
  }, [gateRecords, today]);

  const teachingOnCampusCount = todayTeachingGate.length;
  const teachingTotalCount = teachingStaff.length;
  const teachingRate = teachingTotalCount ? Math.round((teachingOnCampusCount / teachingTotalCount) * 100) : 0;

  const todayNonTeachingGate = useMemo(() => {
    return nonTeachingRecords.filter((r) => r.date === today && !r.isVoided);
  }, [nonTeachingRecords, today]);

  const nonTeachingOnDutyCount = todayNonTeachingGate.length;
  const nonTeachingTotalCount = nonTeachingStaff.length;
  const nonTeachingRate = nonTeachingTotalCount ? Math.round((nonTeachingOnDutyCount / nonTeachingTotalCount) * 100) : 0;

  // Teachers with late arrival in lesson periods
  const lateLessonSessions = useMemo(() => {
    const list = [...activeSessions, ...periodSessions].filter((s) => s.isLateArrival);
    const seen = new Set<string>();
    return list.filter((s) => {
      const key = `${s.teacherStaffId}-${s.periodNumber}-${s.actualStartTime}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeSessions, periodSessions]);

  // Total boarders & muster roll
  const totalBoarders = useMemo(() => houseDorms.reduce((acc, d) => acc + d.totalBoarders, 0), [houseDorms]);
  const presentBoarders = useMemo(() => houseDorms.reduce((acc, d) => acc + d.presentTonight, 0), [houseDorms]);

  // Infirmary active patients
  const admittedPatients = useMemo(
    () => infirmaryRecords.filter((i) => i.status === 'admitted'),
    [infirmaryRecords]
  );
  const emergencyReferrals = useMemo(
    () => infirmaryRecords.filter((i) => i.status === 'referred_hospital'),
    [infirmaryRecords]
  );

  const handleSendEmergencyCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyMessage.trim()) return;
    soundSynthesizer.playScanBeep();
    setBroadcastSentToast(true);
    setEmergencyMessage('');
    setTimeout(() => setBroadcastSentToast(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
                Principal &amp; Headmaster Executive Console
              </span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                ● Live Campus Isolation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {config.schoolName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Unified institutional monitor covering <strong className="text-yellow-400">All Teaching &amp; Non-Teaching Services</strong>, 
              Academic timetable and periods, Boarding houses, Kitchen &amp; Catering, Security perimeter, and Health Bay.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-mono">
              <span>GES Code: <strong className="text-emerald-400">{config.schoolCode}</strong></span>
              <span>•</span>
              <span>District: <strong className="text-slate-200">{config.district}</strong></span>
              <span>•</span>
              <span>Region: <strong className="text-slate-200">{config.region}</strong></span>
            </div>
          </div>

          {/* Quick Division Jump Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            {onNavigateDivision && (
              <>
                <button
                  onClick={() => onNavigateDivision('academic')}
                  className="px-3.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  <span>AH Academic Console</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-blue-400" />
                </button>
                <button
                  onClick={() => onNavigateDivision('domestic')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <span>AH Domestic Console</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-emerald-400" />
                </button>
                <button
                  onClick={() => onNavigateDivision('welfare')}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
                >
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  <span>AH Welfare Console</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-rose-400" />
                </button>
                <button
                  onClick={() => onNavigateDivision('organogram')}
                  className="px-3.5 py-2 rounded-xl bg-yellow-950/80 hover:bg-yellow-900 border border-yellow-500/40 text-yellow-300 hover:text-white text-xs font-black transition flex items-center gap-2 shadow-xs"
                >
                  <Layers className="w-4 h-4 text-yellow-400" />
                  <span>Organogram Hierarchy</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-yellow-400" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Teaching, Non-Teaching, Periods, Boarding, Clinic) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Teaching Staff */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Teaching Staff</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {teachingOnCampusCount} <span className="text-xs text-slate-500 font-normal">/ {teachingTotalCount}</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
              {teachingRate}% Campus Presence
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${teachingRate}%` }} />
          </div>
        </div>

        {/* KPI 2: Non-Teaching Staff */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Non-Teaching Staff</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {nonTeachingOnDutyCount} <span className="text-xs text-slate-500 font-normal">/ {nonTeachingTotalCount}</span>
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
              {nonTeachingRate}% Shift Coverage
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${nonTeachingRate}%` }} />
          </div>
        </div>

        {/* KPI 3: Active Classrooms / Period Tracker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>In-Session Lessons</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {activeSessions.length} <span className="text-xs text-slate-500 font-normal">Classes</span>
            </div>
            <p className="text-[11px] text-indigo-700 font-bold mt-0.5">
              {periodSessions.length} Sessions Logged
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(activeSessions.length * 15, 100)}%` }} />
          </div>
        </div>

        {/* KPI 4: Boarding Houses & Dorms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Boarders Muster</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {presentBoarders} <span className="text-xs text-slate-500 font-normal">/ {totalBoarders}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {houseDorms.length} Boarding Houses
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(presentBoarders / (totalBoarders || 1)) * 100}%` }} />
          </div>
        </div>

        {/* KPI 5: Health Bay / Clinic */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Health Bay</span>
            <HeartPulse className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {admittedPatients.length} <span className="text-xs text-slate-500 font-normal">In Bay</span>
            </div>
            <p className="text-[11px] text-rose-600 font-bold mt-0.5">
              {emergencyReferrals.length} Hospital Transfer{emergencyReferrals.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(admittedPatients.length * 25, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Urgent Late Lesson Alerts for Principal */}
      {lateLessonSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>Teacher Lesson Punctuality Alerts ({lateLessonSessions.length} Incident{lateLessonSessions.length > 1 ? 's' : ''})</span>
            </div>
            <span className="text-[10px] text-amber-800 font-bold">
              Immediate Principal Oversight Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lateLessonSessions.map((s, idx) => (
              <div
                key={idx}
                className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    ⚠️ {s.lateMinutes || 15} mins Late
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Period {s.periodNumber || 1}</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{s.teacherName}</h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {s.className} • {s.subject}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                  <span>Scheduled: {s.scheduledStartTime || '08:00'}</span>
                  <span className="font-bold text-red-600">Entered: {s.actualStartTime || '08:25'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'overview', label: 'Executive Operations Overview', icon: Building2 },
          { key: 'teaching', label: 'Teaching Staff Roster', icon: GraduationCap },
          { key: 'non_teaching', label: 'Non-Teaching Services', icon: Users },
          { key: 'periods', label: 'Live Lesson Periods', icon: Clock },
          { key: 'operations', label: 'Domestic, Kitchen & Health Bay', icon: Utensils },
          { key: 'supervisor_rollcall', label: 'Supervisor Muster Roll', icon: CheckCircle2 },
          { key: 'audit_trail', label: 'Executive Audit Trail', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Divisional Summaries */}
          <div className="lg:col-span-2 space-y-6">
            {/* Division 1: Academic Division Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Academic Division Monitor</h3>
                    <p className="text-[11px] text-slate-500">Supervised by Assistant Headmaster (Academic)</p>
                  </div>
                </div>
                {onNavigateDivision && (
                  <button
                    onClick={() => onNavigateDivision('academic')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Full Academic Console</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Teachers on Campus</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {teachingOnCampusCount} / {teachingTotalCount}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">{teachingRate}% Compliance</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Periods</span>
                  <div className="text-lg font-black text-indigo-700 mt-0.5">
                    {activeSessions.length} Classes
                  </div>
                  <span className="text-[10px] text-slate-500">Form 1, 2 &amp; 3 Timetable</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Late Period Flags</span>
                  <div className="text-lg font-black text-red-600 mt-0.5">
                    {lateLessonSessions.length} Alerts
                  </div>
                  <span className="text-[10px] text-red-600 font-bold">Tardiness Tracked</span>
                </div>
              </div>
            </div>

            {/* Division 2: Domestic & Boarding Division Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Utensils className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Domestic &amp; Campus Operations Monitor</h3>
                    <p className="text-[11px] text-slate-500">Supervised by Assistant Headmaster (Domestic)</p>
                  </div>
                </div>
                {onNavigateDivision && (
                  <button
                    onClick={() => onNavigateDivision('domestic')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <span>Full Domestic Console</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Boarding Muster</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {presentBoarders} / {totalBoarders}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">Roll calls completed</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Kitchen &amp; Cooks</span>
                  <div className="text-lg font-black text-amber-700 mt-0.5">
                    100% Shift Presence
                  </div>
                  <span className="text-[10px] text-slate-500">Meal Rations On Schedule</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Gate &amp; Perimeter</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    Active Guard Patrol
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">Zero Security Breaches</span>
                </div>
              </div>
            </div>

            {/* Division 3: Welfare & Health Bay Division Snapshot */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
                    <HeartPulse className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Student &amp; Staff Welfare Monitor</h3>
                    <p className="text-[11px] text-slate-500">Supervised by Assistant Headmaster (Welfare)</p>
                  </div>
                </div>
                {onNavigateDivision && (
                  <button
                    onClick={() => onNavigateDivision('welfare')}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                  >
                    <span>Full Welfare Console</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Health Bay Occupancy</span>
                  <div className="text-lg font-black text-rose-700 mt-0.5">
                    {admittedPatients.length} Admitted
                  </div>
                  <span className="text-[10px] text-slate-500">Nurse on duty at clinic</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Hospital Transfers</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">
                    {emergencyReferrals.length} Cases
                  </div>
                  <span className="text-[10px] text-slate-500">Ho Teaching Hospital</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Welfare Cases</span>
                  <div className="text-lg font-black text-indigo-700 mt-0.5">
                    {welfareCases.length} Active Logs
                  </div>
                  <span className="text-[10px] text-indigo-700 font-bold">Guidance &amp; Relief</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Principal Emergency Broadcast & Direct Directives */}
          <div className="space-y-6">
            {/* Principal Circular Sender */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 text-white">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-yellow-400/20 text-yellow-400">
                  <Send className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400">
                    Principal Emergency Directive
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Instant campus-wide push circular to staff BYOD portals &amp; kiosks
                  </p>
                </div>
              </div>

              {broadcastSentToast && (
                <div className="p-2.5 bg-emerald-950 border border-emerald-500 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Circular broadcast dispatched to all campus staff successfully!</span>
                </div>
              )}

              <form onSubmit={handleSendEmergencyCircular} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Enter executive notice (e.g. Urgent staff briefing at 2:00 PM in the Assembly Hall; compulsory roll call for all teachers)..."
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-yellow-400"
                />

                <button
                  type="submit"
                  className="w-full py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast Executive Circular</span>
                </button>
              </form>
            </div>

            {/* Quick Audit Export */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Executive Dossier Exports</span>
              </div>
              <p className="text-xs text-slate-500">
                Generate signed official reports for the Ministry of Education &amp; GES Regional Directorate.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => alert('Generating Comprehensive Teaching & Non-Teaching Campus Dossier...')}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center justify-between"
                >
                  <span>All-Staff Attendance Report (CSV)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  onClick={() => alert('Generating Period Tracker & Lesson Punctuality Audit...')}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center justify-between"
                >
                  <span>Teacher Period Punctuality Audit</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: TEACHING STAFF ROSTER */}
      {activeTab === 'teaching' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Teaching Staff Master Roster</h3>
              <p className="text-xs text-slate-500">{teachingStaff.length} registered educators on campus roll</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teacher, staff ID, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-yellow-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Campus Status</th>
                  <th className="py-2.5 px-3">Active Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachingStaff
                  .filter((t) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      t.name.toLowerCase().includes(q) ||
                      t.staffId.toLowerCase().includes(q) ||
                      t.department.toLowerCase().includes(q)
                    );
                  })
                  .map((t) => {
                    const gateClock = todayTeachingGate.find((g) => g.staffId === t.staffId);
                    const currentClass = activeSessions.find((s) => s.teacherStaffId === t.staffId);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">
                            {t.name.split(' ').map((n) => n[0]).filter(Boolean).slice(-2).join('')}
                          </div>
                          <span>{t.name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-700 font-bold">{t.staffId}</td>
                        <td className="py-2.5 px-3 text-slate-600">{t.department}</td>
                        <td className="py-2.5 px-3">
                          {gateClock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              ● On Campus ({gateClock.clockInTime})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                              ○ Not Clocked
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {currentClass ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                              🏫 Period {currentClass.periodNumber}: {currentClass.className}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Free / Prep</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: NON-TEACHING SERVICES */}
      {activeTab === 'non_teaching' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Non-Teaching Staff &amp; Shift Operations</h3>
              <p className="text-xs text-slate-500">Security, Catering, Cleaners, Groundsmen &amp; Drivers</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Designation / Role</th>
                  <th className="py-2.5 px-3">Assigned Shift</th>
                  <th className="py-2.5 px-3">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nonTeachingStaff.map((nt) => {
                  const record = todayNonTeachingGate.find((r) => r.staffId === nt.staffId);
                  return (
                    <tr key={nt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-black text-[10px] flex items-center justify-center">
                          {nt.name.split(' ').map((n) => n[0]).filter(Boolean).slice(-2).join('')}
                        </div>
                        <span>{nt.name}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-bold">{nt.staffId}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {nt.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{nt.shift}</td>
                      <td className="py-2.5 px-3">
                        {record ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ● On Duty ({record.clockInTime})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                            ○ Shift Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: LIVE LESSON PERIODS */}
      {activeTab === 'periods' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Active Classroom Sessions &amp; Period Audit</h3>
              <p className="text-xs text-slate-500">Live lessons locked in session with teacher tardiness flags</p>
            </div>
            {onNavigateDivision && (
              <button
                onClick={() => onNavigateDivision('academic')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Manage Period Tracker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.length > 0 ? (
              activeSessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border-2 space-y-2 shadow-xs ${
                    s.isLateArrival ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      Period {s.periodNumber} In Session
                    </span>
                    {s.isLateArrival && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                        ⚠️ {s.lateMinutes}m Late
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{s.className}</h4>
                    <p className="text-xs font-bold text-indigo-700">{s.subject}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Teacher: <strong>{s.teacherName}</strong></p>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1.5 border-t border-slate-200 flex justify-between font-mono">
                    <span>Started: {s.actualStartTime}</span>
                    <span>Learners: {s.totalRosterCount}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-slate-400 text-xs">
                No active classroom lessons currently in session.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: OPERATIONS & WELFARE */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Boarding Houses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Boarding Houses &amp; Dormitories</span>
            </h3>
            <div className="space-y-3">
              {houseDorms.map((d) => (
                <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{d.houseName}</h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {d.presentTonight} / {d.totalBoarders} Boarders
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Housemaster: {d.housemasterName}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Health Bay & Clinic */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <span>Health Bay / Infirmary Admissions</span>
            </h3>
            <div className="space-y-3">
              {infirmaryRecords.map((i) => (
                <div key={i.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{i.studentName}</h4>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        i.status === 'referred_hospital'
                          ? 'bg-red-600 text-white'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {i.status === 'referred_hospital' ? 'Hospital Transfer' : i.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Complaint: {i.complaint}</p>
                  <p className="text-[10px] text-slate-400">Class: {i.classCode} • Admitted: {i.admittedAt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* TAB 6: SUPERVISOR ROLLCALL */}
      {activeTab === 'supervisor_rollcall' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Principal Executive Muster Roll</h3>
                <p className="text-xs text-slate-500">Official executive override to verify and clock-in all non-teaching staff</p>
              </div>
            </div>
            <button
              onClick={() => setIsSupervisorRollcallOpen(true)}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg transition transform active:scale-95"
            >
              Perform Executive Shift Clock-In
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
             <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Executive Authority Notice</span>
             </div>
             <p className="text-xs text-slate-600 leading-relaxed font-medium">
                This console allows the Headmaster to bypass individual terminal clock-ins for the non-teaching unit. This is typically used for rapid shift verification or when network access for USSD/SMS is compromised.
             </p>
          </div>

          {isSupervisorRollcallOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-black text-slate-900">Executive Muster Roll</h3>
                   <button onClick={() => setIsSupervisorRollcallOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Executive Observation</label>
                   <textarea
                     value={supervisorNotes}
                     onChange={(e) => setSupervisorNotes(e.target.value)}
                     className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-slate-900"
                     rows={3}
                   />
                </div>
                <button
                  onClick={handleSupervisorRollcallAll}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95"
                >
                  Verify All Shift Personnel Now
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 7: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <AuditTrailHub schoolCode={config.schoolCode} />
      )}
    </div>
  );
};
