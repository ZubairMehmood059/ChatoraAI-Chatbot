import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

class Config:
    """Base application configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'chatora-dev-secret-key-change-in-prod')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database configuration with SQLite default and PostgreSQL production path
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{BASE_DIR / 'instance' / 'chatora.sqlite3'}"
    )
    
    # Gemini AI configuration
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash')
    
    # Limits & safety
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max payload
    MAX_MESSAGE_LENGTH = 8000
    REQUEST_TIMEOUT = 60  # seconds

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # In production, ensure SECRET_KEY is set securely
    SECRET_KEY = os.environ.get('SECRET_KEY')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
