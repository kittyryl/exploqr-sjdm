import type { OpenHours } from "@/lib/types";

// "Open now" always uses Manila time, not the visitor's own clock — the spot is in the
// Philippines, so that's the time that actually matters.
const MANILA_TZ = "Asia/Manila";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Built once and reused, since setting this up is slow and it would otherwise happen
// every time a spot card is shown. The 24-hour setting avoids a bug where midnight can
// show as "24:00" instead of "00:00" in some browsers.
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
  // Times like "09:00" can be compared as plain text since they're all the same length.
  // This only works for hours that don't cross midnight — none of our spots do yet.
  return hhmm >= open && hhmm < close;
}
