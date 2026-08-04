"use client";

import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import { useLocale } from "@/components/providers/LocaleProvider";

interface PannellumViewer {
  destroy: () => void;
}
interface PannellumGlobal {
  viewer: (
    container: HTMLElement,
    config: {
      type: string;
      panorama: string;
      autoLoad: boolean;
      autoRotate: number;
      showZoomCtrl: boolean;
      compass: boolean;
    }
  ) => PannellumViewer;
}

// 360° photo viewer. Only loads in the browser, not on the server, since it
// needs direct access to the browser window to work.
export default function Pano360Viewer({ src, title }: { src: string; title: string }) {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: PannellumViewer | undefined;
    let cancelled = false;
    import("pannellum/build/pannellum.js").then(() => {
      if (cancelled || !containerRef.current) return;
      const pannellum = (window as unknown as { pannellum: PannellumGlobal }).pannellum;
      viewer = pannellum.viewer(containerRef.current, {
        type: "equirectangular",
        panorama: src,
        autoLoad: true,
        autoRotate: -2,
        showZoomCtrl: false,
        compass: false,
      });
    });
    return () => {
      cancelled = true;
      if (viewer) viewer.destroy();
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      role="img"
      aria-label={t("media.panoLabel", { name: title })}
    />
  );
}
