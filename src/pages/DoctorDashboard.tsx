import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Users, FileText, Stethoscope, Clock } from 'lucide-react';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const patients = [
    { token: 'T-015', name: 'Rajesh Kumar', age: 45, complaint: 'Chest pain', status: 'waiting' },
    { token: 'T-016', name: 'Sunita Devi', age: 32, complaint: 'Fever & cough', status: 'waiting' },
    { token: 'T-017', name: 'Mohan Lal', age: 58, complaint: 'Joint pain', status: 'waiting' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Doctor's Panel</h1>
            <p className="text-sm text-muted-foreground">Dr. {user?.name}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{patients.length}</p>
            <p className="text-sm text-muted-foreground">In Queue</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <FileText className="h-5 w-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Seen Today</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">~15m</p>
            <p className="text-sm text-muted-foreground">Avg. Wait</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-foreground">Patient Queue</h3>
          </div>
          <div className="divide-y divide-border">
            {patients.map((p, i) => (
              <div key={p.token} className={`p-4 flex items-center justify-between ${i === 0 ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-bold px-3 py-1 rounded-lg ${i === 0 ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    {p.token}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.complaint} • Age {p.age}</p>
                  </div>
                </div>
                <Button size="sm" variant={i === 0 ? 'default' : 'outline'} className={i === 0 ? 'gradient-primary text-primary-foreground' : ''}>
                  {i === 0 ? 'Start Consultation' : 'View Details'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
