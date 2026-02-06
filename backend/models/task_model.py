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
        self.client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        self.db = self.client[Config.DATABASE_NAME]
        self.collection = self.db[Config.COLLECTION_NAME]
    
    def create_task(self, task_data):
       
        task_data['created_at'] = datetime.utcnow()
        
        result = self.collection.insert_one(task_data)
        
        return self.get_task_by_id(str(result.inserted_id))
    
    def get_all_tasks(self, user_id):
        
        tasks = list(self.collection.find({'user_id': user_id}).sort('created_at', -1))
        return self._convert_objectid_to_string(tasks)
    
    def get_task_by_id(self, task_id):
       
        try:
            task = self.collection.find_one({'_id': ObjectId(task_id)})
            if task:
                return self._convert_objectid_to_string([task])[0]
            return None
        except Exception:
            return None
    
    def update_task(self, task_id, update_data):
       
        try:
            update_data.pop('_id', None)
            
            result = self.collection.update_one(
                {'_id': ObjectId(task_id)},
                {'$set': update_data}
            )
            
            
            if result.matched_count == 0:
                return None
            return self.get_task_by_id(task_id)
        except Exception:
            return None
    
    def delete_task(self, task_id):
       
        try:
            result = self.collection.delete_one({'_id': ObjectId(task_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    def _convert_objectid_to_string(self, tasks):
       
        for task in tasks:
            if '_id' in task:
                task['_id'] = str(task['_id'])
            if 'created_at' in task and isinstance(task['created_at'], datetime):
                task['created_at'] = task['created_at'].isoformat()
            if 'due_date' in task and isinstance(task['due_date'], datetime):
                task['due_date'] = task['due_date'].isoformat()
        return tasks
