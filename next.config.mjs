/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js blocks dev-server requests (including the HMR websocket) from
  // any origin other than localhost by default. Without this, opening the
  // dev server from a phone via LAN IP hangs forever on "Loading map…"
  // because the dynamically-imported map chunk can never resolve. This only
  // affects `next dev` — production builds have no such restriction.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],

  // Spot photos are hotlinked from Wikimedia Commons, but next/image's
  // built-in optimizer fetches remote sources with no User-Agent header —
  // Wikimedia rejects those outright. Every photo goes through
  // /api/spot-photo instead (see that route), which re-fetches with a
  // descriptive UA, so next/image never talks to Wikimedia directly and
  // no remotePatterns entry is needed here.
  //
  // localPatterns is required for that: Next 16 defaults local images to
  // `search: ''`, i.e. no query string allowed, so /api/spot-photo?src=...
  // gets a flat 400 unless explicitly allowlisted. `src`'s actual value is
  // validated inside the route itself (https + upload.wikimedia.org only),
  // so leaving `search` unset here (allow any query string) is safe. The
  // `**`/search:'' entry is Next's own default for every other local
  // image (no query string) — spelling it out here since setting
  // `localPatterns` at all replaces that default instead of adding to it.
  images: {
    localPatterns: [
      { pathname: "**", search: "" },
      { pathname: "/api/spot-photo" },
    ],
  },

  // sw.js has no build-time versioning, so browsers must always revalidate
  // it — otherwise an old service worker can get stuck serving stale caches.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
