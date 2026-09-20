import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Upload,
  UserPlus,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Phone,
  BookOpen,
  Download,
  Calendar,
} from 'lucide-react';
import {
  StaffMember,
  GateAttendanceRecord,
  PeriodTeachingSession,
  Classroom,
  StaffRole,
} from '../types';
import {
  parseStaffCSV,
  parseClassroomCSV,
  downloadStaffTemplateCSV,
  downloadClassroomTemplateCSV,
} from '../utils/csv';
import { soundSynthesizer } from '../utils/audio';
import { getTodayDateString } from '../utils/storage';
import { TimetableModal } from './TimetableModal';

interface MasterRosterModeProps {
  staffList: StaffMember[];
  gateRecords: GateAttendanceRecord[];
  periodSessions: PeriodTeachingSession[];
  classrooms: Classroom[];
  onAddStaff: (member: StaffMember) => void;
  onBulkAddStaff: (members: StaffMember[]) => void;
  onBulkAddClassrooms?: (classrooms: Classroom[]) => void;
  initialPresenceFilter?: 'ALL' | 'on_campus' | 'off_campus';
}

export const MasterRosterMode: React.FC<MasterRosterModeProps> = ({
  staffList,
  gateRecords,
  periodSessions,
  classrooms,
  onAddStaff,
  onBulkAddStaff,
  onBulkAddClassrooms,
  initialPresenceFilter = 'ALL',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [presenceFilter, setPresenceFilter] = useState<'ALL' | 'on_campus' | 'off_campus'>(
    initialPresenceFilter
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  // Sync if initialPresenceFilter changes
  React.useEffect(() => {
    if (initialPresenceFilter) {
      setPresenceFilter(initialPresenceFilter);
    }
  }, [initialPresenceFilter]);

  // New staff modal form state
  const [newName, setNewName] = useState('');
  const [newStaffId, setNewStaffId] = useState('');
  const [newDepartment, setNewDepartment] = useState('General Science');
  const [newRole, setNewRole] = useState<StaffRole>('Teacher');
  const [newCategory, setNewCategory] = useState<'permanent' | 'nss' | 'intern'>('permanent');
  const [newRank, setNewRank] = useState('Principal Superintendent');
  const [newPhone, setNewPhone] = useState('');
  const [newPin, setNewPin] = useState('1234');

  // CSV Upload states
  const [uploadTab, setUploadTab] = useState<'staff' | 'classrooms'>('staff');
  const [csvText, setCsvText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<StaffMember>[]>([]);
  const [classroomParsedPreview, setClassroomParsedPreview] = useState<Partial<Classroom>[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffList.forEach((s) => set.add(s.department));
    return ['ALL', ...Array.from(set)];
  }, [staffList]);

  // Compute live matrix for each staff member
  const staffMatrix = useMemo(() => {
    return staffList.map((staff) => {
      // 1. Gate attendance today
      const gateRec = gateRecords.find(
        (r) => r.staffId === staff.staffId && r.date === todayStr
      );

      // 2. Active classroom session right now
      const activeClass = classrooms.find(
        (c) => c.currentSession && c.currentSession.teacherId === staff.id
      );

      // 3. Current status calculation
      let currentStatus = 'Off Campus';
      let statusColor = 'bg-slate-800 text-slate-400';
      const isOnCampus = (!!gateRec && !gateRec.clockOutTime) || (!!activeClass && !!activeClass.currentSession);

      if (activeClass && activeClass.currentSession) {
        currentStatus = `Teaching ${activeClass.code}`;
        statusColor = 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-300';
      } else if (gateRec && !gateRec.clockOutTime) {
        currentStatus = 'On Campus / Staff Room';
        statusColor = 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300';
      } else if (gateRec && gateRec.clockOutTime) {
        currentStatus = 'Clocked Out';
        statusColor = 'bg-slate-800 text-slate-400';
      }

      // 4. Total contact minutes today from completed period sessions
      const staffSessions = periodSessions.filter(
        (p) => (p.teacherId === staff.id || p.teacherStaffId === staff.staffId) && p.date === todayStr
      );
      const totalMinutes = staffSessions.reduce((acc, cur) => acc + cur.elapsedMinutes, 0);
      const contactHoursFormatted =
        totalMinutes > 0
          ? `${(totalMinutes / 60).toFixed(1)} hrs (${totalMinutes}m)`
          : '0.0 hrs';

      return {
        ...staff,
        gateRec,
        isOnCampus,
        currentStatus,
        statusColor,
        contactHoursFormatted,
        periodsCount: staffSessions.length,
      };
    });
  }, [staffList, gateRecords, periodSessions, classrooms, todayStr]);

  // Filtered staff list
  const filteredMatrix = useMemo(() => {
    return staffMatrix.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.staffId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = departmentFilter === 'ALL' || item.department === departmentFilter;

      let matchPresence = true;
      if (presenceFilter === 'on_campus') {
        matchPresence = item.isOnCampus;
      } else if (presenceFilter === 'off_campus') {
        matchPresence = !item.isOnCampus;
      }

      return matchSearch && matchDept && matchPresence;
    });
  }, [staffMatrix, searchQuery, departmentFilter, presenceFilter]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStaffId) return;

    const colors = [
      'from-emerald-600 to-teal-700',
      'from-indigo-600 to-blue-700',
      'from-purple-600 to-violet-700',
      'from-amber-600 to-yellow-700',
      'from-rose-600 to-pink-700',
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const member: StaffMember = {
      id: `staff-${Date.now()}`,
      staffId: newStaffId,
      name: newName,
      department: newDepartment,
      role: newRole,
      rank: newRank,
      category: newCategory,
      phone: newPhone || '+233 24 000 0000',
      pin: newPin || '1234',
      avatarColor,
      subjects: [newDepartment],
    };

    onAddStaff(member);
    soundSynthesizer.playClockInChime();
    setShowAddModal(false);
    setNewName('');
    setNewStaffId('');
    setNewPhone('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvText(text);
        if (uploadTab === 'staff') {
          const preview = parseStaffCSV(text);
          setParsedPreview(preview);
        } else {
          const preview = parseClassroomCSV(text);
          setClassroomParsedPreview(preview);
        }
        soundSynthesizer.playScanBeep();
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmStaffCSVImport = () => {
    if (parsedPreview.length === 0) return;

    const colors = [
      'from-emerald-600 to-teal-700',
      'from-indigo-600 to-blue-700',
      'from-purple-600 to-violet-700',
      'from-amber-600 to-yellow-700',
      'from-cyan-600 to-sky-700',
    ];

    const newMembers: StaffMember[] = parsedPreview.map((item, idx) => ({
      id: `staff-csv-${Date.now()}-${idx}`,
      staffId: item.staffId || `GES-ST-${200 + idx}`,
      name: item.name || `Staff Member ${idx + 1}`,
      department: item.department || 'General Staff',
      phone: item.phone || '+233 24 000 0000',
      pin: item.pin || '1234',
      role: (item.role as StaffRole) || 'Teacher',
      avatarColor: colors[idx % colors.length],
      subjects: [item.department || 'General'],
    }));

    onBulkAddStaff(newMembers);
    soundSynthesizer.playClockInChime();
    setUploadSuccess(`Successfully imported ${newMembers.length} staff records!`);
    setTimeout(() => {
      setShowUploadModal(false);
      setParsedPreview([]);
      setCsvText('');
      setUploadSuccess(null);
    }, 1500);
  };

  const handleConfirmClassroomCSVImport = () => {
    if (classroomParsedPreview.length === 0 || !onBulkAddClassrooms) return;

    const newClassrooms: Classroom[] = classroomParsedPreview.map((item, idx) => {
      const totalLearners = item.totalLearners || 45;
      const roster = Array.from({ length: totalLearners }, (_, i) => ({
        id: `lrn-${Date.now()}-${idx}-${i + 1}`,
        rollNo: i + 1,
        name: `Learner #${i + 1}`,
      }));

      return {
        id: `cls-csv-${Date.now()}-${idx}`,
        name: item.name || `Classroom ${idx + 1}`,
        code: item.code || `CLS-${idx + 1}`,
        block: item.block || 'Main Block',
        grade: item.grade || 'Form 1',
        totalLearners,
        roster,
      };
    });

    onBulkAddClassrooms(newClassrooms);
    soundSynthesizer.playClockInChime();
    setUploadSuccess(`Successfully imported ${newClassrooms.length} classrooms with learner enrolments!`);
    setTimeout(() => {
      setShowUploadModal(false);
      setClassroomParsedPreview([]);
      setCsvText('');
      setUploadSuccess(null);
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-6xl mx-auto w-full space-y-4">
      {/* Header and Action Controls */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Master Staff Roster &amp; Classroom Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Live presence, morning arrival timestamp, punctuality &amp; contact hours
            </p>
          </div>
        </div>

        {/* Action Buttons: [ 📅 Timetable ] & [ 📥 Upload Staff CSV ] & [ ➕ Add Staff Member ] */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTimetableModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer"
            title="Open Master aSc Institutional Timetable"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>aSc Timetable</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or GES ID..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Presence Status Filters */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setPresenceFilter('ALL');
                soundSynthesizer.playScanBeep();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                presenceFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Staff ({staffMatrix.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setPresenceFilter('on_campus');
                soundSynthesizer.playScanBeep();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                presenceFilter === 'on_campus'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>On Campus ({staffMatrix.filter((s) => s.isOnCampus).length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPresenceFilter('off_campus');
                soundSynthesizer.playScanBeep();
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                presenceFilter === 'off_campus'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Off Campus ({staffMatrix.filter((s) => !s.isOnCampus).length})
            </button>
          </div>
        </div>

        {/* Department Filters */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                departmentFilter === dept
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Staff Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-slate-800 bg-slate-950/60">
                <th className="py-3 px-4 font-semibold">Staff ID</th>
                <th className="py-3 px-4 font-semibold">Name &amp; Role</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Morning Arrival</th>
                <th className="py-3 px-4 font-semibold">Punctuality Badge</th>
                <th className="py-3 px-4 font-semibold">Current Status</th>
                <th className="py-3 px-4 font-semibold">Total Contact Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMatrix.map((staff) => (
                <tr key={staff.id} className="hover:bg-slate-800/30 transition">
                  {/* Staff ID */}
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                    {staff.staffId}
                  </td>

                  {/* Name & Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${staff.avatarColor} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                      >
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-white block">{staff.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>{staff.rank || staff.role}</span>
                          {staff.category === 'nss' && (
                            <span className="px-1 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-mono text-[9px]">
                              NSP
                            </span>
                          )}
                          {staff.category === 'intern' && (
                            <span className="px-1 py-0.2 rounded bg-amber-900/60 text-amber-300 font-mono text-[9px]">
                              Intern
                            </span>
                          )}
                        </div>
                        {staff.subjects && staff.subjects.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {staff.subjects.slice(0, 3).map((sub) => (
                              <span
                                key={sub}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-[9px] text-emerald-300 font-medium whitespace-nowrap"
                              >
                                {sub}
                              </span>
                            ))}
                            {staff.subjects.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{staff.subjects.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4 text-slate-300">
                    <span className="text-xs block font-medium">{staff.department}</span>
                  </td>

                  {/* Morning Arrival Time */}
                  <td className="py-3 px-4 font-mono">
                    {staff.gateRec ? (
                      <span className="text-white font-medium">{staff.gateRec.clockInTime}</span>
                    ) : (
                      <span className="text-slate-500 italic">Not Clocked In</span>
                    )}
                  </td>

                  {/* Punctuality Badge */}
                  <td className="py-3 px-4">
                    {staff.gateRec ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          staff.gateRec.punctualityStatus === 'on_time'
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                            : staff.gateRec.punctualityStatus === 'late'
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {staff.gateRec.punctualityStatus === 'on_time'
                          ? '🟢 On Time'
                          : staff.gateRec.punctualityStatus === 'late'
                          ? '🟡 Late'
                          : '🔴 Substantially Late'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Current Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${staff.statusColor}`}
                    >
                      {staff.currentStatus.includes('Teaching') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      {staff.currentStatus}
                    </span>
                  </td>

                  {/* Total Contact Hours Today */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-emerald-400">
                      {staff.contactHoursFormatted}
                    </span>
                    {staff.periodsCount > 0 && (
                      <span className="block text-[10px] text-slate-400">
                        {staff.periodsCount} period{staff.periodsCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                Add Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Mr. Kwadwo Mensah"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Staff Category &amp; Status</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('permanent');
                      setNewRank('Principal Superintendent');
                      if (newStaffId.startsWith('NSS-') || newStaffId.startsWith('INT-')) {
                        setNewStaffId('');
                      }
                    }}
                    className={`py-1 rounded-lg text-center transition ${
                      newCategory === 'permanent'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GES Permanent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('nss');
                      setNewRank('National Service Personnel');
                      setNewStaffId(`NSS-2024-${Math.floor(100 + Math.random() * 900)}`);
                    }}
                    className={`py-1 rounded-lg text-center transition ${
                      newCategory === 'nss'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NSP / NSS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('intern');
                      setNewRank('Student Intern Teacher');
                      setNewStaffId(`INT-2024-${Math.floor(10 + Math.random() * 90)}`);
                    }}
                    className={`py-1 rounded-lg text-center transition ${
                      newCategory === 'intern'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Intern / Trainee
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">
                      {newCategory === 'permanent' ? 'GES Staff ID' : 'Personnel Code'}
                    </label>
                    {newCategory !== 'permanent' && (
                      <span className="text-[10px] text-amber-400">Auto-Generated</span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    placeholder={newCategory === 'permanent' ? 'e.g. 1084291' : 'e.g. NSS-2024-041'}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="HOD">HOD</option>
                    <option value="Assistant Head">Assistant Head</option>
                    <option value="Headmaster">Headmaster</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g., General Science, Business, Languages"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+233 24 123 4567"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Terminal PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-md transition"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal (Staff Directory or Classrooms & Learners) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[92dvh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Institutional Data Import Center</h3>
                  <p className="text-[11px] text-slate-400">Bulk upload Staff, Classrooms, and Learner Enrolment</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-2 mt-3 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setUploadTab('staff');
                  setCsvText('');
                  soundSynthesizer.playKeypadBeep();
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  uploadTab === 'staff'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Staff Directory ({parsedPreview.length ? `${parsedPreview.length} loaded` : 'CSV'})
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadTab('classrooms');
                  setCsvText('');
                  soundSynthesizer.playKeypadBeep();
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  uploadTab === 'classrooms'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Classrooms &amp; Learners ({classroomParsedPreview.length ? `${classroomParsedPreview.length} loaded` : 'CSV'})
              </button>
            </div>

            {uploadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {uploadSuccess}
              </div>
            )}

            <div className="mt-3 space-y-3 text-xs text-slate-300 flex-1 overflow-y-auto pr-1">
              {/* Instructions & Template Download */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {uploadTab === 'staff' ? (
                      <>
                        Columns:{' '}
                        <code className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.5 rounded">
                          id, name, department, phone, pin
                        </code>
                      </>
                    ) : (
                      <>
                        Columns:{' '}
                        <code className="text-indigo-400 font-mono bg-slate-900 px-1 py-0.5 rounded">
                          code, name, block, grade, learners
                        </code>
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (uploadTab === 'staff') {
                      downloadStaffTemplateCSV();
                    } else {
                      downloadClassroomTemplateCSV();
                    }
                    soundSynthesizer.playScanBeep();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  Download Sample CSV Template
                </button>
              </div>

              {/* Drag and drop file picker */}
              <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-4 text-center bg-slate-950/50 cursor-pointer">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="master-csv-input"
                />
                <label htmlFor="master-csv-input" className="cursor-pointer block">
                  <FileSpreadsheet className="w-7 h-7 text-slate-500 mx-auto mb-1.5" />
                  <span className="font-semibold text-emerald-400 block text-xs">Click or Drop CSV File</span>
                  <span className="text-[10px] text-slate-500">
                    Supports Microsoft Excel, Google Sheets, or GES UTF-8 CSV exports
                  </span>
                </label>
              </div>

              {/* Quick load sample format */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (uploadTab === 'staff') {
                      const sample =
                        'id,name,department,phone,pin\nGES-ST-109,Mrs. Comfort Appau,Home Economics,+233 24 991 8822,1234\nGES-ST-110,Mr. Wisdom Dzisah,General Arts,+233 20 551 2233,1234\nGES-ST-111,Ms. Abigail Ofori,Mathematics & ICT,+233 27 444 1122,1234';
                      setCsvText(sample);
                      setParsedPreview(parseStaffCSV(sample));
                    } else {
                      const sample =
                        'code,name,block,grade,learners\nF1-BUS-A,Form 1 Business A,Block D - Commerce Wing,Form 1,48\nF2-SC-C,Form 2 Science C,Block A - Science Complex,Form 2,42\nF3-ARTS-A,Form 3 General Arts A,Block B - Humanities Hall,Form 3,50';
                      setCsvText(sample);
                      setClassroomParsedPreview(parseClassroomCSV(sample));
                    }
                    soundSynthesizer.playScanBeep();
                  }}
                  className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                >
                  + Load sample test rows
                </button>
              </div>

              {/* Staff preview table */}
              {uploadTab === 'staff' && parsedPreview.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-white mb-1.5 text-xs">
                    Parsed Preview ({parsedPreview.length} staff records):
                  </p>
                  <div className="max-h-36 overflow-y-auto no-scrollbar border border-slate-800 rounded-xl bg-slate-950 p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="pb-1 font-mono">ID</th>
                          <th className="pb-1">Name</th>
                          <th className="pb-1">Department</th>
                          <th className="pb-1">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {parsedPreview.map((item, i) => (
                          <tr key={i}>
                            <td className="py-1 font-mono text-emerald-400">{item.staffId}</td>
                            <td className="py-1 text-white">{item.name}</td>
                            <td className="py-1 text-slate-400">{item.department}</td>
                            <td className="py-1 text-slate-400">{item.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Classroom preview table */}
              {uploadTab === 'classrooms' && classroomParsedPreview.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold text-white mb-1.5 text-xs">
                    Parsed Preview ({classroomParsedPreview.length} classrooms &amp; enrolment):
                  </p>
                  <div className="max-h-36 overflow-y-auto no-scrollbar border border-slate-800 rounded-xl bg-slate-950 p-2">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="pb-1 font-mono">Code</th>
                          <th className="pb-1">Classroom Name</th>
                          <th className="pb-1">Block / Building</th>
                          <th className="pb-1">Grade</th>
                          <th className="pb-1 font-mono text-right">Learners</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {classroomParsedPreview.map((item, i) => (
                          <tr key={i}>
                            <td className="py-1 font-mono text-indigo-400">{item.code}</td>
                            <td className="py-1 text-white">{item.name}</td>
                            <td className="py-1 text-slate-400">{item.block}</td>
                            <td className="py-1 text-slate-400">{item.grade}</td>
                            <td className="py-1 font-mono text-emerald-400 text-right font-bold">
                              {item.totalLearners}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>

              {uploadTab === 'staff' ? (
                <button
                  type="button"
                  disabled={parsedPreview.length === 0}
                  onClick={handleConfirmStaffCSVImport}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition ${
                    parsedPreview.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Import {parsedPreview.length} Staff Members
                </button>
              ) : (
                <button
                  type="button"
                  disabled={classroomParsedPreview.length === 0}
                  onClick={handleConfirmClassroomCSVImport}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition ${
                    classroomParsedPreview.length > 0
                      ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Import {classroomParsedPreview.length} Classrooms &amp; Enrolments
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* aSc Master Timetable Modal */}
      <TimetableModal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
      />
    </div>
  );
};
