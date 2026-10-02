/**
 * Video Sync — platform adapters.
 *
 * Each adapter knows how to describe the video on the current page:
 *   { platform, platformLabel, url, title, thumbnail, time, videoFound }
 *
 * Only adapters whose behaviour has actually been verified should claim
 * special support. YouTube is fully supported; the generic adapter works on
 * any site with a standard HTML5 <video> element (URL, title, poster and
 * playback time where the site exposes them).
 */
(() => {
  function safeUrl() {
    try {
      const url = new URL(location.href);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return url;
    } catch {
      return null;
    }
  }

  function youTubeId(url) {
    if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null;
    if (url.hostname.endsWith('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const match = url.pathname.match(/\/(shorts|embed|live)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  }

  const YouTubeAdapter = {
    platform: 'youtube',
    platformLabel: 'YouTube',
    matches: (url) =>
      url.hostname === 'youtu.be' || url.hostname.endsWith('youtube.com'),
    detect(url) {
      const video = document.querySelector('video');
      const id = youTubeId(url);
      const title =
        document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim() ||
        document.title.replace(/\s*-\s*YouTube\s*$/, '').trim() ||
        null;
      return {
        platform: this.platform,
        platformLabel: this.platformLabel,
        url: url.href,
        title,
        thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : video?.poster || null,
        time: video && Number.isFinite(video.currentTime) ? video.currentTime : null,
        videoFound: Boolean(video),
      };
    },
  };

  const GenericAdapter = {
    platform: 'generic',
    platformLabel: 'Web video',
    matches: () => true,
    detect(url) {
      const video =
        Array.from(document.querySelectorAll('video')).find((v) => v.videoWidth > 0) ||
        document.querySelector('video');
      return {
        platform: this.platform,
        platformLabel: this.platformLabel,
        url: url.href,
        title: document.title.trim() || null,
        thumbnail: video?.poster || null,
        time: video && Number.isFinite(video.currentTime) ? video.currentTime : null,
        videoFound: Boolean(video),
      };
    },
  };

  const ADAPTERS = [YouTubeAdapter, GenericAdapter];

  const VideoSync = {
    /**
     * Describes the video on the current page, or returns a structured
     * "nothing here" result the popup can render.
     */
    detect() {
      const url = safeUrl();
      if (!url) {
        return { unsupported: true, videoFound: false };
      }
      const adapter = ADAPTERS.find((a) => a.matches(url)) || GenericAdapter;
      try {
        const result = adapter.detect(url);
        return { unsupported: false, ...result };
      } catch {
        return { unsupported: false, videoFound: false, url: url.href };
      }
    },
  };

  globalThis.VideoSync = VideoSync;
})();
