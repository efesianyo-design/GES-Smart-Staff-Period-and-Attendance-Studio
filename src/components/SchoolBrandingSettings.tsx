import React, { useState, useRef } from 'react';
import { useSchoolTheme } from '../hooks/useSchoolTheme';
import { extractColorsFromLogo, getColorDistance } from '../utils/extractColorsFromLogo';
import { SCHOOL_THEMES } from '../config/schoolThemes';
import { soundSynthesizer } from '../utils/audio';
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Palette,
  RotateCcw,
  Sliders,
  Shield,
  Building2,
} from 'lucide-react';

export function SchoolBrandingSettings({
  onClose,
}: {
  onClose?: () => void;
}) {
  const { theme, schoolCode, setSchoolCode, updateCustomTheme } = useSchoolTheme();

  const [previewUrl, setPreviewUrl] = useState<string | null>(theme.logo || null);
  const [extractedPrimary, setExtractedPrimary] = useState<string>(theme.primary);
  const [extractedSecondary, setExtractedSecondary] = useState<string>(theme.secondary);
  const [manualPrimary, setManualPrimary] = useState<string>(theme.primary);
  const [manualSecondary, setManualSecondary] = useState<string>(theme.secondary);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'preset'>('upload');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid PNG or JPG image.');
      return;
    }

    setIsProcessing(true);
    soundSynthesizer.playBeep(520, 100);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);

      try {
        const colors = await extractColorsFromLogo(file);
        setExtractedPrimary(colors.primary);
        setExtractedSecondary(colors.secondary);
        setManualPrimary(colors.primary);
        setManualSecondary(colors.secondary);
        soundSynthesizer.playSuccessChime();
        showToast(`Colors extracted: Primary ${colors.primary}, Secondary ${colors.secondary}`);
      } catch (err) {
        console.warn('Extraction error', err);
        showToast('Extracted with standard fallback colors.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyLogoColors = () => {
    soundSynthesizer.playClockInChime();
    updateCustomTheme({
      primary: extractedPrimary,
      secondary: extractedSecondary,
      logo: previewUrl || undefined,
    });
    showToast(`Theme updated from your crest! Primary ${extractedPrimary}`);
  };

  const handleApplyManualColors = () => {
    soundSynthesizer.playClockInChime();
    updateCustomTheme({
      primary: manualPrimary,
      secondary: manualSecondary,
      logo: theme.logo || undefined,
    });
    showToast(`Custom theme colors saved! Primary ${manualPrimary}`);
  };

  const handleResetToDefault = () => {
    soundSynthesizer.playBeep(400, 100);
    localStorage.removeItem(`theme_${schoolCode}`);
    localStorage.removeItem(`theme_${theme.code}`);
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              School Branding &amp; Crest Auto-Theming
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Upload your official school crest or logo. The system extracts brand colors and automatically styles Kiosk TV, Mobile Attendance, and Teacher Timetables.
          </p>
        </div>

        {/* Current Active School Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
          <span
            className="w-3 h-3 rounded-full border border-slate-300 shadow-xs"
            style={{ backgroundColor: theme.primary }}
          />
          <span className="font-mono">{theme.code}</span>
          <span className="text-slate-400">•</span>
          <span className="truncate max-w-[140px]">{theme.shortName}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'upload'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Crest</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'manual'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Pick Manually</span>
        </button>

        <button
          onClick={() => setActiveTab('preset')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'preset'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>SHS Default Presets (10)</span>
        </button>
      </div>


      {/* TAB 1: UPLOAD CREST / LOGO */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl p-8 text-center cursor-pointer transition group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-xs">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Click or Drag School Crest</p>
                <p className="text-xs text-slate-500 mt-1">High-quality PNG or JPG (Min 200x200px)</p>
              </div>
            </div>
          </div>

          {/* Preview & Extraction Area */}
          {previewUrl && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-fadeIn">
              <div className="flex items-start gap-5">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 p-2 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  <img src={previewUrl} alt="Crest Preview" className="max-w-full max-h-full object-contain" />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extracted Brand Palette:</span>
                    {isProcessing && <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: extractedPrimary }} />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{extractedPrimary}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: extractedSecondary }} />
                      <span className="text-[10px] font-mono font-bold text-slate-700">{extractedSecondary}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyLogoColors}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition active:scale-95"
                  >
                    Apply Auto-Branding
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MANUAL PICKER */}
      {activeTab === 'manual' && (
        <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-600 font-medium">
            Fine-tune the exact hex color codes for your campus presence display:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Picker */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-extrabold text-slate-800 block uppercase tracking-wider">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={manualPrimary}
                  onChange={(e) => setManualPrimary(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={manualPrimary}
                  onChange={(e) => setManualPrimary(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Secondary Picker */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
              <label className="text-xs font-extrabold text-slate-800 block uppercase tracking-wider">
                Secondary / Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={manualSecondary}
                  onChange={(e) => setManualSecondary(e.target.value.toUpperCase())}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  value={manualSecondary}
                  onChange={(e) => setManualSecondary(e.target.value.toUpperCase())}
                  className="px-3 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApplyManualColors}
              style={{ backgroundColor: manualPrimary }}
              className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md hover:opacity-90 active:scale-98 transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-yellow-300" />
              <span>Save &amp; Apply Manual Colors</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PRESET SWITCHER */}
      {activeTab === 'preset' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 font-medium">
            Select one of the 10 official Ghana Senior High School preset brand themes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.values(SCHOOL_THEMES).map((s) => (
              <button
                key={s.code}
                onClick={() => {
                  setSchoolCode(s.code);
                  soundSynthesizer.playClockInChime();
                  showToast(`Theme switched to ${s.name}`);
                }}
                className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  theme.code === s.code
                    ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="text-xs font-black text-slate-900 block truncate">{s.name}</span>
                  <span className="text-[10px] text-slate-400 font-medium truncate">{s.region}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: s.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: s.secondary }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
