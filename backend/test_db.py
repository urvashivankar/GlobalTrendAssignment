import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

def test_connection():
    # Add the current directory to path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    load_dotenv()
    mongo_uri = os.getenv('MONGO_URI')
    
    if not mongo_uri or '<username>' in mongo_uri:
        print("[ERROR] MONGO_URI not properly set in .env file.")
        return False
        
    try:
        print("Connecting to MongoDB...")
        # Add serverSelectionTimeoutMS to fail faster if the connection can't be established
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Verify the server is available
        client.admin.command('ismaster')
        print("[SUCCESS] Successfully connected to MongoDB Atlas!")
        
        # List databases to fully verify authentication
        db_names = client.list_database_names()
        print(f"Available databases: {', '.join(db_names)}")
        return True
    except Exception as e:
        print(f"[ERROR] Could not connect to MongoDB. Details: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection()
