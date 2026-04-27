const SettingsManager = {
    storageKey: 'ecoDashSettings',
    defaultSettings: {
        textSize: 16,
        highContrast: false,
        notifications: true,
        sound: true
    },

    getSettings: function() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                return Object.assign({}, this.defaultSettings, JSON.parse(saved));
            } catch (e) {
                return Object.assign({}, this.defaultSettings);
            }
        }
        return Object.assign({}, this.defaultSettings);
    },

    saveSettings: function(settings) {
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    },

    init: function() {
        const settings = this.getSettings();
        this.applyTextSize(settings.textSize, false);
        this.applyContrast(settings.highContrast, false);

        const slider = document.getElementById('textSizeSlider');
        if (slider) slider.value = settings.textSize;
        const label = document.getElementById('textSizeLabel');
        if (label) label.textContent = settings.textSize + 'px';
        const contrastToggle = document.getElementById('contrastToggle');
        if (contrastToggle) contrastToggle.checked = settings.highContrast;
        const notifToggle = document.getElementById('notifToggle');
        if (notifToggle) notifToggle.checked = settings.notifications;
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) soundToggle.checked = settings.sound;
    },

    applyTextSize: function(size, save = true) {
        document.documentElement.style.fontSize = `${size}px`;
        if (save) {
            const settings = this.getSettings();
            settings.textSize = Number(size);
            this.saveSettings(settings);
        }
    },

    applyContrast: function(enabled, save = true) {
        document.body.classList.toggle('high-contrast', enabled);
        if (save) {
            const settings = this.getSettings();
            settings.highContrast = Boolean(enabled);
            this.saveSettings(settings);
        }
    },

    toggleNotifications: function(enabled) {
        const settings = this.getSettings();
        settings.notifications = Boolean(enabled);
        this.saveSettings(settings);
    },

    toggleSound: function(enabled) {
        const settings = this.getSettings();
        settings.sound = Boolean(enabled);
        this.saveSettings(settings);
    },

    isSoundEnabled: function() {
        return this.getSettings().sound;
    },

    isNotificationsEnabled: function() {
        return this.getSettings().notifications;
    }
};

window.addEventListener('DOMContentLoaded', function() {
    SettingsManager.init();
});
