import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { auth, db, isFirebaseConfigured } from './firebase';
import { ensureProfile, subscribeProfile, type UserProfile } from './db';
import { getDeviceInfo } from './device';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  /** True until the persisted session has been restored (or found missing). */
  initializing: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maps Firebase auth error codes to messages worth showing a human. */
export function friendlyAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.';
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this Firebase project yet.';
    default: {
      const message = err instanceof Error ? err.message : String(err);
      return message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/.*\)\.?$/i, '');
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setInitializing(false);
      return;
    }

    let unsubProfile: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      unsubProfile?.();
      unsubProfile = null;

      if (nextUser) {
        // Register this device and make sure a profile node exists. Failures
        // here shouldn't block login — the app still works read-only.
        try {
          const { deviceId, deviceName } = await getDeviceInfo();
          if (db) {
            await update(ref(db, `users/${nextUser.uid}/devices/${deviceId}`), {
              name: deviceName,
              lastSeen: Date.now(),
              createdAt: Date.now(),
            });
          }
          await ensureProfile(nextUser);
        } catch {
          // Non-fatal: profile sync can retry later.
        }
        unsubProfile = subscribeProfile(nextUser.uid, setProfile);
      } else {
        setProfile(null);
      }

      setInitializing(false);
    });

    return () => {
      unsub();
      unsubProfile?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    const cleanName = username.trim();
    const { user: newUser } = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    await updateProfile(newUser, { displayName: cleanName });
    await ensureProfile({ ...newUser, displayName: cleanName } as User);
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) throw new Error('Firebase is not configured.');
    await firebaseSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw new Error('Firebase is not configured.');
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      initializing,
      configured: isFirebaseConfigured,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [user, profile, initializing, signIn, signUp, signOut, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
