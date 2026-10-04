/**
 * Geolocation & Haversine Anti-Spoofing Engine
 * Sir Eugene Technologies
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates great-circle distance between two points in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const lat1 = toRad(coord1.lat);
  const lon1 = toRad(coord1.lng);
  const lat2 = toRad(coord2.lat);
  const lon2 = toRad(coord2.lng);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Generate a unique client device fingerprint signature
 */
export function getDeviceSignature(): string {
  if (typeof window === 'undefined') return 'SRV-STATION-01';
  const ua = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const lang = navigator.language;
  let hash = 0;
  const raw = `${ua}-${screenRes}-${lang}`;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `GES-DEV-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Official Ghana Senior High Schools GPS Coordinates Directory
 */
export const OFFICIAL_SCHOOL_COORDINATES: Record<string, { lat: number; lng: number; radiusMeters: number; schoolName: string }> = {
  MAWULI01: { lat: 6.9167, lng: 0.2833, radiusMeters: 500, schoolName: 'Mawuli Senior High School' },
  'GES-VR-HO-002': { lat: 6.9167, lng: 0.2833, radiusMeters: 500, schoolName: 'Mawuli Senior High School' },
  PREMPEH01: { lat: 6.7022, lng: -1.6514, radiusMeters: 600, schoolName: 'Prempeh College' },
  'GES-AR-KUM-003': { lat: 6.7022, lng: -1.6514, radiusMeters: 600, schoolName: 'Prempeh College' },
  ACHIMOTA01: { lat: 5.6178, lng: -0.2189, radiusMeters: 600, schoolName: 'Achimota School' },
  'GES-GAR-ACC-001': { lat: 5.6178, lng: -0.2189, radiusMeters: 600, schoolName: 'Achimota School' },
  ACCRA_HIGH01: { lat: 5.5600, lng: -0.1900, radiusMeters: 450, schoolName: 'Accra High Secondary School' },
  OLA_GIRLS01: { lat: 6.6120, lng: 0.4710, radiusMeters: 500, schoolName: 'Our Lady of Apostles Girls SHS' },
  MFANTSIPIM01: { lat: 5.1167, lng: -1.2500, radiusMeters: 500, schoolName: 'Mfantsipim School' },
  ADISADEL01: { lat: 5.1278, lng: -1.2856, radiusMeters: 500, schoolName: 'Adisadel College' },
  WESLEY_GIRLS01: { lat: 5.1278, lng: -1.2644, radiusMeters: 500, schoolName: "Wesley Girls' High School" },
  'GES-CR-CAP-005': { lat: 5.1278, lng: -1.2644, radiusMeters: 500, schoolName: "Wesley Girls' High School" },
  TAMASCO01: { lat: 9.4074, lng: -0.8393, radiusMeters: 600, schoolName: 'Tamale Senior High School' },
  'GES-NR-TAM-004': { lat: 9.4074, lng: -0.8393, radiusMeters: 600, schoolName: 'Tamale Senior High School' },
  BIAKOYE01: { lat: 7.1500, lng: 0.3500, radiusMeters: 500, schoolName: 'Biakoye Community SHS' },
  'GES-OR-BIA-006': { lat: 7.1500, lng: 0.3500, radiusMeters: 500, schoolName: 'Biakoye Community SHS' },
};

export const CALIBRATED_COORDS_EVENT = 'ges_school_coords_calibrated';

/**
 * Resolves accurate coordinates for a given school code, checking:
 * 1. Administrator/UAT local calibration for this campus
 * 2. Official GES SHS GPS database
 * 3. Custom school directory from localStorage
 * 4. Fallback school config
 */
export function resolveSchoolTargetCoordinates(
  schoolCode: string,
  fallbackConfig?: { lat: number; lng: number; radiusMeters?: number }
): Coordinates & { radiusMeters: number; isCalibrated: boolean; source: string } {
  const codeKey = (schoolCode || '').toUpperCase().trim();

  // 1. Check if user or school calibrated this campus gate
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`ges_calibrated_gps_${codeKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return {
            lat: parsed.lat,
            lng: parsed.lng,
            radiusMeters: parsed.radiusMeters || 600,
            isCalibrated: true,
            source: 'UAT Campus Calibration',
          };
        }
      }
    } catch {}
  }

  // 2. Official database lookup
  const official = OFFICIAL_SCHOOL_COORDINATES[codeKey];
  if (official) {
    return {
      lat: official.lat,
      lng: official.lng,
      radiusMeters: official.radiusMeters,
      isCalibrated: false,
      source: 'GES National Registry',
    };
  }

  // 3. Fallback to provided config or Mawuli default
  if (fallbackConfig && typeof fallbackConfig.lat === 'number' && typeof fallbackConfig.lng === 'number') {
    return {
      lat: fallbackConfig.lat,
      lng: fallbackConfig.lng,
      radiusMeters: fallbackConfig.radiusMeters || 500,
      isCalibrated: false,
      source: 'School Config',
    };
  }

  return {
    lat: 6.9167,
    lng: 0.2833,
    radiusMeters: 500,
    isCalibrated: false,
    source: 'Default',
  };
}

/**
 * Calibrates and anchors campus gate coordinates to user's real GPS position
 */
export function calibrateCampusGateGps(
  schoolCode: string,
  lat: number,
  lng: number,
  radiusMeters: number = 600
): void {
  if (typeof window === 'undefined') return;
  const codeKey = (schoolCode || 'MAWULI01').toUpperCase().trim();
  const payload = {
    lat,
    lng,
    radiusMeters,
    calibratedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`ges_calibrated_gps_${codeKey}`, JSON.stringify(payload));
    localStorage.setItem('ges_calibrated_gps_active', JSON.stringify(payload));
    
    // Also sync into stored school configuration so all system views sync
    const storedConfigRaw = localStorage.getItem('ges_school_config_v1');
    if (storedConfigRaw) {
      try {
        const parsed = JSON.parse(storedConfigRaw);
        localStorage.setItem(
          'ges_school_config_v1',
          JSON.stringify({ ...parsed, lat, lng, radiusMeters })
        );
      } catch {}
    }

    window.dispatchEvent(new CustomEvent(CALIBRATED_COORDS_EVENT, { detail: { schoolCode: codeKey, ...payload } }));
  } catch (err) {
    console.warn('Failed to save campus GPS calibration:', err);
  }
}

/**
 * Finds the closest registered Ghana Senior High School to the given GPS coordinates
 */
export function findNearestSchool(
  lat: number,
  lng: number
): { code: string; name: string; distanceKm: number } | null {
  let nearest: { code: string; name: string; distanceKm: number } | null = null;
  let minDistance = Infinity;

  for (const [code, info] of Object.entries(OFFICIAL_SCHOOL_COORDINATES)) {
    const dist = calculateHaversineDistance({ lat, lng }, { lat: info.lat, lng: info.lng });
    if (dist < minDistance) {
      minDistance = dist;
      nearest = {
        code,
        name: info.schoolName,
        distanceKm: Math.round(dist / 100) / 10,
      };
    }
  }

  return nearest;
}

/**
 * Format coordinates for display e.g. "6.9167° N, 0.2833° E"
 */
export function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return 'Awaiting GPS lock...';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}
