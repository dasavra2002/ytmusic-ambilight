/**
 * YouTube Music Ambilight - Popup Controller
 * Universal cross-browser storage wrapper (Chrome, Edge, Firefox, Safari/Orion)
 */

const PRESETS = {
  vibrant: {
    blur: 60,
    spread: 1.18,
    brightness: 125,
    saturation: 150
  },
  cinematic: {
    blur: 90,
    spread: 1.25,
    brightness: 110,
    saturation: 120
  },
  subtle: {
    blur: 110,
    spread: 1.12,
    brightness: 90,
    saturation: 100
  },
  monochrome: {
    blur: 75,
    spread: 1.18,
    brightness: 115,
    saturation: 0
  }
};

const DEFAULTS = {
  enabled: true,
  preset: 'vibrant',
  blur: 60,
  spread: 1.18,
  brightness: 125,
  saturation: 150,
  opacity: 95,
  bgGlow: false,
  bgOpacity: 35,
  fps: 30,
  audioReactive: false,
  pulseSensitivity: 25
};

// Unified storage wrapper with fallback from sync to local
const StorageService = {
  getApi() {
    return typeof browser !== 'undefined' && browser.storage ? browser : chrome;
  },

  getStorageArea() {
    const api = this.getApi();
    return (api.storage && api.storage.sync) ? api.storage.sync : (api.storage && api.storage.local ? api.storage.local : null);
  },

  get(keys, callback) {
    const area = this.getStorageArea();
    if (!area) {
      if (callback) callback(DEFAULTS);
      return;
    }

    try {
      const result = area.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          const localArea = this.getApi().storage.local;
          if (localArea && localArea !== area) {
            localArea.get(keys, (fallbackItems) => callback(fallbackItems || DEFAULTS));
            return;
          }
        }
        callback(items || DEFAULTS);
      });

      if (result && typeof result.then === 'function') {
        result.then(items => callback(items || DEFAULTS)).catch(() => {
          const local = this.getApi().storage.local;
          if (local) local.get(keys).then(items => callback(items || DEFAULTS)).catch(() => callback(DEFAULTS));
          else callback(DEFAULTS);
        });
      }
    } catch (e) {
      callback(DEFAULTS);
    }
  },

  set(items, callback) {
    const area = this.getStorageArea();
    if (!area) return;

    try {
      const result = area.set(items, () => {
        if (chrome.runtime.lastError) {
          const localArea = this.getApi().storage.local;
          if (localArea) localArea.set(items, callback);
          return;
        }
        if (callback) callback();
      });

      if (result && typeof result.then === 'function') {
        result.then(() => { if (callback) callback(); }).catch(() => {
          const local = this.getApi().storage.local;
          if (local) local.set(items).then(() => { if (callback) callback(); });
        });
      }
    } catch (e) {
      const local = this.getApi().storage.local;
      if (local) local.set(items);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const toggleEnabled = document.getElementById('toggle-enabled');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const inputBlur = document.getElementById('input-blur');
  const valBlur = document.getElementById('val-blur');
  const inputSpread = document.getElementById('input-spread');
  const valSpread = document.getElementById('val-spread');
  const inputBrightness = document.getElementById('input-brightness');
  const valBrightness = document.getElementById('val-brightness');
  const inputSaturation = document.getElementById('input-saturation');
  const valSaturation = document.getElementById('val-saturation');
  const toggleAudioReactive = document.getElementById('toggle-audio-reactive');
  const rowPulseSens = document.getElementById('row-pulse-sens');
  const inputPulseSens = document.getElementById('input-pulse-sens');
  const valPulseSens = document.getElementById('val-pulse-sens');
  const toggleBgGlow = document.getElementById('toggle-bg-glow');
  const fpsButtons = document.querySelectorAll('.fps-btn');
  const btnReset = document.getElementById('btn-reset');

  let currentSettings = { ...DEFAULTS };

  // Load saved settings
  StorageService.get(DEFAULTS, (settings) => {
    currentSettings = { ...DEFAULTS, ...settings };
    renderUI();
  });

  function renderUI() {
    toggleEnabled.checked = currentSettings.enabled;
    inputBlur.value = currentSettings.blur;
    valBlur.textContent = `${currentSettings.blur}px`;

    inputSpread.value = currentSettings.spread;
    valSpread.textContent = `${Math.round(currentSettings.spread * 100)}%`;

    inputBrightness.value = currentSettings.brightness;
    valBrightness.textContent = `${currentSettings.brightness}%`;

    inputSaturation.value = currentSettings.saturation;
    valSaturation.textContent = `${currentSettings.saturation}%`;

    toggleBgGlow.checked = currentSettings.bgGlow;

    toggleAudioReactive.checked = !!currentSettings.audioReactive;
    rowPulseSens.style.display = currentSettings.audioReactive ? 'flex' : 'none';
    inputPulseSens.value = currentSettings.pulseSensitivity || 25;
    valPulseSens.textContent = `${currentSettings.pulseSensitivity || 25}%`;

    updateActivePreset();

    fpsButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.fps) === currentSettings.fps);
    });
  }

  function updateActivePreset() {
    presetButtons.forEach(btn => {
      const presetKey = btn.dataset.preset;
      const p = PRESETS[presetKey];
      const isMatch = p &&
        p.blur === currentSettings.blur &&
        Math.abs(p.spread - currentSettings.spread) < 0.005 &&
        p.brightness === currentSettings.brightness &&
        p.saturation === currentSettings.saturation;

      btn.classList.toggle('active', isMatch);
    });
  }

  function save(key, value) {
    currentSettings[key] = value;
    StorageService.set({ [key]: value });
  }

  function saveMultiple(obj) {
    Object.assign(currentSettings, obj);
    StorageService.set(obj);
  }

  // Preset button clicks
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      const p = PRESETS[presetKey];
      if (p) {
        saveMultiple({
          preset: presetKey,
          blur: p.blur,
          spread: p.spread,
          brightness: p.brightness,
          saturation: p.saturation
        });
        renderUI();
      }
    });
  });

  // Event listeners
  toggleEnabled.addEventListener('change', (e) => save('enabled', e.target.checked));

  inputBlur.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valBlur.textContent = `${val}px`;
    currentSettings.blur = val;
    currentSettings.preset = 'custom';
    updateActivePreset();
    saveMultiple({ blur: val, preset: 'custom' });
  });

  inputSpread.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    valSpread.textContent = `${Math.round(val * 100)}%`;
    currentSettings.spread = val;
    currentSettings.preset = 'custom';
    updateActivePreset();
    saveMultiple({ spread: val, preset: 'custom' });
  });

  inputBrightness.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valBrightness.textContent = `${val}%`;
    currentSettings.brightness = val;
    currentSettings.preset = 'custom';
    updateActivePreset();
    saveMultiple({ brightness: val, preset: 'custom' });
  });

  inputSaturation.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valSaturation.textContent = `${val}%`;
    currentSettings.saturation = val;
    currentSettings.preset = 'custom';
    updateActivePreset();
    saveMultiple({ saturation: val, preset: 'custom' });
  });

  toggleAudioReactive.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    save('audioReactive', isChecked);
    rowPulseSens.style.display = isChecked ? 'flex' : 'none';
  });

  inputPulseSens.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    valPulseSens.textContent = `${val}%`;
    save('pulseSensitivity', val);
  });

  toggleBgGlow.addEventListener('change', (e) => save('bgGlow', e.target.checked));

  fpsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const fps = parseInt(btn.dataset.fps);
      save('fps', fps);
      fpsButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  btnReset.addEventListener('click', () => {
    currentSettings = { ...DEFAULTS };
    StorageService.set(DEFAULTS, () => {
      renderUI();
    });
  });
});
