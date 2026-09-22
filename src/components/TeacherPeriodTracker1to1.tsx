import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  QrCode,
  Users,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  Home,
  Briefcase,
  Star,
  User,
  Wifi,
  Signal,
  Battery,
  X,
  Smartphone,
  Laptop,
  CheckCheck,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';
import { securityEngine } from '../utils/security';
import { QrDoorScannerModal } from './QrDoorScannerModal';
import { GesAiIntelligenceHub } from './GesAiIntelligenceHub';
import { Classroom, PeriodTeachingSession } from '../types';
import { useSchoolTheme } from '../hooks/useSchoolTheme';
import { storageEngine, getTodayDateString } from '../utils/storage';
import {
  Layers,
  ArrowRightLeft,
  Timer,
  AlertTriangle,
  Play,
  Square,
  Sparkle,
} from 'lucide-react';

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

// 35 Registered Students in Form 2A (Business Management)
interface StudentRosterItem {
  id: string;
  name: string;
  indexNumber: string;
  status: 'present' | 'absent' | 'late';
  seat: string;
}

const INITIAL_FORM_2A_STUDENTS: StudentRosterItem[] = [
  { id: 'st-01', name: 'Kwesi Mensah', indexNumber: 'GES-24-0012', status: 'present', seat: 'Row 1, Seat 1' },
  { id: 'st-02', name: 'Abena Osei Poku', indexNumber: 'GES-24-0015', status: 'present', seat: 'Row 1, Seat 2' },
  { id: 'st-03', name: 'Kofi Boateng Agyemang', indexNumber: 'GES-24-0021', status: 'present', seat: 'Row 1, Seat 3' },
  { id: 'st-04', name: 'Efua Addo Danquah', indexNumber: 'GES-24-0028', status: 'present', seat: 'Row 1, Seat 4' },
  { id: 'st-05', name: 'Yaw Frimpong Asante', indexNumber: 'GES-24-0033', status: 'absent', seat: 'Row 2, Seat 1' },
  { id: 'st-06', name: 'Akua Sarpong', indexNumber: 'GES-24-0039', status: 'present', seat: 'Row 2, Seat 2' },
  { id: 'st-07', name: 'Kwame Nkrumah Bempah', indexNumber: 'GES-24-0044', status: 'present', seat: 'Row 2, Seat 3' },
  { id: 'st-08', name: 'Ama Konadu Yeboah', indexNumber: 'GES-24-0050', status: 'present', seat: 'Row 2, Seat 4' },
  { id: 'st-09', name: 'Kojo Antwi Quaye', indexNumber: 'GES-24-0055', status: 'present', seat: 'Row 3, Seat 1' },
  { id: 'st-10', name: 'Yaa Asantewaa Bonsu', indexNumber: 'GES-24-0062', status: 'present', seat: 'Row 3, Seat 2' },
  { id: 'st-11', name: 'Ebenezer K. Annan', indexNumber: 'GES-24-0068', status: 'present', seat: 'Row 3, Seat 3' },
  { id: 'st-12', name: 'Priscilla Baah', indexNumber: 'GES-24-0074', status: 'present', seat: 'Row 3, Seat 4' },
  { id: 'st-13', name: 'Samuel Kwabena Tetteh', indexNumber: 'GES-24-0081', status: 'absent', seat: 'Row 4, Seat 1' },
  { id: 'st-14', name: 'Grace Mawufemor Dogbe', indexNumber: 'GES-24-0087', status: 'present', seat: 'Row 4, Seat 2' },
  { id: 'st-15', name: 'Daniel Kwaku Kyeremeh', indexNumber: 'GES-24-0092', status: 'present', seat: 'Row 4, Seat 3' },
  { id: 'st-16', name: 'Mercy Serwaa Akoto', indexNumber: 'GES-24-0099', status: 'present', seat: 'Row 4, Seat 4' },
  { id: 'st-17', name: 'David Selorm Agbenyega', indexNumber: 'GES-24-0105', status: 'present', seat: 'Row 5, Seat 1' },
  { id: 'st-18', name: 'Hannah Afua Badu', indexNumber: 'GES-24-0112', status: 'present', seat: 'Row 5, Seat 2' },
  { id: 'st-19', name: 'Joseph Papa Kwesi Yankey', indexNumber: 'GES-24-0118', status: 'present', seat: 'Row 5, Seat 3' },
  { id: 'st-20', name: 'Rebecca Korkor Lamptey', indexNumber: 'GES-24-0125', status: 'present', seat: 'Row 5, Seat 4' },
  { id: 'st-21', name: 'Peter Nii Aryee', indexNumber: 'GES-24-0131', status: 'present', seat: 'Row 6, Seat 1' },
  { id: 'st-22', name: 'Emmanuella Arthur', indexNumber: 'GES-24-0138', status: 'present', seat: 'Row 6, Seat 2' },
  { id: 'st-23', name: 'Michael Kojo Owusu', indexNumber: 'GES-24-0144', status: 'present', seat: 'Row 6, Seat 3' },
  { id: 'st-24', name: 'Esther Adomaa Donkor', indexNumber: 'GES-24-0150', status: 'present', seat: 'Row 6, Seat 4' },
  { id: 'st-25', name: 'Gideon Fiifi Appiah', indexNumber: 'GES-24-0157', status: 'present', seat: 'Row 7, Seat 1' },
  { id: 'st-26', name: 'Lydia Akosua Agyeiwaa', indexNumber: 'GES-24-0163', status: 'present', seat: 'Row 7, Seat 2' },
  { id: 'st-27', name: 'Solomon Nii Armah', indexNumber: 'GES-24-0170', status: 'present', seat: 'Row 7, Seat 3' },
  { id: 'st-28', name: 'Victoria Esi Ocran', indexNumber: 'GES-24-0176', status: 'present', seat: 'Row 7, Seat 4' },
  { id: 'st-29', name: 'Benjamin Kwabena Ofori', indexNumber: 'GES-24-0182', status: 'absent', seat: 'Row 8, Seat 1' },
  { id: 'st-30', name: 'Dorothy Afi Dzah', indexNumber: 'GES-24-0189', status: 'present', seat: 'Row 8, Seat 2' },
  { id: 'st-31', name: 'Isaac Yaw Acheampong', indexNumber: 'GES-24-0195', status: 'present', seat: 'Row 8, Seat 3' },
  { id: 'st-32', name: 'Ruth Adobea Amoah', indexNumber: 'GES-24-0201', status: 'present', seat: 'Row 8, Seat 4' },
  { id: 'st-33', name: 'Francis Kojo Gyan', indexNumber: 'GES-24-0208', status: 'present', seat: 'Row 9, Seat 1' },
  { id: 'st-34', name: 'Eunice Akua Boadiwaa', indexNumber: 'GES-24-0214', status: 'present', seat: 'Row 9, Seat 2' },
  { id: 'st-35', name: 'Stephen Nana Prempeh', indexNumber: 'GES-24-0220', status: 'present', seat: 'Row 9, Seat 3' },
];

// Additional stream for class merging (Form 2B General Arts / Joint Elective)
const FORM_2B_MERGED_STUDENTS: StudentRosterItem[] = [
  { id: 'st-b-01', name: 'Aaron Kweku Mensah', indexNumber: 'GES-24-0301', status: 'present', seat: 'Joint Form 2B • Row 1' },
  { id: 'st-b-02', name: 'Belinda Akua Osei', indexNumber: 'GES-24-0305', status: 'present', seat: 'Joint Form 2B • Row 1' },
  { id: 'st-b-03', name: 'Charles Yaw Boateng', indexNumber: 'GES-24-0312', status: 'present', seat: 'Joint Form 2B • Row 2' },
  { id: 'st-b-04', name: 'Doris Esi Danquah', indexNumber: 'GES-24-0318', status: 'present', seat: 'Joint Form 2B • Row 2' },
  { id: 'st-b-05', name: 'Eric Kwabena Frimpong', indexNumber: 'GES-24-0322', status: 'present', seat: 'Joint Form 2B • Row 3' },
  { id: 'st-b-06', name: 'Felicia Efua Sarpong', indexNumber: 'GES-24-0329', status: 'present', seat: 'Joint Form 2B • Row 3' },
  { id: 'st-b-07', name: 'George Kofi Nkrumah', indexNumber: 'GES-24-0335', status: 'present', seat: 'Joint Form 2B • Row 4' },
  { id: 'st-b-08', name: 'Harriet Ama Yeboah', indexNumber: 'GES-24-0341', status: 'present', seat: 'Joint Form 2B • Row 4' },
  { id: 'st-b-09', name: 'Isaac Kojo Quaye', indexNumber: 'GES-24-0348', status: 'present', seat: 'Joint Form 2B • Row 5' },
  { id: 'st-b-10', name: 'Janet Yaa Bonsu', indexNumber: 'GES-24-0354', status: 'present', seat: 'Joint Form 2B • Row 5' },
  { id: 'st-b-11', name: 'Kenneth Fiifi Annan', indexNumber: 'GES-24-0360', status: 'absent', seat: 'Joint Form 2B • Row 6' },
  { id: 'st-b-12', name: 'Linda Adobea Baah', indexNumber: 'GES-24-0366', status: 'present', seat: 'Joint Form 2B • Row 6' },
];

export const TeacherPeriodTracker1to1: React.FC = () => {
  const { theme } = useSchoolTheme();

  // Class structure state: Single Class vs Merged Classes
  const [classMode, setClassMode] = useState<'single' | 'merged'>('single');
  const [selectedSingleClass, setSelectedSingleClass] = useState<string>('Form 2A');
  const [autoDetectedMerged, setAutoDetectedMerged] = useState<boolean>(false);
  const [mergedStreams, setMergedStreams] = useState<string[]>(['Form 2B (General Arts)']);

  // Timetable scheduled window (Period 4: 11:05 - 11:40 AM)
  const scheduledStartTime = '11:05';
  const scheduledEndTime = '11:40';

  // Presence, punctuality and session states
  const [hasEnteredClass, setHasEnteredClass] = useState(false);
  const [doorQrScanned, setDoorQrScanned] = useState(false);
  const [doorScannerOpen, setDoorScannerOpen] = useState(false);
  const [students, setStudents] = useState<StudentRosterItem[]>(INITIAL_FORM_2A_STUDENTS);
  const [rollCallModalOpen, setRollCallModalOpen] = useState(false);
  const [geofenceVerified, setGeofenceVerified] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTabMobile, setActiveTabMobile] = useState<'home' | 'bag' | 'star' | 'profile'>('home');

  // aSc Timetable detection states
  const [actualEntryTime, setActualEntryTime] = useState<string>('11:06');
  const [punctualityStatus, setPunctualityStatus] = useState<'on_time' | 'late' | 'early_departure' | 'compliant' | null>(null);
  const [lateMinutes, setLateMinutes] = useState<number>(0);
  const [isLateArrival, setIsLateArrival] = useState<boolean>(false);
  const [actualExitTime, setActualExitTime] = useState<string | null>(null);
  const [earlyMinutes, setEarlyMinutes] = useState<number>(0);
  const [isEarlyDeparture, setIsEarlyDeparture] = useState<boolean>(false);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [aiHubOpen, setAiHubOpen] = useState<boolean>(false);

  // Sync roster when classMode toggles
  useEffect(() => {
    if (classMode === 'merged') {
      setStudents([...INITIAL_FORM_2A_STUDENTS, ...FORM_2B_MERGED_STUDENTS]);
    } else {
      setStudents(INITIAL_FORM_2A_STUDENTS);
    }
  }, [classMode]);

  // Computed counts
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const totalCount = students.length;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  // Auto-clear notification toast
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-Detect Concurrent aSc Timetable Classes for Merging
  const handleAutoDetectAscMerging = () => {
    soundSynthesizer.playScanBeep();
    setClassMode('merged');
    setAutoDetectedMerged(true);
    setNotification(
      '🤖 aSc Timetable Engine: Auto-detected concurrent elective slots for Form 2A & Form 2B. Classes successfully merged into joint lecture roster!'
    );
  };

  // Handle "I have entered class" with aSc Timetable progressive late arrival detection (5m, 10m, 15m, 30m prompts to Master)
  const handleEnterClass = (simulatedTime?: string) => {
    soundSynthesizer.playClockInChime();
    const entryTime = simulatedTime || '11:06';
    setActualEntryTime(entryTime);
    setHasEnteredClass(true);

    // Calculate late arrival against aSc 11:05 start with 5m grace (11:10)
    const [schedH, schedM] = scheduledStartTime.split(':').map(Number);
    const [actH, actM] = entryTime.split(':').map(Number);
    const diffMins = (actH * 60 + actM) - (schedH * 60 + schedM);

    if (diffMins > 5) {
      const lateM = diffMins;
      setIsLateArrival(true);
      setLateMinutes(lateM);
      setPunctualityStatus('late');

      // Dispatch security incident alert to Master / Headmaster / Admin dashboard
      securityEngine.logIncident({
        schoolCode: theme.code,
        type: lateM >= 15 ? 'critical_tardiness' : 'teacher_late_arrival',
        severity: lateM >= 15 ? 'critical' : 'warning',
        status: 'active_alert',
        details: `⚠️ PROMPT TO MASTER: Teacher Mr. Kwame Amponsah arrived ${lateM} minutes late for Period 4 (${selectedSingleClass} Business Management). Scheduled 11:05 AM, Entered ${entryTime}.`,
        staffIdAttempted: 'GES-T-0428',
        staffNameAttempted: 'Mr. Kwame Amponsah',
        deviceSignature: 'teacher-byod-terminal',
      });

      setNotification(
        `🚨 LATE ARRIVAL ALERT (${lateM} MINS LATE): Entered at ${entryTime}. Master & School Admin alerted immediately!`
      );
    } else {
      setIsLateArrival(false);
      setLateMinutes(0);
      setPunctualityStatus('on_time');
      setNotification(
        `✅ ON-TIME ENTRY VERIFIED: Entered at ${entryTime} (Within 5-min aSc grace). Verified inside Room 4.`
      );
    }
  };

  // Handle Door QR Scan
  const handleScanDoorQR = () => {
    soundSynthesizer.playScanBeep();
    setDoorScannerOpen(true);
  };

  const handleDoorScannedSuccess = () => {
    soundSynthesizer.playScanBeep();
    setDoorQrScanned(true);
    setDoorScannerOpen(false);
    handleEnterClass('11:06');
    setNotification('Classroom Door QR Scanned! Room 4 door signature verified against aSc Master Timetable.');
  };

  // Handle Early Departure & Period Conclusion (Prompt Master if leaving early)
  const handleConcludePeriod = (simulatedExitTime?: string) => {
    const exitTime = simulatedExitTime || '11:40';
    setActualExitTime(exitTime);
    setSessionCompleted(true);

    // aSc Timetable scheduled end: 11:40. Early if leaving before 11:35 (>5m early)
    const [endH, endM] = scheduledEndTime.split(':').map(Number);
    const [exitH, exitM] = exitTime.split(':').map(Number);
    const diffEarly = (endH * 60 + endM) - (exitH * 60 + exitM);

    const isEarly = diffEarly > 5;
    setIsEarlyDeparture(isEarly);
    setEarlyMinutes(Math.max(0, diffEarly));
    const effectivePunctuality = isEarly ? 'early_departure' : isLateArrival ? 'late' : 'on_time';
    setPunctualityStatus(effectivePunctuality);

    if (isEarly) {
      soundSynthesizer.playOutOfBoundsBuzzer();

      // Dispatch early departure incident to Master / Headmaster
      securityEngine.logIncident({
        schoolCode: theme.code,
        type: 'early_departure',
        severity: 'critical',
        status: 'active_alert',
        details: `🚨 EARLY DEPARTURE ALERT TO MASTER: Teacher Mr. Kwame Amponsah departed early by ${diffEarly} minutes (Scheduled 11:40 AM, Left ${exitTime}). Master notified.`,
        staffIdAttempted: 'GES-T-0428',
        staffNameAttempted: 'Mr. Kwame Amponsah',
        deviceSignature: 'teacher-byod-terminal',
      });

      setNotification(
        `🚨 EARLY DEPARTURE ALERT: Left at ${exitTime} (${diffEarly} mins early). Master & School Admin alerted!`
      );
    } else {
      soundSynthesizer.playClockInChime();
      setNotification(
        `✅ FULL PERIOD COMPLETED: Concluded at ${exitTime} (35/35 mins taught). Attendance & Timetable record synchronized.`
      );
    }

    // Persist teaching session to durable storage
    const sessionRecord: PeriodTeachingSession = {
      id: `period-${Date.now()}`,
      teacherId: 'staff-4',
      teacherName: 'Mr. Kwame Amponsah',
      teacherStaffId: 'GES-T-0428',
      classroomId: 'cls-rm-04',
      className: classMode === 'merged' ? 'Form 2A + Form 2B (Joint)' : 'Form 2A',
      classCode: 'AMHS-RM04-2A',
      isMerged: classMode === 'merged',
      mergedClassCodes: classMode === 'merged' ? ['AMHS-RM04-2A', 'AMHS-RM05-2B'] : undefined,
      mergedClassNames: classMode === 'merged' ? ['Form 2A', 'Form 2B'] : undefined,
      subject: 'Business Management',
      date: getTodayDateString(),
      startTime: actualEntryTime,
      startTimestamp: Date.now() - 35 * 60000,
      endTime: exitTime,
      endTimestamp: Date.now(),
      elapsedMinutes: Math.max(1, 35 - (isEarly ? diffEarly : 0) - (isLateArrival ? lateMinutes : 0)),
      totalRosterCount: students.length,
      presentCount,
      absentLearnerIds: students.filter((s) => s.status === 'absent').map((s) => s.id),
      absentLearnerNames: students.filter((s) => s.status === 'absent').map((s) => s.name),
      notes:
        classMode === 'merged'
          ? `Joint Merged Period with Form 2B. ${isEarly ? `Early departure by ${diffEarly}m.` : 'Full session.'}`
          : `Standard Single Class Period. ${isLateArrival ? `Late arrival by ${lateMinutes}m.` : 'Punctual.'}`,
      schoolCode: theme.code,
      schoolName: theme.name,
      periodNumber: 4,
      scheduledStartTime,
      scheduledEndTime,
      actualStartTime: actualEntryTime,
      actualEndTime: exitTime,
      isLateArrival,
      lateMinutes,
      isEarlyDeparture: isEarly,
      earlyMinutes: Math.max(0, diffEarly),
      punctualityStatus: effectivePunctuality,
      synced: true,
    };

    storageEngine.addPeriodSession(sessionRecord);
    try {
      window.dispatchEvent(new CustomEvent('ges_session_saved', { detail: { session: sessionRecord } }));
    } catch {
      // ignore
    }
  };

  // Toggle student attendance
  const toggleStudentStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const nextStatus: StudentRosterItem['status'] =
          student.status === 'present' ? 'absent' : student.status === 'absent' ? 'late' : 'present';
        return { ...student, status: nextStatus };
      })
    );
  };

  // Mock classroom for the modal
  const mockClassrooms: Classroom[] = [
    {
      id: 'cls-rm-04',
      name: 'Room 4 — Form 2A (Business Management)',
      code: 'AMHS-RM04-2A',
      block: 'Block B - Room 4',
      grade: 'Form 2',
      totalLearners: 35,
      roster: [],
      currentSession: undefined,
    },
    {
      id: 'cls-rm-05',
      name: 'Room 5 — Form 3B (General Arts)',
      code: 'AMHS-RM05-3B',
      block: 'Block A - Room 5',
      grade: 'Form 3',
      totalLearners: 40,
      roster: [],
      currentSession: undefined,
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#EEF2F6] flex flex-col items-center select-none font-sans text-slate-800">
      {/* TOP KENTE BORDER */}
      <KenteStripe height="h-3.5 sm:h-4" />

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed top-6 z-50 max-w-lg mx-auto px-4 py-3 bg-emerald-900/95 text-white rounded-xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
          <p className="text-xs font-semibold">{notification}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-emerald-300 hover:text-white p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP BANNER TITLE & SUBTITLE */}
      <header className="w-full text-center pt-5 pb-4 px-4">
        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-extrabold tracking-tight text-[#1E293B]">
          PERIOD TRACKER — TEACHER CLASSROOM ATTENDANCE
        </h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1">
          Ghana School • 8-Period Daily Timetable • Real-time Attendance Tracking
        </p>
      </header>

      {/* MAIN DUAL-VIEW CONTAINER: DESKTOP LEFT CARD + MOBILE RIGHT PHONE */}
      <main className="w-full max-w-[1340px] mx-auto px-3 sm:px-6 py-2 pb-12 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-8">
        
        {/* ========================================================================= */}
        {/* DESKTOP TEACHER PORTAL CARD (LEFT) */}
        {/* ========================================================================= */}
        <div className="w-full lg:max-w-[760px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/90 flex flex-col">
          
          {/* HEADER: Slanted Green Shape on Left + School & Teacher Info on Right */}
          <div className="flex flex-col sm:flex-row items-stretch justify-between bg-white border-b border-slate-100 relative">
            
            {/* Left Slanted Green Brand Block */}
            <div
              className="text-white px-5 sm:px-7 py-4 flex items-center gap-3 relative sm:pr-14 transition-colors duration-300"
              style={{
                backgroundColor: theme.primary,
                clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)',
              }}
            >
              {/* Gold 5-point Star Emblem */}
              <div
                className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  borderColor: theme.secondary || '#FACC15',
                  backgroundColor: `${theme.secondary || '#EAB308'}33`,
                }}
              >
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-extrabold tracking-widest text-emerald-100 uppercase">
                  GHANA EDUCATION SERVICE
                </div>
                <div className="text-base sm:text-lg font-black text-white tracking-tight">
                  Teacher Portal
                </div>
              </div>
            </div>

            {/* Right School & Teacher Info */}
            <div className="px-5 py-3.5 flex items-center justify-end gap-3 sm:gap-5 flex-1 bg-white">
              {/* AI Suite Trigger Button */}
              <button
                type="button"
                onClick={() => setAiHubOpen(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span className="hidden sm:inline">GES Gemini AI Suite</span>
                <span className="sm:hidden">AI Hub</span>
              </button>

              {/* School Location */}
              <div className="hidden md:flex items-center gap-2 text-right">
                <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {theme.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {theme.region}, Ghana
                  </p>
                </div>
              </div>

              {/* Teacher Info */}
              <div className="flex items-center gap-2.5 text-right">
                <div>
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-xs font-bold text-slate-900">Mr. K. Amponsah</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Business Management Teacher
                  </p>
                </div>

                {/* Avatar circle */}
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-emerald-600/30 shrink-0 shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    alt="Mr. K. Amponsah"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD INNER BODY */}
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Section Header: Today's Timetable */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span>Today's Timetable • Mon, 21 Oct 2024</span>
            </div>

            {/* TWO INNER CARDS: CURRENT CLASS (Left) & TODAY OVERVIEW (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* ------------------------------------------------------------- */}
              {/* LEFT INNER CARD: CURRENT CLASS */}
              {/* ------------------------------------------------------------- */}
              <div className="md:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                
                <div>
                  {/* Gold Label & Class Structure Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4AF37]">
                      CURRENT CLASS —
                    </div>

                    {/* Single Class vs Merged Classes Toggle */}
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setClassMode('single')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          classMode === 'single'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Single Class
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassMode('merged')}
                        className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition ${
                          classMode === 'merged'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>Merged Classes</span>
                      </button>
                    </div>
                  </div>

                  {/* Class Title */}
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
                      {classMode === 'merged' ? 'Form 2A + Form 2B • Business Management' : 'Form 2A • Business Management'}
                    </h2>
                  </div>

                  {/* Merged Classes Stream Details if in Merged Mode */}
                  {classMode === 'merged' && (
                    <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-emerald-900 font-bold">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Joint Stream Mode Active</span>
                        </div>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          47 Total Learners Enrolled
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        Merged Streams: <strong>Form 2A (Room 4)</strong> + <strong>Form 2B (General Arts Stream)</strong>. Attendance roster automatically unified for joint lecture.
                      </p>
                    </div>
                  )}

                  {/* Room 4 Badge & aSc Timetable Slot */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-white text-xs font-bold shadow-2xs transition-colors duration-300"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <MapPin className="w-3 h-3 text-white" />
                      Room 4
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                      <Timer className="w-3 h-3 text-slate-500" />
                      aSc Slot: 11:05 — 11:40 AM (Period 4)
                    </span>
                  </div>

                  {/* aSc Timetable Punctuality Status Badge */}
                  <div className="mt-2.5">
                    {!hasEnteredClass ? (
                      <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                        <span>Awaiting class entry • 5-min grace period ends at <strong>11:10 AM</strong></span>
                      </div>
                    ) : sessionCompleted ? (
                      isEarlyDeparture ? (
                        <div className="flex items-center gap-2 text-xs bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg text-rose-800 font-medium">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Early Departure Infraction:</strong> Exited at {actualExitTime} ({earlyMinutes} mins before 11:40 AM). Flagged to School & Super Admin.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Full Period Completed:</strong> Concluded at {actualExitTime} (Full 35 mins taught). Compliant with aSc timetable.
                          </span>
                        </div>
                      )
                    ) : isLateArrival ? (
                      <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg text-amber-900 font-medium">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          <strong>Late Arrival Infraction:</strong> Entered at {actualEntryTime} (+{lateMinutes}m after 11:05 AM start). Flagged in Timetable Audit.
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>On-Time Entry:</strong> Entered at {actualEntryTime} (Within 5-min aSc grace). Teacher in classroom.
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  {!hasEnteredClass ? (
                    <>
                      {/* Button 1: Green "I have entered class" */}
                      <button
                        onClick={() => handleEnterClass('11:06')}
                        style={{ backgroundColor: theme.primary }}
                        className="w-full h-11 sm:h-12 rounded-full font-bold text-xs sm:text-sm text-white shadow-sm flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer hover:opacity-90"
                      >
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                        <span>I have entered class</span>
                      </button>

                      {/* Button 2: White with Gold Border "Scan classroom door QR" */}
                      <button
                        onClick={handleScanDoorQR}
                        style={{ borderColor: theme.secondary || '#D4AF37', color: theme.secondary || '#B8860B' }}
                        className="w-full h-10 rounded-lg border bg-white hover:bg-amber-50/60 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition active:scale-[0.99] cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" style={{ color: theme.secondary || '#D4AF37' }} />
                        <span>Scan classroom door QR</span>
                      </button>
                    </>
                  ) : !sessionCompleted ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Actual Entry Time</span>
                          <span className="text-sm font-black text-slate-900">{actualEntryTime} AM</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Scheduled End</span>
                          <span className="text-sm font-black text-slate-900">11:40 AM</span>
                        </div>
                      </div>

                      {/* Conclude & Exit Period Button */}
                      <button
                        onClick={() => handleConcludePeriod('11:40')}
                        className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
                      >
                        <Square className="w-4 h-4 text-emerald-400" />
                        <span>Conclude & Log Out Period (Full 35 Mins)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">Period 4 Completed & Synced</span>
                        <span className="text-slate-500">
                          {actualEntryTime} AM → {actualExitTime} AM • {punctualityStatus === 'early_departure' ? 'Early Departure' : punctualityStatus === 'late' ? 'Late Entry' : 'On-Time'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setHasEnteredClass(false);
                          setSessionCompleted(false);
                          setIsLateArrival(false);
                          setIsEarlyDeparture(false);
                          setPunctualityStatus(null);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-[11px] font-bold text-slate-700"
                      >
                        Reset Test
                      </button>
                    </div>
                  )}

                  {/* Timetable Infraction Test Simulator Bar */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        aSc Timetable Test Simulation:
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleEnterClass('11:06')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-200 transition"
                      >
                        🟢 On-Time (11:06)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEnterClass('11:18')}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-md border border-amber-200 transition"
                      >
                        ⚠️ Late (+13m)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!hasEnteredClass) handleEnterClass('11:06');
                          handleConcludePeriod('11:25');
                        }}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-md border border-rose-200 transition"
                      >
                        🚨 Early Exit (-15m)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Below Stats: Present: 32 | Absent: 3 | Total: 35 */}
                <div
                  onClick={() => setRollCallModalOpen(true)}
                  title="Click to open interactive roll-call student roster"
                  className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50/70 p-1.5 rounded-lg transition"
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserCheck className="w-3 h-3 text-[#0B6D2F]" />
                    </div>
                    <span className="font-semibold text-slate-600">Present:</span>
                    <span className="font-extrabold text-[#0B6D2F]">{presentCount}</span>
                  </div>

                  <div className="w-px h-4 bg-slate-200" />

                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                      <UserX className="w-3 h-3 text-slate-500" />
                    </div>
                    <span className="font-semibold text-slate-600">Absent:</span>
                    <span className="font-extrabold text-slate-700">{absentCount}</span>
                  </div>

                  <div className="w-px h-4 bg-slate-200" />

                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600">Total:</span>
                    <span className="font-extrabold text-slate-900">{totalCount}</span>
                  </div>
                </div>

              </div>

              {/* ------------------------------------------------------------- */}
              {/* RIGHT INNER CARD: TODAY OVERVIEW */}
              {/* ------------------------------------------------------------- */}
              <div className="md:col-span-5 bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] mb-3">
                    Today Overview
                  </h3>

                  {/* Metric 1: Classes Today: 8 */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-100/90 border border-amber-300/80 flex items-center justify-center text-[#D4AF37] shadow-2xs">
                      <Calendar className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Classes Today:</p>
                      <p className="text-sm font-extrabold text-slate-900">8</p>
                    </div>
                  </div>

                  {/* Metric 2: Attendance Rate: 91% */}
                  <div className="py-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-slate-600">Attendance Rate:</span>
                      <span className="text-2xl font-black text-slate-900">{attendanceRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5 shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${attendanceRate}%`, backgroundColor: theme.primary }}
                      />
                    </div>
                  </div>

                  {/* Metric 3: Pending: 1 */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-lg bg-amber-100/90 border border-amber-300/80 flex items-center justify-center text-[#D4AF37] shadow-2xs">
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 font-medium">Pending:</p>
                      <p className="text-sm font-extrabold text-slate-900">1</p>
                    </div>
                  </div>
                </div>

                {/* Yellow Term Info Card with Mini Kente Footer */}
                <div className="bg-[#FEF3C7]/80 border border-[#FDE68A] rounded-xl p-3 text-xs relative overflow-hidden shadow-2xs">
                  <div className="font-extrabold text-[#92400E]">
                    Ghana School Term: 2nd Term • Week 6
                  </div>
                  <p className="text-slate-700 font-medium text-[11px] mt-1 leading-snug">
                    Remember to log attendance before period ends
                  </p>
                  <div className="mt-2.5 -mx-3 -mb-3">
                    <KenteStripe height="h-2" />
                  </div>
                </div>

              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PERIOD TIMELINE — 8 PERIODS TODAY */}
            {/* ------------------------------------------------------------- */}
            <div className="pt-2">
              <h3 className="text-base font-extrabold text-[#1E293B] mb-3">
                Period Timeline — 8 Periods Today
              </h3>

              <div className="space-y-1.5 text-xs">
                {/* 1. 08:00 - 08:50 Maths Form 3B */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <span className="font-bold text-slate-500 w-4">1.</span>
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-800">
                      08:00 - 08:50 • Maths • Form 3B
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Completed</span>
                  </div>
                </div>

                {/* 2. 08:50 - 09:40 Integrated Science Form 1C */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <span className="font-bold text-slate-500 w-4">2.</span>
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-800">
                      08:50 - 09:40 • Integrated Science • Form 1C
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Completed</span>
                  </div>
                </div>

                {/* 3. 09:40 - 10:30 English Form 2D */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-700">
                    <span className="font-bold text-slate-500 w-4">3.</span>
                    <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-800">
                      09:40 - 10:30 • English • Form 2D
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Completed</span>
                  </div>
                </div>

                {/* 4. 10:50 - 11:40 Business Management Form 2A — NOW ACTIVE (Green Highlight) */}
                <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#EAF7EE] border-l-4 border-[#0B6D2F] font-bold text-slate-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#0B6D2F] w-4">4.</span>
                    <div className="w-4 h-4 rounded-full bg-[#0B6D2F] flex items-center justify-center text-white shrink-0 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-slate-900 font-bold">
                      10:50 - 11:40 • Business Management • Form 2A
                    </span>
                  </div>
                  <div className="flex-1 border-b border-emerald-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-[#0B6D2F] font-bold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-[#0B6D2F] animate-pulse" />
                    <span>Now — Active</span>
                  </div>
                </div>

                {/* 5. 11:40 - 12:30 Business Management Form 2A — Upcoming in */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-100/70">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <span className="font-bold text-slate-400 w-4">5.</span>
                    <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-700">
                      11:40 - 12:30 • Business Management • Form 2A
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-500 font-medium shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Upcoming in</span>
                  </div>
                </div>

                {/* 6. 12:30 - 13:20 Lunch Break */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <span className="font-bold text-slate-400 w-4">6.</span>
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-600">
                      12:30 - 13:20 • Lunch Break
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Upcoming</span>
                  </div>
                </div>

                {/* 7. 13:20 - 14:10 Economics Form 3A */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <span className="font-bold text-slate-400 w-4">7.</span>
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-600">
                      13:20 - 14:10 • Economics • Form 3A
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Upcoming</span>
                  </div>
                </div>

                {/* 8. 14:10 - 15:00 Accounting Form 2A */}
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <span className="font-bold text-slate-400 w-4">8.</span>
                    <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-medium text-slate-600">
                      14:10 - 15:00 • Accounting • Form 2A
                    </span>
                  </div>
                  <div className="flex-1 border-b border-slate-200 mx-3 min-w-[20px]" />
                  <div className="flex items-center gap-2 text-slate-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <span>Upcoming</span>
                  </div>
                </div>

              </div>
            </div>

            {/* DESKTOP CARD FOOTER: "Ghana Education Service • Attendance automatically synced" + Kente patch */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-600">
                  Ghana Education Service • Attendance automatically synced
                </span>
              </div>
              <MiniKentePatch className="w-20 h-4 rounded-sm" />
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW PHONE FRAME (RIGHT) */}
        {/* ========================================================================= */}
        <div className="w-[330px] sm:w-[360px] shrink-0">
          
          {/* External Black Phone Shell */}
          <div className="bg-[#0B0F19] rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50">
            
            {/* Top Speaker / Camera Notch */}
            <div className="w-32 h-4 bg-slate-950 rounded-full mx-auto mb-1 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-[#F8FAFC] rounded-[38px] overflow-hidden flex flex-col border border-slate-800 min-h-[640px]">
              
              {/* Phone Status Bar */}
              <div
                className="text-white px-5 pt-2 pb-1 flex items-center justify-between text-[11px] font-bold transition-colors duration-300"
                style={{ backgroundColor: theme.primary }}
              >
                <span>11:05</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <div className="w-4 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                    <div className="h-full w-full bg-white rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Phone App Header */}
              <div
                className="text-white px-4 pb-3 flex items-center justify-between shadow-xs transition-colors duration-300"
                style={{ backgroundColor: theme.primary }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: theme.secondary || '#FACC15',
                      backgroundColor: `${theme.secondary || '#EAB308'}33`,
                    }}
                  >
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    Period Tracker
                  </span>
                </div>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/60">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
                    alt="Teacher"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Phone Scrollable Content */}
              <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                {activeTabMobile === 'home' && (
                  <>
                    {/* Date Pill */}
                    <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-1 shadow-2xs flex items-center justify-center gap-1.5 w-fit mx-auto text-[11px] font-bold text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>Mon, 21 Oct 2024</span>
                    </div>

                    {/* NOW CARD: Warm Yellow/Gold Background */}
                    <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-3.5 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-amber-900 tracking-wide">
                          NOW • Period 4
                        </span>
                        <span className="text-[10px] font-bold text-amber-800">{theme.shortName || 'AMHS'}</span>
                      </div>

                      {/* Mobile Class Mode Selector */}
                      <div className="flex items-center gap-1 p-0.5 bg-amber-200/60 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setClassMode('single')}
                          className={`flex-1 py-1 rounded-md transition ${
                            classMode === 'single' ? 'bg-white text-slate-900 shadow-2xs' : 'text-amber-900'
                          }`}
                        >
                          Single Class
                        </button>
                        <button
                          type="button"
                          onClick={() => setClassMode('merged')}
                          className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 transition ${
                            classMode === 'merged' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-amber-900'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>Merged Joint</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">
                          {classMode === 'merged' ? 'Form 2A + Form 2B —' : 'Form 2A —'}
                        </h4>
                        <p className="text-sm font-black text-slate-900">
                          Business Management
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-slate-600" />
                        <span>Room 4 • 11:05-11:40 AM</span>
                      </div>

                      {/* Status Pill */}
                      {hasEnteredClass && (
                        <div
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold text-center w-full shadow-2xs ${
                            isEarlyDeparture
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isLateArrival
                              ? 'bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {isEarlyDeparture
                            ? `🚨 Early Departure: Left at ${actualExitTime} (-${earlyMinutes}m)`
                            : isLateArrival
                            ? `⚠️ Late Arrival: Entered ${actualEntryTime} (+${lateMinutes}m)`
                            : `✅ On-Time: Entered ${actualEntryTime} (aSc Verified)`}
                        </div>
                      )}
                    </div>

                    {/* Stacked Buttons on Mobile */}
                    <div className="space-y-2">
                      {!hasEnteredClass ? (
                        <>
                          {/* Button 1: Green "I have entered class" */}
                          <button
                            onClick={() => handleEnterClass('11:06')}
                            style={{ backgroundColor: theme.primary }}
                            className="w-full h-11 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.98] cursor-pointer hover:opacity-90"
                          >
                            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                            <span>I have entered class</span>
                          </button>

                          {/* Button 2: White/Gold "Scan classroom door QR" */}
                          <button
                            onClick={handleScanDoorQR}
                            style={{ borderColor: theme.secondary || '#D4AF37', color: theme.secondary || '#B8860B' }}
                            className="w-full h-10 bg-white border rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs hover:bg-amber-50/60 transition active:scale-[0.98] cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" style={{ color: theme.secondary || '#D4AF37' }} />
                            <span>Scan classroom door QR</span>
                          </button>
                        </>
                      ) : !sessionCompleted ? (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => handleConcludePeriod('11:40')}
                            className="w-full h-10 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Conclude & Exit Period</span>
                          </button>
                          <button
                            onClick={() => handleConcludePeriod('11:25')}
                            className="w-full h-8 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Simulate Early Exit (-15m)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-bold text-emerald-800">
                          Period 4 Session Concluded & Logged
                        </div>
                      )}
                    </div>

                    {/* Attendance Bar on Mobile */}
                    <div
                      onClick={() => setRollCallModalOpen(true)}
                      className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-2xs cursor-pointer hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span>Attendance</span>
                        <span className="text-[#0B6D2F]">{presentCount}/{totalCount} Present</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0B6D2F] rounded-full transition-all duration-500"
                          style={{ width: `${attendanceRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Today's Schedule on Mobile */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-black text-slate-900 mb-1">
                        Today's Schedule
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">P1 Maths F3B</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Completed</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">P2 Integrated Science F1C</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Completed</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">P3 English F2D</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>Completed</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        </div>
                      </div>

                      {/* P4 Active */}
                      <div className="bg-[#EAF7EE] rounded-lg p-2 border border-[#0B6D2F]/30 flex items-center justify-between text-[11px] font-bold text-[#0B6D2F]">
                        <span>P4 Business Management F2A</span>
                        <span className="text-[10px] bg-[#0B6D2F] text-white px-1.5 py-0.2 rounded-xs">Now • In Progress</span>
                      </div>

                      <div className="bg-white rounded-lg p-2 border border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>P5 11:40 — Economics • Form 2A</span>
                        <span>Upcoming</span>
                      </div>
                    </div>
                  </>
                )}

                {/* TEACHER'S BAG VIEW */}
                {activeTabMobile === 'bag' && (
                  <div className="space-y-3">
                    <div className="text-center py-1">
                      <h4 className="text-xs font-black text-slate-900">Teaching Bag & Curriculum</h4>
                      <p className="text-[10px] text-slate-500">Lesson Plans, Notes & Syllabi</p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#0B6D2F]" />
                        <span>Form 2A Lesson Notes</span>
                      </div>
                      <p className="text-[11px] text-slate-600">Topic: Forms of Business Ownership & Partnership Law</p>
                      <span className="inline-block text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Approved by HOD
                      </span>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Term 1 Scheme of Work</span>
                      </div>
                      <p className="text-[11px] text-slate-600">Week 6 of 12 • 4 Periods conducted this week</p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-amber-500 h-full w-[60%]" />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundSynthesizer.playScanBeep();
                        alert('Curriculum Syllabus & Question Bank downloaded to device.');
                      }}
                      className="w-full py-2 bg-[#0B6D2F] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95"
                    >
                      Download WAEC Past Questions
                    </button>
                  </div>
                )}

                {/* PERFORMANCE & MILESTONES VIEW (STAR) */}
                {activeTabMobile === 'star' && (
                  <div className="space-y-3">
                    <div className="text-center py-1">
                      <h4 className="text-xs font-black text-slate-900">Teacher Performance & Star</h4>
                      <p className="text-[10px] text-slate-500">GES National Punctuality Rating</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-yellow-100 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center mx-auto shadow-md">
                        <Star className="w-6 h-6 fill-slate-900" />
                      </div>
                      <div>
                        <div className="text-xl font-black text-slate-900">96.4%</div>
                        <p className="text-[11px] font-bold text-amber-900">Exemplary Punctuality Rating</p>
                      </div>
                      <p className="text-[10px] text-amber-800">
                        Top 5% of teaching staff in Volta & Greater Accra Directorates
                      </p>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Periods Held This Term:</span>
                        <strong className="text-slate-900">64 / 64 (100%)</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Avg Gate Check-in Time:</span>
                        <strong className="text-emerald-700">07:28 AM (On-Time)</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Learner Engagement:</span>
                        <strong className="text-indigo-700">94.8%</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEACHER PROFILE VIEW */}
                {activeTabMobile === 'profile' && (
                  <div className="space-y-3">
                    <div className="text-center py-1">
                      <h4 className="text-xs font-black text-slate-900">Teacher Institutional Profile</h4>
                      <p className="text-[10px] text-slate-500">GES Master Staff Credentials</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center space-y-2 shadow-2xs">
                      <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center mx-auto shadow-sm">
                        EE
                      </div>
                      <div>
                        <h5 className="font-extrabold text-sm text-slate-900">Mr. Eugene Fafali Esianyo</h5>
                        <p className="text-[11px] text-slate-500 font-mono">Staff ID: 1304201</p>
                      </div>
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                        Senior Teacher • Permanent
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Institution:</span>
                        <strong className="text-slate-800">{theme.name}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Primary Department:</span>
                        <strong className="text-slate-800">Business Studies</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Subjects:</span>
                        <strong className="text-slate-800">Bus. Mgt, Economics, Core Maths</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Device Security:</span>
                        <strong className="text-emerald-700">2FA SMS Verified</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundSynthesizer.playScanBeep();
                        window.location.href = '/attendance?type=teaching';
                      }}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                    >
                      Gate Clock-in Terminal →
                    </button>
                  </div>
                )}
              </div>

              {/* Phone Bottom Navigation Bar */}
              <div className="bg-white border-t border-slate-200 py-2.5 px-6 flex items-center justify-between text-slate-400 shadow-xs">
                <button
                  onClick={() => setActiveTabMobile('home')}
                  className={`p-1.5 transition ${activeTabMobile === 'home' ? 'text-[#0B6D2F]' : 'hover:text-slate-600'}`}
                >
                  <Home className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTabMobile('bag')}
                  className={`p-1.5 transition ${activeTabMobile === 'bag' ? 'text-[#0B6D2F]' : 'hover:text-slate-600'}`}
                >
                  <Briefcase className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTabMobile('star')}
                  className={`p-1.5 transition ${activeTabMobile === 'star' ? 'text-[#0B6D2F]' : 'hover:text-slate-600'}`}
                >
                  <Star className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTabMobile('profile')}
                  className={`p-1.5 transition ${activeTabMobile === 'profile' ? 'text-[#0B6D2F]' : 'hover:text-slate-600'}`}
                >
                  <User className="w-5 h-5" />
                </button>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* BOTTOM KENTE BORDER */}
      <footer className="w-full mt-auto">
        <KenteStripe height="h-3.5 sm:h-4" />
      </footer>

      {/* ========================================================================= */}
      {/* INTERACTIVE STUDENT ROLL CALL MODAL */}
      {/* ========================================================================= */}
      {rollCallModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#0B6D2F] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-extrabold text-base">
                    Form 2A Roll Call — Business Management
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Room 4 • Period 4 (11:05 - 11:40 AM) • 35 Registered Learners
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRollCallModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#0B6D2F]">
                  Present: {presentCount}
                </span>
                <span className="font-bold text-red-600">
                  Absent: {absentCount}
                </span>
                <span className="text-slate-500">
                  Total: {totalCount}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Tap any student to cycle: Present / Absent / Late
              </div>
            </div>

            {/* Students List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {students.map((st, index) => (
                <div
                  key={st.id}
                  onClick={() => toggleStudentStatus(st.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    st.status === 'present'
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
                      : st.status === 'absent'
                      ? 'bg-red-50/70 border-red-200 text-slate-900'
                      : 'bg-amber-50/70 border-amber-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-xs font-bold text-slate-400">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-xs font-bold">{st.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {st.indexNumber} • {st.seat}
                      </p>
                    </div>
                  </div>

                  <div>
                    {st.status === 'present' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B6D2F] text-white text-[10px] font-bold">
                        <Check className="w-3 h-3 stroke-[3]" /> Present
                      </span>
                    )}
                    {st.status === 'absent' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        <X className="w-3 h-3 stroke-[3]" /> Absent
                      </span>
                    )}
                    {st.status === 'late' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                        <Clock className="w-3 h-3" /> Late
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Attendance instantly logged to GES server</span>
              </div>
              <button
                onClick={() => {
                  soundSynthesizer.playClockInChime();
                  setRollCallModalOpen(false);
                  setNotification(`Roll Call Updated! ${presentCount}/${totalCount} students marked present.`);
                }}
                className="px-5 py-2 rounded-xl bg-[#0B6D2F] hover:bg-[#095725] text-white text-xs font-bold shadow-xs transition"
              >
                Save Attendance
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QR DOOR SCANNER MODAL */}
      {/* ========================================================================= */}
      <QrDoorScannerModal
        isOpen={doorScannerOpen}
        onClose={() => setDoorScannerOpen(false)}
        classrooms={mockClassrooms}
        onSelectClassroom={(cls) => {
          handleDoorScannedSuccess();
        }}
      />

      {/* ========================================================================= */}
      {/* GES GEMINI AI INTELLIGENCE HUB MODAL */}
      {/* ========================================================================= */}
      <GesAiIntelligenceHub
        isOpen={aiHubOpen}
        onClose={() => setAiHubOpen(false)}
        students={students}
        onApplyVoiceRollCall={(updates) => {
          setStudents((prev) =>
            prev.map((s) => {
              const found = updates.find((u) => u.studentId === s.id || u.studentId?.toLowerCase() === s.name.toLowerCase());
              if (found) {
                return { ...s, status: found.status as any };
              }
              return s;
            })
          );
        }}
      />

    </div>
  );
};
