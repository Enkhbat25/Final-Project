/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ZENITH - Personal Wellness Dashboard
 * A comprehensive productivity, wellness, and habit-building application
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════

const Utils = {
    /**
     * Get today's date as YYYY-MM-DD string in local timezone.
     * Uses a single Date object to ensure consistency.
     * @returns {string} Date string in YYYY-MM-DD format
     */
    getToday() {
        const d = new Date();
        return this.formatDateKey(d);
    },

    /**
     * Format a Date object to YYYY-MM-DD string.
     * Centralized formatting prevents inconsistencies.
     * @param {Date} date - The date to format
     * @returns {string} Date string in YYYY-MM-DD format
     */
    formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Get last N days as array of YYYY-MM-DD strings.
     * Creates a single base date and clones it for each day to avoid
     * issues with date changes during iteration (e.g., around midnight).
     * @param {number} n - Number of days to retrieve
     * @returns {string[]} Array of date strings, oldest first
     */
    getLastNDays(n) {
        const days = [];
        // Create base date at start to avoid midnight edge cases
        const baseDate = new Date();
        baseDate.setHours(12, 0, 0, 0); // Set to noon to avoid DST issues

        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(baseDate.getTime()); // Clone the base date
            d.setDate(baseDate.getDate() - i);
            days.push(this.formatDateKey(d));
        }
        return days;
    },

    /**
     * Get day of week label from a date string.
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {string} Three-letter day abbreviation (Mon, Tue, etc.)
     */
    getDayLabel(dateStr) {
        const [y, m, d] = dateStr.split('-').map(Number);
        // Create date at noon to avoid timezone issues
        return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString('en', { weekday: 'short' }).substring(0, 3);
    },

    /**
     * Safely parse a number, returning 0 for invalid values.
     * Prevents NaN and negative values in calculations.
     * @param {*} value - Value to parse
     * @param {number} defaultValue - Default if invalid (default: 0)
     * @returns {number} Parsed number or default
     */
    safeNumber(value, defaultValue = 0) {
        const num = Number(value);
        if (isNaN(num) || num < 0) return defaultValue;
        return num;
    },

    // Format time
    formatTime(date) {
        return date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Generate unique ID
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Format date for display
    formatDate(date) {
        return date.toLocaleDateString('en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
};

// ══════════════════════════════════════════════════════════════════════════
// STORAGE MANAGER
// ══════════════════════════════════════════════════════════════════════════

const Storage = {
    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`zenith_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(`zenith_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error('Storage set error:', e);
        }
    },

    // Export all data
    exportAll() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('zenith_')) {
                data[key.replace('zenith_', '')] = JSON.parse(localStorage.getItem(key));
            }
        }
        return data;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════

const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s var(--ease-out);
        `;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        toast.innerHTML = `<span style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'accent'})">${icons[type]}</span> ${message}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s var(--ease-out) forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// ══════════════════════════════════════════════════════════════════════════
// THEME MANAGER
// ══════════════════════════════════════════════════════════════════════════

const ThemeManager = {
    init() {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = Storage.get('theme', prefersDark ? 'dark' : 'light');
        this.setTheme(savedTheme);

        // Listen for system changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!Storage.get('themeManual')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        document.getElementById('themeSwitch').addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            Storage.set('themeManual', true);
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Storage.set('theme', theme);

        const label = document.getElementById('themeLabel');
        const icon = document.getElementById('themeIcon');

        if (theme === 'dark') {
            label.textContent = 'Dark Mode';
            icon.innerHTML = '<path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z"/>';
        } else {
            label.textContent = 'Light Mode';
            icon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>';
        }
    }
};

// ══════════════════════════════════════════════════════════════════════════
// XP & GAMIFICATION SYSTEM
// ══════════════════════════════════════════════════════════════════════════

const XPSystem = {
    data: { xp: 0, level: 1 },
    levels: [
        { level: 1, xp: 0, title: 'Beginner', avatar: '🌱' },
        { level: 2, xp: 100, title: 'Explorer', avatar: '🌿' },
        { level: 3, xp: 250, title: 'Achiever', avatar: '🌳' },
        { level: 4, xp: 500, title: 'Champion', avatar: '⭐' },
        { level: 5, xp: 800, title: 'Master', avatar: '🏆' },
        { level: 6, xp: 1200, title: 'Legend', avatar: '👑' },
        { level: 7, xp: 1800, title: 'Enlightened', avatar: '✨' },
        { level: 8, xp: 2500, title: 'Transcendent', avatar: '🌟' },
        { level: 9, xp: 3500, title: 'Mythical', avatar: '🔥' },
        { level: 10, xp: 5000, title: 'Zenith', avatar: '💎' }
    ],

    init() {
        this.data = Storage.get('xp', { xp: 0, level: 1 });
        this.render();
    },

    addXP(amount, reason = '') {
        this.data.xp += amount;
        const newLevel = this.calculateLevel();

        if (newLevel > this.data.level) {
            this.data.level = newLevel;
            this.showLevelUp(newLevel);
        }

        this.save();
        this.render();

        if (reason) {
            Toast.show(`+${amount} XP: ${reason}`, 'success');
        }
    },

    calculateLevel() {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.data.xp >= this.levels[i].xp) {
                return this.levels[i].level;
            }
        }
        return 1;
    },

    getCurrentLevelData() {
        return this.levels.find(l => l.level === this.data.level) || this.levels[0];
    },

    getNextLevelData() {
        return this.levels.find(l => l.level === this.data.level + 1) || this.levels[this.levels.length - 1];
    },

    showLevelUp(level) {
        const levelData = this.levels.find(l => l.level === level);
        Toast.show(`🎉 Level Up! You're now ${levelData.title} (Level ${level})`, 'success', 5000);
    },

    save() {
        Storage.set('xp', this.data);
    },

    render() {
        const current = this.getCurrentLevelData();
        const next = this.getNextLevelData();
        const progress = next.level > current.level
            ? ((this.data.xp - current.xp) / (next.xp - current.xp)) * 100
            : 100;

        document.getElementById('userLevel').textContent = current.level;
        document.getElementById('levelTitle').textContent = current.title;
        document.getElementById('currentXP').textContent = this.data.xp;
        document.getElementById('nextLevelXP').textContent = next.xp;
        document.getElementById('xpFill').style.width = `${progress}%`;
        document.querySelector('.user-avatar').textContent = current.avatar;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// NAVIGATION MANAGER
// ══════════════════════════════════════════════════════════════════════════

const Navigation = {
    currentPage: 'dashboard',

    init() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigate(page);
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar on outside click (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        this.navigate('dashboard');
    },

    navigate(page) {
        // Stop ambient sounds when leaving focus page
        if (this.currentPage === 'focus' && page !== 'focus') {
            Focus.stopAllSounds();
        }

        this.currentPage = page;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            habits: 'Habits',
            focus: 'Focus Mode',
            planner: 'Daily Planner',
            mood: 'Mood Tracker',
            water: 'Water & Nutrition',
            sleep: 'Sleep & Energy',
            insights: 'Insights',
            badges: 'Badges & Achievements'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        // Update date display
        document.getElementById('dateDisplay').textContent = Utils.formatDate(new Date());

        // Render page
        PageRenderer.render(page);

        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
    }
};

// ══════════════════════════════════════════════════════════════════════════
// PAGE RENDERER
// ══════════════════════════════════════════════════════════════════════════

const PageRenderer = {
    render(page) {
        const container = document.getElementById('pagesContainer');

        switch(page) {
            case 'dashboard': container.innerHTML = this.dashboardPage(); break;
            case 'habits': container.innerHTML = this.habitsPage(); break;
            case 'focus': container.innerHTML = this.focusPage(); break;
            case 'planner': container.innerHTML = this.plannerPage(); break;
            case 'mood': container.innerHTML = this.moodPage(); break;
            case 'water': container.innerHTML = this.waterPage(); break;
            case 'sleep': container.innerHTML = this.sleepPage(); break;
            case 'insights': container.innerHTML = this.insightsPage(); break;
            case 'badges': container.innerHTML = this.badgesPage(); break;
            default: container.innerHTML = this.dashboardPage();
        }

        // Initialize page-specific functionality
        this.initPage(page);
    },

    initPage(page) {
        switch(page) {
            case 'dashboard': Dashboard.init(); break;
            case 'habits': Habits.init(); break;
            case 'focus': Focus.init(); break;
            case 'planner': Planner.init(); break;
            case 'mood': Mood.init(); break;
            case 'water': Water.init(); break;
            case 'sleep': Sleep.init(); break;
            case 'insights': Insights.init(); break;
            case 'badges': Badges.init(); break;
        }
    },

    // Dashboard Page
    dashboardPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <!-- Stats Row -->
                    <div class="col-3">
                        <div class="stat-card purple">
                            <div class="stat-icon purple">
                                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Habits Today</div>
                                <div class="stat-value" id="dashHabits">0/0</div>
                                <div class="stat-progress"><div class="stat-progress-fill purple" id="dashHabitsBar" style="width:0%"></div></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="stat-card blue">
                            <div class="stat-icon blue">
                                <svg viewBox="0 0 24 24"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Water Intake</div>
                                <div class="stat-value" id="dashWater">0 ml</div>
                                <div class="stat-progress"><div class="stat-progress-fill blue" id="dashWaterBar" style="width:0%"></div></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="stat-card orange">
                            <div class="stat-icon orange">
                                <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Focus Time</div>
                                <div class="stat-value" id="dashFocus">0 min</div>
                                <div class="stat-progress"><div class="stat-progress-fill orange" id="dashFocusBar" style="width:0%"></div></div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="stat-card green">
                            <div class="stat-icon green">
                                <svg viewBox="0 0 24 24"><path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z"/></svg>
                            </div>
                            <div class="stat-content">
                                <div class="stat-label">Sleep</div>
                                <div class="stat-value" id="dashSleep">-- hrs</div>
                                <div class="stat-progress"><div class="stat-progress-fill green" id="dashSleepBar" style="width:0%"></div></div>
                            </div>
                        </div>
                    </div>

                    <!-- Motivational Card -->
                    <div class="col-8">
                        <div class="card" style="background: var(--gradient-primary); color: white;">
                            <h3 style="font-size: 1.25rem; margin-bottom: 8px;" id="motivationTitle">Welcome back!</h3>
                            <p style="opacity: 0.9;" id="motivationText">Start your day with intention. Small consistent actions lead to big results.</p>
                        </div>
                    </div>

                    <!-- Today's Mood -->
                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon purple"><svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2z"/></svg></div>
                                    Today's Mood
                                </span>
                            </div>
                            <div id="dashMoodDisplay" style="text-align: center; padding: 10px 0;">
                                <span style="font-size: 3rem;" id="dashMoodEmoji">😊</span>
                                <p style="color: var(--text-secondary); margin-top: 8px;" id="dashMoodText">Feeling good!</p>
                            </div>
                        </div>
                    </div>

                    <!-- Today's Tasks -->
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon orange"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
                                    Today's Tasks
                                </span>
                                <button class="btn btn-sm btn-ghost" onclick="Navigation.navigate('planner')">View All</button>
                            </div>
                            <div id="dashTasksList"></div>
                        </div>
                    </div>

                    <!-- Habits Progress -->
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon green"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></div>
                                    Habits
                                </span>
                                <button class="btn btn-sm btn-ghost" onclick="Navigation.navigate('habits')">View All</button>
                            </div>
                            <div id="dashHabitsList"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Habits Page
    habitsPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-8">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon purple"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></div>
                                    Add New Habit
                                </span>
                            </div>
                            <div class="input-group">
                                <input type="text" class="input" id="habitInput" placeholder="Enter a new habit..." maxlength="50">
                                <select class="input" id="habitFrequency" style="max-width: 150px;">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                </select>
                                <button class="btn btn-primary" id="addHabitBtn">Add</button>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Your Habits</span>
                            </div>
                            <div id="habitsList"></div>
                        </div>
                    </div>

                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Habit Heatmap</span>
                            </div>
                            <div class="heatmap-container" id="habitHeatmap"></div>
                            <div class="heatmap-legend">
                                <span>Less</span>
                                <div class="heatmap-legend-items">
                                    <div class="heatmap-day"></div>
                                    <div class="heatmap-day level-1"></div>
                                    <div class="heatmap-day level-2"></div>
                                    <div class="heatmap-day level-3"></div>
                                    <div class="heatmap-day level-4"></div>
                                </div>
                                <span>More</span>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Statistics</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent);" id="totalStreaks">0</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Active Streaks</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--warning);" id="longestStreak">0</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Longest Streak</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Focus/Pomodoro Page
    focusPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-6">
                        <div class="card">
                            <div class="pomodoro-display">
                                <div class="timer-ring">
                                    <svg width="200" height="200">
                                        <defs>
                                            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" style="stop-color:#6366f1"/>
                                                <stop offset="100%" style="stop-color:#8b5cf6"/>
                                            </linearGradient>
                                        </defs>
                                        <circle class="timer-ring-bg" cx="100" cy="100" r="90"/>
                                        <circle class="timer-ring-fill" id="timerRingFill" cx="100" cy="100" r="90"/>
                                    </svg>
                                    <div class="timer-text">
                                        <div class="timer-time" id="timerDisplay">25:00</div>
                                        <div class="timer-status" id="timerStatus">Focus</div>
                                    </div>
                                </div>
                                <div class="timer-controls">
                                    <button class="btn btn-primary" id="timerStartBtn">
                                        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                        Start
                                    </button>
                                    <button class="btn btn-secondary" id="timerResetBtn">
                                        <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                                        Reset
                                    </button>
                                </div>
                                <div class="timer-settings">
                                    <button class="timer-preset active" data-time="25">25 min</button>
                                    <button class="timer-preset" data-time="15">15 min</button>
                                    <button class="timer-preset" data-time="45">45 min</button>
                                    <button class="timer-preset" data-time="5">5 min break</button>
                                </div>
                                <div class="ambient-sounds">
                                    <button class="sound-btn" data-sound="rain">
                                        <svg viewBox="0 0 24 24"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>
                                        <span class="sound-label">Rain</span>
                                    </button>
                                    <button class="sound-btn" data-sound="forest">
                                        <svg viewBox="0 0 24 24"><path d="M17 8l-5-5-5 5h3v4H7v-4l-5 5 5 5v-4h3v4l5 5 5-5h-3v-4h3v4l5-5-5-5v4h-3V8h3z"/></svg>
                                        <span class="sound-label">Forest</span>
                                    </button>
                                    <button class="sound-btn" data-sound="coffee">
                                        <svg viewBox="0 0 24 24"><path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3h2.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5H16v-1c0-2.21-1.79-4-4-4H6V5h10zM4 19h16v2H4z"/></svg>
                                        <span class="sound-label">Cafe</span>
                                    </button>
                                    <button class="sound-btn" data-sound="none">
                                        <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                                        <span class="sound-label">Silent</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Today's Focus Sessions</span>
                            </div>
                            <div id="focusSessionsList"></div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Weekly Focus Time</span>
                            </div>
                            <div class="sleep-chart" id="focusChart"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Planner Page
    plannerPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-8">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon orange"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></div>
                                    Add Task
                                </span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 10px; align-items: end;">
                                <div class="form-group">
                                    <label class="form-label">Task</label>
                                    <input type="text" class="input" id="taskInput" placeholder="What needs to be done?">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Due</label>
                                    <input type="date" class="input" id="taskDue">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Priority</label>
                                    <select class="input" id="taskPriority">
                                        <option value="low">Low</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary" id="addTaskBtn">Add</button>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Tasks</span>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-sm btn-secondary filter-btn active" data-filter="all">All</button>
                                    <button class="btn btn-sm btn-ghost filter-btn" data-filter="pending">Pending</button>
                                    <button class="btn btn-sm btn-ghost filter-btn" data-filter="completed">Completed</button>
                                </div>
                            </div>
                            <div id="tasksList"></div>
                        </div>
                    </div>

                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">🎯 Most Important Task</span>
                            </div>
                            <div id="mitTask" style="padding: 20px 0; text-align: center;">
                                <p style="color: var(--text-secondary);">No high priority tasks yet</p>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Task Stats</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;">
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--success);" id="completedTasks">0</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Completed</div>
                                </div>
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--warning);" id="pendingTasks">0</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Mood Page
    moodPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">How are you feeling?</span>
                            </div>
                            <div class="mood-selector">
                                <button class="mood-btn" data-mood="great" data-emoji="😄">
                                    <span class="mood-emoji">😄</span>
                                    <span class="mood-label">Great</span>
                                </button>
                                <button class="mood-btn" data-mood="good" data-emoji="😊">
                                    <span class="mood-emoji">😊</span>
                                    <span class="mood-label">Good</span>
                                </button>
                                <button class="mood-btn" data-mood="okay" data-emoji="😐">
                                    <span class="mood-emoji">😐</span>
                                    <span class="mood-label">Okay</span>
                                </button>
                                <button class="mood-btn" data-mood="bad" data-emoji="😔">
                                    <span class="mood-emoji">😔</span>
                                    <span class="mood-label">Bad</span>
                                </button>
                                <button class="mood-btn" data-mood="awful" data-emoji="😢">
                                    <span class="mood-emoji">😢</span>
                                    <span class="mood-label">Awful</span>
                                </button>
                            </div>
                            <textarea class="input mood-note" id="moodNote" placeholder="Add a note about your mood (optional)..."></textarea>
                            <button class="btn btn-primary" id="saveMoodBtn" style="width: 100%; margin-top: 12px;">Save Mood</button>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Recent Moods</span>
                            </div>
                            <div id="moodHistory"></div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Mood Trends (7 Days)</span>
                            </div>
                            <div class="sleep-chart" id="moodChart"></div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">💡 Insight</span>
                            </div>
                            <div id="moodInsight" style="padding: 10px 0;">
                                <p style="color: var(--text-secondary);">Log more moods to see personalized insights!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Water & Nutrition Page
    waterPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon blue"><svg viewBox="0 0 24 24"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg></div>
                                    Water Intake
                                </span>
                            </div>
                            <div class="water-visual">
                                <div class="water-glass">
                                    <div class="water-fill" id="waterFill" style="height: 0%"></div>
                                </div>
                                <div class="water-amount"><span id="waterAmount">0</span> ml</div>
                                <div class="water-goal">Goal: <span id="waterGoal">2000</span> ml</div>
                            </div>
                            <div class="water-quick-add">
                                <button class="water-btn" data-amount="150">+150ml</button>
                                <button class="water-btn" data-amount="250">+250ml</button>
                                <button class="water-btn" data-amount="500">+500ml</button>
                            </div>
                            <div style="margin-top: 16px;">
                                <div class="input-group">
                                    <input type="number" class="input" id="customWater" placeholder="Custom (ml)">
                                    <button class="btn btn-secondary" id="addCustomWater">Add</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon orange"><svg viewBox="0 0 24 24"><path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05l-5 2v11.12c0 .97-.78 1.82-1.74 1.91-1.12.1-2.08-.77-2.08-1.86V5.05L9 3 4.18 5.05v11.12c0 .97-.78 1.82-1.74 1.91C1.32 18.18.36 17.31.36 16.22V5.05L2 4l5 2v11.12c0 .97.78 1.82 1.74 1.91 1.12.1 2.08-.77 2.08-1.86V5.05l5.18 2.13v11.95c0 .97.78 1.82 1.74 1.91l1.32-.05z"/></svg></div>
                                    Quick Meal Log
                                </span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-bottom: 16px;">
                                <input type="text" class="input" id="mealInput" placeholder="What did you eat?">
                                <select class="input" id="mealType" style="width: auto;">
                                    <option value="🍳">🍳 Breakfast</option>
                                    <option value="🍽️">🍽️ Lunch</option>
                                    <option value="🍲">🍲 Dinner</option>
                                    <option value="🍎">🍎 Snack</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" id="addMealBtn" style="width: 100%;">Log Meal</button>

                            <div style="margin-top: 20px;">
                                <h4 style="font-size: 0.9rem; margin-bottom: 12px;">Today's Meals</h4>
                                <div id="mealsList"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Sleep Page
    sleepPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-4">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">
                                    <div class="card-icon purple"><svg viewBox="0 0 24 24"><path d="M12.34 2.02C6.59 1.82 2 6.42 2 12c0 5.52 4.48 10 10 10 3.71 0 6.93-2.02 8.66-5.02-7.51-.25-12.09-8.43-8.32-14.96z"/></svg></div>
                                    Log Sleep
                                </span>
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label">Bedtime</label>
                                <input type="time" class="input" id="sleepStart" value="22:00">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label">Wake Time</label>
                                <input type="time" class="input" id="sleepEnd" value="06:00">
                            </div>
                            <div class="form-group" style="margin-bottom: 16px;">
                                <label class="form-label">Sleep Quality</label>
                                <select class="input" id="sleepQuality">
                                    <option value="5">😴 Excellent</option>
                                    <option value="4">😊 Good</option>
                                    <option value="3" selected>😐 Average</option>
                                    <option value="2">😕 Poor</option>
                                    <option value="1">😫 Terrible</option>
                                </select>
                            </div>
                            <button class="btn btn-primary" id="logSleepBtn" style="width: 100%;">Log Sleep</button>
                        </div>
                    </div>

                    <div class="col-8">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Weekly Sleep</span>
                            </div>
                            <div class="sleep-chart" id="sleepChart"></div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Sleep Stats</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent);" id="avgSleep">--</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg Hours</div>
                                </div>
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--success);" id="sleepConsistency">--</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Consistency</div>
                                </div>
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--warning);" id="sleepDebt">--</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Sleep Debt</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Insights Page
    insightsPage() {
        return `
            <div class="page active">
                <div class="dashboard-grid">
                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">Weekly Productivity Score</span>
                            </div>
                            <div style="text-align: center; padding: 20px 0;">
                                <div style="font-size: 4rem; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" id="productivityScore">0</div>
                                <div style="color: var(--text-secondary);">out of 100</div>
                            </div>
                        </div>

                        <div class="card" style="margin-top: 20px;">
                            <div class="card-header">
                                <span class="card-title">Habit Consistency</span>
                            </div>
                            <div id="habitConsistency"></div>
                        </div>
                    </div>

                    <div class="col-6">
                        <div class="card">
                            <div class="card-header">
                                <span class="card-title">💡 Personalized Insights</span>
                            </div>
                            <div id="insightsList"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Badges Page
    badgesPage() {
        return `
            <div class="page active">
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">🏆 Your Achievements</span>
                    </div>
                    <div class="badges-grid" id="badgesGrid"></div>
                </div>
            </div>
        `;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD MODULE
// ══════════════════════════════════════════════════════════════════════════

const Dashboard = {
    init() {
        this.update();
        this.bindEvents();
    },

    bindEvents() {
        // Click handler for dashboard tasks
        const dashTasksList = document.getElementById('dashTasksList');
        if (dashTasksList) {
            dashTasksList.addEventListener('click', (e) => {
                const item = e.target.closest('.task-item');
                if (!item) return;
                const id = item.dataset.id;
                if (e.target.closest('.task-check')) {
                    this.toggleDashTask(id);
                }
            });
        }

        // Click handler for dashboard habits
        const dashHabitsList = document.getElementById('dashHabitsList');
        if (dashHabitsList) {
            dashHabitsList.addEventListener('click', (e) => {
                const item = e.target.closest('.habit-item');
                if (!item) return;
                const id = item.dataset.id;
                if (e.target.closest('.habit-check')) {
                    this.toggleDashHabit(id);
                }
            });
        }
    },

    toggleDashTask(id) {
        const tasks = Storage.get('tasks', []);
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            if (task.status === 'completed') {
                XPSystem.addXP(10, 'Completed task');
            }
            Storage.set('tasks', tasks);
            this.update();
        }
    },

    toggleDashHabit(id) {
        const habits = Storage.get('habits', []);
        const habit = habits.find(h => h.id === id);
        if (habit) {
            const today = Utils.getToday();
            if (!habit.completedDates) habit.completedDates = [];
            const idx = habit.completedDates.indexOf(today);
            if (idx > -1) {
                habit.completedDates.splice(idx, 1);
            } else {
                habit.completedDates.push(today);
                XPSystem.addXP(5, 'Completed habit');
            }
            Storage.set('habits', habits);
            this.update();
        }
    },

    update() {
        const today = Utils.getToday();

        // Habits stats
        const habits = Storage.get('habits', []);
        const completedHabits = habits.filter(h => h.completedDates && h.completedDates.includes(today)).length;
        document.getElementById('dashHabits').textContent = `${completedHabits}/${habits.length}`;
        document.getElementById('dashHabitsBar').style.width = habits.length ? `${(completedHabits/habits.length)*100}%` : '0%';
        document.getElementById('habitsCount').textContent = habits.length;

        // Water stats
        const water = Storage.get('water', { goal: 2000, logs: {} });
        const todayWater = (water.logs[today] || []).reduce((sum, l) => sum + l.amount, 0);
        document.getElementById('dashWater').textContent = `${todayWater} ml`;
        document.getElementById('dashWaterBar').style.width = `${Math.min(100, (todayWater/water.goal)*100)}%`;

        // Focus stats - use validated calculation
        const focus = Storage.get('focus', { sessions: {} });
        const focusSessions = focus.sessions && focus.sessions[today] ? focus.sessions[today] : [];
        const todayFocus = focusSessions.reduce((sum, s) => {
            const duration = Utils.safeNumber(s?.duration, 0);
            return sum + duration;
        }, 0);
        document.getElementById('dashFocus').textContent = `${todayFocus} min`;
        document.getElementById('dashFocusBar').style.width = `${Math.min(100, (todayFocus/120)*100)}%`;

        // Sleep stats
        const sleep = Storage.get('sleep', { logs: {} });
        const lastSleep = sleep.logs[today];
        document.getElementById('dashSleep').textContent = lastSleep ? `${lastSleep.duration.toFixed(1)} hrs` : '-- hrs';
        document.getElementById('dashSleepBar').style.width = lastSleep ? `${Math.min(100, (lastSleep.duration/8)*100)}%` : '0%';

        // Mood display
        const moods = Storage.get('moods', { logs: {} });
        const todayMood = moods.logs[today];
        if (todayMood) {
            const moodEmojis = { great: '😄', good: '😊', okay: '😐', bad: '😔', awful: '😢' };
            const moodTexts = { great: 'Feeling great!', good: 'Feeling good', okay: 'Feeling okay', bad: 'Not so good', awful: 'Having a rough day' };
            document.getElementById('dashMoodEmoji').textContent = moodEmojis[todayMood.mood];
            document.getElementById('dashMoodText').textContent = moodTexts[todayMood.mood];
        }

        // Motivation
        this.updateMotivation(completedHabits, habits.length, todayWater, water.goal, todayFocus);

        // Tasks list
        this.renderDashTasks();

        // Habits list
        this.renderDashHabits();
    },

    updateMotivation(habitsCompleted, habitsTotal, water, waterGoal, focus) {
        const progress = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;
        const waterProgress = (water / waterGoal) * 100;
        const avgProgress = (progress + waterProgress) / 2;

        const titles = [
            "Keep pushing!",
            "You're making progress!",
            "Great momentum!",
            "Almost there!",
            "Incredible work! 🌟"
        ];
        const texts = [
            "Every journey starts with a single step. Start building momentum today!",
            "You're on track! Keep completing your habits and stay hydrated.",
            "Fantastic progress! Your consistency is paying off.",
            "So close to completing everything! Push through!",
            "You're crushing it today! Your dedication is inspiring."
        ];

        const index = Math.min(4, Math.floor(avgProgress / 25));
        document.getElementById('motivationTitle').textContent = titles[index];
        document.getElementById('motivationText').textContent = texts[index];
    },

    renderDashTasks() {
        const tasks = Storage.get('tasks', []);
        const today = Utils.getToday();
        const todayTasks = tasks.filter(t => t.due === today || !t.due).slice(0, 3);

        const container = document.getElementById('dashTasksList');
        if (todayTasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No tasks for today</p></div>';
            return;
        }

        container.innerHTML = todayTasks.map(task => `
            <div class="task-item ${task.priority} ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-check ${task.status === 'completed' ? 'checked' : ''}">
                    <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <div class="task-content">
                    <div class="task-title">${Utils.escapeHtml(task.name)}</div>
                </div>
            </div>
        `).join('');
    },

    renderDashHabits() {
        const habits = Storage.get('habits', []);
        const today = Utils.getToday();

        const container = document.getElementById('dashHabitsList');
        if (habits.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No habits yet</p></div>';
            return;
        }

        container.innerHTML = habits.slice(0, 4).map(habit => {
            const isCompleted = habit.completedDates && habit.completedDates.includes(today);
            return `
                <div class="habit-item" data-id="${habit.id}">
                    <div class="habit-check ${isCompleted ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${Utils.escapeHtml(habit.name)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
};

// ══════════════════════════════════════════════════════════════════════════
// HABITS MODULE
// ══════════════════════════════════════════════════════════════════════════

const Habits = {
    data: [],
    forgivenessDays: 1, // Allow 1 missed day without breaking streak

    init() {
        this.data = Storage.get('habits', []);
        this.bindEvents();
        this.render();
        this.renderHeatmap();
        this.updateStats();
    },

    bindEvents() {
        document.getElementById('addHabitBtn').addEventListener('click', () => this.addHabit());
        document.getElementById('habitInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addHabit();
        });

        document.getElementById('habitsList').addEventListener('click', (e) => {
            const item = e.target.closest('.habit-item');
            if (!item) return;

            const id = item.dataset.id;
            if (e.target.closest('.habit-check')) {
                this.toggleHabit(id);
            } else if (e.target.closest('.habit-delete')) {
                this.deleteHabit(id);
            }
        });
    },

    addHabit() {
        const input = document.getElementById('habitInput');
        const name = input.value.trim();
        if (!name) return;

        const habit = {
            id: Utils.generateId(),
            name,
            frequency: document.getElementById('habitFrequency').value,
            createdAt: Utils.getToday(),
            completedDates: []
        };

        this.data.push(habit);
        this.save();
        this.render();
        this.updateStats();
        input.value = '';

        XPSystem.addXP(10, 'Created new habit');
        Toast.show('Habit created!', 'success');
    },

    toggleHabit(id) {
        const habit = this.data.find(h => h.id === id);
        if (!habit) return;

        const today = Utils.getToday();
        const index = habit.completedDates.indexOf(today);

        if (index > -1) {
            habit.completedDates.splice(index, 1);
        } else {
            habit.completedDates.push(today);
            XPSystem.addXP(5, 'Completed habit');

            const streak = this.calculateStreak(habit);
            if (streak > 0 && streak % 7 === 0) {
                XPSystem.addXP(20, `${streak} day streak!`);
                Toast.show(`🔥 ${streak} day streak!`, 'success', 4000);
            }
        }

        this.save();
        this.render();
        this.renderHeatmap();
        this.updateStats();
        Dashboard.update();
    },

    deleteHabit(id) {
        if (!confirm('Delete this habit?')) return;
        this.data = this.data.filter(h => h.id !== id);
        this.save();
        this.render();
        this.updateStats();
        Dashboard.update();
    },

    calculateStreak(habit) {
        const today = Utils.getToday();
        let streak = 0;
        let missedDays = 0;
        let checkDate = new Date();

        while (true) {
            const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

            if (habit.completedDates.includes(dateStr)) {
                streak++;
                missedDays = 0;
            } else {
                missedDays++;
                if (missedDays > this.forgivenessDays) break;
            }

            checkDate.setDate(checkDate.getDate() - 1);
            if (streak > 365) break; // Safety limit
        }

        return streak;
    },

    save() {
        Storage.set('habits', this.data);
    },

    render() {
        const container = document.getElementById('habitsList');
        const today = Utils.getToday();
        const last7Days = Utils.getLastNDays(7);

        if (this.data.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><h3>No habits yet</h3><p>Create your first habit above!</p></div>';
            return;
        }

        container.innerHTML = this.data.map(habit => {
            const isCompleted = habit.completedDates && habit.completedDates.includes(today);
            const streak = this.calculateStreak(habit);

            const weekDots = last7Days.map(day => {
                const completed = habit.completedDates && habit.completedDates.includes(day);
                const isToday = day === today;
                return `<div class="habit-dot ${completed ? 'completed' : ''} ${isToday ? 'today' : ''}"></div>`;
            }).join('');

            return `
                <div class="habit-item" data-id="${habit.id}">
                    <div class="habit-check ${isCompleted ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${Utils.escapeHtml(habit.name)}</div>
                        <div class="habit-streak ${streak > 0 ? 'active' : ''}">
                            ${streak > 0 ? `<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> ${streak} day streak` : 'Start your streak!'}
                        </div>
                    </div>
                    <div class="habit-week-dots">${weekDots}</div>
                    <button class="habit-delete">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
            `;
        }).join('');
    },

    renderHeatmap() {
        const container = document.getElementById('habitHeatmap');
        const weeks = 12;
        const days = Utils.getLastNDays(weeks * 7);

        let html = '<div class="heatmap">';

        for (let w = 0; w < weeks; w++) {
            html += '<div class="heatmap-week">';
            for (let d = 0; d < 7; d++) {
                const index = w * 7 + d;
                const date = days[index];
                if (date) {
                    const completions = this.data.filter(h => h.completedDates && h.completedDates.includes(date)).length;
                    const level = this.data.length > 0 ? Math.min(4, Math.ceil((completions / this.data.length) * 4)) : 0;
                    html += `<div class="heatmap-day ${level > 0 ? `level-${level}` : ''}" title="${date}: ${completions} habits"></div>`;
                }
            }
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    updateStats() {
        const activeStreaks = this.data.filter(h => this.calculateStreak(h) > 0).length;
        const longestStreak = Math.max(0, ...this.data.map(h => this.calculateStreak(h)));

        document.getElementById('totalStreaks').textContent = activeStreaks;
        document.getElementById('longestStreak').textContent = longestStreak;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// FOCUS/POMODORO MODULE
// ══════════════════════════════════════════════════════════════════════════

const Focus = {
    data: { sessions: {} },
    timer: null,
    timeLeft: 25 * 60,
    totalTime: 25 * 60,
    isRunning: false,
    currentSound: null,
    audioContext: null,
    // Session ID to prevent race conditions when stopping/starting sounds
    audioSessionId: 0,
    // Flag to prevent rapid double-clicks from stacking sounds
    isTransitioning: false,
    // Track session start time for accurate duration calculation
    sessionStartTime: null,

    init() {
        this.loadData();
        this.bindEvents();
        this.render();
        this.renderSessions();
        this.renderChart();
        // Clean up audio on page unload to prevent memory leaks
        window.addEventListener('beforeunload', () => this.cleanupAudio());
    },

    /**
     * Load focus data from storage, with validation and migration.
     * Always call this before reading session data to ensure freshness.
     */
    loadData() {
        const stored = Storage.get('focus', { sessions: {} });
        // Ensure sessions object exists
        if (!stored.sessions || typeof stored.sessions !== 'object') {
            stored.sessions = {};
        }
        // Validate and clean up session data
        Object.keys(stored.sessions).forEach(dateKey => {
            const sessions = stored.sessions[dateKey];
            if (!Array.isArray(sessions)) {
                stored.sessions[dateKey] = [];
            } else {
                // Filter out invalid sessions and ensure valid duration values
                stored.sessions[dateKey] = sessions.filter(s => {
                    return s && typeof s === 'object' &&
                           typeof s.duration === 'number' &&
                           s.duration > 0 &&
                           !isNaN(s.duration);
                }).map(s => ({
                    duration: Math.round(Utils.safeNumber(s.duration, 0)),
                    completedAt: s.completedAt || new Date().toISOString()
                }));
            }
        });
        this.data = stored;
    },

    /**
     * Refresh data from storage - call before any render that needs current data.
     */
    refreshData() {
        this.loadData();
    },

    /**
     * Initialize or resume the Web Audio API context.
     * Handles browser autoplay policies by resuming suspended contexts.
     * @returns {boolean} True if context is ready, false if failed
     */
    initAudioContext() {
        try {
            if (!this.audioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) {
                    console.warn('Web Audio API not supported');
                    return false;
                }
                this.audioContext = new AudioContextClass();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(err => {
                    console.warn('Failed to resume audio context:', err);
                });
            }
            return this.audioContext.state !== 'closed';
        } catch (err) {
            console.error('Failed to initialize audio context:', err);
            return false;
        }
    },

    /**
     * Complete cleanup of audio resources - call on page unload
     */
    cleanupAudio() {
        this.stopAllSounds();
        if (this.audioContext && this.audioContext.state !== 'closed') {
            try {
                this.audioContext.close();
            } catch (e) { /* ignore */ }
        }
        this.audioContext = null;
    },

    // ══════════════════════════════════════════════════════════════════════════
    // AMBIENT AUDIO ENGINE - Three distinctly unique soundscapes
    // Refactored for reliability: proper cleanup, no memory leaks, smooth transitions
    // ══════════════════════════════════════════════════════════════════════════

    lofiEngine: {
        ctx: null,
        masterGain: null,
        isPlaying: false,
        schedulerInterval: null,
        // Track active audio nodes with automatic cleanup
        activeOscillators: [],
        activeSources: [],
        currentMode: null,
        nextNoteTime: 0,
        currentBeat: 0,
        chordIndex: 0,
        // Session ID to prevent race conditions during stop/start
        sessionId: 0,
        // Pending stop timeout reference for cancellation
        stopTimeoutId: null,

        // Mode-specific configurations
        modeConfig: null,

        /**
         * Initialize the audio engine with the given context.
         * Creates master gain node for global volume control.
         */
        init(audioContext) {
            if (this.ctx === audioContext && this.masterGain) {
                return; // Already initialized with same context
            }
            this.ctx = audioContext;
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0;
            this.masterGain.connect(this.ctx.destination);
        },

        /**
         * Register an oscillator with automatic cleanup on end.
         * Prevents memory leaks from accumulated oscillator references.
         */
        registerOscillator(osc) {
            this.activeOscillators.push(osc);
            osc.onended = () => {
                const idx = this.activeOscillators.indexOf(osc);
                if (idx > -1) this.activeOscillators.splice(idx, 1);
            };
        },

        /**
         * Register a buffer source with automatic cleanup on end.
         * Prevents memory leaks from accumulated source references.
         */
        registerSource(source) {
            this.activeSources.push(source);
            source.onended = () => {
                const idx = this.activeSources.indexOf(source);
                if (idx > -1) this.activeSources.splice(idx, 1);
            };
        },

        /**
         * Safely stop an oscillator with gain ramp to prevent clicks.
         */
        safeStopOscillator(osc, time) {
            try {
                osc.stop(time);
            } catch (e) { /* Already stopped */ }
        },

        /**
         * Safely stop a buffer source with gain ramp to prevent clicks.
         */
        safeStopSource(source, time) {
            try {
                source.stop(time);
            } catch (e) { /* Already stopped */ }
        },

        /**
         * Apply crossfade at buffer boundaries to eliminate loop clicks.
         * Fades out the end and fades in the beginning, blending them together.
         * @param {AudioBuffer} buffer - The audio buffer to process
         * @param {number} fadeLength - Length of crossfade in samples (default: 4410 = 0.1s at 44.1kHz)
         */
        applyLoopCrossfade(buffer, fadeLength) {
            const fadeSamples = fadeLength || Math.floor(buffer.sampleRate * 0.1);
            const numChannels = buffer.numberOfChannels;
            const bufferLength = buffer.length;

            // Ensure fade length doesn't exceed half the buffer
            const safeFadeLen = Math.min(fadeSamples, Math.floor(bufferLength / 4));

            for (let ch = 0; ch < numChannels; ch++) {
                const data = buffer.getChannelData(ch);

                // Apply crossfade: blend end into beginning
                for (let i = 0; i < safeFadeLen; i++) {
                    const fadeIn = i / safeFadeLen;
                    const fadeOut = 1 - fadeIn;

                    // Get samples from start and end
                    const startSample = data[i];
                    const endSample = data[bufferLength - safeFadeLen + i];

                    // Blend: fade in the start, fade out the end
                    data[i] = startSample * fadeIn + endSample * fadeOut;

                    // Also smooth the end to match the blended start
                    data[bufferLength - safeFadeLen + i] = endSample * fadeOut + startSample * fadeIn;
                }
            }
        },

        // ══════════════════════════════════════════════════════════════════════════
        // CAFE MODE - Warm, cozy, urban coffee shop with jazz piano lofi beat
        // Tempo: 78 BPM | Reverb: Short/intimate | EQ: Warm mids, rolled-off highs
        // ══════════════════════════════════════════════════════════════════════════

        cafeMode: {
            tempo: 78,
            // Jazz chord progression - Fmaj7 - Em7 - Dm7 - Cmaj7
            chords: [
                [174.61, 220.00, 261.63, 329.63],  // Fmaj7
                [164.81, 196.00, 246.94, 293.66],  // Em7
                [146.83, 174.61, 220.00, 261.63],  // Dm7
                [130.81, 164.81, 196.00, 246.94]   // Cmaj7
            ],

            createEffectsChain(engine) {
                const ctx = engine.ctx;

                // Warm EQ - boost low-mids, cut highs for cozy indoor sound
                const warmth = ctx.createBiquadFilter();
                warmth.type = 'lowshelf';
                warmth.frequency.value = 300;
                warmth.gain.value = 4;

                const presence = ctx.createBiquadFilter();
                presence.type = 'peaking';
                presence.frequency.value = 800;
                presence.Q.value = 0.8;
                presence.gain.value = 2;

                const highCut = ctx.createBiquadFilter();
                highCut.type = 'lowpass';
                highCut.frequency.value = 6000;
                highCut.Q.value = 0.5;

                // Short, intimate reverb (small room)
                const reverbLength = ctx.sampleRate * 1.2;
                const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) {
                    const data = reverbBuffer.getChannelData(ch);
                    for (let i = 0; i < reverbLength; i++) {
                        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 1.5);
                    }
                }
                const reverb = ctx.createConvolver();
                reverb.buffer = reverbBuffer;

                const reverbGain = ctx.createGain();
                reverbGain.gain.value = 0.2;

                const dryGain = ctx.createGain();
                dryGain.gain.value = 0.8;

                // Gentle compression
                const comp = ctx.createDynamicsCompressor();
                comp.threshold.value = -20;
                comp.knee.value = 20;
                comp.ratio.value = 3;
                comp.attack.value = 0.01;
                comp.release.value = 0.2;

                // Connect chain
                warmth.connect(presence);
                presence.connect(highCut);
                highCut.connect(comp);
                comp.connect(dryGain);
                comp.connect(reverbGain);
                reverbGain.connect(reverb);
                reverb.connect(engine.masterGain);
                dryGain.connect(engine.masterGain);

                return { input: warmth, reverb, reverbGain };
            },

            // Cafe-specific sounds
            playPianoChord(engine, time, frequencies, duration, velocity = 0.15) {
                const ctx = engine.ctx;

                frequencies.forEach((freq, idx) => {
                    // Piano-like tone using multiple harmonics
                    const harmonics = [1, 2, 3, 4, 5];
                    const harmonicGains = [1, 0.5, 0.25, 0.125, 0.06];

                    harmonics.forEach((h, i) => {
                        const osc = ctx.createOscillator();
                        osc.type = 'sine';
                        osc.frequency.value = freq * h;

                        const gain = ctx.createGain();
                        const vol = velocity * harmonicGains[i] * 0.06;
                        // Piano-like envelope: quick attack, gradual decay
                        gain.gain.setValueAtTime(0, time);
                        gain.gain.linearRampToValueAtTime(vol, time + 0.01);
                        gain.gain.exponentialRampToValueAtTime(vol * 0.4, time + 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                        osc.connect(gain);
                        gain.connect(engine.modeConfig.effects.input);

                        osc.start(time);
                        osc.stop(time + duration + 0.1);
                        engine.registerOscillator(osc);
                    });
                });
            },

            playKick(engine, time, velocity = 0.4) {
                const ctx = engine.ctx;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(120, time);
                osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(velocity * 0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 150;

                osc.connect(gain);
                gain.connect(filter);
                filter.connect(engine.modeConfig.effects.input);

                osc.start(time);
                osc.stop(time + 0.3);
                engine.registerOscillator(osc);
            },

            playSnare(engine, time, velocity = 0.25) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 0.12;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
                }

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2500;
                filter.Q.value = 0.8;

                const gain = ctx.createGain();
                gain.gain.value = velocity * 0.2;

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(engine.modeConfig.effects.input);

                noise.start(time);
                engine.registerSource(noise);
            },

            playHiHat(engine, time, velocity = 0.12) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 0.04;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
                }

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const highpass = ctx.createBiquadFilter();
                highpass.type = 'highpass';
                highpass.frequency.value = 6000;

                const gain = ctx.createGain();
                gain.gain.value = velocity * 0.1;

                noise.connect(highpass);
                highpass.connect(gain);
                gain.connect(engine.modeConfig.effects.input);

                noise.start(time);
                engine.registerSource(noise);
            },

            playBass(engine, time, freq, duration, velocity = 0.2) {
                const ctx = engine.ctx;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq / 2;

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(velocity * 0.25, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 250;

                osc.connect(gain);
                gain.connect(filter);
                filter.connect(engine.modeConfig.effects.input);

                osc.start(time);
                osc.stop(time + duration + 0.1);
                engine.registerOscillator(osc);
            },

            createVinylCrackle(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 5;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.015;
                    if (Math.random() < 0.002) {
                        data[i] += (Math.random() * 2 - 1) * 0.15;
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 2000;
                filter.Q.value = 0.3;

                const gain = ctx.createGain();
                gain.gain.value = 0.12;

                source.connect(filter);
                filter.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            createCafeAmbience(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 12;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    let murmur = 0;

                    for (let i = 0; i < bufferSize; i++) {
                        // Distant chatter - modulated brownian noise
                        murmur = murmur * 0.997 + (Math.random() * 2 - 1) * 0.003;
                        const chatterMod = Math.sin(i / ctx.sampleRate * 0.8 + ch) * 0.3 + 0.7;
                        data[i] = murmur * 3 * chatterMod;

                        // Cup clinks (ceramic resonance)
                        if (Math.random() < 0.00004) {
                            const clinkFreq = 2800 + Math.random() * 1500;
                            const clinkLen = Math.floor(ctx.sampleRate * 0.15);
                            for (let c = 0; c < clinkLen && i + c < bufferSize; c++) {
                                data[i + c] += Math.sin(c * clinkFreq / ctx.sampleRate * Math.PI * 2)
                                    * 0.03 * Math.exp(-c / (clinkLen * 0.1));
                            }
                        }

                        // Espresso machine hiss (occasional)
                        if (Math.random() < 0.000008) {
                            const hissLen = Math.floor(ctx.sampleRate * (1 + Math.random() * 2));
                            for (let h = 0; h < hissLen && i + h < bufferSize; h++) {
                                const env = Math.sin(h / hissLen * Math.PI);
                                data[i + h] += (Math.random() * 2 - 1) * 0.02 * env;
                            }
                        }
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const lowpass = ctx.createBiquadFilter();
                lowpass.type = 'lowpass';
                lowpass.frequency.value = 800;

                const gain = ctx.createGain();
                gain.gain.value = 0.18;

                source.connect(lowpass);
                lowpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            schedule(engine) {
                const secondsPerBeat = 60.0 / this.tempo;

                while (engine.nextNoteTime < engine.ctx.currentTime + 0.1) {
                    const beat = engine.currentBeat % 16;

                    // Kick on 1, 9
                    if (beat === 0 || beat === 8) {
                        this.playKick(engine, engine.nextNoteTime, 0.45);
                    }
                    // Ghost kick
                    if (beat === 6 && Math.random() > 0.5) {
                        this.playKick(engine, engine.nextNoteTime, 0.2);
                    }

                    // Snare on 4, 12
                    if (beat === 4 || beat === 12) {
                        this.playSnare(engine, engine.nextNoteTime, 0.25);
                    }

                    // Hi-hat pattern with swing
                    if (beat % 2 === 0 || (beat % 2 === 1 && Math.random() > 0.3)) {
                        this.playHiHat(engine, engine.nextNoteTime, beat % 2 === 0 ? 0.12 : 0.08);
                    }

                    // Piano chords - changes every bar
                    if (beat === 0) {
                        const chord = this.chords[engine.chordIndex];
                        this.playPianoChord(engine, engine.nextNoteTime, chord, secondsPerBeat * 3.5, 0.15);
                        this.playBass(engine, engine.nextNoteTime, chord[0], secondsPerBeat * 1.5, 0.22);
                        engine.chordIndex = (engine.chordIndex + 1) % this.chords.length;
                    }

                    // Walking bass note
                    if (beat === 8) {
                        const chord = this.chords[(engine.chordIndex + this.chords.length - 1) % this.chords.length];
                        this.playBass(engine, engine.nextNoteTime, chord[2], secondsPerBeat * 0.8, 0.15);
                    }

                    engine.nextNoteTime += secondsPerBeat / 4;
                    engine.currentBeat++;
                }
            }
        },

        // ══════════════════════════════════════════════════════════════════════════
        // RAIN MODE - Deep, melancholic, nighttime ambient with minimal/no beat
        // Tempo: 60 BPM (sparse) | Reverb: Long/cavernous | EQ: Deep lows, muted highs
        // ══════════════════════════════════════════════════════════════════════════

        rainMode: {
            tempo: 60,
            // Minor, melancholic chords - Am - Fmaj7 - C - G
            pads: [
                [110.00, 130.81, 164.81],    // Am
                [87.31, 110.00, 130.81],     // Fmaj7 (low voicing)
                [65.41, 98.00, 130.81],      // C (low)
                [49.00, 73.42, 98.00]        // G (very low)
            ],

            createEffectsChain(engine) {
                const ctx = engine.ctx;

                // Dark EQ - heavy low boost, significant high cut
                const subBoost = ctx.createBiquadFilter();
                subBoost.type = 'lowshelf';
                subBoost.frequency.value = 150;
                subBoost.gain.value = 6;

                const midCut = ctx.createBiquadFilter();
                midCut.type = 'peaking';
                midCut.frequency.value = 2000;
                midCut.Q.value = 0.5;
                midCut.gain.value = -4;

                const highCut = ctx.createBiquadFilter();
                highCut.type = 'lowpass';
                highCut.frequency.value = 4000;
                highCut.Q.value = 0.3;

                // Long, cavernous reverb
                const reverbLength = ctx.sampleRate * 4;
                const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) {
                    const data = reverbBuffer.getChannelData(ch);
                    for (let i = 0; i < reverbLength; i++) {
                        const decay = Math.pow(1 - i / reverbLength, 0.8);
                        data[i] = (Math.random() * 2 - 1) * decay * 0.8;
                    }
                }
                const reverb = ctx.createConvolver();
                reverb.buffer = reverbBuffer;

                const reverbGain = ctx.createGain();
                reverbGain.gain.value = 0.5; // Heavy reverb

                const dryGain = ctx.createGain();
                dryGain.gain.value = 0.5;

                // Subtle compression
                const comp = ctx.createDynamicsCompressor();
                comp.threshold.value = -30;
                comp.knee.value = 40;
                comp.ratio.value = 2;
                comp.attack.value = 0.1;
                comp.release.value = 0.5;

                subBoost.connect(midCut);
                midCut.connect(highCut);
                highCut.connect(comp);
                comp.connect(dryGain);
                comp.connect(reverbGain);
                reverbGain.connect(reverb);
                reverb.connect(engine.masterGain);
                dryGain.connect(engine.masterGain);

                return { input: subBoost, reverb, reverbGain };
            },

            playDeepPad(engine, time, frequencies, duration, velocity = 0.1) {
                const ctx = engine.ctx;

                frequencies.forEach(freq => {
                    // Very slow attack/release pad
                    [-6, 0, 6].forEach(detune => {
                        const osc = ctx.createOscillator();
                        osc.type = 'sine';
                        osc.frequency.value = freq;
                        osc.detune.value = detune + Math.random() * 4 - 2;

                        // Slow LFO for movement
                        const lfo = ctx.createOscillator();
                        lfo.frequency.value = 0.05 + Math.random() * 0.05;
                        const lfoGain = ctx.createGain();
                        lfoGain.gain.value = 5;
                        lfo.connect(lfoGain);
                        lfoGain.connect(osc.detune);

                        const gain = ctx.createGain();
                        gain.gain.setValueAtTime(0, time);
                        gain.gain.linearRampToValueAtTime(velocity * 0.08, time + 3); // Very slow attack
                        gain.gain.setValueAtTime(velocity * 0.08, time + duration - 4);
                        gain.gain.linearRampToValueAtTime(0, time + duration);

                        const filter = ctx.createBiquadFilter();
                        filter.type = 'lowpass';
                        filter.frequency.value = 600;

                        osc.connect(gain);
                        gain.connect(filter);
                        filter.connect(engine.modeConfig.effects.input);

                        osc.start(time);
                        osc.stop(time + duration + 0.5);
                        lfo.start(time);
                        lfo.stop(time + duration + 0.5);
                        engine.registerOscillator(osc);
                        engine.registerOscillator(lfo);
                    });
                });
            },

            playSubBass(engine, time, freq, duration) {
                const ctx = engine.ctx;
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq / 4; // Very deep

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.15, time + 1);
                gain.gain.setValueAtTime(0.15, time + duration - 2);
                gain.gain.linearRampToValueAtTime(0, time + duration);

                osc.connect(gain);
                gain.connect(engine.modeConfig.effects.input);

                osc.start(time);
                osc.stop(time + duration + 0.5);
                engine.registerOscillator(osc);
            },

            createRainscape(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 15;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    let rain = 0;
                    const panOffset = ch === 0 ? 0 : 0.3;

                    for (let i = 0; i < bufferSize; i++) {
                        // Continuous rain texture with stereo movement
                        const stereoMod = Math.sin(i / ctx.sampleRate * 0.15 + panOffset) * 0.3 + 0.7;
                        rain = rain * 0.993 + (Math.random() * 2 - 1) * 0.007;
                        data[i] = rain * stereoMod;

                        // Individual raindrops (more frequent)
                        if (Math.random() < 0.0003) {
                            const dropFreq = 3000 + Math.random() * 2000;
                            const dropLen = Math.floor(ctx.sampleRate * 0.02);
                            for (let d = 0; d < dropLen && i + d < bufferSize; d++) {
                                data[i + d] += Math.sin(d * dropFreq / ctx.sampleRate * Math.PI * 2)
                                    * 0.04 * Math.exp(-d / (dropLen * 0.3));
                            }
                        }

                        // Distant rumble/thunder (rare)
                        if (Math.random() < 0.000005) {
                            const rumbleLen = Math.floor(ctx.sampleRate * (3 + Math.random() * 4));
                            let rumble = 0;
                            for (let r = 0; r < rumbleLen && i + r < bufferSize; r++) {
                                rumble = rumble * 0.9995 + (Math.random() * 2 - 1) * 0.0005;
                                const env = Math.sin(r / rumbleLen * Math.PI) * 0.5;
                                data[i + r] += rumble * 15 * env;
                            }
                        }
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const lowpass = ctx.createBiquadFilter();
                lowpass.type = 'lowpass';
                lowpass.frequency.value = 3500;

                const highpass = ctx.createBiquadFilter();
                highpass.type = 'highpass';
                highpass.frequency.value = 80;

                const gain = ctx.createGain();
                gain.gain.value = 0.25;

                source.connect(lowpass);
                lowpass.connect(highpass);
                highpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            createWindowAmbience(engine) {
                const ctx = engine.ctx;
                // Rain on window glass effect
                const bufferSize = ctx.sampleRate * 8;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    for (let i = 0; i < bufferSize; i++) {
                        // Tapping on glass
                        if (Math.random() < 0.0008) {
                            const tapFreq = 4000 + Math.random() * 3000;
                            const tapLen = Math.floor(ctx.sampleRate * 0.008);
                            for (let t = 0; t < tapLen && i + t < bufferSize; t++) {
                                data[i + t] += Math.sin(t * tapFreq / ctx.sampleRate * Math.PI * 2)
                                    * 0.02 * Math.exp(-t / (tapLen * 0.2));
                            }
                        }
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const highpass = ctx.createBiquadFilter();
                highpass.type = 'highpass';
                highpass.frequency.value = 3000;

                const gain = ctx.createGain();
                gain.gain.value = 0.08;

                source.connect(highpass);
                highpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            schedule(engine) {
                const secondsPerBeat = 60.0 / this.tempo;

                while (engine.nextNoteTime < engine.ctx.currentTime + 0.2) {
                    const beat = engine.currentBeat % 32; // Longer cycle

                    // Deep pad changes every 8 beats (very slow)
                    if (beat === 0) {
                        const pad = this.pads[engine.chordIndex];
                        this.playDeepPad(engine, engine.nextNoteTime, pad, secondsPerBeat * 8, 0.1);
                        this.playSubBass(engine, engine.nextNoteTime, pad[0], secondsPerBeat * 8);
                        engine.chordIndex = (engine.chordIndex + 1) % this.pads.length;
                    }

                    // NO traditional drums - only ambient pads

                    engine.nextNoteTime += secondsPerBeat / 2; // Half-note resolution
                    engine.currentBeat++;
                }
            }
        },

        // ══════════════════════════════════════════════════════════════════════════
        // FOREST MODE - Bright, organic, outdoor with nature sounds and light instruments
        // No beat | Reverb: Open/airy | EQ: Bright highs, clear mids
        // ══════════════════════════════════════════════════════════════════════════

        forestMode: {
            tempo: 0, // No traditional tempo
            // Pentatonic scale for organic feel - D major pentatonic
            scale: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25],

            createEffectsChain(engine) {
                const ctx = engine.ctx;

                // Bright, airy EQ
                const lowCut = ctx.createBiquadFilter();
                lowCut.type = 'highpass';
                lowCut.frequency.value = 120;
                lowCut.Q.value = 0.5;

                const presence = ctx.createBiquadFilter();
                presence.type = 'peaking';
                presence.frequency.value = 3000;
                presence.Q.value = 0.8;
                presence.gain.value = 3;

                const airBoost = ctx.createBiquadFilter();
                airBoost.type = 'highshelf';
                airBoost.frequency.value = 6000;
                airBoost.gain.value = 2;

                // Open, spacious reverb (outdoor)
                const reverbLength = ctx.sampleRate * 2.5;
                const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
                for (let ch = 0; ch < 2; ch++) {
                    const data = reverbBuffer.getChannelData(ch);
                    for (let i = 0; i < reverbLength; i++) {
                        // Sparse early reflections for outdoor feel
                        const decay = Math.pow(1 - i / reverbLength, 1.2);
                        const sparse = Math.random() > 0.3 ? Math.random() * 2 - 1 : 0;
                        data[i] = sparse * decay * 0.6;
                    }
                }
                const reverb = ctx.createConvolver();
                reverb.buffer = reverbBuffer;

                const reverbGain = ctx.createGain();
                reverbGain.gain.value = 0.35;

                const dryGain = ctx.createGain();
                dryGain.gain.value = 0.7;

                lowCut.connect(presence);
                presence.connect(airBoost);
                airBoost.connect(dryGain);
                airBoost.connect(reverbGain);
                reverbGain.connect(reverb);
                reverb.connect(engine.masterGain);
                dryGain.connect(engine.masterGain);

                return { input: lowCut, reverb, reverbGain };
            },

            playGuitarPluck(engine, time, freq, velocity = 0.15) {
                const ctx = engine.ctx;

                // Karplus-Strong-like plucked string
                const bufferSize = Math.floor(ctx.sampleRate / freq);
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);

                // Initial excitation
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                // Decay filter
                const lpf = ctx.createBiquadFilter();
                lpf.type = 'lowpass';
                lpf.frequency.setValueAtTime(freq * 8, time);
                lpf.frequency.exponentialRampToValueAtTime(freq * 2, time + 2);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(velocity * 0.2, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 3);

                source.connect(lpf);
                lpf.connect(gain);
                gain.connect(engine.modeConfig.effects.input);

                source.start(time);
                source.stop(time + 3.5);
                engine.registerSource(source);
            },

            playFluteTone(engine, time, freq, duration, velocity = 0.08) {
                const ctx = engine.ctx;

                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;

                // Breath noise
                const noiseLen = ctx.sampleRate * duration;
                const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
                const noiseData = noiseBuffer.getChannelData(0);
                for (let i = 0; i < noiseLen; i++) {
                    noiseData[i] = (Math.random() * 2 - 1) * 0.1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = noiseBuffer;

                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = freq * 2;
                noiseFilter.Q.value = 2;

                // Vibrato
                const vibrato = ctx.createOscillator();
                vibrato.frequency.value = 5;
                const vibratoGain = ctx.createGain();
                vibratoGain.gain.value = 4;
                vibrato.connect(vibratoGain);
                vibratoGain.connect(osc.frequency);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(velocity * 0.12, time + 0.3);
                gain.gain.setValueAtTime(velocity * 0.12, time + duration - 0.5);
                gain.gain.linearRampToValueAtTime(0, time + duration);

                const noiseGain = ctx.createGain();
                noiseGain.gain.value = velocity * 0.03;

                osc.connect(gain);
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                gain.connect(engine.modeConfig.effects.input);
                noiseGain.connect(engine.modeConfig.effects.input);

                osc.start(time);
                osc.stop(time + duration + 0.1);
                vibrato.start(time);
                vibrato.stop(time + duration + 0.1);
                noise.start(time);
                engine.registerOscillator(osc);
                engine.registerOscillator(vibrato);
                engine.registerSource(noise);
            },

            playChime(engine, time, freq, velocity = 0.1) {
                const ctx = engine.ctx;

                // Bell-like harmonics
                const harmonics = [1, 2.4, 5.5, 8.9];
                harmonics.forEach((h, i) => {
                    const osc = ctx.createOscillator();
                    osc.type = 'sine';
                    osc.frequency.value = freq * h;

                    const gain = ctx.createGain();
                    const vol = velocity * 0.08 / (i + 1);
                    gain.gain.setValueAtTime(vol, time);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 4 - i * 0.5);

                    osc.connect(gain);
                    gain.connect(engine.modeConfig.effects.input);

                    osc.start(time);
                    osc.stop(time + 5);
                    engine.registerOscillator(osc);
                });
            },

            createForestscape(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 20;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    let wind = 0;
                    const chOffset = ch * 0.5;

                    for (let i = 0; i < bufferSize; i++) {
                        // Gentle wind through trees with movement
                        const windMod = Math.sin(i / ctx.sampleRate * 0.1 + chOffset) * 0.4 + 0.6;
                        const gust = Math.sin(i / ctx.sampleRate * 0.03) * 0.3 + 0.7;
                        wind = wind * 0.997 + (Math.random() * 2 - 1) * 0.003;
                        data[i] = wind * 1.5 * windMod * gust;

                        // Rustling leaves
                        if (Math.random() < 0.0005) {
                            const rustleLen = Math.floor(ctx.sampleRate * 0.05);
                            for (let r = 0; r < rustleLen && i + r < bufferSize; r++) {
                                data[i + r] += (Math.random() * 2 - 1) * 0.03 * Math.exp(-r / (rustleLen * 0.3));
                            }
                        }
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const lowpass = ctx.createBiquadFilter();
                lowpass.type = 'lowpass';
                lowpass.frequency.value = 4000;

                const gain = ctx.createGain();
                gain.gain.value = 0.15;

                source.connect(lowpass);
                lowpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            createBirdsong(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 30;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    // Scattered birdsong
                    const numBirds = 8 + Math.floor(Math.random() * 6);

                    for (let b = 0; b < numBirds; b++) {
                        const startPos = Math.floor(Math.random() * bufferSize * 0.9);
                        const birdFreq = 1800 + Math.random() * 2500;
                        const songLen = Math.floor(ctx.sampleRate * (0.3 + Math.random() * 0.8));
                        const pan = ch === 0 ? Math.random() : 1 - Math.random();

                        // Warbling pattern
                        const numNotes = 3 + Math.floor(Math.random() * 5);
                        let pos = startPos;

                        for (let n = 0; n < numNotes; n++) {
                            const noteLen = Math.floor(songLen / numNotes * (0.5 + Math.random() * 0.5));
                            const noteFreq = birdFreq * (0.8 + Math.random() * 0.4);
                            const freqSlide = (Math.random() - 0.5) * 500;

                            for (let s = 0; s < noteLen && pos + s < bufferSize; s++) {
                                const freq = noteFreq + freqSlide * (s / noteLen);
                                const env = Math.sin(s / noteLen * Math.PI);
                                data[pos + s] += Math.sin(s * freq / ctx.sampleRate * Math.PI * 2)
                                    * 0.015 * env * pan;
                            }
                            pos += noteLen + Math.floor(Math.random() * ctx.sampleRate * 0.1);
                        }
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const bandpass = ctx.createBiquadFilter();
                bandpass.type = 'bandpass';
                bandpass.frequency.value = 3000;
                bandpass.Q.value = 0.5;

                const gain = ctx.createGain();
                gain.gain.value = 0.12;

                source.connect(bandpass);
                bandpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            createStreamSound(engine) {
                const ctx = engine.ctx;
                const bufferSize = ctx.sampleRate * 10;
                const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

                for (let ch = 0; ch < 2; ch++) {
                    const data = buffer.getChannelData(ch);
                    let stream = 0;

                    for (let i = 0; i < bufferSize; i++) {
                        // Gentle stream/water
                        stream = stream * 0.98 + (Math.random() * 2 - 1) * 0.02;
                        const mod = Math.sin(i / ctx.sampleRate * 0.5 + ch) * 0.3 + 0.7;
                        data[i] = stream * mod;
                    }
                }

                // Apply crossfade to prevent clicks at loop point
                engine.applyLoopCrossfade(buffer);

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.loop = true;

                const bandpass = ctx.createBiquadFilter();
                bandpass.type = 'bandpass';
                bandpass.frequency.value = 1500;
                bandpass.Q.value = 0.3;

                const gain = ctx.createGain();
                gain.gain.value = 0.06;

                source.connect(bandpass);
                bandpass.connect(gain);
                gain.connect(engine.masterGain);
                source.start();
                engine.registerSource(source);
            },

            scheduleOrganic(engine) {
                // Random, organic timing for instruments
                const now = engine.ctx.currentTime;

                // Random guitar plucks
                if (Math.random() < 0.008) {
                    const note = this.scale[Math.floor(Math.random() * this.scale.length)];
                    this.playGuitarPluck(engine, now + Math.random() * 0.5, note, 0.1 + Math.random() * 0.08);
                }

                // Occasional flute phrases
                if (Math.random() < 0.002) {
                    const note = this.scale[Math.floor(Math.random() * this.scale.length)];
                    this.playFluteTone(engine, now + Math.random(), note, 2 + Math.random() * 3, 0.06 + Math.random() * 0.04);
                }

                // Wind chimes
                if (Math.random() < 0.004) {
                    const note = this.scale[Math.floor(Math.random() * this.scale.length)] * 2;
                    this.playChime(engine, now + Math.random() * 0.3, note, 0.08 + Math.random() * 0.05);
                }
            }
        },

        // ══════════════════════════════════════════════════════════════════════════
        // ENGINE CONTROL - With race condition prevention and proper cleanup
        // ══════════════════════════════════════════════════════════════════════════

        /**
         * Start playing the specified ambient sound mode.
         * Handles cleanup of previous sounds and prevents race conditions.
         * @param {string} mode - 'coffee', 'rain', or 'forest'
         */
        start(mode) {
            // Increment session ID to invalidate any pending stop operations
            this.sessionId++;
            const currentSession = this.sessionId;

            // Cancel any pending stop timeout from previous session
            if (this.stopTimeoutId) {
                clearTimeout(this.stopTimeoutId);
                this.stopTimeoutId = null;
            }

            // If already playing, do immediate cleanup (no fade)
            if (this.isPlaying) {
                this.immediateCleanup();
            }

            // Validate context is ready
            if (!this.ctx || this.ctx.state === 'closed') {
                console.error('Audio context not available');
                return;
            }

            this.currentMode = mode;
            this.isPlaying = true;
            this.currentBeat = 0;
            this.chordIndex = 0;
            this.nextNoteTime = this.ctx.currentTime + 0.1;

            // Setup mode-specific configuration with error handling
            try {
                switch(mode) {
                    case 'coffee':
                        this.modeConfig = {
                            mode: this.cafeMode,
                            effects: this.cafeMode.createEffectsChain(this)
                        };
                        this.cafeMode.createVinylCrackle(this);
                        this.cafeMode.createCafeAmbience(this);
                        this.schedulerInterval = setInterval(() => {
                            if (this.sessionId === currentSession && this.isPlaying) {
                                this.cafeMode.schedule(this);
                            }
                        }, 25);
                        break;

                    case 'rain':
                        this.modeConfig = {
                            mode: this.rainMode,
                            effects: this.rainMode.createEffectsChain(this)
                        };
                        this.rainMode.createRainscape(this);
                        this.rainMode.createWindowAmbience(this);
                        this.schedulerInterval = setInterval(() => {
                            if (this.sessionId === currentSession && this.isPlaying) {
                                this.rainMode.schedule(this);
                            }
                        }, 50);
                        break;

                    case 'forest':
                        this.modeConfig = {
                            mode: this.forestMode,
                            effects: this.forestMode.createEffectsChain(this)
                        };
                        this.forestMode.createForestscape(this);
                        this.forestMode.createBirdsong(this);
                        this.forestMode.createStreamSound(this);
                        this.schedulerInterval = setInterval(() => {
                            if (this.sessionId === currentSession && this.isPlaying) {
                                this.forestMode.scheduleOrganic(this);
                            }
                        }, 100);
                        break;
                }

                // Smooth fade in to prevent clicks
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0.75, this.ctx.currentTime + 2.5);
            } catch (err) {
                console.error('Failed to start ambient sound:', err);
                this.immediateCleanup();
                throw err;
            }
        },

        /**
         * Stop playing with smooth fadeout.
         * Uses session ID to prevent race conditions with pending operations.
         */
        stop() {
            if (!this.isPlaying) return;

            const stoppingSession = this.sessionId;
            this.isPlaying = false;
            this.currentMode = null;

            // Clear scheduler immediately
            if (this.schedulerInterval) {
                clearInterval(this.schedulerInterval);
                this.schedulerInterval = null;
            }

            // Smooth fade out to prevent clicks
            if (this.ctx && this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
                this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
            }

            // Delayed cleanup - only if session hasn't changed (no new sound started)
            this.stopTimeoutId = setTimeout(() => {
                if (this.sessionId === stoppingSession) {
                    this.cleanupNodes();
                }
                this.stopTimeoutId = null;
            }, 1600);
        },

        /**
         * Immediate cleanup without fadeout - used when switching sounds quickly.
         */
        immediateCleanup() {
            if (this.schedulerInterval) {
                clearInterval(this.schedulerInterval);
                this.schedulerInterval = null;
            }
            this.cleanupNodes();
            this.isPlaying = false;
        },

        /**
         * Clean up all active audio nodes.
         * Called after fadeout completes or for immediate cleanup.
         */
        cleanupNodes() {
            const stopTime = this.ctx ? this.ctx.currentTime + 0.05 : 0;

            // Stop all oscillators
            this.activeOscillators.forEach(osc => {
                this.safeStopOscillator(osc, stopTime);
            });

            // Stop all buffer sources
            this.activeSources.forEach(src => {
                this.safeStopSource(src, stopTime);
            });

            // Clear arrays
            this.activeOscillators = [];
            this.activeSources = [];
            this.modeConfig = null;
        }
    },

    /**
     * Play an ambient sound by name.
     * Handles audio context initialization, prevents double-starts, and manages transitions.
     * @param {string} soundName - 'rain', 'forest', 'coffee', or 'none'
     */
    playSound(soundName) {
        // Prevent rapid clicking from stacking sounds
        if (this.isTransitioning) {
            return;
        }

        // If selecting "none" or toggling off, just stop
        if (soundName === 'none') {
            this.stopAllSounds();
            return;
        }

        // Set transition flag to prevent rapid double-clicks
        this.isTransitioning = true;

        // Initialize audio context on user interaction (required for autoplay policy)
        if (!this.initAudioContext()) {
            Toast.show('Audio not supported in this browser', 'error');
            this.isTransitioning = false;
            return;
        }

        // Initialize lofi engine if needed
        if (!this.lofiEngine.ctx) {
            this.lofiEngine.init(this.audioContext);
        }

        // Start the lofi engine with selected mode
        try {
            this.lofiEngine.start(soundName);
            this.currentSound = soundName;
        } catch(e) {
            console.error('Failed to create sound:', e);
            Toast.show('Could not play ambient sound', 'error');
            this.currentSound = null;
        }

        // Clear transition flag after short delay
        setTimeout(() => {
            this.isTransitioning = false;
        }, 300);
    },

    /**
     * Stop all ambient sounds with smooth fadeout.
     * Cleans up all audio resources and resets state.
     */
    stopAllSounds() {
        if (this.lofiEngine.isPlaying) {
            this.lofiEngine.stop();
        }
        this.currentSound = null;
    },

    bindEvents() {
        document.getElementById('timerStartBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('timerResetBtn').addEventListener('click', () => this.resetTimer());

        document.querySelectorAll('.timer-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.timer-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTime(parseInt(btn.dataset.time));
            });
        });

        document.querySelectorAll('.sound-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const soundName = btn.dataset.sound;
                const wasActive = btn.classList.contains('active');

                document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));

                // Toggle off if clicking same button, otherwise activate new one
                if (!wasActive) {
                    btn.classList.add('active');
                    this.playSound(soundName);
                } else {
                    this.playSound('none');
                }
            });
        });
    },

    setTime(minutes) {
        this.timeLeft = minutes * 60;
        this.totalTime = minutes * 60;
        this.render();
    },

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    },

    startTimer() {
        this.isRunning = true;
        document.getElementById('timerStartBtn').innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
        document.getElementById('timerStatus').textContent = 'Focusing...';

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.render();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    },

    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        document.getElementById('timerStartBtn').innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Start';
        document.getElementById('timerStatus').textContent = 'Paused';
    },

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.totalTime;
        document.getElementById('timerStatus').textContent = 'Focus';
        this.render();
    },

    /**
     * Complete a focus session and record it.
     * Calculates accurate duration based on total time set (not elapsed time).
     * Ensures data integrity and prevents duplicate entries.
     */
    completeSession() {
        this.pauseTimer();

        // Calculate duration in minutes from the timer setting
        const durationMinutes = Math.round(this.totalTime / 60);

        // Validate duration
        if (durationMinutes <= 0 || isNaN(durationMinutes)) {
            console.warn('Invalid session duration, not recording');
            this.resetTimer();
            return;
        }

        const today = Utils.getToday();
        const completedAt = new Date().toISOString();

        // Refresh data from storage to prevent overwriting concurrent changes
        this.refreshData();

        // Initialize today's sessions array if needed
        if (!this.data.sessions[today]) {
            this.data.sessions[today] = [];
        }

        // Create session record
        const session = {
            duration: durationMinutes,
            completedAt: completedAt
        };

        // Add session
        this.data.sessions[today].push(session);

        // Save immediately
        this.save();

        // Award XP based on duration
        const xpAmount = Math.min(50, Math.max(5, Math.floor(durationMinutes / 5) * 5));
        XPSystem.addXP(xpAmount, `Completed ${durationMinutes}min focus session`);
        Toast.show(`🎉 Focus session complete! +${xpAmount} XP`, 'success');

        this.resetTimer();
        this.renderSessions();
        this.renderChart();
        Dashboard.update();
    },

    save() {
        Storage.set('focus', this.data);
    },

    render() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timerDisplay').textContent =
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Update ring
        const circumference = 2 * Math.PI * 90;
        const offset = circumference * (1 - this.timeLeft / this.totalTime);
        document.getElementById('timerRingFill').style.strokeDashoffset = offset;
    },

    /**
     * Render today's focus sessions list with total time summary.
     * Refreshes data from storage to ensure accuracy.
     */
    renderSessions() {
        // Refresh data to ensure we have the latest
        this.refreshData();

        const today = Utils.getToday();
        const sessions = this.data.sessions[today] || [];
        const container = document.getElementById('focusSessionsList');

        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No focus sessions today</p></div>';
            return;
        }

        // Calculate today's total with validation
        const todayTotal = sessions.reduce((sum, s) => {
            return sum + Utils.safeNumber(s.duration, 0);
        }, 0);

        // Build sessions list HTML
        const sessionsHtml = sessions.map((s, index) => {
            const duration = Utils.safeNumber(s.duration, 0);
            let timeStr = 'Unknown time';
            try {
                if (s.completedAt) {
                    timeStr = new Date(s.completedAt).toLocaleTimeString('en', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            } catch (e) {
                console.warn('Invalid completedAt date:', s.completedAt);
            }

            return `
                <div class="task-item">
                    <div class="task-content">
                        <div class="task-title">${duration} minute session</div>
                        <div class="task-meta">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add total summary at top
        container.innerHTML = `
            <div style="padding: 12px 16px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">Today's Total</span>
                <span style="font-weight: 700; color: var(--accent);">${todayTotal} minutes</span>
            </div>
            ${sessionsHtml}
        `;
    },

    /**
     * Render the weekly focus time chart with daily breakdown and total.
     * Refreshes data from storage and validates all values.
     */
    renderChart() {
        // Refresh data to ensure we have the latest
        this.refreshData();

        const container = document.getElementById('focusChart');
        if (!container) return;

        const days = Utils.getLastNDays(7);
        const maxMinutes = 180; // 3 hours max for scaling

        // Calculate daily totals with validation
        const dailyTotals = days.map(day => {
            const sessions = this.data.sessions[day] || [];
            const totalMinutes = sessions.reduce((sum, s) => {
                return sum + Utils.safeNumber(s.duration, 0);
            }, 0);
            return {
                day,
                minutes: totalMinutes,
                label: Utils.getDayLabel(day)
            };
        });

        // Calculate weekly total
        const weeklyTotal = dailyTotals.reduce((sum, d) => sum + d.minutes, 0);
        const weeklyHours = Math.floor(weeklyTotal / 60);
        const weeklyMins = weeklyTotal % 60;

        // Find the max for dynamic scaling (minimum of 60 for better visualization)
        const actualMax = Math.max(60, ...dailyTotals.map(d => d.minutes));
        const scaleMax = Math.min(maxMinutes, Math.ceil(actualMax / 30) * 30 + 30);

        // Build chart HTML with weekly summary
        const chartBarsHtml = dailyTotals.map(({ day, minutes, label }) => {
            const height = (minutes / scaleMax) * 100;
            const isToday = day === Utils.getToday();

            return `
                <div class="sleep-bar-container">
                    <div class="sleep-bar-wrapper">
                        <div class="sleep-bar" style="height: ${Math.max(4, height)}%; ${isToday ? 'background: var(--gradient-success);' : ''}">
                            ${minutes > 0 ? `<span class="sleep-bar-value">${minutes}m</span>` : ''}
                        </div>
                    </div>
                    <span class="sleep-bar-label" style="${isToday ? 'font-weight: 700; color: var(--accent);' : ''}">${label}</span>
                </div>
            `;
        }).join('');

        // Add weekly summary above the chart
        container.innerHTML = chartBarsHtml;

        // Update the card header to show weekly total (find parent card-header)
        const cardHeader = container.closest('.card')?.querySelector('.card-header');
        if (cardHeader) {
            // Check if summary already exists, update or create
            let summaryEl = cardHeader.querySelector('.weekly-total-summary');
            if (!summaryEl) {
                summaryEl = document.createElement('span');
                summaryEl.className = 'weekly-total-summary';
                summaryEl.style.cssText = 'font-size: 0.85rem; font-weight: 600; color: var(--accent);';
                cardHeader.appendChild(summaryEl);
            }
            summaryEl.textContent = weeklyHours > 0
                ? `${weeklyHours}h ${weeklyMins}m total`
                : `${weeklyMins}m total`;
        }
    },

    /**
     * Get total focus minutes for a specific date.
     * @param {string} dateKey - Date in YYYY-MM-DD format
     * @returns {number} Total minutes for that day
     */
    getTotalMinutesForDay(dateKey) {
        this.refreshData();
        const sessions = this.data.sessions[dateKey] || [];
        return sessions.reduce((sum, s) => sum + Utils.safeNumber(s.duration, 0), 0);
    },

    /**
     * Get total focus minutes for the past N days.
     * @param {number} n - Number of days to include
     * @returns {number} Total minutes
     */
    getTotalMinutesForDays(n) {
        this.refreshData();
        const days = Utils.getLastNDays(n);
        return days.reduce((sum, day) => {
            const sessions = this.data.sessions[day] || [];
            return sum + sessions.reduce((s, session) =>
                s + Utils.safeNumber(session.duration, 0), 0);
        }, 0);
    }
};

// ══════════════════════════════════════════════════════════════════════════
// PLANNER MODULE
// ══════════════════════════════════════════════════════════════════════════

const Planner = {
    data: [],
    filter: 'all',

    init() {
        this.data = Storage.get('tasks', []);
        this.bindEvents();
        this.render();
        this.updateStats();
    },

    bindEvents() {
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.classList.add('btn-ghost');
                    b.classList.remove('btn-secondary');
                });
                btn.classList.add('active', 'btn-secondary');
                btn.classList.remove('btn-ghost');
                this.filter = btn.dataset.filter;
                this.render();
            });
        });

        document.getElementById('tasksList').addEventListener('click', (e) => {
            const item = e.target.closest('.task-item');
            if (!item) return;

            const id = item.dataset.id;
            if (e.target.closest('.task-check')) {
                this.toggleTask(id);
            } else if (e.target.closest('.task-action.delete')) {
                this.deleteTask(id);
            }
        });
    },

    addTask() {
        const input = document.getElementById('taskInput');
        const name = input.value.trim();
        if (!name) return;

        const task = {
            id: Utils.generateId(),
            name,
            due: document.getElementById('taskDue').value || null,
            priority: document.getElementById('taskPriority').value,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.data.unshift(task);
        this.save();
        this.render();
        this.updateStats();
        input.value = '';

        XPSystem.addXP(5, 'Created task');
    },

    toggleTask(id) {
        const task = this.data.find(t => t.id === id);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            if (task.status === 'completed') {
                XPSystem.addXP(10, 'Completed task');
            }
            this.save();
            this.render();
            this.updateStats();
            Dashboard.update();
        }
    },

    deleteTask(id) {
        this.data = this.data.filter(t => t.id !== id);
        this.save();
        this.render();
        this.updateStats();
    },

    save() {
        Storage.set('tasks', this.data);
    },

    render() {
        let tasks = [...this.data];
        const today = Utils.getToday();

        if (this.filter === 'pending') {
            tasks = tasks.filter(t => t.status !== 'completed');
        } else if (this.filter === 'completed') {
            tasks = tasks.filter(t => t.status === 'completed');
        }

        // Sort by priority and due date
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        tasks.sort((a, b) => {
            if (a.due && b.due) return new Date(a.due) - new Date(b.due);
            if (a.due) return -1;
            if (b.due) return 1;
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        const container = document.getElementById('tasksList');

        if (tasks.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No tasks found</p></div>';
            return;
        }

        container.innerHTML = tasks.map(task => {
            const isOverdue = task.due && task.due < today && task.status !== 'completed';
            return `
                <div class="task-item ${task.priority} ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-check ${task.status === 'completed' ? 'checked' : ''}">
                        <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </div>
                    <div class="task-content">
                        <div class="task-title">${Utils.escapeHtml(task.name)}</div>
                        <div class="task-meta">
                            ${task.due ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">${task.due}</span>` : ''}
                            <span>${task.priority}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action delete">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update MIT
        const highPriority = this.data.find(t => t.priority === 'high' && t.status !== 'completed');
        document.getElementById('mitTask').innerHTML = highPriority
            ? `<div style="font-size: 1.1rem; font-weight: 500;">${Utils.escapeHtml(highPriority.name)}</div>`
            : '<p style="color: var(--text-secondary);">No high priority tasks</p>';
    },

    updateStats() {
        const completed = this.data.filter(t => t.status === 'completed').length;
        const pending = this.data.filter(t => t.status !== 'completed').length;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// MOOD MODULE
// ══════════════════════════════════════════════════════════════════════════

const Mood = {
    data: { logs: {} },
    selectedMood: null,

    init() {
        this.data = Storage.get('moods', { logs: {} });
        this.bindEvents();
        this.render();
        this.renderChart();
        this.checkTodayMood();
    },

    bindEvents() {
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedMood = btn.dataset.mood;
            });
        });

        document.getElementById('saveMoodBtn').addEventListener('click', () => this.saveMood());
    },

    checkTodayMood() {
        const today = Utils.getToday();
        const todayMood = this.data.logs[today];
        if (todayMood) {
            document.querySelector(`.mood-btn[data-mood="${todayMood.mood}"]`)?.classList.add('active');
            this.selectedMood = todayMood.mood;
            document.getElementById('moodNote').value = todayMood.note || '';
        }
    },

    saveMood() {
        if (!this.selectedMood) {
            Toast.show('Please select a mood', 'warning');
            return;
        }

        const today = Utils.getToday();
        const isNew = !this.data.logs[today];

        this.data.logs[today] = {
            mood: this.selectedMood,
            note: document.getElementById('moodNote').value,
            timestamp: new Date().toISOString()
        };

        this.save();
        this.render();
        this.renderChart();
        Dashboard.update();

        if (isNew) {
            XPSystem.addXP(5, 'Logged mood');
        }
        Toast.show('Mood saved!', 'success');
    },

    save() {
        Storage.set('moods', this.data);
    },

    render() {
        const days = Utils.getLastNDays(7);
        const moodEmojis = { great: '😄', good: '😊', okay: '😐', bad: '😔', awful: '😢' };

        const container = document.getElementById('moodHistory');
        const history = days.filter(d => this.data.logs[d]).slice(0, 5);

        if (history.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No mood entries yet</p></div>';
            return;
        }

        container.innerHTML = history.map(day => {
            const entry = this.data.logs[day];
            return `
                <div class="task-item" style="border-left-color: var(--mood-${entry.mood});">
                    <span style="font-size: 1.5rem;">${moodEmojis[entry.mood]}</span>
                    <div class="task-content">
                        <div class="task-title">${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</div>
                        <div class="task-meta">${day}${entry.note ? ` - ${entry.note.substring(0, 30)}...` : ''}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Update insight
        this.updateInsight();
    },

    renderChart() {
        const container = document.getElementById('moodChart');
        const days = Utils.getLastNDays(7);
        const moodValues = { great: 5, good: 4, okay: 3, bad: 2, awful: 1 };
        const moodEmojis = { great: '😄', good: '😊', okay: '😐', bad: '😔', awful: '😢' };

        container.innerHTML = days.map(day => {
            const entry = this.data.logs[day];
            const value = entry ? moodValues[entry.mood] : 0;
            const height = (value / 5) * 100;

            return `
                <div class="sleep-bar-container">
                    <div class="sleep-bar-wrapper">
                        <div class="sleep-bar" style="height: ${Math.max(4, height)}%; background: var(--mood-${entry?.mood || 'okay'});">
                            ${entry ? `<span class="sleep-bar-value">${moodEmojis[entry.mood]}</span>` : ''}
                        </div>
                    </div>
                    <span class="sleep-bar-label">${Utils.getDayLabel(day)}</span>
                </div>
            `;
        }).join('');
    },

    updateInsight() {
        const days = Utils.getLastNDays(7);
        const moods = days.map(d => this.data.logs[d]?.mood).filter(Boolean);

        const container = document.getElementById('moodInsight');
        if (moods.length < 3) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Log more moods to see insights!</p>';
            return;
        }

        const moodCounts = moods.reduce((acc, m) => { acc[m] = (acc[m] || 0) + 1; return acc; }, {});
        const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0];

        const insights = {
            great: "You've been feeling great! Keep doing what you're doing.",
            good: "Overall positive week! Small joys add up.",
            okay: "A balanced week. Consider what might boost your mood.",
            bad: "It's been a tough week. Remember to be kind to yourself.",
            awful: "Sending you strength. Consider reaching out to someone you trust."
        };

        container.innerHTML = `<p>${insights[mostCommon]}</p>`;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// WATER MODULE
// ══════════════════════════════════════════════════════════════════════════

const Water = {
    data: { goal: 2000, logs: {}, meals: {} },

    init() {
        this.data = Storage.get('water', { goal: 2000, logs: {}, meals: {} });
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.querySelectorAll('.water-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addWater(parseInt(btn.dataset.amount));
            });
        });

        document.getElementById('addCustomWater').addEventListener('click', () => {
            const input = document.getElementById('customWater');
            const amount = parseInt(input.value);
            if (amount > 0) {
                this.addWater(amount);
                input.value = '';
            }
        });

        document.getElementById('addMealBtn').addEventListener('click', () => this.addMeal());
    },

    addWater(amount) {
        const today = Utils.getToday();
        if (!this.data.logs[today]) {
            this.data.logs[today] = [];
        }

        this.data.logs[today].push({
            amount,
            time: new Date().toISOString()
        });

        this.save();
        this.render();
        Dashboard.update();

        XPSystem.addXP(2, 'Stayed hydrated');
        Toast.show(`+${amount}ml added`, 'success');
    },

    addMeal() {
        const input = document.getElementById('mealInput');
        const name = input.value.trim();
        if (!name) return;

        const today = Utils.getToday();
        if (!this.data.meals[today]) {
            this.data.meals[today] = [];
        }

        this.data.meals[today].push({
            name,
            type: document.getElementById('mealType').value,
            time: new Date().toISOString()
        });

        this.save();
        this.renderMeals();
        input.value = '';

        XPSystem.addXP(3, 'Logged meal');
        Toast.show('Meal logged!', 'success');
    },

    save() {
        Storage.set('water', this.data);
    },

    render() {
        const today = Utils.getToday();
        const total = (this.data.logs[today] || []).reduce((sum, l) => sum + l.amount, 0);
        const percent = Math.min(100, (total / this.data.goal) * 100);

        document.getElementById('waterAmount').textContent = total;
        document.getElementById('waterGoal').textContent = this.data.goal;
        document.getElementById('waterFill').style.height = `${percent}%`;

        this.renderMeals();
    },

    renderMeals() {
        const today = Utils.getToday();
        const meals = this.data.meals[today] || [];
        const container = document.getElementById('mealsList');

        if (meals.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.85rem;">No meals logged today</p>';
            return;
        }

        container.innerHTML = meals.map(meal => `
            <div class="meal-item">
                <div class="meal-icon">${meal.type}</div>
                <div class="meal-info">
                    <div class="meal-name">${Utils.escapeHtml(meal.name)}</div>
                    <div class="meal-time">${new Date(meal.time).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `).join('');
    }
};

// ══════════════════════════════════════════════════════════════════════════
// SLEEP MODULE
// ══════════════════════════════════════════════════════════════════════════

const Sleep = {
    data: { goal: 8, logs: {} },

    init() {
        this.data = Storage.get('sleep', { goal: 8, logs: {} });
        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('logSleepBtn').addEventListener('click', () => this.logSleep());
    },

    logSleep() {
        const start = document.getElementById('sleepStart').value;
        const end = document.getElementById('sleepEnd').value;
        const quality = parseInt(document.getElementById('sleepQuality').value);

        if (!start || !end) return;

        const duration = this.calculateDuration(start, end);
        const today = Utils.getToday();

        this.data.logs[today] = {
            start,
            end,
            duration,
            quality,
            timestamp: new Date().toISOString()
        };

        this.save();
        this.render();
        Dashboard.update();

        XPSystem.addXP(10, 'Logged sleep');
        Toast.show(`Logged ${duration.toFixed(1)} hours of sleep`, 'success');
    },

    calculateDuration(start, end) {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        let startMinutes = startH * 60 + startM;
        let endMinutes = endH * 60 + endM;

        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        return (endMinutes - startMinutes) / 60;
    },

    save() {
        Storage.set('sleep', this.data);
    },

    render() {
        this.renderChart();
        this.updateStats();
    },

    renderChart() {
        const container = document.getElementById('sleepChart');
        const days = Utils.getLastNDays(7);
        const maxHours = 12;

        container.innerHTML = days.map(day => {
            const log = this.data.logs[day];
            const duration = log?.duration || 0;
            const height = (duration / maxHours) * 100;

            return `
                <div class="sleep-bar-container">
                    <div class="sleep-bar-wrapper">
                        <div class="sleep-bar" style="height: ${Math.max(4, height)}%;">
                            ${duration > 0 ? `<span class="sleep-bar-value">${duration.toFixed(1)}h</span>` : ''}
                        </div>
                    </div>
                    <span class="sleep-bar-label">${Utils.getDayLabel(day)}</span>
                </div>
            `;
        }).join('');
    },

    updateStats() {
        const days = Utils.getLastNDays(7);
        const durations = days.map(d => this.data.logs[d]?.duration || 0).filter(d => d > 0);

        if (durations.length === 0) {
            document.getElementById('avgSleep').textContent = '--';
            document.getElementById('sleepConsistency').textContent = '--';
            document.getElementById('sleepDebt').textContent = '--';
            return;
        }

        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const consistency = Math.round((durations.length / 7) * 100);
        const debt = Math.max(0, (this.data.goal * 7) - durations.reduce((a, b) => a + b, 0));

        document.getElementById('avgSleep').textContent = `${avg.toFixed(1)}h`;
        document.getElementById('sleepConsistency').textContent = `${consistency}%`;
        document.getElementById('sleepDebt').textContent = `${debt.toFixed(0)}h`;
    }
};

// ══════════════════════════════════════════════════════════════════════════
// INSIGHTS MODULE
// ══════════════════════════════════════════════════════════════════════════

const Insights = {
    init() {
        this.render();
    },

    calculateProductivityScore() {
        const habits = Storage.get('habits', []);
        const tasks = Storage.get('tasks', []);
        const focus = Storage.get('focus', { sessions: {} });
        const sleep = Storage.get('sleep', { logs: {} });
        const water = Storage.get('water', { goal: 2000, logs: {} });

        const days = Utils.getLastNDays(7);
        let totalScore = 0;
        let daysWithData = 0;

        days.forEach(day => {
            let dayScore = 0;

            // Habits (40%)
            const habitsCompleted = habits.filter(h => h.completedDates?.includes(day)).length;
            if (habits.length > 0) {
                dayScore += (habitsCompleted / habits.length) * 40;
            }

            // Tasks (20%)
            const dayTasks = tasks.filter(t => t.due === day);
            const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
            if (dayTasks.length > 0) {
                dayScore += (completedTasks / dayTasks.length) * 20;
            }

            // Focus (20%) - with validation
            const daySessions = focus.sessions && focus.sessions[day] ? focus.sessions[day] : [];
            const focusMinutes = daySessions.reduce((sum, s) => sum + Utils.safeNumber(s?.duration, 0), 0);
            dayScore += Math.min(20, (focusMinutes / 120) * 20);

            // Sleep (10%)
            const sleepHours = sleep.logs[day]?.duration || 0;
            dayScore += Math.min(10, (sleepHours / 8) * 10);

            // Water (10%)
            const waterAmount = (water.logs[day] || []).reduce((sum, l) => sum + l.amount, 0);
            dayScore += Math.min(10, (waterAmount / water.goal) * 10);

            if (dayScore > 0) {
                totalScore += dayScore;
                daysWithData++;
            }
        });

        return daysWithData > 0 ? Math.round(totalScore / daysWithData) : 0;
    },

    generateInsights() {
        const insights = [];
        const habits = Storage.get('habits', []);
        const sleep = Storage.get('sleep', { logs: {} });
        const moods = Storage.get('moods', { logs: {} });
        const focus = Storage.get('focus', { sessions: {} });

        const days = Utils.getLastNDays(7);

        // Sleep-mood correlation
        const goodSleepDays = days.filter(d => (sleep.logs[d]?.duration || 0) >= 7);
        const goodMoodOnGoodSleep = goodSleepDays.filter(d => ['great', 'good'].includes(moods.logs[d]?.mood)).length;
        if (goodSleepDays.length >= 3 && goodMoodOnGoodSleep >= goodSleepDays.length * 0.6) {
            insights.push({
                icon: '😴',
                title: 'Sleep-Mood Connection',
                text: 'You tend to feel better on days with 7+ hours of sleep. Prioritize rest!'
            });
        }

        // Habit consistency
        const consistentHabits = habits.filter(h => {
            const completed = days.filter(d => h.completedDates?.includes(d)).length;
            return completed >= 5;
        });
        if (consistentHabits.length > 0) {
            insights.push({
                icon: '🔥',
                title: 'Strong Habits',
                text: `You're crushing ${consistentHabits.length} habit(s) with 70%+ consistency this week!`
            });
        }

        // Focus patterns - with validation
        const focusByDay = days.map(d => {
            const sessions = focus.sessions && focus.sessions[d] ? focus.sessions[d] : [];
            return {
                day: new Date(d).getDay(),
                minutes: sessions.reduce((sum, s) => sum + Utils.safeNumber(s?.duration, 0), 0)
            };
        });
        const bestDay = focusByDay.reduce((a, b) => a.minutes > b.minutes ? a : b, { minutes: 0 });
        if (bestDay.minutes > 60) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            insights.push({
                icon: '⏱️',
                title: 'Peak Focus Day',
                text: `${dayNames[bestDay.day]}s are your most productive days for focused work.`
            });
        }

        // Default insight
        if (insights.length === 0) {
            insights.push({
                icon: '💡',
                title: 'Keep Going!',
                text: 'Track more data to unlock personalized insights about your patterns.'
            });
        }

        return insights;
    },

    render() {
        // Productivity score
        const score = this.calculateProductivityScore();
        document.getElementById('productivityScore').textContent = score;

        // Habit consistency
        const habits = Storage.get('habits', []);
        const days = Utils.getLastNDays(7);
        const container = document.getElementById('habitConsistency');

        if (habits.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No habits to analyze</p>';
        } else {
            container.innerHTML = habits.slice(0, 5).map(habit => {
                const completed = days.filter(d => habit.completedDates?.includes(d)).length;
                const percent = Math.round((completed / 7) * 100);
                return `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="font-size: 0.85rem;">${Utils.escapeHtml(habit.name)}</span>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">${percent}%</span>
                        </div>
                        <div class="stat-progress">
                            <div class="stat-progress-fill purple" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Insights
        const insights = this.generateInsights();
        document.getElementById('insightsList').innerHTML = insights.map(insight => `
            <div class="insight-item">
                <div class="insight-icon" style="background: var(--bg-tertiary);">${insight.icon}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-text">${insight.text}</div>
                </div>
            </div>
        `).join('');
    }
};

// ══════════════════════════════════════════════════════════════════════════
// BADGES MODULE
// ══════════════════════════════════════════════════════════════════════════

const Badges = {
    badges: [
        { id: 'first_habit', name: 'First Step', desc: 'Create your first habit', icon: '🌱', condition: () => Storage.get('habits', []).length >= 1 },
        { id: 'habit_master', name: 'Habit Master', desc: '5 habits created', icon: '🌳', condition: () => Storage.get('habits', []).length >= 5 },
        { id: 'week_streak', name: 'Week Warrior', desc: '7 day streak', icon: '🔥', condition: () => {
            const habits = Storage.get('habits', []);
            return habits.some(h => {
                let streak = 0;
                let checkDate = new Date();
                while (streak < 7) {
                    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    if (!h.completedDates?.includes(dateStr)) break;
                    streak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                }
                return streak >= 7;
            });
        }},
        { id: 'hydrated', name: 'Hydration Hero', desc: 'Hit water goal', icon: '💧', condition: () => {
            const water = Storage.get('water', { goal: 2000, logs: {} });
            const today = Utils.getToday();
            const total = (water.logs[today] || []).reduce((sum, l) => sum + l.amount, 0);
            return total >= water.goal;
        }},
        { id: 'early_bird', name: 'Early Bird', desc: 'Log 7+ hours sleep', icon: '🌅', condition: () => {
            const sleep = Storage.get('sleep', { logs: {} });
            return Object.values(sleep.logs).some(l => l.duration >= 7);
        }},
        { id: 'focused', name: 'Deep Focus', desc: '2 hour focus session', icon: '🎯', condition: () => {
            const focus = Storage.get('focus', { sessions: {} });
            if (!focus.sessions) return false;
            return Object.values(focus.sessions).flat().some(s =>
                s && Utils.safeNumber(s.duration, 0) >= 120
            );
        }},
        { id: 'planner', name: 'Task Master', desc: 'Complete 10 tasks', icon: '✅', condition: () => {
            const tasks = Storage.get('tasks', []);
            return tasks.filter(t => t.status === 'completed').length >= 10;
        }},
        { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐', condition: () => Storage.get('xp', { level: 1 }).level >= 5 },
        { id: 'mood_tracker', name: 'Self Aware', desc: 'Log 7 moods', icon: '🧠', condition: () => Object.keys(Storage.get('moods', { logs: {} }).logs).length >= 7 },
        { id: 'consistent', name: 'Consistency King', desc: '80%+ productivity score', icon: '👑', condition: () => Insights.calculateProductivityScore() >= 80 }
    ],

    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('badgesGrid');

        container.innerHTML = this.badges.map(badge => {
            const unlocked = badge.condition();
            return `
                <div class="badge-item ${unlocked ? '' : 'locked'}">
                    <div class="badge-icon" style="background: ${unlocked ? 'var(--gradient-primary)' : 'var(--bg-tertiary)'};">
                        ${badge.icon}
                    </div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-desc">${badge.desc}</div>
                </div>
            `;
        }).join('');
    }
};

// ══════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONALITY
// ══════════════════════════════════════════════════════════════════════════

document.getElementById('exportBtn').addEventListener('click', () => {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenith-backup-${Utils.getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('Data exported!', 'success');
});

// ══════════════════════════════════════════════════════════════════════════
// INITIALIZE APPLICATION
// ══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
    XPSystem.init();
    Navigation.init();
});
