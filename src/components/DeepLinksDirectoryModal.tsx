import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Shield,
  Layers,
  Sparkles,
  Smartphone,
  X,
  Share2,
  Info,
} from 'lucide-react';
import { PORTAL_DEFINITIONS, PortalType, getFullPortalUrl } from '../utils/routes';
import { DynamicQrMatrix } from './DynamicQrMatrix';

interface DeepLinksDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPortal: (portal: PortalType, subType?: 'teaching' | 'non_teaching') => void;
  schoolName: string;
}

export const DeepLinksDirectoryModal: React.FC<DeepLinksDirectoryModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPortal,
  schoolName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrModal, setActiveQrModal] = useState<{
    url: string;
    label: string;
    description: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopyUrl = (url: string, id: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
  };

  const getPrivacyBadgeColor = (level: string) => {
    switch (level) {
      case 'Staff Only':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30';
      case 'Supervisors':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/30';
      case 'School Admin':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/30';
      case 'GES Super Admin':
        return 'bg-purple-950/80 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Dedicated Portal Deep Links Directory
              </h3>
              <p className="text-xs text-indigo-300/90">
                Direct, role-scoped URLs for {schoolName} • Staff and Administrators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div className="px-4 sm:px-5 py-3 bg-indigo-950/30 border-b border-indigo-900/30 flex items-start gap-2.5 text-xs text-indigo-200">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span>
              <strong>How to access &amp; deploy:</strong> Bookmark these exact links in your phone browser, share on staff WhatsApp groups, or print the QR codes for classroom &amp; noticeboard doors. Staff accessing their dedicated link only see what is relevant to them without confidential admin data!
            </span>
          </div>
        </div>

        {/* Portal Links List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 divide-y divide-slate-800/60">
          {PORTAL_DEFINITIONS.map((def, idx) => {
            const isNonTeaching = def.path.includes('non_teaching');
            const fullUrl = getFullPortalUrl(def.id, isNonTeaching ? 'non_teaching' : 'teaching');
            const uniqueId = `${def.id}-${isNonTeaching ? 'non_teaching' : 'teaching'}-${idx}`;
            const isCopied = copiedId === uniqueId;

            return (
              <div key={uniqueId} className="pt-3.5 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left Info */}
                <div className="space-y-1.5 flex-1 pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl select-none">{def.icon}</span>
                    <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                      {def.label}
                    </h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPrivacyBadgeColor(
                        def.privacyLevel
                      )}`}
                    >
                      {def.privacyLevel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {def.description}
                  </p>

                  {/* Badges & Target Audience */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-300 font-medium">
                      Audience: <strong className="text-slate-200">{def.targetAudience}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    {def.badges.map((b) => (
                      <span
                        key={b}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Monospace URL Path */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 select-all max-w-full truncate">
                      {fullUrl}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => handleCopyUrl(fullUrl, uniqueId)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    title="Copy full URL to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setActiveQrModal({
                        url: fullUrl,
                        label: def.label,
                        description: def.description,
                      })
                    }
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Generate QR code for this deep link"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToPortal(def.id, isNonTeaching ? 'non_teaching' : 'teaching');
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-950/40"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            All links work in browser, PWA standalone, or added to phone home screen.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Directory
          </button>
        </div>
      </div>

      {/* Sub-modal: QR Code Generator for Printing / Scanning */}
      {activeQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl text-center space-y-4">
            <h4 className="text-base font-bold text-white">{activeQrModal.label}</h4>
            <p className="text-xs text-slate-300">{activeQrModal.description}</p>

            <div className="p-4 rounded-xl bg-white mx-auto w-fit shadow-lg flex items-center justify-center">
              <DynamicQrMatrix value={activeQrModal.url} size={180} />
            </div>

            <p className="text-[11px] font-mono text-emerald-400 break-all select-all">
              {activeQrModal.url}
            </p>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(activeQrModal.url);
                    alert('URL copied to clipboard!');
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy URL
              </button>
              <button
                onClick={() => setActiveQrModal(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
