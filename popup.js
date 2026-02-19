let currentPage = 1;
let currentQuery = '';
let nextPos = 0;
const cacheDuration = 1000 * 60 * 60 * 24; // 1 day
let isLoading = false;

// DOM Elements
const elements = {
    searchButton: document.getElementById('searchButton'),
    searchQuery: document.getElementById('searchQuery'),
    modeToggle: document.getElementById('modeToggle'),
    favoritesButton: document.getElementById('favoritesButton'),
    gifResults: document.getElementById('gifResults'),
    favoritesResults: document.getElementById('favoritesResults'),
    loadingIndicator: document.getElementById('loadingIndicator'),
    emptyState: document.getElementById('emptyState'),
    gifModal: document.getElementById('gifModal'),
    modalImg: document.getElementById('modalImg'),
    closeModal: document.getElementById('closeModal'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    settingsButton: document.getElementById('settingsButton'),
    apiKeyWarning: document.getElementById('apiKeyWarning'),
    openSettingsLink: document.getElementById('openSettingsLink')
};

// Event Listeners
elements.searchButton.addEventListener('click', debounce(initiateSearch, 300));
elements.searchQuery.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') debounce(initiateSearch, 300)();
});
elements.modeToggle.addEventListener('click', toggleMode);
elements.favoritesButton.addEventListener('click', toggleFavorites);
elements.closeModal.addEventListener('click', closeModal);
elements.copyLinkBtn.addEventListener('click', copyGifLink);
elements.settingsButton.addEventListener('click', () => chrome.runtime.openOptionsPage());
elements.openSettingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});

window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50 && !isLoading && currentQuery) {
        currentPage++;
        searchGIFs(currentQuery, currentPage);
    }
});

document.addEventListener('DOMContentLoaded', loadState);

// Search Functions
function initiateSearch() {
    currentQuery = elements.searchQuery.value.trim();
    currentPage = 1;
    nextPos = 0;
    
    if (currentQuery) {
        elements.favoritesResults.classList.add('hidden');
        elements.gifResults.classList.remove('hidden');
        searchGIFs(currentQuery, currentPage, true);
    } else {
        elements.gifResults.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
    }
}

async function searchGIFs(query, page, isNewSearch = false) {
    if (isLoading) return;
    
    isLoading = true;
    elements.loadingIndicator.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');

    const cacheKey = `${query}_${page}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
        displayGIFs(cachedData, isNewSearch);
        isLoading = false;
        elements.loadingIndicator.classList.add('hidden');
    } else {
        try {
            // Get API key from storage, fallback to config.js if not set
            const items = await chrome.storage.sync.get({ tenorApiKey: '' });
            const apiKey = items.tenorApiKey || config.apiKey;
            
            if (!apiKey) {
                elements.apiKeyWarning.classList.remove('hidden');
                isLoading = false;
                elements.loadingIndicator.classList.add('hidden');
                return;
            } else {
                elements.apiKeyWarning.classList.add('hidden');
            }

            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=20&pos=${nextPos}`;

            const response = await fetch(url);
            const data = await response.json();
            
            cacheData(cacheKey, data);
            displayGIFs(data, isNewSearch);
        } catch (error) {
            console.error('Error fetching GIFs:', error);
        } finally {
            isLoading = false;
            elements.loadingIndicator.classList.add('hidden');
        }
    }
}

// UI Functions
function displayGIFs(data, isNewSearch) {
    if (isNewSearch) {
        elements.gifResults.innerHTML = '';
    }

    if (!data.results || data.results.length === 0) {
        if (isNewSearch) elements.emptyState.classList.remove('hidden');
        return;
    }

    data.results.forEach(gif => {
        const gifContainer = createGifElement(gif);
        elements.gifResults.appendChild(gifContainer);
    });

    nextPos = data.next;
    saveState();
}

function createGifElement(gif) {
    const container = document.createElement('div');
    container.className = 'gif-container';

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
        
        // If we are in favorites view, refresh it
        if (!elements.favoritesResults.classList.contains('hidden')) {
            displayFavorites();
        }
    });

    container.appendChild(img);
    container.appendChild(favBtn);
    return container;
}

// Favorites Functions
function isFavorite(gif) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(fav => fav.id === gif.id);
}

function toggleFavorite(gif) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.findIndex(fav => fav.id === gif.id);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(gif);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorites() {
    const isShowingFavorites = !elements.favoritesResults.classList.contains('hidden');
    
    if (isShowingFavorites) {
        elements.favoritesResults.classList.add('hidden');
        elements.gifResults.classList.remove('hidden');
        elements.favoritesButton.classList.remove('active');
        if (elements.gifResults.children.length === 0 && !currentQuery) {
            elements.emptyState.classList.remove('hidden');
        } else {
            elements.emptyState.classList.add('hidden');
        }
    } else {
        elements.favoritesResults.classList.remove('hidden');
        elements.gifResults.classList.add('hidden');
        elements.favoritesButton.classList.add('active');
        elements.emptyState.classList.add('hidden');
        displayFavorites();
    }
}

function displayFavorites() {
    elements.favoritesResults.innerHTML = '';
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    
    if (favorites.length === 0) {
        elements.emptyState.innerText = "No favorites yet. Click the heart icon on a GIF to save it!";
        elements.emptyState.classList.remove('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    favorites.forEach(gif => {
        const gifContainer = createGifElement(gif);
        elements.favoritesResults.appendChild(gifContainer);
    });
}

// Modal Functions
function openModal(url) {
    elements.modalImg.src = url;
    elements.gifModal.classList.remove('hidden');
    elements.copyLinkBtn.innerText = 'Copy Link';
    elements.copyLinkBtn.dataset.url = url;
}

function closeModal() {
    elements.gifModal.classList.add('hidden');
    elements.modalImg.src = '';
}

async function copyGifLink() {
    const url = elements.copyLinkBtn.dataset.url;
    if (!url) return;
    
    try {
        await navigator.clipboard.writeText(url);
        elements.copyLinkBtn.innerText = 'Copied!';
        setTimeout(() => {
            if (!elements.gifModal.classList.contains('hidden')) {
                elements.copyLinkBtn.innerText = 'Copy Link';
            }
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        elements.copyLinkBtn.innerText = 'Failed to copy';
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function cacheData(key, data) {
    const cacheEntry = { data, timestamp: Date.now() };
    try {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (e) {
        // Handle quota exceeded
        console.warn('Local storage full, clearing old cache');
        localStorage.clear();
        localStorage.setItem(key, JSON.stringify(cacheEntry));
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

// State Management
function saveState() {
    const state = {
        currentQuery,
        currentPage,
        nextPos,
        gifResults: elements.gifResults.innerHTML,
        mode: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    };
    try {
        localStorage.setItem('gifSearchState', JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save state');
    }
}

function loadState() {
    try {
        const state = JSON.parse(localStorage.getItem('gifSearchState'));
        if (state) {
            currentQuery = state.currentQuery || '';
            currentPage = state.currentPage || 1;
            nextPos = state.nextPos || 0;
            
            if (state.gifResults) {
                elements.gifResults.innerHTML = state.gifResults;
                // Re-attach event listeners to cached HTML
                Array.from(elements.gifResults.children).forEach(container => {
                    const img = container.querySelector('img');
                    const btn = container.querySelector('.favorite-button');
                    
                    if (img) {
                        img.addEventListener('click', () => {
                            // We don't have the full GIF object here, so we just use the src
                            // In a real app, we'd store the data, not the HTML
                            openModal(img.src.replace('tinygif', 'gif')); 
                        });
                    }
                    
                    if (btn) {
                        // This is a limitation of saving HTML state. 
                        // The favorite button won't work perfectly without the full GIF object.
                        // A better approach would be to save the data array and re-render.
                        // For now, we'll just hide it or let it be non-functional until a new search.
                        btn.style.display = 'none'; 
                    }
                });
            }
            
            elements.searchQuery.value = currentQuery;
            
            const isDark = state.mode === 'dark';
            document.body.classList.toggle('dark-mode', isDark);
            document.body.classList.toggle('light-mode', !isDark);
            elements.modeToggle.innerText = isDark ? '☀️' : '🌓';
        }
    } catch (e) {
        console.warn('Could not load state');
    }
}

function toggleMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDark);
    elements.modeToggle.innerText = isDark ? '☀️' : '🌓';
    saveState();
}


