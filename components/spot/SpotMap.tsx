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
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORIES, spotIcon } from "@/lib/categories";
import { sjdmBoundary } from "@/data/sjdmBoundary";
import { barangays } from "@/data/barangays";
import { barangaysWithSpots } from "@/lib/barangays";
import { text } from "@/lib/i18n";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

const TILE_ATTRIBUTION = "© OpenStreetMap contributors © CARTO";

// Uses a more colorful, detailed map style instead of a plain one, since the
// map is the main content here, not just a backdrop.
// Dark mode uses its own separate dark map style so it isn't too bright at night.
const TILE_URL_LIGHT =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_URL_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Fades out everything outside San Jose del Monte so the city stands out.
const WORLD_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

// Decides whether to show the light or dark map. If the visitor picked a
// theme manually, that choice wins over their device's setting.
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

// Each pin icon is made once and just gets highlighted when picked, rather
// than rebuilt — rebuilding it used to break the highlight animation.
// Pin shape: the circle shows the photo, the pointed tail marks the exact spot.
const PIN_SIZE = 46;
const PIN_TAIL = 10;

function markerIcon(spot: Spot, index: number): L.DivIcon {
  const Icon = spotIcon(spot);
  const fill = CATEGORIES[spot.category].fill;
  const svg = renderToStaticMarkup(
    <Icon size={18} color="#ffffff" strokeWidth={2.25} />
  );

  // The photo sits on top of the category icon. If the photo fails to load it
  // just disappears, showing the plain icon instead of a broken-image icon.
  // Photos are resized down for the small pin so the map loads faster.
  const photo = spot.images?.[0];
  const img = photo
    ? `<img class="spot-marker__img" alt="" loading="lazy" decoding="async"
        src="/_next/image?url=${encodeURIComponent(photo)}&w=96&q=75"
        onerror="this.remove()">`
    : "";
  // The screen-reader label always uses English here, since this part can't
  // access the visitor's chosen language.
  const label = text(spot.name).replace(/"/g, "&quot;");
  // Sets the pin's color once so the glow and highlight ring both match it automatically.
  return L.divIcon({
    className: "spot-marker",
    html: `<div class="spot-marker__drop" style="--i:${index}">
      <div class="spot-marker__dot" style="color:${fill};background:${fill}" role="img" aria-label="${label}">
        <span class="spot-marker-pulse"></span>${svg}${img}
      </div>
    </div>`,
    iconSize: [PIN_SIZE, PIN_SIZE + PIN_TAIL],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE + PIN_TAIL],
  });
}

// Zooms and centers the map to fit all visible spots (and the visitor's location, if known).
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

function useZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return zoom;
}

// Shows all 59 barangays as colored, named areas in the background. They
// can't be clicked, so taps always reach the pins instead.
// Barangay names only appear once you've zoomed in enough to read them
// clearly, since small barangays get crowded at low zoom. Barangays with a
// tourist spot always show their name, though.
function BarangayLayer({ spots }: { spots: Spot[] }) {
  const zoom = useZoom();
  const withSpots = useMemo(() => barangaysWithSpots(spots), [spots]);

  return (
    <>
      {barangays.map((b) => {
        const hasSpot = withSpots.has(b.name);
        return (
          <Polygon
            key={b.name}
            positions={b.rings as L.LatLngExpression[][]}
            interactive={false}
            eventHandlers={{
              add: (e) =>
                e.target.getElement()?.classList.add("map-brgy", `map-brgy--${b.tint}`),
            }}
          >
            {(hasSpot || zoom >= b.minZoom) && (
              <Tooltip
                permanent
                direction="center"
                opacity={1}
                className={`brgy-label${hasSpot ? " brgy-label--spot" : ""}`}
              >
                {b.name}
              </Tooltip>
            )}
          </Polygon>
        );
      })}
    </>
  );
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

  // Tracks which spots are showing, regardless of order, so sorting by
  // distance doesn't replay the pin drop-in animation.
  const generation = useMemo(
    () => spots.map((s) => s.id).slice().sort().join(","),
    [spots]
  );

  // Pin icons are built once and reused, not rebuilt when a pin is selected.
  const icons = useMemo(
    () => Object.fromEntries(spots.map((s, i) => [s.id, markerIcon(s, i)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [generation]
  );

  // Highlights the selected pin by tagging its element, once it's actually
  // on the map. Re-runs whenever pins finish loading or the selection changes.
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

  // Keeps click handlers stable between renders so the map doesn't redo
  // unnecessary work on every re-render.
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
      {/* Forces the map to fully reload its tiles when switching light/dark mode */}
      <TileLayer
        key={prefersDark ? "dark" : "light"}
        url={prefersDark ? TILE_URL_DARK : TILE_URL_LIGHT}
        attribution={TILE_ATTRIBUTION}
      />
      {/* Sits below the dimming layer so the barangay colors still show through */}
      <BarangayLayer spots={spots} />
      {/* Dims the area outside the city. The color comes from a style class
          rather than a setting here, since the setting alone didn't work. */}
      <Polygon
        positions={[WORLD_RING, ...sjdmBoundary] as L.LatLngExpression[][]}
        interactive={false}
        eventHandlers={{ add: (e) => e.target.getElement()?.classList.add("map-dim-mask") }}
        pathOptions={{
          stroke: false,
          // Just enough fading to keep focus on the city without hiding the map underneath.
          fillOpacity: 0.5,
        }}
      />
      {/* City boundary line */}
      <Polygon
        positions={sjdmBoundary as L.LatLngExpression[][]}
        interactive={false}
        eventHandlers={{ add: (e) => e.target.getElement()?.classList.add("map-boundary") }}
        pathOptions={{
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
              // Spot names are always shown, like labels on a printed map,
              // not just when hovered.
              permanent
              direction="bottom"
              offset={[0, 3]}
              opacity={1}
              className={`spot-tooltip${selected ? " spot-tooltip--selected" : ""}`}
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
