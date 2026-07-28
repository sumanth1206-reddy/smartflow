import os
import urllib.parse
from datetime import timedelta
from dotenv import load_dotenv

# Load env variables from .env file relative to this file
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

db_url = os.environ.get('DATABASE_URL', '')

if db_url:
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    
    # Auto-encode special characters in password if present
    try:
        if '://' in db_url and '@' in db_url:
            scheme, rest = db_url.split('://', 1)
            user_pass, host_db = rest.rsplit('@', 1)
            if ':' in user_pass:
                user, password = user_pass.split(':', 1)
                # Ensure password is URL encoded safely
                encoded_password = urllib.parse.quote_plus(urllib.parse.unquote(password))
                db_url = f"{scheme}://{user}:{encoded_password}@{host_db}"
    except Exception:
        pass
else:
    db_url = 'postgresql://localhost:5432/smartflow'

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'flask-session-fallback-secret-key')
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Engine connection pool options for Supabase cloud PostgreSQL
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'smartflow-jwt-super-secret-key-change-this-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size


