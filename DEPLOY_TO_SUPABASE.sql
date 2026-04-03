-- ============================================================================
-- HOSPITAL SELECTION FEATURE - COMPLETE DEPLOYMENT SQL
-- ============================================================================
-- Copy entire content and paste into Supabase SQL Editor → Run
-- This will apply all migrations and set up the feature completely
-- ============================================================================

-- ============================================================================
-- 1. CREATE HOSPITALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT UNIQUE NOT NULL,
  hospital_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  sl_no BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_state ON public.hospitals(state);
CREATE INDEX IF NOT EXISTS idx_hospitals_district ON public.hospitals(district);
CREATE INDEX IF NOT EXISTS idx_hospitals_hospital_id ON public.hospitals(hospital_id);

ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to hospitals"
  ON public.hospitals FOR SELECT USING (true);

CREATE POLICY "Allow admin insert to hospitals"
  ON public.hospitals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Allow admin update to hospitals"
  ON public.hospitals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 2. ADD HOSPITAL_ID TO STAFF_PROFILES
-- ============================================================================
ALTER TABLE public.staff_profiles
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_profiles_hospital_id ON public.staff_profiles(hospital_id);

-- ============================================================================
-- 3. ADD HOSPITAL_ID TO TOKENS
-- ============================================================================
ALTER TABLE public.tokens
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tokens_hospital_id ON public.tokens(hospital_id);

-- ============================================================================
-- 4. UPDATE RLS POLICIES FOR TOKENS (HOSPITAL SCOPING)
-- ============================================================================
DROP POLICY IF EXISTS "Staff can view tokens in their department" ON public.tokens;
DROP POLICY IF EXISTS "Doctors can view all tokens" ON public.tokens;
DROP POLICY IF EXISTS "Staff can view all tokens" ON public.tokens;
DROP POLICY IF EXISTS "Patients can view own tokens" ON public.tokens;

CREATE POLICY "Patients can view own tokens"
  ON public.tokens FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view tokens from their hospital"
  ON public.tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (
        (sp.hospital_id IS NOT NULL AND tokens.hospital_id = sp.hospital_id)
        OR (sp.hospital_id IS NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Staff can update tokens" ON public.tokens;
CREATE POLICY "Staff can update tokens from their hospital"
  ON public.tokens FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (sp.hospital_id IS NULL OR tokens.hospital_id = sp.hospital_id)
    )
  );

DROP POLICY IF EXISTS "Staff can insert tokens" ON public.tokens;
CREATE POLICY "Staff can insert tokens from their hospital"
  ON public.tokens FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (sp.hospital_id IS NULL OR tokens.hospital_id = sp.hospital_id OR tokens.hospital_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Patients can create tokens" ON public.tokens;
CREATE POLICY "Patients can create own tokens"
  ON public.tokens FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. MIGRATE DATA FROM EXISTING TABLE
-- ============================================================================
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

-- ============================================================================
-- 6. VERIFICATION QUERIES
-- ============================================================================
-- Check hospital data migrated
SELECT COUNT(*) as total_hospitals FROM public.hospitals;

-- Check states
SELECT COUNT(DISTINCT state) as unique_states FROM public.hospitals;

-- Sample data
SELECT hospital_name, state, district FROM public.hospitals ORDER BY state, hospital_name LIMIT 5;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Assign staff to hospitals:
--    UPDATE staff_profiles SET hospital_id = (SELECT id FROM hospitals WHERE hospital_name = 'Your Hospital')
--    WHERE user_id = 'staff_user_id';
--
-- 2. Test patient registration (should show hospital selection step)
-- 3. Create tokens and verify hospital_id is saved
-- 4. Login as doctor and verify queue filtering
-- ============================================================================
