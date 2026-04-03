-- Quick Verification Script
-- Run this in Supabase SQL Editor to check your existing hospital data

-- 1. Check existing "State wise hospitals" table
SELECT 
  'State wise hospitals' as table_name,
  COUNT(*) as total_rows,
  COUNT(DISTINCT "State") as unique_states,
  COUNT(DISTINCT "District") as unique_districts
FROM public."State wise hospitals";

-- 2. View sample data
SELECT 
  "Sl no.",
  "Hospital Id",
  "Hospital name",
  "State",
  "District"
FROM public."State wise hospitals"
ORDER BY "State", "Hospital name"
LIMIT 10;

-- 3. Check states distribution
SELECT 
  "State",
  COUNT(*) as hospital_count
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL
GROUP BY "State"
ORDER BY hospital_count DESC;

-- 4. Check for any data quality issues
SELECT 
  'Missing Hospital Name' as issue,
  COUNT(*) as count
FROM public."State wise hospitals"
WHERE "Hospital name" IS NULL OR "Hospital name" = ''
UNION ALL
SELECT 
  'Missing State' as issue,
  COUNT(*) as count
FROM public."State wise hospitals"
WHERE "State" IS NULL OR "State" = ''
UNION ALL
SELECT 
  'Missing Hospital Id' as issue,
  COUNT(*) as count
FROM public."State wise hospitals"
WHERE "Hospital Id" IS NULL OR "Hospital Id" = ''
UNION ALL
SELECT 
  'Duplicate Hospital Ids' as issue,
  COUNT(*) - COUNT(DISTINCT "Hospital Id") as count
FROM public."State wise hospitals"
WHERE "Hospital Id" IS NOT NULL;
