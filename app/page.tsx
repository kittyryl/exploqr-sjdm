"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "motion/react";
import { spots } from "@/data/spots";
import { distanceKm } from "@/lib/geo";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/controls/ThemeToggle";
import LocaleToggle from "@/components/controls/LocaleToggle";
import CategoryFilter, { type CategoryFilterKey } from "@/components/controls/CategoryFilter";
import NearMeToggle from "@/components/controls/NearMeToggle";
import SpotModal from "@/components/spot/SpotModal";
import HomeTopBar from "@/components/home/HomeTopBar";
import FeedbackForm from "@/components/home/FeedbackForm";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

// Leaflet touches `window`, so the map only ever renders on the client.
// The fallback can't use the locale hook — it renders outside the tree — so
// this one string stays English; it's on screen for a few hundred ms.
const SpotMap = dynamic(() => import("@/components/spot/SpotMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-ink/[.03] font-mono text-xs text-ink/70">
      Loading map…
    </div>
  ),
});

function visibleIn(category: CategoryFilterKey): Spot[] {
  return category === "all"
    ? spots
    : spots.filter((s) => s.category === category);
}

export default function Home() {
  const { t } = useLocale();
  // No spot is selected on load — the map is the landing view. Clicking a
  // pin opens that spot in a modal (bottom sheet on mobile, centered dialog
  // on desktop) over the still-visible map.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilterKey>("all");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Deep link in: /?spot=<id> opens that spot's modal on first load.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("spot");
    if (id && spots.some((s) => s.id === id)) setSelectedId(id);
  }, []);

  // Deep link out: keep the URL shareable as the selection changes, and
  // drop the param entirely once the modal is closed.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set("spot", selectedId);
    else url.searchParams.delete("spot");
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  const handleCategory = useCallback((next: CategoryFilterKey) => {
    setCategory(next);
    const visible = visibleIn(next);
    setSelectedId((current) =>
      current && !visible.some((s) => s.id === current) ? null : current
    );
  }, []);

  // "Near me" toggles on/off; turning on asks the browser for a one-time
  // location fix (a user gesture, not requested on page load).
  const handleNearMe = useCallback(() => {
    if (userLocation) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationError(t("nearme.unsupported"));
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? t("nearme.denied")
            : t("nearme.failed")
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [userLocation, t]);

  const visible = useMemo(() => visibleIn(category), [category]);
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
              <LocaleToggle />
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
              <LocaleToggle />
            </div>
          </div>
        </div>
        {/* The category spectrum as a hairline — the same legend the pins and
            headline use, threaded under the whole top bar. */}
        <div
          aria-hidden="true"
          className="cat-rainbow pointer-events-none absolute inset-x-0 bottom-0 h-[2px] opacity-60"
        />
      </header>

      <main className="flex-1">
        {/* Full-bleed dawn band: the hero's sunrise gradient and contour
            rings break out of the max-width column, then fade into the paper
            so the map below sits on calm ground (see .hero-band). */}
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
                San Jose del Monte, Bulacan
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

          {/* The map sits in a warm mat with four survey ticks — the same
              cartographic lineage as the pins' printed-map shape. */}
          <div className="map-shell relative mb-4 rounded-3xl border border-line p-3 shadow-[0_1px_2px_rgba(58,38,16,0.06),0_10px_30px_-14px_rgba(58,38,16,0.3)] sm:p-4">
            <span className="survey-tick" style={{ top: 14, left: 14, borderTopWidth: 1.5, borderLeftWidth: 1.5 }} />
            <span className="survey-tick" style={{ top: 14, right: 14, borderTopWidth: 1.5, borderRightWidth: 1.5 }} />
            <span className="survey-tick" style={{ bottom: 14, left: 14, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }} />
            <span className="survey-tick" style={{ bottom: 14, right: 14, borderBottomWidth: 1.5, borderRightWidth: 1.5 }} />

            <div className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">
              <SpotMap
                spots={orderedVisible}
                selectedId={selectedId}
                onSelect={setSelectedId}
                userLocation={userLocation}
              />
            </div>
          </div>
        </div>

        <FeedbackForm />
      </main>

      <SpotModal
        spot={selected}
        onClose={() => setSelectedId(null)}
        distanceKm={selected && distances ? distances[selected.id] : undefined}
      />
    </MotionConfig>
  );
}
