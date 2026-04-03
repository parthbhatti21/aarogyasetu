# Supabase Database Setup for Aarogya Setu

## Overview
This directory contains database migrations for the Aarogya Setu patient management system.

## Database Schema

### Core Tables
1. **patients** - Patient demographics and contact information
2. **medical_history** - Patient medical history and lifestyle data
3. **tokens** - Daily queue management and token system
4. **appointments** - Scheduled patient appointments
5. **medical_records** - Consultation notes, diagnoses, and documents
6. **prescriptions** - Medicine prescriptions with details
7. **medicines** - Medicine inventory and availability
8. **notifications** - Multi-channel notification queue
9. **ai_conversations** - AI agent conversation logs
10. **queue_counters** - Daily token number generator

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended for initial setup)

1. **Login to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Open your project: https://app.supabase.com/project/klqflfwsqooswhjjmloz

2. **Run the Migration**
   - Navigate to SQL Editor in the left sidebar
   - Click "New Query"
   - Copy the contents of `migrations/20260403_initial_schema.sql`
   - Paste and click "Run"

3. **Enable Email OTP Authentication**
   - Go to Authentication → Providers
   - Enable "Email" provider
   - Enable "Email OTP" option
   - Configure email templates (optional)

4. **Configure Storage for Medical Documents**
   - Go to Storage
   - Create a new bucket: `medical-documents`
   - Set bucket to **private** (only authenticated users)
   - Add policy: Allow authenticated users to upload/read their own files

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref klqflfwsqooswhjjmloz

# Run migration
supabase db push
```

## Database Functions

### Auto-generated IDs
- **Patient ID**: `ASPT-YYYYMMDD-XXXX` (e.g., ASPT-20260403-1234)
- **Token Number**: `T-XXX` (e.g., T-001, T-002, resets daily)
- **Appointment ID**: `APT-YYYYMMDD-XXXX`
- **Prescription ID**: `RX-YYYYMMDD-XXXX`

### Key Functions
- `generate_patient_id()` - Creates unique patient ID
- `generate_token_number()` - Generates next token for the day
- `generate_appointment_id()` - Creates appointment ID
- `generate_prescription_id()` - Creates prescription ID

## Row Level Security (RLS)

All tables have RLS enabled. Patients can only access their own data through policies that check:
```sql
auth.uid() = user_id
```

## Sample Data

The migration includes sample medicines in the `medicines` table for testing.

## Usage Examples

### Create a new patient
```sql
INSERT INTO patients (patient_id, full_name, phone, age, gender)
VALUES (generate_patient_id(), 'John Doe', '9876543210', 35, 'Male')
RETURNING *;
```

### Generate a token for a patient
```sql
INSERT INTO tokens (token_number, patient_id, chief_complaint)
VALUES (generate_token_number(), 'patient-uuid-here', 'Fever and cold')
RETURNING *;
```

### Search medicines
```sql
SELECT * FROM medicines 
WHERE name ILIKE '%paracetamol%' 
AND quantity_available > 0;
```

## Next Steps

After running the migration:
1. Configure Supabase Auth for Email OTP
2. Set up Storage bucket for medical documents
3. Configure Edge Function for Cohere API proxy
4. Set up real-time subscriptions for queue updates

## Troubleshooting

**Error: "extension uuid-ossp does not exist"**
- Enable UUID extension in Supabase Dashboard → Database → Extensions

**Error: "relation auth.users does not exist"**
- Make sure you're running this in your Supabase project (not local PostgreSQL)

**RLS policies blocking queries**
- Ensure you're authenticated with Supabase client
- Check that `auth.uid()` matches the `user_id` in the patients table
