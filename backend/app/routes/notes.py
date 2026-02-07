"""
Notes API Routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Note, Subject, Lecture
from app.services import ai_service

notes_bp = Blueprint('notes', __name__)


@notes_bp.route('', methods=['GET'])
def get_notes():
    """Get all notes, optionally filtered by subject or lecture."""
    subject_id = request.args.get('subject_id', type=int)
    lecture_id = request.args.get('lecture_id', type=int)
    
    query = Note.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if lecture_id:
        query = query.filter_by(lecture_id=lecture_id)
    
    notes = query.order_by(Note.updated_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@notes_bp.route('/<int:note_id>', methods=['GET'])
def get_note(note_id: int):
    """Get a specific note by ID."""
    note = Note.query.get_or_404(note_id)
    return jsonify(note.to_dict())


@notes_bp.route('', methods=['POST'])
def create_note():
    """Create a new note."""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('content'):
        return jsonify({'error': 'Content is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    # Verify subject exists
    Subject.query.get_or_404(data['subject_id'])
    
    # Verify lecture exists if provided
    if data.get('lecture_id'):
        Lecture.query.get_or_404(data['lecture_id'])
    
    note = Note(
        title=data['title'],
        content=data['content'],
        summary=data.get('summary'),
        tags=','.join(data['tags']) if isinstance(data.get('tags'), list) else data.get('tags'),
        subject_id=data['subject_id'],
        lecture_id=data.get('lecture_id')
    )
    
    db.session.add(note)
    db.session.commit()
    
    return jsonify(note.to_dict()), 201


@notes_bp.route('/from-lecture/<int:lecture_id>', methods=['POST'])
def create_from_lecture(lecture_id: int):
    """Generate notes from a lecture transcription."""
    lecture = Lecture.query.get_or_404(lecture_id)
    
    if not lecture.transcription:
        return jsonify({'error': 'No transcription available'}), 400
    
    try:
        # Generate notes from transcription
        generated_content = ai_service.generate_notes_from_transcription(lecture.transcription)
        
        data = request.get_json() or {}
        
        note = Note(
            title=data.get('title', f"Notes: {lecture.title}"),
            content=generated_content,
            summary=lecture.summary,
            subject_id=lecture.subject_id,
            lecture_id=lecture.id
        )
        
        db.session.add(note)
        db.session.commit()
        
        return jsonify(note.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notes_bp.route('/<int:note_id>/summarize', methods=['POST'])
def summarize_note(note_id: int):
    """Generate or regenerate summary for a note."""
    note = Note.query.get_or_404(note_id)
    
    try:
        note.summary = ai_service.summarize_text(note.content, max_length=200)
        db.session.commit()
        return jsonify(note.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@notes_bp.route('/<int:note_id>', methods=['PUT'])
def update_note(note_id: int):
    """Update a note."""
    note = Note.query.get_or_404(note_id)
    data = request.get_json()
    
    if data.get('title'):
        note.title = data['title']
    if 'content' in data:
        note.content = data['content']
    if 'summary' in data:
        note.summary = data['summary']
    if 'tags' in data:
        note.tags = ','.join(data['tags']) if isinstance(data['tags'], list) else data['tags']
    
    db.session.commit()
    
    return jsonify(note.to_dict())


@notes_bp.route('/<int:note_id>', methods=['DELETE'])
def delete_note(note_id: int):
    """Delete a note."""
    note = Note.query.get_or_404(note_id)
    
    db.session.delete(note)
    db.session.commit()
    
    return jsonify({'message': 'Note deleted successfully'})
