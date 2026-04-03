import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Notification } from '@/types/database';
import { notificationService } from '@/services/notificationService';

interface UseNotificationsOptions {
  patientId?: string;
  autoRefresh?: boolean;
  limit?: number;
}

export const useNotifications = (options: UseNotificationsOptions = {}) => {
  const { patientId, autoRefresh = true, limit = 50 } = options;
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotifications = async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => n.status !== 'Read').length || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId 
            ? { ...n, status: 'Read' as const, read_at: new Date().toISOString() } 
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!patientId) return;

    try {
      const unreadIds = notifications
        .filter((n) => n.status !== 'Read')
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          status: 'Read',
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds);

      if (updateError) throw updateError;

      setNotifications((prev) =>
        prev.map((n) => ({ 
          ...n, 
          status: 'Read' as const, 
          read_at: new Date().toISOString() 
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!patientId || !autoRefresh) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, autoRefresh]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};
