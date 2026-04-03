import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import RegistrationDashboard from "./pages/RegistrationDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import MedicalStoreAdminDashboard from "./pages/MedicalStoreAdminDashboard";
import MedicalStoreSalesDashboard from "./pages/MedicalStoreSalesDashboard";
import AIPatientRegistration from "./pages/AIPatientRegistration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/patient/register" element={<AIPatientRegistration />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/registration" element={<RegistrationDashboard />} />
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/store-admin" element={<MedicalStoreAdminDashboard />} />
            <Route path="/store-sales" element={<MedicalStoreSalesDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
