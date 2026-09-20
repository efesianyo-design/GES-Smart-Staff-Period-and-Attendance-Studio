import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X,
  Share2,
  ShieldAlert,
  Smartphone,
  BookOpen,
  Users,
  Shield,
} from 'lucide-react';
import { PORTAL_DEFINITIONS, PortalType, getFullPortalUrl } from '../utils/routes';

interface PortalLinksShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPortal: (portal: PortalType) => void;
}

export const PortalLinksShareModal: React.FC<PortalLinksShareModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPortal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 shadow-2xl shadow-slate-950 space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Direct Portal Web Links &amp; Staff Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Send streamlined, distraction-free links to staff so they only see their specific tools
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Alert */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2.5">
          <Share2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Staff Privacy &amp; Tab-Free Experience:</strong> Staff accessing{' '}
            <code className="px-1.5 py-0.5 rounded bg-emerald-950 font-mono text-white text-[11px]">
              /attendance
            </code>{' '}
            will NOT see administrator tabs, institutional audit ledgers, or diagnostic traces. They get an instant, dedicated clock-in screen!
          </div>
        </div>

        {/* Portal Links Cards */}
        <div className="space-y-3">
          {PORTAL_DEFINITIONS.map((def) => {
            const url = getFullPortalUrl(def.id);
            const isCopied = copiedId === def.id;

            return (
              <div
                key={def.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{def.icon}</span>
                    <span className="font-bold text-white text-sm">{def.label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-mono text-[10px]">
                      {def.path}
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-400 font-medium bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-500/30">
                    For: {def.targetAudience}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{def.description}</p>

                {/* URL Bar & Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 font-mono text-[11px] text-slate-300 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 truncate select-all">
                    {url}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(def.id, url)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToPortal(def.id);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                    title="Switch to this view now"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Open</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
