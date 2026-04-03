# 🚀 Phase 5 Quick Reference Card

## Setup in 3 Steps

```bash
# 1. Run automated setup
./setup-notifications.sh

# 2. Apply database migration
supabase db push

# 3. Deploy edge function
supabase functions deploy email-notification
```

## Send a Notification (Code)

```typescript
import { notificationService } from '@/services/notificationService';

// Quick notification
await notificationService.createNotification({
  patient_id: 'uuid',
  type: 'General',
  title: 'Hello!',
  message: 'This is a test notification',
  send_email: true,
});

// Appointment reminder
await notificationService.sendAppointmentReminder(
  patientId, 
  '2026-04-05', 
  '10:00 AM', 
  'Cardiology'
);
```

## Test Notification (SQL)

```sql
-- Replace PATIENT_UUID with your patient's UUID
INSERT INTO notifications (patient_id, type, title, message, send_email)
VALUES (
  'PATIENT_UUID',
  'General',
  'Test Notification',
  'This is a test from the notification system.',
  true
);
```

## View Notifications (UI)

1. Login as patient
2. Go to Patient Dashboard
3. Click "Alerts" tab
4. Notifications appear in real-time!

## Check Email Logs

```sql
SELECT recipient, subject, status, sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 10;
```

## Useful Commands

```bash
# View edge function logs
supabase functions logs email-notification

# List secrets
supabase secrets list

# Test locally
supabase functions serve email-notification

# Deploy again
supabase functions deploy email-notification
```

## Component Usage

```tsx
import { NotificationsPanel } from '@/components/patient/NotificationsPanel';

<NotificationsPanel patientId={patientDbId} />
```

## Hook Usage

```tsx
import { useNotifications } from '@/hooks/useNotifications';

const { notifications, unreadCount, markAsRead } = useNotifications({
  patientId: 'uuid',
  autoRefresh: true,
});
```

## Notification Types

- `Token Update` - Queue status changes
- `Appointment Reminder` - Upcoming appointments  
- `Prescription Ready` - Prescriptions available
- `Lab Report Ready` - Test results ready
- `General` - System messages

## Delivery Channels

- ✅ **Email** - Gmail SMTP (implemented)
- 🚧 **SMS** - Twilio (scaffold ready)
- 🚧 **WhatsApp** - Twilio (scaffold ready)
- ✅ **Push** - In-app toast (implemented)

## File Locations

```
Components:  src/components/patient/NotificationsPanel.tsx
Hooks:       src/hooks/useNotifications.ts
Services:    src/services/notificationService.ts
             src/services/notificationIntegrations.ts
Edge Func:   supabase/functions/email-notification/
Migration:   supabase/migrations/20260403_create_notifications.sql
```

## Environment Variables

```bash
# Supabase Secrets (set once)
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sending | Check Gmail App Password, enable 2FA |
| Notifications not showing | Verify patient record exists, check RLS |
| Edge function error | Check logs: `supabase functions logs email-notification` |
| Build error | Run `npm install`, clear dist folder |

## Documentation

- 📘 **NOTIFICATIONS_SETUP.md** - Complete setup guide
- 📙 **PHASE_5_SUMMARY.md** - Implementation details
- 📗 **PHASE_5_IMPLEMENTATION.json** - Technical reference
- 📕 **README.md** - Project overview

## Support

Need help? Check:
1. Edge function logs
2. Browser console
3. Supabase dashboard (RLS policies)
4. Test with `test-notifications.sql`

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: April 3, 2026
