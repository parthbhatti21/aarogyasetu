import { supabase } from '@/utils/supabase';
import type { Medication, MedicalHistory, MedicalRecord, Patient, Prescription, Token } from '@/types/database';

export type ConsultationDisposition = 'Completed' | 'Admitted' | 'Follow-up';

export interface DoctorQueueToken extends Token {
  patients?: Pick<Patient, 'id' | 'full_name' | 'age' | 'gender' | 'phone' | 'email'>;
}

export interface PatientClinicalData {
  profile: Patient | null;
  medicalHistory: MedicalHistory | null;
  records: MedicalRecord[];
  prescriptions: Prescription[];
}

export async function getDoctorQueue(doctorUserId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tokens')
    .select('*, patients (id, full_name, age, gender, phone, email)')
    .eq('visit_date', today)
    .in('status', ['Waiting', 'Active'])
    .or(`assigned_doctor_user_id.eq.${doctorUserId},assigned_doctor_user_id.is.null`)
    .order('status', { ascending: true })
    .order('queue_position', { ascending: true });

  if (error) throw error;
  return (data || []) as DoctorQueueToken[];
}

export async function startConsultation(tokenId: string, doctorUserId: string) {
  const { error } = await supabase
    .from('tokens')
    .update({
      assigned_doctor_user_id: doctorUserId,
      status: 'Active',
      called_at: new Date().toISOString(),
      consultation_started_at: new Date().toISOString(),
    })
    .eq('id', tokenId);

  if (error) throw error;
}

export async function saveConsultation(input: {
  tokenId: string;
  patientId: string;
  doctorUserId: string;
  diagnosis: string;
  doctorNotes: string;
  symptoms: string[];
  medications: Medication[];
  prescriptionInstructions?: string;
  precautions?: string;
  disposition: ConsultationDisposition;
  followUpDate?: string;
  followUpNotes?: string;
}) {
  const {
    tokenId,
    patientId,
    doctorUserId,
    diagnosis,
    doctorNotes,
    symptoms,
    medications,
    prescriptionInstructions,
    precautions,
    disposition,
    followUpDate,
    followUpNotes,
  } = input;

  const { data: record, error: recordError } = await supabase
    .from('medical_records')
    .insert({
      patient_id: patientId,
      token_id: tokenId,
      record_type: 'Consultation',
      diagnosis,
      symptoms,
      doctor_notes: doctorNotes,
      created_by: doctorUserId,
    })
    .select('id')
    .single();

  if (recordError) throw recordError;

  if (medications.length > 0) {
    const { data: rxId, error: rxIdError } = await supabase.rpc('generate_prescription_id');
    if (rxIdError) throw rxIdError;

    const { error: prescriptionError } = await supabase.from('prescriptions').insert({
      prescription_id: rxId,
      patient_id: patientId,
      medical_record_id: record.id,
      doctor_id: doctorUserId,
      medications,
      instructions: prescriptionInstructions || null,
      precautions: precautions || null,
      status: 'Active',
    });

    if (prescriptionError) throw prescriptionError;
  }

  const tokenStatus = disposition === 'Completed' ? 'Completed' : 'Completed';
  const { error: tokenError } = await supabase
    .from('tokens')
    .update({
      status: tokenStatus,
      completed_at: new Date().toISOString(),
      consultation_ended_at: new Date().toISOString(),
      consultation_disposition: disposition,
      follow_up_date: disposition === 'Follow-up' ? followUpDate || null : null,
      follow_up_notes: disposition === 'Follow-up' ? followUpNotes || null : null,
    })
    .eq('id', tokenId);

  if (tokenError) throw tokenError;
}

export async function getPatientClinicalData(patientId: string): Promise<PatientClinicalData> {
  const [profileRes, historyRes, recordsRes, prescriptionsRes] = await Promise.all([
    supabase.from('patients').select('*').eq('id', patientId).maybeSingle(),
    supabase.from('medical_history').select('*').eq('patient_id', patientId).order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('medical_records').select('*').eq('patient_id', patientId).order('record_date', { ascending: false }).limit(20),
    supabase.from('prescriptions').select('*').eq('patient_id', patientId).order('prescribed_date', { ascending: false }).limit(20),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (historyRes.error) throw historyRes.error;
  if (recordsRes.error) throw recordsRes.error;
  if (prescriptionsRes.error) throw prescriptionsRes.error;

  return {
    profile: profileRes.data as Patient | null,
    medicalHistory: historyRes.data as MedicalHistory | null,
    records: (recordsRes.data || []) as MedicalRecord[],
    prescriptions: (prescriptionsRes.data || []) as Prescription[],
  };
}

export async function getSeniorDoctorAnalytics() {
  const today = new Date().toISOString().split('T')[0];

  const [completedRes, activeRes] = await Promise.all([
    supabase.from('tokens').select('id, consultation_started_at, consultation_ended_at, assigned_doctor_user_id').eq('visit_date', today).eq('status', 'Completed'),
    supabase.from('tokens').select('id').eq('visit_date', today).in('status', ['Waiting', 'Active']),
  ]);

  if (completedRes.error) throw completedRes.error;
  if (activeRes.error) throw activeRes.error;

  const completed = completedRes.data || [];
  const totalConsultationMinutes = completed.reduce((total, row: any) => {
    if (!row.consultation_started_at || !row.consultation_ended_at) return total;
    const started = new Date(row.consultation_started_at).getTime();
    const ended = new Date(row.consultation_ended_at).getTime();
    return total + Math.max(0, ended - started) / 60000;
  }, 0);

  return {
    patientsHandled: completed.length,
    queueOpen: (activeRes.data || []).length,
    avgConsultationMinutes: completed.length > 0 ? Math.round(totalConsultationMinutes / completed.length) : 0,
  };
}
