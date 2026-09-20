/**
 * GES Smart Staff & Period Attendance Studio
 * Built by Sir Eugene Technologies
 * Ultra-lightweight, 60 FPS, Offline-First Progressive Web App
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  AppMode,
  StaffMember,
  Classroom,
  GateAttendanceRecord,
  PeriodTeachingSession,
  SchoolConfig,
  DeviceOperatingMode,
  NonTeachingStaffMember,
  NonTeachingAttendanceRecord,
} from './types';
import { storageEngine, getTodayDateString } from './utils/storage';
import { usePWA } from './hooks/usePWA';
import { soundSynthesizer } from './utils/audio';
import { verifyBeaconToken } from './utils/beacon';
import { getDeviceSignature } from './utils/geo';
import { NavigationRibbon } from './components/NavigationRibbon';
import { GateClockMode } from './components/GateClockMode';
import { PeriodTrackerMode } from './components/PeriodTrackerMode';
import { MasterRosterMode } from './components/MasterRosterMode';
import { AdminReportsMode } from './components/AdminReportsMode';
import { NonTeachingAttendanceMode } from './components/NonTeachingAttendanceMode';
import { CommonRoomBeaconRadarModal } from './components/CommonRoomBeaconRadarModal';
import { QrDoorScannerModal } from './components/QrDoorScannerModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { StaffAttendancePortalHeader } from './components/StaffAttendancePortalHeader';
import { PortalType, PortalRouteInfo, parseCurrentRoute, navigateToPortal } from './utils/routes';

export default function App() {
  const { isOnline, pendingSyncCount } = usePWA();

  // Core Persistent State
  const [config, setConfig] = useState<SchoolConfig>(() => storageEngine.getSchoolConfig());
  const [staffList, setStaffList] = useState<StaffMember[]>(() => storageEngine.getStaff());
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => storageEngine.getClassrooms());
  const [gateRecords, setGateRecords] = useState<GateAttendanceRecord[]>(() =>
    storageEngine.getGateAttendance()
  );
  const [periodSessions, setPeriodSessions] = useState<PeriodTeachingSession[]>(() =>
    storageEngine.getPeriodSessions()
  );

  // Non-Teaching Staff & Attendance State
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffMember[]>(() =>
    storageEngine.getNonTeachingStaff()
  );
  const [nonTeachingAttendance, setNonTeachingAttendance] = useState<NonTeachingAttendanceRecord[]>(() =>
    storageEngine.getNonTeachingAttendance()
  );

  // URL-based Route & Portal State
  const initialRoute = useMemo(() => parseCurrentRoute(), []);
  const [currentRoute, setCurrentRoute] = useState<PortalRouteInfo>(initialRoute);
  const [isManualStaffViewOverride, setIsManualStaffViewOverride] = useState<boolean | null>(null);
  const isStaffOnlyView = isManualStaffViewOverride !== null ? isManualStaffViewOverride : currentRoute.isStaffOnlyView;

  // Active View Mode (initialized from route)
  const [currentMode, setCurrentMode] = useState<AppMode>(() => {
    if (initialRoute.portal === 'attendance') {
      return initialRoute.subType === 'non_teaching' ? 'non_teaching' : 'gate_clock';
    }
    if (initialRoute.portal === 'period_class_tracker') return 'period_tracker';
    if (initialRoute.portal === 'master_staff_roster') return 'master_roster';
    if (initialRoute.portal === 'admin') return 'admin_reports';
    return 'gate_clock';
  });

  // Keep route synced with browser history & URL updates
  useEffect(() => {
    const handlePopState = () => {
      const route = parseCurrentRoute();
      setCurrentRoute(route);
      if (route.portal === 'attendance') {
        setCurrentMode(route.subType === 'non_teaching' ? 'non_teaching' : 'gate_clock');
      } else if (route.portal === 'period_class_tracker') {
        setCurrentMode('period_tracker');
      } else if (route.portal === 'master_staff_roster') {
        setCurrentMode('master_roster');
      } else if (route.portal === 'admin') {
        setCurrentMode('admin_reports');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateToPortal = useCallback((portal: PortalType, subType?: 'teaching' | 'non_teaching') => {
    navigateToPortal(portal, subType);
    const updatedRoute = parseCurrentRoute();
    setCurrentRoute(updatedRoute);
    if (portal === 'attendance') {
      setCurrentMode(subType === 'non_teaching' ? 'non_teaching' : 'gate_clock');
    } else if (portal === 'period_class_tracker') {
      setCurrentMode('period_tracker');
    } else if (portal === 'master_staff_roster') {
      setCurrentMode('master_roster');
    } else if (portal === 'admin') {
      setCurrentMode('admin_reports');
    }
  }, []);

  // Filter states triggered by clicking Live Badges
  const [masterRosterPresenceFilter, setMasterRosterPresenceFilter] = useState<'ALL' | 'on_campus' | 'off_campus'>('ALL');
  const [periodStatusFilter, setPeriodStatusFilter] = useState<'ALL' | 'in_session' | 'available'>('ALL');

  // Device Operating Mode State (Dual Mode: Kiosk vs BYOD)
  const [deviceMode, setDeviceMode] = useState<DeviceOperatingMode>(() =>
    storageEngine.getDeviceMode()
  );

  const handleToggleDeviceMode = useCallback((mode: DeviceOperatingMode) => {
    storageEngine.saveDeviceMode(mode);
    setDeviceMode(mode);
  }, []);

  // Modal dialog states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBeaconRadarOpen, setIsBeaconRadarOpen] = useState(false);

  // Classroom targeted from QR scanner or Admin Grid
  const [preselectedClassroomId, setPreselectedClassroomId] = useState<string | null>(null);

  // Scanned / Detected Live QR Beacon Token (from phone camera QR scan, camera modal, or URL)
  const [scannedBeaconToken, setScannedBeaconToken] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Detect Beacon token in URL query parameter on mount (e.g. when staff scans screen with mobile camera)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const beaconParam = params.get('beacon');
      if (beaconParam) {
        const verification = verifyBeaconToken(beaconParam, config.schoolCode, 20);
        if (verification.valid) {
          setScannedBeaconToken(beaconParam);
          setCurrentMode('gate_clock');
          soundSynthesizer.playScanBeep();
        }
      }
    } catch (e) {
      console.warn('URL beacon parse error:', e);
    }
  }, [config.schoolCode]);

  // Compute live on-campus staff count (excluding voided records)
  const onCampusStaffCount = useMemo(() => {
    // Staff who clocked in today, have not clocked out, and record is NOT voided
    const activeArrivals = gateRecords.filter(
      (r) => r.date === todayStr && !r.clockOutTime && !r.isVoided
    );
    return activeArrivals.length;
  }, [gateRecords, todayStr]);

  // Compute active classrooms currently in teaching session
  const activeClassroomsCount = useMemo(() => {
    return classrooms.filter((c) => !!c.currentSession).length;
  }, [classrooms]);

  // Handlers
  const handleClockIn = useCallback((record: GateAttendanceRecord) => {
    storageEngine.addGateRecord(record);
    setGateRecords(storageEngine.getGateAttendance());
  }, []);

  // Handle Scanning Campus Kiosk Rotating Dynamic Beacon from Personal Phone (BYOD) or in-app scanner
  const handleScanCampusBeacon = useCallback(
    (beaconToken: string) => {
      const verification = verifyBeaconToken(beaconToken, config.schoolCode, 20);
      if (!verification.valid) {
        soundSynthesizer.playOutOfBoundsBuzzer();
        alert(`❌ Beacon Validation Failed: ${verification.message}`);
        return;
      }

      setScannedBeaconToken(beaconToken);
      soundSynthesizer.playScanBeep();
      setCurrentMode('gate_clock');
    },
    [config.schoolCode]
  );

  const handleClockOut = useCallback((recordId: string, reflection: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    storageEngine.updateGateRecord(recordId, {
      clockOutTime: time,
      clockOutTimestamp: Date.now(),
      closingReflection: reflection,
    });
    setGateRecords(storageEngine.getGateAttendance());
  }, []);

  const handleStartClassSession = useCallback(
    (classroomId: string | string[], session: Classroom['currentSession']) => {
      if (Array.isArray(classroomId)) {
        storageEngine.updateMultipleClassroomsSession(classroomId, session);
      } else {
        storageEngine.updateClassroomSession(classroomId, session);
      }
      setClassrooms(storageEngine.getClassrooms());
    },
    []
  );

  const handleConcludeClassSession = useCallback((sessionRecord: PeriodTeachingSession) => {
    storageEngine.addPeriodSession(sessionRecord);
    if (sessionRecord.mergedClassIds && sessionRecord.mergedClassIds.length > 0) {
      storageEngine.updateMultipleClassroomsSession(sessionRecord.mergedClassIds, undefined);
    } else {
      storageEngine.updateClassroomSession(sessionRecord.classroomId, undefined);
    }
    setPeriodSessions(storageEngine.getPeriodSessions());
    setClassrooms(storageEngine.getClassrooms());
  }, []);

  const handleAddStaffMember = useCallback((member: StaffMember) => {
    storageEngine.addStaffMember(member);
    setStaffList(storageEngine.getStaff());
  }, []);

  const handleBulkAddStaff = useCallback((newMembers: StaffMember[]) => {
    const existing = storageEngine.getStaff();
    const updated = [...newMembers, ...existing];
    storageEngine.saveStaff(updated);
    setStaffList(updated);
  }, []);

  const handleBulkAddClassrooms = useCallback((newClassrooms: Classroom[]) => {
    const existing = storageEngine.getClassrooms();
    const updated = [...newClassrooms, ...existing];
    storageEngine.saveClassrooms(updated);
    setClassrooms(updated);
  }, []);

  const handleSaveConfig = useCallback((updated: SchoolConfig) => {
    storageEngine.saveSchoolConfig(updated);
    setConfig(updated);
  }, []);

  const handleResetData = useCallback(() => {
    storageEngine.resetAllToDemo();
    setConfig(storageEngine.getSchoolConfig());
    setStaffList(storageEngine.getStaff());
    setClassrooms(storageEngine.getClassrooms());
    setGateRecords(storageEngine.getGateAttendance());
    setPeriodSessions(storageEngine.getPeriodSessions());
  }, []);

  const handleSelectClassroomFromScanner = useCallback((cls: Classroom) => {
    setPreselectedClassroomId(cls.id);
    setCurrentMode('period_tracker');
  }, []);

  // Handlers for Non-Teaching Staff
  const handleClockNonTeaching = useCallback((record: NonTeachingAttendanceRecord) => {
    storageEngine.addNonTeachingRecord(record);
    setNonTeachingAttendance(storageEngine.getNonTeachingAttendance());
  }, []);

  const handleClockOutNonTeaching = useCallback((staffId: string, clockOutTime: string) => {
    const today = getTodayDateString();
    const existing = storageEngine.getNonTeachingAttendance().find(
      (r) => r.staffId === staffId && r.date === today
    );
    if (existing) {
      storageEngine.updateNonTeachingRecord(existing.id, { clockOutTime });
      setNonTeachingAttendance(storageEngine.getNonTeachingAttendance());
    }
  }, []);

  const handleAddNonTeachingStaff = useCallback((member: NonTeachingStaffMember) => {
    storageEngine.addNonTeachingStaff(member);
    setNonTeachingStaff(storageEngine.getNonTeachingStaff());
  }, []);

  // Admin Unclock / Voiding Handlers
  const handleVoidGateRecord = useCallback((recordId: string, reason: string, adminName: string) => {
    storageEngine.voidGateRecord(recordId, reason, adminName);
    setGateRecords(storageEngine.getGateAttendance());
  }, []);

  const handleRestoreGateRecord = useCallback((recordId: string) => {
    storageEngine.restoreGateRecord(recordId);
    setGateRecords(storageEngine.getGateAttendance());
  }, []);

  const handleVoidNonTeachingRecord = useCallback((recordId: string, reason: string, adminName: string) => {
    storageEngine.voidNonTeachingRecord(recordId, reason, adminName);
    setNonTeachingAttendance(storageEngine.getNonTeachingAttendance());
  }, []);

  const handleRestoreNonTeachingRecord = useCallback((recordId: string) => {
    storageEngine.restoreNonTeachingRecord(recordId);
    setNonTeachingAttendance(storageEngine.getNonTeachingAttendance());
  }, []);

  // Handlers for clicking Live Badges in Navigation Ribbon
  const handleClickOnCampus = useCallback(() => {
    setMasterRosterPresenceFilter('on_campus');
    setCurrentMode('master_roster');
  }, []);

  const handleClickInSession = useCallback(() => {
    setPeriodStatusFilter('in_session');
    setCurrentMode('period_tracker');
  }, []);

  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full flex flex-col bg-slate-950 text-slate-100 pb-[max(12px,env(safe-area-inset-bottom))] overflow-hidden select-none">
      {/* Top Sticky Ribbon & Live Summary Bar */}
      <NavigationRibbon
        currentMode={currentMode}
        onSelectMode={(mode) => {
          if (mode === 'master_roster') setMasterRosterPresenceFilter('ALL');
          if (mode === 'period_tracker') setPeriodStatusFilter('ALL');
          setCurrentMode(mode);
        }}
        onCampusStaffCount={onCampusStaffCount}
        totalStaffCount={staffList.length}
        activeClassroomsCount={activeClassroomsCount}
        onClickOnCampus={handleClickOnCampus}
        onClickInSession={handleClickInSession}
        onOpenBeaconRadar={() => setIsBeaconRadarOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        deviceMode={deviceMode}
        onToggleDeviceMode={handleToggleDeviceMode}
        schoolName={config.schoolName}
        schoolCode={config.schoolCode}
        isStaffOnlyView={isStaffOnlyView}
        activePortal={currentRoute.portal}
        onNavigateToPortal={handleNavigateToPortal}
        onToggleStaffOnlyView={() =>
          setIsManualStaffViewOverride((prev) =>
            prev === null ? !currentRoute.isStaffOnlyView : !prev
          )
        }
      />

      {/* Main Workspace Modes */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Dedicated Distraction-Free Header for Staff Attendance Portal */}
        {currentRoute.portal === 'attendance' && isStaffOnlyView && (
          <div className="p-3 sm:p-4 pb-0 max-w-5xl mx-auto w-full shrink-0">
            <StaffAttendancePortalHeader
              config={config}
              activeStaffType={currentMode === 'non_teaching' ? 'non_teaching' : 'teaching'}
              onSelectStaffType={(type) => {
                handleNavigateToPortal('attendance', type);
              }}
              onNavigateToPeriodTracker={() => {
                handleNavigateToPortal('period_class_tracker');
              }}
              onOpenAdminPortal={() => {
                handleNavigateToPortal('admin');
              }}
            />
          </div>
        )}

        {currentMode === 'gate_clock' && (
          <GateClockMode
            staffList={staffList}
            gateRecords={gateRecords}
            config={config}
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            deviceMode={deviceMode}
            onToggleDeviceMode={handleToggleDeviceMode}
            onOpenBeaconScanner={() => setIsScannerOpen(true)}
            scannedBeaconToken={scannedBeaconToken}
            onClearScannedBeacon={() => setScannedBeaconToken(null)}
          />
        )}

        {currentMode === 'period_tracker' && (
          <PeriodTrackerMode
            classrooms={classrooms}
            staffList={staffList}
            periodSessions={periodSessions}
            onStartSession={handleStartClassSession}
            onConcludeSession={handleConcludeClassSession}
            onOpenQrScanner={() => setIsScannerOpen(true)}
            preselectedClassroomId={preselectedClassroomId}
            initialStatusFilter={periodStatusFilter}
          />
        )}

        {currentMode === 'master_roster' && (
          <MasterRosterMode
            staffList={staffList}
            gateRecords={gateRecords}
            periodSessions={periodSessions}
            classrooms={classrooms}
            onAddStaff={handleAddStaffMember}
            onBulkAddStaff={handleBulkAddStaff}
            onBulkAddClassrooms={handleBulkAddClassrooms}
            initialPresenceFilter={masterRosterPresenceFilter}
          />
        )}

        {currentMode === 'non_teaching' && (
          <NonTeachingAttendanceMode
            staffList={nonTeachingStaff}
            attendanceRecords={nonTeachingAttendance}
            onClockIn={handleClockNonTeaching}
            onClockOut={handleClockOutNonTeaching}
            onAddStaffMember={handleAddNonTeachingStaff}
            schoolName={config.schoolName}
            schoolConfig={config}
          />
        )}

        {currentMode === 'admin_reports' && (
          <AdminReportsMode
            classrooms={classrooms}
            gateRecords={gateRecords}
            periodSessions={periodSessions}
            nonTeachingRecords={nonTeachingAttendance}
            config={config}
            onSelectClassroomToView={(cls) => {
              setPreselectedClassroomId(cls.id);
              setCurrentMode('period_tracker');
            }}
            onVoidGateRecord={handleVoidGateRecord}
            onRestoreGateRecord={handleRestoreGateRecord}
            onVoidNonTeachingRecord={handleVoidNonTeachingRecord}
            onRestoreNonTeachingRecord={handleRestoreNonTeachingRecord}
            onNavigateToPortal={handleNavigateToPortal}
          />
        )}
      </main>

      {/* Bottom Center Institutional & Developer Credit Footer */}
      <footer className="w-full py-2 px-4 border-t border-slate-800/80 bg-slate-950/95 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 select-none shrink-0 z-30 shadow-md">
        <span className="font-extrabold text-white uppercase tracking-wider">{config.schoolName}</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-slate-300">
          Engineered &amp; Powered by <strong className="text-emerald-400 font-semibold">Sir Eugene Technologies</strong>
        </span>
        <span className="text-slate-600 hidden md:inline">•</span>
        <span className="text-slate-400 hidden md:inline">Ghana Education Service (GES) Smart Portal</span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="text-indigo-400 font-medium inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          AI Attendance Studio
        </span>
      </footer>

      {/* Modal Dialogs */}
      <QrDoorScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        classrooms={classrooms}
        onSelectClassroom={handleSelectClassroomFromScanner}
        schoolCode={config.schoolCode}
        onScanCampusBeacon={handleScanCampusBeacon}
      />

      <AdminSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        onResetData={handleResetData}
      />

      <HelpGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      <CommonRoomBeaconRadarModal
        isOpen={isBeaconRadarOpen}
        onClose={() => setIsBeaconRadarOpen(false)}
        onOpenScanner={() => {
          setIsBeaconRadarOpen(false);
          setIsScannerOpen(true);
        }}
      />

      {/* Offline Toast Notification when network is disconnected */}
      {!isOnline && (
        <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-600/90 border border-amber-400/50 text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-xs animate-bounce">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Offline Mode Active • All Records Saved Locally</span>
        </div>
      )}
    </div>
  );
}
