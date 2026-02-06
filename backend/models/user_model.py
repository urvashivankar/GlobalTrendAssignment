"""
User model for MongoDB operations
"""
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

class UserModel:
    """Handles all database operations for users"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        self.client = MongoClient(Config.MONGO_URI)
        self.db = self.client[Config.DATABASE_NAME]
        self.collection = self.db[Config.USER_COLLECTION_NAME]
        # Create unique index on email
        self.collection.create_index("email", unique=True)
    
    def create_user(self, user_data):
        """
        Create a new user with hashed password
        """
        user_data['password'] = generate_password_hash(user_data['password'])
        user_data['created_at'] = datetime.utcnow()
        
        try:
            result = self.collection.insert_one(user_data)
            return str(result.inserted_id)
        except Exception as e:
            if "duplicate key error" in str(e):
                return "email_exists"
            return str(e)
    
    def get_user_by_email(self, email):
        """
        Find a user by email
        """
        user = self.collection.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user
    
    def verify_password(self, stored_password, provided_password):
        """
        Check if provided password matches the stored hash
        """
        return check_password_hash(stored_password, provided_password)
    
    def get_user_by_id(self, user_id):
        """
        Find a user by ID
        """
        try:
            user = self.collection.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                # Don't return password hash
                user.pop('password', None)
            return user
        except Exception:
            return None
