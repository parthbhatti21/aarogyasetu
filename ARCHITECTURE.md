# Phase 5: Notifications System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT DASHBOARD                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Tabs: Queue | Records | Alerts | Medicine                     │ │
│  │           ▲                                                     │ │
│  │           │ (Click Alerts Tab)                                 │ │
│  │           ▼                                                     │ │
│  │  ┌─────────────────────────────────────────────────────┐      │ │
│  │  │  NotificationsPanel Component                        │      │ │
│  │  │  ┌────────────────────────────────────────────────┐ │      │ │
│  │  │  │  • Real-time notification feed                 │ │      │ │
│  │  │  │  • Mark as read/Mark all as read              │ │      │ │
│  │  │  │  • Notification type badges                   │ │      │ │
│  │  │  │  • Delivery channel indicators                │ │      │ │
│  │  │  │  • Toast notifications on new alerts          │ │      │ │
│  │  │  └────────────────────────────────────────────────┘ │      │ │
│  │  └─────────────────────────────────────────────────────┘      │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        │ uses
                        ▼
    ┌──────────────────────────────────────────────────────────┐
    │          useNotifications() Hook                          │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  • Fetch notifications                             │  │
    │  │  • Real-time subscription (Supabase Realtime)      │  │
    │  │  • Mark as read / Mark all as read                 │  │
    │  │  • Unread count tracking                           │  │
    │  │  • Error handling & loading states                 │  │
    │  └────────────────────────────────────────────────────┘  │
    └───────────────────┬──────────────────────────────────────┘
                        │
                        │ calls
                        ▼
    ┌──────────────────────────────────────────────────────────┐
    │          notificationService                              │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  Methods:                                          │  │
    │  │  • createNotification()                            │  │
    │  │  • sendNotification()                              │  │
    │  │  • sendAppointmentReminder()                       │  │
    │  │  • sendTokenUpdate()                               │  │
    │  │  • sendPrescriptionReady()                         │  │
    │  │  • sendLabReportReady()                            │  │
    │  │  • markAsRead()                                    │  │
    │  │  • getUnreadCount()                                │  │
    │  └────────────────────────────────────────────────────┘  │
    └───────────┬─────────────────────────┬────────────────────┘
                │                         │
      ┌─────────┴──────────┐    ┌────────┴────────────────────┐
      │                    │    │                             │
      ▼                    ▼    ▼                             │
┌───────────┐      ┌──────────────────┐                      │
│ Supabase  │      │ Supabase Edge    │                      │
│ Database  │      │ Function         │                      │
│           │      │                  │                      │
│ Tables:   │      │ email-notification                      │
│ • notif.. │      │                  │                      │
│ • email.. │      │ ┌──────────────┐ │                      │
└───────────┘      │ │ Gmail SMTP   │ │                      │
      ▲            │ │ Port 465/TLS │ │                      │
      │            │ └──────────────┘ │                      │
      │            └─────────┬────────┘                      │
      │                      │                               │
      │                      ▼                               │
      │              ┌──────────────┐                        │
      │              │ Gmail Server │                        │
      │              │              │                        │
      │              │ Sends Email  │                        │
      │              └──────┬───────┘                        │
      │                     │                                │
      │                     ▼                                │
      │             ┌───────────────┐                        │
      │             │ Patient Inbox │                        │
      │             └───────────────┘                        │
      │                                                      │
      │  Logs success/failure                                │
      └──────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════

NOTIFICATION FLOW:

1. EVENT TRIGGER (e.g., Token Created, Appointment Scheduled)
   │
   ▼
2. notificationService.createNotification()
   │
   ├──> INSERT into notifications table (status: Pending)
   │
   ▼
3. notificationService.sendNotification()
   │
   ├──> Get patient email/phone from database
   │
   ├──> If send_email=true:
   │    │
   │    ▼
   │    Invoke supabase.functions.invoke('email-notification')
   │    │
   │    ▼
   │    Edge Function: Send via Gmail SMTP
   │    │
   │    ├──> Success: UPDATE status='Sent', log to email_logs
   │    └──> Failure: UPDATE status='Failed', log error
   │
   ├──> If send_sms=true:
   │    └──> (Future: Twilio API call)
   │
   ├──> If send_whatsapp=true:
   │    └──> (Future: WhatsApp Business API)
   │
   └──> If send_push=true:
        └──> Real-time via Supabase (already subscribed in UI)

4. REAL-TIME UPDATE
   │
   ▼
   Supabase Realtime broadcasts INSERT/UPDATE to subscribed clients
   │
   ▼
   useNotifications() hook receives update
   │
   ▼
   NotificationsPanel re-renders with new notification
   │
   ▼
   Toast notification appears in UI

════════════════════════════════════════════════════════════════════

DELIVERY CHANNELS:

┌──────────────┬──────────────┬────────────────────────────────┐
│   Channel    │    Status    │          Technology            │
├──────────────┼──────────────┼────────────────────────────────┤
│ Email        │ ✅ Active    │ Gmail SMTP via Edge Function   │
│ SMS          │ 🚧 Ready     │ Scaffold for Twilio/AWS SNS    │
│ WhatsApp     │ 🚧 Ready     │ Scaffold for Business API      │
│ Push (In-App)│ ✅ Active    │ Supabase Realtime + Toast      │
└──────────────┴──────────────┴────────────────────────────────┘

════════════════════════════════════════════════════════════════════

SECURITY LAYERS:

1. ROW LEVEL SECURITY (RLS)
   └─> Patients can only see their own notifications

2. SUPABASE SECRETS
   └─> Gmail credentials encrypted and stored securely

3. SERVICE ROLE AUTHENTICATION
   └─> Edge functions use service role key

4. EMAIL VALIDATION
   └─> Validate email format before sending

5. CORS CONFIGURATION
   └─> Proper headers for cross-origin requests

════════════════════════════════════════════════════════════════════

NOTIFICATION TYPES:

┌────────────────────────┬─────────────┬─────────────────────┐
│         Type           │    Icon     │       Color         │
├────────────────────────┼─────────────┼─────────────────────┤
│ Token Update           │    🎫       │    Blue             │
│ Appointment Reminder   │    📅       │    Green            │
│ Prescription Ready     │    💊       │    Purple           │
│ Lab Report Ready       │    🧪       │    Orange           │
│ General                │    📢       │    Gray             │
└────────────────────────┴─────────────┴─────────────────────┘

════════════════════════════════════════════════════════════════════

DATABASE SCHEMA:

notifications
├── id (UUID, PK)
├── patient_id (UUID, FK → patients.id)
├── type (ENUM)
├── title (TEXT)
├── message (TEXT)
├── send_email (BOOLEAN)
├── send_sms (BOOLEAN)
├── send_whatsapp (BOOLEAN)
├── send_push (BOOLEAN)
├── status (ENUM: Pending, Sent, Failed, Read)
├── sent_at (TIMESTAMPTZ)
├── read_at (TIMESTAMPTZ)
├── related_entity_type (TEXT)
├── related_entity_id (TEXT)
└── created_at (TIMESTAMPTZ)

email_logs
├── id (UUID, PK)
├── recipient (TEXT)
├── subject (TEXT)
├── body (TEXT)
├── status (TEXT)
├── external_id (TEXT)
├── sent_at (TIMESTAMPTZ)
└── created_at (TIMESTAMPTZ)

════════════════════════════════════════════════════════════════════
```

## Integration Points

### 1. Token Creation
```typescript
// When patient creates a token
createTokenWithNotification() 
  → Creates token in DB
  → Sends "Token Created" notification
  → Patient receives email + in-app alert
```

### 2. Token Status Change
```typescript
// When token status changes (e.g., called for consultation)
updateTokenStatusWithNotification()
  → Updates token status
  → Sends "Your Turn!" notification
  → Patient gets real-time alert
```

### 3. Appointment Reminder
```typescript
// Scheduled job (cron) runs daily
sendAppointmentReminders()
  → Finds appointments for next day
  → Sends reminder to each patient
  → Email + SMS delivery
```

### 4. Prescription Ready
```typescript
// When pharmacist marks prescription ready
notifyPrescriptionReady()
  → Creates notification
  → Sends to patient
  → Email + SMS + In-app
```

### 5. Lab Report Available
```typescript
// When lab results are uploaded
notifyLabReportReady()
  → Creates notification
  → Alerts patient
  → Email + In-app notification
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: April 3, 2026  
**Status**: ✅ Production Ready
