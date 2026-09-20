import React, { useState, useEffect, useMemo } from 'react';
import {
  School,
  Play,
  Square,
  Users,
  Clock,
  BookOpen,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  Building2,
  Sparkles,
  Bot,
  X,
  Check,
  FileText,
  GitMerge,
  Layers,
  Filter,
  CheckSquare,
  Calendar,
  GraduationCap,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  Classroom,
  StaffMember,
  PeriodTeachingSession,
  Learner,
} from '../types';
import { soundSynthesizer } from '../utils/audio';
import { getTodayDateString } from '../utils/storage';
import {
  lookupClassScheduleSlot,
  getCurrentAscPeriod,
  getCurrentWeekDay,
  isSubjectCore,
  ASC_PERIODS,
  WeekDay,
} from '../utils/timetableData';
import { TimetableModal } from './TimetableModal';

interface PeriodTrackerModeProps {
  classrooms: Classroom[];
  staffList: StaffMember[];
  periodSessions: PeriodTeachingSession[];
  onStartSession: (classroomId: string | string[], session: Classroom['currentSession']) => void;
  onConcludeSession: (session: PeriodTeachingSession) => void;
  onOpenQrScanner: () => void;
  preselectedClassroomId?: string | null;
  initialStatusFilter?: 'ALL' | 'in_session' | 'available';
}

const COMMON_SUBJECTS = [
  'Core Mathematics',
  'Elective Mathematics',
  'Integrated Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English Language',
  'Literature in English',
  'Social Studies',
  'Economics',
  'Geography',
  'Government',
  'Financial Accounting',
  'Cost Accounting',
  'Information Technology',
  'Food & Nutrition',
  'General Knowledge in Art',
  'Physical Education',
];

export const PeriodTrackerMode: React.FC<PeriodTrackerModeProps> = ({
  classrooms,
  staffList,
  periodSessions,
  onStartSession,
  onConcludeSession,
  onOpenQrScanner,
  preselectedClassroomId,
  initialStatusFilter = 'ALL',
}) => {
  // Mode: Single Class vs Merged / Combined Classes (e.g. Core subjects or combined electives)
  const [isMergeMode, setIsMergeMode] = useState<boolean>(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(
    preselectedClassroomId || classrooms[0]?.id || ''
  );
  // Default merge selection: Form 3 General Arts classes
  const [selectedMergeClassIds, setSelectedMergeClassIds] = useState<string[]>(() => {
    const defaultIds = classrooms.filter((c) => c.code.startsWith('BCGA3')).map((c) => c.id);
    return defaultIds.length >= 2 ? defaultIds : classrooms.slice(0, 2).map((c) => c.id);
  });

  // Class status filter (e.g. In Session vs Available)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'in_session' | 'available'>(
    initialStatusFilter
  );

  // Sync if initialStatusFilter changes
  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
      if (initialStatusFilter === 'in_session') {
        const inSessionCls = classrooms.find((c) => !!c.currentSession);
        if (inSessionCls) {
          setSelectedClassId(inSessionCls.id);
          setIsMergeMode(false);
        }
      }
    }
  }, [initialStatusFilter, classrooms]);

  // Class filtering search
  const [classSearch, setClassSearch] = useState('');

  useEffect(() => {
    if (preselectedClassroomId) {
      setSelectedClassId(preselectedClassroomId);
      setIsMergeMode(false);
    }
  }, [preselectedClassroomId]);

  // Selected single classroom
  const singleSelectedClass = useMemo(
    () => classrooms.find((c) => c.id === selectedClassId) || classrooms[0],
    [classrooms, selectedClassId]
  );

  // Merged classrooms list
  const mergedClasses = useMemo(
    () => classrooms.filter((c) => selectedMergeClassIds.includes(c.id)),
    [classrooms, selectedMergeClassIds]
  );

  // Active session check
  const currentSession = useMemo(() => {
    if (isMergeMode) {
      const activeInMerge = mergedClasses.find((c) => c.currentSession)?.currentSession;
      return activeInMerge || null;
    }
    return singleSelectedClass?.currentSession || null;
  }, [isMergeMode, mergedClasses, singleSelectedClass]);

  // Combined Roster when merging
  const combinedRoster = useMemo<Learner[]>(() => {
    if (!isMergeMode) {
      return singleSelectedClass ? singleSelectedClass.roster : [];
    }
    const combined: Learner[] = [];
    let rollCounter = 1;
    for (const cls of mergedClasses) {
      for (const learner of cls.roster) {
        combined.push({
          ...learner,
          rollNo: rollCounter++,
          classCode: learner.classCode || cls.code,
          className: learner.className || cls.name,
        });
      }
    }
    return combined;
  }, [isMergeMode, singleSelectedClass, mergedClasses]);

  const effectiveTotalLearners = useMemo(() => {
    if (isMergeMode) {
      return combinedRoster.length;
    }
    return singleSelectedClass?.totalLearners || 0;
  }, [isMergeMode, combinedRoster, singleSelectedClass]);

  const effectiveClassName = useMemo(() => {
    if (isMergeMode) {
      if (mergedClasses.length === 0) return 'No Classes Selected';
      const codes = mergedClasses.map((c) => c.code).join(' + ');
      return `COMBINED: ${codes} (${mergedClasses.length} Classes)`;
    }
    return singleSelectedClass?.name || 'Classroom';
  }, [isMergeMode, mergedClasses, singleSelectedClass]);

  const effectiveBlockLocation = useMemo(() => {
    if (isMergeMode) {
      return mergedClasses.map((c) => `${c.code} [${c.block}]`).join(' • ');
    }
    return singleSelectedClass?.block || 'Campus Wing';
  }, [isMergeMode, mergedClasses, singleSelectedClass]);

  // Form states for starting a new session
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(staffList[0]?.id || '');
  const [selectedSubject, setSelectedSubject] = useState<string>(COMMON_SUBJECTS[0]);

  // aSc Timetable integration states
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState<boolean>(false);
  const [activeWeekDay, setActiveWeekDay] = useState<WeekDay>(() => getCurrentWeekDay());
  const [activePeriodNum, setActivePeriodNum] = useState<number>(() => getCurrentAscPeriod().periodNumber);

  // Target class code and program stream check
  const targetClassCode = useMemo(() => {
    if (isMergeMode) {
      return mergedClasses[0]?.code || '';
    }
    return singleSelectedClass?.code || '';
  }, [isMergeMode, mergedClasses, singleSelectedClass]);

  const isScience = useMemo(() => {
    const code = targetClassCode.toUpperCase();
    const name = (singleSelectedClass?.name || '').toUpperCase();
    return code.includes('SCI') || name.includes('SCIENCE');
  }, [targetClassCode, singleSelectedClass]);

  // Look up slot on official timetable
  const scheduledSlot = useMemo(() => {
    return lookupClassScheduleSlot(targetClassCode, activeWeekDay, activePeriodNum);
  }, [targetClassCode, activeWeekDay, activePeriodNum]);

  // Is active selected subject core or elective for this class?
  const selectedSubjectIsCore = useMemo(() => {
    return isSubjectCore(selectedSubject, targetClassCode, isScience);
  }, [selectedSubject, targetClassCode, isScience]);

  // Handle applying slot from timetable
  const handleApplyTimetableSlot = (slotSubject?: string, slotStaffId?: string, slotTeacherName?: string) => {
    const subj = slotSubject || scheduledSlot?.subject;
    const staffId = slotStaffId || scheduledSlot?.teacherStaffId;
    const tName = slotTeacherName || scheduledSlot?.teacher;

    if (subj) {
      setSelectedSubject(subj);
    }

    if (staffId || tName) {
      const match = staffList.find(
        (s) =>
          (staffId && s.staffId === staffId) ||
          (tName && s.name.toLowerCase().includes(tName.toLowerCase().replace(/^(mr\.|mrs\.|ms\.|sir)\s*/i, '')))
      );
      if (match) {
        setSelectedTeacherId(match.id);
      }
    }

    soundSynthesizer.playScanBeep();
  };

  // Headcount & Attendance states
  const [presentCount, setPresentCount] = useState<number>(effectiveTotalLearners);
  const [absentLearnerIds, setAbsentLearnerIds] = useState<string[]>([]);
  const [lateLearnerIds, setLateLearnerIds] = useState<string[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [learnerSearch, setLearnerSearch] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  // AI Pedagogical Reflection Assistant States
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [aiReflectionResult, setAiReflectionResult] = useState('');
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleOpenAiAssistant = () => {
    setAiTopicInput(sessionNotes || '');
    setAiReflectionResult('');
    setAiNotice(null);
    setAiError(null);
    setAiModalOpen(true);
  };

  const handleGenerateReflection = async () => {
    setIsGeneratingReflection(true);
    setAiError(null);
    setAiNotice(null);
    const activeSubject = currentSession ? currentSession.subject : selectedSubject;
    const topic = aiTopicInput.trim() || 'Curriculum delivery & learning outcomes';
    const notes = sessionNotes.trim() || 'Learners actively participated in exercises and lesson demonstrations.';
    const onTime = Math.max(0, effectiveTotalLearners - absentLearnerIds.length - lateLearnerIds.length);
    const late = lateLearnerIds.length;
    const absent = absentLearnerIds.length;

    // Local Institutional Fallback Generator
    const getLocalReflection = () => `### 1. Lesson Objectives & Mastery Overview
During this instructional period in **${activeSubject}** for **${effectiveClassName}**, core competencies were delivered on *" ${topic} "*. Teaching progression emphasized practical step-by-step worked examples and learner responses. ${notes} Out of ${effectiveTotalLearners} learners enrolled, ${onTime + late} attended (${onTime} on-time, ${late} arrived late) with ${absent} unexcused absence(s).

### 2. Differentiated Remedial & Punctuality Action
${absent > 0
  ? `* **Absentee Catch-Up:** ${absent} learner(s) were absent. Assigned peer study buddies to provide lecture notes and exercise questions prior to the next meeting.`
  : `* **Full Attendance:** No unexcused absences recorded for this period.`
}
${late > 0
  ? `\n* **Late Arrival Catch-Up:** ${late} learner(s) arrived late during initial demonstrations. Provided brief summary pointers during individual seatwork.`
  : ''
}

### 3. Recommendations for Next Class Period
Administer a 5-minute retrieval check on "${topic}" at the start of the next meeting to verify mastery before advancing to subsequent syllabus objectives.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 second safety timeout

      const res = await fetch('/api/ai/pedagogical-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject,
          className: effectiveClassName,
          lessonTopic: topic,
          observations: notes,
          absentCount: absent,
          lateCount: late,
          totalCount: effectiveTotalLearners,
          schoolName: 'Mawuli Senior High School',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.reflection) {
        setAiReflectionResult(data.reflection);
        if (data.notice) {
          setAiNotice(data.notice);
        }
        soundSynthesizer.playClockInChime();
      } else {
        // Fallback gracefully
        setAiReflectionResult(getLocalReflection());
        setAiNotice('Generated via built-in GES offline pedagogical intelligence engine.');
        soundSynthesizer.playClockInChime();
      }
    } catch (err: any) {
      console.warn('AI gateway unreachable or timed out. Using built-in pedagogical engine:', err);
      setAiReflectionResult(getLocalReflection());
      setAiNotice('Generated via built-in GES offline pedagogical intelligence engine.');
      soundSynthesizer.playClockInChime();
    } finally {
      setIsGeneratingReflection(false);
    }
  };

  const handleApplyAiReflection = () => {
    if (aiReflectionResult) {
      setSessionNotes(aiReflectionResult);
    }
    setAiModalOpen(false);
    soundSynthesizer.playScanBeep();
  };

  // Running Stopwatch Timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Sync presentCount and late/absent when classroom or mode changes
  useEffect(() => {
    if (!currentSession) {
      setPresentCount(effectiveTotalLearners);
      setAbsentLearnerIds([]);
      setLateLearnerIds([]);
    } else {
      setPresentCount(currentSession.presentCount);
      setAbsentLearnerIds(currentSession.absentLearnerIds || []);
      setLateLearnerIds(currentSession.lateLearnerIds || []);
    }
  }, [isMergeMode, selectedClassId, selectedMergeClassIds, currentSession, effectiveTotalLearners]);

  // Stopwatch interval when session is active
  useEffect(() => {
    if (!currentSession) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((now - currentSession.startTimestamp) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const teacher = useMemo(
    () => staffList.find((s) => s.id === (currentSession ? currentSession.teacherId : selectedTeacherId)) || staffList[0],
    [staffList, currentSession, selectedTeacherId]
  );

  // Format stopwatch: "MM:SS" or "HH:MM:SS"
  const formattedStopwatch = useMemo(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hours > 0) {
      return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  // Explicitly set a learner's status: 'present' | 'late' | 'absent'
  const setLearnerStatus = (learnerId: string, status: 'present' | 'late' | 'absent') => {
    soundSynthesizer.playScanBeep();
    if (status === 'absent') {
      const nextAbsent = absentLearnerIds.includes(learnerId) ? absentLearnerIds : [...absentLearnerIds, learnerId];
      const nextLate = lateLearnerIds.filter((id) => id !== learnerId);
      setAbsentLearnerIds(nextAbsent);
      setLateLearnerIds(nextLate);
      setPresentCount(Math.max(0, effectiveTotalLearners - nextAbsent.length));
    } else if (status === 'late') {
      const nextLate = lateLearnerIds.includes(learnerId) ? lateLearnerIds : [...lateLearnerIds, learnerId];
      const nextAbsent = absentLearnerIds.filter((id) => id !== learnerId);
      setLateLearnerIds(nextLate);
      setAbsentLearnerIds(nextAbsent);
      setPresentCount(Math.max(0, effectiveTotalLearners - nextAbsent.length));
    } else {
      // Present on time
      const nextAbsent = absentLearnerIds.filter((id) => id !== learnerId);
      const nextLate = lateLearnerIds.filter((id) => id !== learnerId);
      setAbsentLearnerIds(nextAbsent);
      setLateLearnerIds(nextLate);
      setPresentCount(Math.max(0, effectiveTotalLearners - nextAbsent.length));
    }
  };

  // Cycle learner status: Present -> Late -> Absent -> Present
  const cycleLearnerStatus = (learner: Learner) => {
    if (lateLearnerIds.includes(learner.id)) {
      setLearnerStatus(learner.id, 'absent');
    } else if (absentLearnerIds.includes(learner.id)) {
      setLearnerStatus(learner.id, 'present');
    } else {
      setLearnerStatus(learner.id, 'late');
    }
  };

  // Adjust headcount directly
  const adjustHeadcount = (delta: number) => {
    const next = Math.min(effectiveTotalLearners, Math.max(0, presentCount + delta));
    setPresentCount(next);
  };

  // Toggle classroom in merge selection
  const toggleMergeClass = (classroomId: string) => {
    soundSynthesizer.playKeypadBeep();
    setSelectedMergeClassIds((prev) => {
      if (prev.includes(classroomId)) {
        return prev.filter((id) => id !== classroomId);
      } else {
        return [...prev, classroomId];
      }
    });
  };

  // Quick Presets for merging
  const applyMergePreset = (presetType: 'form3_arts' | 'home_econ' | 'all_form3' | 'clear') => {
    soundSynthesizer.playScanBeep();
    if (presetType === 'form3_arts') {
      const ids = classrooms.filter((c) => c.code.startsWith('BCGA3')).map((c) => c.id);
      setSelectedMergeClassIds(ids);
    } else if (presetType === 'home_econ') {
      const ids = classrooms.filter((c) => c.code.startsWith('BCHE3')).map((c) => c.id);
      setSelectedMergeClassIds(ids);
    } else if (presetType === 'all_form3') {
      const ids = classrooms.filter((c) => c.code.includes('3') || c.name.includes('3')).map((c) => c.id);
      setSelectedMergeClassIds(ids);
    } else if (presetType === 'clear') {
      setSelectedMergeClassIds([]);
    }
  };

  // Start Teaching Session (Supports Single or Merged)
  const handleStartSession = () => {
    if (!teacher) return;

    if (isMergeMode && mergedClasses.length === 0) {
      alert('Please select at least one class to combine for the lecture.');
      return;
    }

    const startTimestamp = Date.now();
    const sessionId = `sess-${startTimestamp}-${Math.random().toString(36).substring(2, 6)}`;

    const sessionData: Classroom['currentSession'] = {
      sessionId,
      teacherId: teacher.id,
      teacherName: teacher.name,
      subject: selectedSubject,
      startTimestamp,
      presentCount,
      absentLearnerIds,
      lateCount: lateLearnerIds.length,
      lateLearnerIds,
      isMerged: isMergeMode,
      mergedClassIds: isMergeMode ? mergedClasses.map((c) => c.id) : undefined,
      mergedClassCodes: isMergeMode ? mergedClasses.map((c) => c.code) : undefined,
      mergedClassNames: isMergeMode ? mergedClasses.map((c) => c.name) : undefined,
    };

    if (isMergeMode) {
      onStartSession(
        mergedClasses.map((c) => c.id),
        sessionData
      );
    } else {
      if (!singleSelectedClass) return;
      onStartSession(singleSelectedClass.id, sessionData);
    }

    soundSynthesizer.playClockInChime();
  };

  // End Teaching Session (Conclude Single or Merged)
  const handleConcludeSession = () => {
    if (!currentSession) return;

    const endTimestamp = Date.now();
    const elapsedMinutes = Math.max(1, Math.round((endTimestamp - currentSession.startTimestamp) / 60000));
    const isAbbreviated = elapsedMinutes < 15;

    // Get absentee and late names from combined or single roster
    const absentNames = combinedRoster
      .filter((l) => absentLearnerIds.includes(l.id))
      .map((l) => `${l.name} (${l.classCode || 'Learner'})`);

    const lateNames = combinedRoster
      .filter((l) => lateLearnerIds.includes(l.id))
      .map((l) => `${l.name} (${l.classCode || 'Learner'})`);

    const isSessionMerged = currentSession.isMerged || (isMergeMode && mergedClasses.length > 1);
    const targetClassId = isSessionMerged && currentSession.mergedClassIds
      ? currentSession.mergedClassIds[0]
      : singleSelectedClass?.id || 'cls-1';

    const sessionRecord: PeriodTeachingSession = {
      id: currentSession.sessionId,
      teacherId: currentSession.teacherId,
      teacherName: currentSession.teacherName,
      teacherStaffId: teacher?.staffId || 'STAFF',
      classroomId: targetClassId,
      classCode: isSessionMerged && currentSession.mergedClassCodes
        ? currentSession.mergedClassCodes.join('+')
        : singleSelectedClass?.code || 'CLASS',
      className: isSessionMerged && currentSession.mergedClassNames
        ? `${currentSession.mergedClassNames.join(' + ')} (Combined)`
        : effectiveClassName,
      subject: currentSession.subject,
      date: getTodayDateString(),
      startTime: new Date(currentSession.startTimestamp).toTimeString().split(' ')[0].substring(0, 5),
      startTimestamp: currentSession.startTimestamp,
      endTime: new Date(endTimestamp).toTimeString().split(' ')[0].substring(0, 5),
      endTimestamp,
      elapsedMinutes,
      isAbbreviated,
      totalRosterCount: effectiveTotalLearners,
      presentCount,
      lateCount: lateLearnerIds.length,
      lateLearnerIds,
      lateLearnerNames: lateNames,
      absentLearnerIds,
      absentLearnerNames: absentNames,
      notes: sessionNotes || `Curriculum objectives completed for ${currentSession.subject}.`,
      synced: true,
      isMerged: isSessionMerged,
      mergedClassIds: currentSession.mergedClassIds || (isMergeMode ? mergedClasses.map((c) => c.id) : undefined),
      mergedClassCodes: currentSession.mergedClassCodes || (isMergeMode ? mergedClasses.map((c) => c.code) : undefined),
      mergedClassNames: currentSession.mergedClassNames || (isMergeMode ? mergedClasses.map((c) => c.name) : undefined),
      deviceSignature: navigator.userAgent.includes('Mobile') ? 'Mobile Handheld Tablet' : 'Desktop / Web Console',
      loginTrace: `Authenticated Faculty #${teacher?.staffId || 'STAFF'} • Campus Gate Verified • Session: ${elapsedMinutes}m${isAbbreviated ? ' (Abbreviated Period)' : ''}`,
    };

    onConcludeSession(sessionRecord);
    soundSynthesizer.playFanfare();
    setSessionNotes('');
  };

  // Filter learners by search and attendance status tab
  const filteredLearners = useMemo(() => {
    if (!combinedRoster || combinedRoster.length === 0) return [];
    let list = combinedRoster;
    if (attendanceFilter === 'present') {
      list = list.filter((l) => !absentLearnerIds.includes(l.id) && !lateLearnerIds.includes(l.id));
    } else if (attendanceFilter === 'late') {
      list = list.filter((l) => lateLearnerIds.includes(l.id));
    } else if (attendanceFilter === 'absent') {
      list = list.filter((l) => absentLearnerIds.includes(l.id));
    }

    if (!learnerSearch) return list;
    const query = learnerSearch.toLowerCase();
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        String(l.rollNo).includes(query) ||
        (l.classCode && l.classCode.toLowerCase().includes(query))
    );
  }, [combinedRoster, learnerSearch, attendanceFilter, absentLearnerIds, lateLearnerIds]);

  // Filter classes for selector
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      const matchSearch =
        !classSearch ||
        c.code.toLowerCase().includes(classSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(classSearch.toLowerCase());
      let matchStatus = true;
      if (statusFilter === 'in_session') {
        matchStatus = !!c.currentSession;
      } else if (statusFilter === 'available') {
        matchStatus = !c.currentSession;
      }
      return matchSearch && matchStatus;
    });
  }, [classrooms, classSearch, statusFilter]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-6xl mx-auto w-full space-y-4">
      {/* Top Banner & Mode Toggle (Single vs Merged Classes) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Period &amp; Classroom Instructional Tracker
            </h2>
            <p className="text-xs text-slate-400">
              Manual class selection, multi-class combining, rapid headcount &amp; GES syllabus verification
            </p>
          </div>
        </div>

        {/* Right side controls: Single vs Merge Toggle & QR Scanner shortcut */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setIsMergeMode(false);
                soundSynthesizer.playScanBeep();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                !isMergeMode
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Single Class</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsMergeMode(true);
                soundSynthesizer.playScanBeep();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                isMergeMode
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Combine multiple classes for Core subjects (Core Maths, English, Integrated Science, Social Studies) or joint electives"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Merge / Combine Classes</span>
            </button>
          </div>

          <button
            onClick={onOpenQrScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition active:scale-95"
            title="Scan door QR code if available"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Door QR</span>
          </button>
        </div>
      </div>

      {/* Manual Class Selector or Combining Panel */}
      {!isMergeMode ? (
        /* SINGLE CLASS MODE: Quick Filter and Class Code Tabs */
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Instructional Class:</span>
              </span>

              {/* Status Filter Pills: In Session vs All */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('ALL');
                    soundSynthesizer.playScanBeep();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    statusFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({classrooms.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('in_session');
                    soundSynthesizer.playScanBeep();
                    const inSessionCls = classrooms.find((c) => !!c.currentSession);
                    if (inSessionCls) setSelectedClassId(inSessionCls.id);
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    statusFilter === 'in_session'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-950 text-indigo-400 hover:text-indigo-300 border border-slate-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span>In Session ({classrooms.filter((c) => !!c.currentSession).length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('available');
                    soundSynthesizer.playScanBeep();
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    statusFilter === 'available'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Available ({classrooms.filter((c) => !c.currentSession).length})
                </button>
              </div>
            </div>

            {/* Quick search input & Timetable button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimetableModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300 transition whitespace-nowrap cursor-pointer shadow-xs"
                title="View institutional aSc Timetable matrix"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Class Timetable</span>
              </button>

              <div className="relative w-36 sm:w-48">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Find class code..."
                  className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {filteredClassrooms.map((cls) => {
              const isSelected = singleSelectedClass?.id === cls.id;
              const isInSession = !!cls.currentSession;
              return (
                <button
                  key={cls.id}
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    soundSynthesizer.playScanBeep();
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-black/30">
                    {cls.code}
                  </span>
                  <span>{cls.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({cls.totalLearners})</span>
                  {isInSession && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* MERGE / COMBINE CLASSES MODE: Multi-select with presets */
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <GitMerge className="w-4 h-4 text-indigo-400" />
                <span>Multi-Classroom Combination Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono">
                  {mergedClasses.length} Classes Merged • {effectiveTotalLearners} Total Learners
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Ideal for Core Subjects (Core Maths, English, Science, Social Studies) or joint elective periods.
              </p>
            </div>

            {/* Merge Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] text-slate-400 mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyMergePreset('form3_arts')}
                className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-[10px] font-semibold text-indigo-200 transition"
              >
                Form 3 Arts (3C+3D+3E+3F)
              </button>
              <button
                type="button"
                onClick={() => applyMergePreset('home_econ')}
                className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-[10px] font-semibold text-indigo-200 transition"
              >
                Home Econ (3A+3B)
              </button>
              <button
                type="button"
                onClick={() => applyMergePreset('all_form3')}
                className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 text-[10px] font-semibold text-indigo-200 transition"
              >
                All Form 3
              </button>
              <button
                type="button"
                onClick={() => applyMergePreset('clear')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-400 hover:text-white transition"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Grid of classes to toggle */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
            {classrooms.map((cls) => {
              const isChecked = selectedMergeClassIds.includes(cls.id);
              const isInSession = !!cls.currentSession;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => toggleMergeClass(cls.id)}
                  className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                    isChecked
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] font-bold text-indigo-300">
                      {cls.code}
                    </span>
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                        isChecked
                          ? 'bg-indigo-500 text-white font-black'
                          : 'border border-slate-700'
                      }`}
                    >
                      {isChecked && '✓'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold truncate block leading-tight">
                    {cls.name}
                  </span>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{cls.totalLearners} stds</span>
                    {isInSession && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Combined Selection Summary Badge */}
          {mergedClasses.length > 0 && (
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Combined Lecture Target:</span>
                <span className="font-mono text-indigo-300 font-bold">
                  {mergedClasses.map((c) => c.code).join(' + ')}
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">
                Unified Roster: {effectiveTotalLearners} Learners loaded
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Dual-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Active Session & Stopwatch Terminal (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="min-w-0 flex-1 pr-2">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block truncate">
                  {effectiveBlockLocation}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {effectiveClassName}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex-shrink-0">
                Total Roster: {effectiveTotalLearners} Learners
              </span>
            </div>

            {/* If In Session -> Running Stopwatch Display */}
            {currentSession ? (
              <div className="mt-4 p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {currentSession.isMerged ? 'Combined Period in Progress' : 'Teaching In Progress'}
                  </span>
                </div>

                <div className="my-2">
                  <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    {formattedStopwatch}
                  </span>
                  <span className="block text-xs text-slate-400 mt-1">Elapsed Instructional Time</span>
                </div>

                {/* Session Meta */}
                <div className="mt-2 pt-3 border-t border-slate-800 w-full grid grid-cols-2 gap-2 text-left text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lead Teacher</span>
                    <strong className="text-white truncate block">{currentSession.teacherName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Syllabus Subject</span>
                    <strong className="text-indigo-400 truncate block">{currentSession.subject}</strong>
                  </div>
                </div>
              </div>
            ) : (
              /* If Not in Session -> Setup Session Form */
              <div className="mt-4 space-y-3.5">
                {/* Official aSc Timetable Schedule Assistant */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">aSc Timetable Schedule Assistant</span>
                    </div>

                    {/* Day & Period Selectors */}
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <select
                        value={activeWeekDay}
                        onChange={(e) => setActiveWeekDay(e.target.value as WeekDay)}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-medium text-[11px] focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                      </select>

                      <select
                        value={activePeriodNum}
                        onChange={(e) => setActivePeriodNum(Number(e.target.value))}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-medium text-[11px] focus:outline-none focus:border-emerald-500"
                      >
                        {ASC_PERIODS.map((p) => (
                          <option key={p.periodNumber} value={p.periodNumber}>
                            P{p.periodNumber} ({p.startTime}-{p.endTime})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Scheduled Slot Summary */}
                  {scheduledSlot ? (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              scheduledSlot.isCore
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            }`}
                          >
                            {scheduledSlot.isCore ? 'GES MANDATORY CORE' : 'STREAM ELECTIVE'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Period {activePeriodNum} • {ASC_PERIODS.find((p) => p.periodNumber === activePeriodNum)?.startTime} - {ASC_PERIODS.find((p) => p.periodNumber === activePeriodNum)?.endTime}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white truncate">
                          <span>{scheduledSlot.subject}</span>
                          <span className="text-slate-400 font-normal"> — {scheduledSlot.teacher}</span>
                          {scheduledSlot.teacherStaffId && (
                            <span className="text-[10px] text-slate-500 font-mono ml-1">
                              (ID: {scheduledSlot.teacherStaffId})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyTimetableSlot()}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                          title="Apply this scheduled Subject and Teacher directly"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Auto-Fill Slot</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>No lesson scheduled for this period (Free Period / Break).</span>
                      <button
                        type="button"
                        onClick={() => setIsTimetableModalOpen(true)}
                        className="text-emerald-400 hover:underline text-[11px] font-medium cursor-pointer"
                      >
                        Browse Full Matrix →
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>
                      Target: <strong className="text-slate-200">{targetClassCode}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsTimetableModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Open Full Class Timetable</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Teacher Selector with Unique Staff ID & Subjects Chips */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400 font-medium">Assigned Instructor &amp; Staff ID</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Unique GES Staff ID</span>
                  </div>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} • ID: {s.staffId} ({s.department}
                        {s.category === 'nss' ? ' • NSP' : ''}
                        {s.category === 'intern' ? ' • Intern' : ''})
                      </option>
                    ))}
                  </select>

                  {/* Quick-Select Chips for subjects taught by this teacher */}
                  {teacher && teacher.subjects && teacher.subjects.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-slate-400">
                          Subjects taught by <strong className="text-slate-300">{teacher.name}</strong>:
                        </span>
                        <span className="text-[9px] text-emerald-400 font-medium">Click to select</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.subjects.map((subj) => {
                          const isSelected = selectedSubject === subj;
                          return (
                            <button
                              key={subj}
                              type="button"
                              onClick={() => {
                                setSelectedSubject(subj);
                                soundSynthesizer.playScanBeep();
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition border cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {subj}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subject Selector & Core vs Elective Live Guidance */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400 font-medium">Subject / Instructional Unit</span>
                    {isMergeMode && (
                      <span className="text-[10px] text-indigo-400 font-bold">
                        ★ Core Subjects Common in Combined Lectures
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {COMMON_SUBJECTS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>

                  {/* Live Core vs Elective Guidance */}
                  <div className="mt-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            selectedSubjectIsCore ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
                          }`}
                        />
                        <span className="font-semibold text-white">
                          {selectedSubjectIsCore ? 'GES Core Subject' : 'Elective Specialization'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Class: {targetClassCode}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      {isScience && selectedSubject.toLowerCase().includes('integrated science') ? (
                        <span className="text-amber-300 font-medium">
                          ⚠️ Note: In General Science stream, Integrated Science is NOT taken as a core subject; learners study Physics, Chemistry, Biology and Elective Mathematics.
                        </span>
                      ) : selectedSubjectIsCore ? (
                        <span>Mandatory for all learners in this class as per GES curriculum guidelines.</span>
                      ) : (
                        <span>Elective subject specific to this class stream and subject combination.</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructional Reflection & Notes */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Period Topics Covered &amp; Assignment Notes:
                </label>
                <button
                  type="button"
                  onClick={handleOpenAiAssistant}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-[11px] font-semibold text-indigo-300 transition cursor-pointer"
                  title="Generate structured lesson reflection and absentee remedial plan with Gemini AI"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>✨ AI Pedagogical Assistant</span>
                </button>
              </div>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g., Photosynthesis light-dependent reactions; Exercise 4.2 assigned."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Action Button: Start vs Conclude Session */}
          <div className="pt-2 border-t border-slate-800">
            {currentSession ? (
              <button
                type="button"
                onClick={handleConcludeSession}
                className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] font-bold text-xs sm:text-sm text-white shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>
                  [ 🛑 Conclude Period &amp; Exit{' '}
                  {currentSession.isMerged ? 'Combined Classes' : 'Class'} (
                  {Math.round(elapsedSeconds / 60)} min) ]
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSession}
                className={`w-full py-3.5 rounded-xl active:scale-[0.99] font-bold text-xs sm:text-sm text-white shadow-lg transition flex items-center justify-center gap-2 ${
                  isMergeMode
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {isMergeMode
                    ? `[ 🔀 Start Combined Lecture Session (${mergedClasses.length} Classes • ${effectiveTotalLearners} Learners) ]`
                    : '[ 🟢 Enter Classroom & Start Teaching Session ]'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Rapid Student Headcount & Attendance Module (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {isMergeMode ? 'Combined Class Headcount Register' : 'Rapid Student Headcount Module'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Tap name to flag Absent</span>
            </div>

            {/* Quick Count Stepper & Bento Card with On-Time, Late, Absent */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Total Roster */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block mb-0.5">Total Roster</span>
                <span className="text-lg font-bold font-mono text-white">
                  {effectiveTotalLearners}
                </span>
              </div>

              {/* On-Time Learners */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                <span className="text-[10px] text-emerald-300 block mb-0.5">On-Time</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {Math.max(0, effectiveTotalLearners - absentLearnerIds.length - lateLearnerIds.length)}
                </span>
              </div>

              {/* Late Learners */}
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center">
                <span className="text-[10px] text-amber-300 block mb-0.5">Late Arrivals</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {lateLearnerIds.length}
                </span>
              </div>

              {/* Absent Learners */}
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center">
                <span className="text-[10px] text-rose-300 block mb-0.5">Absent</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {absentLearnerIds.length}
                </span>
              </div>
            </div>

            {/* Quick Count Adjuster Bar */}
            <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">Quick Headcount:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustHeadcount(-5)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => adjustHeadcount(-1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300"
                >
                  -1
                </button>
                <span className="font-mono text-xs sm:text-sm font-bold text-white px-2">
                  {presentCount} / {effectiveTotalLearners}
                </span>
                <button
                  type="button"
                  onClick={() => adjustHeadcount(1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => adjustHeadcount(5)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-300"
                >
                  +5
                </button>
              </div>
            </div>

            {/* Learner Roster & Attendance Status Selector */}
            <div className="mt-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={learnerSearch}
                    onChange={(e) => setLearnerSearch(e.target.value)}
                    placeholder="Search learner or class..."
                    className="w-full pl-7 pr-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAbsentLearnerIds([]);
                      setLateLearnerIds([]);
                      setPresentCount(effectiveTotalLearners);
                      soundSynthesizer.playScanBeep();
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30 text-[10px] text-emerald-300 hover:bg-emerald-900 transition active:scale-95"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLateLearnerIds([]);
                      soundSynthesizer.playScanBeep();
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 text-[10px] text-slate-300 hover:text-white transition active:scale-95"
                  >
                    Clear Lates
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 pb-2 border-b border-slate-800/80 mb-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    attendanceFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({combinedRoster.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('present')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    attendanceFilter === 'present'
                      ? 'bg-emerald-900 text-emerald-200 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  🟢 On-Time ({Math.max(0, effectiveTotalLearners - absentLearnerIds.length - lateLearnerIds.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('late')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    attendanceFilter === 'late'
                      ? 'bg-amber-900 text-amber-200 border border-amber-500/40'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  🟡 Late ({lateLearnerIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceFilter('absent')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition ${
                    attendanceFilter === 'absent'
                      ? 'bg-rose-900 text-rose-200 border border-rose-500/40'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  🔴 Absent ({absentLearnerIds.length})
                </button>
              </div>

              {/* Learner Grid with Tri-State Attendance Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto no-scrollbar pr-1">
                {filteredLearners.map((learner) => {
                  const isAbsent = absentLearnerIds.includes(learner.id);
                  const isLate = lateLearnerIds.includes(learner.id);
                  return (
                    <div
                      key={learner.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left text-xs transition ${
                        isAbsent
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                          : isLate
                          ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => cycleLearnerStatus(learner)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                        title="Click to cycle status: Present -> Late -> Absent"
                      >
                        <span className="font-mono text-[10px] text-slate-500 w-5">
                          #{learner.rollNo}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium truncate leading-snug">{learner.name}</p>
                          {learner.classCode && (
                            <span className="inline-block font-mono text-[9px] px-1 py-0.2 rounded bg-slate-800/80 text-indigo-300">
                              {learner.classCode}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Tri-State Action Buttons: P (Present) | L (Late) | A (Absent) */}
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setLearnerStatus(learner.id, 'present')}
                          className={`w-6 h-6 rounded-md font-bold text-[10px] transition ${
                            !isAbsent && !isLate
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-emerald-950 text-slate-400 hover:text-emerald-300 border border-slate-800'
                          }`}
                          title="Mark Present on time"
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => setLearnerStatus(learner.id, 'late')}
                          className={`w-6 h-6 rounded-md font-bold text-[10px] transition ${
                            isLate
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-amber-950 text-slate-400 hover:text-amber-300 border border-slate-800'
                          }`}
                          title="Mark Late arrival"
                        >
                          L
                        </button>
                        <button
                          type="button"
                          onClick={() => setLearnerStatus(learner.id, 'absent')}
                          className={`w-6 h-6 rounded-md font-bold text-[10px] transition ${
                            isAbsent
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800'
                          }`}
                          title="Mark Absent"
                        >
                          A
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic text-center">
            Ghana Education Service (GES) Class Attendance Register Regulation 14-B Compliant (Present • Late • Absent)
          </p>
        </div>
      </div>

      {/* Completed Periods Log */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">
              Completed Instructional Sessions Today ({periodSessions.length})
            </h3>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[11px] text-slate-400 border-b border-slate-800">
                <th className="pb-2 font-medium">Instructor (Staff ID)</th>
                <th className="pb-2 font-medium">Class / Session Type</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Duration</th>
                <th className="pb-2 font-medium">Time Slot</th>
                <th className="pb-2 font-medium">Learners Attendance</th>
                <th className="pb-2 font-medium">Topics / Notes &amp; Audit Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {periodSessions.map((sess) => (
                <tr key={sess.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-semibold text-white">
                    <div>{sess.teacherName}</div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      ID: {sess.teacherStaffId || 'Staff'}
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-300 text-[11px]">
                    <div className="font-mono text-white flex items-center gap-1.5">
                      <span>{sess.className}</span>
                      {sess.isMerged && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold text-[9px]">
                          Combined
                        </span>
                      )}
                    </div>
                    {sess.classCode && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        [{sess.classCode}]
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-indigo-400 font-medium">{sess.subject}</td>
                  <td className="py-2.5 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold ${sess.elapsedMinutes < 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {sess.elapsedMinutes} mins
                      </span>
                      {sess.elapsedMinutes < 15 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] font-bold text-amber-300 whitespace-nowrap">
                          ⚠️ Abbreviated
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 font-mono text-slate-400">
                    {sess.startTime} - {sess.endTime}
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-[10px] text-emerald-300 font-mono" title="Present on time">
                        {Math.max(0, sess.presentCount - (sess.lateCount || 0))} on-time
                      </span>
                      {(sess.lateCount || 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/30 text-[10px] text-amber-300 font-mono" title="Arrived late">
                          {sess.lateCount} late
                        </span>
                      )}
                      {sess.absentLearnerIds.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-[10px] text-rose-300 font-mono" title="Absent">
                          {sess.absentLearnerIds.length} absent
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-300 max-w-xs">
                    <p className="truncate">{sess.notes}</p>
                    {sess.loginTrace && (
                      <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        {sess.loginTrace}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Pedagogical Reflection & Remedial Planner Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>AI Pedagogical Assistant</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-300 font-mono">Gemini</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    GES Curriculum Lesson Reflection &amp; Absentee Remediation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Context Chips */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-400">Class:</span>
                <strong className="text-white font-mono">{effectiveClassName}</strong>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Subject:</span>
                <strong className="text-indigo-400">{currentSession ? currentSession.subject : selectedSubject}</strong>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Attendance:</span>
                <strong className="text-emerald-400">
                  {presentCount}/{effectiveTotalLearners} ({effectiveTotalLearners - presentCount} absent)
                </strong>
              </div>

              {/* Lesson Topic & Quick Notes Input */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Lesson Topic / Key Learning Outcome or Quick Notes:
                </label>
                <textarea
                  rows={2}
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  placeholder="e.g., Solved simultaneous linear equations using elimination method; 3 students struggled with fractional coefficients."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Error state */}
              {aiError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
                  <span>{aiError}</span>
                  <button
                    type="button"
                    onClick={handleGenerateReflection}
                    className="underline text-rose-200 hover:text-white font-bold ml-2 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Generate Trigger */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateReflection}
                  disabled={isGeneratingReflection}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingReflection ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingReflection ? 'Drafting Pedagogical Reflection...' : '✨ Generate Structured Reflection'}</span>
                </button>
              </div>

              {/* Notice Banner */}
              {aiNotice && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                  <span className="font-bold">ℹ️ Status:</span>
                  <span>{aiNotice}</span>
                </div>
              )}

              {/* Generated Result Preview */}
              {aiReflectionResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-indigo-300">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      Generated Pedagogical Plan
                    </span>
                    <span className="text-[10px] text-emerald-400 font-normal">Ready to apply</span>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-200 text-xs leading-relaxed max-h-48 overflow-y-auto">
                    {aiReflectionResult}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              {aiReflectionResult && (
                <button
                  type="button"
                  onClick={handleApplyAiReflection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply to Period Log</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official aSc Institutional Timetable Modal */}
      <TimetableModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        initialClassCode={targetClassCode}
        onSelectSlot={(subj, staffId, tName) => handleApplyTimetableSlot(subj, staffId, tName)}
      />
    </div>
  );
};
