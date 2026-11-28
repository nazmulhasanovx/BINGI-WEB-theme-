// Booking confirmation (proforma), money / refund receipt and running bill (interim folio).
// Same engine and look as the invoice (doc-kit.ts): template, colour, language and text size from
// Settings → Invoices & documents. Every figure comes from the booking; empty rows are hidden.
import type { Hotel } from "@/lib/types";
import type { Guest } from "@/lib/guests/store";
import { settingsOf } from "@/lib/settings/store";
import { TODAY } from "@/lib/rooms/store";
import { bill, channelLabel, heldMeals, paidOf, preMealTotal, totalOf, type Booking, type Pay, type Settings } from "./store";
import { lang as docLang, docPage, header as docHeader, footer as docFooter, esc as kesc, type DocDesign, type DocHotel, type LKey } from "./doc-kit";
import { docsOf, designOf } from "./docs";

type X = ReturnType<typeof docLang>;
const BN = docLang("bn");
const fill = (s: string, m: Record<string, string>) => s.replace(/\{(\w)\}/g, (k, c) => m[c] ?? k);

function hotelOf(h: Hotel): DocHotel {
  const st = settingsOf(h); const p = st.profile;
  return { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin, logo: st.branding.logo, showLogo: docsOf(h).showLogo };
}
const rctNo = (p: Pay) => `RCT-${p.id.slice(-6).toUpperCase()}`;
const guestsText = (b: Booking, x: X) => `${x.num(b.adults)} ${x.t(b.adults === 1 ? "adult" : "adults")}${b.children ? `, ${x.num(b.children)} ${x.t(b.children === 1 ? "child" : "children")}` : ""}`;

/** Title row in the style of the chosen template (same shapes as the invoice). */
function titleBlock(d: DocDesign, x: X, k: LKey, meta: string, stamp: string, big: { label: LKey; value: string }) {
  const bnSub = x.mix ? BN.t(k) : "";
  if (d.template === "minimal")
    return `<div class="title"><div><h1>${x.t(k)}</h1><div class="mut" style="margin-top:1.5mm">${meta}</div></div><div class="big"><div class="lab">${x.lb(big.label)}</div><b>${big.value}</b>${stamp ? `<div style="margin-top:1.5mm">${stamp}</div>` : ""}</div></div>`;
  if (d.template === "classic" || d.template === "elegant")
    return `<div class="title"><h1>${x.t(k)}</h1>${bnSub ? `<span class="bn" style="margin-top:1mm">${bnSub}</span>` : ""}<div class="meta mut">${meta}${stamp ? `<span style="margin-left:3mm;vertical-align:1px">${stamp}</span>` : ""}</div></div>`;
  return `<div class="title"><h1>${x.t(k)}${bnSub ? `<span class="bn" style="font-size:.36em;margin-top:1.4mm;color:#828a98">${bnSub}</span>` : ""}</h1><div class="r">${stamp}${meta ? `<div class="mut" style="margin-top:1.4mm;font-size:.9em">${meta}</div>` : ""}</div></div>`;
}
/** Extra styles for these three documents (on top of the doc-kit template). */
const extraCss = (d: DocDesign) => `<style>
.stay { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6mm; border-top: 1px solid #d8dce3; border-bottom: 1px solid #d8dce3; padding: 2.4mm 4mm; margin: -1mm 0 5mm; }
.stay .d { font-size: 1.22em; font-weight: 600; } .stay .s { font-size: .86em; color: #5b6372; } .stay .e { text-align: right; }
.stay .n { text-align: center; color: ${d.accent}; font-weight: 600; font-size: .95em; padding: 0 4mm; } .stay .n b { display: block; font-size: 1.6em; line-height: 1.1; }
.know { display: grid; gap: 3mm; margin-top: 5mm; font-size: .88em; color: #3e4656; line-height: 1.5; } .know .lab { margin-bottom: .8mm; }
.info .kv { white-space: normal; } .info { margin-bottom: 5mm; } .info > div { padding-top: 2.6mm; padding-bottom: 2.6mm; }
.cf .lines td { padding-top: 1.4mm; padding-bottom: 1.4mm; } .cf .tot > div { padding-top: 1mm; padding-bottom: 1mm; } .cf .pay td { padding-top: 1.3mm; padding-bottom: 1.3mm; } .cf .below { margin-top: 4mm; } .cf .sign { padding-top: 7mm; } .cf .ft { margin-top: 3mm; } .sheet { padding-bottom: 9mm; } .cf .info { margin-bottom: 4mm; } .cf .stay { margin-bottom: 4mm; } ${d.template === "modern" || d.template === "compact" ? "" : ".sheet { padding-top: 13mm; }"} .cf .title { margin-top: ${d.template === "minimal" ? 8 : d.template === "folio" ? 8 : d.template === "modern" ? 0 : 5}mm; margin-bottom: 4.5mm; } .cf .after { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 9mm; margin-top: 4mm; font-size: .88em; color: #3e4656; } .cf .after .lab { margin-bottom: .8mm; } ${d.template === "classic" || d.template === "elegant" ? ".cf .hd { gap: 1.5mm; } .cf .title { margin-top: 4mm; margin-bottom: 4mm; } .cf .title::after { margin-top: 2mm; } .cf .info > div { padding-top: 1.5mm; padding-bottom: 1.5mm; } .cf .stay { padding-top: 2mm; padding-bottom: 2mm; } .cf .lines th { padding-top: 1.8mm; padding-bottom: 1.8mm; } .cf .lines td { padding-top: 1.2mm; padding-bottom: 1.2mm; } .cf .greet { margin-bottom: 3mm !important; } .cf .after { margin-top: 3mm !important; } .cf .sign { padding-top: 6mm !important; }" : ""} .cf .greet { margin: -2mm 0 4mm; font-size: .95em; }
.pay td.mut { white-space: nowrap; } .notes { margin-top: 4mm; } .thanks { margin-top: 3mm; } .sign { padding-top: 9mm; } .ft { margin-top: 4mm; }
.rc { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 8mm; align-items: center; border: 1px solid #d8dce3; border-radius: 4px; padding: 4.5mm 5mm; margin-bottom: 5mm; }
.rc .amt { text-align: right; } .rc .amt b { display: block; font-size: 2.3em; font-weight: 600; color: ${d.accent}; line-height: 1.05; font-variant-numeric: lining-nums tabular-nums; }
.rc .wd { margin-top: 1.6mm; font-size: .92em; color: #3e4656; } .rc .wd b { font-weight: 600; color: #1c2230; }
.rgrid { display: grid; grid-template-columns: minmax(0,1fr) 78mm; gap: 9mm; align-items: start; }
.rgrid .kv { white-space: normal; row-gap: 1.2mm; font-size: .95em; }
@media print { html { background: #fff; } }
.stamp.note { color: ${d.accent}; border-color: ${d.accent}; }
${d.lang === "bn" ? ".stamp { letter-spacing: 0 !important; text-transform: none !important; }" : ""}
</style>`;

// ---------------------------------------------------------------- booking confirmation
export function confirmationHtml(h: Hotel, b: Booking, g: Guest | undefined, s: Settings) {
  const docs = docsOf(h); const d = designOf(h); const x = docLang(d.lang); const H = hotelOf(h);
  const r = bill(b); const cancelled = b.status === "Cancelled" || b.status === "No-show";
  const total = totalOf(b); const paid = paidOf(b); const due = Math.max(0, total - paid); const credit = Math.max(0, paid - total);
  const issued = b.created.slice(0, 10);
  const stamp = cancelled ? `<span class="stamp due">${x.t(b.status === "No-show" ? "stNoShow" : "stCancelled")}</span>`
    : b.status === "On hold" ? `<span class="stamp note">${x.t("stOnHold")}${b.hold ? ` · ${x.t("until")} ${x.date(b.hold.until)} ${x.time(b.hold.until)}` : ""}</span>`
    : `<span class="stamp ok">${x.t("stConfirmed")}</span>`;
  const meta = `${x.t("confNo")} ${x.num(kesc(b.code))} · ${x.t("issued")} ${x.date(issued)}`;
  const title = titleBlock(d, x, "confTitle", meta, stamp, { label: "balance", value: x.money(due) });
  const company = b.payer?.kind === "Company" && b.payer.name;
  const guest = `<div class="nm">${kesc(g?.name)}</div><div class="mut">${g?.phone ? x.num(kesc(g.phone)) : ""}${g?.email ? `<br>${kesc(g.email)}` : ""}${company ? `<br>${x.t("company")}: ${kesc(b.payer!.name)}` : ""}${b.booker?.name ? `<br>${x.t("bookedBy")}: ${kesc(b.booker.name)}${b.booker.phone ? ` · <span class="nw">${x.num(kesc(b.booker.phone))}</span>` : ""}` : ""}</div>`;
  const info = `<div class="info">
<div><div class="lab">${x.lb("guest")}</div>${guest}</div>
<div><div class="lab">${x.lb("booking")}</div><div class="kv"><span>${x.t("confNo")}</span><b>${x.num(kesc(b.code))}</b><span>${x.t("issued")}</span><span>${x.date(issued)}</span><span>${x.t("source")}</span><span>${kesc(channelLabel(b))}${b.channelRef ? ` · ${x.num(kesc(b.channelRef))}` : ""}</span></div></div>
<div><div class="lab">${x.lb("room")}</div><div class="kv"><span>${x.t("room")}</span><span>${b.unit ? x.num(kesc(b.unit)) : x.t("toAssign")}</span><span>${x.t("roomType")}</span><span>${kesc(b.type)}</span><span>${x.t("guests")}</span><span>${guestsText(b, x)}</span><span>${x.t("mealPlan")}</span><span>${b.mealPlan ? kesc(b.mealPlan.name) : x.t("roomOnly")}</span></div></div></div>`;
  const n = b.nights.length;
  const stay = `<div class="stay"><div><div class="lab">${x.lb("arrival")}</div><div class="d">${x.date(b.from, true)}</div><div class="s">${fill(x.t("checkInFrom"), { t: x.num(kesc(s.checkIn)) })}</div></div>
<div class="n"><b>${x.num(n)}</b>${x.t(n === 1 ? "oneNight" : "nights")}</div>
<div class="e"><div class="lab">${x.lb("departure")}</div><div class="d">${x.date(b.to, true)}</div><div class="s">${fill(x.t("checkOutBy"), { t: x.num(kesc(s.checkOut)) })}</div></div></div>`;
  const perMeal = b.mealPlan?.perNight ?? 0;
  type Row = { date: string; dow: boolean; text: string; qty: number; rate: number; amount: number };
  const rows: Row[] = b.nights.map((ni, i) => ({ date: ni.date, dow: true, text: `${kesc(b.type)} · ${x.t("night")} ${x.num(i + 1)}${b.mealPlan ? ` · ${kesc(b.mealPlan.name)}` : ""}`, qty: 1, rate: ni.base + perMeal, amount: ni.base + perMeal }));
  for (const m of heldMeals(b)) rows.push({ date: m.date, dow: false, text: kesc(m.name), qty: m.qty, rate: preMealTotal(m) / Math.max(1, m.qty), amount: preMealTotal(m) });
  for (const c of b.charges ?? []) rows.push({ date: c.at.slice(0, 10), dow: false, text: kesc(c.label), qty: 1, rate: c.amount, amount: c.amount });
  const lines = `<table class="lines"><thead><tr><th style="width:34mm">${x.lb("date")}</th><th>${x.lb("description")}</th><th class="c" style="width:14mm">${x.lb("qty")}</th><th class="r" style="width:25mm">${x.lb("rate")} (৳)</th><th class="r" style="width:27mm">${x.lb("amount")} (৳)</th></tr></thead><tbody>
${rows.map((w) => `<tr><td class="nw">${x.date(w.date, w.dow)}</td><td>${w.text}</td><td class="c">${x.num(w.qty)}</td><td class="r">${x.plain(w.rate)}</td><td class="r">${x.plain(w.amount)}</td></tr>`).join("")}</tbody></table>`;
  const other = total - r.total;
  const tot = cancelled
    ? `<div class="tot"><div class="g"><span>${x.lb("cancelFee")}</span><span class="nw">${x.money(total)}</span></div>
<div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div>
${credit ? `<div class="due"><span>${x.lb("credit")}</span><span class="nw">${x.money(credit)}</span></div>` : `<div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div>`}</div>`
    : `<div class="tot">
<div><span>${x.t("roomCharges")}</span><span class="nw">${x.money(r.rooms)}</span></div>
${r.discount ? `<div><span>${x.t("discount")}</span><span class="nw">− ${x.money(r.discount)}</span></div>` : ""}
${r.service ? `<div><span>${x.t("service")} ${x.num(b.tax.service)}%</span><span class="nw">${x.money(r.service)}</span></div>` : ""}
${r.vat ? `<div><span>${x.t("vat")} ${x.num(b.tax.vat)}%</span><span class="nw">${x.money(r.vat)}</span></div>` : ""}
${other ? `<div><span>${x.t("extras")}</span><span class="nw">${x.money(other)}</span></div>` : ""}
<div class="g"><span>${x.lb("total")}</span><span class="nw">${x.money(total)}</span></div>
${paid ? `<div><span>${x.t("advance")}</span><span class="nw">− ${x.money(paid)}</span></div>` : ""}
<div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div>
${credit ? `<div><span>${x.t("credit")}</span><span class="nw">${x.money(credit)}</span></div>` : ""}</div>`;
  const pays = `<div><div class="lab">${x.lb("payments")}</div>${b.payments.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("method")}</th><th>${x.t("reference")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>
${b.payments.map((q) => `<tr><td class="nw">${x.date(q.at)}, ${x.time(q.at)}</td><td>${x.method(q.method)}${q.amount < 0 ? ` · ${x.t("refund")}` : ""}</td><td class="mut">${q.note ? kesc(q.note) : x.num(rctNo(q))}</td><td class="r">${q.amount < 0 ? "−" : ""}${x.plain(q.amount)}</td></tr>`).join("")}</tbody></table>` : `<p class="mut">${x.t("noPay")}</p>`}
</div>`;
  const policy = s.freeCancelDays > 0
    ? fill(x.t("cancelFree"), { d: x.num(s.freeCancelDays), p: x.num(s.cancelFeePct), q: x.num(s.noShowFeePct) })
    : fill(x.t("cancelNoFree"), { p: x.num(s.cancelFeePct), q: x.num(s.noShowFeePct) });
  const know = `<div class="know">
${cancelled ? "" : `<div><div class="lab">${x.lb("cancelPolicy")}</div>${policy}</div>`}
${cancelled ? "" : `<div><div class="lab">${x.lb("bring")}</div>${x.t("bringText")}</div>`}</div>`;
  const after = `<div class="after">${b.note ? `<div><div class="lab">${x.lb("yourRequest")}</div>${kesc(b.note)}</div>` : ""}
<div${b.note ? "" : ` style="grid-column:1 / -1"`}><div class="mut">${x.t("notTaxInvoice")}</div>${docs.footer ? `<div class="thanks" style="margin-top:1mm">${kesc(docs.footer)}</div>` : ""}</div></div>`;
  const greet = g?.name && !cancelled ? `<p class="greet">${fill(x.t("dear"), { n: kesc(g.name) })}</p>` : "";
  const body = `${extraCss(d)}<div class="cf" style="display:contents">${docHeader(H, d, x)}${title}${greet}${info}${stay}${lines}<div class="below"><div>${pays}${know}</div>${tot}</div>${after}
<div class="sign"><div>${x.t("reservations")} · ${x.t("frontDesk")}</div><div>${x.t("authSign")}</div></div>${docFooter(`${kesc(H.name)} · ${x.t("confTitle")} ${x.num(kesc(b.code))}`)}</div>`;
  return docPage(`${x.t("confTitle")} ${b.code}`, d, body);
}

// ---------------------------------------------------------------- money receipt
/** One payment = one receipt. Half an A4 sheet; balance is the booking total less everything paid up to and including this payment. */
export function receiptHtml(h: Hotel, b: Booking, g: Guest | undefined, p: Pay) {
  const d = designOf(h); const x = docLang(d.lang); const H = hotelOf(h);
  const refund = p.amount < 0; const no = rctNo(p);
  const idx = b.payments.findIndex((q) => q.id === p.id);
  const upTo = (idx < 0 ? [...b.payments, p] : b.payments.slice(0, idx + 1)).reduce((s, q) => s + q.amount, 0);
  const total = totalOf(b); const after = total - upTo;
  const k: LKey = refund ? "refundReceipt" : "moneyReceipt";
  const meta = `${x.t("receiptNo")} ${x.num(no)} · ${x.date(p.at)}, ${x.time(p.at)}`;
  const title = titleBlock(d, x, k, meta, "", { label: refund ? "amountRefund" : "amountRecv", value: x.money(p.amount) });
  const company = b.payer?.kind === "Company" && b.payer.name;
  const who = company ? `${kesc(b.payer!.name)} <span class="mut">(${x.t("forGuest")}: ${kesc(g?.name)})</span>` : kesc(g?.name);
  const rc = `<div class="rc"><div><div class="lab">${x.lb(refund ? "paidTo" : "receivedFrom")}</div><div class="nm">${who}</div>${g?.phone ? `<div class="mut">${x.num(kesc(g.phone))}</div>` : ""}
<div class="wd">${x.t("inWords")}: <b>${x.words(p.amount)}</b></div></div>
${d.template === "minimal" ? "" : `<div class="amt"><div class="lab">${x.lb(refund ? "amountRefund" : "amountRecv")}</div><b>${x.money(p.amount)}</b></div>`}</div>`;
  const stayTxt = `${b.unit ? `${x.t("room")} ${x.num(kesc(b.unit))} · ` : ""}${kesc(b.type)} · ${x.date(b.from)} – ${x.date(b.to)}`;
  const kv = `<div class="kv">
<span>${x.t("dateTime")}</span><span>${x.date(p.at, true)}, ${x.time(p.at)}</span>
<span>${x.t("method")}</span><span>${x.method(p.method)}</span>
${p.note ? `<span>${x.t("reference")}</span><span>${kesc(p.note)}</span>` : ""}
<span>${x.t("forBooking")}</span><span>${x.num(kesc(b.code))} · ${stayTxt}</span>
${p.by ? `<span>${x.t(refund ? "refundedBy" : "receivedBy")}</span><span>${kesc(p.by)}</span>` : ""}</div>`;
  const tot = `<div class="tot">
<div><span>${x.t("bookingTotal")}</span><span class="nw">${x.money(total)}</span></div>
<div><span>${x.t("paidToDate")}</span><span class="nw">${upTo < 0 ? "− " : ""}${x.money(upTo)}</span></div>
<div class="due"><span>${after < 0 ? x.lb("credit") : x.lb("balanceAfter")}</span><span class="nw">${x.money(after)}</span></div></div>`;
  const body = `${extraCss(d)}<style>.sheet { min-height: 148mm; } .cf .sign { padding-top: 14mm; } .notes { margin-top: 4mm; }</style><div class="cf" style="display:contents">
${docHeader(H, d, x)}${title}${rc}<div class="rgrid">${kv}${tot}</div>
<div class="notes">${x.t("computerReceipt")}</div>
<div class="sign"><div>${x.t(refund ? "refundedBy" : "receivedBy")}${p.by ? ` · ${kesc(p.by)}` : ""}</div><div>${x.t(refund ? "receiverSign" : "payerSign")}</div></div>${docFooter(`${kesc(H.name)} · ${x.t(k)} ${x.num(no)}`)}</div>`;
  return docPage(`${x.t(k)} ${no}`, d, body);
}

// ---------------------------------------------------------------- running bill
/** Interim folio for an in-house guest: nights up to and including `asOf`, meals/charges dated up to `asOf`.
 *  A discount is shared over the nights (part for nights to date). No invoice number, no PAID stamp. */
export function runningBillHtml(h: Hotel, b: Booking, g: Guest | undefined, extras: { label: string; amount: number; date?: string }[] = [], asOf: string = TODAY) {
  const docs = docsOf(h); const d = designOf(h); const x = docLang(d.lang); const H = hotelOf(h);
  const nights = b.nights.filter((n) => n.date <= asOf);
  const share = b.nights.length ? nights.length / b.nights.length : 0;
  const r = bill({ ...b, nights, discount: Math.round(b.discount * share) });
  const meals = heldMeals(b).filter((m) => m.date <= asOf); const charges = (b.charges ?? []).filter((c) => c.at.slice(0, 10) <= asOf);
  const ex = extras.filter((e) => !e.date || e.date <= asOf);
  const other = meals.reduce((s, m) => s + preMealTotal(m), 0) + charges.reduce((s, c) => s + c.amount, 0) + ex.reduce((s, e) => s + e.amount, 0);
  const total = r.total + other; const paid = paidOf(b); const due = total - paid;
  const roomLabel = kesc(b.type); const perMeal = b.mealPlan?.perNight ?? 0;
  type Row = { date: string; text: string; qty: number; rate: number; amount: number };
  const rows: Row[] = nights.map((n) => ({ date: n.date, text: `${roomLabel} · ${x.t("night")} ${x.num(b.nights.indexOf(n) + 1)}${b.mealPlan ? ` · ${kesc(b.mealPlan.name)}` : ""}`, qty: 1, rate: n.base + perMeal, amount: n.base + perMeal }));
  for (const m of meals) rows.push({ date: m.date, text: kesc(m.name), qty: m.qty, rate: preMealTotal(m) / Math.max(1, m.qty), amount: preMealTotal(m) });
  for (const c of charges) rows.push({ date: c.at.slice(0, 10), text: kesc(c.label), qty: 1, rate: c.amount, amount: c.amount });
  for (const e of ex) rows.push({ date: e.date ?? asOf, text: kesc(e.label), qty: 1, rate: e.amount, amount: e.amount });
  rows.sort((a, c) => (a.date < c.date ? -1 : a.date > c.date ? 1 : 0));
  const stamp = `<span class="stamp note">${x.t("notFinal")}</span>`;
  const meta = `${x.t("booking")} ${x.num(kesc(b.code))} · ${x.t("asOf")} ${x.date(asOf)}`;
  const title = titleBlock(d, x, "runningBill", meta, stamp, { label: "balanceSoFar", value: x.money(Math.max(0, due)) });
  const billTo = b.payer?.kind === "Company"
    ? `<div class="nm">${kesc(b.payer.name)}</div><div class="mut">${x.t("forGuest")}: ${kesc(g?.name)}</div>`
    : `<div class="nm">${kesc(g?.name)}</div><div class="mut">${g?.phone ? x.num(kesc(g.phone)) : ""}${g?.email ? `<br>${kesc(g.email)}` : ""}</div>`;
  const info = `<div class="info">
<div><div class="lab">${x.lb("billedTo")}</div>${billTo}</div>
<div><div class="lab">${x.lb("runningBill")}</div><div class="kv"><span>${x.t("booking")}</span><b>${x.num(kesc(b.code))}</b><span>${x.t("asOf")}</span><span>${x.date(asOf)}</span><span>${x.t("source")}</span><span>${kesc(channelLabel(b))}</span></div></div>
<div><div class="lab">${x.lb("stay")}</div><div class="kv"><span>${x.t("arrival")}</span><span>${x.date(b.from, true)}</span><span>${x.t("departure")}</span><span>${x.date(b.to, true)}</span><span>${x.t("room")}</span><span>${x.num(kesc(b.unit || "—"))} · ${kesc(b.type)}</span><span>${x.t("nights")}</span><span>${fill(x.t("nightsOf"), { a: x.num(nights.length), b: x.num(b.nights.length) })}</span><span>${x.t("guests")}</span><span>${guestsText(b, x)}</span></div></div></div>`;
  const lines = `<div class="lab">${x.lb("chargesToDate")}</div><table class="lines"><thead><tr><th style="width:26mm">${x.lb("date")}</th><th>${x.lb("description")}</th><th class="c" style="width:14mm">${x.lb("qty")}</th><th class="r" style="width:25mm">${x.lb("rate")} (৳)</th><th class="r" style="width:27mm">${x.lb("amount")} (৳)</th></tr></thead><tbody>
${rows.map((w) => `<tr><td class="nw">${x.date(w.date)}</td><td>${w.text}</td><td class="c">${x.num(w.qty)}</td><td class="r">${x.plain(w.rate)}</td><td class="r">${x.plain(w.amount)}</td></tr>`).join("")}</tbody></table>`;
  const tot = `<div class="tot">
<div><span>${x.t("roomCharges")}</span><span class="nw">${x.money(r.rooms)}</span></div>
${r.discount ? `<div><span>${x.t("discount")}</span><span class="nw">− ${x.money(r.discount)}</span></div>` : ""}
${r.service ? `<div><span>${x.t("service")} ${x.num(b.tax.service)}%</span><span class="nw">${x.money(r.service)}</span></div>` : ""}
${r.vat ? `<div><span>${x.t("vat")} ${x.num(b.tax.vat)}%</span><span class="nw">${x.money(r.vat)}</span></div>` : ""}
${other ? `<div><span>${x.t("extras")}</span><span class="nw">${x.money(other)}</span></div>` : ""}
<div class="g"><span>${x.lb("totalToDate")}</span><span class="nw">${x.money(total)}</span></div>
${paid ? `<div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div>` : ""}
<div class="due"><span>${due < 0 ? x.lb("credit") : x.lb("balanceSoFar")}</span><span class="nw">${x.money(due)}</span></div></div>`;
  const pays = `<div><div class="lab">${x.lb("payments")}</div>${b.payments.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("method")}</th><th>${x.t("reference")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>
${b.payments.map((q) => `<tr><td class="nw">${x.date(q.at)}, ${x.time(q.at)}</td><td>${x.method(q.method)}${q.amount < 0 ? ` · ${x.t("refund")}` : ""}</td><td class="mut">${q.note ? kesc(q.note) : x.num(rctNo(q))}</td><td class="r">${q.amount < 0 ? "−" : ""}${x.plain(q.amount)}</td></tr>`).join("")}</tbody></table>` : `<p class="mut">${x.t("noPay")}</p>`}
<div class="notes"><b>${x.t("notFinal")}.</b> ${x.t("runningNote")}</div>${docs.footer ? `<div class="thanks">${kesc(docs.footer)}</div>` : ""}</div>`;
  const body = `${extraCss(d)}<div class="cf" style="display:contents">${docHeader(H, d, x)}${title}${info}${lines}<div class="below">${pays}${tot}</div>
<div class="sign"><div>${x.t("preparedBy")} · ${x.t("frontDesk")}</div><div>${x.t("guestSign")}</div></div>${docFooter(`${kesc(H.name)} · ${x.t("runningBill")} ${x.num(kesc(b.code))} · ${x.date(asOf)}`)}</div>`;
  return docPage(`${x.t("runningBill")} ${b.code}`, d, body);
}
