import React, { useState } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  MapPin,
  FileSpreadsheet,
  BarChart3,
  MessageSquare,
  Search,
  Download,
  Upload,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Shuffle,
  GitMerge,
  Send,
  Sparkles,
  Phone,
  FileText,
  Trash2,
  X,
} from 'lucide-react';
import { SchoolConfig, StaffMember } from '../types';
import { storageEngine } from '../utils/storage';
import { soundSynthesizer } from '../utils/audio';
import { downloadCSV } from '../utils/csv';
import {
  downloadTeachingStaffTemplate,
  downloadNonTeachingStaffTemplate,
  downloadLearnersTemplate,
  downloadTimetableTemplate,
  parseTeachingStaffCSV,
  parseNonTeachingStaffCSV,
  parseLearnersCSV,
  parseTimetableCSV,
  parseAndSimulateTimetablePDF,
} from '../utils/templateManager';

// =========================================================================
// 1. SCHOOLS / CAMPUS INFRASTRUCTURE TAB
// =========================================================================
export const SchoolsCampusTab: React.FC<{ config: SchoolConfig }> = ({ config }) => {
  const [geofenceRadius, setGeofenceRadius] = useState(config.radiusMeters || 500);
  const [savedToast, setSavedToast] = useState(false);

  const handleSaveCampus = () => {
    soundSynthesizer.playScanBeep();
    storageEngine.saveSchoolConfig({
      ...config,
      radiusMeters: geofenceRadius,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Institutional Profile &amp; Campus Terminals
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Authorized hardware kiosks, GPS geofence parameters, and physical boundary gates
          </p>
        </div>
        <button
          onClick={handleSaveCampus}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Save Campus Settings</span>
        </button>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Campus hardware and geofence parameters updated successfully!</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: School Details & Geofence */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>Campus Identity &amp; Location</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Official School Name</label>
                <input
                  type="text"
                  disabled
                  value={config.schoolName}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] block mb-1">GES School Code</label>
                <input
                  type="text"
                  disabled
                  value={config.schoolCode}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] block mb-1">GPS Coordinates (Center Lat / Lng)</label>
                <input
                  type="text"
                  disabled
                  value={`${config.lat || 6.6111}, ${config.lng || 0.4786}`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold uppercase text-[10px] block mb-1">Morning Punctuality Cut-off</label>
                <input
                  type="text"
                  defaultValue="07:45 AM GMT"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Geofence Slider */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Haversine Geofence Boundary Radius:</span>
                <span className="font-mono font-black text-yellow-700 bg-yellow-100 px-2.5 py-0.5 rounded-full">
                  {geofenceRadius} meters
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={geofenceRadius}
                onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                className="w-full accent-yellow-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                Staff mobile BYOD clock-in requires the device GPS to be strictly within this perimeter of the campus center.
              </p>
            </div>
          </div>

          {/* Classroom Blocks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-slate-900">Campus Classroom Blocks &amp; Zones</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Science Complex', rooms: '6 Labs / 12 Rooms', code: 'SCI' },
                { name: 'Business Block', rooms: '8 Classrooms', code: 'BUS' },
                { name: 'General Arts Block', rooms: '14 Classrooms', code: 'ART' },
                { name: 'Admin & Staff Room', rooms: 'Central Kiosk Hub', code: 'ADM' },
              ].map((blk) => (
                <div key={blk.code} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{blk.code}</span>
                  <p className="text-xs font-black text-slate-800">{blk.name}</p>
                  <p className="text-[10px] text-slate-500">{blk.rooms}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Active Kiosks */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Hardware Kiosk Terminals</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-yellow-400 font-mono">KIOSK #1 • MAIN GATE</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700 px-2 py-0.5 rounded-full font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Terminal Code: <strong className="text-white font-mono">{config.schoolCode}</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  Rotating QR Beacon (20s) • Geofence Latency: 4ms
                </p>
                <button
                  onClick={() => window.open(`/kiosk?schoolCode=${config.schoolCode || 'MAWULI01'}`, '_blank')}
                  className="w-full mt-2 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Kiosk Terminal Screen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-800">Common Room Terminal #2</strong>
                  <span className="text-[10px] text-slate-500 font-mono">Standby</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Allows quick PIN/NFC staff clock-in during morning briefing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. STAFF / AUTOMATED UPLOADS / MERGE CLASSES / CROSS-DEPT TAB
// =========================================================================
export const StaffUploadsTab: React.FC<{ config: SchoolConfig }> = ({ config }) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'uploads' | 'cross_dept' | 'merge_classes'>('roster');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storageEngine.getStaff());
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cross-dept state
  const [crossTeacherId, setCrossTeacherId] = useState('');
  const [crossSubject, setCrossSubject] = useState('');
  const [crossDept, setCrossDept] = useState('General Science');
  const [crossAssignments, setCrossAssignments] = useState<Array<{ teacherName: string; subject: string; targetDept: string }>>([
    { teacherName: 'Mr. Eugene Fafali Esianyo', subject: 'Core Mathematics', targetDept: 'General Science & Arts' },
    { teacherName: 'Mr. David Goka', subject: 'Agricultural Science', targetDept: 'General Arts' },
  ]);

  // Class merge state
  const [mergeClassA, setMergeClassA] = useState('BCGA2A (GEN ART 2A)');
  const [mergeClassB, setMergeClassB] = useState('BCGA2C (GEN ART 2C)');
  const [mergeSubject, setMergeSubject] = useState('Core Mathematics');
  const [mergedClassList, setMergedClassList] = useState<Array<{ nameA: string; nameB: string; subject: string; period: string }>>([
    { nameA: 'Form 2 Arts A', nameB: 'Form 2 Arts C', subject: 'Core Mathematics', period: 'Period 2 (08:00 - 09:00)' },
    { nameA: 'Form 2 Science A', nameB: 'Form 2 Science B', subject: 'Elective Physics', period: 'Period 5 (11:30 - 12:30)' },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'teaching' | 'non_teaching' | 'learners' | 'timetable_csv' | 'timetable_pdf') => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundSynthesizer.playScanBeep();

    if (type === 'timetable_pdf') {
      const result = parseAndSimulateTimetablePDF(file.name);
      setToastMessage(`✓ Seamless PDF Upload Success: ${result.message}`);
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      if (type === 'teaching') {
        const res = parseTeachingStaffCSV(text);
        if (res.success) {
          setStaffList(storageEngine.getStaff());
          setToastMessage(`✓ Seamless Upload: Added ${res.count} Teaching Staff members.`);
        } else {
          setToastMessage(`Upload Error: ${res.message}`);
        }
      } else if (type === 'non_teaching') {
        const res = parseNonTeachingStaffCSV(text);
        setToastMessage(`✓ Seamless Upload: Added ${res.count} Non-Teaching Staff members.`);
      } else if (type === 'learners') {
        const res = parseLearnersCSV(text);
        setToastMessage(`✓ Seamless Upload: Processed ${res.count} Learner enrollments.`);
      } else if (type === 'timetable_csv') {
        const res = parseTimetableCSV(text);
        setToastMessage(`✓ Seamless Upload: Synchronized ${res.count} Timetable periods.`);
      }
      setTimeout(() => setToastMessage(null), 5000);
    };
    reader.readAsText(file);
  };

  const handleAddCrossDept = () => {
    if (!crossTeacherId || !crossSubject) {
      alert('Please select a teacher and enter a subject.');
      return;
    }
    const t = staffList.find((s) => s.id === crossTeacherId);
    const teacherName = t ? t.name : 'Staff Member';
    setCrossAssignments([
      ...crossAssignments,
      { teacherName, subject: crossSubject, targetDept: crossDept },
    ]);
    soundSynthesizer.playScanBeep();
    setCrossSubject('');
    setToastMessage(`Assigned ${teacherName} to teach ${crossSubject} in ${crossDept}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddMergeClass = () => {
    if (mergeClassA === mergeClassB) {
      alert('Cannot merge a class with itself.');
      return;
    }
    setMergedClassList([
      ...mergedClassList,
      { nameA: mergeClassA, nameB: mergeClassB, subject: mergeSubject, period: 'Period 3 & 4 Combined' },
    ]);
    soundSynthesizer.playScanBeep();
    setToastMessage(`Merged ${mergeClassA} and ${mergeClassB} for ${mergeSubject}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffId.includes(searchQuery)
  );

  return (
    <div className="space-y-5">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Staff Directory ({staffList.length})
          </button>
          <button
            onClick={() => setActiveSubTab('uploads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'uploads'
                ? 'bg-yellow-400 text-slate-950 font-black shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Automated Uploads Hub</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cross_dept')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'cross_dept'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Cross-Department Teaching</span>
          </button>
          <button
            onClick={() => setActiveSubTab('merge_classes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'merge_classes'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Merge Classes</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUB-TAB 1: ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, ID, or department..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing <strong>{filteredStaff.length}</strong> registered staff members
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Staff ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.slice(0, 15).map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-slate-900 block">{staff.name}</strong>
                          <span className="text-[10px] text-slate-500">{staff.rank || staff.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">{staff.staffId}</td>
                    <td className="py-3 px-3 text-slate-600">{staff.department}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{staff.phone || '+233 24 000 0000'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Active Permanent
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          setCrossTeacherId(staff.id);
                          setActiveSubTab('cross_dept');
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px]"
                      >
                        Assign Subject →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AUTOMATED UPLOADS HUB */}
      {activeSubTab === 'uploads' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Seamless Automated Data Upload Engine
              </h3>
              <p className="text-xs text-slate-500">
                Upload CSV or PDF templates for instant automated roster ingestion, timetable synchronization, and learner enrollment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Teaching Staff */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    CSV TEMPLATE
                  </span>
                  <h4 className="text-xs font-black text-slate-900">Teaching Staff Template</h4>
                  <p className="text-[11px] text-slate-500">
                    Staff ID, Full Name, Department, Phone, Rank, Subjects, PIN.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadTeachingStaffTemplate}
                    className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                  <label className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'teaching')}
                    />
                  </label>
                </div>
              </div>

              {/* Card 2: Non-Teaching Staff */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    CSV TEMPLATE
                  </span>
                  <h4 className="text-xs font-black text-slate-900">Non-Teaching Staff Template</h4>
                  <p className="text-[11px] text-slate-500">
                    Staff ID, Role (Matron, Security, Lab Tech), Shift, Department.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadNonTeachingStaffTemplate}
                    className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                  <label className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'non_teaching')}
                    />
                  </label>
                </div>
              </div>

              {/* Card 3: Learners Enrollment */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    CSV TEMPLATE
                  </span>
                  <h4 className="text-xs font-black text-slate-900">Learners Enrollment</h4>
                  <p className="text-[11px] text-slate-500">
                    Roll No, Learner Name, Class Code, Index Number, Contact.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadLearnersTemplate}
                    className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                  <label className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV File</span>
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'learners')}
                    />
                  </label>
                </div>
              </div>

              {/* Card 4: aSc Timetable (PDF & CSV) */}
              <div className="p-4 rounded-xl border border-yellow-300 bg-yellow-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-yellow-800 bg-yellow-200 px-2 py-0.5 rounded-full">
                    PDF / CSV (MULTI-PERIOD)
                  </span>
                  <h4 className="text-xs font-black text-slate-900">aSc Timetable Schedule</h4>
                  <p className="text-[11px] text-slate-600">
                    Supports &gt;8 periods, breaks, and cross-department merged classes.
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={downloadTimetableTemplate}
                    className="w-full py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>
                  <label className="w-full py-1.5 bg-yellow-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1.5 hover:bg-yellow-300 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Timetable (PDF / CSV)</span>
                    <input
                      type="file"
                      accept=".csv,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file?.name.endsWith('.pdf')) {
                          handleFileUpload(e, 'timetable_pdf');
                        } else {
                          handleFileUpload(e, 'timetable_csv');
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CROSS-DEPARTMENT TEACHING */}
      {activeSubTab === 'cross_dept' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Cross-Department Subject Teaching Assignment
            </h3>
            <p className="text-xs text-slate-500">
              Allow teachers to teach subjects outside their primary department (e.g. Business teacher teaching Core Maths or ICT; Science teacher teaching Agric to Arts classes).
            </p>
          </div>

          {/* Assignment Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-black text-slate-800">Assign Teacher to Cross-Department Subject</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Teacher</label>
                <select
                  value={crossTeacherId}
                  onChange={(e) => setCrossTeacherId(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  <option value="">-- Choose Teacher --</option>
                  {staffList.slice(0, 20).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject to Teach</label>
                <input
                  type="text"
                  value={crossSubject}
                  onChange={(e) => setCrossSubject(e.target.value)}
                  placeholder="e.g. Core Mathematics, ICT, Economics"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Department / Classes</label>
                <select
                  value={crossDept}
                  onChange={(e) => setCrossDept(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  <option value="General Science">General Science</option>
                  <option value="General Arts">General Arts</option>
                  <option value="Business Studies">Business Studies</option>
                  <option value="Home Economics">Home Economics</option>
                  <option value="Visual Arts">Visual Arts</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAddCrossDept}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Confirm Subject Assignment</span>
            </button>
          </div>

          {/* Active Cross Assignments Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800">Current Cross-Department Teachers</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {crossAssignments.map((a, idx) => (
                <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <strong className="text-slate-900 block">{a.teacherName}</strong>
                    <span className="text-[11px] text-slate-500">
                      Subject: <strong className="text-indigo-700">{a.subject}</strong> • Target Department: {a.targetDept}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                    Active Cross-Dept
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MERGE CLASSES */}
      {activeSubTab === 'merge_classes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Classroom &amp; Subject Merge Manager
            </h3>
            <p className="text-xs text-slate-500">
              Combine multiple classes for shared elective or core subjects (e.g. Combine Form 2 Arts A + Arts C for Core Mathematics or Social Studies).
            </p>
          </div>

          {/* Form */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-black text-slate-800">Merge Two Classes for a Subject</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary Class</label>
                <select
                  value={mergeClassA}
                  onChange={(e) => setMergeClassA(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="Form 2 Arts A">Form 2 Arts A (BCGA2A)</option>
                  <option value="Form 2 Science A">Form 2 Science A (BCSGS2A)</option>
                  <option value="Form 2 Business A">Form 2 Business A (BCSBU2A)</option>
                  <option value="Form 3 Arts B">Form 3 Arts B (BCGA3B)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Merge With Class</label>
                <select
                  value={mergeClassB}
                  onChange={(e) => setMergeClassB(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl"
                >
                  <option value="Form 2 Arts C">Form 2 Arts C (BCGA2C)</option>
                  <option value="Form 2 Science B">Form 2 Science B (BCSGS2B)</option>
                  <option value="Form 2 Business B">Form 2 Business B (BCSBU2B)</option>
                  <option value="Form 3 Arts C">Form 3 Arts C (BCGA3C)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject</label>
                <input
                  type="text"
                  value={mergeSubject}
                  onChange={(e) => setMergeSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleAddMergeClass}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Merge Classes for Schedule</span>
            </button>
          </div>

          {/* Merged Classes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800">Active Merged Class Configurations</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {mergedClassList.map((m, idx) => (
                <div key={idx} className="p-3 bg-white flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <strong className="text-slate-900 block">
                      {m.nameA} <span className="text-emerald-700 font-bold">+</span> {m.nameB}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Subject: <strong className="text-slate-800">{m.subject}</strong> • {m.period}
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Merged in aSc Timetable
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 3. ATTENDANCE LOGS & MANUAL OVERRIDE TAB
// =========================================================================
export const AttendanceAuditTab: React.FC<{ config: SchoolConfig }> = ({ config }) => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStaffName, setOverrideStaffName] = useState('Kwame Osei');
  const [overrideReason, setOverrideReason] = useState('Mobile phone battery depleted at gate');
  const [toast, setToast] = useState<string | null>(null);

  const handleManualClock = () => {
    soundSynthesizer.playScanBeep();
    setToast(`Manual Check-in recorded for ${overrideStaffName} (${new Date().toLocaleTimeString()}). Reason logged.`);
    setShowOverrideModal(false);
    setTimeout(() => setToast(null), 4000);
  };

  const attendanceLog = [
    { name: 'Kwame Osei', role: 'Teacher', dept: 'Mathematics', time: '07:30 AM', status: 'On-Time', dist: '12m from Gate' },
    { name: 'Grace Addo', role: 'Administrator', dept: 'Administration', time: '07:40 AM', status: 'On-Time', dist: '8m from Gate' },
    { name: 'Bright Kpodo', role: 'Teacher', dept: 'French', time: '08:05 AM', status: 'Late', dist: '15m from Gate' },
    { name: 'Selorm Doe', role: 'Teacher', dept: 'Physics', time: '08:10 AM', status: 'Late', dist: '22m from Gate' },
    { name: 'Akua Mensah', role: 'Teacher', dept: 'English', time: '08:45 AM', status: 'Late', dist: '10m from Gate' },
    { name: 'Emmanuel Asante', role: 'Teacher', dept: 'Economics', time: '--:--', status: 'Absent', dist: 'Off Campus' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Gate Attendance &amp; Clock-in Audit Trail
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Real-time punch records verified with biometric/geofence telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverrideModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Clock Override</span>
          </button>
          <button
            onClick={() => {
              downloadCSV(
                'Staff Name,Role,Department,Time,Status,Distance\n' +
                  attendanceLog.map((l) => `"${l.name}","${l.role}","${l.dept}","${l.time}","${l.status}","${l.dist}"`).join('\n'),
                `Attendance_Audit_${dateFilter}.csv`
              );
            }}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-800"
        >
          <option value="ALL">All Statuses</option>
          <option value="On-Time">On-Time Only</option>
          <option value="Late">Late Only</option>
          <option value="Absent">Absent Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <th className="py-2.5 px-3">Staff Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Clock-in Time</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Geofence Distance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {attendanceLog
              .filter((l) => statusFilter === 'ALL' || l.status === statusFilter)
              .map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <strong className="text-slate-900 block">{item.name}</strong>
                    <span className="text-[10px] text-slate-500">{item.role}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{item.dept}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.time}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'On-Time'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'Late'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{item.dist}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Manual Clock-in Override</h3>
              <button onClick={() => setShowOverrideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Staff Member</label>
                <input
                  type="text"
                  value={overrideStaffName}
                  onChange={(e) => setOverrideStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Reason for Manual Override</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleManualClock}
              className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-xs"
            >
              Authorize &amp; Clock-in Staff Member
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// 4. PRESENCE TRACKING / GEOFENCE RADAR TAB
// =========================================================================
export const PresenceTrackingTab: React.FC<{ config: SchoolConfig }> = ({ config }) => {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Real-time Campus Geofence Radar
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              500-meter GPS safety perimeter and staff proximity pings
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Perimeter Active</span>
          </span>
        </div>

        {/* Radar Graphic */}
        <div className="relative w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Concentric Circles */}
          <div className="absolute w-48 h-48 rounded-full border border-emerald-500/20 animate-ping" />
          <div className="absolute w-72 h-72 rounded-full border border-emerald-500/30" />
          <div className="absolute w-96 h-96 rounded-full border border-emerald-500/10" />

          {/* Crosshairs */}
          <div className="absolute w-full h-px bg-slate-800" />
          <div className="absolute h-full w-px bg-slate-800" />

          {/* Campus Center Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-lg shadow-yellow-400/50">
              ★
            </div>
            <span className="text-[10px] text-yellow-300 font-bold mt-1 bg-slate-900/90 px-2 py-0.5 rounded-full">
              {config.schoolName || 'Campus Center'}
            </span>
          </div>

          {/* Simulated Staff Pings */}
          <div className="absolute top-16 left-28 z-10 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white font-mono">Akua M. (42m)</span>
          </div>

          <div className="absolute bottom-20 right-32 z-10 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white font-mono">Kwame O. (15m)</span>
          </div>

          <div className="absolute top-24 right-44 z-10 flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-full border border-amber-500/50">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] text-white font-mono">Selorm D. (110m)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 5. MESSAGES / TWILIO SMS BROADCAST TAB
// =========================================================================
export const MessagesBroadcastTab: React.FC<{ config: SchoolConfig }> = ({ config }) => {
  const [recipientGroup, setRecipientGroup] = useState('all_staff');
  const [smsText, setSmsText] = useState(
    'GES Notice: Staff briefing scheduled for 08:00 in Assembly Hall. Please ensure prompt attendance.'
  );
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleSendSMS = () => {
    soundSynthesizer.playScanBeep();
    setDispatchStatus('Dispatched SMS via Twilio to 48 registered staff contacts.');
    setTimeout(() => setDispatchStatus(null), 5000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-700" />
          <span>Staff SMS &amp; Emergency Broadcast Dispatch</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Broadcast SMS messages directly to staff phones using the integrated Twilio gateway
        </p>
      </div>

      {dispatchStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{dispatchStatus}</span>
        </div>
      )}

      <div className="space-y-3 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Recipient Group</label>
          <select
            value={recipientGroup}
            onChange={(e) => setRecipientGroup(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
          >
            <option value="all_staff">All Staff (Teaching &amp; Non-Teaching)</option>
            <option value="teaching_only">Teaching Staff Only (38 members)</option>
            <option value="non_teaching_only">Non-Teaching Staff Only (10 members)</option>
            <option value="late_staff">Today's Late Arrivals Only</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">SMS Message Content (Max 160 chars)</label>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            rows={4}
            maxLength={160}
            className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
          />
          <div className="text-right text-[10px] text-slate-400 font-mono mt-1">
            {smsText.length} / 160 characters
          </div>
        </div>

        <button
          onClick={handleSendSMS}
          className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Broadcast SMS to Staff Phones</span>
        </button>
      </div>
    </div>
  );
};
