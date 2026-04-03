import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Users, Activity, Clock, UserPlus, Stethoscope, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signUpWithPassword } from '@/utils/auth';
import { supabase } from '@/utils/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { formatChiefComplaintForQueue } from '@/utils/chiefComplaintDisplay';

interface DoctorProfile {
  id: string;
  user_id: string;
  display_name: string;
  role: 'doctor' | 'senior_doctor';
  specialty?: string;
  is_active: boolean;
  created_at: string;
}

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
  <div className="bg-card rounded-xl p-5 shadow-card border border-border">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-5 w-5 text-primary" /></div>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get user_id from Supabase session for hospital filtering
  const [adminUserId, setAdminUserId] = useState<string | undefined>();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setAdminUserId(currentUser.id);
      }
    };
    getUser();
  }, []);

  const {
    today,
    loading,
    error,
    totalPatients,
    tokensToday,
    waitingOrActive,
    completedToday,
    recentPatients,
    liveQueue,
    doctorStats,
    refresh,
  } = useAdminDashboard(adminUserId);

  const [showCreateDoctor, setShowCreateDoctor] = useState(false);
  const [doctorRole, setDoctorRole] = useState<'doctor' | 'senior_doctor'>('doctor');
  const [doctorName, setDoctorName] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState<string>('general');
  const [creatingDoctor, setCreatingDoctor] = useState(false);
  
  // Doctor list states
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const DOCTOR_SPECIALTIES = [
    { value: 'general', label: 'General Practice' },
    { value: 'fever', label: 'Fever & Infectious Diseases' },
    { value: 'cough', label: 'Respiratory & Pulmonology' },
    { value: 'pain', label: 'Pain Management' },
    { value: 'headache', label: 'Neurology & Headache' },
    { value: 'injury', label: 'Emergency & Trauma' },
    { value: 'followup', label: 'Follow-up & Continuity Care' },
    { value: 'chronic', label: 'Chronic Disease Management' },
  ];

  // Fetch doctors
  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const { data, error } = await supabase
        .from('staff_profiles')
        .select('*')
        .in('role', ['doctor', 'senior_doctor'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setDoctors(data || []);
    } catch (err: any) {
      console.error('Failed to fetch doctors:', err);
      toast({
        title: 'Failed to load doctors',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filter doctors
  const filteredDoctors = doctors.filter(doc => {
    if (specialtyFilter !== 'all' && doc.specialty !== specialtyFilter) return false;
    if (roleFilter !== 'all' && doc.role !== roleFilter) return false;
    return true;
  });

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail || !doctorPassword || !doctorName) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }

    setCreatingDoctor(true);
    try {
      const { user: createdUser, error: signUpError } = await signUpWithPassword(doctorEmail, doctorPassword, {
        full_name: doctorName,
        role: doctorRole,
      });
      if (signUpError || !createdUser) {
        throw new Error(signUpError?.message || 'Could not create account');
      }

      const { error: rpcError } = await supabase.rpc('admin_upsert_staff_profile', {
        target_user_id: createdUser.id,
        target_role: doctorRole,
        target_display_name: doctorName,
      });

      if (rpcError) throw rpcError;

      // Update specialty in staff_profiles
      const { error: specialtyError } = await supabase
        .from('staff_profiles')
        .update({ specialty: doctorSpecialty })
        .eq('user_id', createdUser.id);

      if (specialtyError) {
        console.error('Failed to set specialty:', specialtyError);
      }

      toast({
        title: 'Account created',
        description: `${doctorRole === 'senior_doctor' ? 'Senior doctor' : 'Doctor'} with ${DOCTOR_SPECIALTIES.find(s => s.value === doctorSpecialty)?.label} specialty created.`,
      });
      setDoctorName('');
      setDoctorEmail('');
      setDoctorPassword('');
      setDoctorRole('doctor');
      setDoctorSpecialty('general');
      setShowCreateDoctor(false);
      await refresh();
    } catch (err: any) {
      toast({
        title: 'Failed to create account',
        description: err.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingDoctor(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user?.name} · Live data · {today}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error} (Ensure migrations applied and admin role is set in staff_profiles.)
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total patients (all time)" value={loading ? '…' : totalPatients} />
          <StatCard icon={Activity} label="Tokens today" value={loading ? '…' : tokensToday} />
          <StatCard icon={Clock} label="Waiting / Active now" value={loading ? '…' : waitingOrActive} />
          <StatCard icon={Stethoscope} label="Completed today" value={loading ? '…' : completedToday} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Live token queue</h3>
              <span className="text-xs text-muted-foreground">{liveQueue.length} waiting or active</span>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading queue…</p>
            ) : liveQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tokens in queue for today.</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {liveQueue.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{t.token_number}</p>
                      <p className="text-muted-foreground">
                        {t.patients?.full_name || 'Unknown'} · {t.patients?.patient_id || '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatChiefComplaintForQueue(t.chief_complaint, t.symptoms) || 'No complaint'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium">{t.status}</span>
                      <p className="text-xs text-muted-foreground">Q #{t.queue_position ?? '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent patient registrations</h3>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients yet.</p>
              ) : (
                recentPatients.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.patient_id}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Doctor Management</h3>
              <Button variant="outline" size="sm" onClick={() => setShowCreateDoctor((prev) => !prev)}>
                {showCreateDoctor ? 'Cancel' : 'Create Doctor Account'}
              </Button>
            </div>
            {showCreateDoctor ? (
              <form className="space-y-3" onSubmit={handleCreateDoctor}>
                <div className="space-y-2">
                  <Label htmlFor="doctor-name">Full Name</Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-email">Email</Label>
                  <Input
                    id="doctor-email"
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-password">Password</Label>
                  <Input
                    id="doctor-password"
                    type="password"
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="Set temporary password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-role">Role</Label>
                  <select
                    id="doctor-role"
                    className="w-full border border-input rounded-md bg-background px-3 py-2 text-sm"
                    value={doctorRole}
                    onChange={(e) => setDoctorRole(e.target.value as 'doctor' | 'senior_doctor')}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="senior_doctor">Senior Doctor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doctor-specialty">Specialty</Label>
                  <select
                    id="doctor-specialty"
                    className="w-full border border-input rounded-md bg-background px-3 py-2 text-sm"
                    value={doctorSpecialty}
                    onChange={(e) => setDoctorSpecialty(e.target.value)}
                  >
                    {DOCTOR_SPECIALTIES.map((spec) => (
                      <option key={spec.value} value={spec.value}>
                        {spec.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button disabled={creatingDoctor} type="submit" className="w-full">
                  {creatingDoctor ? 'Creating...' : 'Create Doctor Account'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Click "Create Doctor Account" to add a new doctor</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">Doctor-wise patients handled (completed today)</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : doctorStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed visits or no doctor assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Doctor</th>
                    <th className="py-2 pr-4">Patients handled</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorStats.map((row) => (
                    <tr key={row.doctor_user_id || 'x'} className="border-b border-border/60">
                      <td className="py-2 pr-4 font-medium">{row.display_name}</td>
                      <td className="py-2 pr-4">{row.patients_handled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
