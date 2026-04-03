import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, UserPlus, Printer, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RegistrationDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [registered, setRegistered] = useState<{ id: string; token: string } | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !age || !gender) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    const patientId = `PAT-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
    const token = `T-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    setRegistered({ id: patientId, token });
    toast({ title: `Patient registered: ${patientId}` });
  };

  const resetForm = () => {
    setName(''); setPhone(''); setAge(''); setGender('');
    setRegistered(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Registration Desk</h1>
          <p className="text-sm text-muted-foreground">Operator: {user?.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>
      <main className="p-6 max-w-2xl mx-auto">
        {!registered ? (
          <form onSubmit={handleRegister} className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Register New Patient</h3>
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input placeholder="Patient full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input type="tel" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select value={gender} onChange={(e) => setGender(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">
              <UserPlus className="h-4 w-4 mr-2" /> Register Patient
            </Button>
          </form>
        ) : (
          <div className="bg-card rounded-xl p-8 shadow-card border border-border text-center space-y-4 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h3 className="text-xl font-bold text-foreground">Patient Registered!</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="text-xl font-bold text-primary">{registered.id}</p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Token Number</p>
                <p className="text-xl font-bold text-foreground">{registered.token}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {}}>
                <Printer className="h-4 w-4 mr-2" /> Print Token
              </Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={resetForm}>
                <UserPlus className="h-4 w-4 mr-2" /> Register Another
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RegistrationDashboard;
