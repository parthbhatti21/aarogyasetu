import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const ROLE_ROUTES: Record<string, string> = {
  admin: '/admin',
  doctor: '/doctor',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      login(role, { name: email.split('@')[0], email });
      navigate(ROLE_ROUTES[role] || '/');
      setLoading(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
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
          {loading ? <span className="animate-pulse-gentle">Signing in...</span> : <><LogIn className="h-4 w-4 mr-2" /> Sign In</>}
        </Button>
      </div>
    </form>
  );
};

export default StaffLoginForm;
