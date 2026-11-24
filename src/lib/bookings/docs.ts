// Printable booking documents (A4): confirmation, invoice, receipt, registration card, guest register, Form-C.
// Printed through the browser dialog (Save as PDF works). Same data as the booking page.
import type { Hotel } from "@/lib/types";
import type { Guest } from "@/lib/guests/store";
import { settingsOf, type Settings as HotelSettings } from "@/lib/settings/store";
import { bill, channelLabel, dmy, heldMeals, paidOf, preMealTotal, timeOf, tk, totalOf, type Booking, type Pay, type Settings } from "./store";

const esc = (s: string | undefined | null) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export { DOC_TEMPLATES, DOC_ACCENTS, type DocDesign, type DocTemplate } from "./doc-kit";
import type { DocDesign } from "./doc-kit";
export { agreementHtml, regCardHtml, refundReceiptHtml, cancellationNoteHtml, depositReceiptHtml } from "./docs-agreement";
import { normaliseDesign, lang as docLang, docPage, header as docHeader, footer as docFooter, esc as kesc, type DocHotel } from "./doc-kit";
const BN: Record<string, string> = { "Invoice": "ইনভয়েস", "Booking confirmation": "বুকিং নিশ্চিতকরণ", "Money receipt": "টাকা প্রাপ্তির রসিদ", "Refund receipt": "ফেরতের রসিদ", "Guest registration card": "অতিথি নিবন্ধন কার্ড", "Guest register": "অতিথি রেজিস্টার", "Foreign guests (Form-C)": "বিদেশি অতিথি (ফর্ম-সি)" };
const LOGO_H = { S: 30, M: 42, L: 56 } as const;
let DRAFT: Partial<HotelSettings["docs"]> | null = null;
/** Render with unsaved Settings → Invoices & documents values (live preview). */
export function withDocsDraft<T>(draft: Partial<HotelSettings["docs"]>, fn: () => T): T { DRAFT = draft; try { return fn(); } finally { DRAFT = null; } }
export const docsOf = (h: Hotel): HotelSettings["docs"] => ({ ...settingsOf(h).docs, ...(DRAFT ?? {}) });
export const designOf = (h: Hotel) => normaliseDesign(docsOf(h).design);
/** Initials badge used when the hotel has not uploaded a logo yet. */
const monogram = (name: string, accent: string, px: number) => {
  const ini = name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "H";
  return `<span class="mono" style="width:${px}px;height:${px}px;border-color:${accent};color:${accent};font-size:${Math.round(px * 0.38)}px">${ini}</span>`;
};
const css = (d: DocDesign, landscape: boolean) => `@media screen { body { padding: 13mm 14mm; } } @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 13mm 14mm; } * { box-sizing: border-box; }
body { font: 400 11.2px/1.42 "IBM Plex Sans", "Noto Sans Bengali", -apple-system, "Segoe UI", Arial, sans-serif; color: #1b1f27; margin: 0; font-feature-settings: "tnum" 1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.bn { font-family: "Noto Sans Bengali", sans-serif; font-weight: 400; color: #8a909c; font-size: .8em; margin-left: 5px; letter-spacing: 0; text-transform: none; }
.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding-bottom: 10px; margin-bottom: 12px; border-bottom: 1.2px solid #1b1f27; }
.brand { display: flex; align-items: center; gap: 12px; } .brand img { object-fit: contain; display: block; }
.mono { display: inline-grid; place-items: center; border: 1.5px solid; border-radius: 50%; font-weight: 600; letter-spacing: .5px; flex: none; }
h1 { font-size: 16px; font-weight: 600; margin: 0; letter-spacing: -.1px; line-height: 1.2; }
.doct { font-size: 19px; font-weight: 600; letter-spacing: 2.4px; text-transform: uppercase; color: ${d.accent}; line-height: 1; }
.sub { color: #6a7180; margin-top: 4px; font-size: 10.4px; }
h2 { font-size: 9.6px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; color: #6a7180; margin: 16px 0 4px; }
.m { color: #6a7180; } .r { text-align: right; } .b { font-weight: 600; } small { color: #6a7180; }
table { width: 100%; border-collapse: collapse; font-size: inherit; }
th { font-size: 9.4px; font-weight: 500; letter-spacing: .7px; text-transform: uppercase; color: #6a7180; text-align: left; padding: 5px 7px; border-bottom: .9px solid #1b1f27; background: none; }
td { padding: 5px 7px; border-bottom: .6px solid #e4e6ea; text-align: left; vertical-align: top; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 28px; } .kv { display: flex; justify-content: space-between; border-bottom: .6px solid #eceef1; padding: 3px 0; } .kv span:first-child { color: #6a7180; }
.tot td { border: 0; padding: 2.5px 7px; } .big { font-size: 14px; font-weight: 600; } .tot tr:last-child td { border-top: .9px solid #1b1f27; padding-top: 6px; }
.sign { margin-top: 34px; display: flex; gap: 40px; } .sign div { flex: 1; border-top: .8px solid #1b1f27; padding-top: 4px; font-size: 10px; color: #6a7180; }
.badge { display: inline-block; color: ${d.accent}; font-size: 9.6px; font-weight: 600; letter-spacing: .8px; text-transform: uppercase; }
.foot { margin-top: 18px; padding-top: 6px; border-top: .6px solid #e4e6ea; color: #8a909c; font-size: 9.6px; text-align: center; }
${d.template === "classic" || d.template === "elegant" ? `.top { flex-direction: column; align-items: center; text-align: center; border-bottom: 0; padding-bottom: 0; margin-bottom: 6px; }
.brand { flex-direction: column; gap: 6px; } .doctbox { width: 100%; text-align: center; border-top: .6px solid #1b1f27; border-bottom: .6px solid #1b1f27; padding: 7px 0 6px; margin-top: 8px; }
.doctbox .sub { margin-top: 3px; } h1 { font-size: 17px; letter-spacing: .3px; }` : ""}
${d.template === "modern" || d.template === "folio" ? `body { border-top: 5px solid ${d.accent}; padding-top: 12px; } @media screen { body { padding-top: 13mm; } } .top { border-bottom: .8px solid #d9dce2; }
th { border-bottom-color: ${d.accent}; } h2 { color: ${d.accent}; } .tot tr:last-child td { border-top-color: ${d.accent}; color: ${d.accent}; }` : ""}
${d.template === "compact" || d.template === "minimal" ? `body { font-size: 10.6px; } td { padding: 3.5px 7px; } h2 { margin-top: 12px; } .sign { margin-top: 26px; }` : ""}`;
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Noto+Sans+Bengali:wght@400;600&display=swap">`;
const page = (h: Hotel, title: string, body: string, landscape = false) => { const d = designOf(h); const docs = docsOf(h);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${fonts}<style>${css(d, landscape)}</style></head><body>${body}${docs.footer ? `<div class="foot">${esc(docs.footer)}</div>` : ""}</body></html>`; };
/** Name, address, logo and tax numbers come from Settings → Property profile / Branding; look from Invoices & documents → Design. */
const head = (h: Hotel, title: string, sub: string) => { const st = settingsOf(h); const p = st.profile; const d = designOf(h); const docs = docsOf(h); const name = p.name || h.name; const px = LOGO_H[d.logoSize];
  const logo = !docs.showLogo ? "" : st.branding.logo ? `<img src="${st.branding.logo}" alt="" style="height:${px}px;max-width:${px * 4}px">` : monogram(name, d.accent, px);
  const bn = d.lang !== "en" && BN[title] ? `<span class="bn">${BN[title]}</span>` : "";
  const info = `<div><h1>${esc(name)}</h1><div class="sub">${esc(p.address || h.address)}<br>${esc(p.phone || h.phone)} · ${esc(p.email || h.email)}${p.bin ? ` · BIN ${esc(p.bin)}` : ""}</div></div>`;
  const doc = `<div class="doctbox r"><div class="doct">${esc(title)}</div>${bn ? `<div>${bn}</div>` : ""}<div class="sub">${sub}</div></div>`;
  return `<div class="top"><div class="brand">${logo}${info}</div>${doc}</div>`; };
const stayBlock = (b: Booking, g?: Guest) => `<div class="grid">
<div class="kv"><span>Guest</span><b>${esc(g?.name)}</b></div><div class="kv"><span>Booking</span><b>${b.code}</b></div>
<div class="kv"><span>Phone</span><span>${esc(g?.phone)}</span></div><div class="kv"><span>Source</span><span>${esc(channelLabel(b))}${b.channelRef ? ` · ${esc(b.channelRef)}` : ""}</span></div>
<div class="kv"><span>Room</span><span>${b.unit ? `${esc(b.unit)} · ` : ""}${esc(b.type)}</span></div><div class="kv"><span>Guests</span><span>${b.adults} adult(s)${b.children ? `, ${b.children} child(ren)` : ""}</span></div>
<div class="kv"><span>Check-in</span><span>${dmy(b.from)}</span></div><div class="kv"><span>Check-out</span><span>${dmy(b.to)} · ${b.nights.length} night(s)</span></div></div>`;

function charges(b: Booking, extras: { label: string; amount: number }[]) {
  const r = bill(b);
  const rows: [string, number][] = [[`Room · ${b.nights.length} night(s)${b.mealPlan ? ` incl. ${b.mealPlan.name}` : ""}`, r.rooms]];
  if (r.discount) rows.push(["Discount", -r.discount]);
  rows.push([`Service charge ${b.tax.service}%`, r.service], [`VAT ${b.tax.vat}%`, r.vat]);
  for (const m of heldMeals(b)) rows.push([`${m.qty}× ${m.name} (${dmy(m.date)})`, preMealTotal(m)]);
  for (const c of b.charges ?? []) rows.push([c.label, c.amount]);
  for (const e of extras) rows.push([e.label, e.amount]);
  return rows;
}

export function confirmationHtml(h: Hotel, b: Booking, g: Guest | undefined, s: Settings) {
  const total = totalOf(b), paid = paidOf(b);
  return page(h, `Confirmation ${b.code}`, `${head(h, "Booking confirmation", `${b.code} · issued ${dmy(b.created.slice(0, 10))}`)}
<p>Dear ${esc(g?.name)}, thank you for booking with us. Your stay is <span class="badge">${b.status === "Cancelled" ? "CANCELLED" : "CONFIRMED"}</span></p>
${stayBlock(b, g)}
<h2>Price</h2><table class="tot"><tr><td>Total (incl. VAT &amp; service)</td><td class="r b">${tk(total)}</td></tr><tr><td>Paid</td><td class="r">${tk(paid)}</td></tr><tr><td class="big">Due at the hotel</td><td class="r big">${tk(Math.max(0, total - paid))}</td></tr></table>
<h2>Good to know</h2><p>Check-in from ${s.checkIn} · check-out by ${s.checkOut}. Please bring your NID or passport.<br>
Free cancellation up to ${s.freeCancelDays} day(s) before arrival; later cancellations are charged ${s.cancelFeePct}% of the first night, no-shows ${s.noShowFeePct}%.</p>
${b.note ? `<p><b>Your request:</b> ${esc(b.note)}</p>` : ""}<p class="m">${esc(h.name)} · ${esc(h.phone)}</p>`);
}

export function invoiceHtml(h: Hotel, b: Booking, g: Guest | undefined, extras: { label: string; amount: number }[]) {
  const st = settingsOf(h); const p = st.profile; const docs = docsOf(h); const d = designOf(h); const x = docLang(d.lang);
  const H: DocHotel = { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin, logo: st.branding.logo, showLogo: docs.showLogo };
  const r = bill(b); const total = totalOf(b) + extras.reduce((s, e) => s + e.amount, 0); const paid = paidOf(b); const due = Math.max(0, total - paid);
  const no = `${kesc(docs.prefix)}${b.code.slice(3)}`; const issued = b.checkedOutAt?.slice(0, 10) ?? b.to;
  const roomLabel = `${x.t("room")} ${x.num(kesc(b.unit || "—"))} · ${kesc(b.type)}`;
  const perMeal = b.mealPlan?.perNight ?? 0;
  type Row = { date: string; text: string; qty: number; rate: number; amount: number };
  const rows: Row[] = b.nights.map((n, i) => ({ date: n.date, text: `${roomLabel} · ${x.t("night")} ${x.num(i + 1)}${b.mealPlan ? ` · ${kesc(b.mealPlan.name)}` : ""}`, qty: 1, rate: n.base + perMeal, amount: n.base + perMeal }));
  for (const m of heldMeals(b)) rows.push({ date: m.date, text: kesc(m.name), qty: m.qty, rate: preMealTotal(m) / Math.max(1, m.qty), amount: preMealTotal(m) });
  for (const c of b.charges ?? []) rows.push({ date: c.at.slice(0, 10), text: kesc(c.label), qty: 1, rate: c.amount, amount: c.amount });
  for (const e of extras) rows.push({ date: issued, text: kesc(e.label), qty: 1, rate: e.amount, amount: e.amount });
  const other = total - r.total;
  const stamp = `<span class="stamp ${due <= 0 ? "ok" : "due"}">${due <= 0 ? x.t("stPaid") : `${x.t("stDue")} ${x.money(due)}`}</span>`;
  const meta = `${x.t("invoiceNo")} ${x.num(no)} · ${x.date(issued)}`;
  const title = d.template === "minimal"
    ? `<div class="title"><div><h1>${x.t("invoice")}</h1><div class="mut" style="margin-top:1.5mm">${meta}</div></div><div class="big"><div class="lab">${x.lb("amountDue")}</div><b>${x.money(due)}</b><div style="margin-top:1.5mm">${stamp}</div></div></div>`
    : d.template === "classic" || d.template === "elegant"
      ? `<div class="title"><h1>${x.t("invoice")}</h1>${x.mix ? `<span class="bn" style="margin-top:1mm">${"ইনভয়েস"}</span>` : ""}<div class="meta mut">${meta}</div><div style="margin-top:2mm">${stamp}</div></div>`
      : `<div class="title"><h1>${x.t("invoice")}${x.mix ? `<span class="bn" style="font-size:.36em;margin-top:1.4mm;color:#828a98">ইনভয়েস / বিল</span>` : ""}</h1>${stamp}</div>`;
  const billTo = b.payer?.kind === "Company"
    ? `<div class="nm">${kesc(b.payer.name)}</div><div class="mut">${x.t("forGuest")}: ${kesc(g?.name)}</div>`
    : `<div class="nm">${kesc(g?.name)}</div><div class="mut">${x.num(kesc(g?.phone))}${g?.email ? `<br>${kesc(g.email)}` : ""}</div>`;
  const info = `<div class="info">
<div><div class="lab">${x.lb("billedTo")}</div>${billTo}</div>
<div><div class="lab">${x.lb("invoice")}</div><div class="kv"><span>${x.t("invoiceNo")}</span><b>${x.num(no)}</b><span>${x.t("date")}</span><span>${x.date(issued)}</span><span>${x.t("booking")}</span><span>${x.num(b.code)}</span><span>${x.t("source")}</span><span>${kesc(channelLabel(b))}</span></div></div>
<div><div class="lab">${x.lb("stay")}</div><div class="kv"><span>${x.t("arrival")}</span><span>${x.date(b.from, true)}</span><span>${x.t("departure")}</span><span>${x.date(b.to, true)}</span><span>${x.t("room")}</span><span>${x.num(kesc(b.unit || "—"))} · ${kesc(b.type)}</span><span>${x.t("nights")}</span><span>${x.num(b.nights.length)} · ${x.num(b.adults)} ${x.t("adults")}${b.children ? `, ${x.num(b.children)} ${x.t("children")}` : ""}</span></div></div></div>`;
  const lines = `<table class="lines"><thead><tr><th style="width:26mm">${x.lb("date")}</th><th>${x.lb("description")}</th><th class="c" style="width:14mm">${x.lb("qty")}</th><th class="r" style="width:25mm">${x.lb("rate")} (৳)</th><th class="r" style="width:27mm">${x.lb("amount")} (৳)</th></tr></thead><tbody>
${rows.map((w) => `<tr><td class="nw">${x.date(w.date)}</td><td>${w.text}</td><td class="c">${x.num(w.qty)}</td><td class="r">${x.plain(w.rate)}</td><td class="r">${x.plain(w.amount)}</td></tr>`).join("")}</tbody></table>`;
  const tot = `<div class="tot">
<div><span>${x.t("roomCharges")}</span><span class="nw">${x.money(r.rooms)}</span></div>
${r.discount ? `<div><span>${x.t("discount")}</span><span class="nw">− ${x.money(r.discount)}</span></div>` : ""}
<div><span>${x.t("service")} ${x.num(b.tax.service)}%</span><span class="nw">${x.money(r.service)}</span></div>
<div><span>${x.t("vat")} ${x.num(b.tax.vat)}%</span><span class="nw">${x.money(r.vat)}</span></div>
${other ? `<div><span>${x.t("extras")}</span><span class="nw">${x.money(other)}</span></div>` : ""}
<div class="g"><span>${x.lb("total")}</span><span class="nw">${x.money(total)}</span></div>
<div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div>
<div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div></div>`;
  const pays = `<div><div class="lab">${x.lb("payments")}</div>${b.payments.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("method")}</th><th>${x.t("reference")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>
${b.payments.map((q) => `<tr><td class="nw">${x.date(q.at)}, ${x.time(q.at)}</td><td>${x.method(q.method)}${q.amount < 0 ? ` · ${x.t("refund")}` : ""}</td><td class="mut">${kesc(q.note) || x.num(`RCT-${q.id.slice(-6).toUpperCase()}`)}</td><td class="r">${q.amount < 0 ? "−" : ""}${x.plain(q.amount)}</td></tr>`).join("")}</tbody></table>` : `<p class="mut">${x.t("noPay")}</p>`}
<div class="words">${x.t("inWords")}: <b>${x.words(total)}</b></div></div>`;
  const notes = `<div class="notes"><b>${x.t("notes")}.</b> ${docs.terms ? `${kesc(docs.terms)} ` : ""}${x.t("computer")}</div>`;
  const body = `${docHeader(H, d, x)}${title}${info}${lines}<div class="below">${pays}${tot}</div>${notes}${docs.footer ? `<div class="thanks">${kesc(docs.footer)}</div>` : ""}
<div class="sign"><div>${x.t("preparedBy")} · ${x.t("frontDesk")}</div><div>${x.t("guestSign")}</div><div>${x.t("authSign")}</div></div>${docFooter(`${kesc(H.name)} · ${x.t("invoice")} ${x.num(no)}`)}`;
  return docPage(`${x.t("invoice")} ${no}`, d, body);
}

export function receiptHtml(h: Hotel, b: Booking, g: Guest | undefined, p: Pay) {
  return page(h, `Receipt ${b.code}`, `${head(h, p.amount < 0 ? "Refund receipt" : "Money receipt", `RCT-${p.id.slice(-6).toUpperCase()} · ${dmy(p.at.slice(0, 10))} ${timeOf(p.at)}`)}
<p>Received ${p.amount < 0 ? "back by" : "from"} <b>${esc(g?.name)}</b> the sum of <span class="big">${tk(Math.abs(p.amount))}</span> by <b>${esc(p.method)}</b>${p.note ? ` (${esc(p.note)})` : ""} for booking <b>${b.code}</b>, room ${esc(b.unit || "—")}, ${dmy(b.from)} → ${dmy(b.to)}.</p>
<table class="tot"><tr><td>Booking total</td><td class="r">${tk(totalOf(b))}</td></tr><tr><td>Paid so far</td><td class="r">${tk(paidOf(b))}</td></tr><tr><td class="b">Balance</td><td class="r b">${tk(Math.max(0, totalOf(b) - paidOf(b)))}</td></tr></table>
<div class="sign"><div>Received by · ${esc(p.by)}</div><div>Guest</div></div>`);
}

/** Daily guest register — everyone staying tonight (kept by every hotel; asked for by police on inspection). */
export function registerHtml(h: Hotel, date: string, rows: { b: Booking; g?: Guest }[]) {
  return page(h, `Guest register ${date}`, `${head(h, "Guest register", `Night of ${dmy(date)} · ${rows.length} room(s)`)}
<table><tr><th>Room</th><th>Guest</th><th>Nationality</th><th>ID</th><th>Phone</th><th>From → to</th><th>Purpose</th><th>Coming from</th><th>Others</th></tr>
${rows.map(({ b, g }) => `<tr><td class="b">${esc(b.unit)}</td><td>${esc(g?.name)}<br><small>${b.code}</small></td><td>${esc(g?.country)}</td><td>${esc(g?.idType)} ${esc(g?.idNo) || "<b>missing</b>"}</td><td>${esc(g?.phone)}</td><td>${dmy(b.from)} → ${dmy(b.to)}</td><td>${esc(b.purpose)}</td><td>${esc(b.comingFrom)}</td><td>${(b.companions ?? []).map((c) => esc(c.name)).join(", ") || (b.adults + b.children > 1 ? `${b.adults + b.children - 1} unnamed` : "")}</td></tr>`).join("")}</table>
<div class="sign"><div>Prepared by</div><div>Manager</div></div>`, true);
}

/** Form-C style list of foreign guests (passport + visa) for the police / immigration. */
export function formCHtml(h: Hotel, date: string, rows: { b: Booking; g?: Guest }[]) {
  return page(h, `Form-C ${date}`, `${head(h, "Foreign guests (Form-C)", `${dmy(date)} · ${rows.length} guest(s)`)}
<table><tr><th>#</th><th>Name</th><th>Nationality</th><th>Passport</th><th>Visa / valid until</th><th>Date of birth</th><th>Arrived</th><th>Leaving</th><th>Room</th><th>Coming from / going to</th><th>Purpose</th></tr>
${rows.map(({ b, g }, i) => `<tr><td>${i + 1}</td><td class="b">${esc(g?.name)}</td><td>${esc(g?.country)}</td><td>${esc(g?.idNo) || "<b>missing</b>"}</td><td>${esc(g?.visaNo) || "—"}${g?.visaExpiry ? ` / ${dmy(g.visaExpiry)}` : ""}</td><td>${esc(g?.dob) || "—"}</td><td>${dmy(b.from)}</td><td>${dmy(b.to)}</td><td>${esc(b.unit)}</td><td>${esc(b.comingFrom) || "—"} / ${esc(b.goingTo) || "—"}</td><td>${esc(b.purpose) || "—"}</td></tr>`).join("") || `<tr><td colspan="11" class="m">No foreign guests tonight.</td></tr>`}</table>
<p class="m">Check the exact Form-C format required by your local police station before submitting.</p>
<div class="sign"><div>Prepared by</div><div>Manager</div></div>`, true);
}

/** Fill a message template ({guest}, {code}, {hotel}, {room}, {from}, {to}, {nights}, {total}, {paid}, {checkin}). */
/** Guest-facing pre-check-in page for this booking (works on the Next app and the hash-routed preview). */
export function precheckUrl(h: Hotel, b: Booking) {
  if (typeof window === "undefined") return `/hotel/${h.slug}/precheckin?b=${b.code}`;
  const { origin, pathname, hash } = window.location;
  return hash.startsWith("#/") ? `${origin}${pathname}#/hotel/${h.slug}/precheckin?b=${b.code}` : `${origin}/hotel/${h.slug}/precheckin?b=${b.code}`;
}
export function fillMsg(t: string, h: Hotel, b: Booking, g: Guest | undefined, s: Settings) {
  const map: Record<string, string> = { link: precheckUrl(h, b), guest: g?.name ?? "Guest", code: b.code, hotel: h.name, room: b.unit ? `Room ${b.unit} (${b.type})` : b.type, from: dmy(b.from), to: dmy(b.to), nights: String(b.nights.length), total: tk(totalOf(b)), paid: tk(paidOf(b)), checkin: s.checkIn };
  return t.replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
}
