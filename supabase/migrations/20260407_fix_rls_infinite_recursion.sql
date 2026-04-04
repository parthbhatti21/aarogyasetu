-- FIX: Infinite Recursion in RLS Policy for registration_staff_profiles
-- Problem: The RLS policy is causing infinite recursion
-- Solution: Simplify the policy to avoid the loop

-- Drop the problematic policy
DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;

-- Create a simpler policy that doesn't cause recursion
-- Admin can see all, others see their own profile
CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  -- Admin users can see all staff
  (auth.uid() IN (SELECT user_id FROM staff_profiles WHERE role = 'admin'))
  -- OR users can see their own profile
  OR (auth.uid() = user_id)
);

-- Enable RLS on registration_staff_profiles
ALTER TABLE registration_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Also fix staff_profiles RLS to avoid recursion
DROP POLICY IF EXISTS staff_profiles_read_policy ON staff_profiles;

CREATE POLICY staff_profiles_read_policy ON staff_profiles
FOR SELECT
USING (
  -- Admins can see all
  (role = 'admin')
  -- Users can see themselves
  OR (auth.uid() = user_id)
  -- Staff can see others at same hospital if assigned
  OR (hospital_id IN (SELECT hospital_id FROM staff_profiles sp WHERE sp.user_id = auth.uid() AND sp.hospital_id IS NOT NULL))
);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Ensure registration staff can see data
GRANT SELECT ON registration_staff_profiles TO authenticated;
GRANT SELECT ON staff_profiles TO authenticated;

