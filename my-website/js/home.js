const API_KEY = "e34316a6fe456fe22b50c4033980b236";
const BASE = "https://api.themoviedb.org/3";

/* IMPORTANT: IMAGE PROXY (PARA LUMABAS SA CLOUDFLARE) */
const IMG = "https://image.tmdb.workers.dev/https://image.tmdb.org/t/p/";

let currentItem = null;

/* ================= FETCH ================= */

async function fetchTrending(type){
  const res = await fetch(`${BASE}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results || [];
}

async function fetchTrendingAnime(){
  const res = await fetch(
    `${BASE}/discover/tv?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc`
  );
  const data = await res.json();
  return data.results || [];
}

/* ================= MODAL ================= */

function showDetails(item){
  currentItem = item;

  document.getElementById("modal").style.display = "flex";
  document.getElementById("modal-title").innerText =
    item.title || item.name || "Untitled";
  document.getElementById("modal-description").innerText =
    item.overview || "No description available.";
  document.getElementById("modal-image").src =
    IMG + "w500" + item.poster_path;

  changeServer();
}

function changeServer(){
  if(!currentItem) return;

  const server = document.getElementById("server").value;
  const type =
    currentItem.media_type ||
    (currentItem.title ? "movie" : "tv");

  const season = 1;
  const episode = 1;
  const lang = "en";

  let url = "";

  if(type === "movie"){
    url = server === "zxc-player"
      ? `https://zxcstream.xyz/player/movie/${currentItem.id}/${lang}`
      : `https://zxcstream.xyz/embed/movie/${currentItem.id}`;
  } else {
    url = server === "zxc-player"
      ? `https://zxcstream.xyz/player/tv/${currentItem.id}/${season}/${episode}/${lang}`
      : `https://zxcstream.xyz/embed/tv/${currentItem.id}/${season}/${episode}`;
  }

  document.getElementById("modal-video").src = url;
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-video").src = "";
}

/* ================= SEARCH ================= */

function openSearchModal(){
  document.getElementById("search-modal").style.display = "flex";
}
function closeSearchModal(){
  document.getElementById("search-modal").style.display = "none";
}

async function searchTMDB(){
  const q = document.getElementById("search-input").value;
  if(!q) return;

  const res = await fetch(
    `${BASE}/search/multi?api_key=${API_KEY}&query=${q}`
  );
  const data = await res.json();

  const results = document.getElementById("search-results");
  results.innerHTML = "";

  data.results.forEach(item=>{
    if(!item.poster_path) return;

    const img = document.createElement("img");
    img.src = IMG + "w500" + item.poster_path;
    img.onclick = ()=>showDetails(item);
    results.appendChild(img);
  });
}

/* ================= INIT (HOME) ================= */

async function init(){
  const movies = await fetchTrending("movie");
  const tv = await fetchTrending("tv");
  const anime = await fetchTrendingAnime();

  const movieList = document.getElementById("movies-list");
  const tvList = document.getElementById("tvshows-list");
  const animeList = document.getElementById("anime-list");

  movies.forEach(m=>{
    if(!m.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + "w500" + m.poster_path;
    img.onclick = ()=>showDetails({...m, media_type:"movie"});
    movieList.appendChild(img);
  });

  tv.forEach(t=>{
    if(!t.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + "w500" + t.poster_path;
    img.onclick = ()=>showDetails({...t, media_type:"tv"});
    tvList.appendChild(img);
  });

  anime.forEach(a=>{
    if(!a.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + "w500" + a.poster_path;
    img.onclick = ()=>showDetails({...a, media_type:"tv"});
    animeList.appendChild(img);
  });

  /* BANNER */
  if(movies.length && movies[0].backdrop_path){
    document.getElementById("banner").style.backgroundImage =
      `url(${IMG + "original" + movies[0].backdrop_path})`;
    document.getElementById("banner-title").innerText =
      movies[0].title;
  }
}

document.addEventListener("DOMContentLoaded", init);
