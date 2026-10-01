/**
 * Ambient Light for YouTube Music™
 * Cross-Browser Real-Time Ambilight Engine
 */

(function () {
  'use strict';

  console.log('[YTM Ambilight] Initializing extension...');

  // Configuration defaults: Pure edge ambilight glow by default
  const DEFAULT_CONFIG = {
    enabled: true,
    blur: 60,
    spread: 1.18,
    brightness: 125,
    contrast: 115,
    saturation: 150,
    opacity: 95,
    bgGlow: false,
    bgOpacity: 35,
    fps: 30
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

  const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  function init() {
    loadSettings(() => {
      setupDOM();
      setupObservers();
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

    removeResidualBarClasses();
  }

  function removeResidualBarClasses() {
    try {
      const els = document.querySelectorAll('.ytm-ambilight-bar-glow');
      els.forEach(el => el.classList.remove('ytm-ambilight-bar-glow'));
    } catch (e) {}
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
