// The small mono label that heads each block of the detail panel.
export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2.5 font-mono text-[11px] uppercase tracking-widest text-ink/70">
      {children}
    </h3>
  );
}
