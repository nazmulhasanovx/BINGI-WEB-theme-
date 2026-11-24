"use client";
// /list/setup — Marketplace listing onboarding: 3 parts, 9 screens, one question per screen, autosave.
// Reuses the HMS onboarding shell (same look), but its own small draft (lib/listing/store).
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Banknote, BedDouble, Building2, Camera, Check, ChevronDown, Circle, CircleDot, ImagePlus, Landmark, MapPin, Plus, Send, Smartphone, Trash2, Wallet, X } from "lucide-react";
import { Canvas, Card, Chip, Errors, Foot, Ghost, Header, Later, Next, Primary, Q, Stepper, Switch, Tile, field, label } from "../onboarding/shell";
import { TYPE_META } from "../onboarding/types";
import { useL } from "@/lib/onboarding/store";
import {
  AMENITIES, BEDS, CANCEL, GATEWAY_PCT, HMS_PCT, LISTING_PCT, MIN_PRICE, PARTS, SAMPLE, STEPS,
  checks, digits, newListing, newRoom, resizePhoto, split, taka, useListing, type Bed, type Cancel, type Listing,
} from "@/lib/listing/store";

const noop = () => () => {};
const DIVISIONS: [string, string][] = [["Dhaka", "ঢাকা"], ["Chattogram", "চট্টগ্রাম"], ["Sylhet", "সিলেট"], ["Khulna", "খুলনা"], ["Rajshahi", "রাজশাহী"], ["Barishal", "বরিশাল"], ["Rangpur", "রংপুর"], ["Mymensingh", "ময়মনসিংহ"]];
const PART_ICON = [Building2, BedDouble, Wallet];

export function ListSetup() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { st, d, update } = useListing();
  const { t } = useL();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!st.verified) router.replace("/list");
    else if (!st.listing) update((s) => { s.listing = newListing(); });
  }, [ready, st.verified, st.listing, router, update]);
  if (!ready || !st.verified || !d) return <Canvas><Header home="/list" /><p className="p-8 text-[15px] text-[#4d5664]" role="status">{t("লোড হচ্ছে…", "Loading…")}</p></Canvas>;
  if (d.status !== "draft") return <Submitted d={d} />;
  return <Flow d={d} />;
}

function Flow({ d }: { d: Listing }) {
  const { st, edit } = useListing();
  const { t, lang } = useL();
  const [errs, setErrs] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  // An error message goes away as soon as the owner changes something.
  const [seenAt, setSeenAt] = useState(d.updated);
  if (seenAt !== d.updated) { setSeenAt(d.updated); if (errs.length) setErrs([]); }
  const step = Math.min(Math.max(0, d.step), STEPS.length - 1);
  const cs = checks(d, st.phone);
  const pct = Math.round((Math.min(d.seen, STEPS.length - 1) / (STEPS.length - 1)) * 100);
  const go = (n: number) => { setErrs([]); edit((x) => { x.step = n; x.seen = Math.max(x.seen, n); }); requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" })); };
  /** Gate only what the next screen depends on; everything else is checked on Review. */
  const validate = (): string[] => {
    const e: string[] = [];
    if (step === 0 && !d.type) e.push(t("একটা ধরন বেছে নিন।", "Pick a type."));
    if (step === 1 && d.name.trim().length < 3) e.push(t("নাম কমপক্ষে ৩ অক্ষরের দিন।", "Use at least 3 letters for the name."));
    if (step === 2 && !(d.road.trim() && d.city.trim())) e.push(t("রাস্তা / বাড়ি আর শহর দিন।", "Add the road / house and the city."));
    if (step === 4) {
      const rows = d.rooms.filter((r) => r.name.trim());
      if (!rows.length) e.push(t("কমপক্ষে ১টা রুমের ধরনের নাম দিন।", "Name at least one room type."));
      if (rows.some((r) => r.price < MIN_PRICE)) e.push(t(`প্রতি রাতের দাম কমপক্ষে ${taka(MIN_PRICE, lang)} দিন।`, `Set a price of at least ${taka(MIN_PRICE, lang)} per night.`));
    }
    return e;
  };
  const next = () => { const e = validate(); if (e.length) { setErrs(e); top.current?.scrollIntoView({ behavior: "smooth" }); return; } go(step + 1); };
  const optional = step === 3 || step === 5;
  return (
    <Canvas>
      <Header home="/list" title={d.name || t("নতুন লিস্টিং", "New listing")} right={<Link href="/list" className="inline-flex h-9 items-center rounded-lg border border-[#d3d8df] px-3 text-[14px] font-medium hover:bg-[#e9edf2]">{t("সেভ করে বের হন", "Save & exit")}</Link>} />
      <Card progress={pct}
        sidebar={<Side d={d} step={step} go={go} cs={cs} />}
        mobileNav={<MobileSide d={d} step={step} go={go} cs={cs} />}
        aside={step < 8 ? <Preview d={d} /> : undefined}
        footer={<Foot back={step > 0 ? () => go(step - 1) : undefined}>
          {optional && <Later onClick={() => go(step + 1)} />}
          {step < 8 && <Next onClick={next} />}
        </Foot>}>
        <div ref={top} className="scroll-mt-24" key={step}>
          <div className="onb-in">
            <Errors list={errs} />
            {full && <div role="alert" className="mb-5 rounded-lg border border-[#f3c7c3] bg-[#fff5f4] px-4 py-3 text-[14.5px] font-medium text-[#9b241d]">{t("ব্রাউজারে আর জায়গা নেই। কিছু ছবি মুছে আবার চেষ্টা করুন (প্রোটোটাইপ সীমা)।", "This browser is out of space. Remove a few photos and try again (prototype limit).")}<button onClick={() => setFull(false)} className="ml-2 underline">{t("ঠিক আছে", "OK")}</button></div>}
            {step === 0 && <TypeStep d={d} />}
            {step === 1 && <NameStep d={d} />}
            {step === 2 && <PlaceStep d={d} />}
            {step === 3 && <AmenStep d={d} />}
            {step === 4 && <RoomsStep d={d} />}
            {step === 5 && <PhotosStep d={d} onFull={() => setFull(true)} />}
            {step === 6 && <RulesStep d={d} />}
            {step === 7 && <PayStep d={d} onFull={() => setFull(true)} />}
            {step === 8 && <ReviewStep d={d} go={go} />}
          </div>
        </div>
      </Card>
    </Canvas>
  );
}

// ---------- Sidebar ----------
type C = ReturnType<typeof checks>;
function Side({ d, step, go, cs }: { d: Listing; step: number; go: (n: number) => void; cs: C }) {
  const { t, lang } = useL();
  const { st } = useListing();
  const left = Math.max(1, Math.ceil((STEPS.length - 1 - step) * 1.1));
  return (
    <nav aria-label={t("লিস্টিংয়ের ধাপ", "Listing steps")} className="p-5">
      <p className="text-[13px] font-medium text-[#4d5664]">{t("মার্কেটপ্লেস লিস্টিং", "Marketplace listing")}</p>
      <p className="mt-0.5 truncate text-[17px] font-semibold">{d.name || t("নতুন লিস্টিং", "New listing")}</p>
      <p className="mt-1 text-[12.5px] text-[#4d5664]">{digits(st.phone, lang)} · {t("যাচাই হয়েছে", "verified")} · {t(`বাকি প্রায় ${digits(left, lang)} মিনিট`, `About ${left} min left`)}</p>
      <ol className="mt-5 space-y-1">
        {PARTS.map((p, i) => {
          const idx = STEPS.map((s, n) => (s.part === i ? n : -1)).filter((n) => n >= 0);
          const cur = STEPS[step].part === i;
          const started = idx[0] <= d.seen;
          const done = idx.every((n) => n < step && n <= d.seen) && !cur && idx.every((n) => !cs.some((c) => c.must && c.step === n && !c.ok));
          const I = PART_ICON[i];
          return (
            <li key={i}>
              <button disabled={!started} onClick={() => go(idx.find((n) => n <= d.seen && n !== step) ?? idx[0])} className={clsx("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14.5px] disabled:cursor-default", cur ? "bg-[#e9edf2] font-semibold" : "enabled:hover:bg-[#f4f6f8]", !started && "text-[#80869a]")}>
                <span className={clsx("relative grid size-8 shrink-0 place-items-center rounded-lg", cur ? "bg-[#0f1720] text-white" : done ? "bg-[#e8f4ec] text-[#1c7d45]" : "bg-[#e9edf2] text-[#4d5664]")}><I className="size-[17px]" strokeWidth={1.9} aria-hidden />
                  {done && <span className="absolute -bottom-1 -right-1 grid size-[15px] place-items-center rounded-full bg-[#1c7d45] text-white ring-2 ring-white"><Check className="size-2.5" strokeWidth={3.5} /></span>}</span>
                <span className="flex-1">{t(p.bn, p.en)}</span>
                {done && <span className="text-[12px] font-medium text-[#1c7d45]">{t("হয়েছে", "Done")}</span>}
              </button>
              {cur && (
                <ol className="mb-2 ml-[26px] mt-1 space-y-0.5 border-l border-[#e3e7ec] pl-4">
                  {idx.map((n) => {
                    const here = n === step;
                    const ok = n < d.seen && !here && !cs.some((c) => c.must && c.step === n && !c.ok);
                    return <li key={n}><button disabled={n > d.seen} onClick={() => go(n)} aria-current={here ? "step" : undefined} className={clsx("flex w-full items-center gap-2 rounded-md py-1.5 pl-1 text-left text-[13.5px]", here ? "font-semibold text-[#0f1720]" : n <= d.seen ? "text-[#4d5664] hover:text-[#0f1720]" : "text-[#80869a]")}>
                      {ok ? <Check className="size-3.5 text-[#1c7d45]" strokeWidth={3} /> : here ? <CircleDot className="size-3.5 text-[#b11c29]" /> : <Circle className="size-3.5 text-[#b8bdc7]" />}{t(STEPS[n].bn, STEPS[n].en)}</button></li>;
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 rounded-lg bg-[#f4f6f8] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#4d5664]">{t("সব কিছু আপনা-আপনি সেভ হয়। যেকোনো সময় বের হয়ে পরে চালিয়ে যান।", "Everything saves automatically. Leave anytime and continue later.")}</p>
    </nav>
  );
}
function MobileSide(p: { d: Listing; step: number; go: (n: number) => void; cs: C }) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useL();
  const part = STEPS[p.step].part;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="text-[13px] font-semibold text-[#4d5664]">{digits(p.step + 1, lang)}/{digits(STEPS.length, lang)}</span>
        <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{t(PARTS[part].bn, PARTS[part].en)} · {t(STEPS[p.step].bn, STEPS[p.step].en)}</span>
        <ChevronDown className={clsx("size-4 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="onb-in border-t border-[#e3e7ec]"><Side {...p} go={(n) => { setOpen(false); p.go(n); }} /></div>}
    </div>
  );
}

/** Right rail: the card guests will see on the Marketplace. */
function Preview({ d }: { d: Listing }) {
  const { t, lang } = useL();
  const rooms = d.rooms.filter((r) => r.name.trim() && r.price > 0);
  const from = rooms.length ? Math.min(...rooms.map((r) => r.price)) : 0;
  const type = TYPE_META.find((x) => x.slug === d.type);
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#4d5664]">{t("গেস্ট যা দেখবে · নমুনা", "What guests will see · sample")}</p>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgb(16_24_40/0.05),0_16px_40px_-28px_rgb(16_24_40/0.35)] ring-1 ring-[#e3e7ec]">
        <div className="relative aspect-[4/3] bg-[#e9edf2]">
          {d.cover ? <img src={d.cover} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-[13.5px] text-[#80869a]"><span className="flex flex-col items-center gap-1"><Camera className="size-6" aria-hidden />{t("কভার ছবি", "Cover photo")}</span></span>}
          {type && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold">{t(type.bn, type.en)}</span>}
        </div>
        <div className="p-4">
          <p className="truncate text-[16.5px] font-semibold">{d.name || t("আপনার জায়গার নাম", "Your place's name")}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[13.5px] text-[#4d5664]"><MapPin className="size-3.5 shrink-0" aria-hidden />{[d.area, d.city].filter(Boolean).join(", ") || t("এলাকা, শহর", "Area, city")}</p>
          {d.tagline && <p className="mt-2 line-clamp-2 text-[13.5px] text-[#4d5664]">{d.tagline}</p>}
          <p className="mt-3 text-[13.5px] text-[#4d5664]">{from ? <><span className="text-[18px] font-semibold text-[#0f1720]">{taka(from, lang)}</span> {t("থেকে / রাত", "from / night")}</> : t("দাম দিলে এখানে দেখাবে", "Your price shows here")}</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Steps ----------
function TypeStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  const [more, setMore] = useState(() => TYPE_META.some((x) => !x.main && x.slug === d.type));
  return (
    <Q title={t("আপনার জায়গাটা কী ধরনের?", "What kind of place is it?")} sub={t("গেস্টরা এই ধরন দিয়ে খোঁজে।", "Guests search by this.")}>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("ধরন", "Type")}>
        {TYPE_META.filter((x) => x.main || more).map((x) => { const I = x.icon; return <Tile key={x.slug} role="radio" big on={d.type === x.slug} onClick={() => edit((y) => { y.type = x.slug; })} title={t(x.bn, x.en)} sub={t(x.subBn, x.subEn)} icon={<I className="size-5" aria-hidden />} />; })}
      </div>
      {!more && <button onClick={() => setMore(true)} className="mt-4 h-10 text-[14.5px] font-semibold underline underline-offset-4">{t("আরো ধরন দেখুন", "More types")}</button>}
    </Q>
  );
}

function NameStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  return (
    <Q title={t("জায়গার নাম কী?", "What is your place called?")} sub={t("সাইনবোর্ডে যে নাম লেখা, সেটাই দিন।", "Use the name on your signboard.")}>
      <label htmlFor="l-name" className={label}>{t("নাম", "Name")}</label>
      <input id="l-name" value={d.name} maxLength={60} onChange={(e) => edit((x) => { x.name = e.target.value; })} placeholder={t("যেমন: নীল দিগন্ত রিসোর্ট", "e.g. Neel Digonto Resort")} className={field + " mt-1"} />
      <label htmlFor="l-tag" className={label + " mt-5"}>{t("এক লাইনে পরিচিতি", "One line about it")} <span className="font-normal text-[#4d5664]">· {t("ঐচ্ছিক", "optional")}</span></label>
      <input id="l-tag" value={d.tagline} maxLength={90} onChange={(e) => edit((x) => { x.tagline = e.target.value; })} placeholder={t("যেমন: সমুদ্র থেকে ২ মিনিট হাঁটা", "e.g. 2 minutes' walk from the beach")} className={field + " mt-1"} />
      <p className="mt-1 text-right text-[12.5px] text-[#5b6270]">{digits(d.tagline.length, lang)}/{digits(90, lang)}</p>
    </Q>
  );
}

function PlaceStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const pin = d.pin ?? { x: 0.5, y: 0.45 };
  const move = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    edit((x) => { x.pin = { x: Math.min(0.95, Math.max(0.05, (e.clientX - r.left) / r.width)), y: Math.min(0.92, Math.max(0.12, (e.clientY - r.top) / r.height)) }; });
  };
  const inp = (k: "road" | "area" | "city", lab: string, ph: string) => <div><label htmlFor={`l-${k}`} className={label}>{lab}</label><input id={`l-${k}`} value={d[k]} onChange={(e) => edit((x) => { x[k] = e.target.value; })} placeholder={ph} className={field + " mt-1"} /></div>;
  return (
    <Q title={t("জায়গাটা কোথায়?", "Where is it?")} sub={t("পুরো ঠিকানা শুধু বুকিং কনফার্ম হলে গেস্ট দেখবে। আগে শুধু এলাকা দেখায়।", "Guests see the full address only after booking. Before that they see the area.")}>
      <div className="grid gap-3">
        {inp("road", t("রাস্তা / বাড়ি", "Road / house"), t("যেমন: কলাতলী রোড, প্লট ১২", "e.g. Kolatoli Road, Plot 12"))}
        <div className="grid gap-3 sm:grid-cols-2">
          {inp("area", t("এলাকা", "Area"), t("যেমন: কলাতলী", "e.g. Kolatoli"))}
          {inp("city", t("শহর / জেলা", "City / district"), t("যেমন: কক্সবাজার", "e.g. Cox's Bazar"))}
        </div>
        <div><label htmlFor="l-div" className={label}>{t("বিভাগ", "Division")}</label><select id="l-div" value={d.division} onChange={(e) => edit((x) => { x.division = e.target.value; })} className={field + " mt-1"}>{DIVISIONS.map(([en, bn]) => <option key={en} value={en}>{t(bn, en)}</option>)}</select></div>
      </div>
      <p className={label + " mt-6"}>{t("ম্যাপে পিন বসান", "Place the pin on the map")}</p>
      <div ref={box} onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e); }} onPointerMove={(e) => drag.current && move(e)} onPointerUp={() => { drag.current = false; }}
        role="application" aria-label={t("ম্যাপে ট্যাপ করে পিন সরান", "Tap the map to move the pin")} className="relative mt-2 aspect-[16/9] cursor-crosshair touch-none overflow-hidden rounded-xl bg-[#e8f3ea] ring-1 ring-[#dfe6e0]">
        <svg viewBox="0 0 400 225" className="absolute inset-0 h-full w-full" aria-hidden><path d="M0 80 L400 60 M0 170 L400 185 M120 0 L150 225 M280 0 L260 225" stroke="#fff" strokeWidth="12" /><path d="M0 120 Q 200 90 400 130" stroke="#cfe3f6" strokeWidth="20" fill="none" /></svg>
        <div className="pointer-events-none absolute" style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%`, transform: "translate(-50%,-100%)" }}>
          <svg width="34" height="44" viewBox="0 0 36 46" aria-hidden><path d="M18 46 C 6 30, 0 22, 0 16 A 18 18 0 0 1 36 16 C 36 22, 30 30, 18 46 Z" fill={d.pin ? "#d9343f" : "#9aa0ac"} /><circle cx="18" cy="16" r="7" fill="#fff" /></svg>
        </div>
      </div>
      <p className="mt-2 text-[12.5px] text-[#4d5664]">{t("প্রোটোটাইপ: আঁকা ম্যাপ। আসল ম্যাপ পরে যুক্ত হবে।", "Prototype: illustrated map. A real map comes later.")}</p>
    </Q>
  );
}

function AmenStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  const flip = (k: string) => edit((x) => { x.amenities = x.amenities.includes(k) ? x.amenities.filter((a) => a !== k) : [...x.amenities, k]; });
  return (
    <Q title={t("কী কী সুবিধা আছে?", "What do you offer?")} sub={t("যা আছে শুধু সেগুলো বেছে নিন। পরে বদলানো যাবে।", "Pick only what you really have. You can change it later.")}>
      <div className="flex flex-wrap gap-2">{AMENITIES.map(([k, bn, en]) => <Chip key={k} on={d.amenities.includes(k)} onClick={() => flip(k)}>{t(bn, en)}</Chip>)}</div>
    </Q>
  );
}

function RoomsStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  const set = (i: number, fn: (r: Listing["rooms"][number]) => void) => edit((x) => { fn(x.rooms[i]); });
  return (
    <Q title={t("কী কী রুম আছে?", "What rooms do you have?")} sub={t("একই রকম রুম একসাথে লিখুন। যেমন ৫টা ডিলাক্স রুম = ১টা ধরন, সংখ্যা ৫।", "Group the same rooms together, e.g. 5 deluxe rooms = one type, count 5.")}
      why={t("রুম নম্বর, ফ্লোর বা বিল্ডিং লাগবে না। গেস্ট রুমের ধরন বুক করে; কোন রুম দেবেন সেটা আপনি ঠিক করেন।", "No room numbers, floors or buildings needed. Guests book a room type; you decide which room to give.")}>
      <div className="grid gap-4">
        {d.rooms.map((r, i) => {
          const me = split(r.price, r.price);
          return (
            <section key={r.key} className="rounded-2xl border border-[#d3d8df] bg-white p-4 sm:p-5" aria-label={r.name || t(`রুমের ধরন ${digits(i + 1, lang)}`, `Room type ${i + 1}`)}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`rn-${r.key}`} className={label}>{t("রুমের ধরনের নাম", "Room type name")}</label>
                  <input id={`rn-${r.key}`} value={r.name} maxLength={40} onChange={(e) => set(i, (y) => { y.name = e.target.value; })} placeholder={t("যেমন: ডিলাক্স ডাবল", "e.g. Deluxe Double")} className={field + " mt-1"} />
                </div>
                {d.rooms.length > 1 && <button onClick={() => edit((x) => { x.rooms.splice(i, 1); })} aria-label={t("এই ধরন মুছুন", "Remove this type")} className="mt-6 grid size-11 place-items-center rounded-lg text-[#4d5664] hover:bg-[#fdecea] hover:text-[#b11c29]"><Trash2 className="size-5" /></button>}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label htmlFor={`rb-${r.key}`} className={label}>{t("বেড", "Bed")}</label><select id={`rb-${r.key}`} value={r.bed} onChange={(e) => set(i, (y) => { y.bed = e.target.value as Bed; })} className={field + " mt-1"}>{(Object.keys(BEDS) as Bed[]).map((b) => <option key={b} value={b}>{t(...BEDS[b])}</option>)}</select></div>
                <div>
                  <label htmlFor={`rp-${r.key}`} className={label}>{t("প্রতি রাতের দাম (৳)", "Price per night (৳)")}</label>
                  <input id={`rp-${r.key}`} type="number" inputMode="numeric" min={0} value={r.price || ""} onChange={(e) => set(i, (y) => { y.price = Math.max(0, Math.round(+e.target.value)); })} placeholder="3500" className={field + " mt-1"} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f4f6f8] px-3.5 py-2.5"><span className="text-[14.5px] font-medium">{t("কতজন থাকতে পারবে", "Guests")}</span><Stepper value={r.guests} set={(n) => set(i, (y) => { y.guests = n; })} min={1} max={20} label={t("গেস্ট", "Guests")} /></div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f4f6f8] px-3.5 py-2.5"><span className="text-[14.5px] font-medium">{t("এরকম কয়টা রুম", "How many rooms")}</span><Stepper value={r.count} set={(n) => set(i, (y) => { y.count = n; })} min={1} max={200} label={t("রুম", "Rooms")} /></div>
              </div>
              {r.price > 0 && (r.price < MIN_PRICE
                ? <p className="mt-3 text-[13.5px] font-medium text-[#9b241d]">{t(`মার্কেটপ্লেসে কমপক্ষে ${taka(MIN_PRICE, lang)} দিতে হবে।`, `The Marketplace needs at least ${taka(MIN_PRICE, lang)}.`)}</p>
                : <p className="mt-3 text-[13.5px] text-[#4d5664]">{t(`অনলাইনে পুরো টাকা দিলে আপনি পাবেন ${taka(me.net, lang)} / রাত`, `If paid fully online you receive ${taka(me.net, lang)} / night`)} <span className="text-[#5b6270]">({t(`কমিশন ${digits(LISTING_PCT, lang)}% + পেমেন্ট ফি ${digits(GATEWAY_PCT, lang)}%`, `${LISTING_PCT}% commission + ${GATEWAY_PCT}% payment fee`)})</span></p>)}
            </section>
          );
        })}
      </div>
      <Ghost onClick={() => edit((x) => { x.rooms.push(newRoom(x.rooms.length)); })} className="mt-4"><Plus className="size-5" aria-hidden />{t("আরেকটা রুমের ধরন", "Add another room type")}</Ghost>
      <p className="mt-4 text-[13.5px] text-[#4d5664]">{t("মোট রুম", "Total rooms")}: <b className="text-[#0f1720]">{digits(d.rooms.filter((r) => r.name.trim()).reduce((a, r) => a + r.count, 0), lang)}</b></p>
    </Q>
  );
}

function PhotoPick({ onPick, children, className, multiple, onFull }: { onPick: (urls: string[]) => boolean | void; children: React.ReactNode; className?: string; multiple?: boolean; onFull: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { t } = useL();
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} disabled={busy} className={className}>{busy ? t("ছবি তৈরি হচ্ছে…", "Preparing photo…") : children}</button>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} hidden onChange={async (e) => {
        const files = [...(e.target.files ?? [])].slice(0, 8);
        e.target.value = "";
        if (!files.length) return;
        setBusy(true);
        try { const urls = await Promise.all(files.map((f) => resizePhoto(f))); if (onPick(urls) === false) onFull(); } catch { /* not an image: ignore */ }
        setBusy(false);
      }} />
    </>
  );
}

function PhotosStep({ d, onFull }: { d: Listing; onFull: () => void }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  const rooms = d.rooms.filter((r) => r.name.trim());
  const sample = () => edit((x) => { x.cover ||= SAMPLE.cover; if (x.photos.length < 3) x.photos = [...x.photos, ...SAMPLE.more].slice(0, 6); x.rooms.forEach((r, i) => { if (r.name.trim()) r.photo ||= SAMPLE.rooms[i % SAMPLE.rooms.length]; }); });
  return (
    <Q title={t("ছবি দিন", "Add photos")} sub={t("ভালো ছবিতে বেশি বুকিং আসে। দিনের আলোয় তোলা, পরিষ্কার রুমের ছবি দিন।", "Good photos bring more bookings. Use clear daylight photos of tidy rooms.")}
      why={t("লিস্টিং চালু করতে কভার ছবি আর প্রতিটা রুমের ধরনের ১টা ছবি লাগবে। ছবি ছাড়া রুম মার্কেটপ্লেসে দেখায় না।", "To go live you need a cover photo and one photo for every room type. Rooms without photos do not show on the Marketplace.")}>
      <p className={label}>{t("কভার ছবি", "Cover photo")} <span className="font-normal text-[#b11c29]">· {t("দরকার", "required")}</span></p>
      {d.cover
        ? <div className="relative mt-2 overflow-hidden rounded-2xl"><img src={d.cover} alt={t("কভার ছবি", "Cover photo")} className="aspect-[16/9] w-full object-cover" /><button onClick={() => edit((x) => { x.cover = ""; })} aria-label={t("কভার ছবি মুছুন", "Remove cover photo")} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/95 shadow hover:bg-white"><X className="size-5" /></button></div>
        : <PhotoPick onFull={onFull} onPick={([u]) => edit((x) => { x.cover = u; })} className="mt-2 flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#b8bdc7] bg-white text-[15px] font-semibold hover:border-[#0f1720]"><ImagePlus className="size-8 text-[#4d5664]" aria-hidden />{t("কভার ছবি বাছুন", "Choose a cover photo")}</PhotoPick>}

      <p className={label + " mt-7"}>{t("প্রতিটা রুমের ধরনের ছবি", "A photo for each room type")} <span className="font-normal text-[#b11c29]">· {t("দরকার", "required")}</span></p>
      {!rooms.length && <p className="mt-2 text-[14px] text-[#4d5664]">{t("আগের ধাপে রুমের ধরন যোগ করুন।", "Add room types in the previous step.")}</p>}
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {d.rooms.map((r, i) => r.name.trim() && (
          <div key={r.key} className="overflow-hidden rounded-xl border border-[#d3d8df] bg-white">
            {r.photo
              ? <div className="relative"><img src={r.photo} alt={r.name} className="aspect-[4/3] w-full object-cover" /><button onClick={() => edit((x) => { x.rooms[i].photo = ""; })} aria-label={t(`${r.name}-এর ছবি মুছুন`, `Remove photo of ${r.name}`)} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-white/95 shadow"><X className="size-4" /></button></div>
              : <PhotoPick onFull={onFull} onPick={([u]) => edit((x) => { x.rooms[i].photo = u; })} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 bg-[#f4f6f8] text-[14px] font-semibold hover:bg-[#e9edf2]"><Camera className="size-6 text-[#4d5664]" aria-hidden />{t("ছবি দিন", "Add photo")}</PhotoPick>}
            <p className="truncate px-3 py-2 text-[14px] font-medium">{r.name}</p>
          </div>
        ))}
      </div>

      <p className={label + " mt-7"}>{t("আরো ছবি", "More photos")} <span className="font-normal text-[#4d5664]">· {t("বাইরে, লবি, খাবার, ভিউ — ৩টা বা বেশি ভালো", "outside, lobby, food, view — 3 or more is best")}</span></p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {d.photos.map((p, i) => <div key={i} className="relative"><img src={p} alt={t(`ছবি ${digits(i + 1, lang)}`, `Photo ${i + 1}`)} className="aspect-square w-full rounded-lg object-cover" /><button onClick={() => edit((x) => { x.photos.splice(i, 1); })} aria-label={t("ছবি মুছুন", "Remove photo")} className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-white/95 shadow"><X className="size-4" /></button></div>)}
        {d.photos.length < 8 && <PhotoPick multiple onFull={onFull} onPick={(us) => edit((x) => { x.photos = [...x.photos, ...us].slice(0, 8); })} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#b8bdc7] bg-white text-[13px] font-semibold hover:border-[#0f1720]"><Plus className="size-6" aria-hidden />{t("যোগ করুন", "Add")}</PhotoPick>}
      </div>
      <button onClick={sample} className="mt-6 h-10 rounded-lg bg-[#fff7e6] px-3 text-[13.5px] font-semibold text-[#7a5200]">{t("প্রোটোটাইপ: নমুনা ছবি বসান", "Prototype: fill with sample photos")}</button>
    </Q>
  );
}

function RulesStep({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  const times = (k: "checkIn" | "checkOut", list: string[]) => (
    <div className="flex flex-wrap gap-2">{list.map((h) => { const [hh] = h.split(":").map(Number); const lab = `${hh % 12 || 12}:00 ${hh < 12 ? "AM" : "PM"}`; return <Chip key={h} on={d.rules[k] === h} onClick={() => edit((x) => { x.rules[k] = h; })}>{lab}</Chip>; })}</div>
  );
  return (
    <Q title={t("আপনার নিয়ম", "Your house rules")} sub={t("গেস্ট বুক করার আগে এগুলো দেখবে।", "Guests see these before they book.")}>
      <p className={label}>{t("চেক-ইন", "Check-in")}</p><div className="mt-2">{times("checkIn", ["12:00", "13:00", "14:00", "15:00"])}</div>
      <p className={label + " mt-5"}>{t("চেক-আউট", "Check-out")}</p><div className="mt-2">{times("checkOut", ["10:00", "11:00", "12:00"])}</div>
      <p className={label + " mt-7"}>{t("বাতিলের নিয়ম", "Cancellation")}</p>
      <div className="mt-2 grid gap-2.5" role="radiogroup" aria-label={t("বাতিলের নিয়ম", "Cancellation")}>
        {(Object.keys(CANCEL) as Cancel[]).map((k) => <Tile key={k} role="radio" on={d.rules.cancel === k} onClick={() => edit((x) => { x.rules.cancel = k; })} title={t(CANCEL[k].bn, CANCEL[k].en)} sub={t(CANCEL[k].subBn, CANCEL[k].subEn)} badge={k === "moderate" ? t("বেশিরভাগ বেছে নেয়", "Most choose this") : undefined} />)}
      </div>
      <p className={label + " mt-7"}>{t("বাচ্চারা", "Children")}</p>
      <div className="mt-2 flex flex-wrap gap-2">{([["all", "সব বয়সী", "All ages"], ["6+", "৬ বছর+", "6 and over"], ["12+", "১২ বছর+", "12 and over"], ["none", "শুধু বড়রা", "Adults only"]] as const).map(([k, bn, en]) => <Chip key={k} on={d.rules.children === k} onClick={() => edit((x) => { x.rules.children = k; })}>{t(bn, en)}</Chip>)}</div>
      <div className="mt-6 divide-y divide-[#e3e7ec] rounded-2xl border border-[#d3d8df] bg-white">
        <div className="flex items-center gap-3 px-4 py-3.5"><p className="flex-1 text-[15px] font-semibold">{t("পোষা প্রাণী আনা যাবে", "Pets allowed")}</p><Switch on={d.rules.pets} set={(v) => edit((x) => { x.rules.pets = v; })} label={t("পোষা প্রাণী", "Pets")} /></div>
        <div className="flex items-center gap-3 px-4 py-3.5"><p className="flex-1 text-[15px] font-semibold">{t("রুমে ধূমপান করা যাবে", "Smoking allowed in rooms")}</p><Switch on={d.rules.smoking} set={(v) => edit((x) => { x.rules.smoking = v; })} label={t("ধূমপান", "Smoking")} /></div>
      </div>
    </Q>
  );
}

function PayStep({ d, onFull }: { d: Listing; onFull: () => void }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  const p = d.payout;
  const sample = d.rooms.find((r) => r.name.trim() && r.price >= MIN_PRICE)?.price ?? 3000;
  const full = split(sample, sample);
  const adv = split(sample, Math.round(sample * 0.3));
  const pf = (k: keyof typeof p, lab: string, ph: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => <div><label htmlFor={`p-${k}`} className={label}>{lab}</label><input id={`p-${k}`} value={p[k]} onChange={(e) => edit((x) => { (x.payout[k] as string) = e.target.value; })} placeholder={ph} {...extra} className={field + " mt-1"} /></div>;
  const line = (a: string, b: string, strong?: boolean) => <div className={clsx("flex justify-between gap-3 py-1", strong ? "border-t border-[#e3e7ec] pt-2 font-semibold" : "text-[#4d5664]")}><span>{a}</span><span className="tabular-nums text-[#0f1720]">{b}</span></div>;
  return (
    <Q title={t("টাকা কীভাবে পাবেন", "How you get paid")} sub={t("গেস্ট BinGi-তে অনলাইনে টাকা দেয়। BinGi কমিশন রেখে বাকিটা আপনার অ্যাকাউন্টে পাঠায়।", "Guests pay online through BinGi. BinGi keeps the commission and sends the rest to your account.")}>
      <p className={label}>{t("গেস্ট কীভাবে টাকা দিতে পারবে", "How guests can pay")}</p>
      <div className="mt-2 grid gap-2.5" role="radiogroup" aria-label={t("গেস্ট কীভাবে টাকা দেবে", "How guests pay")}>
        <Tile role="radio" on={d.guestPay === "both"} onClick={() => edit((x) => { x.guestPay = "both"; })} title={t("গেস্ট বেছে নেবে: পুরো টাকা বা ৩০% অগ্রিম", "Guest chooses: full or 30% advance")} sub={t("অগ্রিম দিলে বাকিটা আপনার কাছে হোটেলে দেবে", "With an advance, the rest is paid to you at the property")} badge={t("প্রস্তাবিত", "Recommended")} />
        <Tile role="radio" on={d.guestPay === "full"} onClick={() => edit((x) => { x.guestPay = "full"; })} title={t("শুধু পুরো টাকা অনলাইনে", "Full amount online only")} />
        <Tile role="radio" on={d.guestPay === "advance"} onClick={() => edit((x) => { x.guestPay = "advance"; })} title={t("শুধু ৩০% অগ্রিম অনলাইনে", "30% advance online only")} />
      </div>

      <p className={label + " mt-7"}>{t("আপনার টাকা কোথায় যাবে", "Where your money goes")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {([["bkash", "bKash", Smartphone], ["nagad", "Nagad", Smartphone], ["bank", t("ব্যাংক অ্যাকাউন্ট", "Bank account"), Landmark]] as const).map(([k, lab, I]) => <Chip key={k} on={p.method === k} onClick={() => edit((x) => { x.payout.method = k; })}><I className="size-4" aria-hidden />{lab}</Chip>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {p.method === "bank" ? <>
          {pf("holder", t("অ্যাকাউন্টের নাম", "Account name"), t("যেমন: নীল দিগন্ত রিসোর্ট", "e.g. Neel Digonto Resort"))}
          {pf("bank", t("ব্যাংক", "Bank"), t("যেমন: ডাচ-বাংলা ব্যাংক", "e.g. Dutch-Bangla Bank"))}
          {pf("acc", t("অ্যাকাউন্ট নম্বর", "Account number"), "", { inputMode: "numeric", autoComplete: "off" })}
          {pf("branch", t("শাখা", "Branch"), t("যেমন: কক্সবাজার", "e.g. Cox's Bazar"))}
        </> : <>
          {pf("wallet", t(`${p.method === "bkash" ? "bKash" : "Nagad"} নম্বর`, `${p.method === "bkash" ? "bKash" : "Nagad"} number`), "01712 345678", { inputMode: "tel" })}
          {pf("holder", t("অ্যাকাউন্টের নাম", "Account name"), "")}
        </>}
      </div>
      <p className="mt-2 text-[12.5px] text-[#5b6270]">{t("প্রোটোটাইপ: আসল নম্বর দেবেন না। কিছুই পাঠানো হয় না।", "Prototype: do not type real account numbers. Nothing is sent.")}</p>

      <div className="mt-7 rounded-2xl border border-[#d3d8df] bg-white p-4 sm:p-5">
        <p className="flex items-center gap-2 text-[15.5px] font-semibold"><Banknote className="size-5 text-[#1c7d45]" aria-hidden />{t("খরচ কত", "What it costs")}</p>
        <p className="mt-1 text-[14px] text-[#4d5664]">{t(`মাসিক ফি নেই। প্রতিটা বুকিংয়ে ${digits(LISTING_PCT, lang)}% কমিশন। অনলাইনে যতটুকু টাকা আসে তার ওপর ${digits(GATEWAY_PCT, lang)}% পেমেন্ট ফি।`, `No monthly fee. ${LISTING_PCT}% commission per booking. A ${GATEWAY_PCT}% payment fee on the part paid online.`)}</p>
        <div className="mt-3 grid gap-3 text-[14px] sm:grid-cols-2">
          <div className="rounded-xl bg-[#f4f6f8] p-3.5"><p className="mb-1 text-[12.5px] font-semibold uppercase tracking-wide text-[#4d5664]">{t(`${taka(sample, lang)}-এর বুকিং · পুরো টাকা অনলাইনে`, `${taka(sample, lang)} booking · paid fully online`)}</p>
            {line(t("কমিশন", "Commission"), "−" + taka(full.commission, lang))}{line(t("পেমেন্ট ফি", "Payment fee"), "−" + taka(full.gateway, lang))}{line(t("আপনি পাবেন", "You receive"), taka(full.net, lang), true)}</div>
          <div className="rounded-xl bg-[#f4f6f8] p-3.5"><p className="mb-1 text-[12.5px] font-semibold uppercase tracking-wide text-[#4d5664]">{t(`${taka(sample, lang)}-এর বুকিং · ৩০% অগ্রিম`, `${taka(sample, lang)} booking · 30% advance`)}</p>
            {line(t("কমিশন", "Commission"), "−" + taka(adv.commission, lang))}{line(t("পেমেন্ট ফি (শুধু অগ্রিমে)", "Payment fee (advance only)"), "−" + taka(adv.gateway, lang))}{line(t("আপনি পাবেন (মোট)", "You receive (total)"), taka(adv.net, lang), true)}</div>
        </div>
        <p className="mt-3 text-[13px] text-[#4d5664]">{t(`BinGi HMS নিলে কমিশন ${digits(HMS_PCT, lang)}%।`, `With BinGi HMS the commission is ${HMS_PCT}%.`)}</p>
      </div>

      <div className="mt-7">
        <p className={label}>NID <span className="font-normal text-[#4d5664]">· {t("এখন না দিলেও চলবে, প্রথম টাকা তোলার আগে লাগবে", "optional now, needed before your first payout")}</span></p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {(["front", "back"] as const).map((k) => (
            <div key={k} className="overflow-hidden rounded-xl border border-[#d3d8df] bg-white">
              {d.nid[k]
                ? <div className="relative"><img src={d.nid[k]} alt="" className="aspect-[3/2] w-full object-cover" /><button onClick={() => edit((x) => { x.nid[k] = ""; })} aria-label={t("মুছুন", "Remove")} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/95 shadow"><X className="size-4" /></button></div>
                : <PhotoPick onFull={onFull} onPick={([u]) => edit((x) => { x.nid[k] = u; })} className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-1 bg-[#f4f6f8] text-[13.5px] font-semibold hover:bg-[#e9edf2]"><Camera className="size-5" aria-hidden />{k === "front" ? t("সামনের দিক", "Front") : t("পেছনের দিক", "Back")}</PhotoPick>}
            </div>
          ))}
        </div>
      </div>
    </Q>
  );
}

function ReviewStep({ d, go }: { d: Listing; go: (n: number) => void }) {
  const { st, edit } = useListing();
  const { t, lang } = useL();
  const cs = checks(d, st.phone);
  const must = cs.filter((c) => c.must);
  const missing = must.filter((c) => !c.ok);
  const rooms = d.rooms.filter((r) => r.name.trim());
  const submit = () => edit((x) => { x.status = "review"; x.submitted = new Date().toISOString(); });
  return (
    <Q title={t("সব ঠিক আছে?", "All good?")} sub={t("জমা দিলে BinGi টিম দেখে লিস্টিং চালু করবে। পরে যেকোনো কিছু বদলাতে পারবেন।", "After you submit, the BinGi team checks and turns the listing on. You can change anything later.")}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-2xl border border-[#d3d8df] bg-white">
          <ul className="divide-y divide-[#e9edf2]">
            {cs.filter((c) => c.id !== "agree").map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full", c.ok ? "bg-[#1c7d45] text-white" : c.must ? "bg-[#fdecea] text-[#b11c29]" : "bg-[#e9edf2] text-[#5b6270]")}>{c.ok ? <Check className="size-3.5" strokeWidth={3} /> : <span className="text-[13px] font-bold">{c.must ? "!" : "·"}</span>}</span>
                <span className="min-w-0 flex-1 text-[14.5px]">{t(c.bn, c.en)}{!c.must && <span className="ml-1.5 text-[12.5px] text-[#5b6270]">{t("ঐচ্ছিক", "optional")}</span>}</span>
                {!c.ok && <button onClick={() => go(c.step)} className="h-9 rounded-lg px-2.5 text-[14px] font-semibold underline underline-offset-4">{c.must ? t("ঠিক করুন", "Fix") : t("যোগ করুন", "Add")}</button>}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[#d3d8df]">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-[#4d5664]">{t("সারসংক্ষেপ", "Summary")}</p>
          <p className="mt-2 text-[16px] font-semibold">{d.name}</p>
          <p className="text-[13.5px] text-[#4d5664]">{[d.area, d.city].filter(Boolean).join(", ")}</p>
          <ul className="mt-3 space-y-1 text-[14px]">{rooms.map((r) => <li key={r.key} className="flex justify-between gap-2"><span className="truncate">{r.name} × {digits(r.count, lang)}</span><span className="tabular-nums">{taka(r.price, lang)}</span></li>)}</ul>
          <p className="mt-3 text-[13px] text-[#4d5664]">{t(CANCEL[d.rules.cancel].bn, CANCEL[d.rules.cancel].en)} · {t("চেক-ইন", "Check-in")} {d.rules.checkIn}</p>
          <p className="mt-1 text-[13px] text-[#4d5664]">{t("কমিশন", "Commission")} {digits(LISTING_PCT, lang)}% · {t("পেমেন্ট ফি", "payment fee")} {digits(GATEWAY_PCT, lang)}%</p>
        </div>
      </div>
      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d3d8df] bg-white p-4">
        <input type="checkbox" checked={d.agree} onChange={(e) => edit((x) => { x.agree = e.target.checked; })} className="mt-0.5 size-5 accent-[#b11c29]" />
        <span className="text-[14.5px] leading-relaxed">{t(`আমি নিশ্চিত করছি এই তথ্য সত্য, আর BinGi Marketplace-এর লিস্টিং শর্ত (${digits(LISTING_PCT, lang)}% কমিশন, বাতিলের নিয়ম মানা) মেনে নিচ্ছি।`, `I confirm these details are true and I accept the BinGi Marketplace listing terms (${LISTING_PCT}% commission, honour my cancellation policy).`)} <span className="text-[12.5px] text-[#5b6270]">{t("প্রোটোটাইপ: শর্তের পূর্ণ লেখা এখনো অনুমোদিত হয়নি।", "Prototype: full terms text not approved yet.")}</span></span>
      </label>
      {missing.length > 0 && <p role="status" className="mt-4 text-[14px] font-medium text-[#9b241d]">{t(`জমা দিতে আরো ${digits(missing.length, lang)}টা জিনিস বাকি।`, `${missing.length} thing${missing.length > 1 ? "s" : ""} left before you can submit.`)}</p>}
      <Primary onClick={submit} disabled={missing.length > 0} className="mt-4 w-full sm:w-auto"><Send className="size-[18px]" aria-hidden />{t("রিভিউর জন্য জমা দিন", "Submit for review")}</Primary>
    </Q>
  );
}

function Submitted({ d }: { d: Listing }) {
  const { t } = useL();
  const { edit } = useListing();
  return (
    <Canvas>
      <Header home="/list" title={d.name} />
      <main className="mx-auto max-w-[620px] px-4 py-12 text-center sm:py-20">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e8f4ec] text-[#1c7d45]"><Check className="size-8" strokeWidth={2.5} aria-hidden /></span>
        <h1 className="mt-5 text-[28px] font-semibold">{d.status === "live" ? t("আপনার লিস্টিং চালু আছে", "Your listing is live") : t("জমা দেওয়া হয়েছে", "Submitted")}</h1>
        <p className="mx-auto mt-2 max-w-[480px] text-[16px] leading-relaxed text-[#4d5664]">{d.status === "live" ? t("গেস্টরা এখন বুক করতে পারবে।", "Guests can book now.") : t("BinGi টিম আপনার ছবি, দাম আর তথ্য দেখবে। চালু হলে SMS পাবেন। এর মধ্যে ক্যালেন্ডার ঠিক করে রাখুন।", "The BinGi team will check your photos, prices and details. You will get an SMS when it is live. Meanwhile, set up your calendar.")}</p>
        <p className="mt-1 text-[12.5px] text-[#7a5200]">{t("প্রোটোটাইপ: কোনো SMS বা রিভিউ আসলে হয় না।", "Prototype: no SMS or review actually happens.")}</p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/list/host" className="inline-flex h-11 items-center justify-center rounded-lg btn-glow px-5 text-[15px] font-semibold text-white">{t("ড্যাশবোর্ডে যান", "Go to dashboard")}</Link>
          {d.status === "review" && <Ghost onClick={() => edit((x) => { x.status = "draft"; x.step = 8; })}>{t("লিস্টিং বদলান", "Edit listing")}</Ghost>}
        </div>
      </main>
    </Canvas>
  );
}
