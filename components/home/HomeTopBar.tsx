"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
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

  return (
    <section className="rise-in flex flex-col gap-5 border-b border-line pb-6 pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:pt-8">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-1.5 max-w-xl font-display text-[26px] font-extrabold leading-[0.98] tracking-[-0.03em] text-ink sm:text-4xl">
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
          className="rise-in mt-2.5 max-w-md text-sm leading-relaxed text-ink/80"
          style={{ animationDelay: "300ms" }}
        >
          {t("front.hero.body", { count: spots.length })}
        </p>
        <div
          className="rise-in mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-ink/70"
          style={{ animationDelay: "360ms" }}
        >
          <span>
            <strong className="text-ink">{destinationsCount}</strong> {t("front.stat.destinations")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{categoriesCount}</strong> {t("front.stat.categories")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{tourDegrees}°</strong> {t("front.stat.tour360.label")}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong className="text-ink">{freePercent}%</strong> {t("front.stat.free.label")}
          </span>
        </div>
      </div>

      <div className="rise-in" style={{ animationDelay: "420ms" }}>
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ rotateX, rotateY, transformPerspective: 600 }}
          className="flex shrink-0 items-center gap-3 rounded-xl border border-line bg-surface p-3"
        >
          <div className="rounded-lg border border-line bg-white p-2">
            {/* The QR itself stays literal black-on-white regardless of
                theme — unlike `ink`/`paper`, which invert, a scanner needs
                maximum, reliable contrast. Same reasoning as `--scrim` and
                the category `block` tokens in globals.css: some things are
                theme-constant on purpose. */}
            {origin && (
              <QRCode value={origin} size={84} bgColor="#ffffff" fgColor="#1c2321" />
            )}
          </div>
          <div className="max-w-[9rem]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
              {t("front.qr.eyebrow")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink/80">
              {t("front.qr.body")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
