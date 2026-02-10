"""
OAuth API Routes for Google and GitHub authentication
"""
from flask import Blueprint, request, jsonify, redirect, url_for, session
from flask_jwt_extended import create_access_token, create_refresh_token
from authlib.integrations.flask_client import OAuth
from app import db
from app.models import User
import os

oauth_bp = Blueprint('oauth', __name__)
oauth = OAuth()

# Configure OAuth providers
def init_oauth(app):
    oauth.init_app(app)
    
    oauth.register(
        name='google',
        client_id=os.getenv('GOOGLE_CLIENT_ID'),
        client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
    
    oauth.register(
        name='github',
        client_id=os.getenv('GITHUB_CLIENT_ID'),
        client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        api_base_url='https://api.github.com/',
        client_kwargs={'scope': 'user:email'},
    )


@oauth_bp.route('/google/authorize', methods=['GET'])
def google_authorize():
    """Initiate Google OAuth flow"""
    from authlib.integrations.flask_client import oauth as oauth_instance
    
    google = oauth_instance.google
    redirect_uri = request.args.get('redirect_uri', url_for('oauth.google_callback', _external=True))
    
    return google.authorize_redirect(redirect_uri)


@oauth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    """Handle Google OAuth callback"""
    from authlib.integrations.flask_client import oauth as oauth_instance
    
    try:
        google = oauth_instance.google
        token = google.authorize_access_token()
        user_data = token.get('userinfo')
        
        if not user_data:
            return jsonify({'error': 'Failed to get user info from Google'}), 400
        
        email = user_data.get('email')
        name = user_data.get('name')
        
        # Find or create user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user
            username = email.split('@')[0]
            # Ensure unique username
            counter = 1
            original_username = username
            while User.query.filter_by(username=username).first():
                username = f"{original_username}{counter}"
                counter += 1
            
            user = User(
                username=username,
                email=email,
                full_name=name or username,
                email_verified=True  # Google emails are verified
            )
            # Set a random password (user won't use it for OAuth)
            user.set_password(os.urandom(32).hex())
            db.session.add(user)
            db.session.commit()
        else:
            # Mark email as verified if using OAuth
            if not user.email_verified:
                user.email_verified = True
                db.session.commit()
        
        # Generate JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Redirect to frontend with tokens
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        redirect_url = f"{frontend_url}/app/oauth-callback?access_token={access_token}&refresh_token={refresh_token}"
        
        return redirect(redirect_url)
        
    except Exception as e:
        import traceback
        print(f"Google OAuth error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@oauth_bp.route('/github/authorize', methods=['GET'])
def github_authorize():
    """Initiate GitHub OAuth flow"""
    from authlib.integrations.flask_client import oauth as oauth_instance
    
    github = oauth_instance.github
    redirect_uri = request.args.get('redirect_uri', url_for('oauth.github_callback', _external=True))
    
    return github.authorize_redirect(redirect_uri)


@oauth_bp.route('/github/callback', methods=['GET'])
def github_callback():
    """Handle GitHub OAuth callback"""
    from authlib.integrations.flask_client import oauth as oauth_instance
    
    try:
        github = oauth_instance.github
        token = github.authorize_access_token()
        
        # Get user info from GitHub
        resp = github.get('user', token=token)
        user_data = resp.json()
        
        email = user_data.get('email')
        name = user_data.get('name')
        username = user_data.get('login')
        
        # If email is not public, try to get it from the API
        if not email:
            resp = github.get('user/emails', token=token)
            emails = resp.json()
            primary_email = next((e for e in emails if e.get('primary')), None)
            if primary_email:
                email = primary_email.get('email')
        
        if not email:
            return jsonify({'error': 'Could not get email from GitHub'}), 400
        
        # Find or create user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Create new user
            # Ensure unique username
            db_username = username
            counter = 1
            while User.query.filter_by(username=db_username).first():
                db_username = f"{username}{counter}"
                counter += 1
            
            user = User(
                username=db_username,
                email=email,
                full_name=name or username,
                email_verified=True  # GitHub verified emails are trusted
            )
            # Set a random password (user won't use it for OAuth)
            user.set_password(os.urandom(32).hex())
            db.session.add(user)
            db.session.commit()
        else:
            # Mark email as verified if using OAuth
            if not user.email_verified:
                user.email_verified = True
                db.session.commit()
        
        # Generate JWT tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        # Redirect to frontend with tokens
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        redirect_url = f"{frontend_url}/app/oauth-callback?access_token={access_token}&refresh_token={refresh_token}"
        
        return redirect(redirect_url)
        
    except Exception as e:
        import traceback
        print(f"GitHub OAuth error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
