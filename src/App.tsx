import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './utils/authContext';
import { RouteGuard } from './middleware';

// Layouts
import KioskLayout from './app/(kiosk)/layout';
import StaffLayout from './app/(staff)/layout';
import SchoolLayout from './app/(school)/layout';
import SuperLayout from './app/(super)/layout';

// Pages
import RootHomePage from './app/page';
import KioskPage from './app/(kiosk)/kiosk/page';
import KioskSetupPage from './app/(kiosk)/kiosk/setup/page';
import StaffAttendancePage from './app/(staff)/attendance/page';
import NonTeachingAttendancePage from './app/(staff)/attendance/non-teaching/page';
import PeriodTrackerPage from './app/(staff)/period-tracker/page';
import SchoolAdminPage from './app/(school)/admin/page';
import AdminSettingsPage from './app/(school)/admin/settings/page';
import MasterRosterPage from './app/(school)/master-roster/page';
import SuperAdminPage from './app/(super)/super-admin/page';
import SchoolLoginPage from './app/school/login/page';
import SuperAdminLoginPage from './app/super/login/page';

import { SecurityIncident, securityEngine } from './utils/security';
import { AlertTriangle, X } from 'lucide-react';

/**
 * HashRouteRedirector:
 * Automatically translates hash-based deep links (e.g. /#/admin, /#/kiosk, /#/attendance)
 * into standard HTML5 routes.
 */
function HashRouteRedirector() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/')) {
      const cleanPath = hash.substring(1);
      window.history.replaceState(null, '', cleanPath);
      navigate(cleanPath, { replace: true });
    }
  }, [navigate]);

  return null;
}

/**
 * Security Threat Notifier
 * Listens for ges_security_alert events dispatched by securityEngine on 3/5 failed attempts
 */
function SecurityThreatNotifier() {
  const [activeAlert, setActiveAlert] = useState<SecurityIncident | null>(null);

  useEffect(() => {
    const handleAlert = (e: any) => {
      const incident: SecurityIncident = e.detail;
      if (incident) {
        setActiveAlert(incident);
        const timer = setTimeout(() => {
          setActiveAlert(null);
        }, 12000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('ges_security_alert', handleAlert);
    return () => window.removeEventListener('ges_security_alert', handleAlert);
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-red-950/95 border-2 border-red-500 text-white p-4 rounded-2xl shadow-2xl space-y-2 animate-bounce">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs tracking-wider uppercase">
          <AlertTriangle className="w-4 h-4" />
          <span>GES Security Incident Dispatched</span>
        </div>
        <button
          onClick={() => setActiveAlert(null)}
          className="text-red-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-red-100 leading-relaxed font-medium">
        {activeAlert.details}
      </p>
      <div className="text-[10px] text-red-300 font-mono flex items-center justify-between pt-1 border-t border-red-800/80">
        <span>Target: <strong>{activeAlert.schoolCode}</strong></span>
        <span>Device: {activeAlert.deviceSignature.slice(0, 10)}...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <HashRouteRedirector />
        <SecurityThreatNotifier />

        <Routes>
          {/* Root Role Directory Landing */}
          <Route path="/" element={<RootHomePage />} />

          {/* (kiosk) Layout & Route - Fullscreen, black background, rotating beacon */}
          <Route element={<KioskLayout />}>
            <Route path="/kiosk" element={<KioskPage />} />
            <Route path="/kiosk/setup" element={<KioskSetupPage />} />
          </Route>

          {/* (staff) Layout & Routes - Minimal top ribbon, no admin links */}
          <Route element={<StaffLayout />}>
            <Route path="/attendance" element={<StaffAttendancePage />} />
            <Route path="/attendance/non-teaching" element={<NonTeachingAttendancePage />} />
            <Route path="/period_tracker" element={<PeriodTrackerPage />} />
            <Route path="/period-tracker" element={<PeriodTrackerPage />} />
          </Route>

          {/* (school) Layout & Routes - Protected by RouteGuard: Sidebar + School Admin Navbar */}
          <Route
            element={
              <RouteGuard requiredRoles={['school_admin', 'super_admin']}>
                <SchoolLayout />
              </RouteGuard>
            }
          >
            <Route path="/admin" element={<SchoolAdminPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/master_roster" element={<MasterRosterPage />} />
            <Route path="/master-roster" element={<MasterRosterPage />} />
          </Route>

          {/* (super) Layout & Routes - Protected by RouteGuard: Super Admin Header + School Switcher */}
          <Route
            element={
              <RouteGuard requiredRoles={['super_admin']}>
                <SuperLayout />
              </RouteGuard>
            }
          >
            <Route path="/super_admin" element={<SuperAdminPage />} />
            <Route path="/super-admin" element={<SuperAdminPage />} />
          </Route>

          {/* Dedicated Institutional Logins (Separated) */}
          <Route path="/school/login" element={<SchoolLoginPage />} />
          <Route path="/admin/login" element={<SchoolLoginPage />} />
          <Route path="/super/login" element={<SuperAdminLoginPage />} />
          <Route path="/super_admin/login" element={<SuperAdminLoginPage />} />
          <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
