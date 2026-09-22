/**
 * GES National Attendance System - School Themes & Color Configuration
 * Provides 10 Ghana Senior High School defaults + GES Directorate National Theme.
 * Supports auto-theming extracted from school crests / logos.
 */

import { getAllSchools } from '../utils/security';

export interface SchoolTheme {
  code: string;
  name: string;
  shortName: string;
  slogan: string;
  region: string;
  primary: string;
  secondary: string;
  accent?: string;
  logo?: string;
}

export const SCHOOL_THEMES: Record<string, SchoolTheme> = {
  MAWULI01: {
    code: 'MAWULI01',
    name: 'Mawuli Senior High School',
    shortName: 'Mawuli School',
    slogan: 'Head, Heart, and Hand',
    region: 'Volta Region',
    primary: '#16A34A', // Mawuli Green
    secondary: '#FACC15', // Gold
    accent: '#059669',
  },
  PREMPEH01: {
    code: 'PREMPEH01',
    name: 'Prempeh College',
    shortName: 'Prempeh College',
    slogan: 'Suban ne Nimdeε',
    region: 'Ashanti Region',
    primary: '#0B6D2F', // Forest Green
    secondary: '#D4AF37', // Antique Ghana Gold
    accent: '#EAB308',
  },
  ACHIMOTA01: {
    code: 'ACHIMOTA01',
    name: 'Achimota School',
    shortName: 'Achimota School',
    slogan: 'Ut Omnes Unum Sint',
    region: 'Greater Accra',
    primary: '#111827', // Piano Keys Black
    secondary: '#FFFFFF', // Piano Keys White
    accent: '#FACC15', // Gold Crest Accent
  },
  ACCRA_HIGH01: {
    code: 'ACCRA_HIGH01',
    name: 'Accra High Secondary School',
    shortName: 'Accra High',
    slogan: 'Redeem the Time',
    region: 'Greater Accra',
    primary: '#1E40AF', // Royal Blue
    secondary: '#FACC15', // Gold
    accent: '#3B82F6',
  },
  OLA_GIRLS01: {
    code: 'OLA_GIRLS01',
    name: 'Our Lady of Apostles Girls SHS',
    shortName: 'OLA Girls',
    slogan: 'Viam Veritatis Elegi',
    region: 'Volta Region',
    primary: '#2563EB', // Marian Blue
    secondary: '#FFFFFF', // White
    accent: '#60A5FA',
  },
  MFANTSIPIM01: {
    code: 'MFANTSIPIM01',
    name: 'Mfantsipim School',
    shortName: 'Mfantsipim',
    slogan: 'Dwen Hwe Kan',
    region: 'Central Region',
    primary: '#991B1B', // Crimson Red
    secondary: '#FCD116', // Gold
    accent: '#DC2626',
  },
  ADISADEL01: {
    code: 'ADISADEL01',
    name: 'Adisadel College',
    shortName: 'Adisadel College',
    slogan: 'Vel Primus Vel Cum Primis',
    region: 'Central Region',
    primary: '#000000', // Zebra Black
    secondary: '#F59E0B', // Santaclausian Amber
    accent: '#FFFFFF',
  },
  WESLEY_GIRLS01: {
    code: 'WESLEY_GIRLS01',
    name: "Wesley Girls' High School",
    shortName: 'Wey Gey Hey',
    slogan: 'Live Pure, Speak True, Right Wrong',
    region: 'Central Region',
    primary: '#065F46', // Emerald Green
    secondary: '#FDE047', // Light Yellow
    accent: '#10B981',
  },
  TAMALE_SHS01: {
    code: 'TAMALE_SHS01',
    name: 'Tamale Senior High School',
    shortName: 'TAMASCO',
    slogan: 'Fortiter, Fideliter, Feliciter',
    region: 'Northern Region',
    primary: '#047857', // Northern Green
    secondary: '#F59E0B', // Gold Ochre
    accent: '#10B981',
  },
  AMHS_KASOA01: {
    code: 'AMHS_KASOA01',
    name: 'Accra Methodist High School',
    shortName: 'Accra Methodist HS',
    slogan: 'Truth, Integrity, Service',
    region: 'Central Region',
    primary: '#0B6D2F', // Methodist Green
    secondary: '#D4AF37', // Gold
    accent: '#EAB308',
  },
  DEFAULT_GES: {
    code: 'DEFAULT_GES',
    name: 'Ghana Education Service',
    shortName: 'GES National HQ',
    slogan: 'Service and Integrity in Education',
    region: 'National HQ',
    primary: '#0B6D2F', // Official GES Green
    secondary: '#D4AF37', // Official Gold
    accent: '#FACC15',
  },
};

// Aliases mapping legacy codes to canonical theme keys
const CODE_ALIASES: Record<string, string> = {
  'GES-VR-HO-002': 'MAWULI01',
  'MAWULI': 'MAWULI01',
  'GES-AR-KUM-003': 'PREMPEH01',
  'GES-AR-KUM-001': 'PREMPEH01',
  'PREMPEH': 'PREMPEH01',
  'GES-GAR-ACC-001': 'ACHIMOTA01',
  'ACHIMOTA': 'ACHIMOTA01',
  'GES-GAR-ACC-003': 'ACCRA_HIGH01',
  'ACCRA_HIGH': 'ACCRA_HIGH01',
  'OLA': 'OLA_GIRLS01',
  'MFANTSIPIM': 'MFANTSIPIM01',
  'ADISADEL': 'ADISADEL01',
  'GES-CR-CAP-005': 'WESLEY_GIRLS01',
  'WESLEY_GIRLS': 'WESLEY_GIRLS01',
  'GES-NR-TAM-004': 'TAMALE_SHS01',
  'TAMASCO': 'TAMALE_SHS01',
  'AMHS': 'AMHS_KASOA01',
  'GES-CR-KAS-006': 'AMHS_KASOA01',
};

/**
 * Resolve theme by code, case-insensitively, with fallback to custom school directory or DEFAULT_GES
 */
export function getSchoolTheme(schoolCode?: string | null): SchoolTheme {
  if (!schoolCode) return SCHOOL_THEMES.DEFAULT_GES;

  const rawCode = schoolCode.trim();
  const clean = rawCode.toUpperCase();

  // 1. Check if user configured/uploaded theme in localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedTheme = localStorage.getItem(`theme_${rawCode}`) || localStorage.getItem(`theme_${clean}`);
      if (storedTheme) {
        const parsed = JSON.parse(storedTheme);
        if (parsed && parsed.primary) {
          return {
            ...SCHOOL_THEMES.DEFAULT_GES,
            ...parsed,
            code: rawCode,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Check all schools directory (custom created schools + defaults)
  try {
    const allSchools = getAllSchools();
    const foundSchool = allSchools.find(
      (s) => s.code.toUpperCase() === clean || s.code === rawCode || s.name.toLowerCase() === rawCode.toLowerCase()
    );
    if (foundSchool) {
      return {
        code: foundSchool.code,
        name: foundSchool.name,
        shortName: foundSchool.name,
        slogan: foundSchool.slogan || 'Truth, Knowledge, Service',
        region: foundSchool.region || 'Ghana',
        primary: foundSchool.primaryColor || '#0B6D2F',
        secondary: foundSchool.secondaryColor || '#D4AF37',
        accent: '#FACC15',
        logo: foundSchool.logo,
      };
    }
  } catch {
    // ignore
  }

  // 3. Direct match in preset themes
  if (SCHOOL_THEMES[clean]) {
    return SCHOOL_THEMES[clean];
  }

  // 4. Alias lookup
  const canonical = CODE_ALIASES[clean] || CODE_ALIASES[rawCode];
  if (canonical && SCHOOL_THEMES[canonical]) {
    return SCHOOL_THEMES[canonical];
  }

  // 5. Partial match by short name or code
  for (const key of Object.keys(SCHOOL_THEMES)) {
    if (clean.includes(key) || key.includes(clean)) {
      return SCHOOL_THEMES[key];
    }
  }

  // 6. Fallback
  return {
    ...SCHOOL_THEMES.DEFAULT_GES,
    code: schoolCode,
  };
}
