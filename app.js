const LAT = -34.37;
const LON = 21.42;

const fishData = [
  { name:"kob", minSize:60, bagLimit:2, bait:"okka, chokka, sard", image:"fish-cape-cob.png", notes:"Sterk bodem setup vir groter vis." },
  { name:"geelstert", minSize:60, bagLimit:10, bait:"live bait, sardine, plug", image:"fish-yellowtail.png", notes:"Werk goed met surface presentation." },
  { name:"bonito", minSize:0, bagLimit:10, bait:"small lure, spoon, feather", image:"fish-bonito.png", notes:"Vinnige retrieve werk goed." },
  { name:"red roman", minSize:30, bagLimit:5, bait:"okka, sard, chokka", image:"fish-red-roman.png", notes:"Hou aas naby bodem." },
  { name:"snapper", minSize:30, bagLimit:5, bait:"okka, sard", image:"fish-snapper.png", notes:"Kort en netjiese presentation." },
  { name:"silverfish", minSize:25, bagLimit:10, bait:"okka strips, sard", image:"fish-carpenter.png", notes:"Ligte tackle werk mooi." },
  { name:"red steenbras", minSize:60, bagLimit:1, bait:"chokka, sard", image:"fish-red-steenbras.png", notes:"Sterk tackle nodig." },
  { name:"yellow belly", minSize:30, bagLimit:5, bait:"okka, sard", image:"fish-yellow-belly.png", notes:"Hou die rig eenvoudig." },
  { name:"hottentot", minSize:22, bagLimit:10, bait:"red bait, prawn, mussel", image:"fish-hottentot.png", notes:"Kleiner hoeke werk beter." },
  { name:"geelbek", minSize:60, bagLimit:5, bait:"chokka, sard, live bait", image:"fish-snapper.png", notes:"Gebruik selfde foto vir nou." },
  { name:"dageraad", minSize:40, bagLimit:1, bait:"okka, red bait", image:"fish-dageraad.png", notes:"Hou by sterk bodem setup." },
  { name:"santer", minSize:23, bagLimit:10, bait:"okka, sard strips", image:"fish-carpenter.png", notes:"Selfde tipe vis vir nou." },
  { name:"elf / shad", minSize:30, bagLimit:4, bait:"sardine, spoon, plug", image:"fish-elf-shad.png", notes:"Werk lekker op retrieve." },
  { name:"poensie", minSize:40, bagLimit:5, bait:"okka, sard", image:"fish-red-roman.png", notes:"Gebruik roman foto vir nou." }
];

const defaultSpots = [
  { name:"Stilbaai Rivier Mond", lat:-34.382, lon:21.419, note:"Goeie reference spot vir mond area." },
  { name:"Blombos Area", lat:-34.410, lon:21.530, note:"Gebruik as offshore reference." },
  { name:"Jongensfontein", lat:-34.420, lon:21.340, note:"Bekende area vir boot planning." }
];

let mapInstance = null;
let markersLayer = null;
let deferredPrompt = null;

const fishGrid = document.getElementById("fishGrid");
const fishIndex = document.getElementById("fishIndex");
const fishSearch = document.getElementById("fishSearch");
const legalFish = document.getElementById("legalFish");
const fishLength = document.getElementById("fishLength");
const legalResult = document.getElementById("legalResult");
const fishDetailCard = document.getElementById("fishDetailCard");
const detailTabBtn = document.getElementById("detailTabBtn");
const installBtn = document.getElementById("installBtn");
const appStatus = document.getElementById("appStatus");
const tideNotes = document.getElementById("tideNotes");
const logFish = document.getElementById("logFish");
const catchList = document.getElementById("catchList");
const spotList = document.getElementById("spotList");
const spotIndex = document.getElementById("spotIndex");

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.classList.toggle("active", tab.id === tabId);
  });

  if (tabId === "map") {
    setTimeout(() => {
      initMap();
      if (mapInstance) {
        mapInstance.invalidateSize();
        fitMapToSpots();
      }
    }, 250);
  }
}

function degreesToCompass(deg) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function getConditionLevel(wind, swell) {
  if (wind < 15 && swell < 2) return { text: "Good", cls: "good" };
  if (wind < 25 && swell < 3) return { text: "Warning", cls: "warn" };
  return { text: "Tough", cls: "bad" };
}

function renderFish(list) {
  fishGrid.innerHTML = "";
  list.forEach(fish => {
    const card = document.createElement("div");
    card.className = "fish-card";
    card.innerHTML = `
      <img src="${fish.image}" alt="${fish.name}" onerror="this.src='https://via.placeholder.com/400x250?text=${encodeURIComponent(fish.name)}'">
      <div class="fish-card-body">
        <h4>${fish.name}</h4>
        <p><strong>Min size:</strong> ${fish.minSize} cm</p>
        <p><strong>Bag limit:</strong> ${fish.bagLimit}</p>
        <p><strong>Bait:</strong> ${fish.bait}</p>
      </div>
    `;
    card.addEventListener("click", () => showFishDetail(fish));
    fishGrid.appendChild(card);
  });
}

function buildFishIndex() {
  fishIndex.innerHTML = "";

  const allBtn = document.createElement("div");
  allBtn.className = "index-btn";
  allBtn.textContent = "all";
  allBtn.onclick = () => renderFish(fishData);
  fishIndex.appendChild(allBtn);

  fishData.forEach(fish => {
    const btn = document.createElement("div");
    btn.className = "index-btn";
    btn.textContent = fish.name;
    btn.onclick = () => renderFish([fish]);
    fishIndex.appendChild(btn);
  });
}

function filterFish() {
  const search = fishSearch.value.toLowerCase().trim();
  const filtered = fishData.filter(fish =>
    fish.name.toLowerCase().includes(search) ||
    fish.bait.toLowerCase().includes(search) ||
    fish.notes.toLowerCase().includes(search)
  );
  renderFish(filtered);
}

function showFishDetail(fish) {
  detailTabBtn.classList.remove("hidden");
  fishDetailCard.innerHTML = `
    <img class="detail-photo" src="${fish.image}" alt="${fish.name}" onerror="this.src='https://via.placeholder.com/800x400?text=${encodeURIComponent(fish.name)}'">
    <h2 style="text-transform:capitalize;">${fish.name}</h2>

    <div class="detail-grid">
      <div class="detail-chip"><strong>Minimum Size</strong><br>${fish.minSize} cm</div>
      <div class="detail-chip"><strong>Bag Limit</strong><br>${fish.bagLimit}</div>
      <div class="detail-chip"><strong>Bait</strong><br>${fish.bait}</div>
    </div>

    <h3>Notes</h3>
    <p>${fish.notes}</p>

    <button class="primary-btn" onclick="switchTab('fish')">← Back</button>
  `;
  switchTab("fishDetail");
}

function loadLegalOptions() {
  legalFish.innerHTML = "";
  logFish.innerHTML = "";

  fishData.forEach(fish => {
    const a = document.createElement("option");
    a.value = fish.name;
    a.textContent = fish.name;
    legalFish.appendChild(a);

    const b = document.createElement("option");
    b.value = fish.name;
    b.textContent = fish.name;
    logFish.appendChild(b);
  });
}

function checkLegal() {
  const selectedFish = fishData.find(f => f.name === legalFish.value);
  const length = Number(fishLength.value);

  if (!selectedFish || !length) {
    legalResult.className = "result-box";
    legalResult.textContent = "Tik eers 'n geldige lengte in.";
    return;
  }

  if (length >= selectedFish.minSize) {
    legalResult.className = "result-box result-good";
    legalResult.innerHTML = `
      ✅ Bo minimum grootte<br>
      <strong>${selectedFish.name}</strong>: minimum ${selectedFish.minSize} cm<br>
      Bag limit: ${selectedFish.bagLimit}
    `;
  } else {
    legalResult.className = "result-box result-bad";
    legalResult.innerHTML = `
      ❌ Te klein — sit terug<br>
      <strong>${selectedFish.name}</strong>: minimum ${selectedFish.minSize} cm<br>
      Jou vis: ${length} cm
    `;
  }
}

function getSavedSpots() {
  const saved = JSON.parse(localStorage.getItem("customSpots") || "[]");
  return [...defaultSpots, ...saved];
}

function saveCustomSpot(spot) {
  const saved = JSON.parse(localStorage.getItem("customSpots") || "[]");
  saved.push(spot);
  localStorage.setItem("customSpots", JSON.stringify(saved));
}

function renderSpotList() {
  if (!spotList) return;
  const allSpots = getSavedSpots();
  spotList.innerHTML = allSpots.map(spot => `
    <div class="spot-item">
      <strong>${spot.name}</strong><br>
      <span class="muted">${spot.lat.toFixed(3)}, ${spot.lon.toFixed(3)}</span>
      <p>${spot.note || ""}</p>
    </div>
  `).join("");
}

function renderSpotIndex() {
  if (!spotIndex) return;

  const allSpots = getSavedSpots();
  spotIndex.innerHTML = "";

  allSpots.forEach((spot, index) => {
    const btn = document.createElement("div");
    btn.className = "index-btn";
    btn.textContent = spot.name;
    btn.onclick = () => zoomToSpot(index);
    spotIndex.appendChild(btn);
  });
}

function addSpotFromForm() {
  const name = document.getElementById("newSpotName").value.trim();
  const lat = Number(document.getElementById("newSpotLat").value);
  const lon = Number(document.getElementById("newSpotLon").value);
  const note = document.getElementById("newSpotNote").value.trim();

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    alert("Sit eers geldige spot naam, latitude en longitude in.");
    return;
  }

  saveCustomSpot({ name, lat, lon, note });
  rebuildMapSpots();
  renderSpotIndex();
  renderSpotList();

  document.getElementById("newSpotName").value = "";
  document.getElementById("newSpotLat").value = "";
  document.getElementById("newSpotLon").value = "";
  document.getElementById("newSpotNote").value = "";

  alert("Spot saved.");
}

function initMap() {
  const mapEl = document.getElementById("mapView");
  if (!mapEl) return;

  if (!mapInstance) {
    mapInstance = L.map("mapView").setView([LAT, LON], 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(mapInstance);

    markersLayer = L.layerGroup().addTo(mapInstance);
    rebuildMapSpots();
  }
}

function rebuildMapSpots() {
  if (!mapInstance || !markersLayer) return;

  markersLayer.clearLayers();

  const allSpots = getSavedSpots();
  allSpots.forEach(spot => {
    L.marker([spot.lat, spot.lon])
      .addTo(markersLayer)
      .bindPopup(`<b>${spot.name}</b><br>${spot.note || ""}`);
  });

  fitMapToSpots();
}

function fitMapToSpots() {
  if (!mapInstance || !markersLayer) return;
  const bounds = markersLayer.getBounds();
  if (bounds.isValid()) {
    mapInstance.fitBounds(bounds, { padding: [30, 30] });
  }
}

function zoomToSpot(index) {
  if (!mapInstance || !markersLayer) return;

  const allSpots = getSavedSpots();
  const spot = allSpots[index];
  if (!spot) return;

  switchTab("map");
  setTimeout(() => {
    mapInstance.setView([spot.lat, spot.lon], 13);

    let i = 0;
    markersLayer.eachLayer(layer => {
      if (i === index && layer.openPopup) {
        layer.openPopup();
      }
      i++;
    });
  }, 250);
}

async function loadWeatherAndMarine() {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_speed_10m,wind_direction_10m,temperature_2m,cloud_cover&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;

    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${LAT}&longitude=${LON}&current=wave_height,wave_period,wave_direction,sea_surface_temperature,sea_level_height_msl&hourly=sea_level_height_msl&timezone=auto`;

    const [weatherRes, marineRes] = await Promise.all([fetch(weatherUrl), fetch(marineUrl)]);
    const weather = await weatherRes.json();
    const marine = await marineRes.json();

    const c = weather.current || {};
    const d = weather.daily || {};
    const m = marine.current || {};

    const windSpeed = c.wind_speed_10m ?? 0;
    const windDeg = c.wind_direction_10m ?? 0;
    const swell = m.wave_height ?? 0;
    const swellPeriod = m.wave_period ?? 0;
    const swellDeg = m.wave_direction ?? 0;

    let waterTemp = Number(m.sea_surface_temperature ?? 0);
    waterTemp = waterTemp > 0 ? waterTemp.toFixed(1) : "-";

    document.getElementById("windNow").textContent = `${windSpeed} km/h`;
    document.getElementById("swellNow").textContent = `${swell} m`;
    document.getElementById("tempNow").textContent = `${waterTemp}°C`;

    const condition = getConditionLevel(windSpeed, swell);
    document.getElementById("conditionNow").textContent = condition.text;

    document.getElementById("homeWind").textContent = `${windSpeed} km/h ${degreesToCompass(windDeg)} (${windDeg}°)`;
    document.getElementById("homeSwell").textContent = `${swell} m`;
    document.getElementById("homePeriod").textContent = `${swellPeriod} s`;
    document.getElementById("homeTemp").textContent = `${waterTemp}°C`;
    document.getElementById("homeCloud").textContent = `${c.cloud_cover ?? "-"}%`;

    document.getElementById("weatherWindSpeed").textContent = `${windSpeed} km/h`;
    document.getElementById("weatherWindDirection").textContent = `${degreesToCompass(windDeg)} (${windDeg}°)`;
    document.getElementById("weatherSwellHeight").textContent = `${swell} m`;
    document.getElementById("weatherSwellPeriod").textContent = `${swellPeriod} s`;
    document.getElementById("weatherSwellDirection").textContent = `${degreesToCompass(swellDeg)} (${swellDeg}°)`;
    document.getElementById("weatherCloud").textContent = `${c.cloud_cover ?? "-"}%`;
    document.getElementById("weatherWaterTemp").textContent = `${waterTemp}°C`;

    document.getElementById("windArrow").style.transform = `rotate(${windDeg}deg)`;
    document.getElementById("driftArrow").style.transform = `rotate(${windDeg}deg)`;
    document.getElementById("windDirText").textContent = `Wind: ${degreesToCompass(windDeg)} (${windDeg}°)`;
    document.getElementById("driftText").textContent = `Drift ref: ${degreesToCompass(windDeg)} (${windDeg}°)`;

    const badge = document.getElementById("conditionBadge");
    badge.textContent = condition.text;
    badge.className = `condition-pill ${condition.cls}`;

    buildWeekTemps(d.time || [], d.temperature_2m_max || [], d.temperature_2m_min || []);
    loadTidesFromMarine(marine.hourly);

    appStatus.className = "result-box";
    appStatus.innerHTML = `Live data gelaai. Water temp: ${waterTemp}°C`;
  } catch (err) {
    appStatus.className = "result-box";
    appStatus.textContent = "Live data kon nie laai nie.";
  }
}

function buildWeekTemps(dates, maxTemps, minTemps) {
  const weekEl = document.getElementById("weekTempList");
  if (!weekEl) return;

  if (!dates.length) {
    weekEl.innerHTML = `<div class="spot-item"><strong>No week temps</strong></div>`;
    return;
  }

  weekEl.innerHTML = dates.slice(0, 7).map((date, i) => `
    <div class="spot-item">
      <strong>${date}</strong>
      <p>Day: ${maxTemps[i] ?? "-"}°C</p>
      <p>Night: ${minTemps[i] ?? "-"}°C</p>
    </div>
  `).join("");
}

function findTideExtremes(hourly) {
  if (!hourly || !hourly.time || !hourly.sea_level_height_msl) return [];

  const times = hourly.time;
  const levels = hourly.sea_level_height_msl;
  const extremes = [];

  for (let i = 1; i < levels.length - 1; i++) {
    const prev = levels[i - 1];
    const curr = levels[i];
    const next = levels[i + 1];

    if (curr > prev && curr > next) extremes.push({ type: "High", time: times[i], level: curr });
    if (curr < prev && curr < next) extremes.push({ type: "Low", time: times[i], level: curr });
  }

  return extremes.slice(0, 6);
}

function loadTidesFromMarine(hourly) {
  const tideList = document.getElementById("tideList");
  if (!tideList) return;

  const extremes = findTideExtremes(hourly);

  if (!extremes.length) {
    tideList.innerHTML = `
      <div class="spot-item">
        <strong>Tides unavailable</strong>
        <p>Geen tide turns nou gekry nie. Gebruik tide notes hieronder.</p>
      </div>
      <div class="spot-item">
        <strong>Fallback</strong>
        <p>Morning: check local tide source</p>
        <p>Afternoon: check local tide source</p>
      </div>
    `;
    return;
  }

  tideList.innerHTML = extremes.map(tide => `
    <div class="spot-item">
      <strong>${tide.type} Tide</strong>
      <p>${new Date(tide.time).toLocaleString()}</p>
      <p>Sea level: ${Number(tide.level).toFixed(2)} m</p>
    </div>
  `).join("");
}

function loadTides() {
  if (tideNotes) tideNotes.value = localStorage.getItem("tideNotes") || "";
}

function saveTideNotes() {
  localStorage.setItem("tideNotes", tideNotes.value);
  updateStats();
  alert("Tide notes saved.");
}

function savePlan() {
  const tripDate = document.getElementById("tripDate").value;
  const tripTime = document.getElementById("tripTime").value;
  const tripNotes = document.getElementById("tripNotes").value;

  const plan = { date: tripDate, time: tripTime, notes: tripNotes };
  localStorage.setItem("tripPlan", JSON.stringify(plan));
  showSavedPlan();
  updateStats();
  alert("Plan saved.");
}

function showSavedPlan() {
  const savedPlan = document.getElementById("savedPlan");
  if (!savedPlan) return;

  const plan = JSON.parse(localStorage.getItem("tripPlan"));
  if (!plan || (!plan.date && !plan.time && !plan.notes)) {
    savedPlan.textContent = "Nog niks gestoor nie.";
    return;
  }

  savedPlan.innerHTML = `
    <strong>Datum:</strong> ${plan.date || "-"}<br>
    <strong>Tyd:</strong> ${plan.time || "-"}<br>
    <strong>Notes:</strong> ${plan.notes || "-"}
  `;
}

function getCatchLog() {
  return JSON.parse(localStorage.getItem("catchLog") || "[]");
}

function setCatchLog(items) {
  localStorage.setItem("catchLog", JSON.stringify(items));
}

function saveCatch() {
  const item = {
    id: Date.now(),
    date: document.getElementById("logDate").value,
    fish: document.getElementById("logFish").value,
    length: document.getElementById("logLength").value,
    spot: document.getElementById("logSpot").value.trim(),
    notes: document.getElementById("logNotes").value.trim()
  };

  const list = getCatchLog();
  list.unshift(item);
  setCatchLog(list);
  renderCatchLog();
  updateStats();

  document.getElementById("logLength").value = "";
  document.getElementById("logSpot").value = "";
  document.getElementById("logNotes").value = "";

  alert("Catch saved.");
}

function deleteCatch(id) {
  const list = getCatchLog().filter(item => item.id !== id);
  setCatchLog(list);
  renderCatchLog();
  updateStats();
}

function renderCatchLog() {
  if (!catchList) return;

  const list = getCatchLog();
  if (!list.length) {
    catchList.innerHTML = `<div class="result-box">Nog geen catches nie.</div>`;
    return;
  }

  const grouped = {};
  list.forEach(item => {
    const key = item.date || "No date";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  catchList.innerHTML = "";

  Object.keys(grouped).forEach(date => {
    const group = grouped[date];
    let html = `<div class="card"><h3>${date}</h3>`;

    group.forEach(item => {
      html += `
        <div class="catch-item">
          <div class="catch-head">
            <strong style="text-transform:capitalize;">${item.fish}</strong>
            <button class="delete-btn" onclick="deleteCatch(${item.id})">Delete</button>
          </div>
          <div><strong>Lengte:</strong> ${item.length || "-"} cm</div>
          <div><strong>Plek:</strong> ${item.spot || "-"}</div>
          <div><strong>Notas:</strong> ${item.notes || "-"}</div>
        </div>
      `;
    });

    html += `</div>`;
    catchList.innerHTML += html;
  });
}

function updateStats() {
  const catches = getCatchLog();
  const totalEl = document.getElementById("totalCatches");
  const topEl = document.getElementById("topSpecies");
  const plansEl = document.getElementById("savedPlansCount");
  const tideEl = document.getElementById("tideNotesState");

  if (totalEl) totalEl.textContent = catches.length;

  const counts = {};
  catches.forEach(item => {
    counts[item.fish] = (counts[item.fish] || 0) + 1;
  });

  let top = "-";
  let best = 0;
  Object.keys(counts).forEach(name => {
    if (counts[name] > best) {
      best = counts[name];
      top = name;
    }
  });

  if (topEl) topEl.textContent = top;
  if (plansEl) plansEl.textContent = localStorage.getItem("tripPlan") ? "1" : "0";
  if (tideEl) tideEl.textContent = localStorage.getItem("tideNotes") ? "Saved" : "None";
}

function exportBackup() {
  const backup = {
    tripPlan: JSON.parse(localStorage.getItem("tripPlan") || "null"),
    tideNotes: localStorage.getItem("tideNotes") || "",
    catchLog: getCatchLog(),
    customSpots: JSON.parse(localStorage.getItem("customSpots") || "[]")
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "stilbaai-fishing-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      localStorage.setItem("tripPlan", JSON.stringify(data.tripPlan || null));
      localStorage.setItem("tideNotes", data.tideNotes || "");
      localStorage.setItem("catchLog", JSON.stringify(data.catchLog || []));
      localStorage.setItem("customSpots", JSON.stringify(data.customSpots || []));
      showSavedPlan();
      loadTides();
      renderCatchLog();
      renderSpotList();
      renderSpotIndex();
      rebuildMapSpots();
      updateStats();
      alert("Backup imported.");
    } catch (e) {
      alert("Import file is nie reg nie.");
    }
  };

  reader.readAsText(file);
}

function setupInstallPrompt() {
  if (!installBtn) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.classList.add("hidden");
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.querySelectorAll(".tab-btn").forEach(button => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});

fishSearch?.addEventListener("input", filterFish);
document.getElementById("checkLegalBtn")?.addEventListener("click", checkLegal);
document.getElementById("savePlanBtn")?.addEventListener("click", savePlan);
document.getElementById("saveTideNotesBtn")?.addEventListener("click", saveTideNotes);
document.getElementById("saveCatchBtn")?.addEventListener("click", saveCatch);
document.getElementById("exportBtn")?.addEventListener("click", exportBackup);
document.getElementById("importFile")?.addEventListener("change", (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
});
document.getElementById("addSpotBtn")?.addEventListener("click", addSpotFromForm);

buildFishIndex();
renderFish(fishData);
loadLegalOptions();
showSavedPlan();
loadTides();
renderCatchLog();
renderSpotList();
renderSpotIndex();
updateStats();
setupInstallPrompt();
registerServiceWorker();
loadWeatherAndMarine();

window.switchTab = switchTab;
window.deleteCatch = deleteCatch;
