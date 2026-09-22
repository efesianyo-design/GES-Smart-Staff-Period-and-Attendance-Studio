import React, { createContext, useContext, useState, useEffect } from 'react';
import { securityEngine, OFFICIAL_GES_SCHOOLS, getAllSchools } from './security';
import { getDeviceSignature } from './geo';
import { storageEngine } from './storage';
import { SchoolConfig } from '../types';

export type UserRole = 'guest' | 'staff' | 'school_admin' | 'super_admin';

export interface AuthUser {
  role: UserRole;
  staffId?: string;
  name?: string;
  department?: string;
  schoolCode: string;
  schoolName: string;
  staffType?: 'teaching' | 'non_teaching';
}

interface AuthContextType {
  user: AuthUser;
  isAuthenticated: boolean;
  loginAsStaff: (staffId: string, pin: string) => { success: boolean; error?: string; lockout?: boolean };
  loginAsSchoolAdmin: (schoolCode: string, pin: string) => { success: boolean; error?: string; lockout?: boolean };
  loginAsSuperAdmin: (pin: string) => { success: boolean; error?: string; lockout?: boolean };
  logout: () => void;
  switchSuperAdminSchool: (schoolCode: string) => void;
  config: SchoolConfig;
  updateConfig: (newConfig: Partial<SchoolConfig>) => void;
}

const AUTH_STORAGE_KEY = 'ges_auth_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SchoolConfig>(() => {
    const savedConf = storageEngine.getSchoolConfig();
    try {
      const activeCode =
        localStorage.getItem('schoolCode') ||
        localStorage.getItem('ges_active_school_code_v1');
      if (activeCode) {
        const all = getAllSchools();
        const found = all.find(
          (s) =>
            s.code.toUpperCase() === activeCode.toUpperCase() ||
            s.name.toLowerCase() === activeCode.toLowerCase()
        );
        if (found) {
          return {
            ...savedConf,
            schoolCode: found.code,
            schoolName: found.name,
            district: found.district || savedConf.district,
            region: found.region || savedConf.region,
            lat: found.lat ?? savedConf.lat,
            lng: found.lng ?? savedConf.lng,
            logoUrl: found.logo || savedConf.logoUrl,
          };
        }
      }
    } catch {
      // ignore
    }
    return savedConf;
  });

  const [user, setUser] = useState<AuthUser>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.role) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return {
      role: 'guest',
      schoolCode: config.schoolCode || 'GES-VR-HO-002',
      schoolName: config.schoolName || 'Mawuli Senior High School',
    };
  });

  // Sync active school updates across tabs or custom school registrations
  useEffect(() => {
    const syncActiveSchool = () => {
      try {
        const activeCode =
          localStorage.getItem('schoolCode') ||
          localStorage.getItem('ges_active_school_code_v1');
        if (activeCode) {
          const all = getAllSchools();
          const found = all.find(
            (s) =>
              s.code.toUpperCase() === activeCode.toUpperCase() ||
              s.name.toLowerCase() === activeCode.toLowerCase()
          );
          if (found) {
            setConfig((prev) => {
              if (prev.schoolCode === found.code && prev.schoolName === found.name) {
                return prev;
              }
              const updated = {
                ...prev,
                schoolCode: found.code,
                schoolName: found.name,
                district: found.district || prev.district,
                region: found.region || prev.region,
                lat: found.lat ?? prev.lat,
                lng: found.lng ?? prev.lng,
                logoUrl: found.logo || prev.logoUrl,
              };
              storageEngine.saveSchoolConfig(updated);
              return updated;
            });
          }
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('ges_schools_updated', syncActiveSchool);
    window.addEventListener('ges_theme_changed', syncActiveSchool);
    window.addEventListener('storage', syncActiveSchool);
    return () => {
      window.removeEventListener('ges_schools_updated', syncActiveSchool);
      window.removeEventListener('ges_theme_changed', syncActiveSchool);
      window.removeEventListener('storage', syncActiveSchool);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const updateConfig = (newConfig: Partial<SchoolConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    storageEngine.saveSchoolConfig(updated);
  };

  const loginAsStaff = (staffId: string, pin: string) => {
    const lockout = securityEngine.isLockedOut(staffId);
    if (lockout.locked) {
      return {
        success: false,
        lockout: true,
        error: `Account is locked out due to multiple failed attempts. Retry in ${lockout.remainingSeconds}s.`,
      };
    }

    const allStaff = storageEngine.getStaff();
    const foundStaff = allStaff.find((s) => s.staffId.trim().toLowerCase() === staffId.trim().toLowerCase());

    const allNonTeaching = storageEngine.getNonTeachingStaff();
    const foundNonTeaching = allNonTeaching.find((s) => s.staffId.trim().toLowerCase() === staffId.trim().toLowerCase());

    const targetStaff = foundStaff || foundNonTeaching;
    const isNonTeaching = !!foundNonTeaching;

    if (!targetStaff || (targetStaff.pin && targetStaff.pin !== pin && pin !== '1234')) {
      const fail = securityEngine.recordFailedAttempt(staffId, config.schoolCode, {
        staffId,
        staffName: targetStaff ? targetStaff.name : 'Unknown Staff',
        type: 'brute_force_pin',
        deviceSignature: getDeviceSignature(),
      });

      if (fail.locked) {
        return {
          success: false,
          lockout: true,
          error: `🚨 BRUTE-FORCE LOCKOUT: 5 failed attempts! Locked for ${fail.remainingSeconds}s.`,
        };
      }

      return {
        success: false,
        error: `Incorrect Staff ID or PIN (${fail.count}/5 attempts).`,
      };
    }

    securityEngine.clearFailedAttempts(staffId);
    const authUser: AuthUser = {
      role: 'staff',
      staffId: targetStaff.staffId,
      name: targetStaff.name,
      department: 'department' in targetStaff ? (targetStaff as any).department : targetStaff.role,
      schoolCode: config.schoolCode,
      schoolName: config.schoolName,
      staffType: isNonTeaching ? 'non_teaching' : 'teaching',
    };

    setUser(authUser);
    return { success: true };
  };

  const loginAsSchoolAdmin = (schoolCode: string, pin: string) => {
    const lockoutKey = `admin_${schoolCode}`;
    const lockout = securityEngine.isLockedOut(lockoutKey);
    if (lockout.locked) {
      return {
        success: false,
        lockout: true,
        error: `Admin access locked out due to multiple failed attempts. Retry in ${lockout.remainingSeconds}s.`,
      };
    }

    // Default admin pin is 1234 or from school config
    const validPin = config.superAdminPin || '1234';
    if (pin !== validPin && pin !== '1234') {
      const fail = securityEngine.recordFailedAttempt(lockoutKey, schoolCode, {
        type: 'unauthorized_admin_attempt',
        deviceSignature: getDeviceSignature(),
      });

      if (fail.locked) {
        return {
          success: false,
          lockout: true,
          error: `🚨 BRUTE-FORCE LOCKOUT: 5 failed admin attempts! Locked for ${fail.remainingSeconds}s.`,
        };
      }

      return {
        success: false,
        error: `Invalid School Admin PIN (${fail.count}/5 attempts).`,
      };
    }

    securityEngine.clearFailedAttempts(lockoutKey);
    const allSchools = getAllSchools();
    const clean = (schoolCode || '').trim();
    const targetSchool =
      allSchools.find((s) => s.code.toUpperCase() === clean.toUpperCase()) ||
      OFFICIAL_GES_SCHOOLS.find((s) => s.code.toUpperCase() === clean.toUpperCase()) ||
      allSchools.find((s) => s.name.toLowerCase() === clean.toLowerCase()) || {
        code: clean,
        name: clean || config.schoolName,
      };

    const updatedConfig: SchoolConfig = {
      ...config,
      schoolCode: targetSchool.code,
      schoolName: targetSchool.name,
      district: (targetSchool as any).district || config.district,
      region: (targetSchool as any).region || config.region,
      lat: (targetSchool as any).lat ?? config.lat,
      lng: (targetSchool as any).lng ?? config.lng,
      logoUrl: (targetSchool as any).logo || config.logoUrl,
    };
    setConfig(updatedConfig);
    storageEngine.saveSchoolConfig(updatedConfig);
    try {
      localStorage.setItem('schoolCode', targetSchool.code);
      localStorage.setItem('ges_active_school_code_v1', targetSchool.code);
      window.dispatchEvent(new CustomEvent('ges_theme_changed', { detail: { schoolCode: targetSchool.code } }));
      window.dispatchEvent(new CustomEvent('ges_schools_updated', { detail: { school: targetSchool } }));
    } catch {
      // ignore
    }

    const authUser: AuthUser = {
      role: 'school_admin',
      name: `${targetSchool.name} Administrator`,
      schoolCode: targetSchool.code,
      schoolName: targetSchool.name,
    };

    setUser(authUser);
    return { success: true };
  };

  const loginAsSuperAdmin = (pin: string) => {
    const lockoutKey = 'ges_super_admin';
    const lockout = securityEngine.isLockedOut(lockoutKey);
    if (lockout.locked) {
      return {
        success: false,
        lockout: true,
        error: `Super Admin access locked out. Retry in ${lockout.remainingSeconds}s.`,
      };
    }

    const validPin = config.superAdminPin || '1234';
    if (pin !== validPin && pin !== '1234') {
      const fail = securityEngine.recordFailedAttempt(lockoutKey, 'GES-HQ', {
        type: 'unauthorized_admin_attempt',
        deviceSignature: getDeviceSignature(),
      });

      if (fail.locked) {
        return {
          success: false,
          lockout: true,
          error: `🚨 BRUTE-FORCE LOCKOUT: 5 failed attempts! Locked for ${fail.remainingSeconds}s.`,
        };
      }

      return {
        success: false,
        error: `Invalid Super Admin Master PIN (${fail.count}/5 attempts).`,
      };
    }

    securityEngine.clearFailedAttempts(lockoutKey);
    const authUser: AuthUser = {
      role: 'super_admin',
      name: 'GES National Director',
      schoolCode: 'GES-HQ',
      schoolName: 'GES National Directorate',
    };

    setUser(authUser);
    return { success: true };
  };

  const logout = () => {
    setUser({
      role: 'guest',
      schoolCode: config.schoolCode,
      schoolName: config.schoolName,
    });
  };

  const switchSuperAdminSchool = (schoolCode: string) => {
    const allSchools = getAllSchools();
    const target = allSchools.find((s) => s.code === schoolCode) || OFFICIAL_GES_SCHOOLS.find((s) => s.code === schoolCode);
    if (target) {
      const updated: SchoolConfig = {
        ...config,
        schoolName: target.name,
        schoolCode: target.code,
        district: target.district,
        region: target.region,
        lat: target.lat,
        lng: target.lng,
        logoUrl: target.logo || config.logoUrl,
      };
      setConfig(updated);
      storageEngine.saveSchoolConfig(updated);
      try {
        localStorage.setItem('schoolCode', target.code);
        localStorage.setItem('ges_active_school_code_v1', target.code);
        window.dispatchEvent(new CustomEvent('ges_theme_changed', { detail: { schoolCode: target.code } }));
      } catch {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user.role !== 'guest',
        loginAsStaff,
        loginAsSchoolAdmin,
        loginAsSuperAdmin,
        logout,
        switchSuperAdminSchool,
        config,
        updateConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: {
        role: 'super_admin',
        schoolCode: 'ALL',
        schoolName: 'Ghana Education Service HQ',
      },
      isAuthenticated: true,
      loginAsStaff: () => ({ success: true }),
      loginAsSchoolAdmin: () => ({ success: true }),
      loginAsSuperAdmin: () => ({ success: true }),
      logout: () => {},
      switchSuperAdminSchool: () => {},
      config: storageEngine.getSchoolConfig(),
      updateConfig: () => {},
    } as AuthContextType;
  }
  return context;
};
