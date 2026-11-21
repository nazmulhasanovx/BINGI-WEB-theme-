"use client";
// Onboarding v8.1 — Rooms part in 3 steps (21 Nov 2026 feedback #2–#5):
//   3.1 Where they are — only the kinds that fit the property type; Floor/Level + Ground + Basement 1–3;
//       Zone/Block 1–50 with the owner's own names.
//   3.2 Add rooms — the live HMS "Add New Room" pattern: pick Room / Cottage / …, one page creates a full
//       room type (details, price box, numbers, photos, description, amenities, meals). Numbers: place cards
//       ("N available" · View) → number grid → chips with ×.
//   3.3 Review.
// Saved as the same records the live backend uses: locations → accommodation category → draft unit batch.
import clsx from "clsx";
import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { BedDouble, Building2, Check, ChevronRight, Hash, ImagePlus, Pencil, Plus, ShieldCheck, Trash2, Trees, UsersRound, X } from "lucide-react";
import { AMENITIES, type CoreType } from "@/lib/rooms/catalog";
import { nowStamp, uid, type Category, type Config, type LocNode, type MealMode, type Pick, type useRooms } from "@/lib/rooms/store";
import { PLANS, num, quote, recommend, useL, useOnboarding, type Draft, type StepId } from "@/lib/onboarding/store";
import { BEDS, BUILDINGS, MAX_FLOOR, ROOM_KINDS, STAY } from "@/lib/onboarding/rooms-easy";
import { BN_NAME, FITS, MAX_ZONES, ROOM_TOP, TYPE_PRESETS, configFrom8, isZoneCore, levelName, numbersFor, zoneDefault, zoneName } from "@/lib/onboarding/rooms-v8";
import { money } from "../hms/rooms/parts";
import { AM_BN, AM_ICON, FormSlot, NumberSheet, STAY_ICON } from "./rooms-easy";
import { TYPE_META } from "./types";
import { Chip, Errors, Ghost, Pills, Primary, Stepper, Tile, field } from "./shell";

type Rooms = ReturnType<typeof useRooms>;
const DOT = ["#b11c29", "#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be185d", "#334155", "#15803d"];
const liveCats = (st: Rooms["st"]) => st.categories.filter((c) => !c.archived);
const colorOf = (st: Rooms["st"], id: string) => DOT[Math.max(0, liveCats(st).findIndex((c) => c.id === id)) % DOT.length];
const nm = (name: string, t: (bn: string, en: string) => string) => t(BN_NAME[name] ?? name, name);
/** Display name of a location as the owner set it. */
export function placeLabel(d: Draft, c: Config, n: LocNode, bn: boolean) {
  if (n.kind === "ZONE") return zoneName(d, n.level ?? 1, bn);
  const b = c.nodes.find((x) => x.id === n.parent);
  const multi = c.nodes.filter((x) => x.kind === "BUILDING" || x.kind === "TOWER").length > 1;
  const B = BUILDINGS.find((x) => `b-${x.id}` === b?.id);
  return `${multi && B ? (bn ? B.bn : B.en) + " · " : ""}${levelName(d.place.floorStyle, n.level ?? 0, bn)}`;
}

// ---------- 3.1 Where they are ----------
export function Place({ d, st, goStep }: { d: Draft; st: Rooms["st"]; goStep: (s: StepId) => void }) {
  const { edit } = useOnboarding();
  const PT = TYPE_META.find((x) => x.slug === d.propertyType);
  const { t, lang } = useL();
  const bn = lang === "bn";
  const fits = FITS[d.propertyType] ?? ["ROOM"];
  const [more, setMore] = useState(d.stay.some((s) => !fits.includes(s as CoreType)));
  const usedCore = new Set(st.units.filter((u) => u.status !== "archived").map((u) => u.core));
  const usedNode = new Set(st.units.filter((u) => u.status !== "archived").map((u) => u.node));
  const floorKinds = d.stay.some((s) => !isZoneCore(s));
  const zoneKinds = d.stay.some((s) => isZoneCore(s));
  const top = Math.max(0, ...d.floors);
  const ground = d.floors.includes(0);
  const usedLevels = st.config.nodes.filter((n) => usedNode.has(n.id) && n.kind !== "ZONE").map((n) => n.level ?? 0);
  const minTop = Math.max(1, ...usedLevels.filter((l) => l > 0));
  const minBase = Math.max(0, ...usedLevels.filter((l) => l < 0).map((l) => -l));
  const minZones = Math.max(1, ...st.config.nodes.filter((n) => n.kind === "ZONE" && usedNode.has(n.id)).map((n) => n.level ?? 1));
  const setFloors = (n: number, g: boolean) => edit((x) => { x.floors = [...(g ? [0] : []), ...Array.from({ length: n }, (_, i) => i + 1)]; });
  const bs = d.buildings.length ? d.buildings : ["main"];
  const shown = STAY.filter((s) => fits.includes(s.id) || more);
  const levels = [...[...d.floors].filter((l) => l > 0).sort((x, y) => y - x), ...(ground ? [0] : []), ...Array.from({ length: d.place.basements }, (_, i) => -(i + 1))];
  const sample = (L: number) => (L > 0 ? `${L}01` : L === 0 ? (d.ground === "G" ? "G01" : "001") : `B${-L}01`);
  return (
    <section>
      <Head title={t("কোথায় আছে?", "Where are they?")} sub={t("আপনার property-র ধরন দেখে আগেই সাজানো। মিলিয়ে নিন, দরকার হলে বদলান।", "Set up from your property type. Check it and change what's different.")} />
      <div className="mt-6 space-y-4">
        <Card id="where-kinds" n={1} title={t("কী ভাড়া দেন", "What you rent")} hint={t("আপনার property-র ধরন দেখে আগেই বাছাই করা", "Already picked from your property type")}>
          {PT && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#0f1720] px-4 py-3 text-white">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10"><PT.icon className="size-5" aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="block text-[12.5px] text-white/65">{t("আপনার property", "Your property")}</span><span className="block text-[16px] font-semibold">{t(PT.bn, PT.en)}</span></span>
              <button onClick={() => goStep("1.1")} className="h-9 rounded-full bg-white/10 px-3.5 text-[13.5px] font-semibold hover:bg-white/20">{t("বদলান", "Change")}</button>
            </div>
          )}
          <div className="grid gap-2.5 sm:grid-cols-3">
            {shown.map((s) => {
              const on = d.stay.includes(s.id);
              const I = STAY_ICON[s.id];
              const lock = on && usedCore.has(s.id);
              return <Tile key={s.id} on={on} disabled={lock} onClick={() => edit((x) => { x.stay = on ? x.stay.filter((y) => y !== s.id) : [...x.stay, s.id]; if (!isZoneCore(s.id) && !x.floors.length) x.floors = [1]; })} icon={<I className="size-5" />} title={t(s.bn, s.en)} sub={lock ? t("রুম আছে — বাদ দেওয়া যাবে না", "Has rooms — can't remove") : isZoneCore(s.id) ? t("জোন বা ব্লকে", "In zones or blocks") : t("বিল্ডিংয়ের তলায়", "On building floors")} />;
            })}
          </div>
          {!more && <button onClick={() => setMore(true)} className="mt-3 text-[14.5px] font-semibold text-[#b11c29]">+ {t("আরও ধরন", "More kinds")}</button>}
        </Card>

        {floorKinds && (
          <Card id="where-building" n={2} title={t("বিল্ডিং ও তলা", "Building & floors")} hint={t("রুম নম্বর তলা থেকে তৈরি হয়", "Room numbers come from the floor")}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_200px]">
              <div className="space-y-5">
                <div><p className="mb-1.5 text-[13.5px] font-semibold text-[#2b3340]">{t("কোন বিল্ডিং", "Which building")}</p>
                  <div className="flex flex-wrap gap-2">
                    {BUILDINGS.map((b) => {
                      const on = bs.includes(b.id);
                      const lock = on && st.config.nodes.some((n) => n.parent === `b-${b.id}` && usedNode.has(n.id));
                      return <Chip key={b.id} on={on} disabled={lock} onClick={() => edit((x) => { const cur = x.buildings.length ? x.buildings : ["main"]; const nx = cur.includes(b.id) ? cur.filter((y) => y !== b.id) : [...cur, b.id]; x.buildings = nx.length ? nx : ["main"]; })}><Building2 className="size-4" aria-hidden />{t(b.bn, b.en)}</Chip>;
                    })}
                  </div>
                </div>
                <div><p className="mb-1.5 text-[13.5px] font-semibold text-[#2b3340]">{t("তলার নাম", "Floors are called")}</p>
                  <Pills size="sm" label={t("তলার নাম", "Floor names")} value={d.place.floorStyle} onChange={(v) => edit((x) => { x.place.floorStyle = v; })} items={[{ v: "floor", label: t("ফ্লোর", "Floor") }, { v: "level", label: t("লেভেল", "Level") }]} />
                </div>
                <div className="divide-y divide-[#e9edf2] rounded-xl border border-[#e3e7ec]">
                  <Line title={d.place.floorStyle === "level" ? t("লেভেল", "Levels") : t("ফ্লোর", "Floors")} sub={top ? `${levelName(d.place.floorStyle, 1, bn)} – ${levelName(d.place.floorStyle, top, bn)}` : ""}>
                    <Stepper label={t("তলা", "Floors")} value={top} set={(n) => setFloors(Math.max(n, minTop), ground)} min={minTop} max={MAX_FLOOR} />
                  </Line>
                  <Line title={t("গ্রাউন্ডে রুম", "Rooms on ground")} sub={ground ? (d.ground === "G" ? "G01, G02…" : "001, 002…") : t("নেই", "None")}>
                    <Switch on={ground} disabled={usedLevels.includes(0)} label={t("গ্রাউন্ডে রুম", "Rooms on ground")} set={(v) => setFloors(Math.max(top, 1), v)} />
                  </Line>
                  <Line title={t("বেসমেন্ট", "Basements")} sub={d.place.basements ? `B101…` : t("নেই", "None")}>
                    <Stepper label={t("বেসমেন্ট", "Basements")} value={d.place.basements} set={(n) => edit((x) => { x.place.basements = Math.max(n, minBase); })} min={minBase} max={3} />
                  </Line>
                </div>
              </div>
              <div aria-hidden className="hidden lg:block">
                <p className="mb-1.5 text-[12.5px] font-semibold uppercase tracking-wide text-[#5b6270]">{t("দেখতে যেমন", "Preview")}</p>
                <div className="rounded-xl bg-[#f4f6f8] p-2">
                  <div className="mx-auto mb-1.5 h-2 w-3/4 rounded-t-md bg-[#c6ccd4]" />
                  <div className="space-y-1">
                    {levels.slice(0, 9).map((L) => <div key={L} className={clsx("flex items-center justify-between rounded-md px-2.5 py-1.5 text-[12px]", L < 0 ? "bg-[#e3e7ec] text-[#4d5664]" : "bg-white")}><span className="font-medium">{levelName(d.place.floorStyle, L, bn)}</span><span className="font-mono text-[#5b6270]">{sample(L)}…</span></div>)}
                    {levels.length > 9 && <p className="text-center text-[12px] text-[#5b6270]">+{num(levels.length - 9, lang)}</p>}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {zoneKinds && (
          <Card id="where-zones" n={floorKinds ? 3 : 2} title={t("কটেজ / ভিলা কোথায়", "Where the cottages / villas are")} hint={t("জোনের নিজের নাম দিন — নম্বর প্রতিটা জোনে আলাদা", "Name each zone — numbers are per zone")}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <Pills size="sm" label={t("জোন না ব্লক", "Zone or block")} value={d.place.zoneStyle} onChange={(v) => edit((x) => { x.place.zoneStyle = v; })} items={[{ v: "zone", label: t("জোন", "Zones") }, { v: "block", label: t("ব্লক", "Blocks") }]} />
              <span className="flex items-center gap-3"><span className="text-[14.5px] text-[#4d5664]">{t("কয়টা?", "How many?")}</span><Stepper label={t("জোন", "Zones")} value={d.place.zoneCount} set={(n) => edit((x) => { x.place.zoneCount = Math.max(n, minZones); })} min={minZones} max={MAX_ZONES} /></span>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: d.place.zoneCount }, (_, i) => i + 1).map((i) => (
                <li key={i} className="flex items-center gap-2 rounded-xl border border-[#d3d8df] bg-white py-1.5 pl-2 pr-3 focus-within:border-[#0f1720]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef7f1] text-[#1c7d45]"><Trees className="size-4" aria-hidden /></span>
                  <input aria-label={t(`${zoneDefault(d, i, true)}-এর নাম`, `${zoneDefault(d, i, false)} name`)} value={d.place.zoneNames[i - 1] ?? ""} placeholder={zoneDefault(d, i, bn)}
                    onChange={(e) => edit((x) => { const a = [...x.place.zoneNames]; a[i - 1] = e.target.value.slice(0, 30); x.place.zoneNames = a; })}
                    className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-[#5b6270]" />
                  <span className="rounded-md bg-[#f4f6f8] px-1.5 py-0.5 font-mono text-[11.5px] text-[#4d5664]">{d.place.zoneStyle === "block" ? "BL" : "Z"}{i}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] text-[#4d5664]">{t("প্রতিটা জোনে নম্বর:", "Numbers in each zone:")} <b className="font-mono text-[#0f1720]">{d.stay.filter(isZoneCore).map((s) => `${STAY.find((x) => x.id === s)!.prefix}1–${STAY.find((x) => x.id === s)!.prefix}100`).join(" · ")}</b></p>
          </Card>
        )}
      </div>
    </section>
  );
}
/** 101,102,103,105 → "101–103, 105" */
function ranges(list: string[]) {
  const key = (x: string) => { const m = x.match(/^(.*?)(\d+)$/); return m ? [m[1], Number(m[2])] as const : [x, NaN] as const; };
  const sorted = [...list].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const out: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    const [p] = key(sorted[i]);
    while (j + 1 < sorted.length && key(sorted[j + 1])[0] === p && key(sorted[j + 1])[1] === key(sorted[j])[1] + 1) j++;
    out.push(j - i >= 2 ? `${sorted[i]}–${sorted[j]}` : sorted.slice(i, j + 1).join(", "));
    i = j + 1;
  }
  return out.join(", ");
}
function Head({ title, sub }: { title: string; sub: string }) {
  return <div><h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] sm:text-[30px]">{title}</h1><p className="mt-1.5 text-[15.5px] text-[#4d5664]">{sub}</p></div>;
}
function Line({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="text-[15px] font-semibold">{title}</p>{sub && <p className="text-[13px] text-[#4d5664]">{sub}</p>}</div>{children}</div>;
}
function Switch({ on, set, label, disabled }: { on: boolean; set: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => set(!on)} className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40", on ? "bg-[#1c7d45]" : "bg-[#c6ccd4]")}><span className={clsx("absolute top-0.5 size-6 rounded-full bg-white shadow transition-[left] duration-200", on ? "left-[22px]" : "left-0.5")} /></button>;
}

// ---------- 3.2 Add rooms (live "Add New Room" pattern) ----------
type Form = {
  id?: string; core: CoreType; title: string; category: string; kind: string; bed: string; guests: number; price: string; size?: number;
  picks: Pick[]; photos: string[]; description: string; amen: string[]; meals: { breakfast: MealMode; lunch: MealMode; dinner: MealMode }; mealPrices: { breakfast?: number; lunch?: number; dinner?: number };
};
const blank = (core: CoreType): Form => ({ core, title: "", category: "", kind: "double", bed: "1 Double bed", guests: 2, price: "", picks: [], photos: [], description: "", amen: ["Air conditioning", "Free Wi-Fi", "Hot water", "Attached bathroom"], meals: { breakfast: "none", lunch: "none", dinner: "none" }, mealPrices: {} });

export function AddRooms({ d, rooms, onForm }: { d: Draft; rooms: Rooms; onForm: (open: boolean) => void }) {
  const { t, lang } = useL();
  const [form, setFormState] = useState<Form | null>(null);
  const [pick, setPick] = useState(false);
  const setForm = (f: Form | null) => { setFormState(f); onForm(!!f); };
  const st = rooms.st;
  const cats = liveCats(st);
  const live = st.units.filter((u) => u.status !== "archived");
  const kinds = STAY.filter((s) => d.stay.includes(s.id));
  const start = (core: CoreType) => { setPick(false); setForm(blank(core)); };
  const editCat = (c: Category) => setForm({
    id: c.id, core: c.core, title: c.name, category: c.name, kind: c.roomKind ?? "double", bed: c.bed, guests: c.maxAdults, price: String(c.baseRate || ""), size: c.sizeSqft,
    picks: live.filter((u) => u.category === c.id).map((u) => ({ node: u.node, local: u.local, code: u.code })), photos: c.photos ?? [], description: c.description ?? "", amen: c.amenities,
    meals: { breakfast: c.meals?.breakfast ?? "none", lunch: c.meals?.lunch ?? "none", dinner: c.meals?.dinner ?? "none" }, mealPrices: c.mealPrices ?? {},
  });
  const remove = (c: Category) => {
    if (!window.confirm(t(`"${c.name}" আর এর সব রুম মুছে ফেলবেন?`, `Remove "${c.name}" and its rooms?`))) return;
    rooms.update((s) => { s.categories = s.categories.filter((x) => x.id !== c.id); s.units = s.units.filter((u) => u.category !== c.id); }, `Room type ${c.name} removed in onboarding`);
  };
  if (form) return <AccForm d={d} rooms={rooms} f={form} set={setFormState} close={() => setForm(null)} />;
  const config = st.config;
  const kindTiles = (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {kinds.map((k) => { const I = STAY_ICON[k.id]; const n = live.filter((u) => u.core === k.id).length; return (
        <button key={k.id} onClick={() => start(k.id)} className="group relative flex flex-col items-start gap-2.5 rounded-2xl border border-[#d3d8df] bg-white p-4 text-left shadow-[0_1px_2px_rgb(15_23_32/0.04)] transition-[border-color,box-shadow] hover:border-[#b11c29] hover:shadow-[0_10px_24px_-18px_rgb(177_28_41/0.5)]">
          <span className="grid size-11 place-items-center rounded-xl bg-[#fdecea] text-[#b11c29]"><I className="size-5" /></span>
          <span><span className="block text-[15.5px] font-semibold">{t(`${k.bn} যোগ করুন`, `Add ${k.en.toLowerCase()}`)}</span><span className="text-[13px] text-[#4d5664]">{n ? t(`${num(n, lang)}টা আছে`, `${n} added`) : t(k.subBn, k.subEn)}</span></span>
          <span className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-full bg-[#f4f6f8] text-[#b11c29] transition-transform group-hover:rotate-90"><Plus className="size-4" /></span>
        </button>); })}
    </div>
  );
  return (
    <section>
      <Head title={t("রুম যোগ করুন", "Add your rooms")} sub={t("একটা একটা করে ধরন যোগ করুন — এক পেজেই দাম, নম্বর, সুবিধা।", "Add one type at a time — price, numbers and amenities on one page.")} />
      {cats.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#efb7b1] bg-gradient-to-b from-[#fffaf9] to-white p-6 text-center sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[#b11c29] shadow-sm"><BedDouble className="size-7" /></span>
          <p className="mt-3 text-[18px] font-semibold">{t("এখনো কোনো রুম নেই", "No rooms yet")}</p>
          <p className="mx-auto mt-1 max-w-[420px] text-[14.5px] text-[#4d5664]">{t("কী যোগ করবেন বাছাই করুন। ক্যাটাগরি বাছলে দাম আর বাকি তথ্য বসে যায়, শুধু নম্বর বাছাই করবেন।", "Pick what to add. A category fills price and details — you only pick the numbers.")}</p>
          <div className="mt-5 text-left">{kindTiles}</div>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-3">
            {cats.map((c) => {
              const us = live.filter((u) => u.category === c.id);
              const I = STAY_ICON[c.core];
              const color = colorOf(st, c.id);
              const groups = config.nodes.filter((n) => us.some((u) => u.node === n.id));
              return (
                <li key={c.id} className="onb-in overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white shadow-[0_1px_2px_rgb(15_23_32/0.04)]">
                  <div className="flex items-start gap-3.5 p-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: color }}><I className="size-6" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold leading-snug">{nm(c.name, t)}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13.5px] text-[#4d5664]"><span className="inline-flex items-center gap-1"><UsersRound className="size-3.5" />{t(`${num(c.maxAdults, lang)} জন`, `${c.maxAdults} guests`)}</span><span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{t(BEDS.find((b) => b.id === c.bed)?.bn ?? c.bed, BEDS.find((b) => b.id === c.bed)?.en ?? c.bed)}</span>{c.amenities.length > 0 && <span>{t(`${num(c.amenities.length, lang)}টা সুবিধা`, `${c.amenities.length} amenities`)}</span>}</p>
                    </div>
                    <div className="shrink-0 text-right"><p className="text-[18px] font-semibold tabular-nums">৳{num(money(c.baseRate), lang)}</p><p className="text-[12.5px] text-[#4d5664]">/{t("রাত", "night")}</p></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f0f2f5] bg-[#fafbfc] px-4 py-2.5">
                    <span className="rounded-full px-2 py-0.5 text-[12.5px] font-semibold text-white" style={{ background: color }}>{t(`${num(us.length, lang)}টা`, `${us.length}`)}</span>
                    {groups.map((n) => <span key={n.id} className="text-[13px] text-[#4d5664]"><b className="font-semibold text-[#2b3340]">{placeLabel(d, config, n, lang === "bn")}</b> · <span className="font-mono">{ranges(us.filter((u) => u.node === n.id).map((u) => u.local))}</span></span>)}
                    <span className="ml-auto flex gap-1">
                      <button onClick={() => editCat(c)} className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13.5px] font-semibold text-[#0f1720] hover:bg-[#e9edf2]"><Pencil className="size-3.5" />{t("বদলান", "Edit")}</button>
                      <button onClick={() => remove(c)} aria-label={t(`${c.name} মুছুন`, `Remove ${c.name}`)} className="grid size-8 place-items-center rounded-full text-[#4d5664] hover:bg-[#fff1f0] hover:text-[#8e1621]"><Trash2 className="size-4" /></button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {!pick ? (
            <button onClick={() => (kinds.length > 1 ? setPick(true) : start((kinds[0]?.id ?? "ROOM") as CoreType))} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-[#efb7b1] bg-[#fffaf9] px-4 py-3.5 text-left transition-colors hover:bg-[#fff4f3]">
              <span className="grid size-10 place-items-center rounded-xl bg-[#b11c29] text-white"><Plus className="size-5" /></span>
              <span><span className="block text-[16px] font-semibold">{t("আরেকটা ধরন যোগ করুন", "Add another type")}</span><span className="text-[13.5px] text-[#4d5664]">{kinds.map((k) => t(k.bn, k.en)).join(" · ")}</span></span>
              <ChevronRight className="ml-auto size-5 text-[#b11c29]" />
            </button>
          ) : <div className="onb-in mt-3">{kindTiles}<button onClick={() => setPick(false)} className="mt-2 text-[14px] font-semibold text-[#4d5664] underline underline-offset-4">{t("বাতিল", "Cancel")}</button></div>}
        </>
      )}
      <Totals d={d} total={live.length} cats={cats.length} />
    </section>
  );
}

const MEALS: ["breakfast" | "lunch" | "dinner", string, string][] = [["breakfast", "নাস্তা", "Breakfast"], ["lunch", "দুপুরের খাবার", "Lunch"], ["dinner", "রাতের খাবার", "Dinner"]];
function AccForm({ d, rooms, f, set, close }: { d: Draft; rooms: Rooms; f: Form; set: (f: Form) => void; close: () => void }) {
  const { t, lang } = useL();
  const [tried, setTried] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const [conf, setConf] = useState<string[]>([]);
  const p = (x: Partial<Form>) => set({ ...f, ...x });
  const stay = STAY.find((s) => s.id === f.core)!;
  const presets = TYPE_PRESETS.filter((x) => x.core === f.core);
  const price = Number(f.price) || 0;
  const vat = d.policy.vat, sc = d.policy.sc;
  const name = (f.title.trim() || f.category).trim();
  const errs = [
    !name ? t("ক্যাটাগরি বাছাই করুন বা নাম দিন।", "Choose a category or enter a title.") : "",
    rooms.st.categories.some((c) => !c.archived && c.id !== f.id && c.name.toLowerCase() === name.toLowerCase()) ? t("এই নামের ধরন আগেই আছে।", "A type with this name already exists.") : "",
    !(price > 0) ? t("প্রতি রাতের দাম দিন।", "Enter the price per night.") : "",
    !f.picks.length ? t("কমপক্ষে একটা নম্বর বাছাই করুন।", "Select at least one number.") : "",
  ].filter(Boolean);
  const applyPreset = (x: (typeof TYPE_PRESETS)[number]) => p({ category: x.name, kind: x.kind, bed: x.bed, guests: x.guests, price: f.price || String(x.price) });
  const save = () => {
    if (errs.length) { setTried(true); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const r = rooms.st;
    const id = f.id ?? uid("cat");
    const prev = r.categories.find((c) => c.id === id);
    const cat: Category = {
      ...(prev ?? {}), id, name, core: f.core, preset: stay.preset, bed: f.bed, maxAdults: f.guests, maxChildren: 0, sizeSqft: f.size, amenities: f.amen, baseRate: price,
      created: prev?.created ?? new Date().toISOString(), approval: prev?.approval ?? "pending", roomKind: f.kind, meals: f.meals, mealPrices: f.mealPrices, description: f.description || undefined, photos: f.photos.length ? f.photos : undefined,
    };
    const mine = new Set(f.picks.map((x) => x.code.toUpperCase()));
    const clash = r.units.filter((u) => u.status !== "archived" && u.category !== id && mine.has(u.code.toUpperCase())).map((u) => t(`${u.local} আগেই অন্য ধরনে আছে`, `${u.local} is already in another type`));
    if (clash.length) { setConf(clash); return; }
    rooms.update((s) => {
      if (!s.config.configured) s.config = configFrom8(d, s.config);
      const i = s.categories.findIndex((c) => c.id === id);
      if (i >= 0) s.categories[i] = cat; else s.categories.push(cat);
      s.units = s.units.filter((u) => u.category !== id || mine.has(u.code.toUpperCase()));
      for (const x of f.picks) if (!s.units.some((u) => u.category === id && u.code.toUpperCase() === x.code.toUpperCase()))
        s.units.push({ id: uid("u"), code: x.code.toUpperCase(), local: x.local.toUpperCase(), node: x.node, category: id, core: f.core, preset: stay.preset, status: "draft", video: "inherit", created: nowStamp() });
    }, `${f.picks.length} ${f.core.toLowerCase()} units saved as draft · ${name}`);
    close();
  };
  const tog = (a: string) => p({ amen: f.amen.includes(a) ? f.amen.filter((x) => x !== a) : [...f.amen, a] });
  const chip = (a: string) => { const I = AM_ICON[a]; const on = f.amen.includes(a); return <Chip key={a} on={on} onClick={() => tog(a)}>{I && !on && <I className="size-4" aria-hidden />}{t(AM_BN[a] ?? a, a)}</Chip>; };
  const hit = (a: string) => !q || t(AM_BN[a] ?? a, a).toLowerCase().includes(q.toLowerCase()) || a.toLowerCase().includes(q.toLowerCase());
  const config = rooms.st.config.configured ? rooms.st.config : configFrom8(d, rooms.st.config);
  const byNode = (n: string) => f.picks.filter((x) => x.node === n);
  const I = STAY_ICON[f.core];
  const { slot } = useContext(FormSlot);
  const bar = (
    <div className="flex flex-wrap items-center gap-3">
      <span className="hidden text-[14px] text-[#4d5664] sm:inline">{t(`${num(f.picks.length, lang)}টা নম্বর`, `${f.picks.length} numbers`)}{price > 0 ? ` · ৳${num(money(price), lang)}/${t("রাত", "night")}` : ""}</span>
      <Ghost onClick={close} className="ml-auto h-11">{t("বাতিল", "Cancel")}</Ghost>
      <Primary onClick={save}>{f.id ? t("সেভ করুন", "Save") : t(`${stay.bn} যোগ করুন`, `Add ${stay.en.replace(/s$/, "").toLowerCase()}`)}</Primary>
    </div>
  );
  const sections: [string, string, boolean][] = [
    ["acc-basic", t("মূল তথ্য", "Basic information"), !!name],
    ["acc-price", t("দাম", "Price"), price > 0],
    ["acc-numbers", t("রুম নম্বর", "Room numbers"), f.picks.length > 0],
    ["acc-media", t("ছবি ও বর্ণনা", "Photos & description"), f.photos.length > 0 || !!f.description],
    ["acc-amen", t("সুবিধা", "Amenities"), f.amen.length > 0],
    ["acc-meals", t("খাবার", "Meals"), true],
  ];
  const final = Math.round(price * (1 + vat / 100 + sc / 100));
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff1f0] text-[#b11c29]"><I className="size-6" aria-hidden /></span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight sm:text-[28px]">{f.id ? t(`${nm(name, t)} বদলান`, `Edit ${name}`) : t(`নতুন ${stay.bn}`, `New ${stay.en.replace(/s$/, "").toLowerCase()}`)}</h1>
            <p className="mt-0.5 text-[14.5px] text-[#4d5664]">{t("এক পেজেই পুরো ধরন — ক্যাটাগরি বাছলে বাকিটা বসে যায়।", "The whole type on one page — pick a category and the rest fills in.")}</p>
          </div>
        </div>
        <button onClick={close} className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-3 text-[14.5px] font-medium text-[#4d5664] hover:bg-[#e9edf2]"><X className="size-4" />{t("বাতিল", "Cancel")}</button>
      </div>
      {tried && <div className="mt-4"><Errors list={errs} /></div>}
      {conf.length > 0 && <div className="mt-4"><Errors list={[t("কিছুই সেভ হয়নি:", "Nothing was saved:"), ...conf]} /></div>}

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6">
        <div className="space-y-4">
          <Card id="acc-basic" n={1} title={t("মূল তথ্য", "Basic information")} hint={t("ক্যাটাগরি বাছলে রুমের ধরন, বেড, অতিথি আর দাম বসে যায়", "A category fills room type, bed, guests and price")}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("ক্যাটাগরি", "Category")} req className="sm:col-span-2"><div className="flex flex-wrap gap-2">{presets.map((x) => <Chip key={x.key} on={f.category === x.name} onClick={() => applyPreset(x)}>{nm(x.name, t)}</Chip>)}</div></Field>
              <Field label={t("ধরনের নাম", "Room type title")} opt htmlFor="acc-title"><input id="acc-title" value={f.title} onChange={(e) => p({ title: e.target.value.slice(0, 60) })} placeholder={f.category ? nm(f.category, t) : t("যেমন: ওশান ভিউ ডিলাক্স", "e.g. Ocean View Deluxe")} className={field} /></Field>
              <Field label={t("মাপ", "Room size")} opt htmlFor="acc-size"><div className="relative"><input id="acc-size" inputMode="numeric" value={f.size ?? ""} onChange={(e) => p({ size: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || undefined })} placeholder="320" className={field + " pr-16"} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13.5px] text-[#5b6270]">{t("বর্গফুট", "sq ft")}</span></div></Field>
              <Field label={t("রুমের ধরন", "Room type")} className="sm:col-span-2"><Pills size="sm" label={t("রুমের ধরন", "Room type")} value={f.kind} onChange={(v) => { const k = ROOM_KINDS.find((x) => x.id === v)!; p({ kind: v, guests: k.guests, bed: v === "single" ? "1 Single bed" : v === "twin" ? "2 Single beds" : f.bed }); }} items={ROOM_KINDS.map((k) => ({ v: k.id, label: t(k.bn, k.en) }))} /></Field>
              <Field label={t("বেড", "Bed type")} className="sm:col-span-2"><div className="flex flex-wrap gap-2">{BEDS.map((b) => <Chip key={b.id} on={f.bed === b.id} onClick={() => p({ bed: b.id })}><BedDouble className="size-4" aria-hidden />{t(b.bn, b.en)}</Chip>)}</div></Field>
              <Field label={t("সর্বোচ্চ অতিথি", "Max guests")} req><div className="flex h-11 items-center"><Stepper label={t("অতিথি", "Guests")} value={f.guests} set={(n) => p({ guests: n })} min={1} max={12} /></div></Field>
            </div>
          </Card>

          <Card id="acc-price" n={2} title={t("দাম", "Price")} hint={t("ভ্যাট আর সার্ভিস বুকিংয়ের নিয়ম থেকে আসে, আবার যোগ হয় না", "VAT and service come from your booking rules")}>
            <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
              <Field label={t("প্রতি রাতের দাম", "Base price per night")} req htmlFor="acc-price-in">
                <div className="relative"><span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] font-semibold text-[#8e1621]">৳</span><input id="acc-price-in" aria-label={t("প্রতি রাতের দাম", "Base price per night")} inputMode="numeric" value={f.price} onChange={(e) => p({ price: e.target.value.replace(/\D/g, "").slice(0, 7) })} placeholder="5000" className={field + " h-12 pl-9 text-[19px] font-semibold tabular-nums"} /></div>
              </Field>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[[t("মূল দাম", "Base"), price], [t(`ভ্যাট ${num(vat, lang)}%`, `VAT ${vat}%`), Math.round(price * vat / 100)], [t(`সার্ভিস ${num(sc, lang)}%`, `Service ${sc}%`), Math.round(price * sc / 100)], [t("গেস্ট দেবে", "Guest pays"), final]].map(([k, v], i) => (
                  <div key={i} className={clsx("rounded-xl px-3 py-2.5", i === 3 ? "bg-[#fff1f0] ring-1 ring-[#f3b6b0]" : "bg-[#f4f6f8]")}><p className="text-[12px] font-medium text-[#5b6270]">{k}</p><p className={clsx("mt-0.5 text-[15.5px] font-semibold tabular-nums", i === 3 && "text-[#b11c29]")}>৳{num(money(v as number), lang)}</p></div>
                ))}
              </div>
            </div>
          </Card>

          <Card id="acc-numbers" n={3} title={t("রুম নম্বর", "Room numbers")} hint={isZoneCore(f.core) ? t("জোন বাছুন, তারপর নম্বর", "Pick a zone, then the numbers") : t("তলা বাছুন, তারপর নম্বর", "Pick a floor, then the numbers")}
            action={f.picks.length > 0 && <button onClick={() => setSheet(true)} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-[14px] font-semibold text-[#b11c29] hover:bg-[#fff4f3]"><Pencil className="size-3.5" />{t("বদলান", "Change")}</button>}>
            {f.picks.length === 0 ? (
              <button onClick={() => setSheet(true)} className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[#efb7b1] bg-[#fffaf9] px-4 py-6 text-center transition-colors hover:bg-[#fff4f3]">
                <span className="grid size-11 place-items-center rounded-full bg-white text-[#b11c29] shadow-sm"><Plus className="size-5" /></span>
                <span className="text-[15.5px] font-semibold text-[#b11c29]">{t("নম্বর বাছাই করুন", "Select numbers")}</span>
                <span className="text-[13px] text-[#4d5664]">{isZoneCore(f.core) ? t("যেমন: বাগান → C1, C2, C3", "e.g. Garden → C1, C2, C3") : t("যেমন: ফ্লোর ১ → 101, 102, 104", "e.g. Floor 1 → 101, 102, 104")}</span>
              </button>
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {config.nodes.filter((n) => byNode(n.id).length).map((n) => (
                  <div key={n.id} className="rounded-xl bg-[#f4f6f8] p-3">
                    <p className="flex items-center gap-1.5 text-[13.5px] font-semibold">{n.kind === "ZONE" ? <Trees className="size-3.5 text-[#4d5664]" /> : <Building2 className="size-3.5 text-[#4d5664]" />}{placeLabel(d, config, n, lang === "bn")}<span className="font-normal text-[#4d5664]">· {num(byNode(n.id).length, lang)}</span></p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{byNode(n.id).map((x) => <span key={x.code} className="inline-flex items-center gap-1 rounded-full bg-white py-1 pl-2.5 pr-1 font-mono text-[13px] font-semibold text-[#8e1621] ring-1 ring-[#f3d3cf]">{x.local}<button onClick={() => p({ picks: f.picks.filter((y) => y.code !== x.code) })} aria-label={t(`${x.local} বাদ দিন`, `Remove ${x.local}`)} className="grid size-5 place-items-center rounded-full hover:bg-[#fff1f0]"><X className="size-3" /></button></span>)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card id="acc-media" n={4} title={t("ছবি ও বর্ণনা", "Photos & description")} hint={t("ঐচ্ছিক — পরে HMS থেকেও দেওয়া যায়", "Optional — you can add these later in HMS")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c6ccd4] bg-[#f9fafb] px-4 py-5 text-center hover:border-[#9aa0ac] focus-within:ring-4 focus-within:ring-[#0f1720]/10">
                <ImagePlus className="size-7 text-[#b11c29]" aria-hidden /><span className="text-[15px] font-semibold">{t("ছবি দিন", "Add photos")}</span><span className="text-[12.5px] text-[#4d5664]">PNG · JPG · WEBP · {num(f.photos.length, lang)}/{num(100, lang)}</span>
                <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => p({ photos: [...f.photos, ...Array.from(e.target.files ?? []).map((x) => x.name)].slice(0, 100) })} />
                {f.photos.length > 0 && <span className="max-w-full truncate text-[12px] text-[#4d5664]">{f.photos.join(", ")}</span>}
              </label>
              <div><label htmlFor="acc-desc" className="sr-only">{t("বর্ণনা", "Description")}</label>
                <textarea id="acc-desc" rows={5} maxLength={1000} value={f.description} onChange={(e) => p({ description: e.target.value })} placeholder={t("রুমের বিশেষত্ব, ভিউ, কী কী আছে…", "Features, views, what makes it special…")} className={field + " h-full min-h-[132px] resize-none py-2.5"} /></div>
            </div>
          </Card>

          <Card id="acc-amen" n={5} title={t("সুবিধা", "Amenities")} hint={t(`${num(f.amen.length, lang)}টা বাছাই করা`, `${f.amen.length} selected`)}>
            <div className="flex flex-wrap gap-2">{ROOM_TOP.map(chip)}</div>
            {!all ? <button onClick={() => setAll(true)} className="mt-3 text-[14px] font-semibold text-[#b11c29]">+ {t("সব সুবিধা দেখুন", "Amenities library")}</button> : (
              <div className="mt-4 space-y-3 rounded-xl bg-[#f4f6f8] p-3">
                <input aria-label={t("সুবিধা খুঁজুন", "Search amenities")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("সুবিধা খুঁজুন", "Search amenities")} className={field} />
                {AMENITIES.map((g) => { const rest = g.items.filter((a) => !ROOM_TOP.includes(a) && hit(a)); return rest.length ? <div key={g.group}><p className="text-[12.5px] font-semibold text-[#4d5664]">{g.group}</p><div className="mt-1.5 flex flex-wrap gap-2">{rest.map(chip)}</div></div> : null; })}
              </div>
            )}
          </Card>

          <Card id="acc-meals" n={6} title={t("খাবার", "Meals")} hint={t("রুমের সাথে কোন খাবার থাকে", "Which meals come with this room")}>
            <div className="divide-y divide-[#e9edf2]">
              {MEALS.map(([k, bn, en]) => (
                <div key={k} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-[110px] flex-1 text-[15px] font-semibold">{t(bn, en)}</span>
                  {f.meals[k] === "extra" && <span className="flex items-center gap-1"><span className="text-[14px] text-[#8e1621]">৳</span><input aria-label={t(`${bn}-এর দাম`, `${en} price`)} inputMode="numeric" value={f.mealPrices[k] ?? ""} onChange={(e) => p({ mealPrices: { ...f.mealPrices, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || undefined } })} placeholder="500" className={field + " h-9 w-[84px]"} /><span className="text-[12.5px] text-[#4d5664]">/{t("জন", "person")}</span></span>}
                  <Pills size="sm" label={t(bn, en)} value={f.meals[k]} onChange={(v) => p({ meals: { ...f.meals, [k]: v } })} items={[{ v: "none" as MealMode, label: t("নেই", "None") }, { v: "included" as MealMode, label: t("সাথে আছে", "Included") }, { v: "extra" as MealMode, label: t("আলাদা দাম", "Extra (paid)") }]} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[88px] space-y-3">
            <div className="overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white">
              <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-[#fff1f0] to-[#e9edf2] text-[#b11c29]"><I className="size-10" strokeWidth={1.5} /></div>
              <div className="space-y-1.5 p-4">
                <p className={clsx("text-[16.5px] font-semibold", !name && "text-[#5b6270]")}>{name ? nm(name, t) : t("ধরনের নাম", "Type name")}</p>
                <p className="flex flex-wrap gap-x-3 text-[13px] text-[#4d5664]"><span className="inline-flex items-center gap-1"><UsersRound className="size-3.5" />{num(f.guests, lang)}</span><span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{t(BEDS.find((b) => b.id === f.bed)?.bn ?? f.bed, BEDS.find((b) => b.id === f.bed)?.en ?? f.bed)}</span></p>
                <p className="border-t border-[#e9edf2] pt-2 text-[13px] text-[#4d5664]">{price ? <><b className="text-[18px] text-[#0f1720]">৳{num(money(final), lang)}</b> /{t("রাত", "night")}</> : t("দাম দিন", "Add a price")}</p>
                <p className="text-[13px] text-[#4d5664]">{t(`${num(f.picks.length, lang)}টা ${stay.bn}`, `${f.picks.length} ${stay.en.toLowerCase()}`)}</p>
              </div>
            </div>
            <nav aria-label={t("অংশগুলো", "Sections")} className="rounded-2xl border border-[#e3e7ec] bg-white p-2">
              {sections.map(([id, lab, ok], i) => (
                <button key={id} onClick={() => jump(id)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] hover:bg-[#f4f6f8]">
                  <span className={clsx("grid size-5 place-items-center rounded-full text-[11px] font-semibold", ok ? "bg-[#1c7d45] text-white" : "bg-[#e9edf2] text-[#4d5664]")}>{ok ? <Check className="size-3" strokeWidth={3} /> : num(i + 1, lang)}</span>{lab}
                </button>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      {slot ? createPortal(bar, slot) : <div className="mt-8">{bar}</div>}
      {sheet && <PlacesSheet d={d} rooms={rooms} f={f} config={config} onClose={(picks) => { p({ picks }); setSheet(false); }} />}
    </section>
  );
}
function Card({ id, n, title, hint, action, children }: { id: string; n: number; title: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  const { lang } = useL();
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-[#e3e7ec] bg-white p-5 shadow-[0_1px_2px_rgb(16_24_40/0.04)] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#0f1720] text-[13px] font-semibold text-white">{num(n, lang)}</span>
        <div className="min-w-0 flex-1"><h2 className="text-[17.5px] font-semibold leading-snug">{title}</h2>{hint && <p className="text-[13.5px] text-[#4d5664]">{hint}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Field({ label: lab, req, opt, htmlFor, className, children }: { label: string; req?: boolean; opt?: boolean; htmlFor?: string; className?: string; children: React.ReactNode }) {
  const { t } = useL();
  const L = htmlFor ? "label" : "p";
  return <div className={className}><L {...(htmlFor ? { htmlFor } : {})} className="mb-1.5 block text-[13.5px] font-semibold text-[#2b3340]">{lab}{req && <span className="text-[#b11c29]"> *</span>}{opt && <span className="font-normal text-[#5b6270]"> · {t("ঐচ্ছিক", "optional")}</span>}</L>{children}</div>;
}

/** Number picking, like the live "Select Room Numbers": place cards (N available · View) → number grid → chips with ×. */
function PlacesSheet({ d, rooms, f, config, onClose }: { d: Draft; rooms: Rooms; f: Form; config: Config; onClose: (p: Pick[]) => void }) {
  const { t, lang } = useL();
  const bn = lang === "bn";
  const [sel, setSel] = useState<Pick[]>(f.picks);
  const [open, setOpen] = useState<LocNode | null>(null);
  const zone = isZoneCore(f.core);
  const places = config.nodes.filter((n) => n.active && (zone ? n.kind === "ZONE" : n.kind === "FLOOR" || n.kind === "LEVEL"));
  const taken = new Set(rooms.st.units.filter((u) => u.status !== "archived" && u.category !== f.id).map((u) => u.code.toUpperCase()));
  return createPortal(
    <div className="bingi-ui fixed inset-0 z-50 flex items-end justify-center bg-[#0f1720]/15 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={() => onClose(sel)}>
      <div role="dialog" aria-modal="true" aria-label={t("নম্বর বাছাই করুন", "Select numbers")} onClick={(e) => e.stopPropagation()} className="onb-in flex max-h-[92dvh] w-full max-w-[760px] flex-col rounded-t-xl bg-white shadow-2xl sm:rounded-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#e9edf2] px-5 py-4">
          <div><h2 className="text-[18px] font-semibold">{t("নম্বর বাছাই করুন", "Select numbers")}</h2><p className="text-[13.5px] text-[#4d5664]">{zone ? t("আগে জোন, তারপর নম্বর।", "Choose a zone first, then the numbers.") : t("আগে তলা, তারপর নম্বর।", "Choose a floor first, then the numbers.")}</p></div>
          <button onClick={() => onClose(sel)} aria-label={t("বন্ধ করুন", "Close")} className="grid size-9 place-items-center rounded-full border border-[#c6ccd4]"><X className="size-5" /></button>
        </div>
        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-5 sm:grid-cols-2">
          {places.map((n) => {
            const list = numbersFor(config, n, f.core, d.ground);
            const free = list.filter((x) => !taken.has(x.code.toUpperCase())).length;
            const here = sel.filter((x) => x.node === n.id);
            return (
              <div key={n.id} className="rounded-xl border border-[#e3e7ec] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate text-[16px] font-semibold">{placeLabel(d, config, n, bn)}</p><p className="text-[13px] text-[#4d5664]">{t(`${num(free, lang)}টা খালি`, `${free} available`)}</p></div>
                  <button onClick={() => setOpen(n)} aria-label={t(`${placeLabel(d, config, n, true)} — নম্বর দেখুন`, `${placeLabel(d, config, n, false)} — view numbers`)} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-[#efb7b1] px-3 text-[13.5px] font-semibold text-[#b11c29] hover:bg-[#fff4f3]"><Plus className="size-3.5" />{t("নম্বর দেখুন", "View")}</button>
                </div>
                <div className="mt-3 flex min-h-[28px] flex-wrap gap-1.5">
                  {here.length ? here.map((x) => <span key={x.code} className="inline-flex items-center gap-1 rounded-full bg-[#fff1f0] py-0.5 pl-2.5 pr-1 font-mono text-[12.5px] font-semibold text-[#8e1621]">{x.local}<button onClick={() => setSel(sel.filter((y) => y.code !== x.code))} aria-label={t(`${x.local} বাদ দিন`, `Remove ${x.local}`)} className="grid size-5 place-items-center rounded-full hover:bg-white"><X className="size-3" /></button></span>)
                    : <span className="text-[13px] text-[#5b6270]">{t("এখান থেকে কিছু বাছাই হয়নি", "Nothing selected here yet")}</span>}
                </div>
              </div>
            );
          })}
          {!places.length && <p className="text-[14.5px] text-[#4d5664]">{t("আগের ধাপে তলা বা জোন বাছাই করুন।", "Set floors or zones in the previous step.")}</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-[#e9edf2] px-5 py-3.5">
          <span className="text-[14px] text-[#4d5664]">{t(`মোট ${num(sel.length, lang)}টা`, `${sel.length} selected`)}</span>
          <Ghost onClick={() => onClose(f.picks)} className="ml-auto h-10">{t("বাতিল", "Cancel")}</Ghost>
          <Primary onClick={() => onClose(sel)} className="h-10">{t("নম্বর সেভ করুন", "Save numbers")}</Primary>
        </div>
      </div>
      {open && <NumberSheet place={open} name={placeLabel(d, config, open, bn)} list={numbersFor(config, open, f.core, d.ground)} taken={taken} picks={sel} onClose={(p) => { setSel(p); setOpen(null); }} label={(x) => x.local} />}
    </div>,
    document.body,
  );
}

export function Totals({ d, total, cats }: { d: Draft; total: number; cats?: number }) {
  const { t, lang } = useL();
  const plan = d.planPicked ? d.plan : recommend(d);
  const q = quote(plan, total, d.cycle);
  if (!total) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-[#0f1720] px-5 py-4 text-white">
      <span><span className="block text-[12.5px] text-white/65">{t("মোট রুম", "Total rooms")}</span><b className="text-[20px] tabular-nums">{num(total, lang)}</b>{cats ? <span className="text-[13px] text-white/65"> · {t(`${num(cats, lang)}টা ধরন`, `${cats} types`)}</span> : null}</span>
      <span className="ml-auto text-right"><span className="block text-[12.5px] text-white/65">{PLANS[plan].label} · {d.cycle === 1 ? t("মাসিক", "monthly") : t(`${num(d.cycle, lang)} মাস`, `${d.cycle} months`)}</span><b className="text-[20px] tabular-nums">৳{num(money(q.monthly), lang)}</b><span className="text-[13px] text-white/65">/{t("মাস", "month")}</span></span>
      {total < q.billed && <span className="w-full text-[12.5px] text-white/65">{t(`কমপক্ষে ${num(q.billed, lang)}টা রুমের বিল হয়।`, `Minimum ${q.billed} rooms are billed.`)}</span>}
    </div>
  );
}

// ---------- 3.3 Review ----------
export function ReviewRooms({ d, rooms, go }: { d: Draft; rooms: Rooms; go: (s: StepId) => void }) {
  const { t, lang } = useL();
  const st = rooms.st;
  const config = st.config;
  const live = st.units.filter((u) => u.status !== "archived");
  const cats = liveCats(st);
  const places = config.nodes.filter((n) => live.some((u) => u.node === n.id));
  const remove = (id: string) => rooms.update((s) => { s.units = s.units.filter((u) => u.id !== id); }, "Room removed in onboarding review");
  const tiles: [string, number, StepId, typeof BedDouble][] = [[t("রুমের ধরন", "Room types"), cats.length, "3.2", BedDouble], [t("তলা / জোন", "Floors / zones"), places.length, "3.1", Building2], [t("মোট রুম", "Rooms"), live.length, "3.2", Hash]];
  return (
    <section>
      <Head title={t("রুম মিলিয়ে নিন", "Check your rooms")} sub={t("ঠিক থাকলে পরের ধাপে যান। যেকোনো কিছু বদলাতে চাপ দিন।", "If it all looks right, go on. Tap anything to change it.")} />
      <div className="mt-6 grid grid-cols-3 gap-3">
        {tiles.map(([k, v, s, I], i) => (
          <button key={i} onClick={() => go(s)} className="group rounded-2xl border border-[#e3e7ec] bg-white p-4 text-left shadow-[0_1px_2px_rgb(15_23_32/0.04)] transition-[border-color] hover:border-[#0f1720]">
            <span className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#f4f6f8] text-[#0f1720]"><I className="size-[18px]" /></span><Pencil className="size-3.5 text-[#5b6270] opacity-0 transition-opacity group-hover:opacity-100" /></span>
            <span className="mt-3 block text-[26px] font-semibold leading-none tabular-nums">{num(v, lang)}</span>
            <span className="mt-1 block text-[13px] text-[#4d5664]">{k}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#e3e7ec] bg-white">
        <p className="border-b border-[#f0f2f5] px-4 py-3 text-[15px] font-semibold">{t("ধরন ও দাম", "Types & prices")}</p>
        <ul className="divide-y divide-[#f0f2f5]">
          {cats.map((c) => { const I = STAY_ICON[c.core]; const n = live.filter((u) => u.category === c.id).length; return (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: colorOf(st, c.id) }}><I className="size-[18px]" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{nm(c.name, t)}</span><span className="text-[13px] text-[#4d5664]">{t(`${num(c.maxAdults, lang)} জন · ${num(n, lang)}টা`, `${c.maxAdults} guests · ${n} units`)}</span></span>
              <span className="text-right text-[15px] font-semibold tabular-nums">৳{num(money(c.baseRate), lang)}<span className="text-[12.5px] font-normal text-[#4d5664]">/{t("রাত", "night")}</span></span>
              <span className="hidden rounded-full bg-[#fdf6e7] px-2 py-0.5 text-[12px] font-semibold text-[#7a4a0b] sm:inline">{t("অনুমোদন বাকি", "Awaiting approval")}</span>
            </li>); })}
        </ul>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {places.map((p) => {
          const us = live.filter((u) => u.node === p.id).sort((a, b) => a.local.localeCompare(b.local, undefined, { numeric: true }));
          return (
            <div key={p.id} className="rounded-2xl border border-[#e3e7ec] bg-white p-4">
              <p className="flex items-center gap-2 text-[15px] font-semibold"><span className={clsx("grid size-7 place-items-center rounded-lg", p.kind === "ZONE" ? "bg-[#eef7f1] text-[#1c7d45]" : "bg-[#f4f6f8] text-[#0f1720]")}>{p.kind === "ZONE" ? <Trees className="size-4" /> : <Building2 className="size-4" />}</span>{placeLabel(d, config, p, lang === "bn")}<span className="ml-auto text-[13px] font-normal text-[#4d5664]">{t(`${num(us.length, lang)}টা`, `${us.length}`)}</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {us.map((u) => (
                  <span key={u.id} className="group/u relative inline-flex items-center gap-1.5 rounded-lg border border-[#e3e7ec] py-1 pl-2 pr-1 font-mono text-[13px] font-semibold">
                    <span className="size-2 rounded-full" style={{ background: colorOf(st, u.category) }} />{u.local}
                    <button onClick={() => remove(u.id)} aria-label={t(`${u.local} বাদ দিন`, `Remove ${u.local}`)} className="grid size-5 place-items-center rounded text-[#5b6270] opacity-40 transition-opacity hover:bg-[#fff1f0] hover:text-[#8e1621] focus-visible:opacity-100 group-hover/u:opacity-100"><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f4f6f8] px-4 py-3 text-[13.5px] text-[#4d5664]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1c7d45]" />{t("সব রুম ড্রাফট হিসেবে সেভ। BinGi প্রতিটা ধরন অনুমোদন করলে বুকিং শুরু হবে।", "Every room is saved as a draft. Bookings open once BinGi approves each type.")}</p>
      <Totals d={d} total={live.length} cats={cats.length} />
    </section>
  );
}
