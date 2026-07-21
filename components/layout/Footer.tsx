import Glyph from "@/components/brand/Glyph";

// Map/photo attribution has moved off the footer — the map's own Leaflet
// control still carries the required CARTO/OpenStreetMap credit. The brand
// tagline here is English-only (deliberately un-i18n'd), which is what lets
// this stay a server component.
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer relative border-t border-line">
      {/* The category spectrum crowns the footer, mirroring the top bar. */}
      <div
        aria-hidden="true"
        className="cat-rainbow pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-50"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Glyph size={22} />
            <span className="font-display text-base font-extrabold tracking-tight text-ink">
              ExploQR <span className="font-medium text-ink/55">SJDM</span>
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink/65">
            A digital field guide to the shrines, waterfalls, parks, resorts,
            and lookouts of San Jose del Monte, Bulacan — every one mapped,
            photographed, and free to explore.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line/70 pt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink/45 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} City Tourism Office · San Jose del Monte</span>
          <span aria-hidden="true">14.8136°N · 121.0453°E</span>
        </div>
      </div>
    </footer>
  );
}
