import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Users, FileText, Stethoscope, Clock } from 'lucide-react';
import { useDoctorQueue } from '@/hooks/useDoctorQueue';
import {
  getPatientClinicalData,
  getSeniorDoctorAnalytics,
  saveConsultation,
  startConsultation,
  type ConsultationDisposition,
} from '@/services/doctorService';
import { logMedicalAudit } from '@/services/auditService';
import type { Medication, PatientClinicalData } from '@/services/doctorService';
import { useToast } from '@/hooks/use-toast';
import { formatChiefComplaintForQueue } from '@/utils/chiefComplaintDisplay';

const DoctorDashboard = () => {
  const { user, role, supabaseUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { queue, loading, refresh } = useDoctorQueue(supabaseUser?.id);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<PatientClinicalData | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [disposition, setDisposition] = useState<ConsultationDisposition>('Completed');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [precautions, setPrecautions] = useState('');
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<{ patientsHandled: number; queueOpen: number; avgConsultationMinutes: number } | null>(null);

  const selectedToken = useMemo(
    () => queue.find((item) => item.id === selectedTokenId) || queue[0] || null,
    [queue, selectedTokenId]
  );

  const unassignedCount = useMemo(
    () => queue.filter((t) => !t.assigned_doctor_user_id && t.status === 'Waiting').length,
    [queue]
  );

  useEffect(() => {
    if (!selectedToken?.patient_id) return;
    getPatientClinicalData(selectedToken.patient_id)
      .then(setPatientData)
      .catch((err) => {
        toast({
          title: 'Could not load patient details',
          description: err.message || 'Please try again.',
          variant: 'destructive',
        });
      });
  }, [selectedToken?.patient_id]);

  useEffect(() => {
    if (role !== 'senior_doctor') return;
    getSeniorDoctorAnalytics().then(setAnalytics).catch(() => setAnalytics(null));
  }, [role, queue.length]);

  const handleStartConsultation = async () => {
    if (!selectedToken || !supabaseUser?.id) return;
    try {
      await startConsultation(selectedToken.id, supabaseUser.id);
      await logMedicalAudit({
        action: 'consultation_started',
        entityType: 'token',
        entityId: selectedToken.id,
        patientId: selectedToken.patient_id,
      });
      toast({ title: 'Consultation started', description: `Token ${selectedToken.token_number} is now active.` });
      await refresh();
    } catch (err: any) {
      toast({ title: 'Could not start consultation', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveConsultation = async () => {
    if (!selectedToken || !supabaseUser?.id || !selectedToken.patient_id) return;
    if (!diagnosis.trim() || !doctorNotes.trim()) {
      toast({ title: 'Diagnosis and notes are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await saveConsultation({
        tokenId: selectedToken.id,
        patientId: selectedToken.patient_id,
        doctorUserId: supabaseUser.id,
        diagnosis: diagnosis.trim(),
        doctorNotes: doctorNotes.trim(),
        symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
        medications,
        prescriptionInstructions: rxInstructions,
        precautions,
        disposition,
        followUpDate,
        followUpNotes,
      });

      await logMedicalAudit({
        action: 'consultation_saved',
        entityType: 'token',
        entityId: selectedToken.id,
        patientId: selectedToken.patient_id,
        metadata: { disposition, medicationsCount: medications.length },
      });

      toast({ title: 'Consultation saved', description: 'Diagnosis, prescription, and status were updated.' });
      setDiagnosis('');
      setDoctorNotes('');
      setSymptoms('');
      setMedications([]);
      setFollowUpDate('');
      setFollowUpNotes('');
      setRxInstructions('');
      setPrecautions('');
      await refresh();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message || 'Please retry.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addMedication = () => {
    setMedications((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updateMedication = (index: number, key: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [key]: value } : med))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
         
          <div>
            <h1 className="text-xl font-bold text-foreground">{role === 'senior_doctor' ? 'Senior Doctor Panel' : "Doctor's Panel"}</h1>
            <p className="text-sm text-muted-foreground">Dr. {user?.name}</p>
          </div>
        </div>
        
      </header>
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{queue.length}</p>
            <p className="text-sm text-muted-foreground">Available tokens (today)</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Stethoscope className="h-5 w-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{unassignedCount}</p>
            <p className="text-sm text-muted-foreground">Unassigned (waiting)</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <FileText className="h-5 w-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.patientsHandled ?? '-'}</p>
            <p className="text-sm text-muted-foreground">Handled Today</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card border border-border text-center">
            <Clock className="h-5 w-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{analytics?.avgConsultationMinutes ?? '-'}m</p>
            <p className="text-sm text-muted-foreground">Avg Consultation</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-card border border-border">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Token queue</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Unassigned + your assigned · Start consultation to claim a patient
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
            </div>
            <div className="divide-y divide-border max-h-[540px] overflow-auto">
              {loading && <p className="p-4 text-sm text-muted-foreground">Loading queue...</p>}
              {!loading && queue.length === 0 && <p className="p-4 text-sm text-muted-foreground">No active queue items.</p>}
              {queue.map((token) => (
                <button
                  key={token.id}
                  className={`w-full text-left p-4 ${selectedToken?.id === token.id ? 'bg-primary/10' : ''}`}
                  onClick={() => setSelectedTokenId(token.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{token.token_number}</p>
                    <p className="text-xs text-muted-foreground">{token.status}</p>
                  </div>
                  <p className="text-sm">{token.patients?.full_name || 'Unknown patient'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatChiefComplaintForQueue(token.chief_complaint, token.symptoms) || 'No complaint captured'} • Q #{token.queue_position || '-'}
                    {token.assigned_doctor_user_id ? ' • Assigned' : ' • Open'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-card border border-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Consultation Workspace</h3>
              {selectedToken?.status === 'Waiting' && (
                <Button size="sm" onClick={handleStartConsultation}>Start Consultation</Button>
              )}
            </div>

            {selectedToken ? (
              <>
                <div className="rounded-lg border p-3">
                  <p className="font-medium">{patientData?.profile?.full_name || selectedToken.patients?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patientData?.profile?.gender || selectedToken.patients?.gender || 'Unknown'} • Age {patientData?.profile?.age || selectedToken.patients?.age || '-'} • {patientData?.profile?.phone || selectedToken.patients?.phone || '-'}
                  </p>
                  <p className="text-sm mt-2">
                    Chief complaint:{' '}
                    {formatChiefComplaintForQueue(selectedToken.chief_complaint, selectedToken.symptoms) || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Medical history summary</p>
                  <p className="text-sm text-muted-foreground">
                    Conditions: {(patientData?.medicalHistory?.chronic_conditions || []).join(', ') || 'None'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Allergies: {(patientData?.medicalHistory?.allergies || []).join(', ') || 'None'}
                  </p>
                </div>

                <input className="w-full border rounded-md p-2 text-sm" placeholder="Diagnosis" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                <textarea className="w-full border rounded-md p-2 text-sm min-h-24" placeholder="Clinical notes" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} />
                <input className="w-full border rounded-md p-2 text-sm" placeholder="Symptoms (comma separated)" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Prescription</p>
                    <Button size="sm" variant="outline" onClick={addMedication}>Add Medicine</Button>
                  </div>
                  {medications.map((med, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-2">
                      <input className="border rounded-md p-2 text-sm" placeholder="Medicine name" value={med.name} onChange={(e) => updateMedication(idx, 'name', e.target.value)} />
                      <input className="border rounded-md p-2 text-sm" placeholder="Dosage" value={med.dosage} onChange={(e) => updateMedication(idx, 'dosage', e.target.value)} />
                      <input className="border rounded-md p-2 text-sm" placeholder="Frequency" value={med.frequency} onChange={(e) => updateMedication(idx, 'frequency', e.target.value)} />
                      <input className="border rounded-md p-2 text-sm" placeholder="Duration" value={med.duration} onChange={(e) => updateMedication(idx, 'duration', e.target.value)} />
                    </div>
                  ))}
                  <input className="w-full border rounded-md p-2 text-sm" placeholder="Instructions" value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} />
                  <input className="w-full border rounded-md p-2 text-sm" placeholder="Precautions" value={precautions} onChange={(e) => setPrecautions(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select className="border rounded-md p-2 text-sm" value={disposition} onChange={(e) => setDisposition(e.target.value as ConsultationDisposition)}>
                    <option value="Completed">Completed</option>
                    <option value="Admitted">Admitted</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                  {disposition === 'Follow-up' && (
                    <input className="border rounded-md p-2 text-sm" type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  )}
                </div>
                {disposition === 'Follow-up' && (
                  <textarea className="w-full border rounded-md p-2 text-sm min-h-16" placeholder="Follow-up notes" value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} />
                )}

                <Button disabled={saving} onClick={handleSaveConsultation} className="w-full">
                  {saving ? 'Saving...' : 'Save Consultation & Update Status'}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a patient from queue to start consultation.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
