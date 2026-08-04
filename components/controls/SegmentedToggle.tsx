"use client";

import { useId, type ReactNode } from "react";
import { motion } from "motion/react";

interface SegmentedToggleOption<T extends string> {
  value: T;
  title?: string;
  content: ReactNode;
}

interface SegmentedToggleProps<T extends string> {
  ariaLabel: string;
  options: SegmentedToggleOption<T>[];
  activeValue: T;
  onChange: (value: T) => void;
  optionClassName: string;
}

// Shared button-group style used by the theme and language switches, with a
// highlight that slides over to whichever option is picked.
// Each instance gets its own unique ID so the mobile and desktop copies
// (both exist on screen at once) don't try to slide their highlights into
// each other.
export default function SegmentedToggle<T extends string>({
  ariaLabel,
  options,
  activeValue,
  onChange,
  optionClassName,
}: SegmentedToggleProps<T>) {
  const uid = useId();

  return (
    <div
      className="inline-flex shrink-0 overflow-hidden rounded-full border border-line"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            title={option.title}
            className={`tactile relative ${optionClassName} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive ? "text-paper" : "text-ink/70 hover:text-ink"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`segmented-highlight-${uid}`}
                className="absolute inset-0 z-0 bg-ink"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1">
              {option.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}
