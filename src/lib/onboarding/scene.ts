// Live property drawing (22 Nov 2026): turns the setup answers (onboarding v8 Draft — the same answers the HMS setup uses)
// into a laid-out scene: buildings with their floors, ground and basements; zones/blocks as plots with the chosen kind inside.
// Pure data + layout, no React — the Remotion scene (components/rooms/property-scene.tsx) only draws what this returns.
import type { Draft } from "./store";
import { BUILDINGS } from "./rooms-easy";
import { floorsOf, isZoneCore, zoneName, kindName } from "./rooms-v8";

export type UnitKind = "cottage" | "villa" | "bungalow" | "cabin" | "treehouse" | "tent" | "houseboat" | "holiday" | "hut";
export type BuildingStyle = "hotel" | "apartment" | "capsule";

export type SceneModel = {
  buildings: { key: string; name: string; top: number; ground: boolean; basements: number; style: BuildingStyle }[];
  levelWord: "floor" | "level";
  zones: { key: string; name: string }[];
  units: UnitKind[];
  /** Houseboats float: their plots are water. */
  water: boolean;
};

const PRESET_UNIT: Record<string, UnitKind> = { bungalow: "bungalow", cabin: "cabin", treehouse: "treehouse", glamping: "tent", houseboat: "houseboat", "holiday-home": "holiday" };

export function sceneModel(d: Draft): SceneModel {
  const custom = d.place.custom;
  const floorKinds = d.stay.filter((s) => !isZoneCore(s, d));
  const zoneKinds = d.stay.filter((s) => isZoneCore(s, d));
  const style: BuildingStyle = custom?.preset === "capsule" && floorKinds.includes("OTHER") && floorKinds.length === 1 ? "capsule"
    : floorKinds.length && floorKinds.every((k) => k === "APARTMENT") ? "apartment" : "hotel";
  const bs = floorKinds.length ? (d.buildings.length ? d.buildings : ["main"]) : [];
  const units: UnitKind[] = zoneKinds.map((k) => (k === "COTTAGE" ? "cottage" : k === "VILLA" ? "villa" : PRESET_UNIT[custom?.preset ?? ""] ?? (custom?.closest === "VILLA" ? "villa" : custom?.closest === "COTTAGE" ? "cottage" : "hut")));
  return {
    buildings: bs.map((b) => ({
      key: b, name: d.place.bNames?.[b]?.trim() || (BUILDINGS.find((x) => x.id === b) ?? BUILDINGS[0]).en,
      top: floorsOf(d, b), ground: d.floors.includes(0), basements: d.place.basements, style,
    })),
    levelWord: d.place.floorStyle,
    zones: zoneKinds.length ? Array.from({ length: d.place.zoneCount }, (_, i) => ({ key: `z${i + 1}`, name: zoneName(d, i + 1, false) })) : [],
    units,
    water: units.length > 0 && units.every((u) => u === "houseboat"),
  };
}

/** One sentence for screen readers. */
export function sceneLabel(d: Draft, m: SceneModel) {
  const parts: string[] = [];
  for (const b of m.buildings) parts.push(`${b.name}: ${b.top} ${m.levelWord === "level" ? "level" : "floor"}${b.top === 1 ? "" : "s"}${b.ground ? " + ground" : ""}${b.basements ? ` + ${b.basements} basement${b.basements === 1 ? "" : "s"}` : ""}`);
  if (m.zones.length) parts.push(`${m.zones.length} ${d.place.zoneStyle === "block" ? "block" : "zone"}${m.zones.length === 1 ? "" : "s"} (${m.zones.map((z) => z.name).join(", ")}) with ${d.stay.filter((s) => isZoneCore(s, d)).map((s) => kindName(d, s, false).toLowerCase()).join(" and ")}`);
  return parts.length ? `Drawing of your property — ${parts.join("; ")}` : "Drawing of your property — pick what you rent";
}

// ---------------- Layout (composition units: 420 × 460 — about 1:1 with the side column, so labels stay readable) ----------------
export const W = 420, H = 460;

export type FloorBox = { key: string; L: number; x: number; y: number; w: number; h: number; at: number; label: string };
export type BuildingBox = { key: string; name: string; style: BuildingStyle; x: number; w: number; roofY: number; floors: FloorBox[]; nameAt: number };
export type PlotBox = { key: string; name: string; x: number; y: number; w: number; h: number; at: number; units: { key: string; kind: UnitKind; cx: number; base: number; size: number; at: number }[] };
export type SceneLayout = { groundY: number; buildings: BuildingBox[]; plots: PlotBox[]; water: boolean; empty: boolean; duration: number; order: { key: string; at: number }[] };

const STEP_FLOOR = 3, STEP_UNIT = 3, STEP_PLOT = 5;

export function layoutScene(m: SceneModel): SceneLayout {
  const hasB = m.buildings.length > 0, hasZ = m.zones.length > 0;
  const maxBase = hasB ? Math.max(0, ...m.buildings.map((b) => b.basements)) : 0;
  // Sky part: buildings get ~55% when zones share the scene, the full height otherwise.
  const zoneRows = hasZ ? Math.ceil(m.zones.length / Math.min(m.zones.length, 3)) : 0;
  const baseH = maxBase ? Math.min(22, 70 / maxBase) : 0;
  const groundY = !hasB ? 120 : hasZ ? Math.round(Math.max(200, 300 - (zoneRows - 1) * 34 - maxBase * baseH)) : Math.round(H - 30 - maxBase * baseH);
  const order: { key: string; at: number }[] = [];
  let t = 6;
  const buildings: BuildingBox[] = [];
  if (hasB) {
    const n = m.buildings.length;
    const left = 44, right = W - 22, gap = n > 3 ? 12 : 22;
    const bw = Math.min(hasZ ? 150 : 180, (right - left - gap * (n - 1)) / n);
    const span = bw * n + gap * (n - 1);
    const x0 = left + (right - left - span) / 2;
    const stack = Math.max(...m.buildings.map((b) => b.top + (b.ground ? 1 : 0)));
    const fh = Math.max(7, Math.min(hasZ ? 32 : 46, (groundY - 62) / stack));
    m.buildings.forEach((b, i) => {
      const x = x0 + i * (bw + gap);
      const floors: FloorBox[] = [];
      for (let k = b.basements; k >= 1; k--) { floors.push({ key: `${b.key}-B${k}`, L: -k, x, y: groundY + (k - 1) * baseH, w: bw, h: baseH, at: t, label: `B${k}` }); order.push({ key: `${b.key}-B${k}`, at: t }); t += STEP_FLOOR; }
      let y = groundY;
      const levels = [...(b.ground ? [0] : []), ...Array.from({ length: b.top }, (_, j) => j + 1)];
      for (const L of levels) { y -= fh; floors.push({ key: `${b.key}-L${L}`, L, x, y, w: bw, h: fh, at: t, label: L === 0 ? "G" : `${m.levelWord === "level" ? "L" : "F"}${L}` }); order.push({ key: `${b.key}-L${L}`, at: t }); t += STEP_FLOOR; }
      buildings.push({ key: b.key, name: b.name, style: b.style, x, w: bw, roofY: y, floors, nameAt: t });
      order.push({ key: `${b.key}-name:${b.name}`, at: t });
      t += 4;
    });
  }
  const plots: PlotBox[] = [];
  if (hasZ) {
    const z = m.zones.length;
    const top = hasB ? groundY + maxBase * baseH + 16 : groundY + 14, bottom = H - 12, left = 14, right = W - 14;
    const cols = z <= 2 ? z : z <= 6 ? 3 : 4;
    const rows = Math.ceil(z / cols);
    const gx = 10, gy = 10;
    const pw = (right - left - gx * (cols - 1)) / cols;
    const ph = Math.min(hasB ? 150 : 190, (bottom - top - gy * (rows - 1)) / rows);
    const total = rows * ph + (rows - 1) * gy;
    const y0 = top + Math.max(0, (bottom - top - total) / 2);
    m.zones.forEach((zn, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const inRow = Math.min(cols, z - r * cols);
      const rowSpan = inRow * pw + (inRow - 1) * gx;
      const x = left + (right - left - rowSpan) / 2 + c * (pw + gx);
      const y = y0 + r * (ph + gy);
      const plot: PlotBox = { key: `${zn.key}:${zn.name}`, name: zn.name, x, y, w: pw, h: ph, at: t, units: [] };
      order.push({ key: plot.key, at: t });
      t += STEP_PLOT;
      // Every kind in the zones shows up in each plot (2–3 small houses read as "a zone of cottages").
      const kinds = Math.max(1, m.units.length);
      const want = Math.min(4, Math.max(2, kinds));
      const size = Math.max(18, Math.min(ph - 30, (pw - 12) / (want * 1.3), 84));
      const count = Math.max(1, Math.min(want, Math.floor((pw - 10) / (size * 1.25))));
      for (let k = 0; k < count; k++) {
        const kind = m.units[(k + i) % kinds] ?? "hut";
        const cx = x + (pw / (count + 1)) * (k + 1);
        plot.units.push({ key: `${plot.key}-u${k}-${kind}`, kind, cx, base: y + ph - 9, size, at: t });
        order.push({ key: `${plot.key}-u${k}-${kind}`, at: t });
        t += STEP_UNIT;
      }
      plots.push(plot);
    });
  }
  return { groundY, buildings, plots, water: m.water, empty: !hasB && !hasZ, duration: Math.max(30, t + 26), order };
}
