export type PunctualityStatus = 'on_time' | 'late' | 'substantially_late';

export type StaffRole = 'Teacher' | 'HOD' | 'Assistant Head' | 'Headmaster' | 'Staff';

export type StaffPresenceStatus = 'off_campus' | 'on_campus' | 'teaching';

export type StaffCategory = 'permanent' | 'nss' | 'intern' | 'contract' | 'volunteer';

export interface StaffMember {
  id: string;
  staffId: string; // Unique GES IPPD/Staff ID e.g. "1084291", or NSS/Intern code e.g. "NSS-2024-041"
  name: string;
  department: string;
  phone: string;
  pin: string; // 4-digit PIN e.g. "1234"
  role: StaffRole;
  avatarColor: string;
  avatar?: string;
  subjects: string[];
  category?: StaffCategory; // Permanent GES staff vs NSS personnel vs Intern/Student Teacher
  rank?: string; // e.g. Principal Superintendent, Assistant Director II, NSS Personnel
}

export interface GateAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:MM:SS
  clockInTimestamp: number;
  clockOutTime?: string;
  clockOutTimestamp?: number;
  clockInCoords: {
    lat: number;
    lng: number;
    accuracy: number;
    distanceMeters: number;
  };
  punctualityStatus: PunctualityStatus;
  deviceSignature: string;
  closingReflection?: string;
  synced: boolean;
  verificationMethod?: 'pin' | 'qr_badge' | 'beacon' | 'kiosk_override' | 'otp' | 'otp_and_beacon';
  isIdentityVerified?: boolean;
  isOnCampus?: boolean;
  loginTrace?: string;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export interface Learner {
  id: string;
  rollNo: number;
  name: string;
  classCode?: string; // e.g. "BCGA3C"
  className?: string; // e.g. "GENERAL ARTS 3C"
}

export interface Classroom {
  id: string;
  code: string; // e.g. "BCGA3C"
  name: string; // "GENERAL ARTS 3C"
  block: string; // "Block A - Room 102"
  grade?: string; // "Form 1", "Form 2", "Form 3"
  totalLearners: number;
  roster: Learner[];
  currentSession?: {
    sessionId: string;
    teacherId: string;
    teacherName: string;
    subject: string;
    startTimestamp: number;
    presentCount: number;
    lateCount?: number;
    lateLearnerIds?: string[];
    absentLearnerIds: string[];
    isMerged?: boolean;
    mergedClassIds?: string[];
    mergedClassCodes?: string[];
    mergedClassNames?: string[];
    deviceSignature?: string;
  };
}

export interface PeriodTeachingSession {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherStaffId: string;
  classroomId: string;
  className: string;
  classCode?: string; // Primary classcode e.g. "BCGA3C"
  isMerged?: boolean;
  mergedClassIds?: string[];
  mergedClassCodes?: string[]; // e.g. ["BCGA3C", "BCGA3D", "BCGA3E"]
  mergedClassNames?: string[]; // e.g. ["GENERAL ARTS 3C", "GENERAL ARTS 3D"]
  subject: string;
  date: string;
  startTime: string;
  startTimestamp: number;
  endTime?: string;
  endTimestamp?: number;
  elapsedMinutes: number;
  totalRosterCount: number;
  presentCount: number;
  lateCount?: number;
  lateLearnerIds?: string[];
  lateLearnerNames?: string[];
  absentLearnerIds: string[];
  absentLearnerNames: string[];
  notes?: string;
  synced: boolean;
  deviceSignature?: string;
  loginTrace?: string;
  isAbbreviated?: boolean;
  schoolCode?: string;
  schoolName?: string;
  periodNumber?: number;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  isLateArrival?: boolean;
  lateMinutes?: number;
  isEarlyDeparture?: boolean;
  earlyMinutes?: number;
  punctualityStatus?: 'on_time' | 'late' | 'early_departure' | 'compliant';
  status?: 'active' | 'completed';
}

export interface ActiveClassSession {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherStaffId: string;
  classroomId: string;
  className: string;
  classCode: string;
  isMerged: boolean;
  mergedClassCodes: string[];
  mergedClassNames: string[];
  subject: string;
  date: string;
  periodNumber: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime: string;
  startTimestamp: number;
  isLateArrival: boolean;
  lateMinutes: number;
  totalRosterCount: number;
  schoolCode?: string;
}

export type LeadershipRoleKey =
  | 'headmaster'
  | 'asst_academic'
  | 'asst_domestic'
  | 'asst_welfare'
  | 'asst_admin'
  | 'accountant'
  | 'senior_housemaster'
  | 'matron'
  | 'chief_security'
  | string;

export interface LeadershipRoleConfig {
  key: string;
  title: string; // e.g. "Headmaster / Principal", "Assistant Headmaster (Academic)", "Assistant Headmaster (Domestic)", "Assistant Headmaster (Welfare)"
  officerName: string;
  staffId: string;
  phone?: string;
  avatarColor: string;
  scopeDescription: string;
  supervisedCategories: string[]; // e.g. ['teaching_staff', 'period_tracking', 'academic_departments', 'kitchen', 'dormitories', 'security', 'infirmary', 'counseling']
  monitoredUnits: string[]; // e.g. ['General Science', 'Business', 'Kitchen', 'Security', 'Health Bay', 'Boarding Houses']
  canAlterOrganogram?: boolean;
  reportsToKey?: string;
  lastActive?: string;
  division?: 'executive' | 'academic' | 'domestic' | 'welfare' | 'administrative' | 'finance';
}

export interface OrganogramConfig {
  schoolCode: string;
  schoolName: string;
  lastUpdated: string;
  roles: LeadershipRoleConfig[];
  customReportingNotes?: string;
}

export interface InfirmaryVisitRecord {
  id: string;
  studentName: string;
  classCode: string;
  houseName: string;
  complaint: string;
  admittedAt: string;
  status: 'admitted' | 'discharged' | 'referred_hospital';
  nurseOnDuty: string;
  treatment: string;
  exeatIssued: boolean;
}

export interface HouseDormRecord {
  id: string;
  houseName: string;
  housemasterName: string;
  housemasterStaffId: string;
  totalBoarders: number;
  presentTonight: number;
  onExeatCount: number;
  inInfirmaryCount: number;
  musterRollStatus: 'completed' | 'pending' | 'flagged';
  lastRollCallTime: string;
}

export interface WelfareCaseRecord {
  id: string;
  caseType: 'student_guidance' | 'staff_compassionate' | 'medical_emergency' | 'indigent_support';
  personName: string;
  personType: 'student' | 'teaching_staff' | 'non_teaching_staff';
  departmentOrClass: string;
  description: string;
  openedDate: string;
  status: 'active' | 'in_progress' | 'resolved';
  officerInCharge: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface SchoolConfig {
  schoolName: string;
  schoolCode: string;
  district: string;
  region: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  onTimeCutoff: string; // e.g. "07:45"
  lateCutoff: string; // e.g. "08:30"
  closingTime: string; // e.g. "14:30"
  lessonStartHour: number; // e.g. 6 (6 AM)
  lessonEndHour: number; // e.g. 17 (5 PM)
  superAdminPin: string; // e.g. "1234"
  logoUrl?: string;
  principalPassword?: string;
  asstAcademicPassword?: string;
  asstDomesticPassword?: string;
  asstWelfarePassword?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  dateTime: string;
  schoolCode: string;
  staffId?: string;
  staffName?: string;
  action: string; // e.g. "Login", "Clock In", "Class Entry", "Config Update"
  category: 'security' | 'attendance' | 'academic' | 'administrative' | 'system';
  details: string;
  deviceSignature?: string;
  status: 'success' | 'failure' | 'warning';
}

export type AppMode = 'gate_clock' | 'period_tracker' | 'master_roster' | 'non_teaching' | 'admin_reports' | 'super_admin';

export type NonTeachingRole =
  | 'Administrator'
  | 'Bursar'
  | 'Storekeeper'
  | 'Security'
  | 'Matron'
  | 'Cook'
  | 'Groundsman'
  | 'YEA'
  | 'Volunteer'
  | 'Driver'
  | 'Lab Technician'
  | 'Library Assistant';

export type PhoneType = 'yam_phone' | 'smartphone' | 'none';

export type ShiftType =
  | 'Morning Kitchen (05:30 - 14:00)'
  | 'Day Security (06:00 - 18:00)'
  | 'Night Security (18:00 - 06:00)'
  | 'Administration (07:30 - 16:30)'
  | 'Sanitation & Grounds (06:30 - 15:00)'
  | 'Standard Duty (08:00 - 16:00)';

export interface NonTeachingStaffMember {
  id: string;
  staffId: string;
  name: string;
  role: NonTeachingRole;
  unit: string;
  phone: string;
  phoneType: PhoneType;
  shift: ShiftType;
  pin: string;
  avatarColor: string;
  category: 'permanent' | 'contract' | 'yea' | 'volunteer' | 'casual';
  barcode: string;
}

export interface NonTeachingAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  role: NonTeachingRole;
  unit: string;
  date: string;
  clockInTime: string;
  clockInTimestamp: number;
  clockOutTime?: string;
  clockOutTimestamp?: number;
  method: 'kiosk_touch' | 'pin_pad' | 'barcode_card_scan' | 'sms_yam_phone' | 'supervisor_rollcall' | 'firebase_phone_auth';
  shift: ShiftType;
  punctualityStatus: PunctualityStatus;
  verifiedBy?: string;
  notes?: string;
  synced: boolean;
  isIdentityVerified?: boolean;
  isOnCampus?: boolean;
  distanceMeters?: number;
  distanceFromCampusMeters?: number;
  verificationMethod?: 'pin' | 'ussd' | 'supervisor' | 'barcode' | 'kiosk';
  deviceSignature?: string;
  loginTrace?: string;
  coordinates?: { lat: number; lng: number };
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
}

export type PortalRoute = 'attendance' | 'period_class_tracker' | 'master_staff_roster' | 'admin' | 'full';

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableSlot {
  period: number; // 1 to 8
  time: string; // "7:00 - 8:00", "8:00 - 9:00", etc.
  subject: string; // e.g. "CORE MATHS", "Agric Science", "BIOLOGY"
  teacher: string; // e.g. "EUGENE", "GOKA", "VERONICA"
  teacherStaffId?: string;
  isCore: boolean;
  notes?: string;
}

export interface ClassTimetable {
  classCode: string; // e.g. "GEN_ART_2A"
  className: string; // e.g. "GEN ART 2A (AGRIC/FRENCH)"
  program: string; // "General Arts", "General Science", "Home Economics", "Visual Arts", "Business"
  formYear: number; // 1, 2, or 3
  electives: string[];
  schedule: Record<WeekDay, TimetableSlot[]>;
}

export type DeviceOperatingMode = 'kiosk' | 'byod';

export interface CampusBeaconToken {
  token: string;
  generatedAt: number;
  expiresAt: number;
  secondsRemaining: number;
  schoolCode: string;
}

export interface GeoLocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  distanceMeters: number | null;
  isWithinBounds: boolean;
  isLoading: boolean;
  error: string | null;
  isMockEnabled: boolean;
  mockMode: 'at_gate' | 'outside';
}
