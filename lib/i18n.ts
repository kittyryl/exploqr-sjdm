import type { Locale, LocaleText } from "@/lib/types";

// Bilingual support for a Bulacan tourism guide: English and Tagalog.
//
// Any lookup missing from a locale's dictionary falls back to `en`, so the
// app stays fully usable even if a future key is added to `en` and not yet
// mirrored in `tl` — no half-broken intermediate state and no missing-key
// crashes. `en` is the required source of truth (every key must exist there);
// `tl` is a partial overlay, which is what lets that fallback design hold at
// the type level too.
//
// Proper nouns (spot names, barangays, "SJDM") are not translated.

export const LOCALES: Locale[] = ["en", "tl"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "exploqr-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  tl: "Tagalog",
};

const EN_UI = {
  "lang.switch": "Language",

  "theme.switch": "Theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "hero.eyebrow": "Digital Tourism Guide · San Jose del Monte, Bulacan",

  // The headline is the four nouns that were buried mid-sentence in the old
  // hero; the sentence keeps the rest. Each word is its own key because each
  // is painted in its category's color — the headline doubles as the map
  // legend, so the reader learns what the pin colors mean before scrolling
  // to the map. Keep one noun per key and keep the category mapping in
  // page.js truthful; a word tinted for a category it doesn't name is a lie.
  "hero.word.shrines": "Shrines,",
  "hero.word.summits": "summits,",
  "hero.word.falls": "falls",
  "hero.word.fairways": "& fairways.",

  "hero.title":
    "A field guide to the city at the foot of the Sierra Madre, one short trip from Metro Manila.",

  "map.loading": "Loading map…",

  "filter.label": "Filter spots by category",
  "filter.all": "All spots",

  "cat.religious": "Religious",
  "cat.nature": "Nature",
  "cat.leisure": "Leisure",

  "nearme.idle": "Near me",
  "nearme.loading": "Locating…",
  "nearme.unsupported": "Geolocation isn't supported on this device.",
  "nearme.denied": "Location access was denied.",
  "nearme.failed": "Couldn't get your location.",
  "nearme.here": "You are here",

  "list.heading": "All spots",
  "list.label": "More spots",

  "spot.barangay": "Brgy. {name}",
  "spot.distance": "{distance} away",
  "spot.directions": "Get directions",
  "spot.fee": "Entrance",
  "spot.contact": "Call {number}",
  "spot.website": "Visit website",
  // `spot.contact`/`spot.website` above read as actions because they label
  // links; the fact grid needs the same fields named as nouns.
  "spot.hours": "Hours",
  "spot.contactLabel": "Contact",
  "spot.websiteLabel": "Website",
  "spot.amenities": "Amenities",
  "spot.photos": "Photos",
  "spot.view360": "360° View",

  "status.open": "Open now",
  "status.closed": "Closed now",

  "media.none": "Photos coming soon",
  "media.failed": "Photo unavailable",
  "media.zoom": "Zoom",
  "media.loading360": "Loading 360°…",
  "media.credit": "Photo:",
  "media.zoomLabel": "Zoom in on {name} photo {index} of {total}",
  "media.thumbLabel": "Show photo {index}",
  "media.panoThumbLabel": "Show 360° panorama",
  "media.alt": "{name} — photo {index} of {total}",
  "media.panoLabel": "360° panorama of {name}",
  "media.heroLabel": "View media for {name}",
  "media.exit360": "Exit 360° view",

  "modal.back": "Back to map",
  "modal.close": "Close",

  "lightbox.close": "Close zoomed photo",
  "lightbox.prev": "Previous photo",
  "lightbox.next": "Next photo",

  "install.title": "Install ExploQR SJDM",
  "install.ios": 'Tap Share, then "Add to Home Screen" for offline access at low-signal spots.',
  "install.android": "Add to your home screen for quicker, offline-friendly access.",
  "install.button": "Install",
  "install.dismiss": "Dismiss",
} as const;

export type UIKey = keyof typeof EN_UI;

const TL_UI: Partial<Record<UIKey, string>> = {
  "lang.switch": "Wika",

  "theme.switch": "Tema",
  "theme.light": "Maliwanag",
  "theme.dark": "Madilim",
  "theme.system": "Sistema",

  "hero.eyebrow": "San Jose del Monte · Bulacan · Pilipinas",

  "hero.word.shrines": "Dambana,",
  "hero.word.summits": "mga taluktok,",
  "hero.word.falls": "talon,",
  "hero.word.fairways": "at golf.",

  "hero.title":
    "Isang gabay sa lungsod sa paanan ng Sierra Madre, isang maikling biyahe lang mula sa Metro Manila.",

  "map.loading": "Kinakarga ang mapa…",

  "filter.label": "Salain ang mga lugar ayon sa kategorya",
  "filter.all": "Lahat ng lugar",

  "cat.religious": "Relihiyoso",
  "cat.nature": "Kalikasan",
  "cat.leisure": "Libangan",

  "nearme.idle": "Malapit sa akin",
  "nearme.loading": "Hinahanap…",
  "nearme.unsupported": "Hindi suportado ang geolocation sa device na ito.",
  "nearme.denied": "Tinanggihan ang access sa lokasyon.",
  "nearme.failed": "Hindi makuha ang iyong lokasyon.",
  "nearme.here": "Narito ka",

  "list.heading": "Lahat ng lugar",
  "list.label": "Higit pang lugar",

  "spot.barangay": "Brgy. {name}",
  "spot.distance": "{distance} ang layo",
  "spot.directions": "Kumuha ng direksyon",
  "spot.fee": "Pasukan",
  "spot.contact": "Tumawag sa {number}",
  "spot.website": "Bisitahin ang website",
  "spot.hours": "Oras",
  "spot.contactLabel": "Kontak",
  "spot.websiteLabel": "Website",
  "spot.amenities": "Mga Amenity",
  "spot.photos": "Mga Litrato",
  "spot.view360": "360° na Tanawin",

  "status.open": "Bukas ngayon",
  "status.closed": "Sarado ngayon",

  "media.none": "Malapit nang magkaroon ng litrato",
  "media.failed": "Hindi available ang litrato",
  "media.zoom": "I-zoom",
  "media.loading360": "Kinakarga ang 360°…",
  "media.credit": "Litrato:",
  "media.zoomLabel": "I-zoom ang litrato ng {name}, larawan {index} ng {total}",
  "media.thumbLabel": "Ipakita ang larawan {index}",
  "media.panoThumbLabel": "Ipakita ang 360° na panorama",
  "media.alt": "{name} — larawan {index} ng {total}",
  "media.panoLabel": "360° na panorama ng {name}",
  "media.heroLabel": "Tingnan ang media ng {name}",
  "media.exit360": "Lumabas sa 360° na tanawin",

  "modal.back": "Bumalik sa mapa",
  "modal.close": "Isara",

  "lightbox.close": "Isara ang naka-zoom na larawan",
  "lightbox.prev": "Nakaraang larawan",
  "lightbox.next": "Susunod na larawan",

  "install.title": "I-install ang ExploQR SJDM",
  "install.ios": 'I-tap ang Share, pagkatapos ay "Add to Home Screen" para sa offline access sa mga lugar na mahina ang signal.',
  "install.android": "Idagdag sa home screen para sa mas mabilis, offline-friendly na access.",
  "install.button": "I-install",
  "install.dismiss": "Isara",
};

const UI: Record<Locale, Partial<Record<UIKey, string>>> = { en: EN_UI, tl: TL_UI };

// Look up a UI string. `vars` fills {placeholders}.
export function t(
  locale: Locale,
  key: UIKey,
  vars?: Record<string, string | number>
): string {
  const s = UI[locale]?.[key] ?? UI[DEFAULT_LOCALE][key] ?? key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

// Resolve a content value from data/spots.js. Accepts either a plain string
// (English-only, the shape every spot uses today) or { en, tl } — so spots can
// be translated one at a time without a migration.
export function text(value: LocaleText | null | undefined, locale: Locale): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return value[locale] || value[DEFAULT_LOCALE] || "";
}
