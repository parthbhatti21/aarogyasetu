-- ============================================================================
-- DEBUG: Check for duplicate Hospital Ids in source table
-- ============================================================================

-- 1. Check for duplicate Hospital Ids
SELECT "Hospital Id", COUNT(*) as duplicate_count
FROM public."State wise hospitals"
WHERE "Hospital Id" IS NOT NULL
GROUP BY "Hospital Id"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Check for NULL Hospital Ids
SELECT COUNT(*) as null_count
FROM public."State wise hospitals"
WHERE "Hospital Id" IS NULL OR "Hospital Id" = '';

-- 3. Check total unique hospitals
SELECT COUNT(DISTINCT "Hospital Id") as unique_hospital_ids
FROM public."State wise hospitals";

-- 4. Check data sample
SELECT 
  "Sl no.",
  "Hospital Id",
  "Hospital name",
  "State"
FROM public."State wise hospitals"
ORDER BY "Hospital Id", "Sl no."
LIMIT 20;

-- ============================================================================
-- FIX: Use DISTINCT ON or GROUP BY to handle duplicates
-- ============================================================================

-- Option 1: Keep first occurrence of each hospital_id
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT DISTINCT ON ("Hospital Id")
  COALESCE("Hospital Id", 'H-' || ROW_NUMBER() OVER ()) as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL AND "Hospital Id" IS NOT NULL
ORDER BY "Hospital Id", "Sl no."
ON CONFLICT (hospital_id) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_hospitals FROM public.hospitals;
