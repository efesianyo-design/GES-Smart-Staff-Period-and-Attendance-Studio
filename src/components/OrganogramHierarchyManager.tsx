import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Sparkles,
  Phone,
  Building,
  GraduationCap,
  Utensils,
  HeartPulse,
  Briefcase,
  Search,
  Download,
  Info,
  ArrowRight,
  Lock,
  Network,
} from 'lucide-react';
import {
  OrganogramConfig,
  LeadershipRoleConfig,
  SchoolConfig,
} from '../types';
import { storageEngine, DEFAULT_ORGANOGRAM_ROLES } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

interface OrganogramHierarchyManagerProps {
  config: SchoolConfig;
  onOpenConsole?: (roleKey: string) => void;
}

export const OrganogramHierarchyManager: React.FC<OrganogramHierarchyManagerProps> = ({
  config,
  onOpenConsole,
}) => {
  const [organogram, setOrganogram] = useState<OrganogramConfig>(() =>
    storageEngine.getOrganogram(config.schoolCode)
  );
  const [activeView, setActiveView] = useState<'chart' | 'editor'>('chart');
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('headmaster');
  const [editingRole, setEditingRole] = useState<LeadershipRoleConfig | null>(null);
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [filterDivision, setFilterDivision] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating a new role
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleOfficer, setNewRoleOfficer] = useState('');
  const [newRoleStaffId, setNewRoleStaffId] = useState('');
  const [newRolePhone, setNewRolePhone] = useState('');
  const [newRoleReportsTo, setNewRoleReportsTo] = useState('headmaster');
  const [newRoleDivision, setNewRoleDivision] = useState<LeadershipRoleConfig['division']>('academic');
  const [newRoleScope, setNewRoleScope] = useState('');
  const [newRoleUnits, setNewRoleUnits] = useState('');

  useEffect(() => {
    const handleOrganogramChange = (e: any) => {
      if (e.detail) {
        setOrganogram(e.detail);
      }
    };
    window.addEventListener('ges_organogram_changed', handleOrganogramChange);
    return () => window.removeEventListener('ges_organogram_changed', handleOrganogramChange);
  }, []);

  // Sync when school changes
  useEffect(() => {
    setOrganogram(storageEngine.getOrganogram(config.schoolCode));
  }, [config.schoolCode]);

  const selectedRole = useMemo(() => {
    return organogram.roles.find((r) => r.key === selectedRoleKey) || organogram.roles[0];
  }, [organogram.roles, selectedRoleKey]);

  // Group roles by reporting hierarchy
  const headRole = useMemo(() => {
    return organogram.roles.find((r) => r.reportsToKey === 'board_of_governors' || r.key === 'headmaster') || organogram.roles[0];
  }, [organogram.roles]);

  const directSubordinatesMap = useMemo(() => {
    const map = new Map<string, LeadershipRoleConfig[]>();
    organogram.roles.forEach((r) => {
      const parent = r.reportsToKey || 'headmaster';
      if (!map.has(parent)) {
        map.set(parent, []);
      }
      map.get(parent)!.push(r);
    });
    return map;
  }, [organogram.roles]);

  const handleUpdateRole = (updated: LeadershipRoleConfig) => {
    soundSynthesizer.playScanBeep();
    const updatedRoles = organogram.roles.map((r) => (r.key === updated.key ? updated : r));
    const newConfig: OrganogramConfig = {
      ...organogram,
      roles: updatedRoles,
    };
    setOrganogram(newConfig);
    storageEngine.saveOrganogram(newConfig);
    setEditingRole(null);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleAddRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim() || !newRoleOfficer.trim()) return;

    soundSynthesizer.playScanBeep();
    const cleanKey = newRoleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const newRole: LeadershipRoleConfig = {
      key: cleanKey,
      title: newRoleTitle.trim(),
      officerName: newRoleOfficer.trim(),
      staffId: newRoleStaffId.trim() || `GES-${Date.now().toString().slice(-4)}`,
      phone: newRolePhone.trim() || '+233 24 000 0000',
      avatarColor: 'from-cyan-600 to-blue-700',
      scopeDescription: newRoleScope.trim() || `Monitors operations under ${newRoleReportsTo}.`,
      supervisedCategories: ['general_monitoring'],
      monitoredUnits: newRoleUnits ? newRoleUnits.split(',').map((u) => u.trim()).filter(Boolean) : ['Assigned Unit'],
      canAlterOrganogram: false,
      reportsToKey: newRoleReportsTo,
      division: newRoleDivision,
      lastActive: 'Just now',
    };

    const updatedRoles = [...organogram.roles, newRole];
    const newConfig: OrganogramConfig = {
      ...organogram,
      roles: updatedRoles,
    };
    setOrganogram(newConfig);
    storageEngine.saveOrganogram(newConfig);
    setIsAddingNewRole(false);
    setSelectedRoleKey(newRole.key);
    setNewRoleTitle('');
    setNewRoleOfficer('');
    setNewRoleStaffId('');
    setNewRolePhone('');
    setNewRoleScope('');
    setNewRoleUnits('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleDeleteRole = (key: string) => {
    if (key === 'headmaster' || key === 'asst_academic' || key === 'asst_domestic' || key === 'asst_welfare') {
      alert('Core statutory roles (Headmaster, AH Academic, AH Domestic, AH Welfare) cannot be deleted under GES statutory guidelines.');
      return;
    }
    if (!confirm('Are you sure you want to remove this role from your school organogram? Supervised units will revert to the Headmaster.')) {
      return;
    }

    soundSynthesizer.playScanBeep();
    // Reassign subordinates to headmaster
    const updatedRoles = organogram.roles
      .filter((r) => r.key !== key)
      .map((r) => (r.reportsToKey === key ? { ...r, reportsToKey: 'headmaster' } : r));

    const newConfig: OrganogramConfig = {
      ...organogram,
      roles: updatedRoles,
    };
    setOrganogram(newConfig);
    storageEngine.saveOrganogram(newConfig);
    setSelectedRoleKey('headmaster');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleResetToStandard = () => {
    if (!confirm('Reset organogram to default Ghana Education Service standard structure? Any customized roles and assignments will be restored to defaults.')) {
      return;
    }
    soundSynthesizer.playScanBeep();
    const reset = storageEngine.resetOrganogram(config.schoolCode);
    setOrganogram(reset);
    setSelectedRoleKey('headmaster');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const filteredRoles = useMemo(() => {
    return organogram.roles.filter((r) => {
      if (filterDivision !== 'all' && r.division !== filterDivision) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          r.title.toLowerCase().includes(term) ||
          r.officerName.toLowerCase().includes(term) ||
          r.staffId.toLowerCase().includes(term) ||
          r.monitoredUnits.some((u) => u.toLowerCase().includes(term))
        );
      }
      return true;
    });
  }, [organogram.roles, filterDivision, searchTerm]);

  // Color helper for division
  const getDivisionBadge = (division?: string) => {
    switch (division) {
      case 'executive':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">Executive</span>;
      case 'academic':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">Academic</span>;
      case 'domestic':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Domestic &amp; Boarding</span>;
      case 'welfare':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">Welfare &amp; Clinic</span>;
      case 'administrative':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">Administrative</span>;
      case 'finance':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Finance</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-400 border border-slate-500/30">Governance</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Organogram Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                <Network className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Campus Organogram &amp; Reporting Lines
              </h1>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Ghana Education Service statutory hierarchy for <strong className="text-slate-200">{config.schoolName}</strong>. 
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveView(activeView === 'chart' ? 'editor' : 'chart')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs ${
                activeView === 'editor'
                  ? 'bg-yellow-400 text-slate-950 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{activeView === 'editor' ? 'View Organogram Chart' : 'Configure Hierarchy'}</span>
            </button>

            <button
              onClick={() => setIsAddingNewRole(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Role</span>
            </button>

            <button
              onClick={handleResetToStandard}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
              title="Reset to GES Standard Organogram"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {savedToast && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>School organogram hierarchy and reporting delegations saved successfully!</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono">Sync Code: {config.schoolCode}</span>
          </div>
        )}

        {/* Quick Division Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter Division:</span>
          {['all', 'executive', 'academic', 'domestic', 'welfare', 'administrative', 'finance'].map((div) => (
            <button
              key={div}
              onClick={() => setFilterDivision(div)}
              className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                filterDivision === div
                  ? 'bg-yellow-400 text-slate-950'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {div === 'all' ? 'All Divisions' : div}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Area */}
      {activeView === 'chart' ? (
        /* VISUAL ORGANOGRAM TREE CHART */
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-x-auto shadow-2xl space-y-10">
          {/* Top: Board of Governors */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest shadow-md text-center">
              🏛️ School Board of Governors &amp; GES Directorate
            </div>
            <div className="w-0.5 h-6 bg-slate-700" />
          </div>

          {/* Level 1: Principal / Headmaster */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => {
                setSelectedRoleKey(headRole.key);
                if (onOpenConsole) onOpenConsole('headmaster');
              }}
              className={`group max-w-sm w-full p-4 rounded-3xl border-2 transition cursor-pointer text-center relative ${
                selectedRoleKey === headRole.key
                  ? 'bg-amber-950/60 border-yellow-400 shadow-xl shadow-yellow-500/10'
                  : 'bg-slate-900 border-slate-700 hover:border-yellow-400/60'
              }`}
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-[10px] font-black text-yellow-400 uppercase tracking-wider mb-2">
                ★ Chief Executive Officer
              </div>
              <h3 className="text-base font-black text-white group-hover:text-yellow-300 transition">
                {headRole.title}
              </h3>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{headRole.officerName}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Staff ID: {headRole.staffId}</p>
              <div className="mt-2 text-[11px] text-slate-400 line-clamp-2 px-2">
                {headRole.scopeDescription}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-yellow-400">
                <span>Monitors Everything (All Teaching &amp; Non-Teaching)</span>
                <span className="group-hover:translate-x-1 transition">Open Console →</span>
              </div>
            </div>

            {/* Tree Branch Splitter to Assistant Heads */}
            <div className="w-0.5 h-8 bg-slate-700" />
            <div className="w-full max-w-4xl h-0.5 bg-slate-700 relative">
              <div className="absolute top-0 left-1/4 w-0.5 h-6 bg-slate-700 -translate-x-1/2" />
              <div className="absolute top-0 left-1/2 w-0.5 h-6 bg-slate-700 -translate-x-1/2" />
              <div className="absolute top-0 left-3/4 w-0.5 h-6 bg-slate-700 -translate-x-1/2" />
            </div>
          </div>

          {/* Level 2: Assistant Heads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-2">
            {/* Assistant Head Academic */}
            {(() => {
              const acad = organogram.roles.find((r) => r.key === 'asst_academic') || organogram.roles.find((r) => r.division === 'academic');
              if (!acad) return null;
              const subRoles = directSubordinatesMap.get(acad.key) || [];
              return (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      setSelectedRoleKey(acad.key);
                      if (onOpenConsole) onOpenConsole('academic');
                    }}
                    className={`p-4 rounded-3xl border-2 transition cursor-pointer relative group ${
                      selectedRoleKey === acad.key
                        ? 'bg-blue-950/60 border-blue-400 shadow-xl shadow-blue-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-blue-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Academic Division
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Reports to: Principal</span>
                    </div>
                    <h4 className="text-sm font-black text-white group-hover:text-blue-300 transition">
                      {acad.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{acad.officerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {acad.staffId}</p>

                    <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] space-y-1">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Monitors:</span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        Teaching Staff, Timetable, Periods, Science, Arts, Business &amp; Labs
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-blue-400">
                      <span>{subRoles.length} Reporting Units</span>
                      <span className="group-hover:translate-x-1 transition">Open Academic Console →</span>
                    </div>
                  </div>

                  {/* Subordinates to Academic */}
                  {subRoles.length > 0 && (
                    <div className="pl-4 border-l-2 border-blue-500/30 space-y-2">
                      {subRoles.map((sub) => (
                        <div
                          key={sub.key}
                          onClick={() => setSelectedRoleKey(sub.key)}
                          className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition ${
                            selectedRoleKey === sub.key
                              ? 'bg-slate-800 border-yellow-400 text-white font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-blue-300">{sub.title}</span>
                            <span className="text-slate-500 font-mono">{sub.staffId}</span>
                          </div>
                          <p className="text-slate-200 text-[11px] font-medium mt-0.5">{sub.officerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assistant Head Domestic */}
            {(() => {
              const dom = organogram.roles.find((r) => r.key === 'asst_domestic') || organogram.roles.find((r) => r.division === 'domestic');
              if (!dom) return null;
              const subRoles = directSubordinatesMap.get(dom.key) || [];
              return (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      setSelectedRoleKey(dom.key);
                      if (onOpenConsole) onOpenConsole('domestic');
                    }}
                    className={`p-4 rounded-3xl border-2 transition cursor-pointer relative group ${
                      selectedRoleKey === dom.key
                        ? 'bg-emerald-950/60 border-emerald-400 shadow-xl shadow-emerald-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Domestic &amp; Boarding
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Reports to: Principal</span>
                    </div>
                    <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition">
                      {dom.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{dom.officerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {dom.staffId}</p>

                    <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] space-y-1">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Monitors:</span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        Housemasters, Dorms, Kitchen/Dining, Campus Gate Security &amp; Grounds
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-emerald-400">
                      <span>{subRoles.length} Reporting Units</span>
                      <span className="group-hover:translate-x-1 transition">Open Domestic Console →</span>
                    </div>
                  </div>

                  {/* Subordinates to Domestic (Housemaster, Matron, Security) */}
                  {subRoles.length > 0 && (
                    <div className="pl-4 border-l-2 border-emerald-500/30 space-y-2">
                      {subRoles.map((sub) => (
                        <div
                          key={sub.key}
                          onClick={() => setSelectedRoleKey(sub.key)}
                          className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition ${
                            selectedRoleKey === sub.key
                              ? 'bg-slate-800 border-yellow-400 text-white font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-emerald-300">{sub.title}</span>
                            <span className="text-slate-500 font-mono">{sub.staffId}</span>
                          </div>
                          <p className="text-slate-200 text-[11px] font-medium mt-0.5">{sub.officerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Assistant Head Welfare */}
            {(() => {
              const wlf = organogram.roles.find((r) => r.key === 'asst_welfare') || organogram.roles.find((r) => r.division === 'welfare');
              if (!wlf) return null;
              const subRoles = directSubordinatesMap.get(wlf.key) || [];
              return (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                      setSelectedRoleKey(wlf.key);
                      if (onOpenConsole) onOpenConsole('welfare');
                    }}
                    className={`p-4 rounded-3xl border-2 transition cursor-pointer relative group ${
                      selectedRoleKey === wlf.key
                        ? 'bg-rose-950/60 border-rose-400 shadow-xl shadow-rose-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-rose-400/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Welfare &amp; Health Bay
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Reports to: Principal</span>
                    </div>
                    <h4 className="text-sm font-black text-white group-hover:text-rose-300 transition">
                      {wlf.title}
                    </h4>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{wlf.officerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {wlf.staffId}</p>

                    <div className="mt-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] space-y-1">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Monitors:</span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        School Infirmary/Clinic, Student Guidance, Exeat Authorizations &amp; Staff Care
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-rose-400">
                      <span>{subRoles.length} Reporting Units</span>
                      <span className="group-hover:translate-x-1 transition">Open Welfare Console →</span>
                    </div>
                  </div>

                  {/* Subordinates to Welfare (Senior Nurse, Counselor) */}
                  {subRoles.length > 0 && (
                    <div className="pl-4 border-l-2 border-rose-500/30 space-y-2">
                      {subRoles.map((sub) => (
                        <div
                          key={sub.key}
                          onClick={() => setSelectedRoleKey(sub.key)}
                          className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition ${
                            selectedRoleKey === sub.key
                              ? 'bg-slate-800 border-yellow-400 text-white font-bold'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-rose-300">{sub.title}</span>
                            <span className="text-slate-500 font-mono">{sub.staffId}</span>
                          </div>
                          <p className="text-slate-200 text-[11px] font-medium mt-0.5">{sub.officerName}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Level 3: Administration & Finance Support */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4">
            {organogram.roles
              .filter((r) => r.division === 'administrative' || r.division === 'finance')
              .map((r) => (
                <div
                  key={r.key}
                  onClick={() => setSelectedRoleKey(r.key)}
                  className={`px-4 py-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                    selectedRoleKey === r.key
                      ? 'bg-slate-800 border-yellow-400 text-white font-bold'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black">
                    {r.division === 'finance' ? '💰' : '📋'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{r.title}</h5>
                    <p className="text-[11px] text-slate-400">{r.officerName}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono pl-2 border-l border-slate-800">
                    Reports to Headmaster
                  </span>
                </div>
              ))}
          </div>
        </div>
      ) : (
        /* HIERARCHY & DELEGATION EDITOR ("ALTER WHO MONITORS WHO") */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Roles Roster List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Delegation Roster</h3>
                <p className="text-[11px] text-slate-400">{filteredRoles.length} designated leadership posts</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-yellow-400"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredRoles.map((r) => {
                const isSelected = selectedRoleKey === r.key;
                const reportsToObj = organogram.roles.find((parent) => parent.key === r.reportsToKey);
                return (
                  <div
                    key={r.key}
                    onClick={() => {
                      setSelectedRoleKey(r.key);
                      setEditingRole(r);
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-slate-800 border-yellow-400 shadow-md shadow-yellow-500/10'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{r.title}</h4>
                          {getDivisionBadge(r.division)}
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">{r.officerName}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {r.staffId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                      <span className="truncate">
                        Monitored by: <strong className="text-slate-200">{reportsToObj ? reportsToObj.title : 'Governing Board'}</strong>
                      </span>
                      <span className="text-yellow-400 font-bold shrink-0">Edit →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 2 Columns: Edit Role & Supervisory Assignment Panel */}
          <div className="lg:col-span-2 space-y-6">
            {editingRole || selectedRole ? (
              (() => {
                const current = editingRole || selectedRole;
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-white">{current.title}</h2>
                          {getDivisionBadge(current.division)}
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Configure supervisory reporting, assigned departments, and inspection privileges
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {onOpenConsole && (
                          <button
                            type="button"
                            onClick={() => {
                              if (current.key === 'headmaster') onOpenConsole('headmaster');
                              else if (current.key === 'asst_academic') onOpenConsole('academic');
                              else if (current.key === 'asst_domestic') onOpenConsole('domestic');
                              else if (current.key === 'asst_welfare') onOpenConsole('welfare');
                              else onOpenConsole('headmaster');
                            }}
                            className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition"
                          >
                            Open Dedicated Console →
                          </button>
                        )}
                        {current.key !== 'headmaster' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(current.key)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-xl transition"
                            title="Remove Role"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edit Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateRole(current);
                      }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Official Role / Post Title
                          </label>
                          <input
                            type="text"
                            value={current.title}
                            onChange={(e) =>
                              setEditingRole({ ...current, title: e.target.value })
                            }
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Appointed Officer Name
                          </label>
                          <input
                            type="text"
                            value={current.officerName}
                            onChange={(e) =>
                              setEditingRole({ ...current, officerName: e.target.value })
                            }
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            GES Staff ID / IPPD
                          </label>
                          <input
                            type="text"
                            value={current.staffId}
                            onChange={(e) =>
                              setEditingRole({ ...current, staffId: e.target.value })
                            }
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-yellow-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Official Mobile / WhatsApp
                          </label>
                          <input
                            type="text"
                            value={current.phone || ''}
                            onChange={(e) =>
                              setEditingRole({ ...current, phone: e.target.value })
                            }
                            placeholder="+233 24 000 0000"
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-hidden focus:border-yellow-400"
                          />
                        </div>

                        {/* KEY FEATURE: ALTER WHO MONITORS WHO */}
                        <div className="sm:col-span-2 p-4 bg-slate-950 border-2 border-yellow-400/40 rounded-2xl space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-yellow-400/10 text-yellow-400">
                              <Network className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                                Supervisory Delegation (Who Monitors This Post?)
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Alter which senior administrator monitors this officer and receives their audit dossiers
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                Direct Superior / Supervisor
                              </label>
                              <select
                                value={current.reportsToKey || 'headmaster'}
                                onChange={(e) =>
                                  setEditingRole({ ...current, reportsToKey: e.target.value })
                                }
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-yellow-300 focus:outline-hidden focus:border-yellow-400 cursor-pointer"
                              >
                                <option value="board_of_governors">Board of Governors / GES Directorate</option>
                                {organogram.roles
                                  .filter((r) => r.key !== current.key)
                                  .map((r) => (
                                    <option key={r.key} value={r.key}>
                                      {r.title} ({r.officerName})
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                                Institutional Division
                              </label>
                              <select
                                value={current.division || 'academic'}
                                onChange={(e) =>
                                  setEditingRole({
                                    ...current,
                                    division: e.target.value as any,
                                  })
                                }
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400 cursor-pointer"
                              >
                                <option value="executive">Executive Management</option>
                                <option value="academic">Academic &amp; Lessons Division</option>
                                <option value="domestic">Domestic, Boarding &amp; Estate</option>
                                <option value="welfare">Welfare, Clinic &amp; Guidance</option>
                                <option value="administrative">General Administration</option>
                                <option value="finance">Finance &amp; Accounts</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Scope of Governance &amp; Supervisory Description
                          </label>
                          <textarea
                            rows={2}
                            value={current.scopeDescription}
                            onChange={(e) =>
                              setEditingRole({ ...current, scopeDescription: e.target.value })
                            }
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:border-yellow-400"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Assigned Monitored Units (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={current.monitoredUnits.join(', ')}
                            onChange={(e) =>
                              setEditingRole({
                                ...current,
                                monitoredUnits: e.target.value
                                  .split(',')
                                  .map((u) => u.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="e.g. General Science, Main Kitchen, Aggrey House, Health Bay"
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-hidden focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Changes persist locally and sync to cloud repository
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingRole(null)}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Save Supervisory Delegation</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
                Select a role from the left roster to view and alter reporting parameters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Custom Leadership Role */}
      {isAddingNewRole && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-white">Add Custom Institutional Post</h3>
              </div>
              <button
                onClick={() => setIsAddingNewRole(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Post / Role Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Housemistress, Sports Master, Head of Languages"
                  value={newRoleTitle}
                  onChange={(e) => setNewRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Officer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mrs. Gloria Mensah"
                    value={newRoleOfficer}
                    onChange={(e) => setNewRoleOfficer(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    GES Staff ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 709821"
                    value={newRoleStaffId}
                    onChange={(e) => setNewRoleStaffId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-yellow-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Monitored by (Superior)
                  </label>
                  <select
                    value={newRoleReportsTo}
                    onChange={(e) => setNewRoleReportsTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-yellow-300 focus:outline-hidden focus:border-yellow-400"
                  >
                    {organogram.roles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Division
                  </label>
                  <select
                    value={newRoleDivision}
                    onChange={(e) => setNewRoleDivision(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:border-yellow-400"
                  >
                    <option value="academic">Academic Division</option>
                    <option value="domestic">Domestic &amp; Boarding</option>
                    <option value="welfare">Welfare &amp; Health</option>
                    <option value="administrative">Administrative</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Assigned Monitored Units (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afua Kobi House, Sports Equipment, Languages Lab"
                  value={newRoleUnits}
                  onChange={(e) => setNewRoleUnits(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:border-yellow-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingNewRole(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Add Post to Organogram
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
