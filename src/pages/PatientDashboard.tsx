import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AITokenIntakeChat, type IntakePreview } from '@/components/patient/AITokenIntakeChat';
import { VirtualWaitingRoom } from '@/components/patient/VirtualWaitingRoom';
import { NotificationsPanel } from '@/components/patient/NotificationsPanel';
import { useQueue } from '@/hooks/useQueue';
import { usePatientHealthRecords } from '@/hooks/usePatientHealthRecords';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/utils/supabase';
import { autoAssignDoctor } from '@/utils/doctorAssignment';
import { LogOut, Ticket, FileText, Bell, Pill, Sparkles, Mic, Wand2 } from 'lucide-react';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patientDbId, setPatientDbId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [creatingToken, setCreatingToken] = useState(false);
  const [manualChiefComplaint, setManualChiefComplaint] = useState('general');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiReasonPreview, setAiReasonPreview] = useState<string | null>(null);
  const [aiSymptomsPreview, setAiSymptomsPreview] = useState<string[]>([]);
  const [aiIntakeReady, setAiIntakeReady] = useState(false);

  const handleIntakePreview = useCallback((preview: IntakePreview) => {
    setAiReasonPreview(preview.chiefComplaint.trim() || null);
    setAiSymptomsPreview(preview.symptoms);
    setAiIntakeReady(preview.ready);
  }, []);

  const MANUAL_VISIT_CHIEF: { value: string; label: string }[] = [
    { value: 'general', label: 'General consultation' },
    { value: 'fever', label: 'Fever / cold / flu' },
    { value: 'cough', label: 'Cough / breathing difficulty' },
    { value: 'pain', label: 'Pain (abdomen / chest / joints)' },
    { value: 'headache', label: 'Headache / migraine' },
    { value: 'injury', label: 'Injury / wound' },
    { value: 'followup', label: 'Follow-up visit' },
    { value: 'chronic', label: 'Chronic condition review' },
  ];

  // Check if patient is registered
  useEffect(() => {
    const checkRegistration = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/');
        return;
      }

      setPatientEmail(session.user.email || '');

      // Try to fetch patient record
      const { data: patient, error } = await supabase
        .from('patients')
        .select('id, patient_id, full_name')
        .eq('user_id', session.user.id)
        .single();

      console.log('📋 Registration Check:', { 
        hasPatient: !!patient, 
        error: error?.code,
        userId: session.user.id 
      });

      if (patient) {
        setIsRegistered(true);
        setPatientDbId(patient.id);
      } else {
        setIsRegistered(false);
      }
    };

    checkRegistration();
  }, [navigate]);

  // Use queue hook with real-time updates
  const {
    currentToken,
    activeToken,
    queuePosition,
    estimatedWaitTime,
    queueData,
    loading,
    refresh,
  } = useQueue({
    patientId: patientDbId || undefined,
    autoRefresh: true,
  });

  const { data: healthData, loading: healthLoading } = usePatientHealthRecords(patientDbId || undefined);

  const createTokenForPatient = async (payload: { chiefComplaint: string; symptoms: string[]; visitType: string }) => {
    if (!patientDbId) {
      throw new Error('Patient profile not found');
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: existingToken } = await supabase
      .from('tokens')
      .select('id, token_number')
      .eq('patient_id', patientDbId)
      .eq('visit_date', today)
      .in('status', ['Waiting', 'Active'])
      .maybeSingle();

    if (existingToken) {
      throw new Error(`You already have a token today (${existingToken.token_number})`);
    }

    const { count: waitingCount, error: waitingCountError } = await supabase
      .from('tokens')
      .select('id', { count: 'exact', head: true })
      .eq('visit_date', today)
      .eq('status', 'Waiting');

    if (waitingCountError) {
      throw waitingCountError;
    }

    const { data: tokenNumber, error: tokenNumberError } = await supabase.rpc('generate_token_number');
    if (tokenNumberError) {
      throw tokenNumberError;
    }

    const { data: newToken, error: createTokenError } = await supabase
      .from('tokens')
      .insert({
        token_number: tokenNumber,
        patient_id: patientDbId,
        visit_type: payload.visitType,
        chief_complaint: payload.chiefComplaint,
        symptoms: payload.symptoms,
        queue_position: (waitingCount || 0) + 1,
      })
      .select('id')
      .single();

    if (createTokenError) {
      throw createTokenError;
    }

    // Auto-assign doctor based on chief complaint
    if (newToken?.id) {
      await autoAssignDoctor(newToken.id, payload.chiefComplaint);
    }

    return tokenNumber as string;
  };

  const handleGetToken = async () => {
    setCreatingToken(true);
    try {
      let chiefComplaint: string;
      let symptoms: string[];

      if (aiIntakeReady && aiReasonPreview?.trim()) {
        chiefComplaint = aiReasonPreview.trim();
        symptoms = [...aiSymptomsPreview];
      } else {
        if (manualChiefComplaint === 'general') {
          toast({
            title: 'Choose a visit reason',
            description: 'Use AI Token Generator to describe your visit, or pick a specific reason from the list (not General consultation).',
            variant: 'destructive',
          });
          return;
        }
        const opt = MANUAL_VISIT_CHIEF.find((o) => o.value === manualChiefComplaint);
        chiefComplaint = opt?.label || 'General consultation';
        symptoms = [];
      }

      const tokenNumber = await createTokenForPatient({
        chiefComplaint,
        symptoms,
        visitType: 'General Consultation',
      });

      setAiReasonPreview(null);
      setAiSymptomsPreview([]);
      setAiIntakeReady(false);

      await refresh();
      toast({
        title: 'Token generated',
        description: `Your token number is ${tokenNumber}`,
      });
    } catch (error: any) {
      toast({
        title: 'Could not create token',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingToken(false);
    }
  };

  // Show loading state
  if (isRegistered === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome{user?.name ? `, ${user.name}` : ''}
            </h1>
            <p className="text-sm text-gray-600">
              {patientEmail || 'Patient Portal'}
            </p>
          </div>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Registration Banner - Show if not registered */}
        {!isRegistered && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <Sparkles className="h-12 w-12" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Add Medical Intake (Optional)</h2>
                <p className="text-blue-100">
                  You can continue using the app without this step. Add symptoms and health background
                  with AI whenever you want for faster consultations.
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/patient/register')}
            >
              <Mic className="h-5 w-5 mr-2" />
              Start AI Intake
            </Button>
          </div>
        )}

        <Tabs defaultValue="waiting-room" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="waiting-room">
              <Ticket className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
            <TabsTrigger value="records">
              <FileText className="h-4 w-4 mr-2" />
              Records
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="medicines">
              <Pill className="h-4 w-4 mr-2" />
              Medicine
            </TabsTrigger>
          </TabsList>

          {/* Virtual Waiting Room Tab */}
          <TabsContent value="waiting-room" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Virtual Waiting Room</h2>
              <p className="text-gray-600">Real-time queue updates and token status</p>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reason for visit (from AI chat)</label>
                <div
                  className={`rounded-md border px-3 py-2 text-sm min-h-[42px] flex items-center ${
                    aiReasonPreview ? 'bg-white border-gray-200' : 'bg-gray-50 border-dashed text-gray-500'
                  }`}
                >
                  {aiReasonPreview || 'Open AI Token Generator and describe your symptoms — this fills in automatically.'}
                </div>
                {aiReasonPreview && (
                  <p className="text-xs text-gray-500">
                    {aiIntakeReady ? 'Ready for token — you can use Get Token or finish in AI to generate.' : 'Add a bit more detail until this is marked valid in the AI window.'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-2 min-w-[220px]">
                <label className="text-sm font-medium text-gray-700">Or choose manually</label>
                <Select
                  value={manualChiefComplaint}
                  onValueChange={setManualChiefComplaint}
                  disabled={creatingToken || !isRegistered || !!currentToken}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {MANUAL_VISIT_CHIEF.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGetToken}
                disabled={
                  creatingToken ||
                  !isRegistered ||
                  !!currentToken ||
                  (!aiIntakeReady && manualChiefComplaint === 'general')
                }
              >
                <Ticket className="h-4 w-4 mr-2" />
                Get Token
              </Button>
              <Button
                variant="outline"
                onClick={() => setAiChatOpen(true)}
                disabled={creatingToken || !isRegistered || !!currentToken || !patientDbId}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                AI Token Generator
              </Button>
              </div>
            </div>

            {patientDbId && (
              <AITokenIntakeChat
                open={aiChatOpen}
                onOpenChange={setAiChatOpen}
                patientId={patientDbId}
                createToken={createTokenForPatient}
                onPreviewChange={handleIntakePreview}
                onComplete={async (tokenNumber) => {
                  setAiReasonPreview(null);
                  setAiSymptomsPreview([]);
                  setAiIntakeReady(false);
                  await refresh();
                  toast({
                    title: 'AI token generated',
                    description: `Your token number is ${tokenNumber}`,
                  });
                }}
                onError={(message) => {
                  toast({
                    title: 'AI token failed',
                    description: message,
                    variant: 'destructive',
                  });
                }}
              />
            )}

            <VirtualWaitingRoom
              currentToken={currentToken}
              activeToken={activeToken}
              queuePosition={queuePosition}
              estimatedWaitTime={estimatedWaitTime}
              queueData={queueData}
              loading={loading}
            />
          </TabsContent>

          {/* Health Records Tab */}
          <TabsContent value="records">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-2">Consultation notes & visits</h3>
              <p className="text-gray-600 text-sm mb-4">
                Updates live when your doctor saves a consultation.
              </p>
              {!patientDbId ? (
                <p className="text-sm text-gray-500">Complete registration to see your records.</p>
              ) : healthLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : !healthData?.records?.length ? (
                <p className="text-sm text-gray-500">No consultation notes yet.</p>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto">
                  {healthData.records.map((rec) => (
                    <div key={rec.id} className="border rounded-lg p-4 text-left">
                      <p className="text-xs text-gray-500">{rec.record_date}</p>
                      {rec.diagnosis && (
                        <p className="font-medium text-gray-900 mt-1">Diagnosis: {rec.diagnosis}</p>
                      )}
                      {rec.doctor_notes && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{rec.doctor_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {patientDbId ? (
              <NotificationsPanel patientId={patientDbId} />
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Notifications</h3>
                <p className="text-gray-600">Complete your medical intake to receive notifications</p>
                <Button className="mt-4" onClick={() => navigate('/patient/register')}>
                  <Mic className="h-4 w-4 mr-2" />
                  Start AI Intake
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Medicine Checker Tab */}
          <TabsContent value="medicines">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-2">Your prescriptions</h3>
              <p className="text-gray-600 text-sm mb-4">
                Medicines your doctor prescribed appear here in real time.
              </p>
              {!patientDbId ? (
                <p className="text-sm text-gray-500">Complete registration to see prescriptions.</p>
              ) : healthLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : !healthData?.prescriptions?.length ? (
                <p className="text-sm text-gray-500">No prescriptions yet.</p>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto">
                  {healthData.prescriptions.map((rx) => (
                    <div key={rx.id} className="border rounded-lg p-4 text-left">
                      <p className="text-xs text-gray-500">{rx.prescribed_date}</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{rx.prescription_id}</p>
                      {Array.isArray(rx.medications) && rx.medications.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-800 space-y-1">
                          {(rx.medications as { name?: string; dosage?: string; frequency?: string; duration?: string }[]).map(
                            (m, i) => (
                              <li key={i}>
                                {m.name || 'Medicine'}
                                {m.dosage ? ` · ${m.dosage}` : ''}
                                {m.frequency ? ` · ${m.frequency}` : ''}
                                {m.duration ? ` · ${m.duration}` : ''}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                      {rx.instructions && (
                        <p className="text-sm text-gray-700 mt-2">Instructions: {rx.instructions}</p>
                      )}
                      {rx.precautions && (
                        <p className="text-sm text-amber-800 mt-1">Precautions: {rx.precautions}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDashboard;
