import { supabase } from '@/utils/supabase';

export interface DoctorSuggestion {
  specialty: string;
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Analyze chief complaint and suggest appropriate doctor specialty
 */
export async function suggestDoctorSpecialty(
  chiefComplaint: string,
  customKeywords?: string[]
): Promise<DoctorSuggestion> {
  try {
    // Normalize input
    const normalizedComplaint = chiefComplaint.toLowerCase().trim();

    // Get all active chief complaint mappings
    const { data: mappings, error } = await supabase
      .from('chief_complaint_to_specialty')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) throw error;

    // Score matches
    const matches: Array<{
      specialty: string;
      score: number;
      priority: number;
    }> = [];

    (mappings || []).forEach(mapping => {
      const keyword = mapping.chief_complaint_keyword.toLowerCase();
      
      // Exact match or contains
      if (normalizedComplaint === keyword) {
        matches.push({
          specialty: mapping.suggested_specialty,
          score: 1.0,
          priority: mapping.priority || 0,
        });
      } else if (normalizedComplaint.includes(keyword)) {
        matches.push({
          specialty: mapping.suggested_specialty,
          score: 0.8,
          priority: mapping.priority || 0,
        });
      } else if (keyword.includes(normalizedComplaint.split(' ')[0])) {
        // Partial match on first word
        matches.push({
          specialty: mapping.suggested_specialty,
          score: 0.5,
          priority: mapping.priority || 0,
        });
      }
    });

    // Find best match
    if (matches.length === 0) {
      return {
        specialty: 'General Practice',
        confidence: 0.3,
        reasoning: 'No specific match found - routing to General Practice',
      };
    }

    // Sort by score descending, then by priority
    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    });

    const bestMatch = matches[0];

    return {
      specialty: bestMatch.specialty,
      confidence: bestMatch.score,
      reasoning: `Matched with keyword analysis. Score: ${(bestMatch.score * 100).toFixed(0)}%`,
    };
  } catch (error) {
    console.error('Error in suggestDoctorSpecialty:', error);
    return {
      specialty: 'General Practice',
      confidence: 0.0,
      reasoning: 'Error in analysis - defaulting to General Practice',
    };
  }
}

/**
 * Get available doctors for a specialty
 */
export async function getAvailableDoctorsForSpecialty(
  specialty: string,
  hospitalId: string
): Promise<
  Array<{
    id: string;
    name: string;
    specialty: string;
    currentPatients: number;
  }>
> {
  try {
    // Query doctors table (adjust based on actual schema)
    // This is a placeholder - actual table structure may vary
    const { data: doctors, error } = await supabase
      .from('doctor_profiles')
      .select('id, display_name, specialty')
      .eq('specialty', specialty)
      .eq('hospital_id', hospitalId)
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;

    // Get patient counts for each doctor (optional - for load balancing)
    const docsWithCounts = (doctors || []).map(doc => ({
      id: doc.id,
      name: doc.display_name,
      specialty: doc.specialty,
      currentPatients: 0, // TODO: Calculate from tokens table
    }));

    return docsWithCounts;
  } catch (error) {
    console.error('Error fetching available doctors:', error);
    return [];
  }
}

/**
 * Auto-assign doctor based on specialty and availability
 * (Simplified - can be enhanced with load balancing, preferences, etc.)
 */
export async function autoAssignDoctor(
  specialty: string,
  hospitalId: string
): Promise<string | null> {
  try {
    const availableDoctors = await getAvailableDoctorsForSpecialty(
      specialty,
      hospitalId
    );

    if (availableDoctors.length === 0) {
      return null;
    }

    // Simple round-robin: assign to doctor with fewest current patients
    const assigned = availableDoctors.reduce((prev, current) =>
      current.currentPatients < prev.currentPatients ? current : prev
    );

    return assigned.id;
  } catch (error) {
    console.error('Error auto-assigning doctor:', error);
    return null;
  }
}

/**
 * Update doctor suggestion in token
 */
export async function updateTokenDoctorSuggestion(
  tokenId: string,
  specialty: string,
  doctorId?: string | null,
  manualOverride: boolean = false
): Promise<void> {
  try {
    const updateData: any = {
      suggested_doctor_specialty: specialty,
      manual_doctor_override: manualOverride,
    };

    if (doctorId) {
      updateData.suggested_doctor_id = doctorId;
    }

    const { error } = await supabase
      .from('tokens')
      .update(updateData)
      .eq('id', tokenId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating token doctor suggestion:', error);
    throw error;
  }
}

/**
 * Get doctor suggestion history (for staff reference)
 */
export async function getDoctorSuggestionStats(hospitalId: string, days: number = 7) {
  try {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data: stats, error } = await supabase
      .from('tokens')
      .select('suggested_doctor_specialty, count()')
      .eq('hospital_id', hospitalId)
      .gte('created_at', fromDate.toISOString())
      .group_by('suggested_doctor_specialty');

    if (error) throw error;

    return stats || [];
  } catch (error) {
    console.error('Error fetching doctor suggestion stats:', error);
    return [];
  }
}
