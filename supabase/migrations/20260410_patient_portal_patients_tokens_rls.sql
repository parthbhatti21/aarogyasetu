-- Patient portal: self-registration forms need to insert/link their own patients row
-- and create queue tokens. 20260408 removed the older "Patients can create own tokens" policy.

DROP POLICY IF EXISTS "Patients can insert own patient record" ON public.patients;
CREATE POLICY "Patients can insert own patient record" ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Patients can create own tokens" ON public.tokens;
CREATE POLICY "Patients can create own tokens" ON public.tokens
  FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

GRANT EXECUTE ON FUNCTION public.generate_hospital_token_number(UUID) TO authenticated;
