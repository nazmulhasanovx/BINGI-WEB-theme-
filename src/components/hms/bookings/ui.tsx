"use client";
import Link from "next/link";
import clsx from "clsx";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarDays, CircleCheck, List, Plus, Sun } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { dmy, dow, dueOf, flags, payState, useBookings, type BStatus, type Booking, type Bk, type PayState } from "@/lib/bookings/store";
import { useBkMode, type BkMode } from "@/lib/bookings/mode";
import { useGuests, type GuestRow } from "@/lib/guests/store";
import { useProperty } from "../property";
import { Menu } from "../staff/ui";
import { BookingSheet } from "./sheet";

type Ctx = { bk: Bk; guests: Map<string, GuestRow>; g: ReturnType<typeof useGuests>; mode: BkMode; open: (code: string | null, view?: "checkin" | "checkout") => void; toast: (t: string) => void };
const C = createContext<Ctx | null>(null);
export const useBk = () => useContext(C)!;

export type BkTab = "today" | "calendar" | "list";
const TABS: { id: BkTab; label: string; href: string; icon: typeof Sun }[] = [
  { id: "today", label: "Today", href: "/hms/bookings", icon: Sun },
  { id: "calendar", label: "Calendar", href: "/hms/bookings/calendar", icon: CalendarDays },
  { id: "list", label: "All bookings", href: "/hms/bookings/list", icon: List },
];

/** Easy / Details switch — same data, more or fewer fields. */
export function ModeSwitch() {
  const { mode, setMode } = useBkMode();
  return (
    <div role="radiogroup" aria-label="Bookings view" className="inline-flex h-10 rounded-xl border border-hms-line bg-white p-1">
      {([["easy", "Easy"], ["details", "Details"]] as [BkMode, string][]).map(([m, l]) => (
        <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={clsx("whitespace-nowrap rounded-lg px-3.5 text-[14px] font-semibold transition-colors", mode === m ? "bg-[#0f1720] text-white" : "text-[#4d5664] hover:text-hms-ink")}>{l}</button>
      ))}
    </div>
  );
}

export function BookingsFrame({ tab, children, sub }: { tab: BkTab; children: ReactNode; sub?: ReactNode }) {
  const h = useProperty();
  const bk = useBookings(h);
  const g = useGuests(h);
  const { mode } = useBkMode();
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [toastText, setToast] = useState(() => sp.get("made") ?? "");
  useEffect(() => { if (!toastText) return; const t = setTimeout(() => setToast(""), 2800); return () => clearTimeout(t); }, [toastText]);
  const guests = useMemo(() => new Map(g.rows.map((r) => [r.id, r])), [g.rows]);
  const code = sp.get("b");
  const open = useCallback((c: string | null, view?: "checkin" | "checkout") => {
    const q = new URLSearchParams(sp.toString());
    if (c) q.set("b", c); else q.delete("b");
    if (view) q.set("do", view); else q.delete("do");
    const s = q.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
  }, [sp, router, path]);
  const cur = code ? bk.list.find((b) => b.code === code) : undefined;
  const msg = sp.get("made");
  useEffect(() => { if (msg) { const q = new URLSearchParams(sp.toString()); q.delete("made"); router.replace(`${path}?${q}`, { scroll: false }); } }, [msg, sp, router, path]);
  return (
    <C.Provider value={{ bk, guests, g, mode, open, toast: setToast }}>
      <div className="h-full overflow-y-auto"><div className="hms-page">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold tracking-[-0.01em]">Bookings</h1>
            <p className="text-[14px] text-hms-muted">{dow(TODAY)}, {dmy(TODAY)} · {h.name}</p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <ModeSwitch />
            <Link href="/hms/bookings/new" className={clsx(bMain, "ml-auto sm:ml-0")}><Plus className="size-4" />New booking</Link>
            <Menu label="More actions" items={[{ label: "Reset demo bookings", onClick: () => { bk.reset(); setToast("Demo bookings reset"); }, danger: true }]} />
          </div>
        </div>
        <nav aria-label="Bookings sections" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-hms-line">
          {TABS.map((t) => (
            <Link key={t.id} href={t.href} aria-current={tab === t.id ? "page" : undefined} className={clsx("-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-[14.5px] font-semibold", tab === t.id ? "border-hms-red text-hms-ink" : "border-transparent text-hms-muted hover:text-hms-ink")}><t.icon className="size-4" />{t.label}</Link>
          ))}
        </nav>
        {sub}
        <div key={tab} className="hms-page-in mt-5">{bk.ready ? children : <p role="status" className="py-10 text-[14px] text-hms-muted">Loading bookings…</p>}</div>
      </div></div>
      {cur && <BookingSheet key={cur.code + (sp.get("do") ?? "")} b={cur} start={sp.get("do") === "checkin" || sp.get("do") === "checkout" ? (sp.get("do") as "checkin" | "checkout") : undefined} onClose={() => open(null)} />}
      {toastText && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><CircleCheck className="size-4 shrink-0 text-[#7ee2a8]" />{toastText}</div>}
    </C.Provider>
  );
}

// ---------- pills (booking status, payment and flags are always separate) ----------
const ST: Record<BStatus, string> = {
  Confirmed: "bg-[#e8f0fe] text-[#1d4ed8]", "Checked in": "bg-[#e5f5ec] text-[#16693a]", "Checked out": "bg-hms-hover text-[#4d5664]",
  Cancelled: "bg-[#fdecec] text-[#b42318]", "No-show": "bg-[#fdecec] text-[#b42318]",
};
const STL: Record<BStatus, string> = { Confirmed: "Confirmed", "Checked in": "In house", "Checked out": "Checked out", Cancelled: "Cancelled", "No-show": "No-show" };
export const statusLabel = (s: BStatus) => STL[s];
export function StatusPill({ s }: { s: BStatus }) {
  return <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[12.5px] font-semibold", ST[s])}><span className="size-1.5 rounded-full bg-current" />{STL[s]}</span>;
}
const PS: Record<PayState, string> = { Paid: "text-[#16693a]", "Partly paid": "text-[#a15c00]", Due: "text-[#b42318]", "Refund due": "text-[#6b55e0]" };
export function PayPill({ b }: { b: Booking }) {
  const p = payState(b);
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap text-[12.5px] font-semibold", PS[p])}>{p}</span>;
}
export function Flags({ b }: { b: Booking }) {
  const f = flags(b);
  if (!f.length) return null;
  return <>{f.map((x) => <span key={x} className="inline-flex whitespace-nowrap rounded-md bg-[#fff4e0] px-2 py-0.5 text-[12px] font-semibold text-[#8a4b00]">{x}</span>)}</>;
}
export const due = dueOf;
export const card = "rounded-2xl border border-hms-line bg-white";
// Buttons for Bookings: one solid brand action per screen, soft grey for the rest. Large tap targets, no borders.
const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-[background-color,transform,box-shadow] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";
export const bMain = clsx(base, "btn-glow h-11 px-5 text-[14.5px] text-white");
export const bSoft = clsx(base, "h-11 bg-[#eef0f3] px-4 text-[14.5px] text-hms-ink hover:bg-[#e3e6eb]");
export const bSmall = clsx(base, "h-9 px-3.5 text-[13.5px]");
export const bDark = clsx(base, "h-10 bg-hms-ink px-4 text-[14px] text-white hover:bg-[#1f2937]");
