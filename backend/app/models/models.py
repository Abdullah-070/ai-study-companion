"""
Database Models for AI Study Companion
"""
from app import db
from datetime import datetime
from typing import Optional


class Subject(db.Model):
    """Subject/Course model for organizing study materials."""
    __tablename__ = 'subjects'
    
    id: int = db.Column(db.Integer, primary_key=True)
    name: str = db.Column(db.String(200), nullable=False)
    description: Optional[str] = db.Column(db.Text)
    color: str = db.Column(db.String(7), default='#3B82F6')  # Hex color
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lectures = db.relationship('Lecture', backref='subject', lazy='dynamic', cascade='all, delete-orphan')
    notes = db.relationship('Note', backref='subject', lazy='dynamic', cascade='all, delete-orphan')
    flashcard_sets = db.relationship('FlashcardSet', backref='subject', lazy='dynamic', cascade='all, delete-orphan')
    quizzes = db.relationship('Quiz', backref='subject', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'color': self.color,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'lecture_count': self.lectures.count(),
            'note_count': self.notes.count(),
            'flashcard_set_count': self.flashcard_sets.count(),
            'quiz_count': self.quizzes.count()
        }


class Lecture(db.Model):
    """Lecture model for storing transcriptions and recordings."""
    __tablename__ = 'lectures'
    
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(300), nullable=False)
    source_type: str = db.Column(db.String(50), nullable=False)  # 'live', 'youtube', 'upload'
    source_url: Optional[str] = db.Column(db.String(500))
    transcription: Optional[str] = db.Column(db.Text)
    summary: Optional[str] = db.Column(db.Text)
    duration_seconds: Optional[int] = db.Column(db.Integer)
    subject_id: int = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notes = db.relationship('Note', backref='lecture', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'source_type': self.source_type,
            'source_url': self.source_url,
            'transcription': self.transcription,
            'summary': self.summary,
            'duration_seconds': self.duration_seconds,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'note_count': self.notes.count()
        }


class Note(db.Model):
    """Note model for storing study notes."""
    __tablename__ = 'notes'
    
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(300), nullable=False)
    content: str = db.Column(db.Text, nullable=False)
    summary: Optional[str] = db.Column(db.Text)
    tags: Optional[str] = db.Column(db.String(500))  # Comma-separated tags
    subject_id: int = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    lecture_id: Optional[int] = db.Column(db.Integer, db.ForeignKey('lectures.id'))
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'summary': self.summary,
            'tags': self.tags.split(',') if self.tags else [],
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'lecture_id': self.lecture_id,
            'lecture_title': self.lecture.title if self.lecture else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class FlashcardSet(db.Model):
    """Flashcard Set model for grouping flashcards."""
    __tablename__ = 'flashcard_sets'
    
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(300), nullable=False)
    description: Optional[str] = db.Column(db.Text)
    subject_id: int = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: datetime = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    flashcards = db.relationship('Flashcard', backref='flashcard_set', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'card_count': self.flashcards.count(),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Flashcard(db.Model):
    """Individual flashcard model."""
    __tablename__ = 'flashcards'
    
    id: int = db.Column(db.Integer, primary_key=True)
    front: str = db.Column(db.Text, nullable=False)  # Question/Term
    back: str = db.Column(db.Text, nullable=False)   # Answer/Definition
    difficulty: int = db.Column(db.Integer, default=0)  # 0-5 scale for spaced repetition
    times_reviewed: int = db.Column(db.Integer, default=0)
    times_correct: int = db.Column(db.Integer, default=0)
    last_reviewed: Optional[datetime] = db.Column(db.DateTime)
    next_review: Optional[datetime] = db.Column(db.DateTime)
    flashcard_set_id: int = db.Column(db.Integer, db.ForeignKey('flashcard_sets.id'), nullable=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'front': self.front,
            'back': self.back,
            'difficulty': self.difficulty,
            'times_reviewed': self.times_reviewed,
            'times_correct': self.times_correct,
            'accuracy': round(self.times_correct / self.times_reviewed * 100, 1) if self.times_reviewed > 0 else None,
            'last_reviewed': self.last_reviewed.isoformat() if self.last_reviewed else None,
            'next_review': self.next_review.isoformat() if self.next_review else None,
            'flashcard_set_id': self.flashcard_set_id,
            'created_at': self.created_at.isoformat()
        }


class Quiz(db.Model):
    """Quiz model for practice tests."""
    __tablename__ = 'quizzes'
    
    id: int = db.Column(db.Integer, primary_key=True)
    title: str = db.Column(db.String(300), nullable=False)
    description: Optional[str] = db.Column(db.Text)
    subject_id: int = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = db.relationship('QuizQuestion', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    attempts = db.relationship('QuizAttempt', backref='quiz', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'subject_id': self.subject_id,
            'subject_name': self.subject.name if self.subject else None,
            'question_count': self.questions.count(),
            'attempt_count': self.attempts.count(),
            'created_at': self.created_at.isoformat()
        }


class QuizQuestion(db.Model):
    """Individual quiz question model."""
    __tablename__ = 'quiz_questions'
    
    id: int = db.Column(db.Integer, primary_key=True)
    question: str = db.Column(db.Text, nullable=False)
    question_type: str = db.Column(db.String(50), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer'
    options: Optional[str] = db.Column(db.Text)  # JSON string for multiple choice options
    correct_answer: str = db.Column(db.Text, nullable=False)
    explanation: Optional[str] = db.Column(db.Text)
    points: int = db.Column(db.Integer, default=1)
    quiz_id: int = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    
    def to_dict(self) -> dict:
        import json
        return {
            'id': self.id,
            'question': self.question,
            'question_type': self.question_type,
            'options': json.loads(self.options) if self.options else None,
            'correct_answer': self.correct_answer,
            'explanation': self.explanation,
            'points': self.points,
            'quiz_id': self.quiz_id
        }


class QuizAttempt(db.Model):
    """Quiz attempt/result model."""
    __tablename__ = 'quiz_attempts'
    
    id: int = db.Column(db.Integer, primary_key=True)
    quiz_id: int = db.Column(db.Integer, db.ForeignKey('quizzes.id'), nullable=False)
    score: int = db.Column(db.Integer, nullable=False)
    total_points: int = db.Column(db.Integer, nullable=False)
    time_taken_seconds: Optional[int] = db.Column(db.Integer)
    answers: Optional[str] = db.Column(db.Text)  # JSON string of user answers
    completed_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        import json
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'quiz_title': self.quiz.title if self.quiz else None,
            'score': self.score,
            'total_points': self.total_points,
            'percentage': round(self.score / self.total_points * 100, 1) if self.total_points > 0 else 0,
            'time_taken_seconds': self.time_taken_seconds,
            'answers': json.loads(self.answers) if self.answers else None,
            'completed_at': self.completed_at.isoformat()
        }


class ChatMessage(db.Model):
    """Chat message model for AI tutor conversations."""
    __tablename__ = 'chat_messages'
    
    id: int = db.Column(db.Integer, primary_key=True)
    session_id: str = db.Column(db.String(100), nullable=False, index=True)
    role: str = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    content: str = db.Column(db.Text, nullable=False)
    subject_id: Optional[int] = db.Column(db.Integer, db.ForeignKey('subjects.id'))
    created_at: datetime = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'session_id': self.session_id,
            'role': self.role,
            'content': self.content,
            'subject_id': self.subject_id,
            'created_at': self.created_at.isoformat()
        }
