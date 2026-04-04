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

  const { speak, isSpeaking } = useSpeechSynthesis();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef<CohereAIChatService | null>(null);

  // Initialize AI service
  useEffect(() => {
    if (!aiServiceRef.current) {
      aiServiceRef.current = createCohereAIChatService('en-IN');

      const greeting = `Hello! I'm your AI Health Assistant. I'll help you fill out your medical information through a conversation. Let's start with some basic details.

What's your full name?`;

      setMessages([{ role: 'assistant', content: greeting }]);
      speak(greeting, 'en-IN');
    }
  }, [speak]);

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
  const extractFormData = async (service: CohereAIChatService): Promise<Partial<FormData>> => {
    const history = service.getHistory();
    const userMessages = history
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');

    console.log('📚 User messages for extraction:', userMessages);

    // Use AI-based extraction first
    const aiExtracted = await extractWithAI(userMessages);
    if (aiExtracted) {
      console.log('✨ AI extraction successful:', aiExtracted);
      return aiExtracted;
    }

    // Fallback to regex
    console.log('⚙️ Using regex fallback extraction');
    return extractFormDataRegex(userMessages);
  };

  const extractWithAI = async (userMessages: string): Promise<Partial<FormData> | null> => {
    const extractionPrompt = `You are a data extraction assistant. Extract medical information from this patient conversation and respond with ONLY valid JSON (no markdown, no explanation).

Patient conversation:
${userMessages}

Extract and respond with this JSON format exactly (use null for missing data):
{
  "full_name": "patient name or null",
  "age": "age as number or null",
  "gender": "Male/Female/Other or null",
  "phone": "10-digit phone or null",
  "email": "email or null",
  "address": "full street address or null",
  "city": "city name or null",
  "state": "state name or null",
  "pincode": "6-digit postal code or null",
  "blood_group": "blood group or null",
  "chief_complaint": "main reason for visit or null",
  "symptoms": ["list", "of", "symptoms"],
  "chronic_conditions": ["list", "of", "conditions"],
  "allergies": ["list", "of", "allergies"],
  "current_medications": ["list", "of", "medications"]
}`;

    try {
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer eeW4xQr5CnWGYdRsyAyQ072sHhUU1TFPZ9ZAkufa`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: extractionPrompt,
          model: 'command-a-03-2025',
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        console.warn('⚠️ AI extraction API error:', response.status);
        return null;
      }

      const data = await response.json();
      const responseText = data.text || '{}';
      console.log('🤖 AI response:', responseText);
      
      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in response');
        return null;
      }

      const extracted = JSON.parse(jsonMatch[0]);
      
      return {
        full_name: extracted.full_name || undefined,
        age: extracted.age ? String(extracted.age) : undefined,
        gender: extracted.gender || undefined,
        phone: extracted.phone || undefined,
        email: extracted.email || undefined,
        address: extracted.address || undefined,
        city: extracted.city || undefined,
        state: extracted.state || undefined,
        pincode: extracted.pincode || undefined,
        blood_group: extracted.blood_group || undefined,
        chief_complaint: extracted.chief_complaint || undefined,
        symptoms: Array.isArray(extracted.symptoms) ? extracted.symptoms.filter(s => s) : [],
        chronic_conditions: Array.isArray(extracted.chronic_conditions) ? extracted.chronic_conditions.filter(s => s) : [],
        allergies: Array.isArray(extracted.allergies) ? extracted.allergies.filter(s => s) : [],
        current_medications: Array.isArray(extracted.current_medications) ? extracted.current_medications.filter(s => s) : [],
      };
    } catch (error) {
      console.warn('⚠️ AI extraction error:', error);
      return null;
    }
  };

  // Fallback regex-based extraction
  const extractFormDataRegex = (userMessages: string): Partial<FormData> => {

    const extracted: Partial<FormData> = {
      chronic_conditions: [],
      allergies: [],
      current_medications: [],
      symptoms: [],
    };

    // Extract name - multiple patterns
    let nameExtracted = false;
    const namePatterns = [
      /(?:name is|i am|i'm|called|my name|this is)\s+([a-zA-Z\s]+?)(?:\.|,|and|$)/i,
      /^([a-zA-Z]+)\s*(?:\.|,|here|$)/im, // First word alone (like "Parth")
      /parth|sharma|(?:[A-Z][a-z]+\s+[A-Z][a-z]+)/i, // Known names or capitalized phrases
    ];
    
    for (const pattern of namePatterns) {
      const match = userMessages.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Validate it's actually a name (not too short, contains letters)
        if (name.length > 2 && /[a-zA-Z]/.test(name)) {
          extracted.full_name = name;
          nameExtracted = true;
          break;
        }
      }
    }
    
    // If still no name, try extracting any capitalized word at the start
    if (!nameExtracted) {
      const firstCapitalMatch = userMessages.match(/\b([A-Z][a-z]+)\b/);
      if (firstCapitalMatch) extracted.full_name = firstCapitalMatch[1];
    }

    // Extract age
    const ageMatch = userMessages.match(/(\d{1,3})\s*(?:years?|yr)?/);
    if (ageMatch) extracted.age = ageMatch[1];

    // Extract gender - handle typos like msle → male
    const genderText = userMessages.toLowerCase();
    if (/male|m[a-z]*le|man|boy|msle/.test(genderText)) {
      extracted.gender = 'Male';
    } else if (/female|f[a-z]*le|woman|girl|fmale|femaile/.test(genderText)) {
      extracted.gender = 'Female';
    } else if (/other/.test(genderText)) {
      extracted.gender = 'Other';
    }

    // Extract phone (10 digits)
    const phoneMatch = userMessages.match(/(\d{10})/);
    if (phoneMatch) extracted.phone = phoneMatch[1];

    // Extract email
    const emailMatch = userMessages.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) extracted.email = emailMatch[1];

    // Extract address - look for all words after "address" or "at" or any long text block
    const addressPatterns = [
      /address[:\s]+([a-zA-Z0-9\s,.-]+?)(?:\.|,|city|at|near|next|\$)/i,
      /apt|apartment|house|flat|plot[:\s]+([a-zA-Z0-9\s,.-]+?)(?:\.|,|city|at|near|\$)/i,
      /(\d+[a-zA-Z0-9\s,.-]+?)(?:vadodara|city|state|near|next)/i,
    ];
    for (const pattern of addressPatterns) {
      const match = userMessages.match(pattern);
      if (match && match[1]) {
        extracted.address = match[1].trim().replace(/\s+/g, ' ');
        break;
      }
    }

    // If still no address, try to capture any text block that mentions apartment/street patterns
    if (!extracted.address) {
      const textBlocks = userMessages.split(/\./);
      for (const block of textBlocks) {
        if (/apartment|flat|house|plot|street|road|lane/i.test(block) && block.length > 10) {
          extracted.address = block.trim().replace(/\s+/g, ' ');
          break;
        }
      }
    }

    // Extract city - Indian cities and common patterns
    const cities = [
      'vadodara', 'ahmedabad', 'surat', 'rajkot',
      'mumbai', 'pune', 'nagpur', 'nashik',
      'delhi', 'delhi ncr', 'gurgaon', 'noida',
      'bangalore', 'hyderabad', 'chennai', 'kolkata'
    ];
    const cityPattern = new RegExp(`\\b(${cities.join('|')})\\b`, 'i');
    const cityMatch = userMessages.match(cityPattern);
    if (cityMatch) extracted.city = cityMatch[1].charAt(0).toUpperCase() + cityMatch[1].slice(1).toLowerCase();

    // Extract state - Indian states
    const states = [
      'gujarat', 'maharashtra', 'karnataka', 'telangana', 'delhi', 
      'punjab', 'tamil nadu', 'uttar pradesh', 'west bengal', 
      'rajasthan', 'bihar', 'haryana', 'goa', 'kerala', 'madhya pradesh'
    ];
    const statePattern = new RegExp(`\\b(${states.join('|')})\\b`, 'i');
    const stateMatch = userMessages.match(statePattern);
    if (stateMatch) extracted.state = stateMatch[1].charAt(0).toUpperCase() + stateMatch[1].slice(1).toLowerCase();

    // Extract pincode (6 digits for India) - be more specific
    const pincodeMatches = userMessages.match(/\b(\d{6})\b/g);
    if (pincodeMatches && pincodeMatches.length > 0) {
      // Use the first 6-digit number found (usually it's near the city)
      extracted.pincode = pincodeMatches[0];
    }

    // Extract blood group
    const bloodGroupMatch = userMessages.match(/\b(a\+|a-|b\+|b-|ab\+|ab-|o\+|o-)\b/i);
    if (bloodGroupMatch) extracted.blood_group = bloodGroupMatch[1].toUpperCase();

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
      new RegExp(`\\b${kw}\\b`, 'i').test(userMessages)
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
      new RegExp(`\\b${kw}\\b`, 'i').test(userMessages)
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
      new RegExp(`\\b${kw}\\b`, 'i').test(userMessages)
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));

    // Extract chief complaint - look for consultation/reason/visit patterns
    const chiefMatch = userMessages.match(/(?:chief complaint|reason|visit|consultation)\s+(?:for|of|is|about)\s+([a-zA-Z\s]+?)(?:\.|,|$)/i);
    if (chiefMatch) extracted.chief_complaint = chiefMatch[1].trim();

    // Extract current medications - both keywords and free text
    const medicationKeywords = [
      'aspirin',
      'ibuprofen',
      'paracetamol',
      'acetaminophen',
      'metformin',
      'lisinopril',
      'amlodipine',
      'atorvastatin',
      'omeprazole',
      'amoxicillin',
      'vitamin',
      'multivitamin',
    ];

    extracted.current_medications = medicationKeywords.filter(kw =>
      new RegExp(`\\b${kw}\\b`, 'i').test(userMessages)
    ).map(s => s.charAt(0).toUpperCase() + s.slice(1));

    // If no keyword match, try to capture any mentioned medication (after "taking" or "on")
    if (extracted.current_medications.length === 0) {
      const medMatch = userMessages.match(/(?:taking|on|using|have)\s+([a-zA-Z0-9\s]+?)(?:\.|,|$)/i);
      if (medMatch) {
        const medText = medMatch[1].trim();
        // Only add if it looks like a medication (not too short and not common words)
        if (medText.length > 2 && !/^(a|an|yes|no)$/i.test(medText)) {
          extracted.current_medications.push(medText);
        }
      }
    }

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
      console.log('📤 Sending message:', userMessage);

      // Get AI response
      console.log('⏳ Waiting for Cohere API response...');
      const response = await aiServiceRef.current.sendMessage(userMessage);
      console.log('✅ Got response:', response);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Speak response
      if (voiceEnabled) {
        speak(response, 'en-IN');
      }

      // Extract form data using AI-based extraction
      console.log('🧠 Starting smart data extraction...');
      const extracted = await extractFormData(aiServiceRef.current);
      console.log('📋 Extracted data:', extracted);
      setFormData(prev => {
        const updated = { ...prev, ...extracted };
        console.log('📝 Updated formData:', updated);
        return updated;
      });
    } catch (error) {
      console.error('❌ Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
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
