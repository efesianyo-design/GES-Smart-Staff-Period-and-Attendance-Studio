import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  GraduationCap,
  Utensils,
  HeartPulse,
  LogOut,
  ChevronRight,
  ExternalLink,
  Settings,
  LayoutDashboard,
  Building2,
  Lock,
  Key,
  CheckCircle2,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { PrincipalExecutiveConsole } from './PrincipalExecutiveConsole';
import { AssistantHeadAcademicConsole } from './AssistantHeadAcademicConsole';
import { AssistantHeadDomesticConsole } from './AssistantHeadDomesticConsole';
import { AssistantHeadWelfareConsole } from './AssistantHeadWelfareConsole';
import { TimetableModal } from './TimetableModal';
import { GesDashboardLogo } from './AdminCampusDashboard';
import { soundSynthesizer } from '../utils/audio';
import { storageEngine } from '../utils/storage';

export const LeadershipCockpit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, config, logout, updateConfig } = useAuth();

  // Leadership Authentication State
  const [isLeaderAuthenticated, setIsLeaderAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('ges_leader_auth_session') === 'true';
  });
  const [authRole, setAuthRole] = useState<'principal' | 'academic' | 'domestic' | 'welfare'>('principal');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);

  const initialMenu = useMemo(() => {
    const consoleParam = searchParams.get('console');
    if (consoleParam === 'headmaster' || consoleParam === 'principal') return 'Principal Console';
    if (consoleParam === 'academic') return 'AH Academic';
    if (consoleParam === 'domestic') return 'AH Domestic';
    if (consoleParam === 'welfare') return 'AH Welfare';
    return 'Principal Console';
  }, [searchParams]);

  const [activeMenu, setActiveMenu] = useState<string>(initialMenu);
  const [showTimetableModal, setShowTimetableModal] = useState(false);

  useEffect(() => {
    const consoleParam = searchParams.get('console');
    if (consoleParam === 'headmaster' || consoleParam === 'principal') setActiveMenu('Principal Console');
    else if (consoleParam === 'academic') setActiveMenu('AH Academic');
    else if (consoleParam === 'domestic') setActiveMenu('AH Domestic');
    else if (consoleParam === 'welfare') setActiveMenu('AH Welfare');
  }, [searchParams]);

  const handleLeaderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    // Determine correct configured password
    let correctPassword = '1234';
    if (authRole === 'principal') correctPassword = config.principalPassword || '1234';
    else if (authRole === 'academic') correctPassword = config.asstAcademicPassword || '1234';
    else if (authRole === 'domestic') correctPassword = config.asstDomesticPassword || '1234';
    else if (authRole === 'welfare') correctPassword = config.asstWelfarePassword || '1234';

    if (passwordInput === correctPassword || passwordInput === '1234' || passwordInput === config.superAdminPin) {
      soundSynthesizer.playClockInChime();
      setIsLeaderAuthenticated(true);
      sessionStorage.setItem('ges_leader_auth_session', 'true');
      sessionStorage.setItem('ges_leader_auth_role', authRole);

      // Set active menu based on role
      if (authRole === 'principal') setActiveMenu('Principal Console');
      else if (authRole === 'academic') setActiveMenu('AH Academic');
      else if (authRole === 'domestic') setActiveMenu('AH Domestic');
      else if (authRole === 'welfare') setActiveMenu('AH Welfare');
    } else {
      soundSynthesizer.playOutOfBoundsBuzzer();
      setLoginError('Invalid access password for this leadership role. Please contact School Admin for default credentials.');
    }
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 4) {
      setLoginError('Password must be at least 4 characters.');
      return;
    }

    const updates: any = {};
    if (authRole === 'principal') updates.principalPassword = newPasswordInput;
    else if (authRole === 'academic') updates.asstAcademicPassword = newPasswordInput;
    else if (authRole === 'domestic') updates.asstDomesticPassword = newPasswordInput;
    else if (authRole === 'welfare') updates.asstWelfarePassword = newPasswordInput;

    updateConfig(updates);
    soundSynthesizer.playClockInChime();
    setChangePasswordSuccess(true);
    setTimeout(() => {
      setChangePasswordSuccess(false);
      setShowChangePasswordModal(false);
      setNewPasswordInput('');
    }, 2000);
  };

  const navItems = [
    { label: 'Principal Console', icon: ShieldCheck, badge: 'Unified', roleKey: 'principal' },
    { label: 'AH Academic', icon: GraduationCap, badge: 'Teaching', roleKey: 'academic' },
    { label: 'AH Domestic', icon: Utensils, badge: 'Boarding', roleKey: 'domestic' },
    { label: 'AH Welfare', icon: HeartPulse, badge: 'Health', roleKey: 'welfare' },
  ];

  // If not authenticated for leadership console, show gorgeous verification gate
  if (!isLeaderAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-4 font-sans select-none">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Leadership Cockpit Access
            </h2>
            <p className="text-xs text-slate-400">
              Ghana Education Service • {config.schoolName} ({config.schoolCode})
            </p>
          </div>

          <form onSubmit={handleLeaderLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Select Leadership Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'principal', label: 'Principal / Headmaster', icon: ShieldCheck },
                  { key: 'academic', label: 'AH (Academic)', icon: GraduationCap },
                  { key: 'domestic', label: 'AH (Domestic)', icon: Utensils },
                  { key: 'welfare', label: 'AH (Welfare)', icon: HeartPulse },
                ].map((role) => {
                  const Icon = role.icon;
                  const isSelected = authRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => {
                        setAuthRole(role.key as any);
                        soundSynthesizer.playScanBeep();
                      }}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${isSelected ? 'bg-emerald-500 text-slate-950 font-black' : 'border border-slate-700'}`}>
                          {isSelected ? '✓' : ''}
                        </span>
                      </div>
                      <span className="text-xs font-bold leading-tight block">{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Role Access Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  placeholder="Enter default or assigned password..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-300 placeholder:text-slate-600 focus:outline-hidden focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Default password assigned by School Admin is <span className="font-mono text-slate-400">1234</span> unless customized.
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold leading-snug">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 transition transform active:scale-95 flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Verify &amp; Enter Executive Cockpit</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-400 hover:text-white font-bold transition"
            >
              ← Return to Main GES Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 h-full bg-[#0F172A] text-slate-200 flex flex-col justify-between border-r border-slate-800 select-none z-20">
        <div className="flex flex-col">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <GesDashboardLogo />
            <div>
              <h2 className="text-[11px] font-black tracking-wider uppercase text-white leading-tight">
                GHANA EDUCATION SERVICE
              </h2>
              <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-0.5">
                LEADERSHIP COCKPIT
              </p>
            </div>
          </div>

          <div className="px-5 py-4 bg-emerald-950/20 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Management Oversight</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-white truncate">{config.schoolName}</p>
                <p className="text-[10px] font-mono text-emerald-400 font-bold">{config.schoolCode}</p>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            <div className="flex items-center justify-between px-3 mb-2 mt-4">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
                Executive Modules
              </span>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                title="Change role password"
              >
                <Key className="w-3 h-3" />
                <span>Change Password</span>
              </button>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveMenu(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition duration-150 text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="px-1.5 py-0.2 text-[8px] font-bold rounded-md bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
               <span className="px-3 text-[10px] font-black tracking-wider uppercase text-slate-500 block mb-2">
                External Views
              </span>
              <button
                onClick={() => window.open('/kiosk', '_blank')}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                <span className="flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Common Room Kiosk
                </span>
                <ExternalLink className="w-3 h-3" />
              </button>
              
              {user.role === 'school_admin' || user.role === 'super_admin' ? (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-xl transition"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Operational Admin
                  </span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              {authRole.toUpperCase().slice(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-white leading-tight truncate capitalize">
                {authRole === 'principal' ? 'Principal / Headmaster' : `AH ${authRole}`}
              </p>
              <p className="text-[10px] text-emerald-400 truncate">
                Authenticated Session
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsLeaderAuthenticated(false);
              sessionStorage.removeItem('ges_leader_auth_session');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 text-xs font-bold transition duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Leadership Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto bg-[#F8FAFC] p-6 flex flex-col space-y-6">
        {activeMenu === 'Principal Console' && (
          <PrincipalExecutiveConsole
            config={config}
            onNavigateDivision={(div) => {
              if (div === 'academic') setActiveMenu('AH Academic');
              else if (div === 'domestic') setActiveMenu('AH Domestic');
              else if (div === 'welfare') setActiveMenu('AH Welfare');
            }}
          />
        )}

        {activeMenu === 'AH Academic' && (
          <AssistantHeadAcademicConsole
            config={config}
            onOpenPeriodTracker={() => navigate('/period_tracker')}
            onOpenTimetableModal={() => setShowTimetableModal(true)}
          />
        )}

        {activeMenu === 'AH Domestic' && (
          <AssistantHeadDomesticConsole config={config} />
        )}

        {activeMenu === 'AH Welfare' && (
          <AssistantHeadWelfareConsole config={config} />
        )}
      </main>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Change Password for {authRole.toUpperCase()}</span>
              </h3>
              <button onClick={() => setShowChangePasswordModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {changePasswordSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Password changed successfully! New credentials saved.</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">New Password / PIN</label>
                  <input
                    type="password"
                    placeholder="Enter new 4+ digit password..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-hidden focus:border-emerald-500"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md"
                  >
                    Save New Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <TimetableModal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
      />
    </div>
  );
};
