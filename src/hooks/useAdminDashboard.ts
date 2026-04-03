import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdminOverview,
  fetchDoctorPatientStats,
  fetchTodayDateString,
  type DoctorPatientStats,
  type TokenWithPatient,
} from '@/services/adminService';
import { supabase } from '@/utils/supabase';

export function useAdminDashboard(adminUserId?: string) {
  const [today, setToday] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPatients, setTotalPatients] = useState(0);
  const [tokensToday, setTokensToday] = useState(0);
  const [waitingOrActive, setWaitingOrActive] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [recentPatients, setRecentPatients] = useState<
    { id: string; patient_id: string; full_name: string; phone: string; created_at: string }[]
  >([]);
  const [liveQueue, setLiveQueue] = useState<TokenWithPatient[]>([]);
  const [doctorStats, setDoctorStats] = useState<DoctorPatientStats[]>([]);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  // Fetch admin's hospital on mount
  useEffect(() => {
    const fetchHospitalId = async () => {
      if (!adminUserId) return;
      
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('hospital_id')
        .eq('user_id', adminUserId)
        .single();

      if (staffProfile?.hospital_id) {
        setHospitalId(staffProfile.hospital_id);
      }
    };

    fetchHospitalId();
  }, [adminUserId]);

  const refresh = useCallback(async () => {
    const d = await fetchTodayDateString();
    setToday(d);
    setError(null);
    try {
      const overview = await fetchAdminOverview(d, hospitalId);
      setTotalPatients(overview.totalPatients);
      setTokensToday(overview.tokensToday);
      setWaitingOrActive(overview.waitingOrActive);
      setCompletedToday(overview.completedToday);
      setRecentPatients(overview.recentPatients as typeof recentPatients);
      setLiveQueue(overview.liveQueue);
      const stats = await fetchDoctorPatientStats(d, hospitalId);
      setDoctorStats(stats);
    } catch (e: any) {
      setError(e.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_records' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_profiles' }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return {
    today,
    loading,
    error,
    totalPatients,
    tokensToday,
    waitingOrActive,
    completedToday,
    recentPatients,
    liveQueue,
    doctorStats,
    refresh,
  };
}
