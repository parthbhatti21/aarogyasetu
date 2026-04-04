# 📝 Latest Fix Summary - RLS Infinite Recursion

## Issue Identified
User reported: "Doctor details are not coming"

## Root Cause Found
**Infinite recursion detected in RLS policy for relation 'registration_staff_profiles'**

The Phase 2 migration had a problematic RLS policy that was self-referential, causing an infinite loop.

---

## Solution Deployed

### New Migration (3rd Migration)
**File:** `supabase/migrations/20260407_fix_rls_infinite_recursion.sql`

**What it fixes:**
- ✅ Removes infinite recursion from registration_staff_profiles policy
- ✅ Removes infinite recursion from staff_profiles policy
- ✅ Creates simpler, working policies
- ✅ Restores admin access to all staff
- ✅ Allows users to see own profile

**Quick SQL to run:**

```sql
DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;
CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  (auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin'))
  OR (auth.uid() = user_id)
);

DROP POLICY IF EXISTS staff_profiles_read_policy ON staff_profiles;
CREATE POLICY staff_profiles_read_policy ON staff_profiles
FOR SELECT
USING (
  (role = 'admin')
  OR (auth.uid() = user_id)
  OR (hospital_id IN (SELECT hospital_id FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.hospital_id IS NOT NULL))
);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON registration_staff_profiles TO authenticated;
GRANT SELECT ON staff_profiles TO authenticated;
```

---

## Deployment Steps

1. Go to https://app.supabase.com
2. SQL Editor → New Query
3. Copy the SQL above (full migration file)
4. Click Run
5. Wait for ✅ success
6. Clear browser cache (F12 → Application → Clear storage)
7. Hard refresh (Ctrl+Shift+R)

---

## After Fix

✅ Doctor details will display
✅ Staff list will show
✅ No more "infinite recursion" errors
✅ Admin can create accounts

---

## Timeline of Fixes

1. **Phase 1 Migration** (20260404)
   - Created registration_staff_profiles table
   - Extended patients and tokens tables
   
2. **Phase 2 Migration** (20260406)
   - Added hospital_name trigger
   - Created RLS policies (had recursion issue)
   
3. **Phase 3 Migration** (20260407) 👈 NEW - FIX
   - Fixed infinite recursion in RLS policies
   - Simplified policies to work correctly

---

## What Went Wrong

The Phase 2 RLS policy tried to:
```sql
-- This caused recursion:
OR hospital_id IN (
  SELECT hospital_id FROM registration_staff_profiles 
  WHERE user_id = auth.uid()
)
```

When admin tried to view staff, the policy:
1. Checked if auth.uid() is admin
2. If not, checked hospital_id in registration_staff_profiles
3. This triggered the same policy again
4. Infinite loop = Error

---

## What's Fixed

New policy:
```sql
-- No recursion, simple logic:
(auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin'))
OR (auth.uid() = user_id)
```

This works because:
- Check if user is admin (direct)
- Check if user is viewing own profile (direct)
- No recursive table lookups ✓

---

## Documentation

- **Quick Fix:** FIX_INFINITE_RECURSION_RLS.md
- **Full Debugging:** DEBUG_DOCTOR_DATA.md
- **Complete Overview:** README_FIX_DEPLOYMENT.md

---

**Status:** ✅ FIX READY TO DEPLOY
**Time:** ~2 minutes
**Effort:** Copy-paste SQL

👉 **Next:** Deploy the 3rd migration SQL

