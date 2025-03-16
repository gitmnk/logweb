'use client';

import { useState, useEffect } from 'react';
import { FaMicrophone, FaStop } from 'react-icons/fa';
import AudioLevelIndicator from './AudioLevelIndicator';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

const VoiceInput = ({ onTranscript }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');
          onTranscript(transcript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognition);
      }
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleAudioLevel = (level: number) => {
    setAudioLevel(level);
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={toggleListening}
        className={`p-3 rounded-full ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white transition-colors relative`}
        title={isListening ? 'Stop recording' : 'Start recording'}
      >
        {isListening ? <FaStop size={20} /> : <FaMicrophone size={20} />}
        {isListening && audioLevel > 10 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>
      
      <div className="flex-grow max-w-[100px]">
        <AudioLevelIndicator 
          isListening={isListening} 
          onLevelUpdate={handleAudioLevel}
        />
      </div>
    </div>
  );
};

export default VoiceInput; 