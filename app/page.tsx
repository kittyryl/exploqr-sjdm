"use client";

import { MotionConfig } from "motion/react";
import Wordmark from "@/components/brand/Wordmark";
import ThemeToggle from "@/components/controls/ThemeToggle";
import LocaleToggle from "@/components/controls/LocaleToggle";
import HomeHero from "@/components/home/HomeHero";
import StatGrid from "@/components/home/StatGrid";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.3 }}>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LocaleToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <HomeHero />
          <StatGrid />
        </div>
      </main>
    </MotionConfig>
  );
}
