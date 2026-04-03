import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types/auth';
import { getCurrentSession, signOut as supabaseSignOut, onAuthStateChange } from '@/utils/auth';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: { name: string; email?: string; phone?: string; patientId?: string } | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (role: UserRole, user: AuthState['user']) => void;
  logout: () => Promise<void>;
  setSupabaseSession: (user: User, session: Session) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null,
    supabaseUser: null,
    session: null,
    loading: true,
  });

  // Initialize auth state from Supabase session
  useEffect(() => {
    initializeAuth();
    
    // Listen for auth changes
    const subscription = onAuthStateChange(async (session) => {
      if (session?.user) {
        const resolvedAuth = await resolveUserAuthProfile(session.user);
        setAuth({
          isAuthenticated: true,
          role: resolvedAuth.role,
          user: resolvedAuth.user,
          supabaseUser: session.user,
          session: session,
          loading: false,
        });
      } else {
        // User is logged out
        setAuth({
          isAuthenticated: false,
          role: null,
          user: null,
          supabaseUser: null,
          session: null,
          loading: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const { session } = await getCurrentSession();
      
      if (session?.user) {
        const resolvedAuth = await resolveUserAuthProfile(session.user);
        setAuth({
          isAuthenticated: true,
          role: resolvedAuth.role,
          user: resolvedAuth.user,
          supabaseUser: session.user,
          session: session,
          loading: false,
        });
      } else {
        setAuth(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setAuth(prev => ({ ...prev, loading: false }));
    }
  };

  const login = (role: UserRole, user: AuthState['user']) => {
    const newAuth = {
      ...auth,
      isAuthenticated: true,
      role,
      user,
      loading: false,
    };
    setAuth(newAuth);
    
    // Store auth state in localStorage (excluding Supabase session)
    localStorage.setItem('auth_state', JSON.stringify({
      isAuthenticated: true,
      role,
      user,
    }));
  };

  const resolveUserAuthProfile = async (supabaseUser: User): Promise<{ role: UserRole; user: AuthState['user'] }> => {
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('display_name, role')
      .eq('user_id', supabaseUser.id)
      .eq('is_active', true)
      .maybeSingle();

    if (staffProfile?.role) {
      return {
        role: staffProfile.role as UserRole,
        user: {
          name: staffProfile.display_name || supabaseUser.email?.split('@')[0] || 'Staff',
          email: supabaseUser.email,
        },
      };
    }

    const { data: patient } = await supabase
      .from('patients')
      .select('full_name, patient_id, email, phone')
      .eq('user_id', supabaseUser.id)
      .maybeSingle();

    return {
      role: 'patient',
      user: {
        name: patient?.full_name || supabaseUser.email?.split('@')[0] || 'Patient',
        email: patient?.email || supabaseUser.email,
        phone: patient?.phone,
        patientId: patient?.patient_id,
      },
    };
  };

  const setSupabaseSession = (user: User, session: Session) => {
    setAuth(prev => ({
      ...prev,
      supabaseUser: user,
      session: session,
    }));
  };

  const logout = async () => {
    // Sign out from Supabase
    await supabaseSignOut();
    
    // Clear local auth state
    setAuth({
      isAuthenticated: false,
      role: null,
      user: null,
      supabaseUser: null,
      session: null,
      loading: false,
    });
    
    // Clear localStorage
    localStorage.removeItem('auth_state');
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setSupabaseSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
