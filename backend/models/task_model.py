"""
Task model for MongoDB operations
"""
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from config import Config

class TaskModel:
    """Handles all database operations for tasks"""
    
    def __init__(self):
        """Initialize MongoDB connection"""
        # Fail fast if MongoDB is unreachable (helps beginners debug quickly)
        self.client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        self.db = self.client[Config.DATABASE_NAME]
        self.collection = self.db[Config.COLLECTION_NAME]
    
    def create_task(self, task_data):
        """
        Create a new task in the database
        
        Args:
            task_data (dict): Task data containing title, description, status, user_id
            
        Returns:
            dict: Created task with _id converted to string
        """
        # Add created_at timestamp
        task_data['created_at'] = datetime.utcnow()
        
        # Insert task into database
        result = self.collection.insert_one(task_data)
        
        # Return the created task
        return self.get_task_by_id(str(result.inserted_id))
    
    def get_all_tasks(self, user_id):
        """
        Get all tasks for a specific user from the database
        
        Args:
            user_id (str): ID of the user whose tasks should be retrieved

        Returns:
            list: List of all tasks with _id converted to string
        """
        tasks = list(self.collection.find({'user_id': user_id}).sort('created_at', -1))
        return self._convert_objectid_to_string(tasks)
    
    def get_task_by_id(self, task_id):
        """
        Get a single task by ID
        
        Args:
            task_id (str): Task ID as string
            
        Returns:
            dict: Task data with _id converted to string, or None if not found
        """
        try:
            task = self.collection.find_one({'_id': ObjectId(task_id)})
            if task:
                return self._convert_objectid_to_string([task])[0]
            return None
        except Exception:
            return None
    
    def update_task(self, task_id, update_data):
        """
        Update a task by ID
        
        Args:
            task_id (str): Task ID as string
            update_data (dict): Fields to update
            
        Returns:
            dict: Updated task with _id converted to string, or None if not found
        """
        try:
            # Remove _id from update_data if present (cannot update _id)
            update_data.pop('_id', None)
            
            result = self.collection.update_one(
                {'_id': ObjectId(task_id)},
                {'$set': update_data}
            )
            
            # If a document was matched, return the latest copy even if the update
            # didn't change any fields (modified_count may be 0).
            if result.matched_count == 0:
                return None
            return self.get_task_by_id(task_id)
        except Exception:
            return None
    
    def delete_task(self, task_id):
        """
        Delete a task by ID
        
        Args:
            task_id (str): Task ID as string
            
        Returns:
            bool: True if deleted, False if not found
        """
        try:
            result = self.collection.delete_one({'_id': ObjectId(task_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    def _convert_objectid_to_string(self, tasks):
        """
        Convert MongoDB ObjectId to string for JSON serialization
        
        Args:
            tasks (list): List of task documents
            
        Returns:
            list: List of tasks with _id as string
        """
        for task in tasks:
            if '_id' in task:
                task['_id'] = str(task['_id'])
            # Convert datetime to ISO format string
            if 'created_at' in task and isinstance(task['created_at'], datetime):
                task['created_at'] = task['created_at'].isoformat()
            if 'due_date' in task and isinstance(task['due_date'], datetime):
                task['due_date'] = task['due_date'].isoformat()
        return tasks
