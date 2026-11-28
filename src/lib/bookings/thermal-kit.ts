// Thermal receipt kit: one engine for every 80 mm (or 58 mm) roll document — KOT, restaurant bill, room charge slip,
// service receipt, cash voucher. Same language rules as the A4 doc-kit (English / Bangla / Mix, Bangla digits and dates).
// Printable width: 72 mm on 80 mm paper, 48 mm on 58 mm paper. Black only: thermal heads print no grey or colour.
// Printed through the browser dialog; direct ESC/POS printing stays in the live HMS.
import type { Hotel } from "@/lib/types";
import { settingsOf } from "@/lib/settings/store";
import { esc, lang, normaliseDesign, type DocDesign, type DocLang } from "./doc-kit";

export type ThermalWidth = 80 | 58;
export type ThermalOpts = { width?: ThermalWidth; lang?: DocLang; textSize?: DocDesign["textSize"] };
export type ThermalHotel = { name: string; address: string; phone: string; bin?: string; logo?: string; showLogo: boolean };
export type TX = ReturnType<typeof lang>;

const SIZE = { S: 0.92, M: 1, L: 1.1 } as const;
const PAPER = { 80: { page: 80, print: 72, base: 9.6 }, 58: { page: 58, print: 48, base: 8.4 } } as const;
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap">`;

/** Hotel header data from Settings (Profile, Branding, Invoices & documents). `restaurant` prefers the restaurant logo. */
export function thermalHotel(h: Hotel, restaurant = false): ThermalHotel {
  const st = settingsOf(h); const p = st.profile;
  return { name: p.name || h.name, address: [p.address || h.address, p.city || h.city].filter(Boolean).join(", "), phone: p.phone || h.phone || "", bin: p.bin || undefined, logo: (restaurant && st.branding.restaurantLogo) || st.branding.logo, showLogo: st.docs.showLogo };
}
/** Language + text size come from Settings › Invoices & documents › Design unless overridden. */
export function thermalDesign(h: Hotel, o: ThermalOpts = {}) {
  const d = normaliseDesign(settingsOf(h).docs.design);
  return { lang: o.lang ?? d.lang, textSize: o.textSize ?? d.textSize, width: o.width ?? 80 } as { lang: DocLang; textSize: DocDesign["textSize"]; width: ThermalWidth };
}

function css(l: DocLang, size: DocDesign["textSize"], w: ThermalWidth) {
  const P = PAPER[w]; const k = SIZE[size]; const pad = (P.page - P.print) / 2;
  return `@page { size: ${P.page}mm auto; margin: 0; } * { box-sizing: border-box; margin: 0; padding: 0; }
html { background: #e9ecf0; } body { width: ${P.page}mm; margin: 0 auto; background: #fff; color: #000; padding: 4mm ${pad}mm 6mm;
font-family: ${l === "bn" ? `"Noto Sans Bengali", "IBM Plex Sans"` : `"IBM Plex Sans", "Noto Sans Bengali"`}, Arial, sans-serif; font-size: ${(P.base * k).toFixed(2)}pt; line-height: 1.35;
font-variant-numeric: tabular-nums lining-nums; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
@media screen { body { margin: 6mm auto; box-shadow: 0 2px 14px rgba(20,30,50,.14); } }
.bn { font-family: "Noto Sans Bengali", sans-serif; font-weight: 400; font-size: .82em; margin-left: 3px; letter-spacing: 0 !important; text-transform: none !important; }
.c { text-align: center; } .r { text-align: right; white-space: nowrap; } .b { font-weight: 700; } .sm { font-size: .86em; } .xs { font-size: .78em; }
.logo { display: block; margin: 0 auto 1.5mm; max-height: 13mm; max-width: 40mm; object-fit: contain; filter: grayscale(1) contrast(1.4); }
.hn { font-size: 1.32em; font-weight: 700; text-align: center; line-height: 1.2; } .ha { text-align: center; font-size: .84em; line-height: 1.35; margin-top: .8mm; }
.dt { font-size: 1.15em; font-weight: 700; text-align: center; margin: .5mm 0; ${l === "bn" ? "" : "letter-spacing: .6px; text-transform: uppercase;"} }
hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; } hr.d { border-top: 3px double #000; } hr.s { border-top: 1px solid #000; }
.kv { display: flex; flex-wrap: wrap; justify-content: space-between; column-gap: 3mm; } .kv > :last-child { margin-left: auto; text-align: right; min-width: 0; overflow-wrap: anywhere; }
table { width: 100%; border-collapse: collapse; font-size: inherit; } td, th { padding: .7mm 0; vertical-align: top; text-align: left; }
th { font-size: .8em; font-weight: 600; border-bottom: 1px solid #000; padding-bottom: 1mm; } .it td { padding-top: 1mm; }
.sub { font-size: .84em; padding-left: 3mm; } .tot { font-size: 1.3em; font-weight: 700; } .tot .bn { font-size: .6em; }
.box { border: 1.5px solid #000; border-radius: 1.5mm; padding: 1.5mm 2mm; text-align: center; margin: 2mm 0; }
.inv { background: #000; color: #fff; font-weight: 700; text-align: center; padding: 1.2mm 2mm; margin: 2mm 0; border-radius: 1mm; }
.sig { margin-top: 11mm; border-top: 1px solid #000; padding-top: 1mm; font-size: .82em; text-align: center; }
.ft { text-align: center; font-size: .76em; margin-top: 3mm; }
${l === "bn" ? ".dt, th, .inv { letter-spacing: 0 !important; text-transform: none !important; }" : ""}`;
}

/** A complete receipt document. */
export function thermalPage(title: string, d: { lang: DocLang; textSize: DocDesign["textSize"]; width: ThermalWidth }, body: string) {
  return `<!doctype html><html lang="${d.lang === "bn" ? "bn" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=${PAPER[d.width].page}mm"><title>${esc(title)}</title>${FONTS}<style>${css(d.lang, d.textSize, d.width)}</style></head><body>${body}</body></html>`;
}

/** Logo (or hotel name), address, phone, BIN, then the document title. */
export function thermalHead(t: ThermalHotel, x: TX, title: string, sub?: string) {
  const logo = t.showLogo && t.logo ? `<img class="logo" src="${esc(t.logo)}" alt="">` : "";
  return `${logo}<div class="hn">${esc(t.name)}</div>${t.address ? `<div class="ha">${esc(t.address)}</div>` : ""}${t.phone ? `<div class="ha">${x.num(esc(t.phone))}</div>` : ""}${t.bin ? `<div class="ha">${x.t("bin")}: ${x.num(esc(t.bin))}</div>` : ""}
<hr class="s"><div class="dt">${title}</div>${sub ? `<div class="c sm">${sub}</div>` : ""}<hr>`;
}
/** One label/value line. */
export const kv = (k: string, v: string, cls = "") => `<div class="kv ${cls}"><span>${k}</span><span>${v}</span></div>`;
/** Local "YYYY-MM-DDTHH:MM" for the print time. */
export const nowStamp = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
/** Bottom line: when this copy was printed. */
export const thermalFoot = (x: TX, printed = nowStamp()) => `<div class="ft">${x.t("printedAt")} ${x.date(printed)} ${x.time(printed)} · Powered by BinGi HMS</div>`;
