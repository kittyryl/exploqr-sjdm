import { distanceKm, formatDistance, googleMapsUrl } from "./geo.ts";
import assert from "node:assert/strict";

// Test distance calculation between two points
const a = { lat: 14.7934724, lng: 121.064165 };
const b = { lat: 14.7919973, lng: 121.0588505 };
const dist = distanceKm(a, b);
assert.ok(dist > 0.5 && dist < 1.0, `distance should be ~0.6 km, got ${dist}`);

// Test distance formatting
assert.equal(formatDistance(0.2), "200 m", "sub-km distance formats in meters");
assert.equal(formatDistance(1.234), "1.2 km", "distance under 10km formats with 1 decimal");
assert.equal(formatDistance(15.6), "16 km", "distance over 10km formats rounded");

// Test googleMapsUrl when real spot name is provided
const spotWithName = {
  name: "Our Lady of Lourdes Grotto Shrine",
  lat: 14.7934724,
  lng: 121.064165,
};
assert.equal(
  googleMapsUrl(spotWithName),
  "https://www.google.com/maps/search/?api=1&query=Our%20Lady%20of%20Lourdes%20Grotto%20Shrine%2C%20San%20Jose%20del%20Monte%2C%20Bulacan",
  "generates real location search URL using spot name and city"
);

// Test googleMapsUrl when custom googleMapsUrl is provided
const spotWithCustomUrl = {
  name: "Grotto Vista Resort",
  lat: 14.7919973,
  lng: 121.0588505,
  googleMapsUrl: "https://maps.app.goo.gl/qVsBHjymsnXEpqpz7",
};
assert.equal(
  googleMapsUrl(spotWithCustomUrl),
  "https://maps.app.goo.gl/qVsBHjymsnXEpqpz7",
  "uses custom googleMapsUrl when provided"
);

// Test googleMapsUrl fallback to coordinates when no name or custom URL is present
const spotCoordsOnly = { lat: 14.7934724, lng: 121.064165 };
assert.equal(
  googleMapsUrl(spotCoordsOnly),
  "https://www.google.com/maps/search/?api=1&query=14.7934724,121.064165",
  "falls back to coordinate query when no name is provided"
);

console.log("All geo assertions passed");
