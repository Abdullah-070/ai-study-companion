"""
Routes package for AI Study Companion
"""
from app.routes.subjects import subjects_bp
from app.routes.lectures import lectures_bp
from app.routes.notes import notes_bp
from app.routes.flashcards import flashcards_bp
from app.routes.quizzes import quizzes_bp
from app.routes.tutor import tutor_bp

__all__ = [
    'subjects_bp',
    'lectures_bp',
    'notes_bp',
    'flashcards_bp',
    'quizzes_bp',
    'tutor_bp'
]
