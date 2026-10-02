import type { Persistence } from 'firebase/auth';

/**
 * Firebase v12's package exports resolve TypeScript to the web entry point,
 * which doesn't declare `getReactNativePersistence` even though the React
 * Native build ships it. This augmentation restores the declaration so the
 * guarded `require` in `lib/firebase.ts` typechecks.
 */
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
