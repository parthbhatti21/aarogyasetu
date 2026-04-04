-- Allow registration staff to insert and read patients for their hospital
-- Problem: Registration staff cannot insert patients - RLS policies block them
--          Attempting to query auth.users table in RLS causes "permission denied for table users"
-- Solution: Use registration_staff_profiles table checks + auth.jwt() for admin role detection
-- CRITICAL: Do NOT query auth.users - it causes 42501 "permission denied" error

-- First, ENABLE RLS on all necessary tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_desk_audit_log ENABLE ROW LEVEL SECURITY;

-- DROP ALL existing policies on patients table
DROP POLICY IF EXISTS "Users can insert own patient record" ON patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;
DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
DROP POLICY IF EXISTS "Registration staff can insert patients" ON patients;
DROP POLICY IF EXISTS "Registration staff can view patients in their hospital" ON patients;
DROP POLICY IF EXISTS "Registration staff can update patients in their hospital" ON patients;
DROP POLICY IF EXISTS "Clinical staff can view patients in their hospital" ON patients;

-- DROP ALL existing policies on tokens table
DROP POLICY IF EXISTS "Patients can view own tokens" ON tokens;
DROP POLICY IF EXISTS "Registration staff can view tokens in their hospital" ON tokens;
DROP POLICY IF EXISTS "Registration staff can insert tokens" ON tokens;

-- RE-ENABLE RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PATIENTS TABLE POLICIES
-- ============================================================================

-- FIRST PRIORITY: Patients can view their own data (CRITICAL for login)
CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (auth.uid() = user_id);

-- Patients can update their own data
CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Registration staff can INSERT patients for their hospital
CREATE POLICY "Registration staff can insert patients" ON patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = patients.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  );

-- Registration staff can SELECT/VIEW patients for their hospital
CREATE POLICY "Registration staff can view patients in their hospital" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = patients.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  );

-- Registration staff can UPDATE patients in their hospital
CREATE POLICY "Registration staff can update patients in their hospital" ON patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = patients.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = patients.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  );

-- Clinical staff can view patients in their hospital
CREATE POLICY "Clinical staff can view patients in their hospital" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = patients.hospital_id
      AND role IN ('doctor', 'senior_doctor', 'nurse', 'clinical_admin')
    )
  );

-- Admins can view all patients
CREATE POLICY "Admins can view all patients" ON patients
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );

-- ============================================================================
-- TOKENS TABLE POLICIES
-- ============================================================================

-- Patients can view their own tokens
CREATE POLICY "Patients can view own tokens" ON tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE id = tokens.patient_id
      AND user_id = auth.uid()
    )
  );

-- Registration staff can view tokens in their hospital
CREATE POLICY "Registration staff can view tokens in their hospital" ON tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = tokens.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  );

-- Registration staff can INSERT tokens
CREATE POLICY "Registration staff can insert tokens" ON tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = tokens.hospital_id
    )
    OR
    (auth.jwt()->>'role' IN ('admin', 'super_admin') OR auth.jwt()->>'email' = 'admin@aarogyasetu.local')
  );

-- Clinical staff can view tokens in their hospital
CREATE POLICY "Clinical staff can view tokens in their hospital" ON tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE user_id = auth.uid()
      AND is_active = true
      AND hospital_id = tokens.hospital_id
    )
  );

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens" ON tokens
  FOR SELECT USING (
    auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );
