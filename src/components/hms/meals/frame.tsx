"use client";
import { can } from "@/lib/plan";
import { PlanGate } from "../plan-gate";
// Restaurant & Bar frame — same tabs as the live HMS Meal Management (Counter is folded into Orders/Overview
// as "Needs approval"), plus Cashbox. No data imports here, so Cashbox pages can use it without a cycle.
import Link from "next/link";
import clsx from "clsx";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleCheck, Maximize2, Minimize2, Plus } from "lucide-react";
import { imgSrc } from "@/lib/img";
import { useProperty } from "../property";
import { btnLine, btnPrimary } from "../guests/ui";

export type MealsTab = "overview" | "pos" | "orders" | "kitchen" | "menu" | "tables" | "reports" | "cashbox" | "settings";
export const MEALS_TABS: [MealsTab, string, string][] = [
  ["overview", "Overview", "/hms/meals"], ["pos", "POS", "/hms/meals/pos"], ["orders", "Orders", "/hms/meals/orders"], ["kitchen", "Kitchen", "/hms/meals/kitchen"],
  ["menu", "Menu", "/hms/meals/menu"], ["tables", "Tables & QR", "/hms/meals/tables"], ["reports", "Reports", "/hms/meals/reports"],
  ["cashbox", "Cashbox", "/hms/meals/cashbox"], ["settings", "Settings", "/hms/meals/settings"],
];

// selected outlet (only shown when the property has more than one restaurant / bar)
const OKEY = "bingi-meals-outlet";
const subs = new Set<() => void>();
export function useOutlet(outlets: string[]) {
  const v = useSyncExternalStore((f) => (subs.add(f), () => void subs.delete(f)), () => { try { return localStorage.getItem(OKEY) ?? ""; } catch { return ""; } }, () => "");
  const cur = outlets.includes(v) ? v : outlets[0] ?? "Restaurant";
  return [cur, (o: string) => { try { localStorage.setItem(OKEY, o); } catch {} subs.forEach((f) => f()); }] as const;
}

// Full-screen restaurant mode (all Restaurant & Bar tabs): remembered per device, so a restaurant tablet or counter PC
// keeps opening full screen. Uses the browser Fullscreen API when allowed; otherwise it still covers the whole window.
const FKEY = "bingi.meals.full";
const fsubs = new Set<() => void>();
export function useMealsFull() {
  const on = useSyncExternalStore((f) => (fsubs.add(f), () => void fsubs.delete(f)), () => { try { return localStorage.getItem(FKEY) === "1"; } catch { return false; } }, () => false);
  const set = (v: boolean) => {
    try { localStorage.setItem(FKEY, v ? "1" : "0"); } catch {}
    try { if (v && !document.fullscreenElement) document.documentElement.requestFullscreen?.({ navigationUI: "hide" }).catch(() => {}); else if (!v && document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch { /* blocked */ }
    fsubs.forEach((f) => f());
  };
  return [on, set] as const;
}
function useClock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 30_000); return () => clearInterval(i); }, []);
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function MealsFrame({ tab, children, toast, outlets = [], wide, sub, fill }: { tab: MealsTab; children: ReactNode; toast?: string; outlets?: string[]; wide?: boolean; sub?: string; /** POS: content fills the full-screen height (own scroll areas) */ fill?: boolean }) {
  const h = useProperty();
  // Business = Restaurant "Limited" (one outlet); Ultra = full (several restaurants / bars).
  if (!can(h, "restaurantFull")) outlets = outlets.slice(0, 1);
  const [outlet, setOutlet] = useOutlet(outlets);
  const [full, setFull] = useMealsFull();
  const clock = useClock();
  useEffect(() => { if (!full) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.fullscreenElement && !document.querySelector('[aria-modal="true"]:not([data-meals-full])')) setFull(false); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [full, setFull]);
  const toastEl = toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><CircleCheck className="size-4 shrink-0 text-[#7ee2a8]" />{toast}</div>;
  const tabs = (cls: string) => MEALS_TABS.map(([id, l, href]) => (
    <Link key={id} href={href} aria-current={tab === id ? "page" : undefined} className={clsx("-mb-px shrink-0 border-b-2 px-3 text-[14.5px] font-semibold", cls, tab === id ? "border-hms-red text-hms-ink" : "border-transparent text-hms-muted hover:text-hms-ink")}>{l}</Link>
  ));
  if (!can(h, "restaurant")) return <PlanGate h={h} f="restaurant" title="Restaurant & Bar" text="Take restaurant orders, run the kitchen screen and QR menus, and charge meals to the guest's room." />;
  if (full) return createPortal(
    <div data-meals-full role="dialog" aria-modal="true" aria-label="Restaurant & Bar — full screen" className="hms-app fixed inset-0 z-[85] flex flex-col bg-[#f4f6f8]">
      <header className="shrink-0 border-b border-hms-line bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}
          <img src={imgSrc("/brand/bingi-hms.svg")} alt="BinGi HMS" className="h-6 w-auto" />
          <span className="h-6 w-px bg-hms-line" aria-hidden />
          <div className="min-w-0 leading-tight"><b className="block truncate text-[14.5px]">Restaurant &amp; Bar · {outlet}</b><span className="block truncate text-[12px] text-hms-muted">{h.name}</span></div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <span className="hidden text-[14px] font-semibold tabular-nums text-hms-muted sm:block" aria-label="Time">{clock}</span>
            {outlets.length > 1 && <select aria-label="Outlet" value={outlet} onChange={(e) => setOutlet(e.target.value)} className="h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px]">{outlets.map((o) => <option key={o}>{o}</option>)}</select>}
            {tab !== "pos" && <Link href="/hms/meals/pos" className={clsx(btnPrimary, "h-10")}><Plus className="size-4" aria-hidden /><span className="hidden sm:inline">New order</span></Link>}
            <button onClick={() => setFull(false)} aria-label="Exit restaurant full screen" className={clsx(btnLine, "h-10 px-3")}><Minimize2 className="size-4" aria-hidden /><span className="hidden sm:inline">Exit full screen</span></button>
          </div>
        </div>
        <nav aria-label="Restaurant & Bar sections" className="no-scrollbar flex gap-1 overflow-x-auto px-2">{tabs("pb-2 pt-0.5")}</nav>
      </header>
      <div className={clsx("min-h-0 flex-1 p-3 sm:p-4", fill ? "overflow-y-auto pb-24 lg:overflow-hidden lg:pb-4" : "overflow-y-auto")}><div key={tab} className={clsx("hms-page-in", fill ? "lg:h-full" : "mx-auto max-w-[1600px]")}>{children}</div></div>
      {toastEl}
    </div>, document.body);
  return (
    <div className="h-full overflow-y-auto"><div className={"hms-page"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold tracking-[-0.01em]">Restaurant &amp; Bar</h1>
          <p className="text-[14.5px] text-hms-muted">{sub ?? `${h.name} · ${outlet}`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {outlets.length > 1 && <select aria-label="Outlet" value={outlet} onChange={(e) => setOutlet(e.target.value)} className="h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px]">{outlets.map((o) => <option key={o}>{o}</option>)}</select>}
          <button onClick={() => setFull(true)} aria-label="Open Restaurant & Bar in full screen" title="Full screen for the restaurant team — hides the HMS menu" className={clsx(btnLine, "h-10 px-3")}><Maximize2 className="size-4" aria-hidden /><span className="hidden sm:inline">Full screen</span></button>
          {tab !== "pos" && <Link href="/hms/meals/pos" className={clsx(btnPrimary, "h-10")}><Plus className="size-4" aria-hidden /><span className="hidden sm:inline">New order</span><span className="sm:hidden">New</span></Link>}
        </div>
      </div>
      <nav aria-label="Restaurant & Bar sections" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-hms-line">{tabs("pb-2.5 pt-1")}</nav>
      <div key={tab} className="hms-page-in mt-5">{children}</div>
    </div>
    {toastEl}
    </div>
  );
}
