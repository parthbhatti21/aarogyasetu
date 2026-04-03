# Quick Troubleshooting: Hospital Selector "No Hospitals Found"

## ⚡ Quick Diagnosis

Run these 3 queries in Supabase SQL Editor to identify the issue:

```sql
-- Query 1: Check table exists and has data
SELECT COUNT(*) FROM public.hospitals;

-- Query 2: Check Gujarat specifically
SELECT COUNT(*) FROM public.hospitals WHERE state = 'Gujarat';

-- Query 3: Check for NULL states
SELECT COUNT(*) FROM public.hospitals WHERE state IS NULL;
```

---

## 📊 Diagnosis Results

### Result 1: hospitals table has 0 rows
```
COUNT(*) = 0
```
**Problem:** Migration never ran or failed
**Fix:** Follow DEPLOYMENT_GUIDE.md Step 2

### Result 2: Gujarat shows 0, but total > 0
```
Total count = 100+
Gujarat count = 0
```
**Problem:** No hospitals with state='Gujarat' in DB
**Fix:** 
1. Check source table: `SELECT DISTINCT "State" FROM public."State wise hospitals"`
2. Check what states were migrated: `SELECT DISTINCT state FROM public.hospitals`
3. If "Gujarat" not in list, re-run migration with corrected data

### Result 3: Many NULL states
```
NULL count = 50+
```
**Problem:** State column is NULL for many hospitals
**Fix:** 
```sql
UPDATE public.hospitals 
SET state = 'Unknown' 
WHERE state IS NULL OR state = '';
```

---

## 🔧 Quick Fixes

### Fix 1: Clear and re-migrate
```sql
-- Delete all existing hospitals
DELETE FROM public.hospitals;

-- Re-run migration (from DEPLOY_TO_SUPABASE_FIXED.sql lines 128-145)
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT DISTINCT ON ("Hospital Id")
  COALESCE("Hospital Id", 'H-' || ROW_NUMBER() OVER (ORDER BY "Sl no.")),
  "Hospital name",
  "State",
  "District",
  "Sl no."
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND "Hospital Id" IS NOT NULL
ORDER BY "Hospital Id", "Sl no.";
```

### Fix 2: Check source data
```sql
-- See what states exist in source table
SELECT DISTINCT "State" 
FROM public."State wise hospitals" 
ORDER BY "State";

-- Count by state
SELECT "State", COUNT(*) 
FROM public."State wise hospitals" 
GROUP BY "State" 
ORDER BY COUNT(*) DESC;
```

### Fix 3: Verify RLS not blocking
```sql
-- Check RLS policy
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'hospitals';
-- Should show: rowsecurity = true

-- Test public read
SELECT * FROM public.hospitals LIMIT 1;
-- Should return data (not empty, no error)
```

---

## 🧪 Testing in Browser

### Open Browser Console (F12 → Console tab)

```javascript
// Test 1: Check if supabase is initialized
console.log(window.supabase);
// Should show supabase client object

// Test 2: Query hospitals directly
const { data, error } = await window.supabase
  .from('hospitals')
  .select('*')
  .limit(1);
console.log('Data:', data);
console.log('Error:', error);

// Test 3: Query specific state
const { data: gujarat } = await window.supabase
  .from('hospitals')
  .select('*')
  .eq('state', 'Gujarat')
  .limit(5);
console.log('Gujarat hospitals:', gujarat);
```

---

## 🎯 Most Common Issue

**99% of the time:** Hospitals table is empty (migrations never ran)

**Fix:** Open Supabase → SQL Editor → Copy-paste entire DEPLOY_TO_SUPABASE_FIXED.sql → Run

---

## 📋 Verification Checklist

After each step, verify:

```sql
-- After creating table
SELECT COUNT(*) FROM public.hospitals;

-- After migration
SELECT state, COUNT(*) FROM public.hospitals GROUP BY state ORDER BY COUNT(*) DESC;

-- After testing
SELECT hospital_name, state FROM public.hospitals WHERE state = 'Gujarat' LIMIT 5;
```

---

## 💡 Pro Tips

1. **Always use DISTINCT ON** when migrating:
   ```sql
   SELECT DISTINCT ON ("Hospital Id") ...
   ```
   Prevents duplicate hospital_id errors

2. **Use ON CONFLICT DO NOTHING** for safe re-runs:
   ```sql
   INSERT INTO ... ON CONFLICT (hospital_id) DO NOTHING;
   ```
   Safe to run multiple times

3. **Check errors in console** (F12):
   - "Error loading hospitals: ..." means API call failed
   - Show full error message to debug

4. **Hard refresh browser** after any DB changes:
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

---

✅ **Should be fixed now!** Test the app again.
