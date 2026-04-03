# Hospital Selection Feature - Quick Start

## 📋 You Have Existing Data

Your hospital data is already in the database:
- Table: `public."State wise hospitals"`
- Columns: Sl no., Hospital Id, Hospital name, State, District

✅ A migration script will automatically copy this data to the new `hospitals` table.

---

## 🚀 Deployment in 3 Steps

### Step 1: Verify Your Data (Optional)
Run this in Supabase SQL Editor:
```bash
cat verify-hospital-data.sql
```
Or paste contents into Supabase dashboard.

### Step 2: Deploy the Feature
```bash
# Option A: Use the deployment script (recommended)
./deploy-hospital-feature.sh

# Option B: Manual deployment
supabase db push
```

This will:
- ✅ Create `hospitals` table with proper indexes
- ✅ Add `hospital_id` to `tokens` table
- ✅ Add `hospital_id` to `staff_profiles` table
- ✅ Set up RLS policies for hospital scoping
- ✅ **Copy data from "State wise hospitals" to new table**

### Step 3: Assign Staff to Hospitals
Run in Supabase SQL Editor:

```sql
-- For single hospital setup (all staff see same hospital)
UPDATE public.staff_profiles
SET hospital_id = (
  SELECT id FROM public.hospitals 
  WHERE hospital_name = 'Your Hospital Name'
  LIMIT 1
);

-- Or for specific staff members
UPDATE public.staff_profiles
SET hospital_id = (SELECT id FROM public.hospitals WHERE hospital_name = 'AIIMS Delhi')
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'doctor@example.com'
);

-- Leave multi-hospital admins with NULL
UPDATE public.staff_profiles
SET hospital_id = NULL
WHERE role = 'admin' AND user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@example.com'
);
```

---

## 🧪 Testing the Feature

### Test 1: Patient Registration
1. Go to login page
2. Sign up as new patient
3. After OTP verification, you should see **Hospital Selection** screen
4. Click "Use My Location" OR select state manually
5. Select a hospital
6. Continue to dashboard

### Test 2: Token Creation
1. Create a new token via AI chat
2. Check database:
```sql
SELECT token_number, hospital_id, created_at 
FROM tokens 
ORDER BY created_at DESC 
LIMIT 5;
```
3. Verify `hospital_id` is populated

### Test 3: Doctor Queue
1. Login as doctor
2. Verify queue only shows tokens from doctor's assigned hospital
3. Check in SQL:
```sql
SELECT t.token_number, h.hospital_name, sp.display_name as doctor_name
FROM tokens t
LEFT JOIN hospitals h ON t.hospital_id = h.id
LEFT JOIN staff_profiles sp ON sp.hospital_id = h.id
WHERE sp.user_id = 'doctor_user_id'
AND t.visit_date = CURRENT_DATE;
```

### Test 4: Admin Dashboard
1. Login as admin
2. Verify stats show only assigned hospital's data
3. If admin has `hospital_id = NULL`, should see all hospitals

---

## 📊 Quick Data Check

After deployment, verify data migration:

```sql
-- Check if hospitals table has data
SELECT COUNT(*) as total_hospitals FROM public.hospitals;

-- View hospitals by state
SELECT state, COUNT(*) as hospital_count 
FROM public.hospitals 
GROUP BY state 
ORDER BY hospital_count DESC;

-- Check sample hospitals
SELECT hospital_name, state, district 
FROM public.hospitals 
LIMIT 10;
```

---

## 🔧 Troubleshooting

### "No hospitals showing in dropdown"
```sql
-- Check if data was migrated
SELECT COUNT(*) FROM public.hospitals;

-- If zero, manually run migration
-- (already included in deploy script)
```

### "Doctor can't see any tokens"
```sql
-- Check doctor's hospital assignment
SELECT sp.display_name, sp.hospital_id, h.hospital_name
FROM staff_profiles sp
LEFT JOIN hospitals h ON sp.hospital_id = h.id
WHERE sp.user_id = 'doctor_user_id';

-- If NULL, assign hospital
UPDATE staff_profiles 
SET hospital_id = (SELECT id FROM hospitals WHERE hospital_name = 'Hospital Name')
WHERE user_id = 'doctor_user_id';
```

### "Location permission not working"
- Ensure you're using **HTTPS** (geolocation requires secure context)
- Try manual state selection as fallback
- Check browser console for errors

---

## 📁 Files Overview

```
/Users/parthbhatti/Codes and backups/careflow-ai/

├── supabase/migrations/
│   ├── 20260403_create_hospitals_table.sql       ← Creates table
│   ├── 20260403_add_hospital_to_staff.sql        ← Adds to staff
│   ├── 20260403_add_hospital_to_tokens.sql       ← Adds to tokens
│   ├── 20260403_update_token_rls_hospital.sql    ← RLS policies
│   └── 20260403_migrate_hospital_data.sql        ← Copies your data ⭐
│
├── src/
│   ├── services/geocodingService.ts              ← Location detection
│   ├── hooks/useGeolocation.ts                   ← Geolocation hook
│   ├── components/patient/HospitalSelector.tsx   ← UI component
│   └── components/auth/PatientOTPForm.tsx        ← Updated flow
│
├── deploy-hospital-feature.sh                    ← Deployment script ⭐
└── verify-hospital-data.sql                      ← Verification queries ⭐
```

---

## ✅ Success Criteria

After deployment, you should have:
- ✅ `hospitals` table with your existing data
- ✅ Patients can select hospital during registration
- ✅ Tokens include `hospital_id`
- ✅ Doctors see only their hospital's tokens
- ✅ Admin dashboard filtered by hospital
- ✅ Location detection works (with manual fallback)

---

## 📚 Full Documentation

Detailed guides available in:
```
~/.copilot/session-state/6bef8207-a233-4c31-a648-b535173a8d83/files/
├── IMPLEMENTATION_COMPLETE.md    ← Technical details
├── DEPLOYMENT_GUIDE.md           ← Step-by-step deployment
└── FLOW_DIAGRAM.md              ← Visual flow diagrams
```

---

## 🎯 Ready to Deploy!

Run this to get started:
```bash
./deploy-hospital-feature.sh
```

Or manually:
```bash
supabase db push
```

**Questions?** Check the troubleshooting section above or the full documentation files.
