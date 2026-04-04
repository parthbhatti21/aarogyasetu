import { supabase } from '@/utils/supabase';

export interface PatientMedicalInfo {
  patient_id: string;
  full_name: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: string;
  chief_complaint: string;
  symptoms?: string;
  chronic_conditions?: string;
  allergies?: string;
  current_medications?: string;
  source: 'manual' | 'ai'; // Track which method was used
  /** Set from patient-selected hospital (session); required for token queue linkage */
  hospital_id?: string | null;
}

function phoneVariants(digits10: string): string[] {
  const d = digits10.replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return [digits10.trim()];
  return [d, `+91${d}`, `91${d}`];
}

/**
 * Save or update patient medical information
 * This is used by both manual form and AI form filler
 */
export async function savePatientMedicalInfo(
  medicalInfo: PatientMedicalInfo,
  userId: string
): Promise<any> {
  try {
    const digits = medicalInfo.phone.replace(/\D/g, '').slice(-10);
    const phoneStored = digits.length === 10 ? `+91${digits}` : medicalInfo.phone.trim();

    // 1) Logged-in patient's row (OTP signup + hospital step) — avoids phone-format 406 / duplicates
    const { data: byUser, error: byUserErr } = await supabase
      .from('patients')
      .select('id, patient_id, full_name, hospital_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (byUserErr) throw byUserErr;

    let existingPatient = byUser;

    // 2) Same phone, other formats (legacy / desk vs portal)
    if (!existingPatient && digits.length === 10) {
      for (const variant of phoneVariants(digits)) {
        const { data: row, error: pe } = await supabase
          .from('patients')
          .select('id, patient_id, full_name, hospital_id, user_id')
          .eq('phone', variant)
          .maybeSingle();
        if (pe && pe.code !== 'PGRST116') throw pe;
        if (row?.user_id === userId) {
          existingPatient = row;
          break;
        }
      }
    }

    let patientId: string;
    let patientDbId: string;

    if (existingPatient) {
      patientId = existingPatient.patient_id;
      patientDbId = existingPatient.id;

      const { error: updateError } = await supabase
        .from('patients')
        .update({
          user_id: userId,
          full_name: medicalInfo.full_name,
          phone: phoneStored,
          email: medicalInfo.email || null,
          age: parseInt(medicalInfo.age) || null,
          gender: medicalInfo.gender || null,
          address: medicalInfo.address || null,
          blood_group: medicalInfo.blood_group || null,
          hospital_id: medicalInfo.hospital_id ?? existingPatient.hospital_id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', patientDbId);

      if (updateError) throw updateError;
    } else {
      const newPatientId = generatePatientId();

      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          user_id: userId,
          patient_id: newPatientId,
          full_name: medicalInfo.full_name,
          phone: phoneStored,
          email: medicalInfo.email || null,
          age: parseInt(medicalInfo.age) || null,
          gender: medicalInfo.gender || null,
          address: medicalInfo.address || null,
          blood_group: medicalInfo.blood_group || null,
          hospital_id: medicalInfo.hospital_id || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) throw createError;
      patientId = newPatientId;
      patientDbId = newPatient.id;
    }

    // Save medical information in patient_medical_records table
    const medicalRecord = {
      patient_id: patientDbId,
      chief_complaint: medicalInfo.chief_complaint,
      symptoms: medicalInfo.symptoms || null,
      chronic_conditions: medicalInfo.chronic_conditions || null,
      allergies: medicalInfo.allergies || null,
      current_medications: medicalInfo.current_medications || null,
      blood_group: medicalInfo.blood_group || null,
      source: medicalInfo.source, // Track if manual or AI
      recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to insert medical record
    const { data: savedRecord, error: medicalError } = await supabase
      .from('patient_medical_records')
      .insert([medicalRecord])
      .select()
      .single();

    if (medicalError) {
      // If table doesn't exist, log warning but continue
      console.warn('Note: patient_medical_records table may not exist yet:', medicalError.message);
    }

    console.log('✅ Patient medical information saved:', { patientId, source: medicalInfo.source });

    return {
      success: true,
      patientId,
      patientDbId,
      medicalRecord: savedRecord || medicalRecord,
    };
  } catch (error) {
    console.error('❌ Error saving patient medical info:', error);
    throw error;
  }
}

/**
 * Get patient medical information history
 */
export async function getPatientMedicalHistory(patientDbId: string) {
  try {
    const { data: records, error } = await supabase
      .from('patient_medical_records')
      .select('*')
      .eq('patient_id', patientDbId)
      .order('recorded_at', { ascending: false })
      .limit(10);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return records || [];
  } catch (error) {
    console.error('Error fetching patient medical history:', error);
    return [];
  }
}

/**
 * Get latest patient medical information
 */
export async function getLatestPatientMedicalInfo(patientDbId: string) {
  try {
    const { data: record, error } = await supabase
      .from('patient_medical_records')
      .select('*')
      .eq('patient_id', patientDbId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return record || null;
  } catch (error) {
    console.error('Error fetching latest patient medical info:', error);
    return null;
  }
}

/**
 * Generate unique patient ID
 */
function generatePatientId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 9999))
    .padStart(4, '0');
  return `ASPT-${dateStr}-${random}`;
}
