import { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '@/types/auth';

interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  user: { name: string; email?: string; phone?: string; patientId?: string } | null;
}

interface AuthContextType extends AuthState {
  login: (role: UserRole, user: AuthState['user']) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    user: null,
  });

  const login = (role: UserRole, user: AuthState['user']) => {
    setAuth({ isAuthenticated: true, role, user });
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, role: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
