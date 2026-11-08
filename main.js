const $ = (selector) => document.querySelector(selector);

const inspirations = [
  "Create a tiny world where the weather changes with the music.",
  "Animate an ordinary object as if it had a secret life.",
  "Make a 10-second film using only reflections and shadows.",
  "Design a room for a character who doesn't exist yet.",
  "Turn one Armenian word into a moving visual composition.",
  "Imagine a car commercial filmed in a city that never sleeps.",
  "Build a machine that turns memories into colours.",
  "Create a scene that feels like a summer evening in 2015.",
  "Make something beautiful using only three shapes.",
  "Give a fictional character one ordinary, very human morning.",
  "Create a poster for a perfume that smells like warm rose and incense.",
  "Make a tiny animation where nothing happens — but the atmosphere changes."
];

let inspirationIndex = Math.floor(Math.random() * inspirations.length);
let focusRemaining = 25 * 60;
let focusDuration = 25 * 60;
let focusInterval = null;
let toastTimeout = null;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

// Local clock follows the device timezone.
function updateClock() {
  const now = new Date();
  $("#clockTime").textContent = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit", minute: "2-digit", hour12: false
  }).format(now);
  $("#clockDate").textContent = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long", day: "numeric", month: "long"
  }).format(now);
}
updateClock();
setInterval(updateClock, 1000);

// Weather: Open-Meteo geocoding + forecast. No API key required for basic non-commercial use.
const weatherCodes = {
  0:["Ясно","☀"],1:["Преимущественно ясно","🌤"],2:["Переменная облачность","⛅"],3:["Облачно","☁"],
  45:["Туман","🌫"],48:["Изморозь / туман","🌫"],51:["Лёгкая морось","🌦"],53:["Морось","🌦"],55:["Сильная морось","🌧"],
  56:["Ледяная морось","🌧"],57:["Сильная ледяная морось","🌧"],61:["Небольшой дождь","🌦"],63:["Дождь","🌧"],65:["Сильный дождь","🌧"],
  66:["Ледяной дождь","🌧"],67:["Сильный ледяной дождь","🌧"],71:["Небольшой снег","🌨"],73:["Снег","🌨"],75:["Сильный снег","❄"],
  77:["Снежные зёрна","🌨"],80:["Ливень","🌦"],81:["Ливень","🌧"],82:["Сильный ливень","⛈"],85:["Снегопад","🌨"],86:["Сильный снегопад","❄"],
  95:["Гроза","⛈"],96:["Гроза с градом","⛈"],99:["Сильная гроза с градом","⛈"]
};

async function loadWeather(city) {
  const note = $("#weatherNote");
  note.textContent = "Ищем город…";
  try {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.search = new URLSearchParams({name: city, count:"1", language:"ru", format:"json"});
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error("Не удалось найти город");
    const geoData = await geoResponse.json();
    const place = geoData.results?.[0];
    if (!place) throw new Error("Город не найден. Попробуй уточнить название.");

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: place.latitude, longitude: place.longitude,
      current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
      daily: "temperature_2m_max,temperature_2m_min,weather_code",
      forecast_days: "1", timezone: "auto"
    });
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error("Прогноз временно недоступен");
    const forecast = await forecastResponse.json();
    const current = forecast.current;
    const condition = weatherCodes[current.weather_code] || ["Погодные условия","☁"];
    $("#weatherTemp").textContent = Math.round(current.temperature_2m) + "°";
    $("#weatherDescription").textContent = condition[0];
    $("#weatherIcon").textContent = condition[1];
    $("#weatherLocation").textContent = [place.name, place.country].filter(Boolean).join(", ");
    $("#weatherExtra").textContent = `Ощущается как ${Math.round(current.apparent_temperature)}° · Ветер ${Math.round(current.wind_speed_10m)} км/ч`;
    note.textContent = `Сегодня: ${Math.round(forecast.daily.temperature_2m_min[0])}° / ${Math.round(forecast.daily.temperature_2m_max[0])}° · Open-Meteo`;
    localStorage.setItem("creativeLabWeatherCity", city);
  } catch (error) {
    note.textContent = error.message || "Не удалось загрузить погоду";
  }
}

const cityForm = $("#cityForm");
$("#changeCityButton").addEventListener("click", () => {
  cityForm.classList.toggle("visible");
  if (cityForm.classList.contains("visible")) $("#cityInput").focus();
});
cityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = $("#cityInput").value.trim();
  if (!city) return;
  loadWeather(city);
  cityForm.classList.remove("visible");
});
loadWeather(localStorage.getItem("creativeLabWeatherCity") || "Казань");

// Focus timer.
function renderFocus() {
  const minutes = String(Math.floor(focusRemaining / 60)).padStart(2,"0");
  const seconds = String(focusRemaining % 60).padStart(2,"0");
  $("#focusTime").textContent = minutes + ":" + seconds;
  $("#focusProgress").style.width = ((focusDuration - focusRemaining) / focusDuration * 100) + "%";
}
$("#focusStart").addEventListener("click", () => {
  if (focusInterval) {
    clearInterval(focusInterval);
    focusInterval = null;
    $("#focusStart").textContent = "RESUME";
    $("#focusStatus").textContent = "Paused. Take a breath.";
    return;
  }
  if (focusRemaining <= 0) focusRemaining = focusDuration;
  $("#focusStart").textContent = "PAUSE";
  $("#focusStatus").textContent = "One thing at a time.";
  focusInterval = setInterval(() => {
    focusRemaining -= 1;
    renderFocus();
    if (focusRemaining <= 0) {
      clearInterval(focusInterval);
      focusInterval = null;
      $("#focusStart").textContent = "START";
      $("#focusStatus").textContent = "Session complete. Lovely work!";
      showToast("Focus session complete — well done!");
    }
  }, 1000);
});
$("#focusReset").addEventListener("click", () => {
  clearInterval(focusInterval);
  focusInterval = null;
  focusRemaining = focusDuration;
  $("#focusStart").textContent = "START";
  $("#focusStatus").textContent = "A little focus goes a long way.";
  renderFocus();
});
renderFocus();

// Inspiration prompts.
function showInspiration() {
  let next = Math.floor(Math.random() * inspirations.length);
  if (inspirations.length > 1 && next === inspirationIndex) next = (next + 1) % inspirations.length;
  inspirationIndex = next;
  $("#inspirationText").textContent = inspirations[inspirationIndex];
  $("#inspirationNumber").textContent = String(inspirationIndex + 1).padStart(2,"0");
}
$("#newInspiration").addEventListener("click", showInspiration);
showInspiration();

// Notes stay in this browser; nothing is sent to a server.
const notes = $("#quickNotes");
notes.value = localStorage.getItem("creativeLabNotes") || "";
let notesSaveTimeout;
notes.addEventListener("input", () => {
  $("#notesStatus").textContent = "Saving…";
  clearTimeout(notesSaveTimeout);
  notesSaveTimeout = setTimeout(() => {
    localStorage.setItem("creativeLabNotes", notes.value);
    $("#notesStatus").textContent = "Saved in this browser";
  }, 350);
});
$("#clearNotes").addEventListener("click", () => {
  notes.value = "";
  localStorage.removeItem("creativeLabNotes");
  $("#notesStatus").textContent = "Notes cleared";
});

// Vocabulary reminder: read the trainer's local collection and draw five fresh words on each page load.
const vocabularyStorageKey = "tcl_vocabulary_v1";
const vocabularyRecentKey = "creativeLabVocabularyRecent";
function getVocabularyWords() {
  try {
    const saved = JSON.parse(localStorage.getItem(vocabularyStorageKey) || "{}");
    const modules = Array.isArray(saved.modules) ? saved.modules : [];
    const seen = new Set();
    return modules.flatMap(module => (Array.isArray(module.words) ? module.words : []).map(word => ({
      id: String(word.id || (String(module.id || module.name) + ":" + String(word.ru) + ":" + (word.hy || []).join("|"))),
      ru: String(word.ru || "").trim(),
      hy: Array.isArray(word.hy) ? word.hy.map(value => String(value).trim()).filter(Boolean) : [],
      module: String(module.name || "Vocabulary")
    }))).filter(word => {
      if (!word.ru || !word.hy.length) return false;
      const signature = word.ru.toLocaleLowerCase() + "::" + word.hy.join("|").toLocaleLowerCase();
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  } catch (error) {
    return [];
  }
}
function renderVocabularyReminder() {
  const list = $("#vocabularyList");
  if (!list) return;
  const words = getVocabularyWords();
  if (!words.length) {
    list.innerHTML = '<p class="vocabulary-empty">Your Armenian word collection will appear here. Add a module in Vocabulary Room to begin.</p>';
    return;
  }
  let recent = [];
  try { recent = JSON.parse(sessionStorage.getItem(vocabularyRecentKey) || "[]"); } catch (error) {}
  let pool = words.filter(word => !recent.includes(word.id));
  if (pool.length < Math.min(5, words.length)) pool = words.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selected = pool.slice(0, 5);
  try { sessionStorage.setItem(vocabularyRecentKey, JSON.stringify(selected.map(word => word.id))); } catch (error) {}
  list.innerHTML = selected.map(word =>
    '<div class="vocabulary-word">' +
      '<div class="vocabulary-armenian" lang="hy">' + escapeHtml(word.hy.join(" / ")) + '</div>' +
      '<div class="vocabulary-translation">' + escapeHtml(word.ru) + '</div>' +
      '<div class="vocabulary-source">' + escapeHtml(word.module) + '</div>' +
    '</div>'
  ).join("");
}
const refreshVocabularyButton = $("#refreshVocabulary");
if (refreshVocabularyButton) refreshVocabularyButton.addEventListener("click", renderVocabularyReminder);
renderVocabularyReminder();

// Module registry: add future applications by editing data/modules.json.
const categoryNames = {motion:"MOTION",visual:"VISUAL",director:"DIRECTOR'S",world:"WORLDS",workshop:"WORKSHOP"};
async function loadModules() {
  const grid = $("#appsGrid");
  try {
    const response = await fetch("./data/modules.json");
    if (!response.ok) throw new Error("Module registry unavailable");
    const modules = await response.json();
    $("#appCount").textContent = String(modules.length).padStart(2,"0");
    renderModules(modules, "all");
    $("#filterRow").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      $("#filterRow").querySelectorAll(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
      renderModules(modules, button.dataset.filter);
    });
  } catch (error) {
    grid.innerHTML = '<div class="loading-card">The collection is taking a little break. Please refresh the page.</div>';
  }
}
function renderModules(modules, filter) {
  const visible = modules.filter(module => filter === "all" || module.category === filter);
  $("#appsGrid").innerHTML = visible.map(module => {
    const isReady = Boolean(module.path);
    const status = module.status || (isReady ? "AVAILABLE" : "IN DEVELOPMENT");
    return `<article class="app-card">
      <div class="app-card-top"><div class="app-icon" aria-hidden="true">${module.icon || "✳"}</div><span class="app-status">${status}</span></div>
      <h3>${escapeHtml(module.name)}</h3>
      <p>${escapeHtml(module.description)}</p>
      <div class="app-card-bottom"><span class="app-category">${categoryNames[module.category] || "EXPERIMENT"}</span>
        ${isReady ? `<a class="app-open" href="${escapeAttribute(module.path)}">OPEN ↗</a>` : '<button class="app-open coming-soon" type="button">IN THE MAKING</button>'}
      </div>
    </article>`;
  }).join("") || '<div class="loading-card">No experiments in this category yet.</div>';
  gridEvents();
}
function gridEvents() {
  $("#appsGrid").querySelectorAll(".coming-soon").forEach(button => {
    button.addEventListener("click", () => showToast("This experiment is still taking shape ✳"));
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function escapeAttribute(value) {
  return String(value).replace(/["'<>]/g, "");
}
loadModules();

// About dialog.
const aboutDialog = $("#aboutDialog");
$("#aboutButton").addEventListener("click", () => aboutDialog.showModal());
$("#closeAbout").addEventListener("click", () => aboutDialog.close());
aboutDialog.addEventListener("click", event => {
  if (event.target === aboutDialog) aboutDialog.close();
});