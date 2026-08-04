"use client";

import type { ReactNode } from "react";
import { CATEGORIES, hostOf } from "@/lib/categories";
import { isOpenNow } from "@/lib/hours";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

function Fact({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border border-line bg-surface px-3.5 py-3 ${
        wide ? "sm:col-span-2" : ""
      }`}
    >
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink/70">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-ink">{children}</div>
    </div>
  );
}

// Practical details, one per box. Unconfirmed details are left out entirely
// instead of showing "N/A", since that would wrongly suggest we checked.
// Hours is always shown, so this grid is never empty.
export default function SpotFactGrid({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const openStatus = isOpenNow(spot.openHours);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {/* Full width, since a street address wrapping in a half-size box
          would look messy. */}
      {spot.address && (
        <Fact label={t("spot.addressLabel")} wide>
          <span className="font-normal">{spot.address}</span>
        </Fact>
      )}

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

      {/* Shown as plain text, not a link: we can't verify the Facebook page
          URL, and a wrong guess could send people to a fake page. */}
      {spot.facebook && <Fact label={t("spot.facebookLabel")}>{spot.facebook}</Fact>}

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
