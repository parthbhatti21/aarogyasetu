import { supabase } from '@/utils/supabase';
import type { Patient, Token, Hospital } from '@/types/database';

export interface TokenWithPatient extends Token {
  patients?: Pick<Patient, 'id' | 'full_name' | 'patient_id' | 'phone'> | null;
}

export interface DoctorPatientStats {
  doctor_user_id: string | null;
  display_name: string;
  patients_handled: number;
}

export async function fetchTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

// Get list of all states with hospitals
export async function fetchStates(): Promise<string[]> {
  const { data, error } = await supabase
    .from('hospitals')
    .select('state', { count: 'exact' })
    .order('state');

  if (error) throw error;

  // Get unique states
  const states = Array.from(new Set((data || []).map(h => h.state).filter(Boolean))) as string[];
  return states;
}

// Get hospitals filtered by state
export async function fetchHospitalsByState(state?: string): Promise<Hospital[]> {
  let query = supabase.from('hospitals').select('*').order('hospital_name');

  if (state) {
    query = query.eq('state', state);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

function sortLiveQueueTokens(rows: TokenWithPatient[]): TokenWithPatient[] {
  return [...rows].sort((a, b) => {
    const qa = a.queue_position;
    const qb = b.queue_position;
    if (qa != null && qb != null && qa !== qb) return qa - qb;
    if (qa != null && qb == null) return -1;
    if (qa == null && qb != null) return 1;
    return String(a.token_number || '').localeCompare(String(b.token_number || ''), undefined, { numeric: true });
  });
}

export async function fetchAdminOverview(today: string, hospitalId?: string | null) {
  const dayStart = `${today}T00:00:00`;

  const buildTokenQuery = (query: any) => {
    if (hospitalId) {
      return query.eq('hospital_id', hospitalId);
    }
    return query;
  };

  let patientsCountQuery = supabase.from('patients').select('id', { count: 'exact', head: true });
  if (hospitalId) {
    patientsCountQuery = patientsCountQuery.eq('hospital_id', hospitalId);
  }

  let newPatientsQuery = supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayStart);
  if (hospitalId) {
    newPatientsQuery = newPatientsQuery.eq('hospital_id', hospitalId);
  }

  let recentPatientsQuery = supabase
    .from('patients')
    .select('id, patient_id, full_name, phone, created_at')
    .gte('created_at', dayStart)
    .order('created_at', { ascending: false })
    .limit(15);
  if (hospitalId) {
    recentPatientsQuery = recentPatientsQuery.eq('hospital_id', hospitalId);
  }

  const [
    patientsRes,
    newPatientsRes,
    tokensTodayRes,
    waitingRes,
    completedTodayRes,
    recentPatientsRes,
    queueRes,
  ] = await Promise.all([
    patientsCountQuery,
    newPatientsQuery,
    buildTokenQuery(supabase.from('tokens').select('id', { count: 'exact', head: true }).eq('visit_date', today)),
    buildTokenQuery(supabase.from('tokens').select('id', { count: 'exact', head: true }).eq('visit_date', today).in('status', ['Waiting', 'Active'])),
    buildTokenQuery(supabase.from('tokens').select('id', { count: 'exact', head: true }).eq('visit_date', today).eq('status', 'Completed')),
    recentPatientsQuery,
    buildTokenQuery(
      supabase
        .from('tokens')
        .select('*, patients (id, full_name, patient_id, phone)')
        .eq('visit_date', today)
        .in('status', ['Waiting', 'Active'])
    ),
  ]);

  if (patientsRes.error) throw patientsRes.error;
  if (newPatientsRes.error) throw newPatientsRes.error;
  if (tokensTodayRes.error) throw tokensTodayRes.error;
  if (waitingRes.error) throw waitingRes.error;
  if (completedTodayRes.error) throw completedTodayRes.error;
  if (recentPatientsRes.error) throw recentPatientsRes.error;
  if (queueRes.error) throw queueRes.error;

  const liveQueue = sortLiveQueueTokens((queueRes.data || []) as TokenWithPatient[]);

  return {
    totalPatients: patientsRes.count ?? 0,
    newPatientsToday: newPatientsRes.count ?? 0,
    tokensToday: tokensTodayRes.count ?? 0,
    waitingOrActive: waitingRes.count ?? 0,
    completedToday: completedTodayRes.count ?? 0,
    recentPatients: recentPatientsRes.data || [],
    liveQueue,
  };
}

export async function fetchDoctorPatientStats(today: string, hospitalId?: string | null): Promise<DoctorPatientStats[]> {
  let query = supabase
    .from('tokens')
    .select('assigned_doctor_user_id')
    .eq('visit_date', today)
    .eq('status', 'Completed')
    .not('assigned_doctor_user_id', 'is', null);

  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId);
  }

  const { data: completed, error: tokensErr } = await query;

  if (tokensErr) throw tokensErr;

  const counts = new Map<string, number>();
  for (const row of completed || []) {
    const id = row.assigned_doctor_user_id as string;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  const { data: staff, error: staffErr } = await supabase
    .from('staff_profiles')
    .select('user_id, display_name, role')
    .in('role', ['doctor', 'senior_doctor'])
    .eq('is_active', true);

  if (staffErr) throw staffErr;

  const nameByUser = new Map<string, string>();
  for (const s of staff || []) {
    nameByUser.set(s.user_id, s.display_name);
  }

  const byDoctor: DoctorPatientStats[] = Array.from(counts.entries()).map(([doctor_user_id, n]) => ({
    doctor_user_id,
    display_name: nameByUser.get(doctor_user_id) || doctor_user_id.slice(0, 8) + '…',
    patients_handled: n,
  }));

  // Include doctors with zero today
  for (const s of staff || []) {
    if (!counts.has(s.user_id)) {
      byDoctor.push({
        doctor_user_id: s.user_id,
        display_name: s.display_name,
        patients_handled: 0,
      });
    }
  }

  return byDoctor.sort((a, b) => b.patients_handled - a.patients_handled);
}
