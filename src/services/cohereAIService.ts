// Hardcoded Cohere AI Chat Service
// Direct integration with Cohere API without Supabase

const COHERE_API_KEY = 'eeW4xQr5CnWGYdRsyAyQ072sHhUU1TFPZ9ZAkufa';
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ExtractedPatientData {
  full_name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  symptoms?: string[];
  chief_complaint?: string;
}

export class CohereAIChatService {
  private conversationHistory: ChatMessage[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Initial greeting from assistant
    this.conversationHistory.push({
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. Please tell me about your symptoms or health concerns today.',
      timestamp: new Date().toISOString(),
    });
  }

  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      // Prepare chat history for Cohere
      const chatHistory = this.conversationHistory
        .slice(0, -1) // Exclude the current user message
        .map(msg => ({
          role: msg.role === 'user' ? 'USER' : 'CHATBOT',
          message: msg.content,
        }));

      // Call Cohere API
      const response = await fetch(COHERE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chat_history: chatHistory,
          model: 'command-a-03-2025',
          temperature: 0.7,
          preamble: `You are a helpful medical assistant helping patients describe their symptoms. 
Ask clarifying questions about their symptoms, duration, severity, and any other relevant health information.
Be empathetic and professional. Keep responses concise and focused on gathering medical information.
After gathering enough information, summarize the chief complaint and symptoms in a clear, structured way. give simple response without any explanation or any other text and symbols or any other characters`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.text || 'I apologize, I didn\'t get a response. Could you try again?';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
      });

      return assistantMessage;
    } catch (error) {
      console.error('Cohere API error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response');
    }
  }

  extractPatientData(): ExtractedPatientData {
    const extracted: ExtractedPatientData = {};
    const conversationText = this.conversationHistory
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();

    // Extract name
    const nameMatch = conversationText.match(/(?:my name is|i am|i'm|called)\s+([a-z\s]+?)(?:\.|,|and|i|my|$)/i);
    if (nameMatch) {
      extracted.full_name = this.capitalizeWords(nameMatch[1].trim());
    }

    // Extract age
    const ageMatch = conversationText.match(/(?:age|i am|i'm)\s+(\d{1,3})\s*(?:years?|yr|old)?/i);
    if (ageMatch) {
      extracted.age = parseInt(ageMatch[1]);
    }

    // Extract gender
    if (/(male|man|boy)/i.test(conversationText)) {
      extracted.gender = 'Male';
    } else if (/(female|woman|girl)/i.test(conversationText)) {
      extracted.gender = 'Female';
    }

    // Extract phone (10 digits)
    const phoneMatch = conversationText.match(/(\d{10})/);
    if (phoneMatch) {
      extracted.phone = phoneMatch[1];
    }

    // Extract symptoms
    const symptomKeywords = ['fever', 'cough', 'cold', 'headache', 'pain', 'vomiting', 
      'diarrhea', 'weakness', 'dizziness', 'nausea', 'fatigue', 'shortness of breath',
      'sore throat', 'body ache', 'chest pain', 'stomach pain'];
    
    const foundSymptoms = symptomKeywords.filter(symptom => 
      new RegExp(`\\b${symptom}\\b`, 'i').test(conversationText)
    );
    
    if (foundSymptoms.length > 0) {
      extracted.symptoms = foundSymptoms.map(s => this.capitalizeWords(s));
    }

    // Extract chief complaint (first user message mentioning symptoms)
    const firstUserMessage = this.conversationHistory.find(msg => 
      msg.role === 'user' && symptomKeywords.some(s => new RegExp(`\\b${s}\\b`, 'i').test(msg.content))
    );
    
    if (firstUserMessage) {
      extracted.chief_complaint = firstUserMessage.content;
    } else {
      // Fallback to first user message
      const firstMsg = this.conversationHistory.find(msg => msg.role === 'user');
      if (firstMsg) {
        extracted.chief_complaint = firstMsg.content;
      }
    }

    return extracted;
  }

  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }
}

export function createCohereAIChatService(): CohereAIChatService {
  return new CohereAIChatService();
}
