import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  FileSpreadsheet,
  BarChart3,
  MessageSquare,
  Settings,
  LogOut,
  Search,
  ChevronDown,
  Download,
  AlertTriangle,
  Info,
  ShieldCheck,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { SchoolConfig, GateAttendanceRecord } from '../types';
import { storageEngine } from '../utils/storage';
import { OFFICIAL_GES_SCHOOLS, SchoolDirectoryItem, securityEngine, SecurityIncident } from '../utils/security';
import { soundSynthesizer } from '../utils/audio';
import { downloadCSV } from '../utils/csv';
import { UnclockAuditHub } from './UnclockAuditHub';
import { SchoolBrandingSettings } from './SchoolBrandingSettings';
import { AdminReportsMode } from './AdminReportsMode';
import {
  SchoolsCampusTab,
  StaffUploadsTab,
  AttendanceAuditTab,
  PresenceTrackingTab,
  MessagesBroadcastTab,
} from './SchoolAdminTabs';
import { useSchoolTheme } from '../hooks/useSchoolTheme';

/**
 * Official Ghana Education Service (GES) Logo SVG - Yellow circular badge
 */
export function GesDashboardLogo() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <circle cx="50" cy="50" r="47" fill="#FACC15" stroke="#EAB308" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <path id="gesDashArc" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill="#0F172A" fontSize="7" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#gesDashArc" startOffset="50%" textAnchor="middle">
          GHANA EDUCATION SERVICE
        </textPath>
      </text>
      <text x="36" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <text x="64" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <circle cx="50" cy="50" r="21" fill="#FEF08A" stroke="#0B6D2F" strokeWidth="2" />
      <path d="M42 40 Q55 35 55 42 Q55 50 44 50 L52 50 L52 58 Q40 58 40 40 Z" fill="#0B6D2F" />
      <text x="50" y="65" textAnchor="middle" fill="#DC2626" fontSize="8" fontWeight="900">
        GES
      </text>
    </svg>
  );
}

export interface AdminCampusDashboardProps {
  isSuperAdmin?: boolean;
  currentSchoolConfig: SchoolConfig;
  onSwitchSchool?: (school: SchoolDirectoryItem) => void;
  onLogout: () => void;
}

interface StaffGridItem {
  id: string;
  name: string;
  role: string;
  campus: string;
  department: string;
  status: 'present' | 'late' | 'absent';
  time: string;
  avatarInitials: string;
}

// Exactly 12 staff avatars starting with Akua Mensah Teacher Accra SHS etc.
const EXACT_12_STAFF: StaffGridItem[] = [
  { id: '1', name: 'Akua Mensah', role: 'Teacher', campus: 'Accra SHS', department: 'English', status: 'present', time: '08:45', avatarInitials: 'AM' },
  { id: '2', name: 'Kwame Osei', role: 'Teacher', campus: 'Accra SHS', department: 'Mathematics', status: 'present', time: '07:30', avatarInitials: 'KO' },
  { id: '3', name: 'Esi Dadzie', role: 'HOD', campus: 'Accra SHS', department: 'Science', status: 'present', time: '07:42', avatarInitials: 'ED' },
  { id: '4', name: 'Kofi Annan', role: 'Teacher', campus: 'Accra SHS', department: 'Social Studies', status: 'present', time: '07:55', avatarInitials: 'KA' },
  { id: '5', name: 'Abena Frimpong', role: 'Teacher', campus: 'Accra SHS', department: 'ICT Dept', status: 'late', time: '08:50', avatarInitials: 'AF' },
  { id: '6', name: 'Yaw Boateng', role: 'Lab Tech', campus: 'Accra SHS', department: 'Biology', status: 'present', time: '07:15', avatarInitials: 'YB' },
  { id: '7', name: 'Selorm Doe', role: 'Teacher', campus: 'Accra SHS', department: 'Physics', status: 'present', time: '08:10', avatarInitials: 'SD' },
  { id: '8', name: 'Grace Addo', role: 'Administrator', campus: 'Accra SHS', department: 'Administration', status: 'present', time: '07:40', avatarInitials: 'GA' },
  { id: '9', name: 'Emmanuel Asante', role: 'Teacher', campus: 'Accra SHS', department: 'Economics', status: 'absent', time: '--:--', avatarInitials: 'EA' },
  { id: '10', name: 'Faustina Nyarko', role: 'Matron', campus: 'Accra SHS', department: 'Catering', status: 'present', time: '06:30', avatarInitials: 'FN' },
  { id: '11', name: 'Bright Kpodo', role: 'Teacher', campus: 'Accra SHS', department: 'French', status: 'present', time: '08:05', avatarInitials: 'BK' },
  { id: '12', name: 'Rita Agyemang', role: 'Teacher', campus: 'Accra SHS', department: 'Chemistry', status: 'late', time: '08:48', avatarInitials: 'RA' },
];

export const AdminCampusDashboard: React.FC<AdminCampusDashboardProps> = ({
  isSuperAdmin = false,
  currentSchoolConfig,
  onSwitchSchool,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { theme } = useSchoolTheme();
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCampus, setSelectedFilterCampus] = useState<string>('all');
  const [incidents, setIncidents] = useState<SecurityIncident[]>(() => securityEngine.getIncidents());
  const [liveStaff, setLiveStaff] = useState<StaffGridItem[]>(() => {
    // School Admin is single school scoped. If viewing specific school, show currentSchoolConfig.schoolName
    return EXACT_12_STAFF.map((s) => ({
      ...s,
      campus: currentSchoolConfig.schoolName || 'Accra SHS',
    }));
  });
  const [isExporting, setIsExporting] = useState(false);
  const [unclockRefreshCount, setUnclockRefreshCount] = useState(0);

  // Sync actual real attendance records from local storage if available for this school
  useEffect(() => {
    const realGateRecords = storageEngine.getGateAttendance();
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = realGateRecords.filter((r) => r.date === today);

    // Update the live staff list incorporating any live clock-ins or void states
    setLiveStaff((prev) => {
      const updated = [...prev];
      // Sync names and campus
      const baseSchoolName = currentSchoolConfig.schoolName || 'Accra SHS';
      updated.forEach((item, idx) => {
        item.campus = baseSchoolName;
        // If a real record matches staff at index, sync status
        if (todayRecords[idx]) {
          const rec = todayRecords[idx];
          item.name = rec.staffName;
          item.department = rec.department;
          item.time = rec.clockInTime.slice(0, 5);
          item.status = rec.isVoided
            ? 'absent'
            : rec.punctualityStatus === 'late' || rec.punctualityStatus === 'substantially_late'
            ? 'late'
            : 'present';
        }
      });
      return updated;
    });
  }, [currentSchoolConfig.schoolName, currentSchoolConfig.schoolCode, unclockRefreshCount]);

  // Listen to security incidents and clock-ins
  useEffect(() => {
    const handleAlert = () => setIncidents(securityEngine.getIncidents());
    const handleClockIn = (e: any) => {
      soundSynthesizer.playScanBeep();
      if (e.detail?.staffName) {
        setLiveStaff((prev) => [
          {
            id: `real-${Date.now()}`,
            name: e.detail.staffName,
            role: 'Teacher',
            campus: currentSchoolConfig.schoolName || 'Accra SHS',
            department: 'Academics',
            status: 'present',
            time: new Date().toTimeString().slice(0, 5),
            avatarInitials: e.detail.staffName
              .split(' ')
              .map((n: string) => n[0])
              .join(''),
          },
          ...prev.slice(0, 11),
        ]);
      }
    };

    window.addEventListener('ges_security_alert', handleAlert);
    window.addEventListener('ges_staff_clockin', handleClockIn);

    return () => {
      window.removeEventListener('ges_security_alert', handleAlert);
      window.removeEventListener('ges_staff_clockin', handleClockIn);
    };
  }, [currentSchoolConfig.schoolName]);

  // School Admin is strictly scoped to own schoolCode data
  const filteredStaffList = useMemo(() => {
    return liveStaff.filter((staff) => {
      const matchQuery =
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.campus.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase());

      if (!isSuperAdmin) {
        // School admin only sees their own school
        return matchQuery;
      }

      if (selectedFilterCampus === 'all') return matchQuery;
      return matchQuery && staff.campus.toLowerCase().includes(selectedFilterCampus.toLowerCase());
    });
  }, [liveStaff, searchQuery, selectedFilterCampus, isSuperAdmin]);

  // CSV Export Handler
  const handleExportReport = () => {
    setIsExporting(true);
    soundSynthesizer.playScanBeep();

    const headers = ['Staff Name', 'Role', 'Campus', 'School Code', 'Department', 'Status', 'Arrival Time'];
    const rows = liveStaff.map((s) => [
      s.name,
      s.role,
      s.campus,
      currentSchoolConfig.schoolCode,
      s.department,
      s.status.toUpperCase(),
      s.time,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    downloadCSV(`GES_Campus_Presence_Report_${currentSchoolConfig.schoolCode}_${new Date().toISOString().split('T')[0]}.csv`, csvContent);

    setTimeout(() => {
      setIsExporting(false);
    }, 600);
  };

  const navMenuItems = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Schools', icon: Building2 },
    { label: 'Staff', icon: Users },
    { label: 'Attendance', icon: UserCheck },
    { label: 'Presence Tracking', icon: MapPin },
    { label: 'Reports', icon: FileSpreadsheet },
    { label: 'Analytics', icon: BarChart3 },
    { label: 'Messages', icon: MessageSquare },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans text-slate-800">
      {/* 1. LEFT SIDEBAR: width 250px, background #0F172A dark, full height */}
      <aside className="w-[250px] shrink-0 h-full bg-[#0F172A] text-slate-200 flex flex-col justify-between border-r border-slate-800 select-none z-20">
        <div className="flex flex-col">
          {/* Logo Top: Logo GES + "GHANA EDUCATION SERVICE • ADMIN PORTAL" */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <GesDashboardLogo />
            <div>
              <h2 className="text-[11px] font-black tracking-wider uppercase text-white leading-tight">
                GHANA EDUCATION SERVICE
              </h2>
              <p className="text-[9px] font-bold text-yellow-400 tracking-widest uppercase mt-0.5">
                ADMIN PORTAL
              </p>
            </div>
          </div>

          {/* School Scope in Sidebar (Single School Scoped) */}
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">
                Single School Scoped
              </span>
              <span className="w-2 h-2 rounded-full bg-[#0B6D2F] animate-pulse" />
            </div>

            <div className="mt-1.5">
              <p className="text-xs font-black text-white truncate">{currentSchoolConfig.schoolName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{currentSchoolConfig.schoolCode}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">Campus Isolated</span>
              </div>
            </div>
          </div>

          {/* Menu: Dashboard, Schools, Staff, Attendance, Presence Tracking, Reports, Analytics, Messages, Settings */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveMenu(item.label);
                    if (item.label === 'Staff') navigate('/master_roster');
                    if (item.label === 'Reports') navigate('/admin');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 text-left ${
                    isActive
                      ? 'bg-yellow-400 text-slate-950 font-black shadow-md shadow-yellow-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Direct Link to Super Admin Console if user has super_admin permission */}
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/super_admin')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-400 hover:bg-slate-800/70 transition"
              >
                <ShieldAlert className="w-4 h-4 text-indigo-400" />
                <span>Super Admin Hub</span>
              </button>
            )}

            {/* Quick Kiosk & Staff links */}
            <div className="pt-2 border-t border-slate-800 mt-2 space-y-1">
              <button
                onClick={() => window.open('/kiosk', '_blank')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <span>📺 Common Room Kiosk</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                onClick={() => window.open('/attendance?type=teaching', '_blank')}
                className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <span>📱 Staff BYOD Portal</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom User: Institutional Scope */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              {(currentSchoolConfig.schoolName || 'GES')
                .split(' ')
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'SA'}
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-white leading-tight truncate">
                {isSuperAdmin ? 'Super Administrator' : `${currentSchoolConfig.schoolName}`}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {isSuperAdmin ? 'Directorate • Accra HQ' : `School Admin • ${currentSchoolConfig.schoolCode}`}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/50 text-red-300 text-xs font-bold transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA: background #F8FAFC, padding */}
      <main className="flex-1 h-full overflow-y-auto bg-[#F8FAFC] p-5 flex flex-col space-y-5">
        {activeMenu === 'Settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-black text-[#0F172A] tracking-tight leading-none">
                  Institutional Branding &amp; Settings
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Customize official school crest, brand color extraction, and hardware terminal profiles
                </p>
              </div>
              <button
                onClick={() => setActiveMenu('Dashboard')}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl shadow-xs transition cursor-pointer"
              >
                ← Back to Campus Dashboard
              </button>
            </div>
            <SchoolBrandingSettings onClose={() => setActiveMenu('Dashboard')} />
          </div>
        )}

        {activeMenu === 'Schools' && (
          <SchoolsCampusTab config={currentSchoolConfig} />
        )}

        {activeMenu === 'Staff' && (
          <StaffUploadsTab config={currentSchoolConfig} />
        )}

        {activeMenu === 'Attendance' && (
          <AttendanceAuditTab config={currentSchoolConfig} />
        )}

        {activeMenu === 'Presence Tracking' && (
          <PresenceTrackingTab config={currentSchoolConfig} />
        )}

        {activeMenu === 'Reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-black text-[#0F172A] tracking-tight leading-none">
                  Campus Compliance &amp; Institutional Reports
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Daily teacher punctuality dossiers, period teaching audits, and Ministry of Education exports
                </p>
              </div>
              <button
                onClick={() => setActiveMenu('Dashboard')}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl shadow-xs transition cursor-pointer"
              >
                ← Back to Campus Dashboard
              </button>
            </div>
            <AdminReportsMode
              gateRecords={storageEngine.getGateAttendance()}
              nonTeachingRecords={storageEngine.getNonTeachingAttendance()}
              periodSessions={storageEngine.getPeriodSessions()}
              classrooms={storageEngine.getClassrooms()}
              config={currentSchoolConfig}
              onSelectClassroomToView={() => {}}
            />
          </div>
        )}

        {activeMenu === 'Analytics' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Institutional Attendance Analytics</h2>
                <p className="text-xs text-slate-500 font-medium">Departmental punctuality benchmarks and morning arrival flow</p>
              </div>
              <span className="text-xs font-mono font-bold bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full">
                Single Campus: {currentSchoolConfig.schoolCode}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Attendance by Department</h3>
                <div className="space-y-2.5">
                  {[
                    { dept: 'General Science', rate: 94.2, count: '16/17' },
                    { dept: 'Business Studies', rate: 91.5, count: '11/12' },
                    { dept: 'Home Economics', rate: 89.0, count: '8/9' },
                    { dept: 'General Arts', rate: 87.4, count: '18/21' },
                    { dept: 'Non-Teaching Services', rate: 96.0, count: '24/25' },
                  ].map((d) => (
                    <div key={d.dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{d.dept} ({d.count})</span>
                        <span className="text-emerald-700">{d.rate}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Morning Arrival Distribution</h3>
                <div className="space-y-2.5">
                  {[
                    { time: '06:30 - 07:00 (Early Birds)', percent: 22, color: 'bg-emerald-500' },
                    { time: '07:00 - 07:30 (Peak On-Time)', percent: 58, color: 'bg-emerald-600' },
                    { time: '07:30 - 07:45 (Pre-Cutoff Warning)', percent: 12, color: 'bg-yellow-500' },
                    { time: '07:45 - 08:30 (Late Clock-in)', percent: 8, color: 'bg-amber-500' },
                  ].map((a) => (
                    <div key={a.time} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800">{a.time}</span>
                        <span className="text-slate-600 font-mono">{a.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${a.color} rounded-full`} style={{ width: `${a.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeMenu === 'Messages' && (
          <MessagesBroadcastTab config={currentSchoolConfig} />
        )}

        {activeMenu === 'Dashboard' && (
          <>
        {/* TOP HEADER:
            Title: "Campus Presence Dashboard" 32px bold #0F172A
            Subtitle: "Real-time attendance and staff tracking across GES campuses • Today, Mon 6 Oct 2025 • 09:12 GMT"
            Right: Search + Filter + Yellow Export Report button
        */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-black text-[#0F172A] tracking-tight leading-none">
              Campus Presence Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Real-time attendance and staff tracking across GES campuses • Today, Mon 6 Oct 2025 • 09:12 GMT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff, campus, role..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                value={selectedFilterCampus}
                onChange={(e) => setSelectedFilterCampus(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-700 shadow-xs appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
              >
                <option value="all">Filter: All Campuses</option>
                {isSuperAdmin ? (
                  OFFICIAL_GES_SCHOOLS.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value={currentSchoolConfig.schoolName}>{currentSchoolConfig.schoolName}</option>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>

            {/* Yellow Export Report Button */}
            <button
              onClick={handleExportReport}
              disabled={isExporting}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-2 transition duration-150 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {/* SECURITY ALERT BANNER IF ACTIVE INCIDENTS */}
        {incidents.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  GES Directorate Alert: {incidents.length} security events registered today.
                </span>
                <p className="text-[11px] text-amber-800">
                  {incidents[incidents.length - 1].details}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full">
              Act 843 Protected
            </span>
          </div>
        )}

        {/* 4 KPI CARDS:
            Total Staff: 1,248 (+12 this month)
            Present: 1,102 (88.3%)
            Late: 84 (6.7%)
            Absent: 62 (5.0%)
            White cards rounded 16px border #E2E8F0
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Staff */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Staff
              </span>
              <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[48px] font-black text-[#0F172A] tracking-tight leading-none">
              1,248
            </div>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>↑</span> +12 this month
            </p>
          </div>

          {/* Card 2: Present */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Present
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[48px] font-black text-emerald-600 tracking-tight leading-none">
              1,102
            </div>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              88.3% present • +24 from yesterday
            </p>
          </div>

          {/* Card 3: Late */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                Late
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[48px] font-black text-amber-500 tracking-tight leading-none">
              84
            </div>
            <p className="text-xs font-bold text-amber-600 flex items-center gap-1">
              6.7% late • -5 from yesterday
            </p>
          </div>

          {/* Card 4: Absent */}
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                Absent
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600">
                <UserX className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[48px] font-black text-rose-500 tracking-tight leading-none">
              62
            </div>
            <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
              5.0% absent • -3 from yesterday
            </p>
          </div>
        </div>

        {/* MIDDLE SECTION: LIVE CAMPUS PRESENCE GRID (Left) + RIGHT PANELS (Top & Bottom) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          
          {/* Middle Left: Live Campus Presence Grid — 12 staff avatars with green dots (like WhatsApp) */}
          <div className="xl:col-span-2 bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-5 flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                  Live Campus Presence Grid
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Live updates • 12 staff present on campus • Active Geofence
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Auto-sync: 5s
                </span>
              </div>
            </div>

            {/* 12 Staff Avatars with WhatsApp-style presence dots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 py-4 flex-1">
              {filteredStaffList.map((staff) => (
                <div
                  key={staff.id}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3 flex flex-col items-center text-center justify-between hover:border-yellow-400 hover:shadow-xs transition duration-150 group"
                >
                  {/* Circular Avatar Placeholder #E2E8F0 with green dot bottom right */}
                  <div className="relative my-1">
                    <div className="w-14 h-14 rounded-full bg-[#E2E8F0] flex items-center justify-center text-slate-700 font-black text-sm shadow-inner border border-slate-200">
                      {staff.avatarInitials}
                    </div>
                    {/* Status Dot (like WhatsApp) */}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        staff.status === 'present'
                          ? 'bg-emerald-500'
                          : staff.status === 'late'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>

                  {/* Staff Details: Akua Mensah Teacher Accra SHS etc. */}
                  <div className="w-full space-y-0.5 mt-1">
                    <h4 className="text-xs font-extrabold text-[#0F172A] truncate" title={staff.name}>
                      {staff.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium truncate" title={`${staff.role} • ${staff.campus}`}>
                      {staff.role} • {staff.campus}
                    </p>
                    <p
                      className={`text-[10px] font-bold ${
                        staff.status === 'present'
                          ? 'text-emerald-600'
                          : staff.status === 'late'
                          ? 'text-amber-600'
                          : 'text-rose-500'
                      }`}
                    >
                      • {staff.status === 'present' ? 'Present' : staff.status === 'late' ? 'Late' : 'Absent'} • {staff.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Showing 12 staff avatars • Single school scope ({currentSchoolConfig.schoolCode})</span>
              <button
                onClick={() => navigate('/master_roster')}
                className="text-yellow-700 font-bold hover:underline"
              >
                View Full Master Roster →
              </button>
            </div>
          </div>

          {/* Right Panel: Top (Campus Status Overview) + Bottom (Alerts & Issues) */}
          <div className="space-y-5 flex flex-col">
            
            {/* Right Panel Top: Campus Status Overview
                Greater Accra 324 97% green bar
                Ashanti 268 92%
                Western 156 85%
                Northern 120 78%
            */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-[#0F172A]">Campus Status Overview</h3>
                  <p className="text-[11px] text-slate-500">Presence by Region</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  4 Regions
                </span>
              </div>

              <div className="space-y-3">
                {/* Greater Accra 324 97% green bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Greater Accra</span>
                    <span className="font-bold text-emerald-600">324 present (97%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: '97%', backgroundColor: theme.primary }}
                    />
                  </div>
                </div>

                {/* Ashanti 268 92% */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Ashanti</span>
                    <span className="font-bold text-emerald-600">268 present (92%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: '92%', backgroundColor: theme.primary }}
                    />
                  </div>
                </div>

                {/* Western 156 85% */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Western</span>
                    <span className="font-bold text-emerald-600">156 present (85%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: '85%', backgroundColor: theme.primary }}
                    />
                  </div>
                </div>

                {/* Northern 120 78% */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Northern</span>
                    <span className="font-bold text-yellow-600">120 present (78%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: '78%', backgroundColor: theme.secondary || '#FACC15' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel Bottom: Alerts & Issues
                "Late staff: 5 at Kumasi Tech" orange
                "Absent: 2 staff at Tamale" red
                "New staff onboarded: 3" blue
            */}
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm p-4 space-y-3 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-[#0F172A]">Alerts &amp; Issues</h3>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>

              <div className="space-y-2.5">
                {/* Alert 1: "Late staff: 5 at Kumasi Tech" orange */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="font-bold text-amber-900 block">
                      Late staff: 5 at Kumasi Tech
                    </strong>
                    <span className="text-[10px] text-amber-700 font-mono">09:03 GMT • Flagged by Gate Kiosk</span>
                  </div>
                </div>

                {/* Alert 2: "Absent: 2 staff at Tamale" red */}
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="font-bold text-rose-900 block">
                      Absent: 2 staff at Tamale
                    </strong>
                    <span className="text-[10px] text-rose-700 font-mono">08:30 GMT • Automated Absenteeism Roll</span>
                  </div>
                </div>

                {/* Alert 3: "New staff onboarded: 3" blue */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="font-bold text-blue-900 block">
                      New staff onboarded: 3
                    </strong>
                    <span className="text-[10px] text-blue-700 font-mono">Yesterday • Awaiting GES Bio-Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* UNCLOCK AUDIT HUB WITH MANDATORY AUDIT REASON (SINGLE SCHOOL SCOPED) */}
        <div className="mt-2">
          <UnclockAuditHub
            schoolName={currentSchoolConfig.schoolName}
            schoolCode={currentSchoolConfig.schoolCode}
            superAdminPin={currentSchoolConfig.superAdminPin || '1234'}
            onRefresh={() => setUnclockRefreshCount((c) => c + 1)}
          />
        </div>
        </>
        )}

        {/* INSTITUTIONAL PRIVACY SHIELD FOOTER */}
        <footer className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Act 843 Data Protection Protected • Ghana Education Service (GES) • Institutional Scope: <strong>{currentSchoolConfig.schoolCode}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Server: Accra-HQ-Primary</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">AES-256 Token Sync</span>
          </div>
        </footer>
      </main>
    </div>
  );
};
