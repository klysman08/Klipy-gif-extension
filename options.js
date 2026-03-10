// Load saved options when the page loads
document.addEventListener('DOMContentLoaded', restoreOptions);

// Save options when the save button is clicked
document.getElementById('saveBtn').addEventListener('click', saveOptions);

// Theme toggle on options page
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    document.getElementById('themeToggle').innerText = isDark ? '☀️' : '🌓';

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
            document.getElementById('themeToggle').innerText = '☀️';
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