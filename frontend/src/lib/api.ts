/**
 * API Client for AI Study Companion Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public suggestion?: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `HTTP error ${response.status}`,
      errorData.suggestion,
      errorData.details
    );
  }

  return response.json();
}

// Subjects API
export const subjectsApi = {
  getAll: () => fetchApi<import('@/types').Subject[]>('/subjects'),
  
  getById: (id: number) => fetchApi<import('@/types').Subject>(`/subjects/${id}`),
  
  create: (data: { name: string; description?: string; color?: string }) =>
    fetchApi<import('@/types').Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: { name?: string; description?: string; color?: string }) =>
    fetchApi<import('@/types').Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchApi<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),
};

// Lectures API
export const lecturesApi = {
  getAll: (subjectId?: number) => {
    const params = subjectId ? `?subject_id=${subjectId}` : '';
    return fetchApi<import('@/types').Lecture[]>(`/lectures${params}`);
  },
  
  getById: (id: number) => fetchApi<import('@/types').Lecture>(`/lectures/${id}`),
  
  createFromYouTube: (data: {
    url: string;
    subject_id: number;
    title?: string;
    generate_summary?: boolean;
  }) =>
    fetchApi<import('@/types').Lecture>('/lectures/youtube', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createManualTranscription: (data: {
    title: string;
    subject_id: number;
    transcription: string;
    generate_summary?: boolean;
  }) =>
    fetchApi<import('@/types').Lecture>('/lectures/manual-transcription', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  uploadAudio: (data: {
    file: File;
    title: string;
    subject_id: number;
    generate_summary?: boolean;
  }) => {
    const formData = new FormData();
    formData.append('audio', data.file);
    formData.append('title', data.title);
    formData.append('subject_id', String(data.subject_id));
    formData.append('generate_summary', String(data.generate_summary ?? true));

    return fetch(`${API_BASE_URL}/lectures/upload-audio`, {
      method: 'POST',
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.error || `HTTP error ${response.status}`
        );
      }
      return response.json() as Promise<import('@/types').Lecture>;
    });
  },
  
  create: (data: {
    title: string;
    subject_id: number;
    source_type?: string;
    transcription?: string;
  }) =>
    fetchApi<import('@/types').Lecture>('/lectures', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  summarize: (id: number) =>
    fetchApi<import('@/types').Lecture>(`/lectures/${id}/summarize`, {
      method: 'POST',
    }),
  
  update: (id: number, data: { title?: string; transcription?: string; summary?: string }) =>
    fetchApi<import('@/types').Lecture>(`/lectures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchApi<{ message: string }>(`/lectures/${id}`, { method: 'DELETE' }),
};

// Notes API
export const notesApi = {
  getAll: (subjectId?: number, lectureId?: number) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', String(subjectId));
    if (lectureId) params.append('lecture_id', String(lectureId));
    const queryString = params.toString();
    return fetchApi<import('@/types').Note[]>(`/notes${queryString ? `?${queryString}` : ''}`);
  },
  
  getById: (id: number) => fetchApi<import('@/types').Note>(`/notes/${id}`),
  
  create: (data: {
    title: string;
    content: string;
    subject_id: number;
    summary?: string;
    tags?: string[];
    lecture_id?: number;
  }) =>
    fetchApi<import('@/types').Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  createFromLecture: (lectureId: number, title?: string) =>
    fetchApi<import('@/types').Note>(`/notes/from-lecture/${lectureId}`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  
  summarize: (id: number) =>
    fetchApi<import('@/types').Note>(`/notes/${id}/summarize`, { method: 'POST' }),
  
  update: (id: number, data: { title?: string; content?: string; summary?: string; tags?: string[] }) =>
    fetchApi<import('@/types').Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchApi<{ message: string }>(`/notes/${id}`, { method: 'DELETE' }),
};

// Flashcards API
export const flashcardsApi = {
  getSets: (subjectId?: number) => {
    const params = subjectId ? `?subject_id=${subjectId}` : '';
    return fetchApi<import('@/types').FlashcardSet[]>(`/flashcards/sets${params}`);
  },
  
  getSet: (id: number) => fetchApi<import('@/types').FlashcardSet>(`/flashcards/sets/${id}`),
  
  createSet: (data: { title: string; description?: string; subject_id: number }) =>
    fetchApi<import('@/types').FlashcardSet>('/flashcards/sets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  generateSet: (data: {
    subject_id: number;
    title?: string;
    description?: string;
    note_id?: number;
    lecture_id?: number;
    content?: string;
    num_cards?: number;
  }) =>
    fetchApi<import('@/types').FlashcardSet>('/flashcards/sets/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateSet: (id: number, data: { title?: string; description?: string }) =>
    fetchApi<import('@/types').FlashcardSet>(`/flashcards/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteSet: (id: number) =>
    fetchApi<{ message: string }>(`/flashcards/sets/${id}`, { method: 'DELETE' }),
  
  createCard: (data: { front: string; back: string; flashcard_set_id: number }) =>
    fetchApi<import('@/types').Flashcard>('/flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateCard: (id: number, data: { front?: string; back?: string }) =>
    fetchApi<import('@/types').Flashcard>(`/flashcards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  reviewCard: (id: number, correct: boolean) =>
    fetchApi<import('@/types').Flashcard>(`/flashcards/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ correct }),
    }),
  
  deleteCard: (id: number) =>
    fetchApi<{ message: string }>(`/flashcards/${id}`, { method: 'DELETE' }),
  
  getDueCards: (subjectId?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', String(subjectId));
    if (limit) params.append('limit', String(limit));
    const queryString = params.toString();
    return fetchApi<import('@/types').Flashcard[]>(`/flashcards/due${queryString ? `?${queryString}` : ''}`);
  },
};

// Quizzes API
export const quizzesApi = {
  getAll: (subjectId?: number) => {
    const params = subjectId ? `?subject_id=${subjectId}` : '';
    return fetchApi<import('@/types').Quiz[]>(`/quizzes${params}`);
  },
  
  getById: (id: number, includeAnswers = false) =>
    fetchApi<import('@/types').Quiz>(`/quizzes/${id}?include_answers=${includeAnswers}`),
  
  create: (data: { title: string; description?: string; subject_id: number }) =>
    fetchApi<import('@/types').Quiz>('/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  generate: (data: {
    subject_id: number;
    title?: string;
    description?: string;
    note_id?: number;
    lecture_id?: number;
    content?: string;
    num_questions?: number;
    question_types?: string[];
  }) =>
    fetchApi<import('@/types').Quiz>('/quizzes/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  submit: (quizId: number, answers: Record<string, string>, timeTaken?: number) =>
    fetchApi<{ attempt: import('@/types').QuizAttempt; results: import('@/types').QuizResult[] }>(
      `/quizzes/${quizId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers, time_taken_seconds: timeTaken }),
      }
    ),
  
  getAttempts: (quizId: number) =>
    fetchApi<import('@/types').QuizAttempt[]>(`/quizzes/${quizId}/attempts`),
  
  update: (id: number, data: { title?: string; description?: string }) =>
    fetchApi<import('@/types').Quiz>(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    fetchApi<{ message: string }>(`/quizzes/${id}`, { method: 'DELETE' }),
};

// Tutor/Chat API
export const tutorApi = {
  chat: (data: { message: string; session_id?: string; subject_id?: number }) =>
    fetchApi<{ session_id: string; message: import('@/types').ChatMessage }>('/tutor/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  quickAsk: (question: string, subjectId?: number) =>
    fetchApi<{ question: string; answer: string }>('/tutor/ask', {
      method: 'POST',
      body: JSON.stringify({ question, subject_id: subjectId }),
    }),
  
  getSessions: () => fetchApi<import('@/types').ChatSession[]>('/tutor/sessions'),
  
  getSession: (sessionId: string) =>
    fetchApi<{ session_id: string; messages: import('@/types').ChatMessage[] }>(
      `/tutor/sessions/${sessionId}`
    ),
  
  deleteSession: (sessionId: string) =>
    fetchApi<{ message: string }>(`/tutor/sessions/${sessionId}`, { method: 'DELETE' }),
};

// Health check
export const healthApi = {
  check: () => fetchApi<{ status: string; message: string }>('/health'),
};
