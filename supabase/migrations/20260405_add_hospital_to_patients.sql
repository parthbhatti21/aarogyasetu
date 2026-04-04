-- Add hospital_id and hospital_name to patients table for bifurcation
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);

COMMENT ON COLUMN public.patients.hospital_id IS 'Links patient to their registered hospital';
COMMENT ON COLUMN public.patients.hospital_name IS 'Denormalized hospital name for quick reference';
