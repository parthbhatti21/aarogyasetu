import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createCohereAIChatService, type CohereAIChatService } from '@/services/cohereAIService';
import { useSpeechRecognition, useSpeechSynthesis } from '@/hooks/useSpeech';
import { Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft, Check } from 'lucide-react';

interface FormData {
  full_name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  blood_group: string;
  chronic_conditions: string[];
  allergies: string[];
  current_medications: string[];
  chief_complaint: string;
  symptoms: string[];
}

export function AIFormFillerFullWindow() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<FormData>>({
    chronic_conditions: [],
    allergies: [],
    current_medications: [],
    symptoms: [],
  });

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentStep, setCurrentStep] = useState<'greeting' | 'asking' | 'complete'>('greeting');

  // Speech hooks
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const { speakText, isSpeaking } = useSpeechSynthesis();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef<CohereAIChatService | null>(null);

  // Initialize AI service
  useEffect(() => {
    if (!aiServiceRef.current) {
      aiServiceRef.current = createCohereAIChatService('en-IN');

      const greeting = `Hello! I'm your AI Health Assistant. I'll help you fill out your medical information through a conversation. Let's start with some basic details.

What's your name?`;

      setMessages([{ role: 'assistant', content: greeting }]);
      speakText(greeting, 'en-IN').catch(() => {});
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update transcript to input when recording stops
  useEffect(() => {
    if (transcript && !isListening) {
      setUserInput(transcript);
      resetTranscript();
    }
  }, [isListening, transcript, resetTranscript]);

  // Extract form data from conversation
  const extractFormData = (service: CohereAIChatService) => {
    const history = service.getHistory();
    const conversationText = history
      .map(msg => msg.content)
      .join(' ');

    const extracted: Partial<FormData> = {
      chronic_conditions: [],
      allergies: [],
      current_medications: [],
      symptoms: [],
    };

    // Extract name
    const nameMatch = conversationText.match(/(?:name is|i am|i'm|called)\s+([a-zA-Z\s]+?)(?:\.|,|and|$)/i);
    if (nameMatch) extracted.full_name = nameMatch[1].trim();

    // Extract age
    const ageMatch = conversationText.match(/(?:age|i am|i'm)\s+(\d{1,3})\s*(?:years?|yr)?/i);
    if (ageMatch) extracted.age = ageMatch[1];

    // Extract gender
    if (/(male|man|boy)/i.test(conversationText)) extracted.gender = 'Male';
    else if (/(female|woman|girl)/i.test(conversationText)) extracted.gender = 'Female';

    // Extract phone
    const phoneMatch = conversationText.match(/(\d{10})/);
    if (phoneMatch) extracted.phone = phoneMatch[1];

    // Extract email
    const emailMatch = conversationText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) extracted.email = emailMatch[1];

    // Extract chronic conditions
    const chronicKeywords = [
      'diabetes',
      'hypertension',
      'asthma',
      'copd',
      'heart',
      'cardiac',
      'thyroid',
      'arthritis',
      'epilepsy',
      'depression',
      'anxiety',
      'migraine',
      'kidney',
      'liver',
      'cancer',
    ];

    extracted.chronic_conditions = chronicKeywords.filter(kw =>
      new RegExp(`\\b${kw}\\b`, 'i').test(conversationText)
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));

    // Extract allergies
    const allergyKeywords = [
      'penicillin',
      'aspirin',
      'ibuprofen',
      'paracetamol',
      'gluten',
      'lactose',
      'nuts',
      'shellfish',
      'eggs',
      'pollen',
    ];

    extracted.allergies = allergyKeywords.filter(kw =>
      new RegExp(`\\b${kw}\\b`, 'i').test(conversationText)
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));

    // Extract symptoms
    const symptomKeywords = [
      'fever',
      'cough',
      'cold',
      'headache',
      'pain',
      'vomiting',
      'diarrhea',
      'weakness',
      'dizziness',
      'nausea',
      'fatigue',
      'shortness of breath',
      'sore throat',
      'body ache',
      'chest pain',
      'stomach pain',
    ];

    extracted.symptoms = symptomKeywords.filter(kw =>
      new RegExp(`\\b${kw}\\b`, 'i').test(conversationText)
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));

    return extracted;
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !aiServiceRef.current) return;

    setIsLoading(true);
    const userMessage = userInput;
    setUserInput('');

    try {
      // Add user message
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

      // Get AI response
      const response = await aiServiceRef.current.sendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Speak response
      if (voiceEnabled) {
        await speakText(response, 'en-IN').catch(() => {});
      }

      // Extract form data
      const extracted = extractFormData(aiServiceRef.current);
      setFormData(prev => ({ ...prev, ...extracted }));
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleComplete = () => {
    navigate('/patient', { state: { formData } });
  };

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-full">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Medical Form Filler</h1>
              <p className="text-sm text-gray-600">Natural conversation to fill your medical information</p>
            </div>
          </div>
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant={voiceEnabled ? 'default' : 'outline'}
            size="sm"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Voice On
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Voice Off
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 mt-24 gap-6 p-6 max-w-full">
        {/* Left Side - Form */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Medical Information</h2>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Personal Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium">Full Name</Label>
                  <Input
                    value={formData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 font-medium">Age</Label>
                    <Input
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Years"
                      type="number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Gender</Label>
                    <Input
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      placeholder="Male/Female"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Phone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="10-digit number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Email</Label>
                  <Input
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Address</Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Street address"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-700 font-medium">City</Label>
                    <Input
                      value={formData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">State</Label>
                    <Input
                      value={formData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 font-medium">Pincode</Label>
                    <Input
                      value={formData.pincode || ''}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      placeholder="Pincode"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Blood Group</Label>
                  <Input
                    value={formData.blood_group || ''}
                    onChange={(e) => handleInputChange('blood_group', e.target.value)}
                    placeholder="O+, A-, etc."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Medical Information</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium">Chronic Conditions</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.chronic_conditions?.map((cond, idx) => (
                      <span
                        key={idx}
                        className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {cond}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Allergies</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies?.map((allergy, idx) => (
                      <span
                        key={idx}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Current Medications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.current_medications?.map((med, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Chief Complaint</Label>
                  <Input
                    value={formData.chief_complaint || ''}
                    onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
                    placeholder="Reason for visit"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Symptoms</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.symptoms?.map((symptom, idx) => (
                      <span
                        key={idx}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 mt-8"
            >
              <Check className="h-5 w-5 mr-2" />
              Complete & Proceed
            </Button>
          </div>
        </div>

        {/* Right Side - Voice Bot Chat */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-6 border-b">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-6 space-y-3 bg-gradient-to-t from-gray-50">
            {/* Transcript Display */}
            {isListening && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 font-medium">Listening...</p>
                {transcript && <p className="text-sm text-blue-800 mt-1">{transcript}</p>}
              </div>
            )}

            {/* Text Input */}
            <div className="flex gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSendMessage();
                  }
                }}
                placeholder="Type your response or use voice..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Voice Button */}
            <Button
              onClick={handleMicClick}
              disabled={isLoading}
              variant={isListening ? 'destructive' : 'default'}
              className="w-full gap-2"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Voice Input
                </>
              )}
            </Button>

            {/* Status */}
            {isSpeaking && (
              <p className="text-xs text-center text-gray-600">🔊 AI speaking...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
