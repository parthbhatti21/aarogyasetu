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
  const [step, setStep] = useState<'email' | 'otp' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
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
        // New patient - show registration form
        setIsNew(true);
        setStep('register');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !gender || !phone) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    if (phone.length < 10) {
      toast({ title: 'Enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      // Generate patient ID using database function
      const { data: patientIdData, error: idError } = await supabase
        .rpc('generate_patient_id');
      
      if (idError) throw idError;
      
      const patientId = patientIdData;

      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Format phone with country code
      const formattedPhone = phone.length === 10 ? `+91${phone}` : phone;

      // Create patient record
      const { data: newPatient, error: insertError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          full_name: name,
          email: email,
          phone: formattedPhone,
          age: parseInt(age),
          gender: gender.charAt(0).toUpperCase() + gender.slice(1),
          user_id: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Log the patient in
      login('patient', { 
        name: newPatient.full_name, 
        email: newPatient.email,
        phone: newPatient.phone,
        patientId: newPatient.patient_id 
      });
      
      toast({ 
        title: `Welcome to Aarogya Setu!`, 
        description: `Your Patient ID: ${patientId}. Please save this for future reference.`,
        duration: 5000,
      });
      
      navigate('/patient');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({ 
        title: 'Registration failed', 
        description: error.message || 'Please try again.',
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

      {step === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="text-center p-3 bg-info/10 rounded-lg">
            <p className="text-sm text-info font-medium">New patient? Let's get you registered!</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-secondary rounded-lg text-sm text-muted-foreground">+91</div>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} min={0} max={150} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setStep('otp')} className="flex-1">Back</Button>
            <Button type="submit" className="flex-1 gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Registering...' : <><CheckCircle className="h-4 w-4 mr-2" /> Register</>}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PatientOTPForm;
