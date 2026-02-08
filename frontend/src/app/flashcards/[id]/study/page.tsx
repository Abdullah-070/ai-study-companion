'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { flashcardsApi } from '@/lib/api';
import { FlashcardSet, Flashcard } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function FlashcardStudyPage() {
  const params = useParams();
  const router = useRouter();
  const flashcardSetId = params.id as string;
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

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

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleMastered = () => {
    const newMastered = new Set(masteredCards);
    newMastered.add(currentIndex);
    setMasteredCards(newMastered);
    handleNext();
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
  const progress = Math.round((masteredCards.size / flashcards.length) * 100);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{set.title}</h1>
        <p className="text-gray-600 mb-4">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{masteredCards.size} mastered</p>
      </div>

      {/* Flashcard */}
      <Card
        className="mb-8 h-64 flex items-center justify-center cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 hover:shadow-xl transition-shadow"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className="text-center p-8">
          <p className="text-sm text-gray-500 mb-4 font-semibold">
            {isFlipped ? 'Answer' : 'Question'}
          </p>
          <p className="text-2xl font-bold text-gray-800">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
          <p className="text-sm text-gray-400 mt-4">Click to flip</p>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex-1"
          variant="secondary"
        >
          ← Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex-1"
          variant="secondary"
        >
          Next →
        </Button>
      </div>

      {/* Mark as mastered */}
      <Button
        onClick={handleMastered}
        className="w-full mb-4"
        disabled={masteredCards.has(currentIndex)}
      >
        {masteredCards.has(currentIndex) ? '✓ Mastered' : 'Mark as Mastered'}
      </Button>

      {/* Back button */}
      <Button
        onClick={() => router.back()}
        className="w-full"
        variant="secondary"
      >
        Back to Flashcards
      </Button>
    </div>
  );
}
