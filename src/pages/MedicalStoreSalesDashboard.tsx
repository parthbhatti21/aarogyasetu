import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, ShoppingCart, Receipt, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const MedicalStoreSalesDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Medical Store - Sales</h1>
          <p className="text-sm text-muted-foreground">Point of Sale</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </Button>
      </header>
      <main className="p-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl shadow-card border border-border">
            <div className="p-5 border-b border-border">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search medicine by name or scan barcode..." className="pl-9" />
              </div>
            </div>
            <div className="p-8 text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Search and add medicines to start a new bill</p>
            </div>
          </div>
          <div className="bg-card rounded-xl shadow-card border border-border">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Current Bill
              </h3>
            </div>
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">No items added yet</p>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex justify-between mb-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">₹0.00</span>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" disabled>
                Generate Bill
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MedicalStoreSalesDashboard;
