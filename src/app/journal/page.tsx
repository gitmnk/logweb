'use client';

import { useSession } from 'next-auth/react';
import { FormEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startVoiceRecording, stopVoiceRecording } from '@/utils/speech';

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
}

export default function JournalPage() {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal/entries');
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (entryId: string) => {
    try {
      const res = await fetch(`/api/journal/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
        }),
      });

      if (!res.ok) throw new Error('Failed to update entry');
      
      setEditingId(null);
      setEditContent('');
      fetchEntries();
    } catch (error) {
      console.error('Failed to update entry:', error);
      setError('Failed to update entry. Please try again.');
    }
  };

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
      fetchEntries();
    } catch (error) {
      setError('Failed to save journal entry. Please try again.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto font-['Helvetica']">
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

      <div className="space-y-8">
        <h2 className="text-2xl font-semibold mb-4">Previous Entries</h2>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="border-b pb-6"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="text-sm text-gray-500 md:w-56 shrink-0">
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex-grow">
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 min-h-[150px]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative">
                    <div className="whitespace-pre-wrap">{entry.content}</div>
                    <button
                      onClick={() => handleEdit(entry)}
                      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-2 rounded hover:bg-gray-200"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        className="w-4 h-4"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth="2" 
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-gray-500 text-center py-4">No entries yet. Start journaling!</p>
        )}
      </div>
    </div>
  );
} 