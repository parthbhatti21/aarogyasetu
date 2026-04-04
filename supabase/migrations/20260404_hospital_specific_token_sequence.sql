-- Hospital-Specific Daily Token Sequence Implementation
-- Format: HOSPCODE-DDMMYYYY-SEQUENCE
-- Example: H001-04042026-001, H001-04042026-002, H002-04042026-001

-- 1. Add hospital_code column to hospitals table (if not exists)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(20);

-- 2. Create hospital_queue_counters table for per-hospital daily tracking
CREATE TABLE IF NOT EXISTS hospital_queue_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    counter_date DATE NOT NULL,
    last_token_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id, counter_date)
);

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_hospital_queue_counters_hospital_date 
    ON hospital_queue_counters(hospital_id, counter_date);

-- 4. Create function to generate hospital-specific token number
CREATE OR REPLACE FUNCTION generate_hospital_token_number(p_hospital_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    today DATE := CURRENT_DATE;
    next_number INTEGER;
    token_num VARCHAR(50);
    hosp_code VARCHAR(20);
    formatted_date VARCHAR(8);
BEGIN
    -- Validate hospital exists
    IF p_hospital_id IS NULL THEN
        RAISE EXCEPTION 'Hospital ID cannot be null';
    END IF;
    
    -- Get hospital code (fallback to first 4 chars of UUID if not set)
    SELECT COALESCE(hospital_code, 'H' || SUBSTRING(p_hospital_id::TEXT, 1, 3))
    INTO hosp_code
    FROM hospitals
    WHERE id = p_hospital_id;
    
    IF hosp_code IS NULL THEN
        RAISE EXCEPTION 'Hospital with ID % not found', p_hospital_id;
    END IF;
    
    -- Format date as DDMMYYYY
    formatted_date := TO_CHAR(today, 'DDMMYYYY');
    
    -- Get or create counter for this hospital and date
    INSERT INTO hospital_queue_counters (hospital_id, counter_date, last_token_number)
    VALUES (p_hospital_id, today, 0)
    ON CONFLICT (hospital_id, counter_date) DO NOTHING;
    
    -- Increment and get next number (ATOMIC - prevents race conditions)
    UPDATE hospital_queue_counters
    SET last_token_number = last_token_number + 1
    WHERE hospital_id = p_hospital_id AND counter_date = today
    RETURNING last_token_number INTO next_number;
    
    -- Format: HOSPCODE-DDMMYYYY-SEQUENCE (e.g., H001-04042026-001)
    token_num := hosp_code || '-' || formatted_date || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN token_num;
END;
$$ LANGUAGE plpgsql;

-- 5. Create migration function to update existing old-format tokens
-- (Optional: only run if migrating existing data)
CREATE OR REPLACE FUNCTION migrate_tokens_to_hospital_format()
RETURNS TABLE(migrated_count INTEGER, errors_count INTEGER) AS $$
DECLARE
    v_migrated INTEGER := 0;
    v_errors INTEGER := 0;
    v_token_record RECORD;
BEGIN
    -- Note: This is optional - implement only if migrating existing tokens
    -- For now, we'll just return 0 since we're adding new functionality
    RETURN QUERY SELECT v_migrated, v_errors;
END;
$$ LANGUAGE plpgsql;

-- 6. Add hospital_code values to existing hospitals (if not already set)
-- Using first 3 letters + ID
UPDATE hospitals
SET hospital_code = 'H' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0')
WHERE hospital_code IS NULL;

-- 7. Verify function works
-- SELECT generate_hospital_token_number('your-hospital-uuid'::UUID);
-- This will generate tokens like: H001-04042026-001, H001-04042026-002, etc.
