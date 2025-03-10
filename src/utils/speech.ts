let recognition: SpeechRecognition | null = null;

export const startVoiceRecording = (
  onResult: (text: string) => void,
  onError?: (error: Error) => void
) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    throw new Error('Speech recognition is not supported in this browser');
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  });

  if (onError) {
    recognition.addEventListener('error', onError);
  }

  recognition.start();
};

export const stopVoiceRecording = () => {
  if (recognition) {
    recognition.stop();
    recognition.removeEventListener('result', () => {});
    recognition.removeEventListener('error', () => {});
    recognition = null;
  }
}; 