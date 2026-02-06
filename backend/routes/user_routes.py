"""
User authentication routes
"""
from flask import Blueprint, request, jsonify
import jwt
from datetime import datetime, timedelta
from models.user_model import UserModel
from config import Config
from functools import wraps

auth_bp = Blueprint('auth', __name__)
user_model = UserModel()

def token_required(f):
    """Decorator to protect routes with JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Token usually comes as "Bearer <token>"
            if token.startswith('Bearer '):
                token = token.split(" ")[1]
            
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user = user_model.get_user_by_id(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing email, password or name'}), 400
        
    res = user_model.create_user({
        'email': data['email'].lower().strip(),
        'password': data['password'],
        'name': data['name'].strip()
    })
    
    if res == "email_exists":
        return jsonify({'message': 'Email already registered'}), 400
    elif isinstance(res, str) and len(res) == 24: # Valid ObjectId length
        return jsonify({'message': 'User created successfully'}), 201
    else:
        return jsonify({'message': 'Error creating user', 'error': str(res)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = user_model.get_user_by_email(data['email'].lower().strip())
    
    if user and user_model.verify_password(user['password'], data['password']):
        token = jwt.encode({
            'user_id': user['_id'],
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm="HS256")
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'name': user['name'],
                'email': user['email']
            }
        }), 200
        
    return jsonify({'message': 'Invalid email or password'}), 401
