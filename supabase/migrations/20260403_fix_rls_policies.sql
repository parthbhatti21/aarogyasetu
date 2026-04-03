-- Fix RLS Policies for Patient Registration
-- Allow authenticated users to insert their own records

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;

-- Recreate with INSERT permission
CREATE POLICY "Users can insert own patient record" ON patients
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can view own data" ON patients
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Patients can update own data" ON patients
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Medical History: Allow INSERT
DROP POLICY IF EXISTS "Patients can view own medical history" ON medical_history;

CREATE POLICY "Users can insert own medical history" ON medical_history
    FOR INSERT
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Patients can view own medical history" ON medical_history
    FOR SELECT 
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Tokens: Allow INSERT
DROP POLICY IF EXISTS "Patients can view own tokens" ON tokens;

CREATE POLICY "Users can create own tokens" ON tokens
    FOR INSERT
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Patients can view own tokens" ON tokens
    FOR SELECT 
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Patients can update own tokens" ON tokens
    FOR UPDATE
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

-- Allow authenticated users to read all tokens for queue display
CREATE POLICY "Authenticated users can view all active tokens" ON tokens
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- AI Conversations: Allow INSERT and SELECT
CREATE POLICY "Users can create own ai conversations" ON ai_conversations
    FOR INSERT
    WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view own ai conversations" ON ai_conversations
    FOR SELECT
    USING (
        patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
    );
