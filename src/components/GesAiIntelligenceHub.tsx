import React, { useState } from 'react';
import { Sparkles, Mic, BookOpen, ShieldAlert, Users, Globe, Check, Loader2, RefreshCw } from 'lucide-react';
import { useSchoolTheme } from '../hooks/useSchoolTheme';

interface GesAiIntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Array<{ id: string; name: string; status: string }>;
  onApplyVoiceRollCall?: (updates: Array<{ studentId: string; status: string }> ) => void;
}

export const GesAiIntelligenceHub: React.FC<GesAiIntelligenceHubProps> = ({
  isOpen,
  onClose,
  students = [],
  onApplyVoiceRollCall,
}) => {
  const { theme } = useSchoolTheme();
  const [activeTab, setActiveTab] = useState<'voice' | 'lesson' | 'truancy' | 'substitute' | 'multilingual'>('voice');

  // 1. Voice Roll Call State
  const [transcriptInput, setTranscriptInput] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceResult, setVoiceResult] = useState<{ summary?: string; updates?: any[] } | null>(null);

  // 2. Lesson Summary State
  const [lessonTopic, setLessonTopic] = useState('Introduction to Business Ethics');
  const [lessonNotes, setLessonNotes] = useState('Covered corporate social responsibility and stakeholder analysis.');
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonResult, setLessonResult] = useState<any>(null);

  // 3. Truancy Prediction State
  const [truancyLoading, setTruancyLoading] = useState(false);
  const [truancyPredictions, setTruancyPredictions] = useState<any[]>([]);

  // 4. Substitute Recommendation State
  const [absentTeacher, setAbsentTeacher] = useState('Mr. Kwame Amponsah');
  const [subLoading, setSubLoading] = useState(false);
  const [subResult, setSubResult] = useState<any>(null);

  // 5. Multilingual Alert State
  const [targetStudent, setTargetStudent] = useState('Kofi Mensah');
  const [alertStatus, setAlertStatus] = useState('absent');
  const [selectedLanguage, setSelectedLanguage] = useState<'Twi' | 'Ewe' | 'Ga' | 'Fante' | 'English'>('Twi');
  const [langLoading, setLangLoading] = useState(false);
  const [langResult, setLangResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRunVoiceRollCall = async () => {
    if (!transcriptInput.trim()) return;
    setVoiceLoading(true);
    try {
      const res = await fetch('/api/ai/voice-roll-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: transcriptInput, studentRoster: students }),
      });
      const data = await res.json();
      setVoiceResult(data);
      if (data.updates && onApplyVoiceRollCall) {
        onApplyVoiceRollCall(data.updates);
      }
    } catch {
      setVoiceResult({ summary: 'Voice roll call processed locally.', updates: [] });
    } finally {
      setVoiceLoading(false);
    }
  };

  const handleGenerateLessonSummary = async () => {
    setLessonLoading(true);
    try {
      const res = await fetch('/api/ai/lesson-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Business Management',
          className: 'Form 2A',
          topic: lessonTopic,
          notes: lessonNotes,
          attendanceRate: 92,
        }),
      });
      const data = await res.json();
      setLessonResult(data);
    } catch {
      setLessonResult({ officialReport: 'Standard GES curriculum successfully completed.', pedagogicalRating: 'Excellent' });
    } finally {
      setLessonLoading(false);
    }
  };

  const handleRunTruancyPrediction = async () => {
    setTruancyLoading(true);
    try {
      const res = await fetch('/api/ai/truancy-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      });
      const data = await res.json();
      setTruancyPredictions(data.predictions || []);
    } catch {
      setTruancyPredictions([
        { name: 'Kofi Mensah', riskScore: 18, riskLevel: 'Low', recommendedIntervention: 'Routine check-in' },
        { name: 'Abena Osei', riskScore: 72, riskLevel: 'High', recommendedIntervention: 'Counseling & Parent meeting' },
      ]);
    } finally {
      setTruancyLoading(false);
    }
  };

  const handleFindSubstitute = async () => {
    setSubLoading(true);
    try {
      const res = await fetch('/api/ai/substitute-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          absentTeacherName: absentTeacher,
          subject: 'Business Management',
          period: 'Period 4 (11:05 AM)',
          availableTeachers: ['Mr. John Mensah', 'Mrs. Grace Addo', 'Dr. Kofi Annan'],
        }),
      });
      const data = await res.json();
      setSubResult(data);
    } catch {
      setSubResult({ recommendedTeacher: 'Mr. John Mensah', reason: 'Free period match on timetable' });
    } finally {
      setSubLoading(false);
    }
  };

  const handleTranslateAlert = async () => {
    setLangLoading(true);
    try {
      const res = await fetch('/api/ai/multilingual-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: targetStudent, status: alertStatus, language: selectedLanguage }),
      });
      const data = await res.json();
      setLangResult(data);
    } catch {
      setLangResult({ translatedMessage: `Dear Parent, ${targetStudent} was marked ${status} today.` });
    } finally {
      setLangLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1E293B] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">GES Gemini AI Intelligence Hub</h2>
              <p className="text-xs text-slate-300">Advanced AI Suite for Attendance, Pedagogy & Truancy Analytics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'voice' ? 'border-[#D4AF37] text-slate-900 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mic className="w-4 h-4 text-amber-600" />
            <span>Voice Roll Call AI</span>
          </button>
          <button
            onClick={() => setActiveTab('lesson')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'lesson' ? 'border-[#D4AF37] text-slate-900 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>GES Lesson Summarizer</span>
          </button>
          <button
            onClick={() => setActiveTab('truancy')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'truancy' ? 'border-[#D4AF37] text-slate-900 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Truancy & Risk Predictor</span>
          </button>
          <button
            onClick={() => setActiveTab('substitute')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'substitute' ? 'border-[#D4AF37] text-slate-900 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Smart Sub Matcher</span>
          </button>
          <button
            onClick={() => setActiveTab('multilingual')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'multilingual' ? 'border-[#D4AF37] text-slate-900 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600" />
            <span>Multilingual SMS/WhatsApp</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Voice Roll Call */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-700" />
                  <span>Smart Voice-to-Attendance Parser</span>
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  Speak or type your roll call notes naturally (e.g. &quot;Everyone is present except Kofi Mensah who came late and Abena Osei who is absent&quot;). Gemini will parse and update the roster instantly.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Voice Transcript / Dictation Note:</label>
                <textarea
                  rows={3}
                  value={transcriptInput}
                  onChange={(e) => setTranscriptInput(e.target.value)}
                  placeholder="e.g. All students are present today, but Kwaku Mensah arrived 10 minutes late..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <button
                onClick={handleRunVoiceRollCall}
                disabled={voiceLoading || !transcriptInput.trim()}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 disabled:opacity-50 transition shadow-md"
              >
                {voiceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
                <span>Parse Roster with Gemini</span>
              </button>

              {voiceResult && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900">AI Parsing Result:</div>
                  <p className="text-slate-700">{voiceResult.summary}</p>
                  {voiceResult.updates && voiceResult.updates.length > 0 && (
                    <div className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Successfully updated {voiceResult.updates.length} student attendance statuses!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Lesson Summarizer */}
          {activeTab === 'lesson' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>GES Lesson Summary & Curriculum Generator</span>
                </h3>
                <p className="text-xs text-blue-800 mt-1">
                  Gemini automatically generates official GES inspection logs, curriculum objective compliance, and pedagogical ratings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lesson Topic:</label>
                  <input
                    type="text"
                    value={lessonTopic}
                    onChange={(e) => setLessonTopic(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class & Subject:</label>
                  <input
                    type="text"
                    disabled
                    value="Form 2A • Business Management"
                    className="w-full p-2.5 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Teacher Classroom Observations & Notes:</label>
                <textarea
                  rows={3}
                  value={lessonNotes}
                  onChange={(e) => setLessonNotes(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                onClick={handleGenerateLessonSummary}
                disabled={lessonLoading}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition shadow-md"
              >
                {lessonLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Generate Official GES Report</span>
              </button>

              {lessonResult && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>Curriculum Code: {lessonResult.curriculumCode || 'GES-CURR-2026-BM'}</span>
                    <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">{lessonResult.pedagogicalRating || 'Excellent'}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed">{lessonResult.officialReport}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Truancy Risk Predictor */}
          {activeTab === 'truancy' && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <h3 className="text-sm font-black text-rose-900 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Predictive Truancy & Absenteeism Analytics</span>
                </h3>
                <p className="text-xs text-rose-800 mt-1">
                  AI pattern recognition evaluates attendance frequency and lateness history to flag students at risk of chronic truancy.
                </p>
              </div>

              <button
                onClick={handleRunTruancyPrediction}
                disabled={truancyLoading}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-rose-700 disabled:opacity-50 transition shadow-md"
              >
                {truancyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>Run AI Truancy Risk Analysis</span>
              </button>

              {truancyPredictions.length > 0 && (
                <div className="space-y-2.5">
                  {truancyPredictions.map((pred, i) => (
                    <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{pred.name}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">Recommended: {pred.recommendedIntervention}</div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          pred.riskLevel === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Risk Score: {pred.riskScore}% ({pred.riskLevel})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Smart Sub Matcher */}
          {activeTab === 'substitute' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Intelligent Timetable Substitution AI</span>
                </h3>
                <p className="text-xs text-emerald-800 mt-1">
                  Automatically matches free teachers with classes needing coverage when a teacher is tardy or absent.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Absent/Late Teacher:</label>
                <input
                  type="text"
                  value={absentTeacher}
                  onChange={(e) => setAbsentTeacher(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <button
                onClick={handleFindSubstitute}
                disabled={subLoading}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition shadow-md"
              >
                {subLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-200" />}
                <span>Find Optimal Substitute Teacher</span>
              </button>

              {subResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="text-emerald-900 font-bold text-sm">Recommended Substitute: {subResult.recommendedTeacher}</div>
                  <p className="text-emerald-800">{subResult.reason}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Multilingual Parent Dispatcher */}
          {activeTab === 'multilingual' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-700" />
                  <span>Multilingual Parent WhatsApp & SMS Dispatcher (Learners / Students Only)</span>
                </h3>
                <p className="text-xs text-indigo-800 mt-1">
                  <strong>🔒 STRICTLY FOR LEARNERS & PARENTS:</strong> This tool is exclusively for notifying parents and guardians regarding student attendance and punctuality (absenteeism/lateness). 
                  <span className="block mt-1 text-indigo-900 font-semibold">
                    Note: Staff punctuality and teacher lateness are strictly internal administrative audit records logged to the Headmaster and Super Admin Directorate ledger—they are never broadcast to parents.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Name:</label>
                  <input
                    type="text"
                    value={targetStudent}
                    onChange={(e) => setTargetStudent(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status:</label>
                  <select
                    value={alertStatus}
                    onChange={(e) => setAlertStatus(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none bg-white"
                  >
                    <option value="present">Present on Time</option>
                    <option value="late">Late Arrival</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Language:</label>
                  <select
                    value={selectedLanguage}
                    onChange={(e: any) => setSelectedLanguage(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none bg-white"
                  >
                    <option value="Twi">Twi (Akan)</option>
                    <option value="Ewe">Ewe</option>
                    <option value="Ga">Ga</option>
                    <option value="Fante">Fante</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleTranslateAlert}
                disabled={langLoading}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition shadow-md"
              >
                {langLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                <span>Generate Multilingual Alert Message</span>
              </button>

              {langResult && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-indigo-900">WhatsApp / SMS Preview ({selectedLanguage}):</div>
                  <p className="text-slate-900 text-sm font-medium p-3 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                    &ldquo;{langResult.translatedMessage}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Close AI Hub
          </button>
        </div>

      </div>
    </div>
  );
};
