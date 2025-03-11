// Type declarations for Web Speech API
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): SpeechRecognition;
    };
  }
}

let recognition: any = null;

export const isBrowserSupportsSpeech = () => {
  return typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const startVoiceRecording = async (
  onResult: (text: string) => void,
  onError?: (error: any) => void,
  onDebug?: (message: string) => void
) => {
  try {
    if (!isBrowserSupportsSpeech()) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    // Initialize recognition first
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognition = new SpeechRecognition();
    
    // Configure for mobile Chrome
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let hasReceivedResult = false;

    recognition.onstart = () => {
      onDebug?.('Speech recognition started');
      hasReceivedResult = false;
    };

    recognition.onresult = (event: any) => {
      try {
        hasReceivedResult = true;
        const result = event.results[event.results.length - 1];
        if (result && result.isFinal) {
          const transcript = result[0].transcript.trim();
          if (transcript) {
            onDebug?.(`Final transcript: "${transcript}"`);
            onResult(transcript);
          }
        }
      } catch (e) {
        onDebug?.(`Error processing result: ${e}`);
      }
    };

    recognition.onerror = (event: any) => {
      onDebug?.(`Speech recognition error: ${event.error}`);
      
      if (event.error === 'no-speech') {
        onDebug?.('No speech detected');
      } else if (event.error === 'audio-capture') {
        onError?.(new Error('No microphone was found or microphone is not working'));
      } else if (event.error === 'not-allowed') {
        onError?.(new Error('Microphone permission was denied'));
      } else if (event.error === 'network') {
        onError?.(new Error('Network error occurred during speech recognition'));
      } else if (event.error === 'aborted') {
        onDebug?.('Speech recognition was aborted');
      } else {
        onError?.(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      onDebug?.('Speech recognition ended');
      if (!hasReceivedResult) {
        onDebug?.('No results received in this session');
      }
    };

    // Start recognition
    recognition.start();
    onDebug?.('Recording started successfully');
    return true;

  } catch (error) {
    onDebug?.(`Error in startVoiceRecording: ${error}`);
    let errorMessage = 'Failed to start speech recognition';
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings';
          break;
        case 'NotFoundError':
          errorMessage = 'No microphone found. Please check your microphone connection';
          break;
        case 'NotReadableError':
          errorMessage = 'Cannot access your microphone. Please check if another app is using it';
          break;
      }
    }
    onError?.(new Error(errorMessage));
    return false;
  }
};

export const stopVoiceRecording = (onDebug?: (message: string) => void) => {
  if (recognition) {
    try {
      recognition.stop();
      onDebug?.('Stopped speech recognition');
    } catch (error) {
      onDebug?.(`Error stopping recognition: ${error}`);
    } finally {
      recognition = null;
    }
  }
}; 