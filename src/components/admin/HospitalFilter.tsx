import { useState, useEffect } from 'react';
import { fetchStates, fetchHospitalsByState } from '@/services/adminService';
import type { Hospital } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HospitalFilterProps {
  onSelect: (hospital: Hospital | null) => void;
  selectedHospital: Hospital | null;
}

export function HospitalFilter({ onSelect, selectedHospital }: HospitalFilterProps) {
  const { toast } = useToast();
  const [states, setStates] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadStates = async () => {
      setLoadingStates(true);
      try {
        const stateList = await fetchStates();
        setStates(stateList);
      } catch (err: any) {
        toast({
          title: 'Failed to load states',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, [toast]);

  const handleStateChange = async (state: string) => {
    setSelectedState(state);
    setSearchText('');
    setShowDropdown(false);
    
    if (!state) {
      setHospitals([]);
      setFilteredHospitals([]);
      return;
    }

    setLoadingHospitals(true);
    try {
      const hospitalList = await fetchHospitalsByState(state);
      setHospitals(hospitalList);
      setFilteredHospitals(hospitalList);
    } catch (err: any) {
      toast({
        title: 'Failed to load hospitals',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingHospitals(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (!text) {
      setFilteredHospitals(hospitals);
    } else {
      const filtered = hospitals.filter(h =>
        h.hospital_name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  };

  const handleHospitalSelect = (hospital: Hospital) => {
    onSelect(hospital);
    setShowDropdown(false);
    setSearchText('');
  };

  const handleClear = () => {
    onSelect(null);
    setSelectedState('');
    setSearchText('');
    setHospitals([]);
    setFilteredHospitals([]);
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-card border border-border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Filter by Hospital
        </h3>
        {selectedHospital && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-xs"
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Selector */}
        <div>
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" />
            Select State
          </label>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={loadingStates}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm disabled:opacity-50"
          >
            <option value="">Choose a state...</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* Hospital Selector with Search */}
        <div className="relative">
          <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4" />
            Hospital Name
          </label>
          <div className="relative">
            <Input
              placeholder={selectedState ? 'Search hospital...' : 'Select state first'}
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              disabled={!selectedState || loadingHospitals}
              className="text-sm"
            />

            {/* Dropdown List */}
            {showDropdown && selectedState && filteredHospitals.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredHospitals.map((hospital) => (
                  <button
                    key={hospital.id}
                    onClick={() => handleHospitalSelect(hospital)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors text-sm"
                  >
                    <p className="font-medium">{hospital.hospital_name}</p>
                    <p className="text-xs text-muted-foreground">{hospital.district || 'District not specified'}</p>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && selectedState && filteredHospitals.length === 0 && !loadingHospitals && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 p-3 text-sm text-muted-foreground">
                No hospitals found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Hospital Display */}
      {selectedHospital && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <p className="text-sm font-medium text-primary">
            Selected: <span className="font-semibold">{selectedHospital.hospital_name}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedHospital.state} · {selectedHospital.district || 'District not specified'}
          </p>
        </div>
      )}
    </div>
  );
}
