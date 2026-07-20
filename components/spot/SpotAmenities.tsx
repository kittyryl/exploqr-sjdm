"use client";

import SectionTitle from "@/components/spot/SectionTitle";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot } from "@/lib/types";

// Facilities on offer, as pills. Renders nothing at all when the spot has no
// confirmed amenities — see the note on `Spot.amenities`.
export default function SpotAmenities({ spot }: { spot: Spot }) {
  const { t, text } = useLocale();
  const amenities = spot.amenities || [];
  if (amenities.length === 0) return null;

  return (
    <section>
      <SectionTitle>{t("spot.amenities")}</SectionTitle>
      <ul className="flex flex-wrap gap-2">
        {amenities.map((amenity) => {
          const label = text(amenity);
          return (
            <li
              key={label}
              className="rounded-full bg-ink/[.06] px-3 py-1.5 text-[13px] font-medium text-ink/80"
            >
              {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
