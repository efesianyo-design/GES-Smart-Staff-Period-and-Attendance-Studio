export type PunctualityStatus = 'on_time' | 'late' | 'substantially_late';

export type StaffRole = 'Teacher' | 'HOD' | 'Assistant Head' | 'Headmaster' | 'Staff';

export type StaffPresenceStatus = 'off_campus' | 'on_campus' | 'teaching';

export type StaffCategory = 'permanent' | 'nss' | 'intern' | 'contract';

export interface StaffMember {
  id: string;
  staffId: string; // Unique GES IPPD/Staff ID e.g. "1084291", or NSS/Intern code e.g. "NSS-2024-041"
  name: string;
  department: string;
  phone: string;
  pin: string; // 4-digit PIN e.g. "1234"
  role: StaffRole;
  avatarColor: string;
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
  superAdminPin: string; // e.g. "1234"
}

export type AppMode = 'gate_clock' | 'period_tracker' | 'master_roster' | 'non_teaching' | 'admin_reports';

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
  method: 'kiosk_touch' | 'pin_pad' | 'barcode_card_scan' | 'sms_yam_phone' | 'supervisor_rollcall';
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
