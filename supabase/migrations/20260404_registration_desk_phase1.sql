-- Registration Desk Module - Phase 1: Database Setup
-- Add registration_staff role, extend patients table, extend tokens table

-- ============================================
-- PART 1: ROLES & STAFF PROFILES
-- ============================================

-- Create registration_staff_profiles table (links to auth.users)
CREATE TABLE IF NOT EXISTS registration_staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Staff Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    hospital_id UUID, -- Will reference hospitals table
    hospital_name VARCHAR(255),
    
    -- Role & Status
    role VARCHAR(50) DEFAULT 'registration_desk_operator' CHECK (role IN ('registration_desk_operator', 'registration_desk_supervisor')),
    is_active BOOLEAN DEFAULT true,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_registration_staff_user_id ON registration_staff_profiles(user_id);
CREATE INDEX idx_registration_staff_hospital_id ON registration_staff_profiles(hospital_id);
CREATE INDEX idx_registration_staff_is_active ON registration_staff_profiles(is_active);

-- ============================================
-- PART 2: EXTEND PATIENTS TABLE
-- ============================================

-- Add registration desk specific fields to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS income VARCHAR(50); -- "Low", "Medium", "High" or numeric range
ALTER TABLE patients ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50) CHECK (billing_type IN (
    'BPL', 'RBSK', 'ESI', 'Senior Citizen', 'Poor', 'Amarnath Yatra', 
    'Medical Student', 'Hospital Staff', 'Handicapped', 'General'
));
ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS surname VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES registration_staff_profiles(user_id); -- Track which staff registered them
ALTER TABLE patients ADD COLUMN IF NOT EXISTS registration_desk_timestamp TIMESTAMP WITH TIME ZONE; -- When registered at desk

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_patients_billing_type ON patients(billing_type);
CREATE INDEX IF NOT EXISTS idx_patients_registered_by ON patients(registered_by);

-- ============================================
-- PART 3: EXTEND TOKENS TABLE
-- ============================================

-- Add registration desk specific fields to tokens table
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS purpose_of_visit TEXT; -- Chief complaint description
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS income VARCHAR(50);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS suggested_doctor_specialty VARCHAR(100);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS suggested_doctor_id UUID; -- Reference to doctor profile
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS manual_doctor_override BOOLEAN DEFAULT false; -- If staff manually selected doctor
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS created_by_staff_id UUID REFERENCES registration_staff_profiles(user_id);
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS hospital_id UUID; -- Associate token with hospital

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tokens_suggested_specialty ON tokens(suggested_doctor_specialty);
CREATE INDEX IF NOT EXISTS idx_tokens_created_by_staff ON tokens(created_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_tokens_hospital_id ON tokens(hospital_id);
CREATE INDEX IF NOT EXISTS idx_tokens_visit_date_hospital ON tokens(visit_date, hospital_id) WHERE status IN ('Waiting', 'Active');

-- ============================================
-- PART 4: DOCTOR SPECIALTY REFERENCE TABLE
-- ============================================

-- Create mapping table for chief complaints to doctor specialties
CREATE TABLE IF NOT EXISTS chief_complaint_to_specialty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chief_complaint_keyword VARCHAR(100) NOT NULL,
    suggested_specialty VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0, -- For ranking if multiple matches
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pre-populate chief complaint mappings
INSERT INTO chief_complaint_to_specialty (chief_complaint_keyword, suggested_specialty, priority) VALUES
    ('fever', 'General Practice', 1),
    ('weakness', 'General Practice', 1),
    ('cold', 'General Practice', 1),
    ('flu', 'General Practice', 1),
    ('skin', 'Dermatology', 2),
    ('rash', 'Dermatology', 2),
    ('pimples', 'Dermatology', 2),
    ('eczema', 'Dermatology', 2),
    ('chest pain', 'Cardiology', 3),
    ('heart', 'Cardiology', 2),
    ('cardiac', 'Cardiology', 2),
    ('injury', 'Orthopedics', 2),
    ('fracture', 'Orthopedics', 2),
    ('bone', 'Orthopedics', 2),
    ('joint', 'Orthopedics', 2),
    ('headache', 'Neurology', 2),
    ('migraine', 'Neurology', 2),
    ('dizziness', 'Neurology', 2),
    ('eye', 'Ophthalmology', 2),
    ('vision', 'Ophthalmology', 2),
    ('teeth', 'Dentistry', 1),
    ('dental', 'Dentistry', 1),
    ('stomach', 'Gastroenterology', 1),
    ('abdominal pain', 'Gastroenterology', 2),
    ('digestive', 'Gastroenterology', 1),
    ('cough', 'Respiratory/Pulmonology', 1),
    ('breathing', 'Respiratory/Pulmonology', 1),
    ('respiratory', 'Respiratory/Pulmonology', 1),
    ('consultation', 'General Practice', 0),
    ('checkup', 'General Practice', 0),
    ('followup', 'General Practice', 0)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_chief_complaint_keyword ON chief_complaint_to_specialty(chief_complaint_keyword);

-- ============================================
-- PART 5: REGISTRATION DESK AUDIT LOG
-- ============================================

-- Create audit log for registration activities
CREATE TABLE IF NOT EXISTS registration_desk_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES registration_staff_profiles(user_id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'patient_registered', 'token_created', 'patient_updated', 'duplicate_detected'
    details JSONB, -- Store additional details as JSON
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_staff_id ON registration_desk_audit_log(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_patient_id ON registration_desk_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON registration_desk_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON registration_desk_audit_log(created_at);

-- ============================================
-- PART 6: TOKEN SEQUENCE FOR REGISTRATION DESK
-- ============================================

-- Create a sequence for token numbers (per hospital, per day)
CREATE TABLE IF NOT EXISTS token_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_sequence_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hospital_id, visit_date)
);

CREATE INDEX IF NOT EXISTS idx_token_sequences_hospital_date ON token_sequences(hospital_id, visit_date);

-- ============================================
-- PART 7: RLS POLICIES (if not already set)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE registration_staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chief_complaint_to_specialty ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_desk_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff can only view their own profile and their hospital's staff
CREATE POLICY registration_staff_profiles_read_policy ON registration_staff_profiles
    FOR SELECT USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM registration_staff_profiles 
            WHERE user_id = auth.uid() 
            AND hospital_id = registration_staff_profiles.hospital_id
        )
        OR EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        )
    );

-- RLS Policy: Only admins can insert/update staff profiles
CREATE POLICY registration_staff_profiles_write_policy ON registration_staff_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        )
    );

-- RLS Policy: Chief complaint mapping is publicly readable
CREATE POLICY chief_complaint_read_policy ON chief_complaint_to_specialty
    FOR SELECT USING (is_active = true);

-- RLS Policy: Audit logs are readable by admins and the acting staff
CREATE POLICY audit_log_read_policy ON registration_desk_audit_log
    FOR SELECT USING (
        staff_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        )
    );

-- RLS Policy: Only registration staff and admins can insert audit logs
CREATE POLICY audit_log_write_policy ON registration_desk_audit_log
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM registration_staff_profiles 
            WHERE user_id = auth.uid() AND is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        )
    );

-- RLS Policy: Token sequences accessible to registration staff
CREATE POLICY token_sequences_read_policy ON token_sequences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM registration_staff_profiles 
            WHERE user_id = auth.uid() 
            AND hospital_id = token_sequences.hospital_id
            AND is_active = true
        )
        OR EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE registration_staff_profiles IS 'Profiles for registration desk staff with role and hospital assignment';
COMMENT ON TABLE chief_complaint_to_specialty IS 'Mapping of chief complaints/keywords to doctor specialties for auto-suggestion';
COMMENT ON TABLE registration_desk_audit_log IS 'Audit trail for all registration desk activities';
COMMENT ON TABLE token_sequences IS 'Maintains token number sequence per hospital per day';
