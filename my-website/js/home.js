(function () {
  const __x = [
    "e343", "16a6", "fe45", "6fe2",
    "2b50", "c403", "3980", "b236"
  ];
  window.__APP_CFG = __x.join("");
})();

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";
const API_KEY = window.__APP_CFG;

let currentItem = null;

/* =========================
   NAVBAR INTERACTIONS
========================= */
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  nav.classList.toggle("scrolled", window.scrollY > 20);
});

function toggleNav() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  nav.classList.toggle("open");
}

/* =========================
   FETCH
========================= */
async function fetchJSON(url) {
  const res = await fetch(url);
  return res.ok ? res.json() : null;
}

async function fetchTrending(type) {
  const data = await fetchJSON(
    `${BASE}/trending/${type}/week?api_key=${API_KEY}`
  );
  return data?.results || [];
}

async function fetchTrendingAnime() {
  const data = await fetchJSON(
    `${BASE}/trending/tv/week?api_key=${API_KEY}`
  );
  return (
    data?.results.filter(
      i => i.original_language === "ja" && i.genre_ids.includes(16)
    ) || []
  );
}

/* =========================
   UI
========================= */
function displayBanner(item) {
  document.getElementById("banner").style.backgroundImage =
    `url(${IMG}${item.backdrop_path})`;

  document.getElementById("banner-title").textContent =
    item.title || item.name;
}

function displayList(items, id) {
  const el = document.getElementById(id);
  el.innerHTML = "";

  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + item.poster_path;
    img.onclick = () => showDetails(item);
    el.appendChild(img);
  });
}

/* =========================
   MODAL
========================= */
function showDetails(item) {
  currentItem = item;

  document.getElementById("modal").style.display = "flex";
  document.body.style.overflow = "hidden";

  document.getElementById("modal-title").textContent =
    item.title || item.name;

  document.getElementById("modal-description").textContent =
    item.overview || "No description available.";

  document.getElementById("modal-rating").textContent =
    "★".repeat(Math.round(item.vote_average / 2));

  document.querySelector(".info-wrapper").style.backgroundImage =
    `url(${IMG}${item.poster_path})`;

  document.getElementById("server").value = "embed";
  changeServer();
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-video").src = "";
  document.body.style.overflow = "";
}

/* =========================
   PLAYER
========================= */
function changeServer() {
  if (!currentItem) return;

  const id = currentItem.id;
  const isMovie = !!currentItem.title;

  const url = isMovie
    ? `https://zxcstream.xyz/embed/movie/${id}`
    : `https://zxcstream.xyz/embed/tv/${id}/1/1`;

  document.getElementById("modal-video").src = url;
}

/* =========================
   SEARCH
========================= */
async function searchTMDB(q) {
  const section = document.getElementById("search-section");
  const el = document.getElementById("search-results");

  if (!q) {
    section.hidden = true;
    return;
  }

  const data = await fetchJSON(
    `${BASE}/search/multi?api_key=${API_KEY}&query=${q}`
  );

  el.innerHTML = "";
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth" });

  data?.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + item.poster_path;
    img.onclick = () => showDetails(item);
    el.appendChild(img);
  });
}

/* =========================
   INIT
========================= */
async function init() {
  const movies = await fetchTrending("movie");
  const tv = await fetchTrending("tv");
  const anime = await fetchTrendingAnime();

  if (movies.length) displayBanner(movies[0]);

  displayList(movies, "movies-list");
  displayList(tv, "tvshows-list");
  displayList(anime, "anime-list");
}

init();


