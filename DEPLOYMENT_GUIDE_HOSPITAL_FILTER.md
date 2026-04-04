# Deployment Guide: Hospital Bifurcation Feature

## Current Status ✅

All code changes have been implemented and committed:
- ✅ Database migration created (20260404_add_hospital_name_denormalization.sql)
- ✅ Components built (HospitalFilter, InlineHospitalSelector)  
- ✅ Types updated (database.ts)
- ✅ Services enhanced (adminService.ts)
- ✅ Admin Dashboard integrated
- ✅ Build succeeds with no errors

## Supabase Migration Status

The remote Supabase database already has all 20260403 migrations applied. The new migration `20260404_add_hospital_name_denormalization.sql` is ready to deploy.

### Manual Deployment Steps

Since the Supabase CLI reported migration conflicts with the existing 20260403 migrations, use these manual steps:

**Option 1: Via Supabase Dashboard (Recommended)**

1. **Log into Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Select your project (APP 1)

2. **Open SQL Editor:**
   - Navigate to SQL Editor in the left sidebar

3. **Copy the migration SQL:**
   - Open: `supabase/migrations/20260404_add_hospital_name_denormalization.sql`
   - Copy all the SQL

4. **Execute in SQL Editor:**
   - Paste the SQL into a new query window
   - Click "Run" to execute
   - All statements use `IF NOT EXISTS`, so they're safe to run

5. **Verify Success:**
   - Check that no errors appear
   - Run verification queries (see below)

**Option 2: Via CLI (Once migrations are synced)**

```bash
cd /Users/parthbhatti/Codes\ and\ backups/careflow-ai
supabase db push --linked --yes
```

### Verification Queries

Run these in Supabase SQL Editor to confirm the migration applied:

```sql
-- Check that hospital_name column exists in tokens table
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tokens' AND column_name = 'hospital_name';

-- Check that hospital_name column exists in staff_profiles table
SELECT column_name FROM information_schema.columns
WHERE table_name = 'staff_profiles' AND column_name = 'hospital_name';

-- Check that all hospital_name columns were added
SELECT table_name, column_name FROM information_schema.columns
WHERE column_name = 'hospital_name'
ORDER BY table_name;

-- Verify triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_update_hospital_name%'
ORDER BY trigger_name;
```

Expected results:
- 6 rows for hospital_name columns (patients, tokens, staff_profiles, medical_records, prescriptions, medicines)
- 5 rows for triggers (one for each major table)

## Testing the Feature

After deploying the migration:

### 1. Test Hospital Filter on Admin Dashboard

```bash
npm run dev
```

Navigate to Admin Dashboard:
1. You should see "Filter by Hospital" section at top
2. Select a State from dropdown
3. Select a Hospital by name
4. Dashboard data filters to that hospital
5. Click "Clear" to remove filter

### 2. Test Doctor Creation with Hospital

1. Click "Create Doctor Account"
2. Fill in form fields (name, email, password, role, specialty)
3. **New:** Hospital Selection should appear
4. Select state → Select hospital  
5. Hospital appears as highlighted badge
6. Click "Create Doctor Account"
7. Doctor is created with hospital_id and hospital_name

### 3. Test Doctor List Filtering

1. Doctors list shows all doctors
2. Select a hospital via Hospital Filter
3. Doctor list now filters to show only doctors from that hospital
4. Change specialty or role filters - they work together with hospital filter

### 4. Verify Database

Open SQL Editor and run:

```sql
-- Check a doctor's hospital assignment
SELECT id, display_name, hospital_id, hospital_name, specialty 
FROM staff_profiles 
WHERE role IN ('doctor', 'senior_doctor')
LIMIT 5;

-- Verify hospital_name is populated
SELECT COUNT(*) as doctors_with_hospital_name
FROM staff_profiles
WHERE hospital_name IS NOT NULL;
```

## Deployment Checklist

- [ ] Migration SQL executed in Supabase
- [ ] All 6 hospital_name columns added
- [ ] All 5 triggers created
- [ ] Admin Dashboard loads without errors
- [ ] Hospital filter dropdown works (states load)
- [ ] Hospital selection works (hospitals load by state)
- [ ] Doctor creation requires hospital selection
- [ ] Doctor can be created and assigned to hospital
- [ ] Doctor list filters by selected hospital
- [ ] Database contains hospital_name in staff_profiles

## Troubleshooting

### Issue: "Column already exists" errors when running migration

**Solution:** This is expected! The migration uses `IF NOT EXISTS`, so it skips if columns already exist. This is actually good - it means the schema might already be partially set up.

### Issue: Hospital Filter not showing hospitals

**Solutions:**
1. Check that hospitals table is populated: `SELECT COUNT(*) FROM hospitals;`
2. Verify states exist: `SELECT DISTINCT state FROM hospitals;`
3. Clear browser cache and reload

### Issue: Doctor creation button disabled even after selecting hospital

**Solution:** 
1. Verify all required fields are filled (name, email, password, role, specialty, hospital)
2. Check browser console for validation errors
3. Try creating doctor in different browser

### Issue: Doctor doesn't appear in filtered list

**Solution:**
1. Verify doctor was created with hospital_id: `SELECT display_name, hospital_id FROM staff_profiles WHERE display_name = 'Doctor Name';`
2. Verify selected hospital's ID matches: `SELECT id, hospital_name FROM hospitals WHERE hospital_name = 'Selected Hospital';`
3. Check if hospital_id is NULL

## Files Deployed

**New Files:**
- `src/components/admin/HospitalFilter.tsx`
- `src/components/admin/InlineHospitalSelector.tsx`
- `supabase/migrations/20260404_add_hospital_name_denormalization.sql`

**Modified Files:**
- `src/pages/AdminDashboard.tsx`
- `src/services/adminService.ts`
- `src/types/database.ts`

**Documentation:**
- `HOSPITAL_BIFURCATION_COMPLETE.md`
- `HOSPITAL_FILTER_QUICK_START.md`
- `DEPLOYMENT_GUIDE.md` (this file)

## Next Steps

1. **Execute the migration** in Supabase (see instructions above)
2. **Test the feature** using the testing steps above
3. **Verify with verification queries** to ensure database state is correct
4. **Deploy to production** once all tests pass

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review `HOSPITAL_FILTER_QUICK_START.md` for quick reference
3. Check `HOSPITAL_BIFURCATION_COMPLETE.md` for detailed implementation info
4. Run the verification queries to check database state

## Rollback Plan

If you need to rollback the migration:

```sql
-- Remove hospital_name columns (if needed)
ALTER TABLE patients DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE tokens DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE staff_profiles DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE medical_records DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE prescriptions DROP COLUMN IF EXISTS hospital_name;
ALTER TABLE medicines DROP COLUMN IF EXISTS hospital_name;

-- Drop triggers (if needed)
DROP TRIGGER IF EXISTS trigger_update_hospital_name_patients ON patients;
DROP TRIGGER IF EXISTS trigger_update_hospital_name_tokens ON tokens;
DROP TRIGGER IF EXISTS trigger_update_hospital_name_staff_profiles ON staff_profiles;
DROP TRIGGER IF EXISTS trigger_update_hospital_name_medical_records ON medical_records;
DROP TRIGGER IF EXISTS trigger_update_hospital_name_prescriptions ON prescriptions;

-- Drop functions (if needed)
DROP FUNCTION IF EXISTS update_hospital_name_patients();
DROP FUNCTION IF EXISTS update_hospital_name_tokens();
DROP FUNCTION IF EXISTS update_hospital_name_staff_profiles();
DROP FUNCTION IF EXISTS update_hospital_name_medical_records();
DROP FUNCTION IF EXISTS update_hospital_name_prescriptions();
```

## References

- Supabase Dashboard: https://app.supabase.com
- Project Reference: gbofirfrzlwfoximdjqk
- Region: South Asia (Mumbai)
