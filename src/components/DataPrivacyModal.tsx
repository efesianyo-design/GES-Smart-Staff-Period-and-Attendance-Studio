import React from 'react';
import { Shield, Lock, FileText, CheckCircle, AlertTriangle, EyeOff, UserCheck, X } from 'lucide-react';

interface DataPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
}

export const DataPrivacyModal: React.FC<DataPrivacyModalProps> = ({
  isOpen,
  onClose,
  schoolName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl shadow-emerald-950/50 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Data Privacy &amp; Legal Compliance Framework
              </h3>
              <p className="text-xs text-emerald-400/90 font-mono">
                Ghana Data Protection Act, 2012 (Act 843) • GES HR Policy
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Institutional Affirmation */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-300 text-sm">Official Institutional Privacy Compliance</h4>
              <p className="text-xs text-emerald-200/80 mt-1">
                This smart portal deployed for <strong>{schoolName}</strong> complies strictly with the statutory provisions of the <strong>Ghana Data Protection Commission (DPC)</strong> under Act 843 and the <strong>Ghana Education Service (GES) Code of Conduct</strong>.
              </p>
            </div>
          </div>

          {/* Core Principles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statutory Safeguards &amp; Protections</h4>

            {/* Principle 1 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Strict Staff-Level Confidentiality Shield</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  General teaching and non-teaching personnel can strictly access only their personal attendance record and assigned teaching periods. Personal phone numbers, salary ranks, personal reflections, disciplinary logs, and administrative audit ledgers are cryptographically shielded from peer staff.
                </p>
              </div>
            </div>

            {/* Principle 2 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <Lock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Data Minimization &amp; Geofence Privacy</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  GPS coordinates are captured exclusively at the moment of clock-in strictly to confirm physical presence within the campus boundary radius. Continuous geolocation tracking is strictly prohibited and technically disabled.
                </p>
              </div>
            </div>

            {/* Principle 3 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Mandatory Audit Justification for Record Corrections</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  To protect staff rights against arbitrary record tampering, no administrator can delete or "unclock" an entry without providing an audited, permanent administrative explanation and digital signature recorded in the immutable audit ledger.
                </p>
              </div>
            </div>

            {/* Principle 4 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Brute-Force Attack Prevention &amp; Account Protection</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  In compliance with cyber security standards, 5 consecutive failed PIN/OTP attempts trigger an automatic 5-minute security lockout. All unauthorized attempts are logged for administrative review to protect staff identities from identity theft.
                </p>
              </div>
            </div>

            {/* Principle 5 */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
              <FileText className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Multi-School Role Scoping</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  School Administrators can ONLY view staff, classes, and logs peculiar to their designated school. Only authorized GES Regional / National Super Administrators have cross-school oversight.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            <p>
              Data Controller: Ghana Education Service (GES) • Technical Provider: Sir Eugene Technologies • For data rectification requests or inquiries, contact your School ICT Coordinator or the GES Regional Directorate.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm transition-colors shadow-lg shadow-emerald-950/50"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
