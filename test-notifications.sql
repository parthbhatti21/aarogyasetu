-- Test Script: Insert sample notifications for testing
-- Run this in Supabase SQL Editor to test the notification system

-- Step 1: Check if patients exist
SELECT 
  id, 
  patient_id, 
  full_name, 
  email, 
  phone 
FROM patients 
WHERE is_active = true 
LIMIT 5;

-- Step 2: Insert test notifications (replace 'PATIENT_UUID_HERE' with actual patient ID from Step 1)
-- Uncomment and replace the UUID below:

/*
INSERT INTO notifications (patient_id, type, title, message, send_email, send_sms, status)
VALUES 
  (
    'PATIENT_UUID_HERE', -- Replace with actual patient UUID
    'General',
    '🏥 Welcome to Aarogya Setu!',
    'Your account has been created successfully. You can now book appointments, view medical records, and receive timely notifications.',
    true,
    false,
    'Pending'
  ),
  (
    'PATIENT_UUID_HERE', -- Replace with actual patient UUID
    'Token Update',
    '🎫 Token Created',
    'Your token A-042 has been created. You are #5 in the queue. Estimated wait time: 50 minutes.',
    false,
    false,
    'Sent'
  ),
  (
    'PATIENT_UUID_HERE', -- Replace with actual patient UUID
    'Appointment Reminder',
    '📅 Appointment Tomorrow',
    'You have an appointment scheduled for tomorrow at 10:00 AM in Cardiology. Please arrive 15 minutes early.',
    true,
    true,
    'Sent'
  ),
  (
    'PATIENT_UUID_HERE', -- Replace with actual patient UUID
    'Lab Report Ready',
    '🧪 Lab Results Available',
    'Your lab test results are now available. Please check your health records section.',
    true,
    false,
    'Sent'
  ),
  (
    'PATIENT_UUID_HERE', -- Replace with actual patient UUID
    'Prescription Ready',
    '💊 Prescription Ready',
    'Your prescription is ready for pickup at the pharmacy counter.',
    true,
    true,
    'Read'
  );
*/

-- Step 3: Verify notifications were created
-- Uncomment to check:
/*
SELECT 
  type,
  title,
  message,
  status,
  send_email,
  send_sms,
  created_at
FROM notifications
WHERE patient_id = 'PATIENT_UUID_HERE'
ORDER BY created_at DESC;
*/

-- Step 4: Test email sending (will trigger the edge function)
-- The notification service will automatically send emails for notifications with send_email=true

-- Step 5: Check email logs
SELECT 
  recipient,
  subject,
  status,
  sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 10;

-- Step 6: Get unread notification count
-- Uncomment to check:
/*
SELECT COUNT(*) as unread_count
FROM notifications
WHERE patient_id = 'PATIENT_UUID_HERE'
AND status != 'Read';
*/

-- Step 7: Mark a notification as read (test the update policy)
-- Uncomment to test:
/*
UPDATE notifications
SET status = 'Read',
    read_at = NOW()
WHERE patient_id = 'PATIENT_UUID_HERE'
AND status != 'Read'
LIMIT 1;
*/

-- Step 8: Clean up test data (optional)
-- Uncomment to delete test notifications:
/*
DELETE FROM notifications
WHERE patient_id = 'PATIENT_UUID_HERE'
AND title LIKE '%Test%';
*/
