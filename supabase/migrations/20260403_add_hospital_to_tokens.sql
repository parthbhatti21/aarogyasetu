-- Add hospital_id to tokens table
-- This scopes tokens to specific hospitals so only that hospital's staff can access them

-- Add hospital_id column (nullable for backward compatibility with existing tokens)
ALTER TABLE public.tokens
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_hospital_id ON public.tokens(hospital_id);

-- Add comment
COMMENT ON COLUMN public.tokens.hospital_id IS 'Links token to hospital where patient is registered';
