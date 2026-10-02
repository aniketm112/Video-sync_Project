/**
 * Video Sync — Firebase Authentication over the Identity Toolkit REST API.
 *
 * The extension deliberately avoids bundling the Firebase SDK: plain HTTPS
 * keeps the extension small and works well inside an MV3 service worker.
 * Sessions (ID + refresh token) persist in `chrome.storage.local` and the ID
 * token is refreshed silently before every use.
 */
const VSAuth = (() => {
  const STORAGE_KEY = 'vs.auth.session';
  let cached = null;

  async function load() {
    if (cached) return cached;
    const { [STORAGE_KEY]: stored } = await chrome.storage.local.get(STORAGE_KEY);
    cached = stored || null;
    return cached;
  }

  async function save(state) {
    cached = state || null;
    if (state) await chrome.storage.local.set({ [STORAGE_KEY]: state });
    else await chrome.storage.local.remove(STORAGE_KEY);
  }

  function request(endpoint, body) {
    return fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${FIREBASE_CONFIG.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(friendlyError(data?.error?.message || `HTTP ${res.status}`));
      }
      return data;
    });
  }

  /** Maps Identity Toolkit error codes to messages worth showing a human. */
  function friendlyError(raw) {
    const code = String(raw).split(':')[0];
    switch (code) {
      case 'EMAIL_EXISTS':
        return 'An account with this email already exists. Try logging in.';
      case 'INVALID_LOGIN_CREDENTIALS':
      case 'INVALID_PASSWORD':
      case 'EMAIL_NOT_FOUND':
        return 'Incorrect email or password.';
      case 'INVALID_EMAIL':
        return 'That email address doesn’t look right.';
      case 'WEAK_PASSWORD':
        return 'Password must be at least 8 characters.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'OPERATION_NOT_ALLOWED':
        return 'Email/password sign-in is not enabled for this Firebase project yet.';
      case 'API_KEY_NOT_VALID':
      case 'API_KEY_INVALID':
      case 'ADMIN_ONLY_OPERATION':
        return 'Firebase isn’t configured correctly. Paste your Web API key in config.js.';
      case 'Failed to fetch':
        return 'Network error. Check your connection and try again.';
      default:
        return code.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
    }
  }

  function toState(data, displayName) {
    return {
      uid: data.localId,
      email: data.email || '',
      displayName: displayName || null,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
    };
  }

  async function signUp(name, email, password) {
    const data = await request('accounts:signUp', {
      email: email.trim(),
      password,
      returnSecureToken: true,
    });
    let cleanName = name ? name.trim() : '';
    if (cleanName) {
      await request('accounts:update', {
        idToken: data.idToken,
        displayName: cleanName,
      });
    }
    const state = toState(data, cleanName);
    await save(state);
    return state;
  }

  async function signIn(email, password) {
    const data = await request('accounts:signInWithPassword', {
      email: email.trim(),
      password,
      returnSecureToken: true,
    });
    // Pull the saved display name so both sides of the product agree on it.
    let displayName = null;
    try {
      const lookup = await request('accounts:lookup', { idToken: data.idToken });
      displayName = lookup?.users?.[0]?.displayName || null;
    } catch {
      // Non-fatal — display name is cosmetic.
    }
    const state = toState(data, displayName);
    await save(state);
    return state;
  }

  /** Returns a valid session, refreshing the token first when needed. */
  async function refresh() {
    const state = await load();
    if (!state) return null;
    if (state.expiresAt - 60_000 > Date.now()) return state;

    try {
      const res = await fetch(
        `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_CONFIG.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: state.refreshToken,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id_token) {
        // Refresh token expired/revoked — force a fresh login.
        await save(null);
        return null;
      }
      const updated = {
        ...state,
        idToken: data.id_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
      };
      await save(updated);
      return updated;
    } catch {
      return state; // Network hiccup — keep trying with the current token.
    }
  }

  async function signOut() {
    await save(null);
  }

  async function currentUser() {
    const state = await refresh();
    if (!state) return null;
    return { uid: state.uid, email: state.email, displayName: state.displayName };
  }

  async function idToken() {
    const state = await refresh();
    return state ? state.idToken : null;
  }

  return { signUp, signIn, signOut, currentUser, idToken, friendlyError };
})();
