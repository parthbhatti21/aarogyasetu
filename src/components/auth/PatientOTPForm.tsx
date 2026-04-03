import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendOTPToEmail, verifyEmailOTP } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

interface PatientOTPFormProps {
  onBack: () => void;
}

const PatientOTPForm = ({ onBack }: PatientOTPFormProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setSupabaseSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await sendOTPToEmail(email);
      
      if (error) {
        throw error;
      }
      
      setStep('otp');
      toast({ 
        title: 'OTP sent to your email', 
        description: `We've sent a 6-digit code to ${email}` 
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({ 
        title: 'Failed to send OTP', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) {
      toast({ title: 'Enter complete OTP', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { user, session, error } = await verifyEmailOTP(email, otp);
      
      if (error || !user || !session) {
        throw error || new Error('Verification failed');
      }

      // Store Supabase session in context
      setSupabaseSession(user, session);

      // Check if patient record exists in database
      const { data: existingPatient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('email', email)
        .single();

      if (patientError && patientError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (new patient)
        throw patientError;
      }

      if (existingPatient) {
        // Existing patient - log them in
        login('patient', { 
          name: existingPatient.full_name, 
          email: existingPatient.email,
          phone: existingPatient.phone,
          patientId: existingPatient.patient_id 
        });
        toast({ 
          title: `Welcome back, ${existingPatient.full_name}!`,
          description: `Patient ID: ${existingPatient.patient_id}`
        });
        navigate('/patient');
      } else {
        // New patient - redirect to AI registration
        toast({ 
          title: 'Email Verified!',
          description: 'Let\'s complete your registration with our AI assistant.',
        });
        navigate('/patient/register');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({ 
        title: 'Verification failed', 
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {step === 'email' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
            <Button onClick={handleSendOTP} className="flex-1 gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Sending...' : <><Mail className="h-4 w-4 mr-2" /> Send OTP</>}
            </Button>
          </div>
        </>
      )}

      {step === 'otp' && (
        <>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to</p>
            <p className="font-medium">{email}</p>
          </div>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <button className="text-sm text-primary hover:underline w-full text-center" onClick={handleSendOTP}>
            Resend OTP
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('email')} className="flex-1">Back</Button>
            <Button onClick={handleVerifyOTP} className="flex-1 gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Verifying...' : <><ArrowRight className="h-4 w-4 mr-2" /> Verify</>}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientOTPForm;
