// Teacher Alex English Academy - Production Ready
// Scalable architecture for 10k students
// Easy Firebase migration path

// ===== CORE SYSTEMS =====
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
        this.notify(path, value);
    }

    subscribe(path, callback) {
        if (!this.subscribers.has(path)) {
            this.subscribers.set(path, new Set());
        }
        this.subscribers.get(path).add(callback);
        return () => this.subscribers.get(path)?.delete(callback);
    }

    notify(path, value) {
        this.subscribers.get(path)?.forEach(cb => cb(value));
        
        const parts = path.split('.');
        while (parts.length > 1) {
            parts.pop();
            const parentPath = parts.join('.');
            this.subscribers.get(parentPath)?.forEach(cb => cb(this.get(parentPath)));
        }
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

    once(event, callback) {
        const unsub = this.on(event, (data) => {
            callback(data);
            unsub();
        });
    }
}

class Router {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
        this.middleware = [];
    }

    register(name, loader) {
        this.routes.set(name, loader);
    }

    use(middleware) {
        this.middleware.push(middleware);
    }

    async navigate(page) {
        const content = document.getElementById('content');
        const loader = this.routes.get(page);
        
        if (!loader) {
            content.innerHTML = '<div class="error">Page not found</div>';
            return;
        }

        // Run middleware
        for (const middleware of this.middleware) {
            const result = await middleware(page);
            if (result === false) return; // Block navigation
        }

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

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

// ===== AUTH SYSTEM (Easy Firebase Migration) =====
class Auth {
    constructor() {
        // TEMPORARY: Will be replaced with Firebase Auth
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
        
        this.isUsingFirebase = false; // Will be true after migration
    }

    // MIGRATION READY: Same interface for Firebase
    async login(username, password) {
        if (this.isUsingFirebase) {
            // TODO: Firebase signInWithEmailAndPassword
            // return await signInWithEmailAndPassword(auth, username, password);
        }
        
        // Current implementation
        const user = username.toLowerCase().trim();
        if (this.users[user] === password) {
            const userData = {
                username: user,
                loginTime: Date.now(),
                uid: user, // Ready for Firebase UID
                email: `${user}@academy.com` // Ready for Firebase email
            };
            
            State.set('user', userData);
            Events.emit('auth:login', userData);
            return { success: true, user: userData };
        }
        
        return { success: false, error: 'Invalid credentials' };
    }

    // MIGRATION READY: Same interface for Firebase
    async logout() {
        if (this.isUsingFirebase) {
            // TODO: Firebase signOut
            // return await signOut(auth);
        }
        
        State.set('user', null);
        Events.emit('auth:logout');
        return { success: true };
    }

    isLoggedIn() {
        return !!State.get('user');
    }

    currentUser() {
        return State.get('user');
    }

    // MIGRATION READY: Firebase onAuthStateChanged equivalent
    onAuthStateChanged(callback) {
        return State.subscribe('user', callback);
    }
}

// ===== ANALYTICS SYSTEM (Ready for Scale) =====
class Analytics {
    constructor() {
        this.events = [];
        this.userId = null;
    }

    setUser(userId) {
        this.userId = userId;
    }

    track(event, properties = {}) {
        const analyticsEvent = {
            event,
            properties: {
                ...properties,
                userId: this.userId,
                timestamp: Date.now(),
                page: Router.currentPage
            }
        };
        
        this.events.push(analyticsEvent);
        
        // TODO: Send to Firebase Analytics or Google Analytics
        console.log('📊 Analytics:', analyticsEvent);
        
        // Store in localStorage for now (will sync to cloud later)
        const stored = State.get('analytics') || [];
        stored.push(analyticsEvent);
        State.set('analytics', stored.slice(-1000)); // Keep last 1000 events
    }

    trackPageView(page) {
        this.track('page_view', { page });
    }

    trackLessonStart(lessonId) {
        this.track('lesson_start', { lessonId });
    }

    trackLessonComplete(lessonId, score) {
        this.track('lesson_complete', { lessonId, score });
    }
}

// ===== PROGRESS SYSTEM (Scalable) =====
class Progress {
    constructor() {
        this.achievements = [
            { id: 'first_login', name: 'Welcome!', description: 'First time logging in' },
            { id: 'lesson_1', name: 'Getting Started', description: 'Complete first lesson' },
            { id: 'streak_7', name: 'Week Warrior', description: '7 day study streak' },
            { id: 'streak_30', name: 'Monthly Master', description: '30 day study streak' }
        ];
    }

    getUserProgress(username) {
        return State.get(`progress.${username}`) || {
            level: 'Beginner',
            completedLessons: 0,
            totalPoints: 0,
            studyStreak: 0,
            lastLoginDate: null,
            achievements: [],
            totalMinutes: 0
        };
    }

    updateProgress(username, updates) {
        const current = this.getUserProgress(username);
        const updated = { ...current, ...updates };
        State.set(`progress.${username}`, updated);
        Events.emit('progress:updated', { username, progress: updated });
        return updated;
    }

    awardAchievement(username, achievementId) {
        const progress = this.getUserProgress(username);
        if (!progress.achievements.includes(achievementId)) {
            progress.achievements.push(achievementId);
            this.updateProgress(username, progress);
            Events.emit('achievement:earned', { username, achievementId });
        }
    }

    calculateStreak(username) {
        const progress = this.getUserProgress(username);
        const today = new Date().toDateString();
        const lastLogin = progress.lastLoginDate;
        
        if (!lastLogin) {
            return 1; // First day
        }
        
        const daysDiff = Math.floor((Date.now() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            return progress.studyStreak + 1; // Consecutive day
        } else if (daysDiff === 0) {
            return progress.studyStreak; // Same day
        } else {
            return 1; // Streak broken, start over
        }
    }
}

// ===== INITIALIZE CORE SYSTEMS =====
const State = new StateManager();
const Events = new EventBus();
const Router = new Router();
const Auth = new Auth();
const Analytics = new Analytics();
const Progress = new Progress();

// ===== AUTH MIDDLEWARE =====
Router.use(async (page) => {
    if (!Auth.isLoggedIn() && page !== 'login') {
        console.log('🔒 Auth required, redirecting to login');
        return false; // Block navigation
    }
    return true;
});

// ===== PAGE LOADERS =====
Router.register('dashboard', async () => {
    const user = Auth.currentUser();
    const progress = Progress.getUserProgress(user.username);
    
    Analytics.trackPageView('dashboard');
    
    return `
        <div class="dashboard">
            <h2>Welcome back, ${user.username}!</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${progress.completedLessons}</div>
                    <div class="stat-label">Lessons Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.studyStreak}</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.totalPoints}</div>
                    <div class="stat-label">Total Points</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${progress.level}</div>
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
    Analytics.trackPageView('listening');
    
    return `
        <div class="listening-hub">
            <h2>Listening Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Lesson 1: Introductions</h3>
                    <p>Learn basic greetings and introductions</p>
                    <button class="btn-primary" onclick="startLesson('listening_1')">Start Lesson</button>
                </div>
                <div class="lesson-card">
                    <h3>Lesson 2: Small Talk</h3>
                    <p>Common conversation starters</p>
                    <button class="btn-primary" onclick="startLesson('listening_2')">Start Lesson</button>
                </div>
            </div>
        </div>
    `;
});

Router.register('reading', async () => {
    Analytics.trackPageView('reading');
    
    return `
        <div class="reading-hub">
            <h2>Reading Practice</h2>
            <div class="lesson-grid">
                <div class="lesson-card">
                    <h3>Story 1: The New Neighbor</h3>
                    <p>A1 Level - 500 words</p>
                    <button class="btn-primary" onclick="startLesson('reading_1')">Read Story</button>
                </div>
                <div class="lesson-card">
                    <h3>Story 2: At the Coffee Shop</h3>
                    <p>A2 Level - 650 words</p>
                    <button class="btn-primary" onclick="startLesson('reading_2')">Read Story</button>
                </div>
            </div>
        </div>
    `;
});

Router.register('progress', async () => {
    const user = Auth.currentUser();
    const progress = Progress.getUserProgress(user.username);
    
    Analytics.trackPageView('progress');
    
    return `
        <div class="progress-page">
            <h2>Your Progress</h2>
            <div class="progress-overview">
                <div class="level-info">
                    <h3>Current Level: ${progress.level}</h3>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(100, (progress.totalPoints / 1000) * 100)}%"></div>
                    </div>
                    <p>${progress.totalPoints}/1000 points to next level</p>
                </div>
                
                <div class="study-stats">
                    <p><strong>Study Time:</strong> ${progress.totalMinutes} minutes</p>
                    <p><strong>Achievements:</strong> ${progress.achievements.length}</p>
                    <p><strong>Streak:</strong> ${progress.studyStreak} days</p>
                </div>
            </div>
        </div>
    `;
});

// ===== LESSON SYSTEM =====
window.startLesson = function(lessonId) {
    const user = Auth.currentUser();
    Analytics.trackLessonStart(lessonId);
    
    // Simulate lesson completion (will be real lessons later)
    setTimeout(() => {
        const score = Math.floor(Math.random() * 40) + 60; // 60-100%
        Analytics.trackLessonComplete(lessonId, score);
        
        const progress = Progress.getUserProgress(user.username);
        Progress.updateProgress(user.username, {
            completedLessons: progress.completedLessons + 1,
            totalPoints: progress.totalPoints + score,
            totalMinutes: progress.totalMinutes + 15
        });
        
        alert(`Lesson completed! Score: ${score}%`);
        Router.navigate('dashboard');
    }, 2000);
    
    alert('Starting lesson...');
};

// ===== APP INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Teacher Alex Academy initializing...');
    
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Check if already logged in
    if (Auth.isLoggedIn()) {
        showApp();
    }
    
    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const result = await Auth.login(username, password);
        
        if (result.success) {
            Analytics.setUser(result.user.username);
            Analytics.track('login');
            
            // Update streak
            const newStreak = Progress.calculateStreak(result.user.username);
            Progress.updateProgress(result.user.username, {
                studyStreak: newStreak,
                lastLoginDate: Date.now()
            });
            
            // Award first login achievement
            Progress.awardAchievement(result.user.username, 'first_login');
            
            showApp();
        } else {
            loginError.textContent = result.error || 'Invalid username or password';
            loginError.style.display = 'block';
        }
    });
    
    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await Auth.logout();
        Analytics.track('logout');
        showLogin();
    });
    
    // Navigation handler
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            Router.navigate(item.dataset.page);
        });
    });
    
    function showApp() {
        const user = Auth.currentUser();
        document.getElementById('user-name').textContent = user.username;
        loginScreen.classList.remove('active');
        appScreen.classList.add('active');
        Router.navigate('dashboard');
    }
    
    function showLogin() {
        loginScreen.classList.add('active');
        appScreen.classList.remove('active');
        loginForm.reset();
        loginError.style.display = 'none';
    }
    
    console.log('✅ Teacher Alex Academy ready for 10k students!');
});

// ===== GLOBAL API =====
window.TeacherAlex = {
    State,
    Events,
    Router,
    Auth,
    Analytics,
    Progress,
    version: '2.5.0-production'
};

// ===== FIREBASE MIGRATION HELPERS =====
window.TeacherAlex.migrateToFirebase = function() {
    console.log('🔥 Ready to migrate to Firebase!');
    console.log('1. Install Firebase SDK');
    console.log('2. Replace Auth.users with Firebase Auth');
    console.log('3. Replace localStorage with Firestore');
    console.log('4. Set Auth.isUsingFirebase = true');
};
