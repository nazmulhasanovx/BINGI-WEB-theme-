"use client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { CHANNELS, dm, dueOf, paidOf, payState, totalOf, tk, type Booking } from "@/lib/bookings/store";
import { BookingsFrame, Flags, PayPill, StatusPill, card, useBk } from "./ui";

export function ListPage() { return <BookingsFrame tab="list"><AllBookings /></BookingsFrame>; }

type Chip = "all" | "upcoming" | "inhouse" | "past" | "cancelled" | "due";
const sel = "h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px] outline-none focus:border-hms-ink";

function AllBookings() {
  const { bk, guests, mode, open } = useBk();
  const [q, setQ] = useState("");
  const [chip, setChip] = useState<Chip>("all");
  const [channel, setChannel] = useState("");
  const [pay, setPay] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shown, setShown] = useState(25);
  const name = (b: Booking) => guests.get(b.guestId)?.name ?? "Guest";
  const test: Record<Chip, (b: Booking) => boolean> = {
    all: () => true,
    upcoming: (b) => b.status === "Confirmed",
    inhouse: (b) => b.status === "Checked in",
    past: (b) => b.status === "Checked out",
    cancelled: (b) => b.status === "Cancelled" || b.status === "No-show",
    due: (b) => dueOf(b) > 0 || payState(b) === "Refund due",
  };
  const base = useMemo(() => bk.list.filter((b) => {
    if (q.trim()) { const s = q.toLowerCase(); const g = guests.get(b.guestId); if (![b.code, b.unit, g?.name, g?.phone, b.group].some((x) => x?.toLowerCase().includes(s))) return false; }
    if (mode === "details") {
      if (channel && b.channel !== channel) return false;
      if (pay && payState(b) !== pay) return false;
      if (from && b.to <= from) return false;
      if (to && b.from > to) return false;
    }
    return true;
  }), [bk.list, q, guests, mode, channel, pay, from, to]);
  // Upcoming first (soonest), then in house, then the rest newest first.
  const rank = (b: Booking) => (b.status === "Checked in" ? 0 : b.status === "Confirmed" ? 1 : 2);
  const list = base.filter(test[chip]).sort((a, b) => rank(a) - rank(b) || (rank(a) < 2 ? a.from.localeCompare(b.from) : b.from.localeCompare(a.from)));
  const chips: [Chip, string][] = [["all", "All"], ["upcoming", "Upcoming"], ["inhouse", "In house"], ["due", "Payment due"], ["past", "Checked out"], ["cancelled", "Cancelled"]];
  const filters = [channel, pay, from, to].filter(Boolean).length;
  return (
    <section className={clsx(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4">
        <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-hms-line bg-white px-3 focus-within:border-hms-ink sm:max-w-[360px]"><Search className="size-4 text-hms-muted" /><span className="sr-only">Search bookings</span><input value={q} onChange={(e) => { setQ(e.target.value); setShown(25); }} placeholder="Name, phone, room or BK-code" className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none" /></label>
        {mode === "details" && <>
          <select aria-label="Channel" value={channel} onChange={(e) => setChannel(e.target.value)} className={sel}><option value="">All channels</option>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
          <select aria-label="Payment" value={pay} onChange={(e) => setPay(e.target.value)} className={sel}><option value="">All payments</option><option>Paid</option><option>Partly paid</option><option>Due</option><option>Refund due</option></select>
          <label className="flex items-center gap-1.5 text-[13px] text-hms-muted">Stay between<input type="date" aria-label="From date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} /></label>
          <input type="date" aria-label="To date" value={to} onChange={(e) => setTo(e.target.value)} className={sel} />
          {filters > 0 && <button onClick={() => { setChannel(""); setPay(""); setFrom(""); setTo(""); }} className="text-[13.5px] font-semibold text-hms-red">Clear filters</button>}
        </>}
      </div>
      <div role="tablist" aria-label="Booking status" className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto px-4 pb-3">
        {chips.map(([id, l]) => { const n = base.filter(test[id]).length; return <button key={id} role="tab" aria-selected={chip === id} onClick={() => { setChip(id); setShown(25); }} className={clsx("shrink-0 rounded-full border px-3 py-1.5 text-[13.5px] font-semibold", chip === id ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{l} <span className="tabular-nums opacity-70">{n}</span></button>; })}
      </div>

      {list.length === 0 ? <p className="border-t border-hms-line px-5 py-14 text-center text-[14px] text-hms-muted">{q || filters ? "No bookings match your search." : "No bookings here yet."}</p> : <>
        <ul className="divide-y divide-hms-line border-t border-hms-line md:hidden" aria-label="Bookings">
          {list.slice(0, shown).map((b) => (
            <li key={b.code}><button onClick={() => open(b.code)} className="block w-full px-4 py-3 text-left">
              <span className="flex items-baseline justify-between gap-2"><b className="truncate">{name(b)}</b><span className="shrink-0 text-[13px] font-semibold">{b.unit ? `Room ${b.unit}` : "No room"}</span></span>
              <span className="block text-[12.5px] text-hms-muted">{dm(b.from)} → {dm(b.to)} · {b.nights.length}n · {b.code}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-2"><StatusPill s={b.status} /><PayPill b={b} />{dueOf(b) > 0 && <b className="text-[12.5px] text-[#b42318]">{tk(dueOf(b))}</b>}<Flags b={b} /></span>
            </button></li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto border-t border-hms-line md:block" role="region" aria-label="Bookings table" tabIndex={0}>
          <table className={clsx("w-full text-[14px]", mode === "details" ? "min-w-[1100px]" : "min-w-[760px]")}>
            <thead><tr className="text-left text-[12.5px] text-hms-muted">
              <th className="px-4 py-2.5 font-medium">Guest</th><th className="px-3 py-2.5 font-medium">Room</th><th className="px-3 py-2.5 font-medium">Stay</th><th className="px-3 py-2.5 font-medium">Status</th>
              {mode === "details" && <><th className="px-3 py-2.5 font-medium">Channel</th><th className="px-3 py-2.5 text-right font-medium">Total</th><th className="px-3 py-2.5 text-right font-medium">Paid</th></>}
              <th className="px-3 py-2.5 text-right font-medium">Due</th><th className="px-4 py-2.5 text-right font-medium"><span className="sr-only">Open</span></th>
            </tr></thead>
            <tbody>{list.slice(0, shown).map((b) => (
              <tr key={b.code} onClick={() => open(b.code)} className={clsx("cursor-pointer border-t border-hms-line hover:bg-[#fafbfc]", (b.status === "Cancelled" || b.status === "No-show") && "text-hms-muted")}>
                <td className="px-4 py-2.5"><span className="block font-semibold">{name(b)}</span><span className="text-[12.5px] text-hms-muted">{b.code}{b.group ? ` · ${b.group}` : ""}</span></td>
                <td className="px-3 py-2.5">{b.unit ? <b>{b.unit}</b> : <span className="font-semibold text-[#a15c00]">Not assigned</span>}<span className="block max-w-[150px] truncate text-[12.5px] text-hms-muted">{b.type}</span></td>
                <td className="whitespace-nowrap px-3 py-2.5">{dm(b.from)} → {dm(b.to)}<span className="block text-[12.5px] text-hms-muted">{b.nights.length} night{b.nights.length > 1 ? "s" : ""}{mode === "details" ? ` · ${b.adults}A${b.children ? ` ${b.children}C` : ""}` : ""}{b.from === TODAY && b.status === "Confirmed" ? " · today" : ""}</span></td>
                <td className="px-3 py-2.5"><span className="flex flex-wrap items-center gap-1.5"><StatusPill s={b.status} /><Flags b={b} /></span></td>
                {mode === "details" && <><td className="px-3 py-2.5">{b.channel}</td><td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{tk(totalOf(b))}</td><td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{tk(paidOf(b))}</td></>}
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{dueOf(b) > 0 ? <><span className="block font-bold tabular-nums text-[#b42318]">{tk(dueOf(b))}</span><PayPill b={b} /></> : <PayPill b={b} />}</td>
                <td className="px-4 py-2.5 text-right"><button onClick={(e) => { e.stopPropagation(); open(b.code); }} aria-label={`Open ${b.code}`} className="h-9 rounded-lg border border-hms-line bg-white px-3 text-[13.5px] font-semibold hover:bg-hms-hover">Open</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-hms-line px-4 py-3 text-[13px] text-hms-muted">
          <span>Showing {Math.min(shown, list.length)} of {list.length}</span>
          {shown < list.length && <button onClick={() => setShown(shown + 25)} className="font-semibold text-hms-red">Show more</button>}
        </div>
      </>}
    </section>
  );
}
