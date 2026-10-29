
(function () {
  const k = ["e343", "16a6", "fe45", "6fe2", "2b50", "c403", "3980", "b236"];
  window.__APP_CFG = k.join("");
})();

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";
const API_KEY = window.__APP_CFG;

const PLAYER_BASE = "https://vidsrc.sh/embed";

let currentItem = null;
let heroItem = null;

/* NAV */
function toggleNav() {
  const menu = document.getElementById("mobile-menu");
  if (!menu) return;

  menu.style.display =
    menu.style.display === "flex" ? "none" : "flex";
}

/* FETCH */
async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Request failed:", res.status, url);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
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

  return (data?.results || []).filter(tv =>
    tv.original_language === "ja" &&
    (tv.genre_ids || []).includes(16)
  );
}

/* UI */
function displayBanner(item) {
  if (!item) return;

  heroItem = item;

  const banner = document.getElementById("banner");
  if (banner) {
    banner.style.backgroundImage = item.backdrop_path
      ? `url("${IMG}${item.backdrop_path}")`
      : "";
  }

  const title = document.getElementById("banner-title");
  const overview = document.getElementById("banner-overview");

  if (title) title.textContent = item.title || item.name || "";
  if (overview) overview.textContent = item.overview || "";
}

function createCard(item) {
  if (!item.poster_path) return null;

  const card = document.createElement("div");
  card.className = "card";
  card.onclick = () => showDetails(item);

  const img = document.createElement("img");
  img.src = IMG + item.poster_path;
  img.alt = item.title || item.name || "Movie poster";
  img.loading = "lazy";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.name || "";

  card.append(img, title);
  return card;
}

function displayList(items, id) {
  const container = document.getElementById(id);
  if (!container) return;

  container.innerHTML = "";

  items.forEach(item => {
    const card = createCard(item);
    if (card) container.appendChild(card);
  });
}

/* MODAL */
function showDetails(item) {
  if (!item) return;

  currentItem = item;

  const modal = document.getElementById("modal");
  if (modal) modal.classList.add("show");

  document.documentElement.style.overflow = "hidden";

  const banner = document.getElementById("banner");
  if (banner) banner.style.visibility = "hidden";

  const title = document.getElementById("modal-title");
  const description = document.getElementById("modal-description");
  const rating = document.getElementById("modal-rating");
  const wrapper = document.getElementById("info-wrapper");

  if (title) title.textContent = item.title || item.name || "";
  if (description) description.textContent = item.overview || "";

  if (rating) {
    const score = Number(item.vote_average) || 0;
    rating.textContent = score
      ? "★".repeat(Math.round(score / 2))
      : "";
  }

  if (wrapper) {
    wrapper.style.backgroundImage = item.poster_path
      ? `url("${IMG}${item.poster_path}")`
      : "";
  }

  changeServer();
}

function closeModal() {
  const modal = document.getElementById("modal");
  const video = document.getElementById("modal-video");

  if (modal) modal.classList.remove("show");

  if (video) video.src = "";

  const banner = document.getElementById("banner");
  if (banner) banner.style.visibility = "visible";

  document.documentElement.style.overflow = "";
}

/* VIDEO PLAYER */
function changeServer(season = 1, episode = 1) {
  if (!currentItem) return;

  const video = document.getElementById("modal-video");
  if (!video) return;

  const id = currentItem.id;
  const isMovie = currentItem.title != null;

  if (!id) {
    video.src = "";
    console.error("Missing TMDB ID");
    return;
  }

  const url = isMovie
    ? `${PLAYER_BASE}/movie/${id}`
    : `${PLAYER_BASE}/tv/${id}/${season}/${episode}`;

  video.src = url;
  video.title = currentItem.title || currentItem.name || "Video player";
  video.setAttribute("allowfullscreen", "");
  video.setAttribute(
    "allow",
    "autoplay; fullscreen; picture-in-picture"
  );
}

/* SEARCH */
async function searchTMDB(q) {
  const section = document.getElementById("search-section");
  const el = document.getElementById("search-results");

  if (!section || !el) return;

  const query = q.trim();

  if (!query) {
    section.hidden = true;
    el.innerHTML = "";
    return;
  }

  const data = await fetchJSON(
    `${BASE}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );

  el.innerHTML = "";
  section.hidden = false;

  (data?.results || [])
    .filter(item => item.media_type !== "person")
    .forEach(item => {
      const card = createCard(item);
      if (card) el.appendChild(card);
    });
}

/* RECOMMENDED */
async function displayRecommended() {
  const data = await fetchTrending("movie");
  const container = document.getElementById("recommended-list");

  if (!container) return;

  container.innerHTML = "";

  data.slice(0, 6).forEach(item => {
    const card = createCard(item);
    if (card) container.appendChild(card);
  });
}

/* INIT */
async function init() {
  const [movies, allTV, anime] = await Promise.all([
    fetchTrending("movie"),
    fetchTrending("tv"),
    fetchTrendingAnime()
  ]);

  const animeIds = new Set(anime.map(item => item.id));
  const tv = allTV.filter(item => !animeIds.has(item.id));

  displayBanner(movies[0]);
  displayList(movies, "movies-list");
  displayList(tv, "tvshows-list");
  displayList(anime, "anime-list");

  await displayRecommended();
}

/* CLICK HERO TO PLAY */
function playHero() {
  if (heroItem) showDetails(heroItem);
}

init();
