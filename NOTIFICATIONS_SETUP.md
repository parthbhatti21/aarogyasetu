# Phase 5: Notifications System - Setup Guide

## Overview
The notification system supports multi-channel delivery (Email, SMS, WhatsApp, Push) with real-time updates via Supabase.

## 🚀 Quick Start

### 1. Database Setup

Run the migration to create necessary tables:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/20260403_create_notifications.sql
```

### 2. Gmail SMTP Setup

#### Step-by-Step Gmail Configuration:

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - After enabling 2-Step Verification, go back to Security
   - Click "2-Step Verification" again
   - Scroll to bottom → "App passwords"
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: `Aarogya Setu Notifications`
   - Click **Generate**
   - Copy the 16-character password (no spaces)

3. **Configure Supabase Secrets**

```bash
# Set your Gmail credentials as Supabase secrets
supabase secrets set GMAIL_EMAIL=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**⚠️ Important:** Use the App Password, NOT your regular Gmail password!

### 3. Deploy Edge Function

```bash
# Deploy the email notification function
supabase functions deploy email-notification

# Test the deployment
supabase functions invoke email-notification \
  --data '{"to":"test@example.com","subject":"Test","body":"Hello World"}'
```

## 📧 Email Configuration Alternatives

### Using Different Email Providers

Edit `supabase/functions/email-notification/index.ts`:

#### Outlook/Office 365
```typescript
const client = new SMTPClient({
  connection: {
    hostname: "smtp.office365.com",
    port: 587,
    tls: true,
    auth: {
      username: "your-email@outlook.com",
      password: "your-password",
    },
  },
});
```

#### Yahoo Mail
```typescript
const client = new SMTPClient({
  connection: {
    hostname: "smtp.mail.yahoo.com",
    port: 465,
    tls: true,
    auth: {
      username: "your-email@yahoo.com",
      password: "your-app-password",
    },
  },
});
```

## 🔔 Usage Examples

### Send Notifications from Code

```typescript
import { notificationService } from '@/services/notificationService';

// Appointment Reminder
await notificationService.sendAppointmentReminder(
  patientId,
  '2026-04-05',
  '10:00 AM',
  'Cardiology'
);

// Token Update
await notificationService.sendTokenUpdate(
  patientId,
  'A-042',
  'Active',
  5
);

// Lab Report Ready
await notificationService.sendLabReportReady(
  patientId,
  reportId
);

// Custom Notification
await notificationService.createNotification({
  patient_id: patientId,
  type: 'General',
  title: 'Important Update',
  message: 'Your prescription is ready for pickup.',
  send_email: true,
  send_sms: false,
  send_whatsapp: false,
});
```

### Real-time Notifications

The `NotificationsPanel` component automatically subscribes to real-time updates via Supabase Realtime.

## 📊 Database Tables

### `notifications`
Stores all notifications with delivery preferences:
- `patient_id`: Reference to patient
- `type`: Type of notification
- `title`, `message`: Content
- `send_email`, `send_sms`, `send_whatsapp`, `send_push`: Channel flags
- `status`: Pending, Sent, Failed, Read

### `email_logs`
Tracks email delivery for debugging:
- `recipient`: Email address
- `subject`, `body`: Email content
- `status`: Delivery status
- `external_id`: Reference from email provider

## 🔐 Security

- **Row Level Security (RLS)** enabled on all tables
- Patients can only view/update their own notifications
- Email logs only accessible by service role and admins
- Gmail App Password stored as Supabase secret (encrypted)

## 🧪 Testing

### Test the Notification System

1. **Create a test patient** in your database
2. **Insert test notification**:

```sql
INSERT INTO notifications (patient_id, type, title, message, send_email, status)
VALUES (
  'your-patient-uuid',
  'General',
  'Test Notification',
  'This is a test notification to verify the system is working.',
  true,
  'Pending'
);
```

3. **Check PatientDashboard** - notification should appear in real-time
4. **Check email inbox** - email should be delivered

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve edge function locally
supabase functions serve email-notification

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/email-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "to": "test@example.com",
    "subject": "Test Notification",
    "body": "This is a test email.",
    "patient_name": "John Doe",
    "notification_type": "General"
  }'
```

## 🚧 Future Enhancements (Phase 5+)

- [ ] **SMS Integration** - Twilio/AWS SNS
- [ ] **WhatsApp Integration** - Twilio/WhatsApp Business API
- [ ] **Push Notifications** - Firebase Cloud Messaging
- [ ] **Notification Preferences UI** - Let patients customize channels
- [ ] **Scheduled Notifications** - Cron jobs for reminders
- [ ] **Email Templates** - Rich HTML templates
- [ ] **Notification History** - Archive and search

## 📝 Component Reference

### NotificationsPanel
Location: `src/components/patient/NotificationsPanel.tsx`

Props:
- `patientId` (string): Patient UUID

Features:
- Real-time notification updates
- Mark as read functionality
- Badge indicators for notification types
- Shows delivery channels (email, SMS, WhatsApp)

### notificationService
Location: `src/services/notificationService.ts`

Key Methods:
- `createNotification()`: Create and send notification
- `sendAppointmentReminder()`: Send appointment reminder
- `sendTokenUpdate()`: Send queue token update
- `sendPrescriptionReady()`: Notify prescription ready
- `sendLabReportReady()`: Notify lab report available
- `markAsRead()`: Mark notification as read
- `getUnreadCount()`: Get unread notification count

## ❓ Troubleshooting

### Email not sending?
1. Check Gmail App Password is correct
2. Verify Supabase secrets are set: `supabase secrets list`
3. Check edge function logs: `supabase functions logs email-notification`
4. Ensure 2-Step Verification is enabled on Gmail

### Notifications not appearing?
1. Check patient is registered: `SELECT * FROM patients WHERE user_id = 'auth-uid'`
2. Verify RLS policies allow access
3. Check browser console for Supabase Realtime connection
4. Ensure notification status is not 'Failed'

### Permission errors?
1. Check RLS policies in Supabase Dashboard
2. Verify user is authenticated
3. Ensure patient record exists and is linked to auth user

## 📞 Support

For issues or questions:
- Check the logs: `supabase functions logs email-notification`
- Review database RLS policies in Supabase Dashboard
- Test with sample data to isolate the issue
