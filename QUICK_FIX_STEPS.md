# 🚀 QUICK FIX - Doctor Hospital Display & Staff Data (2 Minutes)

## The Problem
- **Issue 1:** Doctors visible but hospital names blank ❌
- **Issue 2:** Registration staff not showing in list ❌

## The Solution
Deploy one database migration (copy-paste SQL) + refresh browser

---

## 🎯 EXACT STEPS (Copy-Paste Ready)

### Step 1️⃣: Go to Supabase

Open: https://app.supabase.com

### Step 2️⃣: Open SQL Editor

1. Select your project (Aarogya Setu)
2. Left menu → **SQL Editor**
3. Click **New Query**

### Step 3️⃣: Copy-Paste This SQL

```sql
CREATE OR REPLACE FUNCTION update_hospital_name_registration_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hospital_id IS NOT NULL THEN
    SELECT hospital_name INTO NEW.hospital_name
    FROM hospitals
    WHERE id = NEW.hospital_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hospital_name_registration_staff ON registration_staff_profiles;

CREATE TRIGGER trigger_update_hospital_name_registration_staff
BEFORE INSERT OR UPDATE ON registration_staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_registration_staff();

UPDATE registration_staff_profiles rsp
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE rsp.hospital_id = h.id AND rsp.hospital_name IS NULL;

DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;

CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin')
  OR auth.uid() = user_id
  OR hospital_id IN (SELECT hospital_id FROM registration_staff_profiles WHERE user_id = auth.uid())
);

UPDATE staff_profiles sp
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE sp.hospital_id = h.id AND sp.hospital_name IS NULL;
```

### Step 4️⃣: Run It

- Click **Run** (top right)
- Wait for ✅ success message

### Step 5️⃣: Refresh Browser

1. Press **F12** (open DevTools)
2. Go to **Application** tab
3. Click **Clear storage** → **Clear all**
4. Close DevTools (F12)
5. Refresh page (**Ctrl+R** or **Cmd+R**)

---

## ✅ Verify It Works

### Check 1: Doctor Hospital Names
1. Go to Admin Dashboard
2. Open **Doctor Management** section
3. Look for hospital names in the table

**Should see:** Dr. Name | Specialty | Role | **City Hospital** | Status

### Check 2: Staff List
1. Scroll to **Registration Desk Management** section
2. Look for staff table

**Should see:** Name | Email | Phone | Role | **City Hospital** | Status

---

## ⏱️ Expected Time
- Copy SQL: 10 seconds
- Run SQL: 30 seconds
- Clear cache & refresh: 30 seconds
- **Total: ~2 minutes**

---

## ❌ If It Doesn't Work

### Check 1: Did SQL run successfully?
- Look for ✅ success message in Supabase
- If error: copy the error text and share

### Check 2: Clear cache again
- F12 → Application → Clear storage → Clear all
- Refresh page

### Check 3: Check browser console
- F12 → Console
- Look for messages: `Fetched doctors:` or `Fetched registration staff:`
- Any red errors? Share those

---

## 📂 Files Referenced

- **Migration:** `supabase/migrations/20260406_fix_registration_staff_hospital_trigger.sql`
- **Full docs:** `DEPLOYMENT_FIX_DOCTOR_STAFF.md`
- **Troubleshooting:** `FIX_DOCTOR_STAFF_DISPLAY.md`

---

## 🎉 Done!

After these 5 steps:
- ✅ Doctor hospital names visible
- ✅ Registration staff list showing
- ✅ Data auto-populates for new entries
- ✅ Both lists filter by hospital

**Questions?** Check the detailed docs or check browser console for errors.
