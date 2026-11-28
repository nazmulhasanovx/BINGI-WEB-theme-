// Printable lists and reports (A4) built on doc-kit: guest register + Form-C (landscape, police-inspection ready),
// night audit / day close, company (group) invoice, restaurant bill for company customers.
// Every figure comes from the prototype data passed in; nothing is estimated. Text is escaped.
import type { Hotel } from "@/lib/types";
import type { Guest } from "@/lib/guests/store";
import { settingsOf } from "@/lib/settings/store";
import { oooOn, type Unit } from "@/lib/rooms/store";
import { bill as mealBill, type Order as MealOrder } from "@/lib/meals/seed";
import { orderSub, orderTotal, slotOf, statusOf, type Order as SvcOrder } from "@/lib/services/store";
import { bill, dueOf, roomRevenueOn, totalOf, type Audit, type Booking } from "./store";
import { normaliseDesign, lang, docPage, header, esc, type DocDesign, type DocHotel, type LKey } from "./doc-kit";

type X = ReturnType<typeof lang>;
type Row = { b: Booking; g?: Guest };
const DASH = `<span class="mut">—</span>`;

function ctx(h: Hotel) {
  const st = settingsOf(h); const p = st.profile; const docs = st.docs; const d = normaliseDesign(docs.design); const x = lang(d.lang);
  const H: DocHotel = { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin, logo: st.branding.logo, showLogo: docs.showLogo };
  return { H, d, x, docs };
}
const addDay = (iso: string, n: number) => { const t = new Date(`${iso}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
/** Text value or a grey dash. */
const v = (s?: string | null) => (s && s.trim() ? esc(s) : DASH);
const cssStr = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, " ")}"`;

const PURPOSE_BN: Record<string, string> = { Holiday: "ছুটি / ভ্রমণ", Business: "ব্যবসা", "Family visit": "পারিবারিক সফর", "Event / wedding": "অনুষ্ঠান / বিয়ে", Medical: "চিকিৎসা", Other: "অন্যান্য" };
const ID_BN: Record<string, string> = { NID: "এনআইডি", Passport: "পাসপোর্ট", "Driving licence": "ড্রাইভিং লাইসেন্স" };
const tr = (x: X, map: Record<string, string>, s?: string) => (s && s.trim() ? (x.bn && map[s] ? map[s] : esc(s)) : DASH);
const gender = (x: X, g?: Guest["gender"]) => (g === "Male" ? x.t("male") : g === "Female" ? x.t("female") : g === "Other" ? x.t("other") : "");
/** "2026-11-10" or a free-typed date: format ISO dates, keep anything else as written. */
const anyDate = (x: X, s?: string) => (!s ? DASH : /^\d{4}-\d{2}-\d{2}/.test(s) ? td(x, s) : x.num(esc(s)));
/** Date inside a narrow table cell: "08 Nov 2026"; in Bangla "০৮/১১/২০২৬" so it stays on one line. */
const td = (x: X, iso: string) => (x.bn ? x.num(`${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`) : x.date(iso));

/**
 * Page wrapper for these documents. Uses real page margins so long tables flow onto more pages with the
 * header row repeated, and prints page numbers in the page margin.
 */
function sheet(title: string, d: DocDesign, x: X, landscape: boolean, footLeft: string, body: string) {
  const W = landscape ? 297 : 210, Hh = landscape ? 210 : 297; const mv = landscape ? 10 : 12, mh = landscape ? 11 : 14;
  const counter = x.bn ? `counter(page, bengali) " / " counter(pages, bengali)` : `counter(page) " / " counter(pages)`;
  const box = `font-family: "IBM Plex Sans", "Noto Sans Bengali", sans-serif; font-size: 7.4pt; color: #8a919e;`;
  const style = `<style>
@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: ${mv}mm ${mh}mm ${mv + 2}mm;
  @bottom-left { content: ${cssStr(footLeft)}; ${box} vertical-align: top; padding-top: 3mm; }
  @bottom-center { content: "Powered by BinGi HMS"; ${box} vertical-align: top; padding-top: 3mm; }
  @bottom-right { content: ${cssStr(`${x.t("page")} `)} ${counter}; ${box} vertical-align: top; padding-top: 3mm; } }
.sheet { width: ${W}mm; min-height: ${Hh}mm; padding: ${mv + 4}mm ${mh}mm ${mv}mm; }
@media print { html, body { background: #fff; } .sheet { width: auto; min-height: ${Hh - 2 * mv - 3}mm; padding: 5mm 0 0; margin: 0; box-shadow: none; } }
.band { margin: 0 0 6mm; padding: 6mm 8mm; border-radius: 3mm; }
.title { margin-top: ${landscape ? 5 : 5}mm; margin-bottom: 4mm; padding-bottom: 2.5mm; }
.title .meta { color: #5b6372; font-size: .95em; }
.strip { display: flex; flex-wrap: wrap; gap: 0; border: 1px solid #d8dce3; border-radius: 3px; margin-bottom: 4mm; }
.strip > div { flex: 1 1 0; padding: 2mm 3.2mm; min-width: 0; } .strip > div + div { border-left: 1px solid #d8dce3; }
.strip .lab { margin-bottom: .6mm; } .strip .lab .bn { display: block; margin-left: 0; margin-top: .3mm; } .strip b { font-size: 1.18em; font-weight: 600; } .strip .warn b { color: #B11C29; }
.reg { table-layout: fixed; font-size: ${landscape ? ".84em" : ".92em"}; }
.reg th { padding: 1.7mm 1.5mm; letter-spacing: .3px; vertical-align: bottom; line-height: 1.25; }
.reg td { padding: ${landscape ? 1.5 : 1.3}mm 1.5mm; overflow-wrap: anywhere; line-height: 1.35; }
.reg thead { display: table-header-group; } .reg tr { break-inside: avoid; } .reg tfoot td { font-weight: 600; border-top: 1px solid #1c2230; border-bottom: 0; }
.reg .sub { display: block; color: #6b7382; font-size: .88em; } .reg .grp td { background: #f3f5f8 !important; font-weight: 600; font-size: .92em; }
.flag, .reg .sub.flag { color: #B11C29; font-weight: 600; }
.sec { margin-top: 5mm; } .sec > .lab { margin-bottom: 1.6mm; break-after: avoid; } .reg th.r { white-space: normal; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; } .three { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6mm; }
.fine { font-size: .8em; color: #6b7382; margin-top: 2mm; line-height: 1.5; }
.sign { break-inside: avoid; align-items: flex-end; padding-top: ${landscape ? 6 : 8}mm; } .info { margin-bottom: 5mm; } .notes { margin-top: 4mm; } .sign .seal { flex: 0 0 30mm; height: 20mm; border: 1px dashed #b9bec7; border-radius: 3mm; display: grid; place-items: center; padding: 0; text-align: center; }
${d.lang === "bn" ? `.reg th, .strip .lab, .sec .lab { letter-spacing: 0 !important; text-transform: none !important; } .reg th { font-size: .9em; } .strip .lab, .sec > .lab { font-size: .86em; }` : ""}
</style>`;
  return docPage(title, d, style + body);
}
/** Title row in the template's style; Bangla second line in Mix mode. */
function titleRow(x: X, key: LKey, meta: string, right = "") {
  return `<div class="title"><div><h1>${x.t(key)}${x.mix ? `<span class="bn" style="font-size:max(.4em,7.5pt);margin-top:1.2mm;color:#828a98">${lang("bn").t(key)}</span>` : ""}</h1></div><div class="meta">${meta}${right}</div></div>`;
}
const cnt = (x: X, n: number) => `${x.num(n)} ${n === 1 && !x.bn ? "order" : x.t("orders")}`;
const cell = (x: X, k: LKey, val: string, warn = false) => `<div${warn ? ` class="warn"` : ""}><div class="lab">${x.lb(k)}</div><b>${val}</b></div>`;

// ---------------- 1. Guest register ----------------
/** Daily guest register — everyone staying that night (kept by every hotel; asked for by police on inspection). */
export function registerHtml(h: Hotel, date: string, rows: Row[]) {
  const { H, d, x } = ctx(h);
  const persons = rows.reduce((s, { b }) => s + b.adults + b.children, 0);
  const foreign = rows.filter((r) => r.g && r.g.country && r.g.country !== "Bangladesh").length;
  const noId = rows.filter((r) => !r.g?.idNo).length;
  const rooms = new Set(rows.map((r) => r.b.unit).filter(Boolean)).size;
  const col = (w: number, k: LKey, cls = "") => `<th${cls ? ` class="${cls}"` : ""} style="width:${w}%">${x.lb(k)}</th>`;
  const head = `<thead><tr>${col(3.4, "sn", "c")}${col(12, "guest")}${col(7, "nationality")}${col(9.6, "idDoc")}${col(13.8, "address")}${col(8.8, "phone")}${col(4.4, "room")}${col(7.4, "arrival")}${col(7.4, "departure")}${col(4.6, "adCh", "c")}${col(6.8, "comingFrom")}${col(6.8, "goingTo")}${col(8, "purpose_reg")}</tr></thead>`;
  const body = rows.map(({ b, g }, i) => {
    const gd = gender(x, g?.gender);
    const comp = (b.companions ?? []).map((c) => `${esc(c.name)}${c.relation ? ` (${esc(c.relation)})` : ""}${c.idNo ? ` · ${tr(x, ID_BN, c.idType)} ${x.num(esc(c.idNo))}` : ""}`).join("; ");
    const arrT = b.checkedInAt ? x.time(b.checkedInAt) : b.eta ? x.num(esc(b.eta)) : "";
    return `<tr><td class="c">${x.num(i + 1)}</td>
<td><b>${v(g?.name)}</b><span class="sub">${x.num(esc(b.code))}${gd ? ` · ${gd}` : ""}</span>${comp ? `<span class="sub">+ ${comp}</span>` : ""}</td>
<td>${v(g?.country)}</td>
<td>${g?.idNo ? `${tr(x, ID_BN, g.idType || "")}<span class="sub" style="color:#1c2230">${x.num(esc(g.idNo))}</span>` : `${g?.idType ? `${tr(x, ID_BN, g.idType)}<br>` : ""}<span class="flag">${x.t("missing")}</span>`}</td>
<td>${v(g?.address)}</td><td style="overflow-wrap:normal">${g?.phone ? x.num(esc(g.phone)) : DASH}</td><td><b>${b.unit ? x.num(esc(b.unit)) : DASH}</b></td>
<td class="nw">${td(x, b.from)}${arrT ? `<span class="sub">${arrT}</span>` : ""}</td><td class="nw">${td(x, b.to)}</td><td class="c">${x.num(b.adults)} / ${x.num(b.children)}</td>
<td>${v(b.comingFrom)}</td><td>${v(b.goingTo)}</td><td>${tr(x, PURPOSE_BN, b.purpose)}</td></tr>`;
  }).join("") || `<tr><td colspan="13" class="mut c" style="padding:6mm">${x.t("noGuests")}</td></tr>`;
  const strip = `<div class="strip">${cell(x, "nightOf", x.date(date, true))}${cell(x, "roomsOcc", x.num(rooms))}${cell(x, "persons_reg", x.num(persons))}${cell(x, "foreign_reg", x.num(foreign))}${cell(x, "noId", x.num(noId), noId > 0)}</div>`;
  const out = `${header(H, d, x)}${titleRow(x, "guestRegister", `${x.t("nightOf")} ${x.date(date)}`)}${strip}
<table class="lines reg">${head}<tbody>${body}</tbody></table>
<div class="sign"><div>${x.t("preparedBy")}</div><div>${x.t("managerSign")}</div><div class="seal">${x.t("seal")}</div></div>`;
  return sheet(`${x.t("guestRegister")} ${date}`, d, x, true, `${H.name} · ${x.t("guestRegister")} · ${x.date(date)}`, out);
}

// ---------------- 2. Form-C (foreign guests) ----------------
/** Form-C style list of foreign guests (passport + visa) for the police / immigration. */
export function formCHtml(h: Hotel, date: string, rows: Row[]) {
  const { H, d, x } = ctx(h);
  const col = (w: number, k: LKey, cls = "") => `<th${cls ? ` class="${cls}"` : ""} style="width:${w}%">${x.lb(k)}</th>`;
  const head = `<thead><tr>${col(3.4, "sn", "c")}${col(14, "guest")}${col(8, "nationality")}${col(9.5, "passport")}${col(8.5, "visaNo")}${col(8, "visaExp")}${col(7.6, "dob")}${col(7.4, "arrival")}${col(7.4, "departure")}${col(4.8, "room")}${col(7.6, "purpose_reg")}${col(7, "comingFrom")}${col(6.8, "nextDest")}</tr></thead>`;
  let gaps = 0;
  const body = rows.map(({ b, g }, i) => {
    const isPass = g?.idType === "Passport";
    const pass = g?.idNo ? `${x.num(esc(g.idNo))}${isPass ? "" : `<span class="sub flag">${tr(x, ID_BN, g.idType || "")} · ${x.t("notPassport")}</span>`}` : `<span class="flag">${x.t("missing")}</span>`;
    const exp = g?.visaExpiry && /^\d{4}-\d{2}-\d{2}/.test(g.visaExpiry) && g.visaExpiry.slice(0, 10) < date;
    if (!g?.idNo || !isPass || !g?.visaNo || !g?.visaExpiry || exp) gaps++;
    const gd = gender(x, g?.gender);
    return `<tr><td class="c">${x.num(i + 1)}</td><td><b>${v(g?.name)}</b><span class="sub">${x.num(esc(b.code))}${gd ? ` · ${gd}` : ""}</span></td><td>${v(g?.country)}</td>
<td>${pass}</td><td>${g?.visaNo ? x.num(esc(g.visaNo)) : `<span class="flag">${x.t("missing")}</span>`}</td>
<td>${g?.visaExpiry ? `${anyDate(x, g.visaExpiry)}${exp ? `<span class="sub flag">${x.t("expired")}</span>` : ""}` : `<span class="flag">${x.t("missing")}</span>`}</td>
<td>${anyDate(x, g?.dob)}</td><td class="nw">${td(x, b.from)}${b.checkedInAt ? `<span class="sub">${x.time(b.checkedInAt)}</span>` : ""}</td><td class="nw">${td(x, b.to)}</td><td><b>${b.unit ? x.num(esc(b.unit)) : DASH}</b></td>
<td>${tr(x, PURPOSE_BN, b.purpose)}</td><td>${v(b.comingFrom)}</td><td>${v(b.goingTo)}</td></tr>`;
  }).join("") || `<tr><td colspan="13" class="mut c" style="padding:6mm">${x.t("noForeign")}</td></tr>`;
  const strip = `<div class="strip">${cell(x, "date", x.date(date, true))}${cell(x, "foreign_reg", x.num(rows.length))}${cell(x, "visaMissing", x.num(gaps), gaps > 0)}</div>`;
  const out = `${header(H, d, x)}${titleRow(x, "formC", x.date(date))}${strip}
<table class="lines reg">${head}<tbody>${body}</tbody></table>
<p class="fine">${x.t("checkFormat")}</p>
<div class="sign"><div>${x.t("preparedBy")}</div><div>${x.t("managerSeal")}</div><div class="seal">${x.t("seal")}</div></div>`;
  return sheet(`Form-C ${date}`, d, x, true, `${H.name} · Form-C · ${x.date(date)}`, out);
}

// ---------------- 3. Night audit / day close ----------------
export type NightAuditInput = {
  bookings: Booking[];
  /** Sellable rooms (Rooms › published units). Out-of-order is read from each unit. */
  units: Pick<Unit, "code" | "ooo">[];
  guests?: Map<string, Guest>;
  meals?: MealOrder[];
  services?: SvcOrder[];
  /** The saved day-close record, when the day is closed. */
  audit?: Audit;
  preparedBy: string;
};
type Coll = { room: number; fnb: number; svc: number };
const METHOD_KEY: Record<string, string> = { cash: "Cash", card: "Card", bkash: "bKash", Cash: "Cash", Card: "Card", bKash: "bKash", Bank: "Bank" };

export function nightAuditHtml(h: Hotel, date: string, inp: NightAuditInput) {
  const { H, d, x } = ctx(h); const L = inp.bookings; const next = addDay(date, 1);
  const name = (b: Booking) => inp.guests?.get(b.guestId)?.name;
  // Occupancy
  const total = inp.units.length; const ooo = inp.units.filter((u) => oooOn(u, date, next)).length; const avail = Math.max(0, total - ooo);
  const R = roomRevenueOn(L, date); const sold = R.sold; const rNet = R.net, rSc = R.service, rVat = R.vat;
  const arrivals = L.filter((b) => b.from === date && (b.status === "Checked in" || b.status === "Checked out")).length;
  const departures = L.filter((b) => b.status === "Checked out" && (b.checkedOutAt ?? "").startsWith(date)).length;
  const inHouse = L.filter((b) => b.status === "Checked in");
  const noShows = L.filter((b) => b.status === "No-show" && (b.cancel?.at ?? "").startsWith(date)).length;
  const notArrived = L.filter((b) => b.status === "Confirmed" && b.from <= date).length;
  const persons = inHouse.reduce((s, b) => s + b.adults + b.children, 0);
  // Restaurant & bar, by outlet
  const meals = (inp.meals ?? []).filter((o) => o.at.startsWith(date) && o.status !== "cancelled" && o.status !== "declined");
  const outlets = new Map<string, { n: number; net: number; sc: number; vat: number; total: number }>();
  for (const o of meals) { const r = mealBill(o); const k = outlets.get(o.outlet) ?? { n: 0, net: 0, sc: 0, vat: 0, total: 0 }; k.n++; k.net += r.sub - r.disc; k.sc += r.sc; k.vat += r.vat; k.total += r.total; outlets.set(o.outlet, k); }
  // Services delivered on this date
  const svcs = (inp.services ?? []).filter((o) => slotOf(o).date === date && statusOf(o) !== "cancelled" && o.status !== "declined" && o.payment !== "Refunded");
  const s = svcs.reduce((a, o) => ({ n: a.n + 1, net: a.net + orderSub(o), sc: a.sc + (o.sc ?? 0), vat: a.vat + (o.vat ?? 0), total: a.total + orderTotal(o) }), { n: 0, net: 0, sc: 0, vat: 0, total: 0 });
  // Extra charges posted on room bills today (entered including VAT)
  const charges = L.flatMap((b) => (b.charges ?? []).filter((c) => c.at.startsWith(date))); const chTotal = charges.reduce((a, c) => a + c.amount, 0);
  // Collections
  const coll = new Map<string, Coll>(); const add = (m: string, k: keyof Coll, a: number) => { const key = METHOD_KEY[m] ?? m; const c = coll.get(key) ?? { room: 0, fnb: 0, svc: 0 }; c[k] += a; coll.set(key, c); };
  for (const b of L) for (const p of b.payments) if (p.at.startsWith(date)) add(p.method, "room", p.amount);
  for (const o of inp.meals ?? []) {
    if (o.pay !== "paid" || !(o.paidAt ?? o.at).startsWith(date) || o.status === "cancelled" || o.status === "declined") continue;
    if (o.payments?.length) { for (const p of o.payments) if (p.method !== "room") add(p.method, "fnb", p.amount); }
    else if (o.method && o.method !== "room" && o.method !== "split") add(o.method, "fnb", mealBill(o).total);
  }
  for (const o of inp.services ?? []) if (o.method === "cash" && o.payment === "Paid" && o.created.startsWith(date) && statusOf(o) !== "cancelled") add("Cash", "svc", orderTotal(o));
  const owing = inHouse.filter((b) => dueOf(b) > 0).sort((a, c) => a.unit.localeCompare(c.unit, undefined, { numeric: true }));
  const overdue = inHouse.filter((b) => b.to <= date).sort((a, c) => a.unit.localeCompare(c.unit, undefined, { numeric: true }));

  const m = x.plain; const pct = avail ? Math.round((sold / avail) * 1000) / 10 : 0;
  const closed = inp.audit ? `<span class="stamp ok">${x.t("closedAt")} · ${x.time(inp.audit.at)}</span>` : `<span class="stamp due">${x.t("notClosed")}</span>`;
  const strip = `<div class="strip">${cell(x, "roomsTotal", x.num(total))}${cell(x, "ooo", x.num(ooo), ooo > 0)}${cell(x, "forSale", x.num(avail))}${cell(x, "sold", x.num(sold))}${cell(x, "occPct", avail ? `${x.num(pct)}%` : "—")}${cell(x, "adr", sold ? x.money(rNet / sold) : "—")}${cell(x, "revpar", avail ? x.money(rNet / avail) : "—")}</div>`;
  const mv = `<div class="strip">${cell(x, "arrivals", x.num(arrivals))}${cell(x, "departures", x.num(departures))}${cell(x, "inHouse", `${x.num(inHouse.length)} <span class="mut" style="font-size:.75em;font-weight:400">· ${x.num(persons)} ${x.t("guests").toLowerCase()}</span>`)}${cell(x, "noShows", x.num(noShows))}${cell(x, "notArrived", x.num(notArrived), notArrived > 0)}</div>`;
  const rrow = (label: string, n: number, sc: number, vat: number, tot: number, cnt = "") => `<tr><td>${label}${cnt ? `<span class="sub">${cnt}</span>` : ""}</td><td class="r">${m(n)}</td><td class="r">${m(sc)}</td><td class="r">${m(vat)}</td><td class="r"><b>${m(tot)}</b></td></tr>`;
  const outletRows = [...outlets.entries()].map(([k, o]) => rrow(`${x.t("fnb")} · ${esc(k)}`, o.net, o.sc, o.vat, o.total, cnt(x, o.n))).join("");
  const fnbT = [...outlets.values()].reduce((a, o) => ({ net: a.net + o.net, sc: a.sc + o.sc, vat: a.vat + o.vat, total: a.total + o.total }), { net: 0, sc: 0, vat: 0, total: 0 });
  const gNet = rNet + fnbT.net + s.net, gSc = rSc + fnbT.sc + s.sc, gVat = rVat + fnbT.vat + s.vat, gTot = rNet + rSc + rVat + fnbT.total + s.total + chTotal;
  const rev = `<div class="sec"><div class="lab">${x.lb("revenue")} (৳)</div><table class="lines reg"><thead><tr><th style="width:40%">${x.lb("description")}</th><th class="r">${x.lb("net")}</th><th class="r">${x.lb("service")}</th><th class="r">${x.lb("vat")}</th><th class="r" style="width:17%">${x.lb("grossIncl")}</th></tr></thead><tbody>
${rrow(x.t("roomRev"), rNet, rSc, rVat, rNet + rSc + rVat, `${x.num(sold)} ${x.t("sold").toLowerCase()}`)}
${outletRows || (inp.meals ? rrow(x.t("fnb"), 0, 0, 0, 0) : "")}
${inp.services ? rrow(x.t("services"), s.net, s.sc, s.vat, s.total, cnt(x, s.n)) : ""}
${charges.length ? `<tr><td>${x.t("extras")}<span class="sub">${x.num(charges.length)} · ${x.t("inclVat")}</span></td><td class="r mut">—</td><td class="r mut">—</td><td class="r mut">—</td><td class="r"><b>${m(chTotal)}</b></td></tr>` : ""}
</tbody><tfoot><tr><td>${x.lb("total")}</td><td class="r">${m(gNet)}${charges.length ? "*" : ""}</td><td class="r">${m(gSc)}</td><td class="r">${m(gVat)}</td><td class="r">${x.money(gTot)}</td></tr></tfoot></table>
<p class="fine">${x.t("adrNote")}${charges.length ? ` * ${x.t("extras")}: ${x.t("inclVat")}.` : ""}</p></div>`;
  const methods = ["Cash", "bKash", "Card", "Bank", ...[...coll.keys()].filter((k) => !["Cash", "bKash", "Card", "Bank"].includes(k))].filter((k) => coll.has(k));
  const cT = methods.reduce((a, k) => { const c = coll.get(k)!; return { room: a.room + c.room, fnb: a.fnb + c.fnb, svc: a.svc + c.svc }; }, { room: 0, fnb: 0, svc: 0 });
  const sg = (n: number) => `${n < 0 ? "− " : ""}${m(n)}`;
  const col = `<div class="sec"><div class="lab">${x.lb("collections")} (৳)</div><table class="lines reg"><thead><tr><th>${x.lb("method")}</th><th class="r">${x.lb("roomBills")}</th>${inp.meals ? `<th class="r">${x.lb("fnb")}</th>` : ""}${inp.services ? `<th class="r">${x.lb("services")}</th>` : ""}<th class="r">${x.lb("total")}</th></tr></thead><tbody>
${methods.map((k) => { const c = coll.get(k)!; return `<tr><td>${x.method(k)}</td><td class="r">${sg(c.room)}</td>${inp.meals ? `<td class="r">${sg(c.fnb)}</td>` : ""}${inp.services ? `<td class="r">${sg(c.svc)}</td>` : ""}<td class="r"><b>${sg(c.room + c.fnb + c.svc)}</b></td></tr>`; }).join("") || `<tr><td colspan="5" class="mut">${x.t("noPay")}</td></tr>`}
</tbody><tfoot><tr><td>${x.lb("total")}</td><td class="r">${sg(cT.room)}</td>${inp.meals ? `<td class="r">${sg(cT.fnb)}</td>` : ""}${inp.services ? `<td class="r">${sg(cT.svc)}</td>` : ""}<td class="r">${x.money(cT.room + cT.fnb + cT.svc)}</td></tr></tfoot></table></div>`;
  const list = (k: LKey, rows: Booking[], late: boolean, sum?: number) => `<div class="sec"><div class="lab">${x.lb(k)}</div>${rows.length ? `<table class="lines reg"><thead><tr><th style="width:11%">${x.lb("room")}</th><th>${x.lb("guest")}</th><th style="width:17%">${x.lb("booking")}</th><th style="width:19%">${x.lb("dueOut")}</th><th class="r" style="width:19%">${x.lb("balance")}</th></tr></thead><tbody>
${rows.map((b) => `<tr><td><b>${b.unit ? x.num(esc(b.unit)) : DASH}</b></td><td>${v(name(b))}</td><td>${x.num(esc(b.code))}</td><td${late ? ` class="flag"` : ""}>${x.date(b.to)}</td><td class="r">${dueOf(b) > 0 ? `<span class="flag">${x.money(dueOf(b))}</span>` : x.money(0)}</td></tr>`).join("")}</tbody>
${sum !== undefined ? `<tfoot><tr><td colspan="4">${x.lb("total")}</td><td class="r">${x.money(sum)}</td></tr></tfoot>` : ""}</table>` : `<p class="mut">${x.t("none")}</p>`}</div>`;
  const out = `${header(H, d, x)}${titleRow(x, "nightAudit", `${x.t("businessDate")} ${x.date(date, true)}`, `<div style="margin-top:1.5mm">${closed}</div>`)}
<div class="lab">${x.lb("occupancy")}</div>${strip}<div class="lab">${x.lb("movement")}</div>${mv}
${rev}${col}${list("overdue", overdue, true)}${list("outstanding", owing, false, owing.reduce((a, b) => a + dueOf(b), 0))}
${inp.audit ? `<p class="fine">${x.t("closedAt")} · ${x.date(inp.audit.at)}, ${x.time(inp.audit.at)} · ${esc(inp.audit.by)}</p>` : ""}
<div class="sign"><div>${x.t("preparedBy")} · ${esc(inp.preparedBy)}</div><div>${x.t("managerSign")}</div></div>`;
  return sheet(`${x.t("nightAudit")} ${date}`, d, x, false, `${H.name} · ${x.t("nightAudit")} · ${x.date(date)}`, out);
}

// ---------------- 4. Company / group invoice ----------------
export type BillParty = { name: string; contact?: string; address?: string; phone?: string; email?: string; bin?: string };
function partyBlock(x: X, p: BillParty) {
  return `<div class="nm">${esc(p.name)}</div><div class="mut">${p.contact ? `${x.t("contact_reg")}: ${esc(p.contact)}<br>` : ""}${p.address ? `${esc(p.address)}<br>` : ""}${p.phone ? `${x.num(esc(p.phone))}` : ""}${p.phone && p.email ? " · " : ""}${p.email ? esc(p.email) : ""}${p.bin ? `<br>${x.t("bin")} ${x.num(esc(p.bin))}` : ""}</div>`;
}
const stampOf = (x: X, due: number) => `<span class="stamp ${due <= 0 ? "ok" : "due"}">${due <= 0 ? x.t("stPaid") : `${x.t("stDue")} ${x.money(due)}`}</span>`;

/** One invoice to a company for many bookings (group or corporate account): a line per room / guest. */
export function companyInvoiceHtml(h: Hotel, inp: { company: BillParty; rows: Row[]; no?: string; date?: string; ref?: string }) {
  const { H, d, x, docs } = ctx(h); const rows = [...inp.rows].sort((a, c) => a.b.from.localeCompare(c.b.from) || a.b.unit.localeCompare(c.b.unit, undefined, { numeric: true }));
  const groups = new Set(rows.map((r) => r.b.group).filter(Boolean));
  const no = inp.no ?? `${docs.prefix}${groups.size === 1 ? [...groups][0] : `CO-${(rows[0]?.b.code ?? "").slice(3)}`}`;
  const issued = inp.date ?? rows.reduce((mx, r) => (r.b.to > mx ? r.b.to : mx), rows[0]?.b.to ?? "");
  const first = rows.reduce((mn, r) => (!mn || r.b.from < mn ? r.b.from : mn), ""), last = rows.reduce((mx, r) => (r.b.to > mx ? r.b.to : mx), "");
  const T = { rooms: 0, disc: 0, sc: 0, vat: 0, other: 0, total: 0, nights: 0 };
  const vats = new Set<number>(), scs = new Set<number>();
  const lines = rows.map(({ b, g }, i) => {
    const off = b.status === "Cancelled" || b.status === "No-show"; const tot = totalOf(b);
    const r = off ? { rooms: 0, discount: 0, service: 0, vat: 0, total: 0 } : bill(b); const other = tot - r.total; const nn = off ? 0 : b.nights.length;
    if (!off) { vats.add(b.tax.vat); scs.add(b.tax.service); }
    T.rooms += r.rooms; T.disc += r.discount; T.sc += r.service; T.vat += r.vat; T.other += other; T.total += tot; T.nights += nn;
    const note = off ? `<span class="sub flag">${x.t(b.status === "No-show" ? "noShowFee" : "cancelFee")}</span>` : b.mealPlan ? `<span class="sub">${esc(b.mealPlan.name)}</span>` : "";
    return `<tr><td class="c">${x.num(i + 1)}</td><td><b>${v(g?.name)}</b><span class="sub">${x.num(esc(b.code))}${b.channelRef ? ` · ${esc(b.channelRef)}` : ""}</span></td><td>${b.unit ? x.num(esc(b.unit)) : DASH}<span class="sub">${esc(b.type)}</span>${note}</td>
<td class="nw">${td(x, b.from)}<span class="sub">→ ${td(x, b.to)}</span></td><td class="c">${x.num(nn)}</td><td class="r">${x.plain(r.rooms)}</td><td class="r">${other ? x.plain(other) : DASH}</td><td class="r"><b>${x.plain(tot)}</b></td></tr>`;
  }).join("");
  const pays = rows.flatMap(({ b }) => b.payments.map((p) => ({ ...p, code: b.code }))).sort((a, c) => a.at.localeCompare(c.at));
  const paid = pays.reduce((a, p) => a + p.amount, 0); const due = Math.max(0, T.total - paid);
  const one = (s: Set<number>) => (s.size === 1 ? ` ${x.num([...s][0])}%` : "");
  const out = `${header(H, d, x)}
<div class="title"><h1>${x.t("companyInvoice")}${x.mix ? `<span class="bn" style="font-size:max(.36em,7.5pt);margin-top:1.4mm;color:#828a98">${lang("bn").t("companyInvoice")}</span>` : ""}</h1>${d.template === "classic" || d.template === "elegant" ? `<div class="meta mut">${x.t("invoiceNo")} ${x.num(esc(no))} · ${x.date(issued)}</div>` : ""}<div style="margin-top:1.5mm">${stampOf(x, due)}</div></div>
<div class="info"><div><div class="lab">${x.lb("billedTo")}</div>${partyBlock(x, inp.company)}</div>
<div><div class="lab">${x.lb("invoice")}</div><div class="kv"><span>${x.t("invoiceNo")}</span><b>${x.num(esc(no))}</b><span>${x.t("date")}</span><span>${x.date(issued)}</span>${inp.ref ? `<span>${x.t("ref")}</span><span>${esc(inp.ref)}</span>` : ""}</div></div>
<div><div class="lab">${x.lb("stays")}</div><div class="kv"><span>${x.t("arrival")}</span><span>${first ? x.date(first) : "—"}</span><span>${x.t("departure")}</span><span>${last ? x.date(last) : "—"}</span><span>${x.t("bookings")}</span><span>${x.num(rows.length)}</span><span>${x.t("roomNights")}</span><span>${x.num(T.nights)}</span></div></div></div>
<table class="lines reg"><thead><tr><th class="c" style="width:4%">#</th><th style="width:20%">${x.lb("guest")}</th><th style="width:21%">${x.lb("room")}</th><th style="width:14%">${x.lb("stay")}</th><th class="c" style="width:6%">${x.lb("nights")}</th><th class="r" style="width:12%">${x.lb("roomCharges")}</th><th class="r" style="width:10%">${x.lb("extras")}</th><th class="r" style="width:13%">${x.lb("amount")} (৳)</th></tr></thead><tbody>${lines}</tbody></table>
<div class="below"><div><div class="lab">${x.lb("payments")}</div>${pays.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("booking")}</th><th>${x.t("method")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>
${pays.map((p) => `<tr><td class="nw">${x.date(p.at)}</td><td>${x.num(esc(p.code))}</td><td>${x.method(p.method)}${p.amount < 0 ? ` · ${x.t("refund")}` : ""}${p.note ? `<span class="mut"> · ${esc(p.note)}</span>` : ""}</td><td class="r">${p.amount < 0 ? "−" : ""}${x.plain(p.amount)}</td></tr>`).join("")}</tbody></table>` : `<p class="mut">${x.t("noPay")}</p>`}
<div class="words">${x.t("inWords")}: <b>${x.words(T.total)}</b></div></div>
<div class="tot"><div><span>${x.t("roomCharges")}</span><span class="nw">${x.money(T.rooms)}</span></div>
${T.disc ? `<div><span>${x.t("discount")}</span><span class="nw">− ${x.money(T.disc)}</span></div>` : ""}
<div><span>${x.t("service")}${one(scs)}</span><span class="nw">${x.money(T.sc)}</span></div><div><span>${x.t("vat")}${one(vats)}</span><span class="nw">${x.money(T.vat)}</span></div>
${T.other ? `<div><span>${x.t("extras")}</span><span class="nw">${x.money(T.other)}</span></div>` : ""}
<div class="g"><span>${x.lb("total")}</span><span class="nw">${x.money(T.total)}</span></div><div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div>
<div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div></div></div>
<div class="notes"><b>${x.t("notes")}.</b> ${docs.terms ? `${esc(docs.terms)} ` : ""}${x.t("computer")}</div>
<div class="sign"><div>${x.t("preparedBy")} · ${x.t("frontDesk")}</div><div>${x.t("authSign")}</div></div>`;
  return sheet(`${x.t("companyInvoice")} ${no}`, d, x, false, `${H.name} · ${x.t("invoice")} ${no}`, out);
}

// ---------------- 5. Restaurant bill (A4, company customers) ----------------
const SERVICE_KEY: Record<string, LKey> = { dinein: "dineIn", room: "roomService", takeaway: "takeaway", delivery: "delivery" };

/** Restaurant & bar bill on A4 for a company customer: one or many orders on one invoice. */
export function restaurantBillA4Html(h: Hotel, inp: { orders: MealOrder[]; customer: BillParty; no?: string; date?: string; ref?: string; placeName?: (o: MealOrder) => string }) {
  const { H, d, x, docs } = ctx(h);
  const orders = inp.orders.filter((o) => o.status !== "cancelled" && o.status !== "declined").sort((a, c) => a.at.localeCompare(c.at));
  const no = inp.no ?? `${docs.prefix}${orders.length === 1 ? orders[0].no : `${orders[0]?.no ?? ""}-${orders.length}`}`;
  const issued = inp.date ?? (orders.length ? orders[orders.length - 1].at.slice(0, 10) : "");
  const T = { sub: 0, disc: 0, sc: 0, vat: 0, total: 0, paid: 0, room: 0 }; const scs = new Set<number>(), vats = new Set<number>();
  const payRows: string[] = [];
  const body = orders.map((o) => {
    const r = mealBill(o); T.sub += r.sub; T.disc += r.disc; T.sc += r.sc; T.vat += r.vat; T.total += r.total; scs.add(o.sc); vats.add(o.vat);
    let paid = 0, room = 0;
    if (o.payments?.length) for (const p of o.payments) { if (p.method === "room") room += p.amount; else { paid += p.amount; payRows.push(`<tr><td class="nw">${x.date(o.paidAt ?? o.at)}</td><td>${x.num(esc(o.no))}</td><td>${x.method(METHOD_KEY[p.method] ?? p.method)}</td><td class="r">${x.plain(p.amount)}</td></tr>`); } }
    else if (o.pay === "room" || o.method === "room") room = r.total;
    else if (o.pay === "paid") { paid = r.total; payRows.push(`<tr><td class="nw">${x.date(o.paidAt ?? o.at)}</td><td>${x.num(esc(o.no))}</td><td>${o.method ? x.method(METHOD_KEY[o.method] ?? o.method) : DASH}</td><td class="r">${x.plain(paid)}</td></tr>`); }
    T.paid += paid; T.room += room;
    const where = [x.t(SERVICE_KEY[o.service] ?? "dineIn"), o.service === "room" ? "" : inp.placeName ? esc(inp.placeName(o)) : o.place ? esc(o.place) : "", o.room ? `${x.t("room")} ${x.num(esc(o.room))}` : ""].filter(Boolean).join(" · ");
    const grp = `<tr class="grp"><td colspan="4">${x.t("order")} ${x.num(esc(o.no))} · ${x.date(o.at)}, ${x.time(o.at)} · ${esc(o.outlet)} · ${where}${room ? ` · ${x.t("toRoom")}` : ""}</td></tr>`;
    const ls = o.lines.map((l) => `<tr><td>${esc(l.name)}${l.size ? ` · ${esc(l.size)}` : ""}${l.note ? `<span class="sub">${esc(l.note)}</span>` : ""}</td><td class="c">${x.num(l.qty)}</td><td class="r">${x.plain(l.price)}</td><td class="r">${x.plain(l.price * l.qty)}</td></tr>`).join("");
    const extra = r.disc ? `<tr><td colspan="3" class="mut">${x.t("discount")}${o.discount?.reason ? ` · ${esc(o.discount.reason)}` : ""}</td><td class="r">− ${x.plain(r.disc)}</td></tr>` : "";
    return grp + ls + extra;
  }).join("");
  const due = Math.max(0, T.total - T.paid - T.room);
  const one = (s: Set<number>) => (s.size === 1 ? ` ${x.num([...s][0])}%` : "");
  const outlets = [...new Set(orders.map((o) => o.outlet))];
  const out = `${header(H, d, x)}
<div class="title"><h1>${x.t("restaurantBill")}${x.mix ? `<span class="bn" style="font-size:max(.36em,7.5pt);margin-top:1.4mm;color:#828a98">${lang("bn").t("restaurantBill")}</span>` : ""}</h1>${d.template === "classic" || d.template === "elegant" ? `<div class="meta mut">${x.t("invoiceNo")} ${x.num(esc(no))} · ${x.date(issued)}</div>` : ""}<div style="margin-top:1.5mm">${stampOf(x, due)}</div></div>
<div class="info"><div><div class="lab">${x.lb("billedTo")}</div>${partyBlock(x, inp.customer)}</div>
<div><div class="lab">${x.lb("invoice")}</div><div class="kv"><span>${x.t("invoiceNo")}</span><b>${x.num(esc(no))}</b><span>${x.t("date")}</span><span>${issued ? x.date(issued) : "—"}</span>${inp.ref ? `<span>${x.t("ref")}</span><span>${esc(inp.ref)}</span>` : ""}</div></div>
<div><div class="lab">${x.lb("outlet")}</div><div class="kv"><span>${x.t("outlet")}</span><span>${outlets.map(esc).join(", ") || "—"}</span><span>${x.t("orders").replace(/^./, (c) => c.toUpperCase())}</span><span>${x.num(orders.length)}</span></div></div></div>
<table class="lines reg"><thead><tr><th>${x.lb("item")}</th><th class="c" style="width:12%">${x.lb("qty")}</th><th class="r" style="width:17%">${x.lb("rate")} (৳)</th><th class="r" style="width:19%">${x.lb("amount")} (৳)</th></tr></thead><tbody>${body}</tbody></table>
<div class="below"><div><div class="lab">${x.lb("payments")}</div>${payRows.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("order")}</th><th>${x.t("method")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>${payRows.join("")}</tbody></table>` : `<p class="mut">${x.t("noPay")}</p>`}
<div class="words">${x.t("inWords")}: <b>${x.words(T.total)}</b></div></div>
<div class="tot"><div><span>${x.t("subtotal")}</span><span class="nw">${x.money(T.sub)}</span></div>
${T.disc ? `<div><span>${x.t("discount")}</span><span class="nw">− ${x.money(T.disc)}</span></div>` : ""}
<div><span>${x.t("service")}${one(scs)}</span><span class="nw">${x.money(T.sc)}</span></div><div><span>${x.t("vat")}${one(vats)}</span><span class="nw">${x.money(T.vat)}</span></div>
<div class="g"><span>${x.lb("total")}</span><span class="nw">${x.money(T.total)}</span></div><div><span>${x.t("paid")}</span><span class="nw">− ${x.money(T.paid)}</span></div>
${T.room ? `<div><span>${x.t("toRoom")}</span><span class="nw">− ${x.money(T.room)}</span></div>` : ""}
<div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div></div></div>
<div class="notes"><b>${x.t("notes")}.</b> ${docs.terms ? `${esc(docs.terms)} ` : ""}${x.t("computer")}</div>
<div class="sign"><div>${x.t("preparedBy")}</div><div>${x.t("authSign")}</div></div>`;
  return sheet(`${x.t("restaurantBill")} ${no}`, d, x, false, `${H.name} · ${x.t("restaurantBill")} ${no}`, out);
}

