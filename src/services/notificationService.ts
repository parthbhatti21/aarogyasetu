import { supabase } from '@/utils/supabase';
import { Notification } from '@/types/database';

export interface CreateNotificationPayload {
  patient_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  send_email?: boolean;
  send_sms?: boolean;
  send_whatsapp?: boolean;
  send_push?: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
}

export const notificationService = {
  /**
   * Create a new notification and optionally send it via email/SMS/WhatsApp
   */
  async createNotification(payload: CreateNotificationPayload): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        patient_id: payload.patient_id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        send_email: payload.send_email ?? true,
        send_sms: payload.send_sms ?? false,
        send_whatsapp: payload.send_whatsapp ?? false,
        send_push: payload.send_push ?? true,
        status: 'Pending',
        related_entity_type: payload.related_entity_type,
        related_entity_id: payload.related_entity_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger the notification sending
    await this.sendNotification(data.id);

    return data;
  },

  /**
   * Send a notification via configured channels (email, SMS, WhatsApp)
   */
  async sendNotification(notificationId: string): Promise<void> {
    try {
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          patients:patient_id (
            email,
            phone,
            full_name
          )
        `)
        .eq('id', notificationId)
        .single();

      if (fetchError) throw fetchError;

      const patient = notification.patients as any;
      const promises: Promise<any>[] = [];

      // Send email if enabled
      if (notification.send_email && patient?.email) {
        promises.push(
          supabase.functions.invoke('email-notification', {
            body: {
              to: patient.email,
              subject: notification.title,
              body: notification.message,
              patient_name: patient.full_name,
              notification_type: notification.type,
            },
          })
        );
      }

      // Send SMS if enabled (placeholder for future implementation)
      if (notification.send_sms && patient?.phone) {
        // TODO: Implement SMS via Twilio/similar
        console.log('SMS sending not yet implemented');
      }

      // Send WhatsApp if enabled (placeholder for future implementation)
      if (notification.send_whatsapp && patient?.phone) {
        // TODO: Implement WhatsApp via Twilio/WhatsApp Business API
        console.log('WhatsApp sending not yet implemented');
      }

      // Wait for all sending operations
      const results = await Promise.allSettled(promises);

      // Check if any failed
      const hasFailures = results.some((r) => r.status === 'rejected');

      // Update notification status
      await supabase
        .from('notifications')
        .update({
          status: hasFailures ? 'Failed' : 'Sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Mark as failed
      await supabase
        .from('notifications')
        .update({ status: 'Failed' })
        .eq('id', notificationId);
        
      throw error;
    }
  },

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(
    patientId: string,
    appointmentDate: string,
    appointmentTime: string,
    department?: string
  ): Promise<Notification> {
    return this.createNotification({
      patient_id: patientId,
      type: 'Appointment Reminder',
      title: '📅 Appointment Reminder',
      message: `You have an appointment scheduled for ${appointmentDate} at ${appointmentTime}${
        department ? ` in ${department}` : ''
      }. Please arrive 15 minutes early.`,
      send_email: true,
      send_sms: true,
    });
  },

  /**
   * Send token update notification
   */
  async sendTokenUpdate(
    patientId: string,
    tokenNumber: string,
    status: string,
    queuePosition?: number
  ): Promise<Notification> {
    let message = `Your token ${tokenNumber} status: ${status}`;
    if (queuePosition !== undefined) {
      message += `. You are #${queuePosition} in queue.`;
    }

    return this.createNotification({
      patient_id: patientId,
      type: 'Token Update',
      title: '🎫 Token Update',
      message,
      send_email: false,
      send_push: true,
    });
  },

  /**
   * Send prescription ready notification
   */
  async sendPrescriptionReady(
    patientId: string,
    prescriptionId: string
  ): Promise<Notification> {
    return this.createNotification({
      patient_id: patientId,
      type: 'Prescription Ready',
      title: '💊 Prescription Ready',
      message: 'Your prescription is ready for pickup at the pharmacy.',
      send_email: true,
      send_sms: true,
      related_entity_type: 'prescription',
      related_entity_id: prescriptionId,
    });
  },

  /**
   * Send lab report ready notification
   */
  async sendLabReportReady(
    patientId: string,
    reportId: string
  ): Promise<Notification> {
    return this.createNotification({
      patient_id: patientId,
      type: 'Lab Report Ready',
      title: '🧪 Lab Report Available',
      message: 'Your lab test results are now available. Please check your health records.',
      send_email: true,
      related_entity_type: 'medical_record',
      related_entity_id: reportId,
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'Read',
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Get unread notification count for a patient
   */
  async getUnreadCount(patientId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .neq('status', 'Read');

    if (error) throw error;
    return count || 0;
  },
};
