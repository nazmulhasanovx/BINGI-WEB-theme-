"use client";
// Onboarding v8 — Rooms part in 4 steps (21 Nov 2026): Building & floors → Room types → Pick rooms → Review.
// Everything comes pre-filled from the property type (asked once, in 1.1). No codes are typed:
// locations, numbering and numbers are presets; the owner ticks, taps and edits.
// Saved as the same records the live backend uses: locations, accommodation categories, draft unit batches.
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, Building2, Check, ChevronDown, Pencil, Trash2, UsersRound } from "lucide-react";
import { AMENITIES, type CoreType } from "@/lib/rooms/catalog";
import { nodePath, nowStamp, uid, type LocNode, type useRooms } from "@/lib/rooms/store";
import { PLANS, num, quote, recommend, useL, useOnboarding, type Draft, type StepId, type TypeRow } from "@/lib/onboarding/store";
import { BEDS, ROOM_KINDS, STAY, configFrom, presetNumbers } from "@/lib/onboarding/rooms-easy";
import { BN_NAME, ROOM_TOP, catId, categoryOf, syncTypes } from "@/lib/onboarding/rooms-v8";
import { money } from "../hms/rooms/parts";
import { AM_BN, AM_ICON, RoomsWhere, STAY_ICON, placeName } from "./rooms-easy";
import { Chip, Ghost, Pills, Q, Stepper, field, label } from "./shell";

type Rooms = ReturnType<typeof useRooms>;
const DOT = ["#b11c29", "#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be185d", "#334155", "#15803d"];
export const colorOf = (d: Draft, key: string) => DOT[Math.max(0, d.types.filter((r) => r.on).findIndex((r) => r.key === key)) % DOT.length];
const nm = (r: { name: string }, t: (bn: string, en: string) => string) => t(BN_NAME[r.name] ?? r.name, r.name);

/** Save ticked types as categories (stable ids); drop unticked ones that have no rooms. Returns blocked names. */
export function saveTypes(d: Draft, rooms: Rooms): string[] {
  const blocked: string[] = [];
  const st = rooms.st;
  for (const r of d.types) if (!r.on && st.units.some((u) => u.category === catId(r.key) && u.status !== "archived")) blocked.push(r.name);
  if (blocked.length) return blocked;
  rooms.update((s) => {
    if (!s.config.configured) s.config = configFrom(d, s.config);
    for (const r of d.types) {
      const i = s.categories.findIndex((c) => c.id === catId(r.key));
      if (r.on) { const c = categoryOf(r, s.categories[i]); if (i >= 0) s.categories[i] = c; else s.categories.push(c); }
      else if (i >= 0) s.categories.splice(i, 1);
    }
  }, "Room types saved from onboarding presets");
  return [];
}

// ---------- 3.1 Building & floors ----------
export function Place({ d, st }: { d: Draft; st: Rooms["st"] }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const used = new Set(st.units.filter((u) => u.status !== "archived").map((u) => u.core));
  const top = (
    <div className="mb-7">
      <p className="text-[15.5px] font-semibold">{t("কী ভাড়া দেন", "What you rent")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STAY.map((s) => {
          const on = d.stay.includes(s.id);
          const I = STAY_ICON[s.id];
          const lock = on && used.has(s.id);
          return <Chip key={s.id} on={on} disabled={lock} title={lock ? t("এখানে রুম আছে", "Has rooms") : undefined}
            onClick={() => edit((x) => { x.stay = on ? x.stay.filter((y) => y !== s.id) : [...x.stay, s.id]; if (s.where === "zone" && !x.zones.length) x.zones = ["garden"]; if (s.where === "floor" && !x.floors.length) x.floors = [1]; })}>
            <I className="size-4" aria-hidden />{t(s.bn, s.en)}</Chip>;
        })}
      </div>
    </div>
  );
  return <RoomsWhere d={d} st={st} head={top} title={t("বিল্ডিং ও তলা", "Building & floors")} />;
}

// ---------- 3.2 Room types ----------
export function Types({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { const next = syncTypes(d); if (JSON.stringify(next) !== JSON.stringify(d.types)) edit((x) => { x.types = next; }); }, [d, edit]);
  const set = (key: string, p: Partial<TypeRow>) => edit((x) => { const r = x.types.find((y) => y.key === key); if (r) Object.assign(r, p); });
  const groups = STAY.filter((s) => d.stay.includes(s.id));
  return (
    <Q title={t("রুমের ধরন", "Room types")} sub={t("আপনার property দেখে ধরন আর দাম বসানো আছে। যেগুলো আছে টিক দিন, নাম আর দাম মিলিয়ে নিন।", "Types and prices are filled in from your property. Tick the ones you have, check name and price.")}
      why={t("প্রতিটা ধরন BinGi অনুমোদন করে। ছবি পরে HMS-এ দেবেন।", "BinGi approves each type. Photos come later in HMS.")}>
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.id}>
            {groups.length > 1 && <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#4d5664]">{t(g.bn, g.en)}</p>}
            <ul className="grid gap-2.5">
              {d.types.filter((r) => r.core === g.id).map((r) => {
                const exp = open === r.key;
                return (
                  <li key={r.key} className={clsx("rounded-xl border bg-white transition-[border-color,box-shadow]", r.on ? "border-[#0f1720] shadow-[inset_0_0_0_1px_#0f1720]" : "border-[#c6ccd4]")}>
                    <div className="flex flex-wrap items-center gap-3 p-3.5">
                      <button type="button" role="checkbox" aria-checked={r.on} aria-label={nm(r, t)} onClick={() => set(r.key, { on: !r.on })}
                        className={clsx("grid size-6 shrink-0 place-items-center rounded border-2", r.on ? "border-[#b11c29] bg-[#b11c29] text-white" : "border-[#b8bdc7]")}>{r.on && <Check className="size-4" strokeWidth={3} />}</button>
                      <div className="min-w-0 flex-1 basis-[180px]">
                        {r.on ? <input aria-label={t("নাম", "Name")} value={lang === "bn" && BN_NAME[r.name] ? BN_NAME[r.name] : r.name} onChange={(e) => set(r.key, { name: e.target.value })} className="w-full rounded-md bg-transparent text-[16px] font-semibold outline-none focus:bg-[#f4f6f8]" />
                          : <p className="text-[16px] font-semibold text-[#4d5664]">{nm(r, t)}</p>}
                        <p className="flex flex-wrap gap-x-3 text-[13px] text-[#4d5664]"><span className="inline-flex items-center gap-1"><UsersRound className="size-3.5" />{num(r.guests, lang)}</span><span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{t(BEDS.find((b) => b.id === r.bed)?.bn ?? r.bed, BEDS.find((b) => b.id === r.bed)?.en ?? r.bed)}</span></p>
                      </div>
                      {r.on && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[17px] font-semibold text-[#8e1621]">৳</span>
                          <input aria-label={t(`${nm(r, t)} — প্রতি রাতের দাম`, `${r.name} — price per night`)} inputMode="numeric" value={r.price || ""} onChange={(e) => set(r.key, { price: Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0 })} className={field + " h-10 w-[110px] text-[16px] font-semibold tabular-nums"} />
                          <span className="text-[13px] text-[#4d5664]">/{t("রাত", "night")}</span>
                        </div>
                      )}
                      {r.on && <button onClick={() => setOpen(exp ? null : r.key)} aria-expanded={exp} className="inline-flex h-10 items-center gap-1 rounded-lg px-2.5 text-[14px] font-semibold text-[#b11c29] hover:bg-[#fff4f3]">{t("আরও", "More")}<ChevronDown className={clsx("size-4 transition-transform", exp && "rotate-180")} /></button>}
                    </div>
                    {r.on && exp && <TypeMore r={r} set={(p) => set(r.key, p)} />}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13.5px] text-[#4d5664]">{t("এখানে না থাকলে কাছাকাছি একটা টিক দিয়ে নাম বদলে নিন।", "Not listed? Tick the closest one and rename it.")}</p>
    </Q>
  );
}

function TypeMore({ r, set }: { r: TypeRow; set: (p: Partial<TypeRow>) => void }) {
  const { t, lang } = useL();
  const [all, setAll] = useState(false);
  const tog = (a: string) => set({ amen: r.amen.includes(a) ? r.amen.filter((x) => x !== a) : [...r.amen, a] });
  const chip = (a: string) => { const I = AM_ICON[a]; return <Chip key={a} on={r.amen.includes(a)} onClick={() => tog(a)}>{I && !r.amen.includes(a) && <I className="size-4" aria-hidden />}{t(AM_BN[a] ?? a, a)}</Chip>; };
  return (
    <div className="onb-in space-y-4 border-t border-[#e3e7ec] px-3.5 pb-4 pt-3.5">
      <div><p className={label}>{t("রুমের ধরন", "Room kind")}</p><div className="mt-1.5 flex flex-wrap gap-2">{ROOM_KINDS.map((k) => <Chip key={k.id} on={r.kind === k.id} onClick={() => set({ kind: k.id, guests: k.guests })}>{t(k.bn, k.en)}</Chip>)}</div></div>
      <div><p className={label}>{t("বেড", "Bed")}</p><div className="mt-1.5 flex flex-wrap gap-2">{BEDS.map((b) => <Chip key={b.id} on={r.bed === b.id} onClick={() => set({ bed: b.id })}>{t(b.bn, b.en)}</Chip>)}</div></div>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <div><p className={label}>{t("সর্বোচ্চ অতিথি", "Max guests")}</p><div className="mt-1.5"><Stepper label={t("অতিথি", "Guests")} value={r.guests} set={(n) => set({ guests: n })} min={1} max={12} /></div></div>
        <div><p className={label}>{t("বেডরুম", "Bedrooms")}</p><div className="mt-1.5"><Stepper label={t("বেডরুম", "Bedrooms")} value={r.bedrooms ?? 1} set={(n) => set({ bedrooms: n })} min={1} max={8} /></div></div>
        <div><p className={label}>{t("বাথরুম", "Bathrooms")}</p><div className="mt-1.5"><Stepper label={t("বাথরুম", "Bathrooms")} value={r.bathrooms ?? 1} set={(n) => set({ bathrooms: n })} min={0} max={8} /></div></div>
        <div><label htmlFor={`sz-${r.key}`} className={label}>{t("মাপ (বর্গফুট, ঐচ্ছিক)", "Size (sq ft, optional)")}</label><input id={`sz-${r.key}`} inputMode="numeric" value={r.size ?? ""} onChange={(e) => set({ size: Number(e.target.value.replace(/\D/g, "").slice(0, 5)) || undefined })} placeholder="250" className={field + " mt-1.5 w-[120px]"} /></div>
      </div>
      <div>
        <p className={label}>{t("সুবিধা", "Amenities")}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">{ROOM_TOP.map(chip)}</div>
        {!all ? <button onClick={() => setAll(true)} className="mt-2 text-[14px] font-semibold text-[#b11c29]">{t("সব সুবিধা দেখুন", "Show all amenities")}</button> : (
          <div className="mt-3 space-y-3">{AMENITIES.map((g) => { const rest = g.items.filter((a) => !ROOM_TOP.includes(a)); return rest.length ? <div key={g.group}><p className="text-[12.5px] font-semibold text-[#4d5664]">{g.group}</p><div className="mt-1 flex flex-wrap gap-2">{rest.map(chip)}</div></div> : null; })}</div>
        )}
        <p className="mt-2 text-[12.5px] text-[#4d5664]">{t(`${num(r.amen.length, lang)}টা বাছাই`, `${r.amen.length} picked`)}</p>
      </div>
    </div>
  );
}

// ---------- 3.3 Pick rooms (tap numbers) ----------
export function PickRooms({ d, rooms }: { d: Draft; rooms: Rooms }) {
  const { t, lang } = useL();
  const st = rooms.st;
  const on = d.types.filter((r) => r.on);
  const [key, setKey] = useState(on[0]?.key ?? "");
  const r = on.find((x) => x.key === key) ?? on[0];
  const core = (r?.core ?? "ROOM") as CoreType;
  const where = STAY.find((s) => s.id === core)?.where ?? "floor";
  const config = st.config.configured ? st.config : configFrom(d, st.config);
  const places = config.nodes.filter((n) => n.active && (where === "floor" ? n.kind === "FLOOR" : n.kind === "ZONE"));
  const [pid, setPid] = useState("");
  const place = places.find((p) => p.id === pid) ?? places[0];
  const [more, setMore] = useState(false);
  const [fill, setFill] = useState(5);
  const live = st.units.filter((u) => u.status !== "archived");
  const list = useMemo(() => (place ? presetNumbers(config, place, core, d.ground) : []), [config, place, core, d.ground]);
  const byCode = new Map(live.map((u) => [u.code.toUpperCase(), u]));
  const shown = list.slice(0, more ? list.length : where === "floor" ? 20 : 12);
  if (!r) return <Q title={t("রুম বাছাই", "Pick rooms")}><p className="text-[15px] text-[#4d5664]">{t("আগের ধাপে কমপক্ষে একটা রুমের ধরন টিক দিন।", "Tick at least one room type in the previous step.")}</p></Q>;
  if (!place) return <Q title={t("রুম বাছাই", "Pick rooms")}><p className="text-[15px] text-[#4d5664]">{t("বিল্ডিং ও তলা ধাপে জায়গা বাছাই করুন।", "Choose the floors or zones in Building & floors.")}</p></Q>;

  const cat = catId(r.key);
  const ensure = (s: typeof st) => { if (!s.config.configured) s.config = configFrom(d, s.config); if (!s.categories.some((c) => c.id === cat)) s.categories.push(categoryOf(r)); };
  const tap = (x: { local: string; code: string }) => rooms.update((s) => {
    ensure(s);
    const i = s.units.findIndex((u) => u.status !== "archived" && u.code.toUpperCase() === x.code.toUpperCase());
    if (i >= 0 && s.units[i].category === cat) s.units.splice(i, 1);
    else if (i >= 0) s.units[i] = { ...s.units[i], category: cat, core, preset: STAY.find((y) => y.id === core)!.preset };
    else s.units.push({ id: uid("u"), code: x.code.toUpperCase(), local: x.local.toUpperCase(), node: place.id, category: cat, core, preset: STAY.find((y) => y.id === core)!.preset, status: "draft", video: "inherit", created: nowStamp() });
  }, `Room ${x.code} set in onboarding`);
  const fillFirst = () => rooms.update((s) => {
    ensure(s);
    const taken = new Set(s.units.filter((u) => u.status !== "archived").map((u) => u.code.toUpperCase()));
    let n = 0;
    for (const x of list) {
      if (n >= fill) break;
      if (taken.has(x.code.toUpperCase())) continue;
      s.units.push({ id: uid("u"), code: x.code.toUpperCase(), local: x.local.toUpperCase(), node: place.id, category: cat, core, preset: STAY.find((y) => y.id === core)!.preset, status: "draft", video: "inherit", created: nowStamp() });
      n++;
    }
  }, `${fill} rooms added in onboarding`);
  const hereCount = live.filter((u) => u.node === place.id).length;
  const color = colorOf(d, r.key);
  return (
    <Q title={t("রুম বাছাই", "Pick rooms")} sub={t("আগে ধরন বাছুন, তারপর নম্বরে চাপ দিন। আবার চাপলে বাদ যাবে।", "Choose a type, then tap the numbers. Tap again to remove.")}
      why={t("নম্বর BinGi দেয় — নিজে লিখতে হয় না। একই নম্বর দুইবার হয় না।", "BinGi gives the numbers — nothing to type. A number can't be used twice.")}>
      <p className="text-[14px] font-semibold text-[#4d5664]">{t("১. রুমের ধরন", "1. Room type")}</p>
      <div className="mt-2"><Pills label={t("রুমের ধরন", "Room type")} value={r.key} onChange={(k) => { setKey(k); setPid(""); setMore(false); }}
        items={on.map((x) => ({ v: x.key, label: <><span className="size-2.5 rounded-full" style={{ background: colorOf(d, x.key) }} />{nm(x, t)}</>, sub: num(live.filter((u) => u.category === catId(x.key)).length, lang) }))} /></div>
      <p className="mt-5 text-[14px] font-semibold text-[#4d5664]">{t("২. কোথায়", "2. Where")}</p>
      <div className="mt-2"><Pills size="sm" label={t("তলা বা জায়গা", "Floor or zone")} value={place.id} onChange={(p) => { setPid(p); setMore(false); }}
        items={places.map((p) => ({ v: p.id, label: placeName(p, config, lang), sub: num(live.filter((u) => u.node === p.id).length, lang) }))} /></div>

      <div className="mt-4 rounded-xl border border-[#e3e7ec] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="text-[14px] text-[#4d5664]">{t("দ্রুত:", "Quick:")}</span>
          <Stepper label={t("কয়টা রুম", "How many")} value={fill} set={setFill} min={1} max={50} />
          <Ghost onClick={fillFirst} className="h-10">{t(`পরের ${num(fill, lang)}টা নম্বর দিন`, `Add the next ${fill}`)}</Ghost>
          <span className="ml-auto text-[13px] text-[#4d5664]">{t(`এখানে ${num(hereCount, lang)}টা`, `${hereCount} here`)}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {shown.map((x) => {
            const u = byCode.get(x.code.toUpperCase());
            const mine = u?.category === cat;
            const other = u && !mine ? on.find((y) => catId(y.key) === u.category) : undefined;
            return (
              <button key={x.code} type="button" aria-pressed={mine} onClick={() => tap(x)} title={other ? nm(other, t) : undefined}
                className={clsx("relative h-12 rounded-xl font-mono text-[15px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-95", mine ? "text-white" : other ? "bg-white text-[#0f1720] ring-2 ring-inset" : "bg-[#e9edf2] text-[#0f1720] hover:bg-[#ffe7e4]")}
                style={mine ? { background: color } : other ? ({ "--tw-ring-color": colorOf(d, other.key) } as React.CSSProperties) : undefined}>
                {x.code}
                {other && <span aria-hidden className="absolute right-1.5 top-1.5 size-2 rounded-full" style={{ background: colorOf(d, other.key) }} />}
              </button>
            );
          })}
        </div>
        {list.length > shown.length && <button onClick={() => setMore(true)} className="mt-3 text-[14px] font-semibold text-[#b11c29]">{t("আরও নম্বর দেখুন", "Show more numbers")}</button>}
      </div>
      <Totals d={d} total={live.length} />
    </Q>
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

// ---------- 3.4 Review ----------
export function ReviewRooms({ d, rooms, go }: { d: Draft; rooms: Rooms; go: (s: StepId) => void }) {
  const { t, lang } = useL();
  const st = rooms.st;
  const config = st.config;
  const live = st.units.filter((u) => u.status !== "archived");
  const on = d.types.filter((r) => r.on);
  const places = config.nodes.filter((n) => live.some((u) => u.node === n.id));
  const empty = on.filter((r) => !live.some((u) => u.category === catId(r.key)));
  const remove = (id: string) => rooms.update((s) => { s.units = s.units.filter((u) => u.id !== id); }, "Room removed in onboarding review");
  return (
    <Q title={t("রুম মিলিয়ে নিন", "Check your rooms")} sub={t("সব রুম ড্রাফট হিসেবে সেভ। BinGi ধরন অনুমোদন করলে বিক্রি শুরু হবে।", "All rooms are saved as drafts. Selling starts after BinGi approves the types.")}>
      <div className="grid gap-3 sm:grid-cols-3">
        {[[t("রুমের ধরন", "Room types"), on.length, "3.2"], [t("জায়গা", "Floors / zones"), places.length, "3.1"], [t("রুম", "Rooms"), live.length, "3.3"]].map(([k, v, s]) => (
          <button key={String(s)} onClick={() => go(s as StepId)} className="group rounded-xl border border-[#e3e7ec] bg-white p-4 text-left hover:border-[#0f1720]">
            <span className="flex items-center justify-between text-[13px] text-[#4d5664]">{k}<Pencil className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></span>
            <span className="mt-1 block text-[24px] font-semibold tabular-nums">{num(v as number, lang)}</span>
          </button>
        ))}
      </div>
      {empty.length > 0 && <p className="mt-4 rounded-xl border border-[#f2dcb0] bg-[#fdf6e7] px-4 py-3 text-[14px] text-[#7a4a0b]">{t(`${empty.map((r) => nm(r, t)).join(", ")} — কোনো রুম নেই।`, `${empty.map((r) => r.name).join(", ")} — no rooms yet.`)} <button onClick={() => go("3.3")} className="font-semibold underline underline-offset-2">{t("রুম দিন", "Add rooms")}</button></p>}
      <ul className="mt-5 grid gap-3">
        {places.map((p) => {
          const us = live.filter((u) => u.node === p.id).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
          return (
            <li key={p.id} className="rounded-xl border border-[#e3e7ec] bg-white p-4">
              <p className="flex items-center gap-2 text-[15.5px] font-semibold"><Building2 className="size-4 text-[#4d5664]" />{placeName(p, config, lang)}<span className="text-[13px] font-normal text-[#4d5664]">· {num(us.length, lang)}</span><span className="ml-auto font-mono text-[12px] font-normal text-[#5b6270]">{nodePath(config, p.id)}</span></p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {us.map((u) => { const r = on.find((x) => catId(x.key) === u.category); return (
                  <span key={u.id} className="group inline-flex items-center gap-1.5 rounded-lg bg-[#f4f6f8] py-1 pl-2 pr-1 font-mono text-[13px] font-semibold">
                    <span className="size-2 rounded-full" style={{ background: r ? colorOf(d, r.key) : "#94a3b8" }} />{u.code}
                    <button onClick={() => remove(u.id)} aria-label={t(`${u.code} বাদ দিন`, `Remove ${u.code}`)} className="grid size-5 place-items-center rounded text-[#80869a] hover:bg-white hover:text-[#8e1621]"><Trash2 className="size-3" /></button>
                  </span>); })}
              </div>
            </li>
          );
        })}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-[#4d5664]">
        {on.map((r) => <li key={r.key} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: colorOf(d, r.key) }} />{nm(r, t)} · ৳{num(money(r.price), lang)} · {num(live.filter((u) => u.category === catId(r.key)).length, lang)}</li>)}
      </ul>
      <Totals d={d} total={live.length} />
    </Q>
  );
}
