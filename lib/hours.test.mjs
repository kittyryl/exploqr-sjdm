import { isOpenNow } from "./hours.js";
import assert from "node:assert/strict";

// Manila is UTC+8 with no DST, so a UTC timestamp at hour 04:00 is always
// noon in Manila on the same calendar day — this lets the test find a UTC
// weekday that's guaranteed to equal the Manila weekday, without relying
// on hand-checked calendar facts.
function manilaNoonOnWeekday(targetWeekday) {
  const d = new Date(Date.UTC(2026, 0, 1, 4, 0));
  while (d.getUTCDay() !== targetWeekday) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function atManilaTime(noonDate, hh, mm) {
  const d = new Date(noonDate);
  d.setUTCHours(hh - 8, mm, 0, 0); // Manila = UTC + 8h, so UTC hour = Manila hour - 8
  return d;
}

const monday = manilaNoonOnWeekday(1);
const tuesday = manilaNoonOnWeekday(2);
const sunday = manilaNoonOnWeekday(0);

const padrePio = { open: "06:00", close: "17:00", closedDays: [1] };
const grotto = { open: "05:00", close: "20:00" };

assert.equal(isOpenNow(padrePio, atManilaTime(monday, 10, 0)), false, "closed all day Monday (closedDays)");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 10, 0)), true, "open Tuesday mid-window");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 18, 0)), false, "closed Tuesday after close");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 5, 0)), false, "closed Tuesday before open");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 6, 0)), true, "open exactly at open time (inclusive)");
assert.equal(isOpenNow(padrePio, atManilaTime(tuesday, 17, 0)), false, "closed exactly at close time (exclusive)");
assert.equal(isOpenNow(grotto, atManilaTime(sunday, 12, 0)), true, "open-daily spot open on Sunday too");
assert.equal(isOpenNow(undefined, atManilaTime(tuesday, 10, 0)), null, "no openHours -> null");

console.log("All isOpenNow assertions passed");
