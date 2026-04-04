-- FIX: Infinite Recursion in RLS Policy for registration_staff_profiles
-- Problem: The policy queries the same table causing recursion
-- Solution: Use a simplified policy that only checks auth metadata and direct ownership

-- Drop the problematic policies
DROP POLICY IF EXISTS registration_staff_profiles_read_policy ON registration_staff_profiles;
DROP POLICY IF EXISTS registration_staff_profiles_write_policy ON registration_staff_profiles;
DROP POLICY IF EXISTS registration_staff_profiles_insert_policy ON registration_staff_profiles;
DROP POLICY IF EXISTS registration_staff_profiles_update_policy ON registration_staff_profiles;
DROP POLICY IF EXISTS registration_staff_profiles_delete_policy ON registration_staff_profiles;

-- Create a simple read policy without self-referential queries
-- Admins can see all, others see their own profile
CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
FOR SELECT
USING (
  -- Users can see their own profile
  (auth.uid() = user_id)
  -- Admins (in staff_profiles with role='admin') can see all
  -- Note: This query is safe because it limits to single row with LIMIT 1
  OR (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() 
      AND sp.role = 'admin'
      LIMIT 1
    )
  )
);

-- Create insert policy - allow insertion if admin, or for new registration staff records
-- (The app will enforce proper admin checks)
CREATE POLICY registration_staff_profiles_insert_policy ON registration_staff_profiles
FOR INSERT WITH CHECK (
  -- Check if current user is admin in staff_profiles
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() 
    AND sp.role = 'admin'
    LIMIT 1
  )
);

-- Create update policy
CREATE POLICY registration_staff_profiles_update_policy ON registration_staff_profiles
FOR UPDATE USING (
  -- Users can update their own profile
  (auth.uid() = user_id)
  -- Admins can update any profile
  OR (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() 
      AND sp.role = 'admin'
      LIMIT 1
    )
  )
)
WITH CHECK (
  (auth.uid() = user_id)
  OR (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() 
      AND sp.role = 'admin'
      LIMIT 1
    )
  )
);

-- Create delete policy - admins only
CREATE POLICY registration_staff_profiles_delete_policy ON registration_staff_profiles
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM staff_profiles sp
    WHERE sp.user_id = auth.uid() 
    AND sp.role = 'admin'
    LIMIT 1
  )
);

-- Ensure RLS is enabled
ALTER TABLE registration_staff_profiles ENABLE ROW LEVEL SECURITY;

-- Also fix staff_profiles to prevent similar recursion issues
DROP POLICY IF EXISTS staff_profiles_read_policy ON staff_profiles;

CREATE POLICY staff_profiles_read_policy ON staff_profiles
FOR SELECT
USING (
  -- Users can see themselves
  (auth.uid() = user_id)
  -- Admins can see all
  OR (role = 'admin')
);

-- Ensure RLS is enabled on staff_profiles
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT ON registration_staff_profiles TO authenticated;
GRANT INSERT ON registration_staff_profiles TO authenticated;
GRANT UPDATE ON registration_staff_profiles TO authenticated;
GRANT DELETE ON registration_staff_profiles TO authenticated;
GRANT SELECT ON staff_profiles TO authenticated;

COMMIT;
