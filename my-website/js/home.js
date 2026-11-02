(() => {
  "use strict";

  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/original";
  const POSTER = "https://image.tmdb.org/t/p/w500";
  const PLAYER_BASE = "https://vidsrc.sh/embed";

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

  const GENRE_NAMES = {
    28: "Action", 12: "Adventure", 16: "Animation",
    35: "Comedy", 80: "Crime", 99: "Documentary",
    18: "Drama", 10751: "Family", 14: "Fantasy",
    36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War",
    37: "Western", 10759: "Action & Adventure",
    10762: "Kids", 10763: "News", 10764: "Reality",
    10765: "Sci-Fi & Fantasy", 10766: "Soap",
    10767: "Talk", 10768: "War & Politics"
  };

  // ------------------------------
  // TMDB API
  // ------------------------------

  function apiURL(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("api_key", API_KEY);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  async function fetchJSON(url) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error("TMDB request failed:", response.status);
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

    menu.classList.toggle("open");
    menu.classList.toggle("active");
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

    const title = $("banner-title");
    const overview = $("banner-overview");

    if (title) {
      title.textContent = item.title || item.name || "PrimeDrama";
    }

    if (overview) {
      overview.textContent =
        item.overview || "Discover trending entertainment.";
    }
  }

  // ------------------------------
  // Movie cards
  // ------------------------------

  function createCard(item) {
    if (!item?.poster_path) return null;

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

    const info = document.createElement("div");
    info.className = "card-info";

    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = titleText;

    const meta = document.createElement("div");
    meta.className = "card-meta";

    const dateValue = item.release_date || item.first_air_date || "";
    const year = dateValue ? dateValue.slice(0, 4) : "Year N/A";
    const score = Number(item.vote_average) || 0;

    const yearEl = document.createElement("span");
    yearEl.className = "card-year";
    yearEl.textContent = year;

    const ratingEl = document.createElement("span");
    ratingEl.className = "card-rating";
    ratingEl.textContent = score ? `★ ${score.toFixed(1)}` : "—";

    meta.append(yearEl, ratingEl);
    info.append(title, meta);
    card.append(img, info);

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
  // Player poster background
  // ------------------------------

  function setPlayerPoster(item) {
    const video = $("modal-video");
    const wrapper = video?.parentElement;

    if (!wrapper) return;

    const posterURL = item?.poster_path
      ? `${POSTER}${item.poster_path}`
      : "";

    wrapper.style.setProperty(
      "--movie-poster",
      posterURL ? `url("${posterURL}")` : "none"
    );

    wrapper.classList.add("player-wrapper");
    wrapper.style.backgroundColor = "#09090b";
  }

  // ------------------------------
  // Movie details modal
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
    const meta = $("modal-meta");
    const genres = $("modal-genres");
    const recommendations = $("recommendations-list");

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
        : "Rating unavailable";
    }

    const isMovie = Boolean(item.title);
    const dateValue = item.release_date || item.first_air_date || "";

    if (meta) {
      meta.textContent = [
        dateValue ? dateValue.slice(0, 4) : "Year unavailable",
        isMovie ? "Movie" : "TV Series"
      ].join(" • ");
    }

    if (genres) {
      genres.textContent = (item.genre_ids || [])
        .map(id => GENRE_NAMES[id])
        .filter(Boolean)
        .join(" • ");
    }

    if (recommendations) {
      recommendations.replaceChildren();
    }

    setPlayerPoster(item);
    loadTitleExtras(item);

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
  // Extra movie details
  // ------------------------------

  async function loadTitleExtras(item) {
    const type = item.title ? "movie" : "tv";

    const details = await fetchJSON(
      apiURL(`/${type}/${item.id}`, {
        append_to_response: "release_dates,content_ratings"
      })
    );

    if (!details || currentItem?.id !== item.id) return;

    const meta = $("modal-meta");

    if (meta) {
      const dateValue =
        details.release_date || details.first_air_date || "";

      const year = dateValue
        ? dateValue.slice(0, 4)
        : "Year unavailable";

      const runtime = details.runtime
        ? `${details.runtime} min`
        : details.episode_run_time?.[0]
          ? `${details.episode_run_time[0]} min/episode`
          : "";

      let age = "";

      if (type === "movie") {
        age = details.release_dates?.results
          ?.find(x => x.iso_3166_1 === "US")
          ?.release_dates?.find(x => x.certification)?.certification || "";
      } else {
        age = details.content_ratings?.results
          ?.find(x => x.iso_3166_1 === "US")?.rating || "";
      }

      meta.textContent = [
        year,
        runtime,
        age ? `Rated ${age}` : ""
      ].filter(Boolean).join(" • ");
    }

    const genres = $("modal-genres");

    if (genres) {
      genres.textContent = (details.genres || [])
        .map(genre => genre.name)
        .join(" • ");
    }

    await loadRecommendations(item, type);
  }

  // ------------------------------
  // Recommendations
  // ------------------------------

  async function loadRecommendations(item, type) {
    const list = $("recommendations-list");
    if (!list) return;

    const data = await fetchJSON(
      apiURL(`/${type}/${item.id}/recommendations`)
    );

    if (currentItem?.id !== item.id) return;

    list.replaceChildren();

    (data?.results || [])
      .filter(suggestion => suggestion.poster_path)
      .slice(0, 10)
      .forEach(suggestion => {
        const card = createCard(suggestion);
        if (card) list.appendChild(card);
      });

    if (!list.children.length) {
      const empty = document.createElement("p");
      empty.className = "recommendations-empty";
      empty.textContent = "No recommendations available yet.";
      list.appendChild(empty);
    }
  }

  // ------------------------------
  // Close modal
  // ------------------------------

  function closeModal() {
    const video = $("modal-video");

    if (video) video.src = "";

    if (video?.parentElement) {
      video.parentElement
        .querySelector(".prime-play-overlay")
        ?.remove();

      video.parentElement.style.removeProperty("--movie-poster");
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
  // Direct advertisement
  // ------------------------------

  function openDirectAd() {
    try {
      const url = new URL(DIRECT_AD_LINK);

      if (url.protocol !== "https:") return;

      window.open(
        url.href,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Invalid ads URL:", error);
    }
  }

  // ------------------------------
  // Watch Now overlay
  // ------------------------------

  function createPlayOverlay(video, movieURL) {
    const wrapper = video.parentElement;
    if (!wrapper) return;

    wrapper.querySelector(".prime-play-overlay")?.remove();

    wrapper.classList.add("player-wrapper");
    wrapper.style.position = "relative";
    wrapper.style.isolation = "isolate";
    wrapper.style.overflow = "hidden";

    video.src = "";
    video.style.position = "relative";
    video.style.zIndex = "4";
    video.style.backgroundColor = "transparent";

    const overlay = document.createElement("div");
    overlay.className = "prime-play-overlay";

    Object.assign(overlay.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
      background: "transparent",
      zIndex: "10"
    });

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "WATCH NOW";
    button.setAttribute("aria-label", "Watch now");

    Object.assign(button.style, {
      padding: "14px 28px",
      background: "linear-gradient(135deg,#ff2638,#a90010)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.2)",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "800",
      cursor: "pointer",
      boxShadow: "0 0 25px rgba(237,16,32,.4)",
      position: "relative",
      zIndex: "11"
    });

    button.addEventListener("click", () => {
      openDirectAd();

      video.src = movieURL;
      overlay.remove();

      const message = $("player-message");
      if (message) message.textContent = "Loading video...";
    });

    overlay.appendChild(button);
    wrapper.appendChild(overlay);
  }

  // ------------------------------
  // Change server / episode
  // ------------------------------

  function changeServer(season = 1, episode = 1) {
    if (!currentItem) return;

    const video = $("modal-video");
    const id = currentItem.id;
    const isMovie = Boolean(currentItem.title);

    if (!id || !video) return;

    const safeSeason = Math.max(1, parseInt(season, 10) || 1);
    const safeEpisode = Math.max(1, parseInt(episode, 10) || 1);

    const server = $("server")?.value || "vidsrc";
    const playerBase = server === "vidsrc"
      ? PLAYER_BASE
      : PLAYER_BASE;

    const movieURL = isMovie
      ? `${playerBase}/movie/${id}`
      : `${playerBase}/tv/${id}/${safeSeason}/${safeEpisode}`;

    setPlayerPoster(currentItem);
    createPlayOverlay(video, movieURL);

    const message = $("player-message");
    if (message) message.textContent = "";
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

  $("hamburger")?.addEventListener("click", toggleNav);
  $("close-modal")?.addEventListener("click", closeModal);

  $("modal")?.addEventListener("click", event => {
    if (event.target === $("modal")) closeModal();
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      $("modal")?.classList.contains("show")
    ) {
      closeModal();
    }
  });

  $("hero-play")?.addEventListener("click", () => {
    if (heroItem) showDetails(heroItem);
  });

  $("server")?.addEventListener("change", () => {
    if (currentItem) {
      changeServer(
        $("season")?.value || 1,
        $("episode")?.value || 1
      );
    }
  });

  $("play-episode")?.addEventListener("click", () => {
    changeServer(
      $("season")?.value || 1,
      $("episode")?.value || 1
    );
  });

  $("search-input")?.addEventListener("input", event => {
    clearTimeout(searchTimer);

    const query = event.target.value;

    searchTimer = setTimeout(
      () => searchTMDB(query),
      300
    );
  });

  init();
})();
