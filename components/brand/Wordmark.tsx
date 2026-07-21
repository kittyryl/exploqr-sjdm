import Glyph from "@/components/brand/Glyph";

// The header lockup: the QR glyph, the Fraunces wordmark, and — on wider
// screens — a mono kicker naming what the app is, so the brand reads as a
// published field guide rather than a bare app title.
export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Glyph size={24} />
      <span className="leading-none">
        <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
          ExploQR <span className="font-medium text-ink/55">SJDM</span>
        </span>
        <span className="mt-1 hidden font-mono text-[9px] uppercase tracking-[0.22em] text-ink/45 sm:block">
          Digital Field Guide
        </span>
      </span>
    </div>
  );
}
