let currentPage = 1;
let currentQuery = '';
let nextPos = 0;  // Track the position for the next set of results
// 1 day
const cacheDuration = 1000 * 60 * 60 * 24;

document.getElementById('searchButton').addEventListener('click', function() {
    initiateSearch();
});

document.getElementById('searchQuery').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        initiateSearch();
    }
});

document.getElementById('modeToggle').addEventListener('click', function() {
    toggleMode();
});

function initiateSearch() {
    currentQuery = document.getElementById('searchQuery').value;
    currentPage = 1;  // Reset to the first page
    nextPos = 0;  // Reset the position
    if (currentQuery) {
        searchGIFs(currentQuery, currentPage, true);
    }
}

function searchGIFs(query, page, isNewSearch = false) {
    const cacheKey = `${query}_${page}`;
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
        displayGIFs(cachedData, isNewSearch);
    } else {
        const apiKey = 'AIzaSyDfzPgL2mIc3o-v_JdKE27PAg9WiIa_Poo';  // Replace with your actual API key
        const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=20&pos=${nextPos}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                cacheData(cacheKey, data);
                displayGIFs(data, isNewSearch);
            })
            .catch(error => console.error('Error fetching GIFs:', error));
    }
}

function displayGIFs(data, isNewSearch) {
    const gifResults = document.getElementById('gifResults');
    if (isNewSearch) {
        gifResults.innerHTML = '';  // Clear previous results only on a new search
    }

    data.results.forEach(gif => {
        const gifElement = document.createElement('img');
        gifElement.src = gif.media_formats.tinygif.url;
        gifElement.alt = gif.title;
        gifElement.style.margin = '10px';
        gifResults.appendChild(gifElement);
    });

    // Update nextPos to the next position for fetching new results
    nextPos = data.next;

    // Save current state to localStorage
    saveState();
}

function cacheData(key, data) {
    const cacheEntry = {
        data,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
}

function getCachedData(key) {
    const cacheEntry = JSON.parse(localStorage.getItem(key));
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < cacheDuration)) {
        return cacheEntry.data;
    }
    return null;
}

function saveState() {
    const state = {
        currentQuery,
        currentPage,
        nextPos,
        gifResults: document.getElementById('gifResults').innerHTML,
        mode: document.body.classList.contains('dark-mode') ? 'dark' : 'light'
    };
    localStorage.setItem('gifSearchState', JSON.stringify(state));
}

function loadState() {
    const state = JSON.parse(localStorage.getItem('gifSearchState'));
    if (state) {
        currentQuery = state.currentQuery;
        currentPage = state.currentPage;
        nextPos = state.nextPos;
        document.getElementById('gifResults').innerHTML = state.gifResults;
        document.getElementById('searchQuery').value = currentQuery;
        document.body.classList.toggle('dark-mode', state.mode === 'dark');
        document.body.classList.toggle('light-mode', state.mode === 'light');
    }
}

function toggleMode() {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    saveState();
}

window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        currentPage++;
        searchGIFs(currentQuery, currentPage);
    }
});

// Load the previous state when the popup is opened
document.addEventListener('DOMContentLoaded', loadState);


