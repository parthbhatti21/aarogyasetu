import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DisclosureDropdown } from '@/components/ui/disclosure-dropdown';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  createRegistrationStaff,
  getRegistrationStaffByHospital,
  deactivateRegistrationStaff,
  reactivateRegistrationStaff,
  generateTemporaryPassword,
  type RegistrationStaffProfile,
} from '@/services/registrationStaffService';
import type { Hospital } from '@/types/database';
import {
  Loader2,
  Users,
  Plus,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface ManageRegistrationStaffProps {
  selectedHospital: Hospital | null;
}

export const ManageRegistrationStaff: React.FC<ManageRegistrationStaffProps> = ({
  selectedHospital,
}) => {
  const { toast } = useToast();

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'registration_desk_operator' | 'registration_desk_supervisor'>(
    'registration_desk_operator'
  );
  const [creating, setCreating] = useState(false);

  // Staff list states
  const [staff, setStaff] = useState<RegistrationStaffProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const ROLE_OPTIONS = [
    { value: 'registration_desk_operator', label: 'Registration Desk Operator' },
    { value: 'registration_desk_supervisor', label: 'Registration Desk Supervisor' },
  ];

  // Load staff when hospital changes
  useEffect(() => {
    if (selectedHospital) {
      loadStaff();
    } else {
      setStaff([]);
    }
  }, [selectedHospital]);

  const loadStaff = async () => {
    if (!selectedHospital) return;

    try {
      setLoading(true);
      const staffList = await getRegistrationStaffByHospital(selectedHospital.id);
      setStaff(staffList);
    } catch (error) {
      console.error('Error loading staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to load registration staff',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password || !selectedHospital) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);

      await createRegistrationStaff({
        fullName,
        email,
        password,
        phone: phone || undefined,
        hospitalId: selectedHospital.id,
        role,
      });

      toast({
        title: 'Success!',
        description: `${fullName} created as ${role === 'registration_desk_supervisor' ? 'Supervisor' : 'Operator'}`,
      });

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('registration_desk_operator');
      setShowCreateForm(false);

      // Reload staff
      await loadStaff();
    } catch (error) {
      console.error('Error creating staff:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create staff account',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateTemporaryPassword();
    setPassword(newPassword);
    toast({
      title: 'Password Generated',
      description: 'Click copy to use this password',
    });
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    toast({
      title: 'Copied!',
      description: 'Password copied to clipboard',
    });
  };

  const handleDeactivate = async (staffId: string, staffName: string) => {
    if (!confirm(`Deactivate ${staffName}? They won't be able to login.`)) return;

    try {
      await deactivateRegistrationStaff(staffId);
      toast({
        title: 'Deactivated',
        description: `${staffName} has been deactivated`,
      });
      await loadStaff();
    } catch (error) {
      console.error('Error deactivating staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate staff',
        variant: 'destructive',
      });
    }
  };

  const handleReactivate = async (staffId: string, staffName: string) => {
    try {
      await reactivateRegistrationStaff(staffId);
      toast({
        title: 'Reactivated',
        description: `${staffName} has been reactivated`,
      });
      await loadStaff();
    } catch (error) {
      console.error('Error reactivating staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to reactivate staff',
        variant: 'destructive',
      });
    }
  };

  if (!selectedHospital) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Select a hospital to manage registration desk staff</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Staff Form */}
      {!showCreateForm ? (
        <Button
          onClick={() => setShowCreateForm(true)}
          className="gap-2 gradient-primary text-white"
        >
          <Plus className="h-4 w-4" />
          Create Registration Staff
        </Button>
      ) : (
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">
              Create New Registration Desk Staff
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g., Rajesh Kumar"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="text-lg p-3"
                disabled={creating}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., rajesh@hospital.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="text-lg p-3"
                disabled={creating}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="text-lg p-3 font-mono"
                maxLength={10}
                disabled={creating}
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="font-medium">
                Role *
              </Label>
              <DisclosureDropdown
                value={role}
                onValueChange={value =>
                  setRole(value as 'registration_desk_operator' | 'registration_desk_supervisor')
                }
                placeholder="Select role"
                options={ROLE_OPTIONS}
                disabled={creating}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-medium">
                Password *
              </Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password or generate one"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="text-lg p-3 pr-10"
                    disabled={creating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={handleGeneratePassword}
                  variant="outline"
                  disabled={creating}
                  className="gap-1"
                >
                  Generate
                </Button>
              </div>
              {password && (
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono flex-1 truncate">
                    {password}
                  </code>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyPassword}
                    className="gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1 gradient-primary text-white gap-2"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Staff Account
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Staff List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-foreground">Registration Desk Staff</h3>
          <Badge variant="outline">{staff.length}</Badge>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading staff...</p>
          </Card>
        ) : staff.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No registration staff yet. Create one to get started.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <Card
                key={s.id}
                className={`p-4 ${
                  !s.is_active ? 'opacity-60 bg-gray-50' : 'bg-white'
                } hover:bg-muted transition`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{s.full_name}</p>
                        <p className="text-sm text-muted-foreground">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={s.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {s.role === 'registration_desk_supervisor' ? 'Supervisor' : 'Operator'}
                      </Badge>
                      {s.phone && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {s.phone}
                        </Badge>
                      )}
                      {s.last_login_at && (
                        <span className="text-xs text-muted-foreground">
                          Last login: {new Date(s.last_login_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {s.is_active ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeactivate(s.id, s.full_name)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReactivate(s.id, s.full_name)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>📌 Info:</strong> Registration desk staff can login with their email and password
          to access the registration desk module. Supervisors can manage operators and override
          registrations.
        </p>
      </Card>
    </div>
  );
};

export default ManageRegistrationStaff;
