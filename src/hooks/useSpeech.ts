import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const {
    language = 'en-IN',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart + ' ';
          } else {
            interimText += transcriptPart;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          if (onResult) {
            onResult(finalTranscript.trim(), true);
          }
        }

        if (interimText) {
          setInterimTranscript(interimText);
          if (onResult && interimResults) {
            onResult(interimText, false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        const errorMessage = `Speech recognition error: ${event.error}`;
        setError(errorMessage);
        setIsListening(false);
        
        if (onError) {
          onError(event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, continuous, interimResults, onResult, onError]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported');
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        if (err.message.includes('already started')) {
          // Already listening, ignore
        } else {
          setError(err.message);
        }
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  };
}

// Text-to-Speech hook
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setIsSupported(false);
    }
  }, []);

  const speak = useCallback((text: string, language: string = 'en-IN') => {
    if (!isSupported) {
      console.error('Speech synthesis is not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Try to find a voice for the specified language
    const voice = voices.find(v => v.lang.startsWith(language.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking]);

  const resume = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.resume();
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    voices,
    speak,
    cancel,
    pause,
    resume,
  };
}
