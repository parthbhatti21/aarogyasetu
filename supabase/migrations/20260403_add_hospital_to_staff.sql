-- Add hospital_id to staff_profiles table
-- This links staff members to specific hospitals so they only see tokens from their hospital

-- Add hospital_id column (nullable for backward compatibility)
ALTER TABLE public.staff_profiles
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_profiles_hospital_id ON public.staff_profiles(hospital_id);

-- Add comment
COMMENT ON COLUMN public.staff_profiles.hospital_id IS 'Links staff to their assigned hospital for token scoping';
