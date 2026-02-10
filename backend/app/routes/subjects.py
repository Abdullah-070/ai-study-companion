"""
Subjects API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Subject, User

subjects_bp = Blueprint('subjects', __name__)


@subjects_bp.route('', methods=['GET'])
@jwt_required()
def get_subjects():
    """Get all subjects for current user."""
    user_id = get_jwt_identity()
    subjects = Subject.query.filter_by(user_id=user_id).order_by(Subject.name).all()
    return jsonify([s.to_dict() for s in subjects])


@subjects_bp.route('/<int:subject_id>', methods=['GET'])
@jwt_required()
def get_subject(subject_id: int):
    """Get a specific subject by ID."""
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first_or_404()
    return jsonify(subject.to_dict())


@subjects_bp.route('', methods=['POST'])
@jwt_required()
def create_subject():
    """Create a new subject."""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Subject name is required'}), 400
    
    subject = Subject(
        user_id=user_id,
        name=data['name'],
        description=data.get('description'),
        color=data.get('color', '#3B82F6')
    )
    
    db.session.add(subject)
    db.session.commit()
    
    return jsonify(subject.to_dict()), 201


@subjects_bp.route('/<int:subject_id>', methods=['PUT'])
@jwt_required()
def update_subject(subject_id: int):
    """Update an existing subject."""
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first_or_404()
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
@jwt_required()
def delete_subject(subject_id: int):
    """Delete a subject and all related materials."""
    user_id = get_jwt_identity()
    subject = Subject.query.filter_by(id=subject_id, user_id=user_id).first_or_404()
    
    db.session.delete(subject)
    db.session.commit()
    
    return jsonify({'message': 'Subject deleted successfully'})
