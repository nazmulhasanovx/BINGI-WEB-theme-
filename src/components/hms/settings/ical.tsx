"use client";
// Settings › Website & channels › Calendar sync (iCal) — 22 Nov 2026.
// One calendar per room. Export: BinGi's closed dates as an .ics link the owner pastes into Airbnb / Booking.com / Vrbo.
// Import: the other site's .ics link, so its bookings block the room in BinGi.
// Truth: PROTOTYPE. Links are saved and checked for format only. BinGi does not publish or fetch any calendar yet.
// Feeds are keyed by the room code (stable; ids can change on re-seed).
// iCal carries dates only — never prices, guest names or payments.
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, Copy, Link2, RefreshCw, Search, Trash2, X } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { useRooms } from "@/lib/rooms/store";
import { useSettings, type IcalFeed } from "@/lib/settings/store";
import { Badge } from "../website/ui";

const SOURCES = ["Airbnb", "Booking.com", "Vrbo", "Agoda", "Google Calendar", "Other"] as const;
const COLOR: Record<string, string> = { Airbnb: "#e5484d", "Booking.com": "#003580", Vrbo: "#1d4ed8", Agoda: "#5c2d91", "Google Calendar": "#1a73e8", Other: "#6b7280" };
const HOW: Record<string, string> = {
  Airbnb: "Airbnb › your listing › Availability › Connect calendars › Import calendar. Paste the BinGi link there. To bring Airbnb bookings in, use Export calendar on the same screen and paste that link below.",
  "Booking.com": "Booking.com extranet › Rates & Availability › Sync calendars (shown for homes and apartments). Import the BinGi link, then copy Booking.com's export link below.",
  Vrbo: "Vrbo › Calendar › Import / Export. Import the BinGi link, then paste Vrbo's export link below.",
};

/** Guess the site from the link, so the owner does not have to pick it. */
export function sourceOf(url: string): (typeof SOURCES)[number] {
  const u = url.toLowerCase();
  if (u.includes("airbnb.")) return "Airbnb";
  if (u.includes("booking.com")) return "Booking.com";
  if (u.includes("vrbo.") || u.includes("homeaway.")) return "Vrbo";
  if (u.includes("agoda.")) return "Agoda";
  if (u.includes("google.com/calendar") || u.includes("calendar.google.")) return "Google Calendar";
  return "Other";
}
/** Format check only (prototype). Returns an error text, or "" when the link looks like a calendar link. */
export function checkIcal(url: string, own: string, have: string[]): string {
  const v = url.trim();
  if (!v) return "Paste the calendar link.";
  if (!/^(https?|webcal):\/\/[^\s/]+\.[^\s/]+\/\S*$/i.test(v)) return "This is not a web link. It should start with https://";
  if (!/(\.ics\b|ical|icalendar|calendar)/i.test(v)) return "This does not look like a calendar link. Look for “Export calendar” — the link usually ends in .ics";
  if (v.includes("bingi.app/ical/")) return "This is a BinGi link. Paste the other site's link here, and BinGi's link on the other site.";
  if (own && v === own) return "This is this room's own BinGi link.";
  if (have.includes(v)) return "This link is already added.";
  return "";
}
const newToken = () => Math.random().toString(36).slice(2, 10);
const exportUrl = (slug: string, code: string, token: string) => `https://bingi.app/ical/${slug}/${encodeURIComponent(code)}.ics?k=${token}`;

/** The Calendar sync card on Website & channels. */
export function IcalCard({ h }: { h: Hotel }) {
  const { st, save } = useSettings(h);
  const { st: rooms } = useRooms(h);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const cats = rooms.categories.filter((c) => !c.archived);
  const units = rooms.units.filter((u) => u.status !== "archived");
  const feeds = st.ical?.feeds ?? {};
  const linked = units.filter((u) => feeds[u.code]?.length).length;
  const groups = useMemo(() => cats.map((c) => ({ c, us: units.filter((u) => u.category === c.id && (!q || `${u.local} ${u.code} ${c.name}`.toLowerCase().includes(q.toLowerCase()))) })).filter((g) => g.us.length), [cats, units, q]);
  const unit = units.find((u) => u.id === open);
  return (
    <section className="rounded-2xl border border-hms-line bg-white" aria-label="Calendar sync (iCal)">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div className="min-w-0"><h2 className="text-[16px] font-semibold">Calendar sync (iCal)</h2>
          <p className="text-[13px] text-hms-muted">Share booked dates with Airbnb, Booking.com and Vrbo by link — one calendar per room.</p></div>
        <Badge tone="amber">Prototype · not live</Badge>
      </div>
      <ul className="flex flex-wrap gap-2 px-5 pb-3 pt-1 text-[12.5px]">
        {["Dates only — no price, no guest details", "Other sites check about every 30 min", "One link per room"].map((t) => <li key={t} className="rounded-full bg-[#f1f2f5] px-3 py-1 text-hms-muted">{t}</li>)}
      </ul>
      {units.length > 6 && <label className="mx-5 mb-2 flex h-10 items-center gap-2 rounded-xl border border-hms-line px-3 focus-within:border-hms-coral"><Search className="size-4 text-hms-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a room" aria-label="Find a room" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" /></label>}
      <div className="px-5">
        {groups.map(({ c, us }) => (
          <div key={c.id} className="border-t border-hms-line first:border-t-0">
            <p className="pb-1 pt-3 text-[12px] font-semibold uppercase tracking-wide text-hms-muted">{c.name}</p>
            <ul className="divide-y divide-hms-line">
              {us.map((u) => { const f = feeds[u.code] ?? []; return (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f1f2f5] text-hms-muted" aria-hidden><CalendarDays className="size-4" /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-[14.5px] font-semibold">Room {u.local || u.code}</b>
                    <span className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-hms-muted">{f.length ? f.map((x) => <span key={x.id} className="inline-flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: COLOR[x.src] ?? COLOR.Other }} />{x.src}</span>) : "Not linked"}</span></span>
                  <button onClick={() => setOpen(u.id)} aria-label={`Calendar for room ${u.local || u.code}`} className={clsx("h-9 shrink-0 rounded-full px-4 text-[14px] font-semibold", f.length ? "bg-[#f1f2f5] text-hms-ink hover:bg-[#e8eaee]" : "border border-hms-line bg-white text-hms-ink hover:border-hms-ink")}>{f.length ? "Manage" : "Link"}</button>
                </li>); })}
            </ul>
          </div>
        ))}
        {!units.length && <p className="py-4 text-[14px] text-hms-muted">Add rooms in <Link href="/hms/rooms" className="underline">Rooms</Link> first.</p>}
        {units.length > 0 && !groups.length && <p className="py-4 text-[14px] text-hms-muted">No room matches “{q}”.</p>}
      </div>
      <p className="flex flex-wrap items-center justify-between gap-2 border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">
        <span>{linked} of {units.length} rooms linked · prices still change on each site.</span>
        {st.ical?.token && <button onClick={() => { if (window.confirm("Make new links for every room? The old links stop working, and you must paste the new ones on each site.")) save((x) => { x.ical = { feeds: x.ical?.feeds ?? {}, token: newToken() }; }, "Calendar links renewed"); }} className="inline-flex items-center gap-1 font-semibold text-hms-ink hover:underline"><RefreshCw className="size-3.5" />Renew all links</button>}
      </p>
      {unit && <IcalSheet h={h} unitId={unit.code} name={`Room ${unit.local || unit.code}`} type={cats.find((c) => c.id === unit.category)?.name ?? ""} code={unit.code} onClose={() => setOpen(null)} />}
    </section>
  );
}

function IcalSheet({ h, unitId, name, type, code, onClose }: { h: Hotel; unitId: string; name: string; type: string; code: string; onClose: () => void }) {
  const { st, save } = useSettings(h);
  const token = st.ical?.token ?? "";
  const own = token ? exportUrl(h.slug, code, token) : "";
  const list = st.ical?.feeds[unitId] ?? [];
  const [url, setUrl] = useState("");
  const [src, setSrc] = useState<string>("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [how, setHow] = useState<keyof typeof HOW>("Airbnb");
  const ensure = () => { if (!token) save((x) => { x.ical = { feeds: x.ical?.feeds ?? {}, token: newToken() }; }); };
  const copy = async () => {
    const t = token || newToken();
    if (!token) save((x) => { x.ical = { feeds: x.ical?.feeds ?? {}, token: t }; });
    try { await navigator.clipboard.writeText(exportUrl(h.slug, code, t)); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  const add = () => {
    const e = checkIcal(url, own, list.map((x) => x.url)); if (e) return setErr(e);
    const f: IcalFeed = { id: `f${Date.now().toString(36)}`, src: src || sourceOf(url), url: url.trim(), added: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
    save((x) => { const c = x.ical ?? { token: token || newToken(), feeds: {} }; c.feeds = { ...c.feeds, [unitId]: [...(c.feeds[unitId] ?? []), f] }; x.ical = c; }, `${name}: ${f.src} calendar linked`);
    setUrl(""); setSrc(""); setErr("");
  };
  const remove = (f: IcalFeed) => save((x) => { if (!x.ical) return; x.ical.feeds = { ...x.ical.feeds, [unitId]: (x.ical.feeds[unitId] ?? []).filter((y) => y.id !== f.id) }; }, `${name}: ${f.src} calendar removed`);
  const guess = url.trim() ? sourceOf(url) : "";
  return createPortal(
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Calendar sync · ${name}`} onClick={(e) => e.stopPropagation()} className="hms-up flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-hms-line px-5 py-4">
          <span className="grid size-10 place-items-center rounded-xl bg-[#f1f2f5] text-hms-ink" aria-hidden><CalendarDays className="size-5" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[17px] font-bold">{name}</h2><p className="text-[12.5px] text-hms-muted">{type} · Calendar sync</p></div>
          <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full bg-[#f1f2f5] text-hms-muted hover:text-hms-ink"><X className="size-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <p className="text-[15px] font-semibold"><span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-hms-ink text-[12px] text-white">1</span>BinGi → other sites</p>
            <p className="mt-1 text-[13px] text-hms-muted">Paste this link on each site, so dates booked in BinGi close there too.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={own || "Your link is made when you copy it"} onFocus={(e) => { ensure(); e.target.select(); }} aria-label={`BinGi calendar link for ${name}`} className="h-11 min-w-0 flex-1 truncate rounded-xl border border-hms-line bg-[#f7f8fa] px-3 font-mono text-[12.5px] text-hms-ink outline-none" />
              <button onClick={copy} className={clsx("inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-[14px] font-semibold text-white", copied ? "bg-[#1c7d45]" : "bg-hms-ink hover:bg-black")}>{copied ? <><Check className="size-4" />Copied</> : <><Copy className="size-4" />Copy</>}</button>
            </div>
            <div className="mt-3 rounded-xl bg-[#f7f8fa] p-3">
              <div role="tablist" aria-label="Where to paste" className="flex gap-1">{Object.keys(HOW).map((k) => <button key={k} role="tab" aria-selected={how === k} onClick={() => setHow(k as keyof typeof HOW)} className={clsx("h-8 rounded-full px-3 text-[13px] font-semibold", how === k ? "bg-white text-hms-ink shadow-sm" : "text-hms-muted hover:text-hms-ink")}>{k}</button>)}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-hms-muted">{HOW[how]} <span className="text-[12px]">(Menu names can change on their side.)</span></p>
            </div>
          </section>

          <section>
            <p className="text-[15px] font-semibold"><span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-hms-ink text-[12px] text-white">2</span>Other sites → BinGi</p>
            <p className="mt-1 text-[13px] text-hms-muted">Paste each site&apos;s export link. Their bookings will close this room in BinGi.</p>
            {list.length > 0 && <ul className="mt-3 divide-y divide-hms-line rounded-xl border border-hms-line">
              {list.map((f) => (
                <li key={f.id} className="flex items-center gap-3 px-3.5 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold text-white" style={{ background: COLOR[f.src] ?? COLOR.Other }} aria-hidden>{f.src[0]}</span>
                  <span className="min-w-0 flex-1"><b className="block text-[14px] font-semibold">{f.src}</b><span className="block truncate font-mono text-[11.5px] text-hms-muted">{f.url}</span>
                    <span className="text-[12px] text-[#9a5b00]">Added {f.added} · link saved, checks start when sync is live</span></span>
                  <button onClick={() => remove(f)} aria-label={`Remove ${f.src} calendar`} className="grid size-8 shrink-0 place-items-center rounded-full text-hms-muted hover:bg-[#fdecec] hover:text-[#b42318]"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>}
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-hms-line px-3 focus-within:border-hms-coral"><Link2 className="size-4 shrink-0 text-hms-muted" />
                  <input value={url} onChange={(e) => { setUrl(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="https://… .ics" aria-label="Calendar link from the other site" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" /></label>
                <button onClick={add} className="h-11 shrink-0 rounded-xl bg-[#c8232e] px-4 text-[14px] font-semibold text-white hover:bg-[#a91d27]">Add</button>
              </div>
              {url.trim() && <label className="flex flex-wrap items-center gap-2 text-[13px] text-hms-muted">From
                <select value={src || guess} onChange={(e) => setSrc(e.target.value)} aria-label="Which site" className="h-8 rounded-lg border border-hms-line bg-white px-2 text-[13px] text-hms-ink outline-none">{SOURCES.map((x) => <option key={x}>{x}</option>)}</select></label>}
              {err && <p role="alert" className="text-[13px] font-medium text-[#b42318]">{err}</p>}
            </div>
          </section>

          <p className="rounded-xl bg-[#fffaf0] px-4 py-3 text-[13px] leading-relaxed text-[#7a4a0b]">
            iCal shares <b>dates only</b>. Each site checks the link on its own time (often about every 30 minutes), so a double booking can still happen in between. Change prices on each site yourself. For full OTA sync (rates, rooms, bookings) use <b>OTAs</b> above.
            <span className="mt-1 block text-[12px] text-[#9a5b00]">Prototype — BinGi does not publish or read any calendar yet.</span>
          </p>
        </div>
        <div className="flex justify-end border-t border-hms-line px-5 py-3"><button onClick={onClose} className="h-10 rounded-full bg-hms-ink px-5 text-[14px] font-semibold text-white hover:bg-black">Done</button></div>
      </div>
    </div>,
    document.body,
  );
}
