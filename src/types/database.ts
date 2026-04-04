// Database types for Aarogya Setu Patient Module

export interface Hospital {
  id: string;
  hospital_id: string;
  hospital_name: string;
  state: string;
  district: string | null;
  sl_no: number | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  date_of_birth?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height_cm?: number;
  weight_kg?: number;
  user_id?: string;
  preferred_language?: string;
  hospital_id?: string;
  hospital_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalHistory {
  id: string;
  patient_id: string;
  chronic_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
  past_surgeries?: string[];
  family_history?: string;
  smoking_status?: 'Never' | 'Former' | 'Current';
  alcohol_consumption?: 'Never' | 'Occasional' | 'Regular';
  exercise_frequency?: string;
  created_at: string;
  updated_at: string;
}

export interface Token {
  id: string;
  token_number: string;
  patient_id: string;
  hospital_id?: string;
  hospital_name?: string;
  visit_date: string;
  visit_type?: string;
  department?: string;
  priority: 'Normal' | 'High' | 'Emergency';
  status: 'Waiting' | 'Active' | 'Completed' | 'Cancelled' | 'No-Show';
  queue_position?: number;
  called_at?: string;
  completed_at?: string;
  assigned_doctor_user_id?: string;
  consultation_started_at?: string;
  consultation_ended_at?: string;
  consultation_disposition?: 'Completed' | 'Admitted' | 'Follow-up';
  follow_up_date?: string;
  follow_up_notes?: string;
  ai_conversation_summary?: string;
  chief_complaint?: string;
  symptoms?: string[];
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  appointment_id: string;
  patient_id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  doctor_id?: string;
  department?: string;
  status: 'Scheduled' | 'Confirmed' | 'Rescheduled' | 'Completed' | 'Cancelled' | 'No-Show';
  cancellation_reason?: string;
  visit_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  bp?: string; // Blood pressure (e.g., "120/80")
  temp?: string; // Temperature (e.g., "98.6")
  pulse?: string; // Pulse rate (e.g., "72")
  spo2?: string; // Oxygen saturation (e.g., "98")
  respiratory_rate?: string;
  weight?: string;
  height?: string;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  token_id?: string;
  hospital_id?: string;
  hospital_name?: string;
  record_type: 'Consultation' | 'Lab Report' | 'Prescription' | 'Imaging' | 'Diagnosis' | 'Discharge Summary' | 'Other';
  record_date: string;
  diagnosis?: string;
  symptoms?: string[];
  vital_signs?: VitalSigns;
  doctor_notes?: string;
  document_url?: string;
  document_type?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescription_id: string;
  patient_id: string;
  medical_record_id: string;
  hospital_id?: string;
  hospital_name?: string;
  prescribed_date: string;
  valid_until?: string;
  doctor_id?: string;
  medications: Medication[];
  instructions?: string;
  precautions?: string;
  status: 'Active' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  manufacturer?: string;
  category?: string;
  form?: string;
  strength?: string;
  quantity_available: number;
  unit_price: number;
  expiry_date?: string;
  store_location?: string;
  hospital_id?: string;
  hospital_name?: string;
  requires_prescription: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  patient_id: string;
  type: 'Token Update' | 'Appointment Reminder' | 'Prescription Ready' | 'Lab Report Ready' | 'General';
  title: string;
  message: string;
  send_email: boolean;
  send_sms: boolean;
  send_whatsapp: boolean;
  send_push: boolean;
  status: 'Pending' | 'Sent' | 'Failed' | 'Read';
  sent_at?: string;
  read_at?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  session_id: string;
  patient_id?: string;
  messages: AIMessage[];
  language: string;
  extracted_data?: Record<string, any>;
  confidence_score?: number;
  completed: boolean;
  token_id?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  user_id: string;
  role: 'admin' | 'doctor' | 'senior_doctor' | 'registration_desk' | 'medical_store_admin' | 'medical_store_sales';
  display_name: string;
  department?: string;
  specialty?: string;
  hospital_id?: string;
  hospital_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  patient_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface QueueCounter {
  id: string;
  counter_date: string;
  last_token_number: number;
  created_at: string;
}

// Form types for patient registration
export interface PatientRegistrationForm {
  full_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  age?: number;
  gender?: Patient['gender'];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: Patient['blood_group'];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  
  // Medical info
  chronic_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
  symptoms?: string[];
  chief_complaint?: string;
}

// AI conversation context
export interface ConversationContext {
  sessionId: string;
  patientData: Partial<PatientRegistrationForm>;
  currentStep: 'greeting' | 'name' | 'contact' | 'demographics' | 'medical' | 'symptoms' | 'review';
  language: string;
  isComplete: boolean;
}
