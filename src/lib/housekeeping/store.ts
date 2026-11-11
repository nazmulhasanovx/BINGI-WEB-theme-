"use client";
// Housekeeping — room readiness (Dirty → Cleaning → Clean → Inspected) and cleaning tasks, per property.
// Kept separate from booking status, payment status and out-of-order (maintenance). Prototype: browser storage.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Hotel } from "@/lib/types";
import { TODAY, useRooms } from "@/lib/rooms/store";
import { useStays } from "@/lib/bookings/store";
import { hash } from "@/lib/bookings/demo";
import { useHrm } from "@/lib/hrm/store";

export type Clean = "Dirty" | "Cleaning" | "Clean" | "Inspected";
export const CLEAN: Clean[] = ["Dirty", "Cleaning", "Clean", "Inspected"];
export type TaskKind = "Check-out clean" | "Stay-over" | "Deep clean" | "Inspection" | "Fix";
export const KINDS: TaskKind[] = ["Check-out clean", "Stay-over", "Deep clean", "Inspection", "Fix"];
export type Task = { id: string; room: string; kind: TaskKind; status: "Open" | "Doing" | "Done"; who?: string; at: string; done?: string; note?: string; ref?: string };
type RoomHK = { s: Clean; at: string; by: string };
type State = { sig: string; rooms: Record<string, RoomHK>; tasks: Task[]; log: { at: string; text: string; by: string }[] };

const KEY = (slug: string) => `bingi.hk.v1.${slug}`;
const EMPTY: State = { sig: "", rooms: {}, tasks: [], log: [] };
const cache = new Map<string, State>();
const listeners = new Set<() => void>();
const ME = "Front desk";
const nowHm = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const stamp = () => `${TODAY}T${nowHm()}`;
const CLEAN_KINDS: TaskKind[] = ["Check-out clean", "Stay-over", "Deep clean"];

function seed(units: string[], inHouse: string[], leaving: string[]): State {
  const rooms: Record<string, RoomHK> = {};
  const tasks: Task[] = [];
  const at = `${TODAY}T08:00`;
  const vacant = units.filter((u) => !inHouse.includes(u));
  for (const u of units) rooms[u] = { s: "Inspected", at, by: "Supervisor" };
  // Last night's check-outs not cleaned yet, one being cleaned, in-house rooms cleaned this morning.
  vacant.filter((u) => hash(u) % 7 === 0).slice(0, 3).forEach((u, i) => { rooms[u] = { s: "Dirty", at: `${TODAY}T07:${10 + i}`, by: "Front desk" }; tasks.push({ id: `t${i}`, room: u, kind: "Check-out clean", status: "Open", at: `${TODAY}T07:${10 + i}` }); });
  const c = vacant.find((u) => hash(u) % 7 === 3 && rooms[u].s === "Inspected");
  if (c) { rooms[c] = { s: "Cleaning", at: `${TODAY}T09:05`, by: "Housekeeping" }; tasks.push({ id: "t9", room: c, kind: "Check-out clean", status: "Doing", at: `${TODAY}T08:40`, who: "Rakib Hossain" }); }
  for (const u of inHouse) rooms[u] = { s: "Clean", at: `${TODAY}T10:00`, by: "Housekeeping" };
  inHouse.filter((u) => !leaving.includes(u)).slice(0, 4).forEach((u, i) => tasks.push({ id: `s${i}`, room: u, kind: "Stay-over", status: "Open", at }));
  return { sig: "", rooms, tasks, log: [] };
}

function read(slug: string, mk: () => State): State {
  const c = cache.get(slug); if (c) return c;
  let s: State | null = null;
  try { const raw = localStorage.getItem(KEY(slug)); if (raw) s = { ...EMPTY, ...JSON.parse(raw) }; } catch {}
  if (!s) s = { ...mk(), sig: "seed" };
  cache.set(slug, s);
  return s;
}
function write(slug: string, s: State) {
  cache.set(slug, s);
  try { localStorage.setItem(KEY(slug), JSON.stringify(s)); } catch {}
  listeners.forEach((l) => l());
}
const sub = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };

export function useHousekeeping(h: Hotel) {
  const { st: rooms } = useRooms(h);
  const stays = useStays(h);
  const hrm = useHrm();
  const units = useMemo(() => rooms.units.filter((u) => u.status === "published").map((u) => u.code), [rooms.units]);
  const ready = stays.length > 0 || units.length === 0;
  const mk = useCallback(() => {
    const inH = stays.filter((s) => s.status === "Checked in").map((s) => s.room).filter(Boolean);
    const lv = stays.filter((s) => s.status === "Checked in" && s.to <= TODAY).map((s) => s.room);
    return seed(units, inH, lv);
  }, [units, stays]);
  const st = useSyncExternalStore(sub, () => (ready ? read(h.slug, mk) : EMPTY), () => EMPTY);
  const save = useCallback((fn: (s: State) => void) => { const n = structuredClone(read(h.slug, mk)); fn(n); write(h.slug, n); }, [h.slug, mk]);
  const log = (s: State, text: string) => { s.log.unshift({ at: stamp(), text, by: ME }); s.log = s.log.slice(0, 200); };
  const stateOf = useCallback((room: string): Clean => st.rooms[room]?.s ?? "Inspected", [st]);
  const isReady = useCallback((room: string) => { const s = stateOf(room); return s === "Clean" || s === "Inspected"; }, [stateOf]);
  const staff = useMemo(() => hrm.st.employees.filter((e) => e.dept === "Housekeeping" && e.status === "active").map((e) => e.name), [hrm.st.employees]);

  const setClean = useCallback((room: string, s: Clean, by = ME) => save((x) => {
    x.rooms[room] = { s, at: stamp(), by };
    if (s === "Clean" || s === "Inspected") for (const t of x.tasks) if (t.room === room && t.status !== "Done" && (CLEAN_KINDS.includes(t.kind) || (s === "Inspected" && t.kind === "Inspection"))) { t.status = "Done"; t.done = stamp(); }
    log(x, `Room ${room} → ${s}`);
  }), [save]);
  const addTask = useCallback((room: string, kind: TaskKind, o: { who?: string; note?: string; ref?: string } = {}) => save((x) => {
    x.tasks.unshift({ id: `t${Date.now().toString(36)}${x.tasks.length}`, room, kind, status: "Open", at: stamp(), ...o });
    log(x, `${kind} · Room ${room}${o.who ? ` → ${o.who}` : ""}`);
  }), [save]);
  const assign = useCallback((id: string, who: string) => save((x) => { const t = x.tasks.find((y) => y.id === id); if (t) { t.who = who || undefined; log(x, `${t.kind} · Room ${t.room} → ${who || "unassigned"}`); } }), [save]);
  const start = useCallback((id: string) => save((x) => {
    const t = x.tasks.find((y) => y.id === id); if (!t) return;
    t.status = "Doing"; if (CLEAN_KINDS.includes(t.kind)) x.rooms[t.room] = { s: "Cleaning", at: stamp(), by: t.who ?? ME };
    log(x, `${t.kind} started · Room ${t.room}`);
  }), [save]);
  const finish = useCallback((id: string) => save((x) => {
    const t = x.tasks.find((y) => y.id === id); if (!t) return;
    t.status = "Done"; t.done = stamp();
    if (CLEAN_KINDS.includes(t.kind)) x.rooms[t.room] = { s: "Clean", at: stamp(), by: t.who ?? ME };
    if (t.kind === "Inspection") x.rooms[t.room] = { s: "Inspected", at: stamp(), by: t.who ?? ME };
    log(x, `${t.kind} done · Room ${t.room}`);
  }), [save]);
  /** Guest left (check-out or room move): room becomes Dirty and a cleaning task opens. */
  const vacated = useCallback((room: string, ref?: string) => save((x) => {
    if (!room) return;
    x.rooms[room] = { s: "Dirty", at: stamp(), by: ME };
    if (!x.tasks.some((t) => t.room === room && t.status !== "Done" && t.kind === "Check-out clean")) x.tasks.unshift({ id: `t${Date.now().toString(36)}${x.tasks.length}`, room, kind: "Check-out clean", status: "Open", at: stamp(), ref });
    for (const t of x.tasks) if (t.room === room && t.kind === "Stay-over" && t.status !== "Done") { t.status = "Done"; t.done = stamp(); }
    log(x, `Room ${room} vacated${ref ? ` (${ref})` : ""} → Dirty`);
  }), [save]);
  const reset = useCallback(() => { try { localStorage.removeItem(KEY(h.slug)); } catch {} cache.delete(h.slug); listeners.forEach((l) => l()); }, [h.slug]);
  return { st, ready: st !== EMPTY, units, stateOf, isReady, staff, setClean, addTask, assign, start, finish, vacated, reset };
}
export type HK = ReturnType<typeof useHousekeeping>;
