import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Users,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Check,
  Home,
  Star,
  User,
  X,
  UserCheck,
  UserX,
  Layers,
  Timer,
  AlertTriangle,
  Play,
  Square,
  Lock,
  Unlock,
  Search,
  Plus,
  BookOpen,
} from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';
import { GesAiIntelligenceHub } from './GesAiIntelligenceHub';
import { Classroom, PeriodTeachingSession, ActiveClassSession } from '../types';
import { useSchoolTheme } from '../hooks/useSchoolTheme';
import { storageEngine, getTodayDateString } from '../utils/storage';
import { resolveTeacherSmart } from '../utils/timetableData';

// Ghanaian Kente Pattern Border Component
export const KenteStripe: React.FC<{ className?: string; height?: string }> = ({
  className = '',
  height = 'h-3.5 sm:h-4',
}) => {
  return (
    <div
      className={`w-full ${height} ${className} shadow-xs`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          #CF1020 0px,
          #CF1020 20px,
          #FCD116 20px,
          #FCD116 40px,
          #0B6D2F 40px,
          #0B6D2F 60px,
          #1E293B 60px,
          #1E293B 70px,
          #FCD116 70px,
          #FCD116 85px,
          #0B6D2F 85px,
          #0B6D2F 105px,
          #CF1020 105px,
          #CF1020 125px
        )`,
      }}
    />
  );
};

// Mini Kente decorative flag accent for card corners/footers
export const MiniKentePatch: React.FC<{ className?: string }> = ({ className = 'w-16 h-4' }) => {
  return (
    <div
      className={`${className} rounded-xs shadow-2xs overflow-hidden`}
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          #CF1020 0px,
          #CF1020 6px,
          #FCD116 6px,
          #FCD116 12px,
          #0B6D2F 12px,
          #0B6D2F 18px,
          #1E293B 18px,
          #1E293B 22px
        )`,
      }}
    />
  );
};

// Student Roster item structure
interface StudentRosterItem {
  id: string;
  name: string;
  indexNumber: string;
  status: 'present' | 'absent' | 'late';
  seat: string;
  classOrigin: string;
}

// Default roster for Form 2A (Business)
const INITIAL_FORM_2A_STUDENTS: StudentRosterItem[] = [
  { id: 'st-01', name: 'Kwesi Mensah', indexNumber: 'GES-24-0012', status: 'present', seat: 'Row 1, Seat 1', classOrigin: 'Form 2A' },
  { id: 'st-02', name: 'Abena Osei Poku', indexNumber: 'GES-24-0015', status: 'present', seat: 'Row 1, Seat 2', classOrigin: 'Form 2A' },
  { id: 'st-03', name: 'Kofi Boateng Agyemang', indexNumber: 'GES-24-0021', status: 'present', seat: 'Row 1, Seat 3', classOrigin: 'Form 2A' },
  { id: 'st-04', name: 'Efua Addo Danquah', indexNumber: 'GES-24-0028', status: 'present', seat: 'Row 1, Seat 4', classOrigin: 'Form 2A' },
  { id: 'st-05', name: 'Yaw Frimpong Asante', indexNumber: 'GES-24-0033', status: 'absent', seat: 'Row 2, Seat 1', classOrigin: 'Form 2A' },
  { id: 'st-06', name: 'Akua Sarpong', indexNumber: 'GES-24-0039', status: 'present', seat: 'Row 2, Seat 2', classOrigin: 'Form 2A' },
  { id: 'st-07', name: 'Kwame Nkrumah Bempah', indexNumber: 'GES-24-0044', status: 'present', seat: 'Row 2, Seat 3', classOrigin: 'Form 2A' },
  { id: 'st-08', name: 'Ama Konadu Yeboah', indexNumber: 'GES-24-0050', status: 'present', seat: 'Row 2, Seat 4', classOrigin: 'Form 2A' },
  { id: 'st-09', name: 'Kojo Antwi Quaye', indexNumber: 'GES-24-0055', status: 'present', seat: 'Row 3, Seat 1', classOrigin: 'Form 2A' },
  { id: 'st-10', name: 'Yaa Asantewaa Bonsu', indexNumber: 'GES-24-0062', status: 'present', seat: 'Row 3, Seat 2', classOrigin: 'Form 2A' },
  { id: 'st-11', name: 'Ebenezer K. Annan', indexNumber: 'GES-24-0068', status: 'present', seat: 'Row 3, Seat 3', classOrigin: 'Form 2A' },
  { id: 'st-12', name: 'Priscilla Baah', indexNumber: 'GES-24-0074', status: 'present', seat: 'Row 3, Seat 4', classOrigin: 'Form 2A' },
  { id: 'st-13', name: 'Samuel Kwabena Tetteh', indexNumber: 'GES-24-0081', status: 'absent', seat: 'Row 4, Seat 1', classOrigin: 'Form 2A' },
  { id: 'st-14', name: 'Grace Mawufemor Dogbe', indexNumber: 'GES-24-0087', status: 'present', seat: 'Row 4, Seat 2', classOrigin: 'Form 2A' },
  { id: 'st-15', name: 'Daniel Kwaku Kyeremeh', indexNumber: 'GES-24-0092', status: 'present', seat: 'Row 4, Seat 3', classOrigin: 'Form 2A' },
  { id: 'st-16', name: 'Mercy Serwaa Akoto', indexNumber: 'GES-24-0099', status: 'present', seat: 'Row 4, Seat 4', classOrigin: 'Form 2A' },
];

const FORM_2B_MERGED_STUDENTS: StudentRosterItem[] = [
  { id: 'st-b-01', name: 'Aaron Kweku Mensah', indexNumber: 'GES-24-0301', status: 'present', seat: 'Joint Form 2B • Row 1', classOrigin: 'Form 2B' },
  { id: 'st-b-02', name: 'Belinda Akua Osei', indexNumber: 'GES-24-0305', status: 'present', seat: 'Joint Form 2B • Row 1', classOrigin: 'Form 2B' },
  { id: 'st-b-03', name: 'Charles Yaw Boateng', indexNumber: 'GES-24-0312', status: 'present', seat: 'Joint Form 2B • Row 2', classOrigin: 'Form 2B' },
  { id: 'st-b-04', name: 'Doris Esi Danquah', indexNumber: 'GES-24-0318', status: 'present', seat: 'Joint Form 2B • Row 2', classOrigin: 'Form 2B' },
];

export const TeacherPeriodTracker1to1: React.FC = () => {
  const { theme } = useSchoolTheme();
  const schoolConfig = useMemo(() => storageEngine.getSchoolConfig(), []);

  // Identity Verification & Authorization State
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [hasCheckedRoll, setHasCheckedRoll] = useState(false);
  const [attendanceStarted, setAttendanceStarted] = useState(false);

  // 1. Teacher Profile
  const [currentTeacher, setCurrentTeacher] = useState({
    name: 'Mr. Kwame Amponsah',
    staffId: '706711',
    department: 'Business & Economics',
    initials: 'KA',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    matchedBy: 'default',
    subjects: ['Business Management', 'Economics'],
  });
  const [teacherSearchOpen, setTeacherSearchOpen] = useState(false);
  const [teacherQuery, setTeacherQuery] = useState('');

  // 2. Class Selection
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const list = storageEngine.getClassrooms();
    const hasForm2A = list.some((c) => c.code === 'FORM_2A' || c.name.includes('Form 2A'));
    if (!hasForm2A) {
      return [
        { id: 'cls-form-2a', code: 'FORM_2A', name: 'Form 2A (Business)', block: 'Block B • Room 4', grade: 'Form 2', totalLearners: 25, roster: [] },
        { id: 'cls-form-2b', code: 'FORM_2B', name: 'Form 2B (General Arts)', block: 'Arts Wing • Room 5', grade: 'Form 2', totalLearners: 12, roster: [] },
        ...list,
      ];
    }
    return list;
  });

  const [selectedClassCodes, setSelectedClassCodes] = useState<string[]>(['FORM_2A']);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'Form 1' | 'Form 2' | 'Form 3'>('all');

  // Active sessions & Occupied Classes Lock
  const [activeSessions, setActiveSessions] = useState<ActiveClassSession[]>(() =>
    storageEngine.getActiveClassSessions()
  );

  const occupiedClassesMap = useMemo(() => {
    const map = new Map<string, ActiveClassSession>();
    for (const s of activeSessions) {
      if (s.classCode) map.set(s.classCode, s);
      if (s.className) map.set(s.className, s);
      if (s.mergedClassCodes) {
        for (const mc of s.mergedClassCodes) map.set(mc, s);
      }
    }
    return map;
  }, [activeSessions]);

  // Sync active sessions
  useEffect(() => {
    const handleActiveChanged = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setActiveSessions(e.detail);
      } else {
        setActiveSessions(storageEngine.getActiveClassSessions());
      }
    };
    window.addEventListener('ges_active_sessions_changed', handleActiveChanged);
    return () => window.removeEventListener('ges_active_sessions_changed', handleActiveChanged);
  }, []);

  const PERIOD_OPTIONS = [
    { id: 'p1_2', label: 'Period 1 & 2', periodNumber: 1, startTime: '07:00', endTime: '09:00', startDisplay: '07:00 AM', endDisplay: '09:00 AM' },
    { id: 'p3', label: 'Period 3', periodNumber: 3, startTime: '09:30', endTime: '10:30', startDisplay: '09:30 AM', endDisplay: '10:30 AM' },
    { id: 'p4', label: 'Period 4', periodNumber: 4, startTime: '10:30', endTime: '11:30', startDisplay: '10:30 AM', endDisplay: '11:30 AM' },
    { id: 'p5', label: 'Period 5', periodNumber: 5, startTime: '11:30', endTime: '12:30', startDisplay: '11:30 AM', endDisplay: '12:30 PM' },
    { id: 'p6', label: 'Period 6', periodNumber: 6, startTime: '13:00', endTime: '14:00', startDisplay: '01:00 PM', endDisplay: '02:00 PM' },
  ];

  const [selectedPeriodId, setSelectedPeriodId] = useState('p1_2');
  const selectedPeriod = useMemo(
    () => PERIOD_OPTIONS.find((p) => p.id === selectedPeriodId) || PERIOD_OPTIONS[0],
    [selectedPeriodId]
  );

  // Session State
  const [hasEnteredClass, setHasEnteredClass] = useState(false);
  const [actualEntryTime, setActualEntryTime] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [aiHubOpen, setAiHubOpen] = useState<boolean>(false);
  const [staffIdInput, setStaffIdInput] = useState('');
  const [verificationError, setStaffIdVerificationError] = useState<string | null>(null);
  const [isLateArrival, setIsLateArrival] = useState<boolean>(false);
  const [lateMinutes, setLateMinutes] = useState<number>(0);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [actualExitTime, setActualExitTime] = useState<string | null>(null);

  const selectedClassrooms = useMemo(() => {
    return classrooms.filter((c) => selectedClassCodes.includes(c.code));
  }, [classrooms, selectedClassCodes]);

  const [students, setStudents] = useState<StudentRosterItem[]>(INITIAL_FORM_2A_STUDENTS);

  useEffect(() => {
    const combined: StudentRosterItem[] = [];
    selectedClassrooms.forEach((c) => {
      if (c.code === 'FORM_2A') combined.push(...INITIAL_FORM_2A_STUDENTS);
      else if (c.code === 'FORM_2B') combined.push(...FORM_2B_MERGED_STUDENTS);
      else if (c.roster && c.roster.length > 0) {
        c.roster.forEach((r, idx) => {
          combined.push({
            id: r.id || `${c.code}-st-${idx}`,
            name: r.name,
            indexNumber: (r as any).indexNumber || `GES-24-${c.code.slice(0, 3)}-${String(idx + 1).padStart(3, '0')}`,
            status: 'present',
            seat: `${c.name} • Row ${Math.floor(idx / 4) + 1}`,
            classOrigin: c.name,
          });
        });
      } else {
        const count = c.totalLearners || 15;
        for (let i = 1; i <= count; i++) {
          combined.push({
            id: `${c.code}-gen-${i}`,
            name: `Learner ${i} (${c.name})`,
            indexNumber: `GES-24-${c.code.slice(0, 3)}-${String(i).padStart(3, '0')}`,
            status: 'present',
            seat: `${c.name} • Row ${Math.floor((i - 1) / 4) + 1}`,
            classOrigin: c.name,
          });
        }
      }
    });
    setStudents(combined.length > 0 ? combined : INITIAL_FORM_2A_STUDENTS);
  }, [selectedClassCodes, selectedClassrooms]);

  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const totalCount = students.length;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const smartDetectedTeacher = useMemo(() => {
    if (!teacherQuery.trim()) return null;
    return resolveTeacherSmart(teacherQuery);
  }, [teacherQuery]);

  const handleApplyDetectedTeacher = () => {
    if (!smartDetectedTeacher) return;
    setCurrentTeacher({
      name: smartDetectedTeacher.fullName,
      staffId: smartDetectedTeacher.staffId,
      department: smartDetectedTeacher.department || 'Academic Department',
      initials: smartDetectedTeacher.initials || 'GES',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      matchedBy: smartDetectedTeacher.matchedBy,
      subjects: [],
    });
    setTeacherSearchOpen(false);
    setTeacherQuery('');
    setNotification(`✓ Teacher Identity Changed: ${smartDetectedTeacher.fullName}`);
  };

  const handleToggleClassSelection = (classCode: string) => {
    const cls = classrooms.find((c) => c.code === classCode);
    if (!cls) return;
    const occupied = occupiedClassesMap.get(cls.code) || occupiedClassesMap.get(cls.name);
    if (occupied && occupied.teacherStaffId !== currentTeacher.staffId) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setNotification(`🚫 Class Occupied by ${occupied.teacherName}`);
      return;
    }
    soundSynthesizer.playScanBeep();
    if (selectedClassCodes.includes(classCode)) {
      if (selectedClassCodes.length > 1) setSelectedClassCodes(prev => prev.filter(c => c !== classCode));
    } else {
      setSelectedClassCodes(prev => [...prev, classCode]);
    }
  };

  const handleEnterClass = () => {
    const now = new Date();
    const entryTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const currentHour = now.getHours();
    const startHour = schoolConfig.lessonStartHour ?? 6;
    const endHour = schoolConfig.lessonEndHour ?? 17;
    
    // Check if school is closed for lessons
    if (currentHour >= endHour || currentHour < startHour) {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setNotification(`🚨 SCHOOL CLOSED FOR LESSONS: Official hours are ${startHour}:00 - ${endHour}:00. Access is restricted to ensure institutional discipline.`);
      
      storageEngine.logAudit({
        staffId: currentTeacher.staffId,
        staffName: currentTeacher.name,
        schoolCode: schoolConfig.schoolCode,
        category: 'academic',
        status: 'warning',
        action: 'CLASS_ENTRY_REJECTED',
        details: `Rejected entry to class ${selectedClassCodes.join(', ')} at ${entryTime} (School Closed).`,
      });
      return;
    }

    const today = getTodayDateString();
    const gateRecords = storageEngine.getGateAttendance();
    const isTeacherClockedIn = gateRecords.some(r => r.staffId === currentTeacher.staffId && r.date === today && !r.isVoided);

    if (!isTeacherClockedIn && currentTeacher.matchedBy !== 'default') {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setNotification('🚫 NOT CLOCKED IN AT GATE: GES policy requires a physical campus entry punch before entering any classroom for instruction. Please clock in at the main gate first.');
      
      storageEngine.logAudit({
        staffId: currentTeacher.staffId,
        staffName: currentTeacher.name,
        schoolCode: schoolConfig.schoolCode,
        category: 'academic',
        status: 'warning',
        action: 'CLASS_ENTRY_REJECTED',
        details: `Rejected entry to class ${selectedClassCodes.join(', ')} at ${entryTime} (Not clocked in at gate).`,
      });
      return;
    }

    soundSynthesizer.playClockInChime();
    setActualEntryTime(entryTime);
    setHasEnteredClass(true);
    setAttendanceStarted(true);

    storageEngine.logAudit({
      staffId: currentTeacher.staffId,
      staffName: currentTeacher.name,
      schoolCode: schoolConfig.schoolCode,
      category: 'academic',
      status: 'success',
      action: 'CLASS_ENTRY',
      details: `Entered class: ${selectedClassCodes.join(', ')} at ${entryTime}.`,
    });

    const [schedH, schedM] = selectedPeriod.startTime.split(':').map(Number);
    const [actH, actM] = entryTime.split(':').map(Number);
    const diffMins = (actH * 60 + actM) - (schedH * 60 + schedM);
    setIsLateArrival(diffMins > 0);
    setLateMinutes(Math.max(0, diffMins));

    const isMerged = selectedClassCodes.length > 1;
    const mergedNames = selectedClassrooms.map((c) => c.name);
    const primaryClass = selectedClassrooms[0] || classrooms[0];

    storageEngine.startClassSession({
      id: `active-${Date.now()}`,
      teacherId: currentTeacher.staffId,
      teacherName: currentTeacher.name,
      teacherStaffId: currentTeacher.staffId,
      classroomId: primaryClass.id,
      className: isMerged ? mergedNames.join(' + ') : primaryClass.name,
      classCode: primaryClass.code,
      isMerged,
      mergedClassCodes: selectedClassCodes,
      mergedClassNames: mergedNames,
      subject: currentTeacher.subjects[0] || 'Lesson',
      date: getTodayDateString(),
      periodNumber: selectedPeriod.periodNumber,
      scheduledStartTime: selectedPeriod.startTime,
      scheduledEndTime: selectedPeriod.endTime,
      actualStartTime: entryTime,
      startTimestamp: Date.now(),
      isLateArrival: diffMins > 0,
      lateMinutes: Math.max(0, diffMins),
      totalRosterCount: students.length,
      schoolCode: theme.code,
    });
  };

  const handleConcludePeriod = () => {
    const now = new Date();
    const exitTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    setActualExitTime(exitTime);
    setSessionCompleted(true);
    storageEngine.endClassSession(currentTeacher.staffId);
    soundSynthesizer.playClockInChime();
    setNotification(`✅ SESSION CONCLUDED at ${exitTime}.`);
  };

  const handleAuthorization = () => {
    const numId = staffIdInput.replace(/\D/g, '');
    if (numId.length < 4) {
      setStaffIdVerificationError('Invalid numeric Staff ID.');
      soundSynthesizer.playOutOfBoundsBuzzer();
      return;
    }
    const detected = resolveTeacherSmart(numId);
    if (detected && detected.fullName !== 'Unknown Teacher') {
      setCurrentTeacher({
        name: detected.fullName,
        staffId: detected.staffId,
        department: detected.department || 'Academic',
        initials: detected.initials || 'GES',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        matchedBy: 'staff_id',
        subjects: ['Business Management'],
      });
    }
    setIsAuthorized(true);
    setStaffIdInput('');
    soundSynthesizer.playClockInChime();
  };

  const toggleStudentStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return { ...s, status: s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present' };
      })
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#EEF2F6] flex flex-col items-center select-none font-sans text-slate-800">
      <KenteStripe height="h-3.5 sm:h-4" />

      {notification && (
        <div className="fixed top-6 z-50 max-w-xl mx-auto px-4 py-3 bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center gap-3 animate-fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-semibold">{notification}</p>
          <button onClick={() => setNotification(null)} className="ml-auto p-1"><X className="w-4 h-4" /></button>
        </div>
      )}

      <header className="w-full text-center pt-5 pb-3 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>GES Official Period Tracker Console</span>
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#1E293B]">TEACHER CLASSROOM CONSOLE</h1>
      </header>

      <main className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 pb-12 flex flex-col items-center">
        {!isAuthorized ? (
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Teacher Authorization</h2>
              <p className="text-sm text-slate-500">Enter Numeric Staff ID to begin</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                value={staffIdInput}
                onChange={(e) => setStaffIdInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 1042891"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 text-xl font-bold font-mono text-center tracking-widest focus:outline-none"
                autoFocus
              />
              {verificationError && <p className="text-rose-500 text-[10px] font-bold text-center">{verificationError}</p>}
              <button onClick={handleAuthorization} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl transition transform active:scale-95">Authorize Access</button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/90 flex flex-col">
            <div className="flex flex-col md:flex-row items-stretch justify-between bg-white border-b border-slate-100">
              <div className="text-white px-7 py-4 flex items-center gap-3 relative md:pr-14" style={{ backgroundColor: theme.primary, clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' }}>
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <div className="leading-tight">
                  <div className="text-[10px] font-extrabold text-emerald-100 uppercase">GHANA EDUCATION SERVICE</div>
                  <div className="text-lg font-black text-white tracking-tight">Teacher Portal</div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-end gap-4 flex-1">
                <button onClick={() => setAiHubOpen(true)} className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transform hover:scale-105 transition">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Gemini AI</span>
                </button>
                <div className="relative">
                  <button onClick={() => setShowProfileEditor(true)} className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-left hover:bg-slate-100 transition">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-emerald-600/40">
                      <img src={currentTeacher.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold text-slate-900 truncate max-w-[130px]">{currentTeacher.name}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono font-bold">{currentTeacher.staffId}</p>
                    </div>
                  </button>
                  {showProfileEditor && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
                      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 space-y-6 text-center animate-scale-up">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Staff Profile Management</h3>
                          <button onClick={() => setShowProfileEditor(false)} className="p-2 hover:bg-slate-100 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        
                        <div className="relative w-28 h-28 mx-auto group">
                          <div className="w-full h-full rounded-full overflow-hidden ring-4 ring-emerald-500 shadow-xl">
                            <img src={currentTeacher.avatar} className="w-full h-full object-cover" />
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
                            <Plus className="w-6 h-6" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setCurrentTeacher({...currentTeacher, avatar: url});
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div className="space-y-4 text-left">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Profile Photo URL</label>
                            <input 
                              type="text" 
                              value={currentTeacher.avatar} 
                              onChange={(e) => setCurrentTeacher({...currentTeacher, avatar: e.target.value})} 
                              placeholder="https://..."
                              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-mono focus:border-emerald-500 focus:outline-none" 
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                            <input 
                              type="text" 
                              value={currentTeacher.name} 
                              onChange={(e) => setCurrentTeacher({...currentTeacher, name: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-emerald-500 focus:outline-none" 
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
                            <input 
                              type="text" 
                              value={currentTeacher.department} 
                              onChange={(e) => setCurrentTeacher({...currentTeacher, department: e.target.value})} 
                              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold focus:border-emerald-500 focus:outline-none" 
                            />
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            setShowProfileEditor(false);
                            setNotification("✓ Staff profile updated successfully.");
                            storageEngine.logAudit({
                              staffId: currentTeacher.staffId,
                              staffName: currentTeacher.name,
                              schoolCode: schoolConfig.schoolCode,
                              category: 'system',
                              status: 'success',
                              action: 'PROFILE_UPDATE',
                              details: `Updated staff profile details for ${currentTeacher.name}.`,
                            });
                          }} 
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasEnteredClass && attendanceStarted && (
              <div className="flex-1 flex flex-col min-h-[600px] bg-slate-50 animate-fade-in w-full">
                <div className="bg-white border-b border-slate-200 p-8 flex flex-wrap items-center justify-between gap-8 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner border border-amber-200"><Users className="w-12 h-12" /></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">Mandatory Verification</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest">In Session</span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Institutional Roll Call</h3>
                      <p className="text-base text-slate-500 font-bold uppercase tracking-tight">{currentTeacher.subjects[0]} • {selectedClassrooms.map(c => c.name).join(' + ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="px-8 py-4 rounded-3xl bg-white border-2 border-emerald-100 shadow-sm text-center">
                      <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Learners Present</span>
                      <span className="text-5xl font-black text-emerald-600 leading-none">{presentCount} <span className="text-slate-300 text-2xl">/ {totalCount}</span></span>
                    </div>
                    <button onClick={() => { 
                      setAttendanceStarted(false); 
                      setHasCheckedRoll(true); 
                      setNotification("✅ Roll Call Finalized. Instructional period started.");
                      storageEngine.logAudit({
                        staffId: currentTeacher.staffId,
                        staffName: currentTeacher.name,
                        schoolCode: schoolConfig.schoolCode,
                        category: 'academic',
                        status: 'success',
                        action: 'ROLL_CALL_FINALIZED',
                        details: `Finalized roll call for ${selectedClassrooms.map(c => c.name).join(', ')}. Present: ${presentCount}/${totalCount}.`,
                      });
                    }} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[32px] font-black text-base shadow-2xl shadow-emerald-600/30 flex items-center gap-4 transform active:scale-95 transition-all">
                      <CheckCircle2 className="w-8 h-8" />
                      <span>Begin Lesson</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    {students.map((st) => (
                      <button key={st.id} onClick={() => {
                        toggleStudentStatus(st.id);
                        soundSynthesizer.playScanBeep();
                      }} className={`group p-8 rounded-[40px] border-4 transition-all flex flex-col items-center text-center gap-4 relative ${st.status === 'present' ? 'bg-white border-emerald-500/50 shadow-2xl shadow-emerald-500/10' : st.status === 'absent' ? 'bg-rose-50 border-rose-500/30' : 'bg-amber-50 border-amber-500/30'}`}>
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shrink-0 font-black text-3xl shadow-md transition-transform group-active:scale-90 ${st.status === 'present' ? 'bg-emerald-100 text-emerald-700' : st.status === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{st.name[0]}</div>
                        <div className="w-full">
                          <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{st.name}</p>
                          <p className="text-xs text-slate-400 font-mono font-bold mt-1">{st.indexNumber}</p>
                          <div className="mt-4 flex items-center justify-center">
                            {st.status === 'present' ? (
                              <span className="text-xs font-black text-emerald-700 flex items-center gap-2 bg-emerald-100 px-4 py-1.5 rounded-full border border-emerald-200 uppercase"><CheckCircle2 className="w-4 h-4" /> Present</span>
                            ) : st.status === 'absent' ? (
                              <span className="text-xs font-black text-rose-700 flex items-center gap-2 bg-rose-100 px-4 py-1.5 rounded-full border border-rose-200 uppercase"><UserX className="w-4 h-4" /> Absent</span>
                            ) : (
                              <span className="text-xs font-black text-amber-700 flex items-center gap-2 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-200 uppercase"><Clock className="w-4 h-4" /> Late</span>
                            )}
                          </div>
                        </div>
                        {st.status === 'present' && <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-3 border-white"><Check className="w-5 h-5 stroke-[5]" /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {hasEnteredClass && !attendanceStarted && (
              <div className="flex-1 flex flex-col md:flex-row animate-fade-in w-full h-full min-h-[600px]">
                <div className="w-full md:w-[340px] bg-slate-50 border-r border-slate-200 p-6 space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center gap-2"><Timer className="w-4 h-4 text-emerald-600" /><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Session Tracker</h3></div>
                      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                        <div className="space-y-1 text-center border-b border-slate-100 pb-4"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span><div className="text-3xl font-black text-slate-900 font-mono">00:42:15</div></div>
                        <div className="space-y-3 pt-2">
                           <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Started:</span><span className="font-bold">{actualEntryTime}</span></div>
                           <div className="flex items-center justify-between text-xs"><span className="text-slate-500">End:</span><span className="font-bold">{selectedPeriod.endDisplay}</span></div>
                        </div>
                      </div>
                      <button onClick={() => setAttendanceStarted(true)} className="w-full py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-900 font-black text-xs flex items-center justify-center gap-2 hover:border-emerald-500 transition shadow-sm"><Users className="w-4 h-4" />Update Roll Call</button>
                      <button onClick={handleConcludePeriod} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 group active:scale-95 transition"><Square className="w-4 h-4 fill-white" /><span>End Session</span></button>
                   </div>
                   <div className="pt-6 border-t border-slate-200"><div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /><span className="text-[10px] font-black uppercase text-emerald-400">Classroom Lock</span></div><p className="text-[10px] text-slate-400 leading-relaxed">This classroom is currently locked for lesson security.</p></div></div>
                </div>
                <div className="flex-1 bg-white p-7 lg:p-10 space-y-8 overflow-y-auto">
                   <div className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100"><BookOpen className="w-8 h-8" /></div>
                        <div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Instructional Console</h2><p className="text-sm text-slate-500 font-medium">Active lesson in session for {selectedClassrooms.map(c => c.name).join(' + ')}</p></div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-7 rounded-[32px] bg-slate-50 border border-slate-200 space-y-5">
                         <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" />Content & Objectives</h3>
                         <ul className="space-y-3 text-xs text-slate-600 font-semibold">
                            <li className="flex items-start gap-3"><div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3.5 h-3.5 stroke-[3]" /></div>Deliver curriculum module 4</li>
                            <li className="flex items-start gap-3"><div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5"><Check className="w-3.5 h-3.5 stroke-[3]" /></div>Student engagement activities</li>
                         </ul>
                      </div>
                      <div className="p-7 rounded-[32px] bg-emerald-50 border border-emerald-100 space-y-5">
                         <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2"><Users className="w-5 h-5 text-emerald-600" />Attendance</h3>
                         <div className="flex items-center gap-6">
                            <div className="text-center"><div className="text-3xl font-black text-emerald-600">{presentCount}</div><p className="text-[10px] font-bold text-slate-400 uppercase">Present</p></div>
                            <div className="text-center"><div className="text-3xl font-black text-rose-600">{absentCount}</div><p className="text-[10px] font-bold text-slate-400 uppercase">Absent</p></div>
                            <div className="flex-1" /><div className="px-4 py-2 rounded-2xl bg-white border border-emerald-200 text-center"><div className="text-xl font-black text-slate-900">{attendanceRate}%</div><p className="text-[9px] font-bold text-slate-400 uppercase">Rate</p></div>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tools</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         {['Award Credits', 'Flag Incident', 'Resources', 'New Task'].map(t => (
                           <button key={t} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 transition-all text-center space-y-3 group active:scale-95">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto text-slate-600 group-hover:bg-emerald-50 transition-colors"><Star className="w-6 h-6" /></div>
                              <span className="text-[11px] font-black text-slate-900 uppercase">{t}</span>
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {!hasEnteredClass && (
              <div className="flex-1 flex flex-col md:flex-row animate-fade-in w-full h-full min-h-[600px]">
                <div className="w-full md:w-[380px] bg-slate-50 border-r border-slate-200 p-6 space-y-7">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-emerald-600" /><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Timetable Period</h3></div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {PERIOD_OPTIONS.map((opt) => (
                        <button key={opt.id} onClick={() => setSelectedPeriodId(opt.id)} className={`flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all ${selectedPeriodId === opt.id ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-500/10' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${selectedPeriodId === opt.id ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>P{opt.periodNumber}</div>
                            <div className="text-left"><p className="text-xs font-black text-slate-900 leading-tight uppercase">{opt.label}</p><p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{opt.startDisplay} - {opt.endDisplay}</p></div>
                          </div>
                          {selectedPeriodId === opt.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl">
                      <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /><h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Ready to Start</h4></div>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed">Ensure physical presence. Entry time is automated upon clicking below.</p>
                      <button type="button" onClick={handleEnterClass} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl transition flex items-center justify-center gap-2 group active:scale-95"><Play className="w-4 h-4 fill-white group-hover:translate-x-1 transition" /><span>Enter Classroom Now</span></button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 bg-white p-7 lg:p-10 space-y-8 overflow-y-auto">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {classrooms.map((cls) => {
                        const isSelected = selectedClassCodes.includes(cls.code);
                        const isOccupied = occupiedClassesMap.get(cls.code) || occupiedClassesMap.get(cls.name);
                        const isOwnSession = isOccupied && isOccupied.teacherStaffId === currentTeacher.staffId;
                        return (
                          <button key={cls.id} onClick={() => handleToggleClassSelection(cls.code)} className={`p-6 rounded-[32px] border-2 text-left transition-all relative group h-full flex flex-col ${isSelected ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10' : isOccupied ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-lg'}`}>
                            {isSelected && <div className="absolute top-5 right-5 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md border-2 border-white"><Check className="w-4 h-4 stroke-[4]" /></div>}
                            <div className="space-y-5 flex-1 flex flex-col">
                               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 group-hover:bg-emerald-50 transition-colors shadow-xs"><Home className="w-6 h-6" /></div>
                               <div><h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{cls.name}</h4><p className="text-[11px] text-slate-500 font-mono font-bold mt-1 uppercase">{cls.block}</p></div>
                               <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400"><Users className="w-4 h-4" /><span>{cls.totalLearners} Learners</span></div>
                                  {isOccupied ? <span className={`text-[10px] font-black px-3 py-1 rounded-xl shadow-xs border ${isOwnSession ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>{isOwnSession ? 'YOUR SESSION' : 'OCCUPIED'}</span> : <span className="text-[10px] font-black px-3 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 shadow-xs">AVAILABLE</span>}
                               </div>
                            </div>
                          </button>
                        );
                      })}
                   </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 p-4">
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-600" /><span className="font-medium text-slate-600">GES Security Guard • Institutional Timetable Synchronized</span></div>
              <MiniKentePatch className="w-20 h-4 rounded-sm" />
            </div>
          </div>
        )}
      </main>
      <footer className="w-full mt-auto"><KenteStripe height="h-3.5 sm:h-4" /></footer>
      {aiHubOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setAiHubOpen(false)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-slide-left flex flex-col">
             <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400" /><h3 className="font-black text-sm uppercase tracking-tight">Gemini AI Assistant</h3></div>
                <button onClick={() => setAiHubOpen(false)} className="p-2 hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-hidden"><GesAiIntelligenceHub isOpen={aiHubOpen} onClose={() => setAiHubOpen(false)} students={[]} /></div>
          </div>
        </div>
      )}
    </div>
  );
};
