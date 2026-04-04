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
    "Hello! I'm here to help you fill out your medical registration form. I'll ask you a few questions to gather your information. Let's start - what's your name?",
  'en-US':
    "Hello! I'm here to help you fill out your medical registration form. I'll ask you a few questions to gather your information. Let's start - what's your name?",
  'hi-IN':
    'नमस्ते! मैं आपका चिकित्सा पंजीकरण फॉर्म भरने में मदद करूंगा। मैं आपके बारे में कुछ सवाल पूछूंगा। शुरुआत करते हैं - आपका नाम क्या है?',
  'ta-IN':
    'வணக்கம்! உங்கள் மருத்துவ பதிவு படிவத்தை நிரப்ப உதவுவேன். உங்கள் பற்றி சில கேள்விகளைக் கேட்டுக்கொள்வேன். ஆரம்பிக்கலாம் - உங்கள் பெயர் என்ன?',
  'te-IN':
    'నమస్కారం! మీ వైద్యుల నమోదు ఫారమ్‌ను పూరించడంలో సహాయం చేస్తాను. మీ గురించి కొన్ని ప్రశ్నలను అడుగుతాను. ఆరంభిద్దాం - మీ పేరు ఏమిటి?',
  'kn-IN':
    'ನಮಸ್ಕಾರ! ಪ್ರವೇಶ ನಮೂದು ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಿಮ್ಮ ಬಗ್ಗೆ ನಾನು ಕೆಲವು ಪ್ರಶ್ನೆ ಕೇಳುತ್ತೇನೆ. ಶುರುವಾಗಿದೆ - ನಿಮ್ಮ ಹೆಸರು ಏನು?',
  'ml-IN':
    'നമസ്കാരം! മെഡിക്കൽ രജിസ്ട്രേഷൻ ഫോം പൂരിപ്പിക്കാൻ ഞാൻ സഹായിക്കും. നിങ്ങളെക്കുറിച്ച് ചില ചോദ്യങ്ങൾ ചോദിക്കും. ആരംഭിക്കാം - നിങ്ങളുടെ പേരെന്ത്?',
  'mr-IN':
    'नमस्कार! मी तुमचा वैद्यकीय नोंदणी फॉर्म भरण्यास मदत करू. तुम्हाला काही प्रश्न विचारु शकतो. सुरु करूया - तुमचे नाव काय आहे?',
  'bn-IN':
    'নমস্কার! আমি আপনার চিকিৎসা নিবন্ধন ফর্ম পূরণ করতে সাহায্য করব। আমি আপনার সম্পর্কে কয়েকটি প্রশ্ন করব। শুরু করি - আপনার নাম কী?',
  'gu-IN':
    'નમસ્તે! મેડિકલ નોંધણી ફોર્મ ભરવામાં આપને મદદ કરીશ. આપના વિશે કેટલાક પ્રશ્નો પૂછીશ. શરુ કરીએ - આપનું નામ શું છે?',
  'pa-IN':
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡੇ ਮੈਡੀਕਲ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਫਾਰਮ ਨੂੰ ਭਰਨ ਵਿੱਚ ਮਦਦ ਕਰਾਂ ਗਾ. ਮੈਂ ਤੁਹਾਡੇ ਬਾਰੇ ਕੁਝ ਸਵਾਲ ਪੁੱਛਾਂ ਗਾ. ਸ਼ੁਰੂ ਕਰੀਏ - ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?',
  'or-IN':
    'ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କୁ ମେଡିକାଲ ରେଜିସ୍ଟ୍ରେସନ ଫର୍ମ ପୂରଣ କରିବାରେ ସାହାଯ୍ୟ କରିବି। ମୁଁ ଆପଣଙ୍କ ବିଷୟରେ ଅଳ୍ପ ଶୋଧନ ପଚାରିବି। ଆରମ୍ଭ କଲେ - ଆପଣଙ୍କ ନାମ କଣ?',
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
    const base = `You are a helpful form-filling assistant. Your job is to collect patient information systematically, NOT to provide medical advice or express concern about their health.

IMPORTANT INSTRUCTIONS:
1. Ask ONE question at a time to gather the following information IN THIS ORDER:
   - Name (if not already provided)
   - Age (years)
   - Gender
   - Phone (10-digit number)
   - Email
   - Address
   - City
   - State
   - Pincode
   - Blood Group
   - Current Symptoms (what they're experiencing)
   - Medical History/Chronic Conditions (any ongoing health issues)
   - Allergies (any medication or food allergies)
   - Current Medications (any medicines they're taking)
   - Chief Complaint (main reason for visit)

2. DO NOT:
   - Ask medical questions about severity, temperature, or diagnosis
   - Express concern or worry about symptoms
   - Give medical advice or recommendations
   - Ask about treatment options
   - Make medical assessments

3. DO:
   - Simply collect the facts the user provides
   - Ask neutral, factual questions only
   - Keep responses short and simple
   - Focus on gathering data, not medical consultation

The patient's preferred language is ${langName} (${this.locale}). Respond in ${langName}.
Keep responses natural and conversational while staying focused on data collection.`;

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

      // Call Cohere API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
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
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

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
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - the API took too long to respond. Please try again.');
      }
      
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
