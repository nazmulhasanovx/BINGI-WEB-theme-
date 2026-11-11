"use client";
// Cashbox (11 Nov 2026) — one cash drawer per property per business day.
// Follows the live HMS Cashbox (Overview / Movement history / Withdraw cash / Close & reconcile) and adds:
// open with a counted float, cash in for cash that did not come through Payments, petty-cash categories,
// approval above a limit, reversal instead of edit/delete (movements are immutable), note counting at close,
// "keep for tomorrow / deposit the rest", and a history of closed days.
// Production: cashbox_days(property, date, opened_at/by, float, closed_at/by, expected, counted, variance, note, carry)
//             cashbox_movements(day, at, kind, source|reason, amount, ref, party, account, category, note, by, approved_by, reverses)
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Hotel } from "@/lib/types";
import { TODAY } from "@/lib/rooms/store";

export type InSource = "booking" | "restaurant" | "service" | "other";
export type OutReason = "owner" | "bank" | "transfer" | "petty" | "refund";
export type Movement = {
  id: string; day: string; at: string; kind: "in" | "out"; amount: number;
  source?: InSource; reason?: OutReason; ref?: string; party?: string; account?: string; category?: string; note?: string;
  by: string; approvedBy?: string; reverses?: string; reversedBy?: string; auto?: boolean;
};
export type Day = {
  date: string; openedAt: string; openedBy: string; float: number; openNote?: string;
  closedAt?: string; closedBy?: string; expected?: number; counted?: number; varianceNote?: string; carry?: number; deposit?: number;
};
type State = { v: 1; days: Day[]; moves: Movement[]; seq: number };

export const ME = "Md Yeapas";
/** Cash out above this needs the name of the manager who approved it. */
export const APPROVAL_LIMIT = 5000;
export const IN_LABEL: Record<InSource, string> = { booking: "Room booking", restaurant: "Restaurant & bar", service: "Other services", other: "Other income" };
export const OUT_LABEL: Record<OutReason, string> = { owner: "Owner withdrawal", bank: "Bank deposit", transfer: "Cash transfer", petty: "Petty cash expense", refund: "Guest refund" };
export const PETTY = ["Supplies", "Transport", "Repairs", "Staff food", "Laundry", "Other"];
export const NOTES = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
export const tk = (n: number) => `${n < 0 ? "−" : ""}৳${new Intl.NumberFormat("en-IN").format(Math.abs(Math.round(n)))}`;
export const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (d: string) => `${Number(d.slice(8, 10))} ${MON[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
export const fmtTime = (at: string) => { const [h, m] = at.slice(11, 16).split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export const label = (m: Movement) => (m.kind === "in" ? IN_LABEL[m.source ?? "other"] : OUT_LABEL[m.reason ?? "petty"]);

/** Expected cash for a day: opening float + cash in − cash out (reversals are movements too, so they net out). */
export function totals(day: Day | undefined, moves: Movement[]) {
  const ms = day ? moves.filter((m) => m.day === day.date) : [];
  const cin = ms.filter((m) => m.kind === "in").reduce((s, m) => s + m.amount, 0);
  const cout = ms.filter((m) => m.kind === "out").reduce((s, m) => s + m.amount, 0);
  return { float: day?.float ?? 0, cin, cout, now: (day?.float ?? 0) + cin - cout, count: ms.length };
}

// ---------------- demo seed: 6 closed days + today open ----------------
type StayRef = { code: string; guest: string };
function seed(stays: StayRef[]): State {
  const days: Day[] = [];
  const moves: Movement[] = [];
  let n = 1;
  const id = () => `m${n++}`;
  const ref = (i: number) => stays[i % Math.max(1, stays.length)]?.code ?? `BK-${2380 + i}`;
  const who = (i: number) => stays[i % Math.max(1, stays.length)]?.guest;
  const staff = ["Rahim (Front desk)", "Sumi (Front desk)", ME];
  const variances = [0, -200, 0, 0, 150, 0];
  let carry = 5000;
  for (let k = 6; k >= 1; k--) {
    const date = addDays(TODAY, -k), i = 6 - k;
    const day: Day = { date, openedAt: `${date}T08:0${i}`, openedBy: staff[i % 2], float: carry };
    const ms: Movement[] = [
      { id: id(), day: date, at: `${date}T09:1${i}`, kind: "in", amount: 8000 + i * 1300, source: "booking", ref: ref(i + 3), party: who(i + 3), by: staff[i % 2], auto: true },
      { id: id(), day: date, at: `${date}T13:2${i}`, kind: "in", amount: 2450 + i * 210, source: "restaurant", ref: `RB-${5100 + i * 7}`, by: staff[i % 2], auto: true },
      { id: id(), day: date, at: `${date}T16:4${i}`, kind: "in", amount: 1800 + (i % 3) * 600, source: "service", ref: `OSO-${1020 + i}`, by: staff[i % 2], auto: true },
      { id: id(), day: date, at: `${date}T17:1${i}`, kind: "out", amount: 600 + i * 90, reason: "petty", category: PETTY[i % PETTY.length], note: ["Cleaning liquid", "CNG to market", "Tap washer", "Staff lunch", "Iron repair", "Light bulbs"][i], by: staff[i % 2] },
    ];
    const t = totals(day, ms);
    const counted = t.now + variances[i];
    day.closedAt = `${date}T22:3${i}`; day.closedBy = staff[(i + 1) % 2]; day.expected = t.now; day.counted = counted;
    if (variances[i]) day.varianceNote = variances[i] < 0 ? "Change given twice to a walk-in guest" : "Tip left in the drawer";
    day.carry = 5000; day.deposit = counted - 5000;
    if (day.deposit > 0) ms.push({ id: id(), day: date, at: day.closedAt, kind: "out", amount: day.deposit, reason: "bank", account: "City Bank ···4417", note: "Deposit at closing", by: day.closedBy, auto: true });
    // deposit is part of the day's movements, so record expected/counted before it (as at closing time)
    days.push(day); moves.push(...ms);
    carry = 5000;
  }
  const today: Day = { date: TODAY, openedAt: `${TODAY}T08:02`, openedBy: "Rahim (Front desk)", float: carry };
  moves.push(
    { id: id(), day: TODAY, at: `${TODAY}T09:05`, kind: "in", amount: 12000, source: "booking", ref: ref(0), party: who(0), by: "Rahim (Front desk)", auto: true },
    { id: id(), day: TODAY, at: `${TODAY}T10:40`, kind: "out", amount: 850, reason: "petty", category: "Supplies", note: "Printer paper and pens", by: "Rahim (Front desk)" },
    { id: id(), day: TODAY, at: `${TODAY}T11:15`, kind: "in", amount: 3240, source: "restaurant", ref: "RB-5161", by: "Rahim (Front desk)", auto: true },
    { id: id(), day: TODAY, at: `${TODAY}T12:30`, kind: "in", amount: 2500, source: "service", ref: "OSO-1044", party: who(1), by: ME, auto: true },
    { id: id(), day: TODAY, at: `${TODAY}T13:10`, kind: "in", amount: 6200, source: "booking", ref: ref(2), party: who(2), by: ME, auto: true },
    { id: id(), day: TODAY, at: `${TODAY}T14:05`, kind: "out", amount: 500, reason: "owner", party: "Owner", note: "Sent by bKash", by: ME },
  );
  days.push(today);
  return { v: 1, days, moves, seq: n };
}

// ---------------- store (one record per property) ----------------
const KEY = (slug: string) => `bingi-cashbox-v1-${slug}`;
const cache = new Map<string, { raw: string | null; sig: string; st: State }>();
const seeds = new Map<string, State>();
const listeners = new Set<() => void>();
const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const EMPTY: State = { v: 1, days: [], moves: [], seq: 1 };
function read(slug: string, stays: StayRef[]): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(slug)); } catch {}
  const sig = `${slug}|${stays.map((x) => x.code).join(",")}`;
  const hit = cache.get(slug);
  if (hit && hit.raw === raw && hit.sig === sig) return hit.st;
  if (!seeds.has(sig)) seeds.set(sig, seed(stays));
  let st = seeds.get(sig)!;
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1 && Array.isArray(p.days) && Array.isArray(p.moves)) st = p; } catch {}
  cache.set(slug, { raw, sig, st });
  return st;
}
function write(slug: string, st: State) { const raw = JSON.stringify(st); try { localStorage.setItem(KEY(slug), raw); } catch {} cache.set(slug, { raw, sig: cache.get(slug)?.sig ?? "", st }); listeners.forEach((l) => l()); }
const stamp = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`;

export type NewMove = Omit<Movement, "id" | "day" | "at" | "by">;
export function useCashbox(h: Hotel, stays: StayRef[]) {
  const st = useSyncExternalStore(sub, () => read(h.slug, stays), () => EMPTY);
  const update = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h.slug, stays)); fn(n); write(h.slug, n); }, [h.slug, stays]);
  const today = st.days.find((d) => d.date === TODAY);
  const open = !!today && !today.closedAt;
  const last = useMemo(() => [...st.days].filter((d) => d.closedAt).sort((a, b) => b.date.localeCompare(a.date))[0], [st.days]);
  const t = totals(today, st.moves);
  return {
    st, today, open, last, t,
    add: (m: NewMove) => { let made = ""; update((s) => { made = `m${s.seq++}`; s.moves.push({ ...m, id: made, day: TODAY, at: stamp(), by: ME }); }); return made; },
    reverse: (id: string, why: string) => update((s) => {
      const o = s.moves.find((m) => m.id === id); if (!o || o.reversedBy || o.reverses) return;
      const nid = `m${s.seq++}`;
      s.moves.push({ id: nid, day: TODAY, at: stamp(), kind: o.kind === "in" ? "out" : "in", amount: o.amount, source: o.source, reason: o.reason, ref: o.ref, note: `Reversal: ${why}`, by: ME, reverses: o.id });
      o.reversedBy = nid;
    }),
    openDay: (float: number, note?: string) => update((s) => { if (!s.days.some((d) => d.date === TODAY)) s.days.push({ date: TODAY, openedAt: stamp(), openedBy: ME, float, openNote: note }); }),
    closeDay: (counted: number, note: string | undefined, carry: number, account: string) => update((s) => {
      const d = s.days.find((x) => x.date === TODAY); if (!d || d.closedAt) return;
      const exp = totals(d, s.moves).now;
      d.closedAt = stamp(); d.closedBy = ME; d.expected = exp; d.counted = counted; d.varianceNote = counted !== exp ? note : undefined; d.carry = carry; d.deposit = Math.max(0, counted - carry);
      if (d.deposit > 0) s.moves.push({ id: `m${s.seq++}`, day: TODAY, at: d.closedAt, kind: "out", amount: d.deposit, reason: "bank", account, note: "Deposit at closing", by: ME, auto: true });
    }),
    reset: () => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); },
    startFresh: () => update((s) => { s.days = s.days.filter((d) => d.date !== TODAY); s.moves = s.moves.filter((m) => m.day !== TODAY); }),
  };
}
