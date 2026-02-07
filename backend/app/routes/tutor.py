"""
AI Tutor API Routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import ChatMessage, Subject
from app.services import ai_service
import uuid

tutor_bp = Blueprint('tutor', __name__)


@tutor_bp.route('/chat', methods=['POST'])
def chat():
    """Send a message to the AI tutor and get a response."""
    data = request.get_json()
    
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400
    
    session_id = data.get('session_id') or str(uuid.uuid4())
    subject_id = data.get('subject_id')
    
    # Get subject context if provided
    subject_context = None
    if subject_id:
        subject = Subject.query.get(subject_id)
        if subject:
            subject_context = subject.name
    
    # Get conversation history for this session
    history_messages = ChatMessage.query.filter_by(
        session_id=session_id
    ).order_by(ChatMessage.created_at.asc()).limit(20).all()
    
    conversation_history = [
        {'role': msg.role, 'content': msg.content}
        for msg in history_messages
    ]
    
    try:
        # Get AI response
        response = ai_service.chat_tutor(
            message=data['message'],
            conversation_history=conversation_history,
            subject_context=subject_context
        )
        
        # Save user message
        user_message = ChatMessage(
            session_id=session_id,
            role='user',
            content=data['message'],
            subject_id=subject_id
        )
        db.session.add(user_message)
        
        # Save assistant response
        assistant_message = ChatMessage(
            session_id=session_id,
            role='assistant',
            content=response,
            subject_id=subject_id
        )
        db.session.add(assistant_message)
        
        db.session.commit()
        
        return jsonify({
            'session_id': session_id,
            'message': assistant_message.to_dict()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@tutor_bp.route('/sessions', methods=['GET'])
def get_sessions():
    """Get all chat sessions."""
    sessions = db.session.query(
        ChatMessage.session_id,
        db.func.min(ChatMessage.created_at).label('started_at'),
        db.func.max(ChatMessage.created_at).label('last_message_at'),
        db.func.count(ChatMessage.id).label('message_count')
    ).group_by(ChatMessage.session_id).order_by(
        db.func.max(ChatMessage.created_at).desc()
    ).all()
    
    return jsonify([
        {
            'session_id': s.session_id,
            'started_at': s.started_at.isoformat(),
            'last_message_at': s.last_message_at.isoformat(),
            'message_count': s.message_count
        }
        for s in sessions
    ])


@tutor_bp.route('/sessions/<session_id>', methods=['GET'])
def get_session(session_id: str):
    """Get all messages in a chat session."""
    messages = ChatMessage.query.filter_by(
        session_id=session_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    if not messages:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify({
        'session_id': session_id,
        'messages': [m.to_dict() for m in messages]
    })


@tutor_bp.route('/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id: str):
    """Delete a chat session and all its messages."""
    ChatMessage.query.filter_by(session_id=session_id).delete()
    db.session.commit()
    
    return jsonify({'message': 'Session deleted successfully'})


@tutor_bp.route('/ask', methods=['POST'])
def quick_ask():
    """Quick question without session persistence."""
    data = request.get_json()
    
    if not data or not data.get('question'):
        return jsonify({'error': 'Question is required'}), 400
    
    subject_context = None
    if data.get('subject_id'):
        subject = Subject.query.get(data['subject_id'])
        if subject:
            subject_context = subject.name
    
    try:
        response = ai_service.chat_tutor(
            message=data['question'],
            subject_context=subject_context
        )
        
        return jsonify({
            'question': data['question'],
            'answer': response
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
