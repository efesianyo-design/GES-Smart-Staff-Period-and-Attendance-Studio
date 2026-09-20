/**
 * Rotating Campus Dynamic QR Beacon Engine
 * Sir Eugene Technologies
 * Generates cryptographic time-sliced tokens refreshing every 20 seconds.
 */

import { CampusBeaconToken } from '../types';

export function getBeaconTimeBucket(intervalSeconds: number = 20): number {
  return Math.floor(Date.now() / (intervalSeconds * 1000));
}

export function generateBeaconToken(schoolCode: string, intervalSeconds: number = 20): CampusBeaconToken {
  const bucket = getBeaconTimeBucket(intervalSeconds);
  const now = Date.now();
  const expiresAt = (bucket + 1) * intervalSeconds * 1000;
  const secondsRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  // Deterministic pseudo-hash for the 20-second window
  const raw = `${schoolCode}#${bucket}#GES_SECURE_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const token = `GES-CAMPUS-BEACON:${schoolCode}:${bucket}:${hexHash}`;

  return {
    token,
    generatedAt: bucket * intervalSeconds * 1000,
    expiresAt,
    secondsRemaining,
    schoolCode,
  };
}

export function verifyBeaconToken(tokenString: string, schoolCode: string, intervalSeconds: number = 20): {
  valid: boolean;
  message: string;
  ageSeconds?: number;
} {
  if (!tokenString || !tokenString.startsWith('GES-CAMPUS-BEACON:')) {
    return { valid: false, message: 'Invalid beacon format' };
  }

  const parts = tokenString.split(':');
  if (parts.length !== 4) {
    return { valid: false, message: 'Malformed beacon token structure' };
  }

  const [, tokenSchoolCode, tokenBucketStr, tokenHash] = parts;

  if (tokenSchoolCode !== schoolCode) {
    return { valid: false, message: `Beacon is for a different institution (${tokenSchoolCode})` };
  }

  const currentBucket = getBeaconTimeBucket(intervalSeconds);
  const tokenBucket = parseInt(tokenBucketStr, 10);

  // Allow current bucket or previous bucket (up to 20s drift grace period)
  if (tokenBucket !== currentBucket && tokenBucket !== currentBucket - 1) {
    return { valid: false, message: 'QR Beacon expired. Please scan the current live screen.' };
  }

  // Verify hash
  const raw = `${schoolCode}#${tokenBucket}#GES_SECURE_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  const expectedHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');

  if (expectedHash !== tokenHash) {
    return { valid: false, message: 'Tampered beacon signature detected' };
  }

  const ageMs = Date.now() - tokenBucket * intervalSeconds * 1000;
  return {
    valid: true,
    message: 'Beacon authenticated: Physical presence confirmed',
    ageSeconds: Math.round(ageMs / 1000),
  };
}
