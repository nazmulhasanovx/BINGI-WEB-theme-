"use client";
import { can } from "@/lib/plan";
import { PlanGate } from "../plan-gate";
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { useModeKey } from "@/lib/bookings/mode";
import { Brush, CheckCheck, CircleCheck, Plus, Sparkles, Wrench } from "lucide-react";
import { TODAY, oooOn, useRooms, type Unit } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { dm, holds, overlaps, timeOf, useBookings } from "@/lib/bookings/store";
import { KINDS, useHousekeeping, type Clean, type TaskKind } from "@/lib/housekeeping/store";
import { useGuestNames } from "@/lib/guests/store";
import { useProperty } from "../property";
import { Menu } from "../staff/ui";
import { Toast, bMain, bSoft, card } from "../bookings/ui";

const TONE: Record<Clean, [string, string]> = {
  Dirty: ["bg-[#fdecec] text-[#b42318]", "border-[#f3c4c0]"],
  Cleaning: ["bg-[#fff4e0] text-[#8a4b00]", "border-[#f1d39a]"],
  Clean: ["bg-[#e5f5ec] text-[#16693a]", "border-[#b8e2c8]"],
  Inspected: ["bg-[#e8f0fe] text-[#1d4ed8]", "border-[#c3d5fa]"],
};
type Occ = "Vacant" | "Occupied" | "Arriving" | "Leaving";
type Mode = "easy" | "details";

export function HousekeepingPage() {
  const h = useProperty();
  if (!can(h, "housekeeping")) return <PlanGate h={h} f="housekeeping" title="Housekeeping" text="Plan room cleaning, assign attendants and track room readiness after every check-out." />;
  return <HousekeepingBoard />;
}

function HousekeepingBoard() {
  const h = useProperty();
  const hk = useHousekeeping(h);
  const bk = useBookings(h);
  const rooms = useRooms(h);
  const names = useGuestNames(h);
  const { mode, setMode } = useModeKey("bingi.hk.mode");
  const [f, setF] = useState<Clean | "all" | "arrivals">("all");
  const [toast, setToastS] = useState("");
  const say = (t: string) => { setToastS(t); setTimeout(() => setToastS(""), 2400); };
  const details = mode === "details";
  const units = useMemo(() => bk.units.slice().sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [bk.units]);
  const occ = (u: Unit): { o: Occ; guest?: string } => {
    const here = bk.list.filter((b) => b.unit === u.code && holds(b));
    const ins = here.find((b) => b.status === "Checked in");
    if (ins) return { o: ins.to <= TODAY ? "Leaving" : "Occupied", guest: names.get(ins.guestId)?.name };
    const arr = here.find((b) => b.status === "Confirmed" && b.from <= TODAY && overlaps(b, TODAY, addDays(TODAY, 1)));
    if (arr) return { o: "Arriving", guest: names.get(arr.guestId)?.name };
    return { o: "Vacant" };
  };
  const off = (u: Unit) => oooOn(u, TODAY, addDays(TODAY, 1));
  const waiting = units.filter((u) => occ(u).o === "Arriving" && !hk.isReady(u.code));
  const count = (s: Clean) => units.filter((u) => !off(u) && hk.stateOf(u.code) === s).length;
  const shown = units.filter((u) => f === "all" || (f === "arrivals" ? waiting.includes(u) : !off(u) && hk.stateOf(u.code) === f));
  const open = hk.st.tasks.filter((t) => t.status !== "Done").sort((a, b) => Number(waiting.some((u) => u.code === b.room)) - Number(waiting.some((u) => u.code === a.room)) || a.at.localeCompare(b.at));
  const doneToday = hk.st.tasks.filter((t) => t.status === "Done" && (t.done ?? "").startsWith(TODAY));
  const next = (s: Clean): [Clean, string] | null => s === "Dirty" ? ["Cleaning", "Start cleaning"] : s === "Cleaning" ? ["Clean", "Mark clean"] : s === "Clean" && (details || hk.rules.inspection) ? ["Inspected", "Mark inspected"] : null;

  if (!hk.ready || !bk.ready) return <div className="hms-page"><p role="status" className="py-10 text-[14px] text-hms-muted">Loading housekeeping…</p></div>;
  return (
    <div className="h-full overflow-y-auto"><div className="hms-page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-[24px] font-bold tracking-[-0.01em]">Housekeeping</h1><p className="text-[14px] text-hms-muted">{dm(TODAY)} · {h.name} · {open.length} task{open.length === 1 ? "" : "s"} open</p></div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="Housekeeping view" className="inline-flex h-10 rounded-xl border border-hms-line bg-white p-1">
            {([["easy", "Easy"], ["details", "Details"]] as [Mode, string][]).map(([m, l]) => <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={clsx("rounded-lg px-3.5 text-[14px] font-semibold", mode === m ? "bg-[#0f1720] text-white" : "text-[#4d5664]")}>{l}</button>)}
          </div>
          <Menu label="More actions" items={[{ label: "Reset demo housekeeping", onClick: () => { hk.reset(); say("Housekeeping reset"); }, danger: true }]} />
        </div>
      </div>

      {waiting.length > 0 && <button onClick={() => setF("arrivals")} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#f1dfb8] bg-[#fdf8ec] px-4 py-3 text-left">
        <Sparkles className="size-5 text-[#8a4b00]" /><span className="flex-1 text-[14.5px] font-semibold text-[#6b4309]">{waiting.length} arriving guest{waiting.length > 1 ? "s" : ""} waiting for a clean room: {waiting.map((u) => u.code).join(", ")}</span><span className="text-[13.5px] font-semibold text-[#8a4b00]">Clean first →</span>
      </button>}

      <div role="radiogroup" aria-label="Filter rooms" className="no-scrollbar mt-4 flex gap-1.5 overflow-x-auto">
        <Chip on={f === "all"} set={() => setF("all")}>All rooms <span className="opacity-70">{units.length}</span></Chip>
        {(["Dirty", "Cleaning", "Clean", "Inspected"] as Clean[]).map((s) => <Chip key={s} on={f === s} set={() => setF(s)}><span className="size-2 rounded-full" style={{ background: s === "Dirty" ? "#d92d20" : s === "Cleaning" ? "#d97706" : s === "Clean" ? "#16a34a" : "#2563eb" }} />{s} <span className="opacity-70">{count(s)}</span></Chip>)}
      </div>

      <div className={clsx("mt-4 grid gap-4", details && "xl:grid-cols-[1fr_380px]")}>
        <section aria-label="Rooms">
          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {shown.map((u) => {
              const s = hk.stateOf(u.code); const { o, guest } = occ(u); const nx = next(s); const ooo = off(u);
              return (
                <li key={u.code} className={clsx("flex flex-col rounded-2xl border bg-white p-3", ooo ? "border-[#ecd29a] hms-hatch" : TONE[s][1])}>
                  <div className="flex items-center gap-2">
                    <b className="text-[18px] tabular-nums">{u.code}</b>
                    {ooo ? <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-[12px] font-semibold text-[#8a4b00]"><Wrench className="size-3.5" />Out of order</span>
                      : <span className={clsx("ml-auto rounded-md px-2 py-0.5 text-[12px] font-semibold", TONE[s][0])}>{s}</span>}
                  </div>
                  <p className="mt-1 truncate text-[13px] text-[#4d5664]">{ooo ? u.ooo?.reason : `${o}${guest ? ` · ${guest}` : ""}`}</p>
                  {details && hk.st.rooms[u.code] && <p className="text-[11.5px] text-hms-muted">{timeOf(hk.st.rooms[u.code].at)} · {hk.st.rooms[u.code].by}</p>}
                  {!ooo && <div className="mt-2.5 flex gap-1.5">
                    {nx ? <button onClick={() => { hk.setClean(u.code, nx[0]); say(`Room ${u.code} · ${nx[0]}`); }} aria-label={`${nx[1]} room ${u.code}`} className={clsx("h-9 flex-1 rounded-lg text-[13.5px] font-semibold", s === "Dirty" ? "bg-hms-ink text-white" : "bg-[#e5f5ec] text-[#16693a]")}>{nx[1]}</button>
                      : <span className="flex h-9 flex-1 items-center justify-center gap-1.5 text-[13px] font-semibold text-[#16693a]"><CircleCheck className="size-4" />Ready</span>}
                    {s !== "Dirty" && <button onClick={() => { hk.setClean(u.code, "Dirty"); say(`Room ${u.code} · Dirty`); }} aria-label={`Mark room ${u.code} dirty`} className="h-9 rounded-lg bg-[#f4f6f8] px-2.5 text-[12.5px] font-semibold text-[#4d5664]">Dirty</button>}
                  </div>}
                </li>
              );
            })}
          </ul>
          {!shown.length && <p className={clsx(card, "px-6 py-12 text-center text-[14.5px] text-hms-muted")}>No rooms here.</p>}
        </section>

        {details && <div className="space-y-4">
          <Tasks hk={hk} open={open} waiting={waiting.map((u) => u.code)} units={units.map((u) => u.code)} say={say} />
          <Maintenance units={units} update={rooms.update} say={say} />
          <section className={clsx(card, "p-4")}><h2 className="text-[15px] font-bold">Done today <span className="font-normal text-hms-muted">· {doneToday.length}</span></h2>
            <ul className="mt-2 space-y-1 text-[13px] text-[#4d5664]">{doneToday.slice(0, 8).map((t) => <li key={t.id}><CheckCheck className="mr-1 inline size-3.5 text-[#16693a]" />{t.room} · {t.kind}{t.who ? ` · ${t.who}` : ""} · {timeOf(t.done!)}</li>)}{!doneToday.length && <li>Nothing yet.</li>}</ul>
          </section>
        </div>}
      </div>
      {!details && open.length > 0 && <p className="mt-4 text-[13px] text-hms-muted">{open.length} task{open.length > 1 ? "s" : ""} open — switch to <button onClick={() => setMode("details")} className="font-semibold text-hms-red">Details</button> to assign staff.</p>}
      <p className="mt-2 text-[12.5px] text-hms-muted">Check-out in <Link href="/hms/bookings" className="font-semibold text-hms-red">Bookings</Link> makes the room Dirty and opens a cleaning task. Cleaning status is separate from bookings and from out of order.</p>
      {toast && <Toast text={toast} />}
    </div></div>
  );
}

function Chip({ on, set, children }: { on: boolean; set: () => void; children: ReactNode }) {
  return <button role="radio" aria-checked={on} onClick={set} className={clsx("inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold transition-colors", on ? "bg-hms-ink text-white" : "bg-white ring-1 ring-hms-line hover:ring-hms-ink")}>{children}</button>;
}

function Tasks({ hk, open, waiting, units, say }: { hk: ReturnType<typeof useHousekeeping>; open: ReturnType<typeof useHousekeeping>["st"]["tasks"]; waiting: string[]; units: string[]; say: (t: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [room, setRoom] = useState(units[0] ?? "");
  const [kind, setKind] = useState<TaskKind>("Deep clean");
  const [who, setWho] = useState("");
  const [note, setNote] = useState("");
  return (
    <section className={clsx(card, "p-4")}>
      <div className="flex items-center justify-between"><h2 className="text-[15px] font-bold">Tasks <span className="font-normal text-hms-muted">· {open.length} open</span></h2><button onClick={() => setAdding(!adding)} className={clsx(bSoft, "!h-9 px-3 text-[13.5px]")}><Plus className="size-4" />Add task</button></div>
      {adding && <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f8fa] p-3">
        <select aria-label="Task room" value={room} onChange={(e) => setRoom(e.target.value)} className="h-10 rounded-lg border border-hms-line bg-white px-2 text-[14px]">{units.map((u) => <option key={u}>{u}</option>)}</select>
        <select aria-label="Task type" value={kind} onChange={(e) => setKind(e.target.value as TaskKind)} className="h-10 rounded-lg border border-hms-line bg-white px-2 text-[14px]">{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        <select aria-label="Assign to" value={who} onChange={(e) => setWho(e.target.value)} className="col-span-2 h-10 rounded-lg border border-hms-line bg-white px-2 text-[14px]"><option value="">Not assigned</option>{hk.staff.map((s) => <option key={s}>{s}</option>)}</select>
        <input aria-label="Task note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="col-span-2 h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px]" />
        <button onClick={() => { hk.addTask(room, kind, { who: who || undefined, note: note.trim() || undefined }); setAdding(false); setNote(""); say(`${kind} added for ${room}`); }} className={clsx(bMain, "col-span-2 !h-10")}>Add</button>
      </div>}
      <ul className="mt-2 divide-y divide-hms-line">
        {open.map((t) => (
          <li key={t.id} className="py-2.5">
            <div className="flex items-center gap-2"><b className="text-[14.5px]">{t.room}</b><span className="text-[13.5px]">{t.kind}</span>{waiting.includes(t.room) && <span className="rounded bg-[#fdf3d9] px-1.5 text-[11px] font-bold text-[#7a4a0b]">Guest arriving</span>}<span className={clsx("ml-auto text-[12px] font-semibold", t.status === "Doing" ? "text-[#8a4b00]" : "text-hms-muted")}>{t.status === "Doing" ? "In progress" : "Open"}</span></div>
            {t.note && <p className="text-[12.5px] text-hms-muted">{t.note}</p>}
            <div className="mt-1.5 flex gap-1.5">
              <select aria-label={`Assign ${t.kind} room ${t.room}`} value={t.who ?? ""} onChange={(e) => hk.assign(t.id, e.target.value)} className="h-9 min-w-0 flex-1 rounded-lg border border-hms-line bg-white px-2 text-[13px]"><option value="">Not assigned</option>{hk.staff.map((s) => <option key={s}>{s}</option>)}</select>
              {t.status === "Open" ? <button onClick={() => hk.start(t.id)} aria-label={`Start ${t.kind} room ${t.room}`} className="h-9 rounded-lg bg-hms-ink px-3 text-[13px] font-semibold text-white">Start</button>
                : <button onClick={() => { hk.finish(t.id); say(`Room ${t.room} done`); }} aria-label={`Finish ${t.kind} room ${t.room}`} className="h-9 rounded-lg bg-[#e5f5ec] px-3 text-[13px] font-semibold text-[#16693a]">Done</button>}
            </div>
          </li>
        ))}
        {!open.length && <li className="py-3 text-[14px] text-[#16693a]"><Brush className="mr-1.5 inline size-4" />All tasks done.</li>}
      </ul>
    </section>
  );
}

function Maintenance({ units, update, say }: { units: Unit[]; update: ReturnType<typeof useRooms>["update"]; say: (t: string) => void }) {
  const [room, setRoom] = useState("");
  const [reason, setReason] = useState("");
  const [since, setSince] = useState(TODAY);
  const [until, setUntil] = useState("");
  const list = units.filter((u) => u.ooo && (!u.ooo.until || u.ooo.until > TODAY));
  const ok = room && reason.trim() && (!until || until > since);
  return (
    <section className={clsx(card, "p-4")}>
      <h2 className="text-[15px] font-bold">Out of order</h2>
      <ul className="mt-1 divide-y divide-hms-line">{list.map((u) => (
        <li key={u.code} className="flex items-center gap-2 py-2 text-[13.5px]"><Wrench className="size-4 text-[#b26a00]" /><span className="min-w-0 flex-1"><b>{u.code}</b> · {u.ooo!.reason}<span className="block text-[12px] text-hms-muted">{dm(u.ooo!.since.slice(0, 10))} → {u.ooo!.until ? dm(u.ooo!.until) : "until fixed"}</span></span>
          <button onClick={() => { update((s) => { delete s.units.find((x) => x.code === u.code)!.ooo; }, `${u.code} back in service`); say(`${u.code} back in service`); }} className="h-8 rounded-lg bg-[#f4f6f8] px-2.5 text-[12.5px] font-semibold">Back in service</button></li>))}
        {!list.length && <li className="py-2 text-[13.5px] text-hms-muted">No rooms out of order.</li>}</ul>
      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-[#f7f8fa] p-3">
        <select aria-label="Room out of order" value={room} onChange={(e) => setRoom(e.target.value)} className="h-10 rounded-lg border border-hms-line bg-white px-2 text-[14px]"><option value="">Room…</option>{units.filter((u) => !u.ooo).map((u) => <option key={u.code}>{u.code}</option>)}</select>
        <input aria-label="Out of order reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" className="h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px]" />
        <label className="text-[12px] text-hms-muted">From<input type="date" aria-label="Out of order from" min={TODAY} value={since} onChange={(e) => setSince(e.target.value || TODAY)} className="mt-0.5 h-10 w-full rounded-lg border border-hms-line bg-white px-2 text-[14px] text-hms-ink" /></label>
        <label className="text-[12px] text-hms-muted">Back on (optional)<input type="date" aria-label="Back in service on" min={since} value={until} onChange={(e) => setUntil(e.target.value)} className="mt-0.5 h-10 w-full rounded-lg border border-hms-line bg-white px-2 text-[14px] text-hms-ink" /></label>
        <button disabled={!ok} onClick={() => { update((s) => { s.units.find((x) => x.code === room)!.ooo = { reason: reason.trim(), since, ...(until ? { until } : {}) }; }, `${room} out of order: ${reason.trim()}`); say(`${room} out of order from ${dm(since)}`); setRoom(""); setReason(""); setUntil(""); }} className={clsx(bSoft, "col-span-2 !h-10", !ok && "opacity-50")}>Mark out of order</button>
        <p className="col-span-2 text-[12px] text-hms-muted">Bookings on those dates are not moved — the calendar shows them so you can move guests.</p>
      </div>
    </section>
  );
}
