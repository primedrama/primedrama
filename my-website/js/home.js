(function(){
const k=["e343","16a6","fe45","6fe2","2b50","c403","3980","b236"];
window.__APP_CFG=k.join("");
})();

const BASE="https://api.themoviedb.org/3";
const IMG="https://image.tmdb.org/t/p/original";
const API_KEY=window.__APP_CFG;
let currentItem=null;

/* NAV */
function toggleNav(){
const menu=document.getElementById("mobile-menu");
menu.style.display=menu.style.display==="flex"?"none":"flex";
}

/* FETCH */
async function fetchJSON(url){
const res=await fetch(url);
return res.ok?res.json():null;
}

async function fetchTrending(type){
const data=await fetchJSON(`${BASE}/trending/${type}/week?api_key=${API_KEY}`);
return data?.results||[];
}

async function fetchTrendingAnime(){
const data=await fetchJSON(`${BASE}/trending/tv/week?api_key=${API_KEY}`);
return data?.results.filter(tv=>tv.original_language==="ja"&&tv.genre_ids.includes(16))||[];
}

/* UI */
function displayBanner(item){
if(!item)return;
document.getElementById("banner").style.backgroundImage=`url(${IMG}${item.backdrop_path})`;
document.getElementById("banner-title").textContent=item.title||item.name;
document.getElementById("banner-overview").textContent=item.overview||"";
}

function createCard(item){
if(!item.poster_path)return null;
const card=document.createElement("div");
card.className="card";
card.onclick=()=>showDetails(item);

const img=document.createElement("img");
img.src=IMG+item.poster_path;
card.appendChild(img);
return card;
}

function displayList(items,id){
const container=document.getElementById(id);
container.innerHTML="";
items.forEach(i=>{
const c=createCard(i);
if(c)container.appendChild(c);
});
}

/* MODAL */
function showDetails(item){
currentItem=item;
document.getElementById("modal").classList.add("show");
document.body.style.overflow="hidden";

document.getElementById("modal-title").textContent=item.title||item.name;
document.getElementById("modal-description").textContent=item.overview||"";
document.getElementById("modal-rating").textContent=item.vote_average?"★".repeat(Math.round(item.vote_average/2)):"";

document.getElementById("info-wrapper").style.backgroundImage=`url(${IMG}${item.poster_path})`;
changeServer();
}

function closeModal(){
document.getElementById("modal").classList.remove("show");
document.getElementById("modal-video").src="";
document.body.style.overflow="";
}

function changeServer(){
if(!currentItem)return;
const id=currentItem.id;
const isMovie=!!currentItem.title;
const url=isMovie?
`https://zxcstream.xyz/embed/movie/${id}`:
`https://zxcstream.xyz/embed/tv/${id}/1/1`;
document.getElementById("modal-video").src=url;
}

/* SEARCH */
async function searchTMDB(q){
const section=document.getElementById("search-section");
const el=document.getElementById("search-results");
if(!q){section.hidden=true;return;}

const data=await fetchJSON(`${BASE}/search/multi?api_key=${API_KEY}&query=${q}`);
el.innerHTML="";
section.hidden=false;
data?.results.forEach(i=>{
const c=createCard(i);
if(c)el.appendChild(c);
});
}

/* RECOMMENDED */
async function displayRecommended(){
const data=await fetchTrending("movie");
const container=document.getElementById("recommended-list");
container.innerHTML="";
data.slice(0,6).forEach(i=>{
const div=document.createElement("div");
div.onclick=()=>showDetails(i);
const img=document.createElement("img");
img.src=IMG+i.poster_path;
img.style.width="100px";
img.style.borderRadius="8px";
div.appendChild(img);
container.appendChild(div);
});
}

/* INIT */
async function init(){
const [movies,tv,anime]=await Promise.all([
fetchTrending("movie"),
fetchTrending("tv"),
fetchTrendingAnime()
]);
displayBanner(movies[0]);
displayList(movies,"movies-list");
displayList(tv,"tvshows-list");
displayList(anime,"anime-list");
displayRecommended();
}
init();

