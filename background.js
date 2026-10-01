/**
 * Ambient Light for YouTube Music™ - Background Service Worker
 * Cross-browser listener for keyboard commands (Alt+A)
 */

const browserAPI = typeof browser !== 'undefined' && browser.runtime ? browser : chrome;

if (browserAPI && browserAPI.commands && browserAPI.commands.onCommand) {
  browserAPI.commands.onCommand.addListener((command) => {
    if (command === 'toggle-ambilight') {
      browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          browserAPI.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_AMBILIGHT' }).catch(() => {
            // Tab may not have content script injected yet
          });
        }
      });
    }
  });
}
