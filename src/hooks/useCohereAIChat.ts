import { useState, useCallback, useEffect } from 'react';
import { createCohereAIChatService, type ExtractedPatientData } from '@/services/cohereAIService';
import { isRegistrationComplete } from '@/services/conversationFlow';

interface UseCohereAIChatOptions {
  language?: string;
  onDataExtracted?: (data: ExtractedPatientData) => void;
  autoFill?: boolean;
}

export function useCohereAIChat(options: UseCohereAIChatOptions = {}) {
  const { language = 'en-IN', onDataExtracted, autoFill = true } = options;
  
  const [chatService] = useState(() => createCohereAIChatService(language));
  const [messages, setMessages] = useState(chatService.getHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedPatientData>({});
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

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [chatService]);

  const clearChat = useCallback(() => {
    // Re-initialize the chat service
    const newService = createCohereAIChatService(language);
    setMessages(newService.getHistory());
    setExtractedData({});
    setIsComplete(false);
    setError(null);
  }, [language]);

  const setLanguage = useCallback((lang: string) => {
    chatService.setLocale(lang);
  }, [chatService]);

  return {
    messages,
    isLoading,
    error,
    extractedData,
    isComplete,
    sendMessage,
    clearChat,
    setLanguage,
    getSessionId: () => chatService.getSessionId(),
  };
}
