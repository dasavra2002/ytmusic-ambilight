# Ambient Light for YouTube Music™

An immersive, real-time Ambilight extension built specifically for **YouTube Music** (`music.youtube.com`).

Compatible across **all major browser engines**:
- **Gecko**: Mozilla Firefox, LibreWolf, Waterfox, Floorp, Tor Browser
- **WebKit**: Safari, Orion
- **Chromium**: Google Chrome, Brave, Microsoft Edge, Arc, Opera, Vivaldi

---

## ✨ Features

- **Dual-Mode Ambient Glow**:
  - **Video Mode**: Real-time edge ambilight frame-by-frame projection for music videos playing on YouTube Music.
  - **Song / Album Art Mode**: Diffused ambient glow matching the active track's album cover with smooth cross-fading when songs switch.
- **Ultra-Low Resource Consumption**:
  - Hardware-accelerated CSS filters with an offscreen downsampling buffer (64×36 resolution, under 0.1ms render time).
  - FPS throttles (15 FPS, 30 FPS, 60 FPS) to conserve laptop battery and GPU cycles.
- **Cross-Browser Universal Storage**:
  - Seamless fallback between `browser.storage.sync` and `storage.local` across Firefox, Safari, and Chromium.
- **Interactive Control Popup**:
  - **Glow Blur**: Adjust the softness of the light spread (20px – 140px).
  - **Glow Spread**: Control how far the light bleeds outwards (105% – 145%).
  - **Brightness & Saturation Boosters**: Make subtle album covers pop with vibrant colors.
  - **Full Window Ambient Background**: Softly illuminate the entire browser window backdrop.
  - **Player Bar Accent Glow**: Subtle ambient lighting across the bottom playback bar.
- **Responsive & SPA Aware**:
  - Uses `ResizeObserver` to stay aligned with the player during theater mode, fullscreen (`F`), and side-panel (lyrics/queue) toggles.

---

## 🚀 Installation Guide by Browser

### 🦊 1. Mozilla Firefox, LibreWolf, Waterfox, Floorp

1. Open Firefox and type `about:debugging` in the URL address bar and press Enter.
2. Click on **This Firefox** in the left sidebar.
3. In the *Temporary Extensions* section, click **Load Temporary Add-on...**.
4. Select either:
   - The file `/Users/anirbandas/ytmusic-ambilight/manifest.json`
   - Or `/Users/anirbandas/ytmusic-ambilight/ytmusic-ambilight.xpi`
5. Open [music.youtube.com](https://music.youtube.com) and enjoy!

*(For older Firefox ESR releases or engines requiring Manifest V2, a dedicated `manifest.firefox-v2.json` is also provided in the directory).*

---

### 🧭 2. Safari (macOS) & Orion

#### Orion (Native WebKit Browser for Mac)
Orion supports Chrome and Firefox extensions out-of-the-box:
1. Open Orion, press `Cmd + ,` (Preferences) → **Extensions**.
2. Click **Install from disk** and choose `/Users/anirbandas/ytmusic-ambilight`.

#### Apple Safari
For Safari on macOS, the cleanest and most lightweight way to run it is via a Userscript manager:
1. Install the free, open-source [Userscripts Safari Extension](https://apps.apple.com/app/userscripts/id1463298887) (or Tampermonkey / Stay).
2. Open the extension and add the included script:
   - File: `/Users/anirbandas/ytmusic-ambilight/ytmusic-ambilight.user.js`
3. Navigate to [music.youtube.com](https://music.youtube.com).

*(Note: If you have full Xcode installed, you can also compile a standalone Safari App Extension by running: `xcrun safari-web-extension-converter /Users/anirbandas/ytmusic-ambilight`).*

---

### 🌐 3. Chrome, Brave, Microsoft Edge, Arc, Opera

1. Open your browser's extension settings:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** in the top-left toolbar.
4. Select the directory:
   ```
   /Users/anirbandas/ytmusic-ambilight
   ```
5. Navigate to [music.youtube.com](https://music.youtube.com) and start playing music!
