// "Open now" is evaluated in Asia/Manila regardless of the visitor's own
// timezone — the spot is in Bulacan, and someone browsing from abroad
// still needs "open now" to mean open now *there*, not wherever their
// device's clock is set.
const MANILA_TZ = "Asia/Manila";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function manilaParts(date) {
  // hourCycle: "h23" avoids the well-known Intl quirk where hour12:false
  // can still yield "24" for midnight in some environments.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TZ,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === "weekday").value;
  const hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;

  return {
    weekday: WEEKDAYS.indexOf(weekdayShort),
    hhmm: `${hour}:${minute}`,
  };
}

export function isOpenNow(openHours, now = new Date()) {
  if (!openHours) return null;
  const { open, close, closedDays = [] } = openHours;
  const { weekday, hhmm } = manilaParts(now);
  if (closedDays.includes(weekday)) return false;
  // "HH:MM" strings zero-padded to the same length compare correctly as
  // plain strings — no need to parse into minutes.
  return hhmm >= open && hhmm < close;
}
