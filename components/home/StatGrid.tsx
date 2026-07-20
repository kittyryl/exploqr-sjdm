"use client";

import { spots } from "@/data/spots";
import { CATEGORIES } from "@/lib/categories";
import { useLocale } from "@/components/providers/LocaleProvider";

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-4">
      <div className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink/70">
        {label}
      </div>
    </div>
  );
}

// Four facts about the app itself, not about any one spot. The destination
// and category counts are computed rather than typed in, so the tiles never
// drift out of sync with data/spots.ts as destinations are added.
export default function StatGrid() {
  const { t } = useLocale();
  const categoryCount = Object.keys(CATEGORIES).length;

  return (
    <section
      className="rise-in grid grid-cols-2 gap-3"
      style={{ animationDelay: "500ms" }}
    >
      <StatTile value={String(spots.length)} label={t("front.stat.destinations")} />
      <StatTile value={String(categoryCount)} label={t("front.stat.categories")} />
      <StatTile value={t("front.stat.tour360.value")} label={t("front.stat.tour360.label")} />
      <StatTile value={t("front.stat.free.value")} label={t("front.stat.free.label")} />
    </section>
  );
}
