"use client";
// Cashbox — Today (open / closed / not opened), Movements, Closed days. Rules: src/lib/cashbox/store.ts.
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, Banknote, CircleCheck, Lock, RotateCcw, Search, Undo2, Wallet } from "lucide-react";
import { TODAY, useRooms } from "@/lib/rooms/store";
import { demoStays, DEMO_GUESTS } from "@/lib/bookings/demo";
import { APPROVAL_LIMIT, IN_LABEL, NOTES, OUT_LABEL, PETTY, fmtDate, fmtTime, label, tk, totals, useCashbox, type Day, type InSource, type Movement, type OutReason } from "@/lib/cashbox/store";
import { useProperty } from "../property";
import { Sheet, btnLine, btnPrimary, input, lbl } from "../guests/ui";

const card = "rounded-2xl border border-hms-line bg-white";
function useToast() { const [t, setT] = useState(""); const show = (m: string) => { setT(m); setTimeout(() => setT((x) => (x === m ? "" : x)), 2600); }; return [t, show] as const; }

/** Stays + checks shared with Dashboard and Guests (demo bookings; no bookings backend in the prototype). */
function useData() {
  const h = useProperty();
  const { st: rooms } = useRooms(h);
  const stays = useMemo(() => {
    const cat = new Map(rooms.categories.map((c) => [c.id, c]));
    const live = rooms.units.filter((u) => u.status === "published");
    const list = live.length ? live : rooms.units.filter((u) => u.status !== "archived");
    return demoStays(h.slug, list.map((u) => ({ code: u.code, type: cat.get(u.category)?.name ?? "Room", rate: u.rate ?? cat.get(u.category)?.baseRate ?? 0 })));
  }, [h.slug, rooms]);
  const names = useMemo(() => new Map(DEMO_GUESTS.map((g) => [g.id, g.name])), []);
  const refs = useMemo(() => stays.filter((s) => s.status !== "Checked out").map((s) => ({ code: s.code, guest: names.get(s.guestId) ?? "Guest" })), [stays, names]);
  const unpaid = stays.filter((s) => s.due > 0 && ((s.status === "Confirmed" && s.from === TODAY) || (s.status === "Checked in" && s.to === TODAY))).length;
  const ooo = rooms.units.filter((u) => u.status === "published" && u.ooo).length;
  const cb = useCashbox(h, refs);
  return { h, cb, refs, unpaid, ooo };
}

type Tab = "today" | "moves" | "days";
function Frame({ tab, children, toast, cb }: { tab: Tab; children: ReactNode; toast: string; cb: ReturnType<typeof useCashbox> }) {
  const h = useProperty();
  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-[1280px] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h1 className="text-[24px] font-bold tracking-[-0.01em]">Cashbox</h1><p className="text-[14.5px] text-hms-muted">Cash drawer for {h.name} · business date {fmtDate(TODAY)}</p></div>
        <details className="relative shrink-0">
          <summary className={clsx(btnLine, "cursor-pointer list-none [&::-webkit-details-marker]:hidden")}>Demo</summary>
          <div className="absolute right-0 top-full z-30 mt-1 w-[230px] rounded-xl border border-hms-line bg-white p-1 shadow-lg">
            <button onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; cb.reset(); }} className="block w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-hms-hover">Reset demo data</button>
            <button onClick={(e) => { (e.currentTarget.closest("details") as HTMLDetailsElement).open = false; cb.startFresh(); }} className="block w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-hms-hover">Start today again (not opened)</button>
          </div>
        </details>
      </div>
      <nav aria-label="Cashbox sections" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-hms-line">
        {([["today", "Today", "/hms/cashbox"], ["moves", "Movements", "/hms/cashbox/movements"], ["days", "Closed days", "/hms/cashbox/days"]] as const).map(([id, l, href]) => (
          <Link key={id} href={href} aria-current={tab === id ? "page" : undefined} className={clsx("-mb-px shrink-0 border-b-2 px-3 pb-2.5 pt-1 text-[14.5px] font-semibold", tab === id ? "border-hms-red text-hms-ink" : "border-transparent text-hms-muted hover:text-hms-ink")}>{l}</Link>
        ))}
      </nav>
      <div className="mt-5">{children}</div>
    </div>
    {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><CircleCheck className="size-4 shrink-0 text-[#7ee2a8]" />{toast}</div>}
    </div>
  );
}

// =================== Today ===================
export function TodayPage() {
  const { cb, refs, unpaid, ooo } = useData();
  const [toast, show] = useToast();
  const [sheet, setSheet] = useState<"in" | "out" | "close" | null>(null);
  const { today, open, t, last } = cb;
  const moves = cb.st.moves.filter((m) => m.day === TODAY).sort((a, b) => b.at.localeCompare(a.at));
  const by = <K extends string>(kind: "in" | "out", key: (m: Movement) => K | undefined) => {
    const g = new Map<K, number>();
    for (const m of moves.filter((x) => x.kind === kind && !x.reverses && !x.reversedBy)) { const k = key(m); if (k) g.set(k, (g.get(k) ?? 0) + m.amount); }
    return [...g.entries()].sort((a, b) => b[1] - a[1]);
  };
  if (!cb.st.days.length) return <Frame tab="today" toast={toast} cb={cb}><p role="status" className="p-8 text-[14px] text-hms-muted">Loading…</p></Frame>;
  return (
    <Frame tab="today" toast={toast} cb={cb}>
      {!today ? <OpenCard cb={cb} last={last} onDone={show} /> : (
        <>
          <div className={clsx("flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3", open ? "border-[#cfe7da] bg-[#eef8f2]" : "border-hms-line bg-[#f4f6f8]")}>
            <span className={clsx("size-2.5 rounded-full", open ? "bg-[#1c7d45]" : "bg-[#7b8190]")} aria-hidden />
            <p className="min-w-0 flex-1 text-[14.5px]">
              {open ? <><b>Open</b> since {fmtTime(today.openedAt)} · opened by {today.openedBy} with {tk(today.float)}</> : <><b>Closed</b> at {fmtTime(today.closedAt!)} by {today.closedBy} · opens again tomorrow</>}
            </p>
            {open && <div className="flex flex-wrap gap-2">
              <button onClick={() => setSheet("in")} className={clsx(btnLine, "h-10")}><ArrowDownLeft className="size-4 text-[#1c7d45]" aria-hidden />Cash in</button>
              <button onClick={() => setSheet("out")} className={clsx(btnLine, "h-10")}><ArrowUpRight className="size-4 text-[#b11c29]" aria-hidden />Cash out</button>
              <button onClick={() => setSheet("close")} className={clsx(btnPrimary, "h-10")}><Lock className="size-4" aria-hidden />Close day</button>
            </div>}
          </div>

          {open ? (
            <section className={clsx(card, "mt-4 p-5")} aria-labelledby="now">
              <p id="now" className="text-[14px] font-medium text-hms-muted">Cash in the drawer now (expected)</p>
              <p className="mt-1 text-[40px] font-bold leading-none tracking-[-0.02em] tabular-nums">{tk(t.now)}</p>
              <dl className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                <Part l="Opening float" v={tk(t.float)} />
                <span aria-hidden className="hidden text-center text-[20px] text-hms-muted sm:block">+</span>
                <Part l="Cash in today" v={tk(t.cin)} tone="text-[#1c7d45]" />
                <span aria-hidden className="hidden text-center text-[20px] text-hms-muted sm:block">−</span>
                <Part l="Cash out today" v={tk(t.cout)} tone="text-[#b11c29]" />
              </dl>
            </section>
          ) : <ClosedSummary d={today} />}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Breakdown title="Where cash came from" rows={by("in", (m) => m.source).map(([k, v]) => [IN_LABEL[k], v])} tone="bg-[#1c7d45]" empty="No cash in yet today." />
            <Breakdown title="Where cash went" rows={by("out", (m) => m.reason).map(([k, v]) => [OUT_LABEL[k], v])} tone="bg-[#b11c29]" empty="No cash out yet today." />
          </div>

          <section className={clsx(card, "mt-4 overflow-hidden")} aria-labelledby="recent">
            <div className="flex items-center justify-between gap-2 px-5 py-4"><div><h2 id="recent" className="text-[17px] font-bold">Today&apos;s movements</h2><p className="text-[13px] text-hms-muted">{moves.length} entries · entries can&apos;t be edited, only reversed</p></div><Link href="/hms/cashbox/movements" className="text-[14px] font-semibold text-hms-red">View all</Link></div>
            <MoveList moves={moves.slice(0, 6)} day={today} all={cb.st.moves} />
          </section>
        </>
      )}
      {sheet === "in" && <InSheet cb={cb} refs={refs} onClose={() => setSheet(null)} onDone={(m) => { show(m); setSheet(null); }} />}
      {sheet === "out" && <OutSheet cb={cb} onClose={() => setSheet(null)} onDone={(m) => { show(m); setSheet(null); }} />}
      {sheet === "close" && <CloseSheet cb={cb} unpaid={unpaid} ooo={ooo} onClose={() => setSheet(null)} onDone={(m) => { show(m); setSheet(null); }} />}
    </Frame>
  );
}
function Part({ l, v, tone }: { l: string; v: string; tone?: string }) {
  return <div className="rounded-xl bg-[#f4f6f8] px-4 py-3"><dt className="text-[13px] text-hms-muted">{l}</dt><dd className={clsx("text-[20px] font-bold tabular-nums", tone)}>{v}</dd></div>;
}
function Breakdown({ title, rows, tone, empty }: { title: string; rows: [string, number][]; tone: string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <section className={clsx(card, "p-5")} aria-label={title}>
      <h2 className="text-[16px] font-bold">{title}</h2>
      {rows.length ? <ul className="mt-3 space-y-3">{rows.map(([l, v]) => (
        <li key={l}><div className="flex justify-between gap-2 text-[14px]"><span>{l}</span><b className="tabular-nums">{tk(v)}</b></div><div className="mt-1 h-2 rounded-full bg-[#eef0f3]"><div className={clsx("h-2 rounded-full", tone)} style={{ width: `${Math.max(4, (v / max) * 100)}%` }} /></div></li>
      ))}</ul> : <p className="mt-3 text-[14px] text-hms-muted">{empty}</p>}
    </section>
  );
}
function ClosedSummary({ d }: { d: Day }) {
  const v = (d.counted ?? 0) - (d.expected ?? 0);
  return (
    <section className={clsx(card, "mt-4 p-5")} aria-label="Closing summary">
      <dl className="grid gap-2 sm:grid-cols-4">
        <Part l="Expected" v={tk(d.expected ?? 0)} />
        <Part l="Counted" v={tk(d.counted ?? 0)} />
        <Part l="Difference" v={v === 0 ? "Matched" : `${v > 0 ? "+" : ""}${tk(v)}`} tone={v === 0 ? "text-[#1c7d45]" : "text-[#8a5300]"} />
        <Part l="Kept for tomorrow" v={tk(d.carry ?? 0)} />
      </dl>
      {d.varianceNote && <p className="mt-3 text-[14px] text-hms-muted">Reason for difference: {d.varianceNote}</p>}
      {(d.deposit ?? 0) > 0 && <p className="mt-1 text-[14px] text-hms-muted">{tk(d.deposit!)} recorded as bank deposit at closing.</p>}
    </section>
  );
}

function OpenCard({ cb, last, onDone }: { cb: ReturnType<typeof useCashbox>; last?: Day; onDone: (m: string) => void }) {
  const carry = last?.carry ?? 0;
  const [f, setF] = useState(String(carry));
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const n = Number(f);
  const diff = f !== "" && n !== carry;
  const bad = f === "" || n < 0 || (diff && !note.trim());
  return (
    <section className={clsx(card, "mx-auto max-w-[560px] p-6")} aria-labelledby="open-h">
      <span className="grid size-12 place-items-center rounded-2xl bg-[#ffe7e4] text-hms-red"><Wallet className="size-6" aria-hidden /></span>
      <h2 id="open-h" className="mt-4 text-[20px] font-bold">Open today&apos;s cashbox</h2>
      <p className="mt-1 text-[14.5px] text-hms-muted">Count the cash in the drawer before the first payment.{last ? ` Last closing (${fmtDate(last.date)}) left ${tk(carry)}.` : ""}</p>
      <label htmlFor="cb-float" className={clsx(lbl, "mt-5")}>Opening float (৳)</label>
      <input id="cb-float" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value.replace(/\D/g, ""))} className={clsx(input, "text-[20px] font-semibold")} />
      {diff && <>
        <p className="mt-2 rounded-lg bg-[#fdf3d9] px-3 py-2 text-[13.5px] text-[#7a4a0b]">Different from last closing by {tk(n - carry)}. Add a reason.</p>
        <label htmlFor="cb-onote" className={clsx(lbl, "mt-3")}>Reason</label>
        <input id="cb-onote" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Manager added change" className={input} />
      </>}
      {tried && bad && <p className="mt-2 text-[13px] font-medium text-[#c81e1e]">{f === "" ? "Enter the float (0 if empty)" : "Add a reason for the difference"}</p>}
      <button onClick={() => { setTried(true); if (bad) return; cb.openDay(n, diff ? note.trim() : undefined); onDone(`Cashbox opened with ${tk(n)}`); }} className={clsx(btnPrimary, "mt-5 h-11 w-full")}>Open cashbox</button>
    </section>
  );
}

// =================== Movement list ===================
function MoveList({ moves, day, all, onReverse }: { moves: Movement[]; day?: Day; all: Movement[]; onReverse?: (m: Movement) => void }) {
  if (!moves.length) return <p className="border-t border-hms-line px-5 py-10 text-center text-[14.5px] text-hms-muted">No movements.</p>;
  const sorted = [...all.filter((m) => m.day === day?.date)].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id, undefined, { numeric: true }));
  const bal = new Map<string, number>();
  let run = day?.float ?? 0;
  for (const m of sorted) { run += m.kind === "in" ? m.amount : -m.amount; bal.set(m.id, run); }
  const canRev = (m: Movement) => !!onReverse && day?.date === TODAY && !day.closedAt && !m.reverses && !m.reversedBy && !m.auto;
  return (
    <>
      <div className="hidden border-t border-hms-line md:block">
        <table className="w-full text-[14px]">
          <thead><tr className="bg-[#f7f8fa] text-left text-[12.5px] font-semibold text-hms-muted"><th className="px-5 py-2.5">Time</th><th className="px-3 py-2.5">What</th><th className="px-3 py-2.5">Reference</th><th className="px-3 py-2.5">By</th><th className="px-3 py-2.5 text-right">Amount</th><th className="px-3 py-2.5 text-right">Balance</th>{onReverse && <th className="px-5 py-2.5"><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>{moves.map((m) => (
            <tr key={m.id} className={clsx("border-t border-hms-line/70", (m.reversedBy || m.reverses) && "text-hms-muted")}>
              <td className="whitespace-nowrap px-5 py-3 tabular-nums">{fmtTime(m.at)}</td>
              <td className="px-3 py-3"><span className="flex items-center gap-2"><Kind m={m} /><span className="min-w-0"><b className="block font-semibold text-hms-ink">{label(m)}{m.category ? ` · ${m.category}` : ""}</b>{(m.note || m.party || m.account) && <span className="block truncate text-[12.5px] text-hms-muted">{[m.party, m.account, m.note].filter(Boolean).join(" · ")}</span>}</span></span>{m.reversedBy && <span className="mt-1 inline-block rounded bg-hms-hover px-1.5 text-[12px] font-semibold">Reversed</span>}{m.auto && <span className="mt-1 inline-block rounded bg-[#eef2ff] px-1.5 text-[12px] font-semibold text-[#3949ab]" title="Posted automatically; fix it in the module it came from">Auto-posted</span>}</td>
              <td className="px-3 py-3 font-mono text-[13px]">{m.ref ?? "—"}</td>
              <td className="px-3 py-3 text-[13px]">{m.by}{m.approvedBy && <span className="block text-hms-muted">Approved: {m.approvedBy}</span>}</td>
              <td className={clsx("whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums", m.kind === "in" ? "text-[#1c7d45]" : "text-[#b11c29]")}>{m.kind === "in" ? "+" : "−"}{tk(m.amount)}</td>
              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{tk(bal.get(m.id) ?? 0)}</td>
              {onReverse && <td className="px-5 py-3 text-right">{canRev(m) && <button onClick={() => onReverse(m)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-hms-muted hover:bg-hms-hover hover:text-hms-ink" aria-label={`Reverse ${label(m)} ${tk(m.amount)} at ${fmtTime(m.at)}`}><Undo2 className="size-3.5" aria-hidden />Reverse</button>}</td>}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <ul className="divide-y divide-hms-line border-t border-hms-line md:hidden">{moves.map((m) => (
        <li key={m.id} className="flex items-start gap-3 px-4 py-3">
          <Kind m={m} />
          <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold">{label(m)}{m.category ? ` · ${m.category}` : ""}</p><p className="truncate text-[12.5px] text-hms-muted">{fmtTime(m.at)} · {m.ref ?? m.note ?? m.by}</p>{m.reversedBy && <span className="text-[12px] font-semibold text-hms-muted">Reversed</span>}{canRev(m) && <button onClick={() => onReverse!(m)} className="mt-1 text-[13px] font-semibold text-hms-red" aria-label={`Reverse ${label(m)} ${tk(m.amount)} at ${fmtTime(m.at)}`}>Reverse</button>}</div>
          <div className="text-right"><p className={clsx("font-semibold tabular-nums", m.kind === "in" ? "text-[#1c7d45]" : "text-[#b11c29]")}>{m.kind === "in" ? "+" : "−"}{tk(m.amount)}</p><p className="text-[12px] tabular-nums text-hms-muted">{tk(bal.get(m.id) ?? 0)}</p></div>
        </li>
      ))}</ul>
    </>
  );
}
function Kind({ m }: { m: Movement }) {
  return <span className={clsx("grid size-8 shrink-0 place-items-center rounded-lg", m.reverses ? "bg-hms-hover text-hms-muted" : m.kind === "in" ? "bg-[#e7f6ec] text-[#1c7d45]" : "bg-[#fde5e4] text-[#b11c29]")} aria-label={m.reverses ? "Reversal" : m.kind === "in" ? "Cash in" : "Cash out"} role="img">{m.reverses ? <RotateCcw className="size-4" /> : m.kind === "in" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</span>;
}

// =================== Movements tab ===================
export function MovementsPage() {
  const { cb } = useData();
  const [toast, show] = useToast();
  const days = [...cb.st.days].sort((a, b) => b.date.localeCompare(a.date));
  const [date, setDate] = useState(TODAY);
  const [q, setQ] = useState("");
  const [k, setK] = useState<"all" | "in" | "out">("all");
  const [rev, setRev] = useState<Movement | null>(null);
  const day = cb.st.days.find((d) => d.date === date);
  const t = totals(day, cb.st.moves);
  const list = cb.st.moves.filter((m) => m.day === date && (k === "all" || m.kind === k) && (!q || `${label(m)} ${m.ref ?? ""} ${m.note ?? ""} ${m.party ?? ""} ${m.category ?? ""} ${m.by}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Frame tab="moves" toast={toast} cb={cb}>
      <div className="flex flex-wrap items-center gap-2.5">
        <select aria-label="Business day" value={date} onChange={(e) => setDate(e.target.value)} className={clsx(input, "w-auto")}>
          {days.map((d) => <option key={d.date} value={d.date}>{fmtDate(d.date)}{d.date === TODAY ? " · today" : ""}{d.closedAt ? " · closed" : " · open"}</option>)}
        </select>
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#858c97] bg-white px-3"><Search className="size-4 text-hms-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, note, person" aria-label="Search movements" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" /></label>
        <div role="radiogroup" aria-label="Direction" className="flex rounded-lg bg-[#e9edf2] p-1">{([["all", "All"], ["in", "Cash in"], ["out", "Cash out"]] as const).map(([v, l]) => <button key={v} role="radio" aria-checked={k === v} onClick={() => setK(v)} className={clsx("h-9 rounded-md px-3 text-[13.5px] font-semibold", k === v ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}</div>
      </div>
      {day && <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Opening float", tk(t.float)], ["Cash in", tk(t.cin)], ["Cash out", tk(t.cout)], [day.closedAt ? "Left after closing" : "In drawer now", tk(t.now)]].map(([l, v]) => <div key={l} className={clsx(card, "px-4 py-3")}><p className="text-[13px] text-hms-muted">{l}</p><p className="text-[18px] font-bold tabular-nums">{v}</p></div>)}
      </div>}
      <section className={clsx(card, "mt-4 overflow-hidden")} aria-label="Movements">
        <div className="px-5 py-4"><h2 className="text-[17px] font-bold">Movements · {fmtDate(date)}</h2><p className="text-[13px] text-hms-muted">A permanent log. A mistake is fixed by a reversal, so both entries stay visible. Auto-posted entries are fixed in Payments, Meals or Other Services.</p></div>
        <MoveList moves={list} day={day} all={cb.st.moves} onReverse={setRev} />
      </section>
      {rev && <ReverseSheet m={rev} onClose={() => setRev(null)} onDone={(why) => { cb.reverse(rev.id, why); show(`${label(rev)} ${tk(rev.amount)} reversed`); setRev(null); }} />}
    </Frame>
  );
}
function ReverseSheet({ m, onClose, onDone }: { m: Movement; onClose: () => void; onDone: (why: string) => void }) {
  const [why, setWhy] = useState("");
  const [tried, setTried] = useState(false);
  return (
    <Sheet title="Reverse this entry" sub={`${label(m)} · ${m.kind === "in" ? "+" : "−"}${tk(m.amount)} at ${fmtTime(m.at)}`} onClose={onClose}
      footer={<><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={() => { setTried(true); if (why.trim()) onDone(why.trim()); }} className={clsx(btnPrimary, "flex-[1.4]")}>Reverse</button></>}>
      <p className="text-[14.5px]">A new entry of {m.kind === "in" ? "−" : "+"}{tk(m.amount)} is added. The original stays in the log, marked “Reversed”.</p>
      <label htmlFor="rv-why" className={clsx(lbl, "mt-4")}>Reason</label>
      <input id="rv-why" autoFocus value={why} onChange={(e) => setWhy(e.target.value)} placeholder="e.g. Wrong amount entered" className={input} />
      {tried && !why.trim() && <p className="mt-1 text-[13px] font-medium text-[#c81e1e]">Add a reason</p>}
    </Sheet>
  );
}

// =================== Cash in / Cash out ===================
function Err({ show, text }: { show: boolean; text: string }) { return show ? <p className="mt-1 text-[13px] font-medium text-[#c81e1e]">{text}</p> : null; }
function InSheet({ cb, refs, onClose, onDone }: { cb: ReturnType<typeof useCashbox>; refs: { code: string; guest: string }[]; onClose: () => void; onDone: (m: string) => void }) {
  const [amt, setAmt] = useState("");
  const [src, setSrc] = useState<InSource>("other");
  const [ref, setRef] = useState("");
  const [party, setParty] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const n = Number(amt);
  const e = { amt: !(n > 0), note: src === "other" && !note.trim() };
  const save = () => { setTried(true); if (e.amt || e.note) return; cb.add({ kind: "in", amount: n, source: src, ref: ref.trim() || undefined, party: party.trim() || undefined, note: note.trim() || undefined }); onDone(`${tk(n)} cash in recorded`); };
  return (
    <Sheet title="Cash in" sub="Cash received that didn't come through Payments or Meals." onClose={onClose}
      footer={<><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={save} className={clsx(btnPrimary, "flex-[1.4]")}>Record cash in</button></>}>
      <div className="space-y-4">
        <p className="rounded-lg bg-[#f4f6f8] px-3 py-2 text-[13px] text-hms-muted">Cash taken in Payments, Meals or Other Services posts here automatically in the live HMS. Use this only for other cash, so nothing is counted twice.</p>
        <div><label htmlFor="ci-a" className={lbl}>Amount (৳)</label><input id="ci-a" autoFocus inputMode="numeric" value={amt} onChange={(x) => setAmt(x.target.value.replace(/\D/g, ""))} className={clsx(input, "text-[18px] font-semibold")} /><Err show={tried && e.amt} text="Enter an amount" /></div>
        <div><p className={lbl}>From</p><div role="radiogroup" aria-label="Cash in from" className="grid grid-cols-2 gap-2">{(Object.keys(IN_LABEL) as InSource[]).map((k) => <button key={k} type="button" role="radio" aria-checked={src === k} onClick={() => setSrc(k)} className={clsx("h-11 rounded-lg border text-[14px] font-semibold", src === k ? "border-hms-ink shadow-[inset_0_0_0_1px] shadow-hms-ink" : "border-hms-line")}>{IN_LABEL[k]}</button>)}</div></div>
        <div><label htmlFor="ci-r" className={lbl}>Reference <span className="font-normal text-hms-muted">optional</span></label><input id="ci-r" list="ci-refs" value={ref} onChange={(x) => { setRef(x.target.value); const g = refs.find((r) => r.code === x.target.value); if (g && !party) setParty(g.guest); }} placeholder={src === "booking" ? "Booking number, e.g. BK-2401" : "Receipt or bill number"} className={input} /><datalist id="ci-refs">{refs.map((r) => <option key={r.code} value={r.code}>{r.guest}</option>)}</datalist></div>
        <div><label htmlFor="ci-p" className={lbl}>Received from <span className="font-normal text-hms-muted">optional</span></label><input id="ci-p" value={party} onChange={(x) => setParty(x.target.value)} placeholder="Name" className={input} /></div>
        <div><label htmlFor="ci-n" className={lbl}>Note {src !== "other" && <span className="font-normal text-hms-muted">optional</span>}</label><input id="ci-n" value={note} onChange={(x) => setNote(x.target.value)} placeholder="e.g. Sold old newspapers" className={input} /><Err show={tried && e.note} text="Say what this cash is for" /></div>
      </div>
    </Sheet>
  );
}
function OutSheet({ cb, onClose, onDone }: { cb: ReturnType<typeof useCashbox>; onClose: () => void; onDone: (m: string) => void }) {
  const [amt, setAmt] = useState("");
  const [rsn, setRsn] = useState<OutReason>("petty");
  const [cat, setCat] = useState("");
  const [party, setParty] = useState("");
  const [acct, setAcct] = useState("");
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [appr, setAppr] = useState("");
  const [tried, setTried] = useState(false);
  const n = Number(amt), have = cb.t.now;
  const needAppr = n > APPROVAL_LIMIT;
  const e = {
    amt: !(n > 0) ? "Enter an amount" : n > have ? `Only ${tk(have)} in the drawer` : "",
    cat: rsn === "petty" && !cat ? "Pick what it was for" : "",
    acct: (rsn === "bank" || rsn === "transfer") && !acct.trim() ? "Add the bank, account or place" : "",
    party: (rsn === "owner" || rsn === "refund") && !party.trim() ? (rsn === "refund" ? "Add the guest's name" : "Add who took the cash") : "",
    note: (rsn === "petty" || rsn === "refund") && !note.trim() ? "Add a short note" : "",
    appr: needAppr && !appr.trim() ? `Above ${tk(APPROVAL_LIMIT)} — add the approving manager` : "",
  };
  const bad = Object.values(e).some(Boolean);
  const save = () => { setTried(true); if (bad) return; cb.add({ kind: "out", amount: n, reason: rsn, category: rsn === "petty" ? cat : undefined, party: party.trim() || undefined, account: acct.trim() || undefined, ref: ref.trim() || undefined, note: note.trim() || undefined, approvedBy: needAppr ? appr.trim() : undefined }); onDone(`${tk(n)} ${OUT_LABEL[rsn].toLowerCase()} recorded`); };
  return (
    <Sheet title="Cash out" sub={`In the drawer now: ${tk(have)}`} onClose={onClose}
      footer={<><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={save} className={clsx(btnPrimary, "flex-[1.4]")}>Record cash out</button></>}>
      <div className="space-y-4">
        <div><label htmlFor="co-a" className={lbl}>Amount (৳)</label><input id="co-a" autoFocus inputMode="numeric" value={amt} onChange={(x) => setAmt(x.target.value.replace(/\D/g, ""))} className={clsx(input, "text-[18px] font-semibold")} /><Err show={tried && !!e.amt} text={e.amt} /></div>
        <div><p className={lbl}>Reason</p><div role="radiogroup" aria-label="Cash out reason" className="grid grid-cols-2 gap-2">{(Object.keys(OUT_LABEL) as OutReason[]).map((k) => <button key={k} type="button" role="radio" aria-checked={rsn === k} onClick={() => setRsn(k)} className={clsx("min-h-11 rounded-lg border px-2 text-[14px] font-semibold", rsn === k ? "border-hms-ink shadow-[inset_0_0_0_1px] shadow-hms-ink" : "border-hms-line")}>{OUT_LABEL[k]}</button>)}</div></div>
        {rsn === "petty" && <div><p className={lbl}>For</p><div role="radiogroup" aria-label="Petty cash for" className="flex flex-wrap gap-1.5">{PETTY.map((p) => <button key={p} type="button" role="radio" aria-checked={cat === p} onClick={() => setCat(p)} className={clsx("rounded-full border px-3 py-1.5 text-[13.5px]", cat === p ? "border-[#b11c29] bg-[#ffe7e4] font-semibold text-[#8e1621]" : "border-hms-line")}>{p}</button>)}</div><Err show={tried && !!e.cat} text={e.cat} /></div>}
        {(rsn === "owner" || rsn === "refund" || rsn === "transfer") && <div><label htmlFor="co-p" className={lbl}>{rsn === "refund" ? "Guest" : rsn === "transfer" ? "Handed to" : "Taken by"}</label><input id="co-p" value={party} onChange={(x) => setParty(x.target.value)} placeholder="Name" className={input} /><Err show={tried && !!e.party} text={e.party} /></div>}
        {(rsn === "bank" || rsn === "transfer") && <div><label htmlFor="co-ac" className={lbl}>{rsn === "bank" ? "Bank / account" : "To (place or cashbox)"}</label><input id="co-ac" value={acct} onChange={(x) => setAcct(x.target.value)} placeholder={rsn === "bank" ? "e.g. City Bank ···4417" : "e.g. Restaurant cashbox"} className={input} /><Err show={tried && !!e.acct} text={e.acct} /></div>}
        <div><label htmlFor="co-r" className={lbl}>Reference <span className="font-normal text-hms-muted">optional</span></label><input id="co-r" value={ref} onChange={(x) => setRef(x.target.value)} placeholder={rsn === "refund" ? "Booking number" : "Slip or receipt number"} className={input} /></div>
        <div><label htmlFor="co-n" className={lbl}>Note {!(rsn === "petty" || rsn === "refund") && <span className="font-normal text-hms-muted">optional</span>}</label><input id="co-n" value={note} onChange={(x) => setNote(x.target.value)} placeholder="What it was for" className={input} /><Err show={tried && !!e.note} text={e.note} /></div>
        {needAppr && <div><label htmlFor="co-ap" className={lbl}>Approved by (manager)</label><input id="co-ap" value={appr} onChange={(x) => setAppr(x.target.value)} placeholder="Manager's name" className={input} /><Err show={tried && !!e.appr} text={e.appr} /></div>}
      </div>
    </Sheet>
  );
}

// =================== Close day ===================
function CloseSheet({ cb, unpaid, ooo, onClose, onDone }: { cb: ReturnType<typeof useCashbox>; unpaid: number; ooo: number; onClose: () => void; onDone: (m: string) => void }) {
  const exp = cb.t.now;
  const [mode, setMode] = useState<"notes" | "total">("notes");
  const [qty, setQty] = useState<Record<number, string>>({});
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [carry, setCarry] = useState(String(cb.today?.float ?? 0));
  const [acct, setAcct] = useState("City Bank ···4417");
  const [tried, setTried] = useState(false);
  const counted = mode === "notes" ? NOTES.reduce((s, d) => s + d * (Number(qty[d]) || 0), 0) : Number(total) || 0;
  const touched = mode === "notes" ? Object.values(qty).some((v) => v !== "") : total !== "";
  const diff = counted - exp;
  const c = Math.min(Number(carry) || 0, counted);
  const dep = Math.max(0, counted - c);
  const e = {
    count: !touched ? "Count the cash first" : "",
    note: touched && diff !== 0 && !note.trim() ? "Explain the difference" : "",
    carry: carry === "" || Number(carry) > counted ? `Can keep up to ${tk(counted)}` : "",
    acct: dep > 0 && !acct.trim() ? "Where does the rest go?" : "",
  };
  const bad = Object.values(e).some(Boolean);
  const checks: [string, number | null, string][] = [
    ["Unpaid arrivals or departures", unpaid, "Collect or note them before closing"],
    ["Pending refunds", null, "Refunds are not connected in this prototype"],
    ["Open food orders", null, "Meals is not connected in this prototype"],
    ["Rooms out of order", ooo, "Not a cash issue — shown for the shift handover"],
  ];
  return (
    <Sheet wide title="Close today's cashbox" sub={`Expected in the drawer: ${tk(exp)}`} onClose={onClose}
      footer={<><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={() => { setTried(true); if (bad) return; cb.closeDay(counted, note.trim() || undefined, c, acct.trim()); onDone(diff === 0 ? "Day closed · cash matched" : `Day closed · difference ${diff > 0 ? "+" : ""}${tk(diff)}`); }} className={clsx(btnPrimary, "flex-[1.4]")}><Lock className="size-4" aria-hidden />Close day</button></>}>
      <div className="space-y-5">
        <section aria-label="Before closing">
          <h3 className="mb-2 text-[15px] font-bold">Before closing</h3>
          <ul className="grid gap-2 sm:grid-cols-2">{checks.map(([l, v, hint]) => (
            <li key={l} className={clsx("rounded-xl border px-3 py-2.5", v ? "border-[#f1dfb8] bg-[#fffaf0]" : "border-hms-line")}><p className="flex justify-between gap-2 text-[14px]"><span>{l}</span><b className="tabular-nums">{v ?? "—"}</b></p>{hint && (v || v === null) ? <p className="text-[12.5px] text-hms-muted">{hint}</p> : null}</li>
          ))}</ul>
        </section>
        <section aria-label="Count the cash">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="text-[15px] font-bold">Count the cash</h3>
            <div role="radiogroup" aria-label="Count by" className="flex rounded-lg bg-[#e9edf2] p-1">{([["notes", "Count notes"], ["total", "Enter total"]] as const).map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)} className={clsx("h-9 rounded-md px-3 text-[13.5px] font-semibold", mode === v ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}</div></div>
          {mode === "notes" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{NOTES.map((d) => (
              <label key={d} className="rounded-xl border border-hms-line p-2.5"><span className="flex items-center gap-1.5 text-[13px] font-semibold"><Banknote className="size-3.5 text-hms-muted" aria-hidden />৳{d}</span>
                <input inputMode="numeric" aria-label={`Number of ৳${d}`} value={qty[d] ?? ""} onChange={(x) => setQty({ ...qty, [d]: x.target.value.replace(/\D/g, "") })} placeholder="0" className="mt-1 h-9 w-full rounded-md border border-[#858c97] px-2 text-[15px] tabular-nums outline-none focus:border-hms-ink" />
                <span className="mt-1 block text-right text-[12px] text-hms-muted tabular-nums">{tk(d * (Number(qty[d]) || 0))}</span></label>
            ))}</div>
          ) : <input inputMode="numeric" aria-label="Counted total" value={total} onChange={(x) => setTotal(x.target.value.replace(/\D/g, ""))} placeholder="Counted total (৳)" className={clsx(input, "text-[18px] font-semibold")} />}
          <Err show={tried && !!e.count} text={e.count} />
          <dl className="mt-3 grid grid-cols-3 gap-2" aria-live="polite">
            <Part l="Expected" v={tk(exp)} />
            <Part l="Counted" v={tk(counted)} />
            <Part l="Difference" v={!touched ? "—" : diff === 0 ? "Matched" : `${diff > 0 ? "+" : ""}${tk(diff)}`} tone={!touched ? undefined : diff === 0 ? "text-[#1c7d45]" : "text-[#8a5300]"} />
          </dl>
          {touched && diff !== 0 && <div className="mt-3"><label htmlFor="cl-n" className={lbl}>Reason for the difference ({diff < 0 ? "short" : "over"})</label><input id="cl-n" value={note} onChange={(x) => setNote(x.target.value)} placeholder="e.g. Change given twice" className={input} /><Err show={tried && !!e.note} text={e.note} /></div>}
        </section>
        <section aria-label="After closing" className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="cl-c" className={lbl}>Keep in the drawer for tomorrow (৳)</label><input id="cl-c" inputMode="numeric" value={carry} onChange={(x) => setCarry(x.target.value.replace(/\D/g, ""))} className={input} /><Err show={tried && !!e.carry} text={e.carry} /></div>
          <div><label htmlFor="cl-a" className={lbl}>The rest ({tk(dep)}) goes to</label><input id="cl-a" value={acct} onChange={(x) => setAcct(x.target.value)} disabled={dep === 0} className={clsx(input, "disabled:bg-[#f4f6f8]")} /><Err show={tried && !!e.acct} text={e.acct} /></div>
          <p className="text-[12.5px] text-hms-muted sm:col-span-2">The rest is recorded as a bank deposit. After closing, today&apos;s entries are locked; tomorrow opens with the amount you keep.</p>
        </section>
      </div>
    </Sheet>
  );
}

// =================== Closed days ===================
export function DaysPage() {
  const { cb } = useData();
  const [toast] = useToast();
  const days = [...cb.st.days].filter((d) => d.closedAt).sort((a, b) => b.date.localeCompare(a.date));
  const short = days.reduce((s, d) => s + Math.min(0, (d.counted ?? 0) - (d.expected ?? 0)), 0);
  return (
    <Frame tab="days" toast={toast} cb={cb}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={clsx(card, "px-4 py-3")}><p className="text-[13px] text-hms-muted">Days closed</p><p className="text-[22px] font-bold">{days.length}</p></div>
        <div className={clsx(card, "px-4 py-3")}><p className="text-[13px] text-hms-muted">Days with a difference</p><p className="text-[22px] font-bold">{days.filter((d) => d.counted !== d.expected).length}</p></div>
        <div className={clsx(card, "px-4 py-3")}><p className="text-[13px] text-hms-muted">Total short</p><p className={clsx("text-[22px] font-bold tabular-nums", short && "text-[#b11c29]")}>{tk(short)}</p></div>
      </div>
      <section className={clsx(card, "mt-4 overflow-hidden")} aria-label="Closed days">
        {!days.length ? <p className="px-6 py-12 text-center text-[14.5px] text-hms-muted">No closed days yet.</p> : (
          <div className="overflow-x-auto" role="region" aria-label="Closed days table" tabIndex={0}>
            <table className="w-full min-w-[760px] text-[14px]">
              <thead><tr className="bg-[#f7f8fa] text-left text-[12.5px] font-semibold text-hms-muted"><th className="px-5 py-2.5">Day</th><th className="px-3 py-2.5">Opened</th><th className="px-3 py-2.5">Closed</th><th className="px-3 py-2.5 text-right">Expected</th><th className="px-3 py-2.5 text-right">Counted</th><th className="px-3 py-2.5">Difference</th><th className="px-3 py-2.5 text-right">Kept</th><th className="px-5 py-2.5 text-right">Deposited</th></tr></thead>
              <tbody>{days.map((d) => { const v = (d.counted ?? 0) - (d.expected ?? 0); return (
                <tr key={d.date} className="border-t border-hms-line/70 align-top">
                  <td className="whitespace-nowrap px-5 py-3 font-semibold">{fmtDate(d.date)}{d.date === TODAY && <span className="ml-1.5 text-[12px] font-normal text-hms-muted">today</span>}</td>
                  <td className="px-3 py-3 text-[13px]">{fmtTime(d.openedAt)} · {d.openedBy}<span className="block text-hms-muted">Float {tk(d.float)}</span></td>
                  <td className="px-3 py-3 text-[13px]">{fmtTime(d.closedAt!)} · {d.closedBy}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{tk(d.expected ?? 0)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{tk(d.counted ?? 0)}</td>
                  <td className="px-3 py-3"><span className={clsx("rounded-md px-2 py-0.5 text-[12.5px] font-semibold", v === 0 ? "bg-[#e7f6ec] text-[#1c7d45]" : v < 0 ? "bg-[#fde5e4] text-[#b11c29]" : "bg-[#fdf3d9] text-[#7a4a0b]")}>{v === 0 ? "Matched" : `${v > 0 ? "Over +" : "Short "}${tk(Math.abs(v))}`}</span>{d.varianceNote && <span className="mt-1 block max-w-[220px] text-[12.5px] text-hms-muted">{d.varianceNote}</span>}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{tk(d.carry ?? 0)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{tk(d.deposit ?? 0)}</td>
                </tr>
              ); })}</tbody>
            </table>
          </div>
        )}
      </section>
    </Frame>
  );
}
