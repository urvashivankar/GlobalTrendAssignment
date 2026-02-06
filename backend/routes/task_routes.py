"""
Task routes for REST API endpoints
"""
from flask import Blueprint, request, jsonify
from bson import ObjectId
from models.task_model import TaskModel
from routes.user_routes import token_required

task_bp = Blueprint('tasks', __name__)

task_model = TaskModel()

VALID_STATUSES = ['Pending', 'In Progress', 'Completed']
VALID_PRIORITIES = ['Low', 'Medium', 'High']

def _is_valid_task_id(task_id: str) -> bool:
    """Validate MongoDB ObjectId string."""
    return ObjectId.is_valid(task_id)

@task_bp.route('', methods=['POST'])
@token_required
def create_task(current_user):
    """
    Create a new task
    POST /tasks
    
    Request body:
    {
        "title": "Task title",
        "description": "Task description",
        "status": "Pending"
    }
    
    Returns:
        JSON response with created task or error message
    """
    try:
        data = request.get_json()
                if not data or 'title' not in data:
            return jsonify({
                'error': 'Title is required',
                'message': 'Please provide a title for the task'
            }), 400

        if not str(data.get('title', '')).strip():
            return jsonify({
                'error': 'Title is required',
                'message': 'Please provide a non-empty title for the task'
            }), 400
        
        if 'status' in data and data['status'] not in VALID_STATUSES:
            return jsonify({
                'error': 'Invalid status',
                'message': f'Status must be one of: {", ".join(VALID_STATUSES)}'
            }), 400
        
        if 'priority' in data and data['priority'] not in VALID_PRIORITIES:
            return jsonify({
                'error': 'Invalid priority',
                'message': f'Priority must be one of: {", ".join(VALID_PRIORITIES)}'
            }), 400
        
        task_data = {
            'user_id': current_user['_id'],
            'title': data['title'].strip(),
            'description': data.get('description', '').strip(),
            'status': data.get('status', 'Pending'),
            'priority': data.get('priority', 'Medium'),
            'due_date': None
        }

        if 'due_date' in data and data['due_date']:
            from datetime import datetime
            try:
                task_data['due_date'] = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            except ValueError:
                return jsonify({
                    'error': 'Invalid date format',
                    'message': 'Due date must be in ISO format'
                }), 400
        
        task = task_model.create_task(task_data)
        
        return jsonify({
            'message': 'Task created successfully',
            'task': task
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@task_bp.route('', methods=['GET'])
@token_required
def get_all_tasks(current_user):
    """
    Get all tasks for current user
    GET /tasks
    
    Returns:
        JSON response with list of all tasks
    """
    try:
        tasks = task_model.get_all_tasks(current_user['_id'])
        return jsonify({
            'message': 'Tasks retrieved successfully',
            'tasks': tasks,
            'count': len(tasks)
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@task_bp.route('/<task_id>', methods=['GET'])
@token_required
def get_task_by_id(current_user, task_id):
    """
    Get a task by ID
    GET /tasks/<id>
    
    Args:
        task_id: Task ID
        
    Returns:
        JSON response with task data or error message
    """
    try:
        if not _is_valid_task_id(task_id):
            return jsonify({
                'error': 'Invalid task ID',
                'message': 'Task ID must be a valid MongoDB ObjectId'
            }), 400

        task = task_model.get_task_by_id(task_id)
        
        if not task:
            return jsonify({
                'error': 'Task not found',
                'message': f'No task found with ID: {task_id}'
            }), 404
        
        return jsonify({
            'message': 'Task retrieved successfully',
            'task': task
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@task_bp.route('/<task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    """
    Update a task by ID
    PUT /tasks/<id>
    
    Request body:
    {
        "title": "Updated title",
        "description": "Updated description",
        "status": "In Progress"
    }
    
    Args:
        task_id: Task ID
        
    Returns:
        JSON response with updated task or error message
    """
    try:
        if not _is_valid_task_id(task_id):
            return jsonify({
                'error': 'Invalid task ID',
                'message': 'Task ID must be a valid MongoDB ObjectId'
            }), 400

        existing_task = task_model.get_task_by_id(task_id)
        if not existing_task:
            return jsonify({
                'error': 'Task not found',
                'message': f'No task found with ID: {task_id}'
            }), 404
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request body is required'
            }), 400

        if 'title' in data and not str(data.get('title', '')).strip():
            return jsonify({
                'error': 'Title is required',
                'message': 'Please provide a non-empty title for the task'
            }), 400
        
        if 'priority' in data and data['priority'] not in VALID_PRIORITIES:
            return jsonify({
                'error': 'Invalid priority',
                'message': f'Priority must be one of: {", ".join(VALID_PRIORITIES)}'
            }), 400
        
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title'].strip()
        if 'description' in data:
            update_data['description'] = data['description'].strip()
        if 'status' in data:
            update_data['status'] = data['status']
        if 'priority' in data:
            update_data['priority'] = data['priority']
        if 'due_date' in data:
            if data['due_date']:
                from datetime import datetime
                try:
                    update_data['due_date'] = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
                except ValueError:
                    return jsonify({
                        'error': 'Invalid date format',
                        'message': 'Due date must be in ISO format'
                    }), 400
            else:
                update_data['due_date'] = None
        
        updated_task = task_model.update_task(task_id, update_data)
        
        if not updated_task:
            return jsonify({
                'error': 'Update failed',
                'message': 'Could not update the task'
            }), 500
        
        return jsonify({
            'message': 'Task updated successfully',
            'task': updated_task
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@task_bp.route('/<task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    """
    Delete a task by ID
    DELETE /tasks/<id>
    
    Args:
        task_id: Task ID
        
    Returns:
        JSON response with success or error message
    """
    try:
        if not _is_valid_task_id(task_id):
            return jsonify({
                'error': 'Invalid task ID',
                'message': 'Task ID must be a valid MongoDB ObjectId'
            }), 400

        existing_task = task_model.get_task_by_id(task_id)
        if not existing_task:
            return jsonify({
                'error': 'Task not found',
                'message': f'No task found with ID: {task_id}'
            }), 404
        
        deleted = task_model.delete_task(task_id)
        
        if not deleted:
            return jsonify({
                'error': 'Delete failed',
                'message': 'Could not delete the task'
            }), 500
        
        return jsonify({
            'message': 'Task deleted successfully',
            'task_id': task_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500
