"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "exploqr-device-id";

// The safest way to make a random ID only works on https, but we test this
// app on a phone over plain wifi — so we fall back to other ways to make one.
// It just needs to be unique enough, not a perfect one-of-a-kind ID.
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

// A random ID per browser, not a real account. It just stops a visitor's
// second rating on the same spot from creating a duplicate — easy to get
// around on purpose, but that's fine since it's only guarding against
// accidental double-submits, not people trying to cheat.
//
// Only made the first time it's actually needed, not on every page load,
// since most visitors never rate anything.
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
