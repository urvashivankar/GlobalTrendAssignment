"""
Main Flask application entry point
"""
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.task_routes import task_bp
from routes.user_routes import auth_bp
from config import Config
import os

def create_app():
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
    app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
    app.config.from_object(Config)
    
    CORS(app)
    
    app.register_blueprint(task_bp, url_prefix='/tasks')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    @app.route('/')
    def serve_frontend():
        return send_from_directory(app.static_folder, 'index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
