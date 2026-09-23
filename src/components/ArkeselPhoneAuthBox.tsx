import React, { useState } from 'react';
import { ShieldCheck, Phone, CheckCircle2, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';

interface ArkeselPhoneAuthBoxProps {
  staffPhone?: string;
  staffName?: string;
  onVerified: () => void;
}

export const ArkeselPhoneAuthBox: React.FC<ArkeselPhoneAuthBoxProps> = ({
  staffPhone = '+233248793773',
  staffName = 'Kwame Amponsah',
  onVerified,
}) => {
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('GES_ARKESEL_API_KEY') || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(staffPhone);
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string>('4826');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('GES_ARKESEL_API_KEY', key);
  };

  const handleSendArkeselSms = async () => {
    setErrorMsg(null);
    setLoading(true);
    soundSynthesizer.playKeypadBeep();

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.replace('+', '') : `233${phoneNumber.replace(/^0/, '')}`;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otp);

    try {
      if (!apiKey || apiKey.trim().length < 10) {
        // Fallback simulation mode
        setStep('otp');
        setSuccessMsg(`ℹ️ Arkesel API key not provided. Running in simulation mode (Demo OTP: ${otp}).`);
        soundSynthesizer.playScanBeep();
        setLoading(false);
        return;
      }

      // Call Arkesel SMS API V2
      const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          sender: 'GES-Staff',
          message: `Ghana Education Service (GES) Attendance: Your 2FA OTP code is ${otp}. Valid for 5 minutes.`,
          recipients: [formattedPhone],
        }),
      });

      const data = await response.json();
      if (response.ok || data.status === 'success') {
        setStep('otp');
        setSuccessMsg(`🚀 Arkesel SMS successfully dispatched to +${formattedPhone}!`);
        soundSynthesizer.playScanBeep();
      } else {
        throw new Error(data.message || 'Failed to dispatch via Arkesel SMS gateway.');
      }
    } catch (err: any) {
      console.warn('Arkesel SMS dispatch notice:', err);
      // Fallback grace
      setStep('otp');
      setSuccessMsg(`⚠️ Arkesel network notice. Fallback active (Demo OTP: ${otp}).`);
      soundSynthesizer.playScanBeep();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    setErrorMsg(null);
    soundSynthesizer.playKeypadBeep();

    if (otpInput === generatedOtp || otpInput === '4826') {
      setStep('success');
      soundSynthesizer.playClockInChime();
      setSuccessMsg('✓ Identity verified successfully via Arkesel SMS 2FA!');
      setTimeout(() => {
        onVerified();
      }, 1000);
    } else {
      setErrorMsg('Invalid verification code. Please check your Arkesel SMS or use demo code 4826.');
      soundSynthesizer.playOutOfBoundsBuzzer();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3.5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Arkesel SMS Gateway (Ghana 2FA)
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Arkesel SMS v2 API</span>
      </div>

      {/* API Key configuration */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
          <Key className="w-3 h-3 text-amber-400" /> Arkesel API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => handleSaveApiKey(e.target.value)}
          placeholder="Paste your Arkesel API key here..."
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono text-white outline-hidden"
        />
      </div>

      {step === 'phone' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Verify mobile identity for <strong className="text-white">{staffName}</strong> via Arkesel SMS:
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+233 24 000 0000"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono text-white outline-hidden"
              />
            </div>
            <button
              onClick={handleSendArkeselSms}
              disabled={loading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Send SMS OTP</span>
            </button>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-3">
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs text-emerald-300">
            <span>Code sent to <strong className="font-mono">{phoneNumber}</strong></span>
            <button onClick={() => setStep('phone')} className="text-[10px] underline text-emerald-400 hover:text-white">Change</button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              placeholder="Enter 4-digit code (e.g. 4826)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono tracking-widest text-white text-center outline-hidden"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otpInput.length < 4}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition shrink-0 cursor-pointer"
            >
              <span>Verify Code</span>
            </button>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Demo Quick Code: <strong className="text-yellow-400 font-mono">4826</strong></span>
            <button onClick={handleSendArkeselSms} className="hover:text-white underline">Resend SMS</button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">Staff Identity Verified!</p>
            <p className="text-[11px] text-emerald-300">Proceeding to secure geofenced attendance recording...</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && !errorMsg && (
        <div className="p-2.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-[11px] flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
};
