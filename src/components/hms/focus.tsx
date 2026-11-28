"use client";
// Full-screen ("focus") mode for station screens: Bookings calendar/board, Accommodations, Housekeeping, Dashboard.
// The HMS shell hides the sidebar, header, banners and bottom nav on EVERY page of that module (so Calendar → New booking
// stays full screen); the page fills the window. Remembered per device and per module, so a
// front-desk PC or housekeeping tablet keeps opening that screen full screen. Uses the browser Fullscreen API when it is
// allowed; when it is blocked the page still covers the whole window. Elements marked `focus-hide` (the page's own big
// title) are hidden in full screen because the slim top bar already names the screen.
import clsx from "clsx";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { imgSrc } from "@/lib/img";
import { useProperty } from "./property";

const subs = new Set<() => void>();
const k = (id: string) => `bingi.full.${id}`;
export function useFocusMode(id: string) {
  const on = useSyncExternalStore((f) => (subs.add(f), () => void subs.delete(f)), () => { try { return localStorage.getItem(k(id)) === "1"; } catch { return false; } }, () => false);
  const set = (v: boolean) => {
    try { localStorage.setItem(k(id), v ? "1" : "0"); } catch {}
    try { if (v && !document.fullscreenElement) document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {}); else if (!v && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch { /* blocked */ }
    subs.forEach((f) => f());
  };
  return [on, set] as const;
}

function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 30_000); return () => clearInterval(i); }, []);
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const btn = "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-hms-line bg-white px-3 text-[14px] font-semibold hover:bg-hms-hover";

export function FocusButton({ id, label, className }: { id: string; label: string; className?: string }) {
  const [on, set] = useFocusMode(id);
  if (on) return null;
  return <button onClick={() => set(true)} aria-label={`Open ${label} in full screen`} title="Full screen — hides the HMS menu" className={clsx(btn, className)}><Maximize2 className="size-4" aria-hidden /><span className="hidden sm:inline">Full screen</span></button>;
}

/** Which full-screen key a module uses (every page of that module stays full screen: list, calendar, new booking…). */
export const FOCUS_MODULES: Record<string, string> = { dashboard: "Dashboard", bookings: "Bookings", rooms: "Accommodations", housekeeping: "Housekeeping", meals: "Restaurant & Bar" };

/** Slim top bar shown by the HMS shell instead of the sidebar and header while a module is full screen. */
export function FocusBar({ id, title }: { id: string; title: string }) {
  const [, set] = useFocusMode(id);
  const h = useProperty();
  const clock = useClock();
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector('[aria-modal="true"]')) set(false); };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [set]);
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hms-line bg-white px-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
      <img src={imgSrc("/brand/bingi-hms.svg")} alt="BinGi HMS" className="h-6 w-auto" />
      <span className="h-6 w-px bg-hms-line" aria-hidden />
      <div className="min-w-0 leading-tight"><b className="block truncate text-[14.5px]">{title}</b><span className="block truncate text-[12px] text-hms-muted">{h.name}</span></div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="hidden text-[14px] font-semibold tabular-nums text-hms-muted sm:block" aria-label="Time">{clock}</span>
        <button onClick={() => set(false)} aria-label={`Exit ${title} full screen`} className={btn}><Minimize2 className="size-4" aria-hidden /><span className="hidden sm:inline">Exit full screen</span></button>
      </div>
    </header>
  );
}

/** A module page's scrolling body (the shell decides full screen, so the page stays the same in both). */
export function FocusView({ page = "hms-page", children }: { id: string; title: string; page?: string; children: ReactNode }) {
  return <div className="h-full overflow-y-auto"><div className={page}>{children}</div></div>;
}
