'use client';

import { useSession } from 'next-auth/react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startVoiceRecording, stopVoiceRecording } from '@/utils/speech';

export default function JournalPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleVoiceInput = () => {
    if (isRecording) {
      stopVoiceRecording();
      setIsRecording(false);
    } else {
      startVoiceRecording(
        (text) => {
          setContent((prev) => prev + ' ' + text);
        },
        (error) => {
          console.error('Voice recognition error:', error);
          setError('Voice recognition failed. Please try again.');
          setIsRecording(false);
        }
      );
      setIsRecording(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Please enter some content for your journal entry');
      return;
    }

    try {
      const res = await fetch('/api/journal/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create journal entry');
      }

      setContent('');
      router.refresh();
    } catch (error) {
      setError('Failed to save journal entry. Please try again.');
    }
  };

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Journal</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            What's on your mind?
          </label>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 min-h-[200px]"
              placeholder="Start writing or use voice input..."
            />
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`absolute bottom-2 right-2 p-2 rounded-full ${
                isRecording ? 'bg-red-500' : 'bg-blue-500'
              } text-white`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                />
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2"
        >
          Save Entry
        </button>
      </form>
    </div>
  );
} 