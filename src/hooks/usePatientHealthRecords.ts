import { useCallback, useEffect, useState } from 'react';
import { getPatientClinicalData, type PatientClinicalData } from '@/services/doctorService';
import { supabase } from '@/utils/supabase';

export function usePatientHealthRecords(patientId: string | undefined) {
  const [data, setData] = useState<PatientClinicalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!patientId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getPatientClinicalData(patientId);
      setData(res);
    } catch (e: any) {
      setError(e.message || 'Could not load records');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!patientId) return;
    const channel = supabase
      .channel(`patient-records-${patientId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'medical_records', filter: `patient_id=eq.${patientId}` },
        () => refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prescriptions', filter: `patient_id=eq.${patientId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, refresh]);

  return { data, loading, error, refresh };
}
