import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DisclosureDropdown } from '@/components/ui/disclosure-dropdown';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Stethoscope, AlertCircle, Check } from 'lucide-react';
import type { DoctorSuggestion } from '@/services/doctorSuggestionEngine';

interface DoctorSuggestionCardProps {
  suggestion: DoctorSuggestion | null;
  isLoading?: boolean;
  onOverride?: (specialty: string) => void;
  disabled?: boolean;
}

const SPECIALTY_OPTIONS = [
  { value: 'General Practice', label: 'General Practice' },
  { value: 'Cardiology', label: 'Cardiology' },
  { value: 'Dermatology', label: 'Dermatology' },
  { value: 'Orthopedics', label: 'Orthopedics' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Ophthalmology', label: 'Ophthalmology' },
  { value: 'Dentistry', label: 'Dentistry' },
  { value: 'Gastroenterology', label: 'Gastroenterology' },
  { value: 'Respiratory/Pulmonology', label: 'Respiratory/Pulmonology' },
  { value: 'Pediatrics', label: 'Pediatrics' },
  { value: 'Gynecology', label: 'Gynecology' },
  { value: 'Psychiatry', label: 'Psychiatry' },
  { value: 'ENT', label: 'ENT (Ear, Nose, Throat)' },
  { value: 'Urology', label: 'Urology' },
];

export const DoctorSuggestionCard: React.FC<DoctorSuggestionCardProps> = ({
  suggestion,
  isLoading = false,
  onOverride,
  disabled = false,
}) => {
  const [isOverriding, setIsOverriding] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(
    suggestion?.specialty || 'General Practice'
  );

  const handleApplyOverride = () => {
    if (onOverride) {
      onOverride(selectedSpecialty);
      setIsOverriding(false);
    }
  };

  if (!suggestion) {
    return null;
  }

  const confidencePercent = Math.round(suggestion.confidence * 100);
  const isHighConfidence = suggestion.confidence >= 0.7;
  const isLowConfidence = suggestion.confidence < 0.4;

  return (
    <div className="space-y-4">
      {/* Suggestion Display */}
      {!isOverriding && (
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <Label className="text-sm font-medium text-gray-700">
                  AI-Suggested Doctor Specialty
                </Label>
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
            </div>

            {/* Specialty Name */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-2xl font-bold text-blue-900">{suggestion.specialty}</p>
            </div>

            {/* Confidence Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600">Confidence</span>
                <Badge
                  variant={isHighConfidence ? 'default' : isLowConfidence ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {confidencePercent}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isHighConfidence
                      ? 'bg-green-500'
                      : isLowConfidence
                      ? 'bg-orange-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-white rounded p-2 border-l-2 border-blue-400">
              <p className="text-xs text-gray-600 italic">{suggestion.reasoning}</p>
            </div>

            {/* Override Button */}
            <Button
              onClick={() => setIsOverriding(true)}
              variant="outline"
              size="sm"
              disabled={disabled || isLoading}
              className="w-full text-sm"
            >
              Change Doctor / Override
            </Button>
          </div>
        </Card>
      )}

      {/* Override Panel */}
      {isOverriding && (
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <Label className="font-medium text-gray-800">Select Doctor Specialty</Label>
            </div>

            {/* Specialty Selector */}
            <DisclosureDropdown
              value={selectedSpecialty}
              onValueChange={setSelectedSpecialty}
              placeholder="Select specialty"
              options={SPECIALTY_OPTIONS}
              disabled={disabled}
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={() => setIsOverriding(false)}
                variant="outline"
                size="sm"
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyOverride}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={disabled}
              >
                <Check className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DoctorSuggestionCard;
