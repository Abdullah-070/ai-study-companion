"""
AI Study Companion - Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name: str = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    
    # Database URL configuration - convert psycopg2 to psycopg3 for Python 3.13 compatibility
    database_url = os.getenv('DATABASE_URL', '')
    if database_url and database_url.startswith('postgresql://'):
        # Convert postgresql:// to postgresql+psycopg:// for psycopg3
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    elif not database_url:
        # Use SQLite as fallback if DATABASE_URL not set
        database_url = 'sqlite:///study_companion.db'
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')
    
    # JWT Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Token expires based on timedelta
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Configure CORS - allow frontend and localhost for development
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    cors_origins = [
        frontend_url,
        'http://localhost:3000',
        'http://localhost:3001',
        'https://ai-study-companion-zeta.vercel.app'
    ]
    CORS(app, 
         origins=cors_origins,
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.lectures import lectures_bp
    from app.routes.notes import notes_bp
    from app.routes.flashcards import flashcards_bp
    from app.routes.quizzes import quizzes_bp
    from app.routes.tutor import tutor_bp
    from app.routes.subjects import subjects_bp
    from app.routes.oauth import oauth_bp, init_oauth
    
    # Initialize OAuth
    init_oauth(app)
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(oauth_bp, url_prefix='/api/auth/oauth')
    app.register_blueprint(lectures_bp, url_prefix='/api/lectures')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(flashcards_bp, url_prefix='/api/flashcards')
    app.register_blueprint(quizzes_bp, url_prefix='/api/quizzes')
    app.register_blueprint(tutor_bp, url_prefix='/api/tutor')
    app.register_blueprint(subjects_bp, url_prefix='/api/subjects')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'AI Study Companion API is running'}
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
