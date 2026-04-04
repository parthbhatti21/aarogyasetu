/**
 * Token service with hospital-specific daily sequences
 * Format: HOSPCODE-DDMMYYYY-SEQUENCE
 * Example: H001-04042026-001, H001-04042026-002
 */

import { supabase } from '@/utils/supabase';
import type { Patient, Token } from '@/types/database';

/**
 * Generate hospital-specific token number
 * Each hospital gets its own daily sequence starting from 1
 */
export async function generateHospitalToken(hospitalId: string | null) {
  if (!hospitalId) {
    throw new Error('Hospital ID is required for token generation');
  }

  try {
    const { data: tokenNumber, error } = await supabase.rpc(
      'generate_hospital_token_number',
      { p_hospital_id: hospitalId }
    );

    if (error) throw error;
    if (!tokenNumber) throw new Error('Failed to generate token number');

    return tokenNumber as string;
  } catch (err: any) {
    console.error('Error generating hospital token:', err);
    throw new Error(`Token generation failed: ${err.message}`);
  }
}

/**
 * Get hospital ID for patient (from their registration hospital or selected hospital)
 */
export async function getPatientHospitalId(patientId: string): Promise<string | null> {
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .select('hospital_id')
      .eq('id', patientId)
      .single();

    if (error) throw error;
    return patient?.hospital_id || null;
  } catch (err: any) {
    console.error('Error getting patient hospital:', err);
    return null;
  }
}

/**
 * Get all hospitals for dropdown selection
 */
export async function getHospitals() {
  try {
    const { data: hospitals, error } = await supabase
      .from('hospitals')
      .select('id, hospital_name, hospital_code, state')
      .order('hospital_name');

    if (error) throw error;
    return hospitals || [];
  } catch (err: any) {
    console.error('Error fetching hospitals:', err);
    return [];
  }
}

/**
 * Get current queue position for a hospital and date
 */
export async function getQueuePosition(hospitalId: string, visitDate?: string) {
  try {
    const date = visitDate || new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('tokens')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', hospitalId)
      .eq('visit_date', date)
      .in('status', ['Waiting', 'Active']);

    if (error) throw error;
    return (count || 0) + 1;
  } catch (err: any) {
    console.error('Error getting queue position:', err);
    return 1;
  }
}

/**
 * Create token for patient at their hospital
 */
export async function createTokenForPatient(payload: {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  visitType: string;
  hospitalId?: string;
  priority?: string;
}) {
  const {
    patientId,
    chiefComplaint,
    symptoms,
    visitType,
    hospitalId: providedHospitalId,
    priority = 'Normal',
  } = payload;

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get hospital ID
    let hospitalId = providedHospitalId;
    if (!hospitalId) {
      hospitalId = await getPatientHospitalId(patientId);
    }

    if (!hospitalId) {
      throw new Error('Hospital ID not found. Please select a hospital.');
    }

    // Check for existing token today
    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id, token_number')
      .eq('patient_id', patientId)
      .eq('visit_date', today)
      .in('status', ['Waiting', 'Active'])
      .maybeSingle();

    if (existingToken) {
      throw new Error(
        `You already have a token today: ${existingToken.token_number}. Please wait or cancel it first.`
      );
    }

    // Generate hospital-specific token
    const tokenNumber = await generateHospitalToken(hospitalId);

    // Get queue position for this hospital
    const queuePosition = await getQueuePosition(hospitalId, today);

    // Create token
    const { data: newToken, error: tokenError } = await supabase
      .from('tokens')
      .insert({
        token_number: tokenNumber,
        patient_id: patientId,
        hospital_id: hospitalId,
        visit_date: today,
        visit_type: visitType,
        priority,
        status: 'Waiting',
        queue_position: queuePosition,
        chief_complaint: chiefComplaint,
        symptoms: symptoms || [],
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    return newToken as Token & { token_number: string };
  } catch (err: any) {
    console.error('Error creating token:', err);
    throw err;
  }
}

/**
 * Get today's tokens for a hospital
 */
export async function getTodayTokensForHospital(hospitalId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: tokens, error } = await supabase
      .from('tokens')
      .select('*, patients(full_name, patient_id, phone)')
      .eq('hospital_id', hospitalId)
      .eq('visit_date', today)
      .order('queue_position', { ascending: true });

    if (error) throw error;
    return tokens || [];
  } catch (err: any) {
    console.error('Error fetching hospital tokens:', err);
    return [];
  }
}

/**
 * Get token count by status for a hospital today
 */
export async function getHospitalTokenStats(hospitalId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: stats, error } = await supabase
      .from('tokens')
      .select('status', { count: 'exact' })
      .eq('hospital_id', hospitalId)
      .eq('visit_date', today);

    if (error) throw error;

    const counts = {
      waiting: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      noshow: 0,
    };

    stats?.forEach((token: any) => {
      if (token.status === 'Waiting') counts.waiting++;
      else if (token.status === 'Active') counts.active++;
      else if (token.status === 'Completed') counts.completed++;
      else if (token.status === 'Cancelled') counts.cancelled++;
      else if (token.status === 'No-Show') counts.noshow++;
    });

    return counts;
  } catch (err: any) {
    console.error('Error fetching hospital token stats:', err);
    return { waiting: 0, active: 0, completed: 0, cancelled: 0, noshow: 0 };
  }
}
