'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notesApi } from '@/lib/api';
import { Note } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotePage() {
  const params = useParams();
  const noteId = params.id as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const data = await notesApi.getById(parseInt(noteId));
        setNote(data);
        setError('');
      } catch (err) {
        setError('Failed to load note');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading note...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="p-8">
        <Alert type="error">{error || 'Note not found'}</Alert>
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{note.title}</h1>
        <p className="text-gray-500">
          Created: {new Date(note.created_at).toLocaleDateString()}
        </p>
      </div>

      <Card className="mb-8">
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700">
            {note.content}
          </div>
        </div>
      </Card>

      {note.tags && note.tags.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );
}
