"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import CategoryFilter, { type CategoryFilterKey } from "@/components/controls/CategoryFilter";
import NearMeToggle from "@/components/controls/NearMeToggle";
import ThemeToggle from "@/components/controls/ThemeToggle";
import SidebarSpotRow from "@/components/layout/SidebarSpotRow";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { Spot, UserLocation } from "@/lib/types";

interface SidebarProps {
  spots: Spot[];
  visible: Spot[];
  category: CategoryFilterKey;
  onCategory: (key: CategoryFilterKey) => void;
  userLocation: UserLocation | null;
  locating: boolean;
  locationError: string | null;
  onNearMe: () => void;
  distances: Record<string, number> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

// Persistent left column at lg+ (1024px), off-canvas drawer below that.
// Holds every filter/browse control in one place: category filter, Near Me,
// the live spot list, and the theme switch. Owns no filter/selection state
// of its own — app/page.tsx stays the single source of truth, this is a
// controlled presentational shell around it.
export default function Sidebar({
  spots,
  visible,
  category,
  onCategory,
  userLocation,
  locating,
  locationError,
  onNearMe,
  distances,
  selectedId,
  onSelect,
  open,
  onClose,
}: SidebarProps) {
  const { t } = useLocale();

  // Only relevant while the mobile/tablet drawer is open — at lg+ `open`
  // never becomes true (the hamburger that sets it is hidden there).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Selecting a spot does what clicking its map pin does; on mobile it also
  // dismisses the drawer so the resulting modal is visible.
  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[44] bg-ink/40 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={t("sidebar.label")}
        className={`fixed inset-y-0 left-0 z-[45] flex w-80 max-w-[85vw] flex-col gap-5 border-r border-line bg-paper px-4 py-4 transition-transform duration-300 lg:sticky lg:top-[85px] lg:z-auto lg:h-[calc(100vh-85px)] lg:w-72 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between lg:hidden">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{t("sidebar.label")}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("sidebar.close")}
            className="tactile flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/70 hover:bg-ink/8 hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">
            {t("sidebar.filter.heading")}
          </p>
          <CategoryFilter spots={spots} active={category} onChange={onCategory} />
        </div>

        <NearMeToggle active={Boolean(userLocation)} loading={locating} error={locationError} onClick={onNearMe} />

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">
            {t("sidebar.spots.heading", { count: visible.length })}
          </p>
          <div className="flex flex-col gap-1 overflow-y-auto">
            {visible.length === 0 && (
              <p className="px-1 py-4 text-center font-mono text-xs text-ink/55">{t("search.empty")}</p>
            )}
            {visible.map((spot) => (
              <SidebarSpotRow
                key={spot.id}
                spot={spot}
                distanceKm={distances?.[spot.id]}
                active={spot.id === selectedId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">{t("theme.switch")}</p>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
