export default function manifest() {
  return {
    name: "ExploQR SJDM — Tourism guide to San Jose del Monte, Bulacan",
    short_name: "ExploQR SJDM",
    description:
      "An interactive map guide to San Jose del Monte, Bulacan: pilgrimage shrines, Mt. Balagbag, Kaytitinga Falls, adventure camps, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#1c2321",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
