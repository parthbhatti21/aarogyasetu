# SQL Error Fix: ON CONFLICT DO UPDATE Command

## 🔴 Original Error
```
ERROR: 21000: ON CONFLICT DO UPDATE command cannot affect row a second time
HINT: Ensure that no rows proposed for insertion within the same command 
      have duplicate constrained values.
```

## 🔍 Root Cause
The source table `"State wise hospitals"` contains **duplicate `Hospital Id` values**.

When PostgreSQL tries to INSERT multiple rows with the same `hospital_id` value in a single statement, it can't decide how to handle the conflict for the second occurrence, causing this error.

---

## ✅ Solution: Use DISTINCT ON

### Problem Query
```sql
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT 
  COALESCE("Hospital Id", 'H-' || "Sl no."::text) as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL
ON CONFLICT (hospital_id) DO UPDATE ...  -- ❌ FAILS with duplicates
```

### Fixed Query
```sql
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT DISTINCT ON ("Hospital Id")  -- ✅ Keep only first occurrence
  COALESCE("Hospital Id", 'H-' || ROW_NUMBER() OVER (ORDER BY "Sl no.")) as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND "Hospital Id" IS NOT NULL
ORDER BY "Hospital Id", "Sl no."
ON CONFLICT (hospital_id) DO NOTHING;  -- ✅ Now works
```

---

## 📋 How to Apply Fix

### Step 1: Check for Duplicates (Optional)
```sql
-- See which Hospital Ids appear multiple times
SELECT "Hospital Id", COUNT(*) as duplicate_count
FROM public."State wise hospitals"
WHERE "Hospital Id" IS NOT NULL
GROUP BY "Hospital Id"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

### Step 2: Use Fixed SQL
Use **`DEPLOY_TO_SUPABASE_FIXED.sql`** instead of the original.

1. Open `DEPLOY_TO_SUPABASE_FIXED.sql`
2. Copy entire content
3. Go to Supabase SQL Editor
4. Paste & Run
5. ✅ Should now work!

### Step 3: Verify
```sql
SELECT COUNT(*) as total_hospitals FROM public.hospitals;
SELECT COUNT(DISTINCT state) as unique_states FROM public.hospitals;
```

---

## 🔧 Key Changes in Fixed Version

### Before (Broken)
```sql
INSERT INTO public.hospitals (...)
SELECT 
  COALESCE("Hospital Id", 'H-' || "Sl no."::text) as hospital_id,
  ...
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL
ON CONFLICT (hospital_id) DO UPDATE SET ...  -- ❌ Fails with duplicates
```

### After (Fixed)
```sql
INSERT INTO public.hospitals (...)
SELECT DISTINCT ON ("Hospital Id")  -- ✅ Remove duplicates
  COALESCE("Hospital Id", 'H-' || ROW_NUMBER() OVER (...)) as hospital_id,
  ...
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND "Hospital Id" IS NOT NULL
ORDER BY "Hospital Id", "Sl no."
ON CONFLICT (hospital_id) DO NOTHING;  -- ✅ Use DO NOTHING instead
```

## �� What DISTINCT ON Does

`DISTINCT ON ("Hospital Id")` keeps only the **first row** for each unique `Hospital Id`:

```
Source Data:
│ Sl no. │ Hospital Id │ Hospital name  │ State │
├────────┼─────────────┼────────────────┼───────┤
│ 1      │ H-001       │ AIIMS Delhi    │ Delhi │ ← Kept
│ 2      │ H-001       │ AIIMS Delhi-2  │ Delhi │ ← Removed (duplicate)
│ 3      │ H-002       │ Safdarjung     │ Delhi │ ← Kept
│ 4      │ H-002       │ Safdarjung-B   │ Delhi │ ← Removed (duplicate)

After DISTINCT ON:
│ Sl no. │ Hospital Id │ Hospital name  │ State │
├────────┼─────────────┼────────────────┼───────┤
│ 1      │ H-001       │ AIIMS Delhi    │ Delhi │
│ 3      │ H-002       │ Safdarjung     │ Delhi │
```

---

## ⚠️ Alternative: Handle NULL/Empty Hospital Ids

The fixed version also includes a second INSERT to handle hospitals with NULL/empty Hospital Ids:

```sql
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT 
  'H-AUTO-' || ROW_NUMBER() OVER (ORDER BY "Sl no.") as hospital_id,
  "Hospital name" as hospital_name,
  ...
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL 
  AND ("Hospital Id" IS NULL OR "Hospital Id" = '')
ON CONFLICT (hospital_id) DO NOTHING;
```

This creates unique auto-generated IDs for any hospitals without Hospital Ids.

---

## 🎯 Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| ON CONFLICT error | Duplicate hospital_ids in source | Use `DISTINCT ON` |
| Multiple rows same id | Data quality | Keep first occurrence |
| NULL hospital_ids | Missing data | Auto-generate IDs |

**Use `DEPLOY_TO_SUPABASE_FIXED.sql` for trouble-free deployment!**

---

## 📞 Still Not Working?

Try step-by-step:

```sql
-- Step 1: Create table only
CREATE TABLE IF NOT EXISTS public.hospitals (...);

-- Step 2: Test insert with debugging
SELECT "Hospital Id", COUNT(*) as count
FROM public."State wise hospitals"
GROUP BY "Hospital Id"
HAVING COUNT(*) > 1;

-- Step 3: Insert with DISTINCT ON
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT DISTINCT ON ("Hospital Id")
  "Hospital Id" as hospital_id,
  "Hospital name",
  "State",
  "District",
  "Sl no."
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL 
  AND "Hospital Id" IS NOT NULL
ORDER BY "Hospital Id", "Sl no.";

-- Step 4: Verify
SELECT COUNT(*) FROM public.hospitals;
```

✅ This should always work!
