import type { CSSProperties } from "react";

// Shared by app/icon.js and app/apple-icon.js: both draw the same
// finder-pattern glyph on Satori's flexbox-only layout model, differing only
// in canvas size and grid ratio. `CATEGORY_HEX` is also the color source for
// app/opengraph-image.js — all three run outside the page's CSS (Satori, or
// pre-hydration) and so can't resolve the `--cat-*` custom properties that
// components/Glyph.js and lib/categories.js use everywhere else; this is the
// one place those values are hardcoded, so they only need to stay in sync
// with app/globals.css in one spot instead of three.
export const CATEGORY_HEX = {
  religious: { fill: "#7f77dd", accent: "#3c3489" },
  nature: { fill: "#1d9e75", accent: "#0f6e56" },
  leisure: { fill: "#d85a30", accent: "#993c1d" },
};

const INK = "#1c2321";

function square(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  u: number
): CSSProperties {
  return {
    position: "absolute",
    left: x * u,
    top: y * u,
    width: w * u,
    height: h * u,
    borderRadius: r * u,
    background: color,
  };
}

export function GlyphSquares({ u }: { u: number }) {
  return (
    <>
      <div style={square(0, 0, 9, 9, 2, CATEGORY_HEX.religious.fill, u)} />
      <div style={square(13, 0, 9, 9, 2, CATEGORY_HEX.nature.fill, u)} />
      <div style={square(0, 13, 9, 9, 2, CATEGORY_HEX.leisure.fill, u)} />
      <div style={square(14.5, 14.5, 6, 6, 3, INK, u)} />
    </>
  );
}
