"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";

// Five hearts, either a read-only display (a review's own rating, or the
// spot's average) or an interactive picker (radiogroup semantics — one
// rating at a time). `color` is a category token so the filled state matches
// whatever accent the rest of the modal is using for this spot. Shared by
// SpotReviews (read-only, inline) and RateOverlay (interactive picker).
export default function Hearts({
  value,
  size = 16,
  color,
  interactive = false,
  onPick,
}: {
  value: number;
  size?: number;
  color: string;
  interactive?: boolean;
  onPick?: (n: number) => void;
}) {
  const { t } = useLocale();
  const [hover, setHover] = useState(0);
  const shown = interactive ? hover || value : value;

  return (
    <div
      className="flex gap-0.5"
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? t("review.rating.label") : undefined}
      onMouseLeave={interactive ? () => setHover(0) : undefined}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = shown >= n;
        const icon = (
          <Heart
            size={size}
            strokeWidth={2}
            fill={filled ? "currentColor" : "none"}
            style={filled ? { color } : undefined}
            className={filled ? "" : "text-ink/25"}
          />
        );
        if (!interactive) {
          return (
            <span key={n} aria-hidden="true">
              {icon}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t("review.heart.aria", { n })}
            onClick={() => onPick?.(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5 transition-transform hover:scale-110 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
