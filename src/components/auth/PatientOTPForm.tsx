import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendOTPToEmail, verifyEmailOTP } from '@/utils/auth';
import { supabase } from '@/utils/supabase';

interface PatientOTPFormProps {
  onBack: () => void;
}

const PatientOTPForm = ({ onBack }: PatientOTPFormProps) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, setSupabaseSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (authMode === 'signup') {
      if (!fullName.trim()) {
        toast({ title: 'Enter your full name', variant: 'destructive' });
        return;
      }

      const digitsOnlyPhone = phone.replace(/\D/g, '');
      if (digitsOnlyPhone.length < 10) {
        toast({ title: 'Enter a valid mobile number', variant: 'destructive' });
        return;
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Enter a valid email address', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await sendOTPToEmail(email, authMode === 'signup');
      
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

      console.log('✅ OTP Verified:', { email: user.email, hasSession: !!session });

      // Store Supabase session in context
      setSupabaseSession(user, session);

      // Find existing patient profile for this account
      const { data: existingPatient, error: existingPatientError } = await supabase
        .from('patients')
        .select('id, patient_id, full_name, phone, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingPatientError) {
        throw existingPatientError;
      }

      let patientProfile = existingPatient;

      if (!patientProfile && authMode === 'signup') {
        const { data: patientIdData, error: patientIdError } = await supabase.rpc('generate_patient_id');
        if (patientIdError) {
          throw patientIdError;
        }

        const digitsOnlyPhone = phone.replace(/\D/g, '');
        const normalizedPhone = digitsOnlyPhone.length === 10 ? `+91${digitsOnlyPhone}` : phone;

        const { data: createdPatient, error: createPatientError } = await supabase
          .from('patients')
          .insert({
            patient_id: patientIdData,
            full_name: fullName.trim(),
            phone: normalizedPhone,
            email: user.email || email,
            user_id: user.id,
            preferred_language: 'en',
          })
          .select('id, patient_id, full_name, phone, email')
          .single();

        if (createPatientError) {
          throw createPatientError;
        }

        patientProfile = createdPatient;
      }

      if (!patientProfile && authMode === 'login') {
        throw new Error('No patient account found for this email. Please sign up first.');
      }

      login('patient', {
        name: patientProfile.full_name,
        email: patientProfile.email || user.email || email,
        phone: patientProfile.phone,
        patientId: patientProfile.patient_id,
      });

      // Wait a moment for session to persist to localStorage
      await new Promise(resolve => setTimeout(resolve, 300));

      toast({ 
        title: authMode === 'signup' ? 'Account created!' : 'Welcome back!',
        description: authMode === 'signup' ? 'Your account is ready.' : 'Login successful.',
      });
      navigate('/patient');
      
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
        <div className="rounded-lg border p-1 grid grid-cols-2 gap-1">
          <Button
            type="button"
            variant={authMode === 'login' ? 'default' : 'ghost'}
            onClick={() => setAuthMode('login')}
          >
            Login
          </Button>
          <Button
            type="button"
            variant={authMode === 'signup' ? 'default' : 'ghost'}
            onClick={() => setAuthMode('signup')}
          >
            Sign Up
          </Button>
        </div>
      )}

      {step === 'email' && (
        <>
          {authMode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {authMode === 'signup'
                ? 'Name and phone are required for signup. Account will be created after OTP verification.'
                : 'Login uses email verification only.'}
            </p>
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
