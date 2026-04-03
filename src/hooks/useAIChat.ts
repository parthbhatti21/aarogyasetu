import { useState, useCallback, useEffect } from 'react';
import { AIChatService, type ChatMessage, type ExtractedPatientData } from '@/services/aiChatService';
import { getNextStep, isRegistrationComplete, type ConversationStep } from '@/services/conversationFlow';

interface UseAIChatOptions {
  sessionId?: string;
  language?: 'en' | 'hi';
  onDataExtracted?: (data: ExtractedPatientData) => void;
  autoFill?: boolean;
}

export function useAIChat(options: UseAIChatOptions = {}) {
  const { sessionId, language = 'en', onDataExtracted, autoFill = true } = options;
  
  const [chatService] = useState(() => new AIChatService(sessionId, language));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPatientData>({});
  const [currentStep, setCurrentStep] = useState<ConversationStep>('greeting');
  const [isComplete, setIsComplete] = useState(false);

  // Auto-extract data after each message
  useEffect(() => {
    if (autoFill && messages.length > 0) {
      const data = chatService.extractPatientData();
      setExtractedData(data);
      
      if (onDataExtracted) {
        onDataExtracted(data);
      }

      // Check if registration is complete
      if (isRegistrationComplete(data)) {
        setIsComplete(true);
        setCurrentStep('confirmation');
      }
    }
  }, [messages, autoFill, chatService, onDataExtracted]);

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatService.sendMessage(message);
      const history = chatService.getHistory();
      setMessages([...history]);

      // Update current step
      const nextStep = getNextStep(currentStep, extractedData);
      if (nextStep) {
        setCurrentStep(nextStep);
      }

      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [chatService, currentStep, extractedData]);

  const clearChat = useCallback(() => {
    chatService.clearHistory();
    setMessages([]);
    setExtractedData({});
    setCurrentStep('greeting');
    setIsComplete(false);
    setError(null);
  }, [chatService]);

  const setLanguage = useCallback((lang: 'en' | 'hi') => {
    chatService.setLanguage(lang);
  }, [chatService]);

  const saveConversation = useCallback(async (patientId?: string) => {
    try {
      await chatService.saveConversation(patientId);
    } catch (err: any) {
      console.error('Failed to save conversation:', err);
      throw err;
    }
  }, [chatService]);

  const getSessionId = useCallback(() => {
    return chatService.getSessionId();
  }, [chatService]);

  return {
    messages,
    isLoading,
    error,
    extractedData,
    currentStep,
    isComplete,
    sendMessage,
    clearChat,
    setLanguage,
    saveConversation,
    getSessionId,
  };
}
