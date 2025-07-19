// Teacher Alex English Academy - Core System
// Clean, scalable architecture for 10k students

// ===== STATE MANAGER =====
class StateManager {
    constructor() {
        this.state = {};
        this.subscribers = new Map();
        this.storageKey = 'teacherAlex_state';
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.state = JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save state:', e);
        }
    }

    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);
        
        target[lastKey] = value;
        this.save();
        this.notify(path, value);
    }

    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);
        
        // Return unsubscribe function
        return () => this.subscribers.get(path)?.delete(callback);
    }

    notify(path, value) {
        this.subscribers.get(path)?.forEach(cb => cb(value));
        
        // Notify parent paths
        const parts = path.split('.');
        while (parts.length > 1) {
            parts.pop();
            const parentPath = parts.join('.');
            this.subscribers.get(parentPath)?.forEach(cb => cb(this.get(parentPath)));
        }
    }
}

// ===== EVENT BUS =====
class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        
        // Return unsubscribe function
        return () => this.events.get(event)?.delete(callback);
    }

    emit(event, data) {
        this.events.get(event)?.forEach(cb => cb(data));
    }

    once(event, callback) {
        const unsub = this.on(event, (data) => {
            callback(data);
            unsub();
        });
    }
}

// ===== ROUTER =====
class Router {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
    }

    register(name, loader) {
        this.routes.set(name, loader);
    }

    async navigate(page) {
        const content = document.getElementById('content');
        const loader = this.routes.get(page);
        
        if (!loader) {
            content.innerHTML = '<div class="error">Page not found</div>';
            return;
        }

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Load content
        try {
            content.innerHTML = '<div class="loading">Loading...</div>';
            const html = await loader();
            content.innerHTML = html;
            this.currentPage = page;
            Events.emit('page:loaded', page);
        } catch (e) {
            content.innerHTML = '<div class="error">Failed to load page</div>';
            console.error(e);
        }
    }
}

// ===== AUTH SYSTEM =====
class Auth {
    constructor() {
        this.users = {
            // Your 20 students
            'matheus': 'english090803',
            'iasmin': 'english050307',
            'leticia': 'english843892',
            'larissa': 'english765352',
            'ednei': 'english4536798',
            'guilherme': 'english408698',
            'leidson': 'english594367',
            'tais': 'english194678',
            'barbara': 'english847693',
            'dudu': 'english136789',
            'nicolete': 'liloestitch',
            'iago': 'english987654',
            'jaqueline': 'english74309',
            'giovana': 'english987543',
            'marina': 'english742387',
            'breno': 'english345687',
            'duda': 'english454356',
            'kelli': 'english434567',
            'lucas': 'english98765423',
            // Test account
            'alex': 'teacher'
        };
    }

    login(username, password) {
        const user = username.toLowerCase().trim();
        if (this.users[user] === password) {
            State.set('user', {
                username: user,
                loginTime: Date.now()
            });
            Events.emit('auth:login', user);
            return true;
        }
        return false;
    }

    logout() {
        State.set('user', null);
        Events.emit('auth:logout');
    }

    isLoggedIn() {
        return !!State.get('user');
    }

    currentUser() {
        return State.get('user');
    }
}

// ===== INITIALIZE CORE SYSTEMS =====
const State = new StateManager();
const Events = new EventBus();
const Router = new Router();
const Auth = new Auth();

// ===== PAGE LOADERS =====
Router.register('dashboard', async () => {
    const user = Auth.currentUser();
    const progress = State.get(`progress.${user.username}`) || {};
    
    return `
        <div class="dashboard">
            <h2>Welcome back, ${user.username}!</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${progress.completedLessons || 0}</div>
                    <div class="stat-label">Lessons Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.studyStreak || 0}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.totalPoints || 0}</div>
                    <div class="stat-label">Total Points</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.level || 'Beginner'}</div>
                    <div class="stat-label">Current Level</div>
                </div>
            </div>

            <div class="quick-actions">
                <button class="action-card" onclick="Router.navigate('listening')">
                    <span class="action-icon">🎧</span>
                    <span class="action-label">Continue Listening</span>
                </button>
                <button class="action-card" onclick="Router.navigate('reading')">
                    <span class="action-icon">📖</span>
                    <span class="action-label">Continue Reading</span>
                </button>
            </div>
        </div>
    `;
});

Router.register('listening', async () => {
    return `
        <div class="listening-hub">
            <h2>Listening Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Lesson 1: Introductions</h3>
                    <p>Learn basic greetings and introductions</p>
                    <button class="btn-primary">Start Lesson</button>
                </div>
                <!-- More lessons -->
            </div>
        </div>
    `;
});

Router.register('reading', async () => {
    return `
        <div class="reading-hub">
            <h2>Reading Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Story 1: The New Neighbor</h3>
                    <p>A1 Level - 500 words</p>
                    <button class="btn-primary">Read Story</button>
                </div>
                <!-- More stories -->
            </div>
        </div>
    `;
});

Router.register('progress', async () => {
    const user = Auth.currentUser();
    const progress = State.get(`progress.${user.username}`) || {};
    
    return `
        <div class="progress-page">
            <h2>Your Progress</h2>
            <div class="progress-chart">
                <!-- Add charts here -->
                <p>Study time: ${progress.totalMinutes || 0} minutes</p>
                <p>Achievements: ${progress.achievements?.length || 0}</p>
            </div>
        </div>
    `;
});

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Check if already logged in
    if (Auth.isLoggedIn()) {
        showApp();
    }
    
    // Login form handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (Auth.login(username, password)) {
            showApp();
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.style.display = 'block';
        }
    });
    
    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        showLogin();
    });
    
    // Navigation handler
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            Router.navigate(item.dataset.page);
        });
    });
    
    // Show app function
    function showApp() {
        const user = Auth.currentUser();
        document.getElementById('user-name').textContent = user.username;
        loginScreen.classList.remove('active');
        appScreen.classList.add('active');
        Router.navigate('dashboard');
    }
    
    // Show login function
    function showLogin() {
        loginScreen.classList.add('active');
        appScreen.classList.remove('active');
        loginForm.reset();
        loginError.style.display = 'none';
    }
});

// ===== GLOBAL API =====
window.TeacherAlex = {
    State,
    Events,
    Router,
    Auth,
    version: '2.0.0'
};