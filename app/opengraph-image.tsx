import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const LOGO_DATA_URL = async () => {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  return `data:image/png;base64,${logo.toString("base64")}`;
};

// This preview image is always English and always the hero band's dark
// look — it's built before the page (and its language/theme settings)
// exist, so it can't switch with light/dark mode the way the live page
// does. Colours are typed in by hand here to mirror app/globals.css
// (--hero-1/2/3, --sun) and HomeTopBar's HEADLINE_STYLE rather than pulled
// in, since inline styles here can't read CSS variables; the logo is
// embedded directly since it can't be fetched like a normal image at this
// stage.
export const alt =
  "ExploQR SJDM — Shrines, summits, falls & fairways. A field guide to San Jose del Monte, Bulacan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F8F9FA";
const CREAM = "#F2EDE1";
const CREAM_MUTED = "rgba(242, 237, 225, 0.72)";
const GOLD = "#E3A857";
const HERO_1 = "#1e4a3b";
const HERO_2 = "#16302A";
const HERO_3 = "#0f2620";
// Same five category fills as --cat-*-fill in globals.css, in taxonomy order.
const CATEGORY_FILLS = ["#5A51B8", "#51B897", "#A2B851", "#B8517F", "#B86B51"];

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
          backgroundImage: `linear-gradient(135deg, ${HERO_1} 0%, ${HERO_2} 55%, ${HERO_3} 100%)`,
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: PAPER,
              borderRadius: 20,
              padding: 10,
            }}
          >
            <img src={logoSrc} width={72} height={72} alt="" />
          </div>
          <div style={{ display: "flex", fontFamily: "Bricolage Grotesque", fontSize: 36, fontWeight: 800 }}>
            <span style={{ color: CREAM }}>ExploQR</span>
            <span style={{ color: CREAM_MUTED, marginLeft: 12 }}>SJDM</span>
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
              color: CREAM_MUTED,
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
            <span style={{ color: CREAM, marginRight: 22 }}>Shrines,</span>
            <span style={{ color: GOLD, marginRight: 22 }}>summits,</span>
            <span style={{ color: GOLD, marginRight: 22 }}>falls</span>
            <span style={{ color: CREAM }}>&amp; fairways.</span>
          </div>
        </div>

        <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden" }}>
          {CATEGORY_FILLS.map((color) => (
            <div key={color} style={{ flex: 1, display: "flex", backgroundColor: color }} />
          ))}
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
