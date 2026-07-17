import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Same finder-pattern glyph as the header wordmark, redrawn on Satori's
// flexbox-only layout model so it can render as a favicon.
function square(x, y, w, h, r, color, u) {
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
          <div style={square(0, 0, 9, 9, 2, "#7F77DD", u)} />
          <div style={square(13, 0, 9, 9, 2, "#1D9E75", u)} />
          <div style={square(0, 13, 9, 9, 2, "#D85A30", u)} />
          <div style={square(14.5, 14.5, 6, 6, 3, "#1c2321", u)} />
        </div>
      </div>
    ),
    { ...size }
  );
}
