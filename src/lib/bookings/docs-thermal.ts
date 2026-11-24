// 80 mm / 58 mm thermal documents: kitchen ticket (KOT), restaurant bill, room charge slip, service order receipt.
// Engine: thermal-kit.ts. Amounts come from the module's own bill maths (meals bill(), services orderSub/orderTotal).
import type { Hotel } from "@/lib/types";
import { bill, type Order, type PayMethod } from "@/lib/meals/seed";
import { orderSub, orderTotal, type Order as SvcOrder, type Service as SvcItem } from "@/lib/services/store";
import { esc, lang } from "./doc-kit";
import { kv, thermalDesign, thermalFoot, thermalHead, thermalHotel, thermalPage, type ThermalOpts, type TX } from "./thermal-kit";

const svcType = (x: TX, s: Order["service"]) => x.t(s === "dinein" ? "svc_dinein" : s === "room" ? "svc_room" : s === "takeaway" ? "svc_takeaway" : "svc_delivery");
const method = (x: TX, m: PayMethod) => (m === "room" ? x.t("chargedToRoom") : m === "split" ? x.t("split") : x.method(m === "cash" ? "Cash" : m === "card" ? "Card" : "bKash"));
/** Table / room / takeaway, translated where the HMS gives an English place name. */
const placeOf = (x: TX, o: Order, where: string) => o.service === "room" ? `${x.t("room")} ${code(x, o.room ?? "—")}` : !o.place && (o.service === "takeaway" || o.service === "delivery") ? svcType(x, o.service) : code(x, where);
/** Codes with letters (T4, BR-7142, OSO-1046) stay as typed so they match the screen; pure numbers follow the language. */
const code = (x: TX, s: string) => (/[A-Za-z]/.test(s) ? esc(s) : x.num(esc(s)));
const when = (x: TX, at: string) => `${x.date(at)} · ${x.time(at)}`;
/** Item lines with price: name + amount, then "qty × price", size and note underneath. */
const priced = (x: TX, o: Order) => `<table>${o.lines.map((l) => `<tr class="it"><td>${esc(l.name)}${l.size ? ` (${esc(l.size)})` : ""}</td><td class="r b">${x.plain(l.price * l.qty)}</td></tr><tr><td class="sub" colspan="2">${x.num(l.qty)} × ${x.plain(l.price)}${l.note ? ` · ${esc(l.note)}` : ""}</td></tr>`).join("")}</table>`;
/** Subtotal → discount → service charge → VAT → total (restaurant bill and room slip). */
const totals = (x: TX, o: Order) => {
  const b = bill(o);
  return `${kv(x.lb("subtotal"), x.money(b.sub))}
${b.disc ? kv(`${x.t("discount")}${o.discount?.kind === "percent" ? ` ${x.num(o.discount.value)}%` : ""}${o.discount?.reason ? ` · ${esc(o.discount.reason)}` : ""}`, `− ${x.money(b.disc)}`) : ""}
${kv(`${x.t("service")} ${x.num(o.sc)}%`, x.money(b.sc))}${kv(`${x.t("vat")} ${x.num(o.vat)}%`, x.money(b.vat))}
<hr class="d">${kv(x.lb("total"), x.money(b.total), "tot")}<hr class="d">`;
};

/** Kitchen ticket for one round (items added later print as their own ticket). No prices. */
export function kotHtml(h: Hotel, o: Order, where: string, round = o.round ?? 1, opts: ThermalOpts = {}) {
  const d = thermalDesign(h, opts); const x = lang(d.lang);
  const ls = o.lines.filter((l) => (l.round ?? 1) === round);
  const n = ls.reduce((s, l) => s + l.qty, 0);
  const body = `<div class="dt" style="font-size:1.5em">${x.mix ? `KOT<span class="bn">${"কিচেন অর্ডার"}</span>` : x.bn ? x.t("kot") : "KOT"}</div><div class="c sm">${esc(o.outlet)}</div>
<div class="box"><div class="sm">${svcType(x, o.service)}</div><div style="font-size:2.3em;font-weight:700;line-height:1.1">${placeOf(x, o, where)}</div></div>
${round > 1 ? `<div class="inv">${x.t("addedRound")} ${x.num(round)}</div>` : ""}
${kv(x.lb("orderNo"), `<b style="font-size:1.15em">${code(x, o.no)}</b>`)}${kv(x.lb("time"), `<b style="font-size:1.15em">${x.time(o.at)}</b>`)}${kv(x.lb("server"), esc(o.by))}${o.guest ? kv(x.lb("guest"), esc(o.guest)) : ""}
<hr class="s"><table>${ls.map((l) => `<tr class="it"><td style="width:11mm;font-size:1.55em;font-weight:700;line-height:1.1">${x.num(l.qty)}×</td><td style="font-size:1.2em;font-weight:700;line-height:1.25">${esc(l.name)}${l.size ? `<div style="font-size:.8em">${esc(l.size)}</div>` : ""}${l.note ? `<div style="font-size:.82em;font-weight:600;margin-top:.5mm">» ${esc(l.note)}</div>` : ""}</td></tr>`).join("")}</table>
<hr class="s"><div class="c b">${x.num(n)} ${x.t("items")}</div>${thermalFoot(x)}`;
  return thermalPage(`KOT ${o.no}`, d, body);
}

/** Restaurant & bar guest bill. `tendered` = cash handed over by the guest (prints the change); leave out when not recorded. */
export function billHtml(h: Hotel, o: Order, where: string, opts: ThermalOpts & { tendered?: number } = {}) {
  const d = thermalDesign(h, opts); const x = lang(d.lang); const T = thermalHotel(h, true); const b = bill(o);
  const placeKey = o.service === "dinein" ? "table" : o.service === "room" ? "room" : null;
  const paid = o.pay === "unpaid" ? `<div class="inv">${x.t("notPaid")}</div>`
    : o.pay === "room" ? `<div class="box b">${x.t("chargedToRoom")}${o.room ? ` · ${x.t("room")} ${code(x, o.room)}` : ""}</div>`
    : `${o.payments?.length ? o.payments.map((p) => kv(`${x.t("paidBy")} · ${method(x, p.method)}`, x.money(p.amount))).join("") : kv(x.lb("paidBy"), method(x, o.method ?? "cash"))}
${opts.tendered && opts.tendered >= b.total ? `${kv(x.t("tendered"), x.money(opts.tendered))}${kv(x.lb("change"), x.money(opts.tendered - b.total), "b")}` : ""}`;
  const body = `${thermalHead(T, x, x.lb("bill"), esc(o.outlet))}
${kv(x.lb("billNo"), `<b>${code(x, o.no)}</b>`)}${kv(x.lb("date"), when(x, o.at))}${placeKey ? kv(x.lb(placeKey), `<b>${o.service === "room" ? code(x, o.room ?? "—") : code(x, where)}</b>`) : ""}
${kv(x.t("server"), esc(o.by))}${o.guest ? kv(x.t("guest"), esc(o.guest)) : ""}<div class="sm">${svcType(x, o.service)} · ${x.num(b.count)} ${x.t("items")}</div><hr>
${priced(x, o)}<hr>${totals(x, o)}
<div class="sm">${x.t("inWords")}: ${x.words(b.total)}</div><hr>${paid}
<div class="c b" style="margin-top:3mm">${x.t("thanksFood")}</div>${thermalFoot(x)}`;
  return thermalPage(`${x.t("bill")} ${o.no}`, d, body);
}

/** Slip the guest signs when a restaurant / room-service bill goes on the room bill. */
export function roomSlipHtml(h: Hotel, o: Order, where: string, opts: ThermalOpts = {}) {
  const d = thermalDesign(h, opts); const x = lang(d.lang); const T = thermalHotel(h, true);
  const body = `${thermalHead(T, x, x.lb("roomSlip"), esc(o.outlet))}
<div class="box"><div class="sm">${x.t("room")}</div><div style="font-size:2em;font-weight:700;line-height:1.1">${code(x, o.room ?? where)}</div>${o.guest ? `<div class="b">${esc(o.guest)}</div>` : ""}</div>
${kv(x.lb("orderNo"), `<b>${code(x, o.no)}</b>`)}${kv(x.lb("date"), when(x, o.at))}${kv(x.lb("server"), esc(o.by))}<div class="sm">${svcType(x, o.service)}${o.service === "room" ? "" : ` · ${placeOf(x, o, where)}`}</div><hr>
${priced(x, o)}<hr>${totals(x, o)}
<div class="inv">${x.t("chargedToRoom")}</div><div class="c sm">${x.t("payAtCheckout")}</div>
<div class="sig">${x.lb("guestSign")}</div>${thermalFoot(x)}`;
  return thermalPage(`${x.t("roomSlip")} ${o.no}`, d, body);
}

/** Receipt for an Other Services order (charge to room or cash sale). */
export function serviceReceiptHtml(h: Hotel, o: SvcOrder, s: SvcItem | undefined, opts: ThermalOpts = {}) {
  const d = thermalDesign(h, opts); const x = lang(d.lang); const T = thermalHotel(h);
  const v = s?.variants?.find((y) => y.id === o.variant);
  const sub = orderSub(o), total = orderTotal(o), gross = sub + (o.discount ?? 0);
  const guest = o.method === "booking" ? `${esc(o.booking?.guest)}${o.booking?.room ? ` · ${x.t("room")} ${code(x, o.booking.room)}` : ""}` : `${esc(o.walkIn?.name) || x.t("walkIn")}${o.walkIn?.phone ? ` · ${x.num(esc(o.walkIn.phone))}` : ""}`;
  const pay = o.cancelled ? `<div class="inv">${x.t("cancelled")}</div><div class="c sm">${esc(o.cancelled.reason)}</div>` : "";
  const state = o.payment === "Refunded" && o.refund ? kv(x.lb("refunded"), `${x.method(o.refund.method)} · ${x.money(o.refund.amount)}`)
    : o.payment === "Paid" ? kv(x.lb("paidBy"), o.method === "cash" ? x.method("Cash") : x.t("stPaid"))
    : o.method === "booking" ? `<div class="inv">${x.t("chargedToRoom")}</div><div class="c sm">${x.t("payAtCheckout")}</div>` : `<div class="inv">${x.t("notPaid")}</div>`;
  const body = `${thermalHead(T, x, x.lb("svcReceipt"))}
${kv(x.lb("receiptNo"), `<b>${code(x, o.id)}</b>`)}${kv(x.lb("date"), when(x, o.created))}${o.when !== "now" ? kv(x.lb("scheduled"), `${x.date(o.when.date)} · ${x.num(esc(o.when.time))}`) : ""}
${kv(x.lb("guest"), guest)}${o.method === "booking" && o.booking?.code ? kv(x.t("booking"), code(x, o.booking.code)) : ""}<hr>
<table><tr class="it"><td class="b">${esc(s?.name) || "—"}${v ? ` (${esc(v.name)})` : ""}</td><td class="r b">${x.plain(o.qty * o.unitPrice)}</td></tr><tr><td class="sub" colspan="2">${x.num(o.qty)} × ${x.plain(o.unitPrice)}</td></tr>
${o.children ? `<tr class="it"><td>${x.t("children2")}</td><td class="r">${x.plain(o.children * (o.childPrice ?? 0))}</td></tr><tr><td class="sub" colspan="2">${x.num(o.children)} × ${x.plain(o.childPrice ?? 0)}</td></tr>` : ""}</table><hr>
${kv(x.lb("subtotal"), x.money(gross))}${o.discount ? kv(x.t("discount"), `− ${x.money(o.discount)}`) : ""}${o.sc ? kv(x.t("service"), x.money(o.sc)) : ""}${o.vat ? kv(x.t("vat"), x.money(o.vat)) : ""}
<hr class="d">${kv(x.lb("total"), x.money(total), "tot")}<hr class="d"><div class="sm">${x.t("inWords")}: ${x.words(total)}</div><hr>
${pay}${state}${o.method === "booking" && !o.cancelled ? `<div class="sig">${x.lb("guestSign")}</div>` : `<div class="c b" style="margin-top:3mm">${x.t("thanksFood").split(/[.।]/)[0]}${x.bn ? "।" : "."}</div>`}${thermalFoot(x)}`;
  return thermalPage(`${x.t("svcReceipt")} ${o.id}`, d, body);
}
