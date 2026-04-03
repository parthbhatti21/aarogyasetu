import { supabase } from '@/utils/supabase';

export async function logMedicalAudit(input: {
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  patientId?: string;
}) {
  const { data: userRes } = await supabase.auth.getUser();

  const { error } = await supabase.from('audit_logs').insert({
    actor_user_id: userRes.user?.id || null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    patient_id: input.patientId || null,
    metadata: input.metadata || {},
  });

  if (error) {
    // Audit failures should not block clinical flow.
    console.error('Failed to write audit log:', error.message);
  }
}
