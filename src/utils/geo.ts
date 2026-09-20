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
 * Format coordinates for display e.g. "6.9167° N, 0.2833° E"
 */
export function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return 'Awaiting GPS lock...';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(5)}° ${latDir}, ${Math.abs(lng).toFixed(5)}° ${lngDir}`;
}
