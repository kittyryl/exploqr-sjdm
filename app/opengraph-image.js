import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Static, English-only: shared link previews render before any client-side
// locale or theme choice exists, so this can't read LocaleProvider/
// ThemeProvider — same constraint InstallPrompt and the SpotMap loading
// fallback already live with. Colors are the light-theme category accents
// and paper/ink from globals.css, hardcoded because Satori renders outside
// the page's CSS and can't resolve custom properties.
export const alt =
  "ExploQR SJDM — Shrines, summits, falls & fairways. A field guide to San Jose del Monte, Bulacan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#fafaf7";
const INK = "#1c2321";
const INK_MUTED = "rgba(28, 35, 33, 0.7)";
const RELIGIOUS = { fill: "#7f77dd", accent: "#3c3489" };
const NATURE = { fill: "#1d9e75", accent: "#0f6e56" };
const LEISURE = { fill: "#d85a30", accent: "#993c1d" };

// The QR-finder-pattern glyph from components/Glyph.js, rebuilt in absolutely
// positioned divs — Satori's supported CSS subset doesn't reliably cover
// inline <svg>, but plain positioned boxes are safe.
function Glyph() {
  return (
    <div style={{ position: "relative", width: 48, height: 48, display: "flex" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: RELIGIOUS.fill,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 0,
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: NATURE.fill,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 28,
          width: 20,
          height: 20,
          borderRadius: 5,
          backgroundColor: LEISURE.fill,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 31,
          top: 31,
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: INK,
        }}
      />
    </div>
  );
}

export default async function Image() {
  const [bricolage, spaceMono] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/BricolageGrotesque-ExtraBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/SpaceMono-Bold.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Glyph />
          <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 36, fontWeight: 800 }}>
            <span style={{ color: INK }}>ExploQR</span>
            <span style={{ color: INK_MUTED, marginLeft: 12 }}>SJDM</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontFamily: "Space Mono",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: INK_MUTED,
            }}
          >
            San Jose del Monte · Bulacan · Philippines
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontFamily: "Bricolage Grotesque",
              fontWeight: 800,
              fontSize: 84,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span style={{ color: RELIGIOUS.accent, marginRight: 22 }}>Shrines,</span>
            <span style={{ color: NATURE.accent, marginRight: 22 }}>summits,</span>
            <span style={{ color: NATURE.accent, marginRight: 22 }}>falls</span>
            <span style={{ color: LEISURE.accent }}>&amp; fairways.</span>
          </div>
        </div>

        <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", backgroundColor: RELIGIOUS.fill }} />
          <div style={{ flex: 1, display: "flex", backgroundColor: NATURE.fill }} />
          <div style={{ flex: 1, display: "flex", backgroundColor: LEISURE.fill }} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage Grotesque", data: bricolage, style: "normal", weight: 800 },
        { name: "Space Mono", data: spaceMono, style: "normal", weight: 700 },
      ],
    }
  );
}
