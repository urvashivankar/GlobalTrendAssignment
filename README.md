# Task Management System

A full-stack, multi-user web application for managing tasks with a clean, modern interface. Built with Flask (Python) backend, vanilla JavaScript frontend, and MongoDB Atlas database.

## 🚀 Features

- 🔐 **User Authentication**: Secure sign-up and login with hashed passwords (JWT-based).
- 👤 **Private Tasks**: Each user has their own personal task list.
- ✅ **Task Management**: Create, view, update, and delete tasks.
- 📅 **Due Dates**: Set deadlines for your tasks.
- 🚦 **Priority Levels**: Assign priorities (Low, Medium, High) with color-coded badges.
- 🔍 **Search & Filter**: Find tasks instantly by title or description, and filter by status or priority.
- 🎨 **Modern UI**: Clean, responsive design with glassmorphism elements and smooth transitions.
- 🔄 **Integrated Server**: Flask backend now serves both the API and the frontend files.

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Structure
- **CSS3** - Custom styling with Flexbox/Grid and Glassmorphism
- **Vanilla JavaScript** - Pure JS with Fetch API and Token-based Auth

### Backend
- **Python 3.8+** - Programming language
- **Flask** - Web framework
- **JWT (PyJWT)** - JSON Web Tokens for secure authentication
- **Werkzeug** - For secure password hashing
- **PyMongo** - MongoDB driver
- **python-dotenv** - Environment variable management

### Database
- **MongoDB Atlas** - Cloud database service

## 📁 Project Structure

```
task-management-system/
│
├── backend/
│   ├── app.py                 # Main Flask application & Static Server
│   ├── config.py              # Configuration & Secret Keys
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   ├── models/
│   │   ├── task_model.py      # Task database operations
│   │   └── user_model.py      # User authentication logic
│   └── routes/
│       ├── task_routes.py     # Protected Task API endpoints
│       └── user_routes.py     # Authentication endpoints (Signup/Login)
│
├── frontend/
│   ├── index.html             # Main entry point (Login/Signup & Dashboard)
│   ├── style.css              # Custom styles
│   └── script.js              # Auth & Task management logic
│
└── README.md                  # This file
```

## 🔧 Setup Instructions

### Step 1: MongoDB Atlas Setup
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with "Read and write to any database" permissions.
3. Whitelist your IP address (or allow from anywhere `0.0.0.0/0`).
4. Get your connection string (Srv format).

### Step 2: Backend Setup
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Create a `.env` file in the `backend` folder:
   ```env
   MONGO_URI=mongodb+srv://<user>:<pass>@yourcluster.mongodb.net/task_manager
   SECRET_KEY=your_random_secret_string
   ```

### Step 3: Running the Application
1. Start the Flask server:
   ```bash
   python app.py
   ```
2. Open your browser and go to: **`http://127.0.0.1:5000`**
3. Create an account via the "Sign up" link to get started!

## 📡 API Documentation

### Auth Endpoints
- `POST /auth/signup`: Create a new user (Body: name, email, password)
- `POST /auth/login`: Login and receive JWT token (Body: email, password)

### Task Endpoints (Requires `Authorization: Bearer <token>`)
- `GET /tasks`: Retrieve tasks for the logged-in user
- `POST /tasks`: Create a new task
- `PUT /tasks/<id>`: Update a task
- `DELETE /tasks/<id>`: Delete a task

## 🗄️ Database Schema

### Collection: `tasks`
- `user_id`: Reference to the user who owns the task
- `title`: Task title
- `description`: Detailed description
- `status`: Pending | In Progress | Completed
- `priority`: Low | Medium | High
- `due_date`: Task deadline
- `created_at`: Creation timestamp

## 🔒 Security Notes
- Passwords are encrypted using `pbkdf2:sha256` hashing.
- API endpoints are protected using JWT (JSON Web Tokens).
- Always keep your `SECRET_KEY` private.

---
**Happy Coding! 🚀**
