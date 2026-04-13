let map, marker;
let currentLat = null;
let currentLon = null;

const fish = [
  {name:"kob", size:60, bag:2},
  {name:"geelstert", size:0, bag:10},
  {name:"hottentot", size:22, bag:10},
  {name:"elf", size:30, bag:4},
];

function showTab(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function buildFish(){
  let box = document.getElementById("fishIndex");
  box.innerHTML = "";

  fish.forEach(f=>{
    let d = document.createElement("div");
    d.className="index-btn";
    d.innerText=f.name;
    d.onclick=()=>showFish(f);
    box.appendChild(d);
  });
}

function showFish(f){
  document.getElementById("fishDetail").innerHTML = `
    <h3>${f.name}</h3>
    Min size: ${f.size} cm<br>
    Bag limit: ${f.bag}
  `;
}

function initMap(){
  map = L.map('mapView').setView([-34.37,21.42],11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function useGPS(){
  navigator.geolocation.getCurrentPosition(pos=>{
    currentLat = pos.coords.latitude;
    currentLon = pos.coords.longitude;

    if(marker) map.removeLayer(marker);
    marker = L.marker([currentLat,currentLon]).addTo(map);

    document.getElementById("gpsStatus").innerText =
      "GPS: "+currentLat+", "+currentLon;
  });
}

function saveSpot(){
  if(!currentLat) return alert("Use GPS first");

  let spots = JSON.parse(localStorage.getItem("spots")||"[]");

  spots.push({lat:currentLat,lon:currentLon});
  localStorage.setItem("spots",JSON.stringify(spots));

  loadSpots();
}

function loadSpots(){
  let box = document.getElementById("spotList");
  let spots = JSON.parse(localStorage.getItem("spots")||"[]");

  box.innerHTML = spots.map(s=>`
    <div>${s.lat}, ${s.lon}</div>
  `).join("");
}

async function loadWeather(){
  let url = "https://api.open-meteo.com/v1/forecast?latitude=-34.37&longitude=21.42&current=wind_speed_10m";

  let res = await fetch(url);
  let data = await res.json();

  document.getElementById("weatherBox").innerText =
    "Wind: "+data.current.wind_speed_10m+" km/h";
}

async function loadTemps(){
  let url = "https://api.open-meteo.com/v1/forecast?latitude=-34.37&longitude=21.42&daily=temperature_2m_max,temperature_2m_min";

  let res = await fetch(url);
  let d = await res.json();

  let out="";
  for(let i=0;i<5;i++){
    out += `
      <div>
        ${d.daily.time[i]}<br>
        Day: ${d.daily.temperature_2m_max[i]}°C<br>
        Night: ${d.daily.temperature_2m_min[i]}°C
      </div>
    `;
  }

  document.getElementById("weekTemps").innerHTML = out;
}

function loadTides(){
  document.getElementById("tides").innerHTML =
    "Use external tide source (Open-Meteo limitation)";
}

buildFish();
initMap();
loadSpots();
loadWeather();
loadTemps();
loadTides();
