// QR finder-pattern glyph in the three category colors — the "QR" in
// ExploQR. Shared between the header wordmark and the footer. Uses the same
// CSS vars as lib/categories.js's `fill` tokens rather than its own hex
// copies, since this renders in the browser (unlike the Satori-rendered
// icon.js/apple-icon.js/opengraph-image.js, which can't resolve CSS vars).
export default function Glyph({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      <rect x="0" y="0" width="9" height="9" rx="2" style={{ fill: "var(--cat-religious-fill)" }} />
      <rect x="13" y="0" width="9" height="9" rx="2" style={{ fill: "var(--cat-nature-fill)" }} />
      <rect x="0" y="13" width="9" height="9" rx="2" style={{ fill: "var(--cat-leisure-fill)" }} />
      {/* The fourth square is ink, not a category color — it has to invert
          with the theme or it disappears into a dark page. */}
      <rect
        x="14.5"
        y="14.5"
        width="6"
        height="6"
        rx="3"
        style={{ fill: "var(--ink)" }}
      />
    </svg>
  );
}
