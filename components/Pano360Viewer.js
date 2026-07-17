"use client";

import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";

// Interactive 360° panorama viewer (Pannellum). Rendered only on the client
// (imported with next/dynamic, ssr: false) because Pannellum needs `window`.
export default function Pano360Viewer({ src, title }) {
  const containerRef = useRef(null);

  useEffect(() => {
    let viewer;
    let cancelled = false;
    import("pannellum/build/pannellum.js").then(() => {
      if (cancelled || !containerRef.current) return;
      viewer = window.pannellum.viewer(containerRef.current, {
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
      aria-label={`360° panorama of ${title}`}
    />
  );
}
