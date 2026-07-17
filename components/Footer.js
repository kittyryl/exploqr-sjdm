"use client";

import Glyph from "@/components/Glyph";
import { useLocale } from "@/components/LocaleProvider";

// Extracted from app/layout.js when i18n landed: the tagline is translatable,
// which needs the locale context, which needs a client component. The
// attribution lines stay untranslated — they're license text naming CARTO,
// OpenStreetMap, and Wikimedia, and those are proper nouns either way.
export default function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-line bg-ink/[.02]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <Glyph size={18} />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
              ExploQR SJDM
            </p>
            <p className="mt-0.5 text-[11px] text-ink/70">
              {t("footer.tagline")}
            </p>
          </div>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-ink/70 sm:text-right">
          <p>
            Map tiles ©{" "}
            <a
              href="https://carto.com/attributions"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/20 underline-offset-2 hover:text-ink"
            >
              CARTO
            </a>
            , data ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink/20 underline-offset-2 hover:text-ink"
            >
              OpenStreetMap
            </a>{" "}
            contributors
          </p>
          <p>Spot photos © their respective Wikimedia Commons contributors</p>
        </div>
      </div>
    </footer>
  );
}
