"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MotionConfig } from "motion/react";
import { spots } from "@/data/spots";
import { distanceKm } from "@/lib/geo";
import { CATEGORIES } from "@/lib/categories";
import type { UIKey } from "@/lib/i18n";
import CategoryFilter, { type CategoryFilterKey } from "@/components/controls/CategoryFilter";
import SpotModal from "@/components/spot/SpotModal";
import SpotList from "@/components/spot/SpotList";
import NearMeToggle from "@/components/controls/NearMeToggle";
import Glyph from "@/components/brand/Glyph";
import LocaleToggle from "@/components/controls/LocaleToggle";
import ThemeToggle from "@/components/controls/ThemeToggle";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CategoryKey, Spot, UserLocation } from "@/lib/types";

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

// The hero headline, painted one noun per category color so it doubles as the
// map legend. The mapping has to stay truthful — each word names the category
// it's colored with, which is the only thing that makes the color informative
// rather than decorative. A new category means a new noun here.
const HEADLINE: { key: UIKey; category: CategoryKey }[] = [
  { key: "hero.word.shrines", category: "religious" },
  { key: "hero.word.summits", category: "nature" },
  { key: "hero.word.falls", category: "nature" },
  { key: "hero.word.fairways", category: "leisure" },
];

function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Glyph size={22} />
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">
        ExploQR <span className="font-medium text-ink/70">SJDM</span>
      </span>
    </div>
  );
}

function visibleIn(category: CategoryFilterKey): Spot[] {
  return category === "all"
    ? spots
    : spots.filter((s) => s.category === category);
}

export default function Home() {
  const { t } = useLocale();
  // No spot is selected on load — the map is the landing view. Clicking a
  // pin or a list row opens that spot in a modal (bottom sheet on mobile,
  // centered dialog on desktop) over the still-visible map.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilterKey>("all");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Deep link in: /?spot=<id> opens that spot's modal on first load. This is
  // the hook for future QR codes — each code just encodes a spot URL.
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
    // reducedMotion="user" hands the whole Motion tree the same guarantee the
    // CSS already makes: someone who has asked their OS for less movement gets
    // transforms dropped, not merely shortened. It has to live above every
    // motion component, so it wraps the page rather than the grid.
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
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
      </header>

      {/* The grid band breaks out of the centered column, so `main` holds no
          width of its own — each section brings its own container. */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pb-5 pt-7 sm:pt-9">
          <p className="rise-in font-mono text-[11px] uppercase tracking-widest text-ink/70">
            {t("hero.eyebrow")}
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <h1 className="max-w-xl font-display text-[34px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-5xl">
              {/* The space sits outside the span on purpose: `nowrap` keeps a
                  phrase like "& fairways." whole, and a space trapped inside it
                  would be non-breaking too — gluing the whole headline into one
                  unwrappable line. */}
              {HEADLINE.map(({ key, category }, i) => (
                <Fragment key={key}>
                  <span
                    className="rise-in inline-block whitespace-nowrap"
                    style={{
                      color: CATEGORIES[category].accent,
                      animationDelay: `${80 + i * 70}ms`,
                    }}
                  >
                    {t(key)}
                  </span>{" "}
                </Fragment>
              ))}
            </h1>
            <p
              className="rise-in max-w-xs text-sm leading-relaxed text-ink/70 sm:pb-1.5 sm:text-right"
              style={{ animationDelay: "380ms" }}
            >
              {t("hero.title")}
            </p>
          </div>
        </section>

        <div
          className="rise-in mb-3 flex justify-end"
          style={{ animationDelay: "440ms" }}
        >
          <NearMeToggle
            active={Boolean(userLocation)}
            loading={locating}
            error={locationError}
            onClick={handleNearMe}
          />
        </div>

        <div
          className="rise-in relative z-0 h-[440px] overflow-hidden rounded-2xl border border-line sm:h-[560px]"
          style={{ animationDelay: "500ms" }}
        >
          <SpotMap
            spots={orderedVisible}
            selectedId={selectedId}
            onSelect={setSelectedId}
            userLocation={userLocation}
          />
        </div>

        </div>

      </main>

      <SpotModal
        spot={selected}
        onClose={() => setSelectedId(null)}
        distanceKm={selected && distances ? distances[selected.id] : undefined}
      />
    </MotionConfig>
  );
}
