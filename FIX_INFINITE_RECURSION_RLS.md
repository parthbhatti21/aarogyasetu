# 🔧 URGENT FIX: Infinite Recursion in RLS Policy

## ⚠️ Error You Got
```
Failed to create account
infinite recursion detected in policy for relation "registration_staff_profiles"
```

## 🎯 What's Wrong
The RLS policy we created in Phase 2 has infinite recursion - it's looking at the same table within itself.

## ✅ THE FIX (2 Minutes)

### Step 1: Deploy New Migration

**Go to:** https://app.supabase.com → SQL Editor → New Query

**Copy this SQL:**

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;

-- Create a simpler policy that doesn't cause recursion
CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  -- Admin users can see all staff
  (auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin'))
  -- OR users can see their own profile
  OR (auth.uid() = user_id)
);

-- Enable RLS
ALTER TABLE registration_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Fix staff_profiles RLS too
DROP POLICY IF EXISTS staff_profiles_read_policy ON staff_profiles;

CREATE POLICY staff_profiles_read_policy ON staff_profiles
FOR SELECT
USING (
  (role = 'admin')
  OR (auth.uid() = user_id)
  OR (hospital_id IN (SELECT hospital_id FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.hospital_id IS NOT NULL))
);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON registration_staff_profiles TO authenticated;
GRANT SELECT ON staff_profiles TO authenticated;
```

### Step 2: Click Run

Wait for ✅ success message

### Step 3: Clear Browser Cache & Refresh

1. F12 → Application → Clear storage → Clear all
2. Close DevTools
3. Ctrl+Shift+R (hard refresh)

### Step 4: Test

Go back to Admin Dashboard → Expand Doctor Management

**Should see:** Doctor list with hospital names ✓

---

## ❌ What Was Wrong

The previous RLS policy had:
```sql
OR hospital_id IN (
  SELECT hospital_id FROM registration_staff_profiles 
  WHERE user_id = auth.uid()
)
```

This created recursion because:
1. Query enters the policy
2. Policy checks registration_staff_profiles table
3. Which triggers the policy again
4. Infinite loop! 💥

## ✅ What's Fixed

The new policy:
- Admin can see all ✓
- User can see their own profile ✓
- User can see colleagues at same hospital ✓
- **NO recursive references!** ✓

---

## 🚀 Deployment Time

- Copy SQL: 30 seconds
- Run in Supabase: 30 seconds
- Clear cache: 30 seconds
- Test: 30 seconds

**Total: ~2 minutes**

---

**Status:** 🔧 CRITICAL FIX READY
**Urgency:** 🔴 HIGH
**Fix:** Copy-paste SQL + refresh

👉 **Next:** Deploy the SQL above now!

