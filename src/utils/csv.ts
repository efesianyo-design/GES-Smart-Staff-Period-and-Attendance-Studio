import { GateAttendanceRecord, PeriodTeachingSession, StaffMember, Classroom, Learner } from '../types';

/**
 * Downloads data as a CSV file.
 * Auto-detects argument order: supports both (filename, content) and (content, filename).
 */
export function downloadCSV(arg1: string, arg2: string) {
  let filename = (arg1 || '').trim();
  let content = arg2 || '';

  // If arg1 contains line breaks or commas or looks like CSV body, while arg2 looks like a filename (or ends with .csv)
  const arg1LooksLikeContent = arg1.includes('\n') || arg1.length > 200 || (!arg1.toLowerCase().endsWith('.csv') && arg2.toLowerCase().endsWith('.csv'));
  const arg2LooksLikeFilename = arg2.toLowerCase().endsWith('.csv') || (!arg2.includes('\n') && arg2.length < 150);

  if (arg1LooksLikeContent && arg2LooksLikeFilename) {
    content = arg1;
    filename = arg2.trim();
  }

  // Clean filename: remove newlines, invalid filesystem characters, quotes
  filename = filename
    .split('\n')[0]
    .replace(/["\r]/g, '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .trim();

  if (!filename || filename.length === 0) {
    filename = `GES_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (!filename.toLowerCase().endsWith('.csv')) {
    filename = `${filename}.csv`;
  }

  // Cap filename length to avoid OS limits
  if (filename.length > 100) {
    filename = filename.slice(0, 96) + '.csv';
  }

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports GES Staff Attendance Log (Daily/Monthly)
 */
export function generateStaffAttendanceCSV(
  records: GateAttendanceRecord[],
  schoolName: string
): string {
  const cleanSchool = (schoolName || 'Senior High School').replace(/"/g, '""');

  const header = 'Date,School,Staff ID,Staff Name,Department,Arrival Time,Punctuality Status,Departure Time,Distance from Gate (m),Identity Verified,On Campus,Verification Method,Login Trace,Device Signature,Closing Reflection Note';

  const rows = records.map((r) => {
    const punctuality =
      r.punctualityStatus === 'on_time'
        ? 'On Time'
        : r.punctualityStatus === 'late'
        ? 'Late Arrival'
        : 'Substantially Late';

    const reflection = (r.closingReflection || '').replace(/"/g, '""');
    const loginTrace = (r.loginTrace || '').replace(/"/g, '""');

    return [
      `"${r.date}"`,
      `"${cleanSchool}"`,
      `"${r.staffId}"`,
      `"${r.staffName}"`,
      `"${r.department}"`,
      `"${r.clockInTime}"`,
      `"${punctuality}"`,
      `"${r.clockOutTime || 'On Campus / Active'}"`,
      `"${r.clockInCoords.distanceMeters}m"`,
      `"${r.isIdentityVerified ? 'Verified' : 'Unverified'}"`,
      `"${r.isOnCampus ? 'On Campus' : 'Off Campus'}"`,
      `"${r.verificationMethod || 'pin'}"`,
      `"${loginTrace}"`,
      `"${r.deviceSignature}"`,
      `"${reflection}"`
    ].join(',');
  });

  return `${header}\n${rows.join('\n')}`;
}

/**
 * Exports GES Instructional Contact Hours CSV
 */
export function generateInstructionalContactCSV(
  sessions: PeriodTeachingSession[],
  schoolName: string
): string {
  const cleanSchool = (schoolName || 'Senior High School').replace(/"/g, '""');

  const header = 'Date,School,Teacher Staff ID,Teacher Name,Classroom / Stream,Class Code(s),Lecture Type,Subject,Start Time,End Time,Contact Minutes,Abbreviated Period (<15m),Roster Count,On-Time Learners,Late Count,Late Learners,Absent Count,Absent Learners,Login Trace,Session Notes';

  const rows = sessions.map((s) => {
    const absentCount = s.totalRosterCount - s.presentCount;
    const lateCount = s.lateCount || 0;
    const onTimeCount = Math.max(0, s.presentCount - lateCount);
    const absentees = (s.absentLearnerNames || []).join('; ').replace(/"/g, '""');
    const lateNames = (s.lateLearnerNames || []).join('; ').replace(/"/g, '""');
    const notes = (s.notes || '').replace(/"/g, '""');
    const loginTrace = (s.loginTrace || '').replace(/"/g, '""');
    const codes = s.mergedClassCodes && s.mergedClassCodes.length > 0 
      ? s.mergedClassCodes.join('+') 
      : (s.classCode || 'N/A');
    const lectureType = s.isMerged ? 'Combined / Merged Classes' : 'Single Class';
    const isAbbr = (s.isAbbreviated ?? s.elapsedMinutes < 15) ? 'YES (Abbreviated)' : 'NO (Standard)';

    return [
      `"${s.date}"`,
      `"${cleanSchool}"`,
      `"${s.teacherStaffId}"`,
      `"${s.teacherName}"`,
      `"${s.className}"`,
      `"${codes}"`,
      `"${lectureType}"`,
      `"${s.subject}"`,
      `"${s.startTime}"`,
      `"${s.endTime || 'In Progress'}"`,
      `"${s.elapsedMinutes}"`,
      `"${isAbbr}"`,
      `"${s.totalRosterCount}"`,
      `"${onTimeCount}"`,
      `"${lateCount}"`,
      `"${lateNames}"`,
      `"${absentCount}"`,
      `"${absentees}"`,
      `"${loginTrace}"`,
      `"${notes}"`
    ].join(',');
  });

  return `${header}\n${rows.join('\n')}`;
}

/**
 * Parses uploaded Staff CSV
 * Expected columns: id, name, department, phone, pin
 */
/**
 * Parses uploaded Staff CSV
 * Expected columns: staff_id / id, name, department, phone, role, category, pin
 */
export function parseStaffCSV(csvText: string): Partial<StaffMember>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''));

  const idIdx = headers.findIndex((h) => h.includes('id') || h.includes('staff') || h.includes('ippd') || h.includes('reg'));
  const nameIdx = headers.findIndex((h) => h.includes('name'));
  const deptIdx = headers.findIndex((h) => h.includes('dept') || h.includes('department'));
  const phoneIdx = headers.findIndex((h) => h.includes('phone') || h.includes('mobile'));
  const roleIdx = headers.findIndex((h) => h.includes('role') || h.includes('rank') || h.includes('post'));
  const categoryIdx = headers.findIndex((h) => h.includes('category') || h.includes('type') || h.includes('status'));
  const pinIdx = headers.findIndex((h) => h.includes('pin'));

  const parsed: Partial<StaffMember>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((item) => item.trim().replace(/^["']|["']$/g, ''));
    if (row.length <= 1) continue;

    const rawCategory = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].toLowerCase() : '';
    let category: StaffMember['category'] = 'permanent';
    if (rawCategory.includes('nss') || rawCategory.includes('service')) category = 'nss';
    else if (rawCategory.includes('intern') || rawCategory.includes('student')) category = 'intern';
    else if (rawCategory.includes('contract') || rawCategory.includes('casual')) category = 'contract';

    let defaultId = `108${4000 + i}`;
    if (category === 'nss') defaultId = `NSS-2024-${String(i).padStart(3, '0')}`;
    else if (category === 'intern') defaultId = `INT-2024-${String(i).padStart(3, '0')}`;

    const staffId = idIdx !== -1 && row[idIdx] ? row[idIdx] : defaultId;
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Staff Member ${i}`;
    const department = deptIdx !== -1 && row[deptIdx] ? row[deptIdx] : 'General Education';
    const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : '+233 24 000 0000';
    const pin = pinIdx !== -1 && row[pinIdx] ? row[pinIdx] : '1234';
    const roleText = roleIdx !== -1 && row[roleIdx] ? row[roleIdx] : (category === 'nss' ? 'NSP' : 'Teacher');

    parsed.push({
      staffId,
      name,
      department,
      phone,
      pin,
      role: 'Teacher',
      category,
      rank: roleText,
    });
  }

  return parsed;
}

/**
 * Parses uploaded Classroom & Learner Enrolment CSV
 * Expected columns: code, name, block, grade, learners
 */
export function parseClassroomCSV(csvText: string): Partial<Classroom>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''));

  const codeIdx = headers.findIndex((h) => h.includes('code') || h.includes('id'));
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('class'));
  const blockIdx = headers.findIndex((h) => h.includes('block') || h.includes('building'));
  const gradeIdx = headers.findIndex((h) => h.includes('grade') || h.includes('form') || h.includes('level'));
  const learnersIdx = headers.findIndex((h) => h.includes('learner') || h.includes('student') || h.includes('roster') || h.includes('enrol'));

  const parsed: Partial<Classroom>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((item) => item.trim().replace(/^["']|["']$/g, ''));
    if (row.length <= 1) continue;

    const code = codeIdx !== -1 && row[codeIdx] ? row[codeIdx] : `CLS-${i}`;
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Classroom ${i}`;
    const block = blockIdx !== -1 && row[blockIdx] ? row[blockIdx] : 'Main Academic Block';
    const grade = gradeIdx !== -1 && row[gradeIdx] ? row[gradeIdx] : 'Form 1';
    const totalLearners = learnersIdx !== -1 && row[learnersIdx] ? parseInt(row[learnersIdx], 10) || 40 : 40;

    parsed.push({
      code,
      name,
      block,
      grade,
      totalLearners,
    });
  }

  return parsed;
}

/**
 * Parses student-level CSV matching the user's institutional format:
 * Columns: Name | Name of Class | Classcode
 */
export function parseStudentClassRosterCSV(csvText: string): Classroom[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ''));

  const nameIdx = headers.findIndex((h) => h === 'name' || h.includes('student') || h.includes('learner'));
  const classNameIdx = headers.findIndex((h) => h.includes('name of class') || h.includes('classname') || (h.includes('class') && !h.includes('code')));
  const classCodeIdx = headers.findIndex((h) => h.includes('classcode') || h.includes('code') || h.includes('classid'));

  if (nameIdx === -1 || classCodeIdx === -1) {
    return [];
  }

  // Map of classCode -> { name, learners: Learner[] }
  const classMap = new Map<string, { name: string; learners: Learner[] }>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map((item) => item.trim().replace(/^["']|["']$/g, ''));
    if (row.length <= 1) continue;

    const studentName = row[nameIdx] || '';
    if (!studentName) continue;

    const classCode = (row[classCodeIdx] || 'UNKNOWN').toUpperCase();
    const className = classNameIdx !== -1 && row[classNameIdx] ? row[classNameIdx].toUpperCase() : classCode;

    if (!classMap.has(classCode)) {
      classMap.set(classCode, { name: className, learners: [] });
    }

    const entry = classMap.get(classCode)!;
    entry.learners.push({
      id: `lrn-${classCode.toLowerCase()}-${entry.learners.length + 1}`,
      rollNo: entry.learners.length + 1,
      name: studentName,
      classCode,
      className: entry.name,
    });
  }

  const generatedClassrooms: Classroom[] = [];
  let index = 1;

  for (const [code, { name, learners }] of classMap.entries()) {
    // Infer grade e.g. "3C" -> "Form 3", "2F" -> "Form 2"
    let grade = 'Form 1';
    if (code.includes('3') || name.includes('3')) grade = 'Form 3';
    else if (code.includes('2') || name.includes('2')) grade = 'Form 2';
    else if (code.includes('1') || name.includes('1')) grade = 'Form 1';

    generatedClassrooms.push({
      id: `cls-imported-${code.toLowerCase()}`,
      code,
      name,
      block: `Block ${code.substring(0, 2)} • Room ${100 + index}`,
      grade,
      totalLearners: learners.length,
      roster: learners,
    });
    index++;
  }

  return generatedClassrooms;
}

/**
 * Download sample Staff CSV Template
 */
export function downloadStaffTemplateCSV() {
  const content = [
    'staffId,name,department,phone,category,rank,pin',
    '1084291,Sir Eugene Mensah,Science & Mathematics,+233 24 589 1234,permanent,Principal Superintendent,1234',
    '1092834,Mrs. Akosua Darko-Frimpong,Languages,+233 20 441 9876,permanent,Assistant Director II,1234',
    'NSS-2024-041,Ms. Beatrice Agbemava,Vocational & Home Economics,+233 24 331 4455,nss,NSP,1234',
    'INT-2024-012,Mr. Johnathan Quarshie,Physical Education & Sports,+233 26 778 9900,intern,Student Teacher,1234'
  ].join('\n');
  downloadCSV('ges_staff_upload_template.csv', content);
}

/**
 * Download sample Classroom & Learner Enrolment CSV Template
 */
export function downloadClassroomTemplateCSV() {
  const content = [
    'code,name,block,grade,learners',
    'BCGA3C,GENERAL ARTS 3C,Block A - Floor 2,Form 3,48',
    'BCHE3B,HOME ECONOMICS 3B,Block B - Home Econ Lab,Form 3,44',
    'BCSVA3,VISUAL AND PERFORMING ARTS 3,Block C - Studio 1,Form 3,36'
  ].join('\n');
  downloadCSV('ges_classrooms_enrolment_template.csv', content);
}

/**
 * Download sample Student Class List CSV Template matching the user's spreadsheet format
 */
export function downloadStudentClassRosterTemplateCSV() {
  const content = [
    'Name,Name of Class,Classcode',
    'AMARH ISABELLA,GENERAL ARTS 3C,BCGA3C',
    'BIYON DAVID MAKIWI,GENERAL ARTS 3C,BCGA3C',
    'DAGADU FAITH NEZUYAYRA,GENERAL ARTS 3C,BCGA3C',
    'ANNANG PRINCE LARYEA,GENERAL ARTS 3C,BCGA3C',
    'JAMES KACHIRIBE MBEMBA,GENERAL ARTS 3D,BCGA3D',
    'EVA UJAKPA,GENERAL ARTS 3D,BCGA3D',
    'ADIKA MARY,HOME ECONOMICS 3B,BCHE3B',
    'GYEMUSAH MAJORY,HOME ECONOMICS 3B,BCHE3B',
    'LIFANG MMEJIN GRACE,HOME ECONOMICS 3B,BCHE3B',
    'MINIFEEBO AFOTEY FESTUS NII ODAI,VISUAL AND PERFORMING ARTS 3,BCSVA3',
    'ADJORKEY RUTH AKUA,GENERAL SCIENCE 3,BCSGS3',
    'MOHAMMED RAFIA,BUSINESS 3,BCSBU3'
  ].join('\n');
  downloadCSV('ges_student_class_codes_template.csv', content);
}
