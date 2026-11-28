"use client";
// Restaurant & Bar — POS. Two views on the left: Tables (who is sitting where, running bills) and Menu (dishes).
// Right: the order. Tap a free table → new order; tap a busy table → add more dishes to its running order.
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BedDouble, CircleCheck, LayoutGrid, Minus, Plus, Printer, Search, ShoppingBag, StickyNote, Trash2, UtensilsCrossed, X } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { PLACE_KIND, SERVICE_LABEL, bill, isSeated, roomServiceOutlet, seatsTaken, sharesSeats, tk, type Item, type Line, type Order, type Place, type Service } from "@/lib/meals/seed";
import { ageOf } from "@/lib/meals/store";
import { btnLine, btnPrimary, input, lbl } from "../guests/ui";
import { MealsFrame } from "./frame";
import { Dish, PaySheet, SERVICE_ICON, StatusChip, useRestaurant, useToast, type Restaurant } from "./shared";
import { billHtml, kotHtml, printHtml } from "./print";

const key = (l: Pick<Line, "item" | "size">) => `${l.item}|${l.size ?? ""}`;
const openOrder = (o: Order) => o.at.slice(0, 10) === TODAY && o.pay === "unpaid" && !["cancelled", "declined"].includes(o.status);

export function PosPage() {
  const r = useRestaurant();
  const q0 = useSearchParams().get("order");
  if (!r.m.ready) return <MealsFrame tab="pos"><p role="status" className="p-8 text-[14px] text-hms-muted">Loading…</p></MealsFrame>;
  return <Pos key={q0 ?? "new"} r={r} startOrder={q0 && r.m.st.orders.some((o) => o.id === q0 && openOrder(o)) ? q0 : null} />;
}

function Pos({ r, startOrder }: { r: Restaurant; startOrder: string | null }) {
  const [toast, show] = useToast();
  const st = r.m.st;
  const services = (Object.keys(SERVICE_LABEL) as Service[]).filter((s) => st.settings.services[s]);
  const [view, setView] = useState<"tables" | "menu">(startOrder || !services.includes("dinein") ? "menu" : "tables");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [svc, setSvc] = useState<Service>(services[0] ?? "dinein");
  const [place, setPlace] = useState("");
  const [seats, setSeats] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [guest, setGuest] = useState("");
  const [notes, setNotes] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [run, setRun] = useState<string | null>(startOrder);
  const [done, setDone] = useState<{ id: string; round: number } | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const cartRef = useRef<HTMLElement>(null);
  const running = run ? st.orders.find((o) => o.id === run) : undefined;
  const items = useMemo(() => st.items.filter((i) => i.pos && (cat === "all" || i.cat === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))), [st.items, cat, q]);
  const service = running?.service ?? (services.includes(svc) ? svc : services[0]);
  const qty = (it: Item, size?: string) => lines.find((l) => key(l) === key({ item: it.id, size }))?.qty ?? 0;
  const setQty = (it: Item, n: number, size?: string) => {
    const sz = it.sizes?.find((s) => s.name === size);
    const k = key({ item: it.id, size });
    setLines((ls) => n <= 0 ? ls.filter((l) => key(l) !== k) : ls.some((l) => key(l) === k) ? ls.map((l) => (key(l) === k ? { ...l, qty: n } : l)) : [...ls, { item: it.id, name: sz ? `${it.name} (${sz.name})` : it.name, price: sz?.price ?? it.price, size, qty: n }]);
    setDone(null);
  };
  const setLineQty = (l: Line, n: number) => setLines((ls) => (n <= 0 ? ls.filter((x) => key(x) !== key(l)) : ls.map((x) => (key(x) === key(l) ? { ...x, qty: n } : x))));
  const base = running ?? { lines: [] as Line[], sc: st.settings.sc, vat: st.settings.vat, discount: undefined };
  const b = bill({ lines: [...base.lines, ...lines], sc: base.sc, vat: base.vat, discount: base.discount });
  const tables = st.places.filter(isSeated);
  const openNow = st.orders.filter(openOrder);
  const seatInfo = (p: Place) => seatsTaken(p, openNow);
  const placeObj = tables.find((t) => t.id === place);
  // Private tables (or a table that does not share) are taken whole; others take the seats picked.
  const choosePlace = (id: string) => {
    setPlace(id); const p = tables.find((t) => t.id === id);
    setSeats(p && !sharesSeats(p) ? seatInfo(p).free : []);
  };
  const where = (o: Order) => r.placeName(o);
  const errs = {
    lines: !lines.length ? "Add at least one dish" : "",
    where: running ? "" : service === "dinein" && !place ? "Choose a table" : service === "dinein" && placeObj && seatInfo(placeObj).all.length > 0 && !seats.length ? "Pick the seats for this order" : service === "room" && !room ? "Choose the room" : (service === "takeaway" || service === "delivery") && !guest.trim() ? "Add the guest's name" : "",
  };
  const reset = () => { setLines([]); setNotes({}); setTried(false); setGuest(""); setPlace(""); setSeats([]); setRoom(""); };
  const send = () => {
    setTried(true);
    if (errs.lines || errs.where) return;
    if (running) {
      r.m.addLines(running.id, lines);
      setDone({ id: running.id, round: (running.round ?? 1) + 1 });
      show(`Added items sent to the kitchen · ${running.no}`);
      reset(); return;
    }
    const g = service === "room" ? r.inHouse.find((x) => x.room === room)?.guest : guest.trim() || undefined;
    const o = r.m.create({ outlet: service === "room" ? roomServiceOutlet(r.h) ?? r.outlet : r.outlet, source: "pos", service, place: service === "dinein" ? place : undefined, seats: service === "dinein" && seats.length ? seats : undefined, room: service === "room" ? room : undefined, guest: g, lines });
    setDone({ id: o.id, round: 1 }); setRun(service === "dinein" ? o.id : null);
    show(o.status === "approval" ? `${o.no} sent for approval` : `${o.no} sent to the kitchen`);
    reset();
  };
  // Tap a table: new order on its free seats; when every seat is taken by one order, open that order.
  const pickTable = (id: string) => {
    const t = tables.find((x) => x.id === id)!; const info = seatInfo(t);
    const here = openNow.filter((o) => o.place === id);
    if (!info.free.length && here.length === 1) { setRun(here[0].id); setDone(null); }
    else if (info.free.length) { setRun(null); setSvc("dinein"); choosePlace(id); setDone(null); }
    else return;
    setLines([]); setView("menu");
  };
  const openRun = (id: string) => { setRun(id); setDone(null); setLines([]); setView("menu"); };
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const doneOrder = done ? st.orders.find((o) => o.id === done.id) : undefined;
  return (
    <MealsFrame tab="pos" toast={toast} outlets={r.m.outlets}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="POS view" className="flex rounded-xl bg-[#e9edf2] p-1">
              {([["tables", "Tables", LayoutGrid], ["menu", "Menu", UtensilsCrossed]] as const).map(([v, l, I]) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={clsx("flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[14px] font-semibold transition-colors", view === v ? "bg-white shadow-sm" : "text-[#4d5664] hover:text-hms-ink")}><I className="size-4" aria-hidden />{l}</button>)}
            </div>
            {view === "menu" && <label className="ml-auto flex h-10 w-full items-center gap-2 rounded-lg border border-hms-line bg-white px-3 sm:w-[240px]"><Search className="size-4 text-hms-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" aria-label="Search dishes" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none" /></label>}
          </div>

          {view === "tables" ? (
            <div className="hms-fade">
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-hms-muted">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-[#86cfa3] bg-[#e8f6ee]" />Free seat</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-[#d6453c]" />Taken</span>
                <span>Tap a table to order on its free seats · tap an order to add dishes</span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{tables.map((t) => {
                const info = seatInfo(t);
                const here = openNow.filter((x) => x.place === t.id);
                const full = info.all.length > 0 && !info.free.length;
                return (
                  <li key={t.id} className={clsx("flex flex-col rounded-2xl border p-3 transition-shadow", !t.accepting && !here.length ? "border-hms-line bg-white opacity-50" : full ? "border-[#f3c4c0] bg-[#fff1ef]" : here.length ? "border-[#f5d9a8] bg-[#fffaf0]" : "border-hms-line bg-white hover:shadow-md")}>
                    <button disabled={(!t.accepting && !here.length) || (full && here.length !== 1)} onClick={() => pickTable(t.id)} className="text-left disabled:cursor-default">
                      <span className="flex items-center justify-between gap-2"><b className="text-[19px]">{t.name}</b><span className="text-right text-[11.5px] leading-tight text-hms-muted">{PLACE_KIND[t.kind].label.replace(" table", "")}<br />{info.all.length} seats</span></span>
                      <span className="mt-2 flex flex-wrap gap-1" aria-label={`${info.free.length} of ${info.all.length} seats free`}>
                        {info.all.map((c) => <span key={c} className={clsx("grid h-6 min-w-8 place-items-center rounded-md px-1 text-[11px] font-bold", info.taken.has(c) ? "bg-[#d6453c] text-white" : "border border-[#86cfa3] bg-[#e8f6ee] text-[#16693a]")}>{c}</span>)}
                      </span>
                      <span className={clsx("mt-1.5 block text-[13px] font-semibold", full ? "text-[#b42318]" : "text-[#1c7d45]")}>{!t.accepting ? "Closed" : full ? "Full" : `${info.free.length} of ${info.all.length} free`}{!sharesSeats(t) && !full && <span className="font-normal text-hms-muted"> · whole table</span>}</span>
                      {t.note && <span className="block text-[12px] text-hms-muted">{t.note}</span>}
                    </button>
                    {here.length > 0 && <div className="mt-2 space-y-1 border-t border-black/5 pt-2">
                      {here.map((o) => <button key={o.id} onClick={() => openRun(o.id)} className="flex w-full items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-left text-[12.5px] ring-1 ring-black/5 hover:bg-white">
                        <b className="shrink-0">{o.seats?.length && sharesSeats(t) ? o.seats.join(" ") : "All"}</b><span className="min-w-0 flex-1 truncate text-hms-muted">{o.no} · {ageOf(o)} min</span><b className="tabular-nums">{tk(bill(o).total)}</b>
                      </button>)}
                    </div>}
                  </li>
                );
              })}</ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {services.filter((s) => s !== "dinein").map((s) => { const I = SERVICE_ICON[s]; return <button key={s} onClick={() => { setRun(null); setSvc(s); setView("menu"); setDone(null); }} className={clsx(btnLine, "h-11")}><I className="size-4" aria-hidden />New {SERVICE_LABEL[s].toLowerCase()}</button>; })}
              </div>
              {st.orders.some((o) => openOrder(o) && o.service !== "dinein") && (
                <section className="mt-5" aria-label="Open orders not at a table">
                  <h3 className="mb-2 text-[14px] font-semibold text-hms-muted">Open room service &amp; takeaway</h3>
                  <ul className="flex flex-wrap gap-2">{st.orders.filter((o) => openOrder(o) && o.service !== "dinein").map((o) => { const I = o.service === "room" ? BedDouble : ShoppingBag; return (
                    <li key={o.id}><button onClick={() => { setRun(o.id); setLines([]); setDone(null); setView("menu"); }} className="flex items-center gap-2 rounded-xl border border-hms-line bg-white px-3 py-2 text-[13.5px] hover:bg-hms-hover"><I className="size-4 text-hms-muted" aria-hidden /><b>{where(o)}</b><span className="tabular-nums text-hms-muted">{tk(bill(o).total)}</span></button></li>
                  ); })}</ul>
                </section>
              )}
            </div>
          ) : (
            <div className="hms-fade">
              <div role="tablist" aria-label="Menu category" className="no-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-1">
                {[{ id: "all", name: "All" }, ...st.categories].map((c) => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={clsx("h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-semibold transition-colors", cat === c.id ? "border-[#b11c29] bg-[#b11c29] text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{c.name}</button>)}
              </div>
              {items.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{items.map((it) => { const total = it.sizes ? it.sizes.reduce((s, z) => s + qty(it, z.name), 0) : qty(it); return (
                  <li key={it.id} className={clsx("flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow", total ? "border-[#b11c29] shadow-[0_0_0_1px] shadow-[#b11c29]" : "border-hms-line hover:shadow-md", !it.available && "opacity-60")}>
                    <button type="button" disabled={!it.available || !!it.sizes} onClick={() => setQty(it, qty(it) + 1)} aria-label={it.sizes || !it.available ? undefined : `Add ${it.name}`} aria-hidden={it.sizes || !it.available ? true : undefined} tabIndex={it.sizes || !it.available ? -1 : undefined} className="relative block disabled:cursor-default">
                      <Dish it={it} className="aspect-[4/3] w-full rounded-none" />
                      {total > 0 && <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-[#b11c29] text-[13px] font-bold text-white">{total}</span>}
                    </button>
                    <div className="flex flex-1 flex-col p-3">
                      <b className="text-[14.5px] leading-snug">{it.name}</b>
                      <span className="text-[12.5px] text-hms-muted">{it.available ? `${it.prep} min` : "Sold out"}</span>
                      {!it.available ? null : it.sizes ? (
                        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">{it.sizes.map((z) => <button key={z.name} onClick={() => setQty(it, qty(it, z.name) + 1, z.name)} aria-label={`Add ${it.name} ${z.name}`} className="flex-1 rounded-lg border border-hms-line px-2 py-1.5 text-center text-[12.5px] font-semibold hover:border-[#b11c29] hover:text-[#b11c29]">{z.name}<span className="block tabular-nums text-[#b11c29]">{tk(z.price)}</span></button>)}</div>
                      ) : (
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <b className="text-[15px] text-[#b11c29] tabular-nums">{tk(it.price)}</b>
                          {qty(it) ? <span className="flex items-center gap-1"><button onClick={() => setQty(it, qty(it) - 1)} aria-label={`Remove one ${it.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Minus className="size-4" /></button><b className="w-5 text-center tabular-nums">{qty(it)}</b><button onClick={() => setQty(it, qty(it) + 1)} aria-label={`Add one more ${it.name}`} className="grid size-8 place-items-center rounded-lg bg-[#b11c29] text-white"><Plus className="size-4" /></button></span>
                            : <span aria-hidden className="grid size-9 place-items-center rounded-full border border-hms-line"><Plus className="size-4" /></span>}
                        </div>
                      )}
                    </div>
                  </li>
                ); })}</ul>
              ) : <p className="mt-3 rounded-2xl border border-hms-line bg-white p-10 text-center text-[14.5px] text-hms-muted">No dish matches.</p>}
            </div>
          )}
        </div>

        <section ref={cartRef} aria-label="Order" className="scroll-mt-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-hms-line bg-white">
            <div className="flex items-start justify-between gap-2 border-b border-hms-line px-4 py-3">
              <div><h2 className="text-[17px] font-bold">{running ? `${where(running)} · ${running.no}` : "New order"}</h2><p className="text-[13px] text-hms-muted">{running ? `Running bill · add more dishes` : `Staff POS · ${r.outlet}`}</p></div>
              {running && <button onClick={() => { setRun(null); setLines([]); setDone(null); setView("tables"); }} aria-label="Leave this order" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-4" /></button>}
            </div>
            <div className="max-h-[calc(100dvh-210px)] space-y-3 overflow-y-auto p-4">
              {!running && <>
                <div role="radiogroup" aria-label="Service type" className="flex flex-wrap gap-1.5">{services.map((s) => { const I = SERVICE_ICON[s]; return <button key={s} type="button" role="radio" aria-checked={service === s} onClick={() => setSvc(s)} className={clsx("flex h-10 min-w-[110px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-[13px] font-semibold", service === s ? "border-[#b11c29] bg-[#ffe7e4] text-[#8e1621]" : "border-hms-line")}><I className="size-4" aria-hidden />{SERVICE_LABEL[s]}</button>; })}</div>
                {service === "dinein" && <div><label htmlFor="pos-t" className={lbl}>Table</label><select id="pos-t" value={place} onChange={(e) => choosePlace(e.target.value)} className={input}><option value="">Choose a table</option>{tables.filter((t) => t.accepting).map((t) => { const i = seatInfo(t); return <option key={t.id} value={t.id} disabled={i.all.length > 0 && !i.free.length}>{t.name} · {i.all.length ? `${i.free.length} of ${i.all.length} seats free` : "no seats"}{!sharesSeats(t) ? " · whole table" : ""}{t.note ? ` · ${t.note}` : ""}</option>; })}</select></div>}
                {service === "dinein" && placeObj && seatInfo(placeObj).all.length > 0 && (() => { const i = seatInfo(placeObj); const share = sharesSeats(placeObj); return (
                  <div>
                    <div className="mb-1.5 flex items-center justify-between"><p className={lbl}>Seats <span className="font-normal text-hms-muted">{seats.length ? `· ${seats.length} picked` : "· pick who is ordering"}</span></p>{share && i.free.length > 1 && <button type="button" onClick={() => setSeats(seats.length === i.free.length ? [] : i.free)} className="text-[12.5px] font-semibold text-hms-red">{seats.length === i.free.length ? "Clear" : "All free seats"}</button>}</div>
                    <div role="group" aria-label="Seats" className="flex flex-wrap gap-1.5">{i.all.map((c) => { const taken = i.taken.has(c); const on = seats.includes(c); return (
                      <button key={c} type="button" disabled={taken || !share} aria-pressed={on} onClick={() => setSeats(on ? seats.filter((x) => x !== c) : [...seats, c].sort((a, b) => i.all.indexOf(a) - i.all.indexOf(b)))}
                        className={clsx("h-10 min-w-12 rounded-lg px-2 text-[13.5px] font-bold", taken ? "cursor-not-allowed bg-[#f3d1ce] text-[#a3302a] line-through" : on ? "bg-hms-ink text-white" : "border border-hms-line bg-white hover:border-hms-ink", !share && !taken && "!bg-hms-ink !text-white")}>{c}</button>); })}</div>
                    <p className="mt-1 text-[12px] text-hms-muted">{share ? "Only the seats you pick are blocked — the rest of the table stays free for other guests." : `${PLACE_KIND[placeObj.kind].label}: the whole table is taken by this order.`}</p>
                  </div>); })()}
                {service === "room" && <div><label htmlFor="pos-r" className={lbl}>Room</label><select id="pos-r" value={room} onChange={(e) => setRoom(e.target.value)} className={input}><option value="">Choose the room</option>{r.inHouse.map((g) => <option key={g.room} value={g.room}>Room {g.room} · {g.guest}</option>)}</select></div>}
                {service !== "room" && <div><label htmlFor="pos-g" className={lbl}>Guest {service === "dinein" && <span className="font-normal text-hms-muted">optional</span>}</label><input id="pos-g" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder={service === "delivery" ? "Name, phone and address" : "Name"} className={input} /></div>}
                {tried && errs.where && <p className="text-[13px] font-medium text-[#c81e1e]">{errs.where}</p>}
              </>}

              {running && running.lines.length > 0 && (
                <div className="rounded-xl bg-[#f4f6f8] px-3 py-2.5">
                  <p className="mb-1 flex items-center justify-between text-[12.5px] font-semibold text-hms-muted"><span>Already ordered</span><StatusChip s={running.status} /></p>
                  <ul className="space-y-0.5 text-[13.5px]">{running.lines.map((l, i) => <li key={i} className="flex justify-between gap-2"><span>{l.qty}× {l.name}</span><span className="tabular-nums text-hms-muted">{tk(l.qty * l.price)}</span></li>)}</ul>
                </div>
              )}

              {lines.length ? <ul className="divide-y divide-hms-line rounded-xl border border-hms-line">{lines.map((l) => (
                <li key={key(l)} className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5"><span className="min-w-0 flex-1 text-[14px]"><b className="block truncate">{l.name}</b><span className="text-[12.5px] text-hms-muted tabular-nums">{tk(l.price)} × {l.qty} = {tk(l.price * l.qty)}</span></span>
                    <button onClick={() => setLineQty(l, l.qty - 1)} aria-label={`Remove one ${l.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Minus className="size-4" /></button><b className="w-5 text-center tabular-nums">{l.qty}</b><button onClick={() => setLineQty(l, l.qty + 1)} aria-label={`Add one more ${l.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Plus className="size-4" /></button>
                    <button onClick={() => setNotes({ ...notes, [key(l)]: !notes[key(l)] })} aria-label={`Note for ${l.name}`} aria-pressed={!!notes[key(l)] || !!l.note} className={clsx("grid size-8 place-items-center rounded-lg", l.note ? "text-[#a4500f]" : "text-hms-muted hover:bg-hms-hover")}><StickyNote className="size-4" /></button>
                    <button onClick={() => setLineQty(l, 0)} aria-label={`Remove ${l.name}`} className="grid size-8 place-items-center rounded-lg text-hms-muted hover:bg-hms-hover"><Trash2 className="size-4" /></button></div>
                  {(notes[key(l)] || l.note) && <input aria-label={`Kitchen note for ${l.name}`} value={l.note ?? ""} onChange={(e) => setLines(lines.map((x) => (key(x) === key(l) ? { ...x, note: e.target.value || undefined } : x)))} placeholder="e.g. Less spicy, no onion" className="mt-2 h-9 w-full rounded-lg border border-[#858c97] px-2.5 text-[13.5px] outline-none focus:border-hms-ink" />}
                </li>
              ))}</ul> : <p className="rounded-xl border border-dashed border-hms-line px-3 py-5 text-center text-[14px] text-hms-muted">{view === "tables" && !running ? "Pick a table, or switch to Menu." : running ? "Tap dishes to add to this bill." : "Tap dishes to add them."}</p>}
              {tried && errs.lines && <p className="text-[13px] font-medium text-[#c81e1e]">{errs.lines}</p>}

              <dl className="space-y-1 text-[14px]">
                <div className="flex justify-between"><dt className="text-hms-muted">Subtotal</dt><dd className="tabular-nums">{tk(b.sub)}</dd></div>
                {b.disc > 0 && <div className="flex justify-between text-[#1c7d45]"><dt>Discount</dt><dd className="tabular-nums">−{tk(b.disc)}</dd></div>}
                <div className="flex justify-between"><dt className="text-hms-muted">Service charge ({base.sc}%)</dt><dd className="tabular-nums">{tk(b.sc)}</dd></div>
                <div className="flex justify-between"><dt className="text-hms-muted">VAT ({base.vat}%)</dt><dd className="tabular-nums">{tk(b.vat)}</dd></div>
                <div className="flex justify-between rounded-lg bg-[#fff1ef] px-3 py-2 text-[16px] font-bold"><dt>{running ? "Bill so far" : "Total"}</dt><dd className="tabular-nums">{tk(b.total)}</dd></div>
              </dl>
              {(lines.length > 0 || !running) && <button onClick={send} className={clsx(btnPrimary, "h-11 w-full")}>{running ? `Send ${count || ""} added item${count === 1 ? "" : "s"} to kitchen` : st.settings.posApproval ? "Send for approval" : "Send to kitchen"}</button>}
              {running && !lines.length && <div className="grid grid-cols-2 gap-2"><button onClick={() => printHtml(billHtml(r.h, running, where(running)))} className={clsx(btnLine, "h-11")}><Printer className="size-4" aria-hidden />Print bill</button><button onClick={() => setPay(running.id)} className={clsx(btnPrimary, "h-11")}>Bill &amp; pay</button></div>}
              {doneOrder && (
                <div role="status" className="hms-up rounded-xl border border-[#cfe7da] bg-[#eef8f2] p-3 text-[14px] text-[#165f37]">
                  <p className="flex items-center gap-2 font-semibold"><CircleCheck className="size-4" aria-hidden />{doneOrder.no} {doneOrder.status === "approval" ? "waits for approval" : "is in the kitchen"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button onClick={() => printHtml(kotHtml(r.h, doneOrder, where(doneOrder), done!.round))} className={clsx(btnLine, "h-9 px-3")}><Printer className="size-4" aria-hidden />Print KOT</button>
                    {doneOrder.service === "dinein" ? <button onClick={() => { setDone(null); setRun(null); setView("tables"); }} className={clsx(btnLine, "h-9 px-3")}>Back to tables</button> : <button onClick={() => setPay(doneOrder.id)} className={clsx(btnLine, "h-9 px-3")}>Take payment</button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {count > 0 && <button onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth" })} className="fixed inset-x-4 bottom-20 z-40 flex h-12 items-center justify-between rounded-xl bg-[#0f1720] px-4 text-[14.5px] font-semibold text-white shadow-lg lg:hidden"><span>Order · {count} item{count > 1 ? "s" : ""}</span><span className="tabular-nums">{tk(b.total)}</span></button>}
      {pay && <PaySheet r={r} id={pay} onClose={() => setPay(null)} onDone={(m) => { show(m); setPay(null); setDone(null); setRun(null); setView("tables"); }} />}
    </MealsFrame>
  );
}
