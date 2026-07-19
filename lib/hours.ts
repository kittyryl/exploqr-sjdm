import type { OpenHours } from "@/lib/types";

// "Open now" is evaluated in Asia/Manila regardless of the visitor's own
// timezone — the spot is in Bulacan, and someone browsing from abroad
// still needs "open now" to mean open now *there*, not wherever their
// device's clock is set.
const MANILA_TZ = "Asia/Manila";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Module-level: isOpenNow runs on every render of a spot's detail card, and
// constructing an Intl.DateTimeFormat is comparatively expensive to repeat
// per call. hourCycle: "h23" avoids the well-known Intl quirk where
// hour12:false can still yield "24" for midnight in some environments.
const MANILA_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: MANILA_TZ,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function manilaParts(date: Date): { weekday: number; hhmm: string } {
  const parts = MANILA_FORMATTER.formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === "weekday")!.value;
  const hour = parts.find((p) => p.type === "hour")!.value;
  const minute = parts.find((p) => p.type === "minute")!.value;

  return {
    weekday: WEEKDAYS.indexOf(weekdayShort),
    hhmm: `${hour}:${minute}`,
  };
}

export function isOpenNow(
  openHours: OpenHours | undefined,
  now: Date = new Date()
): boolean | null {
  if (!openHours) return null;
  const { open, close, closedDays = [] } = openHours;
  const { weekday, hhmm } = manilaParts(now);
  if (closedDays.includes(weekday)) return false;
  // "HH:MM" strings zero-padded to the same length compare correctly as
  // plain strings — no need to parse into minutes. This only holds for
  // same-day windows (open < close); an overnight window like 20:00–02:00
  // isn't representable yet — none of today's spots need one.
  return hhmm >= open && hhmm < close;
}
