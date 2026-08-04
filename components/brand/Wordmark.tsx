import Image from 'next/image';

export default function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="ExploQR SJDM"
        width={60}
        height={60}
        priority
      />
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
