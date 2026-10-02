# Video Sync — app

Expo (React Native) client for Video Sync: **Continue Watching**, recent pushes, video details, and profile. Runs on Android, iOS, and web against Firebase (Authentication + Realtime Database).

See the [root README](../README.md) for the full product overview, Firebase setup, and the Chrome extension.

## Setup

```bash
npm install
cp .env.example .env   # then paste your Firebase web config values
npm start              # press w (web) / a (Android) / i (iOS)
```

## Checks

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
```

## Environment

All values come from your Firebase web app config (Project settings → General → Your apps → Web app). `EXPO_PUBLIC_` variables are embedded in the bundle at build time — they identify, not protect, your project; access control lives in `database.rules.json`.

See `.env.example` for the full list.
