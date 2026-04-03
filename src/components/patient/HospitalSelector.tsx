/**
 * HospitalSelector Component
 * Location-aware hospital selection with fallback to manual state selection
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { Hospital } from '../../types/database';
import { useGeolocation } from '../../hooks/useGeolocation';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface HospitalSelectorProps {
  onHospitalSelect: (hospital: Hospital) => void;
  selectedHospitalId?: string;
}

export function HospitalSelector({ 
  onHospitalSelect, 
  selectedHospitalId 
}: HospitalSelectorProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  
  const {
    state: detectedState,
    district: detectedDistrict,
    isLoading: loadingLocation,
    error: locationError,
    permissionDenied,
    requestLocation,
  } = useGeolocation();

  // Load all hospitals on mount
  useEffect(() => {
    loadHospitals();
  }, []);

  // Extract unique states
  useEffect(() => {
    const states = Array.from(new Set(hospitals.map(h => h.state)))
      .filter(Boolean)
      .sort();
    setAvailableStates(states);
  }, [hospitals]);

  // Auto-select state when location is detected AND hospitals are loaded
  useEffect(() => {
    if (detectedState && hospitals.length > 0 && !loadingHospitals) {
      setSelectedState(detectedState);
    }
  }, [detectedState, hospitals.length, loadingHospitals]);

  // Filter hospitals by selected state
  useEffect(() => {
    if (selectedState) {
      const filtered = hospitals.filter(h => h.state === selectedState);
      
      // Sort by district if we have detected district
      if (detectedDistrict) {
        filtered.sort((a, b) => {
          // Prioritize hospitals in detected district
          const aMatch = a.district?.toLowerCase() === detectedDistrict.toLowerCase();
          const bMatch = b.district?.toLowerCase() === detectedDistrict.toLowerCase();
          if (aMatch && !bMatch) return -1;
          if (!aMatch && bMatch) return 1;
          return a.hospital_name.localeCompare(b.hospital_name);
        });
      } else {
        filtered.sort((a, b) => a.hospital_name.localeCompare(b.hospital_name));
      }
      
      setFilteredHospitals(filtered);
    } else {
      setFilteredHospitals([]);
    }
  }, [selectedState, hospitals, detectedDistrict]);

  const loadHospitals = async () => {
    setLoadingHospitals(true);
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('hospital_name');

      if (error) throw error;
      setHospitals(data || []);
    } catch (error) {
      console.error('Error loading hospitals:', error);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleLocationRequest = async () => {
    setLocationAttempted(true);
    try {
      await requestLocation();
    } catch (error) {
      console.error('Location request failed:', error);
    }
  };

  const handleHospitalChange = (hospitalId: string) => {
    const hospital = filteredHospitals.find(h => h.id === hospitalId);
    if (hospital) {
      onHospitalSelect(hospital);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Select Hospital</Label>
        
        {/* Location Detection */}
        {!locationAttempted && !selectedState && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLocationRequest}
            disabled={loadingLocation || loadingHospitals}
          >
            {loadingLocation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting your location...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-4 w-4" />
                Use My Location to Find Nearby Hospitals
              </>
            )}
          </Button>
        )}

        {/* Location Detected Success */}
        {detectedState && (
          <Alert className="bg-green-50 border-green-200">
            <MapPin className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Location detected: {detectedDistrict ? `${detectedDistrict}, ` : ''}{detectedState}
            </AlertDescription>
          </Alert>
        )}

        {/* Location Error */}
        {locationError && locationAttempted && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {permissionDenied 
                ? 'Location access denied. Please select your state manually below.'
                : locationError}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual State Selection (shown if location denied or not attempted) */}
        {(permissionDenied || locationAttempted || selectedState) && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="state-select" className="text-sm text-gray-600">
                {detectedState ? 'Change State' : 'Select Your State'}
              </Label>
              <Select 
                value={selectedState} 
                onValueChange={setSelectedState}
                disabled={loadingHospitals}
              >
                <SelectTrigger id="state-select" className="w-full">
                  <SelectValue placeholder="Choose a state..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStates.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hospital Selection */}
            {selectedState && filteredHospitals.length > 0 && (
              <div>
                <Label htmlFor="hospital-select" className="text-sm text-gray-600">
                  Select Hospital
                </Label>
                <Select 
                  value={selectedHospitalId} 
                  onValueChange={handleHospitalChange}
                >
                  <SelectTrigger id="hospital-select" className="w-full">
                    <SelectValue placeholder="Choose a hospital..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredHospitals.map(hospital => (
                      <SelectItem key={hospital.id} value={hospital.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{hospital.hospital_name}</span>
                          {hospital.district && (
                            <span className="text-xs text-gray-500">{hospital.district}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredHospitals.length} hospital{filteredHospitals.length !== 1 ? 's' : ''} in {selectedState}
                </p>
              </div>
            )}

            {selectedState && filteredHospitals.length === 0 && loadingHospitals && (
              <div className="flex items-center justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Loading hospitals for {selectedState}...</span>
              </div>
            )}

            {selectedState && filteredHospitals.length === 0 && !loadingHospitals && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hospitals found in {selectedState}. Please select a different state.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {loadingHospitals && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Loading hospitals...</span>
          </div>
        )}
      </div>
    </div>
  );
}
