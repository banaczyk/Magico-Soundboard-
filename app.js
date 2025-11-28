let isUserUploading = false;
let tileSize = "medium"; // small | medium | large


function normalizeName(str) {
    if (!str) return "";

    const map = {
        "ą": "a", "ć": "c", "ę": "e", "ł": "l",
        "ń": "n", "ó": "o", "ś": "s", "ź": "z", "ż": "z",
        "Ą": "a", "Ć": "c", "Ę": "e", "Ł": "l",
        "Ń": "n", "Ó": "o", "Ś": "s", "Ź": "z", "Ż": "z",
    };

    return str
        .split("")
        .map(ch => map[ch] || ch)
        .join("")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/\u00A0/g, " ")
        .trim();
}


// ---------------- KONFIGURACJA ----------------
const COLOR_KEYS = ["primary", "success", "danger", "warning", "info", "dark"];
const DEFAULT_COLOR = "dark";

// DOM
const tilesContainer = document.getElementById("tiles");
const fileInput = document.getElementById("fileInput");
const clearBtn = document.getElementById("clearBtn");
const crossfadeToggle = document.getElementById("crossfadeToggle");
const fadeSlider = document.getElementById("fadeSlider");
const fadeLabel = document.getElementById("fadeTimeLabel");
const exportBtn = document.getElementById("exportSettingsBtn");
const importInput = document.getElementById("importSettingsInput");

fadeSlider.addEventListener("input", () => {
  fadeLabel.textContent = fadeSlider.value;
});

if (exportBtn) {
  exportBtn.addEventListener("click", handleExportSettings);
}
if (importInput) {
  importInput.addEventListener("change", handleImportSettingsFile);
}

// Stan aplikacji
const tilesState = new Map(); // id -> { audio, tile, ... }
let db = null;
let crossfadeCurrentId = null;

// ---------------- IndexedDB ----------------

const dbRequest = indexedDB.open("JinglownicaDB", 3);

dbRequest.onupgradeneeded = (e) => {
  db = e.target.result;

  // ------------------------------------
  // Tworzenie / aktualizacja ObjectStore
  // ------------------------------------
  let store;

  // Tworzymy jeśli nie istnieje
  if (!db.objectStoreNames.contains("audioFiles")) {
    store = db.createObjectStore("audioFiles", {
      keyPath: "id",
      autoIncrement: true,
    });

    // Nowe pola do kafelków
    store.createIndex("name", "name", { unique: false });
    store.createIndex("color", "color", { unique: false });
    store.createIndex("blob", "blob", { unique: false });
  } 
  else {
    // Jeśli istnieje – bierzemy istniejący
    store = e.target.transaction.objectStore("audioFiles");

    // Dodawanie indeksów, jeśli brak (bez błędów)
    if (!store.indexNames.contains("name")) {
      store.createIndex("name", "name", { unique: false });
    }
    if (!store.indexNames.contains("color")) {
      store.createIndex("color", "color", { unique: false });
    }
    if (!store.indexNames.contains("blob")) {
      store.createIndex("blob", "blob", { unique: false });
    }
  }

  // ------------------------------------
  // MIEJSCE NA PRZYSZŁE MIGRACJE
  // (np. nowe pola, konwersje, upgrady)
  // ------------------------------------
  // Przykład:
  // if (e.oldVersion < 2) { ... }
  // if (e.oldVersion < 3) { ... }

  // W tej chwili nic więcej nie trzeba.
};


dbRequest.onsuccess = (e) => {
  db = e.target.result;
  loadSavedFiles();
};

dbRequest.onerror = () => {
  console.error("IndexedDB error");
};

// ---------------- ŁADOWANIE Z BAZY ----------------

function loadSavedFiles() {
    if (!db) return;

    const tx = db.transaction("audioFiles", "readonly");
    const store = tx.objectStore("audioFiles");
    const req = store.getAll();

    req.onsuccess = (e) => {
        const rows = e.target.result || [];

        // jeśli pusty — nic nie robimy i wychodzimy
        if (rows.length === 0) {
            return;
        }

        // sortowanie alfabetyczne PL
        rows.sort((a, b) =>
            a.name.localeCompare(b.name, "pl", { sensitivity: "base" })
        );

        rows.forEach((row) => {
            createTile({
                id: row.id,
                name: row.name,
                blob: row.blob,
                color: row.color || DEFAULT_COLOR,
            });
        });
    };

    req.onerror = (e) => {
        console.error("Błąd podczas odczytu audioFiles:", e.target.error);
    };
}



// ---------------- ZAPIS NOWYCH PLIKÓW ----------------

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []);
  if (!db) {
    console.error("DB not ready");
    return;
  }

  const saveOperations = files.map(file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const blob = new Blob([e.target.result], { type: file.type });

        const tx = db.transaction("audioFiles", "readwrite");
        const store = tx.objectStore("audioFiles");
        const addReq = store.add({
          name: file.name,
          blob: blob,
          color: DEFAULT_COLOR,
        });

        addReq.onsuccess = () => {
          resolve();
        };
      };

      reader.readAsArrayBuffer(file);
    });
  });

  Promise.all(saveOperations).then(() => {
    tilesContainer.innerHTML = "";
    tilesState.clear();
    loadSavedFiles();
  });
});


// ---------------- CZYSZCZENIE LISTY ----------------

clearBtn.addEventListener("click", () => {
  if (!db) return;
  const tx = db.transaction("audioFiles", "readwrite");
  const store = tx.objectStore("audioFiles");
  const clearReq = store.clear();
  clearReq.onsuccess = () => {
    tilesContainer.innerHTML = "";
    tilesState.clear();
    crossfadeCurrentId = null;
  };
});

// ---------------- TWORZENIE KAFELKA ----------------

function getTileColumnClass() {
    switch (tileSize) {
        case "small":
            return "col-4 col-md-3 col-lg-1"; // bardzo gęsto
        case "large":
            return "col-12 col-md-6 col-lg-4"; // duże kafelki
        case "medium":
        default:
            return "col-6 col-md-4 col-lg-2"; // Twoje obecne domyślne
    }
}

function createTile(data) {
  const { id, name, blob, color } = data;

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 1;

  const col = document.createElement("div");
  col.className = getTileColumnClass();

  const tile = document.createElement("div");
  tile.className = "tile";

  const content = document.createElement("div");
  content.className = "tile-content";
  content.textContent = name;

  const fadeIndicator = document.createElement("div");
  fadeIndicator.className = "fade-indicator";
  fadeIndicator.textContent = "Fade...";

  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";
  const progress = document.createElement("div");
  progress.className = "progress";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.style.width = "0%";
  progress.appendChild(progressBar);
  progressContainer.appendChild(progress);

  // ===============================
  // CONTROLS CONTAINER
  // ===============================
  const controls = document.createElement("div");
  controls.className = "tile-controls";

  // RESET ↺
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "↺";
  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.currentTime = 0;
  });

  // KOLOR 🎨
  const colorBtn = document.createElement("button");
  colorBtn.type = "button";
  colorBtn.className = "color-btn";
  colorBtn.textContent = "🎨";

  const colorPicker = document.createElement("div");
  colorPicker.className = "color-picker";

  COLOR_KEYS.forEach((colKey) => {
    const opt = document.createElement("button");
    opt.type = "button";
    opt.className = `color-option bg-${colKey}`;
    opt.dataset.color = colKey;
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      setTileColor(state, colKey, true);
      colorPicker.classList.remove("show");
    });
    colorPicker.appendChild(opt);
  });

  colorBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    colorPicker.classList.toggle("show");
  });

  // KOSZ 🗑
  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "🗑";
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!confirm(`Usunąć: ${name}?`)) return;

    // IndexedDB
    const tx = db.transaction("audioFiles", "readwrite");
    tx.objectStore("audioFiles").delete(id);

    // Stan
    tilesState.delete(id);

    // DOM
    col.remove();
    updateEmptyInfo();
  });

  // DODAJEMY PRZYCISKI DO CONTROLS
  controls.appendChild(resetBtn);
  controls.appendChild(colorBtn);
  controls.appendChild(deleteBtn);
  controls.appendChild(colorPicker);

  // ===============================
  // SKŁADANIE KAFELKA
  // ===============================
  tile.appendChild(content);
  tile.appendChild(fadeIndicator);
  tile.appendChild(progressContainer);
  tile.appendChild(controls);

  col.appendChild(tile);
  tilesContainer.appendChild(col);

  // STAN
  const state = {
    id,
    name,
    blob,
    color: color || DEFAULT_COLOR,
    audio,
    tileEl: tile,
    fadeIndicatorEl: fadeIndicator,
    progressBarEl: progressBar,
    playing: false,
    fadeIntervalId: null,
    volumeRestoreTimeoutId: null,
  };

  tilesState.set(id, state);
  setTileColor(state, state.color, false);

  tile.addEventListener("click", () => {
    handleTileClick(state);
  });

  audio.addEventListener("timeupdate", () => {
    if (!isFinite(audio.duration) || audio.duration === 0) return;
    const percent = (audio.currentTime / audio.duration) * 100;
    state.progressBarEl.style.width = percent + "%";
  });

  audio.addEventListener("ended", () => {
    state.playing = false;
    tile.classList.remove("playing");
    state.progressBarEl.style.width = "0%";
    audio.volume = 1;

    if (state.volumeRestoreTimeoutId) {
      clearTimeout(state.volumeRestoreTimeoutId);
      state.volumeRestoreTimeoutId = null;
    }
    if (state.fadeIntervalId) {
      clearInterval(state.fadeIntervalId);
      state.fadeIntervalId = null;
    }
    if (crossfadeCurrentId === state.id) {
      crossfadeCurrentId = null;
    }
  });

  updateEmptyInfo();

}



// ---------------- KOLORY KAFELKÓW ----------------

function setTileColor(state, colorKey, saveToDb) {
  const tile = state.tileEl;
  COLOR_KEYS.forEach((c) => tile.classList.remove("bg-" + c));
  tile.classList.add("bg-" + colorKey);
  state.color = colorKey;

  if (saveToDb && db) {
    const tx = db.transaction("audioFiles", "readwrite");
    const store = tx.objectStore("audioFiles");
    store.put({
      id: state.id,
      name: state.name,
      blob: state.blob,
      color: state.color,
    });
  }
}

// ---------------- LOGIKA KLIKNIĘCIA ----------------

function handleTileClick(state) {
  const audio = state.audio;
  const tile = state.tileEl;

  // Tryb normalny (crossfade wyłączony)
  if (!crossfadeToggle.checked) {
    if (!state.playing) {
      audio.play();
      state.playing = true;
      tile.classList.add("playing");
    } else {
      audio.pause();
      state.playing = false;
      tile.classList.remove("playing");
    }
    return;
  }

  // Tryb crossfade
  if (!state.playing) {
    const newState = state;
    const oldState =
      crossfadeCurrentId &&
      tilesState.get(crossfadeCurrentId) &&
      tilesState.get(crossfadeCurrentId).playing
        ? tilesState.get(crossfadeCurrentId)
        : null;

    if (!oldState || oldState === newState) {
      audio.currentTime = 0;
      audio.volume = 1;
      audio.play();
      newState.playing = true;
      tile.classList.add("playing");
      crossfadeCurrentId = newState.id;
    } else {
      startCrossfade(oldState, newState);
    }
  } else {
    // Klik na grający w trybie crossfade = natychmiastowa pauza + reset
    if (state.fadeIntervalId) {
      clearInterval(state.fadeIntervalId);
      state.fadeIntervalId = null;
    }
    if (state.volumeRestoreTimeoutId) {
      clearTimeout(state.volumeRestoreTimeoutId);
      state.volumeRestoreTimeoutId = null;
    }
    audio.pause();
    audio.currentTime = 0;
    state.playing = false;
    tile.classList.remove("playing");
    if (crossfadeCurrentId === state.id) {
      crossfadeCurrentId = null;
    }
  }
}

// ---------------- CROSSFADE ----------------

function startCrossfade(oldState, newState) {
  const fadeDuration = parseInt(fadeSlider.value, 10) || 5;

  const oldAudio = oldState.audio;
  const newAudio = newState.audio;
  const newTile = newState.tileEl;
  const fadeIndicator = newState.fadeIndicatorEl;

  // Stop poprzednich fade'ów
  [oldState, newState].forEach((st) => {
    if (st.fadeIntervalId) {
      clearInterval(st.fadeIntervalId);
      st.fadeIntervalId = null;
    }
    if (st.volumeRestoreTimeoutId) {
      clearTimeout(st.volumeRestoreTimeoutId);
      st.volumeRestoreTimeoutId = null;
    }
  });

  newAudio.volume = 0;
  newAudio.currentTime = 0;
  newAudio.play();

  newState.playing = true;
  newTile.classList.add("playing");
  fadeIndicator.classList.add("fade-active");

  crossfadeCurrentId = newState.id;

  const steps = 50;
  const intervalMs = (fadeDuration * 1000) / steps;
  let step = 0;

  const intervalId = setInterval(() => {
    step++;
    const t = step / steps;

    newAudio.volume = Math.min(1, t);
    oldAudio.volume = Math.max(0, 1 - t);

    if (
      step >= steps ||
      oldAudio.volume <= 0 ||
      oldAudio.paused ||
      oldAudio.ended
    ) {
      clearInterval(intervalId);
      oldState.fadeIntervalId = null;
      newState.fadeIntervalId = null;

      fadeIndicator.classList.remove("fade-active");

      oldAudio.pause();
      oldAudio.currentTime = 0;
      oldState.playing = false;
      oldState.tileEl.classList.remove("playing");

      // Przywrócenie głośności starego po 10s (bez odtwarzania)
      oldState.volumeRestoreTimeoutId = setTimeout(() => {
        oldAudio.volume = 1;
        oldState.volumeRestoreTimeoutId = null;
      }, 10000);
    }
  }, intervalMs);

  oldState.fadeIntervalId = intervalId;
  newState.fadeIntervalId = intervalId;
}

// ---------------- EXPORT / IMPORT USTAWIEŃ ----------------

function handleExportSettings() {
  const tilesInOrder = [];
  const allStates = Array.from(tilesState.values());

  tilesContainer.querySelectorAll(".tile").forEach((tileEl) => {
    const st = allStates.find((s) => s.tileEl === tileEl);
    if (st) {
      tilesInOrder.push(st);
    }
  });

  const data = {
    version: 1,
    settings: {
      crossfadeEnabled: !!crossfadeToggle.checked,
      fadeSeconds: parseInt(fadeSlider.value, 10) || 5,
    },
    tiles: tilesInOrder.map((st, idx) => ({
      name: st.name,
      color: st.color || DEFAULT_COLOR,
      order: idx,
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `jinglownica-settings-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportSettingsFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      applyImportedSettings(data);
    } catch (err) {
      console.error("Nieprawidłowy plik ustawień", err);
      alert("Nieprawidłowy plik ustawień (JSON).");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function applyImportedSettings(data) {
  console.log("IMPORT START", data);

  if (!data || typeof data !== "object") {
    console.error("Import error: dane nie są obiektem");
    return;
  }

  // --- Ustawienia globalne ---
  if (data.settings) {
    console.log("Import: ustawienia globalne", data.settings);

    if (typeof data.settings.fadeSeconds === "number") {
      fadeSlider.value = data.settings.fadeSeconds;
      fadeLabel.textContent = fadeSlider.value;
    }

    if (typeof data.settings.crossfadeEnabled === "boolean") {
      crossfadeToggle.checked = data.settings.crossfadeEnabled;
    }
  }

  // --- Ustawienia kafelków ---
  if (Array.isArray(data.tiles)) {
    console.log("Import: liczba kafelków w pliku:", data.tiles.length);

    const allStates = Array.from(tilesState.values());

    data.tiles.forEach((cfg) => {
      console.log("Przetwarzam wpis:", cfg);

      if (!cfg || typeof cfg.name !== "string") {
        console.warn("Import: wpis bez nazwy, pomijam:", cfg);
        return;
      }

      const st = allStates.find(
        (s) => normalizeName(s.name) === normalizeName(cfg.name)
      );

      if (!st) {
        console.warn("Import: nie znaleziono kafelka dla nazwy:", cfg.name);
        return;
      }

      const colorKey = COLOR_KEYS.includes(cfg.color)
        ? cfg.color
        : DEFAULT_COLOR;

      console.log("Import: ustawiam kolor", cfg.name, "->", colorKey);

      setTileColor(st, colorKey, true);
    });
  }

  console.log("IMPORT END");
}

tilesState.forEach((st) => {
  console.log("RAW:", st.name, " | NORM:", normalizeName(st.name));
});

function updateEmptyInfo() {
    const info = document.getElementById("emptyInfo");
    if (!info) return;

    // poprawiony selektor
    const hasTiles = tilesContainer.querySelectorAll(":scope > div").length > 0;

    info.style.display = hasTiles ? "none" : "block";
}





document.getElementById("tileSizeSelector").addEventListener("change", (e) => {
    tileSize = e.target.value;

    document.querySelectorAll("#tiles > div").forEach(col => {
        col.className = getTileColumnClass();
    });

    localStorage.setItem("tileSize", tileSize);
});





