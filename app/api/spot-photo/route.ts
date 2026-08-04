import { NextRequest, NextResponse } from "next/server";

// Wikimedia blocks photo requests that don't identify themselves, so our photos
// were quietly failing to load. This fetches the photo ourselves with a proper
// ID, so the rest of the site can keep loading images the normal way.
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
