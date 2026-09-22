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
      logo: previewUrl || undefined,
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
          <span>Upload Crest / Logo</span>
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
            className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition duration-150 flex flex-col items-center justify-center space-y-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-600">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-slate-800">
              Click to select or drag and drop School Crest (PNG, JPG)
            </p>
            <p className="text-[11px] text-slate-400">
              High resolution square or circular crests recommended (max 5MB)
            </p>
          </div>

          {/* Preview & Extracted Colors Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {/* Left: 80px Preview Circle */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-300 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Crest Preview"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="text-2xl text-slate-300">🏛️</span>
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Crest Preview
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                  {theme.name}
                </h4>
                <p className="text-[11px] text-slate-500">{theme.slogan}</p>
                {isProcessing && (
                  <span className="text-[11px] text-amber-600 font-bold animate-pulse mt-1 inline-block">
                    Analyzing pixel histogram...
                  </span>
                )}
              </div>
            </div>

            {/* Right: Extracted Color Bubbles */}
            <div className="flex flex-col justify-center space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Extracted Brand Colors
              </span>
              <div className="flex items-center gap-3">
                {/* Primary Bubble */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                  <div
                    className="w-6 h-6 rounded-full border border-slate-300 shadow-inner shrink-0"
                    style={{ backgroundColor: extractedPrimary }}
                  />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Primary</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{extractedPrimary}</span>
                  </div>
                </div>

                {/* Secondary Bubble */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                  <div
                    className="w-6 h-6 rounded-full border border-slate-300 shadow-inner shrink-0"
                    style={{ backgroundColor: extractedSecondary }}
                  />
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">Secondary</span>
                    <span className="text-xs font-mono font-bold text-slate-800">{extractedSecondary}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleApplyLogoColors}
              style={{ backgroundColor: extractedPrimary }}
              className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md hover:opacity-90 active:scale-98 transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Apply Colors from Logo</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Official GES Standard</span>
            </button>
          </div>
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
