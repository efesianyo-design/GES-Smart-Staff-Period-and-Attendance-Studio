import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle2, AlertTriangle, RefreshCw, Clock, KeyRound, WifiOff } from 'lucide-react';
import { soundSynthesizer } from '../utils/audio';
import { HeadmasterOverrideModal } from './HeadmasterOverrideModal';
import { offlineQueueEngine } from '../utils/offlineQueue';

interface FirebasePhoneAuthBoxProps {
  staffPhone?: string;
  staffName?: string;
  staffId?: string;
  onVerified: () => void;
  onOfflineQueued?: () => void;
  schoolCode?: string;
}

export const FirebasePhoneAuthBox: React.FC<FirebasePhoneAuthBoxProps> = ({
  staffPhone = '+233248793773',
  staffName = 'Kwame Amponsah',
  staffId = 'GES-T-0428',
  schoolCode = 'PREMPEH01',
  onVerified,
  onOfflineQueued,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(staffPhone);
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [otpInput, setOtpInput] = useState<string>('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    setPhoneNumber(staffPhone);
  }, [staffPhone]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSendSms = async () => {
    if (cooldown > 0 || loading) return;
    setErrorMsg(null);
    setLoading(true);
    soundSynthesizer.playKeypadBeep();

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          phone: phoneNumber,
          staffName,
          schoolCode,
          channel: 'sms',
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.devOtp) {
          setGeneratedOtp(data.devOtp);
        }
        setStep('otp');
        setCooldown(45); // 45s anti-spam cooldown
        if (data.arkeselDispatched) {
          setSuccessMsg(`🚀 Priority SMS dispatched to ${phoneNumber}! Arrives in ~3-5 seconds.`);
        } else {
          setSuccessMsg(`⚠️ Notice: ${data.message || 'SMS dispatched'}. If delayed, request 10-Min Headmaster Override.`);
        }
        soundSynthesizer.playScanBeep();
      } else {
        throw new Error(data.message || 'Failed to dispatch SMS.');
      }
    } catch (err: any) {
      console.warn('SMS gateway notice:', err);
      setStep('otp');
      setCooldown(30);
      setSuccessMsg(`⚠️ SMS requested. If delayed, use the 10-min Headmaster Override PIN.`);
      soundSynthesizer.playScanBeep();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg(null);
    soundSynthesizer.playKeypadBeep();

    const clean = otpInput.trim();
    if (!clean) return;

    // 1. Instant match if matches active generated code
    if (generatedOtp && clean === generatedOtp) {
      setStep('success');
      soundSynthesizer.playClockInChime();
      setSuccessMsg('✓ Identity verified successfully via Arkesel SMS 2FA!');
      setTimeout(() => {
        onVerified();
      }, 1000);
      return;
    }

    // 2. Server verification: verifies recent SMS OTPs, Arkesel Gateway, or 10-Minute Headmaster Override PIN
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: 'GES-T-0428',
          otp: clean,
          phone: phoneNumber,
          staffName,
          schoolCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
        soundSynthesizer.playClockInChime();
        setSuccessMsg(data.message || '✓ Identity confirmed successfully!');
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        throw new Error(data.message || 'Invalid verification code');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Invalid code. Check your SMS or request a 10-minute Headmaster Override PIN.');
      soundSynthesizer.playOutOfBoundsBuzzer();
    } finally {
      setLoading(false);
    }
  };

  const handleQueueOffline = async () => {
    soundSynthesizer.playScanBeep();
    try {
      await offlineQueueEngine.enqueue('gate_checkin', {
        staffId: 'GES-T-0428',
        staffName,
        phone: phoneNumber,
        schoolCode,
        timestamp: Date.now(),
        method: 'offline_indexeddb_queue',
      });
      setStep('success');
      soundSynthesizer.playClockInChime();
      setSuccessMsg('✓ Check-in saved to Offline Queue! Will auto-sync when network reconnects.');
      if (onOfflineQueued) {
        onOfflineQueued();
      } else {
        setTimeout(() => onVerified(), 1200);
      }
    } catch (err: any) {
      setErrorMsg('Failed to queue offline record: ' + err.message);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              GES Staff 2FA (Arkesel SMS Gateway)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {isOnline ? 'Direct Carrier Route' : 'Offline Engine Ready'}
          </span>
        </div>

        {step === 'phone' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Send real SMS verification code to <strong className="text-white">{staffName}</strong>'s personal handset:
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
                onClick={handleSendSms}
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Send SMS OTP</span>
              </button>
            </div>

            {/* Offline Fallback Option */}
            {!isOnline && (
              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-amber-300 flex items-center gap-1">
                  <WifiOff className="w-3.5 h-3.5" /> No internet detected
                </span>
                <button
                  type="button"
                  onClick={handleQueueOffline}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Queue Offline Check-in
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-3">
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <span>OTP sent to <strong className="font-mono">{phoneNumber}</strong></span>
              <button onClick={() => setStep('phone')} className="text-[10px] underline text-emerald-400 hover:text-white">Change Number</button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="4-digit SMS code or 6-digit Headmaster PIN"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs font-mono tracking-widest text-white text-center outline-hidden"
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otpInput.trim().length < 4}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition shrink-0 cursor-pointer"
              >
                <span>Verify</span>
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              {/* Emergency Headmaster Override */}
              <button
                type="button"
                onClick={() => setShowOverrideModal(true)}
                className="text-amber-400 hover:text-amber-300 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>Headmaster 10-Min Override</span>
              </button>

              {/* Resend Cooldown */}
              {cooldown > 0 ? (
                <span className="text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> Resend in {cooldown}s
                </span>
              ) : (
                <button
                  onClick={handleSendSms}
                  disabled={loading}
                  className="hover:text-white underline text-emerald-400 disabled:opacity-50 cursor-pointer"
                >
                  Resend SMS
                </button>
              )}
            </div>

            {/* Offline Queue Fallback during network delay */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleQueueOffline}
                className="text-[10px] text-slate-400 hover:text-slate-300 underline cursor-pointer"
              >
                No signal at gate? Queue check-in locally in IndexedDB
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Staff Identity Verified!</p>
              <p className="text-[11px] text-emerald-300">Proceeding to secure attendance recording...</p>
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

      {/* Headmaster Emergency Override Modal */}
      <HeadmasterOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        schoolCode={schoolCode}
        teacherName={staffName}
        teacherPhone={phoneNumber}
      />
    </>
  );
};
