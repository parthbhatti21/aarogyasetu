import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LayoutProvider } from "@/contexts/LayoutContext";
import type { UserRole } from "@/types/auth";
import { AccessibilityWidget } from "@/components/accessibility/AccessibilityWidget";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import RegistrationDashboard from "./pages/RegistrationDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import PatientMedicalForm from "./pages/PatientMedicalForm";
import MedicalStoreAdminDashboard from "./pages/MedicalStoreAdminDashboard";
import MedicalStoreSalesDashboard from "./pages/MedicalStoreSalesDashboard";
import AIPatientRegistration from "./pages/AIPatientRegistration";
import { AIFormFillerFullWindow } from "./components/patient/AIFormFillerFullWindow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ roles, children, title, hideLayout }: { roles: UserRole[]; children: ReactNode; title?: string; hideLayout?: boolean }) => {
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

  return <MainLayout title={title} hideLayout={hideLayout}>{children}</MainLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LayoutProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessibilityWidget />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/patient/register" element={<AIPatientRegistration />} />
              <Route path="/patient/medical-form" element={<AIFormFillerFullWindow />} />
              <Route path="/patient/medical-form-manual" element={<ProtectedRoute roles={['patient']} hideLayout><PatientMedicalForm /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin']} title="Admin Dashboard"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/doctor" element={<ProtectedRoute roles={['doctor']} title="Doctor Dashboard"><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/senior-doctor" element={<ProtectedRoute roles={['senior_doctor']} title="Doctor Dashboard"><DoctorDashboard /></ProtectedRoute>} />
              <Route path="/registration" element={<ProtectedRoute roles={['registration_desk']} title="Registration Desk"><RegistrationDashboard /></ProtectedRoute>} />
              <Route path="/patient" element={<ProtectedRoute roles={['patient']} title="Patient Dashboard"><PatientDashboard /></ProtectedRoute>} />
              <Route path="/store-admin" element={<ProtectedRoute roles={['medical_store_admin']} title="Medical Store Admin"><MedicalStoreAdminDashboard /></ProtectedRoute>} />
              <Route path="/store-sales" element={<ProtectedRoute roles={['medical_store_sales']} title="Medical Store Sales"><MedicalStoreSalesDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LayoutProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
