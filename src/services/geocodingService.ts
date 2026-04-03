/**
 * Geocoding Service
 * Converts latitude/longitude coordinates to state/district information
 * Uses Nominatim (OpenStreetMap) reverse geocoding API - free, no API key required
 */

interface GeocodeResult {
  state: string | null;
  district: string | null;
  country: string | null;
  raw: any;
}

interface NominatimResponse {
  address?: {
    state?: string;
    state_district?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
  display_name?: string;
}

// Rate limiting: Nominatim allows 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

/**
 * Reverse geocode coordinates to get state and district
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns State and district information
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude. Must be between -90 and 90.');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude. Must be between -180 and 180.');
    }

    // Rate limiting: ensure we don't exceed 1 request per second
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    lastRequestTime = Date.now();

    // Build Nominatim API URL
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '10'); // Get state/district level details

    // Make request with proper headers
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Aarogya-Setu-Healthcare-App/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data: NominatimResponse = await response.json();

    // Extract state and district from response
    const state = data.address?.state || null;
    const district = data.address?.state_district || data.address?.county || null;
    const country = data.address?.country || null;

    return {
      state,
      district,
      country,
      raw: data,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Get user's current location and convert to state/district
 * @returns State and district based on browser geolocation
 */
export async function getUserLocation(): Promise<GeocodeResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await reverseGeocode(latitude, longitude);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMessage = 'Unable to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: false, // Don't need GPS accuracy for state detection
        timeout: 10000, // 10 second timeout
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Normalize state name for consistent matching
 * Handles variations in state names
 */
export function normalizeStateName(state: string): string {
  if (!state) return '';
  
  // Convert to title case and trim
  const normalized = state
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());

  // Handle common variations
  const stateMap: Record<string, string> = {
    'Odisha': 'Odisha',
    'Orissa': 'Odisha',
    'Uttarakhand': 'Uttarakhand',
    'Uttaranchal': 'Uttarakhand',
    'Telangana': 'Telangana',
    'Andhra Pradesh': 'Andhra Pradesh',
    'Jammu And Kashmir': 'Jammu and Kashmir',
    'Delhi': 'Delhi',
    'National Capital Territory Of Delhi': 'Delhi',
  };

  return stateMap[normalized] || normalized;
}
