import { ImageResponse } from "next/og";
import { GlyphSquares } from "@/lib/ogGlyph";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same finder-pattern glyph as the header wordmark, redrawn on Satori's
// flexbox-only layout model so it can render as a favicon.
export default function Icon() {
  const canvas = size.width;
  const g = canvas * 0.72;
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
