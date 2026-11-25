// Printable booking documents on the doc-kit engine (A4): stay agreement, guest registration card (Bangladesh GRC),
// refund receipt / credit note, cancellation / no-show note, security deposit receipt.
// Every word and number comes from this hotel's Settings and the booking. Nothing is hard-coded per company:
// rules = Settings → Invoices & documents → Stay agreement + Bookings settings (times, cancellation, fees).
import type { Hotel } from "@/lib/types";
import type { Guest } from "@/lib/guests/store";
import { settingsOf } from "@/lib/settings/store";
import { channelLabel, nightsBetween, paidOf, policyFee, totalOf, type Booking, type Pay, type Settings } from "./store";
import { lang as docLang, docPage, header, footer, esc as kesc, type DocDesign, type DocHotel, type LKey } from "./doc-kit";
import { docsOf, designOf } from "./docs";

type X = ReturnType<typeof docLang>;
const BNX = docLang("bn");
const fill = (s: string, m: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => m[k] ?? "");
const BN_VAL: Record<string, string> = {
  Male: "পুরুষ", Female: "নারী", Other: "অন্যান্য", NID: "জাতীয় পরিচয়পত্র", Passport: "পাসপোর্ট", "Driving licence": "ড্রাইভিং লাইসেন্স", Bangladesh: "বাংলাদেশ",
  Holiday: "ছুটি", Business: "ব্যবসা", "Family visit": "পারিবারিক সফর", "Event / wedding": "অনুষ্ঠান / বিয়ে", Medical: "চিকিৎসা",
};

function ctx(h: Hotel) {
  const st = settingsOf(h); const p = st.profile; const docs = docsOf(h); const d = designOf(h); const x = docLang(d.lang);
  const H: DocHotel = { name: p.name || h.name, address: p.address || h.address || "", phone: p.phone || h.phone || "", email: p.email || h.email || "", bin: p.bin, logo: st.branding.logo, showLogo: docs.showLogo };
  /** A stored value (gender, ID type, purpose…) shown in Bangla when the document is Bangla. */
  const val = (v?: string) => kesc(x.bn && v ? BN_VAL[v] ?? v : v);
  const day = (iso?: string) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? x.date(iso) : kesc(iso));
  const dayTime = (at?: string) => (at && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(at) ? `${x.date(at)}, ${x.time(at)}` : day(at));
  return { st, docs, d, x, H, val, day, dayTime };
}

function extraCss(d: DocDesign, kind: "" | "grc" | "agr" = "") {
  const grc = kind === "grc";
  const a = d.accent;
  return `<style>
.intro { margin: -1mm 0 4mm; color: #3b4250; }
.cl { margin-top: 3.4mm; break-inside: avoid; } .cl h3 { font-size: .96em; font-weight: 600; margin-bottom: .8mm; color: #1c2230; } .cl h3 .n { color: ${a}; display: inline-block; min-width: 5mm; }
.cl h3 .bn { display: inline; margin-left: 4px; } .cl > div { color: #3b4250; padding-left: 5mm; } .cl ul { padding-left: 4.5mm; margin-top: .4mm; } .cl li { margin: .5mm 0; }
.wl { display: inline-block; min-width: 62mm; border-bottom: 1px solid #9aa1ad; height: 1.1em; vertical-align: bottom; }
.sec { margin-top: 4.2mm; } .sec > h3 { font-size: .76em; letter-spacing: .8px; text-transform: uppercase; font-weight: 600; color: ${a}; padding-bottom: 1.1mm; border-bottom: 1px solid #1c2230; }
.sec > h3 .bn { display: inline; margin-left: 4px; }
.fields { display: grid; grid-template-columns: 1fr 1fr; column-gap: 7mm; } .fields.c3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
.f { display: flex; flex-direction: column; justify-content: space-between; padding: 1.3mm 0 .7mm; border-bottom: 1px solid #cfd3da; min-height: 9.4mm; } .f.w { grid-column: 1 / -1; } .f.s2 { grid-column: span 2; }
.f .k { font-size: .74em; color: #7f8796; } .f .k .bn { display: inline; margin-left: 4px; } .f .v { font-weight: 500; min-height: 1.3em; }
.gt th { border-bottom: 1px solid #1c2230; color: #5b6372; padding: 1.3mm 2mm; } .gt td { height: 7.2mm; padding: 1.1mm 2mm; border-bottom: 1px solid #cfd3da; }
.ids { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; margin-top: 1.8mm; }
.idb { border: 1px dashed #b3b9c3; border-radius: 2mm; height: 38mm; display: flex; align-items: center; justify-content: center; color: #9aa1ad; font-size: .86em; overflow: hidden; position: relative; text-align: center; }
.idb .t { position: absolute; top: 1.4mm; left: 2.4mm; font-size: .82em; color: #7f8796; } .idb img { max-width: 100%; max-height: 100%; object-fit: contain; }
.decl { margin-top: 3.5mm; font-size: .9em; color: #3b4250; }
.amt { border: 1px solid #d8dce3; border-radius: 3mm; padding: 4mm 5mm; display: flex; justify-content: space-between; align-items: center; gap: 6mm; margin-bottom: 6mm; }
.amt .lab { margin-bottom: .8mm; } .amt b.v { font-size: 2.1em; font-weight: 600; color: ${a}; line-height: 1.1; white-space: nowrap; } .amt .words { margin-top: 1mm; } .amt p { color: #3b4250; max-width: 95mm; }
.stamp.nt { color: ${a}; border-color: ${a}; }
.pol p { margin: 0 0 1mm; color: #3b4250; } .pol .mut { font-size: .9em; }
.sign div b { color: #1c2230; font-weight: 600; } .sign { break-inside: avoid; } @media print { html { background: #fff; } }
${kind === "agr" ? `.sheet { padding-bottom: 8mm; ${d.template === "modern" ? "" : "padding-top: 12mm;"} } .info { margin-bottom: 3mm; } .info > div { padding-top: 2.4mm; padding-bottom: 2.4mm; } .title { margin-bottom: 3.5mm; } ${d.template === "modern" ? "" : ".title { margin-top: 5mm; }"} .intro { margin: 0 0 3mm; } .cl { margin-top: 2.3mm; } .sign { padding-top: 8mm; } .decl b { font-weight: 500; color: #1c2230; } .ft { margin-top: 4mm; } .decl { margin-top: 3mm; }` : ""}
${grc ? `.title { margin-top: 5mm; margin-bottom: 1mm; } .sec { margin-top: 3.2mm; } .f { min-height: 8.6mm; padding: 1mm 0 .5mm; } .gt td { height: 6.6mm; } .idb { height: 34mm; }
.sign { padding-top: 8mm; } .ft { margin-top: 4mm; } .ids.sm .idb { height: 27mm; }` : ""}
${d.lang === "bn" ? `.sec > h3 { letter-spacing: 0; text-transform: none; }` : ""}
</style>`;
}

/** Title row in the look of each template (same as the invoice). `bnText` = Bangla title, shown under the English one in Mix. */
function titleBlock(d: DocDesign, x: X, en: string, bnText: string, meta: string, stamp = "", big?: { label: string; value: string }) {
  const h1 = x.bn ? bnText || en : en; const sub = x.mix && bnText;
  if (d.template === "minimal") return `<div class="title"><div><h1>${h1}</h1>${sub ? `<span class="bn" style="margin-top:1mm">${bnText}</span>` : ""}<div class="mut" style="margin-top:1.5mm">${meta}</div></div><div class="big">${big ? `<div class="lab">${big.label}</div><b>${big.value}</b>` : ""}${stamp && !(big && stamp.includes(big.value)) ? `<div style="margin-top:1.5mm">${stamp}</div>` : ""}</div></div>`;
  if (d.template === "classic" || d.template === "elegant") return `<div class="title"><h1>${h1}</h1>${sub ? `<span class="bn" style="margin-top:1mm">${bnText}</span>` : ""}<div class="meta mut">${meta}</div>${stamp ? `<div style="margin-top:2mm">${stamp}</div>` : ""}</div>`;
  return `<div class="title"><h1>${h1}${sub ? `<span class="bn" style="font-size:.36em;margin-top:1.4mm;color:#828a98">${bnText}</span>` : ""}</h1><div class="r">${stamp}<div class="mut"${stamp ? ` style="margin-top:1.5mm"` : ""}>${meta}</div></div></div>`;
}
const tt = (k: LKey) => BNX.t(k);
const kv = (rows: [string, string][]) => `<div class="kv">${rows.filter(([, v]) => v).map(([k, v]) => `<span>${k}</span><span>${v}</span>`).join("")}</div>`;
const col = (x: X, k: LKey, inner: string) => `<div><div class="lab">${x.lb(k)}</div>${inner}</div>`;
const line = (label: string, value: string, cls = "") => `<div${cls ? ` class="${cls}"` : ""}><span>${label}</span><span class="nw">${value}</span></div>`;
const roomOf = (x: X, b: Booking) => `${b.unit ? `${x.num(kesc(b.unit))} · ` : ""}${kesc(b.type)}`;
const guestsOf = (x: X, b: Booking) => `${x.num(b.adults)} ${x.t("adults")}${b.children ? `, ${x.num(b.children)} ${x.t("children")}` : ""}`;
const guestCol = (x: X, b: Booking, g: Guest | undefined, k: LKey = "guest") => col(x, k, b.payer?.kind === "Company"
  ? `<div class="nm">${kesc(b.payer.name)}</div><div class="mut">${x.t("forGuest")}: ${kesc(g?.name)}</div>`
  : `<div class="nm">${kesc(g?.name)}</div><div class="mut">${x.num(kesc(g?.phone))}${g?.email ? `<br>${kesc(g.email)}` : ""}</div>`);
const bookingCol = (x: X, b: Booking, day: (s?: string) => string) => col(x, "booking", kv([[x.t("booking"), x.num(b.code)], [x.t("room"), roomOf(x, b)], [x.t("arrival"), day(b.from)], [x.t("departure"), day(b.to)], [x.t("nights"), `${x.num(b.nights.length)} · ${guestsOf(x, b)}`]]));
const received = (b: Booking) => b.payments.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0);
const refunded = (b: Booking) => -b.payments.filter((p) => p.amount < 0).reduce((s, p) => s + p.amount, 0);
const stampOf = (cls: "ok" | "due" | "nt", text: string) => `<span class="stamp ${cls}">${text}</span>`;

// ---------- 1. Stay agreement ----------
/** Stay agreement for the guest to sign. Title, opening line and house rules from Settings → Invoices & documents → Stay agreement;
 *  times, fees and cancellation from Bookings settings; money from the booking. */
export function agreementHtml(h: Hotel, b: Booking, g: Guest | undefined, s: Settings) {
  const { st, docs, d, x, H, day } = ctx(h); const c = docs.contract;
  const total = totalOf(b), paid = paidOf(b), due = Math.max(0, total - paid);
  const no = `AGR-${b.code.slice(3)}`;
  const isDefault = !c.title || c.title.trim().toLowerCase() === "stay agreement";
  const en = isDefault ? "Stay agreement" : kesc(c.title);
  const bnTitle = isDefault ? tt("stayAgreement") : "";
  const meta = `${x.t("docNo")} ${x.num(no)} · ${x.t("booking")} ${x.num(b.code)}`;
  const info = `<div class="info">${guestCol(x, b, g)}
${col(x, "stay", kv([[x.t("arrival"), day(b.from)], [x.t("departure"), day(b.to)], [x.t("room"), roomOf(x, b)], [x.t("nights"), `${x.num(b.nights.length)} · ${guestsOf(x, b)}`], [x.t("source"), kesc(channelLabel(b))]]))}
${col(x, "moneySummary", kv([[x.t("total"), x.money(total)], [x.t("advance"), x.money(paid)], [`<b>${x.t("balance")}</b>`, `<b>${x.money(due)}</b>`]]))}</div>`;
  const cl: [LKey, string][] = [];
  cl.push(["secCharges", `${fill(x.t("clCharges"), { total: x.money(total), tax: x.t("inclTax"), paid: x.money(paid), due: x.money(due) })} ${x.t("clExtras")}`]);
  const times = [fill(x.t("clTimes"), { in: x.num(kesc(s.checkIn)), out: x.num(kesc(s.checkOut)) })];
  if (s.earlyFee > 0 && st.policy.early !== "none" && st.policy.early !== "free") times.push(fill(x.t("clEarly"), { fee: x.money(s.earlyFee) }));
  if (s.lateFee > 0 && st.policy.late !== "none" && st.policy.late !== "free") times.push(fill(x.t("clLate"), { fee: x.money(s.lateFee) }));
  cl.push(["secTimes", times.join(" ")]);
  const pol = [s.freeCancelDays > 0 ? fill(x.t("clFree"), { n: x.num(s.freeCancelDays) }) : "", s.cancelFeePct > 0 ? fill(x.t("clLateCancel"), { p: x.num(s.cancelFeePct) }) : "", s.noShowFeePct > 0 ? fill(x.t("clNoShow"), { p: x.num(s.noShowFeePct) }) : ""].filter(Boolean);
  if (pol.length) cl.push(["secCancel", pol.join(" ")]);
  if (b.deposit && !b.deposit.settled) cl.push(["secDeposit", fill(x.t("clDeposit"), { a: x.money(b.deposit.amount), m: x.method(b.deposit.method) })]);
  // House rules: the agreement's own rules; if empty, the rules and policies the hotel publishes on its website.
  let rules = (c.rules ?? "").split(/\n+/).map((r) => r.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim()).filter(Boolean).map(kesc);
  if (!rules.length) rules = (h.houseRules ?? []).map((r) => `<b>${kesc(r.title)}:</b> ${kesc(r.text)}`);
  if (h.policies?.children) rules.push(`<b>${x.t("children2")}:</b> ${kesc(h.policies.children)}`);
  if (h.policies?.pets) rules.push(`<b>${x.t("pets")}:</b> ${kesc(h.policies.pets)}`);
  if (rules.length) cl.push(["secRules", `<ul>${rules.map((r) => `<li>${r}</li>`).join("")}</ul>`]);
  cl.push(["secId", `${x.t("clId")} ${g?.idNo ? `<b>${(g.idType ? `${kesc(x.bn ? BN_VAL[g.idType] ?? g.idType : g.idType)} ` : "")}${x.num(kesc(g.idNo))}</b>` : `<span class="wl"></span>`}`]);
  const clauses = cl.map(([k, body], i) => `<div class="cl"><h3><span class="n">${x.num(i + 1)}.</span>${x.lb(k)}</h3><div>${body}</div></div>`).join("");
  const body = `${extraCss(d, "agr")}${header(H, d, x)}${titleBlock(d, x, en, bnTitle, meta, "", d.template === "minimal" ? { label: x.lb("balance"), value: x.money(due) } : undefined)}
${c.intro ? `<p class="intro">${kesc(c.intro)}</p>` : ""}${info}${clauses}<p class="decl"><b>${x.t("clAccept")}</b></p>
<div class="sign"><div><b>${x.t("guestSign")}</b> · ${x.t("date")}<br>${kesc(g?.name)}</div><div><b>${x.t("forHotel")}</b> · ${x.t("date")}<br>${kesc(H.name)}</div></div>${footer(`${kesc(H.name)} · ${x.num(no)}`)}`;
  return docPage(`${isDefault ? x.t("stayAgreement") : c.title} ${no}`, d, body);
}

// ---------- 2. Guest registration card ----------
const imgSrc = (v?: string) => !!v && (/^data:image\//.test(v) || (/^(https?:)?\/\//.test(v) && !/\.pdf($|\?)/i.test(v)) || /^\/.+\.(png|jpe?g|webp|gif)$/i.test(v));

/** Bangladesh guest registration card: one A4. Empty fields stay as lines to write in by hand. */
export function regCardHtml(h: Hotel, b: Booking, g: Guest | undefined) {
  const { d, x, H, val, day, dayTime } = ctx(h);
  const no = `GRC-${b.code.slice(3)}`;
  const f = (k: LKey, v = "", span = 1) => `<div class="f${span > 1 ? " s2" : ""}"><span class="k">${x.lb(k)}</span><span class="v">${v || "&nbsp;"}</span></div>`;
  const foreign = g?.country !== "Bangladesh";
  const arrival = b.checkedInAt ? dayTime(b.checkedInAt) : `${day(b.from)}${b.eta ? `, ${x.num(kesc(b.eta))}` : ""}`;
  const guest = `<div class="sec"><h3>${x.lb("guestDetails")}</h3><div class="fields c3">
${f("fullName", kesc(g?.name), 2)}${f("nationality", val(g?.country))}${f("gender", val(g?.gender))}${f("dob", day(g?.dob))}${f("occupation", kesc(g?.occupation))}
${f("idType", val(g?.idType))}${f("idNo", x.num(kesc(g?.idNo)))}${f("phone", x.num(kesc(g?.phone)))}${f("email", kesc(g?.email))}${f("address", kesc(g?.address), 2)}
${f("comingFrom", kesc(b.comingFrom))}${f("goingTo", kesc(b.goingTo))}${f("purpose", val(b.purpose))}</div></div>`;
  const stay = `<div class="sec"><h3>${x.lb("stayDetails")}</h3><div class="fields c3">
${f("room", roomOf(x, b))}${f("arrivalAt", arrival)}${f("departure", day(b.to))}${f("persons", `${x.num(b.adults)} / ${x.num(b.children)}`)}${f("nights", x.num(b.nights.length))}${f("bookedVia", `${x.num(b.code)} · ${kesc(channelLabel(b))}`)}</div></div>`;
  const cs = b.companions ?? []; const rowsN = Math.min(6, Math.max(cs.length, b.adults + b.children - 1, 2));
  const comp = `<div class="sec"><h3>${x.lb("companions")}</h3><table class="gt"><thead><tr><th>${x.t("name")}</th><th style="width:52mm">${x.t("idType")} · ${x.t("idNo")}</th><th style="width:30mm">${x.t("relation")}</th><th style="width:16mm">${x.t("age")}</th></tr></thead><tbody>
${Array.from({ length: Math.max(rowsN, cs.length) }, (_, i) => cs[i]).map((c) => c ? `<tr><td>${kesc(c.name)}</td><td>${val(c.idType)} ${x.num(kesc(c.idNo))}</td><td>${kesc(c.relation)}</td><td>${x.num(kesc(c.age))}</td></tr>` : `<tr><td></td><td></td><td></td><td></td></tr>`).join("")}</tbody></table></div>`;
  const fx = foreign ? `<div class="sec"><h3>${x.lb("foreign")}</h3><div class="fields c3">${f("passportNo", g?.idType === "Passport" ? x.num(kesc(g.idNo)) : "")}${f("visaNo", kesc(g?.visaNo))}${f("visaExpiry", day(g?.visaExpiry))}</div></div>` : "";
  const box = (k: LKey, v?: string) => `<div class="idb"><span class="t">${x.t(k)}</span>${imgSrc(v) ? `<img src="${kesc(v)}" alt="">` : v ? `${x.t("onFile")}: ${kesc(v)}` : x.t("attachCopy")}</div>`;
  const ids = `<div class="sec"><h3>${x.lb("idCopies")}</h3><div class="ids${foreign ? " sm" : ""}">${box("idFront", g?.idFront)}${box("idBack", g?.idBack)}</div></div>`;
  const meta = `${x.t("docNo")} ${x.num(no)} · ${x.t("booking")} ${x.num(b.code)}`;
  const body = `${extraCss(d, "grc")}${header(H, d, x)}${titleBlock(d, x, x.bn ? "" : x.t("grc"), tt("grc"), meta, "", d.template === "minimal" && b.unit ? { label: x.lb("room"), value: x.num(kesc(b.unit)) } : undefined)}
${guest}${stay}${comp}${fx}${ids}<p class="decl">${x.t("grcDeclare")}</p>
<div class="sign"><div><b>${x.t("guestSign")}</b></div><div><b>${x.t("deskOfficer")}</b></div><div><b>${x.t("dateTime")}</b>${b.checkedInAt ? `<br>${dayTime(b.checkedInAt)}` : ""}</div></div>${footer(`${kesc(H.name)} · ${x.num(no)}`)}`;
  return docPage(`${x.t("grc")} ${no}`, d, body);
}

// ---------- 3. Refund receipt / credit note ----------
/** With a refund payment (amount < 0): refund receipt for that payment. Without: credit note for the refund still due on the booking. */
export function refundReceiptHtml(h: Hotel, b: Booking, g: Guest | undefined, p?: Pay) {
  const { d, x, H, day, dayTime } = ctx(h);
  const total = totalOf(b), paid = paidOf(b), rec = received(b), ref = refunded(b), refundDue = Math.max(0, paid - total), still = Math.max(0, total - paid);
  const isPay = !!p && p.amount < 0;
  const amount = isPay ? Math.abs(p!.amount) : refundDue;
  const k: LKey = isPay ? "refundReceipt" : "creditNote";
  const no = isPay ? `RFD-${p!.id.slice(-6).toUpperCase()}` : `CN-${b.code.slice(3)}`;
  const at = isPay ? p!.at : [b.cancel?.at, b.checkedOutAt, ...b.payments.map((q) => q.at)].filter((v): v is string => !!v).sort().pop();
  const stamp = isPay ? stampOf("ok", x.t("refunded")) : refundDue > 0 ? stampOf("due", `${x.t("refundDue")} ${x.money(refundDue)}`) : stampOf("nt", x.t("noRefund"));
  const meta = `${x.t(isPay ? "receiptNo" : "noteNo")} ${x.num(no)}${at ? ` · ${day(at)}` : ""}`;
  const status = b.status === "Cancelled" ? x.t("stCancelled") : b.status === "No-show" ? x.t("stNoShow") : "";
  const info = `<div class="info">${guestCol(x, b, g, "refundTo")}
${col(x, k, kv([[x.t(isPay ? "receiptNo" : "noteNo"), x.num(no)], [x.t("date"), dayTime(at)], ...(isPay ? [[x.t("method"), x.method(p!.method)], [x.t("reference"), kesc(p!.note)], [x.t("issuedBy"), kesc(p!.by)]] as [string, string][] : [])]))}
${bookingCol(x, b, day)}</div>`;
  const amt = `<div class="amt"><div><div class="lab">${x.lb(isPay ? "refundAmt" : "refundDue")}</div><b class="v">${x.money(amount)}</b><div class="words">${x.t("inWords")}: <b>${x.words(amount)}</b></div></div><p>${x.t(isPay ? "refundTxt" : "creditTxt")}${b.cancel ? `<br><span class="mut">${status} · ${x.t("reason")}: ${kesc(b.cancel.reason)}</span>` : ""}</p></div>`;
  const tot = `<div class="tot">${line(b.cancel ? x.t("feeKept") : x.t("bookingTotal"), x.money(total))}${line(x.t("received"), x.money(rec))}${ref ? line(x.t("refunded"), `− ${x.money(ref)}`) : ""}
${line(x.lb(refundDue > 0 || !still ? "refundDue" : "stillDue"), x.money(refundDue > 0 || !still ? refundDue : still), "due")}</div>`;
  const pays = b.payments.length ? `<div><div class="lab">${x.lb("payments")}</div><table class="pay"><thead><tr><th>${x.t("date")}</th><th>${x.t("method")}</th><th class="r">${x.t("amount")} (৳)</th></tr></thead><tbody>
${b.payments.map((q) => `<tr><td class="nw">${dayTime(q.at)}</td><td>${x.method(q.method)}${q.amount < 0 ? ` · ${x.t("refund")}` : ""}</td><td class="r">${q.amount < 0 ? "−" : ""}${x.plain(q.amount)}</td></tr>`).join("")}</tbody></table></div>` : "<div></div>";
  const body = `${extraCss(d)}${header(H, d, x)}${titleBlock(d, x, x.bn ? "" : x.t(k), tt(k), meta, stamp, d.template === "minimal" ? { label: x.lb(isPay ? "refundAmt" : "refundDue"), value: x.money(amount) } : undefined)}
${info}${d.template === "minimal" ? "" : amt}${d.template === "minimal" ? `<p class="words" style="margin:-3mm 0 5mm">${x.t("inWords")}: <b>${x.words(amount)}</b></p>` : ""}<div class="below">${pays}${tot}</div>
<div class="sign"><div><b>${x.t("issuedBy")}</b>${isPay && p!.by ? ` · ${kesc(p!.by)}` : ""}</div><div><b>${x.t("receivedBy")}</b> · ${x.t("guestSign")}</div></div>${footer(`${kesc(H.name)} · ${x.num(no)}`)}`;
  return docPage(`${x.t(k)} ${no}`, d, body);
}

// ---------- 4. Cancellation / no-show note ----------
/** What was cancelled, when and why, the policy that applied, the fee kept, what was paid and the refund due. */
export function cancellationNoteHtml(h: Hotel, b: Booking, g: Guest | undefined, s: Settings) {
  const { d, x, H, day, dayTime } = ctx(h);
  const noShow = b.status === "No-show"; const kind = noShow ? "No-show" : "Cancelled";
  const k: LKey = noShow ? "noShowNote" : "cancelNote";
  const no = `CXL-${b.code.slice(3)}`; const c = b.cancel;
  const keep = c?.keep ?? 0, paid = paidOf(b), rec = received(b), ref = refunded(b);
  const refundDue = Math.max(0, paid - keep), still = Math.max(0, keep - paid);
  const holdOnly = !!c && /hold/i.test(c.reason);
  const byPolicy = c && !holdOnly ? policyFee(b, kind, s, c.at.slice(0, 10)) : undefined;
  const daysBefore = c && !noShow ? nightsBetween(c.at.slice(0, 10), b.from) : undefined;
  const stamp = stampOf(refundDue > 0 ? "due" : "nt", refundDue > 0 ? `${x.t("refundDue")} ${x.money(refundDue)}` : x.t(noShow ? "stNoShow" : "stCancelled"));
  const meta = `${x.t("noteNo")} ${x.num(no)}${c ? ` · ${day(c.at)}` : ""}`;
  const info = `<div class="info">${guestCol(x, b, g)}${bookingCol(x, b, day)}
${col(x, "whatHappened", kv([[x.t("status"), x.t(noShow ? "stNoShow" : "stCancelled")], [x.t("recordedAt"), dayTime(c?.at)], [x.t("daysBefore"), daysBefore !== undefined && daysBefore >= 0 ? x.num(daysBefore) : ""], [x.t("source"), kesc(channelLabel(b))]]))}</div>`;
  const rules = noShow ? [s.noShowFeePct > 0 ? fill(x.t("clNoShow"), { p: x.num(s.noShowFeePct) }) : ""] : [s.freeCancelDays > 0 ? fill(x.t("clFree"), { n: x.num(s.freeCancelDays) }) : "", s.cancelFeePct > 0 ? fill(x.t("clLateCancel"), { p: x.num(s.cancelFeePct) }) : ""];
  const pol = `<div class="pol"><div class="lab">${x.lb("policyApplied")}</div><p><b>${x.t(noShow ? "cancelTxtN" : "cancelTxtC")}</b></p>
${c?.reason ? `<p>${x.t("reason")}: ${kesc(c.reason)}</p>` : ""}${holdOnly ? "" : rules.filter(Boolean).map((r) => `<p>${r}</p>`).join("")}
${byPolicy !== undefined && byPolicy !== keep ? `<p class="mut">${x.t("feeByPolicy")}: ${x.money(byPolicy)}. ${x.t("feeAdjusted")}</p>` : ""}</div>`;
  const tot = `<div><div class="lab">${x.lb("settlement")}</div><div class="tot">${line(x.t("feeKept"), x.money(keep), "g")}${line(x.t("received"), x.money(rec))}${ref ? line(x.t("refunded"), `− ${x.money(ref)}`) : ""}
${still > 0 ? line(x.lb("stillDue"), x.money(still), "due") : line(x.lb("refundDue"), x.money(refundDue), "due")}</div></div>`;
  const body = `${extraCss(d)}${header(H, d, x)}${titleBlock(d, x, x.bn ? "" : x.t(k), tt(k), meta, stamp, d.template === "minimal" ? { label: x.lb(still > 0 ? "stillDue" : "refundDue"), value: x.money(still > 0 ? still : refundDue) } : undefined)}
${info}<div class="below">${pol}${tot}</div>
<div class="sign"><div><b>${x.t("issuedBy")}</b> · ${x.t("frontDesk")}</div><div><b>${x.t("guestSign")}</b></div></div>${footer(`${kesc(H.name)} · ${x.num(no)}`)}`;
  return docPage(`${x.t(k)} ${no}`, d, body);
}

// ---------- 5. Security deposit receipt ----------
/** Deposit held / returned / used for the bill, from booking.deposit. */
export function depositReceiptHtml(h: Hotel, b: Booking, g: Guest | undefined) {
  const { d, x, H, day, dayTime } = ctx(h);
  const dep = b.deposit; const no = `DEP-${b.code.slice(3)}`; const st = dep?.settled;
  const used = st?.used ?? 0, ret = st?.returned ?? 0, held = dep ? (st ? 0 : dep.amount) : 0;
  const [cls, label]: ["ok" | "nt", string] = !dep ? ["nt", x.t("noDeposit")] : !st ? ["nt", x.t("stHeld")] : used && ret ? ["ok", x.t("stPart")] : used ? ["ok", x.t("stUsed")] : ["ok", x.t("stReturned")];
  const meta = `${x.t("receiptNo")} ${x.num(no)}${dep ? ` · ${day(dep.at)}` : ""}`;
  const info = `<div class="info">${guestCol(x, b, g)}${bookingCol(x, b, day)}
${col(x, "secDeposit", dep ? kv([[x.t("date"), dayTime(dep.at)], [x.t("method"), x.method(dep.method)], [x.t("status"), label], [x.t("settledAt"), st ? dayTime(st.at) : ""]]) : `<p class="mut">${x.t("noDeposit")}</p>`)}</div>`;
  const amount = dep?.amount ?? 0;
  const amt = `<div class="amt"><div><div class="lab">${x.lb("depAmount")}</div><b class="v">${x.money(amount)}</b><div class="words">${x.t("inWords")}: <b>${x.words(amount)}</b></div></div><p>${x.t("depNote")}${dep && !st ? `<br><span class="mut">${x.t("depKeep")}</span>` : ""}</p></div>`;
  const tot = dep ? `<div class="tot">${line(x.t("depAmount"), x.money(amount))}${st ? `${line(x.t("depUsed"), `− ${x.money(used)}`)}${line(x.t("depReturned"), `− ${x.money(ret)}`)}` : ""}${line(x.lb("depHeld"), x.money(held), "due")}</div>` : "";
  const body = `${extraCss(d)}${header(H, d, x)}${titleBlock(d, x, x.bn ? "" : x.t("depositReceipt"), tt("depositReceipt"), meta, stampOf(cls, label), d.template === "minimal" ? { label: x.lb("depAmount"), value: x.money(amount) } : undefined)}
${info}${d.template === "minimal" ? "" : amt}<div class="below"><div>${d.template === "minimal" ? `<p class="pol">${x.t("depNote")}${dep && !st ? ` ${x.t("depKeep")}` : ""}</p>` : ""}</div>${tot}</div>
<div class="sign"><div><b>${x.t("receivedBy")}</b> · ${x.t("frontDesk")}</div><div><b>${x.t("guestSign")}</b></div></div>${footer(`${kesc(H.name)} · ${x.num(no)}`)}`;
  return docPage(`${x.t("depositReceipt")} ${no}`, d, body);
}
