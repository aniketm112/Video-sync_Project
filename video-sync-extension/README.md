# Video Sync — Chrome extension

MV3 extension that captures the video you're watching and pushes it (URL, title, thumbnail, playback position, device) to your Video Sync account.

See the [root README](../README.md) for the full product overview.

## Setup

1. Edit `config.js` and paste your Firebase web app `apiKey` (Firebase console → Project settings → Your apps → Web app).
2. `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select this folder.
3. Pin the icon, open the popup, and log in with your Video Sync account.

## How it works

- `platforms.js` — adapter registry (YouTube + generic HTML5)
- `content.js` — page bridge that runs the detector (declared for YouTube, injected on demand elsewhere via `activeTab`)
- `background.js` — service worker performing authenticated RTDB writes
- `lib/auth.js` — Firebase Auth via Identity Toolkit REST (no SDK), sessions in `chrome.storage.local`, silent refresh
- `lib/db.js` — authenticated REST writes to `users/{uid}/…`

The extension requests only `activeTab`, `scripting`, and `storage` — it cannot read pages until you open its popup on them.

## Regenerating icons

```bash
node tools/make-icons.mjs
```
