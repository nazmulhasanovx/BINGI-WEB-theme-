"use client";
// Owner's morning summary: today's hotel in a few lines, ready to send to the owner by SMS or email.
// "Send now" uses the HMS messaging (credits are counted like any message). The daily schedule is saved on this device
// only — sending it automatically every morning needs the backend scheduler (not connected in this prototype).
import clsx from "clsx";
import { useState, useSyncExternalStore } from "react";
import { Mail, MessageSquareText, Send, Sunrise } from "lucide-react";
import { smsSafe } from "./bookings/send";

export type SummaryData = {
  hotel: string; day: string; arriving: number; leaving: number; inHouse: number; rooms: number; occupancy: number;
  revenue: string; collect: number; due: string; notReady: number | null; orders: number | null; priorities: string[];
};
type Comm = { send: (m: { channel: "sms" | "email"; to: string; guest: string; event: string; text: string }) => string };

const KEY = "bingi.dashboard.summary";
const subs = new Set<() => void>();
type Pref = { on: boolean; time: string; sms: boolean; email: boolean };
const DEF: Pref = { on: false, time: "08:00", sms: true, email: true };
let cache: { raw: string | null; v: Pref } | null = null;
const read = (): Pref => { let raw: string | null = null; try { raw = localStorage.getItem(KEY); } catch {} if (cache?.raw === raw) return cache.v; let v = DEF; try { v = raw ? { ...DEF, ...JSON.parse(raw) } : DEF; } catch {} cache = { raw, v }; return v; };
const write = (p: Pref) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} subs.forEach((f) => f()); };

export function summaryText(d: SummaryData) {
  return [
    `Good morning · ${d.hotel} · ${d.day}`,
    `Arriving ${d.arriving} · Leaving ${d.leaving} · In house ${d.inHouse}/${d.rooms} (${d.occupancy}%)`,
    `Room revenue today ${d.revenue}`,
    d.collect ? `To collect: ${d.collect} guest${d.collect > 1 ? "s" : ""} · ${d.due} due` : "Nothing to collect today",
    d.notReady !== null ? `Rooms not ready: ${d.notReady}` : "",
    d.orders !== null ? `Restaurant orders today: ${d.orders}` : "",
    d.priorities.length ? `Needs you: ${d.priorities.slice(0, 3).join("; ")}` : "",
  ].filter(Boolean).join("\n");
}

export function MorningSummary({ data, comm, phone, email }: { data: SummaryData; comm: Comm; phone: string; email: string }) {
  const pref = useSyncExternalStore((f) => (subs.add(f), () => void subs.delete(f)), read, () => DEF);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const text = summaryText(data);
  const set = (p: Partial<Pref>) => write({ ...pref, ...p });
  const sendNow = () => {
    setErr(""); setMsg("");
    const out: string[] = [];
    if (pref.sms && phone) { const e = comm.send({ channel: "sms", to: phone, guest: "Owner", event: "Morning summary", text: smsSafe(text) }); if (e) return setErr(e); out.push(`SMS to ${phone}`); }
    if (pref.email && email) { const e = comm.send({ channel: "email", to: email, guest: "Owner", event: "Morning summary", text }); if (e) return setErr(e); out.push(`email to ${email}`); }
    if (!out.length) return setErr("Turn on SMS or email first");
    setMsg(`Sent · ${out.join(" and ")}`);
  };
  const chip = (on: boolean) => clsx("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold", on ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white text-[#4d5664] hover:bg-hms-hover");
  return (
    <section aria-labelledby="ms" className="rounded-xl border border-hms-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#fff4df] text-[#b26a00]"><Sunrise className="size-5" aria-hidden /></span>
          <div><h2 id="ms" className="text-[16px] font-bold">Morning summary</h2><p className="text-[13px] text-hms-muted">Today&apos;s hotel in a few lines — for the owner&apos;s phone and inbox.</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-pressed={pref.sms} onClick={() => set({ sms: !pref.sms })} className={chip(pref.sms)}><MessageSquareText className="size-4" aria-hidden />SMS</button>
          <button type="button" aria-pressed={pref.email} onClick={() => set({ email: !pref.email })} className={chip(pref.email)}><Mail className="size-4" aria-hidden />Email</button>
          <button onClick={sendNow} className="btn-glow inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13.5px] font-semibold text-white"><Send className="size-4" aria-hidden />Send now</button>
        </div>
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#f6f7f9] p-4 font-sans text-[13.5px] leading-relaxed text-hms-ink">{text}</pre>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <label className="inline-flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={pref.on} onChange={(e) => set({ on: e.target.checked })} className="size-4 accent-[#b11c29]" />Send every morning at
        </label>
        <input type="time" aria-label="Time" value={pref.time} onChange={(e) => set({ time: e.target.value })} className="h-9 rounded-lg border border-hms-line px-2 text-[13.5px]" />
        <span className="text-hms-muted">To {[pref.sms && phone, pref.email && email].filter(Boolean).join(" · ") || "—"}</span>
        {pref.on && <span className="rounded-md bg-[#fdf3d9] px-2 py-0.5 text-[12px] font-semibold text-[#7a4a0b]">Prototype: saved here only — daily sending needs the server</span>}
      </div>
      {msg && <p role="status" className="mt-2 text-[13px] font-semibold text-[#16693a]">{msg}</p>}
      {err && <p role="alert" className="mt-2 text-[13px] font-semibold text-[#b42318]">{err}</p>}
    </section>
  );
}
