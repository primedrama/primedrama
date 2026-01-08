const API_KEY = atob('ZTM0MzE2YTZmZTQ1NmZlMjJiNTBjNDAzMzk4MGIzMjY=');
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

// ================= FETCH FUNCTIONS =================

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];

  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();

    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );

    allResults = allResults.concat(filtered);
  }

  return allResults;
}

// ================= DISPLAY FUNCTIONS =================

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage =
    `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent =
    item.title || item.name;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    if (!item.poster_path) return;

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);

    container.appendChild(img);
  });
}

function showDetails(item) {
  currentItem = item;

  document.getElementById('modal-title').textContent =
    item.title || item.name;

  document.getElementById('modal-description').textContent =
    item.overview;

  document.getElementById('modal-image').src =
    `${IMG_URL}${item.poster_path}`;

  document.getElementById('modal-rating').innerHTML =
    '★'.repeat(Math.round(item.vote_average / 2));

  changeServer();
  document.getElementById('modal').style.display = 'flex';
}

// ================= ZXCSTREAM EMBED HANDLER =================

function changeServer() {
  const server = document.getElementById('server').value;
  const isMovie = currentItem.media_type === "movie";

  const language = "en";
  const season = 1;
  const episode = 1;

  let embedURL = "";

  if (server === "zxc-player") {
    embedURL = isMovie
      ? `https://zxcstream.xyz/player/movie/${currentItem.id}/${language}`
      : `https://zxcstream.xyz/player/tv/${currentItem.id}/${season}/${episode}/${language}`;
  }

  if (server === "zxc-embed") {
    embedURL = isMovie
      ? `https://zxcstream.xyz/embed/movie/${currentItem.id}`
      : `https://zxcstream.xyz/embed/tv/${currentItem.id}/${season}/${episode}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

// ================= MODAL CONTROLS =================

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// ================= SEARCH =================

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;

  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`
  );
  const data = await res.json();

  const container = document.getElementById('search-results');
  container.innerHTML = '';

  data.results.forEach(item => {
    if (!item.poster_path) return;

    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => {
      closeSearchModal();
      showDetails(item);
    };

    container.appendChild(img);
  });
}

// ================= INIT =================

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();


