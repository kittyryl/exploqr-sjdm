"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "exploqr-install-dismissed";

// Lets visitors install the app to their home screen — the point of doing
// so here is offline-friendly access at spots with weak signal (Balagbag,
// Kaytitinga Falls). Chrome/Android gets a real install button via
// beforeinstallprompt; iOS Safari has no such API, so it gets instructions
// instead. Hidden once dismissed (localStorage) or already installed.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standalone || localStorage.getItem(DISMISS_KEY)) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
    if (iOS) setVisible(true);

    function onBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:shadow-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-3 sm:mx-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink">
          <Download size={16} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Install ExploQR SJDM</p>
          <p className="text-xs text-ink/70">
            {isIOS
              ? 'Tap Share, then "Add to Home Screen" for offline access at low-signal spots.'
              : "Add to your home screen for quicker, offline-friendly access."}
          </p>
        </div>
        {!isIOS && (
          <button
            type="button"
            onClick={install}
            className="shrink-0 rounded-full bg-ink px-3.5 py-1.5 font-mono text-xs text-paper transition-opacity hover:opacity-90"
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-ink/5 hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
