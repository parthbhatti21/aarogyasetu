import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabase';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { DoctorSuggestionCard } from '@/components/registration/DoctorSuggestionCard';
import { TokenConfirmationScreen } from '@/components/registration/TokenConfirmationScreen';
import { registerPatient, findPatientByMobile } from '@/services/registrationService';
import { suggestDoctorSpecialty } from '@/services/doctorSuggestionEngine';
import type { PatientRegistrationData } from '@/services/registrationService';
import type { Patient, Token } from '@/types/database';
import { LogOut, UserPlus, History, Users, Activity, Loader2, Search } from 'lucide-react';

interface RegistrationStaff {
  id: string;
  full_name: string;
  email: string;
  hospital_id: string;
}

const EnhancedRegistrationDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [staffInfo, setStaffInfo] = useState<RegistrationStaff | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'register' | 'history' | 'queue'>('register');

  // Registration states
  const [registrationData, setRegistrationData] = useState<PatientRegistrationData | null>(null);
  const [suggestedDoctor, setSuggestedDoctor] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [generatedToken, setGeneratedToken] = useState<Token | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);

  // History states
  const [recentRegistrations, setRecentRegistrations] = useState<any[]>([]);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Patient | null>(null);

  // Queue states
  const [todayQueue, setTodayQueue] = useState<any[]>([]);
  const [queueStats, setQueueStats] = useState({
    tokensGeneratedToday: 0,
    newPatientsToday: 0,
    patientsWaiting: 0,
  });

  // Load staff info on mount
  useEffect(() => {
    const loadStaffInfo = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/');
          return;
        }

        const { data: staff, error } = await supabase
          .from('registration_staff_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        setStaffInfo(staff as RegistrationStaff);
      } catch (error) {
        console.error('Error loading staff info:', error);
        toast({
          title: 'Error',
          description: 'Failed to load staff information',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    loadStaffInfo();
  }, [navigate, toast]);

  // Handle registration submission
  const handleRegistrationSubmit = async (data: PatientRegistrationData) => {
    if (!staffInfo) return;

    try {
      setLoading(true);
      setRegistrationData(data);

      // Get doctor suggestion
      const suggestion = await suggestDoctorSpecialty(data.purposeOfVisit);
      setSuggestedDoctor(suggestion);

      // Register patient
      const result = await registerPatient(
        data,
        staffInfo.hospital_id,
        staffInfo.id,
        suggestion.specialty
      );

      // Check if new patient
      const existingBefore = await findPatientByMobile(data.mobileNumber);
      setIsNewPatient(!existingBefore);

      setRegisteredPatient(result.patient);
      setGeneratedToken(result.token);
      setShowConfirmation(true);

      // Show success toast
      toast({
        title: 'Success!',
        description: `Patient registered - Token: ${result.tokenNumber}`,
      });

      // Refresh stats
      loadQueueStats();
      loadRecentRegistrations();
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register patient',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorOverride = (specialty: string) => {
    setSuggestedDoctor(prev => ({
      ...prev,
      specialty,
    }));
  };

  const handlePrintToken = () => {
    if (generatedToken && registeredPatient) {
      // Implement print logic or use browser print
      window.print();
      toast({
        title: 'Printing',
        description: 'Token slip sent to printer',
      });
    }
  };

  const handleRegisterAnother = () => {
    setShowConfirmation(false);
    setRegistrationData(null);
    setSuggestedDoctor(null);
    setRegisteredPatient(null);
    setGeneratedToken(null);
    setIsNewPatient(false);
  };

  const loadRecentRegistrations = async () => {
    try {
      if (!staffInfo) return;

      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('patients')
        .select('id, patient_id, full_name, phone, created_at')
        .eq('hospital_id', staffInfo.hospital_id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentRegistrations(data || []);
    } catch (error) {
      console.error('Error loading recent registrations:', error);
    }
  };

  const loadQueueStats = async () => {
    try {
      if (!staffInfo) return;

      const today = new Date().toISOString().split('T')[0];

      const { count: tokensToday } = await supabase
        .from('tokens')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', today)
        .eq('hospital_id', staffInfo.hospital_id);

      const { count: waitingCount } = await supabase
        .from('tokens')
        .select('*', { count: 'exact', head: true })
        .eq('visit_date', today)
        .eq('hospital_id', staffInfo.hospital_id)
        .eq('status', 'Waiting');

      setQueueStats({
        tokensGeneratedToday: tokensToday || 0,
        newPatientsToday: recentRegistrations.length || 0,
        patientsWaiting: waitingCount || 0,
      });

      // Load queue
      const { data: queue, error } = await supabase
        .from('tokens')
        .select('*')
        .eq('visit_date', today)
        .eq('hospital_id', staffInfo.hospital_id)
        .order('token_number', { ascending: true })
        .limit(20);

      if (error) throw error;
      setTodayQueue(queue || []);
    } catch (error) {
      console.error('Error loading queue stats:', error);
    }
  };

  const handleSearchPatient = async () => {
    if (!searchMobile || searchMobile.length !== 10) {
      toast({
        title: 'Invalid Mobile',
        description: 'Please enter a valid 10-digit mobile number',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSearchLoading(true);
      const patient = await findPatientByMobile(searchMobile);

      if (patient) {
        setSearchResults(patient);
        toast({
          title: 'Patient Found',
          description: `${patient.full_name} - ID: ${patient.patient_id}`,
        });
      } else {
        setSearchResults(null);
        toast({
          title: 'Not Found',
          description: 'No patient record found with this number',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search patient',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (staffInfo) {
      loadRecentRegistrations();
      loadQueueStats();

      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadQueueStats();
        loadRecentRegistrations();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [staffInfo]);

  if (showConfirmation && registeredPatient && generatedToken) {
    return (
      <TokenConfirmationScreen
        patient={registeredPatient}
        token={generatedToken}
        isNewPatient={isNewPatient}
        suggestedDoctor={suggestedDoctor?.specialty}
        onPrintToken={handlePrintToken}
        onRegisterAnother={handleRegisterAnother}
        onClose={() => navigate('/admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-primary" />
              Registration Desk
            </h1>
            {staffInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                Operator: {staffInfo.full_name} • {staffInfo.email}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New Registration
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Patients
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Today's Queue
            </TabsTrigger>
          </TabsList>

          {/* Registration Tab */}
          <TabsContent value="register" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <div className="lg:col-span-1 space-y-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tokens Today</span>
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {queueStats.tokensGeneratedToday}
                  </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">New Patients</span>
                    <UserPlus className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    {queueStats.newPatientsToday}
                  </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Waiting</span>
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-orange-900">
                    {queueStats.patientsWaiting}
                  </p>
                </Card>
              </div>

              {/* Registration Form */}
              <div className="lg:col-span-2">
                <Card className="p-6 shadow-card">
                  <RegistrationForm
                    onSubmit={handleRegistrationSubmit}
                    isLoading={loading}
                  />
                </Card>
              </div>
            </div>

            {/* Doctor Suggestion (shown during registration) */}
            {registrationData && suggestedDoctor && (
              <Card className="p-6">
                <DoctorSuggestionCard
                  suggestion={suggestedDoctor}
                  onOverride={handleDoctorOverride}
                  disabled={loading}
                />
              </Card>
            )}
          </TabsContent>

          {/* Recent Patients Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-4 border-2 border-blue-200 bg-blue-50">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by mobile number (10 digits)"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="flex-1"
                  maxLength={10}
                />
                <Button
                  onClick={handleSearchPatient}
                  disabled={searchLoading}
                  className="gap-2"
                >
                  {searchLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {searchResults && (
                <Card className="mt-4 p-4 bg-white border-green-200">
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Name:</span> {searchResults.full_name}
                    </p>
                    <p>
                      <span className="font-semibold">ID:</span> {searchResults.patient_id}
                    </p>
                    <p>
                      <span className="font-semibold">Age:</span> {searchResults.age} • {searchResults.gender}
                    </p>
                    <p>
                      <span className="font-semibold">Billing Type:</span>{' '}
                      {searchResults.billing_type || 'General'}
                    </p>
                  </div>
                </Card>
              )}
            </Card>

            {/* Recent Registrations List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-foreground mb-4">Today's Registrations</h3>
              {recentRegistrations.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  No registrations yet today
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentRegistrations.map(patient => (
                    <Card key={patient.id} className="p-4 hover:bg-muted cursor-pointer transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{patient.full_name}</p>
                          <p className="text-sm text-muted-foreground">{patient.patient_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{patient.phone}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {new Date(patient.created_at).toLocaleTimeString()}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Queue Tab */}
          <TabsContent value="queue" className="space-y-4">
            <h3 className="font-semibold text-lg text-foreground">Today's Queue</h3>
            {todayQueue.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No tokens generated yet today
              </Card>
            ) : (
              <div className="grid gap-2">
                {todayQueue.map((token, idx) => (
                  <Card key={token.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-primary min-w-16 text-center">
                          {token.token_number}
                        </div>
                        <div>
                          <p className="font-semibold">{token.patients?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {token.purpose_of_visit}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {token.suggested_doctor_specialty || 'General'}
                          </p>
                          <Badge className="text-xs mt-1">
                            {token.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EnhancedRegistrationDashboard;
