"use client";
// Other Services (Nazmul's 16 desktop screens, 10 Nov 2026) — catalog, orders, categories. Prototype: localStorage per property.
// HMS today offers two charge methods: "Charge to booking" (added to the guest's bill, unpaid until checkout)
// and "Cash sale" (paid now, posts to the day's open Cashbox). Payment status is kept separate from the charge destination.
// Backend to confirm (design notes): permissions, editing linked charges, billing effect of cancellation.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Hotel } from "@/lib/types";
import { TODAY, useRooms } from "@/lib/rooms/store";
import { DEMO_GUESTS, demoStays } from "@/lib/bookings/demo";

export type SvcCategory = { id: string; name: string; slug: string };
export type Service = { id: string; name: string; category: string; duration: string; price: number; description: string; image?: string; archived?: boolean };
export type BookingRef = { code: string; guest: string; room: string; phone: string };
export type Order = {
  id: string; service: string; qty: number; unitPrice: number; method: "booking" | "cash";
  booking?: BookingRef; walkIn?: { name: string; phone: string };
  when: "now" | { date: string; time: string }; payment: "Paid" | "Unpaid"; cancelled?: { reason: string; at: string }; created: string;
};
type State = { v: 1; categories: SvcCategory[]; services: Service[]; orders: Order[]; cashboxOpen: boolean; next: number };

export const SAMPLE_ART = "sample:shuttle"; // illustrated sample artwork (design note: preview uses sample art)
const cat = (id: string, name: string): SvcCategory => ({ id, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") });

function seed(bookings: BookingRef[]): State {
  const b = (i: number) => bookings[i % Math.max(1, bookings.length)];
  return {
    v: 1, cashboxOpen: true, next: 1043,
    categories: [cat("t", "Transport"), cat("g", "Guest Services"), cat("e", "Experiences")],
    services: [
      { id: "s1", name: "Airport Transfer", category: "t", duration: "45 min", price: 500, description: "Pick-up from the airport to the resort.", image: SAMPLE_ART },
      { id: "s2", name: "City Drop-off", category: "t", duration: "30 min", price: 350, description: "Drop-off at any point in the city." },
      { id: "s3", name: "Laundry Service", category: "g", duration: "24 hours", price: 150, description: "Wash and fold, priced per piece." },
      { id: "s4", name: "Extra Bed Setup", category: "g", duration: "On request", price: 1000, description: "Extra bed with fresh linen, per night." },
      { id: "s5", name: "Guided Beach Walk", category: "e", duration: "60 min", price: 1200, description: "Morning walk with a local guide." },
      { id: "s6", name: "Sunset Picnic Setup", category: "e", duration: "90 min", price: 1800, description: "Picnic setup on the beach at sunset.", archived: true },
    ],
    orders: bookings.length ? [
      { id: "OSO-1042", service: "s1", qty: 2, unitPrice: 500, method: "booking", booking: b(0), when: "now", payment: "Unpaid", created: `${TODAY}T15:20` },
      { id: "OSO-1041", service: "s1", qty: 1, unitPrice: 500, method: "booking", booking: b(0), when: "now", payment: "Unpaid", created: `${TODAY}T11:05` },
      { id: "OSO-1040", service: "s3", qty: 2, unitPrice: 150, method: "cash", walkIn: { name: "Walk-in Guest", phone: "" }, when: "now", payment: "Paid", created: `${TODAY}T10:12` },
      { id: "OSO-1039", service: "s5", qty: 2, unitPrice: 1200, method: "booking", booking: b(1), when: { date: "2026-11-11", time: "16:30" }, payment: "Unpaid", created: "2026-11-09T18:40" },
      { id: "OSO-1038", service: "s6", qty: 1, unitPrice: 1800, method: "booking", booking: b(2), when: { date: "2026-11-09", time: "17:00" }, payment: "Paid", created: "2026-11-08T12:00" },
    ] : [],
  };
}

const KEY = (slug: string) => `bingi-services-v1-${slug}`;
const cache = new Map<string, { raw: string | null; st: State }>();
const listeners = new Set<() => void>();
const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
function read(slug: string, bookings: BookingRef[]): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(slug)); } catch {}
  const hit = cache.get(slug);
  if (hit && hit.raw === raw && (raw || hit.st.orders.length || !bookings.length)) return hit.st;
  let st = seed(bookings);
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1 && Array.isArray(p.services)) st = p; } catch {}
  cache.set(slug, { raw, st });
  return st;
}
function write(slug: string, st: State) {
  const raw = JSON.stringify(st);
  try { localStorage.setItem(KEY(slug), raw); } catch {}
  cache.set(slug, { raw, st });
  listeners.forEach((l) => l());
}

export const orderTotal = (o: Order) => o.qty * o.unitPrice;
export const tk = (n: number) => `৳${new Intl.NumberFormat("en-IN").format(n)}`;
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayLabel = (iso: string) => `${iso.slice(8, 10)} ${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
export const t12 = (hm: string) => { const [H, M] = hm.split(":").map(Number); return `${String(H % 12 || 12).padStart(2, "0")}:${String(M).padStart(2, "0")} ${H >= 12 ? "PM" : "AM"}`; };
export const whenLabel = (o: Order) => (o.when === "now" ? "Immediate" : `${dayLabel(o.when.date)} · ${t12(o.when.time)}`);
/** Other Services is in Business and above (public pricing page: "Everything in Starter, plus … Other services"). */
export const hasServices = (h: Hotel) => h.plan !== "starter";

export function useServices(h: Hotel) {
  const { st: rooms } = useRooms(h);
  const bookings: BookingRef[] = useMemo(() => {
    const cat = new Map(rooms.categories.map((c) => [c.id, c]));
    const live = rooms.units.filter((u) => u.status === "published");
    const list = live.length ? live : rooms.units.filter((u) => u.status !== "archived");
    const names = new Map(DEMO_GUESTS.map((g) => [g.id, g]));
    return demoStays(h.slug, list.map((u) => ({ code: u.code, type: cat.get(u.category)?.name ?? "Room", rate: u.rate ?? cat.get(u.category)?.baseRate ?? 0 })))
      .filter((s) => s.status === "Checked in" || (s.status === "Confirmed" && s.from >= TODAY))
      .map((s) => ({ code: s.code, guest: names.get(s.guestId)?.name ?? "Guest", room: s.room, phone: names.get(s.guestId)?.phone ?? "" }));
  }, [h.slug, rooms]);
  const st = useSyncExternalStore(sub, () => read(h.slug, bookings), () => seed([]));
  const update = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h.slug, bookings)); fn(n); write(h.slug, n); }, [h.slug, bookings]);
  const saveService = useCallback((x: Service) => update((s) => { const i = s.services.findIndex((y) => y.id === x.id); if (i >= 0) s.services[i] = x; else s.services.unshift(x); }), [update]);
  const setArchived = useCallback((id: string, v: boolean) => update((s) => { const x = s.services.find((y) => y.id === id); if (x) x.archived = v; }), [update]);
  const saveCategory = useCallback((c: SvcCategory) => update((s) => { const i = s.categories.findIndex((y) => y.id === c.id); if (i >= 0) s.categories[i] = c; else s.categories.push(c); }), [update]);
  /** Creates (no id) or edits an order; returns its id. */
  const saveOrder = useCallback((o: Omit<Order, "id" | "created"> & { id?: string }) => {
    let id = o.id ?? "";
    update((s) => {
      if (o.id) { const i = s.orders.findIndex((y) => y.id === o.id); if (i >= 0) s.orders[i] = { ...s.orders[i], ...o, id: o.id }; return; }
      id = `OSO-${s.next++}`;
      const d = new Date();
      s.orders.unshift({ ...o, id, created: `${TODAY}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` });
    });
    return id;
  }, [update]);
  const cancelOrder = useCallback((id: string, reason: string) => update((s) => { const o = s.orders.find((y) => y.id === id); if (o) o.cancelled = { reason, at: new Date().toISOString() }; }), [update]);
  const setCashbox = useCallback((v: boolean) => update((s) => { s.cashboxOpen = v; }), [update]);
  const reset = useCallback(() => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); }, [h.slug]);
  return { st, bookings, saveService, setArchived, saveCategory, saveOrder, cancelOrder, setCashbox, reset, uid: (p: string) => `${p}${Date.now().toString(36)}` };
}
