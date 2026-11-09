"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Check, Palette } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { THEMES, isThemeId, themeById, tokensFor, type ThemeId } from "@/lib/theme";

/**
 * Theme switcher bar for designers/developers (top of every hotel page).
 * Not part of a hotel's live site: turn it off with NEXT_PUBLIC_THEME_SWITCHER=off.
 * In production the hotel's theme comes from HMS → Website Management → Theme & Appearance.
 * Choice is kept in this browser (localStorage); ?theme=<id> in the URL also works.
 */
const KEY = "bingi-theme";
const HKEY = "bingi-heading";
const listeners = new Set<() => void>();
const sub = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const read = (k: string) => {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {}
  listeners.forEach((l) => l());
};

export function ThemePreview({ defaultTheme, defaultHeading }: { defaultTheme: ThemeId; defaultHeading: "sans" | "serif" }) {
  const params = useSearchParams();
  const q = params.get("theme");
  const stored = useSyncExternalStore(sub, () => read(KEY), () => "");
  const storedH = useSyncExternalStore(sub, () => read(HKEY), () => "");
  const active: ThemeId = isThemeId(q) ? q : isThemeId(stored) ? stored : defaultTheme;
  const heading = storedH === "serif" || storedH === "sans" ? storedH : defaultHeading;

  useEffect(() => {
    if (isThemeId(q) && q !== read(KEY)) write(KEY, q);
  }, [q]);

  useEffect(() => {
    const el = document.getElementById("hotel-theme");
    if (!el) return;
    Object.entries(tokensFor(active)).forEach(([k, v]) => el.style.setProperty(k, v));
    el.dataset.theme = active;
    el.dataset.heading = heading;
  }, [active, heading]);

  if (process.env.NEXT_PUBLIC_THEME_SWITCHER === "off") return null;

  const t = themeById(active);
  return (
    <>
    <PhoneThemeButton active={active} heading={heading} />
    <div className="hidden border-b border-ink/10 bg-ink text-white md:block">
      <div className="no-scrollbar mx-auto flex h-12 max-w-[1240px] items-center gap-3 overflow-x-auto px-4 sm:px-6">
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold">
          <Palette className="size-4 opacity-80" /> <span className="hidden sm:inline">Theme</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5" role="radiogroup" aria-label="Colour theme">
          {THEMES.map((th, i) => (
            <button
              key={th.id}
              role="radio"
              aria-checked={active === th.id}
              title={`${i + 1}. ${th.name} ${th.brand}`}
              aria-label={th.name}
              onClick={() => write(KEY, th.id)}
              className={clsx("grid size-7 place-items-center rounded-full transition-transform hover:scale-110", active === th.id && "ring-2 ring-white ring-offset-2 ring-offset-ink")}
              style={{ background: th.brand }}
            >
              {active === th.id && <Check className="size-3.5 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[13px] text-white/70">
          <b className="text-white">{t.name}</b> <code className="ml-1 text-white/60">{t.brand}</code>
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-white/10 p-0.5 text-[12px] font-semibold" role="group" aria-label="Heading font">
          {(["sans", "serif"] as const).map((h) => (
            <button key={h} onClick={() => write(HKEY, h)} aria-pressed={heading === h} className={clsx("h-7 rounded-full px-3", heading === h ? "bg-white text-ink" : "text-white/80 hover:text-white")}>
              {h === "sans" ? "Sans" : "Serif"}
            </button>
          ))}
        </div>
        <Link href="/theme-lab" className="hidden h-8 shrink-0 items-center rounded-full border border-white/20 px-3 text-[12px] font-semibold hover:bg-white/10 md:flex">
          Theme Lab
        </Link>
      </div>
    </div>
    </>
  );
}

/** Phone: small dark palette button in the header (left of the menu) that opens the switcher as a sheet. */
function PhoneThemeButton({ active, heading }: { active: ThemeId; heading: "sans" | "serif" }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Theme switcher"
        className="fixed right-[64px] top-[9px] z-50 grid size-10 place-items-center rounded-full bg-ink text-white active:scale-95"
      >
        <Palette className="size-[18px]" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Theme (preview)">
        <div className="grid grid-cols-5 gap-3 pb-2">
          {THEMES.map((th) => (
            <button key={th.id} onClick={() => write(KEY, th.id)} className="flex flex-col items-center gap-1.5" aria-pressed={active === th.id}>
              <span className={clsx("grid size-12 place-items-center rounded-full", active === th.id && "ring-2 ring-ink ring-offset-2")} style={{ background: th.brand }}>
                {active === th.id && <Check className="size-5 text-white" strokeWidth={3} />}
              </span>
              <span className="text-[11px] font-semibold text-muted">{th.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-canvas p-3">
          <span className="text-sm font-semibold">Heading font</span>
          <div className="flex gap-1 rounded-full bg-surface p-1 text-[13px] font-semibold">
            {(["sans", "serif"] as const).map((h) => (
              <button key={h} onClick={() => write(HKEY, h)} className={clsx("h-8 rounded-full px-4", heading === h ? "bg-ink text-white" : "text-muted")}>{h === "sans" ? "Sans" : "Serif"}</button>
            ))}
          </div>
        </div>
        <Link href="/theme-lab" className="mt-3 flex h-11 items-center justify-center rounded-full border border-line text-sm font-semibold">Open Theme Lab</Link>
      </Sheet>
    </div>
  );
}
