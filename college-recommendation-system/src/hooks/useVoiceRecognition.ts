import { useState, useEffect, useCallback } from 'react';
import { VoiceRecognitionState } from '../types';

interface UseVoiceRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecognition = ({ onResult, onError }: UseVoiceRecognitionProps) => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setState(prev => ({ ...prev, isListening: true }));
      };
      
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        let errorMessage = 'Voice recognition failed. Please try again.';
        
        switch(event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
        }
        
        setState(prev => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      };
      
      recognitionInstance.onend = () => {
        setState(prev => ({ ...prev, isListening: false }));
      };
      
      setRecognition(recognitionInstance);
      setState(prev => ({ ...prev, isSupported: true }));
    } else {
      setState(prev => ({ ...prev, isSupported: false }));
    }
  }, [onResult, onError]);

  const startListening = useCallback(() => {
    if (recognition && state.isSupported) {
      try {
        recognition.start();
      } catch (error) {
        setState(prev => ({ ...prev, error: 'Failed to start voice recognition' }));
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
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    toggleListening,
    clearError,
  };
};
