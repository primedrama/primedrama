(function () {
  const __x = ["e343","16a6","fe45","6fe2","2b50","c403","3980","b236"];
  window.__APP_CFG = __x.join("");
})();

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/original";
const API_KEY = window.__APP_CFG;
let currentItem = null;

/* NAVBAR SCROLL */
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  nav.classList.toggle("scrolled", window.scrollY > 20);
});

function toggleNav() {
  const menu = document.getElementById("mobile-menu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

/* FETCH */
async function fetchJSON(url){ 
  const res = await fetch(url); 
  return res.ok ? res.json() : null; 
}

async function fetchTrending(type){ 
  const data = await fetchJSON(`${BASE}/trending/${type}/week?api_key=${API_KEY}`); 
  if(!data?.results) return [];
  if(type === "tv") return data.results.filter(tv => !tv.genre_ids.includes(16));
  return data.results;
}

async function fetchTrendingAnime(){ 
  const data = await fetchJSON(`${BASE}/trending/tv/week?api_key=${API_KEY}`);
  return data?.results.filter(tv => tv.original_language === "ja" && tv.genre_ids.includes(16)) || [];
}

/* UI */
function displayBanner(item){
  const banner = document.getElementById("banner");
  const titleEl = document.getElementById("banner-title");
  const overviewEl = document.getElementById("banner-overview");
  if(!banner || !item) return;
  banner.style.backgroundImage = `url(${IMG}${item.backdrop_path})`;
  titleEl.textContent = item.title || item.name || "";
  overviewEl.textContent = item.overview || "No description available.";
}

function createCard(item){
  if(!item.poster_path) return null;
  const card = document.createElement("div");
  card.className = "card";
  card.onclick = () => showDetails(item);

  const img = document.createElement("img");
  img.src = IMG + item.poster_path;
  card.appendChild(img);

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = item.title || item.name || "";
  card.appendChild(title);

  return card;
}

function displayList(items, id){
  const container = document.getElementById(id);
  if(!container) return;
  container.innerHTML = "";
  items.forEach(item => { 
    const card = createCard(item); 
    if(card) container.appendChild(card); 
  });
}

/* MODAL */
function showDetails(item){
  currentItem = item;
  const modal = document.getElementById("modal");
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  document.getElementById("modal-title").textContent = item.title || item.name || "";
  document.getElementById("modal-description").textContent = item.overview || "No description available.";
  document.getElementById("modal-rating").textContent = item.vote_average ? "★".repeat(Math.round(item.vote_average/2)) : "";

  document.getElementById("info-wrapper").style.backgroundImage = `url(${IMG}${item.poster_path})`;
  document.getElementById("server").value = "embed";
  changeServer();
}

function closeModal(){
  document.getElementById("modal").style.display = "none";
  document.getElementById("modal-video").src = "";
  document.body.style.overflow = "";
}

/* PLAYER */
function changeServer(){
  if(!currentItem) return;
  const id = currentItem.id;
  const isMovie = !!currentItem.title;
  const url = isMovie ? `https://zxcstream.xyz/embed/movie/${id}` : `https://zxcstream.xyz/embed/tv/${id}/1/1`;
  document.getElementById("modal-video").src = url;
}

/* SEARCH */
async function searchTMDB(q){
  const section = document.getElementById("search-section");
  const el = document.getElementById("search-results");
  if(!q){ section.hidden = true; return; }

  const data = await fetchJSON(`${BASE}/search/multi?api_key=${API_KEY}&query=${q}`);
  el.innerHTML = ""; 
  section.hidden = false; 
  section.scrollIntoView({behavior:"smooth"});
  data?.results.forEach(item => { 
    const card = createCard(item); 
    if(card) el.appendChild(card); 
  });
}

/* SOCIAL SHARE */
const siteURL = encodeURIComponent("https://primedrama-19t.pages.dev/");
const siteTitle = encodeURIComponent("Check out PrimeDrama - Watch trending movies, TV shows, and anime!");

function shareFacebook(){ window.open(`https://www.facebook.com/sharer/sharer.php?u=${siteURL}`, '_blank'); }
function shareTwitter(){ window.open(`https://twitter.com/intent/tweet?url=${siteURL}&text=${siteTitle}`, '_blank'); }
function shareInstagram(){ alert("Instagram does not support direct website sharing. Copy the link instead."); }
function shareTikTok(){ alert("TikTok does not support direct website sharing. Copy the link instead."); }

/* RECOMMENDED FOR YOU RANDOM WITH CLICK PLAY */
async function displayRecommended(){
  const data = await fetchTrending("movie");
  if(!data.length) return;
  const container = document.getElementById("recommended-list");
  container.innerHTML = "";

  // Pick 6 random unique items
  const picked = [];
  while(picked.length < 6 && picked.length < data.length){
    const rand = data[Math.floor(Math.random() * data.length)];
    if(!picked.includes(rand)) picked.push(rand);
  }

  picked.forEach(item => {
    const div = document.createElement("div");
    div.className = "list-item";

    const img = document.createElement("img");
    img.src = IMG + item.poster_path;

    // Add click to play
    div.onclick = () => showDetails(item);

    div.appendChild(img);
    container.appendChild(div);
  });
}

/* INIT */
async function init(){
  const [movies, tvAll, anime] = await Promise.all([
    fetchTrending("movie"),
    fetchTrending("tv"),
    fetchTrendingAnime()
  ]);

  displayBanner(movies[0]);
  displayList(movies, "movies-list");
  displayList(tvAll, "tvshows-list");
  displayList(anime, "anime-list");
  displayRecommended();
}
init();


