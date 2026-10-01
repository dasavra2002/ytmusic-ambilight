// ==UserScript==
// @name         Ambient Light for YouTube Music™
// @namespace    https://music.youtube.com/
// @version      1.1.0
// @description  Immersive Ambilight glow for YouTube Music (music videos & album covers).
// @author       Anirban Das
// @match        https://music.youtube.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('[YTM Ambilight Userscript] Starting...');

  const CSS = `
/* YouTube Music Ambilight Styles - Cross-Browser Compatible */

:root {
  --ytm-ambilight-blur: 60px;
  --ytm-ambilight-spread: 1.18;
  --ytm-ambilight-brightness: 1.25;
  --ytm-ambilight-contrast: 1.15;
  --ytm-ambilight-saturate: 1.5;
  --ytm-ambilight-opacity: 0.95;
  --ytm-ambilight-bg-opacity: 0;
  --ytm-ambilight-pulse-scale: 1;
  --ytm-ambilight-pulse-opacity: 1;
}

/* 1. LOCK SCROLL ONLY WHEN EXPANDED PLAYER SCREEN IS OPEN (Never freeze homescreen or miniplayer!) */
body.ytm-player-open,
html:has(ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"])),
body:has(ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"])) {
  overflow: hidden !important;
  overscroll-behavior: none !important;
}

ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) {
  overflow: hidden !important;
  overscroll-behavior: none !important;
  --ytmusic-player-page-vertical-padding: 0px !important;
}

/* Allow the side-panel (Up Next queue, lyrics, comments) to scroll its own list smoothly */
body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #side-panel,
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #side-panel {
  position: relative !important;
  z-index: 2 !important;
  overflow-y: auto !important;
}

body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #main-panel,
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #main-panel {
  position: relative !important;
  z-index: 2 !important;
  overflow: visible !important;
}

/* 2. PLAYER ELEVATION: Player stays crisp on top with shadow ONLY when expanded player page is open */
body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]),
body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #player.ytmusic-player-page:not([player-ui-state="MINIPLAYER"]),
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]),
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #player.ytmusic-player-page:not([player-ui-state="MINIPLAYER"]) {
  position: relative !important;
  z-index: 3 !important;
  overflow: visible !important;
  box-shadow: 0 14px 45px rgba(0, 0, 0, 0.7) !important;
  border-radius: 12px !important;
}

body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]) #song-video,
body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]) #song-image,
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]) #song-video,
ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) ytmusic-player#player:not([player-ui-state="MINIPLAYER"]) #song-image {
  border-radius: 12px !important;
  overflow: hidden !important;
}

/* 3. PURE AMBILIGHT EDGE GLOW: Diffused halo directly behind the album art / video screen */
#ytm-ambilight-edge-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%) scale(calc(var(--ytm-ambilight-spread, 1.18) * var(--ytm-ambilight-pulse-scale, 1)));
  -moz-transform: translate(-50%, -50%) scale(calc(var(--ytm-ambilight-spread, 1.18) * var(--ytm-ambilight-pulse-scale, 1)));
  transform: translate(-50%, -50%) scale(calc(var(--ytm-ambilight-spread, 1.18) * var(--ytm-ambilight-pulse-scale, 1)));
  pointer-events: none;
  z-index: 1 !important;
  border-radius: 20px;
  overflow: visible !important;
  display: none !important; /* Hidden by default unless full player is open */
  align-items: center;
  justify-content: center;
  -webkit-transition: -webkit-transform 0.08s ease-out, opacity 0.3s ease;
  transition: transform 0.08s ease-out, opacity 0.3s ease;
  will-change: transform, filter, opacity;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* Display edge glow ONLY when expanded player page is open and glow is enabled */
body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #ytm-ambilight-edge-wrapper:not(.ytm-ambilight-hidden),
body.ytm-player-open #main-panel:not([player-ui-state="MINIPLAYER"]) #ytm-ambilight-edge-wrapper:not(.ytm-ambilight-hidden),
body.ytm-player-open #ytm-ambilight-edge-wrapper:not(.ytm-ambilight-hidden) {
  display: flex !important;
}

#ytm-ambilight-edge-canvas {
  width: 100%;
  height: 100%;
  border-radius: 20px;
  -webkit-filter: blur(var(--ytm-ambilight-blur, 60px))
                  brightness(var(--ytm-ambilight-brightness, 1.25))
                  contrast(var(--ytm-ambilight-contrast, 1.15))
                  saturate(var(--ytm-ambilight-saturate, 1.5));
  filter: blur(var(--ytm-ambilight-blur, 60px))
          brightness(var(--ytm-ambilight-brightness, 1.25))
          contrast(var(--ytm-ambilight-contrast, 1.15))
          saturate(var(--ytm-ambilight-saturate, 1.5));
  opacity: calc(var(--ytm-ambilight-opacity, 0.95) * var(--ytm-ambilight-pulse-opacity, 1));
  pointer-events: none;
  will-change: filter, opacity;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* 4. OPTIONAL BACKGROUND GLOW: Off by default so top space remains native clean black */
#ytm-ambilight-page-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0 !important;
  overflow: hidden !important;
  display: none !important;
  opacity: var(--ytm-ambilight-bg-opacity, 0);
  -webkit-transition: opacity 0.4s ease;
  transition: opacity 0.4s ease;
  will-change: opacity;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 35% 50%, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0) 75%);
  mask-image: radial-gradient(ellipse 70% 60% at 35% 50%, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0) 75%);
}

body.ytm-player-open ytmusic-player-page[player-page-open]:not([player-ui-state="MINIPLAYER"]) #ytm-ambilight-page-bg:not(.ytm-ambilight-hidden) {
  display: block !important;
}

#ytm-ambilight-page-canvas {
  position: absolute;
  top: -10%;
  left: -10%;
  width: 120%;
  height: 120%;
  -webkit-filter: blur(80px)
                  brightness(var(--ytm-ambilight-brightness, 1.25))
                  saturate(var(--ytm-ambilight-saturate, 1.5));
  filter: blur(80px)
          brightness(var(--ytm-ambilight-brightness, 1.25))
          saturate(var(--ytm-ambilight-saturate, 1.5));
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
}

/* 5. STRICT HIDING FOR MINIPLAYER AND CLOSED STATES */
#ytm-ambilight-edge-wrapper.ytm-ambilight-hidden,
#ytm-ambilight-page-bg.ytm-ambilight-hidden,
body:not(.ytm-player-open) #ytm-ambilight-edge-wrapper,
body:not(.ytm-player-open) #ytm-ambilight-page-bg,
ytmusic-player-page:not([player-page-open]) #ytm-ambilight-edge-wrapper,
ytmusic-player-page:not([player-page-open]) #ytm-ambilight-page-bg,
ytmusic-player[player-ui-state="MINIPLAYER"] ~ #ytm-ambilight-edge-wrapper,
[player-ui-state="MINIPLAYER"] #ytm-ambilight-edge-wrapper,
[player-ui-state="MINIPLAYER"] #ytm-ambilight-page-bg,
.ytm-ambilight-hidden {
  display: none !important;
}

/* 6. ON-SCREEN HUD TOAST NOTIFICATION (Hotkey Alt+A feedback) */
#ytm-ambilight-hud-toast {
  position: fixed !important;
  top: 76px !important;
  left: 50% !important;
  transform: translateX(-50%) translateY(-12px) !important;
  background: rgba(18, 18, 18, 0.88) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  border-radius: 30px !important;
  padding: 8px 18px !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  color: #f1f1f1 !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  letter-spacing: -0.1px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
  z-index: 9999999 !important;
  pointer-events: none !important;
  opacity: 0 !important;
  transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

#ytm-ambilight-hud-toast.ytm-hud-show {
  opacity: 1 !important;
  transform: translateX(-50%) translateY(0) !important;
}

.ytm-hud-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #666 !important;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.4) !important;
  transition: background 0.2s ease, box-shadow 0.2s ease !important;
}

.ytm-hud-dot.ytm-hud-active {
  background: #ff0033 !important;
  box-shadow: 0 0 10px #ff0033 !important;
}

`;

  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(CSS);
  } else {
    const s = document.createElement('style');
    s.id = 'ytm-ambilight-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Content script logic

/**
 * Ambient Light for YouTube Music™
 * Cross-Browser Real-Time Ambilight Engine
 */

(function () {
  'use strict';

  console.log('[YTM Ambilight] Initializing extension...');

  // Configuration defaults
  const DEFAULT_CONFIG = {
    enabled: true,
    preset: 'vibrant',
    blur: 60,
    spread: 1.18,
    brightness: 125,
    contrast: 115,
    saturation: 150,
    opacity: 95,
    bgGlow: false,
    bgOpacity: 35,
    fps: 30,
    audioReactive: false,
    pulseSensitivity: 25
  };

  let config = { ...DEFAULT_CONFIG };

  // DOM Elements
  let edgeWrapper = null;
  let edgeCanvas = null;
  let edgeCtx = null;
  let pageBgWrapper = null;
  let pageBgCanvas = null;
  let pageBgCtx = null;
  let sampleCanvas = null;
  let sampleCtx = null;

  let animFrameId = null;
  let lastFrameTime = 0;
  let currentVideoElement = null;
  let cachedMediaSessionImg = null;
  let lastArtworkUrl = '';
  let hudTimeout = null;

  // Audio Reactivity Engine State
  let audioCtx = null;
  let audioSourceNode = null;
  let audioAnalyserNode = null;
  let audioFreqBuffer = null;
  let hookedVideoEl = null;
  let smoothedBass = 0;

  const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  function init() {
    loadSettings(() => {
      setupDOM();
      setupObservers();
      setupKeyboardShortcuts();
      startLoop();
      console.log('[YTM Ambilight] Started successfully.');
    });
  }

  // Load user settings
  function loadSettings(callback) {
    if (browserAPI && browserAPI.storage) {
      const storageArea = browserAPI.storage.sync || browserAPI.storage.local;

      function onSettings(items) {
        config = { ...DEFAULT_CONFIG, ...(items || {}) };
        applyConfigToCSS();
        if (callback) callback();
      }

      try {
        const result = storageArea.get(DEFAULT_CONFIG, (items) => {
          if (browserAPI.runtime && browserAPI.runtime.lastError && browserAPI.storage.local) {
            browserAPI.storage.local.get(DEFAULT_CONFIG, onSettings);
            return;
          }
          onSettings(items);
        });

        if (result && typeof result.then === 'function') {
          result.then(onSettings).catch(() => {
            if (browserAPI.storage.local) {
              browserAPI.storage.local.get(DEFAULT_CONFIG).then(onSettings).catch(() => onSettings(DEFAULT_CONFIG));
            } else {
              onSettings(DEFAULT_CONFIG);
            }
          });
        }
      } catch (e) {
        onSettings(DEFAULT_CONFIG);
      }

      if (browserAPI.storage.onChanged) {
        browserAPI.storage.onChanged.addListener((changes) => {
          for (let key in changes) {
            config[key] = changes[key].newValue;
          }
          applyConfigToCSS();
        });
      }
    } else {
      applyConfigToCSS();
      if (callback) callback();
    }
  }

  function applyConfigToCSS() {
    const root = document.documentElement;
    root.style.setProperty('--ytm-ambilight-blur', `${config.blur}px`);
    root.style.setProperty('--ytm-ambilight-spread', `${config.spread}`);
    root.style.setProperty('--ytm-ambilight-brightness', `${config.brightness / 100}`);
    root.style.setProperty('--ytm-ambilight-contrast', `${config.contrast / 100}`);
    root.style.setProperty('--ytm-ambilight-saturate', `${config.saturation / 100}`);
    root.style.setProperty('--ytm-ambilight-opacity', `${config.opacity / 100}`);
    root.style.setProperty('--ytm-ambilight-bg-opacity', config.bgGlow ? `${config.bgOpacity / 100}` : '0');

    if (edgeWrapper) {
      edgeWrapper.classList.toggle('ytm-ambilight-hidden', !config.enabled);
    }
    if (pageBgWrapper) {
      pageBgWrapper.classList.toggle('ytm-ambilight-hidden', !config.enabled || !config.bgGlow);
    }

    if (!config.audioReactive) {
      root.style.setProperty('--ytm-ambilight-pulse-scale', '1');
      root.style.setProperty('--ytm-ambilight-pulse-opacity', '1');
    }

    removeResidualBarClasses();
  }

  function removeResidualBarClasses() {
    try {
      const els = document.querySelectorAll('.ytm-ambilight-bar-glow');
      els.forEach(el => el.classList.remove('ytm-ambilight-bar-glow'));
    } catch (e) {}
  }

  function showHudToast(text, isActive) {
    let hud = document.getElementById('ytm-ambilight-hud-toast');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'ytm-ambilight-hud-toast';
      hud.innerHTML = '<span class="ytm-hud-dot"></span><span class="ytm-hud-label"></span>';
      document.body.appendChild(hud);
    }
    const dot = hud.querySelector('.ytm-hud-dot');
    const label = hud.querySelector('.ytm-hud-label');
    if (label) label.textContent = text;
    if (dot) dot.classList.toggle('ytm-hud-active', !!isActive);

    hud.classList.remove('ytm-hud-show');
    void hud.offsetWidth; // Force CSS reflow
    hud.classList.add('ytm-hud-show');

    if (hudTimeout) clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => {
      if (hud) hud.classList.remove('ytm-hud-show');
    }, 1800);
  }

  function toggleAmbilight() {
    config.enabled = !config.enabled;
    if (browserAPI && browserAPI.storage) {
      const area = browserAPI.storage.sync || browserAPI.storage.local;
      if (area) {
        try {
          area.set({ enabled: config.enabled });
        } catch (e) {
          if (browserAPI.storage.local) browserAPI.storage.local.set({ enabled: config.enabled });
        }
      }
    }
    applyConfigToCSS();
    showHudToast(config.enabled ? 'Ambilight: On' : 'Ambilight: Off', config.enabled);
  }

  function setupKeyboardShortcuts() {
    // 1. Direct in-page keydown listener (works in userscripts & all extensions)
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
        const tag = e.target ? e.target.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleAmbilight();
      }
    }, true);

    // 2. Command listener from background service worker (native browser shortcuts)
    if (browserAPI && browserAPI.runtime && browserAPI.runtime.onMessage) {
      try {
        browserAPI.runtime.onMessage.addListener((msg) => {
          if (msg && msg.type === 'TOGGLE_AMBILIGHT') {
            toggleAmbilight();
          }
        });
      } catch (err) {}
    }
  }

  function initAudioReactivity(video) {
    if (!video || hookedVideoEl === video) return;
    if (!config.audioReactive) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtx) {
        audioCtx = new AudioCtxClass();
      }

      // Resume on user interaction if context starts suspended
      if (audioCtx.state === 'suspended') {
        const unlock = () => {
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
      }

      // Connect media element source only once per HTMLVideoElement
      if (!audioSourceNode) {
        audioSourceNode = audioCtx.createMediaElementSource(video);
        audioAnalyserNode = audioCtx.createAnalyser();
        audioAnalyserNode.fftSize = 64;
        audioAnalyserNode.smoothingTimeConstant = 0.65;
        audioFreqBuffer = new Uint8Array(audioAnalyserNode.frequencyBinCount);

        audioSourceNode.connect(audioAnalyserNode);
        audioAnalyserNode.connect(audioCtx.destination);
        hookedVideoEl = video;
      }
    } catch (err) {
      // Audio element might already be connected or cross-origin restricted
      console.warn('[YTM Ambilight] Audio reactivity attachment note:', err.message);
    }
  }

  function processAudioPulse(video) {
    const root = document.documentElement;

    if (!config.audioReactive || !config.enabled) {
      if (smoothedBass > 0.001) {
        smoothedBass = 0;
        root.style.setProperty('--ytm-ambilight-pulse-scale', '1');
        root.style.setProperty('--ytm-ambilight-pulse-opacity', '1');
      }
      return;
    }

    if (video && !hookedVideoEl) {
      initAudioReactivity(video);
    }

    if (audioCtx && audioCtx.state === 'suspended' && video && !video.paused) {
      audioCtx.resume().catch(() => {});
    }

    let rawBass = 0;
    if (audioAnalyserNode && audioFreqBuffer && video && !video.paused && !video.ended) {
      try {
        audioAnalyserNode.getByteFrequencyData(audioFreqBuffer);
        const bassSum = (audioFreqBuffer[0] || 0) + (audioFreqBuffer[1] || 0) + (audioFreqBuffer[2] || 0);
        rawBass = bassSum / (3 * 255);
      } catch (e) {
        rawBass = 0;
      }
    }

    smoothedBass = smoothedBass * 0.7 + rawBass * 0.3;

    if (smoothedBass > 0.01) {
      const intensity = (config.pulseSensitivity || 25) / 100;
      const pulseScale = 1.0 + (smoothedBass * intensity * 0.14);
      const pulseOpacity = 1.0 + (smoothedBass * intensity * 0.16);
      root.style.setProperty('--ytm-ambilight-pulse-scale', pulseScale.toFixed(3));
      root.style.setProperty('--ytm-ambilight-pulse-opacity', pulseOpacity.toFixed(3));
    } else {
      root.style.setProperty('--ytm-ambilight-pulse-scale', '1');
      root.style.setProperty('--ytm-ambilight-pulse-opacity', '1');
    }
  }

  function setupDOM() {
    // 1. Offscreen sample buffer canvas
    if (!sampleCanvas) {
      sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 64;
      sampleCanvas.height = 36;
      try {
        sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      } catch (e) {
        sampleCtx = sampleCanvas.getContext('2d');
      }
    }

    // 2. Full Page Ambient Background
    if (!pageBgWrapper) {
      pageBgWrapper = document.createElement('div');
      pageBgWrapper.id = 'ytm-ambilight-page-bg';
      pageBgCanvas = document.createElement('canvas');
      pageBgCanvas.id = 'ytm-ambilight-page-canvas';
      pageBgCanvas.width = 80;
      pageBgCanvas.height = 45;
      pageBgCtx = pageBgCanvas.getContext('2d');
      pageBgWrapper.appendChild(pageBgCanvas);
    }

    // 3. Player Edge Glow
    if (!edgeWrapper) {
      edgeWrapper = document.createElement('div');
      edgeWrapper.id = 'ytm-ambilight-edge-wrapper';
      edgeCanvas = document.createElement('canvas');
      edgeCanvas.id = 'ytm-ambilight-edge-canvas';
      edgeCanvas.width = 96;
      edgeCanvas.height = 96;
      edgeCtx = edgeCanvas.getContext('2d');
      edgeWrapper.appendChild(edgeCanvas);
    }

    mountElements();
    applyConfigToCSS();
  }

  function mountElements() {
    // Mount background glow inside ytmusic-player-page
    const playerPage = document.querySelector('ytmusic-player-page#player-page') ||
                       document.querySelector('ytmusic-player-page') ||
                       document.getElementById('player-page');

    if (playerPage && pageBgWrapper && !playerPage.contains(pageBgWrapper)) {
      playerPage.insertBefore(pageBgWrapper, playerPage.firstChild);
    }

    // Mount edge glow directly behind the player without modifying native parent layout
    const player = document.querySelector('ytmusic-player#player') ||
                   document.querySelector('#player.ytmusic-player-page') ||
                   document.querySelector('ytmusic-player');

    if (player && player.parentElement && edgeWrapper && !player.parentElement.contains(edgeWrapper)) {
      player.parentElement.insertBefore(edgeWrapper, player);
    }

    syncDimensions();
  }

  function syncDimensions() {
    const player = document.querySelector('ytmusic-player#player') ||
                   document.querySelector('#player.ytmusic-player-page') ||
                   document.querySelector('ytmusic-player');

    if (!player || !edgeWrapper || !edgeCanvas) return;
    if (!document.body.classList.contains('ytm-player-open')) return;

    const rect = player.getBoundingClientRect();
    if (rect.width > 50 && rect.height > 50) {
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      edgeWrapper.style.width = `${w}px`;
      edgeWrapper.style.height = `${h}px`;

      const aspect = w / h;
      if (Math.abs(aspect - 1) < 0.15) {
        // Square album cover
        if (edgeCanvas.width !== 96 || edgeCanvas.height !== 96) {
          edgeCanvas.width = 96;
          edgeCanvas.height = 96;
        }
      } else {
        // Widescreen video
        if (edgeCanvas.width !== 128 || edgeCanvas.height !== 72) {
          edgeCanvas.width = 128;
          edgeCanvas.height = 72;
        }
      }
    }
  }

  function setupObservers() {
    // Observe player resizing
    const player = document.querySelector('ytmusic-player#player') || document.querySelector('ytmusic-player');
    if (player && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => syncDimensions());
      ro.observe(player);
    }

    // Observe playerPage, player, and app for player-page-open and player-ui-state changes
    const playerPage = document.querySelector('ytmusic-player-page');
    if (playerPage) {
      const pageObserver = new MutationObserver(() => checkPlayerState());
      pageObserver.observe(playerPage, { attributes: true, attributeFilter: ['player-page-open', 'player-ui-state'] });
    }

    if (player) {
      const playerObserver = new MutationObserver(() => checkPlayerState());
      playerObserver.observe(player, { attributes: true, attributeFilter: ['player-ui-state'] });
    }

    const app = document.querySelector('ytmusic-app');
    if (app) {
      const appObserver = new MutationObserver(() => checkPlayerState());
      appObserver.observe(app, { attributes: true, attributeFilter: ['player-ui-state'] });
    }

    checkPlayerState();

    // Re-check mount periodically for SPA transitions
    setInterval(() => {
      mountElements();
      updateMediaSessionArt();
      checkPlayerState();
    }, 1500);
  }

  function checkPlayerState() {
    const playerPage = document.querySelector('ytmusic-player-page#player-page') || document.querySelector('ytmusic-player-page');
    const player = document.querySelector('ytmusic-player#player') || document.querySelector('ytmusic-player');
    const app = document.querySelector('ytmusic-app');

    const pageOpenAttr = !!(playerPage && playerPage.hasAttribute('player-page-open'));
    const isMiniplayer = !!(
      (player && player.getAttribute('player-ui-state') === 'MINIPLAYER') ||
      (playerPage && playerPage.getAttribute('player-ui-state') === 'MINIPLAYER') ||
      (app && app.getAttribute('player-ui-state') === 'MINIPLAYER')
    );

    const isPlayerOpen = pageOpenAttr && !isMiniplayer;
    document.body.classList.toggle('ytm-player-open', isPlayerOpen);
    document.body.classList.toggle('ytm-miniplayer', isMiniplayer);

    if (edgeWrapper) {
      edgeWrapper.classList.toggle('ytm-ambilight-hidden', !isPlayerOpen || !config.enabled);
    }
    if (pageBgWrapper) {
      pageBgWrapper.classList.toggle('ytm-ambilight-hidden', !isPlayerOpen || !config.enabled || !config.bgGlow);
    }
  }

  // Preload high-res artwork from mediaSession
  function updateMediaSessionArt() {
    if (navigator.mediaSession && navigator.mediaSession.metadata && navigator.mediaSession.metadata.artwork) {
      const list = navigator.mediaSession.metadata.artwork;
      if (list && list.length > 0) {
        const src = list[list.length - 1].src;
        if (src && src !== lastArtworkUrl) {
          lastArtworkUrl = src;
          const img = new Image();
          img.src = src;
          img.onload = () => {
            cachedMediaSessionImg = img;
          };
        }
      }
    }
  }

  // Search across light DOM and shadow roots for active album art
  function getAlbumArtElement() {
    // 1. #song-image inside player (check shadow root)
    const songImg = document.querySelector('#song-image');
    if (songImg) {
      const ytImgShadow = songImg.querySelector('yt-img-shadow');
      if (ytImgShadow && ytImgShadow.shadowRoot) {
        const img = ytImgShadow.shadowRoot.querySelector('img');
        if (img && img.src && img.complete && img.naturalWidth > 0) return img;
      }
      const directImg = songImg.querySelector('img');
      if (directImg && directImg.src && directImg.complete && directImg.naturalWidth > 0) return directImg;
    }

    // 2. ytmusic-player shadow root
    const player = document.querySelector('ytmusic-player');
    if (player) {
      const ytImgShadow = player.querySelector('yt-img-shadow');
      if (ytImgShadow && ytImgShadow.shadowRoot) {
        const img = ytImgShadow.shadowRoot.querySelector('img');
        if (img && img.src && img.complete && img.naturalWidth > 0) return img;
      }
      const img = player.querySelector('img#img') || player.querySelector('img');
      if (img && img.src && img.complete && img.naturalWidth > 0) return img;
    }

    // 3. Player bar thumbnail
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
      const barShadow = playerBar.querySelector('yt-img-shadow');
      if (barShadow && barShadow.shadowRoot) {
        const img = barShadow.shadowRoot.querySelector('img');
        if (img && img.src && img.complete && img.naturalWidth > 0) return img;
      }
      const barImg = playerBar.querySelector('img.image') || playerBar.querySelector('img#img') || playerBar.querySelector('img');
      if (barImg && barImg.src && barImg.complete && barImg.naturalWidth > 0) return barImg;
    }

    // 4. Any visible img#img
    const allImgs = document.querySelectorAll('img#img');
    for (let i = 0; i < allImgs.length; i++) {
      if (allImgs[i].src && allImgs[i].complete && allImgs[i].naturalWidth > 50) {
        return allImgs[i];
      }
    }

    // 5. Preloaded high-res MediaSession artwork
    if (cachedMediaSessionImg && cachedMediaSessionImg.complete && cachedMediaSessionImg.naturalWidth > 0) {
      return cachedMediaSessionImg;
    }

    return null;
  }

  // Check if sample canvas has non-black visual content
  function hasVisualContent(ctx, w, h) {
    try {
      const p1 = ctx.getImageData(Math.floor(w * 0.25), Math.floor(h * 0.25), 1, 1).data;
      const p2 = ctx.getImageData(Math.floor(w * 0.75), Math.floor(h * 0.25), 1, 1).data;
      const p3 = ctx.getImageData(Math.floor(w * 0.5), Math.floor(h * 0.5), 1, 1).data;
      const p4 = ctx.getImageData(Math.floor(w * 0.5), Math.floor(h * 0.75), 1, 1).data;

      const sum = (p1[0] + p1[1] + p1[2]) +
                  (p2[0] + p2[1] + p2[2]) +
                  (p3[0] + p3[1] + p3[2]) +
                  (p4[0] + p4[1] + p4[2]);
      return sum > 20;
    } catch (e) {
      return true;
    }
  }

  // Core render frame
  function renderFrame() {
    if (!config.enabled || !sampleCtx || !edgeCtx) return;

    const video = currentVideoElement && currentVideoElement.isConnected ?
                  currentVideoElement :
                  (currentVideoElement = document.querySelector('video.html5-main-video') || document.querySelector('video'));

    // Process real-time beat reactivity
    processAudioPulse(video);

    let drawn = false;

    // 1. Try video element if playing
    if (video && !video.paused && !video.ended && video.readyState >= 2 && video.videoWidth > 0) {
      try {
        sampleCtx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height);
        if (hasVisualContent(sampleCtx, sampleCanvas.width, sampleCanvas.height)) {
          drawn = true;
        }
      } catch (err) {}
    }

    // 2. If video was pitch-black or not playing, sample album art image
    if (!drawn) {
      const artImg = getAlbumArtElement();
      if (artImg) {
        try {
          sampleCtx.drawImage(artImg, 0, 0, sampleCanvas.width, sampleCanvas.height);
          drawn = true;
        } catch (err) {}
      }
    }

    // 3. Project sample buffer onto edge and background glow canvases
    if (drawn) {
      edgeCtx.drawImage(sampleCanvas, 0, 0, edgeCanvas.width, edgeCanvas.height);
      if (pageBgCtx && config.bgGlow) {
        pageBgCtx.drawImage(sampleCanvas, 0, 0, pageBgCanvas.width, pageBgCanvas.height);
      }
    }
  }

  // Main animation loop
  function loop(timestamp) {
    animFrameId = requestAnimationFrame(loop);

    const targetFps = config.fps || 30;
    const interval = 1000 / targetFps;
    const elapsed = timestamp - lastFrameTime;

    if (elapsed < interval) return;
    lastFrameTime = timestamp - (elapsed % interval);

    renderFrame();
  }

  function startLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


})();
