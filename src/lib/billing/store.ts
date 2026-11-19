"use client";
// BinGi subscription billing for one property (prototype — kept in this browser, NO money moves).
// Proposed rules (open decisions are marked in the UI):
//   • Monthly plan = pay after use: the month runs 1st → last day; on the 1st the bill for the month just ended is made.
//   • Rooms billed = rooms in use (published), at least MIN_BILLED. A room added mid-month is charged for the days left.
//   • 6- and 12-month plans are paid at the start of the cycle (cheaper rate); month-end bills then only carry extra rooms.
//   • Due on the 7th. Auto-pay tries the BinGi balance first, then the saved method. Grace to the 14th, then online
//     booking pauses until paid. Guest data and existing bookings are never touched.
// Prices come from the one plan table (onboarding/store PLANS + quote), the same as the public pricing page.
import { useCallback, useSyncExternalStore } from "react";
import { PLANS, MIN_BILLED, quote, type Cycle, type PlanId } from "@/lib/onboarding/store";
import { TODAY, type Unit } from "@/lib/rooms/store";
import type { Hotel } from "@/lib/types";

export const DUE_DAY = 7, GRACE_DAY = 14, PREVIEW_DAY = 25;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const monthName = (ym: string) => `${MONTH[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
export const dShort = (iso: string) => `${Number(iso.slice(8, 10))} ${MON[Number(iso.slice(5, 7)) - 1]}`;
export const dLong = (iso: string) => `${dShort(iso)} ${iso.slice(0, 4)}`;
export const daysIn = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();
export const nextMonth = (ym: string) => { const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)); return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`; };
export const prevMonth = (ym: string) => { const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; };
const day = (ym: string, d: number) => `${ym}-${String(d).padStart(2, "0")}`;
const tk = (n: number) => Math.round(n);

export type Line = { id: string; label: string; detail: string; amount: number; note?: string };
export type Invoice = {
  id: string; month: string; issued: string; due: string; lines: Line[]; total: number;
  status: "open" | "paid" | "overdue"; paidAt?: string; paidBy?: string; demo?: boolean;
};
export type PlanChange = { plan: PlanId; cycle: Cycle; from: string; asked: string };
type State = { v: 1; cycle: Cycle; autopay: boolean; method: "bKash" | "Card" | "Bank"; invoices: Invoice[]; change?: PlanChange; next: number; today?: string };

/** Per-room rate for a plan and cycle (same table as the public pricing page). */
export const rateOf = (plan: PlanId, cycle: Cycle) => quote(plan, MIN_BILLED, cycle).sub / MIN_BILLED / cycle;
export const roomsInUse = (units: Unit[]) => units.filter((u) => u.status === "published");

/** The bill for one month, from the property's rooms and the plan table. Enterprise: by agreement. */
export function monthBill(h: Hotel, units: Unit[], ym: string, cycle: Cycle, extra: Line[] = [], sameRooms = false): { lines: Line[]; total: number; billed: number; inUse: number; rate: number } {
  if (h.plan === "enterprise") return { lines: [{ id: "plan", label: "Enterprise plan", detail: "Billed by agreement with BinGi", amount: 0 }, ...extra], total: extra.reduce((s, l) => s + l.amount, 0), billed: 0, inUse: roomsInUse(units).length, rate: 0 };
  const plan = h.plan as PlanId;
  const rate = rateOf(plan, cycle);
  // A room in use on the 1st counts for the whole month; later in the month = added (days left).
  const first = `${ym}-01`;
  const used = roomsInUse(units).filter((u) => sameRooms || u.created.slice(0, 7) <= ym);
  const fromStart = (u: Unit) => sameRooms || u.created.slice(0, 10) <= first;
  const start = used.filter(fromStart).length;
  const base = Math.max(MIN_BILLED, start);
  const added = used.filter((u) => !fromStart(u)).sort((a, b) => a.created.localeCompare(b.created));
  const lines: Line[] = [];
  if (cycle === 1) lines.push({ id: "plan", label: `${PLANS[plan].label} plan`, detail: `${base} rooms × ৳${rate} (${start < MIN_BILLED ? `${start} in use, minimum ${MIN_BILLED}` : "rooms in use on the 1st"})`, amount: base * rate });
  else lines.push({ id: "plan", label: `${PLANS[plan].label} plan · ${cycle}-month`, detail: `Paid at the start of the cycle (${base} rooms × ৳${rate} × ${cycle})`, amount: 0, note: "prepaid" });
  // Rooms added this month above what is already billed: charged for the days left.
  const free = Math.max(0, base - start);
  const charged = added.slice(free);
  if (charged.length) {
    const dim = daysIn(ym);
    const amt = charged.reduce((s, u) => s + (rate * (dim - Number(u.created.slice(8, 10)) + 1)) / dim, 0);
    lines.push({ id: "added", label: `${charged.length} room${charged.length > 1 ? "s" : ""} added this month`, detail: charged.map((u) => `${u.code} from ${dShort(u.created)}`).join(", "), amount: tk(amt) });
  }
  const all = [...lines, ...extra];
  return { lines: all, total: tk(all.reduce((s, l) => s + l.amount, 0)), billed: base + charged.length, inUse: used.length, rate };
}

/** Where today sits in the month-end flow. */
export function timeline(ym: string) {
  const nm = nextMonth(ym);
  return [
    { id: "start", date: day(ym, 1), title: "Month starts", text: "Rooms in use are counted from today." },
    { id: "preview", date: day(ym, PREVIEW_DAY), title: "Bill preview", text: "You get the expected amount (bell, SMS and email to the billing contact)." },
    { id: "close", date: day(ym, daysIn(ym)), title: "Month closes", text: "At 11:59 PM the month's rooms and add-ons are fixed." },
    { id: "issue", date: day(nm, 1), title: "Bill ready", text: "Invoice PDF is made. Auto-pay tries the BinGi balance, then your saved method." },
    { id: "due", date: day(nm, DUE_DAY), title: "Due date", text: "Reminders on the 1st, 5th and 7th if it is still open." },
    { id: "grace", date: day(nm, GRACE_DAY), title: "Grace ends", text: "If still unpaid, online booking pauses until paid. Your data and bookings stay." },
  ];
}

// ---------- store ----------
const KEY = (slug: string) => `bingi-billing-v1-${slug}`;
const cache = new Map<string, { raw: string | null; st: State }>();
const subs = new Set<() => void>();
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const BASE: State = { v: 1, cycle: 1, autopay: true, method: "bKash", invoices: [], next: 1 };
function read(slug: string): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(slug)); } catch {}
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.st;
  let st = BASE;
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1) st = { ...BASE, ...p }; } catch {}
  cache.set(slug, { raw, st });
  return st;
}
function write(slug: string, st: State) { const raw = JSON.stringify(st); try { localStorage.setItem(KEY(slug), raw); } catch {} cache.set(slug, { raw, st }); subs.forEach((f) => f()); }

/** Past three months as paid demo bills (same rooms as now), so the history is never empty in the prototype. */
function history(h: Hotel, units: Unit[], cycle: Cycle): Invoice[] {
  let ym = prevMonth(TODAY.slice(0, 7)); const out: Invoice[] = [];
  for (let i = 0; i < 3; i++) {
    const b = monthBill(h, units, ym, cycle, [], true); const nm = nextMonth(ym);
    if (b.inUse > 0 || h.plan === "enterprise") out.push({ id: `INV-${ym.replace("-", "")}-${h.slug.slice(0, 4).toUpperCase()}`, month: ym, issued: day(nm, 1), due: day(nm, DUE_DAY), lines: b.lines, total: b.total, status: "paid", paidAt: day(nm, 1), paidBy: "Auto-pay · BinGi balance", demo: true });
    ym = prevMonth(ym);
  }
  return out;
}

export function useBilling(h: Hotel, units: Unit[]) {
  const st = useSyncExternalStore(sub, () => read(h.slug), () => BASE);
  const save = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h.slug)); fn(n); write(h.slug, n); }, [h.slug]);
  const today = st.today ?? TODAY;
  const invoices = [...st.invoices, ...history(h, units, st.cycle).filter((x) => !st.invoices.some((y) => y.month === x.month))].sort((a, b) => b.month.localeCompare(a.month));
  const open = invoices.find((i) => i.status !== "paid");
  return {
    st, invoices, open, today,
    setAutopay: (on: boolean) => save((s) => { s.autopay = on; }),
    setMethod: (m: State["method"]) => save((s) => { s.method = m; }),
    askChange: (c: Omit<PlanChange, "asked">) => save((s) => { s.change = { ...c, asked: TODAY }; }),
    cancelChange: () => save((s) => { s.change = undefined; }),
    /** Demo: close the current month now and make its bill (as BinGi would on the 1st). */
    demoCloseMonth: (ym: string, lines: Line[], total: number, autopayOk: boolean) => save((s) => {
      if (s.invoices.some((i) => i.month === ym)) return;
      const nm = nextMonth(ym); const id = `INV-${ym.replace("-", "")}-${h.slug.slice(0, 4).toUpperCase()}`;
      const paid = s.autopay && autopayOk && total > 0;
      s.invoices.unshift({ id, month: ym, issued: day(nm, 1), due: day(nm, DUE_DAY), lines, total, status: total === 0 || paid ? "paid" : "open", ...(paid ? { paidAt: day(nm, 1), paidBy: "Auto-pay · BinGi balance" } : total === 0 ? { paidAt: day(nm, 1), paidBy: "Nothing to pay" } : {}), demo: true });
      s.today = day(nm, 1);
    }),
    demoOverdue: () => save((s) => { const i = s.invoices.find((x) => x.status === "open"); if (i) { i.status = "overdue"; s.today = day(nextMonth(i.month), GRACE_DAY + 1); } }),
    pay: (id: string, by: string) => save((s) => { const i = s.invoices.find((x) => x.id === id); if (i && i.status !== "paid") { i.status = "paid"; i.paidAt = s.today ?? TODAY; i.paidBy = by; } }),
    demoReset: () => save((s) => { s.invoices = []; s.today = undefined; s.change = undefined; }),
  };
}
export { PLANS, MIN_BILLED };
export type { Cycle, PlanId };
