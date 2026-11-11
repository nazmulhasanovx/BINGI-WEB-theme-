"use client";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Wrench } from "lucide-react";
import { TODAY, type Unit } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { channelLabel, dm, dow, dueOf, holds, overlaps, tk, type Booking } from "@/lib/bookings/store";
import { useRates } from "@/lib/rates/store";
import { useProperty } from "../property";
import { BookingsFrame, card, channelIcon, statusLabel, useBk } from "./ui";

export function CalendarPage() { return <BookingsFrame tab="calendar"><Calendar /></BookingsFrame>; }

const BAR: Record<string, string> = {
  Confirmed: "border-[#9db8f2] bg-[#e8f0fe] text-[#1e3a8a]",
  "Checked in": "border-[#86cfa3] bg-[#dcf3e5] text-[#14532d]",
  "Checked out": "border-[#d3d8df] bg-[#eef0f3] text-[#4d5664]",
};

function Calendar() {
  const { bk, guests, mode, open } = useBk();
  const router = useRouter();
  const rates = useRates(useProperty());
  const [days, setDays] = useState(14);
  const [start, setStart] = useState(addDays(TODAY, -1));
  const span = mode === "easy" ? 14 : days;
  const box = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  useEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width)); ro.observe(el); return () => ro.disconnect(); }, []);
  const minW = span <= 7 ? 112 : span <= 14 ? 76 : 46;
  // Fill the card on big screens; scroll sideways on small ones.
  const W = Math.max(minW, boxW ? Math.floor((boxW - 96) / span) : minW);
  const dates = useMemo(() => Array.from({ length: span }, (_, i) => addDays(start, i)), [start, span]);
  const end = addDays(start, span);
  const inRange = (b: Booking) => overlaps(b, start, end) && b.status !== "Cancelled" && b.status !== "No-show";
  const groups = useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const u of bk.units) m.set(u.category, [...(m.get(u.category) ?? []), u]);
    return [...m.entries()].map(([c, us]) => ({ id: c, name: bk.cats.get(c)?.name ?? "Rooms", units: us.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })) }));
  }, [bk.units, bk.cats]);
  const unassigned = bk.list.filter((b) => holds(b) && !b.unit && inRange(b));
  const name = (b: Booking) => guests.get(b.guestId)?.name ?? "Guest";
  const step = mode === "easy" ? 7 : Math.max(7, Math.floor(span / 2));
  const freeOn = (catUnits: Unit[], d: string) => catUnits.filter((u) => !u.ooo && !bk.list.some((b) => b.unit === u.code && holds(b) && overlaps(b, d, addDays(d, 1)))).length;

  const bar = (b: Booking) => {
    const s = b.from < start ? start : b.from;
    const e = b.to > end ? end : b.to;
    const left = ((Date.parse(s) - Date.parse(start)) / 864e5) * W + (b.from >= start ? W / 2 : 0);
    const right = ((Date.parse(e) - Date.parse(start)) / 864e5) * W + (b.to <= end ? W / 2 : 0);
    const d = dueOf(b);
    return (
      <button key={b.code} onClick={() => open(b.code)} title={`${name(b)} · ${b.code} · ${channelLabel(b)}`}
        aria-label={`${b.code} ${name(b)}${b.unit ? `, Room ${b.unit}` : ""}, ${dm(b.from)} to ${dm(b.to)}, ${statusLabel(b.status)}, ${channelLabel(b)}${d > 0 ? ", payment due" : ""}`}
        style={{ left: left + 2, width: Math.max(18, right - left - 4) }}
        className={clsx("absolute top-1.5 bottom-1.5 z-[1] flex items-center gap-1 overflow-hidden rounded-lg border px-2 text-left text-[12.5px] font-semibold shadow-[0_1px_0_rgb(0_0_0/0.04)] transition hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-hms-ink", BAR[b.status] ?? BAR.Confirmed)}>
        {d > 0 && <span className="size-1.5 shrink-0 rounded-full bg-[#d97706]" aria-hidden />}
        {(() => { const I = channelIcon(b.channel); return <I className="size-3.5 shrink-0 opacity-70" aria-hidden />; })()}
        <span className="truncate">{name(b)}</span>
        {mode === "details" && right - left > 150 && <span className="ml-auto shrink-0 font-normal">{b.code}</span>}
      </button>
    );
  };
  const newAt = (room: string, d: string) => router.push(`/hms/bookings/new?room=${encodeURIComponent(room)}&from=${d}`);

  return (
    <section className={clsx(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-2 border-b border-hms-line px-3 py-3 sm:px-4">
        <div className="flex items-center gap-1">
          <button onClick={() => setStart(addDays(start, -step))} aria-label="Earlier dates" className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><ChevronLeft className="size-4" /></button>
          <button onClick={() => setStart(addDays(TODAY, -1))} className="h-9 rounded-lg border border-hms-line bg-white px-3 text-[14px] font-semibold hover:bg-hms-hover">Today</button>
          <button onClick={() => setStart(addDays(start, step))} aria-label="Later dates" className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><ChevronRight className="size-4" /></button>
        </div>
        <p className="text-[15px] font-bold">{dm(start)} – {dm(addDays(end, -1))}</p>
        {mode === "details" && (
          <div role="radiogroup" aria-label="Days shown" className="ml-auto flex rounded-lg bg-[#e9edf2] p-1">
            {[7, 14, 30].map((n) => <button key={n} role="radio" aria-checked={days === n} onClick={() => setDays(n)} className={clsx("rounded-md px-3 py-1 text-[13.5px] font-semibold", days === n ? "bg-white shadow-sm" : "text-[#4d5664]")}>{n} days</button>)}
          </div>
        )}
        <div className={clsx("flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#4d5664]", mode === "easy" && "ml-auto")}>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-[#9db8f2] bg-[#e8f0fe]" />Booked</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-[#86cfa3] bg-[#dcf3e5]" />In house</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#d97706]" />Payment due</span>
          <span className="inline-flex items-center gap-1.5"><span className="hms-hatch size-3 rounded border border-[#e9b949]" />Out of order</span>
          <span className="inline-flex items-center gap-1.5"><span className="font-semibold text-[#16693a]">৳</span>Deal price</span>
        </div>
      </div>

      <div ref={box} className="overflow-x-auto" role="region" aria-label="Booking calendar" tabIndex={0}>
        <div style={{ width: 96 + span * W }} className="relative">
          {/* header */}
          <div className="sticky top-0 z-[3] flex border-b border-hms-line bg-white">
            <div className="sticky left-0 z-[4] w-24 shrink-0 border-r border-hms-line bg-white px-3 py-2 text-[12.5px] font-semibold text-hms-muted">Room</div>
            {dates.map((d) => (
              <div key={d} style={{ width: W }} className={clsx("shrink-0 border-r border-hms-line py-1.5 text-center last:border-r-0", d === TODAY && "bg-hms-coral-soft", (dow(d) === "Fri" || dow(d) === "Sat") && d !== TODAY && "bg-[#fafbfc]")}>
                <p className={clsx("text-[11.5px] font-medium", d === TODAY ? "text-hms-red" : "text-hms-muted")}>{dow(d)}</p>
                <p className={clsx("text-[14px] font-bold tabular-nums", d === TODAY && "text-hms-red")}>{W >= 60 ? dm(d) : d.slice(8, 10)}</p>
              </div>
            ))}
          </div>

          {unassigned.length > 0 && (
            <div className="flex border-b border-hms-line bg-[#fffaf0]">
              <div className="sticky left-0 z-[2] w-24 shrink-0 border-r border-hms-line bg-[#fffaf0] px-3 py-2"><p className="text-[13px] font-bold text-[#8a4b00]">No room</p><p className="text-[11.5px] text-[#8a4b00]">{unassigned.length} booking{unassigned.length > 1 ? "s" : ""}</p></div>
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
                <div className="sticky left-0 z-[2] flex w-24 shrink-0 items-center border-r border-hms-line bg-[#fbfcfd] px-3 text-[11.5px] font-medium text-hms-muted">{mode === "details" ? "Price · free" : "Price"}</div>
                {dates.map((d) => {
                  const f = freeOn(g.units, d);
                  const c = rates.catPrice(g.id, d);
                  const deal = c.closed ? null : rates.deal(g.id, d, c.price);
                  const p = deal?.price ?? c.price;
                  return (
                    <div key={d} style={{ width: W }} title={c.closed ? "Closed for sale" : `${tk(p)} per night before VAT & service${deal ? ` · ${deal.c.name}` : ""}${c.from === "custom" ? " · custom price" : ""}`}
                      className={clsx("shrink-0 border-r border-hms-line py-1 text-center leading-tight last:border-r-0", d === TODAY && "bg-hms-coral-soft/40")}>
                      <span className={clsx("block text-[12px] font-semibold tabular-nums", c.closed ? "text-[#b42318]" : deal ? "text-[#16693a]" : f ? "text-hms-ink" : "text-[#6b7280] line-through")}>{c.closed ? "Closed" : W >= 70 ? new Intl.NumberFormat("en-IN").format(p) : `${Math.round(p / 100) / 10}k`}</span>
                      {mode === "details" && <span className={clsx("block text-[11px] tabular-nums", f ? "text-hms-muted" : "font-semibold text-[#b42318]")}>{f ? `${f} free` : "Full"}</span>}
                    </div>
                  );
                })}
              </div>
              {g.units.map((u) => (
                <div key={u.code} className="flex border-b border-hms-line last:border-b-0">
                  <div className="sticky left-0 z-[2] flex w-24 shrink-0 items-center gap-1.5 border-r border-hms-line bg-white px-3 py-2">
                    <span className="text-[14.5px] font-bold">{u.code}</span>
                    {u.ooo && <span title={`Out of order · ${u.ooo.reason}`} className="text-[#b26a00]"><Wrench className="size-3.5" aria-label="Out of order" /></span>}
                  </div>
                  <div className={clsx("relative flex", u.ooo && "hms-hatch")} style={{ width: span * W, height: 44 }}>
                    {dates.map((d) => {
                      const busy = bk.list.some((b) => b.unit === u.code && holds(b) && overlaps(b, d, addDays(d, 1)));
                      const can = !u.ooo && !busy && d >= TODAY;
                      const cls = clsx("h-full shrink-0 border-r border-hms-line last:border-r-0", d === TODAY && "bg-hms-coral-soft/40", can && "hover:bg-[#f0f4ff]", d < TODAY && "bg-[#fafbfc]");
                      return can ? <button key={d} tabIndex={-1} onClick={() => newAt(u.code, d)} aria-label={`New booking, Room ${u.code}, ${dm(d)}`} style={{ width: W }} className={cls} /> : <div key={d} style={{ width: W }} className={cls} />;
                    })}
                    {bk.list.filter((b) => b.unit === u.code && inRange(b)).map(bar)}
                    {u.ooo && <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/90 px-1.5 text-[12px] font-semibold text-[#8a4b00]">Out of order · {u.ooo.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-hms-line px-4 py-2.5 text-[12.5px] text-hms-muted">Prices are per night before VAT &amp; service, from Discounts &amp; Rates. Tap an empty day to book.</p>
    </section>
  );
}
