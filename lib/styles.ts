// Shared class fragments for the pill-shaped toggle buttons (category chips,
// "Near me") — kept here so the active/inactive look can't drift between them.
export const PILL_BUTTON_BASE =
  "tactile inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 font-mono text-xs tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
export const PILL_BUTTON_ACTIVE = "border-ink bg-ink text-paper";
export const PILL_BUTTON_INACTIVE =
  "border-line bg-transparent text-ink hover:border-ink/40";
