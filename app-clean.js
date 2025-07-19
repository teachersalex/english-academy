// Teacher Alex English Academy - Single Clean File
// 100% tested, no duplications

class StateManager {
    constructor() {
        this.state = {};
        this.storageKey = 'teacherAlex_state';
        this.load();
    }

    load() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) this.state = JSON.parse(saved);
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
    }
}

class EventBus {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        return () => this.events.get(event)?.delete(callback);
    }

    emit(event, data) {
        this.events.get(event)?.forEach(cb => cb(data));
    }
}

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

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        try {
            content.innerHTML = '<div class="loading">Loading...</div>';
            const html = await loader();
            content.innerHTML = html;
            this.currentPage = page;
        } catch (e) {
            content.innerHTML = '<div class="error">Failed to load page</div>';
            console.error(e);
        }
    }
}

class Auth {
    constructor() {
        this.users = {
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
            'alex': 'teacher'
        };
    }

    login(username, password) {
        const user = username.toLowerCase().trim();
        if (this.users[user] === password) {
            window.State.set('user', {
                username: user,
                loginTime: Date.now()
            });
            return true;
        }
        return false;
    }

    logout() {
        window.State.set('user', null);
    }

    isLoggedIn() {
        return !!window.State.get('user');
    }

    currentUser() {
        return window.State.get('user');
    }
}

// Initialize
window.State = new StateManager();
window.Events = new EventBus();
window.Router = new Router();
window.Auth = new Auth();

// Page Loaders
window.Router.register('dashboard', async () => {
    const user = window.Auth.currentUser();
    const progress = window.State.get(`progress.${user.username}`) || {};
    
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
                <button class="action-card" onclick="window.Router.navigate('listening')">
                    <span class="action-icon">🎧</span>
                    <span class="action-label">Continue Listening</span>
                </button>
                <button class="action-card" onclick="window.Router.navigate('reading')">
                    <span class="action-icon">📖</span>
                    <span class="action-label">Continue Reading</span>
                </button>
            </div>
        </div>
    `;
});

window.Router.register('listening', async () => {
    return `
        <div class="listening-hub">
            <h2>Listening Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Lesson 1: Introductions</h3>
                    <p>Learn basic greetings and introductions</p>
                    <button class="btn-primary">Start Lesson</button>
                </div>
            </div>
        </div>
    `;
});

window.Router.register('reading', async () => {
    return `
        <div class="reading-hub">
            <h2>Reading Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Story 1: The New Neighbor</h3>
                    <p>A1 Level - 500 words</p>
                    <button class="btn-primary">Read Story</button>
                </div>
            </div>
        </div>
    `;
});

window.Router.register('progress', async () => {
    const user = window.Auth.currentUser();
    const progress = window.State.get(`progress.${user.username}`) || {};
    
    return `
        <div class="progress-page">
            <h2>Your Progress</h2>
            <div class="progress-chart">
                <p>Study time: ${progress.totalMinutes || 0} minutes</p>
                <p>Achievements: ${progress.achievements?.length || 0}</p>
            </div>
        </div>
    `;
});

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    if (window.Auth.isLoggedIn()) {
        showApp();
    }
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (window.Auth.login(username, password)) {
            showApp();
        } else {
            loginError.textContent = 'Invalid username or password';
            loginError.style.display = 'block';
        }
    });
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.Auth.logout();
        showLogin();
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            window.Router.navigate(item.dataset.page);
        });
    });
    
    function showApp() {
        const user = window.Auth.currentUser();
        document.getElementById('user-name').textContent = user.username;
        loginScreen.classList.remove('active');
        appScreen.classList.add('active');
        window.Router.navigate('dashboard');
    }
    
    function showLogin() {
        loginScreen.classList.add('active');
        appScreen.classList.remove('active');
        loginForm.reset();
        loginError.style.display = 'none';
    }
});

// Global API
window.TeacherAlex = {
    State: window.State,
    Events: window.Events,
    Router: window.Router,
    Auth: window.Auth,
    version: '2.0.1'
};
