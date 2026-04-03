-- Helper: check staff role without RLS recursion (SECURITY DEFINER + row_security off)
CREATE OR REPLACE FUNCTION public.is_staff_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role = p_role
      AND sp.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_clinical_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role IN ('doctor', 'senior_doctor', 'admin')
      AND sp.is_active = true
  );
$$;

-- Admin: read all patient module data
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;
CREATE POLICY "Admins can view all patients" ON patients
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Admins can view all medical history" ON medical_history;
CREATE POLICY "Admins can view all medical history" ON medical_history
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Clinical staff can view medical history" ON medical_history;
CREATE POLICY "Clinical staff can view medical history" ON medical_history
  FOR SELECT USING (public.is_clinical_or_admin());

-- Medical records: clinical staff insert/update; admin read all
DROP POLICY IF EXISTS "Clinical staff can insert medical records" ON medical_records;
CREATE POLICY "Clinical staff can insert medical records" ON medical_records
  FOR INSERT WITH CHECK (public.is_clinical_or_admin());

DROP POLICY IF EXISTS "Clinical staff can update medical records" ON medical_records;
CREATE POLICY "Clinical staff can update medical records" ON medical_records
  FOR UPDATE USING (public.is_clinical_or_admin());

DROP POLICY IF EXISTS "Admins can view all medical records" ON medical_records;
CREATE POLICY "Admins can view all medical records" ON medical_records
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Clinical staff can view medical records" ON medical_records;
CREATE POLICY "Clinical staff can view medical records" ON medical_records
  FOR SELECT USING (public.is_clinical_or_admin());

-- Prescriptions: clinical staff insert/update; admin read all
DROP POLICY IF EXISTS "Clinical staff can insert prescriptions" ON prescriptions;
CREATE POLICY "Clinical staff can insert prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (public.is_clinical_or_admin());

DROP POLICY IF EXISTS "Clinical staff can update prescriptions" ON prescriptions;
CREATE POLICY "Clinical staff can update prescriptions" ON prescriptions
  FOR UPDATE USING (public.is_clinical_or_admin());

DROP POLICY IF EXISTS "Admins can view all prescriptions" ON prescriptions;
CREATE POLICY "Admins can view all prescriptions" ON prescriptions
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Clinical staff can view prescriptions" ON prescriptions;
CREATE POLICY "Clinical staff can view prescriptions" ON prescriptions
  FOR SELECT USING (public.is_clinical_or_admin());

-- Tokens: clinical staff can update any token (queue / consultation)
DROP POLICY IF EXISTS "Clinical staff can update tokens" ON tokens;
CREATE POLICY "Clinical staff can update tokens" ON tokens
  FOR UPDATE USING (public.is_clinical_or_admin());

-- Staff profiles: admin can list all (for doctor-wise reports)
DROP POLICY IF EXISTS "Admins can view all staff profiles" ON staff_profiles;
CREATE POLICY "Admins can view all staff profiles" ON staff_profiles
  FOR SELECT USING (public.is_staff_role('admin'));

-- Optional: admin read across operational tables
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications" ON notifications
  FOR SELECT USING (public.is_staff_role('admin'));

DROP POLICY IF EXISTS "Admins can view all ai conversations" ON ai_conversations;
CREATE POLICY "Admins can view all ai conversations" ON ai_conversations
  FOR SELECT USING (public.is_staff_role('admin'));

