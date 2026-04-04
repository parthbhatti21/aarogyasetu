# 🚨 IMPORTANT: Deploy Phase 1 Migration FIRST

## ⚠️ Error You Got
```
ERROR: 42P01: relation "registration_staff_profiles" does not exist
```

## 🎯 What This Means
The table `registration_staff_profiles` doesn't exist yet because the **Phase 1 migration** hasn't been deployed.

You need to deploy migrations in this order:
1. ✅ **FIRST:** `20260404_registration_desk_phase1.sql` (creates the table)
2. ✅ **THEN:** `20260406_fix_registration_staff_hospital_trigger.sql` (adds trigger)

---

## 🚀 FIX: Deploy in Correct Order

### Step 1️⃣: Deploy Phase 1 Migration (Creates the Table)

**Go to:** https://app.supabase.com → SQL Editor → New Query

**Copy entire content from:**
```
supabase/migrations/20260404_registration_desk_phase1.sql
```

**What this migration does:**
- ✅ Creates `registration_staff_profiles` table
- ✅ Extends `patients` table with new fields
- ✅ Extends `tokens` table with new fields
- ✅ Creates doctor specialty mapping
- ✅ Sets up RLS policies

**Click:** Run

**Wait for:** ✅ Success message (should see "Query executed successfully")

---

### Step 2️⃣: Deploy Trigger Fix Migration (Adds Hospital Auto-Population)

**After Phase 1 succeeds, create a NEW query:**

**Go to:** SQL Editor → New Query

**Copy entire content from:**
```
supabase/migrations/20260406_fix_registration_staff_hospital_trigger.sql
```

**What this migration does:**
- ✅ Adds trigger to auto-populate hospital_name
- ✅ Updates RLS policies
- ✅ Backfills existing NULL values

**Click:** Run

**Wait for:** ✅ Success message

---

## ✅ Verify Both Deployments

After both migrations run successfully:

### Check 1: Table Exists
In SQL Editor, run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'registration_staff_profiles';
```

Should return: 1 row with `registration_staff_profiles`

### Check 2: Trigger Exists
Run:
```sql
SELECT * FROM pg_triggers WHERE tgname = 'trigger_update_hospital_name_registration_staff';
```

Should return: 1 row

### Check 3: Data Access
Run:
```sql
SELECT COUNT(*) FROM registration_staff_profiles;
```

Should return: A count (might be 0 if no staff created yet)

---

## 🌐 Clear Browser & Refresh

After both migrations deploy:

1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** → **Clear all**
4. Close DevTools
5. Refresh page (Ctrl+R)

---

## ✅ Verify Fix Works

After both migrations + browser refresh:

1. Go to Admin Dashboard
2. Expand **Doctor Management** section
   - Should see doctors with **hospital names** ✅
3. Expand **Registration Desk Management** section
   - Should see **staff list with all details** ✅

---

## 📋 Deployment Checklist

### Phase 1 Migration:
- [ ] Opened SQL Editor
- [ ] Copied Phase 1 SQL
- [ ] Clicked Run
- [ ] Got ✅ success message
- [ ] No error messages

### Trigger Fix Migration:
- [ ] Copied Trigger Fix SQL
- [ ] Clicked Run in NEW query
- [ ] Got ✅ success message
- [ ] No error messages

### Browser:
- [ ] Cleared storage (F12 → Application)
- [ ] Refreshed page (Ctrl+R)

### Verify:
- [ ] Doctor hospital names showing
- [ ] Staff list visible
- [ ] No console errors (F12 → Console)

---

## ❌ If Phase 1 Fails

If you get an error in Phase 1:

**Common errors:**
- `relation ... already exists` → Table already exists (might be OK)
- `permission denied` → Contact DB admin
- `syntax error` → Copy the entire file exactly

**Solutions:**
1. Check if error starts with `ERROR: 42P15: relation ... already exists`
   - This is OK! Means table already exists
   - Continue to Phase 2

2. If actual error:
   - Copy the error message exactly
   - Check Supabase documentation
   - Contact support if needed

---

## ⏱️ Timeline

1. Deploy Phase 1: 1-2 minutes
2. Deploy Trigger Fix: 1 minute
3. Clear cache & refresh: 1 minute
4. **Total: ~3-4 minutes**

---

## 📚 File Locations

**Phase 1 Migration:**
```
supabase/migrations/20260404_registration_desk_phase1.sql
```

**Trigger Fix Migration:**
```
supabase/migrations/20260406_fix_registration_staff_hospital_trigger.sql
```

---

## 🎉 After Both Migrations Deploy

✅ Doctor hospital names will display
✅ Registration staff will appear in list
✅ New staff/doctors auto-populate hospital names
✅ Both lists filter by hospital
✅ RLS policies allow proper data access

---

## ❓ Why Two Migrations?

- **Phase 1:** Creates all the necessary tables and structure
- **Trigger Fix:** Adds missing trigger for hospital_name auto-population

Both are needed for complete functionality.

---

**Status:** 🟡 Ready to Deploy (2 migrations)
**Urgency:** 🔴 HIGH
**Difficulty:** 🟢 Easy (copy-paste)
**Time:** ⏱️ ~3-4 minutes

👉 **Next Step:** Deploy Phase 1 first, then Trigger Fix
