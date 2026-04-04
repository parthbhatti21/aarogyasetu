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

const LOCALE_GREETINGS: Record<string, string> = {
  'en-IN':
    "Hello! I'm your AI health assistant. Please tell me about your symptoms or health concerns today.",
  'en-US':
    "Hello! I'm your AI health assistant. Please tell me about your symptoms or health concerns today.",
  'hi-IN':
    'नमस्ते! मैं आपका AI स्वास्थ्य सहायक हूँ। कृपया अपने लक्षण या स्वास्थ्य संबंधी चिंताएँ बताएँ।',
  'ta-IN':
    'வணக்கம்! நான் உங்கள் AI உடல்நல உதவியாளர். உங்கள் அறிகுறிகள் அல்லது உடல்நலக் கவலைகளைச் சொல்லுங்கள்.',
  'te-IN':
    'నమస్కారం! నేను మీ AI ఆరోగ్య సహాయకుడిని. దయచేసి మీ లక్షణాలు లేదా ఆరోగ్య సమస్యల గురించి చెప్పండి.',
  'kn-IN':
    'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಲಕ್ಷಣಗಳು ಅಥವಾ ಆರೋಗ್ಯ ಕಾಳಜಿಗಳ ಬಗ್ಗೆ ಹೇಳಿ.',
  'ml-IN':
    'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ AI ആരോഗ്യ സഹായി. നിങ്ങളുടെ ലക്ഷണങ്ങളോ ആരോഗ്യ ആശങ്കകളോ പറയുക.',
  'mr-IN':
    'नमस्कार! मी तुमचा AI आरोग्य सहाय्यक आहे. कृपया तुमची लक्षणे किंवा आरोग्यासंबंधी चिंता सांगा.',
  'bn-IN':
    'নমস্কার! আমি আপনার AI স্বাস্থ্য সহায়ক। আপনার উপসর্গ বা স্বাস্থ্য নিয়ে উদ্বেগ জানান।',
  'gu-IN':
    'નમસ્તે! હું તમારો AI આરોગ્ય સહાયક છું. કૃપા કરીને તમારા લક્ષણો અથવા આરોગ્ય ચિંતાઓ જણાવો.',
  'pa-IN':
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ AI ਸਿਹਤ ਸਹਾਇਕ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਲੱਛਣ ਜਾਂ ਸਿਹਤ ਸੰਬੰਧੀ ਚਿੰਤਾਵਾਂ ਦੱਸੋ।',
  'or-IN':
    'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର AI ସ୍ୱାସ୍ଥ୍ୟ ସହାୟକ। ଦୟାକରି ଆପଣଙ୍କ ଲକ୍ଷଣ କିମ୍ବା ସ୍ୱାସ୍ଥ୍ୟ ଚିନ୍ତା କୁହନ୍ତୁ।',
};

const LOCALE_NAMES: Record<string, string> = {
  'en-IN': 'English (India)',
  'en-US': 'English (US)',
  'hi-IN': 'Hindi',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'mr-IN': 'Marathi',
  'bn-IN': 'Bengali',
  'gu-IN': 'Gujarati',
  'pa-IN': 'Punjabi',
  'or-IN': 'Odia',
};

export class CohereAIChatService {
  private conversationHistory: ChatMessage[] = [];
  private sessionId: string;
  private locale: string;

  constructor(locale = 'en-IN') {
    this.locale = locale;
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const greeting =
      LOCALE_GREETINGS[this.locale] || LOCALE_GREETINGS['en-IN'];

    this.conversationHistory.push({
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString(),
    });
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  getLocale(): string {
    return this.locale;
  }

  private buildPreamble(): string {
    const langName = LOCALE_NAMES[this.locale] || 'English';
    const base = `You are a helpful medical assistant helping patients describe their symptoms. ask one question at a time.
Ask clarifying questions about their symptoms, duration, severity, and any other relevant health information.
Be empathetic and professional. Keep responses concise and focused on gathering medical information.
After gathering enough information, summarize the chief complaint and symptoms in a clear, structured way. Give a simple response without extra explanation or symbols when possible.
The patient's preferred language is ${langName} (${this.locale}). Respond in ${langName} so they can use voice playback in that language. If they write in another language, still reply in ${langName}.`;

    return base;
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
          preamble: this.buildPreamble(),
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

    // Extract symptoms (keywords in full conversation)
    const symptomKeywords = ['fever', 'cough', 'cold', 'headache', 'pain', 'vomiting',
      'diarrhea', 'weakness', 'dizziness', 'nausea', 'fatigue', 'shortness of breath',
      'sore throat', 'body ache', 'chest pain', 'stomach pain', 'flu', 'chills', 'rash'];

    const foundSymptoms = symptomKeywords.filter((symptom) =>
      new RegExp(`\\b${symptom}\\b`, 'i').test(conversationText)
    );

    if (foundSymptoms.length > 0) {
      extracted.symptoms = foundSymptoms.map((s) => this.capitalizeWords(s));
      // Short queue label: primary symptoms only, not full chat transcript
      extracted.chief_complaint = foundSymptoms
        .slice(0, 3)
        .map((s) => this.capitalizeWords(s))
        .join(', ');
    } else {
      // No keyword hit: one-line summary from first substantive user message (not raw questionnaire dumps)
      const userMsgs = this.conversationHistory.filter((m) => m.role === 'user');
      const first = userMsgs[0];
      if (first) {
        const line = first.content.replace(/\s+/g, ' ').trim();
        extracted.chief_complaint = line.length > 72 ? `${line.slice(0, 69)}…` : line;
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

export function createCohereAIChatService(locale = 'en-IN'): CohereAIChatService {
  return new CohereAIChatService(locale);
}
