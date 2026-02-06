
const API_BASE_URL = 'http://localhost:5000';

const taskForm = document.getElementById('taskForm');
const tasksContainer = document.getElementById('tasksContainer');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeModal = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const authOverlay = document.getElementById('authOverlay');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const mainContent = document.getElementById('mainContent');
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userNameDisplay = document.getElementById('userNameDisplay');

let allTasks = [];


document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authOverlay.style.display = 'none';
        mainContent.style.display = 'block';
        userNameDisplay.textContent = `Welcome, ${user.name}`;
        loadTasks();
    } else {
        authOverlay.style.display = 'flex';
        mainContent.style.display = 'none';
    }
}

function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);

    editForm.addEventListener('submit', handleUpdateTask);

    closeModal.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);

    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });

    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    logoutBtn.addEventListener('click', handleLogout);

    searchInput.addEventListener('input', filterTasks);
    statusFilter.addEventListener('change', filterTasks);
    priorityFilter.addEventListener('change', filterTasks);
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            loginForm.reset();
            checkAuth();
            showSuccess('Login successful!');
        } else {
            showError(data.message || 'Login failed');
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
    }
}


async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();

        if (response.ok) {
            showSuccess('Account created! Please login.');
            signupForm.reset();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        } else {
            showError(data.message || 'Signup failed');
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
    }
}


function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    showSuccess('Logged out successfully');
}

async function loadTasks() {
    try {
        showLoading();

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            allTasks = data.tasks || [];
            displayTasks(allTasks);
        } else {
            showError('Failed to load tasks: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error connecting to server: ' + error.message);
        console.error('Error loading tasks:', error);
    }
}


function displayTasks(tasks) {
    tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
        tasksContainer.innerHTML = '<div class="empty-state">No tasks found. Create your first task above!</div>';
        return;
    }

    tasks.forEach(task => {
        const taskCard = createTaskCard(task);
        tasksContainer.appendChild(taskCard);
    });
}


function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task._id;

    const createdDate = task.created_at
        ? new Date(task.created_at).toLocaleString()
        : 'Unknown';

    const statusClass = task.status.toLowerCase().replace(' ', '-');

    const priorityClass = (task.priority || 'Medium').toLowerCase();

    let dueDateHtml = '';
    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueClass = dueDate < today && task.status !== 'Completed' ? 'overdue' : '';
        dueDateHtml = `<p class="due-date ${overdueClass}">Due: ${dueDate.toLocaleDateString()}</p>`;
    }

    card.innerHTML = `
        <h3>${escapeHtml(task.title)}</h3>
        <p class="description">${escapeHtml(task.description || 'No description')}</p>
        <div class="badges">
            <span class="status status-${statusClass}">${escapeHtml(task.status)}</span>
            <span class="priority priority-${priorityClass}">${escapeHtml(task.priority || 'Medium')}</span>
        </div>
        <p class="created-at">Created: ${createdDate}</p>
        ${dueDateHtml}
        <div class="actions">
            <button class="btn-edit" onclick="openEditModal('${task._id}')">Edit</button>
            <button class="btn-delete" onclick="handleDeleteTask('${task._id}')">Delete</button>
        </div>
    `;

    return card;
}

async function handleAddTask(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        due_date: document.getElementById('dueDate').value
    };

    if (!formData.title) {
        showError('Title is required');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            taskForm.reset();
            showSuccess('Task created successfully!');
            loadTasks();
        } else {
            showError('Failed to create task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error creating task: ' + error.message);
        console.error('Error creating task:', error);
    }
}


async function openEditModal(taskId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.task) {
            const task = data.task;

            document.getElementById('editTaskId').value = task._id;
            document.getElementById('editTitle').value = task.title || '';
            document.getElementById('editDescription').value = task.description || '';
            document.getElementById('editStatus').value = task.status || 'Pending';
            document.getElementById('editPriority').value = task.priority || 'Medium';

            if (task.due_date) {
                const date = new Date(task.due_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                document.getElementById('editDueDate').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('editDueDate').value = '';
            }

            editModal.style.display = 'block';
        } else {
            showError('Failed to load task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error loading task: ' + error.message);
        console.error('Error loading task:', error);
    }
}


function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

async function handleUpdateTask(event) {
    event.preventDefault();

    const taskId = document.getElementById('editTaskId').value;
    const formData = {
        title: document.getElementById('editTitle').value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        status: document.getElementById('editStatus').value,
        priority: document.getElementById('editPriority').value,
        due_date: document.getElementById('editDueDate').value
    };
    if (!formData.title) {
        showError('Title is required');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            closeEditModal();
            showSuccess('Task updated successfully!');
            loadTasks();
        } else {
            showError('Failed to update task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error updating task: ' + error.message);
        console.error('Error updating task:', error);
    }
}


async function handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Task deleted successfully!');
            loadTasks();
        } else {
            showError('Failed to delete task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error deleting task: ' + error.message);
        console.error('Error deleting task:', error);
    }
}


function showLoading() {
    tasksContainer.innerHTML = '<div class="loading">Loading tasks...</div>';
}


function showError(message) {
    removeMessages();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);

    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}


function showSuccess(message) {
    removeMessages();

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);

    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}


function removeMessages() {
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
}


function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusVal = statusFilter.value;
    const priorityVal = priorityFilter.value;

    const filteredTasks = allTasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm));

        const matchesStatus = statusVal === 'All' || task.status === statusVal;

        const matchesPriority = priorityVal === 'All' || (task.priority || 'Medium') === priorityVal;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    displayTasks(filteredTasks);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
