import { supabase } from '@/utils/supabase';
import type { Patient, Token } from '@/types/database';

export interface PatientRegistrationData {
  firstName: string;
  surname: string;
  mobileNumber: string; // 10 digits
  gender: 'Male' | 'Female' | 'Other';
  age: number;
  purposeOfVisit: string;
  address?: string;
  occupation?: string;
  income?: string;
  billingType?: string;
}

export interface RegistrationResult {
  patient: Patient;
  token: Token;
  isNewPatient: boolean;
  patientId: string;
  tokenNumber: string;
}

/**
 * Check if patient exists by mobile number
 */
export async function findPatientByMobile(mobileNumber: string): Promise<Patient | null> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('phone', mobileNumber)
      .single();

    if (error?.code === 'PGRST116') {
      // Not found - this is expected for new patients
      return null;
    }

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error finding patient:', error);
    throw error;
  }
}

/**
 * Generate next token number for today (per hospital)
 */
export async function getNextTokenNumber(hospitalId: string): Promise<string> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get or create token sequence for today
    const { data: sequence, error: fetchError } = await supabase
      .from('token_sequences')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('visit_date', today)
      .single();

    let nextNumber = 1;

    if (fetchError?.code === 'PGRST116') {
      // First token of the day - create sequence
      const { data: newSequence, error: createError } = await supabase
        .from('token_sequences')
        .insert({
          hospital_id: hospitalId,
          visit_date: today,
          next_sequence_number: 2,
        })
        .select('next_sequence_number')
        .single();

      if (createError) throw createError;
      nextNumber = 1;
    } else if (fetchError) {
      throw fetchError;
    } else if (sequence) {
      nextNumber = sequence.next_sequence_number;

      // Increment for next token
      const { error: updateError } = await supabase
        .from('token_sequences')
        .update({ next_sequence_number: nextNumber + 1 })
        .eq('hospital_id', hospitalId)
        .eq('visit_date', today);

      if (updateError) throw updateError;
    }

    return String(nextNumber).padStart(3, '0');
  } catch (error) {
    console.error('Error generating token number:', error);
    throw error;
  }
}

/**
 * Generate unique patient ID
 */
export function generatePatientId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = String(Math.floor(Math.random() * 9999))
    .padStart(4, '0');
  return `ASPT-${dateStr}-${random}`;
}

/**
 * Create or update patient record
 */
export async function savePatient(
  data: PatientRegistrationData,
  hospitalId: string,
  staffId: string,
  existingPatient?: Patient | null
): Promise<Patient> {
  try {
    const fullName = `${data.firstName} ${data.surname}`.trim();

    const patientData = {
      first_name: data.firstName,
      surname: data.surname,
      full_name: fullName,
      phone: data.mobileNumber,
      gender: data.gender,
      age: data.age,
      address: data.address || null,
      occupation: data.occupation || null,
      income: data.income || null,
      billing_type: data.billingType || 'General',
      hospital_id: hospitalId,
      registered_by: staffId,
      registration_desk_timestamp: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    let patient: Patient;

    if (existingPatient) {
      // Update existing patient
      const { data: updated, error } = await supabase
        .from('patients')
        .update(patientData)
        .eq('id', existingPatient.id)
        .select()
        .single();

      if (error) throw error;
      patient = updated;

      // Log audit
      await logAuditEvent(staffId, patient.id, null, 'patient_updated', {
        fields: ['address', 'occupation', 'income', 'billing_type'],
      });
    } else {
      // Create new patient
      const newPatientId = generatePatientId();

      const { data: created, error } = await supabase
        .from('patients')
        .insert({
          ...patientData,
          patient_id: newPatientId,
        })
        .select()
        .single();

      if (error) throw error;
      patient = created;

      // Log audit
      await logAuditEvent(staffId, patient.id, null, 'patient_registered', {
        patient_id: newPatientId,
      });
    }

    return patient;
  } catch (error) {
    console.error('Error saving patient:', error);
    throw error;
  }
}

/**
 * Create token for patient
 */
export async function createToken(
  patientId: string,
  hospitalId: string,
  staffId: string,
  tokenNumber: string,
  purposeOfVisit: string,
  suggestedSpecialty?: string,
  patientData?: Partial<PatientRegistrationData>
): Promise<Token> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: token, error } = await supabase
      .from('tokens')
      .insert({
        token_number: tokenNumber,
        patient_id: patientId,
        visit_date: today,
        purpose_of_visit: purposeOfVisit,
        suggested_doctor_specialty: suggestedSpecialty || 'General Practice',
        occupation: patientData?.occupation || null,
        income: patientData?.income || null,
        billing_type: patientData?.billingType || null,
        created_by_staff_id: staffId,
        hospital_id: hospitalId,
        status: 'Waiting',
        priority: 'Normal',
      })
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await logAuditEvent(staffId, patientId, token.id, 'token_created', {
      token_number: tokenNumber,
      specialty: suggestedSpecialty,
    });

    return token;
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

/**
 * Register patient (complete flow)
 */
export async function registerPatient(
  registrationData: PatientRegistrationData,
  hospitalId: string,
  staffId: string,
  suggestedSpecialty?: string
): Promise<RegistrationResult> {
  try {
    // Check for existing patient
    const existingPatient = await findPatientByMobile(registrationData.mobileNumber);

    if (existingPatient) {
      // Log duplicate detection
      await logAuditEvent(staffId, existingPatient.id, null, 'duplicate_detected', {
        mobile: registrationData.mobileNumber,
      });
    }

    // Save patient (create or update)
    const patient = await savePatient(
      registrationData,
      hospitalId,
      staffId,
      existingPatient
    );

    // Generate token number
    const tokenNumber = await getNextTokenNumber(hospitalId);

    // Create token
    const token = await createToken(
      patient.id,
      hospitalId,
      staffId,
      tokenNumber,
      registrationData.purposeOfVisit,
      suggestedSpecialty,
      registrationData
    );

    return {
      patient,
      token,
      isNewPatient: !existingPatient,
      patientId: patient.patient_id,
      tokenNumber,
    };
  } catch (error) {
    console.error('Error in registerPatient:', error);
    throw error;
  }
}

/**
 * Log audit event
 */
export async function logAuditEvent(
  staffId: string,
  patientId: string | null,
  tokenId: string | null,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    // Get client IP (will be set by backend/edge function in production)
    const ip = 'local'; // TODO: Get actual IP from request context

    await supabase
      .from('registration_desk_audit_log')
      .insert({
        staff_id: staffId,
        patient_id: patientId,
        token_id: tokenId,
        action,
        details: details || {},
        ip_address: ip,
      });
  } catch (error) {
    // Don't throw - audit logging should not fail the main operation
    console.warn('Failed to log audit event:', error);
  }
}

/**
 * Get current queue for today
 */
export async function getTodayQueue(hospitalId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select(
        `
        *,
        patients (
          patient_id,
          full_name,
          phone,
          age,
          gender,
          occupation,
          billing_type
        )
      `
      )
      .eq('visit_date', today)
      .eq('hospital_id', hospitalId)
      .in('status', ['Waiting', 'Active', 'Completed'])
      .order('queue_position', { ascending: true });

    if (error) throw error;
    return tokens || [];
  } catch (error) {
    console.error('Error fetching queue:', error);
    throw error;
  }
}

/**
 * Get registration stats for dashboard
 */
export async function getRegistrationStats(hospitalId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's tokens
    const { count: tokensToday } = await supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('visit_date', today)
      .eq('hospital_id', hospitalId);

    // New patients today
    const { count: newPatientsToday } = await supabase
      .from('registration_desk_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'patient_registered')
      .eq('hospital_id', hospitalId)
      .gte('created_at', `${today}T00:00:00`);

    // Patients in queue
    const { count: waitingCount } = await supabase
      .from('tokens')
      .select('*', { count: 'exact', head: true })
      .eq('visit_date', today)
      .eq('hospital_id', hospitalId)
      .eq('status', 'Waiting');

    return {
      tokensGeneratedToday: tokensToday || 0,
      newPatientsToday: newPatientsToday || 0,
      patientsWaiting: waitingCount || 0,
    };
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    throw error;
  }
}

/**
 * Fetch all chief complaint keywords for dropdown
 */
export async function getChiefComplaints(): Promise<Array<{ value: string; label: string }>> {
  try {
    const { data: complaints, error } = await supabase
      .from('chief_complaint_to_specialty')
      .select('chief_complaint_keyword')
      .eq('is_active', true)
      .order('chief_complaint_keyword', { ascending: true });

    if (error) throw error;

    // Remove duplicates and map to dropdown format
    const uniqueComplaints = Array.from(
      new Set((complaints || []).map(c => c.chief_complaint_keyword))
    );

    return uniqueComplaints.map(complaint => ({
      value: complaint,
      label: complaint.charAt(0).toUpperCase() + complaint.slice(1),
    }));
  } catch (error) {
    console.error('Error fetching chief complaints:', error);
    // Return common complaints as fallback
    return [
      { value: 'fever', label: 'Fever' },
      { value: 'cold', label: 'Cold' },
      { value: 'cough', label: 'Cough' },
      { value: 'chest pain', label: 'Chest Pain' },
      { value: 'headache', label: 'Headache' },
      { value: 'body pain', label: 'Body Pain' },
      { value: 'weakness', label: 'Weakness' },
      { value: 'dizziness', label: 'Dizziness' },
    ];
  }
}
