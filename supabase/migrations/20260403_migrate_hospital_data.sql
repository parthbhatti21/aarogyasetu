-- Migrate data from existing "State wise hospitals" table to new hospitals table
-- This migration copies data and ensures proper structure

-- Copy data from existing table to new hospitals table
INSERT INTO public.hospitals (hospital_id, hospital_name, state, district, sl_no)
SELECT 
  COALESCE("Hospital Id", 'H-' || "Sl no."::text) as hospital_id,
  "Hospital name" as hospital_name,
  "State" as state,
  "District" as district,
  "Sl no." as sl_no
FROM public."State wise hospitals"
WHERE "Hospital name" IS NOT NULL
ON CONFLICT (hospital_id) DO UPDATE
SET 
  hospital_name = EXCLUDED.hospital_name,
  state = EXCLUDED.state,
  district = EXCLUDED.district,
  sl_no = EXCLUDED.sl_no,
  updated_at = NOW();

-- Verify migration
DO $$
DECLARE
  source_count INTEGER;
  target_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO source_count FROM public."State wise hospitals" WHERE "Hospital name" IS NOT NULL;
  SELECT COUNT(*) INTO target_count FROM public.hospitals;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Data Migration Summary';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Source table rows: %', source_count;
  RAISE NOTICE 'Target table rows: %', target_count;
  RAISE NOTICE 'Migration status: %', CASE WHEN source_count = target_count THEN 'SUCCESS ✓' ELSE 'CHECK REQUIRED' END;
  RAISE NOTICE '============================================';
END $$;

-- Optional: Create view for backward compatibility
CREATE OR REPLACE VIEW public.hospitals_view AS
SELECT 
  sl_no as "Sl no.",
  hospital_id as "Hospital Id",
  hospital_name as "Hospital name",
  state as "State",
  district as "District"
FROM public.hospitals
ORDER BY sl_no;

-- Grant access to view
GRANT SELECT ON public.hospitals_view TO authenticated, anon;

COMMENT ON VIEW public.hospitals_view IS 'Backward compatible view matching original State wise hospitals table structure';
