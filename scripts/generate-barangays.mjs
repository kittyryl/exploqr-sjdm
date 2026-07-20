// Regenerate data/barangays.ts from the upstream PSA boundary set:
//   node scripts/generate-barangays.mjs
// Needs network access. Rerun it if the barangay list changes or if a spot's
// barangay stops matching (the script prints the join result).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const URL =
  "https://raw.githubusercontent.com/faeldon/philippines-json-maps/master/2019/geojson/barangays/medres/barangays-municity-ph031420000.0.01.json";

const geo = await (await fetch(URL, { headers: { "User-Agent": "ExploQR-build" } })).json();
console.log("features:", geo.features.length);

const R = (n) => Math.round(n * 1e5) / 1e5;
const key = (lat, lng) => `${R(lat)},${R(lng)}`;

// GeoJSON is [lng,lat]; Leaflet wants [lat,lng]. Flatten Polygon/MultiPolygon
// down to a list of rings so both shapes render the same way.
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

// --- adjacency by shared vertices -------------------------------------------
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

// --- greedy graph colouring (Welsh-Powell): neighbours never share a tint ----
const order = items.map((_, i) => i).sort((a, b) => adj[b].size - adj[a].size);
const color = new Array(items.length).fill(-1);
for (const i of order) {
  const used = new Set([...adj[i]].map((n) => color[n]).filter((c) => c >= 0));
  let c = 0;
  while (used.has(c)) c++;
  color[i] = c;
}
console.log("colours used:", Math.max(...color) + 1);

// verify no neighbour clash
let clashes = 0;
adj.forEach((ns, i) => ns.forEach((n) => { if (color[i] === color[n]) clashes++; }));
console.log("neighbour colour clashes:", clashes);

// --- label anchor: area-weighted centroid of the largest ring ---------------
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

// The zoom at which this barangay is finally wide enough to carry its own
// name. Web-mercator tiles are 256px and span 360deg at z0, so a shape roughly
// sqrt(area) degrees across is sqrt(area)*256*2^z/360 pixels across. Solve for
// the zoom that clears MIN_PX and you get progressive disclosure by size: the
// big southern barangays label immediately, the slivers around Sapang Palay
// wait until they can actually hold the text.
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

// --- cross-check against the barangays used in data/spots.ts ---------------
const spotsSrc = fs.readFileSync(path.join(ROOT, "data/spots.ts"), "utf8");
const used = [...new Set([...spotsSrc.matchAll(/barangay:\s*"([^"]+)"/g)].map((m) => m[1]))];
const names = new Set(out.map((o) => o.name));
console.log("\nbarangays referenced by spots:", used.length);
for (const u of used) console.log(`  ${names.has(u) ? "MATCH  " : "NO MATCH"} ${u}`);

const body = `// Barangay boundaries for the City of San Jose del Monte (59 barangays).
//
// Source: Philippine Statistics Authority administrative boundaries, via
// github.com/faeldon/philippines-json-maps (MIT), 2019 medium-resolution set,
// municipality PSGC 031420000. Coordinates are [lat, lng] pairs ready for
// Leaflet, rounded to 5 decimals (~1 m) and reprojected from GeoJSON's
// [lng, lat] order.
//
// GENERATED FILE — do not hand-edit. \`tint\` is a palette slot (not a
// category): the generator builds an adjacency graph from shared vertices and
// greedy-colours it, so no two barangays that touch ever get the same tint.
// \`minZoom\` is the zoom at which the barangay is finally wide enough to hold
// its own name — labels appear progressively by size rather than all at once,
// which is what keeps the Sapang Palay slivers from piling up. Barangays that
// contain a destination are labelled regardless.
// \`center\` is the area-weighted centroid of each barangay's largest ring.
export interface Barangay {
  name: string;
  tint: number;
  minZoom: number;
  center: [number, number];
  rings: number[][][];
}

export const barangays: Barangay[] = ${JSON.stringify(out)};
`;
// Match the platform's line endings, so rerunning this on Windows doesn't
// leave the file showing as modified with an EOL-only diff.
fs.writeFileSync(path.join(ROOT, "data/barangays.ts"), body.replace(/\n/g, os.EOL));
console.log("\nwrote data/barangays.ts —", (body.length / 1024).toFixed(1), "KB");
