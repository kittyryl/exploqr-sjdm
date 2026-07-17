"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/components/LocaleProvider";

// One spring for the whole grid, so tiles that are arriving, leaving, and
// sliding to a new position all move with the same physics.
const SPRING = { type: "spring", stiffness: 340, damping: 32, mass: 0.9 };

// One spot as a tile. A spot with a photo is a photo; a spot without one is a
// saturated block of its category color with the category icon bleeding off
// the edge.
//
// The block is not a placeholder apologising for a missing photo — it's the
// other half of the design, and two of the six spots have no photo at all.
// Treating "no photo" as a first-class state is what lets the grid look
// finished today and makes every photo added later an upgrade rather than a
// repair. A photo that 404s lands in exactly the same state, so a dead
// Wikimedia URL degrades into a designed tile instead of a hole.
// `ref` is a plain prop here (React 19) and it has to reach motion.li: with
// mode="popLayout" AnimatePresence measures the exiting tile to pop it out of
// the grid flow, and a component that swallows the ref can't be measured — the
// tile is dropped instantly instead of animating out.
function SpotTile({ spot, index, selected, onSelect, distanceKm, ref }) {
  const { t, text } = useLocale();
  const [failed, setFailed] = useState(false);
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const src = spot.images?.[0]?.src;
  const showPhoto = Boolean(src) && !failed;

  // This grid is server-rendered, so a photo can fail while the HTML is still
  // parsing — before React attaches onError, which would then never fire and
  // leave a broken-image glyph. Re-check the settled state on mount.
  const checkOnMount = (img) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  };

  const meta = [
    barangayLabel(spot, t),
    distanceKm != null ? t("spot.distance", { distance: formatDistance(distanceKm) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.li
      ref={ref}
      // `layout` is the reason this file uses Motion at all: when Near me
      // re-sorts the grid, tiles travel to their new positions instead of
      // teleporting. The movement is the information.
      layout
      // whileInView, not an on-load animation: the grid lives below a 560px
      // map, so a load-triggered entrance finished against an empty viewport.
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.18 } }}
      whileHover={{ y: -6, scale: 1.025 }}
      whileTap={{ scale: 0.97 }}
      transition={{ ...SPRING, delay: index * 0.055 }}
      className="relative"
    >
      <button
        type="button"
        onClick={() => onSelect(spot.id)}
        aria-current={selected ? "true" : undefined}
        style={
          showPhoto ? undefined : { background: cat.block, color: cat.blockFg }
        }
        className={`group relative flex aspect-square w-full flex-col justify-end overflow-hidden rounded-xl p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:aspect-[4/3] ${
          selected ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""
        }`}
      >
        {showPhoto ? (
          <>
            <Image
              src={src}
              alt=""
              fill
              sizes="(min-width: 1024px) 320px, 45vw"
              ref={checkOnMount}
              onError={() => setFailed(true)}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              loading="lazy"
            />
            {/* Carries the white text below. Not decoration — without it the
                caption sits on whatever the photo happens to be. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
            />
          </>
        ) : (
          <Icon
            size={128}
            strokeWidth={1.5}
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 top-1/2 -translate-y-1/2 transition-transform duration-500 group-hover:-translate-x-2 group-hover:rotate-[-6deg] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:rotate-0"
            style={{ color: cat.fill, opacity: 0.55 }}
          />
        )}

        {/* Sticker inverts between the two tile types: solid category block on
            a photo, solid white on a block. Both directions measure past AA;
            white on the bright `fill` would not. */}
        <span
          className="absolute left-3 top-3 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider"
          style={
            showPhoto
              ? { background: cat.block, color: cat.blockFg }
              : { background: cat.blockFg, color: cat.block }
          }
        >
          {t(`cat.${spot.category}`)}
        </span>

        <span className={`relative ${showPhoto ? "text-white" : ""}`}>
          <span className="block font-display text-[13px] font-extrabold leading-tight sm:text-[15px]">
            {text(spot.name)}
          </span>
          <span className="mt-0.5 block text-[10px] opacity-85 sm:text-[11px]">
            {meta}
          </span>
        </span>
      </button>
    </motion.li>
  );
}

// The browsable grid of currently filtered spots — the non-map way to reach
// the same detail view. `distances` is an optional { [spotId]: km } map; when
// present, tiles show a distance and are assumed to be sorted nearest-first.
export default function SpotList({ spots, selectedId, onSelect, distances }) {
  const { t } = useLocale();
  if (spots.length === 0) return null;

  return (
    <section aria-label={t("list.label")}>
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {t("list.heading")}
      </h3>
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {/* popLayout pulls an exiting tile out of the flow immediately, so the
            survivors close the gap while it leaves instead of after. */}
        <AnimatePresence mode="popLayout">
          {spots.map((spot, i) => (
            <SpotTile
              key={spot.id}
              spot={spot}
              index={i}
              selected={spot.id === selectedId}
              onSelect={onSelect}
              distanceKm={distances ? distances[spot.id] : undefined}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
