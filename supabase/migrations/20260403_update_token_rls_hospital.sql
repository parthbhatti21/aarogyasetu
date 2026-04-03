-- Update RLS policies to scope tokens by hospital
-- Staff should only see tokens from their assigned hospital

-- Drop existing token policies that might conflict
DROP POLICY IF EXISTS "Staff can view tokens in their department" ON public.tokens;
DROP POLICY IF EXISTS "Doctors can view all tokens" ON public.tokens;
DROP POLICY IF EXISTS "Staff can view all tokens" ON public.tokens;

-- Patients can view their own tokens (unchanged)
DROP POLICY IF EXISTS "Patients can view own tokens" ON public.tokens;
CREATE POLICY "Patients can view own tokens"
  ON public.tokens
  FOR SELECT
  USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Staff can view tokens from their assigned hospital
CREATE POLICY "Staff can view tokens from their hospital"
  ON public.tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (
        -- If staff has hospital_id, only show tokens from that hospital
        (sp.hospital_id IS NOT NULL AND tokens.hospital_id = sp.hospital_id)
        OR
        -- If staff has no hospital_id (legacy/multi-hospital admin), show all tokens
        (sp.hospital_id IS NULL)
      )
    )
  );

-- Staff can update tokens from their hospital
DROP POLICY IF EXISTS "Staff can update tokens" ON public.tokens;
CREATE POLICY "Staff can update tokens from their hospital"
  ON public.tokens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (
        sp.hospital_id IS NULL OR tokens.hospital_id = sp.hospital_id
      )
    )
  );

-- Staff can insert tokens (will be scoped to their hospital)
DROP POLICY IF EXISTS "Staff can insert tokens" ON public.tokens;
CREATE POLICY "Staff can insert tokens from their hospital"
  ON public.tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles sp
      WHERE sp.user_id = auth.uid()
      AND (
        sp.hospital_id IS NULL OR tokens.hospital_id = sp.hospital_id OR tokens.hospital_id IS NULL
      )
    )
  );

-- Patients can create tokens (will include their selected hospital)
DROP POLICY IF EXISTS "Patients can create tokens" ON public.tokens;
CREATE POLICY "Patients can create own tokens"
  ON public.tokens
  FOR INSERT
  WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Staff can view tokens from their hospital" ON public.tokens IS 'Staff can only view tokens from their assigned hospital. NULL hospital_id = multi-hospital access.';
