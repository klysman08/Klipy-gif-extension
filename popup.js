// ===== State =====
let currentPage = 1;
let currentQuery = '';
let nextPos = 0;
const cacheDuration = 1000 * 60 * 60 * 24; // 1 day
let isLoading = false;
let currentTab = 'search'; // 'search' | 'trending' | 'favorites'
let cachedGifData = []; // Store GIF objects for state restoration

// ===== DOM Elements =====
const el = {
    searchButton: document.getElementById('searchButton'),
    searchQuery: document.getElementById('searchQuery'),
    modeToggle: document.getElementById('modeToggle'),
    favoritesButton: document.getElementById('favoritesButton'),
    gifResults: document.getElementById('gifResults'),
    favoritesResults: document.getElementById('favoritesResults'),
    favoritesSection: document.getElementById('favoritesSection'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    emptyState: document.getElementById('emptyState'),
    gifModal: document.getElementById('gifModal'),
    modalImg: document.getElementById('modalImg'),
    closeModal: document.getElementById('closeModal'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    settingsButton: document.getElementById('settingsButton'),
    apiKeyWarning: document.getElementById('apiKeyWarning'),
    openSettingsLink: document.getElementById('openSettingsLink'),
    toastContainer: document.getElementById('toastContainer'),
    clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),
    clearFavoritesBar: document.getElementById('clearFavoritesBar'),
    favCount: document.getElementById('favCount'),
    trendingSection: document.getElementById('trendingSection'),
    trendingTags: document.getElementById('trendingTags'),
    trendingResults: document.getElementById('trendingResults'),
    // Tab buttons
    tabSearch: document.getElementById('tabSearch'),
    tabTrending: document.getElementById('tabTrending'),
    tabFavorites: document.getElementById('tabFavorites'),
};

// ===== Debounce Utility =====
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Create a single debounced search function (fixes the bug of creating new ones on each Enter)
const debouncedSearch = debounce(initiateSearch, 300);

// ===== Event Listeners =====
el.searchButton.addEventListener('click', debouncedSearch);
el.searchQuery.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') debouncedSearch();
});

el.modeToggle.addEventListener('click', toggleMode);
el.favoritesButton.addEventListener('click', () => switchTab('favorites'));
el.closeModal.addEventListener('click', closeModal);
el.copyLinkBtn.addEventListener('click', copyGifLink);
el.downloadBtn.addEventListener('click', downloadGif);
el.settingsButton.addEventListener('click', () => chrome.runtime.openOptionsPage());
el.openSettingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});

el.clearFavoritesBtn.addEventListener('click', clearAllFavorites);

// Tab switching
el.tabSearch.addEventListener('click', () => switchTab('search'));
el.tabTrending.addEventListener('click', () => switchTab('trending'));
el.tabFavorites.addEventListener('click', () => switchTab('favorites'));

// Infinite scroll
window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100 && !isLoading && currentQuery && currentTab === 'search') {
        currentPage++;
        searchGIFs(currentQuery, currentPage);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// Close modal clicking outside
el.gifModal.addEventListener('click', (e) => {
    if (e.target === el.gifModal) closeModal();
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateFavBadge();
});

// ===== Tab Management =====
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

    // Update favorites button highlight
    el.favoritesButton.classList.toggle('active', tab === 'favorites');

    // Hide all sections
    el.gifResults.classList.add('hidden');
    el.favoritesSection.classList.add('hidden');
    el.trendingSection.classList.add('hidden');
    el.emptyState.classList.add('hidden');
    el.loadingIndicator.classList.add('hidden');

    switch (tab) {
        case 'search':
            el.gifResults.classList.remove('hidden');
            if (el.gifResults.children.length === 0 && !currentQuery) {
                showEmptyState('🎞️', 'Search for GIFs to get started!');
            }
            break;
        case 'trending':
            el.trendingSection.classList.remove('hidden');
            loadTrending();
            break;
        case 'favorites':
            el.favoritesSection.classList.remove('hidden');
            displayFavorites();
            break;
    }

    saveState();
}

// ===== Search Functions =====
function initiateSearch() {
    currentQuery = el.searchQuery.value.trim();
    currentPage = 1;
    nextPos = 0;
    cachedGifData = [];

    if (currentQuery) {
        switchTab('search');
        searchGIFs(currentQuery, currentPage, true);
    } else {
        el.gifResults.innerHTML = '';
        showEmptyState('🔍', 'Type something to search for GIFs!');
    }
}

async function searchGIFs(query, page, isNewSearch = false) {
    if (isLoading) return;

    isLoading = true;
    el.loadingIndicator.classList.remove('hidden');
    el.emptyState.classList.add('hidden');

    if (isNewSearch) {
        el.gifResults.innerHTML = '';
        showSkeletons(el.gifResults, 9);
    }

    const cacheKey = `search_${query}_${page}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
        if (isNewSearch) el.gifResults.innerHTML = '';
        displayGIFs(cachedData, isNewSearch);
        isLoading = false;
        el.loadingIndicator.classList.add('hidden');
    } else {
        try {
            const apiKey = await getApiKey();
            if (!apiKey) return;

            const url = `https://api.klipy.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=20&pos=${nextPos}`;
            const response = await fetch(url);
            const data = await response.json();

            if (isNewSearch) el.gifResults.innerHTML = '';
            cacheData(cacheKey, data);
            displayGIFs(data, isNewSearch);
        } catch (error) {
            console.error('Error fetching GIFs:', error);
            showToast('Failed to fetch GIFs. Please try again.', 'error');
        } finally {
            isLoading = false;
            el.loadingIndicator.classList.add('hidden');
        }
    }
}

async function getApiKey() {
    const items = await chrome.storage.sync.get({ klipyApiKey: '' });
    const apiKey = items.klipyApiKey || config.apiKey;

    if (!apiKey) {
        el.apiKeyWarning.classList.remove('hidden');
        isLoading = false;
        el.loadingIndicator.classList.add('hidden');
        return null;
    }

    el.apiKeyWarning.classList.add('hidden');
    return apiKey;
}

// ===== Trending =====
async function loadTrending() {
    if (el.trendingResults.children.length > 0) return; // Already loaded

    try {
        const apiKey = await getApiKey();
        if (!apiKey) return;

        isLoading = true;
        el.loadingIndicator.classList.remove('hidden');
        showSkeletons(el.trendingResults, 9);

        // Load trending search terms
        const termsUrl = `https://api.klipy.com/v2/trending_terms?key=${apiKey}&limit=8`;
        try {
            const termsResponse = await fetch(termsUrl);
            const termsData = await termsResponse.json();
            if (termsData.results && termsData.results.length > 0) {
                el.trendingTags.innerHTML = '';
                termsData.results.forEach(term => {
                    const tag = document.createElement('button');
                    tag.className = 'trending-tag';
                    tag.textContent = term;
                    tag.addEventListener('click', () => {
                        el.searchQuery.value = term;
                        switchTab('search');
                        initiateSearch();
                    });
                    el.trendingTags.appendChild(tag);
                });
            }
        } catch (e) {
            console.warn('Could not load trending terms:', e);
        }

        // Load trending GIFs
        const gifsUrl = `https://api.klipy.com/v2/featured?key=${apiKey}&limit=20`;
        const response = await fetch(gifsUrl);
        const data = await response.json();

        el.trendingResults.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(gif => {
                const gifEl = createGifElement(gif);
                el.trendingResults.appendChild(gifEl);
            });
        }
    } catch (error) {
        console.error('Error loading trending:', error);
        showToast('Could not load trending GIFs.', 'error');
    } finally {
        isLoading = false;
        el.loadingIndicator.classList.add('hidden');
    }
}

// ===== GIF Display =====
function displayGIFs(data, isNewSearch) {
    if (!data.results || data.results.length === 0) {
        if (isNewSearch) showEmptyState('😢', 'No GIFs found. Try another search!');
        return;
    }

    data.results.forEach(gif => {
        cachedGifData.push(gif);
        const gifContainer = createGifElement(gif);
        el.gifResults.appendChild(gifContainer);
    });

    nextPos = data.next;
    saveState();
}

function createGifElement(gif) {
    const container = document.createElement('div');
    container.className = 'gif-container';
    container.dataset.gifId = gif.id;

    const img = document.createElement('img');
    img.src = gif.media_formats.tinygif.url;
    img.alt = gif.title || 'GIF';
    img.loading = 'lazy';

    img.addEventListener('click', () => {
        const bigUrl = (gif.media_formats.gif && gif.media_formats.gif.url) ||
            (gif.media_formats.mp4 && gif.media_formats.mp4.url) ||
            gif.media_formats.tinygif.url;
        openModal(bigUrl);
    });

    const favBtn = document.createElement('button');
    const isFav = isFavorite(gif);
    favBtn.className = `favorite-button ${isFav ? 'active' : ''}`;
    favBtn.innerText = isFav ? '❤️' : '♡';
    favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';

    favBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleFavorite(gif);
        const newIsFav = isFavorite(gif);
        favBtn.innerText = newIsFav ? '❤️' : '♡';
        favBtn.classList.toggle('active', newIsFav);
        favBtn.title = newIsFav ? 'Remove from favorites' : 'Add to favorites';
        updateFavBadge();

        showToast(newIsFav ? 'Added to favorites ❤️' : 'Removed from favorites', 'success');

        // If in favorites view, animate removal
        if (currentTab === 'favorites' && !newIsFav) {
            container.classList.add('removing');
            setTimeout(() => displayFavorites(), 300);
        }
    });

    container.appendChild(img);
    container.appendChild(favBtn);
    return container;
}

// ===== Skeleton Loader =====
function showSkeletons(container, count) {
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'gif-container skeleton';
        container.appendChild(skeleton);
    }
}

// ===== Empty State =====
function showEmptyState(icon, text) {
    el.emptyState.innerHTML = `
        <span class="empty-icon">${icon}</span>
        <span class="empty-text">${text}</span>
    `;
    el.emptyState.classList.remove('hidden');
}

// ===== Favorites =====
function isFavorite(gif) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === gif.id);
}

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favorites')) || [];
    } catch {
        return [];
    }
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(gif) {
    let favorites = getFavorites();
    const index = favorites.findIndex(fav => fav.id === gif.id);

    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(gif);
    }

    saveFavorites(favorites);
}

function displayFavorites() {
    el.favoritesResults.innerHTML = '';
    const favorites = getFavorites();

    if (favorites.length === 0) {
        el.clearFavoritesBar.classList.add('hidden');
        showEmptyState('💔', 'No favorites yet. Click the heart icon on a GIF to save it!');
        return;
    }

    el.emptyState.classList.add('hidden');
    el.clearFavoritesBar.classList.remove('hidden');
    el.favCount.textContent = `${favorites.length} favorite${favorites.length !== 1 ? 's' : ''}`;

    favorites.forEach(gif => {
        const gifContainer = createGifElement(gif);
        el.favoritesResults.appendChild(gifContainer);
    });
}

function clearAllFavorites() {
    const favorites = getFavorites();
    if (favorites.length === 0) return;

    if (confirm(`Remove all ${favorites.length} favorites?`)) {
        saveFavorites([]);
        updateFavBadge();
        displayFavorites();
        showToast('All favorites cleared', 'success');
    }
}

function updateFavBadge() {
    const count = getFavorites().length;
    // Remove existing badge
    const existingBadge = el.favoritesButton.querySelector('.fav-badge');
    if (existingBadge) existingBadge.remove();

    if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'fav-badge';
        badge.textContent = count > 99 ? '99+' : count;
        el.favoritesButton.appendChild(badge);
    }
}

// ===== Modal =====
function openModal(url) {
    el.modalImg.src = url;
    el.gifModal.classList.remove('hidden');
    el.copyLinkBtn.innerHTML = '📋 Copy Link';
    el.copyLinkBtn.dataset.url = url;
    el.downloadBtn.dataset.url = url;
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    el.gifModal.classList.add('hidden');
    el.modalImg.src = '';
    document.body.style.overflow = '';
}

async function copyGifLink() {
    const url = el.copyLinkBtn.dataset.url;
    if (!url) return;

    try {
        await navigator.clipboard.writeText(url);
        el.copyLinkBtn.innerHTML = '✅ Copied!';
        el.copyLinkBtn.classList.add('success');
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => {
            if (!el.gifModal.classList.contains('hidden')) {
                el.copyLinkBtn.innerHTML = '📋 Copy Link';
                el.copyLinkBtn.classList.remove('success');
            }
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        showToast('Failed to copy link', 'error');
    }
}

async function downloadGif() {
    const url = el.downloadBtn.dataset.url;
    if (!url) return;

    try {
        el.downloadBtn.innerHTML = '⏳ Downloading...';
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `gif_${Date.now()}.gif`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);

        el.downloadBtn.innerHTML = '✅ Downloaded!';
        showToast('GIF downloaded!', 'success');
        setTimeout(() => {
            el.downloadBtn.innerHTML = '💾 Download';
        }, 2000);
    } catch (err) {
        console.error('Download failed:', err);
        el.downloadBtn.innerHTML = '💾 Download';
        showToast('Download failed', 'error');
    }
}

// ===== Toast Notifications =====
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    el.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== Cache (preserves favorites on quota exceeded) =====
function cacheData(key, data) {
    const cacheEntry = { data, timestamp: Date.now() };
    try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (e) {
        console.warn('Local storage full, clearing old cache (preserving favorites)');
        const favorites = getFavorites();
        const state = localStorage.getItem('gifSearchState');
        localStorage.clear();
        saveFavorites(favorites);
        if (state) localStorage.setItem('gifSearchState', state);
        try {
            localStorage.setItem(key, JSON.stringify(cacheEntry));
        } catch (e2) {
            console.warn('Still cannot cache after clearing');
        }
    }
}

function getCachedData(key) {
    try {
        const cacheEntry = JSON.parse(localStorage.getItem(key));
        if (cacheEntry && (Date.now() - cacheEntry.timestamp < cacheDuration)) {
            return cacheEntry.data;
        }
    } catch (e) {
        return null;
    }
    return null;
}

// ===== State Management (data-based, not HTML-based) =====
function saveState() {
    const state = {
        currentQuery,
        currentPage,
        nextPos,
        currentTab,
        gifData: cachedGifData.slice(0, 60), // Cap to avoid quota issues
        mode: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    };
    try {
        localStorage.setItem('gifSearchState', JSON.stringify(state));
    } catch (e) {
        // If state is too large, save without GIF data
        state.gifData = [];
        try {
            localStorage.setItem('gifSearchState', JSON.stringify(state));
        } catch (e2) {
            console.warn('Could not save state');
        }
    }
}

function loadState() {
    try {
        const state = JSON.parse(localStorage.getItem('gifSearchState'));
        if (state) {
            currentQuery = state.currentQuery || '';
            currentPage = state.currentPage || 1;
            nextPos = state.nextPos || 0;

            // Restore theme
            const isDark = state.mode === 'dark';
            document.body.classList.toggle('dark-mode', isDark);
            document.body.classList.toggle('light-mode', !isDark);
            el.modeToggle.innerText = isDark ? '☀️' : '🌓';

            el.searchQuery.value = currentQuery;

            // Restore GIF data (re-render from objects, not HTML)
            if (state.gifData && state.gifData.length > 0) {
                cachedGifData = state.gifData;
                state.gifData.forEach(gif => {
                    const gifEl = createGifElement(gif);
                    el.gifResults.appendChild(gifEl);
                });
            }

            // Restore tab
            if (state.currentTab) {
                switchTab(state.currentTab);
            } else if (el.gifResults.children.length === 0 && !currentQuery) {
                showEmptyState('🎞️', 'Search for GIFs to get started!');
            }
        } else {
            // First time — show empty state
            showEmptyState('🎞️', 'Search for GIFs to get started!');
        }
    } catch (e) {
        console.warn('Could not load state');
        showEmptyState('🎞️', 'Search for GIFs to get started!');
    }
}

function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    el.modeToggle.innerText = isDark ? '☀️' : '🌓';
    saveState();
    showToast(isDark ? 'Dark mode enabled 🌙' : 'Light mode enabled ☀️', 'success');
}
