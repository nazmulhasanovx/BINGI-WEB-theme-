"use client";
// Inventory for one property (prototype: localStorage per property). Matches Nazmul's 20 desktop screens (10 Nov 2026).
// Rule: on-hand quantity changes ONLY through movements (opening, receive, issue, wastage, adjust) — every change is in History.
// Production: inventory_items, inventory_categories, suppliers, stock_movements (append-only, balance_after stored).
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Hotel } from "@/lib/types";

export const UNITS = [["pcs", "Piece (pcs)"], ["kg", "Kilogram (kg)"], ["L", "Litre (L)"], ["box", "Box"], ["pack", "Pack"], ["bottle", "Bottle"], ["roll", "Roll"], ["set", "Set"]] as const;
export type Unit = (typeof UNITS)[number][0];
export type Item = { id: string; name: string; sku: string; unit: Unit; category: string; supplier: string; reorder: number; cost: number; qty: number; archived?: boolean };
export type Category = { id: string; name: string };
export type Supplier = { id: string; name: string; contact: string; phone: string; email: string; address: string };
export type MoveType = "opening" | "receive" | "issue" | "wastage" | "adjust";
export type Move = { id: string; at: string; item: string; type: MoveType; change: number; balance: number; ref: string; note: string; supplier?: string; cost?: number; by: string };
type State = { v: 1; items: Item[]; categories: Category[]; suppliers: Supplier[]; moves: Move[] };

export const MOVE_LABEL: Record<MoveType, string> = { opening: "Opening Stock", receive: "Receive Stock", issue: "Issue Stock", wastage: "Wastage", adjust: "Adjustment" };
export const USER = "Md Yeapas";
export const TODAY = "2026-11-10";

const C = (id: string, name: string): Category => ({ id, name });
const S = (id: string, name: string): Supplier => ({ id, name, contact: "", phone: "", email: "", address: "" });
function seed(): State {
  const items: Item[] = [
    { id: "i1", name: "Guest Soap", sku: "HK-001", unit: "pcs", category: "c1", supplier: "s1", reorder: 20, cost: 18, qty: 62 },
    { id: "i2", name: "Bath Towels", sku: "LN-004", unit: "pcs", category: "c2", supplier: "s2", reorder: 20, cost: 420, qty: 48 },
    { id: "i3", name: "Drinking Water 500 ml", sku: "FB-002", unit: "pcs", category: "c3", supplier: "s3", reorder: 48, cost: 14, qty: 96 },
    { id: "i4", name: "Coffee Beans", sku: "FB-008", unit: "kg", category: "c3", supplier: "s3", reorder: 3, cost: 1100, qty: 8 },
    { id: "i5", name: "Facial Tissue Box", sku: "HK-003", unit: "pcs", category: "c1", supplier: "s1", reorder: 12, cost: 65, qty: 8 },
    { id: "i6", name: "Floor Cleaner", sku: "CL-006", unit: "L", category: "c4", supplier: "s1", reorder: 5, cost: 160, qty: 4 },
    { id: "i7", name: "Paper Cups", sku: "FB-012", unit: "pcs", category: "c3", supplier: "s3", reorder: 20, cost: 4, qty: 30 },
    { id: "i8", name: "Laundry Detergent", sku: "LN-009", unit: "kg", category: "c2", supplier: "s2", reorder: 5, cost: 140, qty: 0 },
  ];
  const m = (id: string, time: string, item: string, type: MoveType, change: number, balance: number, ref: string, note: string): Move => ({ id, at: `${TODAY}T${time}`, item, type, change, balance, ref, note, by: USER });
  return {
    v: 1, items,
    categories: [C("c1", "Guest Amenities"), C("c2", "Linen & Laundry"), C("c3", "Food & Beverage"), C("c4", "Cleaning Supplies")],
    suppliers: [S("s1", "Coastline Supplies"), S("s2", "Harbor Linen Co."), S("s3", "Bay Food Traders")],
    moves: [
      m("m6", "15:40", "i1", "issue", -8, 62, "", "Housekeeping use"),
      m("m5", "14:55", "i7", "wastage", -5, 30, "", "Damaged packaging"),
      m("m4", "13:20", "i4", "adjust", -0.5, 8, "", "Physical count"),
      m("m3", "11:45", "i2", "receive", 12, 48, "INV-HL-208", ""),
      m("m2", "10:30", "i3", "issue", -24, 96, "", "Breakfast service"),
      m("m1", "09:10", "i1", "receive", 20, 70, "INV-CS-104", ""),
    ],
  };
}

const KEY = (slug: string) => `bingi-inventory-v1-${slug}`;
const cache = new Map<string, { raw: string | null; st: State }>();
const listeners = new Set<() => void>();
const BASE = seed();
function read(slug: string): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(slug)); } catch {}
  const hit = cache.get(slug);
  if (hit && hit.raw === raw) return hit.st;
  let st = seed();
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1 && Array.isArray(p.items)) st = p; } catch {}
  cache.set(slug, { raw, st });
  return st;
}
function write(slug: string, st: State) {
  const raw = JSON.stringify(st);
  try { localStorage.setItem(KEY(slug), raw); } catch {}
  cache.set(slug, { raw, st });
  listeners.forEach((l) => l());
}
const sub = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export type StockStatus = "In stock" | "Low stock" | "Out of stock";
export const statusOf = (i: Item): StockStatus => (i.qty <= 0 ? "Out of stock" : i.qty <= i.reorder ? "Low stock" : "In stock");
/** 2 decimals max (kg / L can be 0.5). */
export const q = (n: number) => Math.round(n * 100) / 100;
export const fmtQty = (n: number, u: string) => `${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)} ${u}`;
export const tk = (n: number) => `৳${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n)}`;
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const nowIso = () => { const d = new Date(); return `${TODAY}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

export function useInventory(h: Hotel) {
  const st = useSyncExternalStore(sub, () => read(h.slug), () => BASE);
  const update = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h.slug)); fn(n); write(h.slug, n); }, [h.slug]);
  const items = useMemo(() => st.items.filter((i) => !i.archived), [st.items]);

  /** Suggests the next SKU for a category prefix (e.g. LN-010). */
  const nextSku = useCallback((cat: string) => {
    const name = read(h.slug).categories.find((c) => c.id === cat)?.name ?? "Item";
    const pre = name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "IT";
    const n = Math.max(0, ...read(h.slug).items.filter((i) => i.sku.startsWith(pre + "-")).map((i) => Number(i.sku.split("-")[1]) || 0)) + 1;
    return `${pre}-${String(n).padStart(3, "0")}`;
  }, [h.slug]);

  const saveItem = useCallback((it: Item, opening?: number) => update((s) => {
    const i = s.items.findIndex((x) => x.id === it.id);
    if (i >= 0) { s.items[i] = { ...it, qty: s.items[i].qty }; return; }
    const qty = q(opening ?? 0);
    s.items.unshift({ ...it, qty });
    if (qty > 0) s.moves.unshift({ id: uid("m"), at: nowIso(), item: it.id, type: "opening", change: qty, balance: qty, ref: "", note: "Opening stock", by: USER });
  }), [update]);
  const archiveItem = useCallback((id: string) => update((s) => { const i = s.items.find((x) => x.id === id); if (i) i.archived = true; }), [update]);

  /** One movement. For "adjust" pass the counted quantity; others pass a positive amount. Returns an error or null. */
  const move = useCallback((type: Exclude<MoveType, "opening">, itemId: string, amount: number, extra: { note: string; ref?: string; supplier?: string; cost?: number }) => {
    const cur = read(h.slug).items.find((x) => x.id === itemId);
    if (!cur) return "Item not found";
    const amt = q(amount);
    if (!(amt >= 0) || (type !== "adjust" && amt <= 0)) return "Enter a quantity above 0";
    if ((type === "issue" || type === "wastage") && amt > cur.qty) return `Enter ${fmtQty(cur.qty, cur.unit)} or less. This item has ${fmtQty(cur.qty, cur.unit)} available.`;
    const change = type === "receive" ? amt : type === "adjust" ? q(amt - cur.qty) : -amt;
    if (type === "adjust" && change === 0) return "Counted quantity is the same as the balance — nothing to adjust";
    update((s) => {
      const it = s.items.find((x) => x.id === itemId)!;
      it.qty = q(it.qty + change);
      if (type === "receive" && extra.cost !== undefined && extra.cost > 0) it.cost = extra.cost;
      s.moves.unshift({ id: uid("m"), at: nowIso(), item: itemId, type, change, balance: it.qty, ref: extra.ref ?? "", note: extra.note, supplier: extra.supplier, cost: extra.cost, by: USER });
    });
    return null;
  }, [h.slug, update]);

  const saveCategory = useCallback((c: Category) => update((s) => { const i = s.categories.findIndex((x) => x.id === c.id); if (i >= 0) s.categories[i] = c; else s.categories.push(c); }), [update]);
  const removeCategory = useCallback((id: string) => update((s) => { s.categories = s.categories.filter((c) => c.id !== id); }), [update]);
  const saveSupplier = useCallback((x: Supplier) => update((s) => { const i = s.suppliers.findIndex((y) => y.id === x.id); if (i >= 0) s.suppliers[i] = x; else s.suppliers.push(x); }), [update]);
  const removeSupplier = useCallback((id: string) => update((s) => { s.suppliers = s.suppliers.filter((c) => c.id !== id); }), [update]);
  const clearAll = useCallback(() => update((s) => { s.items = []; s.moves = []; }), [update]);
  const reset = useCallback(() => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); }, [h.slug]);

  return { st, items, update, nextSku, saveItem, archiveItem, move, saveCategory, removeCategory, saveSupplier, removeSupplier, clearAll, reset, newId: uid };
}

/** Inventory is an Ultra (and custom/Enterprise) tool per the public pricing page. */
export const hasInventory = (h: Hotel) => h.plan === "ultra" || h.plan === "enterprise";
