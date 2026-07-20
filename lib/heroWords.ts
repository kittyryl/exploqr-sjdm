import type { CategoryKey } from "@/lib/types";
import type { UIKey } from "@/lib/i18n";

// The four nouns painted in their category's color, so the headline doubles
// as the map legend. Shared between the front page hero and the map page's
// own header — the noun-to-category mapping has to stay the same truth in
// both places, or the color loses its meaning. Keep one noun per key and
// keep the mapping truthful; a word tinted for a category it doesn't name
// is a lie.
export const HEADLINE: { key: UIKey; category: CategoryKey }[] = [
  { key: "hero.word.shrines", category: "religious" },
  { key: "hero.word.summits", category: "nature" },
  { key: "hero.word.falls", category: "nature" },
  { key: "hero.word.fairways", category: "leisure" },
];
