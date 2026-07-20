"use client";

import Image from "next/image";
import Link from "next/link";
import { spots } from "@/data/spots";
import { CATEGORIES, spotIcon, barangayLabel } from "@/lib/categories";
import { useImageFallback } from "@/lib/hooks/useImageFallback";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

// One spot per category, in data order — inherently varied without a
// "featured" data flag to maintain. Stops once every category in
// CATEGORIES has an entry, so this stays correct as spots.ts grows.
function pickFeatured(all: Spot[]): Spot[] {
  const seen = new Set<string>();
  const picked: Spot[] = [];
  for (const spot of all) {
    if (seen.has(spot.category)) continue;
    seen.add(spot.category);
    picked.push(spot);
    if (seen.size === Object.keys(CATEGORIES).length) break;
  }
  return picked;
}

// Same photo/category-block visual language as the map page's spot tiles
// (components/spot/SpotList.tsx), but a plain Link instead of a
// Motion-animated button — this grid never reorders or filters, so it
// doesn't need that machinery.
function FeaturedCard({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const { failed, onError, checkOnMount } = useImageFallback();
  const cat = CATEGORIES[spot.category];
  const Icon = spotIcon(spot);
  const src = spot.images?.[0]?.src;
  const showPhoto = Boolean(src) && !failed;

  return (
    <Link
      href={`/map?spot=${spot.id}`}
      style={showPhoto ? undefined : { background: cat.block, color: cat.blockFg }}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-xl p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {showPhoto && src ? (
        <>
          <Image
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 240px, 45vw"
            ref={checkOnMount}
            onError={onError}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
          />
        </>
      ) : (
        <Icon
          size={96}
          strokeWidth={1.5}
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2"
          style={{ color: cat.fill, opacity: 0.55 }}
        />
      )}

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
          {barangayLabel(spot, t)}
        </span>
      </span>
    </Link>
  );
}

export default function FeaturedDestinations() {
  const { t } = useLocale();
  const featured = pickFeatured(spots);

  return (
    <section className="rise-in mb-10 mt-10" style={{ animationDelay: "620ms" }}>
      <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {t("front.featured.heading")}
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {featured.map((spot) => (
          <li key={spot.id}>
            <FeaturedCard spot={spot} />
          </li>
        ))}
      </ul>
    </section>
  );
}
