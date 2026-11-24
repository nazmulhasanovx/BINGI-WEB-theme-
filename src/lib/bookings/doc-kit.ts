// Document kit: one engine for every printable A4 document (invoice first; confirmation, agreement, receipts next).
// Settings → Invoices & documents → Design picks the template, colour, language and text size.
// Printed through the browser (Save as PDF works). Fonts: IBM Plex Sans, Playfair Display (Elegant), Noto Sans Bengali.

export type DocTemplate = "folio" | "classic" | "modern" | "elegant" | "compact" | "minimal";
export type DocLang = "en" | "bn" | "mix";
export type DocDesign = { template: DocTemplate; accent: string; logoSize: "S" | "M" | "L"; lang: DocLang; textSize: "S" | "M" | "L" };
export const DEFAULT_DESIGN: DocDesign = { template: "folio", accent: "#0E4C6B", logoSize: "M", lang: "mix", textSize: "M" };

export const DOC_TEMPLATES: { v: DocTemplate; label: string; hint: string }[] = [
  { v: "folio", label: "Folio", hint: "Like a big-hotel guest folio: boxes, night-by-night table, total in colour." },
  { v: "classic", label: "Classic", hint: "Logo and name centred, fine lines. Formal and calm." },
  { v: "modern", label: "Modern", hint: "Colour band across the top with your logo. Business and city hotels." },
  { v: "elegant", label: "Elegant", hint: "Serif headings, centred, lots of air. Resorts and boutique stays." },
  { v: "compact", label: "Compact", hint: "Tight rows, most bills on one page. Guest houses and busy desks." },
  { v: "minimal", label: "Minimal", hint: "Amount due large at the top, almost no lines. Clean and modern." },
];
export const DOC_ACCENTS = ["#0E4C6B", "#B11C29", "#1B1F27", "#0F5C4D", "#1E4E8C", "#8A5A12", "#5B2A86", "#B4532A"];

/** Old saved settings: template names and "en-bn" from v1. */
export function normaliseDesign(raw?: object): DocDesign {
  const d = (raw ?? {}) as Partial<Record<keyof DocDesign, string>>;
  const t = (DOC_TEMPLATES.some((x) => x.v === d.template) ? d.template : DEFAULT_DESIGN.template) as DocTemplate;
  const lang = (d.lang === "en-bn" ? "mix" : d.lang === "en" || d.lang === "bn" || d.lang === "mix" ? d.lang : DEFAULT_DESIGN.lang) as DocLang;
  return { accent: d.accent || DEFAULT_DESIGN.accent, template: t, lang, textSize: (d.textSize as DocDesign["textSize"]) || "M", logoSize: (d.logoSize as DocDesign["logoSize"]) || "M" };
}

// ---------- language ----------
const L = {
  invoice: ["Invoice", "ইনভয়েস"], billedTo: ["Billed to", "বিল প্রাপক"], invoiceNo: ["Invoice no.", "ইনভয়েস নং"], date: ["Date", "তারিখ"],
  booking: ["Booking", "বুকিং"], source: ["Source", "উৎস"], stay: ["Stay", "অবস্থান"], arrival: ["Arrival", "আগমন"], departure: ["Departure", "প্রস্থান"],
  room: ["Room", "কক্ষ"], nights: ["Nights", "রাত"], guests: ["Guests", "অতিথি"], description: ["Description", "বিবরণ"], qty: ["Qty", "পরিমাণ"],
  rate: ["Rate", "দর"], amount: ["Amount", "টাকা"], roomCharges: ["Room charges", "কক্ষ ভাড়া"], discount: ["Discount", "ছাড়"],
  service: ["Service charge", "সার্ভিস চার্জ"], vat: ["VAT", "ভ্যাট"], onRoomService: ["on room + service", "কক্ষ ভাড়া ও সার্ভিসের উপর"],
  extras: ["Other charges", "অন্যান্য চার্জ"], total: ["Total", "মোট"], paid: ["Paid", "পরিশোধিত"], balance: ["Balance due", "বাকি"],
  payments: ["Payments received", "প্রাপ্ত পরিশোধ"], method: ["Method", "মাধ্যম"], reference: ["Reference", "রেফারেন্স"], refund: ["Refund", "ফেরত"],
  inWords: ["Amount in words", "কথায়"], notes: ["Notes", "নোট"], preparedBy: ["Prepared by", "প্রস্তুতকারী"], guestSign: ["Guest signature", "অতিথির স্বাক্ষর"],
  authSign: ["Authorised signature & seal", "অনুমোদিত স্বাক্ষর ও সিল"], page: ["Page", "পৃষ্ঠা"], stPaid: ["Paid", "পরিশোধিত"], stDue: ["Due", "বাকি আছে"],
  amountDue: ["Amount due", "পরিশোধযোগ্য"], night: ["night", "রাত"], adults: ["adults", "প্রাপ্তবয়স্ক"], children: ["children", "শিশু"],
  computer: ["Computer-generated invoice. No signature needed unless stamped.", "কম্পিউটারে তৈরি ইনভয়েস। সিল ছাড়া স্বাক্ষরের প্রয়োজন নেই।"],
  checkTimes: ["Check-in", "চেক-ইন"], checkOut: ["check-out", "চেক-আউট"], frontDesk: ["Front desk", "ফ্রন্ট ডেস্ক"], noPay: ["No payment yet.", "এখনো কোনো পরিশোধ নেই।"],
  bin: ["BIN", "বিআইএন"], company: ["Company", "প্রতিষ্ঠান"], forGuest: ["for guest", "অতিথি"],
  // ---- docs-register.ts: guest register, Form-C, night audit, company invoice, restaurant bill ----
  guestRegister: ["Guest register", "অতিথি রেজিস্টার"], formC: ["Foreign guests · Form-C", "বিদেশি অতিথি · ফর্ম-সি"], nightOf: ["Night of", "রাত"],
  sn: ["S/N", "ক্রম"], guest: ["Guest", "অতিথি"], nationality: ["Nationality", "জাতীয়তা"], idDoc: ["ID type & no.", "পরিচয়পত্র ও নম্বর"],
  address: ["Address", "ঠিকানা"], phone: ["Phone", "ফোন"], adCh: ["Ad / Ch", "বড় / শিশু"], comingFrom: ["Coming from", "যেখান থেকে"],
  goingTo: ["Going to", "যেখানে যাবেন"], purpose: ["Purpose", "উদ্দেশ্য"], missing: ["Missing", "নেই"], roomsOcc: ["Rooms occupied", "ভাড়া হওয়া কক্ষ"],
  persons: ["Persons", "মোট ব্যক্তি"], foreign: ["Foreign guests", "বিদেশি অতিথি"], noId: ["Without ID no.", "পরিচয়পত্র নম্বর নেই"],
  managerSign: ["Manager signature", "ম্যানেজারের স্বাক্ষর"], managerSeal: ["Manager signature & seal", "ম্যানেজারের স্বাক্ষর ও সিল"], seal: ["Hotel seal", "হোটেলের সিল"],
  passport: ["Passport no.", "পাসপোর্ট নং"], visaNo: ["Visa no.", "ভিসা নং"], visaExp: ["Visa valid until", "ভিসার মেয়াদ"], dob: ["Date of birth", "জন্ম তারিখ"],
  nextDest: ["Next destination", "পরবর্তী গন্তব্য"], expired: ["Expired", "মেয়াদোত্তীর্ণ"], notPassport: ["not a passport", "পাসপোর্ট নয়"],
  noForeign: ["No foreign guests on this date.", "এই তারিখে কোনো বিদেশি অতিথি নেই।"], noGuests: ["No guests in house on this date.", "এই তারিখে কোনো অতিথি নেই।"],
  checkFormat: ["Check the Form-C format your police station needs before submitting.", "জমা দেওয়ার আগে থানার নির্ধারিত ফর্ম-সি ফরম্যাট মিলিয়ে নিন।"],
  male: ["Male", "পুরুষ"], female: ["Female", "নারী"], other: ["Other", "অন্যান্য"], printed: ["Printed", "মুদ্রণ"], visaMissing: ["Visa details missing", "ভিসার তথ্য নেই"],
  nightAudit: ["Night audit", "নাইট অডিট"], dayClose: ["Day close report", "দিন সমাপ্তির রিপোর্ট"], businessDate: ["Business date", "ব্যবসার তারিখ"],
  occupancy: ["Occupancy", "অকুপেন্সি"], roomsTotal: ["Rooms", "মোট কক্ষ"], sold: ["Sold", "বিক্রিত"], forSale: ["Available", "বিক্রয়যোগ্য"],
  ooo: ["Out of order", "অকেজো"], occPct: ["Occupancy", "অকুপেন্সি"], adr: ["ADR", "গড় দৈনিক ভাড়া"], revpar: ["RevPAR", "কক্ষপ্রতি আয়"],
  movement: ["Guest movement", "অতিথি চলাচল"], arrivals: ["Arrivals", "আগমন"], departures: ["Departures", "প্রস্থান"], inHouse: ["In house", "অবস্থানরত"],
  noShows: ["No-shows", "নো-শো"], notArrived: ["Not arrived", "আসেননি"], revenue: ["Revenue", "আয়"], roomRev: ["Room revenue", "কক্ষ ভাড়া"],
  fnb: ["Restaurant & bar", "রেস্টুরেন্ট ও বার"], services: ["Services", "সার্ভিস"], net: ["Net", "নিট"], orders: ["orders", "অর্ডার"],
  collections: ["Collections by method", "মাধ্যম অনুযায়ী আদায়"], roomBills: ["Room bills", "কক্ষ বিল"], outstanding: ["Outstanding · in house", "বকেয়া · অবস্থানরত"],
  overdue: ["Overdue departures", "বিলম্বিত চেক-আউট"], dueOut: ["Due out", "যাওয়ার কথা"], none: ["None.", "নেই।"], closedAt: ["Day closed", "দিন বন্ধ হয়েছে"],
  notClosed: ["Day not closed yet", "দিন এখনো বন্ধ হয়নি"], by: ["by", "করেছেন"], inclVat: ["entered including VAT", "ভ্যাটসহ লেখা"],
  adrNote: ["Room revenue is after discount, before service charge and VAT. ADR = room revenue ÷ rooms sold. RevPAR = room revenue ÷ rooms available.", "কক্ষ ভাড়া ছাড়ের পরে, সার্ভিস চার্জ ও ভ্যাটের আগে। গড় ভাড়া = কক্ষ ভাড়া ÷ বিক্রিত কক্ষ। কক্ষপ্রতি আয় = কক্ষ ভাড়া ÷ বিক্রয়যোগ্য কক্ষ।"],
  companyInvoice: ["Company invoice", "প্রতিষ্ঠানের ইনভয়েস"], stays: ["Stays", "অবস্থান"], bookings: ["Bookings", "বুকিং"], roomNights: ["Room nights", "কক্ষ-রাত"],
  cancelFee: ["Cancellation fee", "বাতিল ফি"], noShowFee: ["No-show fee", "নো-শো ফি"], contact: ["Contact", "যোগাযোগ"], ref: ["Ref.", "রেফারেন্স"],
  restaurantBill: ["Restaurant bill", "রেস্টুরেন্ট বিল"], order: ["Order", "অর্ডার"], item: ["Item", "আইটেম"], subtotal: ["Subtotal", "উপমোট"],
  toRoom: ["Charged to room bill", "কক্ষ বিলে যোগ হয়েছে"], dineIn: ["Dine-in", "ডাইন-ইন"], roomService: ["Room service", "রুম সার্ভিস"],
  takeaway: ["Takeaway", "টেকঅ্যাওয়ে"], delivery: ["Delivery", "ডেলিভারি"], table: ["Table", "টেবিল"], outlet: ["Outlet", "আউটলেট"], period: ["Period", "সময়কাল"],
} as const;
export type LKey = keyof typeof L;
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnNum = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
const MON_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MON_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_BN = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
const METHOD_BN: Record<string, string> = { Cash: "নগদ", bKash: "বিকাশ", Card: "কার্ড", Bank: "ব্যাংক", Nagad: "নগদ (মোবাইল)" };

const ONES_EN = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS_EN = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const BN_0_99 = "শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ বিশ একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আটাশ ঊনত্রিশ ত্রিশ একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ ঊনচল্লিশ চল্লিশ একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ ঊনপঞ্চাশ পঞ্চাশ একান্ন বায়ান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন ঊনষাট ষাট একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি ঊনসত্তর সত্তর একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর ঊনআশি আশি একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি আটাশি ঊননব্বই নব্বই একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই".split(" ");

/** Language helpers for one document. */
export function lang(l: DocLang) {
  const bn = l === "bn";
  const t = (k: LKey) => (bn ? L[k][1] : L[k][0]);
  /** Label with a small Bangla line under/after it in Mix mode. */
  const lb = (k: LKey) => (l === "mix" ? `${L[k][0]}<span class="bn">${L[k][1]}</span>` : t(k));
  const num = (s: string | number) => (bn ? bnNum(String(s)) : String(s));
  const money = (n: number) => num(`৳${new Intl.NumberFormat("en-IN").format(Math.round(Math.abs(n)))}`);
  const plain = (n: number) => num(new Intl.NumberFormat("en-IN").format(Math.round(Math.abs(n))));
  const date = (iso: string, withDow = false) => {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`); const day = iso.slice(8, 10), m = Number(iso.slice(5, 7)) - 1, y = iso.slice(0, 4);
    if (bn) return `${withDow ? `${DOW_BN[d.getUTCDay()]}বার, ` : ""}${bnNum(day)} ${MON_BN[m]} ${bnNum(y)}`;
    return `${withDow ? `${DOW_EN[d.getUTCDay()]} ` : ""}${day} ${MON_EN[m]} ${y}`;
  };
  const time = (at: string) => { const [H, M] = at.slice(11, 16).split(":").map(Number); return num(`${String(H).padStart(2, "0")}:${String(M).padStart(2, "0")}`); };
  const method = (m: string) => (bn ? METHOD_BN[m] ?? m : m);
  const words = (n: number) => (bn ? wordsBn(Math.round(Math.abs(n))) : wordsEn(Math.round(Math.abs(n))));
  return { bn, mix: l === "mix", t, lb, num, money, plain, date, time, method, words };
}
function w2en(n: number) { return n < 20 ? ONES_EN[n] : TENS_EN[Math.floor(n / 10)] + (n % 10 ? `-${ONES_EN[n % 10]}` : ""); }
function w3en(n: number) { return n >= 100 ? `${ONES_EN[Math.floor(n / 100)]} hundred${n % 100 ? ` ${w2en(n % 100)}` : ""}` : w2en(n); }
function wordsEn(n: number) {
  if (!n) return "Zero taka only"; const out: string[] = [];
  for (const [div, name] of [[1e7, "crore"], [1e5, "lakh"], [1e3, "thousand"]] as const) if (n >= div) { out.push(`${w3en(Math.floor(n / div))} ${name}`); n %= div; }
  if (n) out.push(w3en(n)); const s = out.join(" "); return `${s[0].toUpperCase()}${s.slice(1)} taka only`;
}
function w3bn(n: number) { return n >= 100 ? `${BN_0_99[Math.floor(n / 100)]} শত${n % 100 ? ` ${BN_0_99[n % 100]}` : ""}` : BN_0_99[n]; }
function wordsBn(n: number) {
  if (!n) return "শূন্য টাকা মাত্র"; const out: string[] = [];
  for (const [div, name] of [[1e7, "কোটি"], [1e5, "লক্ষ"], [1e3, "হাজার"]] as const) if (n >= div) { out.push(`${w3bn(Math.floor(n / div))} ${name}`); n %= div; }
  if (n) out.push(w3bn(n)); return `${out.join(" ")} টাকা মাত্র`;
}

// ---------- look ----------
const esc = (s: string | undefined | null) => (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export { esc };
const SIZE = { S: 0.9, M: 1, L: 1.12 } as const;
const LOGO = { S: 11, M: 15, L: 20 } as const; // mm
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600&family=Noto+Sans+Bengali:wght@400;500;600&display=swap">`;

function css(d: DocDesign) {
  const a = d.accent; const k = SIZE[d.textSize];
  const base = `@page { size: A4; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
html { background: #e9ecf0; } body { font-family: ${d.lang === "bn" ? `"Noto Sans Bengali", "IBM Plex Sans"` : `"IBM Plex Sans", "Noto Sans Bengali"`}, Arial, sans-serif; color: #1c2230; font-size: ${(9.4 * k).toFixed(2)}pt; line-height: 1.45; font-feature-settings: "tnum" 1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 16mm 17mm 12mm; display: flex; flex-direction: column; position: relative; }
@media screen { .sheet { margin: 6mm auto; box-shadow: 0 2px 18px rgba(20,30,50,.12); } }
.bn { display: block; font-family: "Noto Sans Bengali", sans-serif; font-weight: 400; color: #828a98; font-size: .8em; letter-spacing: 0; text-transform: none; line-height: 1.25; }
.lab .bn, th .bn, .il .bn, .tot .bn { display: inline; margin-left: 4px; }
.mut { color: #5b6372; } .r { text-align: right; white-space: nowrap; } .c { text-align: center; } .nw { white-space: nowrap; }
.hd { display: flex; justify-content: space-between; align-items: flex-start; gap: 10mm; }
.logo img { height: ${LOGO[d.logoSize]}mm; max-width: ${LOGO[d.logoSize] * 4}mm; object-fit: contain; display: block; }
.mono { display: inline-grid; place-items: center; width: ${LOGO[d.logoSize]}mm; height: ${LOGO[d.logoSize]}mm; border-radius: 50%; border: 1.5px solid ${a}; color: ${a}; font-weight: 600; font-size: ${(LOGO[d.logoSize] * 1.05).toFixed(1)}pt; letter-spacing: .5px; }
.addr { font-size: .9em; color: #4e5666; line-height: 1.55; } .addr b { display: block; color: #1c2230; font-size: 1.14em; font-weight: 600; margin-bottom: 1px; }
.title h1 { font-weight: 600; line-height: 1; color: ${a}; }
.lab { font-size: .74em; letter-spacing: .9px; text-transform: uppercase; color: #7f8796; font-weight: 600; margin-bottom: 1.6mm; }
.nm { font-size: 1.16em; font-weight: 600; margin-bottom: 1px; }
.kv { display: grid; grid-template-columns: auto 1fr; column-gap: 4mm; row-gap: 1px; font-size: .92em; white-space: nowrap; } .kv > span:nth-child(odd) { color: #6b7382; }
table { width: 100%; border-collapse: collapse; font-size: inherit; }
th { font-size: .76em; letter-spacing: .8px; text-transform: uppercase; font-weight: 600; text-align: left; padding: 2.2mm 2.6mm; }
td { padding: 2.2mm 2.6mm; border-bottom: 1px solid #e6e9ee; vertical-align: top; }
.below { display: grid; grid-template-columns: minmax(0,1fr) 74mm; gap: 9mm; margin-top: 5mm; align-items: start; }
.tot > div { display: flex; justify-content: space-between; gap: 4mm; padding: 1.3mm 2.6mm; }
.tot .g { font-weight: 600; font-size: 1.2em; } .tot .due { font-weight: 600; border-top: 1px solid #1c2230; margin-top: 1mm; padding-top: 2mm; }
.words { font-size: .9em; color: #4e5666; margin-top: 2.5mm; } .words b { color: #1c2230; font-weight: 600; }
.pay td { font-size: .9em; padding: 1.7mm 2mm; } .pay th { color: #7f8796; border-bottom: 1px solid #1c2230; padding: 1.6mm 2mm; background: none; }
.notes { font-size: .86em; color: #4e5666; margin-top: 6mm; line-height: 1.55; } .notes b { color: #1c2230; }
.thanks { font-size: .92em; color: ${a}; font-weight: 500; margin-top: 5mm; }
.sign { display: flex; gap: 14mm; margin-top: auto; padding-top: 12mm; } .sign div { flex: 1; border-top: 1px solid #1c2230; padding-top: 1.6mm; font-size: .82em; color: #6b7382; }
.ft { margin-top: 7mm; padding-top: 3mm; border-top: 1px solid #d8dce3; display: flex; justify-content: space-between; gap: 6mm; font-size: .78em; color: #8a919e; }
.stamp { display: inline-block; border: 1.4px solid; font-weight: 700; font-size: .84em; letter-spacing: 1.6px; padding: 3px 10px; border-radius: 3px; text-transform: uppercase; }
.stamp.ok { color: #1f7a4a; border-color: #1f7a4a; } .stamp.due { color: #B11C29; border-color: #B11C29; }
.info { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); margin-bottom: 7mm; } .info > div { padding: 3.2mm 4mm; }`;
  const T: Record<DocTemplate, string> = {
    folio: `.sheet::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3.2mm; background: ${a}; }
.title { display: flex; justify-content: space-between; align-items: flex-end; margin: 11mm 0 6mm; padding-bottom: 3.5mm; border-bottom: 1.4px solid #1c2230; } .title h1 { font-size: 2.55em; letter-spacing: .5px; }
.info { border: 1px solid #d8dce3; border-radius: 4px; } .info > div + div { border-left: 1px solid #d8dce3; }
.lines th { background: #1c2230; color: #fff; } .lines tbody tr:nth-child(even) td { background: #f7f8fa; }
.tot .g { background: ${a}; color: #fff; padding: 2.6mm; border-radius: 3px; margin: 1.5mm 0; } .tot .g .bn { color: rgba(255,255,255,.75); display: inline; margin-left: 5px; }
.addr { text-align: right; }`,
    classic: `.hd { flex-direction: column; align-items: center; text-align: center; gap: 3mm; } .addr { text-align: center; }
.title { text-align: center; margin: 7mm 0 6mm; padding: 3mm 0; border-top: 1px solid #1c2230; border-bottom: 1px solid #1c2230; } .title h1 { font-size: 1.9em; letter-spacing: 5px; text-transform: uppercase; } .title .meta { margin-top: 1.5mm; }
.info > div + div { border-left: 1px solid #e1e4e9; } .lines th { border-bottom: 1px solid #1c2230; color: #5b6372; }
.tot .g { border-top: 1px solid #1c2230; padding-top: 2.2mm; color: ${a}; }`,
    modern: `.sheet { padding-top: 0; } .band { margin: 0 -17mm 9mm; padding: 9mm 17mm 8mm; background: ${a}; color: #fff; display: flex; justify-content: space-between; align-items: center; gap: 8mm; }
.band .logo { background: #fff; border-radius: 3mm; padding: 2.5mm 3.5mm; } .band .addr, .band .addr b { color: #fff; } .band .addr { text-align: right; opacity: .92; }
.title { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6mm; } .title h1 { font-size: 2.3em; color: #1c2230; }
.info { background: #f5f7f9; border-radius: 3mm; } .lines th { color: ${a}; border-bottom: 1.6px solid ${a}; }
.tot .g { color: ${a}; border-top: 1.6px solid ${a}; padding-top: 2.4mm; } .mono { border-color: ${a}; }`,
    elegant: `.hd { flex-direction: column; align-items: center; text-align: center; gap: 2.5mm; } .addr { text-align: center; letter-spacing: .2px; } .addr b { font-family: "Playfair Display", serif; font-size: 1.6em; font-weight: 500; letter-spacing: .3px; }
.title { text-align: center; margin: 8mm 0 7mm; } .title h1 { font-family: "Playfair Display", serif; font-weight: 500; font-size: 2.2em; letter-spacing: 1.5px; }
.title::after { content: ""; display: block; width: 22mm; height: 1px; background: ${a}; margin: 3mm auto 0; }
.info > div { text-align: center; } .info .kv { justify-content: center; } .lab { color: ${a}; }
.lines th { border-top: 1px solid #1c2230; border-bottom: 1px solid #1c2230; color: #5b6372; } td { border-bottom-color: #eef0f3; }
.tot .g { font-family: "Playfair Display", serif; font-weight: 600; border-top: 1px solid #1c2230; border-bottom: 1px solid #1c2230; padding: 2.4mm 2.6mm; color: ${a}; }
.thanks { text-align: center; font-family: "Playfair Display", serif; font-style: italic; font-size: 1.05em; }`,
    compact: `.sheet { padding: 12mm 14mm 10mm; } .addr { text-align: right; } .title { display: flex; justify-content: space-between; align-items: center; margin: 5mm 0 4mm; padding-bottom: 2.5mm; border-bottom: 1.2px solid #1c2230; }
.title h1 { font-size: 1.65em; letter-spacing: 2px; text-transform: uppercase; } .info { margin-bottom: 4mm; } .info > div { padding: 1mm 0; }
td { padding: 1.4mm 2mm; } th { padding: 1.6mm 2mm; } .lines th { border-bottom: 1px solid #1c2230; color: #5b6372; } .below { margin-top: 3mm; } .tot > div { padding: .8mm 2mm; }
.tot .g { border-top: 1px solid #1c2230; padding-top: 1.6mm; color: ${a}; } .sign { padding-top: 9mm; } .notes { margin-top: 4mm; }`,
    minimal: `.addr { text-align: right; } .title { display: grid; grid-template-columns: 1fr auto; align-items: end; margin: 13mm 0 9mm; }
.title h1 { font-size: 1.15em; color: #5b6372; font-weight: 500; letter-spacing: 3px; text-transform: uppercase; } .big { text-align: right; } .big .lab { margin-bottom: .5mm; } .big b { font-size: 2.6em; font-weight: 600; color: ${a}; line-height: 1.05; }
.info > div { padding: 0 6mm 0 0; } .lines th { color: #7f8796; border-bottom: 1px solid #dfe2e7; } td { border-bottom-color: #f0f1f4; }
.tot .g { border-top: 1px solid #1c2230; padding-top: 2.2mm; } .sign div { border-top-color: #c9cdd4; } .ft { border-top: 0; }`,
  };
  const bnFix = d.lang === "bn" ? `\n.title h1, .lab, th, .stamp, .addr b { letter-spacing: 0 !important; text-transform: none !important; }` : "";
  return base + "\n" + T[d.template] + bnFix + `\n.title h1, .tot .g, .addr b { font-variant-numeric: lining-nums tabular-nums; }`;
}

export type DocHotel = { name: string; address: string; phone: string; email: string; bin?: string; logo?: string; showLogo: boolean };

export function docPage(title: string, d: DocDesign, sheet: string) {
  return `<!doctype html><html lang="${d.lang === "bn" ? "bn" : "en"}"><head><meta charset="utf-8"><title>${esc(title)}</title>${FONTS}<style>${css(d)}</style></head><body><div class="sheet">${sheet}</div></body></html>`;
}

export function brand(h: DocHotel, d: DocDesign) {
  if (!h.showLogo) return "";
  if (h.logo) return `<div class="logo"><img src="${h.logo}" alt=""></div>`;
  const ini = h.name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "H";
  return `<div class="logo"><span class="mono">${ini}</span></div>`;
}
export function addrBlock(h: DocHotel, x: ReturnType<typeof lang>) {
  const lines = h.address.split(/,\s*/); const mid = Math.ceil(lines.length / 2);
  return `<div class="addr"><b>${esc(h.name)}</b>${esc(lines.slice(0, mid).join(", "))}${lines.length > 1 ? `<br>${esc(lines.slice(mid).join(", "))}` : ""}<br>${x.num(esc(h.phone))}${h.email ? ` · ${esc(h.email)}` : ""}${h.bin ? `<br>${x.t("bin")} ${x.num(esc(h.bin))}` : ""}</div>`;
}
/** Header: logo + hotel; Modern puts it on a colour band. */
export function header(h: DocHotel, d: DocDesign, x: ReturnType<typeof lang>) {
  const inner = `${brand(h, d)}${addrBlock(h, x)}`;
  return d.template === "modern" ? `<div class="band">${inner}</div>` : `<div class="hd">${inner}</div>`;
}
export function footer(left: string) {
  return `<div class="ft"><span>${left}</span><span>Powered by BinGi HMS</span></div>`;
}
