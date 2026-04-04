# Database Migration Deployment Guide

## Issue
The registration staff feature requires database tables that haven't been created yet:
- `registration_staff_profiles` - Staff account information
- Extended `patients` table - Additional fields for registration desk
- Extended `tokens` table - Registration desk specific fields
- `chief_complaint_to_specialty` - Doctor suggestion mappings

## Solution: Deploy Migration

You have two options:

---

## Option A: Using Supabase Dashboard (Recommended - No Setup Needed)

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com
   - Project: Aarogya Setu
   - Login with your credentials

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Migration SQL**
   - Open this file: `supabase/migrations/20260404_registration_desk_phase1.sql`
   - Copy ALL the SQL content

4. **Paste into Supabase SQL Editor**
   - Paste the entire SQL into the query editor
   - Review the SQL (it creates tables and indexes)

5. **Execute the Migration**
   - Click "Run" button (or Cmd+Enter)
   - Wait for completion

6. **Check Results**
   - Should show: "Success. No rows returned"
   - Or any warnings (these are usually fine)

7. **Test the Feature**
   - Go back to your app
   - Admin Dashboard → Registration Desk Management
   - Click "Create Staff Account"
   - Try creating a staff member
   - Should work now! ✅

---

## Option B: Using Script (If you have service role key)

### Prerequisites:
- Supabase Service Role Key (from Project Settings → API)

### Steps:

1. **Get Service Role Key**
   ```
   1. Go to Supabase Dashboard
   2. Click "Project Settings" → API
   3. Copy the "service_role" key (NOT the anon key)
   ```

2. **Set Environment Variable**
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
   ```

3. **Run Migration Script**
   ```bash
   node deploy-migration.js
   ```

4. **Check Output**
   - Should show: "✅ Migration executed successfully!"
   - If errors, check the message

---

## Option C: Using Node Script (Another approach)

If you have access to TypeScript/Node utilities:

```typescript
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  'https://klqflfwsqooswhjjmloz.supabase.co',
  'YOUR_SERVICE_ROLE_KEY'
);

const migration = fs.readFileSync('./supabase/migrations/20260404_registration_desk_phase1.sql', 'utf-8');

// Execute via RPC or raw query
const { error } = await supabase.rpc('exec_sql', { sql: migration });

if (!error) {
  console.log('✅ Migration deployed!');
} else {
  console.error('❌ Error:', error);
}
```

---

## Troubleshooting

### Error: "Table already exists"
- This is **normal** - the migration uses `CREATE TABLE IF NOT EXISTS`
- Just means the table was partially created before
- Continue with the deployment

### Error: "Column already exists"
- The migration uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- This is **expected** if some fields exist
- Continue with the deployment

### Error: "Permission denied"
- You need admin access to Supabase
- Make sure you're using the **service_role** key (not anon key)
- Ask your Supabase project owner for access

### Migration doesn't complete
- The SQL file has many statements (300+ lines)
- Some Supabase interfaces have timeout limits
- Try running in smaller chunks:
  - Split the SQL file into parts
  - Run each part separately

---

## What the Migration Creates

### 1. `registration_staff_profiles` Table
- Stores registration desk staff information
- Links to `auth.users` for authentication
- Fields: full_name, email, phone, hospital_id, role, is_active, etc.

### 2. Extended `patients` Table
- Adds: first_name, surname, occupation, income, billing_type
- Adds: registered_by (who registered them), registration_desk_timestamp

### 3. Extended `tokens` Table
- Adds: registration_staff_id, desk_location, queue_position
- Adds: print_count, printed_at, printed_by

### 4. `chief_complaint_to_specialty` Table
- Maps patient complaints to doctor specialties
- Used for AI-powered doctor suggestions
- Pre-populated with 30+ mappings

### 5. `registration_desk_audit_log` Table
- Logs all registration desk activities
- For compliance and debugging

### 6. `token_sequences` Table
- Tracks sequential token numbers per hospital per day
- Ensures unique token IDs across registrations

### 7. Indexes & Policies
- Performance indexes on frequently queried columns
- RLS policies for security and data isolation

---

## Verify Migration Success

After deployment, verify everything worked:

### Method 1: Check in Supabase Dashboard
1. Go to Supabase → Project → SQL Editor
2. Run this query:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name LIKE 'registration%'
   ```
3. Should see 2-3 registration tables

### Method 2: Test the Feature
1. Go to Admin Dashboard
2. Find "Registration Desk Management" section
3. Click "Create Staff Account"
4. Try creating a staff member
5. If successful: ✅ Migration worked!
6. If error "Could not find table": Migration not applied

### Method 3: Query in App
```typescript
const { data, error } = await supabase
  .from('registration_staff_profiles')
  .select('*');

if (!error) {
  console.log('✅ Table exists and is accessible!');
} else {
  console.error('❌ Table not found:', error);
}
```

---

## After Deployment

Once the migration is deployed:

1. ✅ Staff creation will work
2. ✅ All validation will work
3. ✅ Database errors will go away
4. ✅ You can create registration staff
5. ✅ Staff can login and register patients

---

## Quick Checklist

- [ ] Mission file location confirmed: `supabase/migrations/20260404_registration_desk_phase1.sql`
- [ ] Supabase account/access verified
- [ ] Service role key obtained (if using script)
- [ ] Migration SQL copied/ready
- [ ] SQL executed in Supabase dashboard or via script
- [ ] No errors during execution
- [ ] Tables verified (in dashboard or via query)
- [ ] Feature tested (create staff account)
- [ ] Success confirmed ✅

---

## Questions?

1. **"How do I find my Supabase project?"**
   - Supabase.com → Login → Look for "Aarogya Setu" project

2. **"Where's the service role key?"**
   - Project → Settings → API → Scroll to "Service Role" section

3. **"Can I run multiple times?"**
   - Yes! The migration uses `IF NOT EXISTS` clauses
   - Running multiple times is safe

4. **"How long does it take?"**
   - Usually 5-10 seconds
   - Depends on Supabase server load

5. **"What if it fails?"**
   - Check the error message carefully
   - Look at the "Troubleshooting" section above
   - Contact Supabase support if needed

---

## Timeline

- Migration file created: ✅
- Ready to deploy: ✅
- Quick deployment possible: ✅ (2 minutes via dashboard)
- Zero downtime: ✅
- Reversible: ✅ (can drop tables if needed)

---

**Next Step:** Choose Option A, B, or C above and deploy the migration!

Once done, your registration staff feature will be fully operational. 🚀
