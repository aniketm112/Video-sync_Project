/**
 * Video Sync — popup controller.
 *
 * Views: setup (no API key) → auth (login/signup) → main (detect + push).
 * Detection runs automatically when the popup opens; pushing is delegated to
 * the service worker so it survives the popup closing.
 */

const els = {
  setupView: document.getElementById('setupView'),
  authView: document.getElementById('authView'),
  mainView: document.getElementById('mainView'),

  tabLogin: document.getElementById('tabLogin'),
  tabSignup: document.getElementById('tabSignup'),
  nameField: document.getElementById('nameField'),
  confirmField: document.getElementById('confirmField'),
  nameInput: document.getElementById('nameInput'),
  emailInput: document.getElementById('emailInput'),
  passwordInput: document.getElementById('passwordInput'),
  confirmInput: document.getElementById('confirmInput'),
  authSubmit: document.getElementById('authSubmit'),
  authError: document.getElementById('authError'),

  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  userEmail: document.getElementById('userEmail'),
  logoutBtn: document.getElementById('logoutBtn'),

  cardThumb: document.getElementById('cardThumb'),
  cardThumbFallback: document.getElementById('cardThumbFallback'),
  cardLabel: document.getElementById('cardLabel'),
  cardTitle: document.getElementById('cardTitle'),
  cardMeta: document.getElementById('cardMeta'),
  cardNote: document.getElementById('cardNote'),
  pushBtn: document.getElementById('pushBtn'),
  status: document.getElementById('status'),
};

let authMode = 'login';
let currentUser = null;
let detected = null;

/* ---------- View management ---------- */

function show(view) {
  for (const v of [els.setupView, els.authView, els.mainView]) {
    v.classList.remove('active');
  }
  view.classList.add('active');
}

function setAuthError(message) {
  els.authError.textContent = message || '';
  els.authError.classList.toggle('visible', Boolean(message));
}

function setAuthBusy(busy) {
  els.authSubmit.disabled = busy;
  els.authSubmit.textContent = busy
    ? 'Please wait…'
    : authMode === 'login'
      ? 'Log in'
      : 'Create account';
}

function setStatus(kind, message) {
  els.status.className = `status visible ${kind}`;
  els.status.textContent = message;
}

function clearStatus() {
  els.status.className = 'status';
  els.status.textContent = '';
}

/* ---------- Auth ---------- */

function switchAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  els.tabLogin.classList.toggle('active', !signup);
  els.tabSignup.classList.toggle('active', signup);
  els.nameField.style.display = signup ? 'block' : 'none';
  els.confirmField.style.display = signup ? 'block' : 'none';
  setAuthError('');
  setAuthBusy(false);
}

async function handleAuthSubmit() {
  setAuthError('');
  const email = els.emailInput.value.trim();
  const password = els.passwordInput.value;

  if (!email || !password) {
    setAuthError('Enter your email and password.');
    return;
  }
  if (authMode === 'signup') {
    const name = els.nameInput.value.trim();
    if (name.length < 2) {
      setAuthError('Enter your name (at least 2 characters).');
      return;
    }
    if (password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (password !== els.confirmInput.value) {
      setAuthError('Passwords don’t match.');
      return;
    }
  }

  setAuthBusy(true);
  try {
    const user =
      authMode === 'signup'
        ? await VSAuth.signUp(els.nameInput.value, email, password)
        : await VSAuth.signIn(email, password);
    enterMainView(user);
  } catch (err) {
    setAuthError(err?.message || 'Something went wrong. Please try again.');
  } finally {
    setAuthBusy(false);
  }
}

async function handleLogout() {
  await VSAuth.signOut();
  currentUser = null;
  detected = null;
  els.emailInput.value = '';
  els.passwordInput.value = '';
  els.confirmInput.value = '';
  switchAuthMode('login');
  show(els.authView);
  els.emailInput.focus();
}

function enterMainView(user) {
  currentUser = user;
  els.userAvatar.textContent = (user.displayName || user.email || 'V')
    .charAt(0)
    .toUpperCase();
  els.userName.textContent = user.displayName || 'Viewer';
  els.userEmail.textContent = user.email || '';
  show(els.mainView);
  clearStatus();
  detectCurrentTabVideo();
}

/* ---------- Video detection ---------- */

function formatTime(seconds) {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${Math.floor(seconds / 60)}:${s}`;
}

/**
 * Transient state while the active tab is being inspected — restores the
 * card's initial copy so "No video detected" never flashes prematurely.
 */
function renderDetecting() {
  detected = null;
  els.cardLabel.textContent = 'Detected video';
  els.cardTitle.textContent = 'Looking for a video…';
  els.cardMeta.textContent = '';
  els.cardThumb.classList.remove('visible');
  els.cardThumbFallback.classList.remove('visible');
  els.cardNote.classList.remove('visible');
  els.pushBtn.disabled = true;
}

function renderDetected(video) {
  detected = video;

  if (!video || video.unsupported || !video.videoFound) {
    els.cardLabel.textContent = 'No video detected';
    els.cardTitle.textContent = video?.unsupported
      ? 'Video Sync can’t inspect this page'
      : 'Open a video, then click the extension again.';
    els.cardMeta.textContent = '';
    els.cardThumb.classList.remove('visible');
    els.cardThumbFallback.classList.remove('visible');
    els.cardNote.classList.remove('visible');
    els.pushBtn.disabled = true;
    return;
  }

  els.cardLabel.textContent = 'Ready to push';
  els.cardTitle.textContent = video.title || 'Untitled video';
  els.cardMeta.textContent = [
    video.platformLabel,
    video.time != null && video.time > 0 ? `at ${formatTime(video.time)}` : 'from the start',
  ].join(' · ');

  if (video.thumbnail) {
    els.cardThumb.src = video.thumbnail;
    els.cardThumb.classList.add('visible');
    els.cardThumbFallback.classList.remove('visible');
  } else {
    els.cardThumb.classList.remove('visible');
    els.cardThumbFallback.classList.add('visible');
  }

  els.cardNote.classList.toggle('visible', video.platform !== 'youtube' && video.time > 0);
  els.pushBtn.disabled = false;
}

async function detectCurrentTabVideo() {
  renderDetecting();

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    renderDetected(null);
    return;
  }

  const askTab = async () => {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'VS_GET_VIDEO' });
      return response || null;
    } catch {
      return null; // No content script in this tab yet.
    }
  };

  let response = await askTab();

  if (!response) {
    // Inject the detector on demand (works on any site thanks to activeTab).
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['platforms.js', 'content.js'],
      });
      response = await askTab();
    } catch {
      // Restricted page (chrome://, Chrome Web Store, …) — explain that
      // instead of leaving the "looking" state hanging.
      renderDetected({ unsupported: true });
      return;
    }
  }

  if (response?.ok) {
    renderDetected(response.video);
  } else {
    // No response or an errored response — show the plain no-video card
    // rather than getting stuck on "Looking for a video…".
    renderDetected(null);
  }
}

/* ---------- Push ---------- */

async function getDevice() {
  const { vsDeviceId } = await chrome.storage.local.get('vsDeviceId');
  const deviceId = vsDeviceId || crypto.randomUUID();
  if (!vsDeviceId) await chrome.storage.local.set({ vsDeviceId: deviceId });

  const platform =
    navigator.userAgentData?.platform || navigator.platform || 'Desktop';
  return { deviceId, deviceName: `Chrome · ${platform}` };
}

async function handlePush() {
  if (!detected?.videoFound || !currentUser) return;

  els.pushBtn.disabled = true;
  clearStatus();
  setStatus('ok', 'Pushing…');

  const device = await getDevice();

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'VS_PUSH_VIDEO',
      video: {
        platform: detected.platform,
        url: detected.url,
        title: detected.title,
        thumbnail: detected.thumbnail,
        time: detected.time ?? 0,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      },
    });

    if (!response?.ok) {
      throw new Error(response?.error || 'Push failed. Please try again.');
    }

    setStatus('ok', '✓ Video pushed — continue on any device');
  } catch (err) {
    setStatus('err', err?.message || 'Push failed. Please try again.');
    if (String(err?.message || '').includes('log in')) {
      await handleLogout();
      return;
    }
  } finally {
    els.pushBtn.disabled = false;
  }
}

/* ---------- Wiring ---------- */

async function init() {
  if (
    !FIREBASE_CONFIG.apiKey ||
    FIREBASE_CONFIG.apiKey.startsWith('PASTE_YOUR')
  ) {
    show(els.setupView);
    return;
  }

  els.tabLogin.addEventListener('click', () => switchAuthMode('login'));
  els.tabSignup.addEventListener('click', () => switchAuthMode('signup'));
  els.authSubmit.addEventListener('click', handleAuthSubmit);
  els.logoutBtn.addEventListener('click', handleLogout);
  els.pushBtn.addEventListener('click', handlePush);
  els.passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuthSubmit();
  });
  els.confirmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAuthSubmit();
  });

  const user = await VSAuth.currentUser();
  if (user) {
    enterMainView(user);
  } else {
    show(els.authView);
    els.emailInput.focus();
  }
}

init();
