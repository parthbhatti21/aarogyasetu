# Email Notification Edge Function

This Supabase Edge Function sends email notifications to patients using Gmail SMTP.

## Setup

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Set up Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Enable **2-Step Verification** (required for app passwords)
4. Go back to Security, select **2-Step Verification**
5. Scroll to bottom and click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter "Aarogya Setu" as the app name
8. Click **Generate**
9. Copy the 16-character password (remove spaces)

### 3. Set up environment variables

Set the secrets in Supabase:

```bash
supabase secrets set GMAIL_EMAIL=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-app-password
```

**Important:** Use the App Password (16 characters), NOT your regular Gmail password!

### 3. Deploy the function

```bash
supabase functions deploy email-notification
```

## Usage

### Direct invocation

```typescript
const { data, error } = await supabase.functions.invoke('email-notification', {
  body: {
    to: 'patient@example.com',
    subject: 'Appointment Reminder',
    body: 'Your appointment is scheduled for tomorrow at 10:00 AM',
    patient_name: 'John Doe',
    notification_type: 'Appointment Reminder'
  }
});
```

### Via notification service

The function is automatically called by `notificationService.ts` when creating notifications with email enabled.

## Request Schema

```typescript
{
  to: string;              // Recipient email address (required)
  subject: string;         // Email subject (required)
  body: string;            // Email body text (required)
  patient_name?: string;   // Patient name for personalization (optional)
  notification_type?: string; // Type of notification (optional)
}
```

## Response Schema

### Success (200)
```json
{
  "success": true,
  "email_id": "abc123",
  "message": "Email sent successfully"
}
```

### Error (400/500)
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Email Service Provider

This function uses **Gmail SMTP** for email delivery. You can also use other providers:

- **Office 365**: Change hostname to `smtp.office365.com`, port 587
- **Outlook**: Change hostname to `smtp-mail.outlook.com`, port 587
- **Yahoo**: Change hostname to `smtp.mail.yahoo.com`, port 465
- **AWS SES**: Use AWS SES SMTP credentials
- **Custom SMTP**: Configure your own SMTP server

## Development & Testing

For local development without Gmail credentials, the function will simulate email sending and log the details to console.

To test locally with your Gmail credentials, create a `.env` file:

```bash
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

To test locally:

```bash
supabase functions serve email-notification
```

Then invoke it:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/email-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","subject":"Test","body":"Hello World"}'
```

## Email Templates

The function includes a responsive HTML email template with:
- Professional header with gradient
- Patient name personalization
- Notification type badge
- Formatted message body
- Help/support information
- Footer with branding

## Database Logging

Email activity is logged to the `email_logs` table (you need to create this):

```sql
CREATE TABLE email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL,
  external_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- CORS headers are configured for cross-origin requests
- Email validation is performed
- Service role key is used for database operations
- API keys are stored as Supabase secrets (not in code)

## Future Enhancements

- [ ] Add attachment support
- [ ] Template system with variables
- [ ] Retry mechanism for failed sends
- [ ] Rate limiting
- [ ] Bounce/complaint handling
- [ ] Email analytics/tracking
