import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PatientOTPFormProps {
  onBack: () => void;
}

const PatientOTPForm = ({ onBack }: PatientOTPFormProps) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSendOTP = () => {
    if (phone.length < 10) {
      toast({ title: 'Enter a valid phone number', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
      toast({ title: 'OTP sent to your phone' });
    }, 600);
  };

  const handleVerifyOTP = () => {
    if (otp.length < 6) {
      toast({ title: 'Enter complete OTP', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate: check if patient exists
      const existing = false; // Will be real check with backend
      if (existing) {
        login('patient', { name: 'Patient', phone });
        navigate('/patient');
      } else {
        setIsNew(true);
        setStep('register');
      }
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !gender) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const patientId = `PAT-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    setTimeout(() => {
      login('patient', { name, phone, patientId });
      toast({ title: `Welcome! Your Patient ID: ${patientId}`, description: 'Please save this for future reference.' });
      navigate('/patient');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {step === 'phone' && (
        <>
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
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onBack} className="flex-1">Back</Button>
            <Button onClick={handleSendOTP} className="flex-1 gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? 'Sending...' : <><Phone className="h-4 w-4 mr-2" /> Send OTP</>}
            </Button>
          </div>
        </>
      )}

      {step === 'otp' && (
        <>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Enter the 6-digit OTP sent to</p>
            <p className="font-medium">+91 {phone}</p>
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
            <Button variant="outline" onClick={() => setStep('phone')} className="flex-1">Back</Button>
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
