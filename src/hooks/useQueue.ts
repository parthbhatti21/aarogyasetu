import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import type { Token } from '@/types/database';

interface UseQueueOptions {
  patientId?: string;
  autoRefresh?: boolean;
}

export function useQueue(options: UseQueueOptions = {}) {
  const { patientId, autoRefresh = true } = options;
  
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [queueData, setQueueData] = useState<Token[]>([]);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current patient's token
  const fetchCurrentToken = async () => {
    if (!patientId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('patient_id', patientId)
        .eq('visit_date', today)
        .in('status', ['Waiting', 'Active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setCurrentToken(data);
    } catch (err: any) {
      console.error('Error fetching current token:', err);
      setError(err.message);
    }
  };

  // Fetch currently active token
  const fetchActiveToken = async () => {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('status', 'Active')
        .order('called_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setActiveToken(data);
    } catch (err: any) {
      console.error('Error fetching active token:', err);
    }
  };

  // Fetch all waiting tokens
  const fetchQueueData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('visit_date', today)
        .eq('status', 'Waiting')
        .order('queue_position', { ascending: true });

      if (error) throw error;
      
      setQueueData(data || []);
      
      // Calculate queue position for current patient
      if (currentToken && data) {
        const position = data.findIndex(t => t.id === currentToken.id);
        setQueuePosition(position >= 0 ? position + 1 : null);
        
        // Estimate wait time (5 minutes per person)
        setEstimatedWaitTime((position >= 0 ? position : 0) * 5);
      }
    } catch (err: any) {
      console.error('Error fetching queue data:', err);
      setError(err.message);
    }
  };

  // Fetch all data
  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchCurrentToken(),
      fetchActiveToken(),
      fetchQueueData(),
    ]);
    setLoading(false);
  };

  // Subscribe to real-time changes
  useEffect(() => {
    fetchAll();

    if (!autoRefresh) return;

    // Set up real-time subscription
    const channel = supabase
      .channel('queue-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tokens',
        },
        (payload) => {
          console.log('Queue update:', payload);
          
          // Refresh data on any change
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, autoRefresh]);

  // Call next patient
  const callNext = async () => {
    try {
      // Get the first waiting token
      const { data: nextToken, error: fetchError } = await supabase
        .from('tokens')
        .select('*')
        .eq('status', 'Waiting')
        .order('queue_position', { ascending: true })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;
      if (!nextToken) throw new Error('No patients waiting');

      // Mark current active as completed
      if (activeToken) {
        await supabase
          .from('tokens')
          .update({ 
            status: 'Completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', activeToken.id);
      }

      // Mark next token as active
      const { error: updateError } = await supabase
        .from('tokens')
        .update({ 
          status: 'Active',
          called_at: new Date().toISOString()
        })
        .eq('id', nextToken.id);

      if (updateError) throw updateError;

      // Refresh data
      await fetchAll();
      
      return nextToken;
    } catch (err: any) {
      console.error('Error calling next patient:', err);
      setError(err.message);
      throw err;
    }
  };

  // Complete current patient
  const completeCurrentPatient = async () => {
    if (!activeToken) throw new Error('No active patient');

    try {
      const { error } = await supabase
        .from('tokens')
        .update({ 
          status: 'Completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', activeToken.id);

      if (error) throw error;

      await fetchAll();
    } catch (err: any) {
      console.error('Error completing patient:', err);
      setError(err.message);
      throw err;
    }
  };

  // Cancel token
  const cancelToken = async (tokenId: string) => {
    try {
      const { error } = await supabase
        .from('tokens')
        .update({ status: 'Cancelled' })
        .eq('id', tokenId);

      if (error) throw error;

      await fetchAll();
    } catch (err: any) {
      console.error('Error cancelling token:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    currentToken,
    activeToken,
    queueData,
    queuePosition,
    estimatedWaitTime,
    loading,
    error,
    refresh: fetchAll,
    callNext,
    completeCurrentPatient,
    cancelToken,
  };
}
