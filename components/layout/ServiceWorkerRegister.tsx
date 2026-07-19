"use client";

import { useEffect } from "react";

// Registered in production only — a caching service worker in dev would
// fight with Turbopack's HMR and serve stale chunks.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
