import { supabase } from './supabase';

export interface StaffProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'senior_doctor' | 'registration_desk' | 'medical_store_admin' | 'medical_store_sales';
  display_name: string;
  specialty?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Maps chief complaint text to doctor specialty
 */
export function mapComplaintToSpecialty(chiefComplaint: string): string {
  const complaint = chiefComplaint.toLowerCase();
  
  if (complaint.includes('fever') || complaint.includes('cold') || complaint.includes('flu')) {
    return 'fever';
  }
  if (complaint.includes('cough') || complaint.includes('breathing')) {
    return 'cough';
  }
  if (complaint.includes('pain') || complaint.includes('abdomen') || complaint.includes('chest') || complaint.includes('joint')) {
    return 'pain';
  }
  if (complaint.includes('headache') || complaint.includes('migraine')) {
    return 'headache';
  }
  if (complaint.includes('injury') || complaint.includes('wound')) {
    return 'injury';
  }
  if (complaint.includes('follow') || complaint.includes('followup')) {
    return 'followup';
  }
  if (complaint.includes('chronic')) {
    return 'chronic';
  }
  
  return 'general';
}

/**
 * Finds the best available doctor based on specialty and current workload
 */
export async function findBestAvailableDoctor(specialty: string): Promise<string | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get all active doctors
    const { data: doctors, error: doctorsError } = await supabase
      .from('staff_profiles')
      .select('user_id, display_name, specialty, role')
      .in('role', ['doctor', 'senior_doctor'])
      .eq('is_active', true);
    
    if (doctorsError) {
      console.error('Error fetching doctors:', doctorsError);
      return null;
    }
    
    if (!doctors || doctors.length === 0) {
      return null;
    }
    
    // Get current workload for each doctor
    const doctorWorkloads = await Promise.all(
      doctors.map(async (doctor) => {
        const { count } = await supabase
          .from('tokens')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_doctor_user_id', doctor.user_id)
          .eq('visit_date', today)
          .in('status', ['Waiting', 'Active']);
        
        return {
          ...doctor,
          activePatients: count || 0,
        };
      })
    );
    
    // Sort doctors by:
    // 1. Exact specialty match (priority)
    // 2. General specialty (fallback)
    // 3. Senior doctor role (preference)
    // 4. Lower workload (fewer active patients)
    const sortedDoctors = doctorWorkloads.sort((a, b) => {
      // Exact specialty match gets highest priority
      const aSpecialtyMatch = a.specialty === specialty ? 0 : (a.specialty === 'general' ? 1 : 2);
      const bSpecialtyMatch = b.specialty === specialty ? 0 : (b.specialty === 'general' ? 1 : 2);
      
      if (aSpecialtyMatch !== bSpecialtyMatch) {
        return aSpecialtyMatch - bSpecialtyMatch;
      }
      
      // Senior doctors get preference
      const aIsSenior = a.role === 'senior_doctor' ? 0 : 1;
      const bIsSenior = b.role === 'senior_doctor' ? 0 : 1;
      
      if (aIsSenior !== bIsSenior) {
        return aIsSenior - bIsSenior;
      }
      
      // Lower workload gets preference
      return a.activePatients - b.activePatients;
    });
    
    const bestDoctor = sortedDoctors[0];
    console.log(`Assigned doctor: ${bestDoctor.display_name} (${bestDoctor.specialty}, ${bestDoctor.activePatients} active patients)`);
    
    return bestDoctor.user_id;
  } catch (error) {
    console.error('Error in findBestAvailableDoctor:', error);
    return null;
  }
}

/**
 * Auto-assigns a doctor to a token based on chief complaint
 */
export async function autoAssignDoctor(tokenId: string, chiefComplaint: string): Promise<void> {
  try {
    const specialty = mapComplaintToSpecialty(chiefComplaint);
    const doctorUserId = await findBestAvailableDoctor(specialty);
    
    if (doctorUserId) {
      const { error } = await supabase
        .from('tokens')
        .update({ assigned_doctor_user_id: doctorUserId })
        .eq('id', tokenId);
      
      if (error) {
        console.error('Error assigning doctor to token:', error);
      }
    } else {
      console.warn('No available doctor found for specialty:', specialty);
    }
  } catch (error) {
    console.error('Error in autoAssignDoctor:', error);
  }
}
