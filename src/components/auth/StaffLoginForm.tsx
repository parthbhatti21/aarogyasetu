import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { signInWithPassword } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  doctor: '/doctor',
  senior_doctor: '/senior-doctor',
  registration_desk: '/registration',
  medical_store_admin: '/store-admin',
  medical_store_sales: '/store-sales',
};

interface StaffLoginFormProps {
  role: UserRole;
  onBack: () => void;
}

const StaffLoginForm = ({ role, onBack }: StaffLoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const DEMO_ADMIN_EMAIL = 'admin@aarogyasetu.local';
  const DEMO_ADMIN_PASSWORD = 'Admin@123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Demo hardcoded admin login
      if (role === 'admin' && email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
        const { user: adminUser, session, error: signInError } = await signInWithPassword(email, password);
        if (signInError || !adminUser) throw new Error(signInError?.message || 'Could not sign in admin');

        // Provision staff profile if missing (so RBAC checks can pass).
        await supabase.from('staff_profiles').upsert(
          {
            user_id: adminUser.id,
            role: 'admin',
            display_name: 'Demo Admin',
            is_active: true,
          },
          { onConflict: 'user_id' }
        );

        login('admin', { name: 'Demo Admin', email: DEMO_ADMIN_EMAIL });

        toast({
          title: 'Signed in as demo admin',
          description: 'Using hardcoded local admin credentials.',
        });
        navigate('/admin');
        return;
      }

      const { user, error } = await signInWithPassword(email, password);
      if (error || !user) {
        throw new Error(error?.message || 'Invalid credentials');
      }

      // Check staff_profiles (for doctor, senior_doctor, admin, etc.)
      let staffProfile = null;
      let profileError = null;

      if (role === 'registration_desk') {
        // For registration desk, check registration_staff_profiles
        const { data: regStaffProfile, error: regProfileError } = await supabase
          .from('registration_staff_profiles')
          .select('full_name, role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (regStaffProfile) {
          staffProfile = {
            ...regStaffProfile,
            display_name: regStaffProfile.full_name,
          };
        }
        profileError = regProfileError;
      } else {
        // For other roles, check staff_profiles
        const { data: stProfile, error: stProfileError } = await supabase
          .from('staff_profiles')
          .select('display_name, role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        staffProfile = stProfile;
        profileError = stProfileError;
      }

      if (profileError) {
        throw profileError;
      }

      if (!staffProfile?.role) {
        throw new Error('No active staff profile found for this account.');
      }

      // For registration desk, check if role starts with 'registration_desk'
      // (allows registration_desk_operator, registration_desk_supervisor, etc.)
      const roleMatches = role === 'registration_desk' 
        ? staffProfile.role.startsWith('registration_desk')
        : staffProfile.role === role;

      if (!roleMatches) {
        throw new Error(`This account is assigned to "${staffProfile.role}". Please select the correct role.`);
      }

      login(role, {
        name: staffProfile.display_name || user.email?.split('@')[0] || 'Staff',
        email: user.email || email,
      });

      navigate(ROLE_ROUTES[role] || '/');
    } catch (err: any) {
      toast({
        title: 'Sign in failed',
        description: err.message || 'Please verify your credentials and role.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      {role === 'admin' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Demo Admin Login: <strong>{DEMO_ADMIN_EMAIL}</strong> / <strong>{DEMO_ADMIN_PASSWORD}</strong>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email or Username</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter your email or username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button type="button" className="text-sm text-primary hover:underline">
        Forgot password?
      </button>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1 gradient-primary text-primary-foreground" disabled={loading}>
          {loading ? (
            <span className="animate-pulse-gentle">Signing in...</span>
          ) : (
            <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
          )}
        </Button>
      </div>
    </form>
  );
};

export default StaffLoginForm;
