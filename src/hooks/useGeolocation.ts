import { useState, useEffect, useCallback, useRef } from 'react';
import { SchoolConfig, GeoLocationState } from '../types';
import {
  calculateHaversineDistance,
  resolveSchoolTargetCoordinates,
  calibrateCampusGateGps,
  CALIBRATED_COORDS_EVENT,
} from '../utils/geo';
import { soundSynthesizer } from '../utils/audio';

export function useGeolocation(config: SchoolConfig, activeSchoolCode?: string) {
  const [state, setState] = useState<GeoLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    distanceMeters: null,
    isWithinBounds: false,
    isLoading: true,
    error: null,
    isMockEnabled: false,
    mockMode: 'at_gate',
  });

  const configRef = useRef(config);
  configRef.current = config;
  const schoolCodeRef = useRef(activeSchoolCode);
  schoolCodeRef.current = activeSchoolCode;

  const mockRef = useRef<{ isMockEnabled: boolean; mockMode: 'at_gate' | 'outside' }>({
    isMockEnabled: false,
    mockMode: 'at_gate',
  });

  const evaluatePosition = useCallback(
    (lat: number, lng: number, accuracy: number, isMock: boolean, mockMode: 'at_gate' | 'outside') => {
      mockRef.current = { isMockEnabled: isMock, mockMode };
      const currentConfig = configRef.current;
      const targetCoords = resolveSchoolTargetCoordinates(
        schoolCodeRef.current || currentConfig.schoolCode,
        currentConfig
      );

      const distance = calculateHaversineDistance(
        { lat, lng },
        { lat: targetCoords.lat, lng: targetCoords.lng }
      );
      const isWithin = distance <= targetCoords.radiusMeters;

      setState((prev) => ({
        ...prev,
        lat,
        lng,
        accuracy,
        distanceMeters: distance,
        isWithinBounds: isWithin,
        isLoading: false,
        error: null,
        isMockEnabled: isMock,
        mockMode,
      }));
    },
    []
  );

  const refreshPosition = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const currentConfig = configRef.current;
    const targetCoords = resolveSchoolTargetCoordinates(
      schoolCodeRef.current || currentConfig.schoolCode,
      currentConfig
    );

    if (mockRef.current.isMockEnabled) {
      if (mockRef.current.mockMode === 'at_gate') {
        const mockLat = targetCoords.lat + 0.00012;
        const mockLng = targetCoords.lng + 0.00008;
        evaluatePosition(mockLat, mockLng, 6, true, 'at_gate');
      } else {
        const mockLat = targetCoords.lat + 0.0032;
        const mockLng = targetCoords.lng + 0.0028;
        evaluatePosition(mockLat, mockLng, 14, true, 'outside');
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const mockLat = targetCoords.lat + 0.0001;
      const mockLng = targetCoords.lng + 0.00005;
      evaluatePosition(mockLat, mockLng, 8, true, 'at_gate');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        evaluatePosition(latitude, longitude, accuracy, false, 'at_gate');
      },
      (err) => {
        console.warn('[Geolocation] Device GPS reading notice:', err.message);
        const mockLat = targetCoords.lat + 0.00012;
        const mockLng = targetCoords.lng + 0.00008;
        evaluatePosition(mockLat, mockLng, 10, true, 'at_gate');
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 2000,
      }
    );
  }, [evaluatePosition]);

  useEffect(() => {
    refreshPosition();

    const handleCalibration = () => {
      refreshPosition();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CALIBRATED_COORDS_EVENT, handleCalibration);
      window.addEventListener('ges_theme_changed', handleCalibration);
      return () => {
        window.removeEventListener(CALIBRATED_COORDS_EVENT, handleCalibration);
        window.removeEventListener('ges_theme_changed', handleCalibration);
      };
    }
  }, [refreshPosition, activeSchoolCode]);

  const calibrateToCurrentPosition = useCallback(() => {
    if (state.lat !== null && state.lng !== null) {
      const code = schoolCodeRef.current || configRef.current.schoolCode || 'MAWULI01';
      calibrateCampusGateGps(code, state.lat, state.lng, 600);
      evaluatePosition(state.lat, state.lng, state.accuracy || 10, false, 'at_gate');
      return true;
    }
    return false;
  }, [state.lat, state.lng, state.accuracy, evaluatePosition]);

  const setSimulationMode = useCallback((mode: 'real' | 'at_gate' | 'outside') => {
    const currentConfig = configRef.current;
    const targetCoords = resolveSchoolTargetCoordinates(
      schoolCodeRef.current || currentConfig.schoolCode,
      currentConfig
    );

    if (mode === 'real') {
      mockRef.current = { isMockEnabled: false, mockMode: 'at_gate' };
      setState((prev) => ({ ...prev, isMockEnabled: false, isLoading: true }));
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            evaluatePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, false, 'at_gate');
          },
          () => {
            evaluatePosition(targetCoords.lat + 0.0001, targetCoords.lng + 0.0001, 8, true, 'at_gate');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        evaluatePosition(targetCoords.lat + 0.0001, targetCoords.lng + 0.0001, 8, true, 'at_gate');
      }
    } else if (mode === 'at_gate') {
      const mockLat = targetCoords.lat + 0.00012;
      const mockLng = targetCoords.lng + 0.00008;
      evaluatePosition(mockLat, mockLng, 6, true, 'at_gate');
    } else {
      const mockLat = targetCoords.lat + 0.0035;
      const mockLng = targetCoords.lng + 0.0031;
      evaluatePosition(mockLat, mockLng, 18, true, 'outside');
      soundSynthesizer.playOutOfBoundsBuzzer();
    }
  }, [evaluatePosition]);

  return {
    ...state,
    refreshPosition,
    setSimulationMode,
    calibrateToCurrentPosition,
  };
}
