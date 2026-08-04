"use client";

import { useEffect } from "react";

// Only turn this on for the live site — during development it would keep
// showing old versions of the app while we're testing changes.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
