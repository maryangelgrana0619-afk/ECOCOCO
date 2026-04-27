// Persistent in-memory storage that survives navigation
if (!window.AppData) {
    window.AppData = {
        users: {},
        currentUser: null
    };
}

// Fallback storage for MIT App Inventor - uses window.AppData
const FallbackStorage = {
    getItem: function(key) {
        if (key === 'ecoDashUsers') {
            return window.AppData.users && Object.keys(window.AppData.users).length > 0 
                ? JSON.stringify(window.AppData.users)
                : null;
        }
        if (key === 'currentUser') {
            return window.AppData.currentUser;
        }
        return null;
    },
    setItem: function(key, value) {
        if (key === 'ecoDashUsers') {
            window.AppData.users = JSON.parse(value);
        } else if (key === 'currentUser') {
            window.AppData.currentUser = value;
        }
    },
    removeItem: function(key) {
        if (key === 'ecoDashUsers') {
            window.AppData.users = {};
        } else if (key === 'currentUser') {
            window.AppData.currentUser = null;
        }
    }
};

// Safe storage abstraction that works in MIT App Inventor
const SafeStorage = {
    storage: null,

    init: function() {
        // Always prefer window.AppData for MIT App Inventor compatibility
        this.storage = FallbackStorage;
        
        // Try localStorage as secondary option
        try {
            const test = '__storage_test_' + Date.now();
            localStorage.setItem(test, 'test');
            const retrieved = localStorage.getItem(test);
            localStorage.removeItem(test);
            
            if (retrieved === 'test') {
                // localStorage works - use it
                this.storage = localStorage;
            }
        } catch (e) {
            // localStorage failed, stick with FallbackStorage
        }
    },

    getItem: function(key) {
        if (!this.storage) this.init();
        const value = this.storage.getItem(key);
        return value;
    },

    setItem: function(key, value) {
        if (!this.storage) this.init();
        this.storage.setItem(key, value);
        // Also always sync to window.AppData as backup
        if (key === 'ecoDashUsers') {
            window.AppData.users = JSON.parse(value);
        } else if (key === 'currentUser') {
            window.AppData.currentUser = value;
        }
    },

    removeItem: function(key) {
        if (!this.storage) this.init();
        this.storage.removeItem(key);
    }
};

// Initialize storage immediately
SafeStorage.init();

function showPopup(title, message) {
  const overlay = document.getElementById('popupOverlay');
  if (!overlay) return;

  // Reset to default structure in case game-over replaced it
  const card = document.getElementById('overlayCard') || overlay.querySelector('.overlay-card');
  if (!card) return;

  // Check if it was replaced by game-over card
  if (card.querySelector('.game-over-card')) {
    // Restore structure
    card.innerHTML = `
      <h3></h3>
      <p></p>
      <button class="overlay-close" onclick="closePopup(event)">Close</button>
    `;
  }

  card.querySelector('h3').innerText = title;
  card.querySelector('p').innerHTML = message;
  overlay.classList.add('active');
}

function closePopup(event) {
  if (
    event.target.id === 'popupOverlay' ||
    event.target.classList.contains('overlay-close')
  ) {
    document.getElementById('popupOverlay').classList.remove('active');
  }
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  btn.textContent = isPassword ? '🙈' : '👁️';
}

function handleSignIn() {
  const email = document.getElementById('signInEmail').value.trim();
  const password = document.getElementById('signInPassword').value;

  if (!email || !password) {
    showPopup('Missing Information', 'Please enter both email and password.');
    return;
  }

  try {
    UserManager.signIn(email, password);
    window.location.href = 'home.html';
  } catch (error) {
    showPopup('Sign In Failed', error.message);
  }
}

function handleSignUp() {
  const fullName = document.getElementById('signUpFullName').value.trim();
  const email = document.getElementById('signUpEmail').value.trim();
  const username = document.getElementById('signUpUsername').value.trim();
  const password = document.getElementById('signUpPassword').value;
  const confirmPassword = document.getElementById('signUpConfirmPassword').value;

  if (!fullName || !email || !username || !password || !confirmPassword) {
    showPopup('Missing Information', 'Please fill in all fields.');
    return;
  }

  if (password.length < 6) {
    showPopup('Weak Password', 'Password must be at least 6 characters long.');
    return;
  }

  if (password !== confirmPassword) {
    showPopup('Password Mismatch', 'Passwords do not match. Please try again.');
    return;
  }

  try {
    UserManager.signUp(email, password, username, fullName);
    // Pass the user email as URL parameter to ensure it's available on next page
    window.location.href = 'home.html?user=' + encodeURIComponent(email);
  } catch (error) {
    showPopup('Sign Up Failed', error.message);
  }
}
