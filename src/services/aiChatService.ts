import { supabase } from '../utils/supabase';
import type { AIMessage } from '../types/database';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  metadata?: {
    finishReason?: string;
    citations?: any[];
  };
}

export interface ExtractedPatientData {
  full_name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  blood_group?: string;
  chronic_conditions?: string[];
  allergies?: string[];
  current_medications?: string[];
  symptoms?: string[];
  chief_complaint?: string;
}

/**
 * AI Chat Service for Patient Registration
 * Communicates with Cohere API via Supabase Edge Function
 */
export class AIChatService {
  private sessionId: string;
  private conversationHistory: ChatMessage[] = [];
  private language: string = 'en';
  private edgeFunctionUrl: string;

  constructor(sessionId?: string, language: string = 'en') {
    this.sessionId = sessionId || this.generateSessionId();
    this.language = language;
    this.edgeFunctionUrl = import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL || 
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Send message to AI and get response
   */
  async sendMessage(message: string): Promise<ChatResponse> {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call Supabase Edge Function
      const response = await fetch(`${this.edgeFunctionUrl}/cohere-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory.map(msg => ({
            role: msg.role,
            message: msg.content,
          })),
          language: this.language,
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI request failed');
      }

      // Update conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      this.conversationHistory.push({
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      });

      return {
        message: data.message,
        sessionId: data.sessionId || this.sessionId,
        metadata: data.metadata,
      };
    } catch (error) {
      console.error('AI Chat error:', error);
      throw error;
    }
  }

  /**
   * Extract structured patient data from conversation
   * Uses pattern matching and NLP to extract fields
   */
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

    // Extract email
    const emailMatch = conversationText.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
    if (emailMatch) {
      extracted.email = emailMatch[1];
    }

    // Extract blood group
    const bloodMatch = conversationText.match(/blood\s+(?:group|type)\s+(?:is\s+)?([abo]+[+-])/i);
    if (bloodMatch) {
      extracted.blood_group = bloodMatch[1].toUpperCase();
    }

    // Extract symptoms (common keywords)
    const symptomKeywords = ['fever', 'cough', 'cold', 'headache', 'pain', 'vomiting', 
      'diarrhea', 'weakness', 'dizziness', 'nausea', 'fatigue', 'shortness of breath'];
    
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
    }

    // Extract allergies
    const allergyMatch = conversationText.match(/allergic to\s+([a-z,\s]+?)(?:\.|and|i|my|$)/i);
    if (allergyMatch) {
      extracted.allergies = allergyMatch[1].split(',').map(a => a.trim());
    }

    // Extract medications
    const medMatch = conversationText.match(/taking\s+(?:medication|medicine|drug)?\s*([a-z,\s]+?)(?:\.|and|for|i|my|$)/i);
    if (medMatch) {
      extracted.current_medications = medMatch[1].split(',').map(m => m.trim());
    }

    return extracted;
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Set language for conversation
   */
  setLanguage(lang: string): void {
    this.language = lang;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Capitalize first letter of each word
   */
  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Save conversation to database manually (Edge Function does this automatically)
   */
  async saveConversation(patientId?: string): Promise<void> {
    try {
      const { error } = await supabase.from('ai_conversations').insert({
        session_id: this.sessionId,
        patient_id: patientId,
        messages: this.conversationHistory as unknown as AIMessage[],
        language: this.language,
        extracted_data: this.extractPatientData(),
        completed: true,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save conversation:', error);
      throw error;
    }
  }

  /**
   * Load existing conversation from database
   */
  async loadConversation(sessionId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;

      if (data) {
        this.sessionId = data.session_id;
        this.conversationHistory = data.messages as unknown as ChatMessage[];
        this.language = data.language || 'en';
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      throw error;
    }
  }
}

/**
 * Helper function to create a new AI chat instance
 */
export function createAIChatService(sessionId?: string, language?: string): AIChatService {
  return new AIChatService(sessionId, language);
}
