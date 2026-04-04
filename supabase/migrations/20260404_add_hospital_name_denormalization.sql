-- Add hospital_name column to existing tables for easy bifurcation and filtering
-- This migration denormalizes hospital_name from hospitals table to improve query performance

-- 1. Add hospital_name to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 2. Add hospital_name to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 3. Add hospital_name to staff_profiles table
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 4. Add hospital_name to medical_records table
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 5. Add hospital_name to prescriptions table
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 6. Add hospital_name to medicines table (optional, for pharmacy scoping)
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS hospital_name TEXT;

-- 7. Populate hospital_name for existing records from hospitals table
UPDATE patients p
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE p.hospital_id = h.id AND p.hospital_name IS NULL;

UPDATE tokens t
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE t.hospital_id = h.id AND t.hospital_name IS NULL;

UPDATE staff_profiles sp
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE sp.hospital_id = h.id AND sp.hospital_name IS NULL;

UPDATE medical_records mr
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE mr.hospital_id = h.id AND mr.hospital_name IS NULL;

UPDATE prescriptions pr
SET hospital_name = h.hospital_name
FROM hospitals h
WHERE pr.hospital_id = h.id AND pr.hospital_name IS NULL;

-- 8. Create triggers to automatically update hospital_name when hospital_id changes
CREATE OR REPLACE FUNCTION update_hospital_name_patients()
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

DROP TRIGGER IF EXISTS trigger_update_hospital_name_patients ON patients;
CREATE TRIGGER trigger_update_hospital_name_patients
BEFORE INSERT OR UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_patients();

-- Similar triggers for other tables
CREATE OR REPLACE FUNCTION update_hospital_name_tokens()
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

DROP TRIGGER IF EXISTS trigger_update_hospital_name_tokens ON tokens;
CREATE TRIGGER trigger_update_hospital_name_tokens
BEFORE INSERT OR UPDATE ON tokens
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_tokens();

CREATE OR REPLACE FUNCTION update_hospital_name_staff_profiles()
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

DROP TRIGGER IF EXISTS trigger_update_hospital_name_staff_profiles ON staff_profiles;
CREATE TRIGGER trigger_update_hospital_name_staff_profiles
BEFORE INSERT OR UPDATE ON staff_profiles
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_staff_profiles();

CREATE OR REPLACE FUNCTION update_hospital_name_medical_records()
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

DROP TRIGGER IF EXISTS trigger_update_hospital_name_medical_records ON medical_records;
CREATE TRIGGER trigger_update_hospital_name_medical_records
BEFORE INSERT OR UPDATE ON medical_records
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_medical_records();

CREATE OR REPLACE FUNCTION update_hospital_name_prescriptions()
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

DROP TRIGGER IF EXISTS trigger_update_hospital_name_prescriptions ON prescriptions;
CREATE TRIGGER trigger_update_hospital_name_prescriptions
BEFORE INSERT OR UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_hospital_name_prescriptions();
