# Hospital Selection Feature - Complete Deployment Guide

## 🎯 Current Status
- ✅ Code is deployed and working
- ❌ Database migration might not have run
- ❌ Hospitals table is empty or has issues

---

## 🔍 Step 1: Verify Current State

### Open Supabase SQL Editor
1. Go to https://supabase.com
2. Login to your project
3. Click "SQL Editor" in left sidebar
4. Create new query
5. Copy & run this verification query:

```sql
SELECT 
  COUNT(*) as hospitals_count, 
  COUNT(DISTINCT state) as unique_states
FROM public.hospitals;
```

**Expected Result:**
- `hospitals_count`: Should be > 0 (e.g., 100+)
- `unique_states`: Should be > 0 (e.g., 20+)

**If Result is 0 or error:** Hospitals table is empty or doesn't exist → Go to Step 2

---

## 🚀 Step 2: Deploy the Hospitals Table

### Option A: One-Command Deployment (Recommended)

1. Open your Supabase project SQL Editor
2. Copy the entire content of this file:
   ```
   DEPLOY_TO_SUPABASE_FIXED.sql
   ```
3. Paste it into the SQL Editor
4. Click **RUN** button
5. Wait for completion (should show success)

### Option B: Step-by-Step Deployment

If Option A fails, do it piece by piece:

```sql
-- Step 1: Create hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT UNIQUE NOT NULL,
  hospital_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  sl_no BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON public.hospitals(state);
CREATE INDEX IF NOT EXISTS idx_hospitals_district ON public.hospitals(district);
CREATE INDEX IF NOT EXISTS idx_hospitals_hospital_id ON public.hospitals(hospital_id);

-- Step 3: Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policy (allow public read)
CREATE POLICY "Allow public read access to hospitals"
  ON public.hospitals FOR SELECT USING (true);
```

Then run the **migration query** separately:

```sql
-- Migrate from "State wise hospitals" table
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT DISTINCT ON ("Hospital Id")
  COALESCE("Hospital Id", 'H-' || ROW_NUMBER() OVER (ORDER BY "Sl no.")) as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND "Hospital Id" IS NOT NULL AND "Hospital Id" != ''
ORDER BY "Hospital Id", "Sl no."
ON CONFLICT (hospital_id) DO NOTHING;

-- Handle NULL Hospital IDs
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT 
  'H-AUTO-' || ROW_NUMBER() OVER (ORDER BY "Sl no.") as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND ("Hospital Id" IS NULL OR "Hospital Id" = '')
ON CONFLICT (hospital_id) DO NOTHING;
```

---

## ✅ Step 3: Verify Deployment

After running the migration, verify with these queries:

```sql
-- Check total hospitals
SELECT COUNT(*) as total_hospitals FROM public.hospitals;

-- Check states
SELECT state, COUNT(*) as count FROM public.hospitals GROUP BY state ORDER BY count DESC;

-- Check sample data
SELECT hospital_name, state, district FROM public.hospitals LIMIT 10;
```

**Expected:**
```
total_hospitals: 100+ (depending on your data)
states: Multiple states (Gujarat, Delhi, etc.)
sample_data: Shows hospital names with states
```

---

## 🔧 Step 4: Configure Staff Hospital Assignment

If staff/doctors need hospital access, assign them:

```sql
-- Find a hospital ID first
SELECT id, hospital_name FROM public.hospitals LIMIT 1;
-- Copy the UUID from output

-- Then assign doctor to hospital
UPDATE public.staff_profiles 
SET hospital_id = 'PASTE_UUID_HERE'
WHERE user_id = 'DOCTOR_USER_ID_HERE';
```

---

## 🧪 Step 5: Test in Application

### Test 1: Location Detection
1. Open app in browser
2. Go to patient registration
3. Complete email & OTP steps
4. On "Select Hospital" step, click "Use My Location"
5. When prompted, **Allow** location access
6. **Expected:** Shows "Location detected: City, State"
7. **Then:** Hospital dropdown should show 15-20+ hospitals

### Test 2: Manual State Selection
1. Deny location (or skip)
2. See state dropdown
3. Select "Gujarat"
4. **Expected:** 22 hospitals appear

### Test 3: Hospital Selection
1. Select a hospital from the list
2. Click continue/next
3. **Expected:** Hospital saved and proceeds to next step

---

## ❌ Troubleshooting

### Issue 1: "No hospitals found in Gujarat"
**Solution:**
1. Check if hospitals table has data:
   ```sql
   SELECT COUNT(*) FROM public.hospitals WHERE state = 'Gujarat';
   ```
2. If 0, run the migration again (Step 2)
3. Hard refresh browser (Ctrl+Shift+R)

### Issue 2: "Location detected" but no hospitals appear
**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors starting with "Error loading hospitals:"
4. Share the error message

### Issue 3: Blank hospital dropdown
**Solution:**
1. Check if Supabase connection is working
2. In browser console, run:
   ```javascript
   const { data, error } = await window.supabase
     .from('hospitals')
     .select('*')
     .limit(5);
   console.log('Data:', data);
   console.log('Error:', error);
   ```
3. If error shown, fix the Supabase connection

### Issue 4: "Connection failed" on app
**Solution:**
1. Check Supabase URL and API key in `.env`
2. Make sure project is active (not paused)
3. Verify RLS policy allows public read

---

## 📋 Checklist

- [ ] Verified hospitals table has data (> 100 hospitals)
- [ ] Verified states are populated (> 5 states)
- [ ] Tested location detection (showed hospital list)
- [ ] Tested manual state selection (showed hospitals)
- [ ] Tested hospital selection (completed without errors)
- [ ] Staff assigned to hospitals (if multi-hospital setup)
- [ ] Hospital IDs saving to tokens table
- [ ] Doctor queue filtering by hospital (optional)

---

## 🎯 If All Else Fails

**Full deployment SQL** (all in one):

1. **Backup first** (optional):
   - Go to Supabase Settings → Backups → Manual backup

2. **Drop and recreate** (careful!):
   ```sql
   DROP TABLE IF EXISTS public.hospitals CASCADE;
   
   -- Then run DEPLOY_TO_SUPABASE_FIXED.sql from top to bottom
   ```

3. **Get help:**
   - Check browser console for exact errors
   - Run verification queries in Step 1
   - Compare your SQL with DEPLOY_TO_SUPABASE_FIXED.sql

---

## 📞 Quick Reference

| Problem | Query to Run |
|---------|--------------|
| No hospitals showing | `SELECT COUNT(*) FROM public.hospitals;` |
| Not finding specific state | `SELECT * FROM public.hospitals WHERE state = 'Gujarat';` |
| RLS not working | Check if RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'hospitals';` |
| Need to re-migrate | Run `DEPLOY_TO_SUPABASE_FIXED.sql` again (safe, uses ON CONFLICT) |

---

✅ **DEPLOYMENT COMPLETE** - Now test in the app!
