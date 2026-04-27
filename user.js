// Fallback storage for MIT App Inventor compatibility
const FallbackStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    }
};

// Safe storage abstraction that works in MIT App Inventor
const SafeStorage = {
    storage: (function() {
        try {
            // Test if localStorage is available
            const test = '__storage_test__';
            if (typeof localStorage !== 'undefined' && localStorage !== null) {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return localStorage;
            }
        } catch (e) {
            // localStorage not available, use fallback
        }
        return FallbackStorage;
    })(),

    getItem: function(key) {
        return this.storage.getItem(key);
    },

    setItem: function(key, value) {
        this.storage.setItem(key, value);
    },

    removeItem: function(key) {
        this.storage.removeItem(key);
    }
};

const UserManager = {
    defaultUserData: {
        fullName: '',
        username: '',
        email: '',
        password: '',
        profilePicture: null, // base64 data URL or null
        points: 0,
        level: 1,
        gamesPlayed: 0,
        totalItemsSorted: 0,
        recyclableItemsSorted: 0,
        bioItemsSorted: 0,
        nonRecyclableItemsSorted: 0,
        correctSorts: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPlayDate: null,
        achievements: {
            sortingStar: false,
            recycleMaster: false,
            compostChamp: false
        },
        createdDate: new Date().toISOString()
    },

    hashPassword: function(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    },

    getUsers: function() {
        const users = SafeStorage.getItem('ecoDashUsers');
        return users ? JSON.parse(users) : {};
    },

    saveUsers: function(users) {
        SafeStorage.setItem('ecoDashUsers', JSON.stringify(users));
    },

    getCurrentUser: function() {
        return SafeStorage.getItem('currentUser');
    },

    setCurrentUser: function(email) {
        SafeStorage.setItem('currentUser', email);
    },

    clearCurrentUser: function() {
        SafeStorage.removeItem('currentUser');
    },

    getUserData: function(email) {
        const users = this.getUsers();
        return users[email] || null;
    },

    saveUserData: function(email, userData) {
        const users = this.getUsers();
        users[email] = userData;
        this.saveUsers(users);
    },

    signUp: function(email, password, username, fullName) {
        const users = this.getUsers();
        if (users[email]) {
            throw new Error('An account already exists with this email address.');
        }
        // Check username uniqueness
        const taken = Object.values(users).some(u => u.username && u.username.toLowerCase() === (username || '').toLowerCase());
        if (taken) throw new Error('That username is already taken. Please choose another.');

        const userData = JSON.parse(JSON.stringify(this.defaultUserData));
        userData.email = email;
        userData.password = this.hashPassword(password);
        userData.username = username || email.split('@')[0];
        userData.fullName = fullName || username;
        userData.createdDate = new Date().toISOString();

        users[email] = userData;
        this.saveUsers(users);
        this.setCurrentUser(email);
        return userData;
    },

    signIn: function(email, password) {
        const users = this.getUsers();
        const userData = users[email];
        if (!userData) throw new Error('No account found with that email. Please sign up first.');
        if (userData.password !== this.hashPassword(password)) throw new Error('Incorrect password. Please try again.');
        this.setCurrentUser(email);
        return userData;
    },

    signOut: function() {
        this.clearCurrentUser();
    },

    getUser: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;
        return this.getUserData(currentUser);
    },

    saveUser: function(userData) {
        const currentUser = this.getCurrentUser();
        if (currentUser) this.saveUserData(currentUser, userData);
    },

    updateProfile: function(updates) {
        const userData = this.getUser();
        if (!userData) return null;
        const allowedFields = ['username', 'fullName', 'profilePicture'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) userData[field] = updates[field];
        });
        this.saveUser(userData);
        return userData;
    },

    isLoggedIn: function() {
        return this.getCurrentUser() !== null;
    },

    init: function() {
        return this.getUser();
    },

    addScore: function(score, correctCount, totalItems, itemTypes) {
        const userData = this.getUser();
        if (!userData) return null;
        userData.points += score;
        userData.gamesPlayed += 1;
        userData.totalItemsSorted += totalItems;
        userData.correctSorts += correctCount;
        if (itemTypes) {
            userData.bioItemsSorted += itemTypes.bio || 0;
            userData.recyclableItemsSorted += itemTypes.recycle || 0;
            userData.nonRecyclableItemsSorted += itemTypes.non || 0;
        }
        userData.level = Math.floor(userData.points / 250) + 1;
        this.updateStreak(userData);
        this.checkAchievements(userData);
        this.saveUser(userData);
        return userData;
    },

    updateStreak: function(userData) {
        const today = new Date().toDateString();
        const lastPlay = userData.lastPlayDate ? new Date(userData.lastPlayDate).toDateString() : null;
        if (lastPlay === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (!lastPlay) {
            userData.currentStreak = 1;
        } else if (lastPlay === yesterday) {
            userData.currentStreak += 1;
        } else {
            userData.currentStreak = 1;
        }
        if (userData.currentStreak > userData.longestStreak) userData.longestStreak = userData.currentStreak;
        userData.lastPlayDate = new Date().toISOString();
    },

    checkAchievements: function(userData) {
        if (userData.correctSorts >= 100 && !userData.achievements.sortingStar) userData.achievements.sortingStar = true;
        if (userData.recyclableItemsSorted >= 50 && !userData.achievements.recycleMaster) userData.achievements.recycleMaster = true;
        if (userData.bioItemsSorted >= 30 && !userData.achievements.compostChamp) userData.achievements.compostChamp = true;
    },

    getLevelProgress: function() {
        const userData = this.getUser();
        if (!userData) return { level: 1, currentPoints: 0, pointsInLevel: 0, pointsForLevel: 250, progressPercent: 0, pointsToNextLevel: 250 };
        const currentLevelPoints = (userData.level - 1) * 250;
        const nextLevelPoints = userData.level * 250;
        const progressInLevel = userData.points - currentLevelPoints;
        const pointsForLevel = nextLevelPoints - currentLevelPoints;
        const progressPercent = Math.round((progressInLevel / pointsForLevel) * 100);
        return {
            level: userData.level,
            currentPoints: userData.points,
            pointsInLevel: progressInLevel,
            pointsForLevel,
            progressPercent: Math.min(progressPercent, 100),
            pointsToNextLevel: nextLevelPoints - userData.points
        };
    },

    getAchievements: function() {
        const userData = this.getUser();
        if (!userData) return {
            sortingStar: { unlocked: false, progress: 0, target: 100 },
            recycleMaster: { unlocked: false, progress: 0, target: 50 },
            compostChamp: { unlocked: false, progress: 0, target: 30 }
        };
        // Handle old accounts that don't have compostChamp yet
        if (!userData.achievements.compostChamp) userData.achievements.compostChamp = false;
        return {
            sortingStar: { unlocked: userData.achievements.sortingStar, progress: userData.correctSorts, target: 100 },
            recycleMaster: { unlocked: userData.achievements.recycleMaster, progress: userData.recyclableItemsSorted, target: 50 },
            compostChamp: { unlocked: userData.achievements.compostChamp, progress: userData.bioItemsSorted || 0, target: 30 }
        };
    },

    getStreakData: function() {
        const userData = this.getUser();
        if (!userData) return { currentStreak: 0, longestStreak: 0 };
        return { currentStreak: userData.currentStreak, longestStreak: userData.longestStreak };
    },

    getProfileSummary: function() {
        const userData = this.getUser();
        if (!userData) return {
            fullName: '', username: '', email: '', level: 1, points: 0,
            currentStreak: 0, longestStreak: 0, gamesPlayed: 0, totalItemsSorted: 0,
            accuracy: 0, achievements: { sortingStar: { unlocked: false, progress: 0 }, recycleMaster: { unlocked: false, progress: 0 }, compostChamp: { unlocked: false, progress: 0 } },
            progressToNextLevel: 250
        };
        const levelProgress = this.getLevelProgress();
        return {
            fullName: userData.fullName,
            username: userData.username,
            email: userData.email,
            level: levelProgress.level,
            points: userData.points,
            currentStreak: userData.currentStreak,
            longestStreak: userData.longestStreak,
            gamesPlayed: userData.gamesPlayed,
            totalItemsSorted: userData.totalItemsSorted,
            accuracy: userData.totalItemsSorted > 0 ? Math.round((userData.correctSorts / userData.totalItemsSorted) * 100) : 0,
            achievements: this.getAchievements(),
            progressToNextLevel: levelProgress.pointsToNextLevel
        };
    }
};

document.addEventListener('DOMContentLoaded', function() {
    UserManager.getUser();
});
