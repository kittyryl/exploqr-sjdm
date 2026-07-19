"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  CircleMarker,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIES, spotIcon } from "@/lib/categories";
import { sjdmBoundary } from "@/data/sjdmBoundary";
import { DEFAULT_LOCALE, text } from "@/lib/i18n";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

// Voyager, not Positron. Positron is built to disappear under data — which is
// right for a dashboard and wrong here, where the map *is* the content and its
// emptiness read as an unfinished page. Voyager carries the Sierra Madre's
// green, the road hierarchy, and the reservoirs, so the biggest area on the
// page finally says something. Same provider and attribution, still no key.
//
// Dark mode keeps dark_all: Voyager has no dark sibling, and light tiles on a
// dark page glare and wash out the boundary mask.
const TILE_URL_LIGHT =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_URL_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// A world-sized outer ring with the city boundary as a hole: everything
// outside San Jose del Monte gets a translucent paper wash, so the city
// itself reads as the focus of the map.
const WORLD_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

// Tile URLs and the divIcon HTML below are strings, not React — but the
// colors are still CSS variables, since this markup lands in the document
// and resolves them like anything else.
//
// The CSS variables pick up an explicit light/dark override automatically
// (globals.css keys off `data-theme`), but a raster tile URL has to be
// chosen in JS, so it needs the same override explicitly: "system" still
// tracks the OS live, but an explicit choice must win over it rather than
// silently falling back to `prefers-color-scheme` like the map used to.
function usePrefersDark(): boolean {
  const { theme } = useTheme();
  const [osDark, setOsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setOsDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  if (theme === "light") return false;
  if (theme === "dark") return true;
  return osDark;
}

// Each pin is built exactly once and never rebuilt for selection — selection
// is a class toggled on the marker element (see the effect in SpotMap), so the
// DOM survives and its CSS transitions/animations can actually run. The old
// code rebuilt every icon on every selectedId change, which recreated the DOM
// and silently killed the width/height transition it declared.
//
// The markup nests two elements on purpose: `__drop` owns the staggered
// entrance (translate + fade, driven by --i), `__dot` owns the selected pop
// (a scale transition) and the pulse. Keeping them separate stops the entrance
// transform and the selected-scale transform from fighting over one element.
// Size, shadows, colors, and both animations live in globals.css.
function markerIcon(spot: Spot, index: number): L.DivIcon {
  const Icon = spotIcon(spot);
  const fill = CATEGORIES[spot.category].fill;
  const svg = renderToStaticMarkup(
    <Icon size={16} color="#ffffff" strokeWidth={2.25} />
  );
  // The aria-label isn't localized to the current UI language — this HTML
  // string is built outside React (no locale to read), so it always resolves
  // through lib/i18n's own English fallback chain via text().
  const label = text(spot.name, DEFAULT_LOCALE).replace(/"/g, "&quot;");
  // `color:${fill}` sets currentColor so the pulse ring and the selected halo
  // both pick up the category color without re-templating it.
  return L.divIcon({
    className: "spot-marker",
    html: `<div class="spot-marker__drop" style="--i:${index}">
      <div class="spot-marker__dot" style="color:${fill};background:${fill}" role="img" aria-label="${label}">
        <span class="spot-marker-pulse"></span>${svg}
      </div>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Fits the map to the currently visible markers (and the user's location,
// if known) on mount and whenever that set changes.
function FitToSpots({ spots, userLocation }: { spots: Spot[]; userLocation: UserLocation | null }) {
  const map = useMap();
  const key = useMemo(
    () =>
      spots.map((s) => s.id).join(",") +
      (userLocation ? `|${userLocation.lat},${userLocation.lng}` : ""),
    [spots, userLocation]
  );
  useEffect(() => {
    if (spots.length === 0) return;
    const points: [number, number][] = spots.map((s) => [s.lat, s.lng]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

interface SpotMapProps {
  spots: Spot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  userLocation: UserLocation | null;
}

export default function SpotMap({ spots, selectedId, onSelect, userLocation }: SpotMapProps) {
  const prefersDark = usePrefersDark();
  const { t, text: localizedText } = useLocale();

  // The set of visible spots, order-independent: toggling "Near me" reorders
  // `spots` but shouldn't rebuild pins (that would replay the drop-in and reset
  // the stagger). Filtering, which changes the set, should.
  const generation = useMemo(
    () => spots.map((s) => s.id).slice().sort().join(","),
    [spots]
  );

  // Built once per generation. Not keyed on selectedId: selection is a class
  // toggle below, so these icon instances stay stable and their DOM is never
  // recreated on click. Stagger index is fixed at build time.
  const icons = useMemo(
    () => Object.fromEntries(spots.map((s, i) => [s.id, markerIcon(s, i)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation]
  );

  // Selection is a class toggled on the live marker element, not a rebuilt
  // icon (a rebuild recreates the DOM and kills the pop transition). A marker's
  // element only exists once it's been *added* to the map, which happens after
  // this component's own effects (MapContainer renders its children, and each
  // Marker adds itself, asynchronously once the map is ready). So `mapReady`
  // bumps on every marker's `add` event, forcing this effect to re-run once the
  // elements actually exist; it also re-runs whenever the selection changes.
  const markerRefs = useRef(new Map<string, L.Marker>());
  const [mapReady, setMapReady] = useState(0);
  const markReady = useCallback(() => setMapReady((n) => n + 1), []);
  useEffect(() => {
    markerRefs.current.forEach((marker, id) => {
      const el = marker.getElement?.();
      if (el) el.classList.toggle("spot-marker--selected", id === selectedId);
    });
  }, [selectedId, generation, mapReady]);

  const cityBounds = useMemo(
    () => L.latLngBounds(sjdmBoundary.flat() as [number, number][]).pad(0.12),
    []
  );

  // Stable per-spot eventHandlers/ref identities, rebuilt only when the
  // visible set changes (`generation`) — react-leaflet diffs `eventHandlers`
  // by reference and re-registers every marker's DOM listeners when it sees
  // a new object, so a fresh literal per render was churning every marker's
  // listeners on every SpotMap re-render, not just the one that changed.
  const eventHandlersById = useMemo(
    () =>
      Object.fromEntries(
        spots.map((s) => [s.id, { click: () => onSelect(s.id), add: markReady }])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation, onSelect, markReady]
  );
  const markerRefCallbacksById = useMemo(
    () =>
      Object.fromEntries(
        spots.map((s) => [
          s.id,
          (m: L.Marker | null) => {
            if (m) markerRefs.current.set(s.id, m);
            else markerRefs.current.delete(s.id);
          },
        ])
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation]
  );

  return (
    <MapContainer
      center={[14.81, 121.1]}
      zoom={12}
      minZoom={11}
      maxBounds={cityBounds}
      maxBoundsViscosity={1.0}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      {/* Keyed so the layer is rebuilt, not just re-pointed, on theme change */}
      <TileLayer
        key={prefersDark ? "dark" : "light"}
        url={prefersDark ? TILE_URL_DARK : TILE_URL_LIGHT}
        attribution={TILE_ATTRIBUTION}
      />
      {/* Dim everything outside the city. fillColor/color are dead values that
          the .map-dim-mask / .map-boundary CSS rules override — Leaflet can't
          write a var() into an SVG attribute. */}
      <Polygon
        positions={[WORLD_RING, ...sjdmBoundary] as L.LatLngExpression[][]}
        interactive={false}
        pathOptions={{
          className: "map-dim-mask",
          stroke: false,
          // Enough wash to make the city read as the subject, not so much that
          // the surrounding terrain becomes more blank page. Worth less now
          // that the basemap underneath is worth seeing.
          fillOpacity: 0.5,
        }}
      />
      {/* City boundary line */}
      <Polygon
        positions={sjdmBoundary as L.LatLngExpression[][]}
        interactive={false}
        pathOptions={{
          className: "map-boundary",
          weight: 1.5,
          opacity: 0.55,
          dashArray: "5 5",
          fill: false,
        }}
      />
      <FitToSpots spots={spots} userLocation={userLocation} />
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={7}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 1,
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            opacity={1}
            className="spot-tooltip"
          >
            {t("nearme.here")}
          </Tooltip>
        </CircleMarker>
      )}
      {spots.map((spot) => {
        const selected = spot.id === selectedId;
        return (
          <Marker
            key={spot.id}
            ref={markerRefCallbacksById[spot.id]}
            position={[spot.lat, spot.lng]}
            icon={icons[spot.id]}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={eventHandlersById[spot.id]}
          >
            <Tooltip
              direction="top"
              offset={[0, selected ? -26 : -18]}
              opacity={1}
              className="spot-tooltip"
            >
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: CATEGORIES[spot.category].fill }}
                />
                {localizedText(spot.name)}
              </span>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
