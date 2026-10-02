/**
 * E2E driver: runs the REAL extension code (config.js, lib/auth.js, lib/db.js)
 * in a Node VM with a chrome.storage shim, signs in, and pushes a video —
 * exactly what the MV3 service worker does in Chrome.
 *
 *   node tools/e2e-push-test.mjs <email> <password>
 *
 * Prints only pass/fail and non-secret diagnostics.
 */
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const extRoot = path.join(here, '..');

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: node tools/e2e-push-test.mjs <email> <password>');
  process.exit(2);
}

// ---- in-memory chrome.storage.local shim ----
const store = new Map();
const chrome = {
  storage: {
    local: {
      get: async (key) => (store.has(key) ? { [key]: store.get(key) } : {}),
      set: async (obj) => { for (const [k, v] of Object.entries(obj)) store.set(k, v); },
      remove: async (key) => { store.delete(key); },
    },
  },
};

const sandbox = {
  chrome,
  console,
  fetch, // Node 18+ has global fetch
  URLSearchParams, // browser global the extension code assumes (present in Chrome)
  crypto,
  location: { href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  navigator: { userAgentData: { platform: 'Windows' } },
  setTimeout,
};
vm.createContext(sandbox);

const load = (rel) =>
  vm.runInContext(fs.readFileSync(path.join(extRoot, rel), 'utf8'), sandbox, { filename: rel });

load('config.js');
load('lib/auth.js');
load('lib/db.js');

const log = (...a) => console.log('·', ...a);

// ---- 1. sign in with the real REST code ----
log('signing in via Identity Toolkit REST…');
const user = await vm.runInContext('VSAuth.signIn(' + JSON.stringify(email) + ', ' + JSON.stringify(password) + ')', sandbox);
if (!user?.uid) throw new Error('signIn returned no user');
log('signed in as uid', user.uid.slice(0, 6) + '…', 'displayName =', JSON.stringify(user.displayName));

// ---- 2. push a video with the real RTDB writer ----
const now = Date.now();
const video = {
  platform: 'youtube',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'E2E test video — Rick Astley',
  thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  time: 1967, // 32:47
  deviceId: 'e2e-driver-device',
  deviceName: 'Chrome · E2E driver',
};
log('pushing video via RTDB REST…');
const key = await vm.runInContext('VSDB.pushVideo(' + JSON.stringify(video) + ')', sandbox);
log('pushed, session key =', key);

// ---- 3. read it back with a fresh token to prove the session round-trips ----
log('reading back users/{uid}/latest…');
const latest = await vm.runInContext(
  `(async () => {
    const token = await VSAuth.idToken();
    const res = await fetch(FIREBASE_CONFIG.databaseURL.replace(/\\/+$/, '') +
      '/users/' + ${JSON.stringify(user.uid)} + '/latest.json?auth=' + encodeURIComponent(token));
    if (!res.ok) throw new Error('read failed ' + res.status);
    return res.json();
  })()`,
  sandbox
);

const checks = [
  ['url matches', latest.url === video.url],
  ['platform = youtube', latest.platform === 'youtube'],
  ['title matches', latest.title === video.title],
  ['time = 1967 (32:47)', latest.time === 1967],
  ['deviceName present', latest.deviceName === video.deviceName],
  ['updatedAt recent', Math.abs((latest.updatedAt ?? 0) - now) < 60_000],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log((ok ? 'PASS' : 'FAIL'), label);
  if (!ok) failed++;
}

// ---- 4. isolation probe: anonymous read of another path must fail ----
const dbUrl = await vm.runInContext('FIREBASE_CONFIG.databaseURL', sandbox);
const anon = await fetch(`${dbUrl.replace(/\/+$/, '')}/users/${user.uid}/latest.json`);
console.log(anon.ok ? 'FAIL' : 'PASS', 'anonymous read rejected by rules (status', anon.status + ')');
if (anon.ok) failed++;

console.log(failed === 0 ? '\nE2E PUSH: ALL CHECKS PASSED' : `\nE2E PUSH: ${failed} CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
