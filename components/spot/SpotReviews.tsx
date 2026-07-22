"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AnimatePresence } from "motion/react";
import SectionTitle from "@/components/spot/SectionTitle";
import Hearts from "@/components/spot/Hearts";
import RateOverlay from "@/components/spot/RateOverlay";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useDeviceId } from "@/lib/hooks/useDeviceId";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import type { Review, Spot } from "@/lib/types";

type Status = "idle" | "sending" | "success" | "error";

export default function SpotReviews({ spot }: { spot: Spot }) {
  const { t } = useLocale();
  const deviceId = useDeviceId();
  const cat = CATEGORIES[spot.category];

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [hearts, setHearts] = useState(0);
  const [pickError, setPickError] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [rateOpen, setRateOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("reviews")
      .select("id, device_id, name, hearts, comment, created_at")
      .eq("spot_id", spot.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setReviews(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [spot.id]);

  const own = deviceId ? reviews?.find((r) => r.device_id === deviceId) : undefined;

  // Fires once, the first time this visitor's own review is found (after the
  // async fetch resolves) — not on every render, since own.id is stable
  // across re-renders of the same row.
  useEffect(() => {
    if (own) setHearts(own.hearts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [own?.id]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const count = reviews?.length ?? 0;
  const avg = count > 0 ? reviews!.reduce((sum, r) => sum + r.hearts, 0) / count : 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !deviceId || status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot — same pattern as FeedbackForm: a real visitor never fills
    // this hidden field.
    if (data.get("botcheck")) {
      setStatus("success");
      return;
    }
    if (hearts < 1) {
      setPickError(true);
      return;
    }
    setPickError(false);
    setStatus("sending");

    const { error } = await supabase.from("reviews").upsert(
      {
        spot_id: spot.id,
        device_id: deviceId,
        name: (data.get("name") as string)?.trim() || null,
        hearts,
        comment: (data.get("comment") as string)?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "spot_id,device_id" }
    );

    if (error) {
      setStatus("error");
      return;
    }
    setStatus("success");
    const { data: fresh } = await supabase
      .from("reviews")
      .select("id, device_id, name, hearts, comment, created_at")
      .eq("spot_id", spot.id)
      .order("created_at", { ascending: false });
    setReviews(fresh ?? []);
  }

  return (
    <section>
      <SectionTitle>{t("review.title")}</SectionTitle>

      {count > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <Hearts value={Math.round(avg)} size={16} color={cat.accent} />
          <span className="text-sm font-semibold text-ink">{avg.toFixed(1)}</span>
          <span className="text-sm text-ink/60">· {t("review.count", { count })}</span>
        </div>
      )}

      {reviews && reviews.length === 0 && (
        <p className="mb-5 text-sm text-ink/60">{t("review.empty")}</p>
      )}

      {reviews && reviews.length > 0 && (
        <ul className="mb-5 flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-line bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex items-center gap-2">
                  <Hearts value={r.hearts} size={13} color={cat.accent} />
                  <span className="sr-only">{r.hearts} / 5</span>
                  <span className="text-sm font-medium text-ink">
                    {r.name || t("review.anonymous")}
                  </span>
                  {deviceId && r.device_id === deviceId && (
                    <span className="rounded-full bg-ink/[.06] px-2 py-0.5 text-[11px] font-medium text-ink/60">
                      {t("review.you")}
                    </span>
                  )}
                </div>
                <time className="text-[11px] text-ink/40" dateTime={r.created_at}>
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              {r.comment && (
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink/75">{r.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {!supabaseConfigured ? (
        <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink/45">
          {t("review.config")}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setRateOpen(true)}
          className="tactile rounded-[10px] px-5 py-2.5 text-sm font-semibold"
          style={{ background: cat.accent, color: cat.btnFg }}
        >
          {own ? t("review.cta.edit") : t("review.cta")}
        </button>
      )}

      <AnimatePresence>
        {rateOpen && (
          <RateOverlay
            key={own?.id ?? "new"}
            spot={spot}
            cat={cat}
            own={own}
            hearts={hearts}
            onPick={setHearts}
            pickError={pickError}
            status={status}
            onSubmit={handleSubmit}
            onClose={() => setRateOpen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
