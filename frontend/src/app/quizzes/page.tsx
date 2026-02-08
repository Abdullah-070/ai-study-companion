'use client';

import { useState, useEffect } from 'react';
import { Plus, Brain, Sparkles, Play, Trophy, Clock } from 'lucide-react';
import { quizzesApi, subjectsApi } from '@/lib/api';
import { Quiz, Subject } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import CardMenu from '@/components/ui/CardMenu';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    content: '',
    num_questions: 5,
    question_types: ['multiple_choice', 'true_false', 'short_answer'],
  });
  const [editData, setEditData] = useState({
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesData, subjectsData] = await Promise.all([
        quizzesApi.getAll(),
        subjectsApi.getAll(),
      ]);
      setQuizzes(quizzesData);
      setSubjects(subjectsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.title || !formData.content) return;

    try {
      setSubmitting(true);
      const newQuiz = await quizzesApi.generate({
        title: formData.title,
        description: formData.description || undefined,
        subject_id: parseInt(formData.subject_id),
        content: formData.content,
        num_questions: formData.num_questions,
        question_types: formData.question_types,
      });
      setQuizzes([newQuiz, ...quizzes]);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditOpen = (quiz: Quiz) => {
    setEditingId(quiz.id);
    setEditData({ title: quiz.title, description: quiz.description || '' });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSubmitting(true);
      const updated = await quizzesApi.update(editingId, editData);
      setQuizzes(quizzes.map(q => q.id === editingId ? updated : q));
      setIsEditModalOpen(false);
      setEditingId(null);
    } catch (err) {
      setError('Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await quizzesApi.delete(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  const toggleQuestionType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      question_types: prev.question_types.includes(type)
        ? prev.question_types.filter(t => t !== type)
        : [...prev.question_types, type],
    }));
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-500 mt-1">Test your knowledge with AI-generated quizzes</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Quiz
        </Button>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {quizzes.length === 0 ? (
        <Card className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
          <p className="text-gray-500 mb-4">Generate quizzes from your study materials</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Quiz
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id}>
              <Card hover>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{quiz.question_count} questions</span>
                      <CardMenu
                        onEdit={() => handleEditOpen(quiz)}
                        onDelete={() => handleDelete(quiz.id)}
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{quiz.title}</h3>
                  {quiz.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{quiz.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="px-2 py-1 bg-gray-100 rounded">{quiz.subject_name}</span>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-3 w-3" />
                      <span>{quiz.attempt_count} attempts</span>
                    </div>
                  </div>
                  <Link href={`/quizzes/${quiz.id}`}>
                    <Button variant="primary" size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-1" />
                      Take Quiz
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Quiz with AI"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <Input
            label="Quiz Title"
            placeholder="e.g., Chapter 3 Review Quiz"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What topics does this quiz cover?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Textarea
            label="Content to generate from"
            placeholder="Paste your notes, lecture content, or study material here..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Question Types</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'multiple_choice', label: 'Multiple Choice' },
                { value: 'true_false', label: 'True/False' },
                { value: 'short_answer', label: 'Short Answer' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleQuestionType(type.value)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    formData.question_types.includes(type.value)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of questions: {formData.num_questions}
            </label>
            <input
              type="range"
              min="3"
              max="15"
              value={formData.num_questions}
              onChange={(e) => setFormData({ ...formData, num_questions: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || formData.question_types.length === 0}>
              {submitting ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Quiz"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              placeholder="Quiz title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Quiz description (optional)"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
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
