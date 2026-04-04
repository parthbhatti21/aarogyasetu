import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DisclosureDropdown } from '@/components/ui/disclosure-dropdown';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react';
import type { PatientRegistrationData } from '@/services/registrationService';

interface RegistrationFormProps {
  onSubmit: (data: PatientRegistrationData) => Promise<void>;
  isLoading?: boolean;
}

const BILLING_TYPE_OPTIONS = [
  { value: 'BPL', label: 'BPL (Below Poverty Line)' },
  { value: 'RBSK', label: 'RBSK' },
  { value: 'ESI', label: 'ESI (Employee State Insurance)' },
  { value: 'Senior Citizen', label: 'Senior Citizen' },
  { value: 'Poor', label: 'Poor' },
  { value: 'Amarnath Yatra', label: 'Amarnath Yatra' },
  { value: 'Medical Student', label: 'Medical Student' },
  { value: 'Hospital Staff', label: 'Hospital Staff' },
  { value: 'Handicapped', label: 'Handicapped' },
  { value: 'General', label: 'General' },
];

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState<PatientRegistrationData>({
    firstName: '',
    surname: '',
    mobileNumber: '',
    gender: 'Male',
    age: 0,
    purposeOfVisit: '',
    address: '',
    occupation: '',
    income: '',
    billingType: 'General',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }

    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Mobile must be exactly 10 digits';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.age || formData.age <= 0 || formData.age > 150) {
      newErrors.age = 'Please enter a valid age';
    }

    if (!formData.purposeOfVisit.trim()) {
      newErrors.purposeOfVisit = 'Purpose of visit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof PatientRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      // Re-validate on change if field was touched
      validateField(field, value);
    }
  };

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = 'First name is required';
        } else {
          delete newErrors.firstName;
        }
        break;
      case 'surname':
        if (!value.trim()) {
          newErrors.surname = 'Surname is required';
        } else {
          delete newErrors.surname;
        }
        break;
      case 'mobileNumber':
        const cleaned = value.replace(/\D/g, '').slice(0, 10);
        if (!cleaned) {
          newErrors.mobileNumber = 'Mobile number is required';
        } else if (cleaned.length !== 10) {
          newErrors.mobileNumber = 'Mobile must be exactly 10 digits';
        } else {
          delete newErrors.mobileNumber;
        }
        break;
      case 'age':
        if (!value || value <= 0 || value > 150) {
          newErrors.age = 'Please enter a valid age';
        } else {
          delete newErrors.age;
        }
        break;
      case 'purposeOfVisit':
        if (!value.trim()) {
          newErrors.purposeOfVisit = 'Purpose of visit is required';
        } else {
          delete newErrors.purposeOfVisit;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof PatientRegistrationData]);
  };

  const handleMobileChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    handleChange('mobileNumber', cleaned);
  };

  const handleAgeChange = (value: string) => {
    const num = value ? parseInt(value, 10) : 0;
    handleChange('age', num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields correctly',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Registration Error',
        description: error instanceof Error ? error.message : 'Failed to register patient',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Register New Patient</h3>
      </div>

      {/* Name Section */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="font-medium">
            First Name *
          </Label>
          <Input
            id="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={e => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            className={`text-lg p-3 ${errors.firstName ? 'border-destructive' : ''}`}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.firstName}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="surname" className="font-medium">
            Surname *
          </Label>
          <Input
            id="surname"
            placeholder="Surname"
            value={formData.surname}
            onChange={e => handleChange('surname', e.target.value)}
            onBlur={() => handleBlur('surname')}
            className={`text-lg p-3 ${errors.surname ? 'border-destructive' : ''}`}
            disabled={isLoading}
          />
          {errors.surname && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.surname}
            </p>
          )}
        </div>
      </div>

      {/* Contact & Demographics */}
      <div className="space-y-2">
        <Label htmlFor="mobile" className="font-medium">
          Mobile Number (10 digits) *
        </Label>
        <Input
          id="mobile"
          type="tel"
          placeholder="10-digit mobile number"
          value={formData.mobileNumber}
          onChange={e => handleMobileChange(e.target.value)}
          onBlur={() => handleBlur('mobileNumber')}
          className={`text-lg p-3 font-mono ${errors.mobileNumber ? 'border-destructive' : ''}`}
          maxLength={10}
          disabled={isLoading}
        />
        {errors.mobileNumber && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.mobileNumber}
          </p>
        )}
      </div>

      {/* Age & Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age" className="font-medium">
            Age *
          </Label>
          <Input
            id="age"
            type="number"
            placeholder="Age"
            value={formData.age || ''}
            onChange={e => handleAgeChange(e.target.value)}
            onBlur={() => handleBlur('age')}
            className={`text-lg p-3 ${errors.age ? 'border-destructive' : ''}`}
            min={0}
            max={150}
            disabled={isLoading}
          />
          {errors.age && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.age}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="font-medium">
            Gender *
          </Label>
          <DisclosureDropdown
            value={formData.gender}
            onValueChange={value => handleChange('gender', value)}
            placeholder="Select Gender"
            options={GENDER_OPTIONS}
            disabled={isLoading}
          />
          {errors.gender && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {errors.gender}
            </p>
          )}
        </div>
      </div>

      {/* Purpose of Visit */}
      <div className="space-y-2">
        <Label htmlFor="purpose" className="font-medium">
          Purpose of Visit / Chief Complaint *
        </Label>
        <Input
          id="purpose"
          placeholder="e.g., Fever, Cough, Skin issue, etc."
          value={formData.purposeOfVisit}
          onChange={e => handleChange('purposeOfVisit', e.target.value)}
          onBlur={() => handleBlur('purposeOfVisit')}
          className={`text-lg p-3 ${errors.purposeOfVisit ? 'border-destructive' : ''}`}
          disabled={isLoading}
        />
        {errors.purposeOfVisit && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.purposeOfVisit}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address" className="font-medium">
          Address
        </Label>
        <Input
          id="address"
          placeholder="Full address"
          value={formData.address || ''}
          onChange={e => handleChange('address', e.target.value)}
          className="text-lg p-3"
          disabled={isLoading}
        />
      </div>

      {/* Occupation & Income */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="occupation" className="font-medium">
            Occupation
          </Label>
          <Input
            id="occupation"
            placeholder="Occupation"
            value={formData.occupation || ''}
            onChange={e => handleChange('occupation', e.target.value)}
            className="text-lg p-3"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="income" className="font-medium">
            Income
          </Label>
          <Input
            id="income"
            placeholder="Income (optional)"
            value={formData.income || ''}
            onChange={e => handleChange('income', e.target.value)}
            className="text-lg p-3"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Billing Type */}
      <div className="space-y-2">
        <Label htmlFor="billingType" className="font-medium">
          Billing Type
        </Label>
        <DisclosureDropdown
          value={formData.billingType}
          onValueChange={value => handleChange('billingType', value)}
          placeholder="Select Billing Type"
          options={BILLING_TYPE_OPTIONS}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full gradient-primary text-primary-foreground text-lg h-12 font-semibold"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Registering...
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Register Patient
          </>
        )}
      </Button>
    </form>
  );
};
