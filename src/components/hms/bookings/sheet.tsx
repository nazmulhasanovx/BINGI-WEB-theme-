"use client";
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, BedDouble, CalendarRange, CircleAlert, CreditCard, LogIn, LogOut, MoveRight, Phone, Undo2, UserRound, X as XIcon } from "lucide-react";
import { TODAY } from "@/lib/rooms/store";
import { addDays } from "@/lib/bookings/demo";
import { METHODS, bill, dm, dmy, dueOf, nightsBetween, paidOf, payState, timeOf, tk, totalOf, type Booking, type Night, type PayMethod } from "@/lib/bookings/store";
import { useRates } from "@/lib/rates/store";
import { useServices, orderTotal } from "@/lib/services/store";
import { bill as mealBill } from "@/lib/meals/seed";
import { postCash, postCashOut } from "@/lib/cashbox/store";
import { validId, type IdType } from "@/lib/guests/store";
import { useProperty } from "../property";
import { useRestaurant } from "../meals/shared";
import { useCashboxData } from "../cashbox/pages";
import { Sheet, input, lbl } from "../guests/ui";
import { Flags, PayPill, StatusPill, bMain, bSmall, bSoft, useBk } from "./ui";

type View = "main" | "checkin" | "checkout" | "pay" | "move" | "dates" | "cancel";
const Row = ({ k, v, strong, tone }: { k: ReactNode; v: ReactNode; strong?: boolean; tone?: string }) => (
  <div className={clsx("flex items-baseline justify-between gap-3 py-1 text-[14px]", strong && "font-bold")}><span className={strong ? "" : "text-[#4d5664]"}>{k}</span><span className={clsx("tabular-nums", tone)}>{v}</span></div>
);
const Err = ({ children }: { children: ReactNode }) => <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-[#fdecec] px-3 py-2 text-[13.5px] font-medium text-[#b42318]"><CircleAlert className="mt-0.5 size-4 shrink-0" />{children}</p>;
const Hint = ({ children }: { children: ReactNode }) => <p className="mt-2 text-[12.5px] text-hms-muted">{children}</p>;

/** Charges that sit on the room bill from other modules: unpaid booking service orders + restaurant "charged to room". */
function useExtras(b: Booking) {
  const h = useProperty();
  const svc = useServices(h);
  const r = useRestaurant();
  return useMemo(() => {
    const lines: { label: string; amount: number; from: string }[] = [];
    for (const o of svc.st.orders) if (!o.cancelled && o.method === "booking" && o.booking?.code === b.code && o.payment === "Unpaid") lines.push({ label: svc.st.services.find((s) => s.id === o.service)?.name ?? "Service", amount: orderTotal(o), from: `Other Services · ${o.id}` });
    if (b.unit && b.status === "Checked in") for (const o of r.m.st.orders) if (o.pay === "room" && o.room === b.unit && o.status !== "cancelled" && o.status !== "declined" && (o.at ?? "").slice(0, 10) >= b.from) lines.push({ label: `Restaurant ${o.no}`, amount: mealBill(o).total, from: "Restaurant & Bar · charged to room" });
    return { lines, total: lines.reduce((s, l) => s + l.amount, 0), settle: () => svc.settleBooking(b.code) };
  }, [svc, r.m.st.orders, b]);
}

export function BookingSheet({ b, onClose, start }: { b: Booking; onClose: () => void; start?: "checkin" | "checkout" }) {
  const { bk, guests, mode, toast } = useBk();
  const h = useProperty();
  const rates = useRates(h);
  const cbx = useCashboxData();
  const ex = useExtras(b);
  const guest = guests.get(b.guestId);
  const [view, setView] = useState<View>(start === "checkin" && b.status === "Confirmed" && b.from <= TODAY ? "checkin" : start === "checkout" && b.status === "Checked in" ? "checkout" : "main");
  const [tab, setTab] = useState<"overview" | "bill" | "activity">("overview");
  const [err, setErr] = useState("");
  const go = (v: View) => { setErr(""); setView(v); };
  const rb = bill(b);
  const paid = paidOf(b);
  const folio = totalOf(b) + (b.status === "Checked in" || b.status === "Confirmed" ? ex.total : 0);
  const balance = folio - paid;
  const priceOn = (d: string) => { const u = bk.unitByCode.get(b.unit); if (!u) return rates.catPrice(b.categoryId, d).price; const p = rates.unitPrice(u, d).price; return rates.deal(u.category, d, p, u.id)?.price ?? p; };
  const takeCash = (amount: number, ref: string) => postCash(h, cbx.refs, "front-desk", { amount, source: "booking", ref, party: guest?.name });

  const done = (msg: string) => { toast(msg); setErr(""); setView("main"); };
  const title = guest?.name ?? "Guest";
  const sub = `${b.code}${b.unit ? ` · Room ${b.unit}` : ""} · ${b.type}`;

  // ---------------- action views ----------------
  if (view === "checkin") return <CheckInView b={b} extras={ex.total} onBack={() => go("main")} onClose={onClose} onDone={done} takeCash={takeCash} />;
  if (view === "checkout") return <CheckOutView b={b} extras={ex} onBack={() => go("main")} onClose={onClose} onDone={done} takeCash={takeCash} />;
  if (view === "pay") return <PayView b={b} balance={balance} onBack={() => go("main")} onClose={onClose} onDone={done} takeCash={takeCash} refund={(amount, ref) => postCashOut(h, cbx.refs, { amount, ref, party: guest?.name })} />;
  if (view === "move") return <MoveView b={b} onBack={() => go("main")} onClose={onClose} onDone={done} priceOn={priceOn} />;
  if (view === "dates") return <DatesView b={b} onBack={() => go("main")} onClose={onClose} onDone={done} priceOn={priceOn} />;
  if (view === "cancel") return <CancelView b={b} onBack={() => go("main")} onClose={onClose} onDone={done} />;

  const canCheckIn = b.status === "Confirmed" && b.from <= TODAY;
  const primary = canCheckIn ? <button onClick={() => go("checkin")} className={clsx(bMain, "flex-1")}><LogIn className="size-4" />Check in</button>
    : b.status === "Checked in" ? <button onClick={() => go("checkout")} className={clsx(bMain, "flex-1")}><LogOut className="size-4" />Check out</button>
    : b.status === "Confirmed" ? <button onClick={() => go("pay")} className={clsx(bMain, "flex-1")}><CreditCard className="size-4" />Take payment</button>
    : balance !== 0 ? <button onClick={() => go("pay")} className={clsx(bMain, "flex-1")}>{balance < 0 ? "Refund" : "Take payment"}</button> : null;
  const active = b.status === "Confirmed" || b.status === "Checked in";
  const actions: [string, View, typeof LogIn][] = [
    ...(active && !(b.status === "Confirmed" && !canCheckIn) ? [["Take payment", "pay", CreditCard] as [string, View, typeof LogIn]] : []),
    ...(active ? [["Change dates", "dates", CalendarRange] as [string, View, typeof LogIn], [b.unit ? "Move room" : "Assign room", "move", MoveRight] as [string, View, typeof LogIn]] : []),
    ...(b.status === "Confirmed" ? [[b.from < TODAY ? "No-show / cancel" : "Cancel booking", "cancel", XIcon] as [string, View, typeof LogIn]] : []),
  ];

  return (
    <Sheet title={title} sub={sub} onClose={onClose} wide={mode === "details"}
      footer={<>{primary ?? <button onClick={onClose} className={clsx(bSoft, "flex-1")}>Close</button>}</>}>
      <div className="flex flex-wrap items-center gap-2"><StatusPill s={b.status} /><PayPill b={b} /><Flags b={b} />{b.group && <span className="rounded-md bg-hms-hover px-2 py-0.5 text-[12px] font-semibold text-[#4d5664]">Group {b.group}</span>}</div>

      {mode === "details" && (
        <div role="tablist" aria-label="Booking sections" className="mt-4 flex gap-1 rounded-lg bg-[#e9edf2] p-1">
          {([["overview", "Overview"], ["bill", "Bill & payments"], ["activity", "Activity"]] as const).map(([id, l]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={clsx("flex-1 rounded-md px-2 py-1.5 text-[13.5px] font-semibold", tab === id ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}
        </div>
      )}

      {(mode === "easy" || tab === "overview") && <>
        <section className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f4f6f8] px-3.5 py-3"><p className="text-[12.5px] text-hms-muted">Room</p><p className="text-[18px] font-bold">{b.unit ? `Room ${b.unit}` : <span className="text-[#a15c00]">Not assigned</span>}</p><p className="truncate text-[12.5px] text-hms-muted">{b.type}</p></div>
          <div className="rounded-xl bg-[#f4f6f8] px-3.5 py-3"><p className="text-[12.5px] text-hms-muted">{b.nights.length} night{b.nights.length > 1 ? "s" : ""} · {b.adults + b.children} guest{b.adults + b.children > 1 ? "s" : ""}</p><p className="text-[18px] font-bold">{dm(b.from)} → {dm(b.to)}</p>{(b.checkedInAt || b.checkedOutAt) && <p className="text-[12.5px] text-hms-muted">{b.checkedInAt ? `In ${dm(b.checkedInAt.slice(0, 10))} ${timeOf(b.checkedInAt)}` : ""}{b.checkedOutAt ? ` · Out ${timeOf(b.checkedOutAt)}` : ""}</p>}</div>
        </section>
        <section className="mt-3 rounded-xl border border-hms-line px-3.5 py-2.5">
          <Row k="Room bill" v={tk(totalOf(b))} />
          {ex.total > 0 && active && <Row k={`Extras on the bill (${ex.lines.length})`} v={tk(ex.total)} />}
          <Row k="Paid" v={tk(paid)} tone="text-[#16693a]" />
          <div className="mt-1 border-t border-hms-line pt-1"><Row strong k={balance < 0 ? "To refund" : "Balance"} v={tk(Math.abs(balance))} tone={balance > 0 ? "text-[#b42318]" : balance < 0 ? "text-[#6b55e0]" : "text-[#16693a]"} /></div>
        </section>
        {actions.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {actions.map(([l, v, I]) => <button key={l} onClick={() => go(v)} className={clsx(bSoft, "justify-start", v === "cancel" && "text-[#b42318]")}><I className="size-4" />{l}</button>)}
          </div>
        )}
        {b.status === "Checked in" && b.checkedInAt?.startsWith(TODAY) && <button onClick={() => { bk.undoCheckIn(b.code); toast("Check-in undone"); }} className="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#4d5664] hover:text-hms-ink"><Undo2 className="size-4" />Undo check-in</button>}
        <section className="mt-4 rounded-xl border border-hms-line px-3.5 py-3">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hms-coral-soft text-[14px] font-bold text-hms-red"><UserRound className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{title}{guest?.vip && <span className="ml-2 rounded bg-[#fdf3d9] px-1.5 py-0.5 text-[11.5px] font-bold text-[#7a4a0b]">VIP</span>}</p>
              <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-hms-muted"><span className="inline-flex items-center gap-1"><Phone className="size-3.5" />{guest?.phone ?? "—"}</span>{guest && <span>{guest.stays.length > 1 ? `${guest.stays.length} stays` : "First stay"}</span>}<span>{guest?.idNo ? `${guest.idType} on file` : <b className="text-[#a15c00]">ID missing</b>}</span></p>
              {guest && guest.prefs.length > 0 && <p className="mt-1 text-[12.5px] text-[#4d5664]">Likes: {guest.prefs.join(", ")}</p>}
            </div>
            {guest && <Link href={`/hms/guests/${guest.id}`} className="shrink-0 text-[13px] font-semibold text-hms-red">Profile</Link>}
          </div>
          {b.note && <p className="mt-2 rounded-lg bg-[#fdf8ec] px-3 py-2 text-[13.5px] text-[#6b4309]">“{b.note}”</p>}
        </section>
        {mode === "details" && <DetailsEdit b={b} />}
      </>}

      {mode === "details" && tab === "bill" && (
        <section className="mt-4 space-y-3">
          <div className="rounded-xl border border-hms-line">
            <p className="border-b border-hms-line px-3.5 py-2 text-[13px] font-semibold">Room nights</p>
            <div className="max-h-[220px] overflow-y-auto px-3.5 py-1">{b.nights.map((n) => <Row key={n.date} k={`${dm(n.date)} · Room ${b.unit || "—"}`} v={tk(n.base)} />)}</div>
            <div className="border-t border-hms-line px-3.5 py-2">
              <Row k="Room charges" v={tk(rb.rooms)} />
              {rb.discount > 0 && <Row k="Discount" v={`−${tk(rb.discount)}`} tone="text-[#16693a]" />}
              <Row k={`Service charge ${b.tax.service}%`} v={tk(rb.service)} />
              <Row k={`VAT ${b.tax.vat}%`} v={tk(rb.vat)} />
              {(b.status === "Cancelled" || b.status === "No-show") ? <Row strong k={`${b.status} · fee kept`} v={tk(totalOf(b))} /> : <Row strong k="Room bill" v={tk(rb.total)} />}
            </div>
          </div>
          <div className="rounded-xl border border-hms-line">
            <p className="border-b border-hms-line px-3.5 py-2 text-[13px] font-semibold">Extras on the bill</p>
            <div className="px-3.5 py-1">{ex.lines.length && active ? ex.lines.map((l, i) => <Row key={i} k={<span>{l.label}<span className="block text-[12px] text-hms-muted">{l.from}</span></span>} v={tk(l.amount)} />) : <p className="py-2 text-[13px] text-hms-muted">No unpaid services or restaurant charges.</p>}</div>
          </div>
          <div className="rounded-xl border border-hms-line">
            <p className="border-b border-hms-line px-3.5 py-2 text-[13px] font-semibold">Payments</p>
            <div className="px-3.5 py-1">{b.payments.length ? b.payments.map((p) => <Row key={p.id} k={<span>{p.amount < 0 ? "Refund" : p.note ?? "Payment"} · {p.method}<span className="block text-[12px] text-hms-muted">{dm(p.at.slice(0, 10))} {timeOf(p.at)} · {p.by}</span></span>} v={tk(p.amount)} tone={p.amount < 0 ? "text-[#6b55e0]" : "text-[#16693a]"} />) : <p className="py-2 text-[13px] text-hms-muted">No payments yet.</p>}</div>
            <div className="border-t border-hms-line px-3.5 py-2"><Row strong k={balance < 0 ? "To refund" : "Balance"} v={tk(Math.abs(balance))} /></div>
          </div>
        </section>
      )}
      {mode === "details" && tab === "activity" && (
        <ol className="mt-4 space-y-0 border-l-2 border-hms-line pl-4">
          {[...b.log].reverse().map((l, i) => <li key={i} className="relative pb-3"><span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-[#9aa1ad]" /><p className="text-[14px]">{l.text}</p><p className="text-[12px] text-hms-muted">{dm(l.at.slice(0, 10))} {timeOf(l.at)} · {l.by}</p></li>)}
        </ol>
      )}
      {err && <Err>{err}</Err>}
    </Sheet>
  );
}

function DetailsEdit({ b }: { b: Booking }) {
  const { bk, toast } = useBk();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ adults: String(b.adults), children: String(b.children), note: b.note, discount: String(b.discount || "") });
  const dirty = f.adults !== String(b.adults) || f.children !== String(b.children) || f.note !== b.note || f.discount !== String(b.discount || "");
  const rooms = b.nights.reduce((s, n) => s + n.base, 0);
  const bad = Number(f.discount || 0) > rooms;
  if (b.status !== "Confirmed" && b.status !== "Checked in") return null;
  if (!open) return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-hms-muted">
      <span>{b.channel} · booked {dm(b.created.slice(0, 10))} · {b.adults} adult{b.adults > 1 ? "s" : ""}{b.children ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}{b.discount ? ` · discount ${tk(b.discount)}` : ""}</span>
      <button onClick={() => setOpen(true)} className="font-semibold text-hms-red">Edit guests, discount or note</button>
    </div>
  );
  return (
    <section className="mt-3 rounded-xl border border-hms-line px-3.5 py-3">
      <div className="flex items-center justify-between"><p className="text-[13px] font-semibold">Edit details</p><button onClick={() => setOpen(false)} className="text-[13px] font-semibold text-hms-muted hover:text-hms-ink">Close</button></div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div><label htmlFor="e-ad" className={lbl}>Adults</label><input id="e-ad" type="number" min={1} max={9} value={f.adults} onChange={(e) => setF({ ...f, adults: e.target.value })} className={input} /></div>
        <div><label htmlFor="e-ch" className={lbl}>Children</label><input id="e-ch" type="number" min={0} max={9} value={f.children} onChange={(e) => setF({ ...f, children: e.target.value })} className={input} /></div>
        <div><label htmlFor="e-di" className={lbl}>Discount ৳</label><input id="e-di" inputMode="numeric" value={f.discount} onChange={(e) => setF({ ...f, discount: e.target.value.replace(/\D/g, "") })} className={input} placeholder="0" /></div>
      </div>
      {bad && <p className="mt-1 text-[12.5px] font-medium text-[#b42318]">Discount is more than the room charges ({tk(rooms)})</p>}
      <div className="mt-2"><label htmlFor="e-no" className={lbl}>Note / special request</label><input id="e-no" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className={input} placeholder="e.g. late arrival, extra pillow" /></div>
      {dirty && <div className="mt-2 flex justify-end gap-2"><button onClick={() => setF({ adults: String(b.adults), children: String(b.children), note: b.note, discount: String(b.discount || "") })} className={clsx(bSmall, "bg-[#eef0f3] hover:bg-[#e3e6eb]")}>Undo</button><button disabled={bad || Number(f.adults) < 1} onClick={() => { bk.update(b.code, { adults: Math.max(1, Number(f.adults)), children: Math.max(0, Number(f.children) || 0), note: f.note.trim(), discount: Number(f.discount) || 0 }); toast("Booking updated"); setOpen(false); }} className={clsx(bSmall, "btn-glow text-white")}>Save changes</button></div>}
    </section>
  );
}

// ---------------- shared bits for action views ----------------
type ViewProps = { b: Booking; onBack: () => void; onClose: () => void; onDone: (m: string) => void };
function ActionSheet({ title, sub, onBack, onClose, footer, children }: { title: string; sub: string; onBack: () => void; onClose: () => void; footer: ReactNode; children: ReactNode }) {
  return (
    <Sheet title={title} sub={sub} onClose={onClose} footer={<><button onClick={onBack} className={clsx(bSoft, "shrink-0")}><ArrowLeft className="size-4" />Back</button>{footer}</>}>
      <div className="hms-page-in">{children}</div>
    </Sheet>
  );
}
function MethodPick({ value, onChange }: { value: PayMethod; onChange: (m: PayMethod) => void }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-4 gap-1.5">
      {METHODS.map((m) => <button key={m} type="button" role="radio" aria-checked={value === m} onClick={() => onChange(m)} className={clsx("h-10 rounded-lg border text-[14px] font-semibold", value === m ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{m}</button>)}
    </div>
  );
}
const money = (v: string) => v.replace(/[^\d]/g, "");

function CheckInView({ b, extras, onBack, onClose, onDone, takeCash }: ViewProps & { extras: number; takeCash: (n: number, ref: string) => string }) {
  const { bk, guests, g } = useBk();
  const guest = guests.get(b.guestId);
  const free = bk.freeUnits(TODAY > b.from ? TODAY : b.from, b.to, b.code);
  const [unit, setUnit] = useState(b.unit && free.some((u) => u.code === b.unit) ? b.unit : b.unit || "");
  const [idType, setIdType] = useState<IdType>(guest?.idType || "NID");
  const [idNo, setIdNo] = useState(guest?.idNo ?? "");
  const owe = Math.max(0, dueOf(b) + extras);
  // Never pre-filled: taking money is always a deliberate tap.
  const [amt, setAmt] = useState("");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [err, setErr] = useState("");
  const same = free.filter((u) => u.category === b.categoryId);
  const go = () => {
    setErr("");
    if (idNo && !validId(idType, idNo)) return setErr(`That ${idType} number doesn't look right`);
    if (unit !== b.unit) { const e = bk.assign(b.code, unit); if (e) return setErr(e); }
    const a = Number(amt) || 0;
    if (a > 0 && method === "Cash") { const e = takeCash(a, b.code); if (e) return setErr(e); }
    const e = bk.checkIn(b.code); if (e) return setErr(e);
    if (a > 0) bk.pay(b.code, a, method, "At check-in");
    if (guest && idNo && (idNo !== guest.idNo || idType !== guest.idType)) g.saveGuest({ id: guest.id, name: guest.name, phone: guest.phone, email: guest.email, country: guest.country, address: guest.address, idType, idNo, idFront: guest.idFront, idBack: guest.idBack, verified: guest.verified, vip: guest.vip, blocked: guest.blocked, prefs: guest.prefs, notes: guest.notes, marketing: guest.marketing, created: guest.created });
    onDone(`${guest?.name ?? "Guest"} checked in to Room ${unit}${a ? ` · ${tk(a)} ${method}` : ""}`);
  };
  return (
    <ActionSheet title="Check in" sub={`${guest?.name ?? "Guest"} · ${b.code} · ${b.nights.length} night${b.nights.length > 1 ? "s" : ""}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={go} disabled={!unit} className={clsx(bMain, "flex-1")}><LogIn className="size-4" />Check in{unit ? ` to Room ${unit}` : ""}</button>}>
      <div><label htmlFor="ci-room" className={lbl}>Room</label>
        <select id="ci-room" value={unit} onChange={(e) => setUnit(e.target.value)} className={input}>
          {!unit && <option value="">Choose a room</option>}
          {b.unit && !free.some((u) => u.code === b.unit) && <option value={b.unit}>Room {b.unit} (booked)</option>}
          {same.length > 0 && <optgroup label={`${b.type} — free`}>{same.map((u) => <option key={u.code} value={u.code}>Room {u.code}</option>)}</optgroup>}
          {free.filter((u) => u.category !== b.categoryId).length > 0 && <optgroup label="Other room types (price stays the same)">{free.filter((u) => u.category !== b.categoryId).map((u) => <option key={u.code} value={u.code}>Room {u.code} · {bk.cats.get(u.category)?.name}</option>)}</optgroup>}
        </select>
      </div>
      <div className="mt-4"><p className={lbl}>Guest ID {guest?.idNo ? <span className="font-normal text-hms-muted">· on file</span> : <span className="font-normal text-[#a15c00]">· optional, add now or later</span>}</p>
        <div className="grid grid-cols-[130px_1fr] gap-2">
          <select aria-label="ID type" value={idType} onChange={(e) => setIdType(e.target.value as IdType)} className={input}><option>NID</option><option>Passport</option><option>Driving licence</option></select>
          <input aria-label="ID number" value={idNo} onChange={(e) => setIdNo(e.target.value.trim())} placeholder={idType === "NID" ? "10, 13 or 17 digits" : "Number"} className={input} />
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-hms-line px-3.5 py-2.5">
        <Row k="Room bill" v={tk(totalOf(b))} />{extras > 0 && <Row k="Extras on the bill" v={tk(extras)} />}<Row k="Paid" v={tk(paidOf(b))} /><Row strong k="Balance" v={tk(owe)} />
      </div>
      <div className="mt-3"><label htmlFor="ci-amt" className={lbl}>Take payment now (optional)</label><input id="ci-amt" inputMode="numeric" value={amt} onChange={(e) => setAmt(money(e.target.value))} placeholder="0" className={input} />
        {owe > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{[owe, Math.round(owe / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v, i) => <button key={v} type="button" onClick={() => setAmt(String(v))} className="rounded-full bg-[#eef0f3] px-3 py-1 text-[13px] font-semibold hover:bg-[#e3e6eb]">{i === 0 ? "Full" : "Half"} · {tk(v)}</button>)}</div>}</div>
      {Number(amt) > 0 && <div className="mt-2"><MethodPick value={method} onChange={setMethod} /></div>}
      {err && <Err>{err}</Err>}
    </ActionSheet>
  );
}

function CheckOutView({ b, extras, onBack, onClose, onDone, takeCash }: ViewProps & { extras: ReturnType<typeof useExtras>; takeCash: (n: number, ref: string) => string }) {
  const { bk, guests } = useBk();
  const guest = guests.get(b.guestId);
  const early = b.to > TODAY;
  const stayed = b.nights.filter((n) => n.date < TODAY);
  // Default: charge the booking as made. Staff tick this only when the hotel's policy refunds unused nights.
  const [shorten, setShorten] = useState(false);
  const nights = shorten ? (stayed.length ? stayed : b.nights.slice(0, 1)) : b.nights;
  const room = bill({ ...b, nights }).total;
  const total = room + extras.total;
  const balance = total - paidOf(b);
  const [amt, setAmt] = useState(balance > 0 ? String(balance) : "");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [err, setErr] = useState("");
  const left = Math.max(0, balance - (Number(amt) || 0));
  const go = (leaveDue: boolean) => {
    setErr("");
    const a = Math.min(Number(amt) || 0, Math.max(0, balance));
    if (left > 0 && !leaveDue) return setErr(`${tk(left)} still due — collect it or use "Check out with balance due"`);
    if (a > 0 && method === "Cash") { const e = takeCash(a, b.code); if (e) return setErr(e); }
    if (a > 0) bk.pay(b.code, a, method, "At check-out");
    const e = bk.checkOut(b.code, { shorten, leaveDue, extras: extras.total }); if (e) return setErr(e);
    if (left === 0) extras.settle();
    onDone(`${guest?.name ?? "Guest"} checked out of Room ${b.unit}${left ? ` · ${tk(left)} still due` : ""}`);
  };
  return (
    <ActionSheet title="Check out" sub={`${guest?.name ?? "Guest"} · Room ${b.unit} · ${b.code}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={() => go(false)} className={clsx(bMain, "flex-1")}><LogOut className="size-4" />{balance > 0 ? `Collect ${tk(Math.min(Number(amt) || 0, balance))} & check out` : "Check out"}</button>}>
      {b.to < TODAY && <p className="mb-3 rounded-lg bg-[#fff4e0] px-3 py-2 text-[13.5px] text-[#8a4b00]">Check-out was due {dmy(b.to)}. Extra nights are not charged automatically — change the dates first if they should be.</p>}
      {early && (
        <label className="mb-3 flex items-start gap-3 rounded-xl border border-hms-line px-3.5 py-3">
          <input type="checkbox" checked={shorten} onChange={(e) => setShorten(e.target.checked)} className="mt-1 size-4 accent-[#b11c29]" />
          <span><span className="block text-[14px] font-semibold">Leaving early? Charge only {Math.max(1, stayed.length)} night{Math.max(1, stayed.length) > 1 ? "s" : ""} stayed</span><span className="text-[12.5px] text-hms-muted">Booked until {dmy(b.to)} ({b.nights.length} nights). Untick to charge the full booking.</span></span>
        </label>
      )}
      <div className="rounded-xl border border-hms-line px-3.5 py-2.5">
        <Row k={`Room · ${nights.length} night${nights.length > 1 ? "s" : ""} (incl. VAT & service)`} v={tk(room)} />
        {extras.lines.map((l, i) => <Row key={i} k={l.label} v={tk(l.amount)} />)}
        <Row k="Paid" v={`−${tk(paidOf(b))}`} tone="text-[#16693a]" />
        <div className="mt-1 border-t border-hms-line pt-1"><Row strong k={balance < 0 ? "To refund" : "To pay now"} v={tk(Math.abs(balance))} tone={balance > 0 ? "text-[#b42318]" : ""} /></div>
      </div>
      {balance > 0 && <>
        <div className="mt-3"><label htmlFor="co-amt" className={lbl}>Amount received</label><input id="co-amt" inputMode="numeric" value={amt} onChange={(e) => setAmt(money(e.target.value))} className={input} /></div>
        <div className="mt-2"><MethodPick value={method} onChange={setMethod} /></div>
        {left > 0 && <button onClick={() => go(true)} className="mt-3 text-[13.5px] font-semibold text-[#b42318] underline underline-offset-4">Check out with {tk(left)} balance due</button>}
      </>}
      {balance < 0 && <Hint>Refund the extra {tk(-balance)} from Take payment → Refund after check-out.</Hint>}
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#f4f6f8] px-3 py-2 text-[13px] text-[#4d5664]"><BedDouble className="mt-0.5 size-4 shrink-0" />Room {b.unit} will need cleaning. Housekeeping tasks are not part of this prototype yet.</p>
      {err && <Err>{err}</Err>}
    </ActionSheet>
  );
}

function PayView({ b, balance, onBack, onClose, onDone, takeCash, refund }: ViewProps & { balance: number; takeCash: (n: number, ref: string) => string; refund: (n: number, ref: string) => string }) {
  const { bk } = useBk();
  const isRefund = balance < 0;
  const [amt, setAmt] = useState(balance !== 0 ? String(Math.abs(balance)) : "");
  const [method, setMethod] = useState<PayMethod>("Cash");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const go = () => {
    setErr("");
    const a = Number(amt) || 0;
    if (a <= 0) return setErr("Enter an amount");
    if (isRefund && a > -balance) return setErr(`Only ${tk(-balance)} can be refunded`);
    if (method === "Cash") { const e = isRefund ? refund(a, b.code) : takeCash(a, b.code); if (e) return setErr(e); }
    bk.pay(b.code, isRefund ? -a : a, method, note.trim() || undefined);
    onDone(`${isRefund ? "Refunded" : "Received"} ${tk(a)} · ${method}`);
  };
  return (
    <ActionSheet title={isRefund ? "Refund" : "Take payment"} sub={`${b.code} · ${isRefund ? "to refund" : "balance"} ${tk(Math.abs(balance))}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={go} className={clsx(bMain, "flex-1")}>{isRefund ? "Record refund" : "Record payment"}{Number(amt) > 0 ? ` ${tk(Number(amt))}` : ""}</button>}>
      <div><label htmlFor="pay-amt" className={lbl}>Amount (৳)</label><input id="pay-amt" autoFocus inputMode="numeric" value={amt} onChange={(e) => setAmt(money(e.target.value))} className={input} placeholder="0" /></div>
      {!isRefund && balance > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{[balance, Math.round(balance / 2)].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((v, i) => <button key={v} type="button" onClick={() => setAmt(String(v))} className="rounded-full border border-hms-line px-3 py-1 text-[13px] font-semibold hover:bg-hms-hover">{i === 0 ? "Full" : "Half"} · {tk(v)}</button>)}</div>}
      <div className="mt-3"><p className={lbl}>Method</p><MethodPick value={method} onChange={setMethod} /><Hint>{method === "Cash" ? (isRefund ? "Paid out of the main Cashbox" : "Goes into the main Cashbox") : "Recorded only — no live gateway in this prototype"}</Hint></div>
      <div className="mt-3"><label htmlFor="pay-note" className={lbl}>Note (optional)</label><input id="pay-note" value={note} onChange={(e) => setNote(e.target.value)} className={input} placeholder={method === "bKash" ? "Transaction ID" : method === "Card" ? "Last 4 digits" : ""} /></div>
      {err && <Err>{err}</Err>}
    </ActionSheet>
  );
}

function MoveView({ b, onBack, onClose, onDone, priceOn }: ViewProps & { priceOn: (d: string) => number }) {
  const { bk, mode } = useBk();
  const from = b.status === "Checked in" && TODAY > b.from ? TODAY : b.from;
  const free = bk.freeUnits(from, b.to, b.code).filter((u) => u.code !== b.unit);
  const [unit, setUnit] = useState("");
  const [reprice, setReprice] = useState(false);
  const [err, setErr] = useState("");
  const groups = new Map<string, typeof free>();
  for (const u of free) groups.set(u.category, [...(groups.get(u.category) ?? []), u]);
  const order = [...groups.keys()].sort((a, c) => (a === b.categoryId ? -1 : c === b.categoryId ? 1 : 0));
  const go = () => {
    setErr("");
    const u = bk.unitByCode.get(unit);
    let nights: Night[] | undefined;
    if (reprice && u) {
      // Nights already slept keep their price; the rest take the new room's price.
      nights = b.nights.map((n) => (n.date < from ? n : { date: n.date, base: priceOn(n.date) }));
    }
    const e = bk.assign(b.code, unit, nights); if (e) return setErr(e);
    onDone(b.unit ? `Moved to Room ${unit}` : `Room ${unit} assigned`);
  };
  return (
    <ActionSheet title={b.unit ? "Move room" : "Assign room"} sub={`${b.code} · ${dm(from)} → ${dm(b.to)}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={go} disabled={!unit} className={clsx(bMain, "flex-1")}>{unit ? `${b.unit ? "Move" : "Assign"} to Room ${unit}` : "Pick a room"}</button>}>
      {free.length === 0 ? <p className="rounded-xl bg-[#f4f6f8] px-4 py-6 text-center text-[14px] text-hms-muted">No other room is free for these dates.</p> : order.map((c) => (
        <div key={c} className="mb-3">
          <p className="mb-1.5 text-[13px] font-semibold">{bk.cats.get(c)?.name}{c === b.categoryId && <span className="font-normal text-hms-muted"> · same type</span>}</p>
          <div role="radiogroup" aria-label={bk.cats.get(c)?.name} className="flex flex-wrap gap-1.5">
            {groups.get(c)!.map((u) => <button key={u.code} type="button" role="radio" aria-checked={unit === u.code} onClick={() => setUnit(u.code)} className={clsx("h-10 min-w-16 rounded-lg border px-3 text-[14px] font-semibold", unit === u.code ? "border-hms-red bg-hms-coral-soft text-hms-red" : "border-hms-line bg-white hover:bg-hms-hover")}>{u.code}</button>)}
          </div>
        </div>
      ))}
      {mode === "details" && unit && bk.unitByCode.get(unit)?.category !== b.categoryId && (
        <label className="mt-2 flex items-start gap-3 rounded-xl border border-hms-line px-3.5 py-3"><input type="checkbox" checked={reprice} onChange={(e) => setReprice(e.target.checked)} className="mt-1 size-4 accent-[#b11c29]" /><span className="text-[14px]"><b>Use the new room&apos;s price</b><span className="block text-[12.5px] text-hms-muted">Otherwise the guest keeps the booked price (free upgrade).</span></span></label>
      )}
      {mode === "easy" && <Hint>Price stays the same.</Hint>}
      {err && <Err>{err}</Err>}
    </ActionSheet>
  );
}

function DatesView({ b, onBack, onClose, onDone, priceOn }: ViewProps & { priceOn: (d: string) => number }) {
  const { bk } = useBk();
  const inHouse = b.status === "Checked in";
  const [from, setFrom] = useState(b.from);
  const [to, setTo] = useState(b.to);
  const [err, setErr] = useState("");
  const old = new Map(b.nights.map((n) => [n.date, n.base]));
  const nights: Night[] = []; if (from < to) for (let d = from; d < to; d = addDays(d, 1)) nights.push({ date: d, base: old.get(d) ?? priceOn(d) });
  const before = bill(b).total, after = from < to ? bill({ ...b, nights }).total : before;
  const go = () => { setErr(""); const e = bk.setDates(b.code, from, to, priceOn); if (e) return setErr(e); onDone(`Dates changed · ${dm(from)} → ${dm(to)}`); };
  return (
    <ActionSheet title={inHouse ? "Extend or shorten stay" : "Change dates"} sub={`${b.code}${b.unit ? ` · Room ${b.unit}` : ""}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={go} disabled={from >= to || (from === b.from && to === b.to)} className={clsx(bMain, "flex-1")}>Save new dates</button>}>
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="d-from" className={lbl}>Check-in</label><input id="d-from" type="date" value={from} disabled={inHouse} min={inHouse ? undefined : TODAY} onChange={(e) => e.target.value && setFrom(e.target.value)} className={input} /></div>
        <div><label htmlFor="d-to" className={lbl}>Check-out</label><input id="d-to" type="date" value={to} min={addDays(inHouse ? TODAY : from, 1)} onChange={(e) => e.target.value && setTo(e.target.value)} className={input} /></div>
      </div>
      {inHouse && <div className="mt-2 flex flex-wrap gap-1.5">{[1, 2, 3].map((n) => <button key={n} type="button" onClick={() => setTo(addDays(b.to, n))} className="rounded-full border border-hms-line px-3 py-1 text-[13px] font-semibold hover:bg-hms-hover">+{n} night{n > 1 ? "s" : ""}</button>)}</div>}
      <div className="mt-4 rounded-xl border border-hms-line px-3.5 py-2.5">
        <Row k="Nights" v={`${b.nights.length} → ${from < to ? nightsBetween(from, to) : "—"}`} />
        <Row k="Room bill" v={`${tk(before)} → ${tk(after)}`} />
        <Row strong k="Difference" v={`${after - before >= 0 ? "+" : "−"}${tk(Math.abs(after - before))}`} tone={after > before ? "text-[#b42318]" : "text-[#16693a]"} />
      </div>
      <Hint>New nights use the price from Discounts &amp; Rates.</Hint>
      {err && <Err>{err}</Err>}
    </ActionSheet>
  );
}

const REASONS = ["Guest cancelled", "Plans changed", "Payment not received", "Duplicate booking", "Other"];
function CancelView({ b, onBack, onClose, onDone }: ViewProps) {
  const { bk } = useBk();
  const late = b.from < TODAY;
  const [kind, setKind] = useState<"Cancelled" | "No-show">(late ? "No-show" : "Cancelled");
  const [reason, setReason] = useState(late ? "Did not arrive" : REASONS[0]);
  const paid = paidOf(b);
  const [keep, setKeep] = useState("0");
  const k = Math.min(Number(keep) || 0, paid);
  const go = () => { bk.cancel(b.code, kind, reason, k); onDone(`${b.code} ${kind === "No-show" ? "marked no-show" : "cancelled"}${paid - k > 0 ? ` · refund ${tk(paid - k)} due` : ""}`); };
  return (
    <ActionSheet title={late ? "Didn't arrive" : "Cancel booking"} sub={`${b.code} · ${dm(b.from)} → ${dm(b.to)}`} onBack={onBack} onClose={onClose}
      footer={<button onClick={go} className={clsx(bMain, "flex-1 !bg-[#b42318]")}>{kind === "No-show" ? "Mark no-show" : "Cancel booking"}</button>}>
      {late && (
        <div role="radiogroup" aria-label="What happened" className="mb-3 flex rounded-lg bg-[#e9edf2] p-1">
          {(["No-show", "Cancelled"] as const).map((x) => <button key={x} type="button" role="radio" aria-checked={kind === x} onClick={() => { setKind(x); setReason(x === "No-show" ? "Did not arrive" : REASONS[0]); }} className={clsx("flex-1 rounded-md py-1.5 text-[14px] font-semibold", kind === x ? "bg-white shadow-sm" : "text-[#4d5664]")}>{x === "No-show" ? "No-show" : "Guest cancelled"}</button>)}
        </div>
      )}
      {kind === "Cancelled" && <div><label htmlFor="c-r" className={lbl}>Reason</label><select id="c-r" value={reason} onChange={(e) => setReason(e.target.value)} className={input}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>}
      <p className="mt-3 text-[14px] text-[#4d5664]">{b.unit ? `Room ${b.unit}` : "The room"} becomes free for {dm(b.from)} – {dm(b.to)}.</p>
      {paid > 0 && (
        <div className="mt-3 rounded-xl border border-hms-line px-3.5 py-3">
          <p className="text-[14px]">Guest paid <b>{tk(paid)}</b>.</p>
          <div className="mt-2"><label htmlFor="c-keep" className={lbl}>Keep as cancellation fee (৳)</label><input id="c-keep" inputMode="numeric" value={keep} onChange={(e) => setKeep(money(e.target.value))} className={input} /></div>
          <Row strong k="Refund due" v={tk(paid - k)} tone="text-[#6b55e0]" />
        </div>
      )}
      {payState(b) === "Due" && paid === 0 && <Hint>No payment was taken, so nothing to refund.</Hint>}
    </ActionSheet>
  );
}
