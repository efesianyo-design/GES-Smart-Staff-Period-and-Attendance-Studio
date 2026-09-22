import { useState, useEffect, useCallback } from 'react';
import { SchoolTheme, SCHOOL_THEMES, getSchoolTheme } from '../config/schoolThemes';

export interface CustomThemeData {
  primary: string;
  secondary: string;
  accent?: string;
  logo?: string;
  name?: string;
  shortName?: string;
  slogan?: string;
  region?: string;
}

export const THEME_EVENT_NAME = 'ges_theme_changed';

export function useSchoolTheme() {
  const resolveInitialCode = (): string => {
    if (typeof window === 'undefined') return 'MAWULI01';

    // 1. Check URL search param ?schoolCode=
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('schoolCode');
    if (urlCode && urlCode.trim()) {
      return urlCode.trim();
    }

    // 2. Check localStorage 'schoolCode' or 'ges_active_school_code_v1'
    const stored =
      localStorage.getItem('schoolCode') ||
      localStorage.getItem('ges_active_school_code_v1');
    if (stored && stored.trim()) {
      return stored.trim();
    }

    // 3. Default school code
    return 'MAWULI01';
  };

  const [schoolCode, setSchoolCodeState] = useState<string>(resolveInitialCode);

  const loadCurrentTheme = useCallback((code: string): SchoolTheme => {
    const baseTheme = getSchoolTheme(code);
    if (typeof window === 'undefined') return baseTheme;

    try {
      // Check localStorage for headmaster uploaded logo/customization: theme_{schoolCode}
      const rawCustom = localStorage.getItem(`theme_${code}`) || localStorage.getItem(`theme_${baseTheme.code}`);
      if (rawCustom) {
        const custom: CustomThemeData = JSON.parse(rawCustom);
        return {
          ...baseTheme,
          primary: custom.primary || baseTheme.primary,
          secondary: custom.secondary || baseTheme.secondary,
          accent: custom.accent || baseTheme.accent,
          logo: custom.logo || baseTheme.logo,
          name: custom.name || baseTheme.name,
          shortName: custom.shortName || baseTheme.shortName,
          slogan: custom.slogan || baseTheme.slogan,
          region: custom.region || baseTheme.region,
        };
      }
    } catch (e) {
      console.warn('Failed to parse custom school theme from localStorage:', e);
    }

    return baseTheme;
  }, []);

  const [theme, setTheme] = useState<SchoolTheme>(() => loadCurrentTheme(schoolCode));

  // Sync CSS variables onto document.documentElement
  const applyCssVariables = useCallback((currentTheme: SchoolTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--primary', currentTheme.primary);
    root.style.setProperty('--secondary', currentTheme.secondary);
    if (currentTheme.accent) {
      root.style.setProperty('--accent', currentTheme.accent);
    }
  }, []);

  // Sync CSS variables onto document.documentElement on theme change
  useEffect(() => {
    applyCssVariables(theme);
  }, [theme, applyCssVariables]);

  // Update theme when URL search param or stored school code differs
  useEffect(() => {
    const currentCode = resolveInitialCode();
    if (currentCode !== schoolCode) {
      setSchoolCodeState(currentCode);
      const updatedTheme = loadCurrentTheme(currentCode);
      setTheme(updatedTheme);
      applyCssVariables(updatedTheme);
    }
  }, [schoolCode, loadCurrentTheme, applyCssVariables]);

  // Listen for real-time theme updates across components and windows
  useEffect(() => {
    const handleThemeEvent = (e: any) => {
      const currentCode = resolveInitialCode();
      const updatedTheme = loadCurrentTheme(currentCode);
      setTheme(updatedTheme);
      applyCssVariables(updatedTheme);
    };

    window.addEventListener(THEME_EVENT_NAME, handleThemeEvent);
    window.addEventListener('ges_schools_updated', handleThemeEvent);
    window.addEventListener('storage', handleThemeEvent);

    return () => {
      window.removeEventListener(THEME_EVENT_NAME, handleThemeEvent);
      window.removeEventListener('ges_schools_updated', handleThemeEvent);
      window.removeEventListener('storage', handleThemeEvent);
    };
  }, [loadCurrentTheme, applyCssVariables]);

  // Public method to switch school code
  const setSchoolCode = useCallback((newCode: string) => {
    setSchoolCodeState(newCode);
    localStorage.setItem('schoolCode', newCode);
    localStorage.setItem('ges_active_school_code_v1', newCode);

    const updatedTheme = loadCurrentTheme(newCode);
    setTheme(updatedTheme);
    applyCssVariables(updatedTheme);

    window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: { schoolCode: newCode } }));
  }, [loadCurrentTheme, applyCssVariables]);

  // Public method to update custom theme (e.g. from crest upload)
  const updateCustomTheme = useCallback(
    (customData: CustomThemeData) => {
      const codeKey = schoolCode || theme.code;
      const merged: SchoolTheme = {
        ...theme,
        primary: customData.primary || theme.primary,
        secondary: customData.secondary || theme.secondary,
        accent: customData.accent || theme.accent,
        logo: customData.logo || theme.logo,
      };

      try {
        localStorage.setItem(`theme_${codeKey}`, JSON.stringify(merged));
        localStorage.setItem(`theme_${theme.code}`, JSON.stringify(merged));
      } catch (e) {
        console.warn('Could not save theme to localStorage', e);
      }

      setTheme(merged);
      applyCssVariables(merged);

      window.dispatchEvent(
        new CustomEvent(THEME_EVENT_NAME, {
          detail: { schoolCode: codeKey, theme: merged },
        })
      );
    },
    [schoolCode, theme, applyCssVariables]
  );

  return {
    theme,
    schoolCode,
    setSchoolCode,
    updateCustomTheme,
  };
}
