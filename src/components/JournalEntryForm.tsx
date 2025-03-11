'use client';

import { useState } from 'react';
import VoiceInput from './VoiceInput';

const JournalEntryForm = () => {
  const [content, setContent] = useState('');

  const handleVoiceTranscript = (transcript: string) => {
    setContent(prev => prev + ' ' + transcript);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 border rounded-md min-h-[200px]"
          placeholder="Write your journal entry..."
        />
        <VoiceInput onTranscript={handleVoiceTranscript} />
      </div>
      {/* Add your form submission logic here */}
    </div>
  );
};

export default JournalEntryForm; 