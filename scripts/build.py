#!/usr/bin/env python3
"""
YouTube Music Ambilight - Universal Build Script
Packages the extension into Chromium ZIP, Firefox XPI, and synchronizes the Userscript.
"""

import os
import shutil
import zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(ROOT_DIR, "dist")

EXTENSION_FILES = [
    "manifest.json",
    "background.js",
    "content.js",
    "content.css",
    "popup.html",
    "popup.js",
]

EXTENSION_DIRS = [
    "icons",
]

def build_userscript():
    print("🔨 Synchronizing Userscript...")
    css_path = os.path.join(ROOT_DIR, "content.css")
    js_path = os.path.join(ROOT_DIR, "content.js")

    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    header = """// ==UserScript==
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
"""

    middle = """`;

  if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(CSS);
  } else {
    const s = document.createElement('style');
    s.id = 'ytm-ambilight-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // Content script logic
"""

    footer = """
})();
"""

    full_userscript = header + css_content + "\n" + middle + "\n" + js_content + "\n" + footer

    userjs_dist = os.path.join(DIST_DIR, "ytmusic-ambilight.user.js")
    with open(userjs_dist, "w", encoding="utf-8") as f:
        f.write(full_userscript)

    userjs_root = os.path.join(ROOT_DIR, "ytmusic-ambilight.user.js")
    with open(userjs_root, "w", encoding="utf-8") as f:
        f.write(full_userscript)

    print(f"  ✓ Userscript written to dist/ytmusic-ambilight.user.js ({len(full_userscript):,} bytes)")

def build_archives():
    print("📦 Packaging Extension Archives...")
    zip_path = os.path.join(DIST_DIR, "ytmusic-ambilight.zip")
    xpi_path = os.path.join(DIST_DIR, "ytmusic-ambilight.xpi")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_name in EXTENSION_FILES:
            file_path = os.path.join(ROOT_DIR, file_name)
            if os.path.exists(file_path):
                zipf.write(file_path, arcname=file_name)

        for dir_name in EXTENSION_DIRS:
            dir_path = os.path.join(ROOT_DIR, dir_name)
            if os.path.exists(dir_path):
                for root, _, files in os.walk(dir_path):
                    for file in files:
                        if not file.startswith("."):
                            full_path = os.path.join(root, file)
                            rel_path = os.path.relpath(full_path, ROOT_DIR)
                            zipf.write(full_path, arcname=rel_path)

    # Copy zip to xpi (identical archive format for Firefox)
    shutil.copyfile(zip_path, xpi_path)

    # Also keep copies in root for backward compatibility
    shutil.copyfile(zip_path, os.path.join(ROOT_DIR, "ytmusic-ambilight.zip"))
    shutil.copyfile(xpi_path, os.path.join(ROOT_DIR, "ytmusic-ambilight.xpi"))

    print(f"  ✓ Chromium ZIP created: dist/ytmusic-ambilight.zip ({os.path.getsize(zip_path):,} bytes)")
    print(f"  ✓ Firefox XPI created: dist/ytmusic-ambilight.xpi ({os.path.getsize(xpi_path):,} bytes)")

def main():
    os.makedirs(DIST_DIR, exist_ok=True)
    build_userscript()
    build_archives()
    print("\n🎉 Build completed successfully!")

if __name__ == "__main__":
    main()
