-- Doctor Module MVP
-- Adds staff RBAC, consultation lifecycle fields, token events, and audit logs.

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(40) NOT NULL CHECK (role IN ('admin', 'doctor', 'senior_doctor', 'registration_desk', 'medical_store_admin', 'medical_store_sales')),
  display_name VARCHAR(255) NOT NULL,
  department VARCHAR(120),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view own profile" ON staff_profiles;
CREATE POLICY "Staff can view own profile" ON staff_profiles
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage staff profiles" ON staff_profiles;
CREATE POLICY "Admins can manage staff profiles" ON staff_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own doctor profiles" ON staff_profiles;
CREATE POLICY "Users can create own doctor profiles" ON staff_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND role IN ('doctor', 'senior_doctor')
  );

DROP POLICY IF EXISTS "Users can update own doctor profiles" ON staff_profiles;
CREATE POLICY "Users can update own doctor profiles" ON staff_profiles
  FOR UPDATE USING (
    user_id = auth.uid()
    AND role IN ('doctor', 'senior_doctor')
  );

ALTER TABLE tokens ADD COLUMN IF NOT EXISTS assigned_doctor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS consultation_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS consultation_ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS consultation_disposition VARCHAR(20) CHECK (consultation_disposition IN ('Completed', 'Admitted', 'Follow-up'));
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_tokens_assigned_doctor ON tokens(assigned_doctor_user_id);

CREATE TABLE IF NOT EXISTS token_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_events_token ON token_events(token_id);
CREATE INDEX IF NOT EXISTS idx_token_events_patient ON token_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_token_events_created_at ON token_events(created_at);

ALTER TABLE token_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Doctors and seniors can read token events" ON token_events;
CREATE POLICY "Doctors and seniors can read token events" ON token_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role IN ('doctor', 'senior_doctor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Doctors can write token events" ON token_events;
CREATE POLICY "Doctors can write token events" ON token_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role IN ('doctor', 'senior_doctor', 'admin')
    )
  );

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Senior doctor and admin can read audit logs" ON audit_logs;
CREATE POLICY "Senior doctor and admin can read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role IN ('senior_doctor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Clinical staff can insert audit logs" ON audit_logs;
CREATE POLICY "Clinical staff can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.user_id = auth.uid() AND sp.role IN ('doctor', 'senior_doctor', 'admin')
    )
  );
