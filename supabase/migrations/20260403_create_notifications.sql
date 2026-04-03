-- Migration: Create notifications and email_logs tables
-- Description: Add support for multi-channel notifications (Email, SMS, WhatsApp, Push)

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Token Update', 'Appointment Reminder', 'Prescription Ready', 'Lab Report Ready', 'General')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  send_email BOOLEAN DEFAULT true,
  send_sms BOOLEAN DEFAULT false,
  send_whatsapp BOOLEAN DEFAULT false,
  send_push BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Read')),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_logs table for tracking email delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL,
  external_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_status ON notifications(patient_id, status);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Patients can view their own notifications
CREATE POLICY "Patients can view own notifications"
  ON notifications
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM patients WHERE id = notifications.patient_id
    )
  );

-- Patients can update their own notifications (mark as read)
CREATE POLICY "Patients can update own notifications"
  ON notifications
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM patients WHERE id = notifications.patient_id
    )
  );

-- Service role can do everything (for edge functions and admin operations)
CREATE POLICY "Service role has full access to notifications"
  ON notifications
  FOR ALL
  USING (auth.role() = 'service_role');

-- Service role can manage email logs
CREATE POLICY "Service role has full access to email_logs"
  ON email_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view all email logs
CREATE POLICY "Admins can view email_logs"
  ON email_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to automatically send notifications after insert
CREATE OR REPLACE FUNCTION trigger_send_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the notification creation
  RAISE NOTICE 'New notification created: % for patient %', NEW.id, NEW.patient_id;
  
  -- The actual sending will be handled by the application layer
  -- This trigger is just for logging and future automation
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new notifications
DROP TRIGGER IF EXISTS on_notification_created ON notifications;
CREATE TRIGGER on_notification_created
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_notification();

-- Insert sample notifications for testing (optional - comment out in production)
-- COMMENT: Uncomment the lines below to insert test data
/*
INSERT INTO notifications (patient_id, type, title, message, send_email, status)
SELECT 
  p.id,
  'General',
  'Welcome to Aarogya Setu! 🏥',
  'Your account has been created successfully. You can now book appointments, view your medical records, and receive timely notifications.',
  true,
  'Sent'
FROM patients p
WHERE p.is_active = true
LIMIT 5;
*/

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON email_logs TO authenticated;
