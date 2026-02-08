'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { lecturesApi, notesApi } from '@/lib/api';
import { Lecture, Note } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { Edit2, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';

export default function LecturePage() {
  const params = useParams();
  const router = useRouter();
  const lectureId = params.id as string;
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', transcription: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const lectureData = await lecturesApi.getById(parseInt(lectureId));
        setLecture(lectureData);
        setEditData({ title: lectureData.title, transcription: lectureData.transcription || '' });
        
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

  const handleEdit = async () => {
    try {
      setSubmitting(true);
      const updated = await lecturesApi.update(parseInt(lectureId), editData);
      setLecture(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update lecture');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lecture?')) {
      return;
    }
    try {
      await lecturesApi.delete(parseInt(lectureId));
      router.push('/lectures');
    } catch (err) {
      setError('Failed to delete lecture');
    }
  };

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
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
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
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="secondary"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

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

      <Button onClick={() => router.back()}>Go Back</Button>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lecture"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEdit(); }} className="p-6 space-y-4">
          <Input
            label="Title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            required
          />
          <Textarea
            label="Transcription"
            value={editData.transcription}
            onChange={(e) => setEditData({ ...editData, transcription: e.target.value })}
            rows={8}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
