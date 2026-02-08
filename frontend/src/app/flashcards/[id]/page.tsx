'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { flashcardsApi } from '@/lib/api';
import { FlashcardSet, Flashcard } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';

export default function FlashcardSetPage() {
  const params = useParams();
  const router = useRouter();
  const flashcardSetId = params.id as string;
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const setData = await flashcardsApi.getSet(parseInt(flashcardSetId));
        setSet(setData);
        setEditData({ title: setData.title, description: setData.description || '' });
        
        // Flashcards are typically fetched from backend or embedded in the set
        // For now, assuming they're requested as separate items or embedded
        // You may need to add a backend endpoint to get flashcards by set_id
        setFlashcards(setData.flashcards || []);
        setError('');
      } catch (err) {
        setError('Failed to load flashcard set');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (flashcardSetId) {
      loadData();
    }
  }, [flashcardSetId]);

  const handleEditSet = async () => {
    if (!set) return;
    try {
      setSubmitting(true);
      const updated = await flashcardsApi.updateSet(parseInt(flashcardSetId), editData);
      setSet(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update flashcard set');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSet = async () => {
    if (!window.confirm('Are you sure you want to delete this flashcard set?')) {
      return;
    }
    try {
      await flashcardsApi.deleteSet(parseInt(flashcardSetId));
      router.push('/flashcards');
    } catch (err) {
      setError('Failed to delete flashcard set');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading flashcards...</p>
      </div>
    );
  }

  if (error || !set || flashcards.length === 0) {
    return (
      <div className="p-8">
        <Alert type="error">{error || 'Flashcard set not found'}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4">{set.title}</h1>
            <p className="text-gray-600">
              Card {currentIndex + 1} of {flashcards.length}
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
              onClick={handleDeleteSet}
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

      {/* Flashcard */}
      <Card
        className="mb-8 h-64 flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 hover:shadow-xl transition-shadow"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-center p-8">
          <div className="text-sm text-gray-600 mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </div>
          <div className="text-2xl font-semibold text-gray-800">
            {isFlipped ? currentCard.back : currentCard.front}
          </div>
          <div className="text-xs text-gray-400 mt-8">Click to flip</div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4 justify-between mb-8">
        <Button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          ← Previous
        </Button>
        
        <Button
          onClick={() => setIsFlipped(false)}
          variant="secondary"
        >
          Reset
        </Button>
        
        <Button
          onClick={() => setCurrentIndex(Math.min(flashcards.length - 1, currentIndex + 1))}
          disabled={currentIndex === flashcards.length - 1}
        >
          Next →
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-8 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Button onClick={() => router.push(`/flashcards/${flashcardSetId}/study`)}>
          Study Mode
        </Button>
        <Button onClick={() => router.push(`/flashcards/${flashcardSetId}/edit`)} variant="secondary">
          Edit Cards
        </Button>
        <Button onClick={() => router.back()} variant="secondary">
          Back
        </Button>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Flashcard Set"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditSet(); }} className="p-6 space-y-4">
          <Input
            label="Title"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            required
          />
          <Textarea
            label="Description"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            rows={3}
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
