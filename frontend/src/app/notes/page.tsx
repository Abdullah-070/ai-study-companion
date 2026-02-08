'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Sparkles } from 'lucide-react';
import { notesApi, subjectsApi } from '@/lib/api';
import { Note, Subject } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import CardMenu from '@/components/ui/CardMenu';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { formatDate, truncateText } from '@/lib/utils';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subject_id: '',
    tags: '',
  });
  const [editData, setEditData] = useState({
    title: '',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notesData, subjectsData] = await Promise.all([
        notesApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setNotes(notesData);
      setSubjects(subjectsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.subject_id) return;

    try {
      setSubmitting(true);
      const newNote = await notesApi.create({
        title: formData.title,
        content: formData.content,
        subject_id: parseInt(formData.subject_id),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
      });
      setNotes([newNote, ...notes]);
      setIsModalOpen(false);
      setFormData({ title: '', content: '', subject_id: '', tags: '' });
    } catch (err) {
      setError('Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (note: Note) => {
    setEditingId(note.id);
    setEditData({ title: note.title, content: note.content });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSubmitting(true);
      const updated = await notesApi.update(editingId, editData);
      setNotes(notes.map(n => n.id === editingId ? updated : n));
      setIsEditModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setError('Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await notesApi.delete(id);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      setError('Failed to delete note');
    }
  };

  const filteredNotes = filterSubject
    ? notes.filter(n => n.subject_id === parseInt(filterSubject))
    : notes;

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-gray-500 mt-1">Your study notes and summaries</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredNotes.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
          <p className="text-gray-500 mb-4">Create your first note or generate from a lecture</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div key={note.id}>
              <Card hover className="h-full relative">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Link href={`/notes/${note.id}`} className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                        {note.summary && (
                          <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                    <div className="ml-auto pl-2">
                      <CardMenu
                        onEdit={() => handleEditOpen(note)}
                        onDelete={() => handleDelete(note.id)}
                      />
                    </div>
                  </div>
                  <Link href={`/notes/${note.id}`}>
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {truncateText(note.content, 150)}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">{note.subject_name}</span>
                      <span>{formatDate(note.updated_at)}</span>
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Note" size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Title"
            placeholder="Note title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Textarea
            label="Content"
            placeholder="Write your notes here..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            required
          />
          <Input
            label="Tags (comma-separated)"
            placeholder="e.g., important, exam, chapter-1"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Note'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Note"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
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
            rows={6}
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
