"""
Subjects API Routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Subject

subjects_bp = Blueprint('subjects', __name__)


@subjects_bp.route('', methods=['GET'])
def get_subjects():
    """Get all subjects."""
    subjects = Subject.query.order_by(Subject.name).all()
    return jsonify([s.to_dict() for s in subjects])


@subjects_bp.route('/<int:subject_id>', methods=['GET'])
def get_subject(subject_id: int):
    """Get a specific subject by ID."""
    subject = Subject.query.get_or_404(subject_id)
    return jsonify(subject.to_dict())


@subjects_bp.route('', methods=['POST'])
def create_subject():
    """Create a new subject."""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Subject name is required'}), 400
    
    subject = Subject(
        name=data['name'],
        description=data.get('description'),
        color=data.get('color', '#3B82F6')
    )
    
    db.session.add(subject)
    db.session.commit()
    
    return jsonify(subject.to_dict()), 201


@subjects_bp.route('/<int:subject_id>', methods=['PUT'])
def update_subject(subject_id: int):
    """Update an existing subject."""
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()
    
    if data.get('name'):
        subject.name = data['name']
    if 'description' in data:
        subject.description = data['description']
    if data.get('color'):
        subject.color = data['color']
    
    db.session.commit()
    
    return jsonify(subject.to_dict())


@subjects_bp.route('/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id: int):
    """Delete a subject and all related materials."""
    subject = Subject.query.get_or_404(subject_id)
    
    db.session.delete(subject)
    db.session.commit()
    
    return jsonify({'message': 'Subject deleted successfully'})
