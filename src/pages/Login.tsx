import { useState } from 'react';
import { UserRole, ROLE_OPTIONS } from '@/types/auth';
import RoleSelector from '@/components/auth/RoleSelector';
import StaffLoginForm from '@/components/auth/StaffLoginForm';
import PatientOTPForm from '@/components/auth/PatientOTPForm';
import { PlatformOverview } from '@/components/marketing/PlatformOverview';
import medicalLogo from '@/assets/logo.jpg';
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left - Hero (desktop) */}
      <div className="hidden lg:flex lg:w-[42%] lg:min-h-screen lg:sticky lg:top-0 relative overflow-hidden">
        <img src={hospitalHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-hero opacity-85" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 text-primary-foreground min-h-screen">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest opacity-90 mb-3">Hospital operations</p>
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
              AI-Powered Hospital Management SaaS Platform
            </h1>
            <p className="text-base opacity-95 max-w-md leading-relaxed">
              Digitize workflows, shorten waits, and make care easier to access—with AI that supports patients,
              staff, and clinicians in one connected system.
            </p>
          </div>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-8">
              {[
                { n: 'Queue', l: 'Virtual waiting room' },
                { n: 'AI', l: 'Voice & smart allocation' },
                { n: '360°', l: 'Admin · Doctor · Pharmacy' },
              ].map((s) => (
                <div key={s.l}>
                  <p className="text-2xl font-bold">{s.n}</p>
                  <p className="text-sm opacity-80">{s.l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs opacity-70 max-w-sm">
              Designed for small and medium hospitals, government facilities, clinics, and pharmacy chains.
            </p>
          </div>
        </div>
      </div>

      {/* Right - Scrollable: brand, sign-in, platform story */}
      <div className="flex-1 flex flex-col min-h-0 lg:max-h-screen lg:overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="w-full max-w-2xl mx-auto px-6 py-8 sm:py-10 lg:py-12 space-y-8">
            <div className="flex items-center gap-3">
              <img src={medicalLogo} alt="" className="h-10 w-10" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Aarogya Setu X</h2>
                <p className="text-xs text-muted-foreground">Hospital Management System</p>
              </div>
            </div>

            {/* Mobile hero teaser */}
            <div className="lg:hidden rounded-xl border bg-muted/40 p-4 text-sm">
              <p className="font-semibold text-foreground mb-1">AI-Powered Hospital Management SaaS</p>
              <p className="text-muted-foreground leading-relaxed">
                Digitize operations, cut wait times, and improve access—including voice-led support for
                low-literacy patients.
              </p>
            </div>

            {!showForm ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Sign in</h3>
                  <p className="text-sm text-muted-foreground">Select your role to continue</p>
                </div>
                <RoleSelector selectedRole={selectedRole} onSelect={handleRoleSelect} />
                {selectedRole && (
                  <button
                    type="button"
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
                    {selectedRole === 'patient'
                      ? 'Register or sign in with your details and email OTP'
                      : 'Enter your credentials'}
                  </p>
                </div>
                {selectedRole === 'patient' ? (
                  <PatientOTPForm onBack={handleBack} />
                ) : (
                  <StaffLoginForm role={selectedRole!} onBack={handleBack} />
                )}
              </div>
            )}

            {!showForm && (
              <>
                <div className="border-t pt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Platform overview</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    How we connect patients, staff, doctors, and pharmacy in one AI-assisted workflow.
                  </p>
                  <PlatformOverview />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
