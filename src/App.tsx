import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/auth";
import { AccessibilityWidget } from "@/components/accessibility/AccessibilityWidget";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import RegistrationDashboard from "./pages/RegistrationDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import MedicalStoreAdminDashboard from "./pages/MedicalStoreAdminDashboard";
import MedicalStoreSalesDashboard from "./pages/MedicalStoreSalesDashboard";
import AIPatientRegistration from "./pages/AIPatientRegistration";
import { AIFormFillerFullWindow } from "./components/patient/AIFormFillerFullWindow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ roles, children }: { roles: UserRole[]; children: ReactNode }) => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AccessibilityWidget />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/patient/register" element={<AIPatientRegistration />} />
            <Route path="/patient/medical-form" element={<AIFormFillerFullWindow />} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/senior-doctor" element={<ProtectedRoute roles={['senior_doctor']}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/registration" element={<ProtectedRoute roles={['registration_desk']}><RegistrationDashboard /></ProtectedRoute>} />
            <Route path="/patient" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
            <Route path="/store-admin" element={<ProtectedRoute roles={['medical_store_admin']}><MedicalStoreAdminDashboard /></ProtectedRoute>} />
            <Route path="/store-sales" element={<ProtectedRoute roles={['medical_store_sales']}><MedicalStoreSalesDashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
