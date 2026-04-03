-- Add doctor specialty field and update department to specialty
-- This migration adds support for doctor specialization based on patient complaint types

-- Add specialty column to staff_profiles
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS specialty VARCHAR(50);

-- Define available specialties matching patient complaint types
COMMENT ON COLUMN staff_profiles.specialty IS 
'Doctor specialty type: general, fever, cough, pain, headache, injury, followup, chronic';

-- Update existing doctors to have 'general' specialty if not set
UPDATE staff_profiles 
SET specialty = 'general' 
WHERE role IN ('doctor', 'senior_doctor') 
AND specialty IS NULL;

-- Create index for faster specialty-based queries
CREATE INDEX IF NOT EXISTS idx_staff_profiles_specialty 
ON staff_profiles(specialty) 
WHERE role IN ('doctor', 'senior_doctor');

-- Create function to auto-assign tokens to doctors based on specialty
CREATE OR REPLACE FUNCTION auto_assign_doctor_by_specialty(
  p_token_id UUID,
  p_chief_complaint TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_specialty VARCHAR(50);
  v_assigned_doctor_id UUID;
  v_complaint_lower TEXT;
BEGIN
  -- Normalize complaint to lowercase for matching
  v_complaint_lower := LOWER(COALESCE(p_chief_complaint, 'general'));
  
  -- Map complaint to specialty
  v_specialty := CASE 
    WHEN v_complaint_lower LIKE '%fever%' OR v_complaint_lower LIKE '%cold%' OR v_complaint_lower LIKE '%flu%' THEN 'fever'
    WHEN v_complaint_lower LIKE '%cough%' OR v_complaint_lower LIKE '%breathing%' THEN 'cough'
    WHEN v_complaint_lower LIKE '%pain%' OR v_complaint_lower LIKE '%abdomen%' OR v_complaint_lower LIKE '%chest%' OR v_complaint_lower LIKE '%joint%' THEN 'pain'
    WHEN v_complaint_lower LIKE '%headache%' OR v_complaint_lower LIKE '%migraine%' THEN 'headache'
    WHEN v_complaint_lower LIKE '%injury%' OR v_complaint_lower LIKE '%wound%' THEN 'injury'
    WHEN v_complaint_lower LIKE '%follow%' OR v_complaint_lower LIKE '%followup%' THEN 'followup'
    WHEN v_complaint_lower LIKE '%chronic%' THEN 'chronic'
    ELSE 'general'
  END;
  
  -- Find available doctor with matching specialty (prefer doctors with fewer active patients)
  SELECT sp.user_id INTO v_assigned_doctor_id
  FROM staff_profiles sp
  WHERE sp.role IN ('doctor', 'senior_doctor')
    AND sp.is_active = true
    AND (sp.specialty = v_specialty OR sp.specialty = 'general')
  ORDER BY 
    -- Prefer exact specialty match
    CASE WHEN sp.specialty = v_specialty THEN 0 ELSE 1 END,
    -- Then prefer senior doctors
    CASE WHEN sp.role = 'senior_doctor' THEN 0 ELSE 1 END,
    -- Then by current workload (fewer active patients)
    (
      SELECT COUNT(*) 
      FROM tokens t 
      WHERE t.assigned_doctor_user_id = sp.user_id 
        AND t.status IN ('Waiting', 'Active')
        AND t.visit_date = CURRENT_DATE
    ) ASC
  LIMIT 1;
  
  -- Update token with assigned doctor
  IF v_assigned_doctor_id IS NOT NULL THEN
    UPDATE tokens 
    SET assigned_doctor_user_id = v_assigned_doctor_id,
        updated_at = NOW()
    WHERE id = p_token_id;
  END IF;
  
  RETURN v_assigned_doctor_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_assign_doctor_by_specialty(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION auto_assign_doctor_by_specialty IS 
'Auto-assigns tokens to doctors based on specialty matching with chief complaint';
