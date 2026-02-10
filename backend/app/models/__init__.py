"""
Models package for AI Study Companion
"""
from app.models.models import (
    Subject,
    Lecture,
    Note,
    FlashcardSet,
    Flashcard,
    Quiz,
    QuizQuestion,
    QuizAttempt,
    ChatMessage
)
from app.models.user import User

__all__ = [
    'User',
    'Subject',
    'Lecture',
    'Note',
    'FlashcardSet',
    'Flashcard',
    'Quiz',
    'QuizQuestion',
    'QuizAttempt',
    'ChatMessage'
]
