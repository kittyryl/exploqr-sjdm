import { ImageResponse } from "next/og";
import { GlyphSquares } from "@/lib/ogGlyph";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Same glyph as icon.js, sized for iOS home-screen icons. No baked-in
// rounding — iOS applies its own corner mask on top of this square.
export default function AppleIcon() {
  const canvas = size.width;
  const g = canvas * 0.68;
  const u = g / 22;
  const offset = (canvas - g) / 2;

  return new ImageResponse(
    (
      <div style={{ width: canvas, height: canvas, background: "#fafaf7", display: "flex" }}>
        <div
          style={{
            position: "relative",
            width: g,
            height: g,
            left: offset,
            top: offset,
            display: "flex",
          }}
        >
          <GlyphSquares u={u} />
        </div>
      </div>
    ),
    { ...size }
  );
}
