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

// Overlays that are open right now, oldest first. The lightbox renders inside
// the modal's DOM tree, so without this only-the-topmost-traps rule the modal
// would grab Tab from the lightbox and walk focus into the card behind it.
const openTraps: object[] = [];

// Keeps Tab inside `ref`'s subtree while `active`, and returns focus to
// whatever was focused before the overlay opened. Pass `active` as a boolean
// that stays true across content changes (not the content itself) — otherwise
// the restore target is recaptured every time the content swaps.
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

      // Queried per keypress, not on mount: the media panel's thumbnail
      // buttons come and go with the spot.
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
