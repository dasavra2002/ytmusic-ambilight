/**
 * YouTube Music Ambilight - Popup Controller
 * Universal cross-browser storage wrapper (Chrome, Edge, Firefox, Safari/Orion)
 */

const DEFAULTS = {
  enabled: true,
  blur: 60,
  spread: 1.18,
  brightness: 125,
  saturation: 150,
  opacity: 95,
  bgGlow: false,
  bgOpacity: 35,
  fps: 30
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
          // Fall back to local storage if sync failed (e.g. in Firefox with sync disabled)
          const localArea = this.getApi().storage.local;
          if (localArea && localArea !== area) {
            localArea.get(keys, (fallbackItems) => callback(fallbackItems || DEFAULTS));
            return;
          }
        }
        callback(items || DEFAULTS);
      });

      // If promise-based (Firefox native browser namespace)
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
  const inputBlur = document.getElementById('input-blur');
  const valBlur = document.getElementById('val-blur');
  const inputSpread = document.getElementById('input-spread');
  const valSpread = document.getElementById('val-spread');
  const inputBrightness = document.getElementById('input-brightness');
  const valBrightness = document.getElementById('val-brightness');
  const inputSaturation = document.getElementById('input-saturation');
  const valSaturation = document.getElementById('val-saturation');
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

    fpsButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.fps) === currentSettings.fps);
    });
  }

  function save(key, value) {
    currentSettings[key] = value;
    StorageService.set({ [key]: value });
  }

  // Event listeners
  toggleEnabled.addEventListener('change', (e) => save('enabled', e.target.checked));

  inputBlur.addEventListener('input', (e) => {
    valBlur.textContent = `${e.target.value}px`;
    save('blur', parseInt(e.target.value));
  });

  inputSpread.addEventListener('input', (e) => {
    valSpread.textContent = `${Math.round(e.target.value * 100)}%`;
    save('spread', parseFloat(e.target.value));
  });

  inputBrightness.addEventListener('input', (e) => {
    valBrightness.textContent = `${e.target.value}%`;
    save('brightness', parseInt(e.target.value));
  });

  inputSaturation.addEventListener('input', (e) => {
    valSaturation.textContent = `${e.target.value}%`;
    save('saturation', parseInt(e.target.value));
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
