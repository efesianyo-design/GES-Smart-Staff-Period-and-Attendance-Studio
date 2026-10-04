import React, { useState, useEffect, useMemo } from 'react';
import {
  HeartPulse,
  Users,
  Shield,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
  FileText,
  Search,
  ArrowRight,
  UserCheck,
  Building,
  X,
} from 'lucide-react';
import {
  SchoolConfig,
  InfirmaryVisitRecord,
  WelfareCaseRecord,
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
} from '../types';
import { storageEngine, getTodayDateString } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';

interface AssistantHeadWelfareConsoleProps {
  config: SchoolConfig;
}

export const AssistantHeadWelfareConsole: React.FC<AssistantHeadWelfareConsoleProps> = ({
  config,
}) => {
  const [infirmaryRecords, setInfirmaryRecords] = useState<InfirmaryVisitRecord[]>(() =>
    storageEngine.getInfirmaryRecords()
  );
  const [welfareCases, setWelfareCases] = useState<WelfareCaseRecord[]>(() =>
    storageEngine.getWelfareCases()
  );
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffMember[]>(() =>
    storageEngine.getNonTeachingStaff()
  );
  const [nonTeachingRecords, setNonTeachingRecords] = useState<NonTeachingAttendanceRecord[]>(() =>
    storageEngine.getNonTeachingAttendance()
  );

  const [activeTab, setActiveTab] = useState<'infirmary' | 'guidance' | 'staff_welfare'>('infirmary');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showAddCaseModal, setShowAddCaseModal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // New patient form
  const [newStudentName, setNewStudentName] = useState('');
  const [newClassCode, setNewClassCode] = useState('GEN_ART_2A');
  const [newHouseName, setNewHouseName] = useState('Aggrey House');
  const [newComplaint, setNewComplaint] = useState('');
  const [newTreatment, setNewTreatment] = useState('');
  const [newNurse, setNewNurse] = useState('Sister Mary Akosua Osei');
  const [newExeatIssued, setNewExeatIssued] = useState(false);

  // New welfare case form
  const [newCaseType, setNewCaseType] = useState<WelfareCaseRecord['caseType']>('student_guidance');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonType, setNewPersonType] = useState<WelfareCaseRecord['personType']>('student');
  const [newDeptOrClass, setNewDeptOrClass] = useState('Form 2 Science');
  const [newDescription, setNewDescription] = useState('');
  const [newUrgency, setNewUrgency] = useState<WelfareCaseRecord['urgency']>('medium');

  useEffect(() => {
    const handleUpdate = () => {
      setInfirmaryRecords(storageEngine.getInfirmaryRecords());
      setWelfareCases(storageEngine.getWelfareCases());
      setNonTeachingRecords(storageEngine.getNonTeachingAttendance());
    };
    window.addEventListener('ges_infirmary_changed', handleUpdate);
    window.addEventListener('ges_welfare_cases_changed', handleUpdate);
    window.addEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    return () => {
      window.removeEventListener('ges_infirmary_changed', handleUpdate);
      window.removeEventListener('ges_welfare_cases_changed', handleUpdate);
      window.removeEventListener('ges_non_teaching_attendance_changed', handleUpdate);
    };
  }, []);



  const admittedCount = useMemo(
    () => infirmaryRecords.filter((i) => i.status === 'admitted').length,
    [infirmaryRecords]
  );
  const hospitalTransfersCount = useMemo(
    () => infirmaryRecords.filter((i) => i.status === 'referred_hospital').length,
    [infirmaryRecords]
  );
  const activeWelfareCount = useMemo(
    () => welfareCases.filter((c) => c.status !== 'resolved').length,
    [welfareCases]
  );

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newComplaint.trim()) return;

    soundSynthesizer.playScanBeep();
    const newRecord: InfirmaryVisitRecord = {
      id: `inf-${Date.now()}`,
      studentName: newStudentName.trim(),
      classCode: newClassCode,
      houseName: newHouseName,
      complaint: newComplaint.trim(),
      admittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'admitted',
      nurseOnDuty: newNurse,
      treatment: newTreatment.trim() || 'Bed rest in infirmary & observation',
      exeatIssued: newExeatIssued,
    };

    storageEngine.addInfirmaryRecord(newRecord);
    setInfirmaryRecords(storageEngine.getInfirmaryRecords());
    setShowAddPatientModal(false);
    setNewStudentName('');
    setNewComplaint('');
    setNewTreatment('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleDischargePatient = (id: string) => {
    soundSynthesizer.playScanBeep();
    const updated = infirmaryRecords.map((i) => (i.id === id ? { ...i, status: 'discharged' as const } : i));
    setInfirmaryRecords(updated);
    storageEngine.saveInfirmaryRecords(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newDescription.trim()) return;

    soundSynthesizer.playScanBeep();
    const newCase: WelfareCaseRecord = {
      id: `wlf-${Date.now()}`,
      caseType: newCaseType,
      personName: newPersonName.trim(),
      personType: newPersonType,
      departmentOrClass: newDeptOrClass.trim(),
      description: newDescription.trim(),
      openedDate: new Date().toISOString().split('T')[0],
      status: 'active',
      officerInCharge: 'Mrs. Charity Sabbath',
      urgency: newUrgency,
    };

    storageEngine.addWelfareCase(newCase);
    setWelfareCases(storageEngine.getWelfareCases());
    setShowAddCaseModal(false);
    setNewPersonName('');
    setNewDescription('');
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Welfare Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-pink-950 border border-rose-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <HeartPulse className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider">
                Welfare Division Oversight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Assistant Headmaster (Welfare) Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Monitors Student Infirmary admissions, Medical exeats, Guidance &amp; Counseling unit, Prefectorial board, and Staff compassionate relief.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddPatientModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-rose-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Log Clinic Admission</span>
            </button>
            <button
              onClick={() => setShowAddCaseModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Welfare Case</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Current Inpatients</span>
            <div className="text-xl font-black text-rose-400 mt-0.5">
              {admittedCount} <span className="text-xs text-slate-400 font-normal">Patients</span>
            </div>
            <span className="text-[10px] text-slate-400">Bed Rest in Clinic</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Hospital Transfers</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">
              {hospitalTransfersCount} <span className="text-xs text-slate-400 font-normal">Referrals</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">Ho Teaching Hospital</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Active Welfare Cases</span>
            <div className="text-xl font-black text-white mt-0.5">
              {activeWelfareCount} <span className="text-xs text-slate-400 font-normal">Cases</span>
            </div>
            <span className="text-[10px] text-slate-400">Guidance &amp; Relief</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Nurse On Duty</span>
            <div className="text-sm font-bold text-white mt-1 truncate">
              Sister Mary Akosua Osei
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">Health Bay Active</span>
          </div>
        </div>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Welfare and health bay record updated successfully!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'infirmary', label: 'School Health Bay & Clinic Admissions', icon: HeartPulse },
          { key: 'guidance', label: 'Guidance & Counseling Department', icon: Users },
          { key: 'staff_welfare', label: 'Staff Welfare & Compassionate Relief', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-rose-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HEALTH BAY & CLINIC */}
      {activeTab === 'infirmary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Health Bay Patient Admissions</h3>
                <p className="text-xs text-slate-500">Live triage, medication, and exeat records</p>
              </div>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Admit Student</span>
              </button>
            </div>

            <div className="space-y-3">
              {infirmaryRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900">{record.studentName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            record.status === 'referred_hospital'
                              ? 'bg-red-600 text-white'
                              : record.status === 'admitted'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {record.status === 'referred_hospital' ? 'Hospital Transfer' : record.status}
                        </span>
                        {record.exeatIssued && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Medical Exeat Issued
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Class: <strong>{record.classCode}</strong> • House: <strong>{record.houseName}</strong>
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">
                      Admitted: {record.admittedAt}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <p className="text-slate-800">
                      <strong>Complaint:</strong> {record.complaint}
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      <strong>Treatment:</strong> {record.treatment}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <span>Nurse On Duty: <strong>{record.nurseOnDuty}</strong></span>
                    {record.status === 'admitted' && (
                      <button
                        onClick={() => handleDischargePatient(record.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                      >
                        Discharge Patient
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GUIDANCE & COUNSELING */}
      {activeTab === 'guidance' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Guidance &amp; Psychosocial Counseling Dossiers</h3>
              <p className="text-xs text-slate-500">Supervised by Rev. Dr. Emmanuel Agbeti &amp; Counseling Team</p>
            </div>
            <button
              onClick={() => {
                setNewCaseType('student_guidance');
                setShowAddCaseModal(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Counseling Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {welfareCases
              .filter((c) => c.caseType === 'student_guidance')
              .map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{c.personName}</h4>
                      <p className="text-xs text-slate-500">{c.departmentOrClass}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold capitalize">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                    <span>Officer: {c.officerInCharge}</span>
                    <span>Opened: {c.openedDate}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF WELFARE */}
      {activeTab === 'staff_welfare' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">Staff Welfare &amp; Compassionate Committee</h3>
              <p className="text-xs text-slate-500">Bereavement support, sick leave relief &amp; welfare grants</p>
            </div>
            <button
              onClick={() => {
                setNewCaseType('staff_compassionate');
                setNewPersonType('teaching_staff');
                setShowAddCaseModal(true);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Staff Relief</span>
            </button>
          </div>

          <div className="space-y-3">
            {welfareCases
              .filter((c) => c.caseType === 'staff_compassionate')
              .map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{c.personName}</h4>
                      <p className="text-xs text-slate-500">{c.departmentOrClass}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                      Urgency: {c.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{c.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200 flex justify-between">
                    <span>Officer: {c.officerInCharge}</span>
                    <span>Date: {c.openedDate}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modal: Log Clinic Admission */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black">Admit Student to Health Bay</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Student Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Samuel K. Mensah"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Class</label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">House</label>
                  <input
                    type="text"
                    value={newHouseName}
                    onChange={(e) => setNewHouseName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chief Complaint *</label>
                <input
                  type="text"
                  placeholder="e.g. High fever, headache, stomach cramps"
                  value={newComplaint}
                  onChange={(e) => setNewComplaint(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Initial Treatment / Observation</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, bed rest in Bay 1"
                  value={newTreatment}
                  onChange={(e) => setNewTreatment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exeatCheck"
                  checked={newExeatIssued}
                  onChange={(e) => setNewExeatIssued(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <label htmlFor="exeatCheck" className="text-xs text-slate-300 font-bold">
                  Issue medical exeat slip for parents / hospital referral
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Confirm Clinic Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Welfare Case */}
      {showAddCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-black">Log Welfare / Counseling Case</h3>
              <button onClick={() => setShowAddCaseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddCaseSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Beneficiary Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Student or Staff Member Name"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Case Category</label>
                  <select
                    value={newCaseType}
                    onChange={(e) => setNewCaseType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="student_guidance">Student Guidance &amp; Counseling</option>
                    <option value="staff_compassionate">Staff Compassionate Relief</option>
                    <option value="medical_emergency">Medical Emergency Support</option>
                    <option value="indigent_support">Indigent Student Welfare Aid</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Urgency</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Case Narrative &amp; Action Required *</label>
                <textarea
                  rows={3}
                  placeholder="Describe situation, psychosocial observations, or welfare grant recommendation..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCaseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Log Welfare Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
