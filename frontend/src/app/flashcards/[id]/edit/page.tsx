'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { flashcardsApi } from '@/lib/api';
import { FlashcardSet, Flashcard } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function EditFlashcardSetPage() {
  const params = useParams();
  const router = useRouter();
  const flashcardSetId = params.id as string;
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const setData = await flashcardsApi.getSet(parseInt(flashcardSetId));
        setSet(setData);
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

  const handleEditStart = (index: number, card: Flashcard) => {
    setEditingCard(index);
    setNewFront(card.front);
    setNewBack(card.back);
  };

  const handleSaveEdit = async (index: number, cardId: number) => {
    try {
      const updated = await flashcardsApi.updateCard(cardId, {
        front: newFront,
        back: newBack,
      });
      const updatedFlashcards = [...flashcards];
      updatedFlashcards[index] = updated;
      setFlashcards(updatedFlashcards);
      setEditingCard(null);
      setSuccess('Card updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save card');
    }
  };

  const handleDeleteCard = async (index: number, cardId: number) => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await flashcardsApi.deleteCard(cardId);
      const updatedFlashcards = flashcards.filter((_, i) => i !== index);
      setFlashcards(updatedFlashcards);
      setSuccess('Card deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete card');
    }
  };

  const handleAddCard = async () => {
    if (newFront.trim() && newBack.trim()) {
      try {
        const newCard = await flashcardsApi.createCard({
          front: newFront,
          back: newBack,
          flashcard_set_id: parseInt(flashcardSetId),
        });
        setFlashcards([...flashcards, newCard]);
        setNewFront('');
        setNewBack('');
        setSuccess('Card added');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to add card');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading flashcard set...</p>
      </div>
    );
  }

  if (error && !set) {
    return (
      <div className="p-8">
        <Alert type="error">{error}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{set?.title}</h1>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
      </div>

      {/* Add new card form */}
      <Card className="p-6 mb-8 bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Add New Card</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front (Question)
            </label>
            <textarea
              value={newFront}
              onChange={(e) => setNewFront(e.target.value)}
              placeholder="Enter question or term..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Back (Answer)
            </label>
            <textarea
              value={newBack}
              onChange={(e) => setNewBack(e.target.value)}
              placeholder="Enter answer or definition..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <Button onClick={handleAddCard} className="w-full">
            Add Card
          </Button>
        </div>
      </Card>

      {/* Existing cards */}
      <h2 className="text-2xl font-bold mb-4">Cards ({flashcards.length})</h2>
      <div className="space-y-4">
        {flashcards.map((card, index) => (
          <Card key={card.id} className="p-6">
            {editingCard === index ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Front
                  </label>
                  <textarea
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Back
                  </label>
                  <textarea
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSaveEdit(index, card.id)}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingCard(null)}
                    className="flex-1"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Front</p>
                  <p className="text-lg font-semibold">{card.front}</p>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Back</p>
                  <p className="text-lg">{card.back}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEditStart(index, card)}
                    className="flex-1"
                    variant="secondary"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeleteCard(index, card.id)}
                    className="flex-1"
                    variant="secondary"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        <Button onClick={() => router.back()} className="flex-1" variant="secondary">
          Back
        </Button>
        <Button onClick={() => router.push(`/flashcards/${flashcardSetId}`)} className="flex-1">
          View Flashcards
        </Button>
      </div>
    </div>
  );
}
