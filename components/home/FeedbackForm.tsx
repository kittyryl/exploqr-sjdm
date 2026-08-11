"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";
import { supabase, supabaseConfigured } from "@/lib/supabase";

// The feedback form sends messages straight to Web3Forms using a public key
// — no server needed, and the key is safe to show publicly since it can
// only send messages to one inbox. Set it in .env.local as
// NEXT_PUBLIC_WEB3FORMS_KEY=your-access-key-from-web3forms.com, otherwise
// the form will say it isn't set up yet instead of failing quietly.
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
type Photo = { file: File; url: string };

type Status = "idle" | "uploading" | "sending" | "success" | "error";

export default function FeedbackForm() {
  const { t } = useLocale();
  const [status, setStatus] = useState<Status>("idle");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const configured = Boolean(ACCESS_KEY);

  // Object URLs are only good for the life of this tab — revoke whatever's
  // left when the form unmounts so they don't leak. The unmount cleanup has
  // to read the list through a ref: a plain closure over `photos` would
  // capture the empty array from the first render and free nothing.
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  function clearPhotos() {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setPhotoError(null);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    // Reset so picking the same file again (e.g. after removing it) still
    // fires a change event.
    e.target.value = "";
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setPhotoError(t("feedback.photos.errorType"));
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setPhotoError(t("feedback.photos.errorSize"));
        return;
      }
    }
    if (photos.length + files.length > MAX_PHOTOS) {
      setPhotoError(t("feedback.photos.errorCount"));
      return;
    }

    setPhotoError(null);
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    ]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!configured || status === "sending" || status === "uploading") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    // Hidden field real visitors never fill in — if it's filled, it's a
    // bot, so pretend it worked and ignore the message.
    if (data.get("botcheck")) {
      setStatus("success");
      form.reset();
      clearPhotos();
      return;
    }

    // Photos upload at submit time, not at pick time — a visitor who picks
    // photos and abandons the form leaves nothing orphaned in the bucket.
    let photoUrls: string[] = [];
    if (photos.length > 0 && supabase) {
      // Narrowed to a local const — TS can't carry the `supabase` truthiness
      // check into the closure below, since it's a module-level binding.
      const client = supabase;
      setStatus("uploading");
      const uploads = await Promise.all(
        photos.map(async ({ file }) => {
          const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `${crypto.randomUUID()}.${ext}`;
          const { error } = await client.storage
            .from("feedback-photos")
            .upload(path, file, { contentType: file.type, upsert: false });
          if (error) return null;
          const {
            data: { publicUrl },
          } = client.storage.from("feedback-photos").getPublicUrl(path);
          return publicUrl;
        })
      );
      if (uploads.some((url) => !url)) {
        // Something failed — don't send a half-broken email. The visitor
        // keeps their picked photos and can retry the submit.
        setPhotoError(t("feedback.photos.errorUpload"));
        setStatus("idle");
        return;
      }
      photoUrls = uploads as string[];
    }

    setStatus("sending");
    const name = (data.get("name") as string)?.trim() || null;
    const email = (data.get("email") as string)?.trim() || null;
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: "New ExploQR SJDM feedback",
          from_name: "ExploQR SJDM",
          message: data.get("message"),
          ...(name ? { name } : {}),
          ...(email ? { email } : {}),
          ...(photoUrls.length ? { photos: photoUrls.join("\n") } : {}),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        form.reset();
        clearPhotos();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="feedback" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-6">
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
          {/* Hidden trap field to catch spam bots — invisible to real visitors. */}
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
              {t("feedback.name")} <span className="text-ink/40 normal-case">({t("feedback.optional")})</span>
              <input
                type="text"
                name="name"
                disabled={status === "success"}
                placeholder={t("feedback.name.placeholder")}
                className="fb-field rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
              />
            </label>
            <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
              {t("feedback.email")} <span className="text-ink/40 normal-case">({t("feedback.optional")})</span>
              <input
                type="email"
                name="email"
                disabled={status === "success"}
                placeholder={t("feedback.email.placeholder")}
                className="fb-field rounded-xl px-3.5 py-3 font-sans text-[15px] normal-case tracking-normal text-ink placeholder:text-ink/40"
              />
            </label>
          </div>
          <p className="-mt-1.5 font-mono text-[10.5px] normal-case tracking-normal text-ink/45">
            {t("feedback.replyNote")}
          </p>

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

          {/* Photos need a Supabase project to upload to, so the whole
              control disappears rather than offering something that can't
              work — same degrade pattern as SpotReviews. */}
          {supabaseConfigured && (
            <div className="flex flex-col gap-1.5">
              <label className="flex flex-col gap-1.5 font-mono text-[10.5px] uppercase tracking-widest text-ink/65">
                {t("feedback.photos")}{" "}
                <span className="text-ink/40 normal-case">({t("feedback.photos.hint")})</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={status === "success" || photos.length >= MAX_PHOTOS}
                  onChange={handlePhotoChange}
                  className="fb-field fb-field-file rounded-xl px-3.5 py-3 font-sans text-[13px] normal-case tracking-normal text-ink"
                />
              </label>
              {photoError && (
                <p className="text-[13px]" style={{ color: "var(--cat-leisure-accent)" }}>
                  {photoError}
                </p>
              )}
              {photos.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {photos.map((photo, i) => (
                    <li key={photo.url} className="relative h-14 w-14 overflow-hidden rounded-lg border border-line">
                      <Image src={photo.url} alt="" fill unoptimized sizes="56px" className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        aria-label={t("feedback.photos.remove")}
                        className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] leading-none text-white"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="submit"
              disabled={
                !configured || status === "sending" || status === "uploading" || status === "success"
              }
              className="fb-submit tactile rounded-xl px-6 py-3 font-sans text-[15px] font-semibold text-white"
            >
              {status === "uploading"
                ? t("feedback.photos.uploading")
                : status === "sending"
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
