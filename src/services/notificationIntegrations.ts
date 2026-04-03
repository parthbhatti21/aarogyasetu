/**
 * Example integration: Sending notifications when creating tokens
 * 
 * This file demonstrates how to integrate the notification service
 * with existing features like token creation.
 */

import { supabase } from '@/utils/supabase';
import { notificationService } from '@/services/notificationService';

/**
 * Enhanced token creation with automatic notification
 */
export async function createTokenWithNotification(payload: {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  visitType: string;
  priority?: string;
}) {
  const { patientId, chiefComplaint, symptoms, visitType, priority = 'Normal' } = payload;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Check for existing token
    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id, token_number')
      .eq('patient_id', patientId)
      .eq('visit_date', today)
      .in('status', ['Waiting', 'Active'])
      .maybeSingle();

    if (existingToken) {
      throw new Error(`You already have a token today (${existingToken.token_number})`);
    }

    // Get queue position
    const { count: waitingCount } = await supabase
      .from('tokens')
      .select('id', { count: 'exact', head: true })
      .eq('visit_date', today)
      .eq('status', 'Waiting');

    // Generate token number
    const { data: tokenNumber } = await supabase.rpc('generate_token_number');

    if (!tokenNumber) {
      throw new Error('Failed to generate token number');
    }

    // Create token
    const { data: newToken, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        patient_id: patientId,
        token_number: tokenNumber,
        visit_date: today,
        visit_type: visitType,
        priority: priority,
        status: 'Waiting',
        queue_position: (waitingCount || 0) + 1,
        chief_complaint: chiefComplaint,
        symptoms: symptoms,
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    // Send notification about token creation
    await notificationService.createNotification({
      patient_id: patientId,
      type: 'Token Update',
      title: '🎫 Token Created Successfully',
      message: `Your token ${tokenNumber} has been created. You are #${newToken.queue_position} in the queue. Estimated wait time: ${newToken.queue_position * 10} minutes.`,
      send_email: true,
      send_push: true,
      related_entity_type: 'token',
      related_entity_id: newToken.id,
    });

    return newToken;
  } catch (error) {
    console.error('Error creating token with notification:', error);
    throw error;
  }
}

/**
 * Update token status with notification
 */
export async function updateTokenStatusWithNotification(
  tokenId: string,
  newStatus: string,
  patientId: string,
  tokenNumber: string
) {
  try {
    // Update token status
    const { error: updateError } = await supabase
      .from('tokens')
      .update({ 
        status: newStatus,
        ...(newStatus === 'Active' && { called_at: new Date().toISOString() }),
        ...(newStatus === 'Completed' && { completed_at: new Date().toISOString() }),
      })
      .eq('id', tokenId);

    if (updateError) throw updateError;

    // Send notification based on status
    let title = '';
    let message = '';
    let sendEmail = false;

    switch (newStatus) {
      case 'Active':
        title = '🔔 Your Turn!';
        message = `Token ${tokenNumber} is now active. Please proceed to the consultation room.`;
        sendEmail = true;
        break;
      case 'Completed':
        title = '✅ Consultation Complete';
        message = `Your consultation for token ${tokenNumber} has been completed. Thank you for visiting!`;
        sendEmail = false;
        break;
      case 'Cancelled':
        title = '❌ Token Cancelled';
        message = `Token ${tokenNumber} has been cancelled. If this was a mistake, please contact reception.`;
        sendEmail = true;
        break;
    }

    if (title && message) {
      await notificationService.createNotification({
        patient_id: patientId,
        type: 'Token Update',
        title,
        message,
        send_email: sendEmail,
        send_push: true,
        related_entity_type: 'token',
        related_entity_id: tokenId,
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating token status:', error);
    throw error;
  }
}

/**
 * Example: Send appointment reminders (can be called by a cron job)
 */
export async function sendAppointmentReminders() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    // Get all appointments for tomorrow
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*, patients!inner(*)')
      .eq('appointment_date', tomorrowDate)
      .in('status', ['Scheduled', 'Confirmed']);

    if (error) throw error;

    for (const appointment of appointments || []) {
      await notificationService.sendAppointmentReminder(
        appointment.patient_id,
        appointment.appointment_date,
        appointment.appointment_time,
        appointment.department
      );
    }

    console.log(`Sent ${appointments?.length || 0} appointment reminders`);
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
    throw error;
  }
}

/**
 * Example: Notify when prescription is ready
 */
export async function notifyPrescriptionReady(prescriptionId: string) {
  try {
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .select('patient_id')
      .eq('id', prescriptionId)
      .single();

    if (error) throw error;

    await notificationService.sendPrescriptionReady(
      prescription.patient_id,
      prescriptionId
    );

    console.log('Prescription ready notification sent');
  } catch (error) {
    console.error('Error notifying prescription ready:', error);
    throw error;
  }
}

/**
 * Example: Notify when lab report is available
 */
export async function notifyLabReportReady(medicalRecordId: string) {
  try {
    const { data: record, error } = await supabase
      .from('medical_records')
      .select('patient_id')
      .eq('id', medicalRecordId)
      .single();

    if (error) throw error;

    await notificationService.sendLabReportReady(
      record.patient_id,
      medicalRecordId
    );

    console.log('Lab report ready notification sent');
  } catch (error) {
    console.error('Error notifying lab report ready:', error);
    throw error;
  }
}
