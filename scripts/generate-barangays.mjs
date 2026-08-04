// Run this with: node scripts/generate-barangays.mjs
// It rebuilds data/barangays.ts and data/sjdmBoundary.ts from official government map data.
// Needs internet access. Rerun if the barangay list changes or a spot's barangay name stops matching.
//
// The city outline is built by merging the 59 barangay shapes together, instead of using
// a separate map source — two different maps of the same city never line up exactly,
// which used to leave weird gaps between the barangay colors and the city border.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { union } from "@turf/turf";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const URL =
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2019/geojson/barangays/medres/barangays-municity-ph031420000.0.01.json";

const geo = await (await fetch(URL, { headers: { "User-Agent": "ExploQR-build" } })).json();
console.log("features:", geo.features.length);

const R = (n) => Math.round(n * 1e5) / 1e5;
const key = (lat, lng) => `${R(lat)},${R(lng)}`;

// The map file stores points backwards (lng before lat), so flip them to
// the order the map display expects.
function ringsOf(geom) {
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  const out = [];
  for (const poly of polys) for (const ring of poly) out.push(ring.map(([lng, lat]) => [R(lat), R(lng)]));
  return out;
}

const items = geo.features.map((f) => ({
  name: f.properties.ADM4_EN,
  rings: ringsOf(f.geometry),
}));

// --- find which barangays touch each other ---
const vertexOwners = new Map();
items.forEach((it, i) => {
  const seen = new Set();
  for (const ring of it.rings) for (const [lat, lng] of ring) seen.add(key(lat, lng));
  for (const k of seen) {
    if (!vertexOwners.has(k)) vertexOwners.set(k, new Set());
    vertexOwners.get(k).add(i);
  }
});
const adj = items.map(() => new Set());
for (const owners of vertexOwners.values()) {
  const a = [...owners];
  for (let i = 0; i < a.length; i++)
    for (let j = i + 1; j < a.length; j++) {
      adj[a[i]].add(a[j]);
      adj[a[j]].add(a[i]);
    }
}
const degs = adj.map((s) => s.size);
console.log("adjacency: min", Math.min(...degs), "max", Math.max(...degs), "isolated", degs.filter((d) => d === 0).length);

// --- pick colors so touching barangays never get the same one ---
const order = items.map((_, i) => i).sort((a, b) => adj[b].size - adj[a].size);
const color = new Array(items.length).fill(-1);
for (const i of order) {
  const used = new Set([...adj[i]].map((n) => color[n]).filter((c) => c >= 0));
  let c = 0;
  while (used.has(c)) c++;
  color[i] = c;
}
console.log("colours used:", Math.max(...color) + 1);

// double-check no touching barangays got the same color
let clashes = 0;
adj.forEach((ns, i) => ns.forEach((n) => { if (color[i] === color[n]) clashes++; }));
console.log("neighbour colour clashes:", clashes);

// --- find the best spot to place each barangay's name label ---
function centroid(ring) {
  let a = 0, cy = 0, cx = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [y0, x0] = ring[j], [y1, x1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  a *= 0.5;
  if (!a) { const p = ring[0]; return [p[0], p[1]]; }
  return [R(cy / (6 * a)), R(cx / (6 * a))];
}
function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [y0, x0] = ring[j], [y1, x1] = ring[i];
    a += x0 * y1 - x1 * y0;
  }
  return Math.abs(a / 2);
}

// Works out how far you need to zoom in before a barangay is big enough on
// screen to show its name. Bigger barangays get labeled sooner; small
// slivers wait until there's room for the text.
const MIN_PX = 74;
function minZoomFor(area) {
  const deg = Math.sqrt(area);
  if (!deg) return 18;
  const z = Math.log2((MIN_PX * 360) / (256 * deg));
  return Math.max(11, Math.min(18, Math.ceil(z)));
}

const out = items.map((it, i) => {
  const sorted = it.rings.slice().sort((a, b) => ringArea(b) - ringArea(a));
  const biggest = sorted[0];
  return {
    name: it.name,
    tint: color[i],
    minZoom: minZoomFor(ringArea(biggest)),
    center: centroid(biggest),
    rings: it.rings,
  };
});
out.sort((a, b) => a.name.localeCompare(b.name));

const byZoom = {};
for (const o of out) byZoom[o.minZoom] = (byZoom[o.minZoom] || 0) + 1;
console.log("\nlabels revealed per zoom:", JSON.stringify(byZoom));

// --- merge the 59 barangays into one city outline ---
// This uses the original map data, before the point order was flipped above.
const dissolved = geo.features
  .map((f) => ({ type: "Feature", properties: {}, geometry: f.geometry }))
  .reduce((acc, f) => (acc ? union({ type: "FeatureCollection", features: [acc, f] }) : f));
const dissolvedPolys =
  dissolved.geometry.type === "MultiPolygon" ? dissolved.geometry.coordinates : [dissolved.geometry.coordinates];
// Turn the shape into a simple list of outlines the map can draw, even if
// the city boundary ends up in more than one piece.
const cityRings = dissolvedPolys.flatMap((poly) => poly.map((ring) => ring.map(([lng, lat]) => [R(lat), R(lng)])));
console.log("\ncity boundary rings:", cityRings.length, "points:", cityRings.reduce((n, r) => n + r.length, 0));

// --- check that every barangay name used in data/spots.ts actually exists ---
const spotsSrc = fs.readFileSync(path.join(ROOT, "data/spots.ts"), "utf8");
const used = [...new Set([...spotsSrc.matchAll(/barangay:\s*"([^"]+)"/g)].map((m) => m[1]))];
const names = new Set(out.map((o) => o.name));
console.log("\nbarangays referenced by spots:", used.length);
for (const u of used) console.log(`  ${names.has(u) ? "MATCH  " : "NO MATCH"} ${u}`);

const body = `// The shape data for the map: the 59 barangay boundaries of San Jose del Monte.
//
// Source: official Philippine government map data (2019), City of San Jose del Monte.
// Points are stored as [lat, lng] pairs, rounded to about 1 meter of precision.
//
// This file is auto-generated — don't edit it by hand. \`tint\` is just a color
// slot, picked so no two touching barangays share a color. \`minZoom\` controls
// how far you must zoom in before a barangay's name label appears (small
// barangays wait until there's room to show the text; barangays with a
// destination inside always show their name). \`center\` is where the label
// is placed.
export interface Barangay {
  name: string;
  tint: number;
  minZoom: number;
  center: [number, number];
  rings: number[][][];
}

export const barangays: Barangay[] = ${JSON.stringify(out)};
`;
// Use Windows-style line endings so re-running this doesn't show the file
// as changed for no real reason.
fs.writeFileSync(path.join(ROOT, "data/barangays.ts"), body.replace(/\n/g, os.EOL));
console.log("\nwrote data/barangays.ts —", (body.length / 1024).toFixed(1), "KB");

const boundaryBody = `// The shape data for the map: the outer edge of San Jose del Monte, Bulacan.
//
// This file is auto-generated — don't edit it by hand. It's made by merging
// the 59 barangay shapes in data/barangays.ts into one outline (see
// scripts/generate-barangays.mjs), instead of using a separate map source —
// two different maps of the same city never line up exactly, which used to
// leave visible gaps along this border. Source: official Philippine
// government map data. Points are [lat, lng] pairs.
export const sjdmBoundary: number[][][] = ${JSON.stringify(cityRings)};
`;
fs.writeFileSync(path.join(ROOT, "data/sjdmBoundary.ts"), boundaryBody.replace(/\n/g, os.EOL));
console.log("wrote data/sjdmBoundary.ts —", (boundaryBody.length / 1024).toFixed(1), "KB");
