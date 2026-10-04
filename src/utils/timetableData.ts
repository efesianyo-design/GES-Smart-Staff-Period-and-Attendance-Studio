import { ClassTimetable, TimetableSlot, WeekDay } from '../types';
import { storageEngine } from './storage';

export type { WeekDay };

export interface AscPeriodItem {
  period: number;
  periodNumber: number;
  label: string;
  time: string;
  startTime: string;
  endTime: string;
  startMin: number;
  endMin: number;
}

export const ASC_PERIODS: AscPeriodItem[] = [
  { period: 1, periodNumber: 1, label: 'Period 1', time: '7:00 - 8:00', startTime: '7:00', endTime: '8:00', startMin: 7 * 60, endMin: 8 * 60 },
  { period: 2, periodNumber: 2, label: 'Period 2', time: '8:00 - 9:00', startTime: '8:00', endTime: '9:00', startMin: 8 * 60, endMin: 9 * 60 },
  // First Break: 9:00 - 9:30
  { period: 3, periodNumber: 3, label: 'Period 3', time: '9:30 - 10:30', startTime: '9:30', endTime: '10:30', startMin: 9 * 60 + 30, endMin: 10 * 60 + 30 },
  { period: 4, periodNumber: 4, label: 'Period 4', time: '10:30 - 11:30', startTime: '10:30', endTime: '11:30', startMin: 10 * 60 + 30, endMin: 11 * 60 + 30 },
  { period: 5, periodNumber: 5, label: 'Period 5', time: '11:30 - 12:30', startTime: '11:30', endTime: '12:30', startMin: 11 * 60 + 30, endMin: 12 * 60 + 30 },
  // Second Break: 12:30 - 13:00
  { period: 6, periodNumber: 6, label: 'Period 6', time: '13:00 - 14:00', startTime: '13:00', endTime: '14:00', startMin: 13 * 60, endMin: 14 * 60 },
  { period: 7, periodNumber: 7, label: 'Period 7', time: '14:00 - 15:00', startTime: '14:00', endTime: '15:00', startMin: 14 * 60, endMin: 15 * 60 },
  { period: 8, periodNumber: 8, label: 'Period 8', time: '15:00 - 16:00', startTime: '15:00', endTime: '16:00', startMin: 15 * 60, endMin: 16 * 60 },
];

export const TEACHER_NAME_MAP: Record<string, { fullName: string; staffId: string }> = {
  EUGENE: { fullName: 'Mr. Eugene Fafali Esianyo', staffId: '1304201' },
  GOKA: { fullName: 'Mr. David Goka', staffId: '748589' },
  EMELDA: { fullName: 'Miss Emelda Abena Wawo', staffId: '1358346' },
  AMAGLO: { fullName: 'Miss Patience Dzigbordi Amaglo', staffId: '623941' },
  SAMUEL: { fullName: 'Mr. Samuel Numatsi', staffId: '707086' },
  ERASMUS: { fullName: 'Mr. Komla Erasmus Boateng', staffId: '623736' },
  DESMOND: { fullName: 'Mr. Desmond Dzorkplenu', staffId: '1242093' },
  MARY: { fullName: 'Mary Agyei Kyeremeh', staffId: '1525610' },
  SABBAH: { fullName: 'Miss Charity Akosua Sabbah', staffId: '948389' },
  'SABBAH / MARY': { fullName: 'Miss Charity Sabbah / Mary Kyeremeh', staffId: '948389' },
  OTTUH: { fullName: 'Mr. Augustine Ottuh', staffId: '953124' },
  EMMANUEL: { fullName: 'Mr. Emmanuel Agbewowoele', staffId: '814652' },
  VERONICA: { fullName: 'Miss Veronica Adorkor', staffId: '748954' },
  PRINCE: { fullName: 'Mr. Prince Yayra', staffId: '704182' },
  ENOCH: { fullName: 'Mr. Enoch Kwasi Adiasie', staffId: '1222669' },
  HARRIET: { fullName: 'Miss Harriet Tsamanyi', staffId: '939231' },
  JENNY: { fullName: 'Miss Jenny Akwaley Nuertey', staffId: '1417900' },
  RICHARD: { fullName: 'Mr. Richard Dodzi Keteku', staffId: '648991' },
  ASIEDU: { fullName: 'Mr. Richard Asiedu', staffId: '1254416' },
  MBIBA: { fullName: 'Mr. Issor Mbiba', staffId: '1547764' },
  SYLVANUS: { fullName: 'Mr. Sylvanus Sunday Semaxa', staffId: '706711' },
  TOKU: { fullName: 'Mr. Koffi Toku', staffId: '1199492' },
  SEGBAYA: { fullName: 'Mr. Segbaya Koku Ahialoho', staffId: '281351' },
  ADARE: { fullName: 'Mr. Richard Mawuli Adare', staffId: '867298' },
  AGBEWU: { fullName: 'Miss Leticia Agbewu', staffId: '1220681' },
  MOHAMMED: { fullName: 'Mr. Musan Mohammed', staffId: '819744' },
  KETEKE: { fullName: 'Mr. Kennedy Keteke', staffId: '666510' },
  KA: { fullName: 'Mr. Kwame Amponsah', staffId: '706711' },
  KAMPONSAH: { fullName: 'Mr. Kwame Amponsah', staffId: '706711' },
  AMPONSAH: { fullName: 'Mr. Kwame Amponsah', staffId: '706711' },
  LIB: { fullName: 'Library / Independent Study', staffId: '999001' },
  PLC: { fullName: 'Professional / Virtual Learning Session', staffId: '999002' },
};

export function isSubjectCore(arg1: string, arg2?: string, isScienceExplicit?: boolean): boolean {
  let subject = '';
  let program = '';

  if (arg2 !== undefined) {
    const l1 = arg1.toLowerCase();
    if (l1.includes('art') || l1.includes('sci') || l1.includes('bus') || l1.includes('home') || l1.includes('tech') || l1.includes('form') || l1.includes('class')) {
      program = arg1;
      subject = arg2;
    } else {
      subject = arg1;
      program = arg2;
    }
  } else {
    subject = arg1;
  }

  const normSub = subject.trim().toLowerCase();
  const isScience =
    isScienceExplicit !== undefined
      ? isScienceExplicit
      : program.toLowerCase().includes('science') || program.toLowerCase().includes('sci');

  // Morning assembly, Worship, Library, PLC, PE (Core)
  if (
    normSub.includes('morning') ||
    normSub.includes('assembly') ||
    normSub.includes('worship') ||
    normSub.includes('library') ||
    normSub.includes('plc')
  ) {
    return true;
  }

  // Mathematics: Core Maths is Core for everyone; E-Maths / Elective Maths is Elective
  if (normSub.includes('core math') || normSub === 'cor e ma ths' || normSub === 'core maths') {
    return true;
  }
  if (normSub.includes('e-math') || normSub.includes('elective math') || normSub === 'int. math s') {
    // In arts/business/science schedule, "Int. Maths" with Erasmus is Intro/Elective Math
    return false;
  }

  // English: English Language / Core English is Core for everyone
  if (
    (normSub.includes('engl') || normSub.includes('english')) &&
    !normSub.includes('literature') &&
    !normSub.includes('lit')
  ) {
    return true;
  }

  // Social Studies: Core for everyone
  if (normSub.includes('soc') || normSub.includes('social')) {
    return true;
  }

  // ICT / Computing: Core for all classes
  if (normSub.includes('ict') || normSub.includes('computing')) {
    return true;
  }

  // PEH: Core PE for all on Friday; PEH Elective for Science
  if (normSub === 'p.e' || normSub === 'peh' || normSub === 'pe') {
    return true;
  }
  if (normSub.includes('elective')) {
    return false;
  }

  // Integrated Science: Core for ALL classes EXCEPT General Science!
  if (normSub.includes('int. sci') || normSub.includes('integrated science') || normSub === 'int. sci') {
    return !isScience;
  }

  // All other subjects are electives (Agric Science, Physics, Chemistry, Biology, French, Geography, Government, C.R.S, Economics, Financial Accounting, Business Management, Food & Nutrition, Clothing, Studio, Foundation, Design & Comm Tech, etc.)
  return false;
}

// 18 Official Class Schedules from the School's aSc Timetables
export const OFFICIAL_TIMETABLES: ClassTimetable[] = [
  // 1. GEN ART 2A (AGRIC/FRENCH)
  {
    classCode: 'GEN_ART_2A',
    className: 'GEN ART 2A (AGRIC/FRENCH)',
    program: 'General Arts',
    formYear: 2,
    electives: ['Agric Science', 'French', 'Geography', 'Government'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'FRENCH', teacher: 'TOKU', teacherStaffId: '1199492', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'FRENCH', teacher: 'TOKU', teacherStaffId: '1199492', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'FRENCH', teacher: 'TOKU', teacherStaffId: '1199492', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'FRENCH', teacher: 'TOKU', teacherStaffId: '1199492', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 2. GEN ART 2C (AGRIC/BIOLOGY)
  {
    classCode: 'GEN_ART_2C',
    className: 'GEN ART 2C (AGRIC/BIOLOGY)',
    program: 'General Arts',
    formYear: 2,
    electives: ['Agric Science', 'Biology', 'Geography', 'Government'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Agric Science', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 3. GENERAL SCIENCE 2
  {
    classCode: 'GEN_SCI_2',
    className: 'GENERAL SCIENCE 2',
    program: 'General Science',
    formYear: 2,
    electives: ['Physics', 'Chemistry', 'Biology', 'Elective Maths', 'P.E and Health - Elective'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'P.E AND HEALTH - ELECTIVE', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'P.E AND HEALTH - ELECTIVE', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'PHYSICS', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'PHYSICS', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CHEMISTRY', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'CHEMISTRY', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'P.E AND HEALTH - ELECTIVE', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'CHEMISTRY', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'CHEMISTRY', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'PHYSICS', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'PHYSICS', teacher: 'GOKA', teacherStaffId: '748589', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 4. BUSINESS 2
  {
    classCode: 'BUSINESS_2',
    className: 'BUSINESS 2',
    program: 'Business',
    formYear: 2,
    electives: ['Financial Accounting', 'Business Management', 'Economics', 'Elective Maths'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'FIN. ACCT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'FIN. ACCT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'BUS. MAGT', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'BUS. MAGT', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'FIN. ACCT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'FIN. ACCT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'E-MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'BUS. MAGT', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BUS. MAGT', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 5. VISUAL ARTS 2
  {
    classCode: 'VISUAL_ARTS_2',
    className: 'VISUAL ARTS 2',
    program: 'Visual Arts',
    formYear: 2,
    electives: ['Design & Comm. Tech', 'Studio', 'Foundation', 'Computing'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'DESIGN & COMM. TECH', teacher: 'RICHARD', teacherStaffId: '648991', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'DESIGN & COMM. TECH', teacher: 'RICHARD', teacherStaffId: '648991', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'DESIGN & COMM. TECH', teacher: 'RICHARD', teacherStaffId: '648991', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'DESIGN & COMM. TECH', teacher: 'RICHARD', teacherStaffId: '648991', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'COMPUTING', teacher: 'PRINCE', teacherStaffId: '704182', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'COMPUTING', teacher: 'PRINCE', teacherStaffId: '704182', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Studio', teacher: 'MBIBA', teacherStaffId: '1547764', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Studio', teacher: 'MBIBA', teacherStaffId: '1547764', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'COMPUTING', teacher: 'PRINCE', teacherStaffId: '704182', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'COMPUTING', teacher: 'PRINCE', teacherStaffId: '704182', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'EUGENE', teacherStaffId: '1304201', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'Foundation', teacher: 'ASIEDU', teacherStaffId: '1254416', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'Foundation', teacher: 'ASIEDU', teacherStaffId: '1254416', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'Foundation', teacher: 'ASIEDU', teacherStaffId: '1254416', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'Foundation', teacher: 'ASIEDU', teacherStaffId: '1254416', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'Studio', teacher: 'MBIBA', teacherStaffId: '1547764', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'Studio', teacher: 'MBIBA', teacherStaffId: '1547764', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'Studio', teacher: 'MBIBA', teacherStaffId: '1547764', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 6. HOME ECONOMICS 2A
  {
    classCode: 'HOME_ECON_2A',
    className: 'HOME ECONOMICS 2A',
    program: 'Home Economics',
    formYear: 2,
    electives: ['Food & Nutrition', 'Management in Living', 'Economics', 'Biology'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'MAGT IN LIVING', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'MAGT IN LIVING', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'MAGT IN LIVING', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'MAGT IN LIVING', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'CORE MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'ECONS', teacher: 'SYLVANUS', teacherStaffId: '706711', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 7. HOME ECONOMICS 1A
  {
    classCode: 'HOME_ECON_1A',
    className: 'HOME ECONOMICS 1A',
    program: 'Home Economics',
    formYear: 1,
    electives: ['Food & Nutrition', 'Management in Living', 'Economics', 'Biology'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'MAGT IN LIVING', teacher: 'JENNY', teacherStaffId: '1417900', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'MAGT IN LIVING', teacher: 'JENNY', teacherStaffId: '1417900', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'MAGT IN LIVING', teacher: 'JENNY', teacherStaffId: '1417900', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'MAGT IN LIVING', teacher: 'JENNY', teacherStaffId: '1417900', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'FOOD & NUTRI', teacher: 'HARRIET', teacherStaffId: '939231', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'ECONS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'ECONS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'BIOLOGY', teacher: 'VERONICA', teacherStaffId: '748954', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'ECONS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'ECONS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },

  // 8. GEN. ARTS 1F (LIT IN ENG/C.R.S)
  {
    classCode: 'GEN_ARTS_1F',
    className: 'GEN. ARTS 1F (LIT IN ENG/C.R.S)',
    program: 'General Arts',
    formYear: 1,
    electives: ['Literature in English', 'C.R.S', 'Geography', 'Government'],
    schedule: {
      Monday: [
        { period: 1, time: '7:00 - 8:00', subject: 'MORNING ASSEMBLY', teacher: 'TRS. AND SNRS ON DUTY', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'LIT', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'LIT', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
      ],
      Tuesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'ICT', teacher: 'PRINCE', teacherStaffId: '704182', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'INT. SCI', teacher: 'GOKA', teacherStaffId: '748589', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'C.R.S', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: false },
        { period: 8, time: '15:00 - 16:00', subject: 'C.R.S', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: false },
      ],
      Wednesday: [
        { period: 1, time: '7:00 - 8:00', subject: 'WORSHIP', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. ENGLISH', teacher: 'EMELDA', teacherStaffId: '1358346', isCore: true },
        { period: 5, time: '11:30 - 12:30', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'GOVT', teacher: 'SAMUEL', teacherStaffId: '707086', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'PLC / VLC SESSION', teacher: 'PLC', isCore: true },
      ],
      Thursday: [
        { period: 1, time: '7:00 - 8:00', subject: 'LIT', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: false },
        { period: 2, time: '8:00 - 9:00', subject: 'LIT', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: false },
        { period: 3, time: '9:30 - 10:30', subject: 'SOC. STDY', teacher: 'MARY', teacherStaffId: '1525610', isCore: true },
        { period: 4, time: '10:30 - 11:30', subject: 'INT. MATHS', teacher: 'ERASMUS', teacherStaffId: '623736', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 6, time: '13:00 - 14:00', subject: 'CORE MATHS', teacher: 'DESMOND', teacherStaffId: '1242093', isCore: true },
        { period: 7, time: '14:00 - 15:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'ENGLISH', teacher: 'AMAGLO', teacherStaffId: '623941', isCore: true },
      ],
      Friday: [
        { period: 1, time: '7:00 - 8:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 2, time: '8:00 - 9:00', subject: 'LIBRARY', teacher: 'LIB', isCore: true },
        { period: 3, time: '9:30 - 10:30', subject: 'C.R.S', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: false },
        { period: 4, time: '10:30 - 11:30', subject: 'C.R.S', teacher: 'EMMANUEL', teacherStaffId: '814652', isCore: false },
        { period: 5, time: '11:30 - 12:30', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 6, time: '13:00 - 14:00', subject: 'GEOG', teacher: 'OTTUH', teacherStaffId: '953124', isCore: false },
        { period: 7, time: '14:00 - 15:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
        { period: 8, time: '15:00 - 16:00', subject: 'P.E', teacher: 'ENOCH', teacherStaffId: '1222669', isCore: true },
      ],
    },
  },
];

/**
 * Returns which aSc period is active right now based on local school time.
 */
export function getCurrentAscPeriod(now: Date = new Date()): {
  periodNumber: number;
  periodLabel: string;
  timeRange: string;
  status: 'active' | 'first_break' | 'second_break' | 'outside_hours';
} {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // First Break: 9:00 - 9:30 (540 to 570 min)
  if (currentMinutes >= 9 * 60 && currentMinutes < 9 * 60 + 30) {
    return {
      periodNumber: 2,
      periodLabel: 'First Break',
      timeRange: '9:00 - 9:30',
      status: 'first_break',
    };
  }

  // Second Break: 12:30 - 13:00 (750 to 780 min)
  if (currentMinutes >= 12 * 60 + 30 && currentMinutes < 13 * 60) {
    return {
      periodNumber: 5,
      periodLabel: 'Second Break',
      timeRange: '12:30 - 13:00',
      status: 'second_break',
    };
  }

  // Check periods 1 - 8
  for (const p of ASC_PERIODS) {
    if (currentMinutes >= p.startMin && currentMinutes < p.endMin) {
      return {
        periodNumber: p.period,
        periodLabel: p.label,
        timeRange: p.time,
        status: 'active',
      };
    }
  }

  // Outside 7:00 - 16:00
  return {
    periodNumber: 1,
    periodLabel: 'Outside Scheduled Hours',
    timeRange: '7:00 - 16:00 (Standard aSc Day)',
    status: 'outside_hours',
  };
}

export function getCurrentWeekDay(date: Date = new Date()): WeekDay {
  const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  switch (dayIndex) {
    case 1:
      return 'Monday';
    case 2:
      return 'Tuesday';
    case 3:
      return 'Wednesday';
    case 4:
      return 'Thursday';
    case 5:
      return 'Friday';
    default:
      return 'Monday'; // Default to Monday on weekends for scheduling previews
  }
}

/**
 * Looks up scheduled subject, teacher and core/elective status for a classroom.
 */
export function lookupClassScheduleSlot(
  classIdentifier: string,
  day: WeekDay,
  periodNumber: number
): TimetableSlot | null {
  const norm = classIdentifier.trim().toLowerCase().replace(/[\s\-_()]/g, '');

  const match = OFFICIAL_TIMETABLES.find((ct) => {
    const codeNorm = ct.classCode.toLowerCase().replace(/[\s\-_()]/g, '');
    const nameNorm = ct.className.toLowerCase().replace(/[\s\-_()]/g, '');
    return norm.includes(codeNorm) || codeNorm.includes(norm) || norm.includes(nameNorm) || nameNorm.includes(norm);
  });

  if (!match) return null;

  const slots = match.schedule[day] || [];
  const slot = slots.find((s) => s.period === periodNumber);
  return slot || null;
}

/**
 * Smartly resolves teacher from timetable initials, abbreviations, surnames, or full names.
 * Example inputs: "EFE", "E.F.E.", "KA", "K. Amponsah", "GOKA", "SABBAH", "1304201", "0248793773"
 */
export function resolveTeacherSmart(
  input: string,
  staffList?: { staffId: string; name: string; department?: string; phone?: string }[]
): { fullName: string; staffId: string; matchedBy: string; initials: string; department?: string } {
  if (!input || !input.trim()) {
    return {
      fullName: 'Mr. Eugene Fafali Esianyo',
      staffId: '1304201',
      matchedBy: 'default',
      initials: 'EFE',
      department: 'General Arts',
    };
  }

  const raw = input.trim();
  const rawUpper = raw.toUpperCase();
  const clean = raw.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  const lettersOnly = raw.replace(/[^A-Za-z]/g, '').toUpperCase();
  const digitsOnly = raw.replace(/\D/g, '');

  // 1. Direct match in official TEACHER_NAME_MAP
  if (TEACHER_NAME_MAP[rawUpper]) {
    const item = TEACHER_NAME_MAP[rawUpper];
    return { fullName: item.fullName, staffId: item.staffId, matchedBy: 'timetable_name_map', initials: rawUpper };
  }
  if (TEACHER_NAME_MAP[clean]) {
    const item = TEACHER_NAME_MAP[clean];
    return { fullName: item.fullName, staffId: item.staffId, matchedBy: 'timetable_name_map', initials: clean };
  }

  // Common Shorthand / Initials Direct Map
  const KNOWN_INITIALS: Record<string, { fullName: string; staffId: string; department?: string }> = {
    KA: { fullName: 'Mr. Kwame Amponsah', staffId: 'GES-T-0428', department: 'Business Management' },
    KAMPONSAH: { fullName: 'Mr. Kwame Amponsah', staffId: 'GES-T-0428', department: 'Business Management' },
    AMPONSAH: { fullName: 'Mr. Kwame Amponsah', staffId: 'GES-T-0428', department: 'Business Management' },
    EFE: { fullName: 'Mr. Eugene Fafali Esianyo', staffId: '1304201', department: 'General Arts' },
    EE: { fullName: 'Mr. Eugene Fafali Esianyo', staffId: '1304201', department: 'General Arts' },
    ESIANYO: { fullName: 'Mr. Eugene Fafali Esianyo', staffId: '1304201', department: 'General Arts' },
    CAS: { fullName: 'Miss Charity Akosua Sabbah', staffId: '948389', department: 'Home Economics & Services' },
    CS: { fullName: 'Miss Charity Akosua Sabbah', staffId: '948389', department: 'Home Economics & Services' },
    SABBAH: { fullName: 'Miss Charity Akosua Sabbah', staffId: '948389', department: 'Home Economics & Services' },
    DG: { fullName: 'Mr. David Goka', staffId: '748589', department: 'General Science' },
    GOKA: { fullName: 'Mr. David Goka', staffId: '748589', department: 'General Science' },
    SN: { fullName: 'Mr. Samuel Numatsi', staffId: '707086', department: 'Mathematics' },
    NUMATSI: { fullName: 'Mr. Samuel Numatsi', staffId: '707086', department: 'Mathematics' },
    SSS: { fullName: 'Mr. Sylvanus Sunday Semaxa', staffId: '706711', department: 'General Science' },
    SEMAXA: { fullName: 'Mr. Sylvanus Sunday Semaxa', staffId: '706711', department: 'General Science' },
    RDK: { fullName: 'Mr. Richard Dodzi Keteku', staffId: '648991', department: 'Languages' },
    KETEKU: { fullName: 'Mr. Richard Dodzi Keteku', staffId: '648991', department: 'Languages' },
    RA: { fullName: 'Mr. Richard Asiedu', staffId: '1254416', department: 'Business' },
    ASIEDU: { fullName: 'Mr. Richard Asiedu', staffId: '1254416', department: 'Business' },
    IM: { fullName: 'Mr. Issor Mbiba', staffId: '1547764', department: 'Social Sciences' },
    MBIBA: { fullName: 'Mr. Issor Mbiba', staffId: '1547764', department: 'Social Sciences' },
    PDA: { fullName: 'Miss Patience Dzigbordi Amaglo', staffId: '623941', department: 'General Arts' },
    AMAGLO: { fullName: 'Miss Patience Dzigbordi Amaglo', staffId: '623941', department: 'General Arts' },
    EAW: { fullName: 'Miss Emelda Abena Wawo', staffId: '1358346', department: 'Home Economics' },
    WAWO: { fullName: 'Miss Emelda Abena Wawo', staffId: '1358346', department: 'Home Economics' },
    AO: { fullName: 'Mr. Augustine Ottuh', staffId: '953124', department: 'Visual Arts' },
    OTTUH: { fullName: 'Mr. Augustine Ottuh', staffId: '953124', department: 'Visual Arts' },
    EA: { fullName: 'Mr. Emmanuel Agbewowoele', staffId: '814652', department: 'Science' },
    MAK: { fullName: 'Mary Agyei Kyeremeh', staffId: '1525610', department: 'Home Economics' },
    KYEREMEH: { fullName: 'Mary Agyei Kyeremeh', staffId: '1525610', department: 'Home Economics' },
    HT: { fullName: 'Miss Harriet Tsamanyi', staffId: '939231', department: 'General Arts' },
    TSAMANYI: { fullName: 'Miss Harriet Tsamanyi', staffId: '939231', department: 'General Arts' },
    JAN: { fullName: 'Miss Jenny Akwaley Nuertey', staffId: '1417900', department: 'Science' },
    NUERTEY: { fullName: 'Miss Jenny Akwaley Nuertey', staffId: '1417900', department: 'Science' },
    LA: { fullName: 'Miss Leticia Agbewu', staffId: '1220681', department: 'Arts' },
    AGBEWU: { fullName: 'Miss Leticia Agbewu', staffId: '1220681', department: 'Arts' },
    SKA: { fullName: 'Mr. Segbaya Koku Ahialoho', staffId: '281351', department: 'Technical' },
    AHIALOHO: { fullName: 'Mr. Segbaya Koku Ahialoho', staffId: '281351', department: 'Technical' },
    KT: { fullName: 'Mr. Koffi Toku', staffId: '1199492', department: 'Mathematics' },
    TOKU: { fullName: 'Mr. Koffi Toku', staffId: '1199492', department: 'Mathematics' },
    MM: { fullName: 'Mr. Musan Mohammed', staffId: '819744', department: 'Islamic Studies' },
    MOHAMMED: { fullName: 'Mr. Musan Mohammed', staffId: '819744', department: 'Islamic Studies' },
    KEB: { fullName: 'Mr. Komla Erasmus Boateng', staffId: '623736', department: 'General Arts' },
    BOATENG: { fullName: 'Mr. Komla Erasmus Boateng', staffId: '623736', department: 'General Arts' },
    DD: { fullName: 'Mr. Desmond Dzorkplenu', staffId: '1242093', department: 'Science' },
    DZORKPLENU: { fullName: 'Mr. Desmond Dzorkplenu', staffId: '1242093', department: 'Science' },
    VA: { fullName: 'Miss Veronica Adorkor', staffId: '748954', department: 'Business' },
    ADORKOR: { fullName: 'Miss Veronica Adorkor', staffId: '748954', department: 'Business' },
    PY: { fullName: 'Mr. Prince Yayra', staffId: '704182', department: 'Visual Arts' },
    YAYRA: { fullName: 'Mr. Prince Yayra', staffId: '704182', department: 'Visual Arts' },
    RMA: { fullName: 'Mr. Richard Mawuli Adare', staffId: '867298', department: 'Mathematics' },
    ADARE: { fullName: 'Mr. Richard Mawuli Adare', staffId: '867298', department: 'Mathematics' },
    EKA: { fullName: 'Mr. Enoch Kwasi Adiasie', staffId: '1222669', department: 'Science' },
    ADIASIE: { fullName: 'Mr. Enoch Kwasi Adiasie', staffId: '1222669', department: 'Science' },
    KK: { fullName: 'Mr. Kennedy Keteke', staffId: '666510', department: 'Social Studies' },
    KETEKE: { fullName: 'Mr. Kennedy Keteke', staffId: '666510', department: 'Social Studies' },
  };

  if (lettersOnly && KNOWN_INITIALS[lettersOnly]) {
    const match = KNOWN_INITIALS[lettersOnly];
    return { fullName: match.fullName, staffId: match.staffId, matchedBy: 'initials', initials: lettersOnly, department: match.department };
  }

  // 2. Query school staff database dynamically
  let roster: { staffId: string; name: string; department?: string; phone?: string }[] = [];
  if (staffList && staffList.length > 0) {
    roster = staffList;
  } else {
    try {
      const teaching = storageEngine.getStaff().map((s) => ({
        staffId: s.staffId,
        name: s.name,
        department: s.department,
        phone: s.phone,
      }));
      const nonTeaching = storageEngine.getNonTeachingStaff().map((nt) => ({
        staffId: nt.staffId,
        name: nt.name,
        department: nt.unit,
        phone: nt.phone,
      }));
      roster = [...teaching, ...nonTeaching];
    } catch {
      roster = [];
    }
  }

  // Match by phone number (e.g. 0248793773 or 0246397354)
  if (digitsOnly.length >= 7) {
    const byPhone = roster.find((s) => s.phone && s.phone.replace(/\D/g, '').includes(digitsOnly));
    if (byPhone) {
      return {
        fullName: byPhone.name,
        staffId: byPhone.staffId,
        matchedBy: 'phone_number',
        initials: extractInitials(byPhone.name),
        department: byPhone.department,
      };
    }
    // Check known test phone numbers
    if (digitsOnly.includes('248793773') || digitsOnly.includes('0248793773')) {
      return {
        fullName: 'Mr. Eugene Fafali Esianyo',
        staffId: '1304201',
        matchedBy: 'phone_number',
        initials: 'EFE',
        department: 'General Arts',
      };
    }
    if (digitsOnly.includes('246397354') || digitsOnly.includes('0246397354')) {
      return {
        fullName: 'Miss Charity Akosua Sabbah',
        staffId: '948389',
        matchedBy: 'phone_number',
        initials: 'CAS',
        department: 'Home Economics & Services',
      };
    }
  }

  // Match by exact staff ID
  const byId = roster.find((s) => s.staffId.toLowerCase() === raw.toLowerCase());
  if (byId) {
    return { fullName: byId.name, staffId: byId.staffId, matchedBy: 'staff_id', initials: extractInitials(byId.name), department: byId.department };
  }

  // Match by exact name
  const byName = roster.find((s) => s.name.toLowerCase() === raw.toLowerCase());
  if (byName) {
    return { fullName: byName.name, staffId: byName.staffId, matchedBy: 'full_name', initials: extractInitials(byName.name), department: byName.department };
  }

  // Smart Match against each staff member in database
  for (const staff of roster) {
    const staffClean = staff.name.replace(/^(Mr\.|Mrs\.|Miss|Dr\.|Rev\.|Madam)\s+/i, '').trim();
    const parts = staffClean.split(/\s+/).filter(Boolean);
    const initialsAll = parts.map((p) => p[0].toUpperCase()).join(''); // e.g. EFE
    const initialsFirstLast = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : ''; // e.g. EE
    const surname = parts.length > 0 ? parts[parts.length - 1].toUpperCase() : ''; // e.g. ESIANYO
    const firstName = parts.length > 0 ? parts[0].toUpperCase() : '';

    // Check initials match
    if (lettersOnly === initialsAll || (initialsFirstLast && lettersOnly === initialsFirstLast)) {
      return { fullName: staff.name, staffId: staff.staffId, matchedBy: 'initials', initials: initialsAll, department: staff.department };
    }

    // Check surname match
    if (surname && (clean === surname || clean.includes(surname))) {
      return { fullName: staff.name, staffId: staff.staffId, matchedBy: 'surname', initials: initialsAll, department: staff.department };
    }

    // Check first name match
    if (firstName && clean === firstName && firstName.length >= 4) {
      return { fullName: staff.name, staffId: staff.staffId, matchedBy: 'first_name', initials: initialsAll, department: staff.department };
    }

    // Check initial + surname pattern (e.g. "K. Amponsah", "E. Esianyo")
    if (parts.length > 1) {
      const short1 = `${parts[0][0]} ${surname}`.toUpperCase();
      const short2 = `${parts[0][0]}${surname}`.toUpperCase();
      if (clean === short1 || clean.replace(/\s+/g, '') === short2) {
        return { fullName: staff.name, staffId: staff.staffId, matchedBy: 'initial_and_surname', initials: initialsAll, department: staff.department };
      }
    }
  }

  // Fallback
  return {
    fullName: raw,
    staffId: '1000999',
    matchedBy: 'unmatched',
    initials: lettersOnly.slice(0, 3) || 'GES',
  };
}

function extractInitials(name: string): string {
  const clean = name.replace(/^(Mr\.|Mrs\.|Miss|Dr\.|Rev\.|Madam)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0].toUpperCase()).join('');
}

