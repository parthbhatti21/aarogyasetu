import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole } from '@/types/auth';
import { getCurrentSession, getCurrentUser, signOut as supabaseSignOut, onAuthStateChange } from '@/utils/auth';
import type { User, Session } from '@supabase/supabase-js';

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
    const subscription = onAuthStateChange((session) => {
      if (session?.user) {
        // User is logged in via Supabase
        setAuth(prev => ({
          ...prev,
          supabaseUser: session.user,
          session: session,
          loading: false,
        }));
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
        // Try to restore user data from localStorage
        const storedAuth = localStorage.getItem('auth_state');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          setAuth({
            ...parsed,
            supabaseUser: session.user,
            session: session,
            loading: false,
          });
        } else {
          // Just set Supabase session
          setAuth(prev => ({
            ...prev,
            supabaseUser: session.user,
            session: session,
            loading: false,
          }));
        }
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
