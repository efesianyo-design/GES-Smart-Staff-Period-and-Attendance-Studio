import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, Send, ExternalLink, AlertTriangle, Coins } from 'lucide-react';

interface BalanceData {
  smsBalance: number;
  mainBalance: string;
  isLowBalance: boolean;
  threshold: number;
  whatsappAlertUrl?: string;
  alertMessage?: string;
  lastChecked?: string;
}

export const ArkeselBalanceGuardCard: React.FC<{ schoolName?: string }> = ({
  schoolName = 'Prempeh College',
}) => {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/arkesel/balance?schoolName=${encodeURIComponent(schoolName)}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result);
      } else {
        setError(result.message || 'Unable to check Arkesel balance');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to Arkesel Balance Guard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [schoolName]);

  const smsBalance = data?.smsBalance ?? 0;
  const isLow = data?.isLowBalance ?? false;

  return (
    <div className={`rounded-2xl border p-4 shadow-xl transition space-y-3.5 ${
      isLow
        ? 'bg-rose-950/20 border-rose-800/80 text-rose-200'
        : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          {isLow ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          )}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Arkesel Balance Guard (Daily 06:00 GMT Check)
            </h4>
            <span className="text-[10px] text-slate-400">
              Automated threshold monitoring for teacher 2FA OTP dispatch
            </span>
          </div>
        </div>

        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
          title="Refresh Arkesel balance"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
            SMS Credits Remaining
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black font-mono ${
              isLow ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {loading ? '...' : smsBalance}
            </span>
            <span className="text-[10px] text-slate-500">units</span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-1">
            Minimum Threshold: 50
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
            Prepaid Wallet Balance
          </span>
          <div className="flex items-baseline gap-1.5">
            <Coins className="w-4 h-4 text-amber-400 inline" />
            <span className="text-lg font-bold font-mono text-amber-300">
              {loading ? '...' : data?.mainBalance || 'GHS 0.00'}
            </span>
          </div>
          <span className="text-[9px] text-slate-500 block mt-1">
            Arkesel Corporate Account
          </span>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">
            Gateway Status
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isLow
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
            {isLow ? 'Action Required' : 'Adequate Balance'}
          </span>
          <span className="text-[9px] text-slate-500 block mt-1 truncate">
            {data?.lastChecked ? `Checked: ${new Date(data.lastChecked).toLocaleTimeString()}` : 'Live Monitoring'}
          </span>
        </div>
      </div>

      {/* Low Balance Alert Banner */}
      {isLow && (
        <div className="p-3 bg-rose-950/80 border border-rose-700/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Critical Warning: Balance below 50 SMS credits!
            </p>
            <p className="text-[11px] text-rose-300/90 leading-relaxed">
              When Arkesel balance reaches 0, staff clock-in SMS OTP delivery will stall. Please top up your account immediately or notify the school Bursar.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-amber-950/40 border border-amber-800/80 rounded-xl text-[11px] text-amber-300">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {data?.whatsappAlertUrl && (
          <a
            href={data.whatsappAlertUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Alert Bursar & Headmaster (WhatsApp)</span>
          </a>
        )}

        <a
          href="https://sms.arkesel.com/user/top-up"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700"
        >
          <span>Top Up Arkesel</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </div>
  );
};
