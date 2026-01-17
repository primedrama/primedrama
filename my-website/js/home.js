const API_KEY = "e34316a6fe456fe22b50c4033980b236";
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";

let currentItem = null;

/* FETCH FUNCTIONS */
async function fetchTrending(type){
  const r = await fetch(`${BASE}/trending/${type}/week?api_key=${API_KEY}`);
  return (await r.json()).results || [];
}

async function fetchTrendingAnime(){
  const r = await fetch(`${BASE}/discover/tv?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc`);
  return (await r.json()).results || [];
}

/* MODAL */
function showDetails(item){
  currentItem = item;
  document.getElementById("modal").style.display = "flex";
  document.getElementById("modal-title").innerText = item.title || item.name;
  document.getElementById("modal-description").innerText = item.overview || "No description available.";
  document.getElementById("modal-image").src = IMG + item.poster_path;
  changeServer();
}

function changeServer(){
  if(!currentItem) return;

  const server = document.getElementById("server").value;
  const type = currentItem.media_type || (currentItem.title ? "movie" : "tv");
  const season = 1, episode = 1, lang = "en";

  let url = "";
  if(type === "movie"){
    url = server === "zxc-player"
      ? `https://zxcstream.xyz/player/movie/${currentItem.id}/${lang}`
      : `https://zxcstream.xyz/embed/movie/${currentItem.id}`;
  }else{
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

/* SEARCH */
function openSearchModal(){
  document.getElementById("search-modal").style.display = "flex";
}
function closeSearchModal(){
  document.getElementById("search-modal").style.display = "none";
}

async function searchTMDB(){
  const q = document.getElementById("search-input").value;
  if(!q) return;

  const r = await fetch(`${BASE}/search/multi?api_key=${API_KEY}&query=${q}`);
  const data = await r.json();

  const res = document.getElementById("search-results");
  res.innerHTML = "";

  data.results.forEach(i=>{
    if(!i.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + i.poster_path;
    img.onclick = ()=>showDetails(i);
    res.appendChild(img);
  });
}

/* INIT */
async function init(){
  const movies = await fetchTrending("movie");
  const tv = await fetchTrending("tv");
  const anime = await fetchTrendingAnime();

  movies.forEach(m=>{
    if(!m.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + m.poster_path;
    img.onclick = ()=>showDetails({...m, media_type:"movie"});
    document.getElementById("movies-list").appendChild(img);
  });

  tv.forEach(t=>{
    if(!t.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + t.poster_path;
    img.onclick = ()=>showDetails({...t, media_type:"tv"});
    document.getElementById("tvshows-list").appendChild(img);
  });

  anime.forEach(a=>{
    if(!a.poster_path) return;
    const img = document.createElement("img");
    img.src = IMG + a.poster_path;
    img.onclick = ()=>showDetails({...a, media_type:"tv"});
    document.getElementById("anime-list").appendChild(img);
  });

  if(movies.length && movies[0].backdrop_path){
    document.getElementById("banner").style.backgroundImage =
      `url(${IMG + movies[0].backdrop_path})`;
    document.getElementById("banner-title").innerText = movies[0].title;
  }
}

document.addEventListener("DOMContentLoaded", init);

