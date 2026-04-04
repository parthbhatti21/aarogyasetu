import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DisclosureDropdown } from '@/components/ui/disclosure-dropdown';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { FormSection } from '@/components/forms/FormSection';
import { FormField } from '@/components/forms/FormField';

const PatientMedicalForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    chronicConditions: '',
    surgeries: '',
    familyHistory: '',
    lifestyleHabits: '',
    additionalNotes: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Save form data
      console.log('Saving medical form:', formData);
      // Add API call here if needed
      
      // Show success and redirect
      navigate('/patient');
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/patient')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Medical Form - Fill Manually</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <FormSection title="Medical History" description="Provide details about your medical background">
              <FormField label="Medical History" required>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Describe any past medical conditions, treatments, or procedures..."
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                />
              </FormField>

              <FormField label="Allergies" required>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="List any known allergies (medications, foods, environmental, etc.)"
                  value={formData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                />
              </FormField>

              <FormField label="Current Medications">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="List all current medications with dosages"
                  value={formData.currentMedications}
                  onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                />
              </FormField>
            </FormSection>

            <FormSection title="Chronic Conditions" description="Provide information about ongoing health conditions">
              <FormField label="Chronic Conditions">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="List any chronic conditions (diabetes, hypertension, asthma, etc.)"
                  value={formData.chronicConditions}
                  onChange={(e) => handleInputChange('chronicConditions', e.target.value)}
                />
              </FormField>

              <FormField label="Previous Surgeries">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Describe any previous surgeries and when they occurred"
                  value={formData.surgeries}
                  onChange={(e) => handleInputChange('surgeries', e.target.value)}
                />
              </FormField>

              <FormField label="Family Medical History">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Any significant medical conditions in your family (hereditary conditions, etc.)"
                  value={formData.familyHistory}
                  onChange={(e) => handleInputChange('familyHistory', e.target.value)}
                />
              </FormField>
            </FormSection>

            <FormSection title="Lifestyle" description="Share information about your lifestyle habits">
              <FormField label="Lifestyle & Habits">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Smoking status, alcohol consumption, exercise frequency, diet habits, etc."
                  value={formData.lifestyleHabits}
                  onChange={(e) => handleInputChange('lifestyleHabits', e.target.value)}
                />
              </FormField>
            </FormSection>

            <FormSection title="Additional Information">
              <FormField label="Additional Notes">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Any other relevant medical information you'd like to share..."
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                />
              </FormField>
            </FormSection>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/patient')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default PatientMedicalForm;
