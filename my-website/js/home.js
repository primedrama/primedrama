

(() => {
  "use strict";

  /* =========================
     PRIME DRAMA CONFIGURATION
  ========================= */

  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/original";
  const POSTER = "https://image.tmdb.org/t/p/w500";

  const PLAYER_BASE = "https://vidsrc.sh/embed";

  // ILAGAY DITO ANG IYONG DIRECT ADS URL
  const DIRECT_AD_LINK = "https://directyp.org/4/aaa4649f8b7c3dfb008b8bfb6e3e05d2";

  // Existing TMDB key configuration.
  const keyParts = [
    "e343", "16a6", "fe45", "6fe2",
    "2b50", "c403", "3980", "b236"
  ];

  window.__APP_CFG = keyParts.join("");
  const API_KEY = window.__APP_CFG;

  let currentItem = null;
  let heroItem = null;
  let searchTimer = null;
  let requestNumber = 0;
  let lastFocusedElement = null;

  const $ = id => document.getElementById(id);

  /* =========================
     TMDB API
  ========================= */

  function apiURL(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("api_key", API_KEY);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return url.toString();
  }

  async function fetchJSON(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error("Request failed:", response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Network error:", error);
      return null;
    }
  }

  async function fetchTrending(type) {
    const data = await fetchJSON(
      apiURL(`/trending/${type}/week`)
    );

    return data?.results || [];
  }

  async function fetchTrendingAnime() {
    const data = await fetchJSON(
      apiURL("/trending/tv/week")
    );

    return (data?.results || []).filter(item =>
      item.original_language === "ja" &&
      (item.genre_ids || []).includes(16)
    );
  }

  /* =========================
     NAVIGATION
  ========================= */

  function toggleNav() {
    const menu = $("mobile-menu");
    if (!menu) return;

    menu.style.display =
      menu.style.display === "flex" ? "none" : "flex";
  }

  /* =========================
     HERO BANNER
  ========================= */

  function displayBanner(item) {
    if (!item) return;

    heroItem = item;

    const banner = $("banner");
    if (!banner) return;

    banner.style.backgroundImage = item.backdrop_path
      ? `url("${IMG}${item.backdrop_path}")`
      : "";

    $("banner-title").textContent =
      item.title || item.name || "PrimeDrama";

    $("banner-overview").textContent =
      item.overview || "Discover trending entertainment.";
  }

  /* =========================
     MOVIE CARDS
  ========================= */

  function createCard(item) {
    if (!item.poster_path) return null;

    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const titleText = item.title || item.name || "Untitled";
    card.setAttribute("aria-label", `Open ${titleText}`);

    const img = document.createElement("img");
    img.src = POSTER + item.poster_path;
    img.alt = titleText;
    img.loading = "lazy";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = titleText;

    card.append(img, title);

    card.addEventListener("click", () => showDetails(item));

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showDetails(item);
      }
    });

    return card;
  }

  function displayList(items, id) {
    const container = $(id);
    if (!container) return;

    container.replaceChildren();

    items.forEach(item => {
      const card = createCard(item);
      if (card) container.appendChild(card);
    });
  }

  /* =========================
     MOVIE DETAILS MODAL
  ========================= */

  function showDetails(item) {
    if (!item) return;

    currentItem = item;
    lastFocusedElement = document.activeElement;

    $("modal").classList.add("show");
    $("modal").setAttribute("aria-hidden", "false");

    document.documentElement.style.overflow = "hidden";
    $("banner").style.visibility = "hidden";

    $("modal-title").textContent =
      item.title || item.name || "Untitled";

    $("modal-description").textContent =
      item.overview || "No description available.";

    const score = Number(item.vote_average) || 0;

    $("modal-rating").textContent = score
      ? `★ ${score.toFixed(1)} / 10`
      : "";

    $("info-wrapper").style.backgroundImage =
      item.poster_path
        ? `url("${POSTER}${item.poster_path}")`
        : "";

    const isMovie = Boolean(item.title);

    $("episode-controls").hidden = isMovie;
    $("season").value = 1;
    $("episode").value = 1;
    $("server").value = "vidsrc";

    changeServer();

    $("close-modal").focus();
  }

  function closeModal() {
    const video = $("modal-video");

    if (video) {
      video.src = "";
    }

    // Remove the custom Play overlay.
    if (video?.parentElement) {
      video.parentElement
        .querySelector(".prime-play-overlay")
        ?.remove();
    }

    $("modal").classList.remove("show");
    $("modal").setAttribute("aria-hidden", "true");

    $("banner").style.visibility = "visible";
    document.documentElement.style.overflow = "";

    currentItem = null;
    requestNumber++;

    if (lastFocusedElement?.focus) {
      lastFocusedElement.focus();
    }
  }

  /* =========================
     DIRECT ADS VALIDATION
  ========================= */

  function getValidAdURL() {
    try {
      const value = DIRECT_AD_LINK.trim();

      if (
        !value ||
        value === "PASTE_YOUR_DIRECT_AD_LINK_HERE"
      ) {
        return null;
      }

      const url = new URL(value);

      // Accept HTTPS ad destinations only.
      if (url.protocol !== "https:") {
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }

  /* =========================
     CUSTOM PLAY OVERLAY
  ========================= */

  function createPlayOverlay(video, movieURL) {
    const wrapper = video.parentElement;
    if (!wrapper) return;

    // Remove an existing overlay before creating another.
    wrapper
      .querySelector(".prime-play-overlay")
      ?.remove();

    // Prepare the player area.
    wrapper.style.position = "relative";

    video.src = "";

    const overlay = document.createElement("div");
    overlay.className = "prime-play-overlay";

    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
      zIndex: "10"
    });

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "▶ PLAY MOVIE";
    button.setAttribute("aria-label", "Play movie");

    Object.assign(button.style, {
      padding: "15px 25px",
      background: "#e50914",
      color: "#fff",
      border: "0",
      borderRadius: "6px",
      fontSize: "17px",
      fontWeight: "bold",
      cursor: "pointer"
    });

    button.addEventListener("click", () => {
      // Prevent repeated clicks while the player loads.
      if (button.disabled) return;
      button.disabled = true;

      const adURL = getValidAdURL();

      if (adURL) {
        // Open the ad directly in response to the user's click.
        // Browser popup settings may still block the new tab.
        window.open(
          adURL,
          "_blank",
          "noopener,noreferrer"
        );
      } else {
        console.warn(
          "Direct ads URL is missing or invalid. " +
          "Update DIRECT_AD_LINK in home.js."
        );
      }

      // Load the selected movie or TV episode.
      video.src = movieURL;

      overlay.remove();

      const message = $("player-message");
      if (message) {
        message.textContent = "Loading video...";
      }
    });

    overlay.appendChild(button);
    wrapper.appendChild(overlay);
  }

  /* =========================
     VIDSRC PLAYER
  ========================= */

  function changeServer(season = 1, episode = 1) {
    if (!currentItem) return;

    const video = $("modal-video");
    const id = currentItem.id;
    const isMovie = Boolean(currentItem.title);

    if (!id || !video) return;

    const safeSeason = Math.max(
      1, parseInt(season, 10) || 1
    );

    const safeEpisode = Math.max(
      1, parseInt(episode, 10) || 1
    );

    const url = isMovie
      ? `${PLAYER_BASE}/movie/${id}`
      : `${PLAYER_BASE}/tv/${id}/${safeSeason}/${safeEpisode}`;

    // Display our Play button before loading the embed.
    createPlayOverlay(video, url);

    const message = $("player-message");
    if (message) {
      message.textContent =
        "Press PLAY MOVIE to start watching.";
    }
  }

  /* =========================
     SEARCH
  ========================= */

  async function searchTMDB(query) {
    const section = $("search-section");
    const results = $("search-results");
    const input = $("search-input");

    if (!section || !results || !input) return;

    const q = query.trim();

    if (!q) {
      section.hidden = true;
      results.replaceChildren();
      return;
    }

    const requestId = ++requestNumber;

    const data = await fetchJSON(
      apiURL("/search/multi", { query: q })
    );

    if (requestId !== requestNumber) return;
    if (input.value.trim() !== q) return;

    results.replaceChildren();
    section.hidden = false;

    const items = (data?.results || []).filter(item =>
      ["movie", "tv"].includes(item.media_type) &&
      item.poster_path
    );

    items.forEach(item => {
      const card = createCard(item);
      if (card) results.appendChild(card);
    });

    if (!items.length) {
      const message = document.createElement("p");
      message.textContent = "No results found.";
      results.appendChild(message);
    }
  }

  /* =========================
     INITIALIZATION
  ========================= */

  async function init() {
    const year = $("year");
    if (year) {
      year.textContent = new Date().getFullYear();
    }

    const [movies, tv, anime] = await Promise.all([
      fetchTrending("movie"),
      fetchTrending("tv"),
      fetchTrendingAnime()
    ]);

    const animeIds = new Set(anime.map(item => item.id));

    const regularTV = tv.filter(item =>
      !animeIds.has(item.id)
    );

    displayBanner(movies[0]);
    displayList(movies, "movies-list");
    displayList(regularTV, "tvshows-list");
    displayList(anime, "anime-list");
    displayList(movies.slice(0, 6), "recommended-list");
  }

  /* =========================
     EVENT LISTENERS
  ========================= */

  const hamburger = $("hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", toggleNav);
  }

  const closeButton = $("close-modal");
  if (closeButton) {
    closeButton.addEventListener("click", closeModal);
  }

  const modal = $("modal");
  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      $("modal")?.classList.contains("show")
    ) {
      closeModal();
    }
  });

  const heroPlay = $("hero-play");
  if (heroPlay) {
    heroPlay.addEventListener("click", () => {
      if (heroItem) showDetails(heroItem);
    });
  }

  const server = $("server");
  if (server) {
    server.addEventListener("change", () => {
      if (currentItem) {
        changeServer(
          $("season")?.value || 1,
          $("episode")?.value || 1
        );
      }
    });
  }

  const playEpisode = $("play-episode");
  if (playEpisode) {
    playEpisode.addEventListener("click", () => {
      changeServer(
        $("season")?.value || 1,
        $("episode")?.value || 1
      );
    });
  }

  const searchInput = $("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", event => {
      clearTimeout(searchTimer);

      const query = event.target.value;

      searchTimer = setTimeout(() => {
        searchTMDB(query);
      }, 300);
    });
  }

  init();
})();
