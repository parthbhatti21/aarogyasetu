/**
 * useGeolocation Hook
 * Manages browser geolocation with state/district detection
 */

import { useState, useCallback } from 'react';
import { getUserLocation, normalizeStateName } from '../services/geocodingService';

export interface LocationState {
  state: string | null;
  district: string | null;
  country: string | null;
  isLoading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export interface UseGeolocationReturn extends LocationState {
  requestLocation: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook to manage geolocation and reverse geocoding
 * Provides location permission request and state/district detection
 */
export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<LocationState>({
    state: null,
    district: null,
    country: null,
    isLoading: false,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      permissionDenied: false,
    }));

    try {
      const result = await getUserLocation();
      
      // Normalize state name for consistent matching
      const normalizedState = result.state 
        ? normalizeStateName(result.state) 
        : null;

      setState({
        state: normalizedState,
        district: result.district,
        country: result.country,
        isLoading: false,
        error: null,
        permissionDenied: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to get location';
      
      const isDenied = errorMessage.toLowerCase().includes('permission denied');

      setState({
        state: null,
        district: null,
        country: null,
        isLoading: false,
        error: errorMessage,
        permissionDenied: isDenied,
      });

      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      state: null,
      district: null,
      country: null,
      isLoading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  return {
    ...state,
    requestLocation,
    reset,
  };
}
