
(() => {
  "use strict";

  const BASE = "https://api.themoviedb.org/3";
  const IMG = "https://image.tmdb.org/t/p/original";
  const POSTER = "https://image.tmdb.org/t/p/w500";

  const DIRECT_AD_LINK =
    "https://directyp.org/4/aaa4649f8b7c3dfb008b8bfb6e3e05d2";

  const VIDEO_SERVERS = [
    {
      name: "Server 1",
      movie: id => `https://vidsrc.sh/embed/movie/${id}`,
      tv: (id, season, episode) =>
        `https://vidsrc.sh/embed/tv/${id}/${season}/${episode}`
    },
    {
      name: "Server 2",
      movie: id => `https://embed.vidrift.net/embed/movie/${id}`,
      tv: (id, season, episode) =>
        `https://embed.vidrift.net/embed/tv/${id}/${season}/${episode}`
    },
    {
      name: "Server 3",
      movie: id => `https://embedwave.cc/embed/movie/${id}`,
      tv: (id, season, episode) =>
        `https://embedwave.cc/embed/tv/${id}/${season}/${episode}`
    }
  ];

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
  let playbackStarted = false;

  let currentSeason = 1;
  let currentEpisode = 1;
  let seasonEpisodes = [];
  let episodeRequestNumber = 0;

  const $ = id => document.getElementById(id);

  const GENRE_NAMES = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
    10759: "Action & Adventure",
    10762: "Kids",
    10763: "News",
    10764: "Reality",
    10765: "Sci-Fi & Fantasy",
    10766: "Soap",
    10767: "Talk",
    10768: "War & Politics"
  };

  // =========================================
  // TMDB API
  // =========================================

  function apiURL(path, params = {}) {
    const url = new URL(`${BASE}${path}`);

    url.searchParams.set("api_key", API_KEY);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
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

  // =========================================
  // ANIME — MULTIPLE PAGES
  // =========================================

  async function fetchTrendingAnime() {
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map(page =>
        fetchJSON(apiURL("/discover/tv", {
          with_original_language: "ja",
          with_genres: 16,
          sort_by: "popularity.desc",
          page
        }))
      )
    );

    const results = pages.flatMap(data => data?.results || []);

    return [...new Map(
      results.map(item => [item.id, item])
    ).values()].filter(item => item.poster_path);
  }

  // =========================================
  // PHILIPPINE MOVIES — ALL RATINGS
  // =========================================

  async function fetchPHMovies() {
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map(page =>
        fetchJSON(apiURL("/discover/movie", {
          with_origin_country: "PH",
          sort_by: "popularity.desc",
          include_adult: true,
          page
        }))
      )
    );

    const results = pages.flatMap(data => data?.results || []);

    const uniqueMovies = [
      ...new Map(
        results.map(item => [item.id, item])
      ).values()
    ];

    return uniqueMovies
      .filter(item => item.poster_path)
      .sort((a, b) =>
        (Number(b.popularity) || 0) -
        (Number(a.popularity) || 0)
      );
  }

  // =========================================
  // NAVIGATION
  // =========================================

  function toggleNav() {
    const menu = $("mobile-menu");
    const hamburger = $("hamburger");

    if (!menu) return;

    const isOpen = menu.classList.toggle("open");

    menu.classList.toggle("active", isOpen);

    hamburger?.setAttribute(
      "aria-expanded",
      String(isOpen)
    );
  }

  function setupNavigationLinks() {
    document.querySelectorAll("#mobile-menu a").forEach(link => {
      link.addEventListener("click", () => {
        const menu = $("mobile-menu");

        menu?.classList.remove("open", "active");

        $("hamburger")?.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });
  }

  // =========================================
  // HOMEPAGE BANNER
  // =========================================

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

  // =========================================
  // MOVIE CARDS
  // =========================================

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

    const dateValue =
      item.release_date || item.first_air_date || "";

    const year = dateValue
      ? dateValue.slice(0, 4)
      : "Year N/A";

    const score = Number(item.vote_average) || 0;

    const yearEl = document.createElement("span");

    yearEl.className = "card-year";
    yearEl.textContent = year;

    const ratingEl = document.createElement("span");

    ratingEl.className = "card-rating";
    ratingEl.textContent = score
      ? `★ ${score.toFixed(1)}`
      : "—";

    meta.append(yearEl, ratingEl);
    info.append(title, meta);
    card.append(img, info);

    card.addEventListener("click", () => {
      showDetails(item);
    });

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

    (items || []).forEach(item => {
      const card = createCard(item);

      if (card) {
        container.appendChild(card);
      }
    });
  }

  // =========================================
  // PLAYER POSTER BACKGROUND
  // =========================================

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

  // =========================================
  // VIDEO SERVERS
  // =========================================

  function setupServers() {
    const select = $("server");

    if (!select) return;

    select.replaceChildren();

    VIDEO_SERVERS.forEach((server, index) => {
      const option = document.createElement("option");

      option.value = String(index);
      option.textContent = server.name;

      select.appendChild(option);
    });

    select.value = "0";
  }

  function getSelectedServer() {
    const select = $("server");

    const index = Number.parseInt(
      select?.value ?? "0",
      10
    );

    if (!Number.isInteger(index) || !VIDEO_SERVERS[index]) {
      return VIDEO_SERVERS[0];
    }

    return VIDEO_SERVERS[index];
  }

  // =========================================
  // EPISODE CONTROLS UI
  // =========================================

  function setupEpisodeInterface() {
    const video = $("modal-video");

    if (!video?.parentElement) return;

    let panel = $("episode-navigation");

    if (panel) return;

    panel = document.createElement("section");
    panel.id = "episode-navigation";
    panel.className = "episode-navigation";
    panel.hidden = true;

    panel.innerHTML = `
      <div class="episode-navigation-header">
        <h3>Episodes</h3>
        <span id="episode-count">Loading episodes...</span>
      </div>

      <div class="episode-navigation-buttons">
        <button
          type="button"
          id="previous-episode"
          class="episode-prev"
        >
          ‹ Previous
        </button>

        <button
          type="button"
          id="next-episode"
          class="episode-next"
        >
          Next ›
        </button>
      </div>

      <div
        id="episode-list"
        class="episode-list"
        aria-label="Episode selection"
      ></div>
    `;

    video.parentElement.insertAdjacentElement(
      "afterend",
      panel
    );

    $("previous-episode")?.addEventListener(
      "click",
      playPreviousEpisode
    );

    $("next-episode")?.addEventListener(
      "click",
      playNextEpisode
    );
  }

  function setEpisodeInterfaceVisible(visible) {
    setupEpisodeInterface();

    const panel = $("episode-navigation");

    if (panel) {
      panel.hidden = !visible;
    }
  }

  // =========================================
  // LOAD SEASON EPISODES
  // =========================================

  async function loadSeasonEpisodes(seasonNumber, preferredEpisode = 1) {
    if (!currentItem || currentItem.title) return;

    const selectedSeason = Math.max(
      1,
      parseInt(seasonNumber, 10) || 1
    );

    const requestId = ++episodeRequestNumber;

    currentSeason = selectedSeason;

    const list = $("episode-list");
    const count = $("episode-count");

    if (list) {
      list.replaceChildren();
    }

    if (count) {
      count.textContent = "Loading episodes...";
    }

    const data = await fetchJSON(
      apiURL(`/tv/${currentItem.id}/season/${selectedSeason}`)
    );

    if (
      requestId !== episodeRequestNumber ||
      !currentItem ||
      currentItem.title
    ) {
      return;
    }

    seasonEpisodes = (data?.episodes || [])
      .filter(episode => Number(episode.episode_number) > 0);

    if (!seasonEpisodes.length) {
      if (count) {
        count.textContent = "No episodes available.";
      }

      if (list) {
        list.replaceChildren();
      }

      updateEpisodeButtons();
      return;
    }

    const requested = seasonEpisodes.find(
      episode => episode.episode_number === Number(preferredEpisode)
    );

    currentEpisode = requested
      ? requested.episode_number
      : seasonEpisodes[0].episode_number;

    renderEpisodeList();
    updateEpisodeButtons();

    if (count) {
      count.textContent =
        `${seasonEpisodes.length} episodes`;
    }

    if ($("season")) {
      $("season").value = currentSeason;
    }

    if ($("episode")) {
      $("episode").value = currentEpisode;
    }
  }

  // =========================================
  // RENDER EPISODE LIST
  // =========================================

  function renderEpisodeList() {
    const list = $("episode-list");

    if (!list) return;

    list.replaceChildren();

    seasonEpisodes.forEach(episode => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "episode-item";

      if (episode.episode_number === currentEpisode) {
        button.classList.add("active");
      }

      const episodeName =
        episode.name || `Episode ${episode.episode_number}`;

      button.textContent =
        `EP ${episode.episode_number} · ${episodeName}`;

      button.setAttribute(
        "aria-label",
        `Play episode ${episode.episode_number}: ${episodeName}`
      );

      button.addEventListener("click", () => {
        playEpisode(currentSeason, episode.episode_number);
      });

      list.appendChild(button);
    });

    const active = list.querySelector(".episode-item.active");

    active?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }

  // =========================================
  // EPISODE NAVIGATION
  // =========================================

  function updateEpisodeButtons() {
    const previous = $("previous-episode");
    const next = $("next-episode");

    if (!previous || !next) return;

    const index = seasonEpisodes.findIndex(
      episode => episode.episode_number === currentEpisode
    );

    previous.disabled =
      index <= 0 && currentSeason <= 1;

    next.disabled =
      index < 0 || index >= seasonEpisodes.length - 1;
  }

  async function playEpisode(season, episode) {
    if (!currentItem || currentItem.title) return;

    const selectedSeason = Math.max(
      1,
      parseInt(season, 10) || 1
    );

    const selectedEpisode = Math.max(
      1,
      parseInt(episode, 10) || 1
    );

    currentSeason = selectedSeason;
    currentEpisode = selectedEpisode;

    if ($("season")) {
      $("season").value = selectedSeason;
    }

    if ($("episode")) {
      $("episode").value = selectedEpisode;
    }

    const existingEpisode = seasonEpisodes.find(
      item => item.episode_number === selectedEpisode
    );

    if (!existingEpisode || selectedSeason !== Number($("season")?.value)) {
      await loadSeasonEpisodes(selectedSeason, selectedEpisode);
    }

    renderEpisodeList();
    updateEpisodeButtons();

    changeServer(currentSeason, currentEpisode);
  }

  async function playPreviousEpisode() {
    if (!currentItem || currentItem.title) return;

    const index = seasonEpisodes.findIndex(
      episode => episode.episode_number === currentEpisode
    );

    if (index > 0) {
      await playEpisode(
        currentSeason,
        seasonEpisodes[index - 1].episode_number
      );

      return;
    }

    if (currentSeason > 1) {
      await loadSeasonEpisodes(currentSeason - 1, 1);

      if (seasonEpisodes.length) {
        const lastEpisode =
          seasonEpisodes[seasonEpisodes.length - 1];

        await playEpisode(
          currentSeason,
          lastEpisode.episode_number
        );
      }
    }
  }

  async function playNextEpisode() {
    if (!currentItem || currentItem.title) return;

    const index = seasonEpisodes.findIndex(
      episode => episode.episode_number === currentEpisode
    );

    if (index >= 0 && index < seasonEpisodes.length - 1) {
      await playEpisode(
        currentSeason,
        seasonEpisodes[index + 1].episode_number
      );

      return;
    }

    const nextSeason = currentSeason + 1;

    const details = await fetchJSON(
      apiURL(`/tv/${currentItem.id}/season/${nextSeason}`)
    );

    if (!details?.episodes?.length) return;

    await loadSeasonEpisodes(nextSeason, 1);
    await playEpisode(nextSeason, 1);
  }

  // =========================================
  // MOVIE DETAILS MODAL
  // =========================================

  function showDetails(item) {
    if (!item) return;

    currentItem = item;
    playbackStarted = false;

    currentSeason = 1;
    currentEpisode = 1;
    seasonEpisodes = [];

    episodeRequestNumber++;

    lastFocusedElement = document.activeElement;

    const modal = $("modal");

    if (!modal) return;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    document.documentElement.style.overflow = "hidden";

    const banner = $("banner");

    if (banner) {
      banner.style.visibility = "hidden";
    }

    const title = $("modal-title");
    const description = $("modal-description");
    const rating = $("modal-rating");
    const meta = $("modal-meta");
    const genres = $("modal-genres");
    const recommendations = $("recommendations-list");
    const shareMessage = $("share-message");

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

    const dateValue =
      item.release_date || item.first_air_date || "";

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

    if (shareMessage) {
      shareMessage.textContent = "";
    }

    setPlayerPoster(item);
    loadTitleExtras(item);

    const episodeControls = $("episode-controls");

    if (episodeControls) {
      episodeControls.hidden = isMovie;
    }

    setEpisodeInterfaceVisible(!isMovie);

    if ($("season")) $("season").value = 1;
    if ($("episode")) $("episode").value = 1;
    if ($("server")) $("server").value = "0";

    changeServer(1, 1);

    if (!isMovie) {
      loadSeasonEpisodes(1, 1);
    }

    $("close-modal")?.focus();
  }

  // =========================================
  // EXTRA MOVIE DETAILS
  // =========================================

  async function loadTitleExtras(item) {
    const type = item.title ? "movie" : "tv";

    const details = await fetchJSON(
      apiURL(`/${type}/${item.id}`, {
        append_to_response: "release_dates,content_ratings"
      })
    );

    if (
      !details ||
      currentItem?.id !== item.id ||
      Boolean(currentItem?.title) !== Boolean(item.title)
    ) {
      return;
    }

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
        const releaseResults =
          details.release_dates?.results || [];

        const phRelease = releaseResults.find(
          item => item.iso_3166_1 === "PH"
        );

        const usRelease = releaseResults.find(
          item => item.iso_3166_1 === "US"
        );

        age =
          phRelease?.release_dates?.find(
            item => item.certification
          )?.certification ||
          usRelease?.release_dates?.find(
            item => item.certification
          )?.certification ||
          "";

      } else {
        const ratings =
          details.content_ratings?.results || [];

        age =
          ratings.find(
            item => item.iso_3166_1 === "PH"
          )?.rating ||
          ratings.find(
            item => item.iso_3166_1 === "US"
          )?.rating ||
          "";
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

  // =========================================
  // RECOMMENDATIONS
  // =========================================

  async function loadRecommendations(item, type) {
    const list = $("recommendations-list");

    if (!list) return;

    const data = await fetchJSON(
      apiURL(`/${type}/${item.id}/recommendations`)
    );

    if (
      currentItem?.id !== item.id ||
      Boolean(currentItem?.title) !== Boolean(item.title)
    ) {
      return;
    }

    list.replaceChildren();

    (data?.results || [])
      .filter(suggestion => suggestion.poster_path)
      .slice(0, 10)
      .forEach(suggestion => {
        const card = createCard(suggestion);

        if (card) {
          list.appendChild(card);
        }
      });

    if (!list.children.length) {
      const empty = document.createElement("p");

      empty.className = "recommendations-empty";
      empty.textContent = "No recommendations available yet.";

      list.appendChild(empty);
    }
  }

  // =========================================
  // CLOSE MODAL
  // =========================================

  function closeModal() {
    const video = $("modal-video");

    if (video) {
      video.src = "";
    }

    if (video?.parentElement) {
      video.parentElement
        .querySelector(".prime-play-overlay")
        ?.remove();

      video.parentElement.style.removeProperty(
        "--movie-poster"
      );
    }

    const modal = $("modal");

    if (modal) {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    }

    const banner = $("banner");

    if (banner) {
      banner.style.visibility = "visible";
    }

    document.documentElement.style.overflow = "";

    currentItem = null;
    playbackStarted = false;

    seasonEpisodes = [];
    episodeRequestNumber++;

    requestNumber++;

    if (lastFocusedElement?.focus) {
      lastFocusedElement.focus();
    }
  }

  // =========================================
  // DIRECT ADVERTISEMENT
  // =========================================

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

  // =========================================
  // BUILD PLAYER URL
  // =========================================

  function getPlayerURL(season = 1, episode = 1) {
    if (!currentItem) return "";

    const id = currentItem.id;
    const isMovie = Boolean(currentItem.title);

    const safeSeason = Math.max(
      1,
      parseInt(season, 10) || 1
    );

    const safeEpisode = Math.max(
      1,
      parseInt(episode, 10) || 1
    );

    const server = getSelectedServer();

    return isMovie
      ? server.movie(id)
      : server.tv(id, safeSeason, safeEpisode);
  }

  // =========================================
  // WATCH NOW OVERLAY
  // =========================================

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

      playbackStarted = true;
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

  // =========================================
  // CHANGE SERVER / EPISODE
  // =========================================

  function changeServer(season = 1, episode = 1) {
    if (!currentItem) return;

    const video = $("modal-video");

    if (!video) return;

    const movieURL = getPlayerURL(season, episode);

    if (!movieURL) return;

    setPlayerPoster(currentItem);

    const message = $("player-message");

    if (playbackStarted) {
      video.src = movieURL;

      video.parentElement
        ?.querySelector(".prime-play-overlay")
        ?.remove();

      if (message) {
        message.textContent = "Switching server...";
      }

      return;
    }

    createPlayOverlay(video, movieURL);

    if (message) {
      message.textContent = "";
    }
  }

  // =========================================
  // SHARE MOVIE
  // =========================================

  function getMovieShareURL() {
    if (!currentItem) {
      return window.location.href;
    }

    const url = new URL(window.location.href);

    url.searchParams.set("movie", currentItem.id);
    url.searchParams.set(
      "type",
      currentItem.title ? "movie" : "tv"
    );

    return url.href;
  }

  async function copyMovieLink() {
    if (!currentItem) return;

    const shareURL = getMovieShareURL();
    const message = $("share-message");

    try {
      await navigator.clipboard.writeText(shareURL);

      if (message) {
        message.textContent = "Movie link copied!";
      }

    } catch (error) {
      const input = document.createElement("textarea");

      input.value = shareURL;
      input.style.position = "fixed";
      input.style.opacity = "0";

      document.body.appendChild(input);

      input.select();

      const copied = document.execCommand("copy");

      input.remove();

      if (message) {
        message.textContent = copied
          ? "Movie link copied!"
          : "Unable to copy link.";
      }
    }
  }

  function shareCurrentMovie(platform) {
    if (!currentItem) return;

    const title =
      currentItem.title || currentItem.name || "Movie";

    const shareURL = getMovieShareURL();

    const text = `Watch ${title} on PrimeDrama!`;

    const encodedURL = encodeURIComponent(shareURL);
    const encodedText = encodeURIComponent(text);

    const message = $("share-message");

    if (message) {
      message.textContent = "";
    }

    const shareLinks = {
      facebook:
        `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,

      messenger:
        `https://www.facebook.com/dialog/send?link=${encodedURL}`,

      whatsapp:
        `https://wa.me/?text=${encodedText}%20${encodedURL}`,

      twitter:
        `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedURL}`
    };

    if (platform === "copy") {
      copyMovieLink();
      return;
    }

    const shareLink = shareLinks[platform];

    if (!shareLink) return;

    window.open(
      shareLink,
      "_blank",
      "noopener,noreferrer,width=650,height=550"
    );
  }

  function setupShareButtons() {
    document.querySelectorAll("[data-share]").forEach(button => {
      button.addEventListener("click", () => {
        shareCurrentMovie(button.dataset.share);
      });
    });
  }

  // =========================================
  // OPEN MOVIE FROM SHARED LINK
  // =========================================

  async function openSharedMovie() {
    const params = new URLSearchParams(window.location.search);

    const movieId = params.get("movie");
    const type = params.get("type");

    if (!movieId || !["movie", "tv"].includes(type)) {
      return;
    }

    if (!/^\d+$/.test(movieId)) {
      return;
    }

    const details = await fetchJSON(
      apiURL(`/${type}/${movieId}`)
    );

    if (!details) return;

    const item = {
      ...details,
      media_type: type,
      genre_ids: details.genres?.map(genre => genre.id) || []
    };

    showDetails(item);
  }

  // =========================================
  // SEARCH
  // =========================================

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
      apiURL("/search/multi", {
        query: q
      })
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

      if (card) {
        results.appendChild(card);
      }
    });

    if (!items.length) {
      const message = document.createElement("p");

      message.textContent = "No results found.";

      results.appendChild(message);
    }
  }

  // =========================================
  // INITIALIZE HOMEPAGE
  // =========================================

  async function init() {
    const year = $("year");

    if (year) {
      year.textContent = new Date().getFullYear();
    }

    setupServers();
    setupShareButtons();
    setupNavigationLinks();
    setupEpisodeInterface();

    const [
      movies,
      tv,
      anime,
      phMovies
    ] = await Promise.all([
      fetchTrending("movie"),
      fetchTrending("tv"),
      fetchTrendingAnime(),
      fetchPHMovies()
    ]);

    const animeIds = new Set(
      anime.map(item => item.id)
    );

    const regularTV = tv.filter(
      item => !animeIds.has(item.id)
    );

    const cleanTrendingMovies = [
      ...new Map(
        movies
          .filter(item => item?.poster_path)
          .map(item => [item.id, item])
      ).values()
    ];

    const cleanPHMovies = [
      ...new Map(
        phMovies
          .filter(item => item?.poster_path)
          .map(item => [item.id, item])
      ).values()
    ];

    const recommendedMovies = [
      ...new Map(
        [...cleanTrendingMovies, ...cleanPHMovies]
          .map(item => [item.id, item])
      ).values()
    ].sort((a, b) =>
      (Number(b.popularity) || 0) -
      (Number(a.popularity) || 0)
    );

    displayBanner(cleanTrendingMovies[0]);

    displayList(
      cleanTrendingMovies,
      "movies-list"
    );

    displayList(
      cleanPHMovies,
      "ph-movies-list"
    );

    displayList(
      regularTV,
      "tvshows-list"
    );

    displayList(
      anime,
      "anime-list"
    );

    displayList(
      recommendedMovies.slice(0, 10),
      "recommended-list"
    );

    await openSharedMovie();
  }

  // =========================================
  // EVENT LISTENERS
  // =========================================

  $("hamburger")?.addEventListener(
    "click",
    toggleNav
  );

  $("close-modal")?.addEventListener(
    "click",
    closeModal
  );

  $("modal")?.addEventListener("click", event => {
    if (event.target === $("modal")) {
      closeModal();
    }
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
    if (heroItem) {
      showDetails(heroItem);
    }
  });

  $("server")?.addEventListener("change", () => {
    if (currentItem) {
      changeServer(
        currentSeason,
        currentEpisode
      );
    }
  });

  $("season")?.addEventListener("change", () => {
    if (!currentItem || currentItem.title) return;

    const season = Math.max(
      1,
      parseInt($("season").value, 10) || 1
    );

    loadSeasonEpisodes(season, 1);
    changeServer(season, 1);
  });

  $("episode")?.addEventListener("change", () => {
    if (!currentItem || currentItem.title) return;

    playEpisode(
      currentSeason,
      $("episode").value || 1
    );
  });

  $("play-episode")?.addEventListener("click", () => {
    if (!currentItem || currentItem.title) return;

    playEpisode(
      $("season")?.value || currentSeason,
      $("episode")?.value || currentEpisode
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

  // START WEBSITE
  init();

})();
