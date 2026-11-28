// Cashbox documents: cash in / cash out voucher (80 mm thermal or A4) and the cashbox day report (Z report, A4).
// Data: src/lib/cashbox/store.ts (drawer-days and immutable movements). Nothing is computed here that the store does not record:
// expected / counted / carry / deposit are the values saved when the day was closed.
import type { Hotel } from "@/lib/types";
import { settingsOf } from "@/lib/settings/store";
import type { Day, Drawer, InSource, Movement, OutReason } from "@/lib/cashbox/store";
import { docPage, esc, footer, header, lang, normaliseDesign, type DocHotel, type LKey } from "./doc-kit";
import { kv, nowStamp, thermalDesign, thermalFoot, thermalHead, thermalHotel, thermalPage, type ThermalOpts, type TX } from "./thermal-kit";

const inKey = (s?: InSource) => `in_${s ?? "other"}` as LKey;
const outKey = (r?: OutReason) => `out_${r ?? "petty"}` as LKey;
const what = (x: TX, m: Movement) => `${x.t(m.kind === "in" ? inKey(m.source) : outKey(m.reason))}${m.category ? ` · ${esc(m.category)}` : ""}`;
/** Voucher number shown on paper: direction + the movement's own id. */
const code = (x: TX, s: string) => (/[A-Za-z]/.test(s) ? esc(s) : x.num(esc(s)));
const vno = (m: Movement) => `${m.kind === "in" ? "CI" : "CO"}-${m.day.replace(/-/g, "").slice(2)}-${m.id.replace(/^m/, "").padStart(4, "0")}`;

function a4(h: Hotel) {
  const st = settingsOf(h); const p = st.profile; const d = normaliseDesign(st.docs.design); const x = lang(d.lang);
  const H: DocHotel = { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin, logo: st.branding.logo, showLogo: st.docs.showLogo };
  return { d, x, H };
}
const titleBlock = (x: TX, key: LKey, meta: string) => `<div class="title"><div><h1>${x.t(key)}</h1>${x.mix ? `<span class="bn" style="margin-top:1mm">${lang("bn").t(key)}</span>` : ""}</div><div class="mut">${meta}</div></div>`;

/** Cash in / cash out voucher. Paper follows Settings › Invoices & documents › Paper unless `paper` is given. */
export function cashVoucherHtml(h: Hotel, m: Movement, drawer: Pick<Drawer, "name">, opts: ThermalOpts & { paper?: "A4" | "Thermal" } = {}) {
  const paper = opts.paper ?? settingsOf(h).docs.paper;
  const party = m.party || m.account;
  const sides: LKey[] = m.kind === "in" ? ["cashierSign", "managerSign"] : ["receiverSign", "cashierSign", "managerSign"];
  const titleKey: LKey = m.kind === "in" ? "cashInV" : "cashOutV";
  if (paper === "Thermal") {
    const d = thermalDesign(h, opts); const x = lang(d.lang);
    const body = `${thermalHead(thermalHotel(h), x, x.lb(titleKey), esc(drawer.name))}
${kv(x.lb("voucherNo"), `<b>${vno(m)}</b>`)}${kv(x.lb("date"), `${x.date(m.at)} · ${x.time(m.at)}`)}<hr>
${kv(x.lb("forWhat"), `<b>${what(x, m)}</b>`)}${party ? kv(x.lb(m.kind === "in" ? "receivedFrom" : "paidTo"), esc(party)) : ""}${m.ref ? kv(x.t("reference"), code(x, m.ref)) : ""}
${m.note ? `<div class="sm" style="margin-top:1mm">${x.t("notes")}: ${esc(m.note)}</div>` : ""}${m.reverses ? `<div class="inv">${x.t("reversalOf")}</div>` : ""}
<hr class="d">${kv(x.lb("amount"), `${m.kind === "in" ? "+" : "−"} ${x.money(m.amount)}`, "tot")}<hr class="d"><div class="sm">${x.t("inWords")}: ${x.words(m.amount)}</div><hr>
${kv(x.t("recordedBy"), esc(m.by))}${m.approvedBy ? kv(x.t("approvedBy"), esc(m.approvedBy)) : ""}
${sides.map((k) => `<div class="sig">${x.lb(k)}</div>`).join("")}${thermalFoot(x)}`;
    return thermalPage(`${x.t(titleKey)} ${vno(m)}`, d, body);
  }
  const { d, x, H } = a4(h);
  const body = `${header(H, d, x)}${titleBlock(x, titleKey, `${x.t("voucherNo")} ${vno(m)} · ${x.date(m.at)}, ${x.time(m.at)}`)}
<div class="info"><div><div class="lab">${x.lb("cashbox")}</div><div class="nm">${esc(drawer.name)}</div><div class="mut">${x.t("businessDate")}: ${x.date(m.day)}</div></div>
<div><div class="lab">${x.lb("forWhat")}</div><div class="nm">${what(x, m)}</div>${party ? `<div class="mut">${x.t(m.kind === "in" ? "receivedFrom" : "paidTo")}: ${esc(party)}</div>` : ""}${m.ref ? `<div class="mut">${x.t("reference")}: ${code(x, m.ref)}</div>` : ""}</div>
<div><div class="lab">${x.lb("recordedBy")}</div><div class="nm">${esc(m.by)}</div>${m.approvedBy ? `<div class="mut">${x.t("approvedBy")}: ${esc(m.approvedBy)}</div>` : ""}</div></div>
<div class="below"><div>${m.note ? `<div class="lab">${x.lb("notes")}</div><p>${esc(m.note)}</p>` : ""}${m.reverses ? `<p style="margin-top:3mm"><span class="stamp due">${x.t("reversalOf")}</span></p>` : ""}
<div class="words">${x.t("inWords")}: <b>${x.words(m.amount)}</b></div></div>
<div class="tot"><div class="g"><span>${x.lb(m.kind === "in" ? "cin" : "cout")}</span><span class="nw">${m.kind === "in" ? "+" : "−"} ${x.money(m.amount)}</span></div></div></div>
<div class="sign" style="margin-top:22mm;padding-top:0">${sides.map((k) => `<div>${x.t(k)}</div>`).join("")}</div>
<div style="margin-top:auto">${footer(`${esc(H.name)} · ${x.t(titleKey)} ${vno(m)}`)}</div>`;
  return docPage(`${x.t(titleKey)} ${vno(m)}`, d, body);
}

/** The deposit / handover the store posts at the moment of closing (not part of "expected"). */
const isClosingDrop = (day: Day, m: Movement) => !!day.closedAt && m.kind === "out" && m.auto && m.at === day.closedAt && (m.reason === "bank" || m.reason === "handover") && m.amount === day.deposit;

/** Cashbox day report (Z report), A4. `moves` may hold every movement; only this drawer-day is used. */
export function dayReportHtml(h: Hotel, day: Day, drawer: Pick<Drawer, "name">, moves: Movement[]) {
  const { d, x, H } = a4(h);
  const ms = moves.filter((m) => m.drawer === day.drawer && m.day === day.date).sort((a, b) => a.at.localeCompare(b.at) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const drop = ms.find((m) => isClosingDrop(day, m));
  const work = ms.filter((m) => m !== drop);
  const cin = work.filter((m) => m.kind === "in").reduce((s, m) => s + m.amount, 0);
  const cout = work.filter((m) => m.kind === "out").reduce((s, m) => s + m.amount, 0);
  const closed = !!day.closedAt;
  const expected = closed && day.expected != null ? day.expected : day.float + cin - cout;
  const diff = closed && day.counted != null ? day.counted - expected : 0;
  const group = (kind: "in" | "out") => {
    const g = new Map<LKey, { n: number; sum: number }>();
    for (const m of work.filter((y) => y.kind === kind)) { const k = kind === "in" ? inKey(m.source) : outKey(m.reason); const e = g.get(k) ?? { n: 0, sum: 0 }; e.n++; e.sum += m.amount; g.set(k, e); }
    return [...g].sort((a, b) => b[1].sum - a[1].sum);
  };
  const breakdown = (kind: "in" | "out") => { const rows = group(kind); const tot = kind === "in" ? cin : cout; return `<div style="margin-bottom:5mm"><div class="lab">${x.lb(kind === "in" ? "cashInBy" : "cashOutBy")}</div><table class="pay"><tbody>
${rows.length ? rows.map(([k, e]) => `<tr><td>${x.t(k)}</td><td class="r mut">${x.num(e.n)}</td><td class="r">${x.plain(e.sum)}</td></tr>`).join("") : `<tr><td class="mut" colspan="3">${x.t("none")}</td></tr>`}
<tr><td><b>${x.t(kind === "in" ? "totalIn" : "totalOut")}</b></td><td></td><td class="r"><b>${x.money(tot)}</b></td></tr></tbody></table></div>`; };
  const diffText = diff === 0 ? x.t("matched") : `${x.t(diff > 0 ? "over" : "short")} ${diff > 0 ? "+" : "−"}${x.money(diff)}`;
  const tot = `<div class="tot">
<div><span>${x.t("openingFloat")}</span><span class="nw">${x.money(day.float)}</span></div>
<div><span>${x.t("totalIn")}</span><span class="nw">+ ${x.money(cin)}</span></div>
<div><span>${x.t("totalOut")}</span><span class="nw">− ${x.money(cout)}</span></div>
<div class="g"><span>${x.lb("expected")}</span><span class="nw">${x.money(expected)}</span></div>
${closed ? `<div><span>${x.t("counted")}</span><span class="nw">${x.money(day.counted ?? 0)}</span></div>
<div class="due"><span>${x.lb("difference")}</span><span class="nw" style="color:${diff === 0 ? "#1f7a4a" : "#B11C29"}">${diffText}</span></div>
${diff !== 0 ? `<div style="font-size:.9em"><span class="mut">${x.t("reason")}: ${esc(day.varianceNote) || "—"}</span></div>` : ""}
<div style="margin-top:2mm"><span>${x.t("keptFloat")}</span><span class="nw">${x.money(day.carry ?? 0)}</span></div>
${day.deposit ? `<div><span>${x.t(day.depositTo === "main" ? "toMain" : "toBank")}${drop?.account ? ` · ${esc(drop.account)}` : ""}</span><span class="nw">${x.money(day.deposit)}</span></div>` : ""}` : `<div><span class="mut">${x.t("stillOpen")}</span></div>`}</div>`;
  let run = day.float;
  const rows = ms.map((m) => { run += m.kind === "in" ? m.amount : -m.amount; const sub = [m.party, m.account, m.note].filter(Boolean).map((s) => esc(s)).join(" · ");
    return `<tr><td class="nw">${x.time(m.at)}</td><td>${what(x, m)}${m.reversedBy || m.reverses ? ` <span class="s">(${x.t("reversed")})</span>` : ""}${sub || m.auto ? `<div class="s">${[m.auto ? x.t("auto") : "", sub].filter(Boolean).join(" · ")}</div>` : ""}</td><td class="mut">${m.ref ? code(x, m.ref) : "—"}</td><td>${esc(m.by)}</td><td class="r">${m.kind === "in" ? x.plain(m.amount) : ""}</td><td class="r">${m.kind === "out" ? x.plain(m.amount) : ""}</td><td class="r">${run < 0 ? "−" : ""}${x.plain(run)}</td></tr>`; }).join("");
  const lines = `<div class="lab" style="margin-top:4mm">${x.lb("movements")} (${x.num(ms.length)})</div><style>.zl td { padding: 1.1mm 2mm; font-size: .92em; } .zl th { padding: 1.6mm 2mm; } .zl .s { font-size: .86em; color: #6b7382; } .zsign { padding-top: 10mm; break-inside: avoid; } .zl tr { break-inside: avoid; }</style><table class="lines zl"><thead><tr><th style="width:13mm">${x.lb("time")}</th><th>${x.lb("what")}</th><th style="width:22mm">${x.lb("reference")}</th><th style="width:34mm">${x.lb("recordedBy")}</th><th class="r" style="width:19mm">${x.lb("cin")} (৳)</th><th class="r" style="width:19mm">${x.lb("cout")} (৳)</th><th class="r" style="width:21mm">${x.lb("runBal")} (৳)</th></tr></thead><tbody>
<tr><td></td><td>${x.t("openingFloat")}</td><td></td><td>${esc(day.openedBy)}</td><td></td><td></td><td class="r">${x.plain(day.float)}</td></tr>
${rows || `<tr><td></td><td class="mut" colspan="6">${x.t("noMoves")}</td></tr>`}</tbody></table>`;
  const stamp = closed ? `<span class="stamp ${diff === 0 ? "ok" : "due"}">${diffText}</span>` : `<span class="stamp due">${x.t("stillOpen").split(/[:：]/)[0]}</span>`;
  const info = `<div class="info">
<div><div class="lab">${x.lb("cashbox")}</div><div class="nm">${esc(drawer.name)}</div><div class="mut">${x.t("businessDate")}: ${x.date(day.date, true)}</div></div>
<div><div class="lab">${x.lb("openedBy")}</div><div class="kv"><span>${x.t("time")}</span><span>${x.date(day.openedAt)}, ${x.time(day.openedAt)}</span><span>${x.t("recordedBy")}</span><span>${esc(day.openedBy)}</span><span>${x.t("openingFloat")}</span><span>${x.money(day.float)}</span></div></div>
<div><div class="lab">${x.lb("closedBy")}</div>${closed ? `<div class="kv"><span>${x.t("time")}</span><span>${x.date(day.closedAt!)}, ${x.time(day.closedAt!)}</span><span>${x.t("recordedBy")}</span><span>${esc(day.closedBy)}</span><span>${x.t("counted")}</span><span>${x.money(day.counted ?? 0)}</span></div>` : `<div class="mut">${x.t("stillOpen")}</div>`}</div></div>`;
  const title = `<div class="title"><div><h1>${x.t("zReport")}</h1>${x.mix ? `<span class="bn" style="margin-top:1mm">${lang("bn").t("zReport")}</span>` : ""}<div class="mut" style="margin-top:1mm">${x.t("zShort")} · ${x.date(day.date)}</div></div><div>${stamp}</div></div>`;
  const printed = nowStamp();
  const body = `${header(H, d, x)}${title}${info}<div class="below" style="margin-top:0">${`<div>${breakdown("in")}${breakdown("out")}</div>`}${tot}</div>${lines}
<div class="sign zsign"><div>${x.t("cashierSign")}${closed ? ` · ${esc(day.closedBy)}` : ""}</div><div>${x.t("managerSign")}</div></div>${footer(`${esc(H.name)} · ${x.t("zShort")} ${x.date(day.date)} · ${x.t("printedAt")} ${x.date(printed)}, ${x.time(printed)}`)}`;
  return docPage(`${x.t("zShort")} ${day.date}`, d, body);
}
