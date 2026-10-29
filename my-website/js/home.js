


(() => {
  "use strict";

  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/original";
  const POSTER = "https://image.tmdb.org/t/p/w500";
  const PLAYER_BASE = "https://vidsrc.sh/embed";

  // Direct ads URL
  const DIRECT_AD_LINK =
    "https://directyp.org/4/aaa4649f8b7c3dfb008b8bfb6e3e05d2";

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

  // ------------------------------
  // TMDB API
  // ------------------------------

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

  // ------------------------------
  // Navigation
  // ------------------------------

  function toggleNav() {
    const menu = $("mobile-menu");
    if (!menu) return;

    menu.style.display =
      menu.style.display === "flex" ? "none" : "flex";
  }

  // ------------------------------
  // Homepage banner
  // ------------------------------

  function displayBanner(item) {
    if (!item) return;

    heroItem = item;

    const banner = $("banner");
    if (!banner) return;

    banner.style.backgroundImage = item.backdrop_path
      ? `url("${IMG}${item.backdrop_path}")`
      : "";

    const bannerTitle = $("banner-title");
    const bannerOverview = $("banner-overview");

    if (bannerTitle) {
      bannerTitle.textContent =
        item.title || item.name || "PrimeDrama";
    }

    if (bannerOverview) {
      bannerOverview.textContent =
        item.overview || "Discover trending entertainment.";
    }
  }

  // ------------------------------
  // Movie and TV cards
  // ------------------------------

  function createCard(item) {
    if (!item.poster_path) return null;

    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    const titleText =
      item.title || item.name || "Untitled";

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

  // ------------------------------
  // Open movie or TV details
  // ------------------------------

  function showDetails(item) {
    if (!item) return;

    currentItem = item;
    lastFocusedElement = document.activeElement;

    const modal = $("modal");
    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";

    const banner = $("banner");
    if (banner) banner.style.visibility = "hidden";

    const title = $("modal-title");
    const description = $("modal-description");
    const rating = $("modal-rating");
    const info = $("info-wrapper");

    if (title) {
      title.textContent = item.title || item.name || "Untitled";
    }

    if (description) {
      description.textContent =
        item.overview || "No description available.";
    }

    const score = Number(item.vote_average) || 0;

    if (rating) {
      rating.textContent = score
        ? `★ ${score.toFixed(1)} / 10`
        : "";
    }

    if (info) {
      info.style.backgroundImage = item.poster_path
        ? `url("${POSTER}${item.poster_path}")`
        : "";
    }

    const isMovie = Boolean(item.title);
    const episodeControls = $("episode-controls");

    if (episodeControls) {
      episodeControls.hidden = isMovie;
    }

    if ($("season")) $("season").value = 1;
    if ($("episode")) $("episode").value = 1;
    if ($("server")) $("server").value = "vidsrc";

    changeServer(1, 1);

    $("close-modal")?.focus();
  }

  // ------------------------------
  // Close player modal
  // ------------------------------

  function closeModal() {
    const video = $("modal-video");

    if (video) video.src = "";

    if (video?.parentElement) {
      video.parentElement
        .querySelector(".prime-play-overlay")
        ?.remove();
    }

    const modal = $("modal");

    if (modal) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }

    const banner = $("banner");
    if (banner) banner.style.visibility = "visible";

    document.documentElement.style.overflow = "";

    currentItem = null;
    requestNumber++;

    if (lastFocusedElement?.focus) {
      lastFocusedElement.focus();
    }
  }

  // ------------------------------
  // Open direct ad
  // ------------------------------

  function openDirectAd() {
    try {
      const url = new URL(DIRECT_AD_LINK);

      if (url.protocol !== "https:") {
        console.warn("Invalid ads URL.");
        return;
      }

      // Browsers may block new tabs if pop-ups are disabled.
      const adWindow = window.open(
        url.href,
        "_blank",
        "noopener,noreferrer"
      );

      if (!adWindow) {
        console.warn(
          "The ad tab may have been blocked by the browser."
        );
      }
    } catch (error) {
      console.error("Invalid ads URL:", error);
    }
  }

  // ------------------------------
  // Play overlay buttons
  // ------------------------------

  function createPlayOverlay(video, movieURL) {
    const wrapper = video.parentElement;
    if (!wrapper) return;

    wrapper.querySelector(".prime-play-overlay")?.remove();

    wrapper.style.position = "relative";
    video.src = "";

    const overlay = document.createElement("div");
    overlay.className = "prime-play-overlay";

    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "18px",
      padding: "20px",
      boxSizing: "border-box",
      background: "#111",
      zIndex: "10",
      textAlign: "center"
    });

    const message = document.createElement("div");
    message.textContent = "Press Play to Start Watching";

    Object.assign(message.style, {
      background: "#e50914",
      color: "#fff",
      padding: "10px 16px",
      borderRadius: "5px",
      fontSize: "14px",
      fontWeight: "bold",
      maxWidth: "100%"
    });

    // First button: PLAY
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.textContent = "▶ PLAY";
    playButton.setAttribute("aria-label", "Play");

    Object.assign(playButton.style, {
      padding: "14px 28px",
      background: "#e50914",
      color: "#fff",
      border: "0",
      borderRadius: "6px",
      fontSize: "17px",
      fontWeight: "bold",
      cursor: "pointer"
    });

    // Second button: PLAY MOVIE
    const movieButton = document.createElement("button");
    movieButton.type = "button";
    movieButton.textContent = "▶ PLAY MOVIE";
    movieButton.setAttribute("aria-label", "Play movie");

    Object.assign(movieButton.style, {
      display: "none",
      padding: "14px 28px",
      background: "#e50914",
      color: "#fff",
      border: "0",
      borderRadius: "6px",
      fontSize: "17px",
      fontWeight: "bold",
      cursor: "pointer"
    });

    // Clicking PLAY opens the ad and reveals PLAY MOVIE.
    playButton.addEventListener("click", () => {
      openDirectAd();

      playButton.style.display = "none";
      movieButton.style.display = "inline-block";

      message.textContent = "Ready? Click PLAY MOVIE";
    });

    // Clicking PLAY MOVIE opens the ad again and loads the video.
    movieButton.addEventListener("click", () => {
      openDirectAd();

      video.src = movieURL;
      overlay.remove();

      const playerMessage = $("player-message");

      if (playerMessage) {
        playerMessage.textContent = "Loading video...";
      }
    });

    overlay.append(message, playButton, movieButton);
    wrapper.appendChild(overlay);
  }

  // ------------------------------
  // CHANGE SERVER
  // ------------------------------

  function changeServer(season = 1, episode = 1) {
    if (!currentItem) return;

    const video = $("modal-video");
    const id = currentItem.id;
    const isMovie = Boolean(currentItem.title);

    if (!id || !video) return;

    const safeSeason = Math.max(
      1,
      parseInt(season, 10) || 1
    );

    const safeEpisode = Math.max(
      1,
      parseInt(episode, 10) || 1
    );

    const server = $("server")?.value || "vidsrc";

    let playerBase = PLAYER_BASE;

    // Add more server options here if you have their valid URLs.
    if (server === "vidsrc") {
      playerBase = "https://vidsrc.sh/embed";
    }

    const movieURL = isMovie
      ? `${playerBase}/movie/${id}`
      : `${playerBase}/tv/${id}/${safeSeason}/${safeEpisode}`;

    createPlayOverlay(video, movieURL);

    const message = $("player-message");

    if (message) {
      message.textContent = "Press Play to Start Watching.";
    }
  }

  // ------------------------------
  // Search
  // ------------------------------

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

  // ------------------------------
  // Initialize homepage
  // ------------------------------

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

    const regularTV = tv.filter(
      item => !animeIds.has(item.id)
    );

    displayBanner(movies[0]);
    displayList(movies, "movies-list");
    displayList(regularTV, "tvshows-list");
    displayList(anime, "anime-list");
    displayList(movies.slice(0, 6), "recommended-list");
  }

  // ------------------------------
  // Event listeners
  // ------------------------------

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
      if (event.target === modal) closeModal();
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

      searchTimer = setTimeout(
        () => searchTMDB(query),
        300
      );
    });
  }

  init();
})();
