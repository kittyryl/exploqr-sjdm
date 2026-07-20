import Glyph from "@/components/brand/Glyph";

export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Glyph size={22} />
      <span className="font-display text-lg font-extrabold tracking-tight text-ink">
        ExploQR <span className="font-medium text-ink/70">SJDM</span>
      </span>
    </div>
  );
}
