/**
 * TypeScript types for AI Study Companion
 */

// Subject/Course types
export interface Subject {
  id: number;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  lecture_count: number;
  note_count: number;
  flashcard_set_count: number;
  quiz_count: number;
}

// Lecture types
export interface Lecture {
  id: number;
  title: string;
  source_type: 'live' | 'youtube' | 'upload' | 'manual';
  source_url: string | null;
  transcription: string | null;
  summary: string | null;
  duration_seconds: number | null;
  subject_id: number;
  subject_name: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
}

// Note types
export interface Note {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  tags: string[];
  subject_id: number;
  subject_name: string | null;
  lecture_id: number | null;
  lecture_title: string | null;
  created_at: string;
  updated_at: string;
}

// Flashcard types
export interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: number;
  times_reviewed: number;
  times_correct: number;
  accuracy: number | null;
  last_reviewed: string | null;
  next_review: string | null;
  flashcard_set_id: number;
  created_at: string;
}

export interface FlashcardSet {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  subject_name: string | null;
  card_count: number;
  created_at: string;
  updated_at: string;
  flashcards?: Flashcard[];
}

// Quiz types
export interface QuizQuestion {
  id: number;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[] | null;
  correct_answer?: string;
  explanation?: string;
  points: number;
  quiz_id: number;
}

export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  subject_id: number;
  subject_name: string | null;
  question_count: number;
  attempt_count: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  quiz_title: string | null;
  score: number;
  total_points: number;
  percentage: number;
  time_taken_seconds: number | null;
  answers: Record<string, string> | null;
  completed_at: string;
}

export interface QuizResult {
  question_id: number;
  question: string;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
  points: number;
}

// Chat/Tutor types
export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  subject_id: number | null;
  created_at: string;
}

export interface ChatSession {
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
}

// API Response types
export interface ApiError {
  error: string;
}

export interface SuccessMessage {
  message: string;
}
