"use client";
// Restaurant & Bar — POS: pick dishes on the left, the order on the right (like the live POS + Order cart).
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { CircleCheck, Minus, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { SERVICE_LABEL, bill, roomServiceOutlet, tk, type Line, type Order, type Service } from "@/lib/meals/seed";
import { btnLine, btnPrimary, input, lbl } from "../guests/ui";
import { MealsFrame } from "./frame";
import { Dish, PaySheet, SERVICE_ICON, useRestaurant, useToast } from "./shared";

export function PosPage() {
  const r = useRestaurant();
  const [toast, show] = useToast();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [svc, setSvc] = useState<Service>("dinein");
  const [place, setPlace] = useState("");
  const [room, setRoom] = useState("");
  const [guest, setGuest] = useState("");
  const [notes, setNotes] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const [pay, setPay] = useState<string | null>(null);
  const cartRef = useRef<HTMLElement>(null);
  const st = r.m.st;
  const items = useMemo(() => st.items.filter((i) => i.pos && (cat === "all" || i.cat === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase()))), [st.items, cat, q]);
  if (!r.m.ready) return <MealsFrame tab="pos"><p role="status" className="p-8 text-[14px] text-hms-muted">Loading…</p></MealsFrame>;
  const services = (Object.keys(SERVICE_LABEL) as Service[]).filter((s) => st.settings.services[s]);
  const service = services.includes(svc) ? svc : services[0];
  const qty = (id: string) => lines.find((l) => l.item === id)?.qty ?? 0;
  const setQty = (id: string, n: number) => {
    const it = st.items.find((i) => i.id === id)!;
    setLines((ls) => n <= 0 ? ls.filter((l) => l.item !== id) : ls.some((l) => l.item === id) ? ls.map((l) => (l.item === id ? { ...l, qty: n } : l)) : [...ls, { item: id, name: it.name, price: it.price, qty: n }]);
    setDone(null);
  };
  const b = bill({ lines, sc: st.settings.sc, vat: st.settings.vat });
  const tables = st.places.filter((p) => p.kind === "table" && p.accepting);
  const errs = {
    lines: !lines.length ? "Add at least one dish" : "",
    where: service === "dinein" && !place ? "Choose a table" : service === "room" && !room ? "Choose the room" : (service === "takeaway" || service === "delivery") && !guest.trim() ? "Add the guest's name" : "",
  };
  const send = () => {
    setTried(true);
    if (errs.lines || errs.where) return;
    const g = service === "room" ? r.inHouse.find((x) => x.room === room)?.guest : guest.trim() || undefined;
    const o = r.m.create({ outlet: service === "room" ? roomServiceOutlet(r.h) ?? r.outlet : r.outlet, source: "pos", service, place: service === "dinein" ? place : undefined, room: service === "room" ? room : undefined, guest: g, lines });
    setDone(o); setLines([]); setNotes({}); setTried(false); setGuest(""); setPlace(""); setRoom("");
    show(o.status === "approval" ? `${o.no} sent for approval` : `${o.no} sent to the kitchen`);
  };
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <MealsFrame tab="pos" toast={toast} outlets={r.m.outlets} wide>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Menu category" className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
              {[{ id: "all", name: "All" }, ...st.categories].map((c) => <button key={c.id} role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)} className={clsx("h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-semibold", cat === c.id ? "border-[#b11c29] bg-[#b11c29] text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{c.name}</button>)}
            </div>
            <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-hms-line bg-white px-3 sm:w-[220px]"><Search className="size-4 text-hms-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes" aria-label="Search dishes" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none" /></label>
          </div>
          {items.length ? (
            <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{items.map((it) => { const n = qty(it.id); return (
              <li key={it.id} className={clsx("flex flex-col overflow-hidden rounded-2xl border bg-white", n ? "border-[#b11c29] shadow-[0_0_0_1px] shadow-[#b11c29]" : "border-hms-line", !it.available && "opacity-60")}>
                <Dish it={it} className="aspect-[4/3] w-full rounded-none" />
                <div className="flex flex-1 flex-col p-3">
                  <b className="text-[14.5px] leading-snug">{it.name}</b>
                  <span className="text-[12.5px] text-hms-muted">{it.available ? `${it.prep} min` : "Sold out"}</span>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <b className="text-[15px] text-[#b11c29] tabular-nums">{tk(it.price)}</b>
                    {!it.available ? null : n ? (
                      <span className="flex items-center gap-1"><button onClick={() => setQty(it.id, n - 1)} aria-label={`Remove one ${it.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Minus className="size-4" /></button><b className="w-5 text-center tabular-nums" aria-live="polite">{n}</b><button onClick={() => setQty(it.id, n + 1)} aria-label={`Add one more ${it.name}`} className="grid size-8 place-items-center rounded-lg bg-[#b11c29] text-white"><Plus className="size-4" /></button></span>
                    ) : <button onClick={() => setQty(it.id, 1)} aria-label={`Add ${it.name}`} className="grid size-9 place-items-center rounded-full border border-hms-line hover:bg-hms-hover"><Plus className="size-4" /></button>}
                  </div>
                </div>
              </li>
            ); })}</ul>
          ) : <p className="mt-3 rounded-2xl border border-hms-line bg-white p-10 text-center text-[14.5px] text-hms-muted">No dish matches.</p>}
        </div>

        <section ref={cartRef} aria-label="Order" className="scroll-mt-4 lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl border border-hms-line bg-white">
            <div className="border-b border-hms-line px-4 py-3"><h2 className="text-[17px] font-bold">Order</h2><p className="text-[13px] text-hms-muted">Staff POS · {r.outlet}</p></div>
            <div className="space-y-3 p-4">
              <div role="radiogroup" aria-label="Service type" className="flex flex-wrap gap-1.5">{services.map((s) => { const I = SERVICE_ICON[s]; return <button key={s} type="button" role="radio" aria-checked={service === s} onClick={() => setSvc(s)} className={clsx("flex h-10 min-w-[110px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 text-[13px] font-semibold", service === s ? "border-[#b11c29] bg-[#ffe7e4] text-[#8e1621]" : "border-hms-line")}><I className="size-4" aria-hidden />{SERVICE_LABEL[s]}</button>; })}</div>
              {service === "dinein" && <div><label htmlFor="pos-t" className={lbl}>Table</label><select id="pos-t" value={place} onChange={(e) => setPlace(e.target.value)} className={input}><option value="">Choose a table</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.name}{t.seats ? ` · ${t.seats} seats` : ""}{t.note ? ` · ${t.note}` : ""}</option>)}</select></div>}
              {service === "room" && <div><label htmlFor="pos-r" className={lbl}>Room</label><select id="pos-r" value={room} onChange={(e) => setRoom(e.target.value)} className={input}><option value="">Choose the room</option>{r.inHouse.map((g) => <option key={g.room} value={g.room}>Room {g.room} · {g.guest}</option>)}</select></div>}
              {(service !== "room") && <div><label htmlFor="pos-g" className={lbl}>Guest {service === "dinein" && <span className="font-normal text-hms-muted">optional</span>}</label><input id="pos-g" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder={service === "delivery" ? "Name, phone and address" : "Name"} className={input} /></div>}
              {tried && errs.where && <p className="text-[13px] font-medium text-[#c81e1e]">{errs.where}</p>}

              {lines.length ? <ul className="divide-y divide-hms-line rounded-xl border border-hms-line">{lines.map((l) => (
                <li key={l.item} className="px-3 py-2.5">
                  <div className="flex items-center gap-2"><span className="min-w-0 flex-1 text-[14px]"><b className="block truncate">{l.name}</b><span className="text-[12.5px] text-hms-muted tabular-nums">{tk(l.price)} × {l.qty} = {tk(l.price * l.qty)}</span></span>
                    <button onClick={() => setQty(l.item, l.qty - 1)} aria-label={`Remove one ${l.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Minus className="size-4" /></button><b className="w-5 text-center tabular-nums">{l.qty}</b><button onClick={() => setQty(l.item, l.qty + 1)} aria-label={`Add one more ${l.name}`} className="grid size-8 place-items-center rounded-lg border border-hms-line"><Plus className="size-4" /></button>
                    <button onClick={() => setNotes({ ...notes, [l.item]: !notes[l.item] })} aria-label={`Note for ${l.name}`} aria-pressed={!!notes[l.item] || !!l.note} className={clsx("grid size-8 place-items-center rounded-lg", l.note ? "text-[#a4500f]" : "text-hms-muted hover:bg-hms-hover")}><StickyNote className="size-4" /></button>
                    <button onClick={() => setQty(l.item, 0)} aria-label={`Remove ${l.name}`} className="grid size-8 place-items-center rounded-lg text-hms-muted hover:bg-hms-hover"><Trash2 className="size-4" /></button></div>
                  {(notes[l.item] || l.note) && <input aria-label={`Kitchen note for ${l.name}`} value={l.note ?? ""} onChange={(e) => setLines(lines.map((x) => (x.item === l.item ? { ...x, note: e.target.value || undefined } : x)))} placeholder="e.g. Less spicy, no onion" className="mt-2 h-9 w-full rounded-lg border border-[#858c97] px-2.5 text-[13.5px] outline-none focus:border-hms-ink" />}
                </li>
              ))}</ul> : <p className="rounded-xl border border-dashed border-hms-line px-3 py-6 text-center text-[14px] text-hms-muted">Tap dishes to add them.</p>}
              {tried && errs.lines && <p className="text-[13px] font-medium text-[#c81e1e]">{errs.lines}</p>}

              <dl className="space-y-1 text-[14px]">
                <div className="flex justify-between"><dt className="text-hms-muted">Subtotal</dt><dd className="tabular-nums">{tk(b.sub)}</dd></div>
                <div className="flex justify-between"><dt className="text-hms-muted">Service charge ({st.settings.sc}%)</dt><dd className="tabular-nums">{tk(b.sc)}</dd></div>
                <div className="flex justify-between"><dt className="text-hms-muted">VAT ({st.settings.vat}%)</dt><dd className="tabular-nums">{tk(b.vat)}</dd></div>
                <div className="flex justify-between rounded-lg bg-[#fff1ef] px-3 py-2 text-[16px] font-bold"><dt>Total</dt><dd className="tabular-nums">{tk(b.total)}</dd></div>
              </dl>
              <button onClick={send} className={clsx(btnPrimary, "h-11 w-full")}>{st.settings.posApproval ? "Send for approval" : "Send to kitchen"}</button>
              {lines.length > 0 && <button onClick={() => { setLines([]); setNotes({}); }} className={clsx(btnLine, "h-10 w-full")}>Clear</button>}
              {done && (
                <div role="status" className="rounded-xl border border-[#cfe7da] bg-[#eef8f2] p-3 text-[14px] text-[#165f37]">
                  <p className="flex items-center gap-2 font-semibold"><CircleCheck className="size-4" aria-hidden />{done.no} {done.status === "approval" ? "waits for approval" : "is in the kitchen"} · {tk(bill(done).total)}</p>
                  <div className="mt-2 flex gap-2"><button onClick={() => setPay(done.id)} className={clsx(btnLine, "h-9 flex-1 px-3")}>Take payment now</button><button onClick={() => setDone(null)} className={clsx(btnLine, "h-9 flex-1 px-3")}>Pay later</button></div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      {count > 0 && <button onClick={() => cartRef.current?.scrollIntoView({ behavior: "smooth" })} className="fixed inset-x-4 bottom-20 z-40 flex h-12 items-center justify-between rounded-xl bg-[#0f1720] px-4 text-[14.5px] font-semibold text-white shadow-lg lg:hidden"><span>Order · {count} item{count > 1 ? "s" : ""}</span><span className="tabular-nums">{tk(b.total)}</span></button>}
      {pay && <PaySheet r={r} id={pay} onClose={() => setPay(null)} onDone={(m) => { show(m); setPay(null); setDone(null); }} />}
    </MealsFrame>
  );
}
