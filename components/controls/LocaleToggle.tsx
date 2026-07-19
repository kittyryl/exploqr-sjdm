"use client";

import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import { useLocale } from "@/components/providers/LocaleProvider";
import SegmentedToggle from "@/components/controls/SegmentedToggle";

// Segmented EN/TL switch. Sits in the header next to the wordmark — small,
// since most visitors will never touch it, but always visible rather than
// buried, because the ones who need it need it immediately.
export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <SegmentedToggle
      ariaLabel={t("lang.switch")}
      activeValue={locale}
      onChange={setLocale}
      optionClassName="px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider"
      options={LOCALES.map((code) => ({
        value: code,
        title: LOCALE_LABELS[code],
        content: code,
      }))}
    />
  );
}
