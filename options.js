// Load saved options when the page loads
document.addEventListener('DOMContentLoaded', restoreOptions);

// Save options when the save button is clicked
document.getElementById('saveBtn').addEventListener('click', saveOptions);

// Apply dark mode if it was set in the popup
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
    const statusEl = document.getElementById('status');

    if (!apiKey) {
        showStatus('Please enter an API key.', 'error');
        return;
    }

    // Save to chrome.storage.sync
    chrome.storage.sync.set({
        klipyApiKey: apiKey
    }, function() {
        showStatus('Settings saved successfully!', 'success');
        
        // Clear the status message after 3 seconds
        setTimeout(function() {
            statusEl.className = '';
            statusEl.style.display = 'none';
        }, 3000);
    });
}

function restoreOptions() {
    applyTheme();
    
    // Load from chrome.storage.sync
    chrome.storage.sync.get({
        klipyApiKey: '' // Default value
    }, function(items) {
        document.getElementById('apiKey').value = items.klipyApiKey;
    });
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status-${type}`;
}