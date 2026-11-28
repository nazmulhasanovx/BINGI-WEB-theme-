// Back-office printable documents (A4): purchase order, goods received note, stock issue / transfer slip,
// stock count sheet (blank + result), expense voucher, supplier bill payment receipt, payslip, payroll sheet,
// housekeeping daily room sheet, maintenance work order.
// Same engine and Design setting as the invoice (Settings › Invoices & documents › Design): template, colour,
// language (English / Bangla / Mix), text size, logo. Data comes only from what the caller passes —
// a missing field is left out; blank forms get write-in lines.
import type { Hotel } from "@/lib/types";
import { settingsOf } from "@/lib/settings/store";
import { PO_LABEL, inBuy, type Category, type Count, type Item, type Location, type Move, type Po, type Supplier } from "@/lib/inventory/store";
import { payState, paidOf, type Expense } from "@/lib/expenses/store";
import { lineNet, runTotals, type Employee, type HrmState, type PayrollRun } from "@/lib/hrm/store";
import type { Priority, Task, TaskKind } from "@/lib/housekeeping/store";
import { normaliseDesign, lang as docLang, docPage, header as docHeader, footer as docFooter, esc, type DocDesign, type DocHotel, type LKey } from "./doc-kit";

type X = ReturnType<typeof docLang>;
type C = { d: DocDesign; x: X; H: DocHotel };
const XB = docLang("bn");

function ctx(h: Hotel): C {
  const st = settingsOf(h); const p = st.profile; const docs = st.docs;
  const d = normaliseDesign(docs.design); const x = docLang(d.lang);
  const H: DocHotel = { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin || undefined, logo: st.branding.logo, showLogo: docs.showLogo };
  return { d, x, H };
}

// ---------- values shown in Bangla (data enums; free text stays as typed) ----------
const BN_VAL: Record<string, string> = {
  Draft: "খসড়া", "Waiting approval": "অনুমোদনের অপেক্ষায়", Approved: "অনুমোদিত", "Partly received": "আংশিক গৃহীত", Received: "গৃহীত", Cancelled: "বাতিল",
  Rejected: "বাতিল", "To pay": "পরিশোধ বাকি", "Partly paid": "আংশিক পরিশোধিত", Paid: "পরিশোধিত", Unpaid: "অপরিশোধিত", "Partially paid": "আংশিক পরিশোধিত", Reviewed: "পর্যালোচিত",
  Counting: "গণনা চলছে", "Waiting review": "পর্যালোচনার অপেক্ষায়", Posted: "পোস্ট করা হয়েছে",
  Housekeeping: "হাউসকিপিং", "Front Office": "ফ্রন্ট অফিস", Kitchen: "রান্নাঘর", Maintenance: "রক্ষণাবেক্ষণ", Security: "নিরাপত্তা", Finance: "হিসাব", Management: "ব্যবস্থাপনা",
  "Full time": "পূর্ণকালীন", "Part time": "খণ্ডকালীন", Contract: "চুক্তিভিত্তিক",
  Vacant: "খালি", Occupied: "অতিথি আছে", Arriving: "আগমন", Leaving: "প্রস্থান", Dirty: "অপরিষ্কার", Cleaning: "পরিষ্কার চলছে", Clean: "পরিষ্কার", Inspected: "পরিদর্শিত",
  "Check-out clean": "চেক-আউট পরিষ্কার", "Stay-over": "স্টে-ওভার পরিষ্কার", "Deep clean": "গভীর পরিষ্কার", Inspection: "পরিদর্শন", Fix: "মেরামত",
  Low: "কম", Normal: "সাধারণ", High: "বেশি", Urgent: "জরুরি", Open: "অপেক্ষমাণ", Doing: "চলছে", Review: "পরিদর্শনের অপেক্ষায়", Done: "সম্পন্ন",
  Supplier: "সরবরাহকারী", Utility: "ইউটিলিটি", Contractor: "ঠিকাদার", Staff: "কর্মী", Other: "অন্যান্য",
};
const KIND_EN: Record<TaskKind, string> = { "Check-out clean": "Check-out cleaning", "Stay-over": "Stay-over cleaning", "Deep clean": "Deep cleaning", Inspection: "Inspection", Fix: "Maintenance" };
const TASK_EN: Record<Task["status"], string> = { Open: "Open", Doing: "In progress", Review: "Awaiting inspection", Done: "Done" };
const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function kit(c: C) {
  const { x } = c;
  /** Data value in Bangla when the document is Bangla; English otherwise. */
  const v = (en: string | undefined, shown = en) => (en === undefined ? "" : x.bn && BN_VAL[en] ? BN_VAL[en] : esc(shown));
  const qty = (n: number) => x.num(new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(n));
  const rate = (n: number) => x.num(new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Math.abs(n)));
  const n0 = (n: number) => (n ? x.plain(n) : "—");
  const month = (m: string) => (x.bn ? x.date(`${m}-01`).split(" ").slice(1).join(" ") : `${MONTH_EN[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`);
  const at = (iso: string) => `${x.date(iso)}${iso.length > 10 ? `, ${x.time(iso)}` : ""}`;
  const kv = (rows: [LKey, string | undefined | false][]) => `<div class="kv">${rows.filter(([, val]) => val).map(([k, val]) => `<span>${x.t(k)}</span><span>${val}</span>`).join("")}</div>`;
  const box = (k: LKey, inner: string) => `<div><div class="lab">${x.lb(k)}</div>${inner}</div>`;
  const stamp = (text: string, tone: "ok" | "due" | "neu") => `<span class="stamp ${tone}">${text}</span>`;
  /** Title row in the look of the chosen template (same pattern as the invoice). */
  const title = (k: LKey, meta: string, right = "", big?: { k: LKey; value: string }, inline = false) => {
    const t = x.t(k); const bnSub = x.mix ? XB.t(k) : "";
    if (c.d.template === "minimal") return `<div class="title"><div><h1>${t}</h1>${bnSub ? `<span class="bn" style="margin-top:1mm">${bnSub}</span>` : ""}<div class="mut" style="margin-top:1.5mm">${meta}</div></div><div class="big">${big ? `<div class="lab">${x.lb(big.k)}</div><b>${big.value}</b>` : ""}${right ? `<div style="margin-top:1.5mm">${right}</div>` : ""}</div></div>`;
    if (c.d.template === "classic" || c.d.template === "elegant") return `<div class="title"><h1>${t}</h1>${bnSub ? `<span class="bn" style="margin-top:1mm">${bnSub}</span>` : ""}<div class="meta mut">${meta}${inline && right ? `<span style="margin-left:4mm">${right}</span>` : ""}</div>${right && !inline ? `<div style="margin-top:2mm">${right}</div>` : ""}</div>`;
    return `<div class="title"><h1>${t}${bnSub ? `<span class="bn" style="font-size:.36em;margin-top:1.4mm;color:#828a98">${bnSub}</span>` : ""}</h1><div class="r">${right}<div class="mut" style="margin-top:1.2mm">${meta}</div></div></div>`;
  };
  const sign = (cells: string[]) => `<div class="sign">${cells.map((s) => `<div>${s}</div>`).join("")}</div>`;
  const who = (k: LKey, name?: string) => `${x.t(k)}${name ? ` · ${esc(name)}` : ""}`;
  const th = (k: LKey, cls = "", w = "") => `<th${cls ? ` class="${cls}"` : ""}${w ? ` style="width:${w}"` : ""}>${x.lb(k)}</th>`;
  return { v, qty, rate, n0, month, at, kv, box, stamp, title, sign, who, th };
}

/** Extra rules for office documents: page-2 margins, write-in cells, totals rows, landscape sheets. */
function extraCss(d: DocDesign, landscape: boolean) {
  const a = d.accent;
  return `<style>@page { size: A4${landscape ? " landscape" : ""}; margin: 9mm 0 7mm; } @page :first { margin-top: 0; }
.fx { table-layout: fixed; } .fx th { white-space: normal; } .lines th .bn { display: block; margin-left: 0; } .info .kv { white-space: normal; } .info .kv > span:nth-child(odd) { white-space: nowrap; }
tr { break-inside: avoid; } thead { display: table-header-group; } tfoot { display: table-row-group; }
.lines tfoot td { font-weight: 600; border-top: 1.2px solid #1c2230; border-bottom: 0; background: none !important; } .lines tfoot .bn { display: inline; margin-left: 4px; }
.lines tfoot tr.sub td { border-top: 0; font-weight: 500; padding-top: .8mm; padding-bottom: .8mm; } .lines tfoot tr.sub + tr:not(.sub) td { border-top: 1px solid #1c2230; }
.wr { height: 8.5mm; } .wr td { border-bottom: 1px solid #c3c8d0; }
.wl { border-bottom: 1px solid #b9bfc8; height: 8mm; } .stamp.neu { color: ${a}; border-color: ${a}; }
.neg { color: #B11C29; } .pos { color: #1f7a4a; } .sm { font-size: .86em; } .b { font-weight: 600; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; margin-top: 5mm; align-items: start; }
.pair .lines td, .pair .lines th { padding-left: 2mm; padding-right: 2mm; }
.netbox { margin-top: 5mm; display: flex; justify-content: space-between; align-items: center; gap: 6mm; border: 1.2px solid ${a}; border-radius: 3px; padding: 3.2mm 4mm; }
.netbox > b { font-size: 1.45em; color: ${a}; font-variant-numeric: lining-nums tabular-nums; }
${d.template === "compact" ? "" : ".lines td { padding-top: 1.75mm; padding-bottom: 1.75mm; }"} .sec { margin-top: 6mm; } .sec > .lab { margin-bottom: 2mm; } .note { font-size: .9em; color: #4e5666; margin-top: 3mm; }
.sign.four { gap: 9mm; } .endb { margin-top: auto; break-inside: avoid; } .endb .sign { margin-top: 0; padding-top: 9mm; } .sheet { padding-bottom: 9mm; } .endb .ft { margin-top: 4mm; } .info { margin-bottom: 5mm; }
${landscape ? `.sheet { width: 297mm; min-height: 210mm; padding: ${d.template === "modern" ? 0 : 10}mm 12mm 8mm; } .band { margin: 0 -12mm 5mm; padding: 6mm 12mm 5mm; }
.title { margin-top: 4mm !important; margin-bottom: 4mm !important; padding-top: 1.5mm !important; padding-bottom: 1.5mm !important; } .title h1 { font-size: 1.7em !important; }
.hd { flex-direction: row !important; align-items: center !important; text-align: left !important; } .hd .addr { text-align: right !important; } .hd .addr b { font-size: 1.14em !important; } .info { margin-bottom: 4mm; } .info > div { padding: 2.2mm 3.5mm; }
.dense { font-size: .92em; } .dense th, .dense td { padding: 1.2mm 1.6mm; line-height: 1.32; } .dense tbody td { height: 8mm; vertical-align: middle; } .dense th .bn { display: block; margin-left: 0; } .sign { padding-top: 7mm; } .ft { margin-top: 3mm; padding-top: 2mm; } .words { margin-top: 1.5mm; }` : ""}
@media print { html { background: #fff; } .sheet { min-height: ${landscape ? 202 : 289}mm; } }</style>`;
}

/** Signatures + footer stay together at the bottom of the last page. */
const BLANK = `<span style="display:inline-block;width:30mm;border-bottom:1px solid #b9bfc8">&nbsp;</span>`;
const end = (sign: string, foot: string) => `<div class="endb">${sign}${docFooter(foot)}</div>`;
function page(c: C, titleText: string, body: string, landscape = false) {
  return docPage(titleText, c.d, `${extraCss(c.d, landscape)}${body}`);
}

// ======================================================================= Inventory
export type InvData = { items: Item[]; suppliers: Supplier[]; stores: Location[]; categories: Category[]; moves: Move[] };
const lookups = (inv: InvData) => ({
  item: new Map(inv.items.map((i) => [i.id, i])),
  store: (id: string) => inv.stores.find((s) => s.id === id)?.name ?? "",
  sup: (id: string) => inv.suppliers.find((s) => s.id === id),
  cat: (id: string) => inv.categories.find((s) => s.id === id)?.name ?? "",
});
const supBlock = (c: C, s?: Supplier) => s ? `<div class="nm">${esc(s.name)}</div><div class="mut">${[s.contact && esc(s.contact), s.phone && c.x.num(esc(s.phone)), s.email && esc(s.email), s.address && esc(s.address)].filter(Boolean).join("<br>")}</div>` : `<div class="wl"></div>`;

/** 1. Purchase order — what the hotel asks the supplier to deliver. */
export function poHtml(h: Hotel, inv: InvData, p: Po) {
  const c = ctx(h); const { x } = c; const k = kit(c); const L = lookups(inv);
  const total = Math.round(p.lines.reduce((s, l) => s + l.qty * l.cost, 0));
  const st = PO_LABEL[p.status];
  const tone = p.status === "cancelled" ? "due" : p.status === "received" ? "ok" : "neu";
  const meta = `${x.t("poNo")} ${x.num(esc(p.id))} · ${x.date(p.date)}`;
  const info = `<div class="info">
${k.box("supplier", supBlock(c, L.sup(p.supplier)))}
${k.box("deliverTo", `<div class="nm">${esc(c.H.name)}</div><div class="mut">${esc(L.store(p.store))}${c.H.address ? `<br>${esc(c.H.address)}` : ""}</div>`)}
${k.box("order", k.kv([["poNo", `<b>${x.num(esc(p.id))}</b>`], ["orderDate", x.date(p.date)], ["expected_off", p.expected && x.date(p.expected)], ["status", k.v(st)]]))}</div>`;
  const rows = p.lines.map((l, i) => { const it = L.item.get(l.item); const hint = it ? inBuy(it, l.qty) : "";
    return `<tr><td class="c">${x.num(i + 1)}</td><td><span class="b">${esc(it?.name ?? l.item)}</span>${hint ? `<span class="mut sm"> · ${x.num(esc(hint))}</span>` : ""}</td><td class="mut">${esc(it?.sku)}</td><td class="r">${k.qty(l.qty)}</td><td>${esc(it?.unit)}</td><td class="r">${k.rate(l.cost)}</td><td class="r">${x.plain(l.qty * l.cost)}</td></tr>`; }).join("");
  const lines = `<table class="lines"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("sku", "", "20mm")}${k.th("qty", "r", "18mm")}${k.th("unit", "", "15mm")}${k.th("rate", "r", "22mm")}${k.th("amount", "r", "26mm")}</tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td colspan="5">${x.lb("orderTotal")}</td><td class="r">${x.money(total)}</td></tr></tfoot></table>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("po", meta, k.stamp(k.v(st), tone), { k: "orderTotal", value: x.money(total) })}${info}${lines}
<div class="words">${x.t("inWords")}: <b>${x.words(total)}</b></div>${p.note ? `<div class="notes"><b>${x.t("notes")}.</b> ${esc(p.note)}</div>` : ""}
${end(k.sign([k.who("orderedBy", p.by), k.who("approvedBy", p.approvedBy), x.t("supplierSign")]), `${esc(c.H.name)} · ${x.t("po")} ${x.num(esc(p.id))}`)}`;
  return page(c, `${x.t("po")} ${p.id}`, body);
}

/** 2. Goods received note — one delivery against a PO: ordered, received before, received now, still due. */
export function grnHtml(h: Hotel, inv: InvData, p: Po, grnId: string) {
  const c = ctx(h); const { x } = c; const k = kit(c); const L = lookups(inv);
  const gi = p.grns.findIndex((g) => g.id === grnId); const g = p.grns[gi];
  if (!g) return page(c, grnId, `<p>${esc(grnId)}</p>`);
  const older = p.grns.slice(gi + 1); // newest first in the store
  const before = (item: string) => older.reduce((s, o) => s + (o.lines.find((l) => l.item === item)?.qty ?? 0), 0);
  const now = (item: string) => g.lines.find((l) => l.item === item)?.qty ?? 0;
  const value = Math.round(p.lines.reduce((s, l) => s + now(l.item) * l.cost, 0));
  const meta = `${x.t("grnNo")} ${x.num(esc(g.id))} · ${k.at(g.at)}`;
  const info = `<div class="info">
${k.box("supplier", supBlock(c, L.sup(p.supplier)))}
${k.box("delivery", k.kv([["grnNo", `<b>${x.num(esc(g.id))}</b>`], ["receivedOn", k.at(g.at)], ["challan", g.invoice ? x.num(esc(g.invoice)) : false], ["store", esc(L.store(p.store))]]))}
${k.box("order", k.kv([["poNo", x.num(esc(p.id))], ["orderDate", x.date(p.date)], ["approvedBy", p.approvedBy && esc(p.approvedBy)]]))}</div>`;
  const rows = p.lines.map((l, i) => { const it = L.item.get(l.item); const b = before(l.item), n = now(l.item); const due = Math.max(0, l.qty - b - n);
    return `<tr><td class="c">${x.num(i + 1)}</td><td><span class="b">${esc(it?.name ?? l.item)}</span></td><td>${esc(it?.unit)}</td><td class="r">${k.qty(l.qty)}</td><td class="r mut">${b ? k.qty(b) : "—"}</td><td class="r b">${n ? k.qty(n) : "—"}</td><td></td><td class="r">${due ? k.qty(due) : "—"}</td><td class="r">${k.rate(l.cost)}</td><td class="r">${n ? x.plain(n * l.cost) : "—"}</td></tr>`; }).join("");
  const lines = `<table class="lines fx"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("unit", "", "12mm")}${k.th("ordered", "r", "17mm")}${k.th("prevReceived", "r", "19mm")}${k.th("receivedNow", "r", "19mm")}${k.th("rejected", "r", "18mm")}${k.th("stillDue_off", "r", "16mm")}${k.th("rate", "r", "15mm")}${k.th("value", "r", "20mm")}</tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td colspan="8">${x.lb("valueReceived")}</td><td class="r">${x.money(value)}</td></tr></tfoot></table>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("grn", meta, k.stamp(k.v(PO_LABEL[p.status]), p.status === "received" ? "ok" : "neu"), { k: "valueReceived", value: x.money(value) })}${info}${lines}
<div class="words">${x.t("inWords")}: <b>${x.words(value)}</b></div>
<div class="sec"><div class="lab">${x.lb("remarks")}</div><div class="wl"></div><div class="wl"></div></div>
${end(k.sign([k.who("receivedBy", g.by), x.t("checkedBy"), x.t("supplierSign")]), `${esc(c.H.name)} · ${x.t("grn")} ${x.num(esc(g.id))}`)}`;
  return page(c, `${x.t("grn")} ${g.id}`, body);
}

/** 3. Stock issue slip (one issue movement) or transfer slip (both legs of one TR- reference). */
export function stockSlipHtml(h: Hotel, inv: InvData, m: Move) {
  const c = ctx(h); const { x } = c; const k = kit(c); const L = lookups(inv);
  const transfer = m.type === "transfer";
  const legs = transfer && m.ref ? inv.moves.filter((y) => y.type === "transfer" && y.ref === m.ref) : [m];
  const out = legs.filter((y) => y.change < 0); const inn = legs.filter((y) => y.change > 0);
  const lineMoves = transfer ? (out.length ? out : inn) : legs;
  const from = transfer ? L.store(out[0]?.store ?? "") : L.store(m.store);
  const to = transfer ? L.store(inn[0]?.store ?? "") : "";
  const titleKey: LKey = transfer ? "transferSlip" : "issueSlip";
  const meta = `${m.ref ? `${x.t("slip")} ${x.num(esc(m.ref))} · ` : ""}${k.at(m.at)}`;
  // Notes on transfer legs are "To X · note" / "From X · note"; keep only the person's note.
  const note = (y: Move) => (transfer ? y.note.replace(/^(To|From) [^·]+(· )?/, "").trim() : y.note);
  const info = `<div class="info">
${k.box(transfer ? "fromStore" : "store", `<div class="nm">${esc(from)}</div>`)}
${transfer ? k.box("toStore", `<div class="nm">${esc(to)}</div>`) : k.box("notes", `<div>${esc(note(m)) || `<div class="wl"></div>`}</div>`)}
${k.box(transfer ? "transferSlip" : "issueSlip", k.kv([["slip", m.ref ? x.num(esc(m.ref)) : false], ["date", x.date(m.at)], ["time", x.time(m.at)], ["recordedBy", esc(m.by)]]))}</div>`;
  let sum = 0;
  const rows = lineMoves.map((y, i) => { const it = L.item.get(y.item); const val = y.value ?? Math.abs(y.change) * (it?.cost ?? 0); sum += val;
    return `<tr><td class="c">${x.num(i + 1)}</td><td><span class="b">${esc(it?.name ?? y.item)}</span>${transfer && note(y) ? `<span class="mut sm"> · ${esc(note(y))}</span>` : ""}</td><td class="mut">${esc(it?.sku)}</td><td class="r b">${k.qty(Math.abs(y.change))}</td><td>${esc(it?.unit)}</td><td class="r">${k.qty(y.balance)}</td><td class="r">${x.plain(val)}</td></tr>`; }).join("");
  const lines = `<table class="lines"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("sku", "", "20mm")}${k.th("qty", "r", "18mm")}${k.th("unit", "", "14mm")}${k.th("balanceAfter_off", "r", "26mm")}${k.th("value", "r", "24mm")}</tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td colspan="5">${x.lb("total")}</td><td class="r">${x.money(sum)}</td></tr></tfoot></table>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title(titleKey, meta)}${info}${lines}
${end(k.sign([k.who("issuedBy", m.by), x.t("receivedBy"), x.t("approvedBy")]), `${esc(c.H.name)} · ${x.t(titleKey)}${m.ref ? ` ${x.num(esc(m.ref))}` : ""}`)}`;
  return page(c, `${x.t(titleKey)}${m.ref ? ` ${m.ref}` : ""}`, body);
}

/** 4. Stock count: blank write-in sheet (blind, no system quantities) or result with difference and value. */
export function countHtml(h: Hotel, inv: InvData, cnt: Count, mode: "blank" | "result") {
  const c = ctx(h); const { x } = c; const k = kit(c); const L = lookups(inv);
  const blank = mode === "blank"; const titleKey: LKey = blank ? "countSheet" : "countResult";
  const stName = cnt.status === "posted" ? "Posted" : cnt.status === "review" ? "Waiting review" : "Counting";
  const meta = `${x.t("countNo")} ${x.num(esc(cnt.id))} · ${esc(L.store(cnt.store))} · ${x.date(cnt.at)}`;
  const info = `<div class="info">
${k.box("store", `<div class="nm">${esc(L.store(cnt.store))}</div>`)}
${k.box("count", k.kv([["countNo", `<b>${x.num(esc(cnt.id))}</b>`], ["started", k.at(cnt.at)], ["startedBy", esc(cnt.by)], ["itemsListed", x.num(cnt.lines.length)]]))}
${blank ? k.box("notes", `<div class="mut sm">${x.t("blindNote")}</div>`) : k.box("status", k.kv([["status", k.v(stName)], ["postedBy", cnt.postedBy && esc(cnt.postedBy)]]))}</div>`;
  let lines: string;
  let big: { k: LKey; value: string } | undefined;
  if (blank) {
    const rows = cnt.lines.map((l, i) => { const it = L.item.get(l.item);
      return `<tr class="wr"><td class="c">${x.num(i + 1)}</td><td class="b">${esc(it?.name ?? l.item)}</td><td class="mut">${esc(it?.sku)}</td><td class="mut">${esc(L.cat(it?.category ?? ""))}</td><td>${esc(it?.unit)}</td><td></td><td></td></tr>`; }).join("");
    lines = `<table class="lines"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("sku", "", "19mm")}${k.th("category", "", "32mm")}${k.th("unit", "", "13mm")}${k.th("counted", "", "28mm")}${k.th("remarks", "", "38mm")}</tr></thead><tbody>${rows}</tbody></table>`;
  } else {
    let short = 0, extra = 0;
    const rows = cnt.lines.map((l, i) => { const it = L.item.get(l.item); const sys = cnt.status === "posted" ? l.system : it?.stock[cnt.store] ?? l.system;
      const d = l.counted === null ? null : Math.round((l.counted - sys) * 1000) / 1000; const val = d === null || !it ? 0 : Math.round(d * it.cost);
      if (val < 0) short += -val; else extra += val;
      const dTxt = d === null ? "—" : d === 0 ? x.num("0") : `${d > 0 ? "+" : "−"}${k.qty(Math.abs(d))}`;
      return `<tr><td class="c">${x.num(i + 1)}</td><td class="b">${esc(it?.name ?? l.item)}</td><td class="mut">${esc(it?.sku)}</td><td>${esc(it?.unit)}</td><td class="r">${k.qty(sys)}</td><td class="r b">${l.counted === null ? "—" : k.qty(l.counted)}</td><td class="r ${d && d < 0 ? "neg" : d ? "pos" : ""}">${dTxt}</td><td class="r">${it ? k.rate(it.cost) : ""}</td><td class="r ${val < 0 ? "neg" : ""}">${val ? `${val > 0 ? "+" : "−"}${x.plain(val)}` : "—"}</td></tr>`; }).join("");
    const net = extra - short;
    big = { k: "netDiff", value: `${net < 0 ? "−" : net > 0 ? "+" : ""}${x.money(net)}` };
    lines = `<table class="lines"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("sku", "", "18mm")}${k.th("unit", "", "12mm")}${k.th("systemQty", "r", "17mm")}${k.th("counted", "r", "19mm")}${k.th("difference", "r", "21mm")}${k.th("unitCost", "r", "20mm")}${k.th("value", "r", "22mm")} </tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td colspan="7">${x.lb("shortage")}</td><td class="r neg">${short ? `−${x.plain(short)}` : "—"}</td></tr><tr class="sub"><td></td><td colspan="7">${x.lb("excess")}</td><td class="r pos">${extra ? `+${x.plain(extra)}` : "—"}</td></tr><tr><td></td><td colspan="7">${x.lb("netDiff")}</td><td class="r">${net < 0 ? "−" : net > 0 ? "+" : ""}${x.money(net)}</td></tr></tfoot></table>`;
  }
  const body = `${docHeader(c.H, c.d, x)}${k.title(titleKey, meta, blank ? "" : k.stamp(k.v(stName), cnt.status === "posted" ? "ok" : "neu"), big)}${info}${lines}
${end(k.sign(blank ? [x.t("countedBy"), x.t("checkedBy"), x.t("approvedBy")] : [x.t("countedBy"), x.t("checkedBy"), k.who("postedBy", cnt.postedBy)]), `${esc(c.H.name)} · ${x.t(titleKey)} ${x.num(esc(cnt.id))}`)}`;
  return page(c, `${x.t(titleKey)} ${cnt.id}`, body);
}

// ======================================================================= Expenses
export type PayeeInfo = { name: string; kind?: string; phone?: string };
const payRows = (c: C, k: ReturnType<typeof kit>, pays: { at: string; method: string; ref?: string; by: string; amount: number }[]) => pays.length
  ? `<table class="pay"><thead><tr><th>${c.x.t("date")}</th><th>${c.x.t("method")}</th><th>${c.x.t("reference")}</th><th>${c.x.t("paidBy")}</th><th class="r">${c.x.t("amount")} (৳)</th></tr></thead><tbody>${pays.map((p) => `<tr><td class="nw">${k.at(p.at)}</td><td>${c.x.method(p.method)}</td><td class="mut">${p.ref ? c.x.num(esc(p.ref)) : "—"}</td><td class="nw">${esc(p.by)}</td><td class="r">${c.x.plain(p.amount)}</td></tr>`).join("")}</tbody></table>`
  : `<p class="mut">${c.x.t("noPaymentYet")}</p>`;

/** 5. Expense voucher / payment slip. */
export function expenseVoucherHtml(h: Hotel, e: Expense, o: { category: string; payee?: PayeeInfo }) {
  const c = ctx(h); const { x } = c; const k = kit(c);
  const paid = paidOf(e); const due = e.status === "approved" ? Math.max(0, e.amount - paid) : 0; const st = payState(e);
  const tone = st === "Paid" ? "ok" : st === "Rejected" ? "due" : st === "To pay" || st === "Partly paid" ? "due" : "neu";
  const stampTxt = st === "To pay" || st === "Partly paid" ? `${x.t("due")} ${x.money(due)}` : k.v(st);
  const meta = `${x.t("voucherNo")} ${x.num(esc(e.id))} · ${x.date(e.date)}`;
  const info = `<div class="info">
${k.box("paidTo", o.payee ? `<div class="nm">${esc(o.payee.name)}</div><div class="mut">${[o.payee.kind && k.v(o.payee.kind), o.payee.phone && x.num(esc(o.payee.phone))].filter(Boolean).join(" · ")}</div>` : `<div class="wl"></div>`)}
${k.box("voucher", k.kv([["voucherNo", `<b>${x.num(esc(e.id))}</b>`], ["date", x.date(e.date)], ["category", esc(o.category)], ["billNo_off", e.billNo && x.num(esc(e.billNo))]]))}
${k.box("approval", k.kv([["status", k.v(st)], ["addedBy", esc(e.by)], ["approvedBy", e.approvedBy && esc(e.approvedBy)]]))}</div>`;
  const lines = `<table class="lines"><thead><tr>${k.th("description")}${k.th("amount", "r", "34mm")}</tr></thead><tbody><tr><td><span class="b">${esc(e.title)}</span>${e.note ? `<br><span class="mut sm">${esc(e.note)}</span>` : ""}${e.rejectReason ? `<br><span class="neg sm">${k.v("Rejected")}: ${esc(e.rejectReason)}</span>` : ""}</td><td class="r">${x.plain(e.amount)}</td></tr></tbody></table>`;
  const tot = `<div class="tot"><div class="g"><span>${x.lb("total")}</span><span class="nw">${x.money(e.amount)}</span></div><div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div><div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div></div>`;
  const pays = `<div><div class="lab">${x.lb("payments")}</div>${payRows(c, k, e.payments)}<div class="words">${x.t("inWords")}: <b>${x.words(e.amount)}</b></div></div>`;
  const lastBy = e.payments[e.payments.length - 1]?.by;
  const body = `${docHeader(c.H, c.d, x)}${k.title("voucher", meta, k.stamp(stampTxt, tone), { k: "total", value: x.money(e.amount) })}${info}${lines}<div class="below">${pays}${tot}</div>
${end(`<div class="sign four">${[k.who("preparedBy", e.by), k.who("approvedBy", e.approvedBy), k.who("paidBy", lastBy), x.t("receiverSign")].map((s) => `<div>${s}</div>`).join("")}</div>`, `${esc(c.H.name)} · ${x.t("voucher")} ${x.num(esc(e.id))}`)}`;
  return page(c, `${x.t("voucher")} ${e.id}`, body);
}

/** 6. Supplier bill payment receipt — a GRN (the bill) and the payments made against it. */
export function billReceiptHtml(h: Hotel, inv: InvData, p: Po, grnId: string, e: Expense) {
  const c = ctx(h); const { x } = c; const k = kit(c); const L = lookups(inv);
  const g = p.grns.find((y) => y.id === grnId);
  const lines0 = (g?.lines ?? []).map((l) => ({ it: L.item.get(l.item), qty: l.qty, cost: p.lines.find((y) => y.item === l.item)?.cost ?? 0 }));
  const total = e.amount; const paid = paidOf(e); const due = Math.max(0, total - paid);
  const meta = `${x.t("bill")} ${x.num(esc(grnId))} · ${x.t("voucherNo")} ${x.num(esc(e.id))}`;
  const info = `<div class="info">
${k.box("supplier", supBlock(c, L.sup(p.supplier)))}
${k.box("bill", k.kv([["grnNo", `<b>${x.num(esc(grnId))}</b>`], ["poNo", x.num(esc(p.id))], ["challan", (g?.invoice || e.billNo) ? x.num(esc(g?.invoice || e.billNo)) : false], ["receivedOn", g && x.date(g.at)]]))}
${k.box("voucher", k.kv([["voucherNo", x.num(esc(e.id))], ["status", k.v(payState(e))], ["approvedBy", e.approvedBy && esc(e.approvedBy)]]))}</div>`;
  const rows = lines0.map((l, i) => `<tr><td class="c">${x.num(i + 1)}</td><td class="b">${esc(l.it?.name ?? "")}</td><td class="r">${k.qty(l.qty)}</td><td>${esc(l.it?.unit)}</td><td class="r">${k.rate(l.cost)}</td><td class="r">${x.plain(l.qty * l.cost)}</td></tr>`).join("");
  const lines = `<table class="lines"><thead><tr><th class="c" style="width:8mm">#</th>${k.th("item")}${k.th("qty", "r", "18mm")}${k.th("unit", "", "14mm")}${k.th("rate", "r", "22mm")}${k.th("amount", "r", "26mm")}</tr></thead><tbody>${rows}</tbody></table>`;
  const tot = `<div class="tot"><div class="g"><span>${x.lb("billTotal")}</span><span class="nw">${x.money(total)}</span></div><div><span>${x.t("paid")}</span><span class="nw">− ${x.money(paid)}</span></div><div class="due"><span>${x.lb("balance")}</span><span class="nw">${x.money(due)}</span></div></div>`;
  const pays = `<div><div class="lab">${x.lb("payments")}</div>${payRows(c, k, e.payments)}<div class="words">${x.t("amountPaid")}: <b>${x.words(paid)}</b></div></div>`;
  const lastBy = e.payments[e.payments.length - 1]?.by;
  const body = `${docHeader(c.H, c.d, x)}${k.title("billReceipt", meta, k.stamp(due <= 0 ? k.v("Paid") : `${x.t("due")} ${x.money(due)}`, due <= 0 ? "ok" : "due"), { k: "amountPaid", value: x.money(paid) })}${info}${lines}<div class="below">${pays}${tot}</div>
${end(k.sign([k.who("paidBy", lastBy), k.who("approvedBy", e.approvedBy), x.t("supplierReceived")]), `${esc(c.H.name)} · ${x.t("billReceipt")} ${x.num(esc(grnId))}`)}`;
  return page(c, `${x.t("billReceipt")} ${grnId}`, body);
}

// ======================================================================= Staff
/** Salary parts for a payroll line (same split as the payslip screen; rounding goes to the last part). */
function parts(e: Employee, base: number) {
  const g = e.salary.basic + e.salary.house + e.salary.food + e.salary.transport;
  if (!g) return { basic: base, house: 0, food: 0, transport: 0 };
  const basic = Math.round((e.salary.basic / g) * base), house = Math.round((e.salary.house / g) * base), food = Math.round((e.salary.food / g) * base);
  return { basic, house, food, transport: base - basic - house - food };
}
const runStatusEn = (r: PayrollRun) => (r.status === "approved" ? "Approved" : r.status === "reviewed" ? "Reviewed" : "Draft");

/** 7. Payslip for one employee in one payroll run. */
export function payslipHtml(h: Hotel, s: HrmState, run: PayrollRun, empId: string) {
  const c = ctx(h); const { x } = c; const k = kit(c);
  const l = run.lines.find((y) => y.emp === empId); const e = s.employees.find((y) => y.id === empId);
  if (!l || !e) return page(c, empId, `<p>${esc(empId)}</p>`);
  const adj = s.adjustments.filter((a) => a.emp === empId && a.month === run.month);
  const bonuses = adj.filter((a) => a.kind === "Bonus"); const bonus = bonuses.reduce((t, a) => t + a.amount, 0);
  const p = parts(e, l.gross - bonus);
  const dedAdj = adj.filter((a) => a.kind !== "Bonus"); const other = l.deductions - dedAdj.reduce((t, a) => t + a.amount, 0);
  const net = lineNet(l); const due = Math.max(0, net - l.paid); const pays = run.payments.filter((y) => y.emp === empId);
  const att = Object.entries(s.attendance).filter(([d]) => d.startsWith(run.month)).map(([, m]) => m[empId]).filter(Boolean);
  const cnt = (st: string) => att.filter((a) => a.status === st).length;
  const approved = run.status === "approved";
  const stampTxt = !approved ? k.v(runStatusEn(run)) : due <= 0 ? k.v("Paid") : `${x.t("due")} ${x.money(due)}`;
  const meta = `${k.month(run.month)} · ${x.num(esc(e.id))}`;
  const info = `<div class="info">
${k.box("employee", `<div class="nm">${esc(e.name)}</div>${k.kv([["empId", x.num(esc(e.id))], ["designation", esc(e.position)], ["department", k.v(e.dept)]])}`)}
${k.box("payPeriod", k.kv([["month", `<b>${k.month(run.month)}</b>`], ["payrollRun", k.v(runStatusEn(run))], ["joined", e.joined && x.date(e.joined)], ["jobType", k.v(e.type)]]))}
${att.length ? k.box("attendance", k.kv([["present", `${x.num(cnt("present"))} ${x.t("days")}`], ["halfDay", cnt("half") ? `${x.num(cnt("half"))} ${x.t("days")}` : false], ["onLeave", `${x.num(cnt("leave"))} ${x.t("days")}`], ["absent", `${x.num(cnt("absent"))} ${x.t("days")}`], ["dayOff", cnt("off") ? `${x.num(cnt("off"))} ${x.t("days")}` : false]]) ) : k.box("netPay", k.kv([["netPay", `<b>${x.money(net)}</b>`], ["paid", x.money(l.paid)], ["due", x.money(due)]]))}</div>`;
  const row = (label: string, n: number, neg = false) => `<tr><td>${label}</td><td class="r">${neg ? "− " : ""}${x.plain(n)}</td></tr>`;
  const earn = [row(x.t("basic"), p.basic), p.house ? row(x.t("houseRent"), p.house) : "", p.food ? row(x.t("food"), p.food) : "", p.transport ? row(x.t("transport"), p.transport) : "", ...bonuses.map((a) => row(`${x.t("bonus")}${a.note ? ` <span class="mut sm">· ${esc(a.note)}</span>` : ""}`, a.amount))].join("");
  const ded = [...dedAdj.map((a) => row(`${x.t(a.kind === "Advance" ? "advance_off" : "deduction")}${a.note ? ` <span class="mut sm">· ${esc(a.note)}</span>` : ""}`, a.amount, true)), other > 0 ? row(x.t("otherDed"), other, true) : ""].join("") || `<tr><td class="mut" colspan="2">${x.t("noDed")}</td></tr>`;
  const pair = `<div class="pair"><table class="lines"><thead><tr>${k.th("earnings")}${k.th("amount", "r", "26mm")}</tr></thead><tbody>${earn}</tbody><tfoot><tr><td>${x.lb("grossPay")}</td><td class="r">${x.money(l.gross)}</td></tr></tfoot></table>
<table class="lines"><thead><tr>${k.th("deductions")}${k.th("amount", "r", "26mm")}</tr></thead><tbody>${ded}</tbody><tfoot><tr><td>${x.lb("totalDed")}</td><td class="r">− ${x.money(l.deductions)}</td></tr></tfoot></table></div>`;
  const netbox = `<div class="netbox"><div><div class="lab" style="margin:0">${x.lb("netPay")}</div><div class="words" style="margin-top:1mm">${x.t("inWords")}: <b>${x.words(net)}</b></div></div><b>${x.money(net)}</b></div>`;
  const payTbl = `<div class="sec"><div class="lab">${x.lb("payments")}</div>${pays.length ? `<table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("method")}</th><th>${x.t("reference")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>${pays.map((y) => `<tr><td>${x.date(y.date)}</td><td>${x.method(y.method)}</td><td class="mut">${y.note ? esc(y.note) : "—"}</td><td class="r">${x.plain(y.amount)}</td></tr>`).join("")}<tr><td colspan="3" class="b">${x.t("paid")}</td><td class="r b">${x.plain(l.paid)}</td></tr><tr><td colspan="3" class="b">${x.t("balance")}</td><td class="r b">${x.plain(due)}</td></tr></tbody></table>` : `<p class="mut">${x.t("noPaymentYet")}</p>`}</div>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("payslip", meta, k.stamp(stampTxt, !approved ? "neu" : due <= 0 ? "ok" : "due"), { k: "netPay", value: x.money(net) })}${info}${pair}${netbox}${payTbl}
${end(k.sign([x.t("preparedBy"), x.t("employeeSign"), x.t("authSign")]), `${esc(c.H.name)} · ${x.t("payslip")} · ${k.month(run.month)} · ${x.num(esc(e.id))}`)}`;
  return page(c, `${x.t("payslip")} ${e.name} ${run.month}`, body);
}

/** 8. Payroll sheet for one month (A4 landscape) with a signature column. */
export function payrollSheetHtml(h: Hotel, s: HrmState, run: PayrollRun) {
  const c = ctx(h); const { x } = c; const k = kit(c);
  const T = runTotals(run);
  const tot = { basic: 0, house: 0, food: 0, transport: 0, bonus: 0 };
  const rows = run.lines.map((l, i) => {
    const e = s.employees.find((y) => y.id === l.emp);
    const bonus = s.adjustments.filter((a) => a.emp === l.emp && a.month === run.month && a.kind === "Bonus").reduce((t, a) => t + a.amount, 0);
    const p = e ? parts(e, l.gross - bonus) : { basic: l.gross - bonus, house: 0, food: 0, transport: 0 };
    tot.basic += p.basic; tot.house += p.house; tot.food += p.food; tot.transport += p.transport; tot.bonus += bonus;
    const net = lineNet(l);
    return `<tr><td class="c">${x.num(i + 1)}</td><td class="nw"><span class="b">${esc(e?.name ?? l.emp)}</span> <span class="mut sm">${x.num(esc(l.emp))}</span></td><td>${esc(e?.position)}${e?.dept ? ` <span class="mut sm">· ${k.v(e.dept)}</span>` : ""}</td>
<td class="r">${k.n0(p.basic)}</td><td class="r">${k.n0(p.house)}</td><td class="r">${k.n0(p.food)}</td><td class="r">${k.n0(p.transport)}</td><td class="r">${k.n0(bonus)}</td><td class="r b">${x.plain(l.gross)}</td><td class="r">${k.n0(l.deductions)}</td><td class="r b">${x.plain(net)}</td><td class="r">${k.n0(l.paid)}</td><td class="r ${net - l.paid > 0 ? "neg" : ""}">${k.n0(net - l.paid)}</td><td></td></tr>`;
  }).join("");
  const meta = `${k.month(run.month)} · ${x.t("staff")}: ${x.num(run.lines.length)}`;
  const st = run.status === "approved" ? k.v(payStatusOfRun(run)) : k.v(runStatusEn(run));
  const summary = `<div class="info">
${k.box("payPeriod", k.kv([["month", `<b>${k.month(run.month)}</b>`], ["payrollRun", k.v(runStatusEn(run))], ["staff", x.num(run.lines.length)]]))}
${k.box("total", k.kv([["gross", x.money(T.gross)], ["deductions", `− ${x.money(T.gross - T.net)}`], ["net", `<b>${x.money(T.net)}</b>`]]))}
${k.box("paid", k.kv([["paid", x.money(T.paid)], ["due", x.money(T.due)]]))}</div>`;
  const table = `<table class="lines dense"><thead><tr><th class="c" style="width:7mm">#</th>${k.th("employee")}${k.th("designation")}${k.th("basic", "r")}${k.th("houseRent", "r")}${k.th("food", "r")}${k.th("transport", "r")}${k.th("bonus", "r")}${k.th("gross", "r")}${k.th("deductions", "r")}${k.th("net", "r")}${k.th("paid", "r")}${k.th("due", "r")}${k.th("signature", "", "24mm")}</tr></thead><tbody>${rows}</tbody>
<tfoot><tr><td></td><td colspan="2">${x.lb("total")}</td><td class="r">${x.plain(tot.basic)}</td><td class="r">${x.plain(tot.house)}</td><td class="r">${x.plain(tot.food)}</td><td class="r">${x.plain(tot.transport)}</td><td class="r">${k.n0(tot.bonus)}</td><td class="r">${x.plain(T.gross)}</td><td class="r">${k.n0(T.gross - T.net)}</td><td class="r">${x.plain(T.net)}</td><td class="r">${k.n0(T.paid)}</td><td class="r">${k.n0(T.due)}</td><td></td></tr></tfoot></table>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("payrollSheet", meta, k.stamp(st, run.status !== "approved" ? "neu" : T.due <= 0 ? "ok" : "due"), { k: "net", value: x.money(T.net) }, true)}${summary}${table}
<div class="words">${x.t("net")} · ${x.t("inWords")}: <b>${x.words(T.net)}</b></div>
${end(k.sign([x.t("preparedBy"), x.t("checkedBy"), x.t("approvedBy")]), `${esc(c.H.name)} · ${x.t("payrollSheet")} · ${k.month(run.month)}`)}`;
  return page(c, `${x.t("payrollSheet")} ${run.month}`, body, true);
}
const payStatusOfRun = (r: PayrollRun) => { const t = runTotals(r); return t.paid <= 0 ? "Unpaid" : t.due <= 0 ? "Paid" : "Partially paid"; };

// ======================================================================= Housekeeping
export type HkRow = { room: string; type?: string; where?: string; occ?: "Vacant" | "Occupied" | "Arriving" | "Leaving"; clean: string; ooo?: boolean; task?: { kind: TaskKind; status: Task["status"]; who?: string; priority?: Priority; due?: string; note?: string } };

/** 9. Daily room sheet for housekeeping (A4 landscape) — one row per room, write-in start / finish / notes. */
export function hkSheetHtml(h: Hotel, date: string, rows: HkRow[]) {
  const c = ctx(h); const { x } = c; const k = kit(c);
  const tasks = rows.filter((r) => r.task).length;
  const by = (s: string) => rows.filter((r) => r.clean === s).length;
  const meta = `${x.date(date, true)} · ${x.num(rows.length)} ${x.t("rooms")}`;
  const info = `<div class="info">
${k.box("date", `<div class="nm">${x.date(date, true)}</div>`)}
${k.box("roomStatus", `<div class="kv">${(["Dirty", "Cleaning", "Clean", "Inspected"] as const).map((s) => `<span>${k.v(s)}</span><span>${x.num(by(s))}</span>`).join("")}</div>`)}
${k.box("rooms", k.kv([["rooms", x.num(rows.length)], ["task", x.num(tasks)], ["outOfOrder", rows.some((r) => r.ooo) ? x.num(rows.filter((r) => r.ooo).length) : false]]))}</div>`;
  const body0 = rows.map((r) => {
    const t = r.task;
    return `<tr class="wr"><td class="b">${x.num(esc(r.room))}</td><td>${esc(r.type)}${r.where ? `<br><span class="mut sm">${esc(r.where)}</span>` : ""}</td><td>${k.v(r.occ)}${r.ooo ? `<br><span class="neg sm">${x.t("outOfOrder")}</span>` : ""}</td><td>${k.v(r.clean)}</td>
<td>${t ? `${k.v(t.kind, KIND_EN[t.kind])}<br><span class="mut sm">${k.v(t.status, TASK_EN[t.status])}</span>` : "—"}</td><td>${t ? (t.who ? esc(t.who) : `<span class="mut">${x.t("notAssigned")}</span>`) : ""}</td><td>${t?.priority ? k.v(t.priority) : ""}</td><td class="nw">${t?.due ? x.num(esc(t.due)) : ""}</td><td></td><td></td><td>${t?.note ? `<span class="mut sm">${esc(t.note)}</span>` : ""}</td></tr>`;
  }).join("");
  const table = `<table class="lines dense"><thead><tr>${k.th("room", "", "15mm")}${k.th("roomType_off", "", "34mm")}${k.th("occupancy", "", "22mm")}${k.th("roomStatus", "", "22mm")}${k.th("task", "", "32mm")}${k.th("assignedTo", "", "30mm")}${k.th("priority", "", "17mm")}${k.th("dueBy", "", "14mm")}${k.th("timeIn", "", "15mm")}${k.th("timeOut", "", "15mm")}${k.th("cleanerNotes")}</tr></thead><tbody>${body0}</tbody></table>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("hkSheet", meta)}${info}${table}
${end(k.sign([x.t("supervisor"), x.t("hkManager")]), `${esc(c.H.name)} · ${x.t("hkSheet")} · ${x.date(date)}`)}`;
  return page(c, `${x.t("hkSheet")} ${date}`, body, true);
}

/** 10. Maintenance work order for one room repair (Housekeeping › Maintenance). */
export function workOrderHtml(h: Hotel, t: Task, room: { type?: string; where?: string; block?: { reason: string; since: string; until?: string } }) {
  const c = ctx(h); const { x } = c; const k = kit(c);
  const meta = `${x.t("room")} ${x.num(esc(t.room))} · ${k.at(t.at)}`;
  const st = TASK_EN[t.status];
  const info = `<div class="info">
${k.box("room", `<div class="nm">${x.t("room")} ${x.num(esc(t.room))}</div>${k.kv([["roomType_off", room.type && esc(room.type)], ["location", room.where && esc(room.where)]])}`)}
${k.box("status", k.kv([["reported", k.at(t.at)], ["priority", k.v(t.priority ?? "Normal")], ["status", k.v(t.status, st)], ["assignedTo", t.who ? esc(t.who) : x.t("notAssigned")], ["started", t.started ? k.at(t.started) : BLANK], ["finished", t.done ? k.at(t.done) : BLANK], ["reference", t.ref && x.num(esc(t.ref))]]))}
${k.box("roomBlocked", room.block ? `<div class="neg b">${x.t("outOfOrder")}</div><div class="mut">${x.date(room.block.since)} → ${room.block.until ? x.date(room.block.until) : x.t("untilFixed")}</div>` : `<div>${x.t("notBlocked")}</div>`)}</div>`;
  const issue = `<div class="sec"><div class="lab">${x.lb("issue")}</div><div class="nm" style="font-weight:500">${t.note ? esc(t.note) : `<div class="wl"></div>`}</div></div>`;
  const work = `<div class="sec"><div class="lab">${x.lb("workDone")}</div><div class="wl"></div><div class="wl"></div><div class="wl"></div></div>`;
  const partsT = `<div class="sec"><div class="lab">${x.lb("partsUsed")}</div><table class="lines"><thead><tr>${k.th("item")}${k.th("qty", "r", "22mm")}${k.th("cost", "r", "30mm")}</tr></thead><tbody>${'<tr class="wr"><td></td><td></td><td></td></tr>'.repeat(3)}</tbody></table></div>`;
  const body = `${docHeader(c.H, c.d, x)}${k.title("workOrder", meta, k.stamp(k.v(t.priority ?? "Normal"), t.priority === "Urgent" || t.priority === "High" ? "due" : "neu"))}${info}${issue}${work}${partsT}
${end(k.sign([x.t("technician"), x.t("supervisor"), x.t("roomAccepted")]), `${esc(c.H.name)} · ${x.t("workOrder")} · ${x.t("room")} ${x.num(esc(t.room))}`)}`;
  return page(c, `${x.t("workOrder")} ${t.room}`, body);
}
