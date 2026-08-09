/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js blocks dev-server requests (including the HMR websocket) from
  // any origin other than localhost by default. Without this, opening the
  // dev server from a phone via LAN IP hangs forever on "Loading map…"
  // because the dynamically-imported map chunk can never resolve. This only
  // affects `next dev` — production builds have no such restriction.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],

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
