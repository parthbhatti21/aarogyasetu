import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VirtualWaitingRoom } from '@/components/patient/VirtualWaitingRoom';
import { useQueue } from '@/hooks/useQueue';
import { supabase } from '@/utils/supabase';
import { LogOut, Ticket, FileText, Bell, Pill } from 'lucide-react';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [patientDbId, setPatientDbId] = useState<string | null>(null);

  // Fetch patient database ID
  useEffect(() => {
    const fetchPatientId = async () => {
      if (!user?.patientId) return;
      
      const { data, error } = await supabase
        .from('patients')
        .select('id')
        .eq('patient_id', user.patientId)
        .single();

      if (data && !error) {
        setPatientDbId(data.id);
      }
    };

    fetchPatientId();
  }, [user?.patientId]);

  // Use queue hook with real-time updates
  const {
    currentToken,
    activeToken,
    queuePosition,
    estimatedWaitTime,
    queueData,
    loading,
  } = useQueue({
    patientId: patientDbId || undefined,
    autoRefresh: true,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm px-6 py-4 border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
            <p className="text-sm text-gray-600">Patient ID: {user?.patientId || 'Not assigned'}</p>
          </div>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
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
            <div className="bg-white rounded-lg p-8 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Health Records</h3>
              <p className="text-gray-600">View your medical history, prescriptions, and lab reports</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="bg-white rounded-lg p-8 text-center">
              <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Notifications</h3>
              <p className="text-gray-600">Stay updated with appointment reminders and test results</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </TabsContent>

          {/* Medicine Checker Tab */}
          <TabsContent value="medicines">
            <div className="bg-white rounded-lg p-8 text-center">
              <Pill className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Medicine Availability</h3>
              <p className="text-gray-600">Check medicine stock and find nearby pharmacies</p>
              <p className="text-sm text-gray-500 mt-4">Coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PatientDashboard;
