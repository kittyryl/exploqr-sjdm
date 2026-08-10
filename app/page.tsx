"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "motion/react";
import { spots } from "@/data/spots";
import { distanceKm } from "@/lib/geo";
import { fetchRoute, type RouteResult, type RouteState } from "@/lib/routing";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/controls/ThemeToggle";
import CategoryFilter, { type CategoryFilterKey } from "@/components/controls/CategoryFilter";
import NearMeToggle from "@/components/controls/NearMeToggle";
import SpotSearch from "@/components/controls/SpotSearch";
import SpotModal from "@/components/spot/SpotModal";
import RouteInfoPill from "@/components/spot/RouteInfoPill";
import HomeTopBar from "@/components/home/HomeTopBar";
import FeedbackForm from "@/components/home/FeedbackForm";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

// The map needs a real browser to work, so it only loads once the page is
// open on screen. This loading text stays in English since it shows briefly
// before anything else is ready.
const SpotMap = dynamic(() => import("@/components/spot/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/[.03] font-mono text-xs text-ink/70">
      Loading map…
    </div>
  ),
});

// Checks the spot's name, area, and amenities — whatever a visitor is likely
// to type when searching.
function matchesQuery(spot: Spot, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = [spot.name, spot.barangay, ...(spot.amenities ?? [])]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

function visibleIn(category: CategoryFilterKey, query: string): Spot[] {
  const byCategory =
    category === "all" ? spots : spots.filter((s) => s.category === category);
  return byCategory.filter((s) => matchesQuery(s, query));
}

export default function Home() {
  const { t } = useLocale();
  // No spot is picked when the page first loads. Clicking a pin opens that
  // spot in a popup over the map.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilterKey>("all");
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteState | null>(null);
  const routeCacheRef = useRef(new Map<string, RouteResult>());
  const routeAbortRef = useRef<AbortController | null>(null);

  // If the web address includes a spot ID, open that spot right away.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("spot");
    if (id && spots.some((s) => s.id === id)) setSelectedId(id);
  }, []);

  // Keep the web address updated with the selected spot, so it can be
  // shared or bookmarked. Remove it once the popup is closed.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("spot", selectedId);
    else url.searchParams.delete("spot");
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const handleCategory = useCallback(
    (next: CategoryFilterKey) => {
      setCategory(next);
      const visible = visibleIn(next, query);
      setSelectedId((current) =>
        current && !visible.some((s) => s.id === current) ? null : current
      );
    },
    [query]
  );

  const handleSearch = useCallback(
    (next: string) => {
      setQuery(next);
      const visible = visibleIn(category, next);
      setSelectedId((current) =>
        current && !visible.some((s) => s.id === current) ? null : current
      );
    },
    [category]
  );

  // Wraps the geolocation call as a promise so both the "Near Me" toggle and
  // the directions flow share one path for requesting/recording location and
  // its error states, instead of two copies of the same getCurrentPosition
  // call drifting apart over time.
  const requestLocation = useCallback((): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const message = t("nearme.unsupported");
        setLocationError(message);
        reject(new Error(message));
        return;
      }
      setLocating(true);
      setLocationError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(next);
          setLocating(false);
          resolve(next);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED ? t("nearme.denied") : t("nearme.failed");
          setLocationError(message);
          setLocating(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [t]);

  // "Near me" only asks for your location when tapped, not automatically
  // when the page loads.
  const handleNearMe = useCallback(() => {
    if (userLocation) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }
    requestLocation().catch(() => {
      // requestLocation already recorded the error in locationError; nothing
      // further to do here.
    });
  }, [userLocation, requestLocation]);

  // Resolves the visitor's location (asking for it if needed), closes the
  // modal so the map is visible, then draws a route: a real OSRM road route
  // when available, a dashed straight line immediately and as a fallback.
  const handleDirections = useCallback(
    async (spot: Spot) => {
      routeAbortRef.current?.abort();

      let origin = userLocation;
      if (!origin) {
        try {
          origin = await requestLocation();
        } catch {
          return;
        }
      }

      setSelectedId(null);
      if (window.matchMedia("(max-width: 639px)").matches) {
        document.getElementById("explore-map")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      const straightLineKm = distanceKm(origin, spot);
      if (straightLineKm < 0.2) {
        setRoute({ spot, coords: null, distanceKm: straightLineKm, durationMin: null, arrived: true, loading: false });
        return;
      }

      const cacheKey = `${spot.id}:${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}`;
      const cached = routeCacheRef.current.get(cacheKey);
      if (cached) {
        setRoute({ spot, coords: cached.coords, distanceKm: cached.distanceKm, durationMin: cached.durationMin, arrived: false, loading: false });
        return;
      }

      setRoute({ spot, coords: null, distanceKm: straightLineKm, durationMin: null, arrived: false, loading: true });

      const controller = new AbortController();
      routeAbortRef.current = controller;
      const result = await fetchRoute(origin, spot, controller.signal);
      if (controller.signal.aborted) return;

      if (result) {
        routeCacheRef.current.set(cacheKey, result);
        setRoute({ spot, coords: result.coords, distanceKm: result.distanceKm, durationMin: result.durationMin, arrived: false, loading: false });
      } else {
        setRoute((current) => (current && current.spot.id === spot.id ? { ...current, loading: false } : current));
      }
    },
    [userLocation, requestLocation]
  );

  const handleClearRoute = useCallback(() => {
    routeAbortRef.current?.abort();
    setRoute(null);
  }, []);

  const visible = useMemo(() => visibleIn(category, query), [category, query]);

  // A route pointing at a spot that's been filtered/searched away would
  // otherwise linger with no destination pin visible.
  useEffect(() => {
    // Legitimate reaction to an external input (search/category filtering
    // `visible`) invalidating derived route state, not a cascading render:
    // this only fires when the filtered spot list changes, and clearing
    // `route` here doesn't re-trigger this same effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (route && !visible.some((s) => s.id === route.spot.id)) setRoute(null);
  }, [visible, route]);

  // No origin, no route.
  useEffect(() => {
    // Legitimate reaction to an external input (geolocation being toggled
    // off) invalidating derived route state, not a cascading render: this
    // only fires when `userLocation` changes, and clearing `route` here
    // doesn't re-trigger this same effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!userLocation) setRoute(null);
  }, [userLocation]);

  const selected = useMemo(
    () => spots.find((s) => s.id === selectedId) || null,
    [selectedId]
  );

  const distances = useMemo(
    () =>
      userLocation
        ? Object.fromEntries(
            visible.map((s) => [s.id, distanceKm(userLocation, s)])
          )
        : null,
    [userLocation, visible]
  );
  const orderedVisible = useMemo(
    () =>
      distances
        ? [...visible].sort((a, b) => distances[a.id] - distances[b.id])
        : visible,
    [distances, visible]
  );

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <header className="sticky top-0 z-20 border-b border-line/70 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-y-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-6 sm:px-6">
          <div className="flex items-center justify-between gap-2">
            <Wordmark />
            <div className="flex items-center gap-1.5 sm:hidden">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <CategoryFilter
              spots={spots}
              active={category}
              onChange={handleCategory}
            />
            <div className="hidden items-center gap-2 sm:flex">
              <ThemeToggle />
            </div>
          </div>
        </div>
        {/* Thin colour strip under the top bar, matching the pin colours. */}
        <div
          aria-hidden="true"
          className="cat-rainbow pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-60"
        />
      </header>

      <main className="flex-1">
        {/* The sunrise banner stretches the full width, then fades so the
            map below feels calm. */}
        <div className="hero-band">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <HomeTopBar />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mb-3 mt-9 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p
                className="font-mono text-[11px] uppercase tracking-widest"
                style={{ color: "var(--cat-nature-accent)" }}
              >
                {t("map.cap.eyebrow")}
              </p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-[-0.02em] text-ink sm:text-2xl">
                <span aria-hidden="true" style={{ color: "var(--cat-leisure-fill)" }}>
                  ◉{" "}
                </span>
                City of San Jose Del Monte Top Tourist Destinations
              </h2>
            </div>
            <div className="shrink-0">
              <NearMeToggle
                active={Boolean(userLocation)}
                loading={locating}
                error={locationError}
                onClick={handleNearMe}
              />
            </div>
          </div>

          <div className="mb-3 max-w-md">
            <SpotSearch value={query} onChange={handleSearch} />
          </div>

          {/* The map sits in a frame with corner marks, like an old paper map. */}
          <div className="map-shell relative mb-4 rounded-3xl border border-line p-3 shadow-[0_1px_2px_rgba(58,38,16,0.06),0_10px_30px_-14px_rgba(58,38,16,0.3)] sm:p-4">
            <span className="survey-tick" style={{ top: 14, left: 14, borderTopWidth: 1.5, borderLeftWidth: 1.5 }} />
            <span className="survey-tick" style={{ top: 14, right: 14, borderTopWidth: 1.5, borderRightWidth: 1.5 }} />
            <span className="survey-tick" style={{ bottom: 14, left: 14, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }} />
            <span className="survey-tick" style={{ bottom: 14, right: 14, borderBottomWidth: 1.5, borderRightWidth: 1.5 }} />

            <div id="explore-map" className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">
              <SpotMap
                spots={orderedVisible}
                selectedId={selectedId}
                onSelect={setSelectedId}
                userLocation={userLocation}
                route={route}
              />
              {route && (
                <RouteInfoPill route={route} onReopen={setSelectedId} onClear={handleClearRoute} />
              )}
              {orderedVisible.length === 0 && (
                <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                  <p className="rounded-full border border-line bg-surface/95 px-4 py-2 font-mono text-xs text-ink/65 shadow-sm">
                    {t("search.empty")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <FeedbackForm />
      </main>

      <SpotModal
        spot={selected}
        onClose={() => setSelectedId(null)}
        distanceKm={selected && distances ? distances[selected.id] : undefined}
        onDirections={handleDirections}
        directionsLoading={locating}
      />
    </MotionConfig>
  );
}
