"use client";
// HMS copy of the onboarding v8 setup answers (property type, what you rent, floors/levels, zones/blocks).
// The same setup screens run on it inside the HMS. Saving turns it into accommodation locations
// (configFrom8) and merges onto the saved setup so every existing room keeps its place.
import { useCallback, useState } from "react";
import type { Hotel } from "@/lib/types";
import { emptyPlace, newDraft, useOnboarding, type Draft } from "@/lib/onboarding/store";
import { BUILDINGS } from "@/lib/onboarding/rooms-easy";
import { FITS, configFrom8, isZoneCore } from "@/lib/onboarding/rooms-v8";
import { isBuilding, isFloor, isZone, type Config, type LocNode, type RoomsState } from "./store";

const KEY = "bingi-hms-setup-v1";
const NEW_TYPE: Record<string, string> = { home: "homestay", cottage: "lodge", villa: "vacation-rental" };

function load(slug: string): Draft | null {
  try { return (JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, Draft>)[slug] ?? null; } catch { return null; }
}
function save(d: Draft) {
  try { const all = JSON.parse(localStorage.getItem(KEY) ?? "{}"); all[d.slug] = d; localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
}

/** The owner's setup answers kept for this property (custom kind name etc.), if any. */
export const savedAnswers = (slug: string) => (typeof window === "undefined" ? null : load(slug));

/** Read the saved setup back into the answers the screens use (for properties set up before v8). */
export function draftFromConfig(h: Hotel, st: RoomsState, vat: number, sc: number): Draft {
  const d = newDraft(0);
  const type = h.propertyCode || NEW_TYPE[h.propertyType] || h.propertyType || "hotel";
  const c = st.config;
  const blds = c.nodes.filter(isBuilding);
  const fl = c.nodes.filter(isFloor);
  const zs = c.nodes.filter(isZone).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  const levels = [...new Set(fl.map((n) => n.level ?? 0))];
  const ids = blds.map((b, i) => BUILDINGS.find((x) => x.code === b.code)?.id ?? BUILDINGS[Math.min(i, BUILDINGS.length - 1)].id);
  return {
    ...d, slug: h.slug, name: h.name, propertyType: type,
    stay: c.configured && c.enabled.length ? [...c.enabled] : [...(FITS[type] ?? ["ROOM"])],
    buildings: blds.length ? ids : ["main"],
    floors: levels.filter((l) => l >= 0).length ? levels.filter((l) => l >= 0) : [1],
    place: {
      ...emptyPlace(),
      floorStyle: fl.some((n) => n.kind === "LEVEL") ? "level" : "floor",
      basements: Math.min(3, Math.max(0, ...levels.filter((l) => l < 0).map((l) => -l))),
      zoneStyle: zs.some((z) => z.code.startsWith("BL")) ? "block" : "zone",
      zoneCount: Math.max(1, zs.length || 2),
      zoneNames: zs.map((z) => z.name),
      bNames: Object.fromEntries(blds.map((b, i) => [ids[i], b.name])),
      bFloors: Object.fromEntries(blds.map((b, i) => [ids[i], Math.max(1, ...fl.filter((f) => f.parent === b.id).map((f) => f.level ?? 0))])),
    },
    policy: { ...d.policy, vat, sc },
  };
}

/**
 * Build the new setup from the answers and keep the ids of matching saved locations
 * (same building by position, same floor level, same zone number), so units stay attached.
 * A saved location that still has rooms is never dropped.
 */
export function mergeSetup(d: Draft, prev: Config, usedNodes: Set<string>): Config {
  const next = configFrom8(d, prev);
  if (!prev.configured) return next;
  const ids = new Map<string, string>();
  const pb = prev.nodes.filter(isBuilding), nb = next.nodes.filter(isBuilding);
  nb.forEach((b, i) => { if (pb[i]) ids.set(b.id, pb[i].id); });
  for (const f of next.nodes.filter(isFloor)) {
    const parent = ids.get(f.parent ?? "") ?? f.parent;
    const hit = prev.nodes.find((p) => isFloor(p) && p.parent === parent && (p.level ?? 0) === (f.level ?? 0));
    if (hit) ids.set(f.id, hit.id);
  }
  const pz = prev.nodes.filter(isZone).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
  next.nodes.filter(isZone).forEach((z, i) => { if (pz[i]) ids.set(z.id, pz[i].id); });
  const byId = new Map(prev.nodes.map((n) => [n.id, n]));
  const nodes: LocNode[] = next.nodes.map((n) => {
    const old = byId.get(ids.get(n.id) ?? "");
    // a matched building keeps its own name and code; a matched floor keeps its name while the naming style is the same
    const keep = old && (isBuilding(n) ? { code: old.code } : isFloor(n) && old.kind === n.kind ? { name: old.name } : {});
    return { ...n, ...keep, id: ids.get(n.id) ?? n.id, parent: n.parent ? ids.get(n.parent) ?? n.parent : undefined };
  });
  const kept = new Set(nodes.map((n) => n.id));
  for (const p of prev.nodes) if (!kept.has(p.id) && (usedNodes.has(p.id) || prev.nodes.some((c) => c.parent === p.id && usedNodes.has(c.id)))) { nodes.push(p); kept.add(p.id); }
  return { ...next, nodes };
}

/** The HMS setup answers for one property: from this browser, else from its onboarding, else read from the saved setup. */
export function useHmsSetup(h: Hotel, st: RoomsState, tax: { vat: number; service: number }) {
  const { st: onb } = useOnboarding();
  const [d, setD] = useState<Draft>(() => {
    const own = load(h.slug);
    if (own) return own;
    const fromOnb = onb.drafts.find((x) => x.slug === h.slug && x.v === 8);
    return fromOnb ? structuredClone(fromOnb) : draftFromConfig(h, st, tax.vat, tax.service);
  });
  const edit = useCallback((fn: (x: Draft) => void) => setD((cur) => { const n = structuredClone(cur); fn(n); save(n); return n; }), []);
  return { d, edit };
}

export const zoneKinds = (d: Draft) => d.stay.some((s) => isZoneCore(s, d));
