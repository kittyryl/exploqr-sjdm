"use client";

import type { ReactNode } from "react";

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

// Shared "segmented control" shell for LocaleToggle and ThemeToggle: a
// rounded-full border grouping buttons that toggle bg-ink/text-paper when
// active. Callers own each option's content (text or icon) and padding.
export default function SegmentedToggle<T extends string>({
  ariaLabel,
  options,
  activeValue,
  onChange,
  optionClassName,
}: SegmentedToggleProps<T>) {
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
            className={`${optionClassName} transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
              isActive ? "bg-ink text-paper" : "bg-transparent text-ink/70 hover:text-ink"
            }`}
          >
            {option.content}
          </button>
        );
      })}
    </div>
  );
}
