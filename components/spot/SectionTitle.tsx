// Small heading shown above each block of info. The line after the text
// makes it read as a divider, so it's easy to spot while scrolling.
export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink/60">
      <span className="whitespace-nowrap">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line" />
    </h3>
  );
}
