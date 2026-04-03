import { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Phone, Check, X, Clock, AlertCircle, TestTube } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Notification } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { notificationService } from '@/services/notificationService';

interface NotificationsPanelProps {
  patientId: string;
}

const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
  const iconMap = {
    'Token Update': Bell,
    'Appointment Reminder': Clock,
    'Prescription Ready': AlertCircle,
    'Lab Report Ready': AlertCircle,
    'General': MessageSquare,
  };
  const Icon = iconMap[type] || Bell;
  return <Icon className="h-5 w-5" />;
};

const getNotificationColor = (type: Notification['type']) => {
  const colorMap = {
    'Token Update': 'bg-blue-100 text-blue-800',
    'Appointment Reminder': 'bg-green-100 text-green-800',
    'Prescription Ready': 'bg-purple-100 text-purple-800',
    'Lab Report Ready': 'bg-orange-100 text-orange-800',
    'General': 'bg-gray-100 text-gray-800',
  };
  return colorMap[type] || 'bg-gray-100 text-gray-800';
};

export const NotificationsPanel = ({ patientId }: NotificationsPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sendingTest, setSendingTest] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to real-time notifications
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
            
            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
              duration: 5000,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, toast]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => n.status !== 'Read').length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'Read',
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: 'Read' as const, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter((n) => n.status !== 'Read')
        .map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          status: 'Read',
          read_at: new Date().toISOString() 
        })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'Read' as const, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const sendTestNotification = async () => {
    setSendingTest(true);
    try {
      const testTypes: Notification['type'][] = [
        'Token Update',
        'Appointment Reminder',
        'Prescription Ready',
        'Lab Report Ready',
        'General',
      ];
      
      const randomType = testTypes[Math.floor(Math.random() * testTypes.length)];
      
      const testMessages = {
        'Token Update': {
          title: '🎫 Test Token Notification',
          message: 'This is a test token update. Your token A-999 has been created for testing purposes.',
        },
        'Appointment Reminder': {
          title: '📅 Test Appointment Reminder',
          message: 'This is a test appointment reminder. You have a test appointment scheduled for tomorrow at 10:00 AM.',
        },
        'Prescription Ready': {
          title: '💊 Test Prescription Alert',
          message: 'This is a test prescription notification. Your test prescription is ready for pickup.',
        },
        'Lab Report Ready': {
          title: '🧪 Test Lab Report',
          message: 'This is a test lab report notification. Your test results are now available.',
        },
        'General': {
          title: '🔔 Test General Notification',
          message: 'This is a general test notification to verify the notification system is working correctly.',
        },
      };

      const { title, message } = testMessages[randomType];

      await notificationService.createNotification({
        patient_id: patientId,
        type: randomType,
        title,
        message,
        send_email: true,
        send_push: true,
        send_sms: false,
        send_whatsapp: false,
      });

      toast({
        title: 'Test Notification Sent! ✅',
        description: `A test "${randomType}" notification has been created and sent via email.`,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={sendTestNotification}
            disabled={sendingTest}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {sendingTest ? 'Sending...' : 'Send Test'}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notification Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">In-App</p>
                <p className="text-xs text-gray-500">Always on</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-gray-500">Enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">SMS</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-sm">WhatsApp</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-gray-500">We'll notify you about appointments, test results, and more</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all ${
                notification.status === 'Read' ? 'bg-white' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}
                  >
                    <NotificationIcon type={notification.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <Badge variant={notification.status === 'Read' ? 'secondary' : 'default'}>
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      {notification.status === 'Sent' && (
                        <div className="flex items-center gap-2">
                          {notification.send_email && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" /> Email
                            </Badge>
                          )}
                          {notification.send_sms && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="h-3 w-3 mr-1" /> SMS
                            </Badge>
                          )}
                          {notification.send_whatsapp && (
                            <Badge variant="outline" className="text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp
                            </Badge>
                          )}
                        </div>
                      )}
                      {notification.status === 'Failed' && (
                        <Badge variant="destructive" className="text-xs">
                          <X className="h-3 w-3 mr-1" /> Failed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {notification.status !== 'Read' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
