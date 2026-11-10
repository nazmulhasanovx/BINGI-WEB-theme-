"use client";
// Accommodation (Rooms) module — data + actions. Spec: Room-Accomodation- V1.2.
// Prototype: kept per property in this browser (localStorage). Production: HMS Rooms API, where
// code uniqueness and bulk creation are enforced by the database in one transaction.
import { useCallback, useSyncExternalStore } from "react";
import type { Hotel, RoomCategory } from "@/lib/types";
import { CORE, CORE_TYPES, pad, preset, propertyTypeOf, type CoreType, type PresetSlug, type Template } from "./catalog";

export type LocKind = "building" | "floor" | "zone" | "block";
export type LocNode = { id: string; kind: LocKind; name: string; code: string; parent?: string; level?: number; active: boolean };
export type Numbering = { template: Template; digits: 2 | 3 };
export type Config = {
  configured: boolean;
  version: number;
  savedAt?: string;
  enabled: CoreType[];
  nodes: LocNode[];
  numbering: Record<CoreType, Numbering>;
  prefixes: Partial<Record<PresetSlug, string>>;
};
export type Category = {
  id: string; name: string; core: CoreType; preset: PresetSlug;
  bed: string; maxAdults: number; maxChildren: number; sizeSqft?: number; bedrooms?: number;
  bedsPerRoom?: number; bedStyle?: "single" | "bunk" | "mixed"; occupancy?: "mixed" | "male" | "female"; bathroom?: "attached" | "shared";
  amenities: string[]; video?: string; baseRate: number; photo?: string; created: string;
};
export type Bed = { code: string; label: string };
export type Unit = {
  id: string; code: string; local: string; node: string; category: string; core: CoreType; preset: PresetSlug;
  status: "draft" | "published"; rate?: number; video: "inherit" | "replace" | "hide"; videoUrl?: string; note?: string;
  beds?: Bed[]; created: string;
};
export type Pick = { node: string; local: string; code: string };
export type SetupDraft = { id: string; savedAt: string; preset: PresetSlug; core: CoreType; category?: string; picks: Pick[] };
export type RoomsState = { v: number; config: Config; categories: Category[]; units: Unit[]; drafts: SetupDraft[]; activity: { at: string; text: string }[] };

export const TODAY = "2026-11-10";
export const nowStamp = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`;
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const defaultNumbering = (): Record<CoreType, Numbering> => ({
  ROOM: { template: "floor", digits: 2 },
  APARTMENT: { template: "floor", digits: 2 },
  DORMITORY: { template: "floor", digits: 2 },
  COTTAGE: { template: "prefix", digits: 2 },
  VILLA: { template: "prefix", digits: 2 },
  OTHER: { template: "prefix", digits: 2 },
});
export const emptyConfig = (): Config => ({ configured: false, version: 0, enabled: [], nodes: [], numbering: defaultNumbering(), prefixes: {} });

// ---------------- location + numbering helpers ----------------
export const node = (c: Config, id?: string) => c.nodes.find((n) => n.id === id);
export function nodePath(c: Config, id: string): string {
  const n = node(c, id);
  if (!n) return "Unknown location";
  const p = n.parent ? node(c, n.parent) : undefined;
  return p ? `${p.name} › ${n.name}` : n.name;
}
/** Where units of this Core Type can sit: floors (inside buildings), or zones/blocks. */
export function leaves(c: Config, core: CoreType): LocNode[] {
  const active = c.nodes.filter((n) => n.active);
  if (CORE[core].strategy === "floor") {
    // Buildings in the order the owner added them, then floors bottom-up.
    const order = (id?: string) => c.nodes.findIndex((n) => n.id === id);
    return active.filter((n) => n.kind === "floor" && active.some((b) => b.id === n.parent)).sort((a, b) => order(a.parent) - order(b.parent) || (a.level ?? 0) - (b.level ?? 0));
  }
  const zones = active.filter((n) => n.kind === "zone");
  return zones.flatMap((z) => {
    const blocks = active.filter((b) => b.kind === "block" && b.parent === z.id);
    return blocks.length ? [z, ...blocks] : [z];
  });
}
export const prefixOf = (c: Config, p: PresetSlug) => (c.prefixes[p] ?? preset(p).prefix).toUpperCase();

/** The i-th suggested number for a location. null = this template is manual only. */
export function codeFor(c: Config, core: CoreType, p: PresetSlug, leaf: LocNode, i: number): { local: string; code: string } | null {
  const { template: t, digits: d } = c.numbering[core];
  if (t === "custom") return null;
  const px = prefixOf(c, p);
  if (CORE[core].strategy === "floor") {
    const b = node(c, leaf.parent);
    const L = leaf.level ?? 0;
    // A tower/building code already tells apartments apart (TA-101), so the "A" prefix is dropped there. Dorms keep "D".
    const p2 = b?.code && core !== "DORMITORY" ? "" : px;
    const local = t === "floor" ? p2 + (L === 0 ? `G${pad(i, d)}` : `${L}${pad(i, d)}`) : t === "sequential" ? p2 + pad(i, 3) : p2 + pad(i, d);
    return { local, code: b?.code ? `${b.code}-${local}` : local };
  }
  const zone = leaf.kind === "block" ? node(c, leaf.parent) : leaf;
  const local = t === "sequential" ? px + pad(i, 3) : px + pad(i, d);
  return { local, code: t === "zone" && zone?.code ? `${zone.code}-${local}` : local };
}
export const bedCodes = (code: string, n: number, style?: Category["bedStyle"]): Bed[] =>
  Array.from({ length: Math.max(0, n) }, (_, j) => ({ code: `${code}-B${pad(j + 1, 2)}`, label: style === "bunk" ? `Bunk ${Math.floor(j / 2) + 1} · ${j % 2 ? "Upper" : "Lower"}` : `Bed ${j + 1}` }));
export const sameCode = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();
export const unitRate = (u: Unit, cat?: Category) => u.rate ?? cat?.baseRate ?? 0;

/** Problems that stop a unit from being published (video is never one of them). */
export function publishIssues(s: RoomsState, u: Unit): string[] {
  const cat = s.categories.find((c) => c.id === u.category);
  const out: string[] = [];
  if (!cat) out.push("Category is missing");
  if (!s.config.enabled.includes(u.core)) out.push(`${CORE[u.core].label} is not turned on in setup`);
  const n = node(s.config, u.node);
  if (!n || !n.active) out.push("Location no longer exists");
  if (!(unitRate(u, cat) > 0)) out.push("Price is missing");
  if (cat && cat.maxAdults < 1) out.push("Occupancy is missing");
  if (u.core === "DORMITORY" && !(u.beds?.length)) out.push("No beds");
  if (s.units.some((o) => o.id !== u.id && sameCode(o.code, u.code))) out.push(`Code ${u.code} is used twice`);
  return out;
}

// ---------------- seed from the demo hotel ----------------
const KIND_CORE: Record<RoomCategory["kind"], CoreType> = { room: "ROOM", suite: "ROOM", villa: "VILLA", cottage: "COTTAGE", apartment: "APARTMENT", dorm: "DORMITORY" };
function presetFor(r: RoomCategory): PresetSlug {
  const n = r.name.toLowerCase();
  if (r.kind === "cottage") return n.includes("bungalow") ? "bungalow" : n.includes("cabin") ? "cabin" : "cottage";
  return ({ room: "room", suite: "room", villa: "villa", apartment: "apartment", dorm: "dormitory" } as const)[r.kind];
}
export function seed(h: Hotel): RoomsState {
  const c: Config = { ...emptyConfig(), configured: true, version: 1, savedAt: "2026-11-01T10:00" };
  const cats: Category[] = [];
  const units: Unit[] = [];
  const at = "2026-11-01T10:00";
  const cores = [...new Set(h.rooms.map((r) => KIND_CORE[r.kind]))];
  c.enabled = CORE_TYPES.filter((t) => cores.includes(t));
  const building: LocNode = { id: "loc-main", kind: "building", name: h.rooms.every((r) => r.kind === "apartment") ? "Tower A" : "Main Building", code: h.rooms.every((r) => r.kind === "apartment") ? "TA" : "", active: true };
  let floor = 0;
  const floors: LocNode[] = [];
  const zones: Record<string, LocNode> = {};
  const zoneFor = (core: CoreType) => {
    const name = core === "VILLA" ? (h.propertyType === "resort" ? "Beach Zone" : "Villa Zone") : core === "COTTAGE" ? "Garden Zone" : "Outdoor Zone";
    return (zones[name] ??= { id: `loc-${name.split(" ")[0].toLowerCase()}`, kind: "zone", name, code: name[0], active: true });
  };
  const counters: Record<string, number> = {};
  for (const r of h.rooms) {
    const core = KIND_CORE[r.kind];
    const p = presetFor(r);
    const dorm = core === "DORMITORY";
    const bedsPer = dorm ? Math.max(1, r.bedrooms ?? 1) : undefined;
    const cat: Category = {
      id: `cat-${r.id}`, name: r.name, core, preset: p, bed: r.bed, maxAdults: r.maxAdults, maxChildren: r.maxChildren, sizeSqft: r.sizeSqft,
      bedrooms: !dorm ? r.bedrooms : undefined, bedsPerRoom: bedsPer, bedStyle: dorm ? (/bunk/i.test(r.bed) ? "bunk" : "single") : undefined,
      occupancy: dorm ? ((r.specs ?? []).some((s) => /women/i.test(s)) ? "female" : "mixed") : undefined, bathroom: dorm ? "shared" : undefined,
      amenities: [...(r.amenities ?? []), ...(r.specs ?? [])].slice(0, 8), baseRate: r.fromPrice, photo: r.photos[0], created: at,
    };
    cats.push(cat);
    const count = dorm ? Math.ceil(r.units / bedsPer!) : r.units;
    if (CORE[core].strategy === "floor") {
      let left = count;
      while (left > 0) {
        floor += 1;
        const f: LocNode = { id: `loc-f${floor}`, kind: "floor", name: `Floor ${floor}`, code: String(floor), parent: building.id, level: floor, active: true };
        floors.push(f);
        const take = Math.min(left, 10);
        for (let i = 1; i <= take; i++) {
          const k = codeFor({ ...c, nodes: [building, f] }, core, p, f, i)!;
          units.push({ id: uid("u"), code: k.code, local: k.local, node: f.id, category: cat.id, core, preset: p, status: "published", video: "inherit", created: at, beds: dorm ? bedCodes(k.code, bedsPer!, cat.bedStyle) : undefined });
        }
        left -= take;
      }
    } else {
      const z = zoneFor(core);
      const px = (c.prefixes[p] ?? preset(p).prefix).toUpperCase();
      for (let i = 0; i < count; i++) {
        counters[px] = (counters[px] ?? 0) + 1;
        const local = `${px}${pad(counters[px], 2)}`;
        units.push({ id: uid("u"), code: local, local, node: z.id, category: cat.id, core, preset: p, status: "published", video: "inherit", created: at });
      }
    }
  }
  c.nodes = [...(floors.length ? [building, ...floors] : []), ...Object.values(zones)];
  return { v: 1, config: c, categories: cats, units, drafts: [], activity: [{ at, text: `Accommodation setup saved for ${h.name} (${propertyTypeOf(h.propertyType).label})` }] };
}

// ---------------- store (one record per property) ----------------
const KEY = (slug: string) => `bingi-rooms-v1-${slug}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; st: RoomsState }>();
const seeds = new Map<string, RoomsState>();
const base = (h: Hotel) => { if (!seeds.has(h.slug)) seeds.set(h.slug, seed(h)); return seeds.get(h.slug)!; };
function read(h: Hotel): RoomsState {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY(h.slug)); } catch {}
  const hit = cache.get(h.slug);
  if (hit && hit.raw === raw) return hit.st;
  let st = base(h);
  if (raw) try {
    const p = JSON.parse(raw);
    if (p && p.v === st.v && p.config && Array.isArray(p.units) && Array.isArray(p.categories)) st = p;
  } catch {}
  cache.set(h.slug, { raw, st });
  return st;
}
function write(h: Hotel, st: RoomsState) {
  const raw = JSON.stringify(st);
  try { localStorage.setItem(KEY(h.slug), raw); } catch {}
  cache.set(h.slug, { raw, st });
  listeners.forEach((l) => l());
}
const sub = (l: () => void) => {
  listeners.add(l);
  const s = (e: StorageEvent) => { if (e.key?.startsWith("bingi-rooms-v1-")) l(); };
  window.addEventListener("storage", s);
  return () => { listeners.delete(l); window.removeEventListener("storage", s); };
};

export type CreateResult = { ok: true; ids: string[] } | { ok: false; conflicts: string[] };

export function useRooms(h: Hotel) {
  const st = useSyncExternalStore(sub, () => read(h), () => base(h));
  const update = useCallback((fn: (s: RoomsState) => void, log?: string) => {
    const next = structuredClone(read(h));
    fn(next);
    if (log) next.activity.unshift({ at: nowStamp(), text: log });
    next.activity = next.activity.slice(0, 50);
    write(h, next);
  }, [h]);

  /** All-or-nothing: re-checks every code against the latest saved data (another staff member may have created it). */
  const createUnits = useCallback((picks: Pick[], cat: Category, status: Unit["status"], over: Record<string, { rate?: number; video?: Unit["video"]; videoUrl?: string; note?: string }> = {}): CreateResult => {
    const now = read(h);
    const conflicts: string[] = [];
    const seen = new Set<string>();
    for (const p of picks) {
      const k = p.code.trim().toUpperCase();
      if (seen.has(k)) conflicts.push(`${p.code} is selected twice`);
      seen.add(k);
      const ex = now.units.find((u) => sameCode(u.code, p.code));
      if (ex) conflicts.push(`${p.code} already exists (${ex.status === "draft" ? "draft" : "published"})`);
      if (!node(now.config, p.node)?.active) conflicts.push(`${p.code}: location no longer exists`);
    }
    if (!picks.length) conflicts.push("No units selected");
    if (conflicts.length) return { ok: false, conflicts };
    const ids: string[] = [];
    update((s) => {
      if (!s.categories.some((c) => c.id === cat.id)) s.categories.push(cat);
      for (const p of picks) {
        const o = over[p.code] ?? {};
        const id = uid("u");
        ids.push(id);
        s.units.push({
          id, code: p.code.toUpperCase(), local: p.local.toUpperCase(), node: p.node, category: cat.id, core: cat.core, preset: cat.preset, status,
          rate: o.rate, video: o.video ?? "inherit", videoUrl: o.videoUrl, note: o.note, created: nowStamp(),
          beds: cat.core === "DORMITORY" ? bedCodes(p.code.toUpperCase(), cat.bedsPerRoom ?? 0, cat.bedStyle) : undefined,
        });
      }
    }, `${picks.length} ${picks.length === 1 ? "unit" : "units"} ${status === "published" ? "published" : "created as draft"} · ${cat.name} (${picks.map((p) => p.code.toUpperCase()).slice(0, 6).join(", ")}${picks.length > 6 ? "…" : ""})`);
    return { ok: true, ids };
  }, [h, update]);

  const reset = useCallback(() => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); }, [h]);
  const startFresh = useCallback(() => {
    write(h, { v: 1, config: emptyConfig(), categories: [], units: [], drafts: [], activity: [{ at: nowStamp(), text: "Demo: accommodation setup cleared" }] });
  }, [h]);
  return { st, update, createUnits, reset, startFresh };
}
export { uid };
