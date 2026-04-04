import { useEffect, useState, useCallback, type ReactNode } from 'react';
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
  user_id: string;
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
        staffInfo.user_id,  // ← Pass user_id, not id (FK references user_id)
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

  const handlePurposeOfVisitChange = async (purpose: string) => {
    if (!purpose.trim()) {
      setSuggestedDoctor(null);
      return;
    }

    try {
      // Get doctor suggestion based on purpose of visit
      const suggestion = await suggestDoctorSpecialty(purpose);
      setSuggestedDoctor(suggestion);
    } catch (error) {
      console.error('Error getting doctor suggestion:', error);
    }
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
      const dayStart = `${today}T00:00:00`;

      const [
        { count: tokensToday },
        { count: waitingCount },
        { count: newPatientsCount },
        { data: queue, error },
      ] = await Promise.all([
        supabase
          .from('tokens')
          .select('*', { count: 'exact', head: true })
          .eq('visit_date', today)
          .eq('hospital_id', staffInfo.hospital_id),
        supabase
          .from('tokens')
          .select('*', { count: 'exact', head: true })
          .eq('visit_date', today)
          .eq('hospital_id', staffInfo.hospital_id)
          .eq('status', 'Waiting'),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('hospital_id', staffInfo.hospital_id)
          .gte('created_at', dayStart),
        supabase
          .from('tokens')
          .select('*, patients (full_name, patient_id, phone)')
          .eq('visit_date', today)
          .eq('hospital_id', staffInfo.hospital_id)
          .limit(40),
      ]);

      if (error) throw error;

      const sorted = [...(queue || [])].sort((a, b) => {
        const qa = a.queue_position;
        const qb = b.queue_position;
        if (qa != null && qb != null && qa !== qb) return qa - qb;
        if (qa != null && qb == null) return -1;
        if (qa == null && qb != null) return 1;
        return String(a.token_number || '').localeCompare(String(b.token_number || ''), undefined, {
          numeric: true,
        });
      });

      setQueueStats({
        tokensGeneratedToday: tokensToday || 0,
        newPatientsToday: newPatientsCount || 0,
        patientsWaiting: waitingCount || 0,
      });
      setTodayQueue(sorted);
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

  const statCard = (
    label: string,
    value: number,
    icon: ReactNode,
    accent: 'emerald' | 'rose' | 'amber'
  ) => {
    const ring =
      accent === 'emerald'
        ? 'border-emerald-200/70 ring-emerald-900/[0.06]'
        : accent === 'rose'
          ? 'border-rose-200/70 ring-rose-900/[0.06]'
          : 'border-amber-200/70 ring-amber-900/[0.06]';
    const iconBg =
      accent === 'emerald'
        ? 'bg-emerald-600'
        : accent === 'rose'
          ? 'bg-rose-500'
          : 'bg-amber-500';
    return (
      <div
        className={`rounded-2xl border bg-white p-5 shadow-sm ring-1 ${ring}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-stone-900">{value}</p>
          </div>
          <div className={`rounded-xl ${iconBg} p-2.5 text-white shadow-sm`}>{icon}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-emerald-50/50">
      <header className="border-b border-emerald-950/20 bg-emerald-950 text-emerald-50 shadow-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <UserPlus className="h-6 w-6 text-rose-200" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                Front desk
              </p>
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Registration</h1>
              {staffInfo && (
                <p className="mt-1 text-sm text-emerald-200/90">
                  {staffInfo.full_name}
                  <span className="text-emerald-400/80"> · </span>
                  <span className="font-normal">{staffInfo.email}</span>
                </p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 border-0 bg-white/10 text-white hover:bg-white/20"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 pb-16">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="mb-8 grid h-auto w-full grid-cols-3 gap-2 rounded-2xl border border-stone-200/80 bg-white/90 p-2 shadow-sm backdrop-blur-sm">
            <TabsTrigger
              value="register"
              className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=inactive]:text-stone-600"
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Register
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=inactive]:text-stone-600"
            >
              <span className="flex items-center justify-center gap-2">
                <History className="h-4 w-4" />
                Patients
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="queue"
              className="rounded-xl py-3 text-sm font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=inactive]:text-stone-600"
            >
              <span className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                Queue
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-8 focus-visible:outline-none">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-1">
                {statCard('Tokens today', queueStats.tokensGeneratedToday, <Activity className="h-5 w-5" />, 'emerald')}
                {statCard('New patients', queueStats.newPatientsToday, <UserPlus className="h-5 w-5" />, 'rose')}
                {statCard('Waiting now', queueStats.patientsWaiting, <Users className="h-5 w-5" />, 'amber')}
              </div>
              <div className="lg:col-span-2">
                <Card className="overflow-hidden rounded-2xl border-stone-200/80 bg-white shadow-md ring-1 ring-stone-900/[0.04]">
                  <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4">
                    <h2 className="text-sm font-semibold text-stone-900">Patient intake</h2>
                    <p className="text-xs text-stone-500">Capture demographics and visit reason</p>
                  </div>
                  <div className="p-6 sm:p-8">
                    <RegistrationForm
                      onSubmit={handleRegistrationSubmit}
                      isLoading={loading}
                      onPurposeOfVisitChange={handlePurposeOfVisitChange}
                    />
                  </div>
                </Card>
              </div>
            </div>

            {registrationData && suggestedDoctor && (
              <Card className="overflow-hidden rounded-2xl border-rose-200/50 bg-white shadow-md ring-1 ring-rose-900/[0.06]">
                <div className="border-b border-rose-100 bg-rose-50/50 px-6 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/80">Routing</p>
                </div>
                <div className="p-6">
                  <DoctorSuggestionCard
                    suggestion={suggestedDoctor}
                    onOverride={handleDoctorOverride}
                    disabled={loading}
                  />
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 focus-visible:outline-none">
            <Card className="overflow-hidden rounded-2xl border-stone-200/80 bg-white shadow-md ring-1 ring-stone-900/[0.04]">
              <div className="border-b border-stone-100 bg-stone-50/80 px-6 py-4">
                <h2 className="text-sm font-semibold text-stone-900">Lookup</h2>
                <p className="text-xs text-stone-500">Search by registered mobile number</p>
              </div>
              <div className="flex flex-col gap-3 p-6 sm:flex-row">
                <Input
                  placeholder="10-digit mobile"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="h-11 flex-1 rounded-xl border-stone-200 bg-stone-50/50"
                  maxLength={10}
                />
                <Button
                  onClick={handleSearchPatient}
                  disabled={searchLoading}
                  className="h-11 rounded-xl bg-emerald-700 px-6 hover:bg-emerald-800"
                >
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search
                </Button>
              </div>
              {searchResults && (
                <div className="border-t border-stone-100 bg-emerald-50/30 px-6 py-5">
                  <div className="rounded-xl border border-emerald-200/60 bg-white p-4 text-sm text-stone-700 shadow-sm">
                    <p>
                      <span className="font-semibold text-stone-900">Name:</span> {searchResults.full_name}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-stone-900">ID:</span> {searchResults.patient_id}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-stone-900">Age:</span> {searchResults.age} · {searchResults.gender}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold text-stone-900">Billing:</span>{' '}
                      {searchResults.billing_type || 'General'}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-500">Today at this desk</h3>
              {recentRegistrations.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-stone-200 bg-stone-50/50 p-12 text-center text-sm text-stone-500">
                  No registrations yet today
                </Card>
              ) : (
                <div className="max-h-[min(60vh,480px)] space-y-3 overflow-y-auto pr-1">
                  {recentRegistrations.map((patient) => (
                    <Card
                      key={patient.id}
                      className="rounded-2xl border-stone-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200/80 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-stone-900">{patient.full_name}</p>
                          <p className="text-sm text-stone-500">{patient.patient_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm text-stone-600">{patient.phone}</p>
                          <Badge variant="outline" className="mt-1 border-stone-200 text-xs font-normal text-stone-600">
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

          <TabsContent value="queue" className="space-y-4 focus-visible:outline-none">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-stone-900">Live queue</h3>
                <p className="text-sm text-stone-500">Today · ordered by position</p>
              </div>
            </div>
            {todayQueue.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-stone-200 bg-stone-50/50 p-12 text-center text-sm text-stone-500">
                No tokens for today yet
              </Card>
            ) : (
              <div className="max-h-[min(65vh,560px)] space-y-3 overflow-y-auto pr-1">
                {todayQueue.map((token, idx) => (
                  <Card
                    key={token.id}
                    className="rounded-2xl border-stone-200/80 bg-white p-5 shadow-sm ring-1 ring-stone-900/[0.03]"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="min-w-[7rem] text-center">
                          <p className="font-mono text-lg font-bold leading-tight text-emerald-800">{token.token_number}</p>
                          <p className="mt-1 text-xs font-medium text-stone-400">
                            Q #{token.queue_position ?? idx + 1}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900">
                            {token.patients?.full_name ?? 'Patient'}
                          </p>
                          <p className="text-sm text-stone-500">{token.purpose_of_visit || '—'}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2 sm:text-right">
                        <p className="text-sm font-medium text-stone-700">
                          {token.suggested_doctor_specialty || 'General'}
                        </p>
                        <Badge className="rounded-lg bg-emerald-700 px-2.5 py-0.5 text-xs font-medium text-white hover:bg-emerald-700">
                          {token.status}
                        </Badge>
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
