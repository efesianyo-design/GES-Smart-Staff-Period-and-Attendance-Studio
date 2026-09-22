import React from 'react';
import { SchoolBrandingSettings } from '../../../../components/SchoolBrandingSettings';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function AdminSettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Institutional Settings &amp; Branding
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Manage school credentials, hardware terminal profiles, and official institutional branding
          </p>
        </div>
      </div>

      <SchoolBrandingSettings />
    </div>
  );
}
