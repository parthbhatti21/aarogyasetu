# ⚡ DEPLOY NOW - 2 Simple Steps (4 minutes)

## The Problem
```
ERROR: 42P01: relation "registration_staff_profiles" does not exist
```

**Why:** The table wasn't created yet. Need to deploy 2 migrations in order.

---

## ✅ STEP 1: Deploy Phase 1 (Creates Table)

1. Go to: **https://app.supabase.com**
2. Select: **Aarogya Setu** project
3. Click: **SQL Editor** (left menu)
4. Click: **New Query**
5. Open file: `supabase/migrations/20260404_registration_desk_phase1.sql`
6. Copy ALL the text from that file
7. Paste into Supabase query editor
8. Click: **Run** (top right)
9. Wait for: ✅ **Success message**

**Time: 1-2 minutes**

---

## ✅ STEP 2: Deploy Trigger Fix (Adds Hospital Auto-Populate)

1. Click: **New Query** (start a new query)
2. Open file: `supabase/migrations/20260406_fix_registration_staff_hospital_trigger.sql`
3. Copy ALL the text from that file
4. Paste into Supabase query editor
5. Click: **Run** (top right)
6. Wait for: ✅ **Success message**

**Time: 30 seconds**

---

## ✅ STEP 3: Clear Browser Cache & Refresh

1. Press: **F12** (open DevTools)
2. Click: **Application** tab
3. Click: **Clear storage** → **Clear all**
4. Close: DevTools (F12 again)
5. Refresh: **Ctrl+R** (or **Cmd+R**)

**Time: 30 seconds**

---

## ✅ VERIFY IT WORKS

1. Go to: **Admin Dashboard**
2. Expand: **Doctor Management** section
   - Should see: Doctor names + **HOSPITAL NAMES** ✓
3. Expand: **Registration Desk Management** section
   - Should see: **STAFF LIST** with all details ✓

**Done! ✨**

---

## ❌ If Step 1 Shows Error "already exists"

That's OK! Means the table already exists from before.
**Just continue to Step 2.**

---

## ❌ If Step 1/2 Show Other Errors

1. Copy the exact error message
2. Check you copied the ENTIRE file (including all text at the end)
3. Try again in a new query
4. If still fails: contact support with the error message

---

## ⏱️ Total Time: ~4 minutes

- Phase 1: 1-2 min
- Trigger Fix: 30 sec
- Browser refresh: 30 sec
- Verification: 30 sec

---

## 📚 File Locations

```
supabase/migrations/20260404_registration_desk_phase1.sql
supabase/migrations/20260406_fix_registration_staff_hospital_trigger.sql
```

---

**👉 Start Now: Open your Supabase dashboard**

