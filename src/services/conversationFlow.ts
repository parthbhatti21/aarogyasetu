/**
 * Conversation templates and prompts for patient registration
 * Supports multiple languages
 */

export const REGISTRATION_PROMPTS = {
  en: {
    greeting: "Hello! Welcome to Aarogya Setu. I'm here to help you with registration. May I know your name?",
    
    askName: "What is your full name?",
    askAge: "How old are you?",
    askGender: "What is your gender? (Male/Female/Other)",
    askPhone: "What is your mobile number?",
    askEmail: "Would you like to provide your email address? (Optional)",
    askAddress: "What is your address?",
    
    askMedicalHistory: "Do you have any chronic conditions or medical history I should know about?",
    askAllergies: "Are you allergic to any medications or substances?",
    askCurrentMedications: "Are you currently taking any medications?",
    askSymptoms: "What symptoms are you experiencing today?",
    askChiefComplaint: "Can you describe your main health concern or reason for visit?",
    
    confirmData: "Let me confirm the information:\n- Name: {name}\n- Age: {age}\n- Gender: {gender}\n- Phone: {phone}\nIs this correct?",
    
    thankYou: "Thank you! Your registration is complete. Your Patient ID is {patientId} and your token number is {tokenNumber}. Please wait in the virtual waiting room.",
  },
  
  hi: {
    greeting: "नमस्ते! आरोग्य सेतु में आपका स्वागत है। मैं आपके पंजीकरण में मदद करने के लिए यहाँ हूँ। क्या मैं आपका नाम जान सकता हूँ?",
    
    askName: "आपका पूरा नाम क्या है?",
    askAge: "आपकी उम्र कितनी है?",
    askGender: "आपका लिंग क्या है? (पुरुष/महिला/अन्य)",
    askPhone: "आपका मोबाइल नंबर क्या है?",
    askEmail: "क्या आप अपना ईमेल पता देना चाहेंगे? (वैकल्पिक)",
    askAddress: "आपका पता क्या है?",
    
    askMedicalHistory: "क्या आपको कोई पुरानी बीमारी या चिकित्सा इतिहास है जिसके बारे में मुझे पता होना चाहिए?",
    askAllergies: "क्या आपको किसी दवा या पदार्थ से एलर्जी है?",
    askCurrentMedications: "क्या आप वर्तमान में कोई दवा ले रहे हैं?",
    askSymptoms: "आज आप किन लक्षणों का अनुभव कर रहे हैं?",
    askChiefComplaint: "क्या आप अपनी मुख्य स्वास्थ्य चिंता या यात्रा का कारण बता सकते हैं?",
    
    confirmData: "मुझे जानकारी की पुष्टि करने दें:\n- नाम: {name}\n- उम्र: {age}\n- लिंग: {gender}\n- फोन: {phone}\nक्या यह सही है?",
    
    thankYou: "धन्यवाद! आपका पंजीकरण पूरा हो गया है। आपकी रोगी आईडी {patientId} है और आपका टोकन नंबर {tokenNumber} है। कृपया वर्चुअल प्रतीक्षालय में प्रतीक्षा करें।",
  },
};

export const CONVERSATION_STEPS = [
  'greeting',
  'name',
  'age', 
  'gender',
  'contact',
  'medical_history',
  'allergies',
  'medications',
  'symptoms',
  'chief_complaint',
  'confirmation',
  'complete',
] as const;

export type ConversationStep = typeof CONVERSATION_STEPS[number];

/**
 * Get prompt for a specific step and language
 */
export function getPrompt(step: ConversationStep, language: 'en' | 'hi' = 'en'): string {
  const prompts = REGISTRATION_PROMPTS[language];
  
  switch (step) {
    case 'greeting':
      return prompts.greeting;
    case 'name':
      return prompts.askName;
    case 'age':
      return prompts.askAge;
    case 'gender':
      return prompts.askGender;
    case 'contact':
      return prompts.askPhone;
    case 'medical_history':
      return prompts.askMedicalHistory;
    case 'allergies':
      return prompts.askAllergies;
    case 'medications':
      return prompts.askCurrentMedications;
    case 'symptoms':
      return prompts.askSymptoms;
    case 'chief_complaint':
      return prompts.askChiefComplaint;
    default:
      return '';
  }
}

/**
 * Determine next step based on current step and extracted data
 */
export function getNextStep(
  currentStep: ConversationStep,
  extractedData: any
): ConversationStep | null {
  const currentIndex = CONVERSATION_STEPS.indexOf(currentStep);
  
  if (currentIndex === -1 || currentIndex >= CONVERSATION_STEPS.length - 1) {
    return null;
  }
  
  // Skip steps that already have data
  for (let i = currentIndex + 1; i < CONVERSATION_STEPS.length; i++) {
    const step = CONVERSATION_STEPS[i];
    
    // Check if this data is already collected
    if (step === 'name' && !extractedData.full_name) return step;
    if (step === 'age' && !extractedData.age) return step;
    if (step === 'gender' && !extractedData.gender) return step;
    if (step === 'contact' && !extractedData.phone) return step;
    if (step === 'medical_history') return step;
    if (step === 'allergies') return step;
    if (step === 'medications') return step;
    if (step === 'symptoms') return step;
    if (step === 'chief_complaint' && !extractedData.chief_complaint) return step;
    if (step === 'confirmation') return step;
  }
  
  return 'complete';
}

/**
 * Check if all required fields are collected
 */
export function isRegistrationComplete(data: any): boolean {
  return !!(
    data.full_name &&
    data.age &&
    data.gender &&
    data.phone
  );
}
