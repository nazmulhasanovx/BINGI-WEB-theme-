"use client";
// Hold a room for any guest for a set time. The room is blocked until then; if nobody confirms, it frees itself (no charge).
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { holdClock, stamp } from "@/lib/bookings/store";
import { input, lbl } from "../guests/ui";
import { bMain, bSoft } from "./ui";

export const HOLD_REASONS = ["Waiting for advance", "Guest will confirm", "Company approval", "Checking price"];
const SPANS: [number, string][] = [[30, "30 min"], [60, "1 hour"], [180, "3 hours"], [360, "6 hours"], [1440, "24 hours"]];

/** Local "YYYY-MM-DDTHH:MM" + minutes, in the same demo clock as stamp(). */
export function addMin(at: string, m: number) {
  const d = new Date(Date.parse(`${at}:00`) + m * 60000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
/** Latest a hold may run: the check-in time on arrival day (end of that day if that has passed). */
export const holdMax = (from: string, checkIn: string) => { const m = `${from}T${checkIn}`; return m > addMin(stamp(), 15) ? m : `${from >= TODAY ? from : TODAY}T23:59`; };

export type HoldValue = { until: string; reason: string };
export function HoldFields({ value, set, max }: { value: HoldValue; set: (v: HoldValue) => void; max: string }) {
  const now = stamp();
  const span = SPANS.find(([m]) => addMin(now, m) === value.until)?.[0];
  return (
    <div className="space-y-4">
      <div>
        <p className={lbl}>Hold for</p>
        <div role="radiogroup" aria-label="Hold for" className="flex flex-wrap gap-1.5">
          {SPANS.map(([m, l]) => { const until = addMin(now, m); const off = until > max; return <button key={m} type="button" role="radio" aria-checked={span === m} disabled={off} onClick={() => set({ ...value, until })} className={clsx("h-10 rounded-xl px-3.5 text-[14px] font-semibold transition-colors disabled:opacity-40", span === m ? "bg-[#ffecec] text-[#c8232e] ring-1 ring-[#f3c4c0]" : "bg-white ring-1 ring-hms-line hover:ring-hms-ink")}>{l}</button>; })}
        </div>
        <div className="mt-2.5 grid gap-1.5 sm:max-w-[280px]">
          <label htmlFor="hold-until" className="text-[13px] font-semibold text-hms-muted">Or pick a time</label>
          <input id="hold-until" type="datetime-local" min={addMin(now, 5)} max={max} value={value.until} onChange={(e) => e.target.value && set({ ...value, until: e.target.value })} className={input} />
        </div>
        <p className="mt-1.5 text-[12.5px] text-hms-muted">Latest: {holdClock(max)} (check-in time on arrival day).</p>
      </div>
      <div>
        <p className={lbl}>Why <span className="font-normal text-hms-muted">(optional)</span></p>
        <div className="flex flex-wrap gap-1.5">
          {HOLD_REASONS.map((r) => <button key={r} type="button" aria-pressed={value.reason === r} onClick={() => set({ ...value, reason: value.reason === r ? "" : r })} className={clsx("rounded-full px-3 py-1.5 text-[13px] font-semibold", value.reason === r ? "bg-hms-ink text-white" : "bg-[#eef0f3] text-[#3a414c] hover:bg-[#e3e6eb]")}>{r}</button>)}
        </div>
        <input aria-label="Hold note" value={HOLD_REASONS.includes(value.reason) ? "" : value.reason} onChange={(e) => set({ ...value, reason: e.target.value })} placeholder="Or write a note" className={clsx(input, "mt-2")} />
      </div>
    </div>
  );
}

/** Centered sheet for holding / extending a hold. */
export function HoldSheet({ title, children, onClose, onSave, saveLabel, error, busy }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; saveLabel: string; error?: string; busy?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="hms-up flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-hms-line px-5 py-4">
          <span className="grid size-10 place-items-center rounded-2xl bg-[#fdf3d9] text-[#7a4a0b]"><Clock className="size-5" /></span>
          <h2 className="mr-auto text-[17px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {error && <p role="alert" className="mx-5 mb-2 rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] font-medium text-[#b42318]">{error}</p>}
        <div className="flex gap-2 border-t border-hms-line px-5 py-3.5">
          <button onClick={onClose} className={bSoft}>Cancel</button>
          <button onClick={onSave} disabled={busy} className={clsx(bMain, "flex-1")}><Clock className="size-4" />{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}
