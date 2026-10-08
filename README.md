# Video Sync

Video Sync lets you transfer a video from Chrome to your Android device and continue watching it from the exact position where you left off.

## Overview

Video Sync connects a Chrome extension with an Android app through a shared account. The extension detects the video you are watching in Chrome and pushes it, along with your current playback position, to your account. The Android app subscribes to your account in real time, so pushed videos appear instantly under Continue Watching — one tap resumes the video at the saved position.

**How it works:**

```
Chrome extension → Firebase (Authentication + Realtime Database) → Android app
```

- The Chrome extension detects the video, authenticates with your account, and writes the video session to the database.
- The Android app subscribes to your account's data in real time — pushed videos appear without a refresh.
- Account data is stored under a per-user path, and database security rules allow access only to the account owner.

## Features

- **Video handoff from Chrome to Android** — push the current video from the extension with one click
- **YouTube support** — detection of watch pages, Shorts, embeds, and youtu.be links
- **Saved playback position** — the exact timestamp is preserved and restored
- **Continue Watching** — the most recent pushed video with one-tap resume
- **Real-time synchronization** — pushed videos arrive in the app instantly, with no refresh
- **Video history** — recent videos with thumbnails, platform, position, and source device
- **Account authentication** — email/password sign-up, sign-in, and sign-out with persistent sessions
- **Profile and device registration** — account information, registered devices, and sign-out
- **Secure per-user data isolation** — database rules restrict every read and write to the account owner

## Screenshots / Demo

### Chrome Extension

The Chrome extension detects the current video and lets you push it to your Video Sync account with one click.

<table>
  <tr>
    <td align="center" valign="top">
      <img height="360" alt="Video Sync Chrome Extension" src="https://github.com/user-attachments/assets/98a67314-4fac-4e35-8540-63badab30595" />
    </td>
    <td align="center" valign="top">
      <img height="360" alt="Video Sync Chrome Extension on YouTube" src="https://github.com/user-attachments/assets/3889299d-34e5-4d88-9f03-d780d3bdefcc" />
    </td>
  </tr>
</table>

### Android App — Continue Watching

The Android app receives the pushed video in real time and lets you continue from the saved playback position.

<table>
  <tr>
    <td align="center" valign="top">
      <img height="500" alt="Video Sync Android Home" src="https://github.com/user-attachments/assets/13c9adc6-09c1-4da5-a549-91da21151bc4" />
    </td>
    <td align="center" valign="top">
      <img height="500" alt="Video Sync Android Profile" src="https://github.com/user-attachments/assets/68c53d45-93b9-4e5a-9abc-dfabc2f03e18" />
    </td>
  </tr>
</table>

## Download

### Android (APK)

[Download Video Sync for Android](https://github.com/aniketm112/Video-sync_Project/releases/download/v1.1.0/Video-Sync.apk)

Standard Android package. After the download, open the file and confirm the installation prompt. Android may ask for permission to install apps from your browser or file manager — allow it to proceed.

### Chrome Extension

[Download Chrome Extension](https://github.com/aniketm112/Video-sync_Project/releases/download/v1.1.0/Video-Sync-Extension.zip)

Unzip the folder, then load it in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** and select the unzipped folder
4. Pin the Video Sync icon to your toolbar

The extension is pre-configured and ready to use. Sign in with your Video Sync account to start pushing videos.
**Chrome Web Store**: Coming soon.

### Release

[View Release](https://github.com/aniketm112/Video-sync_Project/releases/tag/v1.1.0)

## Getting Started

1. Install the Android app.
2. Install the Chrome extension (see the Download section).
3. Create or sign into the same Video Sync account on both.
4. Open a supported video in Chrome.
5. Click the Video Sync extension icon.
6. Click **PUSH VIDEO**.
7. Open the Android app.
8. Tap **Continue Watching**.

The video opens in YouTube at your saved playback position where the platform supports it. Everything you push syncs automatically to every device signed into your account.

## Supported Platforms

| Platform | Detection | Timestamp restoration | Status |
|---|---|---|---|
| YouTube (watch, Shorts, embeds, youtu.be) | URL, title, thumbnail, playback position | Yes | Supported and tested |
| Any site with a standard HTML5 `<video>` element | URL, page title, poster image; position where exposed by the site | Site-dependent | Best effort |

- **YouTube** is fully supported and tested.
- **Generic HTML5 video** (other sites): detection works where the page exposes a standard video element. Playback positions restore only where the site supports position via URL.
- **DRM-protected platforms** such as Netflix, Prime Video, and Disney+ are not currently supported. Their players are sandboxed and do not expose playback data to browser extensions.

## Limitations

- **Timestamp restoration** requires a URL-parameter mechanism. It is available on YouTube; most other sites cannot be seeked via URL, so those videos open at the start position and the app states this on the video screen.
- **DRM-protected platforms** (Netflix, Prime Video, Disney+) are not supported. Playback data is not accessible to browser extensions on these platforms.
- **Login-protected and browser-restricted pages** (for example `chrome://` pages, the Chrome Web Store, and single-page apps that shield their players) cannot be inspected by the extension.
- **Extension scope**: it activates only when you click it and has no access to page content until then. On the app side, the current release does not write push confirmations back to the extension; the extension shows a local success state.

## Developer Documentation

This section is required only for building or developing the project from source. The released APK and extension zip ship with the project's Firebase configuration applied at build time.

### Prerequisites

- Node.js 18 or later and npm
- JDK 17 (the Gradle build requires Java 17)
- Android SDK, or Android Studio which bundles it
- A [Firebase](https://console.firebase.google.com) account (the free Spark plan is sufficient)
- Google Chrome (for the extension)

### Clone and install

```bash
git clone https://github.com/aniketm112/Video-sync_Project.git
cd Video-sync_Project/video-sync-app
npm install
```

The npm dependencies are required for the Gradle build: the release build compiles the JavaScript bundle, which needs the dependencies on disk.

### Firebase development project setup

The application integrates Firebase Authentication (email/password) and the Realtime Database; no code changes are needed to use them. To develop against your own Firebase project:

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Realtime Database → Create database** (choose a region; start in locked mode).
4. **Project settings → General → Your apps → Web app (`</>`)** and copy the displayed configuration values.

### Environment configuration

The app reads the Firebase web configuration from environment variables at bundle time:

```bash
cd video-sync-app
cp .env.example .env    # fill in the values from your Firebase web app config
```

### Database rules

The rules in `database.rules.json` enforce per-user isolation and validate every field written to the database. Deploy them once, and again after edits:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only database
```

### Extension configuration

Open `video-sync-extension/config.js` and paste your Firebase web API key. The remaining values point at this project's Realtime Database — update them if you use your own project. The repository copy contains placeholders only; the real key remains local.

### Android build

The repository includes the native Android project (`video-sync-app/android/`) with the Gradle wrapper checked in.

```bash
cd video-sync-app/android
./gradlew assembleRelease        # Windows: gradlew assembleRelease
```

The first build downloads the Gradle distribution and dependencies; later builds are faster.

Output:

```
video-sync-app/android/app/build/outputs/apk/release/app-release.apk
```

`assembleRelease` signs with the debug keystore, which suits side-loading and testing. For Play Store distribution, configure a dedicated upload keystore in `android/app/build.gradle` (`signingConfigs`) and keep it out of version control.

### Testing

- `video-sync-app/`: `npx tsc --noEmit` and `npx eslint .`
- `video-sync-extension/`: `node tools/detect-test.mjs`

Test the full flow (extension push → app receive) before submitting changes.

### Project architecture

```
Video-sync_Project/
├── video-sync-app/            React Native app
│   ├── android/               Native Android project (Gradle, wrapper committed)
│   │   └── app/               APK module — assembleRelease builds here
│   ├── app/                   Screens: index, (auth)/, (tabs)/, video/[id]
│   ├── lib/
│   │   ├── firebase.ts        Firebase SDK initialization (build-time env config)
│   │   ├── auth.tsx           Authentication context
│   │   ├── db.ts              Realtime Database data layer and subscriptions
│   │   ├── platforms.ts       Platform adapters and continue-URL builder
│   │   ├── format.ts          Time and date formatting
│   │   └── device.ts          Per-install device identity
│   └── components/            Video card, buttons, form fields, theming
├── video-sync-extension/      Chrome MV3 extension
│   ├── manifest.json
│   ├── background.js          Service worker: authenticated writes
│   ├── content.js             Page bridge (video detection)
│   ├── platforms.js           Adapter registry (YouTube + generic)
│   ├── popup.html/js          Authentication and PUSH VIDEO interface
│   ├── config.js              Firebase web config (placeholder in git)
│   ├── lib/                   REST authentication and database writer
│   └── tools/                 detect-test.mjs, e2e-push-test.mjs
├── database.rules.json        Realtime Database security rules
└── firebase.json              Firebase CLI configuration
```

### Data model

```
users/{uid}
├── profile              { username, email, createdAt }
├── latest               VideoSession   ← Continue Watching
├── sessions/{pushId}    VideoSession   ← history (last 60)
└── devices/{deviceId}   { name, lastSeen, createdAt }
```

A video session record contains: platform, url, title, thumbnail, time (playback position in seconds), deviceId, deviceName, createdAt, updatedAt.

### Security model

- **Authentication**: Firebase Authentication with email/password. The app persists sessions on-device; the extension authenticates through the Firebase Identity Toolkit REST API.
- **Data isolation**: all user data lives under `users/{uid}`, and security rules (`database.rules.json`) restrict reads and writes to the authenticated owner of that path.
- **Field validation**: rules validate types and value ranges for every field, and reject unknown fields.
- **Credentials**: no real Firebase credentials are committed to this repository. Local configuration files (`.env`, `config.js`) are placeholder-only in git; the released APK and extension zip receive the project's configuration at build time on the maintainer's machine.

## Tech Stack

| Layer | Technology |
|---|---|
| App | React Native + TypeScript |
| Android | Native Android / Gradle |
| Backend | Firebase Authentication |
| Database | Firebase Realtime Database |
| Extension | Chrome Manifest V3 |
| Security | Firebase Realtime Database security rules |

**Platform status:** Android is currently available. The codebase is cross-platform React Native; an iOS build is planned and requires a macOS/Xcode build environment.

## Roadmap

- Additional platform adapters
- Session management improvements
- Play Store distribution with a production keystore
- iOS build and TestFlight release
- Push confirmation sync-back to the extension

## Contributing

Contributions are welcome. Useful areas: platform adapters, UI polish, and bug fixes.

1. Fork the repository and create a branch (`feat/my-feature`).
2. Run the project checks: `video-sync-app/`: `npx tsc --noEmit` and `npx eslint .`; `video-sync-extension/`: `node tools/detect-test.mjs`.
3. Test the full flow (extension push → app receive) before submitting a pull request.

## License

All rights reserved. No open-source license has been granted at this time.
