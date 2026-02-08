'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { quizzesApi } from '@/lib/api';
import { Quiz, QuizQuestion, QuizAttempt } from '@/types';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const quizData = await quizzesApi.getById(parseInt(quizId));
        setQuiz(quizData);
        setEditData({ title: quizData.title, description: quizData.description || '' });
        
        // Questions are typically embedded in the quiz response
        // or fetched separately - adjust based on your backend
        setQuestions(quizData.questions || []);
        setError('');
      } catch (err) {
        setError('Failed to load quiz');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      loadData();
    }
  }, [quizId]);

  const handleEditQuiz = async () => {
    if (!quiz) return;
    try {
      setSubmitting(true);
      const updated = await quizzesApi.update(parseInt(quizId), editData);
      setQuiz(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) {
      return;
    }
    try {
      await quizzesApi.delete(parseInt(quizId));
      router.push('/quizzes');
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz || questions.length === 0) {
    return (
      <div className="p-8">
        <Alert type="error">{error || 'Quiz not found'}</Alert>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const options = typeof currentQuestion.options === 'string' 
    ? JSON.parse(currentQuestion.options) 
    : Array.isArray(currentQuestion.options)
    ? currentQuestion.options
    : [];

  const handleSubmit = async () => {
    try {
      const correctAnswers = questions.filter((q, idx) => selectedAnswers[idx] === q.correct_answer).length;
      const scorePercentage = (correctAnswers / questions.length) * 100;
      setScore(scorePercentage);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit quiz');
      console.error(err);
    }
  };

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="text-center py-12 bg-gradient-to-br from-green-50 to-blue-50">
          <h2 className="text-4xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-6xl font-bold text-blue-600 mb-4">{Math.round(score!)}%</p>
          <p className="text-xl text-gray-700 mb-8">
            You got {Math.round((score! / 100) * questions.length)} out of {questions.length} correct
          </p>
          <Button onClick={() => router.back()}>Back to Quizzes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4">{quiz.title}</h1>
            <p className="text-gray-600">
              Question {currentIndex + 1} of {questions.length}
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
              onClick={handleDeleteQuiz}
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

      {/* Question */}
      <Card className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option: string, idx: number) => (
            <label
              key={idx}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedAnswers[currentIndex] === option
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="answer"
                value={option}
                checked={selectedAnswers[currentIndex] === option}
                onChange={(e) =>
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [currentIndex]: e.target.value,
                  })
                }
                className="mr-3"
              />
              <span>{option}</span>
            </label>
          ))}
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

        {currentIndex === questions.length - 1 ? (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
          >
            Next →
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-8 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Quiz"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleEditQuiz(); }} className="p-6 space-y-4">
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
