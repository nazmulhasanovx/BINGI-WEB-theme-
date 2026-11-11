"use client";
import Link from "next/link";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, CircleAlert, Minus, Plus, Search, UserRound } from "lucide-react";
import { TODAY, taxOf, type Unit } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { CHANNELS, METHODS, bill, dm, dow, nightsBetween, tk, useBookings, type Channel, type NewBooking, type Night, type PayMethod } from "@/lib/bookings/store";
import { useBkMode } from "@/lib/bookings/mode";
import { useRates } from "@/lib/rates/store";
import { COUNTRIES, phoneKey, useGuests, validPhone } from "@/lib/guests/store";
import { drawerFor, postCash } from "@/lib/cashbox/store";
import { imgSrc } from "@/lib/img";
import { useProperty } from "../property";
import { useCashboxData } from "../cashbox/pages";
import { input, lbl } from "../guests/ui";
import { ModeSwitch, bMain, bSmall } from "./ui";

const Step = ({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) => (
  <section className="rounded-2xl border border-hms-line bg-white p-4 sm:p-5" aria-labelledby={`s${n}`}>
    <div className="mb-3 flex items-start gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-hms-ink text-[13px] font-bold text-white">{n}</span><div><h2 id={`s${n}`} className="text-[17px] font-bold leading-7">{title}</h2>{sub && <p className="text-[13px] text-hms-muted">{sub}</p>}</div></div>
    {children}
  </section>
);
function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div><p className={lbl}>{label}</p>
      <div className="flex h-11 items-center rounded-lg border border-[#858c97] bg-white">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`} className="grid h-full w-10 place-items-center disabled:opacity-30"><Minus className="size-4" /></button>
        <span className="flex-1 text-center text-[15px] font-semibold tabular-nums" aria-live="polite">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`More ${label.toLowerCase()}`} className="grid h-full w-10 place-items-center disabled:opacity-30"><Plus className="size-4" /></button>
      </div>
    </div>
  );
}

export function NewBookingPage() {
  const h = useProperty();
  const sp = useSearchParams();
  const router = useRouter();
  const bk = useBookings(h);
  const rates = useRates(h);
  const g = useGuests(h);
  const cbx = useCashboxData();
  const { mode } = useBkMode();
  const qFrom = sp.get("from");
  const [from, setFrom] = useState(qFrom && qFrom >= TODAY ? qFrom : TODAY);
  const [to, setTo] = useState(addDays(qFrom && qFrom >= TODAY ? qFrom : TODAY, 1));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [picked, setPicked] = useState<string[]>(() => (sp.get("room") ? [sp.get("room")!] : []));
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [gname, setGname] = useState("");
  const [email, setEmail] = useState("");
  const [useId, setUseId] = useState<string | null>(() => sp.get("guest"));
  const [advance, setAdvance] = useState("");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [channel, setChannel] = useState<Channel>("Walk-in");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const n = nightsBetween(from, to);
  const datesOk = from >= TODAY && to > from;
  const free = useMemo(() => (datesOk ? new Set(bk.freeUnits(from, to).map((u) => u.code)) : new Set<string>()), [bk, from, to, datesOk]);
  // Price each night from Discounts & Rates (room price + automatic deal). Closed nights and min stay block the room type.
  const priceUnit = (code: string): { nights: Night[]; closed?: string; deal?: string } => {
    const u = bk.unitByCode.get(code)!;
    const out: Night[] = []; let closed: string | undefined; let deal: string | undefined;
    for (let d = from; d < to; d = addDays(d, 1)) {
      const p = rates.unitPrice(u, d); if (p.closed && !closed) closed = d;
      const dl = rates.deal(u.category, d, p.price, u.id); if (dl) deal = dl.c.name;
      out.push({ date: d, base: dl?.price ?? p.price });
    }
    return { nights: out, closed, deal };
  };
  const groups = useMemo(() => {
    const m = new Map<string, Unit[]>();
    for (const u of bk.units) m.set(u.category, [...(m.get(u.category) ?? []), u]);
    return [...m.entries()].map(([id, us]) => ({ id, cat: bk.cats.get(id)!, units: us.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })) })).filter((x) => x.cat);
  }, [bk.units, bk.cats]);

  const lines = datesOk ? picked.filter((c) => free.has(c)).map((c) => { const u = bk.unitByCode.get(c)!; const cat = bk.cats.get(u.category)!; const p = priceUnit(c); return { code: c, u, cat, ...p, tax: taxOf(cat) }; }) : [];
  const lost = picked.filter((c) => !free.has(c));
  const disc = Math.min(Number(discount) || 0, lines.reduce((s, l) => s + l.nights.reduce((a, x) => a + x.base, 0), 0));
  const bills = lines.map((l, i) => bill({ nights: l.nights, tax: l.tax, discount: i === 0 ? disc : 0 }));
  const sum = { rooms: bills.reduce((s, b) => s + b.rooms, 0), service: bills.reduce((s, b) => s + b.service, 0), vat: bills.reduce((s, b) => s + b.vat, 0), total: bills.reduce((s, b) => s + b.total, 0) };
  const cap = lines.reduce((s, l) => s + l.cat.maxAdults + l.cat.maxChildren, 0);
  const minStay = lines.map((l) => rates.st.cat[l.u.category]?.[from]?.minStay).find((m) => m && n < m);

  // Guest: phone first, find an existing guest.
  const found = phoneKey(phone).length >= 8 ? g.findByPhone(phone) : undefined;
  const guest = useId ? g.rows.find((r) => r.id === useId) : undefined;
  const phoneOk = validPhone(phone, country);
  const adv = Math.min(Number(advance) || 0, sum.total);

  const errors = {
    dates: !datesOk ? (from < TODAY ? "Check-in can't be in the past" : "Check-out must be after check-in") : "",
    rooms: !lines.length ? "Pick at least one room" : lines.find((l) => l.closed) ? `${lines.find((l) => l.closed)!.cat.name} is closed for sale on ${dm(lines.find((l) => l.closed)!.closed!)} (Discounts & Rates)` : minStay ? `Minimum stay is ${minStay} nights from ${dm(from)}` : adults + children > cap ? `Too many guests for ${lines.length === 1 ? "this room" : "these rooms"} (max ${cap})` : "",
    guest: guest ? (guest.blocked ? `${guest.name} is blocked (${guest.blocked.reason}) — unblock in Guests first` : "") : !phoneOk ? "Enter a valid phone number" : found ? "This phone belongs to a saved guest — use them" : gname.trim().length < 2 ? "Enter the guest's name" : "",
  };
  const ok = !errors.dates && !errors.rooms && !errors.guest;

  const submit = () => {
    setTried(true); setErr("");
    if (!ok || busy) return;
    setBusy(true);
    let guestId = guest?.id;
    if (!guestId) {
      guestId = g.nextId();
      g.saveGuest({ id: guestId, name: gname.trim(), phone: phone.trim(), email: email.trim(), country, address: "", idType: "", idNo: "", verified: false, vip: false, prefs: [], notes: "", marketing: !!email.trim(), created: TODAY });
    }
    if (adv > 0 && method === "Cash" && !drawerFor(h, cbx.refs, "front-desk").open) { setBusy(false); return setErr("Main cashbox is not open — open it, choose another method, or take the advance later."); }
    const items: NewBooking[] = lines.map((l, i) => ({
      guestId: guestId!, unit: l.code, categoryId: l.u.category, type: l.cat.name, from, to,
      adults: i === 0 ? Math.max(1, adults - (lines.length - 1)) : 1, children: i === 0 ? children : 0,
      channel, nights: l.nights, tax: l.tax, discount: i === 0 ? disc : 0, note: note.trim(),
      advance: i === 0 && adv > 0 ? { amount: adv, method } : undefined,
    }));
    const r = bk.create(items);
    if (!r.ok) { setBusy(false); return setErr(r.error); }
    if (adv > 0 && method === "Cash") postCash(h, cbx.refs, "front-desk", { amount: adv, source: "booking", ref: r.codes[0], party: guest?.name ?? gname.trim() });
    router.push(`/hms/bookings?b=${r.codes[0]}&made=${encodeURIComponent(`${r.codes.length > 1 ? `${r.codes.length} rooms booked` : `${r.codes[0]} booked`} for ${guest?.name ?? gname.trim()}`)}`);
  };

  const toggle = (c: string) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));
  const summary = (
    <div className="rounded-2xl border border-hms-line bg-white p-4 sm:p-5">
      <h2 className="text-[17px] font-bold">Summary</h2>
      <p className="mt-1 text-[14px] text-[#4d5664]">{datesOk ? `${dow(from)} ${dm(from)} → ${dow(to)} ${dm(to)} · ${n} night${n > 1 ? "s" : ""}` : "Pick dates"}</p>
      <div className="mt-3 space-y-1 text-[14px]">
        {lines.length ? lines.map((l, i) => <div key={l.code} className="flex justify-between gap-3"><span>Room {l.code} <span className="text-hms-muted">· {l.cat.name}</span>{l.deal && <span className="block text-[12px] text-[#16693a]">{l.deal} applied</span>}</span><span className="tabular-nums">{tk(bills[i].rooms)}</span></div>) : <p className="text-hms-muted">No room picked yet.</p>}
        {lines.length > 0 && <>
          {disc > 0 && <div className="flex justify-between text-[#16693a]"><span>Discount</span><span>−{tk(disc)}</span></div>}
          <div className="flex justify-between text-[#4d5664]"><span>Service charge</span><span className="tabular-nums">{tk(sum.service)}</span></div>
          <div className="flex justify-between text-[#4d5664]"><span>VAT</span><span className="tabular-nums">{tk(sum.vat)}</span></div>
          <div className="flex justify-between border-t border-hms-line pt-2 text-[17px] font-bold"><span>Total</span><span className="tabular-nums">{tk(sum.total)}</span></div>
          {adv > 0 && <div className="flex justify-between text-[#4d5664]"><span>Advance ({method})</span><span className="tabular-nums">−{tk(adv)}</span></div>}
          <div className="flex justify-between font-semibold"><span>Due at the hotel</span><span className="tabular-nums">{tk(sum.total - adv)}</span></div>
        </>}
      </div>
      {tried && !ok && <ul role="alert" className="mt-3 space-y-1 rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] font-medium text-[#b42318]">{Object.values(errors).filter(Boolean).map((e) => <li key={e} className="flex gap-1.5"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />{e}</li>)}</ul>}
      {err && <p role="alert" className="mt-3 rounded-lg bg-[#fdecec] px-3 py-2 text-[13px] font-medium text-[#b42318]">{err}</p>}
      <button onClick={submit} disabled={busy} className={clsx(bMain, "mt-4 !h-12 w-full text-[15px]")}>Confirm booking{sum.total ? ` · ${tk(sum.total)}` : ""}</button>
      <p className="mt-2 text-center text-[12px] text-hms-muted">Incl. VAT &amp; service · prices from Discounts &amp; Rates</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-[#f4f6f8]"><div className="hms-page">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/hms/bookings" aria-label="Back to bookings" className="grid size-10 place-items-center rounded-xl border border-hms-line bg-white hover:bg-hms-hover"><ArrowLeft className="size-5" /></Link>
        <div className="mr-auto min-w-0"><h1 className="text-[24px] font-bold tracking-[-0.01em]">New booking</h1><p className="text-[14px] text-hms-muted">{h.name}</p></div>
        <ModeSwitch />
      </div>

      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="hms-page-in space-y-4">
          <Step n={1} title="When">
            <div className={clsx("grid gap-3", mode === "details" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3")}>
              <div><label htmlFor="nb-from" className={lbl}>Check-in</label><input id="nb-from" type="date" min={TODAY} value={from} onChange={(e) => { const v = e.target.value; if (!v) return; setFrom(v); if (to <= v) setTo(addDays(v, 1)); }} className={input} /></div>
              <div><label htmlFor="nb-to" className={lbl}>Check-out · {n > 0 ? `${n} night${n > 1 ? "s" : ""}` : "—"}</label><input id="nb-to" type="date" min={addDays(from, 1)} value={to} onChange={(e) => e.target.value && setTo(e.target.value)} className={input} /></div>
              <Stepper label="Adults" value={adults} min={1} max={20} onChange={setAdults} />
              {mode === "details" && <Stepper label="Children" value={children} min={0} max={10} onChange={setChildren} />}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">{[1, 2, 3, 7].map((k) => <button key={k} type="button" onClick={() => setTo(addDays(from, k))} className={clsx("rounded-full border px-3 py-1 text-[13px] font-semibold", n === k ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{k} night{k > 1 ? "s" : ""}</button>)}</div>
            {tried && errors.dates && <p className="mt-2 text-[13px] font-medium text-[#b42318]">{errors.dates}</p>}
          </Step>

          <Step n={2} title="Room" sub={datesOk ? `Free ${dm(from)} → ${dm(to)} · tap one or more` : "Pick dates first"}>
            {lost.length > 0 && <p className="mb-3 rounded-lg bg-[#fff4e0] px-3 py-2 text-[13.5px] text-[#8a4b00]">Room {lost.join(", ")} is not free on these dates and was left out.</p>}
            <div className="space-y-3">
              {groups.map(({ id, cat, units }) => {
                const avail = units.filter((u) => free.has(u.code));
                const sample = avail[0] ?? units[0];
                const p = datesOk && sample ? priceUnit(sample.code) : undefined;
                const avg = p ? Math.round(bill({ nights: p.nights, tax: taxOf(cat), discount: 0 }).total / Math.max(1, n)) : 0;
                const photo = cat.photos?.[0] ?? cat.photo;
                return (
                  <div key={id} className={clsx("overflow-hidden rounded-xl border", units.some((u) => picked.includes(u.code)) ? "border-hms-red" : "border-hms-line")}>
                    <div className="flex gap-3 p-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- demo/upload photo */}
                      {photo ? <img src={imgSrc(photo)} alt="" className="h-[68px] w-[92px] shrink-0 rounded-lg object-cover" /> : <span className="h-[68px] w-[92px] shrink-0 rounded-lg bg-hms-hover" />}
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-baseline gap-x-2"><b className="text-[15.5px]">{cat.name}</b><span className="text-[12.5px] text-hms-muted">up to {cat.maxAdults} adult{cat.maxAdults > 1 ? "s" : ""}{cat.maxChildren ? ` + ${cat.maxChildren} child` : ""}</span></p>
                        {p && <p className="text-[14px]"><b className="tabular-nums">{tk(avg)}</b><span className="text-hms-muted"> / night incl. VAT & service</span>{p.deal && <span className="ml-2 rounded bg-[#e5f5ec] px-1.5 py-0.5 text-[11.5px] font-semibold text-[#16693a]">{p.deal}</span>}</p>}
                        <p className={clsx("text-[12.5px] font-semibold", avail.length ? "text-[#16693a]" : "text-[#b42318]")}>{p?.closed ? `Closed for sale on ${dm(p.closed)}` : avail.length ? `${avail.length} of ${units.length} free` : "Fully booked"}</p>
                      </div>
                    </div>
                    <div role="group" aria-label={`${cat.name} rooms`} className="flex flex-wrap gap-1.5 border-t border-hms-line bg-[#fafbfc] px-3 py-2.5">
                      {units.filter((u) => free.has(u.code) && !p?.closed).map((u) => {
                        const on = picked.includes(u.code);
                        return <button key={u.code} type="button" aria-pressed={on} onClick={() => toggle(u.code)} aria-label={`Room ${u.code}`}
                          className={clsx("inline-flex h-10 min-w-16 items-center justify-center gap-1 rounded-lg border px-3 text-[14.5px] font-semibold transition-colors", on ? "border-hms-red bg-hms-red text-white" : "border-hms-line bg-white hover:border-hms-ink")}>{u.code}</button>;
                      })}
                      {(() => { const taken = units.filter((u) => !free.has(u.code)); const ooo = taken.filter((u) => u.ooo); return taken.length > 0 && <span className="self-center px-1 text-[12.5px] text-hms-muted">{taken.length - ooo.length > 0 ? `${taken.length - ooo.length} booked` : ""}{ooo.length ? `${taken.length - ooo.length > 0 ? " · " : ""}${ooo.map((u) => u.code).join(", ")} out of order` : ""}</span>; })()}
                    </div>
                  </div>
                );
              })}
            </div>
            {tried && errors.rooms && <p className="mt-2 text-[13px] font-medium text-[#b42318]">{errors.rooms}</p>}
          </Step>

          <Step n={3} title="Guest" sub="Phone first — saved guests fill in">
            {guest ? (
              <div className="flex items-center gap-3 rounded-xl border border-hms-red bg-hms-coral-soft/40 p-3">
                <span className="grid size-10 place-items-center rounded-full bg-white text-hms-red"><UserRound className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{guest.name}{guest.vip && <span className="ml-2 rounded bg-[#fdf3d9] px-1.5 py-0.5 text-[11.5px] font-bold text-[#7a4a0b]">VIP</span>}</p><p className="text-[13px] text-hms-muted">{guest.phone} · {guest.stays.length ? `${guest.stays.length} stay${guest.stays.length > 1 ? "s" : ""} before` : "No stays yet"}{guest.blocked ? " · Blocked" : ""}</p>{guest.prefs.length > 0 && <p className="text-[12.5px] text-[#4d5664]">Likes: {guest.prefs.join(", ")}</p>}</div>
                <button onClick={() => setUseId(null)} className={clsx(bSmall, "bg-[#eef0f3] hover:bg-[#e3e6eb]")}>Change</button>
              </div>
            ) : <>
              <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                <div><label htmlFor="nb-cty" className={lbl}>Country</label><select id="nb-cty" value={country} onChange={(e) => setCountry(e.target.value)} className={input}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label htmlFor="nb-ph" className={lbl}>Phone</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-hms-muted" /><input id="nb-ph" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={country === "Bangladesh" ? "01XXX-XXXXXX" : "+ country code"} className={clsx(input, "pl-9")} /></div></div>
              </div>
              {found && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-hms-line bg-[#f4f6f8] p-3">
                  <div className="min-w-0 flex-1"><p className="font-semibold">{found.name}</p><p className="text-[13px] text-hms-muted">Saved guest · {found.phone}</p></div>
                  <button onClick={() => setUseId(found.id)} className={clsx(bSmall, "btn-glow text-white")}>Use this guest</button>
                </div>
              )}
              {!found && phoneKey(phone).length >= 8 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div><label htmlFor="nb-nm" className={lbl}>Guest name</label><input id="nb-nm" value={gname} onChange={(e) => setGname(e.target.value)} placeholder="Full name" className={input} /></div>
                  <div><label htmlFor="nb-em" className={lbl}>Email <span className="font-normal text-hms-muted">(optional)</span></label><input id="nb-em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></div>
                  <p className="text-[12.5px] text-hms-muted sm:col-span-2">New guest · saved to Guests</p>
                </div>
              )}
              {tried && errors.guest && <p className="mt-2 text-[13px] font-medium text-[#b42318]">{errors.guest}</p>}
            </>}
          </Step>

          <Step n={4} title="Advance" sub="Optional">
            <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
              <div><label htmlFor="nb-adv" className={lbl}>Advance (৳)</label><input id="nb-adv" inputMode="numeric" value={advance} onChange={(e) => setAdvance(e.target.value.replace(/\D/g, ""))} placeholder="0" className={input} /></div>
              <div><p className={lbl}>Method</p><div role="radiogroup" aria-label="Advance method" className="grid grid-cols-4 gap-1.5">{METHODS.map((m) => <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)} className={clsx("h-11 rounded-lg border text-[14px] font-semibold", method === m ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{m}</button>)}</div></div>
            </div>
            {sum.total > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{[0.3, 0.5, 1].map((f) => <button key={f} type="button" onClick={() => setAdvance(String(Math.round(sum.total * f)))} className="rounded-full border border-hms-line px-3 py-1 text-[13px] font-semibold hover:bg-hms-hover">{f === 1 ? "Full" : `${f * 100}%`} · {tk(sum.total * f)}</button>)}</div>}
            {mode === "details" && (
              <div className="mt-4 grid gap-3 border-t border-hms-line pt-4 sm:grid-cols-3">
                <div><label htmlFor="nb-ch" className={lbl}>Booked through</label><select id="nb-ch" value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className={input}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div><label htmlFor="nb-di" className={lbl}>Discount (৳, before VAT)</label><input id="nb-di" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ""))} placeholder="0" className={input} /></div>
                <div className="sm:col-span-3"><label htmlFor="nb-no" className={lbl}>Note / special request</label><input id="nb-no" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. late arrival, airport pickup" className={input} /></div>
              </div>
            )}
          </Step>
        </div>
        <aside id="nb-summary" className="lg:sticky lg:top-4">{summary}</aside>
      </div>
      <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center gap-3 border-t border-hms-line bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <div className="min-w-0 flex-1"><p className="text-[12.5px] text-hms-muted">{lines.length ? `${lines.length} room${lines.length > 1 ? "s" : ""} · ${n} night${n > 1 ? "s" : ""}` : "No room picked"}</p><p className="text-[18px] font-bold tabular-nums">{tk(sum.total)}</p></div>
        <button onClick={() => { submit(); if (!ok) document.getElementById("nb-summary")?.scrollIntoView({ behavior: "smooth" }); }} disabled={busy} className={bMain}>Confirm</button>
      </div>
    </div></div>
  );
}
