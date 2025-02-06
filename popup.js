let currentPage = 1;
let currentQuery = '';
let nextPos = 0;  // Track the position for the next set of results
const cacheDuration = 1000 * 60 * 60 * 24; // 1 day

document.getElementById('searchButton').addEventListener('click', debounce(initiateSearch, 300));
document.getElementById('searchQuery').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        debounce(initiateSearch, 300)();
    }
});
document.getElementById('modeToggle').addEventListener('click', toggleMode);
document.getElementById('favoritesButton').addEventListener('click', toggleFavorites);

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

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function displayGIFs(data, isNewSearch) {
    const gifResults = document.getElementById('gifResults');
    if (isNewSearch) {
        gifResults.innerHTML = '';  // Clear previous results only on a new search
    }

    data.results.forEach(gif => {
        const gifContainer = document.createElement('div');
        gifContainer.className = 'gif-container';

        const gifElement = document.createElement('img');
        gifElement.src = gif.media_formats.tinygif.url;
        gifElement.alt = gif.title;
        gifElement.style.margin = '10px';
        gifElement.addEventListener('click', () => {
            const bigUrl = gif.media_formats.gif ? gif.media_formats.gif.url : gif.media_formats.tinygif.url;
            openModal(bigUrl);
        });

        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'favorite-button';
        favoriteButton.innerText = isFavorite(gif) ? '❤️' : '♡';
        favoriteButton.addEventListener('click', (event) => {
            event.stopPropagation();  // Prevent triggering the gif click event
            toggleFavorite(gif);
            favoriteButton.innerText = isFavorite(gif) ? '❤️' : '♡';
        });

        gifContainer.appendChild(gifElement);
        gifContainer.appendChild(favoriteButton);
        gifResults.appendChild(gifContainer);
    });

    // Update nextPos to the next position for fetching new results
    nextPos = data.next;

    // Save current state to localStorage
    saveState();
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

function isFavorite(gif) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.some(fav => fav.id === gif.id);
}

function addToFavorites(gif) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites.push(gif);
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorites() {
    const favoritesResults = document.getElementById('favoritesResults');
    const gifResults = document.getElementById('gifResults');
    if (favoritesResults.style.display === 'none') {
        favoritesResults.style.display = 'block';
        gifResults.style.display = 'none';
        displayFavorites();
    } else {
        favoritesResults.style.display = 'none';
        gifResults.style.display = 'block';
    }
}

function displayFavorites() {
        const favoritesResults = document.getElementById('favoritesResults');
        favoritesResults.innerHTML = '';  // Clear previous results
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        favorites.forEach(gif => {
            const gifContainer = document.createElement('div');
            gifContainer.className = 'gif-container';

            const gifElement = document.createElement('img');
            gifElement.src = gif.media_formats.tinygif.url;
            gifElement.alt = gif.title;
            gifElement.style.margin = '10px';
            // Add the click event listener to open the modal, using a fallback order.
            gifElement.addEventListener('click', () => {
                const bigUrl = (gif.media_formats.gif && gif.media_formats.gif.url) ||
                               (gif.media_formats.mp4 && gif.media_formats.mp4.url) ||
                               gif.media_formats.tinygif.url;
                openModal(bigUrl);
            });

            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'favorite-button';
            favoriteButton.innerText = isFavorite(gif) ? '❤️' : '♡';
            favoriteButton.addEventListener('click', (event) => {
                event.stopPropagation();  // Prevent triggering the gif click event
                toggleFavorite(gif);
                favoriteButton.innerText = isFavorite(gif) ? '❤️' : '♡';
            });

            gifContainer.appendChild(gifElement);
            gifContainer.appendChild(favoriteButton);
            favoritesResults.appendChild(gifContainer);
        });
}
function removeFromFavorites(index) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();  // Refresh the favorites display
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

function openModal(url) {
    const modal = document.getElementById('gifModal');
    const modalImg = document.getElementById('modalImg');
    modalImg.src = url;
    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('gifModal').style.display = 'none';
}

// Add event listener for closing the modal
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeModal').addEventListener('click', closeModal);
});

// Load the previous state when the popup is opened
document.addEventListener('DOMContentLoaded', loadState);


