let currentLat=null,currentLon=null,map,marker;

// TAB FIX
function tab(id){
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
document.getElementById(id).classList.add("active");
}

// FISH DATA
const fish=[
{name:"kob",size:60,bag:2},
{name:"geelstert",size:0,bag:10},
{name:"hottentot",size:22,bag:10},
{name:"elf",size:30,bag:4}
];

// BUILD LIST
function loadFish(){
let box=document.getElementById("fishList");
box.innerHTML="";

fish.forEach(f=>{
let d=document.createElement("div");
d.innerText=f.name;
d.onclick=()=>showFish(f);
box.appendChild(d);
});
}

// SHOW DETAIL + BACK FIX
function showFish(f){
document.getElementById("fishList").style.display="none";

document.getElementById("fishDetail").innerHTML=`
<h3>${f.name}</h3>
Min size: ${f.size} cm<br>
Bag: ${f.bag}<br><br>

<button onclick="backFish()">← Back</button>
`;
}

// BACK WORKS NOW
function backFish(){
document.getElementById("fishDetail").innerHTML="";
document.getElementById("fishList").style.display="block";
}

// MAP
function initMap(){
map=L.map("mapView").setView([-34.37,21.42],11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// GPS FIX
function getGPS(){
navigator.geolocation.getCurrentPosition(p=>{
currentLat=p.coords.latitude;
currentLon=p.coords.longitude;

if(marker) map.removeLayer(marker);
marker=L.marker([currentLat,currentLon]).addTo(map);

document.getElementById("gps").innerText=currentLat+", "+currentLon;
});
}

// SAVE SPOT FIX
function saveSpot(){
if(!currentLat) return alert("Use GPS first");

let s=JSON.parse(localStorage.getItem("spots")||"[]");
s.push({lat:currentLat,lon:currentLon});
localStorage.setItem("spots",JSON.stringify(s));

loadSpots();
}

// LOAD SPOTS
function loadSpots(){
let s=JSON.parse(localStorage.getItem("spots")||"[]");

document.getElementById("spots").innerHTML=s.map(x=>`
<div>${x.lat}, ${x.lon}</div>
`).join("");
}

// WEATHER
async function weather(){
let r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=-34.37&longitude=21.42&current=wind_speed_10m");
let d=await r.json();
document.getElementById("weather").innerText="Wind "+d.current.wind_speed_10m;
}

// TEMPS
async function temps(){
let r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=-34.37&longitude=21.42&daily=temperature_2m_max,temperature_2m_min");
let d=await r.json();

let out="";
for(let i=0;i<5;i++){
out+=`${d.daily.time[i]} Day ${d.daily.temperature_2m_max[i]} Night ${d.daily.temperature_2m_min[i]}<br>`;
}

document.getElementById("temps").innerHTML=out;
}

// TIDES
function tides(){
document.getElementById("tides").innerText="Check tides externally";
}

// INIT
initMap();
loadFish();
loadSpots();
weather();
temps();
tides();
