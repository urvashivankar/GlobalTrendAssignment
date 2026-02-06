"""
Configuration settings for Flask application
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    
    DATABASE_NAME = 'task_manager'
    COLLECTION_NAME = 'tasks'
    USER_COLLECTION_NAME = 'users'
    
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-this-in-prod')
