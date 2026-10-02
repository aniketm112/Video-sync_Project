import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

/**
 * Firebase configuration is read from environment variables (Expo `EXPO_PUBLIC_*`).
 * Copy `.env.example` to `.env` and fill in the values from your Firebase console:
 * Project settings → General → Your apps → Web app → SDK setup and configuration.
 *
 * These values are safe to expose in client code — access is protected by
 * Firebase Security Rules (see `database.rules.json` at the repo root), not by
 * keeping this config secret.
 */
/** Strips quotes/commas/whitespace accidentally pasted around env values. */
function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']+/, '').replace(/["',;]+$/, '').trim();
}

export const firebaseConfig = {
  apiKey: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  databaseURL: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL),
  projectId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Database | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);

  if (Platform.OS === 'web') {
    // Web persists sessions in IndexedDB automatically.
    auth = getAuth(app);
  } else {
    // On native, sessions persist through AsyncStorage. The React Native
    // build of Firebase exports `getReactNativePersistence`; the web bundle
    // does not, hence the platform-guarded require.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const firebaseAuth = require('firebase/auth') as typeof import('firebase/auth');
    try {
      auth = initializeAuth(app, {
        persistence: firebaseAuth.getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // Already initialized (fast refresh) — reuse the existing instance.
      auth = getAuth(app);
    }
  }

  db = getDatabase(app);
}

export { app, auth, db };
