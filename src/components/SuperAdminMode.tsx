import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Building2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  FileCheck,
  RefreshCw,
  Eye,
  Check,
  Search,
  School,
  FileText,
  AlertOctagon,
  Key,
} from 'lucide-react';
import {
  OFFICIAL_GES_SCHOOLS,
  SchoolDirectoryItem,
  SecurityIncident,
  securityEngine,
} from '../utils/security';
import { SchoolConfig } from '../types';
import { soundSynthesizer } from '../utils/audio';
import { DataPrivacyModal } from './DataPrivacyModal';

interface SuperAdminModeProps {
  currentSchoolConfig: SchoolConfig;
  onSwitchSchool?: (school: SchoolDirectoryItem) => void;
  onNavigateToSchoolAdmin?: () => void;
}

export const SuperAdminMode: React.FC<SuperAdminModeProps> = ({
  currentSchoolConfig,
  onSwitchSchool,
  onNavigateToSchoolAdmin,
}) => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>(() =>
    securityEngine.getIncidents()
  );
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(
    currentSchoolConfig.schoolCode || 'GES-VR-HO-002'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'incidents' | 'privacy'>('overview');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'critical' | 'active'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sync incidents on interval & custom events
  useEffect(() => {
    const handleSecurityEvent = () => {
      setIncidents(securityEngine.getIncidents());
    };
    window.addEventListener('ges_security_alert', handleSecurityEvent);
    const interval = setInterval(() => {
      setIncidents(securityEngine.getIncidents());
    }, 3000);

    return () => {
      window.removeEventListener('ges_security_alert', handleSecurityEvent);
      clearInterval(interval);
    };
  }, []);

  const handleSelectSchool = (school: SchoolDirectoryItem) => {
    setSelectedSchoolCode(school.code);
    onSwitchSchool?.(school);
    soundSynthesizer.playClockInChime();
    setFeedbackMsg(`Active inspection context switched to ${school.name} (${school.region}).`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleClearIncident = (id: string) => {
    securityEngine.clearIncident(id);
    setIncidents(securityEngine.getIncidents());
    soundSynthesizer.playScanBeep();
    setFeedbackMsg('Security alert status updated to Reviewed / Cleared.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleSimulateBruteForceTest = () => {
    const fakeStaffId = 'TEST-ATTACK-009';
    const fakeDevice = 'Mozilla/5.0 (Unauthorized Scraper Simulation)';
    for (let i = 0; i < 5; i++) {
      securityEngine.recordFailedAttempt(fakeStaffId, currentSchoolConfig.schoolCode, {
        staffId: fakeStaffId,
        staffName: 'Simulated Infiltration Entity',
        type: 'brute_force_pin',
        deviceSignature: fakeDevice,
      });
    }
    soundSynthesizer.playOutOfBoundsBuzzer();
    setIncidents(securityEngine.getIncidents());
    setFeedbackMsg('🚨 Simulated 5x Brute-Force test incident injected! Automatic 5-minute lockout and high-severity alert created.');
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const filteredIncidents = useMemo(() => {
    if (incidentFilter === 'critical') {
      return incidents.filter((i) => i.severity === 'critical');
    }
    if (incidentFilter === 'active') {
      return incidents.filter((i) => i.status === 'active_alert');
    }
    return incidents;
  }, [incidents, incidentFilter]);

  const activeAlertsCount = useMemo(() => {
    return incidents.filter((i) => i.status === 'active_alert').length;
  }, [incidents]);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-5 max-w-6xl mx-auto w-full space-y-4">
      {/* Super Admin Directorate Master Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-indigo-500/10 -skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-400/50 text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                GES Directorate Oversight • Multi-School Scope
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                Act 843 Compliant
              </span>
              {activeAlertsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-500/60 text-[10px] font-mono text-rose-300 font-bold animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {activeAlertsCount} Active Security Alert{activeAlertsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide uppercase">
              Republic of Ghana • GES Super Administrator Command
            </h1>

            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-2xl">
              National and regional oversight console for Senior High Schools across Ghana. Super Admins hold
              multi-institutional clearance, while individual School Administrators are strictly restricted to their own school per Ghana Education Service privacy mandates.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-indigo-200 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Act 843 Privacy Standards</span>
            </button>

            <button
              onClick={handleSimulateBruteForceTest}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Inject simulated failed PIN brute-force attempts to verify rate-limiting and alert triggers"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Brute-Force Alert</span>
            </button>

            {onNavigateToSchoolAdmin && (
              <button
                onClick={onNavigateToSchoolAdmin}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/30"
              >
                <span>School Admin Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <span className="font-semibold">{feedbackMsg}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs text-indigo-400 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            setActiveTab('overview');
            soundSynthesizer.playKeypadBeep();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Multi-School Directory &amp; Comparison</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('incidents');
            soundSynthesizer.playKeypadBeep();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition relative ${
            activeTab === 'incidents'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Security &amp; Brute-Force Logs</span>
          {activeAlertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {activeAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('privacy');
            soundSynthesizer.playKeypadBeep();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            activeTab === 'privacy'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Act 843 Privacy Compliance</span>
        </button>
      </div>

      {/* TAB 1: MULTI-SCHOOL DIRECTORY & COMPARISON */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Institutional Segregation Explainer Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">
                  Role-Based Data Isolation Mandate (GES Security Standard)
                </h3>
                <p className="text-slate-400 leading-relaxed max-w-3xl">
                  <strong>Staff:</strong> View only their personal punch records.
                  <br />
                  <strong>School Admin:</strong> Can only see what is peculiar to their school ({currentSchoolConfig.schoolName}). They cannot view staff or data of other schools.
                  <br />
                  <strong>GES Super Admin:</strong> Has national clearance to switch between institutions, review inter-school punctuality, and audit regional security.
                </p>
              </div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right shrink-0">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Current Context</p>
              <p className="text-xs font-bold text-emerald-400">{currentSchoolConfig.schoolName}</p>
            </div>
          </div>

          {/* School Registry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {OFFICIAL_GES_SCHOOLS.map((school) => {
              const isCurrent = school.code === selectedSchoolCode;
              return (
                <div
                  key={school.code}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-indigo-950/70 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                        {school.code}
                      </span>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active School
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">
                          {school.region}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-base leading-tight">
                        {school.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {school.district} • {school.region}
                      </p>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <p className="text-[10px] text-slate-400">Teaching</p>
                        <p className="text-xs font-bold text-white">{school.staffCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <p className="text-[10px] text-slate-400">Non-Teach</p>
                        <p className="text-xs font-bold text-amber-300">{school.nonTeachingCount}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                        <p className="text-[10px] text-slate-400">Classes</p>
                        <p className="text-xs font-bold text-indigo-300">{school.classCount}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectSchool(school)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <span>{isCurrent ? 'Inspecting School' : 'Switch Context to School'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY & BRUTE-FORCE INCIDENTS LOG */}
      {activeTab === 'incidents' && (
        <div className="space-y-4 animate-fade-in">
          {/* Controls & Filter Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Filter Severity:</span>
              <button
                onClick={() => setIncidentFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  incidentFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                All ({incidents.length})
              </button>
              <button
                onClick={() => setIncidentFilter('active')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  incidentFilter === 'active'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-950 text-rose-400 hover:text-white'
                }`}
              >
                Active Alerts ({activeAlertsCount})
              </button>
              <button
                onClick={() => setIncidentFilter('critical')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  incidentFilter === 'critical'
                    ? 'bg-rose-700 text-white'
                    : 'bg-slate-950 text-rose-400 hover:text-white'
                }`}
              >
                Critical Lockouts
              </button>
            </div>

            <button
              onClick={handleSimulateBruteForceTest}
              className="px-3 py-1.5 rounded-xl bg-rose-950 border border-rose-500/50 text-rose-200 hover:text-white font-bold flex items-center gap-1.5 transition text-xs"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Simulate Attack Alert</span>
            </button>
          </div>

          {/* Incidents List */}
          {filteredIncidents.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-bold text-white text-base">No Security Incidents Detected</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All PIN and OTP verification checks across schools are passing normally. Brute force attempts and multiple failed entries will automatically trigger alerts here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((incident) => {
                const isCritical = incident.severity === 'critical';
                const isActive = incident.status === 'active_alert';

                return (
                  <div
                    key={incident.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? isCritical
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/40'
                          : 'bg-amber-950/40 border-amber-500/60'
                        : 'bg-slate-900/80 border-slate-800 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCritical
                                ? 'bg-rose-950 border border-rose-500 text-rose-300'
                                : 'bg-amber-950 border border-amber-500 text-amber-300'
                            }`}
                          >
                            {incident.severity} Severity
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                            {incident.type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {incident.dateTime}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-white">
                          {incident.details}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono pt-1">
                          <span>Target: <strong className="text-slate-200">{incident.staffNameAttempted || 'Unknown'} ({incident.staffIdAttempted || 'N/A'})</strong></span>
                          <span>•</span>
                          <span>School: <strong className="text-slate-200">{incident.schoolCode}</strong></span>
                          <span>•</span>
                          <span className="truncate max-w-xs">Device: {incident.deviceSignature.slice(0, 30)}...</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isActive ? (
                          <button
                            onClick={() => handleClearIncident(incident.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Acknowledge / Clear</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACT 843 DATA PRIVACY & COMPLIANCE */}
      {activeTab === 'privacy' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Ghana Data Protection Act, 2012 (Act 843) Compliance Ledger
                </h3>
                <p className="text-xs text-slate-400">
                  Statutory verification for educational institution workforce telemetry
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                {
                  title: '1. Accountability & Registration',
                  desc: 'All institutional data controllers are identified. School admins have scoped clearance without cross-institutional access.',
                  status: 'Compliant',
                },
                {
                  title: '2. Lawfulness of Processing',
                  desc: 'Telemetry is restricted strictly to official GES employment contracts and statutory teaching contact hours.',
                  status: 'Compliant',
                },
                {
                  title: '3. Data Minimization (GPS & Telemetry)',
                  desc: 'Coordinates are only sampled during active clock-in at school gates. Background continuous tracking is strictly prohibited.',
                  status: 'Compliant',
                },
                {
                  title: '4. Security Safeguards & Anti-Brute-Force',
                  desc: '5-minute lockout triggered after 5 failed verification attempts. 20-second rotating optical QR beacon prevents replay attacks.',
                  status: 'Compliant',
                },
                {
                  title: '5. Staff Confidentiality & Segregation',
                  desc: 'General staff are restricted from viewing peer salaries, phone numbers, or administrative disciplinary notes.',
                  status: 'Compliant',
                },
                {
                  title: '6. Immutable Audit Trail & Unclock Reason Logging',
                  desc: 'Any administrative adjustment or voiding requires mandatory justification and captures supervisor credentials.',
                  status: 'Compliant',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white">{item.title}</h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-[10px] text-emerald-300 font-bold">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Act 843 Legal Framework</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submodal for Data Privacy */}
      <DataPrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        schoolName={currentSchoolConfig.schoolName}
      />
    </div>
  );
};
