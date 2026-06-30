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
    RetroAudio.play('click');

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
        RetroAudio.play('unfavorite');
        showStatus('Please enter an API key.', 'error');
        return;
    }

    chrome.storage.sync.set({
        klipyApiKey: apiKey
    }, function () {
        RetroAudio.play('success');
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

// ===== Retro Gaming Sound Synth Engine (Web Audio API) =====
const RetroAudio = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    play(soundType) {
        try {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            const now = this.ctx.currentTime;
            
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();
            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);
            
            if (soundType === 'click') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                
                gainNode.gain.setValueAtTime(0.03, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (soundType === 'success') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(261.63, now); // C4
                osc.frequency.setValueAtTime(329.63, now + 0.08); // E4
                osc.frequency.setValueAtTime(392.00, now + 0.16); // G4
                osc.frequency.setValueAtTime(523.25, now + 0.24); // C5
                
                gainNode.gain.setValueAtTime(0.04, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (soundType === 'favorite') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(392.00, now); // G4
                osc.frequency.setValueAtTime(587.33, now + 0.06); // D5
                osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
                
                gainNode.gain.setValueAtTime(0.03, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (soundType === 'unfavorite') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
                
                gainNode.gain.setValueAtTime(0.02, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                osc.start(now);
                osc.stop(now + 0.12);
            }
        } catch (error) {
            console.warn('RetroAudio failed to play:', error);
        }
    }
};