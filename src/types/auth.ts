export type UserRole = 
  | 'admin' 
  | 'doctor' 
  | 'senior_doctor'
  | 'registration_desk' 
  | 'medical_store_admin' 
  | 'medical_store_sales' 
  | 'patient';

export interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
  loginType: 'password' | 'otp';
}

export const ROLE_OPTIONS: RoleOption[] = [
  { id: 'admin', label: 'Admin', description: 'Hospital management & analytics', icon: 'Shield', loginType: 'password' },
  { id: 'doctor', label: 'Doctor', description: 'Clinical interface & patient care', icon: 'Stethoscope', loginType: 'password' },
  { id: 'senior_doctor', label: 'Senior Doctor', description: 'Clinical supervision & analytics', icon: 'Stethoscope', loginType: 'password' },
  { id: 'registration_desk', label: 'Registration Desk', description: 'Patient registration & tokens', icon: 'ClipboardList', loginType: 'password' },
  { id: 'medical_store_admin', label: 'Medical Store Admin', description: 'Pharmacy inventory management', icon: 'Pill', loginType: 'password' },
  { id: 'medical_store_sales', label: 'Medical Store Sales', description: 'Medicine sales & billing', icon: 'ShoppingCart', loginType: 'password' },
  { id: 'patient', label: 'Patient', description: 'Book appointments & view records', icon: 'User', loginType: 'otp' },
];
