"""
Quizzes API Routes
"""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Quiz, QuizQuestion, QuizAttempt, Subject, Note, Lecture
from app.services import ai_service
import json

quizzes_bp = Blueprint('quizzes', __name__)


@quizzes_bp.route('', methods=['GET'])
def get_quizzes():
    """Get all quizzes, optionally filtered by subject."""
    subject_id = request.args.get('subject_id', type=int)
    
    query = Quiz.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    
    quizzes = query.order_by(Quiz.created_at.desc()).all()
    return jsonify([q.to_dict() for q in quizzes])


@quizzes_bp.route('/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id: int):
    """Get a specific quiz with all questions."""
    quiz = Quiz.query.get_or_404(quiz_id)
    result = quiz.to_dict()
    
    # Include questions (without correct answers for taking the quiz)
    include_answers = request.args.get('include_answers', 'false').lower() == 'true'
    questions = []
    for q in quiz.questions.all():
        q_dict = q.to_dict()
        if not include_answers:
            del q_dict['correct_answer']
            del q_dict['explanation']
        questions.append(q_dict)
    
    result['questions'] = questions
    return jsonify(result)


@quizzes_bp.route('', methods=['POST'])
def create_quiz():
    """Create a new quiz manually."""
    data = request.get_json()
    
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
    
    if not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    Subject.query.get_or_404(data['subject_id'])
    
    quiz = Quiz(
        title=data['title'],
        description=data.get('description'),
        subject_id=data['subject_id']
    )
    
    db.session.add(quiz)
    db.session.commit()
    
    return jsonify(quiz.to_dict()), 201


@quizzes_bp.route('/generate', methods=['POST'])
def generate_quiz():
    """Generate a quiz from content using AI."""
    data = request.get_json()
    
    if not data or not data.get('subject_id'):
        return jsonify({'error': 'Subject ID is required'}), 400
    
    Subject.query.get_or_404(data['subject_id'])
    
    # Get content from note, lecture, or direct input
    content = None
    if data.get('note_id'):
        note = Note.query.get_or_404(data['note_id'])
        content = note.content
        default_title = f"Quiz: {note.title}"
    elif data.get('lecture_id'):
        lecture = Lecture.query.get_or_404(data['lecture_id'])
        content = lecture.transcription or lecture.summary
        default_title = f"Quiz: {lecture.title}"
    elif data.get('content'):
        content = data['content']
        default_title = "Generated Quiz"
    else:
        return jsonify({'error': 'Content source required (note_id, lecture_id, or content)'}), 400
    
    if not content:
        return jsonify({'error': 'No content available to generate quiz'}), 400
    
    try:
        # Generate quiz questions using AI
        num_questions = data.get('num_questions', 5)
        question_types = data.get('question_types', ['multiple_choice', 'true_false', 'short_answer'])
        
        generated_questions = ai_service.generate_quiz_questions(
            content, 
            num_questions, 
            question_types
        )
        
        # Create quiz
        quiz = Quiz(
            title=data.get('title', default_title),
            description=data.get('description'),
            subject_id=data['subject_id']
        )
        db.session.add(quiz)
        db.session.flush()
        
        # Create questions
        for q_data in generated_questions:
            question = QuizQuestion(
                question=q_data['question'],
                question_type=q_data['question_type'],
                options=json.dumps(q_data.get('options')) if q_data.get('options') else None,
                correct_answer=q_data['correct_answer'],
                explanation=q_data.get('explanation'),
                quiz_id=quiz.id
            )
            db.session.add(question)
        
        db.session.commit()
        
        result = quiz.to_dict()
        result['questions'] = [q.to_dict() for q in quiz.questions.all()]
        return jsonify(result), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@quizzes_bp.route('/<int:quiz_id>/questions', methods=['POST'])
def add_question(quiz_id: int):
    """Add a question to a quiz."""
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    
    if not data or not data.get('question'):
        return jsonify({'error': 'Question text is required'}), 400
    
    if not data.get('correct_answer'):
        return jsonify({'error': 'Correct answer is required'}), 400
    
    question = QuizQuestion(
        question=data['question'],
        question_type=data.get('question_type', 'short_answer'),
        options=json.dumps(data['options']) if data.get('options') else None,
        correct_answer=data['correct_answer'],
        explanation=data.get('explanation'),
        points=data.get('points', 1),
        quiz_id=quiz.id
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify(question.to_dict()), 201


@quizzes_bp.route('/questions/<int:question_id>', methods=['PUT'])
def update_question(question_id: int):
    """Update a quiz question."""
    question = QuizQuestion.query.get_or_404(question_id)
    data = request.get_json()
    
    if data.get('question'):
        question.question = data['question']
    if data.get('question_type'):
        question.question_type = data['question_type']
    if 'options' in data:
        question.options = json.dumps(data['options']) if data['options'] else None
    if data.get('correct_answer'):
        question.correct_answer = data['correct_answer']
    if 'explanation' in data:
        question.explanation = data['explanation']
    if data.get('points'):
        question.points = data['points']
    
    db.session.commit()
    
    return jsonify(question.to_dict())


@quizzes_bp.route('/questions/<int:question_id>', methods=['DELETE'])
def delete_question(question_id: int):
    """Delete a quiz question."""
    question = QuizQuestion.query.get_or_404(question_id)
    
    db.session.delete(question)
    db.session.commit()
    
    return jsonify({'message': 'Question deleted successfully'})


@quizzes_bp.route('/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id: int):
    """Submit quiz answers and get results."""
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    
    if not data or not data.get('answers'):
        return jsonify({'error': 'Answers are required'}), 400
    
    answers = data['answers']  # Dict: {question_id: user_answer}
    time_taken = data.get('time_taken_seconds')
    
    # Calculate score
    score = 0
    total_points = 0
    results = []
    
    for question in quiz.questions.all():
        total_points += question.points
        user_answer = answers.get(str(question.id))
        is_correct = False
        
        if user_answer:
            # Simple string comparison (case-insensitive)
            is_correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
            if is_correct:
                score += question.points
        
        results.append({
            'question_id': question.id,
            'question': question.question,
            'user_answer': user_answer,
            'correct_answer': question.correct_answer,
            'is_correct': is_correct,
            'explanation': question.explanation,
            'points': question.points if is_correct else 0
        })
    
    # Save attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        score=score,
        total_points=total_points,
        time_taken_seconds=time_taken,
        answers=json.dumps(answers)
    )
    
    db.session.add(attempt)
    db.session.commit()
    
    return jsonify({
        'attempt': attempt.to_dict(),
        'results': results
    })


@quizzes_bp.route('/<int:quiz_id>/attempts', methods=['GET'])
def get_quiz_attempts(quiz_id: int):
    """Get all attempts for a quiz."""
    quiz = Quiz.query.get_or_404(quiz_id)
    attempts = quiz.attempts.order_by(QuizAttempt.completed_at.desc()).all()
    return jsonify([a.to_dict() for a in attempts])


@quizzes_bp.route('/<int:quiz_id>', methods=['PUT'])
def update_quiz(quiz_id: int):
    """Update a quiz."""
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    
    if data.get('title'):
        quiz.title = data['title']
    if 'description' in data:
        quiz.description = data['description']
    
    db.session.commit()
    
    return jsonify(quiz.to_dict())


@quizzes_bp.route('/<int:quiz_id>', methods=['DELETE'])
def delete_quiz(quiz_id: int):
    """Delete a quiz and all its questions and attempts."""
    quiz = Quiz.query.get_or_404(quiz_id)
    
    db.session.delete(quiz)
    db.session.commit()
    
    return jsonify({'message': 'Quiz deleted successfully'})
