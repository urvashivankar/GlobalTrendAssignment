"""
Configuration settings for Flask application
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration"""
    # MongoDB connection URI from environment variable
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    
    # Database and collection names
    DATABASE_NAME = 'task_manager'
    COLLECTION_NAME = 'tasks'
    USER_COLLECTION_NAME = 'users'
    
    # Secret key for JWT
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-prod')
