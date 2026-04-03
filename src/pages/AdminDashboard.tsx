import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Activity, Bed, TrendingUp, Clock, UserPlus } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend }: { icon: any; label: string; value: string; trend?: string }) => (
  <div className="bg-card rounded-xl p-5 shadow-card border border-border">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
      {trend && <span className="text-xs font-medium text-success">{trend}</span>}
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total Patients Today" value="284" trend="+12%" />
          <StatCard icon={Activity} label="Active Tokens" value="47" />
          <StatCard icon={Bed} label="Beds Available" value="32 / 120" />
          <StatCard icon={TrendingUp} label="Revenue Today" value="₹2.4L" trend="+8%" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Live Token Queue</h3>
            <div className="space-y-3">
              {['Dr. Sharma - OPD 1', 'Dr. Patel - OPD 2', 'Dr. Singh - OPD 3'].map((doc, i) => (
                <div key={doc} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="text-sm font-medium">{doc}</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Token #{(i + 1) * 5 + 12}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Recent Registrations</h3>
            <div className="space-y-3">
              {[
                { name: 'Rajesh Kumar', id: 'PAT-0284', time: '2 min ago' },
                { name: 'Priya Devi', id: 'PAT-0283', time: '8 min ago' },
                { name: 'Amit Verma', id: 'PAT-0282', time: '15 min ago' },
              ].map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.id}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
