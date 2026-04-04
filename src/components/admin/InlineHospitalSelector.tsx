import { useState, useEffect } from 'react';
import { fetchStates, fetchHospitalsByState } from '@/services/adminService';
import type { Hospital } from '@/types/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, X, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InlineHospitalSelectorProps {
  onSelect: (hospital: Hospital | null) => void;
  selectedHospital: Hospital | null;
}

export function InlineHospitalSelector({ onSelect, selectedHospital }: InlineHospitalSelectorProps) {
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
    setShowDropdown(true);
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

  if (selectedHospital) {
    return (
      <div className="border border-primary/50 rounded-md bg-primary/5 p-3 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm text-primary">{selectedHospital.hospital_name}</p>
          <p className="text-xs text-muted-foreground">{selectedHospital.state}</p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-destructive hover:text-destructive/80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            disabled={loadingStates}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm disabled:opacity-50"
          >
            <option value="">Choose state...</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Input
            placeholder={selectedState ? 'Search hospital...' : 'Select state first'}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            disabled={!selectedState || loadingHospitals}
            className="text-sm"
          />

          {showDropdown && selectedState && filteredHospitals.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 max-h-40 overflow-y-auto">
              {filteredHospitals.map((hospital) => (
                <button
                  key={hospital.id}
                  type="button"
                  onClick={() => handleHospitalSelect(hospital)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors text-sm border-b last:border-b-0"
                >
                  <p className="font-medium text-sm">{hospital.hospital_name}</p>
                  <p className="text-xs text-muted-foreground">{hospital.district || 'District not specified'}</p>
                </button>
              ))}
            </div>
          )}

          {showDropdown && selectedState && filteredHospitals.length === 0 && !loadingHospitals && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 p-3 text-sm text-muted-foreground">
              No hospitals found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
