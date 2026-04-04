-- Fix registration token flow: RLS must not reference auth.users (42501 permission denied).
-- Also add missing INSERT/UPDATE on token_sequences (read-only policy existed from phase1).

DROP POLICY IF EXISTS token_sequences_read_policy ON token_sequences;

CREATE POLICY token_sequences_select_policy ON token_sequences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles rsp
      WHERE rsp.user_id = auth.uid()
        AND rsp.is_active = true
        AND rsp.hospital_id = token_sequences.hospital_id
    )
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );

CREATE POLICY token_sequences_insert_policy ON token_sequences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles rsp
      WHERE rsp.user_id = auth.uid()
        AND rsp.is_active = true
        AND rsp.hospital_id = token_sequences.hospital_id
    )
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );

CREATE POLICY token_sequences_update_policy ON token_sequences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles rsp
      WHERE rsp.user_id = auth.uid()
        AND rsp.is_active = true
        AND rsp.hospital_id = token_sequences.hospital_id
    )
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles rsp
      WHERE rsp.user_id = auth.uid()
        AND rsp.is_active = true
        AND rsp.hospital_id = token_sequences.hospital_id
    )
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );

DROP POLICY IF EXISTS audit_log_read_policy ON registration_desk_audit_log;
DROP POLICY IF EXISTS audit_log_write_policy ON registration_desk_audit_log;

CREATE POLICY audit_log_read_policy ON registration_desk_audit_log
  FOR SELECT USING (
    staff_id = auth.uid()
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );

CREATE POLICY audit_log_write_policy ON registration_desk_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_staff_profiles rsp
      WHERE rsp.user_id = auth.uid() AND rsp.is_active = true
    )
    OR auth.jwt()->>'role' IN ('admin', 'super_admin')
    OR auth.jwt()->>'email' = 'admin@aarogyasetu.local'
  );
