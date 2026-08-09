// Single-language UI strings for a Bulacan tourism guide, in English.
//
// This app used to ship separate English and Tagalog dictionaries behind a
// locale switch; that's gone now in favor of one language. Proper nouns (spot
// names, barangays, "SJDM") are never translated.

const UI = {
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

  "search.label": "Search destinations",
  "search.placeholder": "Search by name, barangay, or amenity…",
  "search.clear": "Clear search",
  "search.empty": "No destinations match your search.",

  "cat.religious": "Religious",
  "cat.nature": "Nature",
  "cat.parks": "Parks",
  "cat.resorts": "Resorts",
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
  "spot.addressLabel": "Address",
  "spot.facebookLabel": "Facebook Page",
  "spot.amenities": "Amenities",
  "spot.photos": "Photos",
  "spot.view360": "360° View",
  "spot.no360": "360° tour coming soon",

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

  "front.hero.body":
    "From pilgrim shrines to hidden waterfalls — {count} destinations across San Jose del Monte, every one mapped, photographed, and walkable in 360°. No app, no download: scan the code and the whole guide opens in your phone.",

  "front.stat.destinations": "Tourist Destinations",
  "front.stat.categories": "Destination Categories",
  "front.stat.tour360.label": "Virtual Tour Preview",
  "front.stat.free.label": "Free & Mobile-Friendly",

  "front.qr.eyebrow": "Scan to Explore",
  "front.qr.body": "One scan. No app to install — just point your camera and go.",

  "hero.kicker": "Find your",
  "hero.feature.gallery": "Photo galleries",
  "hero.feature.tour": "Immersive 360° tours",
  "hero.feature.directions": "One-tap directions",

  "map.cap.eyebrow": "Interactive Map",
  "map.cap.meta": "{count} pins · {categories} categories",

  "feedback.eyebrow": "We're listening",
  "feedback.title": "Been somewhere we missed?",
  "feedback.body":
    "Tell us what to add, fix, or feature next — a hidden falls, a new café, a better photo. Every note lands straight in our inbox.",
  "feedback.name": "Your name",
  "feedback.name.placeholder": "Juan dela Cruz",
  "feedback.email": "Email",
  "feedback.email.placeholder": "you@email.com",
  "feedback.message": "Message",
  "feedback.message.placeholder": "Share a spot, a photo, or feedback…",
  "feedback.submit": "Send feedback",
  "feedback.sending": "Sending…",
  "feedback.note": "Sent securely to our inbox",
  "feedback.success": "Thanks! Your feedback is on its way.",
  "feedback.error": "Something went wrong — please try again, or email us directly.",
  "feedback.config": "Feedback isn't configured yet. Add your Web3Forms key to enable it.",
  "feedback.optional": "optional",
  "feedback.replyNote": "Leave your email if you'd like a reply.",
  "feedback.photos": "Photos",
  "feedback.photos.hint": "Up to 3 images, 5MB each",
  "feedback.photos.remove": "Remove photo",
  "feedback.photos.errorType": "Only image files can be attached.",
  "feedback.photos.errorSize": "Photos must be under 5MB.",
  "feedback.photos.errorCount": "Up to 3 photos.",
  "feedback.photos.uploading": "Uploading photos…",
  "feedback.photos.errorUpload": "Couldn't upload your photos — please try again.",

  "review.title": "Ratings & Reviews",
  "review.anonymous": "Visitor",
  "review.empty": "Be the first to share what you thought.",
  "review.count": "{count} reviews",
  "review.you": "You",
  "review.rating.label": "Your rating",
  "review.heart.aria": "Rate {n} of 5 hearts",
  "review.cta": "Rate this spot",
  "review.cta.edit": "Edit your review",
  "review.dialogLabel": "Rate {name}",
  "review.name": "Your name (optional)",
  "review.name.placeholder": "Juan dela Cruz",
  "review.comment": "Comment (optional)",
  "review.comment.placeholder": "What stood out?",
  "review.submit": "Post review",
  "review.update": "Update your review",
  "review.sending": "Posting…",
  "review.success": "Thanks for rating this spot!",
  "review.error": "Something went wrong — please try again.",
  "review.config": "Reviews aren't configured yet.",
  "review.pick": "Pick a rating before posting.",
} as const;

export type UIKey = keyof typeof UI;

// Look up a UI string. `vars` fills {placeholders}.
export function t(key: UIKey, vars?: Record<string, string | number>): string {
  const s = UI[key] ?? key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

// Every spot field is a plain string now (no more { en, tl } shape) — this
// stays as a thin pass-through so call sites like `text(spot.description)`
// across the spot components didn't all need to change with the dictionary.
export function text(value: string | null | undefined): string {
  return value ?? "";
}
