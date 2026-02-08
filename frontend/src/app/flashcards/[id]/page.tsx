'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { flashcardsApi } from '@/lib/api';
import { FlashcardSet, Flashcard } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const setData = await flashcardsApi.getSet(parseInt(flashcardSetId));
        setSet(setData);
        
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
        <h1 className="text-4xl font-bold mb-4">{set.title}</h1>
        <p className="text-gray-600">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </div>

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
          variant="outline"
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

      <Button onClick={() => router.back()}>Go Back</Button>
    </div>
  );
}
