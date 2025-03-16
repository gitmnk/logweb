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
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

let recognition: SpeechRecognition | null = null;
let globalRetryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const isBrowserSupportsSpeech = () => {
  return typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);
};

const isLocalhost = () => {
  return typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');
};

const isSecureContext = () => {
  if (isLocalhost()) {
    // Allow localhost to bypass secure context check
    return true;
  }
  return typeof window !== 'undefined' && 
    (window.isSecureContext || window.location.protocol === 'https:');
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

    // Check for secure context
    if (!isSecureContext()) {
      throw new Error('Speech recognition requires HTTPS. Please use a secure connection.');
    }

    // Stop any existing recognition
    if (recognition) {
      try {
        recognition.stop();
        recognition.abort();
      } catch (e) {
        // Ignore errors during cleanup
      }
      recognition = null;
    }

    // Initialize recognition first
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition is not supported');
    }
    
    recognition = new SpeechRecognition();
    if (!recognition) {
      throw new Error('Failed to create speech recognition instance');
    }
    
    // Configure based on environment
    recognition.lang = 'en-US';
    if (isLocalhost()) {
      // Use more aggressive settings for localhost
      recognition.continuous = false; // Single recognition per session
      recognition.interimResults = false; // Only final results
    } else {
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Get faster feedback
    }
    recognition.maxAlternatives = 1;

    let hasReceivedResult = false;
    let retryTimeout: NodeJS.Timeout | null = null;

    recognition.onstart = () => {
      onDebug?.('Speech recognition started');
      hasReceivedResult = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
    };

    recognition.onresult = (event: any) => {
      try {
        hasReceivedResult = true;
        const results = event.results;
        let finalTranscript = '';

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          }
        }

        finalTranscript = finalTranscript.trim();
        if (finalTranscript) {
          onDebug?.(`Final transcript: "${finalTranscript}"`);
          onResult(finalTranscript);
          globalRetryCount = 0; // Reset retry count on success
        }
      } catch (e) {
        onDebug?.(`Error processing result: ${e}`);
      }
    };

    recognition.onerror = async (event: any) => {
      if (!recognition) return;
      
      onDebug?.(`Speech recognition error: ${event.error}`);
      
      if (event.error === 'network') {
        if (isLocalhost()) {
          onError?.(new Error('Network error: Please use HTTPS or run Chrome with web security disabled for local development.'));
          return;
        }
        
        globalRetryCount++;
        onDebug?.(`Network error (attempt ${globalRetryCount}/${MAX_RETRIES})`);
        
        if (globalRetryCount < MAX_RETRIES) {
          onDebug?.('Waiting before retry...');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          if (recognition) {
            try {
              recognition.abort(); // Try to abort current session
              recognition.start();
              onDebug?.('Restarted recognition after network error');
            } catch (e) {
              onDebug?.(`Failed to restart after network error: ${e}`);
              onError?.(new Error(`Network error in speech recognition (attempt ${globalRetryCount}/${MAX_RETRIES})`));
            }
          }
        } else {
          onError?.(new Error('Network error: Please check your internet connection and try again'));
          globalRetryCount = 0; // Reset for next attempt
        }
      } else if (event.error === 'no-speech') {
        onDebug?.('No speech detected');
      } else if (event.error === 'audio-capture') {
        onError?.(new Error('No microphone was found or microphone is not working'));
      } else if (event.error === 'not-allowed') {
        onError?.(new Error('Microphone permission was denied'));
      } else if (event.error === 'aborted') {
        onDebug?.('Speech recognition was aborted');
      } else {
        onError?.(new Error(`Speech recognition error: ${event.error}`));
      }
    };

    recognition.onend = () => {
      onDebug?.('Speech recognition ended');
      if (!hasReceivedResult && globalRetryCount === 0) {
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
      globalRetryCount = 0; // Reset retry count
    }
  }
}; 