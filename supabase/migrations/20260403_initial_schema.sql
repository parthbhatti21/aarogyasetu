-- Aarogya Setu Database Schema
-- Initial migration for Patient Module

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(50) UNIQUE NOT NULL, -- Format: ASPT-YYYYMMDD-XXXX
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    
    -- Contact Information
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(15),
    emergency_contact_relation VARCHAR(50),
    
    -- Medical Information
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    
    -- Auth & Metadata
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_user_id ON patients(user_id);

-- ============================================
-- MEDICAL HISTORY TABLE
-- ============================================
CREATE TABLE medical_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Chronic Conditions
    chronic_conditions TEXT[], -- Array of conditions
    allergies TEXT[], -- Array of allergies
    current_medications TEXT[], -- Array of current medications
    past_surgeries TEXT[], -- Array of past surgeries
    family_history TEXT,
    
    -- Lifestyle
    smoking_status VARCHAR(20) CHECK (smoking_status IN ('Never', 'Former', 'Current')),
    alcohol_consumption VARCHAR(20) CHECK (alcohol_consumption IN ('Never', 'Occasional', 'Regular')),
    exercise_frequency VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medical_history_patient ON medical_history(patient_id);

-- ============================================
-- TOKENS/QUEUE TABLE
-- ============================================
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(20) NOT NULL, -- Format: T-XXX
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Visit Information
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_type VARCHAR(50) DEFAULT 'General Consultation',
    department VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'High', 'Emergency')),
    
    -- Queue Status
    status VARCHAR(20) DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Active', 'Completed', 'Cancelled', 'No-Show')),
    queue_position INTEGER,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- AI Conversation Data
    ai_conversation_summary TEXT,
    chief_complaint TEXT,
    symptoms TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for queue management
CREATE INDEX idx_tokens_visit_date ON tokens(visit_date);
CREATE INDEX idx_tokens_status ON tokens(status);
CREATE INDEX idx_tokens_patient_id ON tokens(patient_id);
CREATE INDEX idx_tokens_queue_position ON tokens(queue_position);

-- Unique constraint: one token per patient per day
CREATE UNIQUE INDEX idx_tokens_unique_daily ON tokens(patient_id, visit_date) WHERE status != 'Cancelled';

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id VARCHAR(50) UNIQUE NOT NULL, -- Format: APT-YYYYMMDD-XXXX
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Appointment Details
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    doctor_id UUID, -- Will reference doctors table (to be created)
    department VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'No-Show')),
    cancellation_reason TEXT,
    
    -- Visit Information
    visit_type VARCHAR(50),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================
-- MEDICAL RECORDS TABLE
-- ============================================
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    
    -- Record Details
    record_type VARCHAR(50) CHECK (record_type IN ('Consultation', 'Lab Report', 'Prescription', 'Imaging', 'Diagnosis', 'Discharge Summary', 'Other')),
    record_date DATE DEFAULT CURRENT_DATE,
    
    -- Medical Content
    diagnosis TEXT,
    symptoms TEXT[],
    vital_signs JSONB, -- { "bp": "120/80", "temp": "98.6", "pulse": "72", "spo2": "98" }
    doctor_notes TEXT,
    
    -- Documents
    document_url TEXT, -- Supabase Storage URL
    document_type VARCHAR(50),
    
    created_by UUID, -- Doctor/Staff user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);
CREATE INDEX idx_medical_records_type ON medical_records(record_type);

-- ============================================
-- PRESCRIPTIONS TABLE
-- ============================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id VARCHAR(50) UNIQUE NOT NULL, -- Format: RX-YYYYMMDD-XXXX
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES medical_records(id) ON DELETE CASCADE,
    
    -- Prescription Details
    prescribed_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    doctor_id UUID,
    
    -- Medications (JSONB for flexibility)
    medications JSONB, -- [{ "name": "Med", "dosage": "10mg", "frequency": "2x daily", "duration": "7 days" }]
    
    -- Instructions
    instructions TEXT,
    precautions TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_date ON prescriptions(prescribed_date);

-- ============================================
-- MEDICINES/INVENTORY TABLE
-- ============================================
CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Medicine Information
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    brand_name VARCHAR(255),
    manufacturer VARCHAR(255),
    
    -- Classification
    category VARCHAR(100), -- Antibiotic, Painkiller, etc.
    form VARCHAR(50), -- Tablet, Syrup, Injection, etc.
    strength VARCHAR(50), -- 500mg, 10ml, etc.
    
    -- Stock Information
    quantity_available INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    expiry_date DATE,
    
    -- Storage & Location
    store_location VARCHAR(255),
    requires_prescription BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_category ON medicines(category);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Notification Details
    type VARCHAR(50) CHECK (type IN ('Token Update', 'Appointment Reminder', 'Prescription Ready', 'Lab Report Ready', 'General')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Delivery Channels
    send_email BOOLEAN DEFAULT false,
    send_sms BOOLEAN DEFAULT false,
    send_whatsapp BOOLEAN DEFAULT false,
    send_push BOOLEAN DEFAULT true,
    
    -- Status
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Read')),
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    related_entity_type VARCHAR(50), -- 'token', 'appointment', 'prescription', etc.
    related_entity_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- AI CONVERSATION LOGS TABLE
-- ============================================
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    
    -- Conversation Data
    messages JSONB NOT NULL, -- [{ "role": "user/assistant", "content": "...", "timestamp": "..." }]
    language VARCHAR(10) DEFAULT 'en',
    
    -- Extracted Information
    extracted_data JSONB, -- Structured data extracted from conversation
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Metadata
    completed BOOLEAN DEFAULT false,
    token_id UUID REFERENCES tokens(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_patient ON ai_conversations(patient_id);

-- ============================================
-- QUEUE COUNTERS TABLE (for daily token generation)
-- ============================================
CREATE TABLE queue_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    counter_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    last_token_number INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own data" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

-- Medical History policies
CREATE POLICY "Patients can view own medical history" ON medical_history
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Tokens policies
CREATE POLICY "Patients can view own tokens" ON tokens
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Appointments policies
CREATE POLICY "Patients can view own appointments" ON appointments
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Medical Records policies
CREATE POLICY "Patients can view own medical records" ON medical_records
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Prescriptions policies
CREATE POLICY "Patients can view own prescriptions" ON prescriptions
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Notifications policies
CREATE POLICY "Patients can view own notifications" ON notifications
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- AI Conversations policies
CREATE POLICY "Users can view own conversations" ON ai_conversations
    FOR ALL USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_history_updated_at BEFORE UPDATE ON medical_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate next token number
CREATE OR REPLACE FUNCTION generate_token_number()
RETURNS VARCHAR AS $$
DECLARE
    today DATE := CURRENT_DATE;
    next_number INTEGER;
    token_num VARCHAR(20);
BEGIN
    -- Get or create counter for today
    INSERT INTO queue_counters (counter_date, last_token_number)
    VALUES (today, 0)
    ON CONFLICT (counter_date) DO NOTHING;
    
    -- Increment and get next number
    UPDATE queue_counters
    SET last_token_number = last_token_number + 1
    WHERE counter_date = today
    RETURNING last_token_number INTO next_number;
    
    -- Format: T-XXX (e.g., T-001, T-002, ...)
    token_num := 'T-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN token_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate patient ID
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS VARCHAR AS $$
DECLARE
    date_part VARCHAR(8);
    random_part VARCHAR(4);
    patient_id VARCHAR(50);
BEGIN
    -- Format: ASPT-YYYYMMDD-XXXX
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    patient_id := 'ASPT-' || date_part || '-' || random_part;
    
    RETURN patient_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate appointment ID
CREATE OR REPLACE FUNCTION generate_appointment_id()
RETURNS VARCHAR AS $$
DECLARE
    date_part VARCHAR(8);
    random_part VARCHAR(4);
    apt_id VARCHAR(50);
BEGIN
    -- Format: APT-YYYYMMDD-XXXX
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    apt_id := 'APT-' || date_part || '-' || random_part;
    
    RETURN apt_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate prescription ID
CREATE OR REPLACE FUNCTION generate_prescription_id()
RETURNS VARCHAR AS $$
DECLARE
    date_part VARCHAR(8);
    random_part VARCHAR(4);
    rx_id VARCHAR(50);
BEGIN
    -- Format: RX-YYYYMMDD-XXXX
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    rx_id := 'RX-' || date_part || '-' || random_part;
    
    RETURN rx_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Insert sample medicines
INSERT INTO medicines (name, generic_name, brand_name, manufacturer, category, form, strength, quantity_available, unit_price, requires_prescription) VALUES
('Paracetamol', 'Acetaminophen', 'Crocin', 'GSK', 'Painkiller', 'Tablet', '500mg', 1000, 5.00, false),
('Amoxicillin', 'Amoxicillin', 'Novamox', 'Cipla', 'Antibiotic', 'Capsule', '500mg', 500, 15.00, true),
('Omeprazole', 'Omeprazole', 'Omez', 'Dr. Reddy''s', 'Antacid', 'Capsule', '20mg', 800, 8.00, true),
('Cetirizine', 'Cetirizine', 'Zyrtec', 'Johnson & Johnson', 'Antihistamine', 'Tablet', '10mg', 600, 6.00, false),
('Metformin', 'Metformin', 'Glycomet', 'USV', 'Antidiabetic', 'Tablet', '500mg', 400, 10.00, true);

COMMENT ON TABLE patients IS 'Stores patient demographic and contact information';
COMMENT ON TABLE tokens IS 'Manages daily patient queue and token numbers';
COMMENT ON TABLE ai_conversations IS 'Logs AI agent conversations for registration';
COMMENT ON TABLE medicines IS 'Medicine inventory with availability status';
