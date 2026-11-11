"use client";
// Communication Center (live HMS): SMS / email credits, credit purchases, message history and delivery.
// Owns: purchases and the message log. Credits left = bought − used (never stored twice).
// Rules (which event sends what) live in Settings data (messages.rules) and the texts in Bookings settings;
// Communication Center is the one screen that edits them (D1). Credit packs are paid from the hotel's BinGi
// balance, so their cost shows in Finance as "SMS & email".
// Prototype: nothing is really sent — every row is a demo record. Production: message_log, credit_purchases.
import { useCallback, useSyncExternalStore } from "react";
import type { Hotel } from "@/lib/types";
import { TODAY } from "@/lib/rooms/store";

export type Channel = "sms" | "email";
export type MsgStatus = "delivered" | "sent" | "failed";
export type Msg = { id: string; at: string; channel: Channel; to: string; guest: string; booking?: string; event: string; text: string; status: MsgStatus; parts: number; error?: string; manual?: boolean };
export type Purchase = { id: string; at: string; channel: Channel; qty: number; price: number; paidFrom: "balance" };
/** Demo prices — the real price list comes from BinGi (Super Admin). Shown as "demo" in the UI. */
export const PACKS: Record<Channel, { qty: number; price: number }[]> = {
  sms: [{ qty: 100, price: 45 }, { qty: 500, price: 210 }, { qty: 1000, price: 400 }],
  email: [{ qty: 1000, price: 20 }, { qty: 5000, price: 90 }],
};
export const CH_LABEL: Record<Channel, string> = { sms: "SMS", email: "Email" };
/** One SMS part = 160 Latin characters, or 70 when the text has Bangla (Unicode). */
export const smsParts = (t: string) => { const uni = /[^\u0000-\u007f]/.test(t); const per = uni ? 70 : 160; return Math.max(1, Math.ceil(t.length / per)); };

export type Ref = { code: string; guest: string; phone: string; email: string; created: string; from: string; status: string };
type State = { v: 1; purchases: Purchase[]; log: Msg[]; next: number };

function seed(refs: Ref[]): State {
  const purchases: Purchase[] = [
    { id: "CR-1001", at: `${addDays(TODAY, -40)}T10:00`, channel: "sms", qty: 500, price: 210, paidFrom: "balance" },
    { id: "CR-1002", at: `${addDays(TODAY, -40)}T10:01`, channel: "email", qty: 1000, price: 20, paidFrom: "balance" },
  ];
  const log: Msg[] = [];
  let n = 1;
  refs.filter((r) => r.created.slice(0, 10) >= addDays(TODAY, -20)).forEach((r, i) => {
    const at = r.created.length > 10 ? r.created : `${r.created}T11:20`;
    if (r.email) log.push({ id: `MSG-${n++}`, at, channel: "email", to: r.email, guest: r.guest, booking: r.code, event: "Booking confirmed", text: `Booking ${r.code} confirmed`, status: "delivered", parts: 1 });
    if (r.phone) log.push({ id: `MSG-${n++}`, at, channel: "sms", to: r.phone, guest: r.guest, booking: r.code, event: "Booking confirmed", text: `Dear ${r.guest}, your booking ${r.code} is confirmed.`, status: i % 9 === 4 ? "failed" : "delivered", parts: 1, error: i % 9 === 4 ? "Number not reachable" : undefined });
    if (r.status === "Checked out" && r.email) log.push({ id: `MSG-${n++}`, at: `${r.from}T12:00`, channel: "email", to: r.email, guest: r.guest, booking: r.code, event: "After check-out", text: "Thank you for staying with us", status: "delivered", parts: 1 });
  });
  return { v: 1, purchases, log: log.sort((a, b) => b.at.localeCompare(a.at)), next: n };
}
function addDays(iso: string, k: number) { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); }

const KEY = (slug: string) => `bingi-comm-v1-${slug}`;
const cache = new Map<string, { raw: string | null; sig: string; st: State }>();
const seeds = new Map<string, State>();
const listeners = new Set<() => void>();
const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const EMPTY: State = { v: 1, purchases: [], log: [], next: 1 };
function read(h: Hotel, refs: Ref[]): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(h.slug)); } catch {}
  const sig = `${h.slug}|${refs.length}`;
  const hit = cache.get(h.slug);
  if (hit && hit.raw === raw && (raw || hit.sig === sig)) return hit.st;
  const sk = `${h.slug}|${refs.map((r) => r.code).join(",")}`;
  if (!seeds.has(sk)) seeds.set(sk, seed(refs));
  let st = seeds.get(sk)!;
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1 && Array.isArray(p.log)) st = p; } catch {}
  cache.set(h.slug, { raw, sig, st });
  return st;
}
function write(slug: string, st: State) { const raw = JSON.stringify(st); try { localStorage.setItem(KEY(slug), raw); } catch {} cache.set(slug, { raw, sig: cache.get(slug)?.sig ?? "", st }); listeners.forEach((l) => l()); }
const stamp = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`;

export function credits(st: State) {
  const c = (ch: Channel) => {
    const bought = st.purchases.filter((p) => p.channel === ch).reduce((s, p) => s + p.qty, 0);
    const used = st.log.filter((m) => m.channel === ch && m.status !== "failed").reduce((s, m) => s + m.parts, 0);
    return { bought, used, left: Math.max(0, bought - used) };
  };
  return { sms: c("sms"), email: c("email") };
}
/** Cost of credit packs, for Finance ("SMS & email" deduction from the BinGi balance). */
export const messagingCost = (st: State) => st.purchases.map((p) => ({ date: p.at.slice(0, 10), ref: p.id, text: `${p.qty} ${CH_LABEL[p.channel]} credits`, cost: p.price }));

export function useComm(h: Hotel, refs: Ref[]) {
  const st = useSyncExternalStore(sub, () => read(h, refs), () => EMPTY);
  const update = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h, refs)); fn(n); write(h.slug, n); }, [h, refs]);
  const c = credits(st);
  return {
    st, credits: c,
    buy: (channel: Channel, qty: number, price: number) => update((s) => { s.purchases.unshift({ id: `CR-${1000 + s.purchases.length + 1}`, at: stamp(), channel, qty, price, paidFrom: "balance" }); }),
    /** Send now (prototype: recorded only). Returns an error, or "". */
    send: (m: Omit<Msg, "id" | "at" | "status" | "parts">): string => {
      const parts = m.channel === "sms" ? smsParts(m.text) : 1;
      const left = credits(read(h, refs))[m.channel].left;
      if (parts > left) return `Not enough ${CH_LABEL[m.channel]} credits (${left} left) — buy more first`;
      if (m.channel === "sms" && !/^\+?[\d\s-]{8,}$/.test(m.to)) return "Check the phone number";
      if (m.channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.to)) return "Check the email address";
      update((s) => { s.log.unshift({ ...m, id: `MSG-${s.next++}`, at: stamp(), status: "sent", parts, manual: true }); });
      return "";
    },
    retry: (id: string): string => {
      const s0 = read(h, refs); const m = s0.log.find((x) => x.id === id);
      if (!m || m.status !== "failed") return "";
      if (credits(s0)[m.channel].left < m.parts) return `Not enough ${CH_LABEL[m.channel]} credits`;
      update((s) => { const x = s.log.find((y) => y.id === id)!; x.status = "sent"; x.error = undefined; x.at = stamp(); });
      return "";
    },
    reset: () => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); },
  };
}
export type Comm = ReturnType<typeof useComm>;
