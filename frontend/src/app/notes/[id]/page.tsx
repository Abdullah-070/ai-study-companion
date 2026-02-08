'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notesApi } from '@/lib/api';
import { Note } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadNote = async () => {
      try {
        setLoading(true);
        const data = await notesApi.getById(parseInt(noteId));
        setNote(data);
        setEditData({ title: data.title, content: data.content });
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

  const handleEdit = async () => {
    try {
      setSubmitting(true);
      const updated = await notesApi.update(parseInt(noteId), editData);
      setNote(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    try {
      await notesApi.delete(parseInt(noteId));
      router.push('/notes');
    } catch (err) {
      setError('Failed to delete note');
    }
  };

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
            <h1 className="text-4xl font-bold mb-2">{note.title}</h1>
            <p className="text-gray-500">
              Created: {new Date(note.created_at).toLocaleDateString()}
            </p>
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

      <Button onClick={() => router.back()}>Go Back</Button>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Note"
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
            label="Content"
            value={editData.content}
            onChange={(e) => setEditData({ ...editData, content: e.target.value })}
            rows={10}
            required
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
