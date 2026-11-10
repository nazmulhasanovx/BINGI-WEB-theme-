"use client";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { BedDouble, CircleAlert, ImagePlus, Info, Search, TriangleAlert, X } from "lucide-react";
import { SAMPLE_ART, orderTotal, tk, whenLabel, type BookingRef, type Order, type Service, type SvcCategory, type useServices } from "@/lib/services/store";
import { TODAY as TODAY_ISO } from "@/lib/rooms/store";
import { Sheet, btnLine, btnPrimary, input, lbl } from "../guests/ui";

type Svc = ReturnType<typeof useServices>;
const Err = ({ children }: { children: ReactNode }) => <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-[#c81e1e]"><CircleAlert className="size-3.5" />{children}</p>;
export const Note = ({ tone = "info", title, children }: { tone?: "info" | "warn"; title: string; children: ReactNode }) => (
  <div className={clsx("flex gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px]", tone === "warn" ? "bg-[#fff6e5] text-[#7a4a0b]" : "bg-[#f4f2fb] text-[#4d5664]")}>
    {tone === "warn" ? <TriangleAlert className="mt-0.5 size-4 shrink-0" /> : <Info className="mt-0.5 size-4 shrink-0 text-[#6b55e0]" />}
    <span><b className={tone === "warn" ? "" : "text-[#3b2f8f]"}>{title}</b><span className="block">{children}</span></span>
  </div>
);
const Foot = ({ onClose, label, onSave, disabled, cancel = "Cancel" }: { onClose: () => void; label: string; onSave: () => void; disabled?: boolean; cancel?: string }) => (
  <><button onClick={onClose} className={clsx(btnLine, "flex-1")}>{cancel}</button><button onClick={onSave} disabled={disabled} className={clsx(btnPrimary, "flex-1")}>{label}</button></>
);
const Seg = ({ value, options, onChange, label }: { value: string; options: [string, string][]; onChange: (v: string) => void; label: string }) => (
  <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-[#e9edf2] p-1">
    {options.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={clsx("h-9 flex-1 rounded-md text-[14px] font-semibold", value === v ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}
  </div>
);

/** Illustrated sample artwork (design note: preview uses sample art); real photos come from upload. */
export function ServiceImage({ src, className }: { src?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- uploaded data URL
  if (src && src !== SAMPLE_ART) return <img src={src} alt="" className={clsx("object-cover", className)} />;
  return (
    <svg viewBox="0 0 320 120" className={className} aria-hidden>
      <rect width="320" height="120" fill="#dfe9f1" /><circle cx="250" cy="34" r="16" fill="#f5c46b" />
      <path d="M0 78 Q60 50 120 72 T240 66 T320 70 V120 H0Z" fill="#b7cbd8" /><path d="M0 92 Q80 76 160 90 T320 88 V120 H0Z" fill="#9ab4c4" />
      <path d="M0 104 H320 V120 H0Z" fill="#c9d3c1" /><g transform="translate(120 70)"><rect x="0" y="10" width="70" height="20" rx="6" fill="#fff" stroke="#3b4a57" strokeWidth="2" /><path d="M12 10 L22 0 H48 L58 10" fill="#fff" stroke="#3b4a57" strokeWidth="2" /><circle cx="16" cy="31" r="6" fill="#3b4a57" /><circle cx="54" cy="31" r="6" fill="#3b4a57" /></g>
    </svg>
  );
}

// ---------------- Service ----------------
export function ServiceSheet({ svc, item, onClose }: { svc: Svc; item?: Service; onClose: () => void }) {
  const cats = svc.st.categories;
  const [f, setF] = useState<Service>(item ?? { id: svc.uid("s"), name: "", category: cats[0]?.id ?? "", duration: "", price: 0, description: "" });
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setF((x) => ({ ...x, [k]: v }));
  const dup = svc.st.services.some((s) => s.id !== f.id && s.name.trim().toLowerCase() === f.name.trim().toLowerCase());
  const errs = { name: !f.name.trim() ? "Enter the service name" : dup ? "A service with this name already exists" : "", price: !(Number(price) > 0) ? "Enter a price above 0" : "" };
  const save = () => { setTried(true); if (errs.name || errs.price) return; svc.saveService({ ...f, name: f.name.trim(), price: Number(price) }); onClose(); };
  const pickImage = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement("canvas"); const w = Math.min(640, img.width); c.width = w; c.height = Math.round((img.height * w) / img.width); c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height); set("image", c.toDataURL("image/jpeg", 0.75)); }; img.src = String(r.result); };
    r.readAsDataURL(file);
  };
  return (
    <Sheet title={item ? "Edit Service" : "Add Service"} sub={item ? "Changes apply to new orders. Past orders keep their price." : "Add a service your staff can order."} onClose={onClose} footer={<Foot onClose={onClose} label="Save Service" onSave={save} />}>
      <div className="space-y-4">
        <div><label htmlFor="sv-name" className={lbl}>Service Name</label><input id="sv-name" autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Evening Shuttle" className={input} />{tried && errs.name && <Err>{errs.name}</Err>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="sv-cat" className={lbl}>Category</label><select id="sv-cat" value={f.category} onChange={(e) => set("category", e.target.value)} className={input}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label htmlFor="sv-price" className={lbl}>Unit Price</label>
            <div className="flex h-11 items-center rounded-lg border border-[#858c97] bg-white pr-3 focus-within:border-hms-ink"><input id="sv-price" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="0" className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" /><span className="text-[12.5px] text-hms-muted">BDT</span></div>
            {tried && errs.price && <Err>{errs.price}</Err>}</div>
        </div>
        <div><label htmlFor="sv-dur" className={lbl}>Duration</label><input id="sv-dur" value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 30 min" className={input} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">{["30 min", "45 min", "60 min", "24 hours", "On request"].map((d) => <button key={d} type="button" onClick={() => set("duration", d)} className="h-7 rounded-md border border-hms-line px-2 text-[12.5px] hover:bg-hms-hover">{d}</button>)}</div></div>
        <div><label htmlFor="sv-desc" className={lbl}>Description</label><textarea id="sv-desc" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="One line guests will see" className={clsx(input, "h-auto py-2.5")} /></div>
        <div className="border-t border-hms-line pt-4">
          <p className="mb-2 text-[14px] font-semibold">Public Website Image</p>
          {f.image ? (
            <div className="relative overflow-hidden rounded-xl border border-hms-line"><ServiceImage src={f.image} className="h-32 w-full" /><button type="button" onClick={() => set("image", undefined)} aria-label="Remove image" className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/90 shadow"><X className="size-4" /></button></div>
          ) : (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#858c97] px-4 py-3 hover:bg-hms-hover">
              <ImagePlus className="size-5 text-hms-muted" /><span><span className="block text-[14px] font-semibold">Upload image</span><span className="text-[12.5px] text-hms-muted">Add a photo for your website</span></span>
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
            </label>
          )}
          <div className="mt-3"><Note title="Horizon Experiences">Active services with an image appear on the public website.</Note></div>
        </div>
      </div>
    </Sheet>
  );
}

// ---------------- Order (new / edit) ----------------
export function OrderSheet({ svc, order, serviceId, onClose, onDone }: { svc: Svc; order?: Order; serviceId?: string; onClose: () => void; onDone: (id: string, msg: string) => void }) {
  const active = svc.st.services.filter((s) => !s.archived || s.id === order?.service);
  const [sid, setSid] = useState(order?.service ?? serviceId ?? active[0]?.id ?? "");
  const s = svc.st.services.find((x) => x.id === sid);
  const [method, setMethod] = useState<Order["method"]>(order?.method ?? "booking");
  const [qty, setQty] = useState(String(order?.qty ?? 1));
  const [mode, setMode] = useState<"now" | "schedule">(order && order.when !== "now" ? "schedule" : "now");
  const [date, setDate] = useState(order && order.when !== "now" ? order.when.date : TODAY_ISO);
  const [time, setTime] = useState(order && order.when !== "now" ? order.when.time : "16:30");
  const [booking, setBooking] = useState<BookingRef | undefined>(order?.booking ?? (order ? undefined : svc.bookings[0]));
  const [findB, setFindB] = useState(false);
  const [q, setQ] = useState("");
  const [guest, setGuest] = useState(order?.walkIn?.name ?? "Walk-in Guest");
  const [phone, setPhone] = useState(order?.walkIn?.phone ?? "");
  const [tried, setTried] = useState(false);
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const unit = order && order.service === sid ? order.unitPrice : s?.price ?? 0;
  const total = n * unit;
  const noBooking = method === "booking" && !booking;
  const noCash = method === "cash" && !svc.st.cashboxOpen;
  const badTime = mode === "schedule" && (!date || !time || date < TODAY_ISO);
  const disabled = !s || n < 1 || noCash || (tried && (noBooking || badTime));
  const lockedMethod = !!order; // changing where a saved charge goes is a backend decision (design note)
  const save = () => {
    setTried(true);
    if (!s || n < 1 || noBooking || noCash || badTime) return;
    const id = svc.saveOrder({
      id: order?.id, service: sid, qty: n, unitPrice: unit, method,
      booking: method === "booking" ? booking : undefined, walkIn: method === "cash" ? { name: guest.trim() || "Walk-in Guest", phone: phone.trim() } : undefined,
      when: mode === "now" ? "now" : { date, time }, payment: method === "cash" ? "Paid" : order?.payment ?? "Unpaid",
    });
    onDone(id, order ? `Order ${order.id} updated` : method === "cash" ? `${s.name} — cash sale saved` : `${s.name} charged to ${booking?.code}`);
    onClose();
  };
  const matches = svc.bookings.filter((b) => !q || `${b.code} ${b.guest} ${b.room}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
  return (
    <Sheet title={order ? "Edit Service Order" : "New Service Order"} sub={order ? `Update order ${order.id}.` : "Record a service for a booking or a walk-in guest."} onClose={onClose}
      footer={<Foot onClose={onClose} label={order ? "Save Changes" : "Save Order"} onSave={save} disabled={disabled} />}>
      <div className="space-y-4">
        <div><label htmlFor="or-svc" className={lbl}>Service</label>
          <select id="or-svc" value={sid} disabled={!!order} onChange={(e) => setSid(e.target.value)} className={clsx(input, order && "bg-[#f4f6f8] text-[#4d5664]")}>{active.map((x) => <option key={x.id} value={x.id}>{x.name} · {tk(x.price)}</option>)}</select></div>
        <div><p className={lbl}>Charge Method</p>
          {lockedMethod ? <p className="flex h-11 items-center rounded-lg bg-[#f4f6f8] px-3 text-[14px] font-semibold">{method === "booking" ? "Charge to booking" : "Cash sale"}</p>
            : <Seg label="Charge method" value={method} onChange={(v) => setMethod(v as Order["method"])} options={[["booking", "Charge to booking"], ["cash", "Cash sale"]]} />}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="or-qty" className={lbl}>Quantity</label><input id="or-qty" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className={input} />{n < 1 && <Err>At least 1</Err>}</div>
          <div><p className={lbl}>Requested Time</p><Seg label="Requested time" value={mode} onChange={(v) => setMode(v as "now" | "schedule")} options={[["now", "Now"], ["schedule", "Schedule"]]} /></div>
        </div>
        {mode === "schedule" && (
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="or-date" className={lbl}>Requested Date</label><input id="or-date" type="date" min={TODAY_ISO} value={date} onChange={(e) => setDate(e.target.value)} className={input} /></div>
            <div><label htmlFor="or-time" className={lbl}>Requested Time <span className="font-normal text-hms-muted">· Dhaka</span></label><input id="or-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={input} /></div>
            {tried && badTime && <div className="col-span-2"><Err>Pick a date from today on and a time</Err></div>}
          </div>
        )}
        {method === "booking" ? (
          <div><p className={lbl}>Booking</p>
            {booking && !findB ? (
              <div className="flex items-center gap-3 rounded-lg border border-hms-line bg-[#fafafc] px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-lg bg-white text-hms-muted ring-1 ring-hms-line"><BedDouble className="size-4" /></span>
                <span className="flex-1"><span className="block text-[14px] font-semibold">{booking.guest} · Room {booking.room}</span><span className="text-[12.5px] text-hms-muted">{booking.code} · {booking.phone}</span></span>
                {!order && <button type="button" onClick={() => { setFindB(true); setQ(""); setBooking(undefined); }} className="text-[13.5px] font-semibold text-hms-red">Change</button>}
              </div>
            ) : (
              <div>
                <label className={clsx("flex h-11 items-center gap-2 rounded-lg border bg-white px-3", tried && noBooking ? "border-[#c81e1e]" : "border-[#858c97] focus-within:border-hms-ink")}>
                  <Search className="size-4 text-hms-muted" /><span className="sr-only">Find booking</span>
                  <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search booking ID, guest name or room" className="h-full flex-1 bg-transparent text-[14.5px] outline-none" />
                </label>
                {tried && noBooking && <Err>Select a booking to continue.</Err>}
                <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-hms-line">
                  {matches.map((b) => <li key={b.code}><button type="button" onClick={() => { setBooking(b); setFindB(false); }} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-hms-hover"><span className="flex-1 text-[14px]"><b>{b.guest}</b> · Room {b.room}</span><span className="font-mono text-[12.5px] text-hms-muted">{b.code}</span></button></li>)}
                  {!matches.length && <li className="px-3 py-3 text-[13.5px] text-hms-muted">No in-house or upcoming booking matches.</li>}
                </ul>
              </div>
            )}
            {order && <div className="mt-3"><Note title="Existing booking charge">Review the updated total before saving.</Note></div>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="or-gn" className={lbl}>Guest Name</label><input id="or-gn" value={guest} onChange={(e) => setGuest(e.target.value)} className={input} /></div>
              <div><label htmlFor="or-gp" className={lbl}>Guest Phone <span className="font-normal text-hms-muted">Optional</span></label><input id="or-gp" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" className={input} /></div>
            </div>
            {svc.st.cashboxOpen
              ? <Note title="Cashbox">Cash posts to today’s open Cashbox.</Note>
              : <Note tone="warn" title="No open Cashbox">Open a Cashbox before saving a cash sale.</Note>}
            <button type="button" onClick={() => svc.setCashbox(!svc.st.cashboxOpen)} className="-mt-2 text-[12.5px] text-hms-muted underline">Prototype: mark Cashbox {svc.st.cashboxOpen ? "closed" : "open"}</button>
          </>
        )}
        <div className="flex items-start justify-between rounded-xl border border-hms-line px-4 py-3">
          <div><p className="text-[14px] font-semibold">Order Total</p><p className="text-[13px] text-hms-muted">{n} × {tk(unit)}</p>
            <p className="text-[12.5px] text-hms-muted">{method === "cash" ? "Payment method · Cash sale" : booking ? `Charge to booking · ${booking.code}` : "Charge destination · Booking required"}</p></div>
          <p className="text-[22px] font-bold tabular-nums">{tk(total)}</p>
        </div>
        {order && order.service === sid && s && s.price !== order.unitPrice && <p className="text-[12.5px] text-hms-muted">Kept the order price {tk(order.unitPrice)} (catalog is now {tk(s.price)}).</p>}
      </div>
    </Sheet>
  );
}

// ---------------- Details / cancel ----------------
export function DetailsSheet({ svc, order, onClose, onEdit, onCancel }: { svc: Svc; order: Order; onClose: () => void; onEdit: () => void; onCancel: () => void }) {
  const s = svc.st.services.find((x) => x.id === order.service);
  const editable = !order.cancelled && order.method === "booking" && order.payment === "Unpaid";
  const rows: [string, string][] = [
    [order.method === "booking" ? "Booking" : "Sale", order.method === "booking" ? order.booking?.code ?? "—" : "Walk-in · Cash sale"],
    ["Guest", order.method === "booking" ? `${order.booking?.guest} · Room ${order.booking?.room}` : `${order.walkIn?.name}${order.walkIn?.phone ? ` · ${order.walkIn.phone}` : ""}`],
    ["Requested time", whenLabel(order)], ["Quantity", String(order.qty)], ["Order unit price", tk(order.unitPrice)],
    ["Payment status", order.payment], ["Recorded", order.created.replace("T", " · ")],
  ];
  return (
    <Sheet title="Order Details" sub={`${order.id} · ${s?.name}`} onClose={onClose}
      footer={editable ? <Foot onClose={onClose} cancel="Close" label="Edit Order" onSave={onEdit} /> : <button onClick={onClose} className={clsx(btnLine, "flex-1")}>Close</button>}>
      <div className="space-y-4">
        <div className="flex items-start justify-between"><div><p className="text-[17px] font-bold">{s?.name}</p><p className="text-[13px] text-hms-muted">{order.id}</p></div><PayPill o={order} /></div>
        <div className="flex items-start justify-between rounded-xl border border-hms-line px-4 py-3">
          <div><p className="text-[14px] font-semibold">Order Total</p><p className="text-[13px] text-hms-muted">{order.qty} × {tk(order.unitPrice)}</p><p className="text-[12.5px] text-hms-muted">{order.method === "booking" ? `Charge to booking · ${order.booking?.code}` : "Payment method · Cash sale"}</p></div>
          <p className={clsx("text-[22px] font-bold tabular-nums", order.cancelled && "text-hms-muted line-through")}>{tk(orderTotal(order))}</p>
        </div>
        <dl className="divide-y divide-hms-line text-[14px]">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-hms-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}</dl>
        {order.cancelled && <Note tone="warn" title="Cancelled">{order.cancelled.reason}</Note>}
        {!editable && !order.cancelled && <p className="text-[12.5px] text-hms-muted">{order.method === "cash" ? "Cash sales are paid — they can’t be edited. Cancel records a refund to note in Cashbox." : "Paid booking charges can’t be edited."}</p>}
        {!order.cancelled && <button onClick={onCancel} className="text-[13.5px] font-semibold text-[#c81e1e]">Cancel this order</button>}
      </div>
    </Sheet>
  );
}

export function CancelSheet({ svc, order, onClose, onDone }: { svc: Svc; order: Order; onClose: () => void; onDone: (m: string) => void }) {
  const [reason, setReason] = useState("");
  const s = svc.st.services.find((x) => x.id === order.service);
  return (
    <Sheet title="Cancel Service Order" sub={`Review order ${order.id} before cancelling.`} onClose={onClose}
      footer={<Foot onClose={onClose} cancel="Keep Order" label="Cancel Order" disabled={!reason} onSave={() => { svc.cancelOrder(order.id, reason); onDone(`${order.id} cancelled`); onClose(); }} />}>
      <div className="space-y-4">
        <div className="rounded-xl border border-hms-line px-4 py-3">
          <div className="flex justify-between"><p className="text-[15px] font-semibold">{s?.name}</p><p className="text-[17px] font-bold tabular-nums">{tk(orderTotal(order))}</p></div>
          <p className="text-[13px] text-hms-muted">{order.id} · {order.method === "booking" ? order.booking?.code : "Cash sale"}</p>
          <div className="mt-2"><PayPill o={order} /></div>
        </div>
        {order.method === "booking"
          ? <Note tone="warn" title="Linked booking charge">{order.payment === "Paid" ? "This charge is already paid on the booking — a refund must be handled in Payments." : "The charge is removed from the guest’s bill."}</Note>
          : <Note tone="warn" title="Cash sale">Record the cash refund in Cashbox.</Note>}
        <div><p className={lbl}>Reason</p>
          <div className="grid gap-2" role="radiogroup" aria-label="Reason">{["Guest changed plans", "Service not available", "Entered by mistake"].map((x) => <button key={x} type="button" role="radio" aria-checked={reason === x} onClick={() => setReason(x)} className={clsx("rounded-lg border px-3.5 py-3 text-left text-[14.5px]", reason === x ? "border-hms-ink shadow-[inset_0_0_0_1px] shadow-hms-ink" : "border-hms-line")}>{x}</button>)}</div></div>
      </div>
    </Sheet>
  );
}

export function PayPill({ o }: { o: Order }) {
  if (o.cancelled) return <span className="inline-flex items-center gap-1.5 rounded-md bg-hms-hover px-2 py-0.5 text-[12.5px] font-semibold text-[#4d5664]"><span className="size-1.5 rounded-full bg-current" />Cancelled</span>;
  return <span className={clsx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12.5px] font-semibold", o.payment === "Paid" ? "bg-[#e5f5ec] text-[#16693a]" : "bg-[#fdf3d9] text-[#7a5200]")}><span className="size-1.5 rounded-full bg-current" />{o.payment}</span>;
}

// ---------------- Category / preview ----------------
export function CategorySheet({ svc, cat, onClose }: { svc: Svc; cat?: SvcCategory; onClose: () => void }) {
  const [name, setName] = useState(cat?.name ?? "");
  const [tried, setTried] = useState(false);
  const dup = svc.st.categories.some((c) => c.id !== cat?.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const save = () => { setTried(true); if (!name.trim() || dup) return; svc.saveCategory({ id: cat?.id ?? svc.uid("c"), name: name.trim(), slug }); onClose(); };
  return (
    <Sheet title={cat ? "Edit Category" : "Add Category"} sub="Group related services so your team finds them quickly." onClose={onClose} footer={<Foot onClose={onClose} label="Save Category" onSave={save} />}>
      <div className="space-y-4">
        <div><label htmlFor="sc-name" className={lbl}>Category Name</label><input id="sc-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wellness" className={input} />
          {tried && !name.trim() && <Err>Enter a name</Err>}{tried && dup && <Err>This category already exists</Err>}</div>
        <p className="text-[13px] text-hms-muted">Website link: <span className="font-mono">/{slug || "category"}</span></p>
      </div>
    </Sheet>
  );
}

export function PreviewSheet({ svc, item, onClose, onBack }: { svc: Svc; item: Service; onClose: () => void; onBack: () => void }) {
  const c = svc.st.categories.find((x) => x.id === item.category);
  const visible = !item.archived && !!item.image;
  return (
    <Sheet title="Website Preview" sub="Preview the service card in Horizon Experiences." onClose={onClose} footer={<Foot onClose={onClose} cancel="Close" label="Back to Service" onSave={onBack} />}>
      <div className="space-y-4">
        <div className="flex items-center justify-between"><p className="text-[14px] font-semibold">Horizon · Experiences</p>
          <span className={clsx("rounded-md px-2 py-0.5 text-[12.5px] font-semibold", visible ? "bg-[#e5f5ec] text-[#16693a]" : "bg-hms-hover text-[#4d5664]")}>{visible ? "● Visible on Horizon" : "Not on the website"}</span></div>
        <article className="overflow-hidden rounded-xl border border-hms-line">
          <div className="p-2"><div className="overflow-hidden rounded-lg">{item.image ? <ServiceImage src={item.image} className="h-40 w-full" /> : <div className="grid h-40 place-items-center bg-hms-hover text-[13px] text-hms-muted">No image yet</div>}</div></div>
          <div className="px-4 pb-4">
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-hms-red">{c?.name}</p>
            <p className="text-[19px] font-bold">{item.name}</p>
            <p className="mt-0.5 text-[13.5px] text-[#4d5664]">{item.description || "—"}</p>
            <div className="mt-3 flex justify-between text-[13px]"><span className="text-hms-muted">{item.duration}</span><b>{tk(item.price)} per service</b></div>
          </div>
        </article>
        <Note title="Website visibility">{visible ? "This preview reflects the current Active service and its image." : item.archived ? "Archived services are hidden from the website." : "Add an image to show this service on the website."}</Note>
        {item.image === SAMPLE_ART && <p className="text-[12.5px] text-hms-muted">Sample artwork — replace it with a real photo before going live.</p>}
      </div>
    </Sheet>
  );
}
