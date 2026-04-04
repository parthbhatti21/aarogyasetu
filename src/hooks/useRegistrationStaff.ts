import { useState, useEffect } from 'react';
import {
  getRegistrationStaffByHospital,
  getAllRegistrationStaff,
  getRegistrationStaffStats,
} from '@/services/registrationStaffService';
import type { RegistrationStaffProfile } from '@/services/registrationStaffService';

export interface RegistrationStaffStats {
  totalStaff: number;
  activeStaff: number;
  inactiveStaff: number;
  operators: number;
  supervisors: number;
}

/**
 * Hook to manage registration staff data
 */
export function useRegistrationStaff(hospitalId?: string) {
  const [staff, setStaff] = useState<RegistrationStaffProfile[]>([]);
  const [stats, setStats] = useState<RegistrationStaffStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      let staffList: RegistrationStaffProfile[];

      if (hospitalId) {
        staffList = await getRegistrationStaffByHospital(hospitalId);
      } else {
        staffList = await getAllRegistrationStaff();
      }

      setStaff(staffList);

      // Load stats
      const statsData = await getRegistrationStaffStats(hospitalId);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load staff';
      setError(errorMessage);
      console.error('Error loading registration staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [hospitalId]);

  const refresh = () => {
    loadStaff();
  };

  return {
    staff,
    stats,
    loading,
    error,
    refresh,
  };
}
