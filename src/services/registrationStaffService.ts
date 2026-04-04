import { supabase } from '@/utils/supabase';
import { signUpWithPassword } from '@/utils/auth';

export interface CreateRegistrationStaffInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  hospitalId: string;
  role: 'registration_desk_operator' | 'registration_desk_supervisor';
}

export interface RegistrationStaffProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  hospital_id: string;
  hospital_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  last_login_at?: string;
}

/**
 * Create new registration desk staff account
 */
export async function createRegistrationStaff(input: CreateRegistrationStaffInput): Promise<RegistrationStaffProfile> {
  try {
    // 1. Create auth user
    const { user: createdUser, error: signUpError } = await signUpWithPassword(
      input.email,
      input.password,
      {
        full_name: input.fullName,
        role: 'registration_staff',
      }
    );

    if (signUpError || !createdUser?.id) {
      throw new Error(signUpError?.message || 'Failed to create user account');
    }

    // 2. Get current admin user for tracking
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // 3. Create registration staff profile
    const { data: staffProfile, error: profileError } = await supabase
      .from('registration_staff_profiles')
      .insert({
        user_id: createdUser.id,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone || null,
        hospital_id: input.hospitalId,
        role: input.role,
        is_active: true,
        created_by: currentUser?.id,
      })
      .select()
      .single();

    if (profileError) throw profileError;
    if (!staffProfile) throw new Error('Failed to create staff profile');

    return staffProfile as RegistrationStaffProfile;
  } catch (error) {
    console.error('Error creating registration staff:', error);
    throw error;
  }
}

/**
 * Get all registration staff for a hospital
 */
export async function getRegistrationStaffByHospital(
  hospitalId: string
): Promise<RegistrationStaffProfile[]> {
  try {
    const { data, error } = await supabase
      .from('registration_staff_profiles')
      .select('*')
      .eq('hospital_id', hospitalId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RegistrationStaffProfile[];
  } catch (error) {
    console.error('Error fetching registration staff:', error);
    throw error;
  }
}

/**
 * Get all registration staff (admin view)
 */
export async function getAllRegistrationStaff(): Promise<RegistrationStaffProfile[]> {
  try {
    const { data, error } = await supabase
      .from('registration_staff_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RegistrationStaffProfile[];
  } catch (error) {
    console.error('Error fetching all registration staff:', error);
    throw error;
  }
}

/**
 * Update registration staff profile
 */
export async function updateRegistrationStaff(
  staffId: string,
  updates: Partial<RegistrationStaffProfile>
): Promise<RegistrationStaffProfile> {
  try {
    const { data, error } = await supabase
      .from('registration_staff_profiles')
      .update(updates)
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;
    return data as RegistrationStaffProfile;
  } catch (error) {
    console.error('Error updating registration staff:', error);
    throw error;
  }
}

/**
 * Deactivate registration staff
 */
export async function deactivateRegistrationStaff(staffId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('registration_staff_profiles')
      .update({ is_active: false })
      .eq('id', staffId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deactivating registration staff:', error);
    throw error;
  }
}

/**
 * Reactivate registration staff
 */
export async function reactivateRegistrationStaff(staffId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('registration_staff_profiles')
      .update({ is_active: true })
      .eq('id', staffId);

    if (error) throw error;
  } catch (error) {
    console.error('Error reactivating registration staff:', error);
    throw error;
  }
}

/**
 * Get registration staff statistics
 */
export async function getRegistrationStaffStats(hospitalId?: string) {
  try {
    let query = supabase
      .from('registration_staff_profiles')
      .select('*');

    if (hospitalId) {
      query = query.eq('hospital_id', hospitalId);
    }

    const { data: staff, error } = await query;
    if (error) throw error;

    const activeCount = (staff || []).filter(s => s.is_active).length;
    const inactiveCount = (staff || []).filter(s => !s.is_active).length;

    return {
      totalStaff: staff?.length || 0,
      activeStaff: activeCount,
      inactiveStaff: inactiveCount,
      operators: (staff || []).filter(s => s.role === 'registration_desk_operator').length,
      supervisors: (staff || []).filter(s => s.role === 'registration_desk_supervisor').length,
    };
  } catch (error) {
    console.error('Error fetching registration staff stats:', error);
    throw error;
  }
}

/**
 * Validate staff credentials
 */
export async function validateStaffCredentials(email: string, password: string) {
  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword(
      email,
      password
    );

    if (error) throw error;

    // Check if user is registration staff
    const { data: staff, error: staffError } = await supabase
      .from('registration_staff_profiles')
      .select('*')
      .eq('user_id', user?.id)
      .single();

    if (staffError) throw new Error('Staff profile not found');
    if (!staff.is_active) throw new Error('Staff account is inactive');

    return { valid: true, staff };
  } catch (error) {
    console.error('Error validating staff credentials:', error);
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid credentials' };
  }
}

/**
 * Generate temporary password
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Get registrations by staff member
 */
export async function getRegistrationsByStaff(staffId: string, days: number = 7) {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data, error } = await supabase
      .from('registration_desk_audit_log')
      .select('*')
      .eq('staff_id', staffId)
      .eq('action', 'patient_registered')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching staff registrations:', error);
    throw error;
  }
}
