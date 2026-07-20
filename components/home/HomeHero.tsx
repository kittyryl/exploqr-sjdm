"use client";

import { Fragment } from "react";
import Link from "next/link";
import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { HEADLINE } from "@/lib/heroWords";
import { useLocale } from "@/components/providers/LocaleProvider";

// The front page's pitch: the same category-colored headline the map page
// uses (so the color-to-category mapping is learned once, wherever a
// visitor lands first), a richer paragraph naming the live destination
// count, and the one primary action — go to the map.
export default function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="pb-8 pt-10 sm:pt-14">
      <p className="rise-in font-mono text-[11px] uppercase tracking-widest text-ink/70">
        {t("hero.eyebrow")}
      </p>
      <h1 className="mt-3 max-w-2xl font-display text-[38px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-6xl">
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
        className="rise-in mt-5 max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg"
        style={{ animationDelay: "380ms" }}
      >
        {t("front.hero.body", { count: spots.length })}
      </p>
      <Link
        href="/map"
        className="rise-in mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-mono text-sm text-paper transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        style={{ animationDelay: "440ms" }}
      >
        {t("front.cta.exploreMap")} →
      </Link>
    </section>
  );
}
