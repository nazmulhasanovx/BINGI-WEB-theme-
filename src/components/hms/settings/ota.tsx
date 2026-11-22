"use client";
// Settings › Website & channels › OTAs (22 Nov 2026): set-up flow per OTA — account, rooms, prices, sync.
// Truth: OTA sync is NOT live. Finishing the setup only sends the answers to BinGi ("Setup sent").
// Until it is live, OTA bookings are entered by hand in Bookings with the OTA booking ID.
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Plus, X } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { useRooms } from "@/lib/rooms/store";
import { useSettings, type OtaSetup } from "@/lib/settings/store";
import { OTAS } from "@/lib/bookings/store";
import { Badge } from "../website/ui";

const tk = (n: number) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
const META: Record<string, { color: string; idLabel: string; idHint: string; where: string }> = {
  "Booking.com": { color: "#003580", idLabel: "Booking.com Hotel ID", idHint: "A number, top-left of your Booking.com extranet", where: "Booking.com extranet" },
  Agoda: { color: "#5c2d91", idLabel: "Agoda Property ID", idHint: "In Agoda YCS, next to your property name", where: "Agoda YCS" },
  Expedia: { color: "#1f2b6c", idLabel: "Expedia Property ID", idHint: "In Expedia Partner Central, top of the page", where: "Expedia Partner Central" },
  Airbnb: { color: "#e5484d", idLabel: "Airbnb host account email", idHint: "The email you log in to Airbnb with", where: "Airbnb host account" },
};
const STEPS = ["Account", "Rooms", "Prices", "Sync"] as const;

function blank(cats: { id: string; name: string }[]): OtaSetup {
  return { has: true, propertyId: "", rooms: Object.fromEntries(cats.map((c) => [c.id, { on: true, otaName: c.name, allot: 0 }])), markup: 15, sync: { availability: true, rates: true, bookings: true, cancellations: true }, keep: 0, status: "draft" };
}

/** The OTA list on Website & channels. */
export function OtaCard({ h }: { h: Hotel }) {
  const { st, save } = useSettings(h);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="rounded-2xl border border-hms-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div><h2 className="text-[16px] font-semibold">OTAs</h2><p className="text-[13px] text-hms-muted">Set up once — BinGi connects it when OTA sync goes live.</p></div>
        <Badge tone="amber">Sync not live yet</Badge>
      </div>
      <ul className="divide-y divide-hms-line px-5">
        {OTAS.map((n) => {
          const o = st.otas?.[n]; const m = META[n];
          return (
            <li key={n} className="flex items-center gap-3 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-bold text-white" style={{ background: m.color }} aria-hidden>{n[0]}</span>
              <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold">{n}</b>
                <span className="text-[13px] text-hms-muted">{o?.status === "sent" ? `Setup sent ${o.sentAt ?? ""} · ${Object.values(o.rooms).filter((r) => r.on).length} room types · +${o.markup}%` : o ? "Setup started" : "Rates, availability and bookings"}</span></span>
              {o?.status === "sent" ? <Badge tone="blue">Waiting for BinGi</Badge> : null}
              <button onClick={() => setOpen(n)} className={clsx("h-9 rounded-full px-4 text-[14px] font-semibold", o ? "bg-[#f1f2f5] text-hms-ink hover:bg-[#e8eaee]" : "border border-hms-line bg-white text-hms-ink hover:border-hms-ink")}>{o ? (o.status === "sent" ? "View" : "Continue") : "Set up"}</button>
            </li>
          );
        })}
      </ul>
      <p className="flex flex-wrap items-center gap-1 border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">Until then, add OTA bookings by hand with the OTA booking ID. <Link href="/hms/bookings/new" className="inline-flex items-center gap-1 font-semibold text-hms-coral"><Plus className="size-3.5" />New booking</Link></p>
      {open && <OtaSetupSheet h={h} ota={open} start={st.otas?.[open]} onClose={() => setOpen(null)} onSave={(v, text) => save((x) => { x.otas = { ...x.otas, [open]: v }; }, text)} onRemove={() => { save((x) => { const n = { ...x.otas }; delete n[open]; x.otas = n; }, `${open} setup removed`); setOpen(null); }} />}
    </section>
  );
}

function OtaSetupSheet({ h, ota, start, onClose, onSave, onRemove }: { h: Hotel; ota: string; start?: OtaSetup; onClose: () => void; onSave: (v: OtaSetup, text?: string) => void; onRemove: () => void }) {
  const { st: rooms } = useRooms(h);
  const { st: s } = useSettings(h);
  const cats = rooms.categories.filter((c) => !c.archived);
  const [d, setD] = useState<OtaSetup>(() => { const b = start ?? blank(cats); for (const c of cats) b.rooms[c.id] ??= { on: true, otaName: c.name, allot: 0 }; return b; });
  const [step, setStep] = useState(start?.status === "sent" ? 3 : 0);
  const [err, setErr] = useState("");
  const m = META[ota];
  const sent = d.status === "sent";
  const count = (id: string) => rooms.units.filter((u) => u.category === id && u.status !== "archived").length;
  const vat = s.tax.vat, sc = s.tax.service;
  const up = (patch: Partial<OtaSetup>) => { setErr(""); setD({ ...d, ...patch }); };
  const next = () => {
    if (step === 0 && d.has && !d.propertyId.trim()) return setErr(`Enter your ${m.idLabel}.`);
    if (step === 1 && !Object.values(d.rooms).some((r) => r.on)) return setErr("Choose at least one room type to sell.");
    setErr(""); onSave(d); setStep(step + 1);
  };
  const send = () => { const v = { ...d, status: "sent" as const, sentAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }; setD(v); onSave(v, `${ota} setup sent to BinGi`); };
  const sample = cats.find((c) => c.baseRate > 0);
  return createPortal(
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Set up ${ota}`} onClick={(e) => e.stopPropagation()} className="hms-up flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-hms-line px-5 py-4">
          <span className="grid size-10 place-items-center rounded-xl text-[15px] font-bold text-white" style={{ background: m.color }} aria-hidden>{ota[0]}</span>
          <div className="min-w-0 flex-1"><h2 className="text-[17px] font-bold">Set up {ota}</h2><p className="text-[12.5px] text-hms-muted">Step {step + 1} of 4 · {STEPS[step]}</p></div>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full bg-[#f1f2f5] text-hms-muted hover:text-hms-ink"><X className="size-4" /></button>
        </div>
        <ol className="grid grid-cols-4 gap-1.5 px-5 pt-3" aria-label="Steps">{STEPS.map((x, i) => <li key={x} className={clsx("h-1.5 rounded-full", i <= step ? "bg-[#c8232e]" : "bg-[#e9edf2]")} title={x} />)}</ol>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === 0 && <div className="space-y-4">
            <p className="text-[15px] font-semibold">Is your property already on {ota}?</p>
            <div role="radiogroup" aria-label={`Already on ${ota}`} className="grid gap-2 sm:grid-cols-2">
              {([[true, "Yes, it is listed"], [false, "No, not yet"]] as const).map(([v, l]) => <button key={l} role="radio" aria-checked={d.has === v} onClick={() => up({ has: v })} className={clsx("flex h-12 items-center gap-2.5 rounded-xl border px-4 text-left text-[14.5px] font-medium", d.has === v ? "border-[#c8232e] bg-[#fff6f6]" : "border-hms-line hover:border-[#c9ced6]")}><span className={clsx("size-4 rounded-full border-2", d.has === v ? "border-[#c8232e] bg-[#c8232e] shadow-[inset_0_0_0_3px_white]" : "border-[#b8bdc7]")} />{l}</button>)}
            </div>
            {d.has ? <label className="block"><span className="text-[14px] font-medium">{m.idLabel}</span>
              <input value={d.propertyId} onChange={(e) => up({ propertyId: e.target.value.slice(0, 60) })} aria-label={m.idLabel} className="mt-1.5 h-11 w-full rounded-xl border border-hms-line px-3 text-[15px] outline-none focus:border-hms-coral" />
              <span className="mt-1 block text-[12.5px] text-hms-muted">{m.idHint}.</span></label>
              : <p className="rounded-xl bg-[#f4f6f8] px-4 py-3 text-[13.5px] text-hms-muted">Sign up as a partner on {ota} first, then come back with your ID. You can still finish the rest now — BinGi helps you with the listing.</p>}
            <p className="flex gap-2 rounded-xl bg-[#fffaf0] px-4 py-3 text-[13px] text-[#7a4a0b]"><ExternalLink className="mt-0.5 size-4 shrink-0" />When sync goes live, you will allow BinGi once in your {m.where}. Nothing to do there now.</p>
          </div>}

          {step === 1 && <div>
            <p className="text-[15px] font-semibold">Which rooms do you sell on {ota}?</p>
            <p className="text-[13px] text-hms-muted">Use the room name you have on {ota}, so bookings land in the right type.</p>
            <ul className="mt-3 divide-y divide-hms-line rounded-xl border border-hms-line">
              {cats.map((c) => { const r = d.rooms[c.id]; return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button role="switch" aria-checked={r.on} aria-label={`Sell ${c.name} on ${ota}`} onClick={() => up({ rooms: { ...d.rooms, [c.id]: { ...r, on: !r.on } } })} className={clsx("relative h-6 w-10 shrink-0 rounded-full transition-colors", r.on ? "bg-[#1c7d45]" : "bg-[#c6ccd4]")}><span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", r.on ? "left-[18px]" : "left-0.5")} /></button>
                  <span className="min-w-0 flex-1 basis-[140px]"><b className="block text-[14.5px] font-semibold">{c.name}</b><span className="text-[12.5px] text-hms-muted">{count(c.id)} rooms in BinGi</span></span>
                  {r.on && <input value={r.otaName} onChange={(e) => up({ rooms: { ...d.rooms, [c.id]: { ...r, otaName: e.target.value.slice(0, 60) } } })} aria-label={`${c.name} name on ${ota}`} placeholder={`Name on ${ota}`} className="h-10 w-full rounded-lg border border-hms-line px-3 text-[14px] outline-none focus:border-hms-coral sm:w-[220px]" />}
                </li>); })}
              {!cats.length && <li className="px-4 py-4 text-[14px] text-hms-muted">Add room types in <Link href="/hms/rooms" className="underline">Rooms</Link> first.</li>}
            </ul>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px]">Keep <input inputMode="numeric" value={String(d.keep)} onChange={(e) => up({ keep: Math.min(20, Number(e.target.value.replace(/\D/g, "")) || 0) })} aria-label="Rooms kept for direct guests" className="h-9 w-14 rounded-lg border border-hms-line text-center font-semibold tabular-nums outline-none focus:border-hms-coral" /> room(s) of each type for your website and walk-ins.</div>
          </div>}

          {step === 2 && <div>
            <p className="text-[15px] font-semibold">Price on {ota}</p>
            <p className="text-[13px] text-hms-muted">{ota} takes its commission from your price (set by your contract with {ota}). Many hotels add a little to cover it.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[15px]">Your BinGi price +
              {[0, 10, 15, 20].map((v) => <button key={v} aria-pressed={d.markup === v} onClick={() => up({ markup: v })} className={clsx("h-9 rounded-full border px-3.5 text-[14px] font-semibold", d.markup === v ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line hover:border-[#9aa0ac]")}>{v}%</button>)}
              <input inputMode="numeric" value={String(d.markup)} onChange={(e) => up({ markup: Math.min(50, Number(e.target.value.replace(/\D/g, "")) || 0) })} aria-label="Markup percent" className="h-9 w-14 rounded-lg border border-hms-line text-center font-semibold tabular-nums outline-none focus:border-hms-coral" />%
            </div>
            {sample ? <table className="mt-4 w-full overflow-hidden rounded-xl text-[13.5px] ring-1 ring-hms-line">
              <thead className="bg-[#f7f8fa] text-left text-[12px] text-hms-muted"><tr><th className="px-3 py-2 font-medium">Room</th><th className="px-3 py-2 text-right font-medium">BinGi price</th><th className="px-3 py-2 text-right font-medium">On {ota}</th><th className="px-3 py-2 text-right font-medium">Guest pays (VAT {vat}% + service {sc}%)</th></tr></thead>
              <tbody>{cats.filter((c) => c.baseRate > 0 && d.rooms[c.id]?.on).slice(0, 4).map((c) => { const o = Math.round(c.baseRate * (1 + d.markup / 100)); return <tr key={c.id} className="border-t border-hms-line tabular-nums"><td className="px-3 py-2.5 font-medium">{c.name}</td><td className="px-3 py-2.5 text-right">{tk(c.baseRate)}</td><td className="px-3 py-2.5 text-right font-semibold">{tk(o)}</td><td className="px-3 py-2.5 text-right">{tk(o * (1 + vat / 100 + sc / 100))}</td></tr>; })}</tbody>
            </table> : <p className="mt-4 text-[13.5px] text-hms-muted">Add prices to your room types to see the OTA price.</p>}
            <p className="mt-2 text-[12.5px] text-hms-muted">Offers and season prices from Discounts & Rates follow the same rule.</p>
          </div>}

          {step === 3 && <div>
            <p className="text-[15px] font-semibold">What BinGi keeps in sync</p>
            <ul className="mt-3 divide-y divide-hms-line rounded-xl border border-hms-line">
              {([["availability", "Open rooms", "Sold on BinGi → closed on " + ota], ["rates", "Prices", "Your price + " + d.markup + "%"], ["bookings", "New bookings", ota + " bookings appear in Bookings"], ["cancellations", "Changes and cancellations", "Room is opened again"]] as const).map(([k, l, sub]) => (
                <li key={k} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1"><b className="block text-[14.5px] font-semibold">{l}</b><span className="text-[12.5px] text-hms-muted">{sub}</span></span>
                  <button role="switch" aria-checked={d.sync[k]} aria-label={l} disabled={sent} onClick={() => up({ sync: { ...d.sync, [k]: !d.sync[k] } })} className={clsx("relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-60", d.sync[k] ? "bg-[#1c7d45]" : "bg-[#c6ccd4]")}><span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", d.sync[k] ? "left-[18px]" : "left-0.5")} /></button>
                </li>
              ))}
            </ul>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-xl bg-[#f7f8fa] px-4 py-3 text-[13.5px]">
              <dt className="text-hms-muted">{m.idLabel}</dt><dd className="font-semibold">{d.has ? d.propertyId : "Not on " + ota + " yet"}</dd>
              <dt className="text-hms-muted">Room types</dt><dd className="font-semibold">{cats.filter((c) => d.rooms[c.id]?.on).map((c) => c.name).join(", ") || "—"}</dd>
              <dt className="text-hms-muted">Price</dt><dd className="font-semibold">BinGi price + {d.markup}%{d.keep ? ` · keep ${d.keep} per type` : ""}</dd>
            </dl>
            {sent ? <p className="mt-4 flex gap-2 rounded-xl bg-[#eef3fd] px-4 py-3 text-[13.5px] text-[#1e3a8a]"><Check className="mt-0.5 size-4 shrink-0" />Sent to BinGi{d.sentAt ? ` on ${d.sentAt}` : ""}. OTA sync is not live yet — BinGi will contact you before switching it on.</p>
              : <p className="mt-4 rounded-xl bg-[#fffaf0] px-4 py-3 text-[13px] text-[#7a4a0b]">OTA sync is not live yet. Sending saves your setup with BinGi; nothing changes on {ota} now.</p>}
          </div>}
          {err && <p role="alert" className="mt-3 text-[13.5px] font-medium text-[#a3261f]">{err}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-hms-line px-5 py-3.5">
          {start && <button onClick={onRemove} className="mr-auto text-[13.5px] font-medium text-hms-muted hover:text-[#a3261f]">Remove setup</button>}
          {!start && <span className="mr-auto" />}
          {step > 0 && !sent && <button onClick={() => setStep(step - 1)} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-[14px] font-semibold text-hms-muted hover:text-hms-ink"><ArrowLeft className="size-4" />Back</button>}
          {step < 3 ? <button onClick={next} className="btn-glow inline-flex h-10 items-center gap-1.5 rounded-xl px-5 text-[14px] font-semibold text-white">Next<ArrowRight className="size-4" /></button>
            : sent ? <button onClick={onClose} className="h-10 rounded-xl bg-[#f1f2f5] px-5 text-[14px] font-semibold">Done</button>
            : <button onClick={send} className="btn-glow inline-flex h-10 items-center rounded-xl px-5 text-[14px] font-semibold text-white">Send to BinGi</button>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
