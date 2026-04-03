-- Fix RLS recursion for staff_profiles admin policy
-- and add an admin-only RPC for creating doctor staff profiles.

-- 1) Drop the problematic self-referencing staff_profiles policy
DROP POLICY IF EXISTS "Admins can manage staff profiles" ON staff_profiles;

-- 2) Allow the demo admin user to provision their own admin staff profile.
--    (So the demo hardcoded admin can create doctor accounts.)
DROP POLICY IF EXISTS "Demo admin can insert own admin staff profile" ON staff_profiles;
CREATE POLICY "Demo admin can insert own admin staff profile" ON staff_profiles
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND (auth.jwt() ->> 'email') = 'admin@aarogyasetu.local'
  );

DROP POLICY IF EXISTS "Demo admin can update own admin staff profile" ON staff_profiles;
CREATE POLICY "Demo admin can update own admin staff profile" ON staff_profiles
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND role = 'admin'
    AND (auth.jwt() ->> 'email') = 'admin@aarogyasetu.local'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND (auth.jwt() ->> 'email') = 'admin@aarogyasetu.local'
  );

-- 3) Admin-only function to upsert doctor/senior_doctor staff profile
--    Uses security definer + disables row security to avoid recursion.
CREATE OR REPLACE FUNCTION public.admin_upsert_staff_profile(
  target_user_id uuid,
  target_role text,
  target_display_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET row_security = off
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.staff_profiles sp
    WHERE sp.user_id = auth.uid()
      AND sp.role = 'admin'
      AND sp.is_active = true
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF target_role NOT IN ('doctor', 'senior_doctor') THEN
    RAISE EXCEPTION 'Invalid role: %', target_role;
  END IF;

  INSERT INTO public.staff_profiles (user_id, role, display_name, is_active)
  VALUES (target_user_id, target_role, target_display_name, true)
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role,
        display_name = EXCLUDED.display_name,
        is_active = true,
        updated_at = NOW();
END;
$$;

