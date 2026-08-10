import { parseOsrmResponse, formatDuration } from "./routing.ts";
import assert from "node:assert/strict";

const ok = parseOsrmResponse({
  code: "Ok",
  routes: [
    {
      geometry: { coordinates: [[121.05, 14.81], [121.06, 14.82]] },
      distance: 2500,
      duration: 300,
    },
  ],
});
assert.deepEqual(
  ok,
  { coords: [[14.81, 121.05], [14.82, 121.06]], distanceKm: 2.5, durationMin: 5 },
  "parses a successful OSRM response, flipping [lng,lat] pairs to [lat,lng]"
);

assert.equal(parseOsrmResponse({ code: "NoRoute", routes: [] }), null, "non-Ok code returns null");
assert.equal(parseOsrmResponse({ code: "Ok", routes: [] }), null, "empty routes array returns null");
assert.equal(parseOsrmResponse(null), null, "null input returns null");
assert.equal(parseOsrmResponse({}), null, "malformed input returns null");

assert.equal(formatDuration(5), "5 min", "sub-hour duration");
assert.equal(formatDuration(45), "45 min", "just under an hour");
assert.equal(formatDuration(90), "1h 30min", "over an hour with a remainder");
assert.equal(formatDuration(120), "2h", "exact hour, no remainder shown");

console.log("All routing assertions passed");
