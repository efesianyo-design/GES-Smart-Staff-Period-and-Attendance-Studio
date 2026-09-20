/**
 * GES Portal Routing & Deep-Linking Utility
 * Provides dedicated, distraction-free URL paths:
 *   - /attendance (or /attendance/teaching, /attendance/non-teaching)
 *   - /period_class_tracker
 *   - /master_staff_roster
 *   - /admin
 *
 * Supports window.location.pathname, query params (?portal=... / ?view=...), and hash (#/...).
 */

export type PortalType =
  | 'attendance'
  | 'period_class_tracker'
  | 'master_staff_roster'
  | 'admin'
  | 'super_admin';

export interface PortalRouteInfo {
  portal: PortalType;
  subType?: 'teaching' | 'non_teaching';
  isStaffOnlyView: boolean; // When true, hides administrative tabs, compliance logs, and diagnostics
}

export function parseCurrentRoute(): PortalRouteInfo {
  if (typeof window === 'undefined') {
    return { portal: 'attendance', isStaffOnlyView: true };
  }

  const pathname = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  const queryPortal =
    search.get('portal') ||
    search.get('view') ||
    search.get('mode') ||
    search.get('tab');

  // 1. Super Admin National / Multi-School Portal
  if (
    pathname.includes('/super_admin') ||
    pathname.includes('/super-admin') ||
    hash.includes('super_admin') ||
    hash.includes('super-admin') ||
    queryPortal === 'super_admin'
  ) {
    return { portal: 'super_admin', isStaffOnlyView: false };
  }

  // 2. School Admin Portal
  if (
    pathname.includes('/admin') ||
    hash.includes('admin') ||
    queryPortal === 'admin' ||
    queryPortal === 'admin_reports'
  ) {
    return { portal: 'admin', isStaffOnlyView: false };
  }

  // 3. Period & Class Tracker
  if (
    pathname.includes('/period_class_tracker') ||
    pathname.includes('/period-tracker') ||
    pathname.includes('/period') ||
    pathname.includes('/classes') ||
    hash.includes('period') ||
    queryPortal === 'period_class_tracker' ||
    queryPortal === 'period_tracker'
  ) {
    return { portal: 'period_class_tracker', isStaffOnlyView: true };
  }

  // 4. Master Staff Roster
  if (
    pathname.includes('/master_staff_roster') ||
    pathname.includes('/master-roster') ||
    pathname.includes('/roster') ||
    hash.includes('roster') ||
    queryPortal === 'master_staff_roster' ||
    queryPortal === 'master_roster'
  ) {
    return { portal: 'master_staff_roster', isStaffOnlyView: false };
  }

  // 5. Staff Attendance (Teaching vs Non-Teaching)
  if (
    pathname.includes('/attendance') ||
    pathname.includes('/clock') ||
    pathname.includes('/non_teaching') ||
    hash.includes('attendance') ||
    hash.includes('non_teaching') ||
    queryPortal === 'attendance' ||
    queryPortal === 'gate_clock' ||
    queryPortal === 'non_teaching'
  ) {
    const isNonTeaching =
      pathname.includes('non-teaching') ||
      pathname.includes('non_teaching') ||
      search.get('type') === 'non_teaching' ||
      queryPortal === 'non_teaching';
    return {
      portal: 'attendance',
      subType: isNonTeaching ? 'non_teaching' : 'teaching',
      isStaffOnlyView: true,
    };
  }

  // Default to clean Staff Attendance portal if path is "/" or default
  return { portal: 'attendance', subType: 'teaching', isStaffOnlyView: true };
}

export function navigateToPortal(
  portal: PortalType,
  subType?: 'teaching' | 'non_teaching'
) {
  if (typeof window === 'undefined') return;

  let path = `/${portal}`;
  if (portal === 'attendance' && subType === 'non_teaching') {
    path = `/attendance?type=non_teaching`;
  }

  try {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  } catch (e) {
    console.warn('History pushState error:', e);
  }
}

export function getFullPortalUrl(
  portal: PortalType,
  subType?: 'teaching' | 'non_teaching'
): string {
  if (typeof window === 'undefined') return `/${portal}`;
  const origin = window.location.origin;
  if (portal === 'attendance') {
    return subType === 'non_teaching'
      ? `${origin}/attendance?type=non_teaching`
      : `${origin}/attendance`;
  }
  return `${origin}/${portal}`;
}

export interface PortalDefinition {
  id: PortalType;
  label: string;
  path: string;
  targetAudience: string;
  privacyLevel: 'Staff Only' | 'Supervisors' | 'School Admin' | 'GES Super Admin';
  description: string;
  icon: string;
  badges: string[];
}

export const PORTAL_DEFINITIONS: PortalDefinition[] = [
  {
    id: 'attendance',
    label: 'Teaching Staff Gate Attendance',
    path: '/attendance',
    targetAudience: 'Classroom Teachers & Form Masters',
    privacyLevel: 'Staff Only',
    description: 'Clean, distraction-free clock-in portal. Hides confidential rosters, admin logs, and school settings.',
    icon: '👨‍🏫',
    badges: ['2-Step OTP + Beacon', 'GPS Bounds', 'Privacy Shield'],
  },
  {
    id: 'attendance',
    label: 'Non-Teaching Staff Attendance',
    path: '/attendance?type=non_teaching',
    targetAudience: 'Kitchen, Security, Grounds, & Admin Support',
    privacyLevel: 'Staff Only',
    description: 'Specialized 1-tap PIN & Yam-phone USSD clocking tailored for non-teaching personnel shifts.',
    icon: '👷',
    badges: ['Shift Hours', 'Simplified UI', 'Voice/Sound Guide'],
  },
  {
    id: 'period_class_tracker',
    label: 'Period & Classroom Session Tracker',
    path: '/period_class_tracker',
    targetAudience: 'Subject Teachers & Academic Heads',
    privacyLevel: 'Staff Only',
    description: 'Direct classroom session starter, master aSc timetable schedule, and learner rollcall tracker.',
    icon: '🏫',
    badges: ['Class Roster', 'Door QR', 'Timetable Sync'],
  },
  {
    id: 'master_staff_roster',
    label: 'Master Staff Roster Directory',
    path: '/master_staff_roster',
    targetAudience: 'HODs & Academic Supervisors',
    privacyLevel: 'Supervisors',
    description: 'Staff directory with qualifications, assigned subjects, and live campus presence filters.',
    icon: '👥',
    badges: ['Presence Live', 'Staff Directory', 'Department Filter'],
  },
  {
    id: 'admin',
    label: 'School Administrator Console & Unclock Hub',
    path: '/admin',
    targetAudience: 'Headmaster & School Administrative Staff',
    privacyLevel: 'School Admin',
    description: 'Full school governance: unclock staff who clocked in in error, manage GES audit logs, and configure school boundaries. Strictly locked to this school.',
    icon: '🛡️',
    badges: ['Unclock Tool', 'Audit Trail', 'Single-School Scoped'],
  },
  {
    id: 'super_admin',
    label: 'GES National / Regional Super Admin Directorate',
    path: '/super_admin',
    targetAudience: 'GES Regional Directors & National HQ Auditors',
    privacyLevel: 'GES Super Admin',
    description: 'Cross-school audit headquarters. Switch between multiple Senior High Schools across Ghana, compare regional punctuality, and track brute-force security incidents.',
    icon: '🏛️',
    badges: ['Multi-School HQ', 'All Regions', 'Security Incidents'],
  },
];
