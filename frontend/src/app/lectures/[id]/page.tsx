'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { lecturesApi, notesApi } from '@/lib/api';
import { Lecture, Note } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function LecturePage() {
  const params = useParams();
  const lectureId = params.id as string;
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const lectureData = await lecturesApi.getById(parseInt(lectureId));
        setLecture(lectureData);
        
        const notesData = await notesApi.getAll(undefined, parseInt(lectureId));
        setNotes(notesData);
        setError('');
      } catch (err) {
        setError('Failed to load lecture');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (lectureId) {
      loadData();
    }
  }, [lectureId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading lecture...</p>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="p-8">
        <Alert type="error">{error || 'Lecture not found'}</Alert>
        <Button onClick={() => window.history.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{lecture.title}</h1>
        <div className="flex gap-4 text-gray-600 mb-4">
          {lecture.source_type === 'youtube' && lecture.source_url && (
            <a
              href={lecture.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              ▶️ Watch on YouTube
            </a>
          )}
          {lecture.duration_seconds && (
            <span>⏱️ {Math.round(lecture.duration_seconds / 60)} minutes</span>
          )}
        </div>
      </div>

      {lecture.summary && (
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {lecture.summary}
          </p>
        </Card>
      )}

      {lecture.transcription && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Transcription</h2>
          <div className="text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {lecture.transcription}
          </div>
        </Card>
      )}

      {notes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Notes ({notes.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((note) => (
              <Link key={note.id} href={`/notes/${note.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                  <h3 className="font-semibold mb-2">{note.title}</h3>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {note.content}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Button onClick={() => window.history.back()}>Go Back</Button>
    </div>
  );
}
