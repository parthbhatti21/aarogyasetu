import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Ticket, Clock, FileText, Bell } from 'lucide-react';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-6 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Welcome, {user?.name}</h1>
            <p className="text-sm text-primary-foreground/80">Patient ID: {user?.patientId || 'PAT-0001'}</p>
          </div>
          <Button variant="outline" size="sm" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>
      <main className="p-6 max-w-3xl mx-auto -mt-4">
        {/* Token card */}
        <div className="bg-card rounded-xl p-6 shadow-elevated border border-border mb-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Token Number</p>
          <p className="text-5xl font-bold text-primary mb-2">T-018</p>
          <p className="text-sm text-muted-foreground">Currently serving: <span className="font-semibold text-foreground">T-012</span></p>
          <div className="mt-4 flex items-center justify-center gap-2 text-info">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Estimated wait: ~30 minutes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4 hover:shadow-elevated transition-shadow text-left">
            <div className="p-3 rounded-lg bg-primary/10"><Ticket className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-medium text-foreground">Virtual Waiting Room</p>
              <p className="text-sm text-muted-foreground">Track live queue status</p>
            </div>
          </button>
          <button className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4 hover:shadow-elevated transition-shadow text-left">
            <div className="p-3 rounded-lg bg-info/10"><FileText className="h-5 w-5 text-info" /></div>
            <div>
              <p className="font-medium text-foreground">Health Records</p>
              <p className="text-sm text-muted-foreground">View prescriptions & reports</p>
            </div>
          </button>
          <button className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4 hover:shadow-elevated transition-shadow text-left">
            <div className="p-3 rounded-lg bg-success/10"><Bell className="h-5 w-5 text-success" /></div>
            <div>
              <p className="font-medium text-foreground">Notifications</p>
              <p className="text-sm text-muted-foreground">SMS & WhatsApp alerts</p>
            </div>
          </button>
          <button className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center gap-4 hover:shadow-elevated transition-shadow text-left">
            <div className="p-3 rounded-lg bg-warning/10"><Ticket className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="font-medium text-foreground">Medicine Check</p>
              <p className="text-sm text-muted-foreground">Nearby store availability</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
