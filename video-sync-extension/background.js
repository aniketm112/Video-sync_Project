/**
 * Video Sync — MV3 service worker.
 *
 * The popup handles UI; the service worker performs authenticated network
 * writes so a push survives the popup closing mid-request.
 */
importScripts('config.js', 'lib/auth.js', 'lib/db.js');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'VS_PUSH_VIDEO') {
    (async () => {
      try {
        const key = await VSDB.pushVideo(message.video);
        sendResponse({ ok: true, key });
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || 'Push failed.' });
      }
    })();
    return true; // Keep the message channel open for the async response.
  }

  if (message?.type === 'VS_SESSION_REFRESH') {
    (async () => {
      const user = await VSAuth.currentUser();
      sendResponse({ ok: true, user });
    })();
    return true;
  }

  return false;
});
