// Routes a spot photo through /api/spot-photo instead of handing next/image
// the Wikimedia URL directly — see that route for why (Wikimedia rejects the
// optimizer's User-Agent-less fetch).
export function proxiedSrc(src: string): string {
  return `/api/spot-photo?src=${encodeURIComponent(src)}`;
}
