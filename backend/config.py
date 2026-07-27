import os
from datetime import timedelta
from dotenv import load_dotenv

# Load env variables from .env file relative to this file
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env'))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'flask-session-fallback-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://localhost:5432/smartflow')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'smartflow-jwt-super-secret-key-change-this-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # Upload folder
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload size
