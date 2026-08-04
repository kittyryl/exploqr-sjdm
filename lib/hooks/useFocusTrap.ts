"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// Tracks which popups are open right now, oldest first. Only the newest one
// should control the Tab key, or pressing Tab in the photo viewer could
// jump focus to the card behind the modal it opened from.
const openTraps: object[] = [];

// Stops keyboard users from tabbing out of the open panel, and puts focus
// back where it was once it closes. `active` should stay true even while the
// panel's content changes, or it'll forget where to restore focus to.
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;

    const restoreTo = document.activeElement as HTMLElement | null;
    const trap = {};
    openTraps.push(trap);

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      if (openTraps[openTraps.length - 1] !== trap) return;

      const panel = ref.current;
      if (!panel) return;

      // Re-checked on every key press, not just once, since the photo
      // thumbnails can appear or disappear as the spot changes.
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const inPanel = panel.contains(document.activeElement);

      if (e.shiftKey && (!inPanel || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inPanel || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      openTraps.splice(openTraps.indexOf(trap), 1);
      restoreTo?.focus?.();
    };
  }, [ref, active]);
}
