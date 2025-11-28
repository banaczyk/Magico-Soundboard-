// ---------------- KONFIGURACJA ----------------
const COLOR_KEYS = ['primary', 'success', 'danger', 'warning', 'info', 'dark'];
const DEFAULT_COLOR = 'dark';

// DOM
const tilesContainer = document.getElementById('tiles');
const fileInput = document.getElementById('fileInput');
const clearBtn = document.getElementById('clearBtn');
const crossfadeToggle = document.getElementById('crossfadeToggle');
const fadeSlider = document.getElementById('fadeSlider');
const fadeLabel = document.getElementById('fadeTimeLabel');

fadeSlider.addEventListener('input', () => {
    fadeLabel.textContent = fadeSlider.value;
});

// Stan aplikacji
const tilesState = new Map(); // id -> { audio, tile, ... }
let db = null;
let crossfadeCurrentId = null;

// ---------------- IndexedDB ----------------

const dbRequest = indexedDB.open('JinglownicaDB', 3);

dbRequest.onupgradeneeded = (e) => {
    db = e.target.result;
    let store;
    if (!db.objectStoreNames.contains('audioFiles')) {
        store = db.createObjectStore('audioFiles', { keyPath: 'id', autoIncrement: true });
    } else {
        store = e.target.transaction.objectStore('audioFiles');
    }
    // Dalsza migracja nie jest konieczna – kolor ustawimy domyślnie w JS
};

let dbReady = false;

dbRequest.onsuccess = (e) => {
    db = e.target.result;
    dbReady = true;
    loadSavedFiles();
};


dbRequest.onerror = () => {
    console.error('IndexedDB error');
};

// ---------------- ŁADOWANIE Z BAZY ----------------

function loadSavedFiles() {
    if (!db) return;
    const tx = db.transaction('audioFiles', 'readonly');
    const store = tx.objectStore('audioFiles');
    const req = store.getAll();
    req.onsuccess = () => {
        const rows = req.result || [];
        rows
    .sort((a, b) => a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' }))
    .forEach(row => {
        const data = {
            id: row.id,
            name: row.name,
            blob: row.blob,
            color: row.color || DEFAULT_COLOR
        };
        createTile(data);
    });

    };
}

// ---------------- ZAPIS NOWYCH PLIKÓW ----------------

fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    if (!dbReady) {
    console.warn("DB not ready yet, retrying in 150ms...");
    setTimeout(() => fileInput.dispatchEvent(new Event('change')), 150);
    return;
}

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const blob = new Blob([e.target.result], { type: file.type });

            const tx = db.transaction('audioFiles', 'readwrite');
            const store = tx.objectStore('audioFiles');
            const addReq = store.add({
                name: file.name,
                blob: blob,
                color: DEFAULT_COLOR
            });

            addReq.onsuccess = (ev) => {
                const id = ev.target.result;
                tilesContainer.innerHTML = "";
tilesState.clear();
loadSavedFiles();

            };
        };
        reader.readAsArrayBuffer(file);
    });
});

// ---------------- CZYSZCZENIE LISTY ----------------

clearBtn.addEventListener('click', () => {
    if (!db) return;
    const tx = db.transaction('audioFiles', 'readwrite');
    const store = tx.objectStore('audioFiles');
    const clearReq = store.clear();
    clearReq.onsuccess = () => {
        tilesContainer.innerHTML = '';
        tilesState.clear();
        crossfadeCurrentId = null;
    };
});

// ---------------- TWORZENIE KAFELKA ----------------

function createTile(data) {
    const { id, name, blob, color } = data;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1;

    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-2';

    const tile = document.createElement('div');
    tile.className = 'tile';

    const content = document.createElement('div');
    content.className = 'tile-content';
    content.textContent = name;

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'reset-btn';
    resetBtn.textContent = '↺';

    const fadeIndicator = document.createElement('div');
    fadeIndicator.className = 'fade-indicator';
    fadeIndicator.textContent = 'Fade...';

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    const progress = document.createElement('div');
    progress.className = 'progress';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';
    progress.appendChild(progressBar);
    progressContainer.appendChild(progress);

    const colorBtn = document.createElement('button');
    colorBtn.type = 'button';
    colorBtn.className = 'color-btn';
    colorBtn.textContent = '🎨';

    const colorPicker = document.createElement('div');
    colorPicker.className = 'color-picker';

    COLOR_KEYS.forEach(colKey => {
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = `color-option bg-${colKey}`;
        opt.dataset.color = colKey;
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            setTileColor(state, colKey, true);
            colorPicker.classList.remove('show');
        });
        colorPicker.appendChild(opt);
    });

    colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colorPicker.classList.toggle('show');
    });

    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.currentTime = 0;
    });

    tile.appendChild(content);
    tile.appendChild(resetBtn);
    tile.appendChild(fadeIndicator);
    tile.appendChild(progressContainer);
    tile.appendChild(colorBtn);
    tile.appendChild(colorPicker);

    col.appendChild(tile);
    tilesContainer.appendChild(col);

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
        volumeRestoreTimeoutId: null
    };

    tilesState.set(id, state);

    setTileColor(state, state.color, false);

    tile.addEventListener('click', () => {
        handleTileClick(state);
    });

    audio.addEventListener('timeupdate', () => {
        if (!isFinite(audio.duration) || audio.duration === 0) return;
        const percent = (audio.currentTime / audio.duration) * 100;
        state.progressBarEl.style.width = percent + '%';
    });

    audio.addEventListener('ended', () => {
        state.playing = false;
        state.tileEl.classList.remove('playing');
        state.progressBarEl.style.width = '0%';
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
}

// ---------------- KOLORY KAFELKÓW ----------------

function setTileColor(state, colorKey, saveToDb) {
    const tile = state.tileEl;
    COLOR_KEYS.forEach(c => tile.classList.remove('bg-' + c));
    tile.classList.add('bg-' + colorKey);
    state.color = colorKey;

    if (saveToDb && db) {
        const tx = db.transaction('audioFiles', 'readwrite');
        const store = tx.objectStore('audioFiles');
        store.put({
            id: state.id,
            name: state.name,
            blob: state.blob,
            color: state.color
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
            tile.classList.add('playing');
        } else {
            audio.pause();
            state.playing = false;
            tile.classList.remove('playing');
        }
        return;
    }

    // Tryb crossfade
    if (!state.playing) {
        const newState = state;
        const oldState =
            crossfadeCurrentId && tilesState.get(crossfadeCurrentId) &&
            tilesState.get(crossfadeCurrentId).playing
                ? tilesState.get(crossfadeCurrentId)
                : null;

        if (!oldState || oldState === newState) {
            audio.currentTime = 0;
            audio.volume = 1;
            audio.play();
            newState.playing = true;
            tile.classList.add('playing');
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
        tile.classList.remove('playing');
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
    [oldState, newState].forEach(st => {
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
    newTile.classList.add('playing');
    fadeIndicator.classList.add('fade-active');

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

            fadeIndicator.classList.remove('fade-active');

            oldAudio.pause();
            oldAudio.currentTime = 0;
            oldState.playing = false;
            oldState.tileEl.classList.remove('playing');

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
