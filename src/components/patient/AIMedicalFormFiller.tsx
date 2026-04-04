import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createCohereAIChatService, type CohereAIChatService } from '@/services/cohereAIService';
import { Send, Sparkles, Zap, Copy, Check } from 'lucide-react';

interface MedicalForm {
  chronic_conditions: string[];
  allergies: string[];
  current_medications: string[];
}

interface AIMedicalFormFillerProps {
  onFormFilled?: (formData: MedicalForm) => void;
}

export function AIMedicalFormFiller({ onFormFilled }: AIMedicalFormFillerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedForm, setExtractedForm] = useState<MedicalForm>({
    chronic_conditions: [],
    allergies: [],
    current_medications: [],
  });
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiServiceRef = useRef<CohereAIChatService | null>(null);

  // Initialize AI service
  useEffect(() => {
    if (isOpen && !aiServiceRef.current) {
      aiServiceRef.current = createCohereAIChatService('en-IN');
      
      // Set a custom greeting for medical form filling
      const greeting = `I'll help you fill out your medical information. Let's start with a few quick questions:

1. Do you have any chronic conditions (like diabetes, hypertension, asthma)?
2. Any allergies to medications or substances?
3. Any current medications you're taking?

Let's begin!`;

      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract form data from conversation
  const extractFormData = (service: CohereAIChatService): MedicalForm => {
    const history = service.getHistory();
    const conversationText = history
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    const extracted: MedicalForm = {
      chronic_conditions: [],
      allergies: [],
      current_medications: [],
    };

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

    chronicKeywords.forEach(keyword => {
      if (conversationText.includes(keyword)) {
        extracted.chronic_conditions.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

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
      'dust',
    ];

    allergyKeywords.forEach(keyword => {
      if (conversationText.includes(keyword)) {
        extracted.allergies.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    // Extract medications (look for patterns like "taking X" or "medicine X")
    const medicationPatterns = [
      /(?:taking|take|on|using|use)\s+([a-zA-Z0-9\s]+?)(?:\.|,|for|to|and|or|$)/gi,
    ];

    medicationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(conversationText)) !== null) {
        const med = match[1].trim();
        if (med.length > 2 && med.length < 50 && !extracted.current_medications.includes(med)) {
          extracted.current_medications.push(med);
        }
      }
    });

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

      // Add AI response
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Extract form data
      const formData = extractFormData(aiServiceRef.current);
      setExtractedForm(formData);
    } catch (error) {
      console.error('Error in medical form filler:', error);
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

  const handleUseForm = () => {
    if (onFormFilled) {
      onFormFilled(extractedForm);
    }
    setIsOpen(false);
  };

  const copyToClipboard = () => {
    const text = `
Chronic Conditions: ${extractedForm.chronic_conditions.join(', ') || 'None'}
Allergies: ${extractedForm.allergies.join(', ') || 'None'}
Current Medications: ${extractedForm.current_medications.join(', ') || 'None'}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="outline"
      >
        <Sparkles className="h-4 w-4" />
        AI Form Filler
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] flex flex-col shadow-lg z-50 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Medical Form</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-gray-500"
        >
          ✕
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Extracted Form Data */}
      {(extractedForm.chronic_conditions.length > 0 ||
        extractedForm.allergies.length > 0 ||
        extractedForm.current_medications.length > 0) && (
        <div className="p-3 bg-green-50 border-t">
          <div className="text-xs space-y-1">
            {extractedForm.chronic_conditions.length > 0 && (
              <div>
                <span className="font-semibold text-green-900">Conditions:</span>{' '}
                <span className="text-green-800">{extractedForm.chronic_conditions.join(', ')}</span>
              </div>
            )}
            {extractedForm.allergies.length > 0 && (
              <div>
                <span className="font-semibold text-green-900">Allergies:</span>{' '}
                <span className="text-green-800">{extractedForm.allergies.join(', ')}</span>
              </div>
            )}
            {extractedForm.current_medications.length > 0 && (
              <div>
                <span className="font-semibold text-green-900">Medications:</span>{' '}
                <span className="text-green-800">{extractedForm.current_medications.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder="Tell me about your health..."
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !userInput.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {(extractedForm.chronic_conditions.length > 0 ||
            extractedForm.allergies.length > 0 ||
            extractedForm.current_medications.length > 0) && (
            <>
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
              <Button
                onClick={handleUseForm}
                size="sm"
                className="flex-1 gap-1"
              >
                <Zap className="h-4 w-4" />
                Use Data
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
