"""
Lectures API Routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Lecture, Subject
from app.services import ai_service, youtube_service

lectures_bp = Blueprint('lectures', __name__)


@lectures_bp.route('', methods=['GET'])
def get_lectures():
    """Get all lectures, optionally filtered by subject."""
    subject_id = request.args.get('subject_id', type=int)
    
    query = Lecture.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    
    lectures = query.order_by(Lecture.created_at.desc()).all()
    return jsonify([l.to_dict() for l in lectures])


@lectures_bp.route('/<int:lecture_id>', methods=['GET'])
def get_lecture(lecture_id: int):
    """Get a specific lecture by ID."""
    lecture = Lecture.query.get_or_404(lecture_id)
    return jsonify(lecture.to_dict())


@lectures_bp.route('/youtube', methods=['POST'])
def create_from_youtube():
    """Create a lecture from a YouTube video."""
    data = request.get_json()
    
    if not data or not data.get('url'):
        return jsonify({'error': 'YouTube URL is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    # Verify subject exists
    subject = Subject.query.get_or_404(data['subject_id'])
    
    try:
        # Extract video info and transcript
        video_info = youtube_service.get_video_info(data['url'])
        transcript, duration = youtube_service.get_transcript(video_info['video_id'])
        
        # Generate summary if requested
        summary = None
        if data.get('generate_summary', True):
            summary = ai_service.summarize_text(transcript)
        
        # Create lecture
        lecture = Lecture(
            title=data.get('title', f"YouTube Lecture - {video_info['video_id']}"),
            source_type='youtube',
            source_url=data['url'],
            transcription=transcript,
            summary=summary,
            duration_seconds=int(duration),
            subject_id=subject.id
        )
        
        db.session.add(lecture)
        db.session.commit()
        
        return jsonify(lecture.to_dict()), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@lectures_bp.route('', methods=['POST'])
def create_lecture():
    """Create a new lecture with manual transcription."""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    # Verify subject exists
    Subject.query.get_or_404(data['subject_id'])
    
    lecture = Lecture(
        title=data['title'],
        source_type=data.get('source_type', 'manual'),
        source_url=data.get('source_url'),
        transcription=data.get('transcription'),
        summary=data.get('summary'),
        duration_seconds=data.get('duration_seconds'),
        subject_id=data['subject_id']
    )
    
    db.session.add(lecture)
    db.session.commit()
    
    return jsonify(lecture.to_dict()), 201


@lectures_bp.route('/<int:lecture_id>/summarize', methods=['POST'])
def summarize_lecture(lecture_id: int):
    """Generate or regenerate summary for a lecture."""
    lecture = Lecture.query.get_or_404(lecture_id)
    
    if not lecture.transcription:
        return jsonify({'error': 'No transcription available to summarize'}), 400
    
    try:
        lecture.summary = ai_service.summarize_text(lecture.transcription)
        db.session.commit()
        return jsonify(lecture.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@lectures_bp.route('/<int:lecture_id>', methods=['PUT'])
def update_lecture(lecture_id: int):
    """Update a lecture."""
    lecture = Lecture.query.get_or_404(lecture_id)
    data = request.get_json()
    
    if data.get('title'):
        lecture.title = data['title']
    if 'transcription' in data:
        lecture.transcription = data['transcription']
    if 'summary' in data:
        lecture.summary = data['summary']
    
    db.session.commit()
    
    return jsonify(lecture.to_dict())


@lectures_bp.route('/<int:lecture_id>', methods=['DELETE'])
def delete_lecture(lecture_id: int):
    """Delete a lecture."""
    lecture = Lecture.query.get_or_404(lecture_id)
    
    db.session.delete(lecture)
    db.session.commit()
    
    return jsonify({'message': 'Lecture deleted successfully'})
