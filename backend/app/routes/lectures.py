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
    data = request.get_json() or {}
    
    if not data.get('url'):
        return jsonify({'error': 'YouTube URL is required'}), 400
    
    subject_id = data.get('subject_id')
    if not subject_id:
        return jsonify({'error': 'Subject ID is required'}), 400
    
    try:
        # Verify subject exists
        subject = Subject.query.get(subject_id)
        if not subject:
            return jsonify({'error': f'Subject with ID {subject_id} not found'}), 404
        
        # Extract video info and transcript
        video_info = youtube_service.get_video_info(data['url'])
        transcript, duration = youtube_service.get_transcript(video_info['video_id'])
        
        # Generate summary if requested
        summary = None
        if data.get('generate_summary', True):
            try:
                summary = ai_service.summarize_text(transcript)
            except Exception as e:
                print(f"Summary generation failed: {e}")
                # Continue without summary
        
        # Create lecture
        lecture = Lecture(
            title=data.get('title') or f"YouTube Lecture - {video_info['video_id']}",
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
        
    except ValueError as e:
        return jsonify({'error': f'Invalid data format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create lecture: {str(e)}'}), 400


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


@lectures_bp.route('/manual-transcription', methods=['POST'])
def create_with_manual_transcription():
    """Create a lecture with manually provided transcription."""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('transcription'):
        return jsonify({'error': 'Transcription text is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    # Verify subject exists
    subject = Subject.query.get_or_404(data['subject_id'])
    
    try:
        # Generate summary if requested
        summary = None
        if data.get('generate_summary', True):
            try:
                summary = ai_service.summarize_text(data['transcription'])
            except Exception as e:
                print(f"Summary generation failed: {e}")
                # Continue without summary
        
        lecture = Lecture(
            title=data['title'],
            source_type='manual',
            source_url=None,
            transcription=data['transcription'],
            summary=summary,
            duration_seconds=data.get('duration_seconds'),
            subject_id=subject.id
        )
        
        db.session.add(lecture)
        db.session.commit()
        
        return jsonify(lecture.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create lecture: {str(e)}'}), 400


@lectures_bp.route('/upload-audio', methods=['POST'])
def upload_audio():
    """Create a lecture from uploaded audio file using Whisper."""
    if 'audio' not in request.files:
        return jsonify({'error': 'Audio file is required'}), 400
    
    if not request.form.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not request.form.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    try:
        subject_id = int(request.form.get('subject_id'))
    except (ValueError, TypeError):
        return jsonify({'error': 'Subject ID must be a number'}), 400
    
    # Verify subject exists
    subject = Subject.query.get_or_404(subject_id)
    
    audio_file = request.files['audio']
    
    # Validate file
    if not audio_file.filename:
        return jsonify({'error': 'No file selected'}), 400
    
    allowed_extensions = {'wav', 'mp3', 'm4a', 'ogg', 'flac', 'webm'}
    file_ext = audio_file.filename.rsplit('.', 1)[1].lower() if '.' in audio_file.filename else ''
    
    if file_ext not in allowed_extensions:
        return jsonify({'error': f'File type .{file_ext} not supported. Allowed: {", ".join(allowed_extensions)}'}), 400
    
    try:
        # Save file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        # Transcribe using Whisper
        transcription = ai_service.transcribe_audio(tmp_path)
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        # Generate summary if requested
        summary = None
        if request.form.get('generate_summary') == 'true':
            try:
                summary = ai_service.summarize_text(transcription)
            except Exception as e:
                print(f"Summary generation failed: {e}")
                # Continue without summary
        
        # Create lecture
        lecture = Lecture(
            title=request.form.get('title'),
            source_type='upload',
            source_url=None,
            transcription=transcription,
            summary=summary,
            duration_seconds=request.form.get('duration_seconds', type=int),
            subject_id=subject.id
        )
        
        db.session.add(lecture)
        db.session.commit()
        
        return jsonify(lecture.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to process audio: {str(e)}'}), 400
