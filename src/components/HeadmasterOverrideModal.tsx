import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, Clock, Copy, Check, Send, AlertTriangle, X } from 'lucide-react';

interface HeadmasterOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolCode?: string;
  teacherName?: string;
  teacherPhone?: string;
}

export const HeadmasterOverrideModal: React.FC<HeadmasterOverrideModalProps> = ({
  isOpen,
  onClose,
  schoolCode = 'PREMPEH01',
  teacherName = 'Staff Member',
  teacherPhone,
}) => {
  const [headmasterPin, setHeadmasterPin] = useState<string>('');
  const [reason, setReason] = useState<string>('SMS Delay / Network Outage');
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [expiresInSeconds, setExpiresInSeconds] = useState<number>(600);
  const [whatsappShareUrl, setWhatsappShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!generatedPin || expiresInSeconds <= 0) return;
    const interval = setInterval(() => {
      setExpiresInSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [generatedPin, expiresInSeconds]);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/headmaster-override/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headmasterPin,
          schoolCode,
          reason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedPin(data.overridePin);
        setExpiresInSeconds(data.expiresInSeconds || 600);

        // Customize whatsapp share url if teacherPhone is provided
        const cleanPhone = (teacherPhone || '').replace(/[^0-9]/g, '');
        const shareMsg = `*GES HEADMASTER EMERGENCY 2FA OVERRIDE PIN*\n\nStaff: *${teacherName}*\nEmergency PIN: *${data.overridePin}*\nValidity: *10 Minutes Only*\nAuthorized by Headmaster for attendance clock-in.`;
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareMsg)}`
          : `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
        setWhatsappShareUrl(waUrl);
      } else {
        setErrorMsg(data.message || 'Failed to generate override PIN.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server error while generating override code.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedPin) return;
    navigator.clipboard.writeText(generatedPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-white space-y-4 p-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Headmaster Emergency 2FA Override
              </h3>
              <p className="text-[11px] text-slate-400">
                10-Minute time-limited authorization token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!generatedPin ? (
          <form onSubmit={handleGenerate} className="space-y-3.5">
            <div className="p-3 bg-amber-950/30 border border-amber-700/60 rounded-xl text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Replaces Static Master Code (4826)</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                This token is strictly single-use and auto-expires in 10 minutes. It logs an official audit record in the GES Headmaster security ledger.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Staff Member
              </label>
              <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300">
                {teacherName} {teacherPhone ? `(${teacherPhone})` : ''}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Override Justification
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-hidden focus:border-amber-500"
              >
                <option value="SMS Delay / Network Outage">SMS Delay / Network Outage</option>
                <option value="Teacher Handset Battery Depleted">Teacher Handset Battery Depleted</option>
                <option value="Arkesel SMS Gateway Depleted">Arkesel SMS Gateway Depleted</option>
                <option value="Official Headmaster Discretion">Official Headmaster Discretion</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Enter Headmaster Master PIN (Default: 1234)
              </label>
              <input
                type="password"
                maxLength={6}
                value={headmasterPin}
                onChange={(e) => setHeadmasterPin(e.target.value)}
                placeholder="Enter 4-digit Master PIN"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-center tracking-widest text-white outline-hidden focus:border-amber-500"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !headmasterPin}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{loading ? 'Authorizing...' : 'Generate 10-Min Override PIN'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Generated PIN Box */}
            <div className="text-center p-4 bg-slate-950 border border-amber-500/50 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active 10-Minute Override Token
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-amber-400">
                {generatedPin}
              </div>

              {/* Countdown Timer */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold ${
                expiresInSeconds < 120
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>Expires in: {formatCountdown(expiresInSeconds)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied PIN' : 'Copy PIN'}</span>
              </button>

              {whatsappShareUrl && (
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </a>
              )}
            </div>

            <button
              onClick={() => {
                setGeneratedPin(null);
                setHeadmasterPin('');
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white underline pt-1 cursor-pointer"
            >
              Generate another code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
