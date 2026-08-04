import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CATEGORY_HEX } from "@/lib/ogGlyph";

const LOGO_DATA_URL = async () => {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  return `data:image/png;base64,${logo.toString("base64")}`;
};

// This preview image is always English and always light-themed, because it's
// built before the page (and its language/theme settings) exist. Colours are
// typed in by hand here instead of pulled from the site's usual colour
// settings, and the logo is embedded directly since it can't be fetched like
// a normal image at this stage.
export const alt =
  "ExploQR SJDM — Shrines, summits, falls & fairways. A field guide to San Jose del Monte, Bulacan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F8F9FA";
const INK = "#04191C";
const INK_MUTED = "rgba(4, 25, 28, 0.7)";
const RELIGIOUS = CATEGORY_HEX.religious;
const NATURE = CATEGORY_HEX.nature;
const LEISURE = CATEGORY_HEX.leisure;

export default async function Image() {
  const [bricolage, spaceMono, logoSrc] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/BricolageGrotesque-ExtraBold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/SpaceMono-Bold.ttf")),
    LOGO_DATA_URL(),
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
          <img src={logoSrc} width={64} height={64} alt="" />
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
