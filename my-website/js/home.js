const API_KEY = atob('ZTM0MzE2YTZmZTQ1NmZlMjJiNTBjNDAzMzk4MGIzMjY=');
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

// ================= FETCH FUNCTIONS =================
async function safeFetch(url){
  try {
    const res = await fetch(url);
    if(!res.ok) throw new Error("API error");
    return await res.json();
  } catch(e){
    console.error(e);
    return null;
  }
}

async function fetchTrending(type){
  const data = await safeFetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  return data?.results || [];
}

async function fetchTrendingAnime(){
  const pages = [1,2,3].map(p => safeFetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`));
  const results = (await Promise.all(pages))
    .flatMap(d => d?.results || [])
    .filter(i => i.original_language==='ja' && i.genre_ids.includes(16));
  return results;
}

// ================= DISPLAY FUNCTIONS =================
function displayBanner(item){
  if(!item) return;
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title||item.name;
}

function displayList(items, containerId){
  const container = document.getElementById(containerId);
  container.innerHTML="";
  if(!items || !items.length) {
    container.innerHTML = "<p style='color:var(--gray-muted)'>No content available.</p>";
    return;
  }

  items.forEach(item=>{
    if(!item.poster_path) return;
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title||item.name;
    img.onclick = ()=>showDetails({...item, media_type: containerId==='movies-list'?'movie':'tv'});
    container.appendChild(img);
  });
}

// ================= MODAL =================
function showDetails(item){
  if(!item) return;
  currentItem=item;
  document.body.style.overflow="hidden";

  const posterURL = `${IMG_URL}${item.poster_path}`;
  document.querySelector('.poster-bg').style.backgroundImage = `url(${posterURL})`;

  document.getElementById('modal-title').textContent=item.title||item.name;
  document.getElementById('modal-description').textContent=item.overview || "No description available.";
  document.getElementById('modal-rating').textContent=item.vote_average ? '★'.repeat(Math.round(item.vote_average/2)) : "N/A";

  document.getElementById('modal').style.display='flex';
  changeServer();
}

function closeModal(){
  document.body.style.overflow="";
  document.getElementById('modal').style.display='none';
  document.getElementById('modal-video').src='';
}

// ================= PLAYER (Server 2 forced) =================
function changeServer(){
  if(!currentItem) return;
  const isMovie = currentItem.media_type==="movie";
  const season=1, episode=1;
  const embedURL = isMovie
    ? `https://zxcstream.xyz/embed/movie/${currentItem.id}`
    : `https://zxcstream.xyz/embed/tv/${currentItem.id}/${season}/${episode}`;
  document.getElementById('modal-video').src=embedURL;
}

// ================= SEARCH =================
function openSearchModal(){
  document.getElementById('search-modal').style.display='flex';
  document.getElementById('search-input').focus();
}
function closeSearchModal(){
  document.getElementById('search-modal').style.display='none';
  document.getElementById('search-results').innerHTML='';
}
async function searchTMDB(){
  const query=document.getElementById('search-input').value.trim();
  if(!query) return;
  const data = await safeFetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
  if(!data || !data.results) return;
  const container=document.getElementById('search-results');
  container.innerHTML="";
  data.results.forEach(item=>{
    if(!item.poster_path) return;
    const img=document.createElement('img');
    img.src=`${IMG_URL}${item.poster_path}`;
    img.alt=item.title||item.name;
    img.onclick=()=>{
      closeSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

// ================= INIT =================
async function init(){
  const movies = await fetchTrending('movie');
  const tv = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  if(movies.length) displayBanner(movies[Math.floor(Math.random()*movies.length)]);
  displayList(movies,'movies-list');
  displayList(tv,'tvshows-list');
  displayList(anime,'anime-list');
}
init();

