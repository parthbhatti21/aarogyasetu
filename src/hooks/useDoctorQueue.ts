import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { getDoctorQueue, type DoctorQueueToken } from '@/services/doctorService';

export function useDoctorQueue(doctorUserId?: string) {
  const [queue, setQueue] = useState<DoctorQueueToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!doctorUserId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDoctorQueue(doctorUserId);
      setQueue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    if (!doctorUserId) return;

    const channel = supabase
      .channel('doctor-queue-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tokens' },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorUserId]);

  return {
    queue,
    loading,
    error,
    refresh,
  };
}
