// Persistent in-memory storage that survives page navigation
window.AppStorage = window.AppStorage || {};

// Fallback storage for MIT App Inventor compatibility
const FallbackStorage = {
    getItem: function(key) {
        return window.AppStorage[key] || null;
    },
    setItem: function(key, value) {
        window.AppStorage[key] = value;
    },
    removeItem: function(key) {
        delete window.AppStorage[key];
    }
};

// Safe storage abstraction that works in MIT App Inventor
const SafeStorage = {
    storage: null,

    init: function() {
        // Try localStorage first
        try {
            const test = '__storage_test_' + Date.now();
            localStorage.setItem(test, 'test');
            const retrieved = localStorage.getItem(test);
            localStorage.removeItem(test);
            
            // Verify it actually worked
            if (retrieved === 'test') {
                this.storage = localStorage;
                return;
            }
        } catch (e) {
            // localStorage failed
        }

        // Try sessionStorage as backup
        try {
            const test = '__storage_test_' + Date.now();
            sessionStorage.setItem(test, 'test');
            const retrieved = sessionStorage.getItem(test);
            sessionStorage.removeItem(test);
            
            if (retrieved === 'test') {
                this.storage = sessionStorage;
                return;
            }
        } catch (e) {
            // sessionStorage failed
        }

        // Fall back to in-memory storage
        this.storage = FallbackStorage;
    },

    getItem: function(key) {
        if (!this.storage) this.init();
        return this.storage.getItem(key);
    },

    setItem: function(key, value) {
        if (!this.storage) this.init();
        this.storage.setItem(key, value);
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
    window.location.href = 'home.html';
  } catch (error) {
    showPopup('Sign Up Failed', error.message);
  }
}
