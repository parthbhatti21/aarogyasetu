-- Fix: Add hospital_name trigger for registration_staff_profiles
-- This ensures hospital_name is automatically populated when hospital_id is set

-- Create trigger function for registration_staff_profiles
CREATE OR REPLACE FUNCTION update_hospital_name_registration_staff()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hospital_id IS NOT NULL THEN
    SELECT hospital_name INTO NEW.hospital_name
    FROM hospitals
    WHERE id = NEW.hospital_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_update_hospital_name_registration_staff ON registration_staff_profiles;

-- Create trigger to auto-populate hospital_name on insert/update
CREATE TRIGGER trigger_update_hospital_name_registration_staff
BEFORE INSERT OR UPDATE ON registration_staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_registration_staff();

-- Populate hospital_name for existing registration staff records
UPDATE registration_staff_profiles rsp
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE rsp.hospital_id = h.id AND rsp.hospital_name IS NULL;

-- Ensure RLS policy allows admin to read all staff
-- This ensures admins can see all staff regardless of hospital
DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;

CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  -- Admin can see all
  auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin')
  -- Staff can see their own profile
  OR auth.uid() = user_id
  -- Staff can see others at their hospital
  OR hospital_id IN (SELECT hospital_id FROM registration_staff_profiles WHERE user_id = auth.uid())
);

-- Verify staff_profiles also has hospital_name populated
UPDATE staff_profiles sp
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE sp.hospital_id = h.id AND sp.hospital_name IS NULL;
