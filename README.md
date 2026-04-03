# Welcome to Aarogya Setu

A comprehensive healthcare management platform providing integrated solutions for patient care, medical records, and healthcare services.

## Features

### Core Features
- 👤 **Patient Management Dashboard** - Complete patient profile and health tracking
- 👨‍⚕️ **Doctor Portal** - Consultation management and patient records
- 👨‍💼 **Admin Dashboard** - System administration and reporting
- 💊 **Medical Store Management** - Inventory and prescription management
- 📝 **AI-Powered Registration** - Voice-enabled patient intake system
- 🔄 **Real-time Data Synchronization** - Powered by Supabase

### Phase 5: Notifications System ✨ NEW
- 🔔 **Multi-Channel Notifications** - Email, SMS, WhatsApp (planned), and Push
- 📧 **Email Integration** - Gmail SMTP with beautiful HTML templates
- 🎫 **Token Updates** - Real-time queue status notifications
- 📅 **Appointment Reminders** - Automated reminder system
- 💊 **Prescription Alerts** - Notify when prescriptions are ready
- 🧪 **Lab Report Notifications** - Alert when test results are available
- ⚡ **Real-time Updates** - Live notification feed with Supabase Realtime

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Email**: Gmail SMTP via Supabase Edge Functions
- **State Management**: React Query + Context API
- **Testing**: Vitest + Playwright

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase CLI
- Gmail account (for email notifications)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd careflow-ai

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Setup Notifications (Phase 5)

```bash
# Quick setup with automated script
./setup-notifications.sh

# Or manual setup - see NOTIFICATIONS_SETUP.md
```

## Project Structure

```
careflow-ai/
├── src/
│   ├── components/
│   │   ├── patient/
│   │   │   ├── NotificationsPanel.tsx    # Notification UI
│   │   │   └── VirtualWaitingRoom.tsx
│   │   └── ui/                            # Shadcn UI components
│   ├── hooks/
│   │   ├── useNotifications.ts            # Notification hook
│   │   └── useQueue.ts
│   ├── pages/
│   │   ├── PatientDashboard.tsx
│   │   ├── DoctorDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── services/
│   │   ├── notificationService.ts         # Notification logic
│   │   └── notificationIntegrations.ts    # Integration examples
│   └── types/
│       └── database.ts                    # TypeScript types
├── supabase/
│   ├── functions/
│   │   └── email-notification/            # Email edge function
│   └── migrations/
│       └── 20260403_create_notifications.sql
├── NOTIFICATIONS_SETUP.md                 # Detailed setup guide
├── setup-notifications.sh                 # Automated setup script
└── test-notifications.sql                 # Test script

```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
```

## Documentation

- [Notifications Setup Guide](./NOTIFICATIONS_SETUP.md) - Complete guide for Phase 5
- [Phase 5 Implementation Details](./PHASE_5_IMPLEMENTATION.json) - Technical documentation
- [Email Function README](./supabase/functions/email-notification/README.md) - Edge function docs

## Features by Role

### Patient Portal
- Self-registration with AI assistance
- Virtual waiting room with real-time queue updates
- Medical history and records viewer
- Notifications for appointments, prescriptions, and lab results
- Medicine availability checker (coming soon)

### Doctor Dashboard
- Patient consultation management
- Token/queue management
- Medical record creation
- Prescription management

### Admin Dashboard
- User management
- System analytics
- Report generation
- Medical store inventory

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Cohere AI (for patient registration)
VITE_COHERE_API_KEY=your-cohere-api-key
```

### Supabase Secrets (for Edge Functions)

```bash
supabase secrets set GMAIL_EMAIL=your-email@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your-16-char-app-password
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Check documentation in `/docs` folder
- Review setup guides for each phase

## Roadmap

- [x] Phase 1-4: Core Platform Features
- [x] Phase 5: Notifications System (Email ✅, SMS 🚧, WhatsApp 🚧)
- [ ] Phase 6: Additional Features
  - [ ] Health records viewer
  - [ ] Document upload
  - [ ] Medicine checker
  - [ ] Multi-language UI

---

Built with ❤️ for better healthcare management
