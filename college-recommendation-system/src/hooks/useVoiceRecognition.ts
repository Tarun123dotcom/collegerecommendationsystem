import { useState, useEffect, useCallback } from 'react';

// Define Speech Recognition interfaces
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  error?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Extend Window interface to include Speech Recognition
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
}

export const useVoiceRecognition = ({ onResult, onError }: UseVoiceRecognitionProps) => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    error: null
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      // Check if constructor exists before using it
      if (SpeechRecognitionConstructor) {
        try {
          const recognitionInstance = new SpeechRecognitionConstructor();
          
          recognitionInstance.continuous = false;
          recognitionInstance.interimResults = false;
          recognitionInstance.lang = 'en-US';

          recognitionInstance.onstart = () => {
            setState(prev => ({ ...prev, isListening: true, error: null }));
          };

          recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            setState(prev => ({ ...prev, isListening: false }));
          };

          recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
            let errorMessage = 'Voice recognition failed. Please try again.';

            switch(event.error) {
              case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
              case 'audio-capture':
                errorMessage = 'Audio capture failed. Please check your microphone.';
                break;
              case 'not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access.';
                break;
              case 'network':
                errorMessage = 'Network error. Please check your connection.';
                break;
              default:
                errorMessage = `Voice recognition error: ${event.error}`;
            }

            setState(prev => ({ 
              ...prev, 
              isListening: false, 
              error: errorMessage 
            }));
            
            if (onError) {
              onError(errorMessage);
            }
          };

          recognitionInstance.onend = () => {
            setState(prev => ({ ...prev, isListening: false }));
          };

          setRecognition(recognitionInstance);
          setState(prev => ({ ...prev, isSupported: true }));
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            isSupported: false, 
            error: 'Failed to initialize speech recognition.' 
          }));
        }
      } else {
        setState(prev => ({ 
          ...prev, 
          isSupported: false, 
          error: 'Speech recognition constructor not available.' 
        }));
      }
    } else {
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        error: 'Speech recognition is not supported in this browser.' 
      }));
    }
  }, [onResult, onError]);

  const startListening = useCallback(() => {
    if (recognition && state.isSupported) {
      try {
        recognition.start();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to start voice recognition.' 
        }));
      }
    }
  }, [recognition, state.isSupported]);

  const stopListening = useCallback(() => {
    if (recognition && state.isListening) {
      recognition.stop();
    }
  }, [recognition, state.isListening]);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [state.isListening, startListening, stopListening]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearError
  };
};