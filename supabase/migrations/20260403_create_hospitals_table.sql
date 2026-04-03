-- Create hospitals table
-- This table stores hospital information for multi-hospital support
-- Patients will select a hospital during registration, and tokens will be scoped to hospitals

CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT UNIQUE NOT NULL,
  hospital_name TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  sl_no BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by state/district
CREATE INDEX IF NOT EXISTS idx_hospitals_state ON public.hospitals(state);
CREATE INDEX IF NOT EXISTS idx_hospitals_district ON public.hospitals(district);
CREATE INDEX IF NOT EXISTS idx_hospitals_hospital_id ON public.hospitals(hospital_id);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Public read access for hospital selection
-- Anyone can read hospitals (for selection during registration)
CREATE POLICY "Allow public read access to hospitals"
  ON public.hospitals
  FOR SELECT
  USING (true);

-- Only admins can insert/update hospitals
CREATE POLICY "Allow admin insert to hospitals"
  ON public.hospitals
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow admin update to hospitals"
  ON public.hospitals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE public.hospitals IS 'Stores hospital information for multi-hospital support';
