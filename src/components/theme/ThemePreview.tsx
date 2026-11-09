"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Palette, X } from "lucide-react";
import { THEMES, isThemeId, tokensFor, type ThemeId } from "@/lib/theme";

/**
 * Preview helper (not part of the hotel's live site):
 *  ?theme=ocean  → shows the page in that colour theme
 *  ?preview=1    → opens the floating theme picker
 */
export function ThemePreview({ defaultTheme }: { defaultTheme: ThemeId }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get("theme");
  const active: ThemeId = isThemeId(q) ? q : defaultTheme;
  const enabled = params.has("preview") || isThemeId(q);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = document.getElementById("hotel-theme");
    if (!el) return;
    const tokens = tokensFor(active);
    Object.entries(tokens).forEach(([k, v]) => el.style.setProperty(k, v));
    el.dataset.theme = active;
  }, [active]);

  if (!enabled) return null;

  const pick = (id: ThemeId) => {
    const next = new URLSearchParams(params.toString());
    next.set("theme", id);
    next.set("preview", "1");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="fixed left-3 top-[calc(var(--header-h)+12px)] z-50 sm:left-5">
      {open ? (
        <div className="w-64 rounded-2xl border border-line bg-surface/95 p-3 shadow-float backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Colour theme</p>
            <button aria-label="Close" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-canvas">
              <X className="size-4" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => pick(t.id)}
                title={t.name}
                aria-label={t.name}
                className="grid aspect-square place-items-center rounded-full ring-offset-2 transition hover:scale-105"
                style={{ background: t.brand, boxShadow: active === t.id ? `0 0 0 2px #fff, 0 0 0 4px ${t.brand}` : undefined }}
              >
                {active === t.id && <Check className="size-4 text-white" />}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">{THEMES.find((t) => t.id === active)?.name} · preview only</p>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface/95 px-3 text-sm font-semibold shadow-float backdrop-blur"
        >
          <Palette className="size-4 text-action" /> Theme
        </button>
      )}
    </div>
  );
}
