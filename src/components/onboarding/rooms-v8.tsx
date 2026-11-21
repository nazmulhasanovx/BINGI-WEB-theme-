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
import { BedDouble, Building2, ChevronRight, ImagePlus, Pencil, Plus, Trash2, Trees, UsersRound, X } from "lucide-react";
import { AMENITIES, type CoreType } from "@/lib/rooms/catalog";
import { nowStamp, uid, type Category, type Config, type LocNode, type MealMode, type Pick, type useRooms } from "@/lib/rooms/store";
import { PLANS, num, quote, recommend, useL, useOnboarding, type Draft, type StepId } from "@/lib/onboarding/store";
import { BEDS, BUILDINGS, MAX_FLOOR, ROOM_KINDS, STAY } from "@/lib/onboarding/rooms-easy";
import { BN_NAME, FITS, MAX_ZONES, ROOM_TOP, TYPE_PRESETS, configFrom8, isZoneCore, levelName, numbersFor, zoneDefault, zoneName } from "@/lib/onboarding/rooms-v8";
import { money } from "../hms/rooms/parts";
import { AM_BN, AM_ICON, FormSlot, NumberSheet, STAY_ICON } from "./rooms-easy";
import { Chip, Errors, Ghost, Pills, Primary, Q, Stepper, Tile, field, label } from "./shell";

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
export function Place({ d, st }: { d: Draft; st: Rooms["st"] }) {
  const { edit } = useOnboarding();
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
  return (
    <Q title={t("কোথায় আছে?", "Where are they?")} sub={t("আপনার property-র ধরন দেখে আগেই সাজানো। মিলিয়ে নিন, দরকার হলে বদলান।", "Already set from your property type. Check it and change what's different.")}
      why={t("এখান থেকেই রুম নম্বর আপনা-আপনি তৈরি হয় — নিজে কিছু লিখতে হয় না।", "Room numbers are made from this — nothing to type.")}>
      <p className="text-[15.5px] font-semibold">{t("কী ভাড়া দেন", "What you rent")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {shown.map((s) => {
          const on = d.stay.includes(s.id);
          const I = STAY_ICON[s.id];
          const lock = on && usedCore.has(s.id);
          return <Chip key={s.id} on={on} disabled={lock} title={lock ? t("এখানে রুম আছে", "Has rooms") : undefined} onClick={() => edit((x) => { x.stay = on ? x.stay.filter((y) => y !== s.id) : [...x.stay, s.id]; if (!isZoneCore(s.id) && !x.floors.length) x.floors = [1]; })}><I className="size-4" aria-hidden />{t(s.bn, s.en)}</Chip>;
        })}
        {!more && <button onClick={() => setMore(true)} className="h-10 px-2 text-[14.5px] font-semibold text-[#b11c29]">+ {t("আরও", "More")}</button>}
      </div>

      {floorKinds && (
        <section className="mt-8 space-y-4">
          <h2 className="text-[17px] font-semibold">{t("বিল্ডিং", "Building")}</h2>
          <div className="flex flex-wrap gap-2">
            {BUILDINGS.map((b) => {
              const on = bs.includes(b.id);
              const lock = on && st.config.nodes.some((n) => n.parent === `b-${b.id}` && usedNode.has(n.id));
              return <Chip key={b.id} on={on} disabled={lock} onClick={() => edit((x) => { const cur = x.buildings.length ? x.buildings : ["main"]; const nx = cur.includes(b.id) ? cur.filter((y) => y !== b.id) : [...cur, b.id]; x.buildings = nx.length ? nx : ["main"]; })}><Building2 className="size-4" aria-hidden />{t(b.bn, b.en)}</Chip>;
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[14.5px] text-[#4d5664]">{t("নাম যেভাবে:", "Called:")}</span>
            <Pills size="sm" label={t("তলার নাম", "Floor names")} value={d.place.floorStyle} onChange={(v) => edit((x) => { x.place.floorStyle = v; })} items={[{ v: "floor", label: t("ফ্লোর ১, ২…", "Floor 1, 2…") }, { v: "level", label: t("লেভেল ১, ২…", "Level 1, 2…") }]} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Box title={d.place.floorStyle === "level" ? t("কয়টা লেভেল?", "How many levels?") : t("কয়টা ফ্লোর?", "How many floors?")} sub={top ? `${levelName(d.place.floorStyle, 1, bn)} – ${levelName(d.place.floorStyle, top, bn)}` : ""}>
              <Stepper label={t("তলা", "Floors")} value={top} set={(n) => setFloors(Math.max(n, minTop), ground)} min={minTop} max={MAX_FLOOR} />
            </Box>
            <Box title={t("গ্রাউন্ড", "Ground")} sub={ground ? (d.ground === "G" ? "G01, G02…" : "001, 002…") : t("রুম নেই", "No rooms")}>
              <label className="flex items-center gap-2 text-[14.5px] font-semibold"><input type="checkbox" checked={ground} disabled={usedLevels.includes(0)} onChange={(e) => setFloors(Math.max(top, 1), e.target.checked)} className="size-5 accent-[#b11c29]" />{t("আছে", "Has rooms")}</label>
            </Box>
            <Box title={t("বেসমেন্ট", "Basement")} sub={d.place.basements ? `B101… · ${num(d.place.basements, lang)}` : t("নেই", "None")}>
              <Stepper label={t("বেসমেন্ট", "Basements")} value={d.place.basements} set={(n) => edit((x) => { x.place.basements = Math.max(n, minBase); })} min={minBase} max={3} />
            </Box>
          </div>
          {top > 0 && <p className="text-[14px] text-[#4d5664]">{t("নম্বর:", "Numbers:")} <b className="font-mono text-[#0f1720]">101, 102…{top > 1 ? ` · ${top}01…` : ""}</b></p>}
        </section>
      )}

      {zoneKinds && (
        <section className="mt-8 space-y-4">
          <h2 className="text-[17px] font-semibold">{t("কটেজ / ভিলা কোথায়", "Where the cottages / villas are")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Pills size="sm" label={t("জোন না ব্লক", "Zone or block")} value={d.place.zoneStyle} onChange={(v) => edit((x) => { x.place.zoneStyle = v; })} items={[{ v: "zone", label: t("জোন", "Zones") }, { v: "block", label: t("ব্লক", "Blocks") }]} />
            <span className="text-[14.5px] text-[#4d5664]">{t("কয়টা?", "How many?")}</span>
            <Stepper label={t("জোন", "Zones")} value={d.place.zoneCount} set={(n) => edit((x) => { x.place.zoneCount = Math.max(n, minZones); })} min={minZones} max={MAX_ZONES} />
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: d.place.zoneCount }, (_, i) => i + 1).map((i) => (
              <li key={i} className="flex items-center gap-2 rounded-xl border border-[#c6ccd4] bg-white px-3 py-2">
                <Trees className="size-4 shrink-0 text-[#4d5664]" aria-hidden />
                <input aria-label={t(`${zoneDefault(d, i, true)}-এর নাম`, `${zoneDefault(d, i, false)} name`)} value={d.place.zoneNames[i - 1] ?? ""} placeholder={zoneDefault(d, i, bn)}
                  onChange={(e) => edit((x) => { const a = [...x.place.zoneNames]; a[i - 1] = e.target.value.slice(0, 30); x.place.zoneNames = a; })}
                  className="h-9 min-w-0 flex-1 rounded-md bg-transparent px-1 text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-[#5b6270] focus:bg-[#f4f6f8]" />
                <span className="font-mono text-[12px] text-[#5b6270]">{d.place.zoneStyle === "block" ? "BL" : "Z"}{i}</span>
              </li>
            ))}
          </ul>
          <p className="text-[14px] text-[#4d5664]">{t("নাম না দিলে \"জোন ১\" থাকবে। প্রতিটা জোনে নম্বর:", "Leave empty to keep \"Zone 1\". Numbers in each zone:")} <b className="font-mono text-[#0f1720]">{d.stay.filter(isZoneCore).map((s) => `${STAY.find((x) => x.id === s)!.prefix}1–${STAY.find((x) => x.id === s)!.prefix}100`).join(" · ")}</b></p>
        </section>
      )}
    </Q>
  );
}
function Box({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-[#c6ccd4] bg-white p-4"><p className="text-[15px] font-semibold">{title}</p><p className="mt-0.5 min-h-[20px] text-[13px] text-[#4d5664]">{sub}</p><div className="mt-3">{children}</div></div>;
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
  return (
    <Q title={t("রুম যোগ করুন", "Add your rooms")} sub={t("একটা একটা করে ধরন যোগ করুন। এক পেজেই দাম, নম্বর, সুবিধা — সব।", "Add one type at a time. One page holds price, numbers and amenities.")}
      why={t("এখনকার HMS-এর \"Add New Room\"-এর মতোই। নম্বর তালিকা থেকে বাছাই — নিজে লিখতে হয় না।", "Same as \"Add New Room\" in the HMS today. Numbers come from a ready list.")}>
      {cats.length > 0 && (
        <ul className="mb-4 grid gap-3">
          {cats.map((c) => {
            const us = live.filter((u) => u.category === c.id);
            const I = STAY_ICON[c.core];
            return (
              <li key={c.id} className="onb-in flex gap-3 rounded-xl border border-[#c6ccd4] bg-white p-3.5">
                <span className="grid size-14 shrink-0 place-items-center rounded-xl text-white" style={{ background: colorOf(st, c.id) }}><I className="size-7" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16.5px] font-semibold">{nm(c.name, t)}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 text-[13.5px] text-[#4d5664]"><span className="inline-flex items-center gap-1"><UsersRound className="size-3.5" />{num(c.maxAdults, lang)}</span><span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{t(BEDS.find((b) => b.id === c.bed)?.bn ?? c.bed, BEDS.find((b) => b.id === c.bed)?.en ?? c.bed)}</span><span className="font-semibold text-[#8e1621]">৳{num(money(c.baseRate), lang)} / {t("রাত", "night")}</span></p>
                  <p className="mt-1.5 flex flex-wrap gap-1">{us.slice(0, 14).map((u) => <span key={u.id} className="rounded-md bg-[#e9edf2] px-1.5 py-0.5 font-mono text-[12.5px] font-semibold">{u.local}</span>)}{us.length > 14 && <span className="text-[12.5px] text-[#4d5664]">+{num(us.length - 14, lang)}</span>}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 self-start">
                  <button onClick={() => editCat(c)} aria-label={t(`${c.name} বদলান`, `Edit ${c.name}`)} className="grid size-9 place-items-center rounded-full text-[#4d5664] hover:bg-[#e9edf2]"><Pencil className="size-4" /></button>
                  <button onClick={() => remove(c)} aria-label={t(`${c.name} মুছুন`, `Remove ${c.name}`)} className="grid size-9 place-items-center rounded-full text-[#4d5664] hover:bg-[#fff1f0] hover:text-[#8e1621]"><Trash2 className="size-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {!pick ? (
        <button onClick={() => (kinds.length > 1 ? setPick(true) : start((kinds[0]?.id ?? "ROOM") as CoreType))} className="flex w-full items-center gap-4 rounded-xl border border-dashed border-[#efb7b1] bg-[#fffaf9] p-4 text-left transition-colors hover:bg-[#fff4f3]">
          <span className="grid size-12 place-items-center rounded-xl bg-[#b11c29] text-white"><Plus className="size-6" /></span>
          <span><span className="block text-[17px] font-semibold">{cats.length ? t("আরেকটা ধরন যোগ করুন", "Add another type") : t("প্রথম ধরন যোগ করুন", "Add your first type")}</span><span className="text-[14px] text-[#4d5664]">{kinds.map((k) => t(k.bn, k.en)).join(" · ")}</span></span>
          <ChevronRight className="ml-auto size-5 text-[#b11c29]" />
        </button>
      ) : (
        <div className="onb-in rounded-xl border border-[#e3e7ec] bg-white p-4">
          <p className="text-[15.5px] font-semibold">{t("কী যোগ করবেন?", "What are you adding?")}</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">{kinds.map((k) => { const I = STAY_ICON[k.id]; return <Tile key={k.id} on={false} onClick={() => start(k.id)} icon={<I className="size-6" />} title={t(k.bn, k.en)} sub={t(k.subBn, k.subEn)} />; })}</div>
          <button onClick={() => setPick(false)} className="mt-3 text-[14px] font-semibold text-[#4d5664] underline underline-offset-4">{t("বাতিল", "Cancel")}</button>
        </div>
      )}
      <Totals d={d} total={live.length} />
    </Q>
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
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-[24px] font-semibold leading-tight sm:text-[28px]"><I className="size-7 text-[#b11c29]" aria-hidden />{f.id ? t(`${nm(name, t)} বদলান`, `Edit ${name}`) : t(`নতুন ${stay.bn}`, `New ${stay.en.replace(/s$/, "").toLowerCase()}`)}</h1>
        <button onClick={close} className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-[14.5px] font-medium text-[#4d5664] hover:bg-[#e9edf2]"><X className="size-4" />{t("বাতিল", "Cancel")}</button>
      </div>
      {tried && <div className="mt-4"><Errors list={errs} /></div>}
      {conf.length > 0 && <div className="mt-4"><Errors list={[t("কিছুই সেভ হয়নি:", "Nothing was saved:"), ...conf]} /></div>}

      <Part title={t("মূল তথ্য", "Basic information")} first>
        <div><p className={label}>{t("ক্যাটাগরি", "Category")} *</p><div className="mt-1.5 flex flex-wrap gap-2">{presets.map((x) => <Chip key={x.key} on={f.category === x.name} onClick={() => applyPreset(x)}>{nm(x.name, t)}</Chip>)}</div></div>
        <div><label htmlFor="acc-title" className={label}>{t("ধরনের নাম", "Room type title")} <span className="font-normal text-[#4d5664]">({t("ঐচ্ছিক", "optional")})</span></label><input id="acc-title" value={f.title} onChange={(e) => p({ title: e.target.value.slice(0, 60) })} placeholder={t("যেমন: ওশান ভিউ ডিলাক্স", "e.g. Ocean View Deluxe")} className={field + " mt-1.5"} /></div>
        <div><p className={label}>{t("রুমের ধরন", "Room type")}</p><div className="mt-1.5 flex flex-wrap gap-2">{ROOM_KINDS.map((k) => <Chip key={k.id} on={f.kind === k.id} onClick={() => p({ kind: k.id, guests: k.guests, bed: k.id === "single" ? "1 Single bed" : k.id === "twin" ? "2 Single beds" : f.bed })}>{t(k.bn, k.en)}</Chip>)}</div></div>
        <div><p className={label}>{t("বেড", "Bed type")}</p><div className="mt-1.5 flex flex-wrap gap-2">{BEDS.map((b) => <Chip key={b.id} on={f.bed === b.id} onClick={() => p({ bed: b.id })}>{t(b.bn, b.en)}</Chip>)}</div></div>
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <div><p className={label}>{t("সর্বোচ্চ অতিথি", "Max guests")} *</p><div className="mt-1.5"><Stepper label={t("অতিথি", "Guests")} value={f.guests} set={(n) => p({ guests: n })} min={1} max={12} /></div></div>
          <div><label htmlFor="acc-size" className={label}>{t("মাপ (বর্গফুট)", "Room size (sq ft)")}</label><input id="acc-size" inputMode="numeric" value={f.size ?? ""} onChange={(e) => p({ size: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || undefined })} placeholder="320" className={field + " mt-1.5 w-[140px]"} /></div>
        </div>
      </Part>

      <Part title={t("দাম", "Price")}>
        <div className="flex flex-wrap items-center gap-2"><span className="text-[22px] font-semibold text-[#8e1621]">৳</span><input id="acc-price" aria-label={t("প্রতি রাতের দাম", "Base price per night")} inputMode="numeric" value={f.price} onChange={(e) => p({ price: e.target.value.replace(/\D/g, "").slice(0, 7) })} placeholder="5000" className={field + " h-12 max-w-[200px] text-[20px] font-semibold"} /><span className="text-[14px] text-[#4d5664]">/{t("রাত", "night")}</span></div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#fff6f5] p-3 sm:grid-cols-4">
          {[[t("মূল দাম", "Base price"), price], [t(`ভ্যাট (${num(vat, lang)}%)`, `VAT (${vat}%)`), Math.round(price * vat / 100)], [t(`সার্ভিস (${num(sc, lang)}%)`, `Service (${sc}%)`), Math.round(price * sc / 100)], [t("বুকিং দাম", "Final booking price"), Math.round(price * (1 + vat / 100 + sc / 100))]].map(([k, v], i) => (
            <div key={i} className={clsx("rounded-lg border bg-white px-3 py-2", i === 3 ? "border-[#f3b6b0]" : "border-[#f1e1df]")}><p className="text-[11.5px] font-semibold uppercase tracking-wide text-[#5b6270]">{k}</p><p className={clsx("mt-0.5 text-[15px] font-semibold tabular-nums", i === 3 && "text-[#b11c29]")}>৳{num(money(v as number), lang)}</p></div>
          ))}
        </div>
        <p className="text-[12.5px] text-[#4d5664]">{t("ভ্যাট আর সার্ভিস চার্জ বুকিংয়ের নিয়ম থেকে আসে, আবার যোগ হয় না।", "VAT and service come from your booking rules and are not added again.")}</p>
      </Part>

      <Part title={t("রুম নম্বর", "Room numbers")} action={<Ghost onClick={() => setSheet(true)} className="h-10 border-dashed border-[#efb7b1] text-[#b11c29] hover:border-[#b11c29]"><Plus className="size-4" />{t("নম্বর বাছাই করুন", "Select numbers")}</Ghost>}>
        {f.picks.length === 0 ? <p className="text-[14.5px] text-[#4d5664]">{t("এখনো কোনো নম্বর বাছাই হয়নি।", "No numbers selected yet.")}</p> : (
          <div className="space-y-2">
            {config.nodes.filter((n) => byNode(n.id).length).map((n) => (
              <div key={n.id}><p className="text-[13px] font-semibold text-[#4d5664]">{placeLabel(d, config, n, lang === "bn")}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">{byNode(n.id).map((x) => <span key={x.code} className="inline-flex items-center gap-1 rounded-full bg-[#fff1f0] py-1 pl-2.5 pr-1 font-mono text-[13px] font-semibold text-[#8e1621]">{x.local}<button onClick={() => p({ picks: f.picks.filter((y) => y.code !== x.code) })} aria-label={t(`${x.local} বাদ দিন`, `Remove ${x.local}`)} className="grid size-5 place-items-center rounded-full hover:bg-white"><X className="size-3" /></button></span>)}</div>
              </div>
            ))}
          </div>
        )}
      </Part>

      <Part title={t("ছবি", "Room images")}>
        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-[#efb7b1] bg-[#fffaf9] px-4 py-6 text-center focus-within:ring-4 focus-within:ring-[#0f1720]/10">
          <ImagePlus className="size-7 text-[#b11c29]" aria-hidden /><span className="text-[15px] font-semibold">{t("ছবি দিন (ঐচ্ছিক)", "Add photos (optional)")}</span><span className="text-[12.5px] text-[#4d5664]">PNG · JPG · WEBP · {num(f.photos.length, lang)}/{num(100, lang)}</span>
          <input type="file" multiple accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => p({ photos: [...f.photos, ...Array.from(e.target.files ?? []).map((x) => x.name)].slice(0, 100) })} />
        </label>
        {f.photos.length > 0 && <p className="truncate text-[12.5px] text-[#4d5664]">{f.photos.join(", ")}</p>}
      </Part>

      <Part title={t("বর্ণনা", "Description")}>
        <label htmlFor="acc-desc" className="sr-only">{t("বর্ণনা", "Description")}</label>
        <textarea id="acc-desc" rows={3} maxLength={1000} value={f.description} onChange={(e) => p({ description: e.target.value })} placeholder={t("রুমের বিশেষত্ব, ভিউ…", "Features, views, what makes it special…")} className={field + " h-auto py-2.5"} />
      </Part>

      <Part title={t("সুবিধা", "Amenities")}>
        <div className="flex flex-wrap gap-2">{ROOM_TOP.map(chip)}</div>
        {!all ? <button onClick={() => setAll(true)} className="text-[14px] font-semibold text-[#b11c29]">{t("সব সুবিধা দেখুন", "Amenities library")}</button> : (
          <div className="space-y-3 rounded-xl border border-[#e3e7ec] p-3">
            <input aria-label={t("সুবিধা খুঁজুন", "Search amenities")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("সুবিধা খুঁজুন", "Search amenities")} className={field} />
            {AMENITIES.map((g) => { const rest = g.items.filter((a) => !ROOM_TOP.includes(a) && hit(a)); return rest.length ? <div key={g.group}><p className="text-[12.5px] font-semibold text-[#4d5664]">{g.group}</p><div className="mt-1 flex flex-wrap gap-2">{rest.map(chip)}</div></div> : null; })}
          </div>
        )}
      </Part>

      <Part title={t("খাবার", "Meal configuration")}>
        <div className="divide-y divide-[#e3e7ec] rounded-xl border border-[#e3e7ec] bg-white">
          {MEALS.map(([k, bn, en]) => (
            <div key={k} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-[110px] flex-1 text-[15px] font-semibold">{t(bn, en)}</span>
              <Pills size="sm" label={t(bn, en)} value={f.meals[k]} onChange={(v) => p({ meals: { ...f.meals, [k]: v } })} items={[{ v: "none" as MealMode, label: t("নেই", "None") }, { v: "included" as MealMode, label: t("সাথে আছে", "Included") }, { v: "extra" as MealMode, label: t("আলাদা দাম", "Extra (paid)") }]} />
              {f.meals[k] === "extra" && <span className="flex items-center gap-1"><span className="text-[14px]">৳</span><input aria-label={t(`${bn}-এর দাম`, `${en} price`)} inputMode="numeric" value={f.mealPrices[k] ?? ""} onChange={(e) => p({ mealPrices: { ...f.mealPrices, [k]: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || undefined } })} placeholder="500" className={field + " h-9 w-[90px]"} /><span className="text-[12.5px] text-[#4d5664]">/{t("জন", "person")}</span></span>}
            </div>
          ))}
        </div>
      </Part>

      {slot ? createPortal(bar, slot) : <div className="mt-8">{bar}</div>}
      {sheet && <PlacesSheet d={d} rooms={rooms} f={f} config={config} onClose={(picks) => { p({ picks }); setSheet(false); }} />}
    </section>
  );
}
function Part({ title, action, first, children }: { title: string; action?: React.ReactNode; first?: boolean; children: React.ReactNode }) {
  return <section className={clsx("mt-7", !first && "border-t border-[#e3e7ec] pt-6")}><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-[18px] font-semibold">{title}</h2>{action}</div><div className="space-y-4">{children}</div></section>;
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

export function Totals({ d, total }: { d: Draft; total: number }) {
  const { t, lang } = useL();
  const plan = d.planPicked ? d.plan : recommend(d);
  const q = quote(plan, total, d.cycle);
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-[#e9edf2] px-4 py-3 text-[14.5px]">
      <b>{t(`মোট ${num(total, lang)}টা রুম`, `${total} rooms in total`)}</b>
      <span className="text-[#4d5664]">{PLANS[plan].label} · ৳{num(money(q.monthly), lang)}/{t("মাস", "month")}{total < q.billed ? t(` (কমপক্ষে ${num(q.billed, lang)}টার বিল)`, ` (minimum ${q.billed} billed)`) : ""}</span>
    </p>
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
  const tiles: [string, number, StepId][] = [[t("রুমের ধরন", "Room types"), cats.length, "3.2"], [t("তলা / জোন", "Floors / zones"), places.length, "3.1"], [t("রুম", "Rooms"), live.length, "3.2"]];
  return (
    <Q title={t("রুম মিলিয়ে নিন", "Check your rooms")} sub={t("সব রুম ড্রাফট হিসেবে সেভ। BinGi ধরন অনুমোদন করলে বিক্রি শুরু হবে।", "All rooms are saved as drafts. Selling starts after BinGi approves the types.")}>
      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map(([k, v, s], i) => (
          <button key={i} onClick={() => go(s)} className="group rounded-xl border border-[#e3e7ec] bg-white p-4 text-left hover:border-[#0f1720]">
            <span className="flex items-center justify-between text-[13px] text-[#4d5664]">{k}<Pencil className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
            <span className="mt-1 block text-[24px] font-semibold tabular-nums">{num(v, lang)}</span>
          </button>
        ))}
      </div>
      <ul className="mt-5 grid gap-3">
        {places.map((p) => {
          const us = live.filter((u) => u.node === p.id).sort((a, b) => a.local.localeCompare(b.local, undefined, { numeric: true }));
          return (
            <li key={p.id} className="rounded-xl border border-[#e3e7ec] bg-white p-4">
              <p className="flex items-center gap-2 text-[15.5px] font-semibold">{p.kind === "ZONE" ? <Trees className="size-4 text-[#4d5664]" /> : <Building2 className="size-4 text-[#4d5664]" />}{placeLabel(d, config, p, lang === "bn")}<span className="text-[13px] font-normal text-[#4d5664]">· {num(us.length, lang)}</span></p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {us.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f4f6f8] py-1 pl-2 pr-1 font-mono text-[13px] font-semibold">
                    <span className="size-2 rounded-full" style={{ background: colorOf(st, u.category) }} />{u.local}
                    <button onClick={() => remove(u.id)} aria-label={t(`${u.local} বাদ দিন`, `Remove ${u.local}`)} className="grid size-5 place-items-center rounded text-[#5b6270] hover:bg-white hover:text-[#8e1621]"><Trash2 className="size-3" /></button>
                  </span>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-[#4d5664]">
        {cats.map((c) => <li key={c.id} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: colorOf(st, c.id) }} />{nm(c.name, t)} · ৳{num(money(c.baseRate), lang)} · {num(live.filter((u) => u.category === c.id).length, lang)}</li>)}
      </ul>
      <Totals d={d} total={live.length} />
    </Q>
  );
}
