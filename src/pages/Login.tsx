import { useState } from 'react';
import { UserRole, ROLE_OPTIONS } from '@/types/auth';
import RoleSelector from '@/components/auth/RoleSelector';
import StaffLoginForm from '@/components/auth/StaffLoginForm';
import PatientOTPForm from '@/components/auth/PatientOTPForm';
import medicalLogo from '@/assets/medical-logo.png';
import hospitalHero from '@/assets/hospital-hero.jpg';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
  };

  const roleConfig = ROLE_OPTIONS.find((r) => r.id === selectedRole);

  return (
    <div className="min-h-screen flex">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={hospitalHero} alt="Hospital" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            AI-Powered Hospital<br />Management Platform
          </h1>
          <p className="text-lg opacity-90 max-w-md">
            Digitize operations, reduce wait times, and improve patient care with intelligent automation.
          </p>
          <div className="flex gap-6 mt-8">
            {[
              { n: '50K+', l: 'Patients Served' },
              { n: '200+', l: 'Doctors' },
              { n: '98%', l: 'Satisfaction' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-bold">{s.n}</p>
                <p className="text-sm opacity-75">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <img src={medicalLogo} alt="MedCare" className="h-10 w-10" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Aarogya Setu</h2>
              <p className="text-xs text-muted-foreground">Hospital Management System</p>
            </div>
          </div>

          {!showForm ? (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Select your role</h3>
                <p className="text-sm text-muted-foreground">Choose how you'd like to sign in</p>
              </div>
              <RoleSelector selectedRole={selectedRole} onSelect={handleRoleSelect} />
              {selectedRole && (
                <button
                  onClick={handleContinue}
                  className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-medium transition-all hover:opacity-90 animate-fade-in"
                >
                  Continue as {roleConfig?.label}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Sign in as {roleConfig?.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRole === 'patient' ? 'Register or sign in with your details and email OTP' : 'Enter your credentials'}
                </p>
              </div>
              {selectedRole === 'patient' ? (
                <PatientOTPForm onBack={handleBack} />
              ) : (
                <StaffLoginForm role={selectedRole!} onBack={handleBack} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
