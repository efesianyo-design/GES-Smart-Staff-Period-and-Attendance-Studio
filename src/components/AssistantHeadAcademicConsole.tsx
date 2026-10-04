import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Search,
  Download,
  Upload,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  SchoolConfig,
  StaffMember,
  GateAttendanceRecord,
  ActiveClassSession,
  PeriodTeachingSession,
  Classroom,
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
} from '../types';
import { storageEngine, getTodayDateString } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';
import { AuditTrailHub } from './AuditTrailHub';
import { X } from 'lucide-react';

interface AssistantHeadAcademicConsoleProps {
  config: SchoolConfig;
  onOpenPeriodTracker?: () => void;
  onOpenTimetableModal?: () => void;
}

export const AssistantHeadAcademicConsole: React.FC<AssistantHeadAcademicConsoleProps> = ({
  config,
  onOpenPeriodTracker,
  onOpenTimetableModal,
}) => {
  const [teachingStaff, setTeachingStaff] = useState<StaffMember[]>(() => storageEngine.getStaff());
  const [gateRecords, setGateRecords] = useState<GateAttendanceRecord[]>(() => storageEngine.getGateAttendance());
  const [activeSessions, setActiveSessions] = useState<ActiveClassSession[]>(() => storageEngine.getActiveClassSessions());
  const [periodSessions, setPeriodSessions] = useState<PeriodTeachingSession[]>(() => storageEngine.getPeriodSessions());
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => storageEngine.getClassrooms());
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffMember[]>(() => storageEngine.getNonTeachingStaff());
  const [nonTeachingRecords, setNonTeachingRecords] = useState<NonTeachingAttendanceRecord[]>(() => storageEngine.getNonTeachingAttendance());

  const [activeTab, setActiveTab] = useState<'live_lessons' | 'teaching_roster' | 'punctuality_audit' | 'audit_trail'>('live_lessons');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setActiveSessions(storageEngine.getActiveClassSessions());
      setPeriodSessions(storageEngine.getPeriodSessions());
      setGateRecords(storageEngine.getGateAttendance());
      setClassrooms(storageEngine.getClassrooms());
      setNonTeachingRecords(storageEngine.getNonTeachingAttendance());
    };
    window.addEventListener('ges_active_sessions_changed', handleUpdate);
    window.addEventListener('ges_session_saved', handleUpdate);
    window.addEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    return () => {
      window.removeEventListener('ges_active_sessions_changed', handleUpdate);
      window.removeEventListener('ges_session_saved', handleUpdate);
      window.removeEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    };
  }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todayGate = useMemo(() => {
    return gateRecords.filter((r) => r.date === today && !r.isVoided);
  }, [gateRecords, today]);

  const onCampusTeachersCount = todayGate.length;
  const totalTeachersCount = teachingStaff.length;

  // Tardiness in lesson periods
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

  // Departments list
  const departments = useMemo(() => {
    const depts = new Set<string>();
    teachingStaff.forEach((t) => {
      if (t.department) depts.add(t.department);
    });
    return Array.from(depts);
  }, [teachingStaff]);

  const filteredTeachers = useMemo(() => {
    return teachingStaff.filter((t) => {
      if (selectedDept !== 'all' && t.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.staffId.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [teachingStaff, selectedDept, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Console Header */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <GraduationCap className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-black uppercase tracking-wider">
                Academic Division Oversight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Assistant Headmaster (Academic) Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Supervises teaching personnel, departmental lesson coverage, daily 8-period timetable integrity, and teacher punctuality.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenPeriodTracker && (
              <button
                onClick={onOpenPeriodTracker}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/30"
              >
                <Clock className="w-4 h-4" />
                <span>Launch Period Tracker</span>
              </button>
            )}
            {onOpenTimetableModal && (
              <button
                onClick={onOpenTimetableModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Timetable Grid</span>
              </button>
            )}
          </div>
        </div>

        {/* Academic Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Teaching Staff Presence</span>
            <div className="text-xl font-black text-white mt-0.5">
              {onCampusTeachersCount} <span className="text-xs text-slate-400 font-normal">/ {totalTeachersCount}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">
              {totalTeachersCount ? Math.round((onCampusTeachersCount / totalTeachersCount) * 100) : 0}% on campus
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">In-Session Classes</span>
            <div className="text-xl font-black text-blue-400 mt-0.5">
              {activeSessions.length} <span className="text-xs text-slate-400 font-normal">Active</span>
            </div>
            <span className="text-[10px] text-slate-400">Classrooms locked in session</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Lessons Concluded Today</span>
            <div className="text-xl font-black text-indigo-400 mt-0.5">
              {periodSessions.length} <span className="text-xs text-slate-400 font-normal">Periods</span>
            </div>
            <span className="text-[10px] text-indigo-400 font-bold">Roll calls archived</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Teacher Lesson Tardiness</span>
            <div className="text-xl font-black text-red-400 mt-0.5">
              {lateLessonSessions.length} <span className="text-xs text-slate-400 font-normal">Alerts</span>
            </div>
            <span className="text-[10px] text-red-400 font-bold">Entered after period start</span>
          </div>
        </div>
      </div>

      {/* Late Lesson Teacher Alert Banner */}
      {lateLessonSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Flagged Teachers: Late Period Start ({lateLessonSessions.length} Cases)</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800">
              Auto-flagged against Master Timetable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lateLessonSessions.map((s, idx) => (
              <div key={idx} className="p-3 bg-white border border-amber-200 rounded-xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                    ⚠️ {s.lateMinutes || 15} mins Late
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">Period {s.periodNumber}</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{s.teacherName}</h4>
                  <p className="text-[11px] text-slate-600">{s.className} • {s.subject}</p>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>Scheduled: {s.scheduledStartTime}</span>
                  <span className="font-bold text-red-600">Entered: {s.actualStartTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Non-teaching shift personnel successfully clocked in!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'live_lessons', label: 'Live Lessons & Class Occupancy', icon: Clock },
          { key: 'teaching_roster', label: 'Teachers by Department', icon: Users },
          { key: 'punctuality_audit', label: 'Lesson Punctuality Audit', icon: ShieldAlert },
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
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE LESSONS */}
      {activeTab === 'live_lessons' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Active Locked Classrooms</h3>
                <p className="text-xs text-slate-500">
                  Classes currently occupied. Other teachers are prevented from concurrently entering or merging these rooms.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                {activeSessions.length} Classes In Session
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.length > 0 ? (
                activeSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border-2 space-y-3 ${
                      s.isLateArrival ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-blue-700 text-white text-[10px] font-bold">
                        Period {s.periodNumber} Live
                      </span>
                      {s.isMerged && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                          Combined Classes
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{s.className}</h4>
                      <p className="text-xs font-bold text-blue-700">{s.subject}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Teacher: <strong>{s.teacherName}</strong>
                      </p>
                    </div>
                    {s.isLateArrival && (
                      <div className="p-2 bg-red-100/80 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>Teacher arrived {s.lateMinutes} mins late</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200 flex justify-between font-mono">
                      <span>Started: {s.actualStartTime}</span>
                      <span>Total Learners: {s.totalRosterCount}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
                  No classroom sessions currently active.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHERS BY DEPARTMENT */}
      {activeTab === 'teaching_roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Academic Staff Distribution</h3>
              <p className="text-xs text-slate-500">Filter by department to audit teacher period assignments</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Educator</th>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Assigned Subjects</th>
                  <th className="py-2.5 px-3">Campus Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => {
                  const gate = todayGate.find((g) => g.staffId === t.staffId);
                  const activeClass = activeSessions.find((s) => s.teacherStaffId === t.staffId);
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
                      <td className="py-2.5 px-3 text-slate-600">{t.subjects.join(', ')}</td>
                      <td className="py-2.5 px-3">
                        {activeClass ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            Teaching: {activeClass.className}
                          </span>
                        ) : gate ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            On Campus ({gate.clockInTime})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                            Off Campus
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

      {/* TAB 3: PUNCTUALITY AUDIT */}
      {activeTab === 'punctuality_audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Teacher Lesson Punctuality Log</h3>
              <p className="text-xs text-slate-500">Scheduled period start vs actual classroom entry timestamp</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {lateLessonSessions.length} Flagged Instances
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Teacher</th>
                  <th className="py-2.5 px-3">Class &amp; Subject</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Scheduled Start</th>
                  <th className="py-2.5 px-3">Actual Entry</th>
                  <th className="py-2.5 px-3">Lateness Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lateLessonSessions.map((s, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{s.teacherName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.className} • {s.subject}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">Period {s.periodNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{s.scheduledStartTime}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-red-600">{s.actualStartTime}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[10px] uppercase">
                        ⚠️ {s.lateMinutes} mins Late
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* TAB 5: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <AuditTrailHub schoolCode={config.schoolCode} />
        </div>
      )}
    </div>
  );
};
