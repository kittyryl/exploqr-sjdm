"use client";

import type { ReactNode } from "react";
import { CATEGORIES, hostOf } from "@/lib/categories";
import { isOpenNow } from "@/lib/hours";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-3.5 py-3">
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink/70">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{children}</div>
    </div>
  );
}

// The practical details, one labelled cell each. Cells for details nobody has
// confirmed yet are dropped rather than filled with a placeholder, and the
// grid reflows around the gap — an "N/A" claims we checked and there is none.
// `hours` is required on Spot, so the grid is never empty.
export default function SpotFactGrid({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const openStatus = isOpenNow(spot.openHours);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {spot.fee && <Fact label={t("spot.fee")}>{text(spot.fee)}</Fact>}

      <Fact label={t("spot.hours")}>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {text(spot.hours)}
          {openStatus != null && (
            <span
              className={`flex items-center gap-1 font-normal ${openStatus ? "" : "text-ink/60"}`}
              style={openStatus ? { color: CATEGORIES.nature.accent } : undefined}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: openStatus
                    ? CATEGORIES.nature.accent
                    : "currentColor",
                }}
              />
              {openStatus ? t("status.open") : t("status.closed")}
            </span>
          )}
        </span>
      </Fact>

      {spot.website && (
        <Fact label={t("spot.websiteLabel")}>
          <a
            href={spot.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("spot.website")}
            className="underline decoration-ink/20 underline-offset-2 transition-colors hover:text-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {hostOf(spot.website)}
          </a>
        </Fact>
      )}

      {spot.contact && (
        <Fact label={t("spot.contactLabel")}>
          <a
            href={`tel:${spot.contact.replace(/\s+/g, "")}`}
            aria-label={t("spot.contact", { number: spot.contact })}
            className="underline decoration-ink/20 underline-offset-2 transition-colors hover:text-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {spot.contact}
          </a>
        </Fact>
      )}
    </div>
  );
}
