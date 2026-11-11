"use client";
import clsx from "clsx";
import { useState } from "react";
import { CircleAlert, LogIn, LogOut, Search } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { dm, dueOf, holds, tk, type Booking } from "@/lib/bookings/store";
import { useHousekeeping } from "@/lib/housekeeping/store";
import { useProperty } from "../property";
import { WebRequests } from "./web";
import { BookingsFrame, ChannelBadge, Flags, bDark, bSmall, card, useBk } from "./ui";

export function TodayPage() { return <BookingsFrame tab="today"><Today /></BookingsFrame>; }

type Seg = "arriving" | "leaving" | "inhouse";

function Today() {
  const { bk, guests, mode, open } = useBk();
  const [q, setQ] = useState("");
  const L = bk.list;
  const name = (b: Booking) => guests.get(b.guestId)?.name ?? "Guest";
  const match = (b: Booking) => { if (!q.trim()) return true; const s = q.toLowerCase(); const g = guests.get(b.guestId); return [b.code, b.unit, g?.name, g?.phone].some((x) => x?.toLowerCase().includes(s)); };
  const byRoom = (a: Booking, c: Booking) => (a.unit || "zzz").localeCompare(c.unit || "zzz", undefined, { numeric: true });
  const lists: Record<Seg, Booking[]> = {
    arriving: L.filter((b) => b.status === "Confirmed" && b.from === TODAY).sort(byRoom),
    leaving: L.filter((b) => b.status === "Checked in" && b.to <= TODAY).sort(byRoom),
    inhouse: L.filter((b) => b.status === "Checked in" && b.to > TODAY).sort(byRoom),
  };
  const first: Seg = lists.arriving.length ? "arriving" : lists.leaving.length ? "leaving" : "inhouse";
  const [seg, setSeg] = useState<Seg | null>(null);
  const cur = seg ?? first;
  const rows = lists[cur].filter(match);
  const attention = L.filter((b) => (b.status === "Confirmed" && b.from < TODAY) || (holds(b) && !b.unit && b.from <= addDays(TODAY, 7)));
  const free = bk.freeUnits(TODAY, addDays(TODAY, 1)).length;
  const collect = [...lists.arriving, ...lists.leaving].reduce((s, b) => s + dueOf(b), 0);
  const SEGS: [Seg, string][] = [["arriving", "Arriving"], ["leaving", "Leaving"], ["inhouse", "In house"]];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Today" className="flex w-full gap-1 rounded-2xl bg-[#e9edf2] p-1 sm:w-auto">
          {SEGS.map(([id, l]) => (
            <button key={id} role="tab" aria-selected={cur === id} onClick={() => setSeg(id)}
              className={clsx("flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[14px] font-semibold transition-colors sm:flex-none sm:gap-2 sm:px-4 sm:text-[14.5px]", cur === id ? "bg-white text-hms-ink shadow-[0_1px_3px_rgb(0_0_0/0.08)]" : "text-[#4d5664] hover:text-hms-ink")}>
              {l}<span className={clsx("min-w-6 rounded-full px-1.5 text-[13px] tabular-nums", cur === id ? "bg-hms-ink text-white" : "bg-white/70")}>{lists[id].length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
          <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#16693a] ring-1 ring-hms-line">{free} free tonight</span>
          {collect > 0 && <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-[#b42318] ring-1 ring-hms-line">{tk(collect)} to collect</span>}
        </div>
        <label className="flex h-11 w-full items-center gap-2 rounded-xl border border-hms-line bg-white px-3.5 focus-within:border-hms-ink lg:ml-auto lg:w-[300px]"><Search className="size-[18px] text-hms-muted" /><span className="sr-only">Find a guest</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone or room" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" /></label>
      </div>

      <WebRequests />
      {mode === "details" && attention.length > 0 && (
        <section aria-label="Needs attention" className="mt-4 overflow-hidden rounded-2xl border border-[#f1dfb8] bg-[#fdf8ec]">
          <h2 className="flex items-center gap-2 px-4 pt-3 text-[14.5px] font-bold text-[#6b4309]"><CircleAlert className="size-4" />Needs attention</h2>
          <ul className="mt-1">{attention.map((b) => (
            <li key={b.code}><button onClick={() => open(b.code)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-left hover:bg-[#fbf1da]">
              <b className="min-w-0 flex-1 truncate">{name(b)} <span className="font-normal text-[#6b4309]">· {dm(b.from)} → {dm(b.to)}</span></b><Flags b={b} />
            </button></li>
          ))}</ul>
        </section>
      )}

      <section aria-label={SEGS.find((s) => s[0] === cur)![1]} className={clsx(card, "mt-4 overflow-hidden")}>
        {rows.length === 0 ? (
          <p className="px-6 py-16 text-center text-[15px] text-hms-muted">{q ? "No one matches." : cur === "arriving" ? "No more arrivals today" : cur === "leaving" ? "Everyone due out has left" : "No guests in house"}</p>
        ) : (
          <ul className="divide-y divide-hms-line">
            {rows.map((b) => <Row key={b.code} b={b} name={name(b)} kind={cur} />)}
          </ul>
        )}
      </section>
    </>
  );
}

function Row({ b, name, kind }: { b: Booking; name: string; kind: Seg }) {
  const { open, mode, guests } = useBk();
  const hk = useHousekeeping(useProperty());
  const dirty = kind === "arriving" && !!b.unit && !hk.isReady(b.unit);
  const d = dueOf(b);
  const vip = guests.get(b.guestId)?.vip;
  const late = b.status === "Checked in" && b.to < TODAY;
  const n = b.nights.length;
  return (
    <li className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-[#fafbfc] sm:gap-4 sm:px-5">
      <button onClick={() => open(b.code)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`${name}${b.unit ? `, Room ${b.unit}` : ""}`}>
        <span className={clsx("grid h-12 w-14 shrink-0 place-items-center rounded-xl text-[16px] font-bold tabular-nums", !b.unit ? "bg-[#fff4e0] text-[#8a4b00]" : kind === "inhouse" ? "bg-[#e5f5ec] text-[#16693a]" : kind === "leaving" ? "bg-[#fdefe7] text-[#c2410c]" : "bg-[#e8f0fe] text-[#1d4ed8]")}>{b.unit || "—"}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2"><span className="truncate text-[15.5px] font-semibold">{name}</span>{vip && <span className="rounded bg-[#fdf3d9] px-1.5 text-[11px] font-bold text-[#7a4a0b]">VIP</span>}{dirty && <span className="whitespace-nowrap rounded bg-[#fdecec] px-1.5 text-[11px] font-bold text-[#b42318]">Room {hk.stateOf(b.unit).toLowerCase()}</span>}<span className="hidden sm:inline-flex"><ChannelBadge b={b} /></span></span>
          <span className="block truncate text-[13px] text-hms-muted">
            {kind === "inhouse" ? `Until ${dm(b.to)}` : `${n} night${n > 1 ? "s" : ""} · ${b.adults + b.children} guest${b.adults + b.children > 1 ? "s" : ""}`}
            {mode === "details" ? ` · ${b.code}${b.channelRef ? ` · ${b.channelRef}` : ""}` : ""}
            {kind !== "inhouse" && d > 0 && <b className="text-[#b42318] sm:hidden"> · {tk(d)} due</b>}
          </span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          {late ? <span className="rounded-md bg-[#fff4e0] px-2 py-0.5 text-[12.5px] font-semibold text-[#8a4b00]">Overdue</span>
            : d > 0 ? <span className="text-[14px] font-bold tabular-nums text-[#b42318]">{tk(d)}</span>
            : <span className="text-[13px] font-semibold text-[#16693a]">Paid</span>}
        </span>
      </button>
      {kind === "arriving" && <button onClick={() => open(b.code, "checkin")} aria-label={`Check in ${name}`} className={clsx(bDark, "w-[118px]")}><LogIn className="size-4" />Check in</button>}
      {kind === "leaving" && <button onClick={() => open(b.code, "checkout")} aria-label={`Check out ${name}`} className={clsx(bSmall, "h-10 w-[118px] bg-[#eef0f3] text-hms-ink hover:bg-[#e3e6eb]")}><LogOut className="size-4" />Check out</button>}
      {kind === "inhouse" && d > 0 && <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-[#b42318] sm:hidden">{tk(d)}</span>}
    </li>
  );
}
