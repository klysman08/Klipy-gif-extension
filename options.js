// ===== Chrome Extension API Mock for local browser testing =====
if (typeof chrome === 'undefined') {
    window.chrome = {
        storage: {
            sync: {
                get: function(defaults, callback) {
                    const keys = Object.keys(defaults);
                    const result = {};
                    keys.forEach(key => {
                        result[key] = localStorage.getItem(key) || defaults[key];
                    });
                    if (callback) callback(result);
                    return Promise.resolve(result);
                },
                set: function(values, callback) {
                    Object.keys(values).forEach(key => {
                        localStorage.setItem(key, values[key]);
                    });
                    if (callback) callback();
                    return Promise.resolve();
                }
            }
        },
        runtime: {
            openOptionsPage: function() {
                window.open('options.html', '_blank');
            }
        }
    };
}

// Load saved options when the page loads
document.addEventListener('DOMContentLoaded', restoreOptions);

// Save options when the save button is clicked
document.getElementById('saveBtn').addEventListener('click', saveOptions);

// Theme toggle on options page
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);

    // Sync theme preference with popup state
    try {
        const state = JSON.parse(localStorage.getItem('gifSearchState')) || {};
        state.mode = isDark ? 'dark' : 'light';
        localStorage.setItem('gifSearchState', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not sync theme state');
    }
}

function applyTheme() {
    try {
        const state = JSON.parse(localStorage.getItem('gifSearchState'));
        if (state && state.mode === 'dark') {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
        }
    } catch (e) {
        console.warn('Could not load theme state');
    }
}

function saveOptions() {
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!apiKey) {
        showStatus('Please enter an API key.', 'error');
        return;
    }

    chrome.storage.sync.set({
        klipyApiKey: apiKey
    }, function () {
        showStatus('✅ Settings saved successfully!', 'success');

        setTimeout(function () {
            const statusEl = document.getElementById('status');
            statusEl.className = '';
            statusEl.style.display = 'none';
        }, 3000);
    });
}

function restoreOptions() {
    applyTheme();

    chrome.storage.sync.get({
        klipyApiKey: ''
    }, function (items) {
        document.getElementById('apiKey').value = items.klipyApiKey;
    });
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
}