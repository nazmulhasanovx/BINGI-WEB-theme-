"use client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Wrench, X } from "lucide-react";
import { TODAY, oooOn, type Unit } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { channelLabel, dm, dow, dueOf, holds, overlaps, paidOf, tk, totalOf, type Booking } from "@/lib/bookings/store";
import { useModeKey } from "@/lib/bookings/mode";
import { useRates } from "@/lib/rates/store";
import { useHousekeeping } from "@/lib/housekeeping/store";
import { useProperty } from "../property";
import { BookingsFrame, card, channelIcon, useBk } from "./ui";

export function CalendarPage() { return <BookingsFrame tab="calendar"><Calendar /></BookingsFrame>; }

/* ---------- stay state: what the front desk must see at a glance (booking status + today's date) ---------- */
type SK = "arriving" | "booked" | "inhouse" | "leaving" | "overdue" | "notarrived" | "hold" | "out";
const skOf = (b: Booking): SK =>
  b.status === "On hold" ? "hold"
  : b.status === "Checked out" ? "out"
  : b.status === "Checked in" ? (b.to < TODAY ? "overdue" : b.to === TODAY ? "leaving" : "inhouse")
  : b.from < TODAY ? "notarrived" : b.from === TODAY ? "arriving" : "booked";
const SKS: { k: SK; label: string; bar: string; chip: string }[] = [
  { k: "inhouse", label: "In house", bar: "border-[#3fa66b] bg-[#d9f2e3] text-[#14532d]", chip: "bg-[#d9f2e3] border-[#3fa66b]" },
  { k: "arriving", label: "Arriving today", bar: "border-[#2f6fed] bg-[#dbe7ff] text-[#173a8a] ring-1 ring-inset ring-[#2f6fed]/30", chip: "bg-[#dbe7ff] border-[#2f6fed]" },
  { k: "leaving", label: "Leaving today", bar: "border-[#e08a1e] bg-[#fdebd3] text-[#7a3e00]", chip: "bg-[#fdebd3] border-[#e08a1e]" },
  { k: "overdue", label: "Checkout overdue", bar: "border-[#d92d20] bg-[#fde3e1] text-[#8f1d14]", chip: "bg-[#fde3e1] border-[#d92d20]" },
  { k: "booked", label: "Booked", bar: "border-[#9db8f2] bg-[#eef3fe] text-[#1e3a8a]", chip: "bg-[#eef3fe] border-[#9db8f2]" },
  { k: "notarrived", label: "Not arrived", bar: "border-dashed border-[#b42318] bg-white text-[#8f1d14]", chip: "bg-white border-dashed border-[#b42318]" },
  { k: "hold", label: "On hold", bar: "border-dashed border-[#e0b65c] bg-[#fdf3d9] text-[#7a4a0b]", chip: "bg-[#fdf3d9] border-dashed border-[#e0b65c]" },
  { k: "out", label: "Checked out", bar: "border-[#d3d8df] bg-[#eef0f3] text-[#4d5664]", chip: "bg-[#eef0f3] border-[#d3d8df]" },
];
const SKM = Object.fromEntries(SKS.map((s) => [s.k, s])) as Record<SK, (typeof SKS)[number]>;
/** A guest who has not checked out still holds the room through tonight, even after the booked check-out date. */
const effTo = (b: Booking) => (b.status === "Checked in" && b.to < TODAY ? addDays(TODAY, 1) : b.to);

type Drag = { code: string; kind: "move" | "end"; x0: number; y0: number; dx: number; dy: number; room: string; moved: boolean };
type Pending = { code: string; unit: string; from: string; to: string };
/** One stay for one guest: every picked room has the same nights, with no gaps. `to` = check-out day. */
type Sel = { rooms: string[]; from: string; to: string };
type PickDrag = { room: string; d0: string; r1: number; d1: string; moved: boolean };

function Calendar() {
  const { bk, guests, open, toast } = useBk();
  const router = useRouter();
  const rates = useRates(useProperty());
  const hk = useHousekeeping(useProperty());
  const { mode, setMode } = useModeKey("bingi.bookings.calendar.mode");
  const details = mode === "details";
  const [drag, setDrag] = useState<Drag | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [perr, setPerr] = useState("");
  const [sel, setSel] = useState<Sel | null>(null);
  const [pick, setPick] = useState<PickDrag | null>(null);
  const [selErr, setSelErr] = useState("");
  const [focus, setFocus] = useState<SK | null>(null);
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const justDragged = useRef(false);
  const [span, setSpan] = useState(14);
  const [start, setStart] = useState(addDays(TODAY, -1));
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width)); ro.observe(el); return () => ro.disconnect(); }, []);
  const minW = span <= 7 ? 112 : span <= 14 ? (details ? 84 : 76) : details ? 58 : 46;
  const W = Math.max(minW, boxW ? Math.floor((boxW - 104) / span) : minW);
  const dates = useMemo(() => Array.from({ length: span }, (_, i) => addDays(start, i)), [start, span]);
  const end = addDays(start, span);
  const live = (b: Booking) => b.status !== "Cancelled" && b.status !== "No-show";
  const inRange = (b: Booking) => live(b) && overlaps({ from: b.from, to: effTo(b) }, start, end);
  const occupies = (b: Booking, d: string) => holds(b) && overlaps({ from: b.from, to: effTo(b) }, d, addDays(d, 1));
  const groups = useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const u of bk.units) m.set(u.category, [...(m.get(u.category) ?? []), u]);
    return [...m.entries()].map(([c, us]) => ({ id: c, name: bk.cats.get(c)?.name ?? "Rooms", units: us.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })) }));
  }, [bk.units, bk.cats]);
  const order = useMemo(() => groups.flatMap((g) => g.units.map((u) => u.code)), [groups]);
  const unassigned = bk.list.filter((b) => holds(b) && !b.unit && inRange(b));
  const name = (b: Booking) => guests.get(b.guestId)?.name ?? "Guest";
  const step = Math.max(7, Math.floor(span / 2));
  const busyAt = (code: string, d: string) => bk.list.some((b) => b.unit === code && occupies(b, d));
  const freeAt = (u: Unit, d: string) => d >= TODAY && !oooOn(u, d, addDays(d, 1)) && !busyAt(u.code, d);
  const freeOn = (catUnits: Unit[], d: string) => catUnits.filter((u) => !oooOn(u, d, addDays(d, 1)) && !busyAt(u.code, d)).length;
  const priceAt = (unit: string) => (d: string) => { const u = bk.unitByCode.get(unit)!; const p = rates.unitPrice(u, d); return rates.deal(u.category, d, p.price, u.id)?.price ?? p.price; };
  const shown = bk.list.filter((b) => b.unit && inRange(b));
  const counts = SKS.map((s) => ({ ...s, n: shown.filter((b) => skOf(b) === s.k).length }));
  const oooN = bk.units.filter((u) => oooOn(u, start, end)).length;
  const dirtyN = bk.units.filter((u) => !hk.isReady(u.code)).length;
  const dueN = shown.filter((b) => dueOf(b) > 0 && b.status !== "Checked out").length;
  const fmt = (p: number) => (W >= 70 ? new Intl.NumberFormat("en-IN").format(p) : `${Math.round(p / 100) / 10}k`);

  /* ---------- booking bar ---------- */
  const bar = (b: Booking) => {
    const sk = skOf(b);
    const to = effTo(b);
    const s = b.from < start ? start : b.from;
    const e = to > end ? end : to;
    const left = ((Date.parse(s) - Date.parse(start)) / 864e5) * W + (b.from >= start ? W / 2 : 0);
    const right = ((Date.parse(e) - Date.parse(start)) / 864e5) * W + (to <= end ? W / 2 : 0);
    const bookedRight = sk === "overdue" ? ((Date.parse(b.to > start ? b.to : start) - Date.parse(start)) / 864e5) * W + (b.to >= start ? W / 2 : 0) : right;
    const due = dueOf(b);
    const width = Math.max(18, right - left - 4 + (drag?.code === b.code && drag.kind === "end" ? drag.dx : 0));
    const dim = focus && focus !== sk;
    const I = channelIcon(b.channel);
    return (
      <button key={b.code} onClick={() => { if (!justDragged.current) open(b.code); }}
        aria-label={`${b.code} ${name(b)}${b.unit ? `, Room ${b.unit}` : ""}, ${dm(b.from)} to ${dm(b.to)}, ${SKM[sk].label}, ${channelLabel(b)}${due > 0 ? `, ${tk(due)} due` : ""}`}
        onPointerEnter={(ev) => setHover({ code: b.code, x: ev.clientX, y: ev.clientY })} onPointerLeave={() => setHover(null)}
        onPointerDown={(ev) => startDrag(ev, b, "move")} onPointerMove={(ev) => { moveDrag(ev); if (!drag) setHover({ code: b.code, x: ev.clientX, y: ev.clientY }); }} onPointerUp={endDrag} onPointerCancel={() => setDrag(null)}
        style={{ left: left + 2, width, transform: drag?.code === b.code && drag.kind === "move" && drag.moved ? `translate(${b.status === "Checked in" ? 0 : drag.dx}px, ${drag.dy}px)` : undefined }}
        className={clsx("absolute top-1.5 bottom-1.5 flex items-center gap-1.5 overflow-hidden rounded-lg border px-2 text-left text-[12.5px] font-semibold shadow-[0_1px_0_rgb(0_0_0/0.04)] hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-hms-ink",
          drag?.code === b.code && drag.moved ? "pointer-events-none z-[5] cursor-grabbing opacity-80 shadow-lg" : "z-[1] transition-[opacity,filter]", b.status !== "Checked out" && "cursor-grab", SKM[sk].bar, dim && "opacity-25")}>
        {sk === "overdue" && <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 bg-[repeating-linear-gradient(135deg,rgb(217_45_32/0.22)_0_5px,transparent_5px_10px)]" style={{ width: Math.max(0, right - bookedRight) }} />}
        {due > 0 && b.status !== "Checked out" && <span className="relative size-1.5 shrink-0 rounded-full bg-[#d97706]" aria-hidden />}
        <I className="relative size-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="relative min-w-0 truncate">{width < 70 ? name(b).split(" ")[0] : name(b)}</span>
        {details && width > 170 && <span className="relative ml-auto shrink-0 font-normal tabular-nums">{due > 0 && b.status !== "Checked out" ? `${tk(due)} due` : b.code}</span>}
        {!details && sk === "overdue" && width > 150 && <span className="relative ml-auto shrink-0 text-[11.5px] font-bold uppercase">Overdue</span>}
        {b.status !== "Checked out" && to <= end && <span aria-hidden onPointerDown={(ev) => startDrag(ev, b, "end")} className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize rounded-r-lg hover:bg-black/10" />}
      </button>
    );
  };

  /* ---------- drag a booking: move room/day, or drag its end to change check-out ---------- */
  const roomAt = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest("[data-room]") as HTMLElement | null)?.dataset.room;
  const startDrag = (e: React.PointerEvent, b: Booking, kind: Drag["kind"]) => {
    if (e.pointerType === "touch" || e.button !== 0 || b.status === "Checked out") return;
    e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setHover(null); setDrag({ code: b.code, kind, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, room: b.unit, moved: false });
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    const moved = drag.moved || Math.abs(dx) > 6 || Math.abs(dy) > 6;
    setDrag({ ...drag, dx, dy, moved, room: drag.kind === "move" ? roomAt(e.clientX, e.clientY) ?? drag.room : drag.room });
  };
  const dropOf = (d: Drag): Pending | null => {
    const b = bk.list.find((x) => x.code === d.code); if (!b) return null;
    const days = Math.round(d.dx / W);
    if (d.kind === "end") { const to = addDays(effTo(b), days); return { code: b.code, unit: b.unit, from: b.from, to: to <= b.from ? addDays(b.from, 1) : to }; }
    const shift = b.status === "Checked in" ? 0 : days;
    return { code: b.code, unit: d.room || b.unit, from: addDays(b.from, shift), to: addDays(b.to, shift) };
  };
  const endDrag = () => {
    if (!drag) return;
    const d = drag; setDrag(null);
    if (!d.moved) return;
    justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0);
    const p = dropOf(d); const b = bk.list.find((x) => x.code === d.code);
    if (!p || !b || !p.unit || (p.unit === b.unit && p.from === b.from && p.to === b.to)) return;
    const l = landing(d); if (l && !l.ok) { toast(`Can't move ${b.code} here · ${l.why}`); return; }
    setPerr(""); setPending(p);
  };
  /** While dragging: where the stay would land and whether it can (same rules as moveStay, checked live). */
  function landing(d: Drag) {
    const p = dropOf(d); const b = bk.list.find((x) => x.code === d.code);
    if (!p || !b || !p.unit) return null;
    const u = bk.unitByCode.get(p.unit);
    const why = b.status === "Checked in" && d.kind === "move" && p.unit === b.unit ? "" // in-house: only the room moves
      : b.status === "Confirmed" && p.from < TODAY ? "Check-in can't be in the past"
      : !u ? "Pick a room" : oooOn(u, p.from, p.to) ? `Room ${p.unit} is out of order`
      : (() => { const c = bk.clash(p.unit, b.status === "Checked in" && TODAY > p.from ? TODAY : p.from, p.to, b.code); return c ? `Taken by ${c.code}` : ""; })();
    return { ...p, ok: !why, why, n: Math.round((Date.parse(p.to) - Date.parse(p.from)) / 864e5) };
  }
  const ghost = drag?.moved ? landing(drag) : null;
  const pb = pending ? bk.list.find((x) => x.code === pending.code) : undefined;
  const confirmMove = () => {
    if (!pending || !pb) return;
    const e = bk.moveStay(pending.code, pending.unit, pending.from, pending.to, priceAt(pending.unit));
    if (e) return setPerr(e);
    if (pb.status === "Checked in" && pb.unit && pb.unit !== pending.unit) hk.vacated(pb.unit, pb.code);
    toast(`${pending.code} → Room ${pending.unit} · ${dm(pending.from)}–${dm(pending.to)}`); setPending(null);
  };
  const newTotal = pending && pb ? (() => { const old = new Map(pb.nights.map((n) => [n.date, n.base])); const f = priceAt(pending.unit); let s0 = 0; for (let d = pending.from; d < pending.to; d = addDays(d, 1)) s0 += old.get(d) ?? f(d); return s0; })() : 0;
  const oldTotal = pb ? pb.nights.reduce((s0, n) => s0 + n.base, 0) : 0;

  /* ---------- select one stay: first night, then last night (all nights between are filled); tap other rooms to add them on the same dates ---------- */
  const nightsOf = (from: string, to: string) => { const o: string[] = []; for (let d = from; d < to; d = addDays(d, 1)) o.push(d); return o; };
  const blockedOn = (room: string, from: string, to: string) => { const u = bk.unitByCode.get(room); if (!u) return from; return nightsOf(from, to).find((d) => !freeAt(u, d)); };
  const tryRange = (rooms: string[], from: string, to: string): string => {
    for (const r of rooms) { const d = blockedOn(r, from, to); if (d) return `Room ${r} is not free on ${dm(d)}. Pick dates around it, or another room.`; }
    return "";
  };
  const apply = (next: Sel | null) => {
    if (!next || !next.rooms.length) { setSel(null); setSelErr(""); return; }
    const e = tryRange(next.rooms, next.from, next.to);
    if (e) { setSelErr(e); return; }
    setSelErr(""); setSel(next);
  };
  const tapNight = (room: string, d: string) => {
    if (!sel) return apply({ rooms: [room], from: d, to: addDays(d, 1) });
    if (!sel.rooms.includes(room)) return apply({ ...sel, rooms: [...sel.rooms, room].sort((a, b) => order.indexOf(a) - order.indexOf(b)) });
    // Same room: tap before = new first night, tap after = new last night, tap inside = stay ends that night.
    if (d < sel.from) return apply({ ...sel, from: d });
    if (d >= sel.to) return apply({ ...sel, to: addDays(d, 1) });
    if (d === sel.from && sel.to === addDays(d, 1)) return apply({ ...sel, rooms: sel.rooms.filter((r) => r !== room) });
    return apply({ ...sel, to: addDays(d, 1) });
  };
  // Drag = the same rule in one move: across days sets the nights, down/up adds the rooms passed over.
  const dragSel = (p: PickDrag): Sel => {
    const from = p.d0 <= p.d1 ? p.d0 : p.d1, to = addDays(p.d0 <= p.d1 ? p.d1 : p.d0, 1);
    const r0 = order.indexOf(p.room); const [ra, rb] = r0 <= p.r1 ? [r0, p.r1] : [p.r1, r0];
    const rooms = order.slice(ra, rb + 1).filter((r) => r === p.room || !blockedOn(r, from, to));
    return { rooms, from, to };
  };
  const view = pick && pick.moved ? dragSel(pick) : sel;
  const inSel = (room: string, d: string) => !!view && view.rooms.includes(room) && d >= view.from && d < view.to;
  useEffect(() => {
    if (!pick) return;
    const up = () => { const p = pick; setPick(null); if (!p.moved) return tapNight(p.room, p.d0); justDragged.current = true; setTimeout(() => { justDragged.current = false; }, 0); apply(dragSel(p)); };
    const cancel = () => setPick(null);
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setSel(null); setSelErr(""); setFocus(null); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const startPick = (e: React.PointerEvent, room: string, d: string) => { if (e.button !== 0) return; setPick({ room, d0: d, r1: order.indexOf(room), d1: d, moved: false }); };
  const extendPick = (room: string, d: string) => { if (pick) { const r1 = order.indexOf(room); if (r1 !== pick.r1 || d !== pick.d1) setPick({ ...pick, r1, d1: d, moved: true }); } };

  const nights = sel ? nightsOf(sel.from, sel.to).length : 0;
  const lines = sel ? sel.rooms.map((r) => { const f = priceAt(r); return { room: r, total: nightsOf(sel.from, sel.to).reduce((t, d) => t + f(d), 0) }; }) : [];
  const selTotal = lines.reduce((t, l) => t + l.total, 0);
  const book = (rooms: string[], from: string, to: string) => router.push(`/hms/bookings/new?${rooms.length > 1 ? `rooms=${rooms.map(encodeURIComponent).join(",")}` : `room=${encodeURIComponent(rooms[0])}`}&from=${from}&to=${to}`);

  const hb = hover ? bk.list.find((x) => x.code === hover.code) : undefined;

  return (
    <section className={clsx(card, "relative overflow-hidden")}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hms-line px-3 py-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button onClick={() => setStart(addDays(start, -step))} aria-label="Earlier dates" className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setStart(addDays(TODAY, -1))} className="h-9 rounded-lg border border-hms-line bg-white px-3 text-[14px] font-semibold hover:bg-hms-hover">Today</button>
          <button onClick={() => setStart(addDays(start, step))} aria-label="Later dates" className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><ChevronRight className="size-4" /></button>
        </div>
        <p className="text-[15px] font-bold">{dm(start)} – {dm(addDays(end, -1))}</p>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Days shown" className="flex rounded-lg bg-[#e9edf2] p-1">
            {[7, 14, 30].map((n) => <button key={n} role="radio" aria-checked={span === n} onClick={() => setSpan(n)} className={clsx("rounded-md px-3 py-1 text-[13.5px] font-semibold", span === n ? "bg-white shadow-sm" : "text-[#4d5664]")}>{n} days</button>)}
          </div>
          <div role="radiogroup" aria-label="Calendar detail" className="flex rounded-lg bg-[#e9edf2] p-1">
            {([["easy", "Simple"], ["details", "Details · prices"]] as const).map(([m, l]) => <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={clsx("rounded-md px-3 py-1 text-[13.5px] font-semibold", mode === m ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}
          </div>
        </div>
      </div>

      {/* legend = live counts; tap one to highlight only those stays */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-hms-line bg-[#fbfcfd] px-3 py-2 sm:px-4" role="toolbar" aria-label="Show stays by state">
        {counts.map((c) => (
          <button key={c.k} onClick={() => setFocus(focus === c.k ? null : c.k)} aria-pressed={focus === c.k} disabled={!c.n && focus !== c.k}
            className={clsx("inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-semibold transition", focus === c.k ? "border-hms-ink bg-white shadow-sm" : "border-transparent hover:bg-white", !c.n && "opacity-40")}>
            <span className={clsx("size-3 rounded border", c.chip)} />{c.label}<span className="tabular-nums text-hms-muted">{c.n}</span>
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-hms-line" aria-hidden />
        <span className="inline-flex items-center gap-1.5 px-1 text-[12.5px] text-[#4d5664]"><span className="size-1.5 rounded-full bg-[#d97706]" />Payment due <b className="tabular-nums">{dueN}</b></span>
        <span className="inline-flex items-center gap-1.5 px-1 text-[12.5px] text-[#4d5664]"><span className="hms-hatch size-3 rounded border border-[#e9b949]" />Out of order <b className="tabular-nums">{oooN}</b></span>
        <span className="inline-flex items-center gap-1.5 px-1 text-[12.5px] text-[#4d5664]"><span className="size-2 rounded-full bg-[#d92d20]" />Needs cleaning <b className="tabular-nums">{dirtyN}</b></span>
        {details && <span className="inline-flex items-center gap-1.5 px-1 text-[12.5px] text-[#4d5664]"><span className="font-semibold text-[#16693a]">৳</span>Deal price</span>}
        {focus && <button onClick={() => setFocus(null)} className="ml-auto text-[12.5px] font-semibold text-hms-red hover:underline">Show all</button>}
      </div>

      {pending && pb && (
        <div role="region" aria-label="Confirm move" className="hms-up flex flex-wrap items-center gap-3 border-b border-hms-line bg-[#f5f8ff] px-4 py-3">
          <div className="min-w-0 flex-1 text-[14px]">
            <b>{name(pb)} · {pb.code}</b>
            <p className="text-[13.5px] text-[#3a414c]">{pb.unit !== pending.unit && <>Room {pb.unit || "—"} → <b>{pending.unit}</b> · </>}{(pb.from !== pending.from || pb.to !== pending.to) ? <>{dm(pb.from)}–{dm(pb.to)} → <b>{dm(pending.from)}–{dm(pending.to)}</b></> : <>{dm(pb.from)}–{dm(pb.to)}</>}{newTotal !== oldTotal && <> · room price {tk(oldTotal)} → <b>{tk(newTotal)}</b> <span className="text-hms-muted">before VAT</span></>}</p>
            {perr && <p role="alert" className="mt-1 text-[13px] font-semibold text-[#b42318]">{perr}</p>}
          </div>
          <button onClick={() => { setPending(null); setPerr(""); }} className="h-10 rounded-xl bg-white px-4 text-[14px] font-semibold ring-1 ring-hms-line hover:bg-hms-hover">Cancel</button>
          <button onClick={confirmMove} className="btn-glow h-10 rounded-xl px-4 text-[14px] font-semibold text-white">Confirm move</button>
        </div>
      )}

      <div ref={box} className="overflow-x-auto" role="region" aria-label="Booking calendar" tabIndex={0}>
        <div style={{ width: 104 + span * W }} className="relative select-none">
          {/* header */}
          <div className="sticky top-0 z-[3] flex border-b border-hms-line bg-white">
            <div className="sticky left-0 z-[4] w-[104px] shrink-0 border-r border-hms-line bg-white px-3 py-2 text-[12.5px] font-semibold text-hms-muted">Room</div>
            {dates.map((d) => (
              <div key={d} style={{ width: W }} className={clsx("shrink-0 border-r border-hms-line py-1.5 text-center last:border-r-0", d === TODAY && "bg-hms-coral-soft", (dow(d) === "Fri" || dow(d) === "Sat") && d !== TODAY && "bg-[#fafbfc]")}>
                <p className={clsx("text-[11.5px] font-medium", d === TODAY ? "text-hms-red" : "text-hms-muted")}>{d === TODAY ? "Today" : dow(d)}</p>
                <p className={clsx("text-[14px] font-bold tabular-nums", d === TODAY && "text-hms-red")}>{W >= 60 ? dm(d) : d.slice(8, 10)}</p>
              </div>
            ))}
          </div>

          {unassigned.length > 0 && (
            <div className="flex border-b border-hms-line bg-[#fffaf0]">
              <div className="sticky left-0 z-[2] w-[104px] shrink-0 border-r border-hms-line bg-[#fffaf0] px-3 py-2"><p className="text-[13px] font-bold text-[#8a4b00]">No room</p><p className="text-[11.5px] text-[#8a4b00]">{unassigned.length} booking{unassigned.length > 1 ? "s" : ""}</p></div>
              <div className="relative" style={{ width: span * W, height: Math.max(1, unassigned.length) * 44 }}>
                {unassigned.map((b, i) => <div key={b.code} className="absolute inset-x-0" style={{ top: i * 44, height: 44 }}>{bar(b)}</div>)}
              </div>
            </div>
          )}

          {groups.map((g) => (
            <div key={g.id}>
              <div className="border-b border-hms-line bg-[#f7f8fa]">
                <div className="sticky left-0 z-[2] w-max max-w-[100vw] px-3 py-1.5 text-[13px] font-bold">{g.name} <span className="font-normal text-hms-muted">· {g.units.length} room{g.units.length > 1 ? "s" : ""}</span></div>
              </div>
              <div className="flex border-b border-hms-line bg-[#fbfcfd]">
                <div className="sticky left-0 z-[2] flex w-[104px] shrink-0 items-center border-r border-hms-line bg-[#fbfcfd] px-3 text-[11.5px] font-medium text-hms-muted">{details ? "Price · free" : "Free"}</div>
                {dates.map((d) => {
                  const f = freeOn(g.units, d);
                  const c = rates.catPrice(g.id, d);
                  const deal = c.closed ? null : rates.deal(g.id, d, c.price);
                  const p = deal?.price ?? c.price;
                  return (
                    <div key={d} style={{ width: W }} title={c.closed ? "Closed for sale" : `${tk(p)} per night before VAT & service${deal ? ` · ${deal.c.name}` : ""} · ${f} of ${g.units.length} free`}
                      className={clsx("shrink-0 border-r border-hms-line py-1 text-center leading-tight last:border-r-0", d === TODAY && "bg-hms-coral-soft/40")}>
                      {details && <span className={clsx("block text-[12px] font-semibold tabular-nums", c.closed ? "text-[#b42318]" : deal ? "text-[#16693a]" : f ? "text-hms-ink" : "text-[#4d5664] line-through")}>{c.closed ? "Closed" : fmt(p)}</span>}
                      <span className={clsx("block tabular-nums", details ? "text-[11px]" : "py-0.5 text-[12px] font-semibold", f ? (details ? "text-hms-muted" : "text-[#16693a]") : "font-semibold text-[#b42318]")}>{f ? `${f} free` : "Full"}</span>
                    </div>
                  );
                })}
              </div>
              {g.units.map((u) => {
                const ready = hk.isReady(u.code);
                return (
                  <div key={u.code} className="flex border-b border-hms-line last:border-b-0">
                    <div className="sticky left-0 z-[2] flex w-[104px] shrink-0 items-center gap-1.5 border-r border-hms-line bg-white px-3 py-2">
                      <span className="text-[14.5px] font-bold">{u.code}</span>
                      {!ready && <span title={`Housekeeping: ${hk.stateOf(u.code)}`} className={clsx("size-2 rounded-full", hk.stateOf(u.code) === "Dirty" ? "bg-[#d92d20]" : "bg-[#d97706]")}><span className="sr-only">{hk.stateOf(u.code)}</span></span>}
                      {u.ooo && oooOn(u, start, end) && <span title={`Out of order · ${u.ooo.reason}${u.ooo.until ? ` until ${dm(u.ooo.until)}` : ""}`} className="text-[#b26a00]"><Wrench className="size-3.5" aria-label="Out of order" /></span>}
                    </div>
                    <div data-room={u.code} className={clsx("relative flex", drag?.moved && drag.kind === "move" && drag.room === u.code && "bg-[#eef3ff] outline-2 -outline-offset-2 outline-[#7aa2f7]")} style={{ width: span * W, height: 44 }}>
                      {dates.map((d) => {
                        const off = oooOn(u, d, addDays(d, 1));
                        const can = freeAt(u, d);
                        const on = inSel(u.code, d);
                        const cls = clsx("h-full shrink-0 border-r border-hms-line last:border-r-0", off && "hms-hatch", d === TODAY && "bg-hms-coral-soft/40", d < TODAY && "bg-[#fafbfc]", can && !on && "hover:bg-[#f0f4ff]", on && "!bg-[#e6eeff]");
                        if (!can) return <div key={d} style={{ width: W }} className={cls} onPointerEnter={() => extendPick(u.code, d)} />;
                        const p = details ? priceAt(u.code)(d) : 0;
                        // Morning of a check-out day: the left half is under the leaving guest's bar, so the price sits on the right.
                        const half = details && bk.list.some((b) => b.unit === u.code && inRange(b) && effTo(b) === d);
                        const dl = details ? rates.deal(u.category, d, rates.unitPrice(u, d).price, u.id) : null;
                        return (
                          <button key={d} tabIndex={-1} aria-pressed={on} aria-label={`Room ${u.code}, ${dm(d)}${details ? `, ${tk(p)}` : ""}, ${on ? "selected" : "free"}`}
                            onPointerDown={(e) => startPick(e, u.code, d)} onPointerEnter={() => extendPick(u.code, d)}
                            style={{ width: W }} className={clsx(cls, "relative", half ? "pr-1.5 text-right" : "text-center")}>
                            {details && <span className={clsx("pointer-events-none tabular-nums", half ? "text-[10.5px]" : "text-[11.5px]", dl ? "font-semibold text-[#16693a]" : on ? "font-semibold text-[#173a8a]" : "text-[#8a929e]")}>{half ? `${Math.round(p / 100) / 10}k` : fmt(p)}</span>}
                          </button>
                        );
                      })}
                      {view && view.rooms.includes(u.code) && view.from < end && view.to > start && (() => {
                        const f = view.from < start ? start : view.from, t = view.to > end ? end : view.to;
                        const n = nightsOf(view.from, view.to).length;
                        return <span aria-hidden className="pointer-events-none absolute inset-y-1 z-[2] flex items-center justify-end rounded-lg border-2 border-[#2f6fed] bg-[#2f6fed]/[0.06] px-2" style={{ left: ((Date.parse(f) - Date.parse(start)) / 864e5) * W + 1, width: ((Date.parse(t) - Date.parse(f)) / 864e5) * W - 2 }}>{W * n > 90 && <span className="rounded bg-[#2f6fed] px-1.5 text-[11px] font-bold text-white">{n} night{n > 1 ? "s" : ""}</span>}</span>;
                      })()}
                      {ghost && ghost.unit === u.code && ghost.from < end && ghost.to > start && (() => {
                        const f = ghost.from < start ? start : ghost.from, t = ghost.to > end ? end : ghost.to;
                        return <span aria-hidden className={clsx("pointer-events-none absolute inset-y-1 z-[3] rounded-lg border-2 border-dashed", ghost.ok ? "border-[#16a34a] bg-[#16a34a]/10 text-[#14632f]" : "border-[#d92d20] bg-[#d92d20]/10 text-[#a3302a]")}
                          style={{ left: ((Date.parse(f) - Date.parse(start)) / 864e5) * W + (ghost.from >= start ? W / 2 : 0) + 2, width: Math.max(24, ((Date.parse(t) - Date.parse(f)) / 864e5) * W - 4) }}>
                        </span>;
                      })()}
                      {bk.list.filter((b) => b.unit === u.code && inRange(b)).map(bar)}
                      {u.ooo && oooOn(u, start, end) && <span style={{ left: Math.max(0, (Date.parse(u.ooo.since.slice(0, 10) > start ? u.ooo.since.slice(0, 10) : start) - Date.parse(start)) / 864e5) * W + 8 }} className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded bg-white/90 px-1.5 text-[12px] font-semibold text-[#8a4b00]">Out of order · {u.ooo.reason}{u.ooo.until ? ` → ${dm(u.ooo.until)}` : ""}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* selection tray: one stay, same nights for every room */}
      {sel || selErr ? (
        <div role="region" aria-label="Selected stay" className="hms-up fixed bottom-4 left-1/2 z-40 flex w-[min(1080px,calc(100vw-2rem))] -translate-x-1/2 flex-wrap items-center gap-3 rounded-2xl border border-hms-line bg-white px-4 py-3 shadow-[0_12px_40px_rgb(16_24_40/0.18)]">
          <div className="min-w-0 flex-1">
            {sel ? (
              <>
                <p className="text-[14.5px] font-bold">{sel.rooms.length} room{sel.rooms.length > 1 ? "s" : ""} · {dm(sel.from)} → {dm(sel.to)} · {nights} night{nights > 1 ? "s" : ""} · <span className="tabular-nums">{tk(selTotal)}</span> <span className="text-[12.5px] font-normal text-hms-muted">before VAT &amp; service</span></p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {lines.map((l) => (
                    <span key={l.room} className="inline-flex items-center gap-1.5 rounded-full bg-[#eef3fe] px-2.5 py-1 text-[12.5px] font-semibold text-[#1e3a8a]">
                      Room {l.room} · <span className="tabular-nums">{tk(l.total)}</span>
                      <button aria-label={`Remove room ${l.room}`} onClick={() => apply({ ...sel, rooms: sel.rooms.filter((r) => r !== l.room) })} className="opacity-60 hover:opacity-100"><X className="size-3.5" /></button>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[12.5px] text-hms-muted">Tap another night in a picked room to change the dates · tap another room to add it on the same dates.</p>
              </>
            ) : <p className="text-[14px] font-semibold">Pick a free night to start.</p>}
            {selErr && <p role="alert" className="mt-1 text-[13px] font-semibold text-[#b42318]">{selErr}</p>}
          </div>
          <button onClick={() => { setSel(null); setSelErr(""); }} className="h-10 rounded-xl bg-white px-4 text-[14px] font-semibold ring-1 ring-hms-line hover:bg-hms-hover">Clear</button>
          {sel && <button onClick={() => book(sel.rooms, sel.from, sel.to)} className="btn-glow h-10 rounded-xl px-4 text-[14px] font-semibold text-white">Book {sel.rooms.length > 1 ? `${sel.rooms.length} rooms` : `room ${sel.rooms[0]}`} · {nights} night{nights > 1 ? "s" : ""}</button>}
        </div>
      ) : (
        <p className="border-t border-hms-line px-4 py-2.5 text-[12.5px] text-hms-muted">To book: tap the first night, then the last night — every night between is included. Tap other rooms to add them on the same dates, then <b>Book</b>. Or drag across days and rooms. Drag a booking to move it; drag its right edge to change check-out. Prices are per night before VAT &amp; service.</p>
      )}

      {/* hover card */}
      {ghost && drag && <div role="status" className={clsx("pointer-events-none fixed z-50 rounded-lg px-2.5 py-1.5 text-[12.5px] font-bold text-white shadow-lg", ghost.ok ? "bg-[#14632f]" : "bg-[#b42318]")} style={{ left: drag.x0 + drag.dx + 18, top: drag.y0 + drag.dy - 40 }}>
        {ghost.ok ? `Room ${ghost.unit} · ${dm(ghost.from)} – ${dm(ghost.to)} · ${ghost.n} night${ghost.n > 1 ? "s" : ""}` : `Can't drop · ${ghost.why}`}
      </div>}
      {hb && hover && !drag && (
        <div role="tooltip" className="pointer-events-none fixed z-50 w-64 rounded-xl border border-hms-line bg-white p-3 text-[13px] shadow-xl" style={{ left: Math.min(hover.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1600) - 270), top: hover.y + 16 }}>
          <div className="flex items-center gap-2"><span className={clsx("size-3 rounded border", SKM[skOf(hb)].chip)} /><b className="truncate">{name(hb)}</b><span className="ml-auto text-[11.5px] text-hms-muted">{hb.code}</span></div>
          <p className="mt-1 font-semibold">{SKM[skOf(hb)].label}{skOf(hb) === "overdue" && ` · ${Math.round((Date.parse(TODAY) - Date.parse(hb.to)) / 864e5)} day(s) late`}</p>
          <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12.5px]">
            <dt className="text-hms-muted">Room</dt><dd>{hb.unit || "Not assigned"}</dd>
            <dt className="text-hms-muted">Stay</dt><dd>{dm(hb.from)} → {dm(hb.to)} · {hb.nights.length} night{hb.nights.length > 1 ? "s" : ""}</dd>
            <dt className="text-hms-muted">Guests</dt><dd>{hb.adults} adult{hb.adults > 1 ? "s" : ""}{hb.children ? ` · ${hb.children} child` : ""}</dd>
            <dt className="text-hms-muted">Source</dt><dd>{channelLabel(hb)}</dd>
            <dt className="text-hms-muted">Total</dt><dd className="tabular-nums">{tk(totalOf(hb))}</dd>
            <dt className="text-hms-muted">Paid</dt><dd className="tabular-nums">{tk(paidOf(hb))}</dd>
            <dt className="text-hms-muted">Due</dt><dd className={clsx("tabular-nums", dueOf(hb) > 0 && "font-semibold text-[#b45309]")}>{tk(dueOf(hb))}</dd>
          </dl>
        </div>
      )}
    </section>
  );
}
