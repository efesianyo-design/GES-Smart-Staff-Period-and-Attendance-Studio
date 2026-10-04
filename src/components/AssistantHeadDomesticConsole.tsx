import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Building2,
  Shield,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Truck,
  Layers,
  ChevronRight,
  Phone,
  Search,
  Check,
  X,
} from 'lucide-react';
import {
  SchoolConfig,
  HouseDormRecord,
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
} from '../types';
import { storageEngine, getTodayDateString } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

interface AssistantHeadDomesticConsoleProps {
  config: SchoolConfig;
}

export const AssistantHeadDomesticConsole: React.FC<AssistantHeadDomesticConsoleProps> = ({
  config,
}) => {
  const [houseDorms, setHouseDorms] = useState<HouseDormRecord[]>(() => storageEngine.getHouseDorms());
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffMember[]>(() =>
    storageEngine.getNonTeachingStaff()
  );
  const [nonTeachingRecords, setNonTeachingRecords] = useState<NonTeachingAttendanceRecord[]>(() =>
    storageEngine.getNonTeachingAttendance()
  );

  const [activeTab, setActiveTab] = useState<'boarding' | 'kitchen' | 'security' | 'grounds' | 'supervisor_rollcall'>('boarding');
  const [savedToast, setSavedToast] = useState(false);
  const [isSupervisorRollcallOpen, setIsSupervisorRollcallOpen] = useState(false);
  const [supervisorNotes, setSupervisorNotes] = useState('All morning shift posts manned.');

  useEffect(() => {
    const handleUpdate = () => {
      setHouseDorms(storageEngine.getHouseDorms());
      setNonTeachingRecords(storageEngine.getNonTeachingAttendance());
    };
    window.addEventListener('ges_house_dorms_changed', handleUpdate);
    window.addEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    return () => {
      window.removeEventListener('ges_house_dorms_changed', handleUpdate);
      window.removeEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    };
  }, []);

  const handleSupervisorRollcallAll = () => {
    const today = getTodayDateString();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour12: false });
    let count = 0;

    nonTeachingStaff.forEach((staff) => {
      const existing = nonTeachingRecords.find(r => r.staffId === staff.staffId && r.date === today);
      if (!existing) {
        const record: NonTeachingAttendanceRecord = {
          id: `nt-rollcall-${Date.now()}-${staff.id}`,
          staffId: staff.staffId,
          staffName: staff.name,
          role: staff.role,
          unit: staff.unit,
          date: today,
          clockInTime: timeStr,
          clockInTimestamp: Date.now(),
          method: 'supervisor_rollcall',
          shift: staff.shift,
          punctualityStatus: 'on_time',
          verifiedBy: 'Assistant Headmaster / Principal On-Duty Rollcall',
          notes: supervisorNotes || 'Shift crew verified present on post by Supervisor.',
          synced: true,
          isIdentityVerified: true,
          isOnCampus: true,
          verificationMethod: 'supervisor',
          deviceSignature: 'HEAD-CONSOLE-AUTH',
          loginTrace: `Supervisor Direct Rollcall #${staff.staffId} • Authorized from Head Console`,
        };
        storageEngine.addNonTeachingRecord(record);
        count++;

        storageEngine.logAudit({
          staffId: record.staffId,
          staffName: record.staffName,
          schoolCode: config.schoolCode,
          category: 'attendance',
          status: 'success',
          action: 'CLOCK_IN_NON_TEACHING',
          details: `Supervisor Bulk Rollcall from Head Console: ${record.verifiedBy}. Shift: ${record.shift}`,
        });
      }
    });

    soundSynthesizer.playClockInChime();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
    setIsSupervisorRollcallOpen(false);
  };

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayNonTeaching = useMemo(
    () => nonTeachingRecords.filter((r) => r.date === today && !r.isVoided),
    [nonTeachingRecords, today]
  );

  // Group domestic staff by department / role
  const kitchenStaff = useMemo(
    () => nonTeachingStaff.filter((s) => s.role === 'Matron' || s.role === 'Cook' || s.unit.toLowerCase().includes('catering')),
    [nonTeachingStaff]
  );

  const securityStaff = useMemo(
    () => nonTeachingStaff.filter((s) => s.role === 'Security' || s.unit.toLowerCase().includes('security')),
    [nonTeachingStaff]
  );

  const groundsStaff = useMemo(
    () => nonTeachingStaff.filter((s) => s.role === 'Groundsman' || s.role === 'Driver' || s.unit.toLowerCase().includes('estate')),
    [nonTeachingStaff]
  );

  const totalBoarders = useMemo(() => houseDorms.reduce((acc, d) => acc + d.totalBoarders, 0), [houseDorms]);
  const presentBoarders = useMemo(() => houseDorms.reduce((acc, d) => acc + d.presentTonight, 0), [houseDorms]);

  const handleUpdateDormMuster = (id: string, newPresent: number) => {
    soundSynthesizer.playScanBeep();
    const updated = houseDorms.map((d) => (d.id === id ? { ...d, presentTonight: newPresent, musterRollStatus: 'completed' as const } : d));
    setHouseDorms(updated);
    storageEngine.saveHouseDorms(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Domestic Command Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Utensils className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
                Domestic Division Oversight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Assistant Headmaster (Domestic) Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monitors Senior Housemasters, Boarding Dormitories, Dining Hall &amp; Kitchen catering, Gate security marshals, and Estate maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              {houseDorms.length} Boarding Houses Monitored
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Boarders Muster Roll</span>
            <div className="text-xl font-black text-white mt-0.5">
              {presentBoarders} <span className="text-xs text-slate-400 font-normal">/ {totalBoarders}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">
              {Math.round((presentBoarders / (totalBoarders || 1)) * 100)}% Accounted For
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Kitchen Staff On Duty</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {kitchenStaff.length} Cooks &amp; Matron
            </div>
            <span className="text-[10px] text-slate-400">Meal Rations Active</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Gate Marshals &amp; Guards</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {securityStaff.length} On Duty
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Main Gate &amp; Perimeter</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Sanitation &amp; Estate</span>
            <div className="text-xl font-black text-teal-400 mt-0.5">
              {groundsStaff.length} Groundsmen
            </div>
            <span className="text-[10px] text-slate-400">Campus Facilities Active</span>
          </div>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Boarding muster roll and domestic log updated successfully!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'boarding', label: 'Boarding Houses & Dormitories', icon: Building2 },
          { key: 'kitchen', label: 'Dining Hall & Kitchen Catering', icon: Flame },
          { key: 'security', label: 'Campus Security & Gate Clock', icon: Shield },
          { key: 'grounds', label: 'Estate, Grounds & Sanitation', icon: Truck },
          { key: 'supervisor_rollcall', label: 'Supervisor Muster Roll', icon: CheckCircle2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: BOARDING HOUSES */}
      {activeTab === 'boarding' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Boarding Houses Daily Muster Roll</h3>
                <p className="text-xs text-slate-500">Supervised by Senior Housemaster &amp; Resident Housemasters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {houseDorms.map((dorm) => (
                <div key={dorm.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-black text-slate-900">{dorm.houseName}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Housemaster: <strong>{dorm.housemasterName}</strong> ({dorm.housemasterStaffId})
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        dorm.musterRollStatus === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dorm.musterRollStatus === 'completed' ? '✓ Roll Taken' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Present</span>
                      <strong className="text-emerald-700 text-base">{dorm.presentTonight}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Exeat</span>
                      <strong className="text-amber-700 text-base">{dorm.onExeatCount}</strong>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Infirmary</span>
                      <strong className="text-rose-700 text-base">{dorm.inInfirmaryCount}</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>Last Roll Call: <strong>{dorm.lastRollCallTime}</strong></span>
                    <button
                      onClick={() => handleUpdateDormMuster(dorm.id, dorm.totalBoarders - dorm.onExeatCount - dorm.inInfirmaryCount)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition"
                    >
                      Confirm Muster Roll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DINING HALL & KITCHEN */}
      {activeTab === 'kitchen' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Dining Hall &amp; Catering Services</h3>
              <p className="text-xs text-slate-500">Supervised by the Matron &amp; Kitchen Supervisors</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Kitchen Staff</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Assigned Shift</th>
                  <th className="py-2.5 px-3">Today Clock-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kitchenStaff.map((s) => {
                  const record = todayNonTeaching.find((r) => r.staffId === s.staffId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{s.shift}</td>
                      <td className="py-2.5 px-3">
                        {record ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            On Duty ({record.clockInTime})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                            Shift Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Campus Security &amp; Gate Marshals</h3>
              <p className="text-xs text-slate-500">Supervised by Chief Security Officer</p>
            </div>
          </div>

          <div className="space-y-3">
            {securityStaff.map((sec) => (
              <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{sec.name}</h4>
                  <p className="text-[11px] text-slate-500">Staff ID: {sec.staffId} • Shift: {sec.shift}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Gate Marshal Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GROUNDS */}
      {activeTab === 'grounds' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Estate, Groundsmen &amp; Fleet Operations</h3>
              <p className="text-xs text-slate-500">Campus sanitation, water facilities, and vehicle logistics</p>
            </div>
          </div>

          <div className="space-y-3">
            {groundsStaff.map((g) => (
              <div key={g.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{g.name}</h4>
                  <p className="text-[11px] text-slate-500">Role: {g.role} • Staff ID: {g.staffId}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                  On Campus
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* TAB 5: SUPERVISOR ROLLCALL */}
      {activeTab === 'supervisor_rollcall' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Non-Teaching Supervisor Muster Roll</h3>
                <p className="text-xs text-slate-500">Bulk verify and clock-in shift personnel (Kitchen, Security, Grounds)</p>
              </div>
            </div>
            <button
              onClick={() => setIsSupervisorRollcallOpen(true)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg transition transform active:scale-95"
            >
              Perform Bulk Shift Clock-In
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
             <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase">Supervisor Protocol</h4>
             </div>
             <p className="text-xs text-slate-600 leading-relaxed">
                As Assistant Headmaster, you can perform a manual muster roll for non-teaching staff who may not have clocked in via PIN or SMS. This action is audited and visible to the Principal.
             </p>
          </div>

          {isSupervisorRollcallOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-lg font-black text-slate-900">Shift Muster Roll Confirmation</h3>
                   <button onClick={() => setIsSupervisorRollcallOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor Observation Notes</label>
                   <textarea
                     value={supervisorNotes}
                     onChange={(e) => setSupervisorNotes(e.target.value)}
                     className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-indigo-500"
                     rows={3}
                   />
                   <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center gap-3">
                      <Users className="w-6 h-6 text-indigo-600" />
                      <div className="text-xs text-indigo-900 font-bold">
                        Confirming presence for all {nonTeachingStaff.length} shift personnel.
                      </div>
                   </div>
                </div>
                <button
                  onClick={handleSupervisorRollcallAll}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl transition transform active:scale-95"
                >
                  Execute Bulk Shift Clock-In
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
