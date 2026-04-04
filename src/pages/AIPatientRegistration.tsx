import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DisclosureDropdown } from '@/components/ui/disclosure-dropdown';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCohereAIChat } from '@/hooks/useCohereAIChat';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import { supabase } from '@/utils/supabase';
import { createTokenForPatient, getHospitals } from '@/services/tokenService';
import type { PatientRegistrationForm, Hospital } from '@/types/database';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const AIPatientRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const [userMessage, setUserMessage] = useState('');
  const [formData, setFormData] = useState<Partial<PatientRegistrationForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Hospital selection states
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // AI Chat Hook - using Cohere API directly (no authentication required)
  const {
    messages,
    isLoading: aiLoading,
    extractedData,
    isComplete,
    sendMessage,
    setLanguage: setChatLanguage,
  } = useCohereAIChat({
    language: language === 'en' ? 'en-IN' : 'hi-IN',
    onDataExtracted: (data) => {
      setFormData(prev => ({ ...prev, ...data }));
    },
    autoFill: true,
  });

  // Voice Hooks
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: voiceInputSupported,
  } = useSpeechRecognition({
    language: language === 'hi' ? 'hi-IN' : 'en-IN',
    onResult: (text, isFinal) => {
      if (isFinal) {
        setUserMessage(text);
      }
    },
  });

  const {
    isSpeaking,
    speak,
    cancel: cancelSpeech,
    isSupported: voiceOutputSupported,
  } = useSpeechSynthesis();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('🔍 Auth Check:', { 
        hasSession: !!session, 
        user: session?.user?.email,
        error 
      });
      
      if (!session) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue registration.',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate, toast]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speak AI responses if voice is enabled
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content, language === 'hi' ? 'hi-IN' : 'en-IN');
      }
    }
  }, [messages, voiceEnabled, speak, language]);

  // Check if registration is complete
  useEffect(() => {
    if (isComplete && !showReview) {
      setShowReview(true);
      toast({
        title: 'Registration Information Collected',
        description: 'Please review your information before submitting.',
      });
    }
  }, [isComplete, showReview, toast]);

  // Load hospitals on mount
  useEffect(() => {
    const loadHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const hosp = await getHospitals();
        setHospitals(hosp);
      } catch (err: any) {
        console.error('Failed to load hospitals:', err);
        toast({
          title: 'Failed to load hospitals',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoadingHospitals(false);
      }
    };
    loadHospitals();
  }, [toast]);

  const handleSendMessage = async () => {
    if (!userMessage.trim() || aiLoading) return;

    const message = userMessage.trim();
    setUserMessage('');
    resetTranscript();

    try {
      await sendMessage(message);
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setChatLanguage(lang);
  };

  const handleFormChange = (field: keyof PatientRegistrationForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields including hospital
    if (!formData.full_name || !formData.phone || !formData.age || !formData.gender) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide name, phone, age, and gender.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedHospital) {
      toast({
        title: 'Hospital Required',
        description: 'Please select a hospital to proceed.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get current user from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate patient ID
      const { data: patientIdData, error: idError } = await supabase.rpc('generate_patient_id');
      if (idError) throw idError;
      const patientId = patientIdData;

      // Format phone
      const formattedPhone = formData.phone!.length === 10 
        ? `+91${formData.phone}` 
        : formData.phone!;

      // Create patient record with hospital_id
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          patient_id: patientId,
          full_name: formData.full_name,
          phone: formattedPhone,
          email: formData.email || user.email,
          age: formData.age,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          blood_group: formData.blood_group,
          user_id: user.id,
          preferred_language: language,
          hospital_id: selectedHospital.id,  // Add hospital assignment
          hospital_name: selectedHospital.hospital_name,
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Create medical history if data exists
      if (formData.chronic_conditions || formData.allergies || formData.current_medications) {
        await supabase.from('medical_history').insert({
          patient_id: newPatient.id,
          chronic_conditions: formData.chronic_conditions || [],
          allergies: formData.allergies || [],
          current_medications: formData.current_medications || [],
        });
      }

      // Generate hospital-specific token
      const tokenData = await createTokenForPatient({
        patientId: newPatient.id,
        chiefComplaint: formData.chief_complaint || 'Initial Registration',
        symptoms: formData.symptoms || [],
        visitType: 'General Consultation',
        hospitalId: selectedHospital.id,
      });

      // Note: AI conversation not saved with direct Cohere integration
      // await saveConversation(newPatient.id);

      // Log the patient in
      login('patient', {
        name: newPatient.full_name,
        email: newPatient.email!,
        phone: newPatient.phone,
        patientId: newPatient.patient_id,
      });

      toast({
        title: 'Registration Successful!',
        description: `Patient ID: ${patientId} | Token: ${tokenData.token_number}`,
        duration: 5000,
      });

      // Navigate to patient dashboard
      navigate('/patient');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <Sparkles className="inline-block mr-2 h-8 w-8 text-primary" />
            AI-Assisted Patient Registration
          </h1>
          <p className="text-gray-600">Chat with our AI assistant to complete your registration</p>
          
          {/* Language Toggle */}
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('en')}
            >
              English
            </Button>
            <Button
              variant={language === 'hi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('hi')}
            >
              हिंदी
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: AI Chat Interface */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">AI Assistant</h2>
              <div className="flex gap-2">
                {voiceOutputSupported && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                  >
                    {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                )}
                <Badge variant={isComplete ? 'default' : 'secondary'}>
                  {isComplete ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="h-[400px] pr-4 mb-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p>👋 {language === 'hi' ? 'नमस्ते! मैं आपकी मदद कैसे कर सकता हूं?' : 'Hello! How can I help you today?'}</p>
                  </div>
                )}
                
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                value={isListening ? transcript : userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={language === 'hi' ? 'अपना संदेश टाइप करें...' : 'Type your message...'}
                disabled={aiLoading || isListening}
              />
              
              {voiceInputSupported && (
                <Button
                  variant={isListening ? 'destructive' : 'outline'}
                  size="icon"
                  onClick={handleVoiceToggle}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={aiLoading || !userMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Right: Auto-Filled Form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Registration Form</h2>
            <p className="text-sm text-gray-600 mb-4">
              {language === 'hi' 
                ? 'फॉर्म स्वचालित रूप से आपकी बातचीत से भर जाएगा'
                : 'Form auto-fills as you chat with the AI'}
            </p>

            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {/* Personal Information */}
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name || ''}
                    onChange={(e) => handleFormChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleFormChange('age', parseInt(e.target.value))}
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <DisclosureDropdown
                      value={formData.gender || ''}
                      onValueChange={(value) => handleFormChange('gender', value)}
                      placeholder="Select Gender"
                      options={[
                        { label: 'Male', value: 'Male' },
                        { label: 'Female', value: 'Female' },
                        { label: 'Other', value: 'Other' },
                      ]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleFormChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <DisclosureDropdown
                    value={formData.blood_group || ''}
                    onValueChange={(value) => handleFormChange('blood_group', value)}
                    placeholder="Select Blood Group"
                    options={[
                      { label: 'A+', value: 'A+' },
                      { label: 'A-', value: 'A-' },
                      { label: 'B+', value: 'B+' },
                      { label: 'B-', value: 'B-' },
                      { label: 'AB+', value: 'AB+' },
                      { label: 'AB-', value: 'AB-' },
                      { label: 'O+', value: 'O+' },
                      { label: 'O-', value: 'O-' },
                    ]}
                  />
                </div>

                <div>
                  <Label htmlFor="chief_complaint">Chief Complaint</Label>
                  <Input
                    id="chief_complaint"
                    value={formData.chief_complaint || ''}
                    onChange={(e) => handleFormChange('chief_complaint', e.target.value)}
                    placeholder="Main reason for visit"
                  />
                </div>

                {/* Hospital Selection *Required* */}
                <div className="border-t pt-4">
                  <Label htmlFor="hospital" className="text-base font-medium">Hospital Selection * <span className="text-red-500">(Required)</span></Label>
                  <p className="text-xs text-gray-600 mb-3">Choose the hospital where you want to register</p>
                  <DisclosureDropdown
                    value={selectedHospital?.id || ''}
                    onValueChange={(value) => {
                      const hospital = hospitals.find(h => h.id === value);
                      setSelectedHospital(hospital || null);
                    }}
                    placeholder={loadingHospitals ? 'Loading hospitals...' : 'Select a hospital...'}
                    options={hospitals.map((h) => ({
                      label: `${h.hospital_name} (${h.state})`,
                      value: h.id,
                    }))}
                    disabled={loadingHospitals}
                  />
                  {selectedHospital && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                      <p className="text-green-700">
                        ✓ Hospital: <strong>{selectedHospital.hospital_name}</strong>
                      </p>
                      <p className="text-green-600 text-xs">{selectedHospital.state}</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.full_name || !formData.phone || !selectedHospital}
                >
                  {isSubmitting ? (
                    'Registering...'
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Complete Registration
                    </>
                  )}
                </Button>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIPatientRegistration;
