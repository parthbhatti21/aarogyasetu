import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabase';

const PatientSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [settings, setSettings] = useState({
    email: '',
    phone: '',
    hospital_id: '',
  });
  const [hospitals, setHospitals] = useState<Array<{ id: string; name: string }>>([]);

  // Load patient data and hospitals
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current patient data
        const { data: patient, error: patientError } = await supabase
          .from('patients')
          .select('phone, user_id, hospital_id')
          .eq('user_id', user?.id)
          .single();

        if (patientError) throw patientError;

        setSettings({
          email: user?.email || '',
          phone: patient?.phone || '',
          hospital_id: patient?.hospital_id || '',
        });

        // Fetch hospitals
        const { data: hospitalData, error: hospitalError } = await supabase
          .from('hospitals')
          .select('id, name')
          .order('name');

        if (hospitalError) throw hospitalError;
        setHospitals(hospitalData || []);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load settings',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id, toast]);

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate phone number
    if (settings.phone && !/^\d{10}$/.test(settings.phone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update patient data in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          phone: settings.phone,
          hospital_id: settings.hospital_id,
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update email in auth if changed
      if (settings.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: settings.email,
        });

        if (emailError) throw emailError;
      }

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
        variant: 'default',
      });

      // Redirect back to dashboard
      setTimeout(() => navigate('/patient'), 1500);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/patient')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full p-6">
        <div className="max-w-2xl">
          <Card className="p-6">
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You will receive a confirmation email if you change this
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="10-digit phone number"
                  maxLength={10}
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be exactly 10 digits
                </p>
              </div>

              {/* Hospital Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hospital <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={settings.hospital_id}
                  onChange={(e) => handleInputChange('hospital_id', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map(hospital => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/patient')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PatientSettings;
