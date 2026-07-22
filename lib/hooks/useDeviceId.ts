"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "exploqr-device-id";

// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost) —
// it's undefined when the app is opened over plain HTTP, which is exactly
// how this project is tested on a phone via LAN IP (see next.config.mjs's
// allowedDevOrigins). crypto.getRandomValues() has no such restriction and
// covers that case; Math.random() is the last-resort fallback for a browser
// with no crypto object at all. The result only ever has to be unique enough
// to key a device_id text column (see supabase/schema.sql), not a real UUID.
function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

// A per-browser random id, not a user account — it exists only so a visitor's
// second rating on the same spot updates their first one (see the
// unique(spot_id, device_id) constraint in supabase/schema.sql) instead of
// piling up duplicates. It's client-supplied and unauthenticated, so it's a
// convenience against accidental re-submits, not a defense against someone
// deliberately clearing localStorage to vote again — the same trust level
// SpotReviews already accepts by auto-publishing on a honeypot alone.
//
// Generated lazily on first read rather than eagerly on every page load,
// since most visitors will never rate anything.
export function useDeviceId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      setId(existing);
      return;
    }
    const next = generateId();
    localStorage.setItem(STORAGE_KEY, next);
    setId(next);
  }, []);

  return id;
}
