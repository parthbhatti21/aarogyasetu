import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Package, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MedicalStoreAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const inventory = [
    { name: 'Paracetamol 500mg', stock: 450, status: 'ok' },
    { name: 'Amoxicillin 250mg', stock: 23, status: 'low' },
    { name: 'Omeprazole 20mg', stock: 180, status: 'ok' },
    { name: 'Metformin 500mg', stock: 8, status: 'critical' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Medical Store Admin</h1>
          <p className="text-sm text-muted-foreground">Inventory Management</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold text-warning">12</p>
            <p className="text-sm text-muted-foreground">Low Stock</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <TrendingUp className="h-5 w-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">₹1.8L</p>
            <p className="text-sm text-muted-foreground">Today's Sales</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Inventory</h3>
            <div className="relative w-64">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search medicines..." className="pl-9" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {inventory.map((item) => (
              <div key={item.name} className="p-4 flex items-center justify-between">
                <span className="font-medium text-foreground">{item.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${item.status === 'critical' ? 'text-destructive' : item.status === 'low' ? 'text-warning' : 'text-success'}`}>
                    {item.stock} units
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'critical' ? 'bg-destructive/10 text-destructive' : item.status === 'low' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                    {item.status === 'critical' ? 'Critical' : item.status === 'low' ? 'Low' : 'In Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalStoreAdminDashboard;
