// The small mono label that heads each block of the detail panel. The trailing
// hairline turns a bare caption into a proper section rule — the field-guide
// gesture of a labelled divider, and it lets the eye find each block at a
// glance as the panel scrolls.
export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink/60">
      <span className="whitespace-nowrap">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </h3>
  );
}
