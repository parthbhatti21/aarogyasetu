import { supabase } from './supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

// ============================================
// EMAIL OTP AUTHENTICATION
// ============================================

/**
 * Send OTP to email
 */
export async function sendOTPToEmail(email: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { error };
}

/**
 * Send OTP to phone
 */
export async function sendOTPToPhone(phone: string): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
    },
  });

  return { error };
}

/**
 * Verify OTP for email
 */
export async function verifyEmailOTP(
  email: string,
  token: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Verify OTP for phone
 */
export async function verifyPhoneOTP(
  phone: string,
  token: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

/**
 * Sign out
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Refresh session
 */
export async function refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.refreshSession();
  return { session: data.session, error };
}

// ============================================
// PASSWORD AUTHENTICATION (for staff)
// ============================================

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(
  email: string,
  password: string,
  metadata?: { full_name?: string; role?: string }
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
}

// ============================================
// AUTH STATE LISTENERS
// ============================================

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (session: Session | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return subscription;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getCurrentSession();
  return !!session;
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  const { session } = await getCurrentSession();
  return session?.access_token ?? null;
}

/**
 * Format phone number (add +91 for India if not present)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it's a 10-digit number, add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it already has country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  }
  
  // Return as is with +
  return `+${cleaned}`;
}
