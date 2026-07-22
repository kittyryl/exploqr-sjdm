import { NextRequest, NextResponse } from "next/server";

// next/image's built-in optimizer fetches remote sources with no User-Agent
// header at all. Wikimedia enforces its User-Agent policy and rejects those
// requests outright, so every spot photo (map pins, hero, gallery, lightbox)
// was silently failing and falling back to its "no photo yet" state. This
// route re-fetches the original with a descriptive UA; next/image is pointed
// at it (via /_next/image?url=/api/spot-photo?...) instead of Wikimedia
// directly, so the optimizer still handles resizing/caching as before.
const ALLOWED_HOST = "upload.wikimedia.org";

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  if (!src) {
    return new NextResponse("Missing src", { status: 400 });
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = new URL(src);
  } catch {
    return new NextResponse("Invalid src", { status: 400 });
  }
  if (upstreamUrl.protocol !== "https:" || upstreamUrl.hostname !== ALLOWED_HOST) {
    return new NextResponse("Host not allowed", { status: 400 });
  }

  const upstream = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "ExploQR-SJDM/1.0 (+https://github.com/kittyryl/exploqr-sjdm)",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
