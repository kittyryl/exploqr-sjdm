"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import Hearts from "@/components/spot/Hearts";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CategoryTokens } from "@/lib/categories";
import type { Review, Spot } from "@/lib/types";

const FIELD =
  "rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/20";

interface RateOverlayProps {
  spot: Spot;
  cat: CategoryTokens;
  own?: Review;
  hearts: number;
  onPick: (n: number) => void;
  pickError: boolean;
  status: "idle" | "sending" | "success" | "error";
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

// The rating/review compose sheet, opened from SpotReviews' "Rate this spot"
// button. Split out from the always-visible aggregate + review list so
// browsing a spot's existing reviews doesn't also mean scrolling past a form
// most visitors won't use. Mirrors PhotoLightbox/PanoOverlay's stacked-
// overlay chrome: focus trap, capture-phase Escape so closing this doesn't
// also close the spot modal underneath, body-scroll locking left to
// SpotModal (this only ever opens from inside it).
export default function RateOverlay({
  spot,
  cat,
  own,
  hearts,
  onPick,
  pickError,
  status,
  onSubmit,
  onClose,
}: RateOverlayProps) {
  const { t, text } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  // Closes itself shortly after a successful submit, so the visitor sees the
  // confirmation before landing back on the now-updated review list.
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(onClose, 900);
    return () => clearTimeout(timer);
  }, [status, onClose]);

  return (
    <motion.div
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-scrim/60 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rate-overlay-title"
        tabIndex={-1}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 outline-none sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="rate-overlay-title" className="font-display text-lg font-bold text-ink">
            {t("review.dialogLabel", { name: text(spot.name) })}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("modal.close")}
            className="tactile flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="checkbox"
            name="botcheck"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute h-0 w-0 overflow-hidden opacity-0"
            style={{ position: "absolute", left: "-9999px" }}
          />

          <div>
            <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
              {t("review.rating.label")}
            </p>
            <Hearts value={hearts} size={26} color={cat.accent} interactive onPick={onPick} />
            {pickError && (
              <p className="mt-1 text-[13px]" style={{ color: "var(--cat-leisure-accent)" }}>
                {t("review.pick")}
              </p>
            )}
          </div>

          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink/70">
            {t("review.name")}
            <input
              type="text"
              name="name"
              defaultValue={own?.name ?? ""}
              disabled={status === "sending"}
              placeholder={t("review.name.placeholder")}
              className={FIELD}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink/70">
            {t("review.comment")}
            <textarea
              name="comment"
              rows={3}
              defaultValue={own?.comment ?? ""}
              disabled={status === "sending"}
              placeholder={t("review.comment.placeholder")}
              className={`resize-y ${FIELD}`}
            />
          </label>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="submit"
              disabled={status === "sending"}
              className="tactile rounded-[10px] px-5 py-2.5 text-sm font-semibold disabled:cursor-default disabled:opacity-75"
              style={{ background: cat.accent, color: cat.btnFg }}
            >
              {status === "sending"
                ? t("review.sending")
                : own
                  ? t("review.update")
                  : t("review.submit")}
            </button>

            {status === "success" && (
              <p className="text-[14px] font-medium" style={{ color: "var(--cat-nature-accent)" }}>
                ✓ {t("review.success")}
              </p>
            )}
            {status === "error" && (
              <p className="text-[14px]" style={{ color: "var(--cat-leisure-accent)" }}>
                {t("review.error")}
              </p>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
