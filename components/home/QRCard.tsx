"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useLocale } from "@/components/providers/LocaleProvider";

// The origin is only knowable in the browser, so the code renders empty
// until mount — the same trade-off the rest of the app makes for anything
// that touches `window` (see SpotMap's SSR loading fallback). A few hundred
// ms blank is invisible next to the page's own load.
//
// The QR itself stays literal black-on-white regardless of theme — unlike
// `ink`/`paper`, which invert, a QR scanner needs maximum, reliable
// contrast, not a themed one. Same reasoning as `--scrim` and the category
// `block` tokens in globals.css: some things are theme-constant on purpose.
export default function QRCard() {
  const { t } = useLocale();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <section
      className="rise-in mt-3 flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-8 text-center sm:flex-row sm:text-left"
      style={{ animationDelay: "560ms" }}
    >
      <div className="rounded-xl border border-line bg-white p-3">
        {origin && (
          <QRCode value={origin} size={128} bgColor="#ffffff" fgColor="#1c2321" />
        )}
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/70">
          {t("front.qr.eyebrow")}
        </p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink/80">
          {t("front.qr.body")}
        </p>
      </div>
    </section>
  );
}
