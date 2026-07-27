"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// The visitor's note reaches the City Tourism Office by way of Web3Forms:
// the form POSTs straight to their API with a public access key, and they
// relay the message to the office inbox. No server route and no secret of
// our own to host — the key is *meant* to be public (it only ever grants
// "send a message to this one inbox"), so it rides in NEXT_PUBLIC_ and is
// inlined at build. Set it in .env.local:
//
//   NEXT_PUBLIC_WEB3FORMS_KEY=your-access-key-from-web3forms.com
//
// Until it's set, the form renders but explains it isn't wired up yet rather
// than failing silently on submit.
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

type Status = "idle" | "sending" | "success" | "error";

export default function FeedbackForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const configured = Boolean(ACCESS_KEY);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setPhoto(null);
      setPhotoError(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setPhotoError(t("feedback.photo.error.type"));
      setPhoto(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError(t("feedback.photo.error.size"));
      setPhoto(null);
      e.target.value = "";
      return;
    }
    setPhotoError(null);
    setPhoto(file);
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured || status === "sending") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    // Honeypot: a real person never fills this hidden field. If it's set,
    // treat the submit as a bot and drop it while showing "success".
    if (data.get("botcheck")) {
      setStatus("success");
      form.reset();
      clearPhoto();
      return;
    }

    setStatus("sending");
    try {
      // Web3Forms only accepts file attachments over multipart/form-data
      // (not the plain JSON body used before photos existed), so the whole
      // request rides on the native FormData — no manual Content-Type
      // header, or the browser can't attach the multipart boundary.
      data.delete("botcheck");
      data.append("access_key", ACCESS_KEY ?? "");
      data.append("subject", "New ExploQR SJDM feedback");
      data.append("from_name", "ExploQR SJDM");
      if (!photo) data.delete("attachment");

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
        clearPhoto();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="fb-panel grid grid-cols-1 gap-8 rounded-3xl border border-line p-7 shadow-[0_1px_2px_rgba(58,38,16,0.06),0_8px_24px_-10px_rgba(58,38,16,0.22)] sm:grid-cols-[0.9fr_1.1fr] sm:items-center sm:gap-10 sm:p-9">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest" style={{ color: "var(--teal)" }}>
            {t("feedback.eyebrow")}
          </p>
          <h2 className="mt-2 max-w-[16ch] font-display text-2xl font-bold leading-[1.05] tracking-[-0.02em] text-ink text-balance sm:text-3xl">
            {t("feedback.title")}
          </h2>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed text-ink/70">
            {t("feedback.body")}
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {/* Honeypot — visually hidden, off the tab order, never seen. */}
          <input
            type="checkbox"
            name="botcheck"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute h-0 w-0 overflow-hidden opacity-0"
            style={{ position: "absolute", left: "-9999px" }}
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
              {t("feedback.name")}
              <input
                type="text"
                name="name"
                required
                disabled={status === "success"}
                placeholder={t("feedback.name.placeholder")}
                className="fb-field rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
              />
            </label>
            <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
              {t("feedback.email")}
              <input
                type="email"
                name="email"
                required
                disabled={status === "success"}
                placeholder={t("feedback.email.placeholder")}
                className="fb-field rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
            {t("feedback.message")}
            <textarea
              name="message"
              rows={4}
              required
              disabled={status === "success"}
              placeholder={t("feedback.message.placeholder")}
              className="fb-field resize-y rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
            />
          </label>

          <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
            {t("feedback.photo")}
            <input
              ref={fileInputRef}
              type="file"
              name="attachment"
              accept="image/*"
              disabled={status === "success"}
              onChange={handlePhotoChange}
              className="fb-field cursor-pointer rounded-xl px-3.5 py-2.5 font-sans text-[13px] normal-case tracking-normal text-ink/70 file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-1.5 file:font-sans file:text-[13px] file:font-semibold"
            />
            {photo && (
              <span className="flex items-center gap-2 text-[12px] normal-case tracking-normal text-ink/65">
                {photo.name}
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="font-medium underline underline-offset-2"
                  style={{ color: "var(--cat-leisure-accent)" }}
                >
                  {t("feedback.photo.remove")}
                </button>
              </span>
            )}
            {photoError && (
              <span className="text-[12px] normal-case tracking-normal" style={{ color: "var(--cat-leisure-accent)" }}>
                {photoError}
              </span>
            )}
          </label>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="submit"
              disabled={!configured || status === "sending" || status === "success"}
              className="fb-submit tactile rounded-xl px-6 py-3 font-sans text-[15px] font-semibold text-white"
            >
              {status === "sending"
                ? t("feedback.sending")
                : status === "success"
                  ? "Sent ✓"
                  : `${t("feedback.submit")} →`}
            </button>

            {status === "success" ? (
              <p className="text-[14px] font-medium" style={{ color: "var(--cat-nature-accent)" }}>
                ✓ {t("feedback.success")}
              </p>
            ) : status === "error" ? (
              <p className="text-[14px]" style={{ color: "var(--cat-leisure-accent)" }}>
                {t("feedback.error")}
              </p>
            ) : !configured ? (
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink/50">
                {t("feedback.config")}
              </p>
            ) : (
              <p className="font-mono text-[10.5px] uppercase tracking-wider text-ink/45">
                {t("feedback.note")}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
