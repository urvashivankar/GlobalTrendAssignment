
// Backend API base URL
const API_BASE_URL = 'http://localhost:5000';

// DOM Elements
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

// Global state
let allTasks = [];

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

/**
 * Check if user is authenticated
 */
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
    // Add task form submission
    taskForm.addEventListener('submit', handleAddTask);

    // Edit form submission
    editForm.addEventListener('submit', handleUpdateTask);

    // Close modal events
    closeModal.addEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            closeEditModal();
        }
    });

    // Auth events
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

    // Filtering event listeners
    searchInput.addEventListener('input', filterTasks);
    statusFilter.addEventListener('change', filterTasks);
    priorityFilter.addEventListener('change', filterTasks);
}

/**
 * Handle Login
 */
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

/**
 * Handle Signup
 */
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

/**
 * Handle Logout
 */
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
    showSuccess('Logged out successfully');
}

/**
 * Load all tasks from the backend
 */
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

/**
 * Display tasks in the container
 */
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

/**
 * Create a task card element
 */
function createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task._id;

    // Format created_at date
    const createdDate = task.created_at
        ? new Date(task.created_at).toLocaleString()
        : 'Unknown';

    // Status class for styling
    const statusClass = task.status.toLowerCase().replace(' ', '-');

    // Priority class for styling
    const priorityClass = (task.priority || 'Medium').toLowerCase();

    // Due date display
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

/**
 * Handle add task form submission
 */
async function handleAddTask(event) {
    event.preventDefault();

    const formData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        status: document.getElementById('status').value,
        priority: document.getElementById('priority').value,
        due_date: document.getElementById('dueDate').value
    };

    // Validate title
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
            // Reset form
            taskForm.reset();
            showSuccess('Task created successfully!');
            // Reload tasks
            loadTasks();
        } else {
            showError('Failed to create task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error creating task: ' + error.message);
        console.error('Error creating task:', error);
    }
}

/**
 * Open edit modal and populate with task data
 */
async function openEditModal(taskId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok && data.task) {
            const task = data.task;

            // Populate form fields
            document.getElementById('editTaskId').value = task._id;
            document.getElementById('editTitle').value = task.title || '';
            document.getElementById('editDescription').value = task.description || '';
            document.getElementById('editStatus').value = task.status || 'Pending';
            document.getElementById('editPriority').value = task.priority || 'Medium';

            // Format date for input field (YYYY-MM-DD)
            if (task.due_date) {
                const date = new Date(task.due_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                document.getElementById('editDueDate').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('editDueDate').value = '';
            }

            // Show modal
            editModal.style.display = 'block';
        } else {
            showError('Failed to load task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error loading task: ' + error.message);
        console.error('Error loading task:', error);
    }
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.style.display = 'none';
    editForm.reset();
}

/**
 * Handle update task form submission
 */
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

    // Validate title
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
            // Reload tasks
            loadTasks();
        } else {
            showError('Failed to update task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error updating task: ' + error.message);
        console.error('Error updating task:', error);
    }
}

/**
 * Handle delete task
 */
async function handleDeleteTask(taskId) {
    // Confirm deletion
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
            // Reload tasks
            loadTasks();
        } else {
            showError('Failed to delete task: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        showError('Error deleting task: ' + error.message);
        console.error('Error deleting task:', error);
    }
}

/**
 * Show loading state
 */
function showLoading() {
    tasksContainer.innerHTML = '<div class="loading">Loading tasks...</div>';
}

/**
 * Show error message
 */
function showError(message) {
    // Remove existing messages
    removeMessages();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

/**
 * Show success message
 */
function showSuccess(message) {
    // Remove existing messages
    removeMessages();

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

/**
 * Remove existing messages
 */
function removeMessages() {
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
}

/**
 * Filter tasks based on search input and filter selections
 */
function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusVal = statusFilter.value;
    const priorityVal = priorityFilter.value;

    const filteredTasks = allTasks.filter(task => {
        // Search filter (title or description)
        const matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm));

        // Status filter
        const matchesStatus = statusVal === 'All' || task.status === statusVal;

        // Priority filter
        const matchesPriority = priorityVal === 'All' || (task.priority || 'Medium') === priorityVal;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    displayTasks(filteredTasks);
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
