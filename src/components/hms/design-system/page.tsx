"use client";
// Design system module (developers) — the BinGi HMS foundation v1 inside the HMS, so web, Mobile HMS (React) and Flutter
// developers copy the same tokens and components. Prototype reference: values match this prototype; the live HMS is not changed.
import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Download, FileCode2, Info, Package, Sparkles } from "lucide-react";
import { strToU8, zipSync } from "fflate";
import { DS_FILES, DS_LOGOS, DS_VERSION, type DsFile } from "@/lib/design-system/files";

type Tab = "overview" | "colors" | "type" | "layout" | "motion" | "components" | "logos" | "files";
const TABS: [Tab, string][] = [["overview", "Overview"], ["colors", "Colors"], ["type", "Type"], ["layout", "Spacing & radius"], ["motion", "Motion"], ["components", "Components"], ["logos", "Logos"], ["files", "Code files"]];

/* ---------- copy / download helpers ---------- */
async function copyText(t: string) {
  try { await navigator.clipboard.writeText(t); return true; } catch {
    const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch { /* ignore */ } a.remove(); return ok;
  }
}
// Inside a Claude artifact the page can't download directly — it asks the viewer through the `downloads` capability
// (allowed types only, so .css/.tsx/.dart go out as .txt there). Everywhere else: a normal browser download.
type Dl = { save: (r: { filename: string; data: string | Blob | ArrayBufferView }) => Promise<unknown> };
const OK_EXT = ["txt", "json", "md", "svg", "zip", "html", "csv"];
async function save(name: string, data: BlobPart, type: string) {
  const c = (window as unknown as { claude?: { use?: (n: string) => Promise<Dl | null> } }).claude;
  if (c?.use) {
    const dl = await c.use("downloads").catch(() => null);
    if (dl) { const ext = name.split(".").pop()!; try { await dl.save({ filename: OK_EXT.includes(ext) ? name : `${name}.txt`, data: data as string | Blob | ArrayBufferView }); } catch { /* viewer declined */ } return; }
  }
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const fileName = (f: DsFile) => f.path.split("/").pop()!;
function downloadAll() {
  const z: Record<string, Uint8Array> = {};
  for (const f of DS_FILES) z[`BinGi_HMS_Design_Foundation_v1/${f.path}`] = strToU8(f.body);
  for (const l of DS_LOGOS) z[`BinGi_HMS_Design_Foundation_v1/brand/${l.name}`] = strToU8(l.body);
  save("BinGi_HMS_Design_Foundation_v1.zip", zipSync(z, { level: 6 }) as BlobPart, "application/zip");
}

/* ---------- data (same values as tokens/bingi-hms.tokens.json) ---------- */
type Sw = { name: string; hex: string; token: string; use: string; dark?: boolean };
const COLORS: { group: string; note: string; items: Sw[] }[] = [
  { group: "Action", note: "One red main action per screen. Never red for status.", items: [
    { name: "Action", hex: "#C8232E", token: "hms-action", use: "Main button, selected text", dark: true },
    { name: "Action top", hex: "#D22C35", token: "hms-action-top", use: "Button gradient start", dark: true },
    { name: "Action bottom", hex: "#BA1F2B", token: "hms-action-bottom", use: "Button gradient end", dark: true },
    { name: "Action hover", hex: "#A81C27", token: "hms-action-hover", use: "Hover / pressed", dark: true },
    { name: "Red text", hex: "#B11C29", token: "hms-red", use: "Red links, brand red", dark: true },
    { name: "Soft", hex: "#FFECEC", token: "hms-soft", use: "Selected segment / row" },
    { name: "Soft 2", hex: "#FFF6F6", token: "hms-soft-2", use: "Light red wash" },
    { name: "Soft border", hex: "#F3C4C0", token: "hms-soft-border", use: "Selected card border" },
    { name: "Logo coral", hex: "#FD413F", token: "hms-brand", use: "Logo only, never text", dark: true },
  ] },
  { group: "Neutral", note: "Cool-gray canvas, white surfaces, 1 px lines. No shadows on cards.", items: [
    { name: "Canvas", hex: "#F4F6F8", token: "hms-canvas", use: "App background" },
    { name: "Surface", hex: "#FFFFFF", token: "hms-surface", use: "Cards, sheets, inputs" },
    { name: "Surface alt", hex: "#FAFAFB", token: "hms-surface-alt", use: "Table header, quiet area" },
    { name: "Ink", hex: "#0F1720", token: "hms-ink", use: "Main text", dark: true },
    { name: "Muted", hex: "#4D5664", token: "hms-muted", use: "Second line, labels", dark: true },
    { name: "Hover", hex: "#E9EDF2", token: "hms-hover", use: "Row / button hover" },
    { name: "Track", hex: "#EEF0F3", token: "hms-track", use: "Progress track, neutral pill" },
    { name: "Line", hex: "#E3E7EC", token: "hms-line", use: "Card and table borders" },
    { name: "Line strong", hex: "#C9CED6", token: "hms-line-strong", use: "Hover border, dashed empty" },
    { name: "Control", hex: "#858C97", token: "hms-input", use: "Checkbox / radio border", dark: true },
    { name: "Focus", hex: "#1D4ED8", token: "hms-focus", use: "Focus ring, progress fill", dark: true },
  ] },
  { group: "Status (background / text)", note: "The same word always gets the same colour in every module.", items: [
    { name: "Info", hex: "#E8F0FE", token: "hms-info-bg", use: "Text #1D4ED8 · Confirmed, Cleaning" },
    { name: "Success", hex: "#E5F5EC", token: "hms-success-bg", use: "Text #16693A · In house, Ready, Paid" },
    { name: "Warning", hex: "#FDF3D9", token: "hms-warning-bg", use: "Text #7A4A0B · Pending, Partly paid" },
    { name: "Danger", hex: "#FDECEC", token: "hms-danger-bg", use: "Text #B42318 · Cancelled, Due" },
    { name: "Violet", hex: "#F1EDFF", token: "hms-violet-bg", use: "Text #5B45C9 · Inspection, Refund due" },
    { name: "Neutral", hex: "#EEF0F3", token: "hms-neutral-bg", use: "Text #4D5664 · Checked out, Draft" },
  ] },
  { group: "Housekeeping dots", note: "Room cleaning steps, step by step.", items: [
    { name: "Dirty", hex: "#D97706", token: "hk-dirty", use: "Needs cleaning", dark: true },
    { name: "Cleaning", hex: "#2563EB", token: "hk-cleaning", use: "Someone is cleaning", dark: true },
    { name: "Inspection", hex: "#6D5BD0", token: "hk-inspect", use: "Waiting for check", dark: true },
    { name: "Ready", hex: "#16A34A", token: "hk-ready", use: "Ready for guest", dark: true },
  ] },
];
const PILLS: [string, string, string][] = [
  ["Confirmed", "#E8F0FE", "#1D4ED8"], ["In house", "#E5F5EC", "#16693A"], ["Pending", "#FDF3D9", "#7A4A0B"],
  ["Cancelled", "#FDECEC", "#B42318"], ["Awaiting inspection", "#F1EDFF", "#5B45C9"], ["Checked out", "#EEF0F3", "#4D5664"],
];

/* ---------- small building blocks ---------- */
const card = "rounded-[20px] border border-hms-line bg-white";
function H2({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return <div className="mb-3 mt-7 first:mt-0"><h2 className="font-heading text-[17px] font-bold tracking-tight">{children}</h2>{sub && <p className="mt-0.5 text-[13.5px] text-hms-muted">{sub}</p>}</div>;
}
function CopyBtn({ text, label, onCopied, small }: { text: string; label: string; onCopied: (t: string) => void; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={`Copy ${label}`} onClick={async () => { if (await copyText(text)) { setDone(true); onCopied(`Copied ${label}`); setTimeout(() => setDone(false), 1400); } }}
      className={clsx("inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-hms-line bg-white font-semibold text-hms-ink hover:bg-hms-hover", small ? "h-8 px-2.5 text-[12.5px]" : "h-9 px-3 text-[13.5px]")}>
      {done ? <Check className="size-3.5 text-[#16693a]" /> : <Copy className="size-3.5" />}{done ? "Copied" : "Copy"}
    </button>
  );
}
function Code({ code, label, onCopied }: { code: string; label: string; onCopied: (t: string) => void }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-hms-line bg-[#0f1720]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 py-1.5 pl-4 pr-1.5"><span className="truncate text-[12px] font-medium text-[#9aa7b4]">{label.replace(/ code$/, "")}</span><CopyBtn text={code} label={label} onCopied={onCopied} small /></div>
      <pre className="max-h-[340px] overflow-auto p-4 text-[12.5px] leading-relaxed text-[#e6edf3]"><code>{code}</code></pre>
    </div>
  );
}

/* ---------- live component previews (exact foundation look) ---------- */
const mainBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(180deg,#d22c35,#c8232e_55%,#ba1f2b)] px-5 text-[14.5px] font-semibold text-white shadow-[0_6px_16px_rgba(200,35,46,.24)] transition-transform duration-150 hover:bg-[linear-gradient(180deg,#c8232e,#a81c27)] active:scale-[0.985]";
const softBtn = "inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-hms-line bg-white px-4 text-[14.5px] font-semibold text-hms-ink transition-transform duration-150 hover:bg-hms-hover active:scale-[0.985]";
const Pill = ({ t, bg, fg }: { t: string; bg: string; fg: string }) => <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] px-2 py-0.5 text-[12.5px] font-semibold" style={{ background: bg, color: fg }}><span className="size-1.5 rounded-full bg-current" />{t}</span>;

function SegDemo() {
  const [v, setV] = useState("today");
  return (
    <div role="radiogroup" aria-label="Example segmented control" className="inline-flex gap-0.5 rounded-[12px] border border-hms-line bg-white p-1">
      {[["today", "Today"], ["week", "This week"], ["month", "Month"]].map(([k, l]) => (
        <button key={k} role="radio" aria-checked={v === k} onClick={() => setV(k)} className={clsx("h-9 rounded-[10px] px-3 text-[13.5px] font-semibold transition-colors", v === k ? "bg-[#ffecec] text-[#c8232e]" : "text-hms-muted hover:text-hms-ink")}>{l}</button>
      ))}
    </div>
  );
}
function TabsDemo() {
  const [v, setV] = useState("tasks");
  return (
    <div role="tablist" aria-label="Example tabs" className="flex gap-6 border-b border-hms-line">
      {[["tasks", "Tasks"], ["maint", "Maintenance"], ["check", "Checklist"]].map(([k, l]) => (
        <button key={k} role="tab" aria-selected={v === k} onClick={() => setV(k)} className={clsx("-mb-px border-b-2 pb-2.5 text-[14.5px] font-semibold", v === k ? "border-[#c8232e] text-[#c8232e]" : "border-transparent text-hms-muted hover:text-hms-ink")}>{l}</button>
      ))}
    </div>
  );
}

type Comp = { id: string; name: string; rule: string; demo: ReactNode; react: string; css: string; flutter: string };
function components(toast: (t: string) => void): Comp[] {
  return [
    { id: "button", name: "Button", rule: "44 px high, 12 px corners. One red main action per screen; every other button is white with a 1 px line. Row buttons are 36 px.",
      demo: <div className="flex flex-wrap items-center gap-2.5"><button className={mainBtn} onClick={() => toast("Main action pressed")}>Check in</button><button className={softBtn}>Print</button><button className="inline-flex h-9 items-center rounded-[12px] border border-hms-line bg-white px-3 text-[13.5px] font-semibold hover:bg-hms-hover">Row action</button><button className="h-9 px-2 text-[14px] font-semibold text-[#b11c29] hover:underline">Text link</button></div>,
      react: `import { MainButton, Button } from "@/ui/bingi-ui";\n\n<MainButton onClick={checkIn}>Check in</MainButton>\n<Button>Print</Button>\n<Button size="row">Row action</Button>`,
      css: `<button class="bh-btn bh-btn--main">Check in</button>\n<button class="bh-btn">Print</button>\n<button class="bh-btn bh-btn--row">Row action</button>\n<button class="bh-btn--text">Text link</button>`,
      flutter: `BinGiPrimaryButton(label: 'Check in', onPressed: checkIn),\nBinGiSecondaryButton(label: 'Print', onPressed: print),` },
    { id: "pill", name: "Status pill", rule: "Booking, payment, room and maintenance status each get their own pill — never mixed in one. Always a dot + a word, never colour alone.",
      demo: <div className="flex flex-wrap gap-2">{PILLS.map(([t, bg, fg]) => <Pill key={t} t={t} bg={bg} fg={fg} />)}</div>,
      react: `import { StatusPill, STATUS_TONE } from "@/ui/bingi-ui";\n\n<StatusPill tone={STATUS_TONE["In house"]}>In house</StatusPill>\n<StatusPill tone="warning">Partly paid</StatusPill>`,
      css: `<span class="bh-pill bh-pill--success">In house</span>\n<span class="bh-pill bh-pill--warning">Partly paid</span>`,
      flutter: `BinGiStatusPill('In house', tone: BinGiTone.success),\nBinGiStatusPill('Partly paid', tone: binGiTone('Partly paid')),` },
    { id: "segmented", name: "Segmented control", rule: "For 2–4 views of the same list. Selected = soft red background with red text, no shadow.",
      demo: <SegDemo />,
      react: `<Segmented label="Period" value={period} onChange={setPeriod}\n  items={[["today", "Today"], ["week", "This week"], ["month", "Month"]]} />`,
      css: `<div class="bh-seg" role="radiogroup">\n  <button aria-checked="true">Today</button>\n  <button aria-checked="false">This week</button>\n</div>`,
      flutter: `BinGiSegmented<String>(\n  value: period, onChanged: setPeriod,\n  items: const {'today': 'Today', 'week': 'This week'},\n)` },
    { id: "tabs", name: "Tabs", rule: "Underline tabs for the sections of one module (max 5). Red underline + red text when selected.",
      demo: <TabsDemo />,
      react: `<Tabs label="Housekeeping" value={tab} onChange={setTab}\n  items={[["tasks", "Tasks"], ["maint", "Maintenance"], ["check", "Checklist"]]} />`,
      css: `<div class="bh-tabs" role="tablist">\n  <button role="tab" aria-selected="true">Tasks</button>\n  <button role="tab" aria-selected="false">Maintenance</button>\n</div>`,
      flutter: `// Material TabBar picks the style from BinGiTheme.light()\nTabBar(tabs: [Tab(text: 'Tasks'), Tab(text: 'Maintenance')])` },
    { id: "stat", name: "Stat tile & card", rule: "White card, 1 px line, 20 px corners, no shadow. Never a card inside a card. Numbers come from real data only.",
      demo: <div className="grid gap-2.5 sm:grid-cols-3">{[["Arrivals", "12", "#E8F0FE", "#1D4ED8"], ["In house", "38", "#E5F5EC", "#16693A"], ["Rooms to clean", "7", "#FDF3D9", "#7A4A0B"]].map(([l, v, bg, fg]) => <div key={l} className={clsx(card, "flex items-center gap-3 p-4")}><span className="grid size-11 place-items-center rounded-2xl text-[15px] font-bold" style={{ background: bg, color: fg }}>{v[0]}</span><span><span className="block text-[12.5px] text-hms-muted">{l}</span><b className="block text-[22px] leading-tight tabular-nums">{v}</b></span></div>)}</div>,
      react: `<StatTile icon={<LogIn size={20} />} tone="info" label="Arrivals" value={String(arrivals)} />`,
      css: `<div class="bh-card bh-stat">\n  <span class="bh-stat__icon bh-pill--info"></span>\n  <div><small>Arrivals</small><b>12</b></div>\n</div>`,
      flutter: `BinGiStatTile(icon: Icons.login, label: 'Arrivals', value: '$arrivals', tone: BinGiTone.info)` },
    { id: "input", name: "Input", rule: "44 px, 12 px corners, label above, help text below. Focus ring blue #1D4ED8, never red.",
      demo: <label className="block max-w-sm"><span className="mb-1.5 block text-[13.5px] font-semibold">Guest name</span><input defaultValue="Rahim Uddin" className="h-11 w-full rounded-[12px] border border-hms-line bg-white px-3.5 text-[14.5px] outline-none focus:border-[#1d4ed8] focus:ring-2 focus:ring-[#1d4ed8]/25" /><span className="mt-1 block text-[12.5px] text-hms-muted">As on NID or passport.</span></label>,
      react: `<input className="h-11 w-full rounded-control border border-hms-line px-3.5 text-[14.5px]\n  focus:border-hms-focus focus:ring-2 focus:ring-hms-focus/25" />`,
      css: `<label class="bh-field">Guest name\n  <input class="bh-input" />\n</label>`,
      flutter: `// InputDecorationTheme comes from BinGiTheme.light()\nTextField(decoration: InputDecoration(labelText: 'Guest name'))` },
    { id: "banner", name: "Banner", rule: "Amber = needs attention, blue = in progress, green = done. One banner per screen, at the top.",
      demo: <div className="space-y-2">{[["#FDF8EC", "#F1DFB8", "#6B4309", "3 rooms are waiting for inspection."], ["#EEF3FD", "#CFDCF7", "#1E3A8A", "Server update in progress · your data is safe."], ["#EEF8F2", "#CDE9D8", "#14532D", "Night audit finished at 02:10."]].map(([bg, bd, fg, t]) => <div key={t} className="flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-[14px]" style={{ background: bg, borderColor: bd, color: fg }}><Info className="size-4 shrink-0" />{t}</div>)}</div>,
      react: `<Banner kind="amber" icon={<Info size={16} />}>3 rooms are waiting for inspection.</Banner>`,
      css: `<div class="bh-banner">3 rooms are waiting for inspection.</div>\n<div class="bh-banner bh-banner--blue">…</div>`,
      flutter: `BinGiBanner('3 rooms are waiting for inspection.', kind: BinGiBannerKind.amber)` },
    { id: "toast", name: "Toast", rule: "Dark, bottom centre, 2.4 s. Confirms a saved action in a few words — never an error that needs a decision.",
      demo: <button className={softBtn} onClick={() => toast("Booking saved")}>Show a toast</button>,
      react: `const { toast, node } = useToast();\n// …\ntoast("Booking saved");\nreturn <>{page}{node}</>;`,
      css: `<div class="bh-toast" role="status">✓ Booking saved</div>`,
      flutter: `showBinGiToast(context, 'Booking saved');` },
  ];
}

/* ---------- page ---------- */
export function DesignSystemPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState({ text: "", n: 0 });
  const toast = msg.text;
  const say = (text: string) => setMsg((m) => ({ text, n: m.n + 1 }));
  useEffect(() => { if (!msg.text) return; const t = setTimeout(() => setMsg((m) => ({ ...m, text: "" })), 2400); return () => clearTimeout(t); }, [msg.n, msg.text]);
  const [lang, setLang] = useState<"react" | "css" | "flutter">("react");
  const [motionKey, setMotionKey] = useState(0);
  const comps = components(say);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-hms-muted">For developers · v{DS_VERSION}</p>
            <h1 className="font-heading text-[24px] font-bold tracking-tight">Design system</h1>
            <p className="mt-1 max-w-[640px] text-[14px] text-hms-muted">One foundation for Web HMS, Mobile HMS (React) and Flutter. Copy a value or a component, or download every file. <span lang="bn">· ডেভেলপারদের জন্য — একই রং, লেখা, বাটন সব অ্যাপে।</span></p>
          </div>
          <button onClick={() => { downloadAll(); say("Downloading ZIP"); }} className={mainBtn}><Package className="size-4" />Download all (ZIP)</button>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#cfdcf7] bg-[#eef3fd] px-4 py-3 text-[13.5px] text-[#1e3a8a]">
          <Info className="mt-0.5 size-4 shrink-0" /><p><b className="font-semibold">Prototype reference.</b> Values match this HMS prototype. The live HMS is not changed by this page. Open decision: main red #C8232E (live HMS button) vs brand red #B11C29.</p>
        </div>

        <div role="tablist" aria-label="Design system sections" className="no-scrollbar mt-5 flex gap-5 overflow-x-auto border-b border-hms-line">
          {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={clsx("-mb-px shrink-0 border-b-2 pb-2.5 text-[14.5px] font-semibold transition-colors", tab === k ? "border-[#c8232e] text-[#c8232e]" : "border-transparent text-hms-muted hover:text-hms-ink")}>{l}</button>)}
        </div>

        <div key={tab} role="tabpanel" aria-label={TABS.find((t) => t[0] === tab)![1]} className="hms-page-in pt-6">
          {tab === "overview" && <>
            <H2 sub="These hold on every platform. If code and this page differ, ask before changing.">Rules</H2>
            <div className="grid gap-2.5 md:grid-cols-2">
              {[
                ["One red action per screen", "The main action is the red gradient button. Everything else is white with a 1 px line."],
                ["Status keeps its own word and colour", "Booking, payment, room readiness and maintenance are separate pills — never one combined status."],
                ["Calm surfaces", "Cool-gray canvas, white cards, 1 px lines, no card shadows, never a card inside a card."],
                ["Fade, never zoom", "Pages fade in over 150 ms. Presses scale to 0.985. Respect reduced motion."],
                ["Bangla + English", "Hind Siliguri for Bangla next to Instrument Sans. Bangla lines never get negative letter-spacing."],
                ["Official logo only", "Use the files in Logos. Never redraw, recolour or stretch the logo."],
              ].map(([t, d]) => <div key={t} className={clsx(card, "p-4")}><p className="text-[14.5px] font-semibold">{t}</p><p className="mt-1 text-[13.5px] text-hms-muted">{d}</p></div>)}
            </div>
            <H2 sub="Pick your stack. Each file is in Code files.">Start in 3 steps</H2>
            <div className="grid gap-2.5 md:grid-cols-3">
              {[
                ["Web / React (Mobile HMS)", ["@import \"tailwindcss\" then paste tailwind-theme.css", "Add the three fonts", "Copy bingi-ui.tsx to src/ui/"]],
                ["Plain CSS", ["Link bingi-hms.css", "Wrap the app in class=\"bh\"", "Use .bh-btn--main, .bh-pill--success …"]],
                ["Flutter (MD7 handoff)", ["Copy bingi_theme.dart to lib/theme/", "Add the fonts in pubspec.yaml", "MaterialApp(theme: BinGiTheme.light())"]],
              ].map(([t, steps]) => <div key={t as string} className={clsx(card, "p-4")}><p className="text-[14.5px] font-semibold">{t}</p><ol className="mt-2 space-y-1.5 text-[13.5px] text-hms-muted">{(steps as string[]).map((s, i) => <li key={s} className="flex gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#ffecec] text-[11.5px] font-bold text-[#c8232e]">{i + 1}</span>{s}</li>)}</ol></div>)}
            </div>
          </>}

          {tab === "colors" && COLORS.map((g) => (
            <section key={g.group}>
              <H2 sub={g.note}>{g.group}</H2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {g.items.map((c) => (
                  <button key={c.token} type="button" aria-label={`Copy ${c.name} ${c.hex}`} onClick={async () => { if (await copyText(c.hex)) say(`Copied ${c.hex}`); }}
                    className={clsx(card, "group overflow-hidden text-left transition-colors hover:border-hms-line-strong")}>
                    <span className="flex h-16 items-end justify-end p-2" style={{ background: c.hex, borderBottom: "1px solid #E3E7EC" }}><Copy className={clsx("size-4 opacity-0 transition-opacity group-hover:opacity-100", c.dark ? "text-white" : "text-hms-ink")} /></span>
                    <span className="block p-3"><span className="flex items-baseline justify-between gap-2"><b className="text-[13.5px] font-semibold">{c.name}</b><code className="text-[12px] text-hms-muted">{c.hex}</code></span><span className="mt-0.5 block truncate text-[12px] text-hms-muted">{c.token} · {c.use}</span></span>
                  </button>
                ))}
              </div>
            </section>
          ))}

          {tab === "type" && <>
            <H2 sub="Bricolage Grotesque for headings (−0.02em), Instrument Sans for text, Hind Siliguri for Bangla.">Type scale</H2>
            <div className={clsx(card, "divide-y divide-hms-line")}>
              {[
                ["Page title", "24 / 700 · heading", "font-heading text-[24px] font-bold tracking-tight", "Today at Azure Bay"],
                ["Section title", "18 / 700 · heading", "font-heading text-[18px] font-bold tracking-tight", "Arrivals"],
                ["Card title", "17 / 600", "text-[17px] font-semibold", "Room 204 · Deluxe"],
                ["Big number", "22 / 700 · tabular", "text-[22px] font-bold tabular-nums", "৳ 48,500"],
                ["Body", "14.5 / 400", "text-[14.5px]", "Guest arrives at 2 pm with two children."],
                ["Body small", "14 / 400", "text-[14px]", "Paid by bKash · 10 Nov"],
                ["Label", "13.5 / 600", "text-[13.5px] font-semibold", "Check-in date"],
                ["Pill / meta", "12.5 / 600", "text-[12.5px] font-semibold", "Awaiting inspection"],
                ["Caption", "12 / 400 · muted", "text-[12px] text-hms-muted", "Updated 2 min ago"],
                ["Bangla", "14.5 / 400 · Hind Siliguri", "text-[14.5px]", "অতিথি দুপুর ২টায় আসবেন।"],
              ].map(([n, spec, cls, ex]) => (
                <div key={n} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3">
                  <span className="w-36 shrink-0"><b className="block text-[13.5px] font-semibold">{n}</b><span className="text-[12px] text-hms-muted">{spec}</span></span>
                  <span lang={n === "Bangla" ? "bn" : undefined} className={clsx("min-w-0 flex-1", cls)}>{ex}</span>
                  <CopyBtn text={cls} label={`${n} classes`} onCopied={say} small />
                </div>
              ))}
            </div>
          </>}

          {tab === "layout" && <>
            <H2 sub="4 px grid. Page padding 24 px desktop, 16 px phone. Gap between cards 10–12 px.">Spacing</H2>
            <div className={clsx(card, "flex flex-wrap items-end gap-4 p-4")}>
              {[4, 8, 12, 16, 20, 24, 32, 40].map((s) => <div key={s} className="text-center"><div className="mx-auto rounded-[4px] bg-[#ffecec]" style={{ width: s, height: s, outline: "1px solid #F3C4C0" }} /><p className="mt-1.5 text-[12px] text-hms-muted">{s}</p></div>)}
            </div>
            <H2 sub="Bigger thing, bigger corner.">Radius</H2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {[["chip", 6, "Pills"], ["control", 12, "Buttons, inputs"], ["tile", 16, "Icon squares, banners"], ["card", 20, "Cards"], ["sheet", 24, "Sheets, dialogs"], ["pill", 999, "Avatars, toggles"]].map(([n, r, u]) => (
                <button key={n as string} type="button" onClick={async () => { if (await copyText(`rounded-${n}`)) say(`Copied rounded-${n}`); }} className={clsx(card, "p-3 text-left hover:border-hms-line-strong")} aria-label={`Copy radius ${n}`}>
                  <span className="block h-14 border-2 border-[#c8232e] bg-[#fff6f6]" style={{ borderRadius: Math.min(Number(r), 28) }} />
                  <b className="mt-2 block text-[13.5px] font-semibold">{n} · {r === 999 ? "full" : `${r} px`}</b><span className="text-[12px] text-hms-muted">{u}</span>
                </button>
              ))}
            </div>
            <H2 sub="Only two shadows. Cards have none.">Shadow & size</H2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className={clsx(card, "p-4")}><div className="h-11 rounded-[12px] bg-[#c8232e] shadow-[0_6px_16px_rgba(200,35,46,.24)]" /><b className="mt-3 block text-[13.5px]">shadow-action</b><code className="text-[12px] text-hms-muted">0 6px 16px rgba(200,35,46,.24)</code></div>
              <div className={clsx(card, "p-4")}><div className="h-11 rounded-[12px] bg-white shadow-[0_16px_40px_-12px_rgba(0,0,0,.25)]" style={{ outline: "1px solid #E3E7EC" }} /><b className="mt-3 block text-[13.5px]">shadow-float</b><code className="text-[12px] text-hms-muted">menus, toasts, sheets</code></div>
              <div className={clsx(card, "p-4")}><b className="block text-[13.5px]">Heights</b><p className="mt-1 text-[13.5px] text-hms-muted">Button / input 44 · row button 36 · tab bar 64 · touch target ≥ 44</p></div>
              <div className={clsx(card, "p-4")}><b className="block text-[13.5px]">Mobile frame</b><p className="mt-1 text-[13.5px] text-hms-muted">iPhone 16 Pro Max 440 × 956 · safe areas on · bottom tab bar</p></div>
            </div>
          </>}

          {tab === "motion" && <>
            <H2 sub="Functional, quick, never decorative. Turn off with prefers-reduced-motion.">Motion</H2>
            <div className="mb-3"><button className={softBtn} onClick={() => setMotionKey((k) => k + 1)}><Sparkles className="size-4" />Play all</button></div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Page change", "150 ms · ease-out · fade only", "hms-fade 150ms ease-out both", "animate-[hms-fade_150ms_ease-out_both]"],
                ["Press", "120 ms · scale 0.985", "", ""],
                ["Pop (menu, popover)", "140 ms · cubic-bezier(.2,.9,.3,1.15)", "", "animate-[bh-pop_140ms_cubic-bezier(.2,.9,.3,1.15)_both]"],
                ["Sheet", "220 ms · cubic-bezier(.22,1,.36,1)", "", "animate-[bh-sheet_220ms_cubic-bezier(.22,1,.36,1)_both]"],
                ["Toast", "180 ms in · stays 2.4 s", "", "animate-[hms-up_180ms_ease-out_both]"],
              ].map(([n, spec, , cls]) => (
                <div key={n} className={clsx(card, "p-4")}>
                  <div className="grid h-20 place-items-center overflow-hidden rounded-2xl bg-hms-canvas">
                    {n === "Press" ? <button className={mainBtn}>Press me</button> : <span key={motionKey} className={clsx("block h-9 w-28 rounded-[12px] border border-hms-line bg-white shadow-sm", cls)} />}
                  </div>
                  <b className="mt-3 block text-[13.5px] font-semibold">{n}</b><span className="text-[12.5px] text-hms-muted">{spec}</span>
                </div>
              ))}
            </div>
          </>}

          {tab === "components" && <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13.5px] text-hms-muted">Live examples. The code shows how to use the same piece in your stack.</p>
              <div role="radiogroup" aria-label="Code language" className="inline-flex gap-0.5 rounded-[12px] border border-hms-line bg-white p-1">
                {([["react", "React"], ["css", "CSS"], ["flutter", "Flutter"]] as const).map(([k, l]) => <button key={k} role="radio" aria-checked={lang === k} onClick={() => setLang(k)} className={clsx("h-9 rounded-[10px] px-3 text-[13.5px] font-semibold", lang === k ? "bg-[#ffecec] text-[#c8232e]" : "text-hms-muted hover:text-hms-ink")}>{l}</button>)}
              </div>
            </div>
            <div className="space-y-3">
              {comps.map((c) => (
                <section key={c.id} aria-label={c.name} className={clsx(card, "p-4 sm:p-5")}>
                  <h2 className="font-heading text-[17px] font-bold tracking-tight">{c.name}</h2>
                  <p className="mt-0.5 text-[13.5px] text-hms-muted">{c.rule}</p>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl bg-hms-canvas p-4">{c.demo}</div>
                    <Code code={c[lang]} label={`${c.name} ${lang === "css" ? "CSS" : lang === "react" ? "React" : "Flutter"} code`} onCopied={say} />
                  </div>
                </section>
              ))}
            </div>
          </>}

          {tab === "logos" && <>
            <H2 sub="Official files only. Never redraw, recolour, stretch or add effects. Keep clear space of at least the mark's height.">Logos</H2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {DS_LOGOS.map((l) => (
                <div key={l.name} className={clsx(card, "overflow-hidden")}>
                  <div className={clsx("grid h-32 place-items-center p-5", l.name.includes("dark") ? "bg-[#0f1720]" : "bg-hms-canvas")}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- official brand file, shown as-is */}
                    <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(l.body)}`} alt={`BinGi HMS logo · ${l.name}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3"><code className="truncate text-[12.5px]">{l.name}</code><button onClick={() => save(l.name, l.body, "image/svg+xml")} aria-label={`Download ${l.name}`} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-hms-line px-2.5 text-[12.5px] font-semibold hover:bg-hms-hover"><Download className="size-3.5" />SVG</button></div>
                </div>
              ))}
            </div>
          </>}

          {tab === "files" && <>
            <H2 sub="Same values everywhere. Download one file, or everything as a ZIP from the top of the page.">Code files</H2>
            <div className={clsx(card, "divide-y divide-hms-line")}>
              {DS_FILES.map((f) => (
                <div key={f.path} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1d4ed8]"><FileCode2 className="size-5" /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-[14px] font-semibold">{fileName(f)}</b><span className="text-[12.5px] text-hms-muted">{f.label} · {f.path} · {(f.body.length / 1024).toFixed(1)} KB</span></span>
                  <CopyBtn text={f.body} label={fileName(f)} onCopied={say} />
                  <button onClick={() => save(fileName(f), f.body, "text/plain")} aria-label={`Download ${fileName(f)}`} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-hms-line bg-white px-3 text-[13.5px] font-semibold hover:bg-hms-hover"><Download className="size-3.5" />Download</button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12.5px] text-hms-muted">The Flutter file has not been compiled here (no Flutter SDK). Run <code>flutter analyze</code> once; needs Flutter 3.27+.</p>
          </>}
        </div>
      </div>
      {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><Check className="size-4 shrink-0 text-[#7ee2a8]" />{toast}</div>}
    </div>
  );
}
