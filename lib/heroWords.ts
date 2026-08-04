import type { CategoryKey } from "@/lib/types";
import type { UIKey } from "@/lib/i18n";

// These four words are colored by category, so the headline also works as a map legend.
// Used on both the home page and map page — keep the word-to-category matches accurate
// in both, or the colors stop meaning anything.
export const HEADLINE: { key: UIKey; category: CategoryKey }[] = [
  { key: "hero.word.shrines", category: "religious" },
  { key: "hero.word.summits", category: "nature" },
  { key: "hero.word.falls", category: "nature" },
  { key: "hero.word.fairways", category: "leisure" },
];
