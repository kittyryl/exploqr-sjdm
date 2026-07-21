"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { animate, motion, useMotionValue, useSpring } from "motion/react";
import QRCode from "react-qr-code";
import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { HEADLINE } from "@/lib/heroWords";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useLocale } from "@/components/providers/LocaleProvider";

// Counts a number up from 0 to `target` once, on mount — a first-impression
// flourish for the stat strip. Renders the final value immediately (no
// animation) when `enabled` is false, so the numbers never look "stuck" for
// anyone who's asked their OS for less motion.
function useCountUp(target: number, enabled: boolean): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (!enabled) {
      setDisplay(target);
      return;
    }
    setDisplay(0);
    const controls = animate(0, target, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled]);

  return display;
}

// The pitch, the at-a-glance stats, and the QR code in one compact strip
// above the map — a visitor gets the whole "what is this" in one glance
// instead of scrolling several stacked sections to reach the map itself.
export default function HomeTopBar() {
  const { t } = useLocale();
  const [origin, setOrigin] = useState("");
  const categoryCount = Object.keys(CATEGORIES).length;
  const reducedMotion = usePrefersReducedMotion();
  const destinationsCount = useCountUp(spots.length, !reducedMotion);
  const categoriesCount = useCountUp(categoryCount, !reducedMotion);
  const tourDegrees = useCountUp(360, !reducedMotion);
  const freePercent = useCountUp(100, !reducedMotion);

  // The origin is only knowable in the browser, so the code renders empty
  // until mount — the same trade-off the rest of the app makes for anything
  // that touches `window` (see SpotMap's SSR loading fallback).
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Desktop/pointer-capable only: a touch device has no hover to tilt from,
  // and it's skipped outright under reduced motion.
  const [canTilt, setCanTilt] = useState(false);
  useEffect(() => {
    setCanTilt(
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 300, damping: 20 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 300, damping: 20 });

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!canTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateYRaw.set(px * 10);
    rotateXRaw.set(py * -10);
  }
  function handlePointerLeave() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  }

  // Each stat tile carries a decor hue through the --c custom property, which
  // the .stat-card rule turns into a wash, a hairline, and a top rule.
  const stats: { value: string; label: string; color: string }[] = [
    { value: `${destinationsCount}`, label: t("front.stat.destinations"), color: "var(--teal)" },
    { value: `${categoriesCount}`, label: t("front.stat.categories"), color: "var(--violet)" },
    { value: `${tourDegrees}°`, label: t("front.stat.tour360.label"), color: "var(--gold)" },
    { value: `${freePercent}%`, label: t("front.stat.free.label"), color: "var(--coral)" },
  ];

  const features: { key: "hero.feature.gallery" | "hero.feature.tour" | "hero.feature.directions"; color: string }[] = [
    { key: "hero.feature.gallery", color: "var(--teal)" },
    { key: "hero.feature.tour", color: "var(--violet)" },
    { key: "hero.feature.directions", color: "var(--coral)" },
  ];

  return (
    <section className="rise-in flex flex-col gap-6 pb-10 pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pb-14 sm:pt-12">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink/70">
          <span
            className="inline-block h-[7px] w-[7px] flex-none rounded-full"
            style={{ background: "var(--cat-leisure-fill)", boxShadow: "0 0 0 3px color-mix(in srgb, var(--cat-leisure-fill) 26%, transparent)" }}
          />
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-2.5 max-w-2xl font-display text-[32px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-[52px]">
          <span className="hero-kicker mb-0.5 block text-[0.6em] font-medium text-ink/60">
            {t("hero.kicker")}
          </span>
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
          className="rise-in mt-3 max-w-md text-[15px] leading-relaxed text-ink/80"
          style={{ animationDelay: "300ms" }}
        >
          {t("front.hero.body", { count: spots.length })}
        </p>

        <div
          className="rise-in mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4"
          style={{ animationDelay: "360ms" }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="stat-card px-4 py-2.5"
              style={{ "--c": s.color } as CSSProperties}
            >
              <b className="block font-display text-2xl font-bold leading-none tabular-nums">
                {s.value}
              </b>
              <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-wider text-ink/65">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <ul
          className="rise-in mt-4 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[11px] uppercase tracking-wider text-ink/75"
          style={{ animationDelay: "420ms" }}
        >
          {features.map((f) => (
            <li key={f.key} className="flex items-center gap-2">
              <span className="h-2 w-2 rotate-45 rounded-[2px]" style={{ background: f.color }} />
              {t(f.key)}
            </li>
          ))}
        </ul>
      </div>

      <div className="rise-in shrink-0" style={{ animationDelay: "480ms" }}>
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            rotateX,
            rotateY,
            transformPerspective: 600,
            boxShadow: "0 2px 4px rgba(58,38,16,0.08), 0 22px 48px -18px rgba(58,38,16,0.32)",
          }}
          className="relative flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4"
        >
          <span className="absolute -top-2.5 left-5 rounded-md bg-ink px-2 py-[3px] font-mono text-[10px] tracking-[0.2em] text-paper">
            SCAN
          </span>
          <div className="rounded-xl border border-line bg-white p-2.5">
            {/* The QR itself stays literal black-on-white regardless of
                theme — unlike `ink`/`paper`, which invert, a scanner needs
                maximum, reliable contrast. Same reasoning as `--scrim` and
                the category `block` tokens in globals.css: some things are
                theme-constant on purpose. */}
            {origin && (
              <QRCode value={origin} size={92} bgColor="#ffffff" fgColor="#1c2321" />
            )}
          </div>
          <div className="max-w-[9.5rem]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/65">
              {t("front.qr.eyebrow")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink/80">
              {t("front.qr.body")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
