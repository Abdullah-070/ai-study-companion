"""
Flashcards API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import FlashcardSet, Flashcard, Subject, Note, Lecture
from app.services import ai_service
from datetime import datetime, timedelta
import json

flashcards_bp = Blueprint('flashcards', __name__)


@flashcards_bp.route('/sets', methods=['GET'])
@jwt_required()
def get_flashcard_sets():
    """Get all flashcard sets for current user, optionally filtered by subject."""
    user_id = get_jwt_identity()
    subject_id = request.args.get('subject_id', type=int)
    
    query = FlashcardSet.query.filter_by(user_id=user_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    
    sets = query.order_by(FlashcardSet.updated_at.desc()).all()
    return jsonify([s.to_dict() for s in sets])


@flashcards_bp.route('/sets/<int:set_id>', methods=['GET'])
@jwt_required()
def get_flashcard_set(set_id: int):
    """Get a specific flashcard set with all cards."""
    user_id = get_jwt_identity()
    flashcard_set = FlashcardSet.query.filter_by(id=set_id, user_id=user_id).first_or_404()
    result = flashcard_set.to_dict()
    result['flashcards'] = [f.to_dict() for f in flashcard_set.flashcards.all()]
    return jsonify(result)


@flashcards_bp.route('/sets', methods=['POST'])
@jwt_required()
def create_flashcard_set():
    """Create a new flashcard set."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    Subject.query.filter_by(id=data['subject_id'], user_id=user_id).first_or_404()
    
    flashcard_set = FlashcardSet(
        user_id=user_id,
        title=data['title'],
        description=data.get('description'),
        subject_id=data['subject_id']
    )
    
    db.session.add(flashcard_set)
    db.session.commit()
    
    return jsonify(flashcard_set.to_dict()), 201


@flashcards_bp.route('/sets/generate', methods=['POST'])
@jwt_required()
def generate_flashcards():
    """Generate flashcards from content using AI."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    Subject.query.filter_by(id=data['subject_id'], user_id=user_id).first_or_404()
    
    # Get content from note, lecture, or direct input
    content = None
    if data.get('note_id'):
        note = Note.query.filter_by(id=data['note_id'], user_id=user_id).first_or_404()
        content = note.content
        default_title = f"Flashcards: {note.title}"
    elif data.get('lecture_id'):
        lecture = Lecture.query.filter_by(id=data['lecture_id'], user_id=user_id).first_or_404()
        content = lecture.transcription or lecture.summary
        default_title = f"Flashcards: {lecture.title}"
    elif data.get('content'):
        content = data['content']
        default_title = "Generated Flashcards"
    else:
        return jsonify({'error': 'Content source required (note_id, lecture_id, or content)'}), 400
    
    if not content:
        return jsonify({'error': 'No content available to generate flashcards'}), 400
    
    try:
        # Generate flashcards using AI
        num_cards = data.get('num_cards', 10)
        generated_cards = ai_service.generate_flashcards(content, num_cards)
        
        # Validate that we got cards
        if not isinstance(generated_cards, list):
            return jsonify({'error': f'Invalid flashcard format received from AI: {type(generated_cards)}'}), 500
        
        if len(generated_cards) == 0:
            return jsonify({'error': 'AI failed to generate flashcards'}), 500
        
        # Create flashcard set
        flashcard_set = FlashcardSet(
            title=data.get('title', default_title),
            description=data.get('description'),
            subject_id=data['subject_id'],
            user_id=user_id
        )
        db.session.add(flashcard_set)
        db.session.flush()  # Get the ID
        
        # Create flashcards
        for card_data in generated_cards:
            # Ensure card_data has the required fields
            if isinstance(card_data, dict) and 'front' in card_data and 'back' in card_data:
                flashcard = Flashcard(
                    front=card_data['front'],
                    back=card_data['back'],
                    flashcard_set_id=flashcard_set.id
                )
                db.session.add(flashcard)
        
        db.session.commit()
        
        result = flashcard_set.to_dict()
        result['flashcards'] = [f.to_dict() for f in flashcard_set.flashcards.all()]
        return jsonify(result), 201
        
    except Exception as e:
        db.session.rollback()
        import traceback
        print(f"Flashcard generation error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Failed to generate flashcards: {str(e)}'}), 500


@flashcards_bp.route('/sets/<int:set_id>', methods=['PUT'])
@jwt_required()
def update_flashcard_set(set_id: int):
    """Update a flashcard set."""
    user_id = get_jwt_identity()
    flashcard_set = FlashcardSet.query.filter_by(id=set_id, user_id=user_id).first_or_404()
    data = request.get_json()
    
    if data.get('title'):
        flashcard_set.title = data['title']
    if 'description' in data:
        flashcard_set.description = data['description']
    
    db.session.commit()
    
    return jsonify(flashcard_set.to_dict())


@flashcards_bp.route('/sets/<int:set_id>', methods=['DELETE'])
@jwt_required()
def delete_flashcard_set(set_id: int):
    """Delete a flashcard set and all its cards."""
    user_id = get_jwt_identity()
    flashcard_set = FlashcardSet.query.filter_by(id=set_id, user_id=user_id).first_or_404()
    
    db.session.delete(flashcard_set)
    db.session.commit()
    
    return jsonify({'message': 'Flashcard set deleted successfully'})


# Individual flashcard routes

@flashcards_bp.route('/<int:card_id>', methods=['GET'])
@jwt_required()
def get_flashcard(card_id: int):
    """Get a specific flashcard."""
    user_id = get_jwt_identity()
    flashcard = Flashcard.query.join(FlashcardSet).filter(Flashcard.id == card_id, FlashcardSet.user_id == user_id).first_or_404()
    return jsonify(flashcard.to_dict())


@flashcards_bp.route('', methods=['POST'])
@jwt_required()
def create_flashcard():
    """Create a new flashcard."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('front'):
        return jsonify({'error': 'Front (question) is required'}), 400
    
    if not data.get('back'):
        return jsonify({'error': 'Back (answer) is required'}), 400
    
    if not data.get('flashcard_set_id'):
        return jsonify({'error': 'Flashcard set ID is required'}), 400
    
    FlashcardSet.query.filter_by(id=data['flashcard_set_id'], user_id=user_id).first_or_404()
    
    flashcard = Flashcard(
        front=data['front'],
        back=data['back'],
        flashcard_set_id=data['flashcard_set_id']
    )
    
    db.session.add(flashcard)
    db.session.commit()
    
    return jsonify(flashcard.to_dict()), 201


@flashcards_bp.route('/<int:card_id>', methods=['PUT'])
@jwt_required()
def update_flashcard(card_id: int):
    """Update a flashcard."""
    user_id = get_jwt_identity()
    flashcard = Flashcard.query.join(FlashcardSet).filter(Flashcard.id == card_id, FlashcardSet.user_id == user_id).first_or_404()
    data = request.get_json()
    
    if data.get('front'):
        flashcard.front = data['front']
    if data.get('back'):
        flashcard.back = data['back']
    
    db.session.commit()
    
    return jsonify(flashcard.to_dict())


@flashcards_bp.route('/<int:card_id>/review', methods=['POST'])
@jwt_required()
def review_flashcard(card_id: int):
    """Record a flashcard review result for spaced repetition."""
    user_id = get_jwt_identity()
    flashcard = Flashcard.query.join(FlashcardSet).filter(Flashcard.id == card_id, FlashcardSet.user_id == user_id).first_or_404()
    data = request.get_json()
    
    was_correct = data.get('correct', False)
    
    flashcard.times_reviewed += 1
    if was_correct:
        flashcard.times_correct += 1
        flashcard.difficulty = max(0, flashcard.difficulty - 1)
        # Increase interval for correct answers
        days_until_next = 2 ** flashcard.difficulty
    else:
        flashcard.difficulty = min(5, flashcard.difficulty + 1)
        # Reset to 1 day for incorrect answers
        days_until_next = 1
    
    flashcard.last_reviewed = datetime.utcnow()
    flashcard.next_review = datetime.utcnow() + timedelta(days=days_until_next)
    
    db.session.commit()
    
    return jsonify(flashcard.to_dict())


@flashcards_bp.route('/<int:card_id>', methods=['DELETE'])
@jwt_required()
def delete_flashcard(card_id: int):
    """Delete a flashcard."""
    user_id = get_jwt_identity()
    flashcard = Flashcard.query.join(FlashcardSet).filter(Flashcard.id == card_id, FlashcardSet.user_id == user_id).first_or_404()
    
    db.session.delete(flashcard)
    db.session.commit()
    
    return jsonify({'message': 'Flashcard deleted successfully'})


@flashcards_bp.route('/due', methods=['GET'])
@jwt_required()
def get_due_flashcards():
    """Get flashcards due for review."""
    user_id = get_jwt_identity()
    subject_id = request.args.get('subject_id', type=int)
    limit = request.args.get('limit', 20, type=int)
    
    query = Flashcard.query.join(FlashcardSet).filter(
        FlashcardSet.user_id == user_id,
        ((Flashcard.next_review <= datetime.utcnow()) | 
        (Flashcard.next_review == None))
    )
    
    if subject_id:
        query = query.filter(FlashcardSet.subject_id == subject_id)
    
    flashcards = query.order_by(Flashcard.next_review.asc().nullsfirst()).limit(limit).all()
    
    return jsonify([f.to_dict() for f in flashcards])
