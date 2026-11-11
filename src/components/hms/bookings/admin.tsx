"use client";
import Link from "next/link";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { CircleCheck, Lock, Moon, Plane, Printer } from "lucide-react";
import { formCHtml, registerHtml } from "@/lib/bookings/docs";
import { printHtml } from "../meals/print";
import { useProperty } from "../property";
import { TODAY } from "@/lib/rooms/store";
import { DEFAULT_SETTINGS, OTAS, bill, dm, dmy, dueOf, policyFee, timeOf, tk, type Settings } from "@/lib/bookings/store";
import { input, lbl } from "../guests/ui";
import { BookingsFrame, ChannelBadge, bMain, bSoft, card, useBk } from "./ui";

function Box({ title, sub, children, action }: { title: string; sub?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className={clsx(card, "p-4 sm:p-5")}>
      <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="text-[16px] font-bold">{title}</h2>{sub && <p className="text-[13px] text-hms-muted">{sub}</p>}</div>{action}</div>
      {children}
    </section>
  );
}

// ---------------- Settings ----------------
function F({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return <div><label htmlFor={id} className={lbl}>{label}</label>{children}{hint && <p className="mt-1 text-[12.5px] text-hms-muted">{hint}</p>}</div>;
}
export function SettingsPage() {
  return <BookingsFrame tab="settings"><SettingsBody /></BookingsFrame>;
}
function SettingsBody() {
  const { bk, toast, mode } = useBk();
  const [s, setS] = useState<Settings>(bk.settings);
  const dirty = JSON.stringify(s) !== JSON.stringify(bk.settings);
  const num = (k: keyof Settings) => ({ value: String(s[k]), inputMode: "numeric" as const, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Number(e.target.value.replace(/\D/g, "")) || 0 }) });
  const pct = Math.min(100, s.cancelFeePct), nsp = Math.min(100, s.noShowFeePct);
  return (
    <div className="space-y-4 pb-24">
      <Box title="Check-in & check-out" sub="Shown on confirmations and used for early / late fees.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <F id="st-ci" label="Check-in from"><input id="st-ci" type="time" value={s.checkIn} onChange={(e) => setS({ ...s, checkIn: e.target.value })} className={input} /></F>
          <F id="st-co" label="Check-out by"><input id="st-co" type="time" value={s.checkOut} onChange={(e) => setS({ ...s, checkOut: e.target.value })} className={input} /></F>
          <F id="st-ef" label="Early check-in fee (৳)"><input id="st-ef" {...num("earlyFee")} className={input} /></F>
          <F id="st-lf" label="Late check-out fee (৳)"><input id="st-lf" {...num("lateFee")} className={input} /></F>
        </div>
      </Box>
      <Box title="Cancellation & no-show" sub="The fee is suggested by itself when staff cancel — they can still change it.">
        <div className="grid gap-4 sm:grid-cols-3">
          <F id="st-fd" label="Free cancellation until" hint={`${s.freeCancelDays} day${s.freeCancelDays === 1 ? "" : "s"} before arrival`}><input id="st-fd" {...num("freeCancelDays")} className={input} /></F>
          <F id="st-cf" label="Late cancellation fee (%)" hint={`${pct}% of the first night`}><input id="st-cf" {...num("cancelFeePct")} className={input} /></F>
          <F id="st-nf" label="No-show fee (%)" hint={`${nsp}% of the first night`}><input id="st-nf" {...num("noShowFeePct")} className={input} /></F>
        </div>
      </Box>
      <Box title="Security deposit">
        <div className="max-w-xs"><F id="st-dp" label="Default amount (৳)" hint="Held at check-in, not part of the bill."><input id="st-dp" {...num("depositDefault")} className={input} /></F></div>
      </Box>
      <Box title="Messages" sub="Words in {braces} fill in by themselves: {guest} {code} {hotel} {room} {from} {to} {nights} {total} {paid} {checkin} {link}">
        <div className="grid gap-4 lg:grid-cols-2">
          <F id="st-cm" label="Booking confirmation"><textarea id="st-cm" rows={4} value={s.confirmMsg} onChange={(e) => setS({ ...s, confirmMsg: e.target.value })} className={clsx(input, "h-auto py-2")} /></F>
          <F id="st-pm" label="Before arrival"><textarea id="st-pm" rows={4} value={s.preArrivalMsg} onChange={(e) => setS({ ...s, preArrivalMsg: e.target.value })} className={clsx(input, "h-auto py-2")} /></F>
        </div>
      </Box>
      {mode === "details" && <Box title="OTA connections" sub="Bookings from OTAs are entered by staff with the OTA booking ID.">
        <ul className="divide-y divide-hms-line">
          {OTAS.map((o) => <li key={o} className="flex items-center gap-3 py-2.5"><Plane className="size-4 text-[#5b45c9]" /><b className="flex-1 text-[14px]">{o}</b><span className="rounded-full bg-[#eef0f3] px-2.5 py-1 text-[12px] font-semibold text-[#4d5664]">Not connected · Coming soon</span></li>)}
        </ul>
        <p className="mt-2 text-[12.5px] text-hms-muted">Live OTA sync (rates, availability, bookings) is not built in this prototype.</p>
      </Box>}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-2 rounded-2xl border border-hms-line bg-white/95 p-3 backdrop-blur">
        <span className="flex-1 text-[13.5px] text-hms-muted">{dirty ? "You have unsaved changes" : "All saved"}</span>
        <button onClick={() => setS(DEFAULT_SETTINGS)} className={bSoft}>Use defaults</button>
        <button disabled={!dirty} onClick={() => { bk.saveSettings(s); toast("Booking settings saved"); }} className={clsx(bMain, !dirty && "opacity-50")}>Save</button>
      </div>
    </div>
  );
}

// ---------------- Day close (night audit) ----------------
export function DayClosePage() {
  return <BookingsFrame tab="close"><DayCloseBody /></BookingsFrame>;
}
function DayCloseBody() {
  const h = useProperty();
  const { bk, guests, toast, open } = useBk();
  const S = bk.settings;
  const L = bk.list;
  const notArrived = L.filter((b) => b.status === "Confirmed" && b.from <= TODAY);
  const overdue = L.filter((b) => b.status === "Checked in" && b.to <= TODAY);
  const owing = L.filter((b) => b.status === "Checked in" && dueOf(b) > 0);
  const arrivals = L.filter((b) => b.from === TODAY && (b.status === "Checked in" || b.status === "Checked out")).length;
  const departures = L.filter((b) => b.status === "Checked out" && (b.checkedOutAt ?? "").startsWith(TODAY)).length;
  const inHouse = L.filter((b) => b.status === "Checked in").length;
  const noShows = L.filter((b) => b.status === "No-show" && (b.cancel?.at ?? "").startsWith(TODAY)).length;
  // Tonight's room revenue: tonight's night of every stay in house (incl. VAT & service).
  const revenue = L.filter((b) => b.status === "Checked in" || b.status === "Checked out").reduce((s, b) => { const n = b.nights.find((x) => x.date === TODAY); return n ? s + bill({ nights: [n], tax: b.tax, discount: 0, mealPlan: b.mealPlan }).total : s; }, 0);
  const collected = L.reduce((s, b) => s + b.payments.filter((p) => p.at.startsWith(TODAY)).reduce((a, p) => a + p.amount, 0), 0);
  const closed = bk.audits.find((a) => a.date === TODAY);
  const open3 = notArrived.length + overdue.length;
  const noShow = (code: string) => { const b = L.find((x) => x.code === code)!; const fee = policyFee(b, "No-show", S); bk.cancel(code, "No-show", "Did not arrive", fee); toast(`${b.code} marked no-show${fee ? ` · fee ${tk(fee)}` : ""}`); };
  const name = (id: string) => guests.get(id)?.name ?? "Guest";
  return (
    <div className="space-y-4">
      <div className={clsx(card, "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
        <span className="grid size-11 place-items-center rounded-xl bg-[#eef0ff] text-[#3d4bd6]"><Moon className="size-5" /></span>
        <div className="min-w-0 flex-1"><h2 className="text-[17px] font-bold">Close {dmy(TODAY)}</h2><p className="text-[13.5px] text-hms-muted">{closed ? `Closed at ${timeOf(closed.at)} by ${closed.by}` : open3 ? `${open3} thing${open3 > 1 ? "s" : ""} to check first` : "Everything is checked — ready to close"}</p></div>
        {closed ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f5ec] px-3 py-1.5 text-[13.5px] font-semibold text-[#16693a]"><Lock className="size-4" />Day closed</span>
          : <button onClick={() => { bk.closeDay({ date: TODAY, arrivals, departures, noShows, inHouse, revenue, collected }); toast(`${dm(TODAY)} closed`); }} className={bMain}>Close the day</button>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi k="Arrived" v={arrivals} /><Kpi k="Left" v={departures} /><Kpi k="In house" v={inHouse} /><Kpi k="No-shows" v={noShows} /><Kpi k="Room revenue" v={tk(revenue)} /><Kpi k="Collected" v={tk(collected)} />
      </div>
      <Box title="Not arrived" sub={`No-show fee: ${S.noShowFeePct}% of the first night`}>
        {notArrived.length ? <ul className="divide-y divide-hms-line">{notArrived.map((b) => (
          <li key={b.code} className="flex flex-wrap items-center gap-3 py-2.5">
            <button onClick={() => open(b.code)} className="min-w-0 flex-1 text-left"><b className="block text-[14px]">{name(b.guestId)}</b><span className="flex items-center gap-2 text-[12.5px] text-hms-muted">{b.code} · {b.unit ? `Room ${b.unit}` : "No room"} · {dm(b.from)}<ChannelBadge b={b} /></span></button>
            <button onClick={() => open(b.code, "checkin")} className={clsx(bSoft, "!h-9 px-3 text-[13.5px]")}>Check in</button>
            <button onClick={() => noShow(b.code)} aria-label={`Mark ${name(b.guestId)} no-show`} className="h-9 rounded-xl bg-[#fdecec] px-3 text-[13.5px] font-semibold text-[#b42318]">No-show · {tk(policyFee(b, "No-show", S))}</button>
          </li>))}</ul> : <Ok text="Everyone due today has arrived." />}
      </Box>
      <div className="grid gap-4 lg:grid-cols-2">
        <Box title="Check-out overdue">
          {overdue.length ? <ul className="divide-y divide-hms-line">{overdue.map((b) => <li key={b.code} className="flex items-center gap-3 py-2.5"><span className="min-w-0 flex-1"><b className="block text-[14px]">{name(b.guestId)}</b><span className="text-[12.5px] text-hms-muted">Room {b.unit} · due out {dm(b.to)}</span></span><button onClick={() => open(b.code, "checkout")} className={clsx(bSoft, "!h-9 px-3 text-[13.5px]")}>Check out</button></li>)}</ul> : <Ok text="No overdue check-outs." />}
        </Box>
        <Box title="In house with a balance" sub={owing.length ? `${tk(owing.reduce((s, b) => s + dueOf(b), 0))} still to collect` : undefined}>
          {owing.length ? <ul className="divide-y divide-hms-line">{owing.map((b) => <li key={b.code} className="flex items-center gap-3 py-2.5"><button onClick={() => open(b.code)} className="min-w-0 flex-1 text-left"><b className="block text-[14px]">{name(b.guestId)}</b><span className="text-[12.5px] text-hms-muted">Room {b.unit}</span></button><b className="tabular-nums text-[#b42318]">{tk(dueOf(b))}</b></li>)}</ul> : <Ok text="All in-house guests are paid up." />}
        </Box>
      </div>
      <Box title="Registers for tonight" sub="Daily guest register and foreign-guest list (Form-C) — print or save as PDF.">
        {(() => { const rows = L.filter((b) => b.status === "Checked in").sort((a, c) => a.unit.localeCompare(c.unit, undefined, { numeric: true })).map((b) => ({ b, g: guests.get(b.guestId) })); const foreign = rows.filter((r) => r.g && r.g.country !== "Bangladesh"); const missing = rows.filter((r) => !r.g?.idNo).length; return (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => printHtml(registerHtml(h, TODAY, rows))} className={clsx(bSoft, "!h-10")}><Printer className="size-4" />Guest register · {rows.length}</button>
            <button onClick={() => printHtml(formCHtml(h, TODAY, foreign))} className={clsx(bSoft, "!h-10")}><Printer className="size-4" />Form-C · {foreign.length} foreign</button>
            {missing > 0 && <span className="text-[13px] font-semibold text-[#a15c00]">{missing} guest{missing > 1 ? "s" : ""} without ID number</span>}
          </div>); })()}
      </Box>
      <Box title="Closed days">
        {bk.audits.length ? <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-[13.5px]"><thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="py-2 font-semibold">Date</th><th className="font-semibold">Arrived</th><th className="font-semibold">Left</th><th className="font-semibold">In house</th><th className="font-semibold">No-shows</th><th className="text-right font-semibold">Revenue</th><th className="text-right font-semibold">Collected</th></tr></thead>
          <tbody className="divide-y divide-hms-line">{bk.audits.map((a) => <tr key={a.date + a.at}><td className="py-2 font-semibold">{dm(a.date)}<span className="block text-[12px] font-normal text-hms-muted">{timeOf(a.at)} · {a.by}</span></td><td>{a.arrivals}</td><td>{a.departures}</td><td>{a.inHouse}</td><td>{a.noShows}</td><td className="text-right tabular-nums">{tk(a.revenue)}</td><td className="text-right tabular-nums">{tk(a.collected)}</td></tr>)}</tbody></table></div>
          : <p className="text-[14px] text-hms-muted">No day closed yet. <Link href="/hms/cashbox" className="font-semibold text-hms-red">Cash is closed in Cashbox</Link>.</p>}
      </Box>
    </div>
  );
}
function Kpi({ k, v }: { k: string; v: ReactNode }) {
  return <div className="rounded-xl bg-[#f7f8fa] px-3.5 py-3"><p className="text-[12.5px] font-semibold text-hms-muted">{k}</p><p className="text-[19px] font-bold tabular-nums">{v}</p></div>;
}
function Ok({ text }: { text: string }) {
  return <p className="flex items-center gap-2 py-1 text-[14px] text-[#16693a]"><CircleCheck className="size-4" />{text}</p>;
}
