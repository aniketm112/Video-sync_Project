/**
 * Video Sync — detection logic tests.
 *
 * Runs the REAL platforms.js and content.js code inside a Node VM with a fake
 * document/location and verifies VideoSync.detect() across the scenarios the
 * popup depends on. No network, no Chrome required.
 *
 *   node tools/detect-test.mjs
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const platformsSrc = readFileSync(path.join(root, 'platforms.js'), 'utf8');
const contentSrc = readFileSync(path.join(root, 'content.js'), 'utf8');

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok =
    expected === undefined
      ? Boolean(actual)
      : JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(
      `  ✗ ${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`
    );
  }
}

/**
 * Creates a fresh VM context that mimics a page as seen by a content script.
 * `doc` shapes what document.querySelector/querySelectorAll return.
 */
function makePage(href, doc = {}) {
  const videoProto = {
    get currentTime() {
      return this._currentTime ?? 0;
    },
    get videoWidth() {
      return this._videoWidth ?? 0;
    },
  };
  const makeVideo = (props = {}) => Object.assign(Object.create(videoProto), props);

  const videos = (doc.videos || []).map(makeVideo);
  const h1 = doc.h1 || null;

  const document = {
    title: doc.title || '',
    querySelector: (selector) => {
      if (selector === 'video') return videos[0] || null;
      if (selector === 'h1.ytd-watch-metadata') return h1;
      return null;
    },
    querySelectorAll: (selector) => (selector === 'video' ? videos : []),
  };

  const sandbox = {
    document,
    chrome: {
      runtime: {
        onMessage: {
          addListener(fn) {
            sandbox.__listener = fn;
          },
        },
      },
    },
    URL,
    Number,
    Boolean,
    Array,
    console,
    location: { href },
  };
  sandbox.globalThis = sandbox;
  // Content scripts always run with a window; alias it for content.js.
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(platformsSrc, sandbox, { filename: 'platforms.js' });
  return sandbox;
}

function detect(href, doc) {
  const sandbox = makePage(href, doc);
  return vm.runInContext('VideoSync.detect()', sandbox);
}

console.log('\nYouTube watch page (video element present)');
{
  const video = detect('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1967s', {
    title: 'Rick Astley - Never Gonna Give You Up - YouTube',
    h1: { textContent: ' Rick Astley - Never Gonna Give You Up ' },
    videos: [{ _videoWidth: 1280, _currentTime: 1967 }],
  });
  check('platform is youtube', video.platform, 'youtube');
  check('videoFound', video.videoFound, true);
  check('canonical page URL kept', video.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1967s');
  check('prefers h1 title', video.title, 'Rick Astley - Never Gonna Give You Up');
  check('hq thumbnail from video id', video.thumbnail, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  check('playback position captured', video.time, 1967);
}

console.log('\nYouTube watch page (metadata still loading)');
{
  const video = detect('https://www.youtube.com/watch?v=abc123', {
    title: 'Some video - YouTube',
    videos: [],
  });
  check('videoFound is false', video.videoFound, false);
  check('still youtube platform', video.platform, 'youtube');
  check('thumbnail derivable from id', video.thumbnail, 'https://i.ytimg.com/vi/abc123/hqdefault.jpg');
  check('title from document.title fallback', video.title, 'Some video');
}

console.log('\nYouTube Shorts / embed / youtu.be');
{
  const shorts = detect('https://www.youtube.com/shorts/sH0rtID9');
  check('shorts id', shorts.thumbnail, 'https://i.ytimg.com/vi/sH0rtID9/hqdefault.jpg');
  const embed = detect('https://www.youtube.com/embed/emb3dID1');
  check('embed id', embed.thumbnail, 'https://i.ytimg.com/vi/emb3dID1/hqdefault.jpg');
  const short = detect('https://youtu.be/dQw4w9WgXcQ?t=1');
  check('youtu.be id', short.thumbnail, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  check('youtu.be platform', short.platform, 'youtube');
}

console.log('\nGeneric site with HTML5 video');
{
  const video = detect('https://example.com/lessons/one', {
    title: '  Lesson One  ',
    videos: [{ _videoWidth: 640, _currentTime: 42, poster: 'https://example.com/p.jpg' }],
  });
  check('platform is generic', video.platform, 'generic');
  check('videoFound', video.videoFound, true);
  check('title trimmed', video.title, 'Lesson One');
  check('poster as thumbnail', video.thumbnail, 'https://example.com/p.jpg');
  check('time captured', video.time, 42);
}

console.log('\nGeneric site, multiple videos → picks the playing one');
{
  const video = detect('https://example.com/gallery', {
    title: 'Gallery',
    videos: [{ _videoWidth: 0, _currentTime: 5 }, { _videoWidth: 1920, _currentTime: 99 }],
  });
  check('prefers video with dimensions', video.time, 99);
}

console.log('\nGeneric site with NO video');
{
  const video = detect('https://example.com/blog/post', { title: 'Blog' });
  check('videoFound is false', video.videoFound, false);
  check('url still reported', video.url, 'https://example.com/blog/post');
  check('not flagged unsupported', video.unsupported, false);
}

console.log('\nRestricted / non-web page (chrome://, file://, about:)');
for (const href of ['chrome://settings/', 'about:blank', 'file:///C:/video.mp4']) {
  const video = detect(href);
  check(`${href} → unsupported`, video, { unsupported: true, videoFound: false });
}

console.log('\ncontent.js bridge (real file, fake chrome.runtime)');
{
  const sandbox = makePage('https://example.com/watch-now', {
    title: 'Watch Now',
    videos: [{ _videoWidth: 1280, _currentTime: 12 }],
  });
  vm.runInContext(contentSrc, sandbox, { filename: 'content.js' });

  check('listener registered', sandbox.__listener != null, true);
  let responded = null;
  const keepOpen = sandbox.__listener(
    { type: 'VS_GET_VIDEO' },
    {},
    (response) => (responded = response)
  );
  check('reports sync response', keepOpen, false);
  check('ok response', responded?.ok, true);
  check('detects through bridge', responded?.video?.videoFound, true);
  check('bridge title', responded?.video?.title, 'Watch Now');

  // Idempotent install: second load must not register a second listener.
  let listeners = 0;
  sandbox.chrome.runtime.onMessage.addListener = () => listeners++;
  vm.runInContext(contentSrc, sandbox, { filename: 'content.js (2nd)' });
  check('install is idempotent', listeners, 0);
}

console.log(`\n${failed === 0 ? 'ALL PASS' : 'FAILURES'}: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
