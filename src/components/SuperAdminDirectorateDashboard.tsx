import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  ChevronDown,
  Download,
  Plus,
  SlidersHorizontal,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MapPin,
  FileText,
  LogOut,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Layers,
  Edit,
  Trash2,
  Eye,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Palette,
} from 'lucide-react';
import { useAuth } from '../utils/authContext';
import {
  OFFICIAL_GES_SCHOOLS,
  SchoolDirectoryItem,
  securityEngine,
  SecurityIncident,
  GHANA_16_REGIONS,
  getAllSchools,
  getCustomSchools,
  addCustomSchool,
  updateCustomSchool,
  deleteCustomSchool,
} from '../utils/security';
import { soundSynthesizer } from '../utils/audio';
import { downloadCSV } from '../utils/csv';

/**
 * Official Ghana Education Service (GES) Logo SVG - Circular badge matching reference
 */
export function GesEmblemBadge() {
  return (
    <svg width="46" height="46" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 drop-shadow-md" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#FACC15" stroke="#EAB308" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="41" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
      <path id="gesSuperArc" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
      <text fill="#0F172A" fontSize="7.5" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#gesSuperArc" startOffset="50%" textAnchor="middle">
          GHANA EDUCATION SERVICE HQ
        </textPath>
      </text>
      <text x="36" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <text x="64" y="85" fill="#0F172A" fontSize="8" fontWeight="bold">★</text>
      <circle cx="50" cy="50" r="21" fill="#FEF08A" stroke="#0B6D2F" strokeWidth="2" />
      <path d="M42 40 Q55 35 55 42 Q55 50 44 50 L52 50 L52 58 Q40 58 40 40 Z" fill="#0B6D2F" />
      <text x="50" y="65" textAnchor="middle" fill="#DC2626" fontSize="8.5" fontWeight="900">
        GES
      </text>
    </svg>
  );
}

interface SchoolBenchmarkItem {
  id: string;
  code?: string;
  name: string;
  region: string;
  location: string;
  enrollment: string;
  attendanceRate: number;
  punctualityRate: number;
  status: 'Excellent' | 'On Target' | 'Good' | 'Review';
}

const INITIAL_BENCHMARK_SCHOOLS: SchoolBenchmarkItem[] = [
  {
    id: 'prempeh',
    code: 'GES-AS-PREM-001',
    name: 'Prempeh College',
    region: 'Ashanti',
    location: 'Kumasi',
    enrollment: '2,847',
    attendanceRate: 92.4,
    punctualityRate: 90.1,
    status: 'Excellent',
  },
  {
    id: 'accra_high',
    code: 'ACCRA01',
    name: 'Accra High Secondary',
    region: 'Greater Accra',
    location: 'Accra',
    enrollment: '3,112',
    attendanceRate: 85.6,
    punctualityRate: 83.2,
    status: 'On Target',
  },
  {
    id: 'mawuli',
    code: 'MAWULI01',
    name: 'Mawuli School',
    region: 'Volta',
    location: 'Ho',
    enrollment: '1,934',
    attendanceRate: 88.1,
    punctualityRate: 86.7,
    status: 'Good',
  },
  {
    id: 'st_thomas',
    code: 'GES-GA-AQU-003',
    name: 'St. Thomas Aquinas SHS',
    region: 'Greater Accra',
    location: 'Accra',
    enrollment: '2,405',
    attendanceRate: 84.2,
    punctualityRate: 80.9,
    status: 'Review',
  },
  {
    id: 'tamale_shs',
    code: 'GES-NR-TAM-005',
    name: 'Tamale Senior High',
    region: 'Northern',
    location: 'Tamale',
    enrollment: '2,150',
    attendanceRate: 89.4,
    punctualityRate: 85.5,
    status: 'Good',
  },
  {
    id: 'wesley_girls',
    code: 'GES-CR-WES-007',
    name: 'Wesley Girls High School',
    region: 'Central',
    location: 'Cape Coast',
    enrollment: '1,890',
    attendanceRate: 94.8,
    punctualityRate: 93.2,
    status: 'Excellent',
  },
  {
    id: 'fijai_shs',
    code: 'GES-WR-FIJ-009',
    name: 'Fijai Senior High',
    region: 'Western',
    location: 'Sekondi',
    enrollment: '1,720',
    attendanceRate: 86.3,
    punctualityRate: 84.1,
    status: 'Good',
  },
  {
    id: 'koforidua_sctech',
    code: 'GES-ER-SECT-011',
    name: 'Koforidua Sec Tech',
    region: 'Eastern',
    location: 'Koforidua',
    enrollment: '2,210',
    attendanceRate: 88.7,
    punctualityRate: 87.3,
    status: 'Good',
  },
];

const PUNCTUALITY_BARS = [
  { name: 'Prempeh College', rate: 90.1, color: '#10B981' }, // green longest
  { name: 'Mawuli School', rate: 86.7, color: '#06B6D4' }, // teal
  { name: 'Accra High Sec', rate: 83.2, color: '#3B82F6' }, // blue
  { name: 'St. Thomas Aquinas', rate: 80.9, color: '#F59E0B' }, // orange
  { name: 'Ola Girls SHS', rate: 78.4, color: '#D97706' }, // amber
];

const loadAllBenchmarkSchools = (): SchoolBenchmarkItem[] => {
  const custom = getCustomSchools();
  const customBenchmark: SchoolBenchmarkItem[] = custom.map((c) => ({
    id: `custom_${c.code}`,
    code: c.code,
    name: c.name,
    region: c.region,
    location: c.district,
    enrollment: '1,850',
    attendanceRate: 91.2,
    punctualityRate: 88.5,
    status: 'Good',
  }));

  const existingCodes = new Set(custom.map((c) => c.code));
  const defaults = INITIAL_BENCHMARK_SCHOOLS.filter((s) => !s.code || !existingCodes.has(s.code));
  return [...customBenchmark, ...defaults];
};

export const SuperAdminDirectorateDashboard: React.FC = () => {
  const { config, switchSuperAdminSchool, logout } = useAuth();
  const navigate = useNavigate();

  const [schoolsList, setSchoolsList] = useState<SchoolBenchmarkItem[]>(loadAllBenchmarkSchools);
  const [editingSchool, setEditingSchool] = useState<SchoolBenchmarkItem | null>(null);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [inspectingSchool, setInspectingSchool] = useState<SchoolBenchmarkItem | null>(null);
  const [newSchoolLogo, setNewSchoolLogo] = useState<string | null>(null);
  const [newSchoolPrimary, setNewSchoolPrimary] = useState<string>('#0B6D2F');
  const [newSchoolSecondary, setNewSchoolSecondary] = useState<string>('#D4AF37');
  const [newSchoolSlogan, setNewSchoolSlogan] = useState<string>('Truth, Integrity, Service');

  const [newSchoolForm, setNewSchoolForm] = useState<Partial<SchoolBenchmarkItem>>({
    name: '',
    code: '',
    region: 'Ashanti',
    location: '',
    enrollment: '2,000',
    attendanceRate: 90,
    punctualityRate: 88,
    status: 'Good',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All Regions');
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep 2024');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [incidents, setIncidents] = useState<SecurityIncident[]>(() => securityEngine.getIncidents());
  const [isExporting, setIsExporting] = useState(false);
  const [reportGeneratedToast, setReportGeneratedToast] = useState<string | null>(null);

  useEffect(() => {
    const handleSchoolsUpdated = () => {
      setSchoolsList(loadAllBenchmarkSchools());
    };
    window.addEventListener('ges_schools_updated', handleSchoolsUpdated);
    return () => window.removeEventListener('ges_schools_updated', handleSchoolsUpdated);
  }, []);

  useEffect(() => {
    const handleAlert = (e: any) => {
      setIncidents(securityEngine.getIncidents());
    };
    window.addEventListener('ges_security_alert', handleAlert);
    return () => window.removeEventListener('ges_security_alert', handleAlert);
  }, []);

  const handleAddSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolForm.name || !newSchoolForm.location) {
      alert('Please provide school name and location.');
      return;
    }

    const cleanRegion = newSchoolForm.region || 'Ashanti';
    const schoolCode =
      newSchoolForm.code?.trim() ||
      `GES-${cleanRegion.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // 1. Add to custom school registry
    addCustomSchool({
      code: schoolCode,
      name: newSchoolForm.name.trim(),
      district: newSchoolForm.location.trim(),
      region: cleanRegion,
      lat: 6.9167,
      lng: 0.2833,
      staffCount: 48,
      nonTeachingCount: 16,
      classCount: 24,
      status: 'active',
      logo: newSchoolLogo || undefined,
      primaryColor: newSchoolPrimary,
      secondaryColor: newSchoolSecondary,
      slogan: newSchoolSlogan.trim(),
    });

    // 2. Persist theme for Kiosk and attendance
    const customTheme = {
      code: schoolCode,
      name: newSchoolForm.name.trim(),
      shortName: newSchoolForm.name.trim(),
      slogan: newSchoolSlogan.trim() || 'Truth, Knowledge, Excellence',
      region: cleanRegion,
      primary: newSchoolPrimary,
      secondary: newSchoolSecondary,
      accent: '#FACC15',
      logo: newSchoolLogo || undefined,
    };
    try {
      localStorage.setItem(`theme_${schoolCode}`, JSON.stringify(customTheme));
      localStorage.setItem('schoolCode', schoolCode);
      localStorage.setItem('ges_active_school_code_v1', schoolCode);
      window.dispatchEvent(new CustomEvent('ges_theme_changed', { detail: { schoolCode } }));
    } catch {
      // ignore
    }

    // 3. Switch active super admin school context so this school is immediately selected
    switchSuperAdminSchool(schoolCode);

    setSchoolsList(loadAllBenchmarkSchools());
    setIsAddingSchool(false);
    setNewSchoolLogo(null);
    setNewSchoolForm({
      name: '',
      code: '',
      region: 'Ashanti',
      location: '',
      enrollment: '2,000',
      attendanceRate: 90,
      punctualityRate: 88,
      status: 'Good',
    });

    soundSynthesizer.playScanBeep();
    setReportGeneratedToast(`Institution "${newSchoolForm.name}" registered with custom branding and active for Kiosk!`);
    setTimeout(() => setReportGeneratedToast(null), 5000);
  };

  const handleEditSchoolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;

    if (editingSchool.code) {
      updateCustomSchool(editingSchool.code, {
        name: editingSchool.name,
        region: editingSchool.region,
        district: editingSchool.location,
      });
    }

    setSchoolsList((prev) =>
      prev.map((s) => (s.id === editingSchool.id ? editingSchool : s))
    );
    setEditingSchool(null);
    soundSynthesizer.playScanBeep();
    setReportGeneratedToast(`Institutional parameters for "${editingSchool.name}" successfully updated.`);
    setTimeout(() => setReportGeneratedToast(null), 3000);
  };

  const handleDeleteSchool = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the national roster?`)) {
      const target = schoolsList.find((s) => s.id === id);
      if (target?.code) {
        deleteCustomSchool(target.code);
      }
      setSchoolsList((prev) => prev.filter((s) => s.id !== id));
      if (inspectingSchool?.id === id) setInspectingSchool(null);
      soundSynthesizer.playScanBeep();
      setReportGeneratedToast(`Institution "${name}" removed from Directorate registry.`);
      setTimeout(() => setReportGeneratedToast(null), 3000);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    soundSynthesizer.playScanBeep();

    const headers = ['School Name', 'Code', 'Region', 'Location', 'Enrollment', 'Attendance %', 'Punctuality %', 'Status'];
    const rows = schoolsList.map((s) => [
      s.name,
      s.code || 'N/A',
      s.region,
      s.location,
      s.enrollment,
      `${s.attendanceRate}%`,
      `${s.punctualityRate}%`,
      s.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    downloadCSV(csvContent, `GES_National_Performance_MultiSchool_${selectedMonth.replace(' ', '_')}.csv`);

    setTimeout(() => {
      setIsExporting(false);
      setReportGeneratedToast(`Exported National Performance benchmark PDF/CSV for ${selectedMonth}.`);
      setTimeout(() => setReportGeneratedToast(null), 4000);
    }, 500);
  };

  const handleGenerateReport = () => {
    soundSynthesizer.playScanBeep();
    setReportGeneratedToast(`Official GES Directorate Multi-School Performance Dossier generated (${selectedRegion} • ${selectedMonth}).`);
    setTimeout(() => setReportGeneratedToast(null), 5000);
  };

  const handleSwitchSchoolContext = (code: string) => {
    switchSuperAdminSchool(code);
    soundSynthesizer.playScanBeep();
    setReportGeneratedToast(`Active school context switched to ${code}. Institutional theme applied to Kiosk!`);
    setTimeout(() => setReportGeneratedToast(null), 3500);
  };

  const filteredSchools = useMemo(() => {
    return schoolsList.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchRegion = selectedRegion === 'All Regions' || s.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [schoolsList, searchQuery, selectedRegion]);

  const kpiStats = useMemo(() => {
    if (selectedRegion === 'All Regions') {
      return {
        totalSchools: '3,241',
        changeSchool: '+24 this month ▲ 0.7%',
        enrollment: '1.12M',
        changeEnrollment: '+12,450 YoY ▲ 1.1%',
        attendance: '86.4%',
        punctuality: '82.1%',
      };
    }
    const regionSchools = schoolsList.filter((s) => s.region === selectedRegion);
    const avgAttendance = regionSchools.length > 0
      ? (regionSchools.reduce((acc, s) => acc + s.attendanceRate, 0) / regionSchools.length).toFixed(1)
      : '86.0';
    const avgPunctuality = regionSchools.length > 0
      ? (regionSchools.reduce((acc, s) => acc + s.punctualityRate, 0) / regionSchools.length).toFixed(1)
      : '82.0';

    return {
      totalSchools: String(regionSchools.length * 48 + 12),
      changeSchool: `+3 this month in ${selectedRegion}`,
      enrollment: `${(regionSchools.length * 36 + 45).toFixed(0)}K`,
      changeEnrollment: `Active verified census in ${selectedRegion}`,
      attendance: `${avgAttendance}%`,
      punctuality: `${avgPunctuality}%`,
    };
  }, [selectedRegion, schoolsList]);

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-100 font-sans select-none flex flex-col">
      {/* 1. TOP BAR DARK
          GES logo yellow + "GHANA EDUCATION SERVICE" + "Super Admin • National HQ" + Search "Search schools, districts, regions..." + Bell + SA Super Admin dropdown
      */}
      <header role="banner" className="w-full bg-[#0F172A] border-b border-slate-800 sticky top-0 z-30 px-5 py-3 shadow-xl shadow-black/40">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <GesEmblemBadge />
              <div>
                <h1 className="text-sm font-black tracking-wider uppercase text-white leading-tight">
                  GHANA EDUCATION SERVICE
                </h1>
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-0.5">
                  National HQ • Directorate
                </p>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => soundSynthesizer.playScanBeep()}
                className="relative p-2 rounded-xl bg-slate-800 text-slate-300"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </button>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center"
              >
                SA
              </button>
            </div>
          </div>

          {/* Search bar: "Search schools, districts, regions..." */}
          <div className="w-full md:max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="search"
              role="searchbox"
              aria-label="Search schools, districts, regions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schools, districts, regions..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1E293B] border border-slate-700 text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-inner"
            />
          </div>

          {/* Right Tools: Bell + SA Super Admin Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notifications Bell */}
            <button
              onClick={() => {
                soundSynthesizer.playScanBeep();
                setReportGeneratedToast('3 New Inspection Alerts from Greater Accra & Ashanti.');
                setTimeout(() => setReportGeneratedToast(null), 4000);
              }}
              className="relative p-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white transition duration-150"
              title="Directorate Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shadow-xs">
                3
              </span>
            </button>

            {/* School Switcher Context */}
            <div className="flex items-center gap-1.5 bg-[#1E293B] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={config.schoolCode}
                onChange={(e) => handleSwitchSchoolContext(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 border-0 focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">
                  Multi-School National Directorate
                </option>
                {OFFICIAL_GES_SCHOOLS.map((s) => (
                  <option key={s.code} value={s.code} className="bg-slate-900 text-white">
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* User Dropdown: SA Super Admin */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 transition duration-150"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-600 text-white text-xs font-black flex items-center justify-center shadow-xs">
                  SA
                </div>
                <span className="text-xs font-bold text-white">Super Admin</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F172A] border border-slate-700 shadow-2xl p-2 text-xs z-40 animate-fade-in">
                  <div className="p-2 border-b border-slate-800">
                    <p className="font-extrabold text-white">Director-General Command</p>
                    <p className="text-[11px] text-slate-400">superadmin@ges.gov.gh</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/admin');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2 mt-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Switch to School Admin View</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigate('/master_roster');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Master Staff Roster</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/super/login');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/50 flex items-center gap-2 mt-1 border-t border-slate-800"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. DASHBOARD BODY */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-5 space-y-5 overflow-y-auto">
        
        {/* DASHBOARD OVERVIEW HEADER:
            "National Education Performance • Multi-School Comparison | Data as of 12 Sep 2024"
            Buttons: Filters: All Regions | Sep 2024 + Export PDF + Generate Report blue button
        */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-black text-white tracking-tight leading-none">
              Dashboard Overview
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-1">
              National Education Performance • Multi-School Comparison | Data as of 12 Sep 2024 • 09:32 GMT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filters Pill: All Regions | Sep 2024 */}
            <div className="relative">
              <button
                onClick={() => setFilterModalOpen(!filterModalOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 shadow-sm transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Filters: {selectedRegion} | {selectedMonth}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {filterModalOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F172A] border border-slate-700 shadow-2xl p-3 z-30 space-y-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Region (16 Regions)</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700"
                    >
                      <option value="All Regions">All 16 Regions</option>
                      {GHANA_16_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r} Region
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Academic Period</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700"
                    >
                      <option value="Sep 2024">Sep 2024</option>
                      <option value="Aug 2024">Aug 2024</option>
                      <option value="Jul 2024">Jul 2024</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setFilterModalOpen(false)}
                    className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                  >
                    Apply Filter
                  </button>
                </div>
              )}
            </div>

            {/* Green Button: + Add New School */}
            <button
              onClick={() => {
                soundSynthesizer.playScanBeep();
                setIsAddingSchool(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New School</span>
            </button>

            {/* Switch to School Admin Console */}
            <button
              onClick={() => {
                soundSynthesizer.playScanBeep();
                navigate('/admin');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-xs font-bold text-slate-100 shadow-sm transition active:scale-95 cursor-pointer"
              title="Open Campus School Admin Console"
            >
              <Building2 className="w-3.5 h-3.5 text-yellow-400" />
              <span>School Admin Console</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Export PDF Button */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 shadow-sm transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </button>

            {/* Blue Button: + Generate Report */}
            <button
              onClick={handleGenerateReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* TOP REGIONS FILTER RIBBON */}
        <div className="bg-[#131C2E] border border-slate-800/80 rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto shadow-md">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Top Regions:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {['All Regions', 'Ashanti', 'Greater Accra', 'Volta', 'Northern', 'Central', 'Western', 'Eastern'].map((region) => {
              const isSelected = selectedRegion === region;
              const count = region === 'All Regions' ? schoolsList.length : schoolsList.filter((s) => s.region === region).length;
              return (
                <button
                  key={region}
                  onClick={() => {
                    setSelectedRegion(region);
                    soundSynthesizer.playScanBeep();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                      : 'bg-[#1E293B] text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                >
                  <span>{region}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isSelected ? 'bg-slate-900 text-cyan-300 font-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toast Feedback */}
        {reportGeneratedToast && (
          <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 text-cyan-200 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>{reportGeneratedToast}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">GES-HQ-SYNC</span>
          </div>
        )}

        {/* 3. 4 DYNAMIC KPI CARDS DARK */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Schools */}
          <div role="region" aria-label="Total Schools Card" className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/80 border border-blue-800/50 text-blue-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Schools ({selectedRegion})
              </span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                {kpiStats.totalSchools}
              </div>
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>{kpiStats.changeSchool}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Student Enrollment */}
          <div role="region" aria-label="Student Enrollment Card" className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Student Enrollment
              </span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                {kpiStats.enrollment}
              </div>
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>{kpiStats.changeEnrollment}</span>
              </p>
            </div>
          </div>

          {/* Card 3: Avg Attendance National / Regional */}
          <div role="region" aria-label="Avg Attendance National Card" className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Avg Attendance ({selectedRegion})
              </span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                {kpiStats.attendance}
              </div>
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                <span>Verified Biometric Logs</span>
              </p>
            </div>
          </div>

          {/* Card 4: Punctuality Rate */}
          <div role="region" aria-label="Punctuality Rate Card" className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/50 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Punctuality Rate
              </span>
              <div className="text-3xl font-black text-white tracking-tight mt-0.5">
                {kpiStats.punctuality}
              </div>
              <p className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 mt-0.5">
                <span>Target: 85.0% Benchmark</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. MAIN MIDDLE GRID: 2 COLUMNS (Left 60% Multi-School Comparison + Benchmarks, Right 40% Regional Heatmap + Radar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* LEFT COLUMN (lg:col-span-7 or 8) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Table: Multi-School Comparison — Top Performing Regions */}
            <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  Multi-School Comparison — Top Performing Regions
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Benchmark across schools in Volta • Ashanti • Greater Accra
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase">
                      <th className="py-2.5 px-3">School</th>
                      <th className="py-2.5 px-3">Region</th>
                      <th className="py-2.5 px-3 text-right">Enrollment</th>
                      <th className="py-2.5 px-3 text-right">Attendance</th>
                      <th className="py-2.5 px-3 text-right">Punctuality</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredSchools.map((item) => {
                      const gesSchool = OFFICIAL_GES_SCHOOLS.find((s) => s.name.includes(item.name) || item.name.includes(s.name));

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/40 transition group"
                        >
                          {/* School */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-extrabold text-white block">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.code ? `${item.code} • ` : ''}{item.region} • {item.location}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Region */}
                          <td className="py-3 px-3 text-slate-300">
                            {item.region} • {item.location}
                          </td>

                          {/* Enrollment */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-white">
                            {item.enrollment}
                          </td>

                          {/* Attendance */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-cyan-400">
                            {item.attendanceRate}%
                          </td>

                          {/* Punctuality */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                            {item.punctualityRate}%
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3 text-center">
                            {item.status === 'Excellent' && (
                              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-[11px] font-bold">
                                Excellent
                              </span>
                            )}
                            {item.status === 'On Target' && (
                              <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-500/50 text-blue-400 text-[11px] font-bold">
                                On Target
                              </span>
                            )}
                            {item.status === 'Good' && (
                              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-400 text-[11px] font-bold">
                                Good
                              </span>
                            )}
                            {item.status === 'Review' && (
                              <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-500/50 text-amber-400 text-[11px] font-bold">
                                Review
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Inspect / Dossier */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundSynthesizer.playScanBeep();
                                  setInspectingSchool(item);
                                }}
                                title="Inspect Institutional Dossier"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit School */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  soundSynthesizer.playScanBeep();
                                  setEditingSchool({ ...item });
                                }}
                                title="Edit Institutional Benchmarks"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 transition cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Switch & Enter School Console */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetCode = item.code || (gesSchool ? gesSchool.code : 'ACCRA01');
                                  switchSuperAdminSchool(targetCode);
                                  soundSynthesizer.playScanBeep();
                                  setReportGeneratedToast(`Switching context to ${item.name} (${targetCode})...`);
                                  setTimeout(() => navigate('/admin'), 600);
                                }}
                                title="Switch context to this campus and open School Admin"
                                className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-[11px] font-bold text-cyan-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                              >
                                <Building2 className="w-3 h-3 text-cyan-400" />
                                <span>Campus</span>
                              </button>

                              {/* Delete School */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSchool(item.id, item.name);
                                }}
                                title="Remove Institution from Directorate"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Left Bottom: Cross-School Punctuality Benchmarks bar chart */}
            <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Cross-School Punctuality Benchmarks
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    National Target: <strong className="text-white">85.0%</strong> • Average deviation: -2.9% below target
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                  Real-time Gate Punch
                </span>
              </div>

              {/* Bars */}
              <div className="space-y-3 pt-2">
                {PUNCTUALITY_BARS.map((bar) => (
                  <div key={bar.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{bar.name} - {bar.rate}%</span>
                      <span className="font-mono text-[11px] text-slate-400">-{bar.rate}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden relative">
                      {/* 85% Target Guideline Marker */}
                      <div className="absolute top-0 bottom-0 left-[85%] w-0.5 bg-slate-400/50 z-10" />
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${bar.rate}%`,
                          backgroundColor: bar.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Exceeds Target (&gt;90%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span>On Track (85-90%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Requires Intervention (&lt;85%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Right Middle: Regional Attendance Heatmap Ghana */}
            <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <h3 className="text-base font-black text-white tracking-tight">
                  Regional Attendance Heatmap
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {/* Graphic Map of Ghana Dark Container */}
              <div className="relative w-full h-56 rounded-2xl bg-[#090D16] border border-slate-800/90 overflow-hidden flex items-center justify-center p-3">
                {/* Stylized Ghana SVG polygon outline with labelled region clusters */}
                <svg viewBox="0 0 320 280" className="w-full h-full drop-shadow-lg">
                  {/* Subtle Grid Lines */}
                  <defs>
                    <pattern id="ghanaGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1E293B" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="320" height="280" fill="url(#ghanaGrid)" />

                  {/* Ghana Landmass Silhouette */}
                  <path
                    d="M 120,25 L 180,30 L 220,55 L 235,90 L 225,140 L 245,190 L 210,235 L 175,250 L 140,245 L 95,230 L 85,180 L 75,130 L 95,70 Z"
                    fill="#111827"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />

                  {/* Northern Zone */}
                  <path
                    d="M 120,25 L 180,30 L 220,55 L 210,105 L 130,95 L 95,70 Z"
                    fill="#1E293B"
                    opacity="0.6"
                  />

                  {/* Ashanti Region Highlighted */}
                  <path
                    d="M 130,120 L 175,120 L 185,165 L 140,175 L 115,145 Z"
                    fill="#065F46"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />

                  {/* Volta Region Highlighted */}
                  <path
                    d="M 195,125 L 230,135 L 240,195 L 205,210 L 190,165 Z"
                    fill="#0E7490"
                    stroke="#06B6D4"
                    strokeWidth="1.5"
                    opacity="0.85"
                  />

                  {/* Greater Accra Region Highlighted */}
                  <path
                    d="M 155,220 L 205,215 L 210,235 L 165,242 Z"
                    fill="#1E40AF"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                    opacity="0.9"
                  />

                  {/* Region Pins */}
                  <circle cx="150" cy="145" r="4" fill="#34D399" />
                  <circle cx="215" cy="165" r="4" fill="#38BDF8" />
                  <circle cx="185" cy="228" r="4" fill="#60A5FA" />
                </svg>

                {/* Overlaid Badges */}
                {/* Ashanti Badge */}
                <div className="absolute top-4 right-4 bg-slate-900/90 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-right shadow-lg backdrop-blur-xs">
                  <span className="text-[11px] font-black text-emerald-400 block">Ashanti</span>
                  <span className="text-[10px] font-bold text-slate-200">
                    Attendance: 92.1% • 612 schools • ↑ 2.1%
                  </span>
                </div>

                {/* Volta Badge */}
                <div className="absolute bottom-12 right-4 bg-slate-900/90 border border-cyan-500/60 rounded-xl px-2.5 py-1 text-right shadow-lg backdrop-blur-xs">
                  <span className="text-[11px] font-black text-cyan-400 block">Volta</span>
                  <span className="text-[10px] font-bold text-slate-200">
                    Attendance: 88.3% • 274 schools • ↑ 1.4%
                  </span>
                </div>

                {/* Greater Accra Badge */}
                <div className="absolute bottom-2 left-4 bg-slate-900/90 border border-blue-500/60 rounded-xl px-2.5 py-1 text-left shadow-lg backdrop-blur-xs">
                  <span className="text-[11px] font-black text-blue-400 block">Greater Accra</span>
                  <span className="text-[10px] font-bold text-slate-200">
                    Attendance: 85.4% • 489 schools • ↓ 0.8%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Bottom: Security Incident Radar
                Pentagon radar chart labels: Theft, Unauthorized Entry, Facilities Issue, Student Conflict, Vandalism
                Text: Sep 2024 — 12 incidents total -18% vs last month
            */}
            <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Security Incident Radar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sep 2024 — <strong className="text-white">12 incidents total</strong> • <span className="text-emerald-400">-18% vs last month ↓</span>
                  </p>
                </div>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Pentagon Radar Chart SVG */}
              <div className="relative w-full h-52 flex items-center justify-center">
                <svg viewBox="0 0 280 220" className="w-full h-full">
                  {/* Outer Pentagon Rings */}
                  <polygon
                    points="140,25 230,85 195,185 85,185 50,85"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <polygon
                    points="140,55 200,95 178,165 102,165 80,95"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="1"
                  />
                  <polygon
                    points="140,85 170,105 160,145 120,145 110,105"
                    fill="none"
                    stroke="#1E293B"
                    strokeWidth="0.8"
                  />

                  {/* Radar Spokes */}
                  <line x1="140" y1="125" x2="140" y2="25" stroke="#334155" strokeWidth="1" />
                  <line x1="140" y1="125" x2="230" y2="85" stroke="#334155" strokeWidth="1" />
                  <line x1="140" y1="125" x2="195" y2="185" stroke="#334155" strokeWidth="1" />
                  <line x1="140" y1="125" x2="85" y2="185" stroke="#334155" strokeWidth="1" />
                  <line x1="140" y1="125" x2="50" y2="85" stroke="#334155" strokeWidth="1" />

                  {/* Filled Incident Polygon (Theft low, Facilities high, Student Conflict mid, Vandalism mid, Unauthorized low) */}
                  <polygon
                    points="140,40 215,95 180,175 95,160 65,90"
                    fill="rgba(6, 182, 212, 0.25)"
                    stroke="#06B6D4"
                    strokeWidth="2"
                  />

                  {/* Data Points */}
                  <circle cx="140" cy="40" r="3.5" fill="#38BDF8" />
                  <circle cx="215" cy="95" r="3.5" fill="#38BDF8" />
                  <circle cx="180" cy="175" r="3.5" fill="#38BDF8" />
                  <circle cx="95" cy="160" r="3.5" fill="#38BDF8" />
                  <circle cx="65" cy="90" r="3.5" fill="#38BDF8" />

                  {/* Labels around the Pentagon */}
                  <text x="140" y="15" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Theft
                  </text>
                  <text x="245" y="88" textAnchor="start" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Unauthorized Entry
                  </text>
                  <text x="200" y="202" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Facilities Issue
                  </text>
                  <text x="80" y="202" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Student Conflict
                  </text>
                  <text x="35" y="88" textAnchor="end" fill="#94A3B8" fontSize="10" fontWeight="bold">
                    Vandalism
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM CARDS:
            District Alerts (3 High-priority flagged schools in Greater Accra) +
            System Health (All data sources sync Last sync 09:30 GMT Uptime 99.98%)
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* District Alerts */}
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-start gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/50 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-white flex items-center gap-2">
                <span>District Alerts</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-900/60 text-amber-300 text-[10px] font-mono">
                  Action Required
                </span>
              </h4>
              <ul className="space-y-1 text-slate-300">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>3 High-priority flagged schools in Greater Accra (Late arrival clusters)</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span>1 Security protocol review — Volta Region (Geofence radius adjustment)</span>
                </li>
                <li className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>5 Maintenance due — Ashanti (Terminal battery refresh)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-[#131C2E] border border-slate-800 rounded-2xl p-4 flex items-start gap-3 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-extrabold text-white flex items-center gap-2">
                <span>System Health</span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-mono">
                  Optimal
                </span>
              </h4>
              <p className="text-slate-300 font-medium">
                All data sources sync • <span>Last sync</span>: <strong className="text-white">09:30 GMT</strong>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                <span><span>Uptime</span>: <strong className="text-emerald-400">99.98%</strong></span>
                <span>•</span>
                <span>Active Campuses: <strong>3,241</strong></span>
                <span>•</span>
                <span>Latency: <strong>14ms</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Directorate Footer */}
        <footer className="pt-2 pb-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div>
            Ghana Education Service (GES) • National Education Command Directorate • Accra HQ
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span>Audit Standard: Act 843</span>
            <span>•</span>
            <span className="text-cyan-400">Restricted Access: Super Admin Only</span>
          </div>
        </footer>

        {/* ========================================================================= */}
        {/* MODAL 1: ADD NEW INSTITUTION TO DIRECTORATE */}
        {/* ========================================================================= */}
        {isAddingSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#131C2E] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Add New Institution to Directorate</h3>
                    <p className="text-[11px] text-slate-400">Enroll new Senior High or TVET campus into GES registry</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddingSchool(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSchoolSubmit} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Institution Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Opoku Ware School"
                      value={newSchoolForm.name}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">GES Institutional Code</label>
                    <input
                      type="text"
                      placeholder="e.g. GES-AS-OPW-015"
                      value={newSchoolForm.code}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Region * (16 Regions)</label>
                    <select
                      value={newSchoolForm.region}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, region: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    >
                      {GHANA_16_REGIONS.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r} Region
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Town / District / Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Santasi, Kumasi"
                      value={newSchoolForm.location}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Logo & School Branding */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>School Crest / Logo Upload</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 font-medium">Auto-applies to Kiosk &amp; Console</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      {newSchoolLogo ? (
                        <img src={newSchoolLogo} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white cursor-pointer transition text-xs font-semibold">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{newSchoolLogo ? 'Change Crest / Logo' : 'Upload School Crest'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                setNewSchoolLogo(evt.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {newSchoolLogo && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setNewSchoolLogo(null)}
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            Remove uploaded logo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Slogan */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Institutional Slogan / Motto</label>
                    <input
                      type="text"
                      placeholder="e.g. Suban ne Nimdeε / Truth &amp; Knowledge"
                      value={newSchoolSlogan}
                      onChange={(e) => setNewSchoolSlogan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>

                  {/* Color Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Institutional Color Theme (Instant Theme for Kiosk &amp; Console)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">Primary Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newSchoolPrimary}
                            onChange={(e) => setNewSchoolPrimary(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newSchoolPrimary}
                            onChange={(e) => setNewSchoolPrimary(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400">Secondary / Trim</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={newSchoolSecondary}
                            onChange={(e) => setNewSchoolSecondary(e.target.value)}
                            className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                          />
                          <input
                            type="text"
                            value={newSchoolSecondary}
                            onChange={(e) => setNewSchoolSecondary(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Student Census</label>
                    <input
                      type="text"
                      placeholder="e.g. 2,150"
                      value={newSchoolForm.enrollment}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, enrollment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Attendance Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={newSchoolForm.attendanceRate}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, attendanceRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Punctuality Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={newSchoolForm.punctualityRate}
                      onChange={(e) => setNewSchoolForm({ ...newSchoolForm, punctualityRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Compliance Benchmark Status</label>
                  <select
                    value={newSchoolForm.status}
                    onChange={(e) => setNewSchoolForm({ ...newSchoolForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                  >
                    <option value="Excellent">Excellent (92%+ compliance)</option>
                    <option value="On Target">On Target (88% - 91%)</option>
                    <option value="Good">Good (85% - 87%)</option>
                    <option value="Review">Review (&lt; 85% flagged)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingSchool(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Register Institution</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: EDIT INSTITUTIONAL BENCHMARKS */}
        {/* ========================================================================= */}
        {editingSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#131C2E] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-yellow-950 border border-yellow-500/40 text-yellow-400 flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Edit Institutional Benchmarks</h3>
                    <p className="text-[11px] text-slate-400">{editingSchool.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingSchool(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSchoolSubmit} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Institution Name</label>
                    <input
                      type="text"
                      required
                      value={editingSchool.name}
                      onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">GES Institutional Code</label>
                    <input
                      type="text"
                      value={editingSchool.code || ''}
                      onChange={(e) => setEditingSchool({ ...editingSchool, code: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Region (16 Regions)</label>
                    <select
                      value={editingSchool.region}
                      onChange={(e) => setEditingSchool({ ...editingSchool, region: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    >
                      {GHANA_16_REGIONS.map((r) => (
                        <option key={r} value={r} className="bg-slate-900 text-white">
                          {r} Region
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Town / District / Location</label>
                    <input
                      type="text"
                      required
                      value={editingSchool.location}
                      onChange={(e) => setEditingSchool({ ...editingSchool, location: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Student Census</label>
                    <input
                      type="text"
                      value={editingSchool.enrollment}
                      onChange={(e) => setEditingSchool({ ...editingSchool, enrollment: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Attendance Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingSchool.attendanceRate}
                      onChange={(e) => setEditingSchool({ ...editingSchool, attendanceRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">Punctuality Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editingSchool.punctualityRate}
                      onChange={(e) => setEditingSchool({ ...editingSchool, punctualityRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300">Compliance Benchmark Status</label>
                  <select
                    value={editingSchool.status}
                    onChange={(e) => setEditingSchool({ ...editingSchool, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:border-cyan-400 focus:outline-hidden"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="On Target">On Target</option>
                    <option value="Good">Good</option>
                    <option value="Review">Review</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSchool(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black shadow-lg shadow-yellow-500/20 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: INSPECT INSTITUTIONAL DOSSIER */}
        {/* ========================================================================= */}
        {inspectingSchool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#131C2E] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{inspectingSchool.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {inspectingSchool.code || 'GES-NATIONAL'} • {inspectingSchool.region} • {inspectingSchool.location}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingSchool(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Enrollment</span>
                    <span className="text-base font-black text-white font-mono mt-0.5 block">{inspectingSchool.enrollment}</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Attendance</span>
                    <span className="text-base font-black text-cyan-400 font-mono mt-0.5 block">{inspectingSchool.attendanceRate}%</span>
                  </div>
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Punctuality</span>
                    <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">{inspectingSchool.punctualityRate}%</span>
                  </div>
                </div>

                {/* Audit Health Summary */}
                <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">GES Compliance Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      inspectingSchool.status === 'Excellent' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                      inspectingSchool.status === 'On Target' ? 'bg-blue-950 text-blue-300 border border-blue-500/40' :
                      inspectingSchool.status === 'Good' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' :
                      'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}>
                      {inspectingSchool.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Biometric Terminal Sync:</span>
                    <span className="font-mono text-emerald-400 font-bold">Online • 99.4% Uptime</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Geofence Radius Audit:</span>
                    <span className="font-mono text-slate-200">500m Authorized Boundary</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Periodic Lesson Tracking:</span>
                    <span className="font-mono text-cyan-400">Active (QR + NFC Check-in)</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const schoolToEdit = { ...inspectingSchool };
                      setInspectingSchool(null);
                      setEditingSchool(schoolToEdit);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Edit Data</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const targetCode = inspectingSchool.code || 'ACCRA01';
                        switchSuperAdminSchool(targetCode);
                        soundSynthesizer.playScanBeep();
                        setInspectingSchool(null);
                        setReportGeneratedToast(`Focused context set to ${inspectingSchool.name} (${targetCode}).`);
                        setTimeout(() => setReportGeneratedToast(null), 3000);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition"
                    >
                      Focus Context
                    </button>
                    <button
                      onClick={() => {
                        const targetCode = inspectingSchool.code || 'ACCRA01';
                        switchSuperAdminSchool(targetCode);
                        soundSynthesizer.playScanBeep();
                        setInspectingSchool(null);
                        navigate('/admin');
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Launch School Console</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
