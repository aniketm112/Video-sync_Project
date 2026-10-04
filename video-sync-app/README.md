# Video Sync — Android app

React Native client for Video Sync: **Continue Watching**, recent pushes, video details, and profile. Ships as a standalone Android APK built from the committed native Gradle project in [`android/`](android/).

See the [root README](../README.md) for the product overview, the end-user install flow, and the Chrome extension.

## Build

```bash
npm install
cd android
gradlew assembleRelease    # macOS/Linux: ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk` — see the root README's [Android APK](../README.md#android-apk) section for signing and distribution.

## Configuration

All values come from your Firebase web app config (Project settings → General → Your apps → Web app). Copy `.env.example` to `.env` and fill it in — the values are embedded in the app bundle at build time. They identify, not protect, your project; access control lives in `database.rules.json`.

## Checks

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
```
