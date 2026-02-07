'use client';

import { useState, useEffect } from 'react';
import { Plus, Layers, Sparkles, Play, RotateCcw } from 'lucide-react';
import { flashcardsApi, subjectsApi } from '@/lib/api';
import { FlashcardSet, Subject } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingPage } from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function FlashcardsPage() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'generate'>('create');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    content: '',
    num_cards: 10,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [setsData, subjectsData] = await Promise.all([
        flashcardsApi.getSets(),
        subjectsApi.getAll(),
      ]);
      setFlashcardSets(setsData);
      setSubjects(subjectsData);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: 'create' | 'generate') => {
    setModalType(type);
    setFormData({
      title: '',
      description: '',
      subject_id: subjects[0]?.id.toString() || '',
      content: '',
      num_cards: 10,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id || !formData.title) return;

    try {
      setSubmitting(true);
      let newSet: FlashcardSet;

      if (modalType === 'generate') {
        newSet = await flashcardsApi.generateSet({
          title: formData.title,
          description: formData.description || undefined,
          subject_id: parseInt(formData.subject_id),
          content: formData.content,
          num_cards: formData.num_cards,
        });
      } else {
        newSet = await flashcardsApi.createSet({
          title: formData.title,
          description: formData.description || undefined,
          subject_id: parseInt(formData.subject_id),
        });
      }

      setFlashcardSets([newSet, ...flashcardSets]);
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create flashcard set');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingPage />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flashcards</h1>
          <p className="text-gray-500 mt-1">Study with spaced repetition flashcards</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => openModal('create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Set
          </Button>
          <Button onClick={() => openModal('generate')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {flashcardSets.length === 0 ? (
        <Card className="text-center py-12">
          <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcard sets yet</h3>
          <p className="text-gray-500 mb-4">Create a set manually or generate from your notes</p>
          <Button onClick={() => openModal('generate')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Flashcards
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcardSets.map((set) => (
            <Card key={set.id} hover>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Layers className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-500">{set.card_count} cards</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{set.title}</h3>
                {set.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{set.description}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="px-2 py-1 bg-gray-100 rounded">{set.subject_name}</span>
                  <span>{formatDate(set.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/flashcards/${set.id}/study`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-1" />
                      Study
                    </Button>
                  </Link>
                  <Link href={`/flashcards/${set.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'generate' ? 'Generate Flashcards with AI' : 'Create Flashcard Set'}
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
            label="Title"
            placeholder="e.g., Chapter 5 Vocabulary"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Description (optional)"
            placeholder="What is this set about?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          
          {modalType === 'generate' && (
            <>
              <Textarea
                label="Content to generate from"
                placeholder="Paste your notes, lecture content, or study material here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of cards: {formData.num_cards}
                </label>
                <input
                  type="range"
                  min="5"
                  max="20"
                  value={formData.num_cards}
                  onChange={(e) => setFormData({ ...formData, num_cards: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? modalType === 'generate' ? 'Generating...' : 'Creating...'
                : modalType === 'generate' ? 'Generate Flashcards' : 'Create Set'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
