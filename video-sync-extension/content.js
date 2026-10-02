/**
 * Video Sync — content script bridge.
 *
 * Declared for YouTube in the manifest and injected on demand into other tabs
 * (via chrome.scripting from the popup). It answers one message:
 * VS_GET_VIDEO → the current page's video description from platforms.js.
 */
(() => {
  if (window.__videoSyncInstalled) return;
  window.__videoSyncInstalled = true;

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'VS_GET_VIDEO') return false;
    try {
      sendResponse({ ok: true, video: VideoSync.detect() });
    } catch (err) {
      sendResponse({ ok: false, error: err?.message || 'Could not inspect this page.' });
    }
    return false; // Synchronous response.
  });
})();
