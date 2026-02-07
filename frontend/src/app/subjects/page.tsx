'use client';

import { useState, useEffect } from 'react';
import { Plus, FolderOpen, BookOpen, FileText, Layers, Brain } from 'lucide-react';
import { subjectsApi } from '@/lib/api';
import { Subject } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingPage, LoadingCard } from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { formatDate, generateSubjectColor } from '@/lib/utils';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: generateSubjectColor(),
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsApi.getAll();
      setSubjects(data);
      setError(null);
    } catch (err) {
      setError('Failed to load subjects. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const newSubject = await subjectsApi.create(formData);
      setSubjects([...subjects, newSubject]);
      setIsModalOpen(false);
      setFormData({ name: '', description: '', color: generateSubjectColor() });
    } catch (err) {
      setError('Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete all related materials.')) return;
    
    try {
      await subjectsApi.delete(id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500 mt-1">Organize your study materials by subject</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects yet</h3>
          <p className="text-gray-500 mb-4">Create your first subject to start organizing your studies</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Subject
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <Link key={subject.id} href={`/subjects/${subject.id}`}>
              <Card hover className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: subject.color + '20' }}
                    >
                      <FolderOpen className="h-6 w-6" style={{ color: subject.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{subject.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created {formatDate(subject.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-6 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <BookOpen className="h-4 w-4 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900 mt-1">{subject.lecture_count}</p>
                      <p className="text-xs text-gray-500">Lectures</p>
                    </div>
                    <div className="text-center">
                      <FileText className="h-4 w-4 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900 mt-1">{subject.note_count}</p>
                      <p className="text-xs text-gray-500">Notes</p>
                    </div>
                    <div className="text-center">
                      <Layers className="h-4 w-4 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900 mt-1">{subject.flashcard_set_count}</p>
                      <p className="text-xs text-gray-500">Cards</p>
                    </div>
                    <div className="text-center">
                      <Brain className="h-4 w-4 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900 mt-1">{subject.quiz_count}</p>
                      <p className="text-xs text-gray-500">Quizzes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Subject">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Subject Name"
            placeholder="e.g., Computer Science"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this subject about?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="flex gap-2">
              {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
