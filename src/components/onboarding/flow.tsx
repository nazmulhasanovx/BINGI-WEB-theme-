"use client";
// Onboarding v7 "easy" — 6 parts, one question per screen, picture answers, live preview, Bangla first.
// Part 2 follows the live HMS room-add flow: presets only, one room type after another.
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BedDouble, Bike, CalendarDays, Boxes, Brush, Building, Building2, Car, Castle, Check, CircleAlert, Coffee, Dumbbell, FileUp, Home, House, Landmark, MapPin,
  PartyPopper, Plus, Shirt, Sparkles, Tent, TreePalm, UsersRound, Utensils, Wallet, Waves, Wine, Bus, BookOpen, Banknote, Smartphone, Lock,
} from "lucide-react";
import {
  CYCLE_OFF, EXTRAS, MIN_BILLED, ORDER, PLANS, STAFF, TRIAL_DAYS, checks, hotelOf, nowIso, num, quote, recommend, score, useL, useOnboarding, validPhone,
  type Cycle, type Draft, type PlanId, type StepId,
} from "@/lib/onboarding/store";
import { SUGGEST, configFrom } from "@/lib/onboarding/rooms-easy";
import { useRooms } from "@/lib/rooms/store";
import { MASTER_LIST, PLAN_ORDER } from "@/themes/manifest";
import { setProperty } from "../hms/property";
import { money } from "../hms/rooms/parts";
import { KeyCard } from "./keycard";
import { AddressSheet } from "./address";
import { FormSlot, RoomsWhat, RoomsWhere, RoomTypes } from "./rooms-easy";
import { Canvas, Card, Chip, Dots, Errors, Foot, Ghost, Header, Later, Next, Primary, Q, Stepper, Tile, field } from "./shell";

const noop = () => () => {};
import { TYPE_META as TYPES } from "./types";
export { TYPES };
const EXTRA_ICON: Record<string, typeof Utensils> = { Restaurant: Utensils, Bar: Wine, "Café": Coffee, Pool: Waves, Spa: Sparkles, "Event hall": PartyPopper, "Airport transfer": Bus, Tours: Bike, Laundry: Shirt, Gym: Dumbbell };
const EXTRA_BN: Record<string, string> = { Restaurant: "রেস্টুরেন্ট", Bar: "বার", "Café": "ক্যাফে", Pool: "সুইমিং পুল", Spa: "স্পা", "Event hall": "ইভেন্ট হল", "Airport transfer": "পিকআপ", Tours: "ট্যুর", Laundry: "লন্ড্রি", Gym: "জিম" };

export function OnboardingFlow() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  const { t } = useL();
  if (!ready) return <Canvas><Header /><p className="p-8 text-[15px] text-[#5b6170]" role="status">{t("লোড হচ্ছে…", "Loading…")}</p></Canvas>;
  if (!draft) return <Canvas><Header /><div className="p-8"><p className="text-[17px] font-semibold">{t("কোনো property বাছাই করা নেই।", "No property selected.")}</p><Link className="mt-3 inline-block font-semibold text-[#c8232e]" href="/onboarding">{t("আমার property", "My properties")}</Link></div></Canvas>;
  return <Flow key={draft.id} d={draft} />;
}

function Flow({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const router = useRouter();
  const h = hotelOf(d);
  const rooms = useRooms(h);
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const live = rooms.st.units.filter((u) => u.status !== "archived");
  const counts = { total: live.length, published: 0, categories: rooms.st.categories.filter((c) => !c.archived).length };

  const go = (s: StepId) => { setTried(false); edit((x) => { x.step = s; if (!x.seen.includes(s)) x.seen.push(s); }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const i = ORDER.indexOf(d.step);
  const next = () => go(ORDER[Math.min(ORDER.length - 1, i + 1)]);
  const back = i > 0 ? () => go(ORDER[i - 1]) : () => router.push("/onboarding");
  const errs = errorsFor(d, counts.total, t);
  const cont = () => {
    if (errs.length) { setTried(true); return; }
    if (d.step === "2.2") rooms.update((s) => { s.config = configFrom(d, s.config); }, "Accommodation set up from onboarding presets");
    next();
  };
  const submit = () => {
    if (checks(d, counts).some((c) => c.level === "required" && !c.ok)) { setTried(true); return; }
    edit((x) => { x.status = "pending"; x.submitted = nowIso(); x.units = counts.total; });
    setProperty(d.slug);
    setDone(true);
  };

  if (done) return <Done d={d} />;

  const body: Record<StepId, ReactNode> = {
    "1.1": <PropertyType d={d} />, "1.2": <Name d={d} />, "1.3": <Address d={d} />, "1.4": <Extras d={d} />,
    "2.1": <RoomsWhat d={d} />, "2.2": <RoomsWhere d={d} st={rooms.st} />, "2.3": <RoomTypes d={d} rooms={rooms} />,
    "3.1": <Rates d={d} />, "3.2": <Policy d={d} />,
    "4.1": <Modules d={d} />, "4.2": <Team d={d} />,
    "5.1": <Payments d={d} />, "5.2": <Website d={d} />,
    "6.1": <Plan d={d} units={counts.total} />, "6.2": <Verify d={d} />, "6.3": <Ready d={d} counts={counts} go={go} />,
  };
  const later: Partial<Record<StepId, () => void>> = {
    "1.4": next, "4.2": () => { edit((x) => { x.teamLater = true; }); next(); }, "5.2": () => { edit((x) => { x.site.later = true; }); next(); }, "6.2": () => { edit((x) => { x.verify.later = true; }); next(); },
  };
  const required = checks(d, counts).filter((c) => c.level === "required" && !c.ok).map((c) => `${t(c.bn, c.label)} ${t("এখনো বাকি।", "is still missing.")}`);

  return (
    <FormSlot.Provider value={{ slot, setOpen: setFormOpen }}>
    <Canvas>
      <Header right={<Link href="/onboarding" aria-label={t("সেভ করে বের হন", "Save & exit")} className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-white px-3.5 text-[14px] font-semibold ring-1 ring-[#e3e5ea]"><span className="sm:hidden">{t("বের হন", "Exit")}</span><span className="hidden sm:inline">{t("সেভ করে বের হন", "Save & exit")}</span></Link>} />
      <Card aside={<KeyCard d={d} step={d.step} rooms={counts.total} />} bar={<KeyCard compact d={d} step={d.step} rooms={counts.total} />}
        footer={<>
          <div ref={setSlot} hidden={!formOpen} />
          {!formOpen && <Foot back={back}>
            {later[d.step] && <Later onClick={later[d.step]} />}
            {d.step === "6.3" ? <Primary onClick={submit}>{t("জমা দিন", "Submit")} <Check className="size-[18px]" /></Primary> : <Next onClick={cont} />}
          </Foot>}
        </>}>
        <Dots step={d.step} />
        <div className="mt-5">
          {tried && <Errors list={d.step === "6.3" ? required : errs} />}
          <div key={d.step + lang} className="onb-in">{body[d.step]}</div>
        </div>
      </Card>
    </Canvas>
    </FormSlot.Provider>
  );
}

function errorsFor(d: Draft, units: number, t: (bn: string, en: string) => string): string[] {
  const e: string[] = [];
  if (d.step === "1.1" && !d.propertyType) e.push(t("একটা ধরন বাছাই করুন।", "Choose a property type."));
  if (d.step === "1.2" && !d.name.trim()) e.push(t("Property-র নাম লিখুন।", "Enter the property name."));
  if (d.step === "1.3" && !(d.road.trim() && d.city.trim())) e.push(t("ঠিকানা দিন — রাস্তা/এলাকা আর শহর।", "Add the address — road/area and city."));
  if (d.step === "2.1" && !d.stay.length) e.push(t("কমপক্ষে একটা বাছাই করুন।", "Choose at least one."));
  if (d.step === "2.2") {
    const floor = d.stay.some((s) => s === "ROOM" || s === "APARTMENT");
    const zone = d.stay.some((s) => s === "COTTAGE" || s === "VILLA" || s === "OTHER");
    if (floor && !d.floors.length) e.push(t("কয় তলা আছে বাছাই করুন।", "Choose the floors."));
    if (zone && !d.zones.length) e.push(t("কটেজ/ভিলা কোন জায়গায় আছে বাছাই করুন।", "Choose where the cottages/villas are."));
  }
  if (d.step === "2.3" && !units) e.push(t("কমপক্ষে একটা রুমের ধরন যোগ করুন।", "Add at least one room type."));
  if (d.step === "3.2" && !d.policy.preset) e.push(t("বাতিলের একটা নিয়ম বাছাই করুন।", "Choose a cancellation rule."));
  if (d.step === "4.2" && d.team.some((x) => !validPhone(x.phone))) e.push(t("প্রত্যেকের সঠিক মোবাইল নম্বর দিন।", "Each invite needs a valid mobile number."));
  if (d.step === "5.1" && !d.pay.cash) e.push(t("নগদ টাকা নেওয়া চালু রাখতে হবে।", "Pay at property must stay on."));
  if (d.step === "6.1" && !d.planPicked) e.push(t("একটা প্ল্যান বাছাই করুন।", "Choose a plan."));
  return e;
}

// ---------------- Part 1 ----------------
function PropertyType({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const [more, setMore] = useState(!TYPES.find((x) => x.slug === d.propertyType)?.main && !!d.propertyType);
  // Presets: the type pre-fills what you rent, floors and zones (owner only confirms later).
  const FLOORS: Record<string, number> = { hotel: 4, resort: 2, "guest-house": 2, homestay: 1, "serviced-apartment": 8, motel: 1, hostel: 2, "vacation-rental": 1, lodge: 1, other: 2 };
  const pick = (slug: string) => edit((x) => {
    x.propertyType = slug;
    if (x.seen.length <= 2) {
      x.stay = [...(SUGGEST[slug] ?? ["ROOM"])];
      x.buildings = ["main"];
      x.floors = Array.from({ length: FLOORS[slug] ?? 2 }, (_, i) => i + 1);
      x.zones = x.stay.some((s) => s === "COTTAGE" || s === "VILLA" || s === "OTHER") ? ["garden"] : [];
    }
  });
  const list = TYPES.filter((x) => x.main || more);
  return (
    <Q title={t("আপনি কী ধরনের property চালান?", "What kind of property do you run?")} why={t("ধরন দেখে আমরা রুম, ওয়েবসাইট আর প্ল্যান আগে থেকে সাজিয়ে দিই। পরে বদলানো যায়।", "We pre-fill rooms, website and plan from this. You can change it later.")}>
      <div role="radiogroup" aria-label={t("Property-র ধরন", "Property type")} className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => <Tile key={p.slug} big role="radio" on={d.propertyType === p.slug} onClick={() => pick(p.slug)} icon={<p.icon className="size-6" />} title={t(p.bn, p.en)} sub={t(p.subBn, p.subEn)} />)}
      </div>
      {!more && <button onClick={() => setMore(true)} className="mt-3 text-[15px] font-semibold text-[#c8232e]">+ {t("আরও ধরন দেখুন", "More types")}</button>}
      <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#f1f2f5] px-3 py-1.5 text-[13.5px] text-[#4b5160]"><MapPin className="size-4" /> {t("বাংলাদেশ · টাকা (৳)", "Bangladesh · Taka (৳)")}</p>
    </Q>
  );
}

function Name({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  return (
    <Q title={t("আপনার property-র নাম কী?", "What is your property called?")} why={t("গেস্টরা এই নাম ওয়েবসাইট আর বুকিং কনফার্মেশনে দেখবে।", "Guests see this on your website and confirmations.")}>
      <label htmlFor="pname" className="sr-only">{t("Property-র নাম", "Property name")}</label>
      <input id="pname" value={d.name} onChange={(e) => edit((x) => { x.name = e.target.value; })} placeholder={t("যেমন: সী ব্রিজ হোটেল", "e.g. Sea Breeze Hotel")} className={field + " h-14 text-[19px] font-semibold"} maxLength={60} />
      <p className="mt-3 text-[14px] text-[#5b6170]">{t("ছবির সাইনবোর্ডে নামটা দেখুন", "See it on the sign in the picture")}</p>
    </Q>
  );
}

function Address({ d }: { d: Draft }) {
  const [open, setOpen] = useState(false);
  const { t } = useL();
  const has = d.road && d.city;
  return (
    <Q title={t("আপনার property কোথায়?", "Where is your property?")} why={t("গেস্টরা ম্যাপ দেখে আসবে। ঠিকানা বুকিং কনফার্মেশনে যায়।", "Guests use the map to find you.")}>
      {has ? (
        <div className="flex items-start gap-3 rounded-[20px] border-2 border-[#e6e8ee] bg-white p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fdeceb] text-[#d8372e]"><MapPin className="size-6" /></span>
          <div className="min-w-0 flex-1"><p className="text-[16px] font-bold">{[d.road, d.area].filter(Boolean).join(", ")}</p><p className="text-[14.5px] text-[#5b6170]">{[d.city, d.division, d.postcode].filter(Boolean).join(", ")}</p></div>
          <Ghost onClick={() => setOpen(true)} className="h-10">{t("বদলান", "Change")}</Ghost>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="flex w-full items-center gap-4 rounded-[22px] border-2 border-dashed border-[#efb7b1] bg-[#fffaf9] p-5 text-left hover:bg-[#fff4f3]">
          <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-b from-[#e2483f] to-[#c8232e] text-white"><MapPin className="size-7" /></span>
          <span><span className="block text-[18px] font-bold">{t("ম্যাপে পিন দিন", "Drop a pin on the map")}</span><span className="text-[14.5px] text-[#5b6170]">{t("তারপর ঠিকানা নিশ্চিত করুন", "Then confirm the address")}</span></span>
        </button>
      )}
      {open && <AddressSheet d={d} onClose={() => setOpen(false)} />}
    </Q>
  );
}

function Extras({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const tog = (e: string) => edit((x) => { x.extras = x.extras.includes(e) ? x.extras.filter((y) => y !== e) : [...x.extras, e]; });
  return (
    <Q title={t("আর কী কী আছে?", "What else is there?")} why={t("এগুলো দেখে মডিউল আর ওয়েবসাইটের অংশ ঠিক হয়।", "This decides which tools and website sections you get.")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {EXTRAS.map((e) => { const I = EXTRA_ICON[e] ?? Sparkles; return <Tile key={e} on={d.extras.includes(e)} onClick={() => tog(e)} icon={<I className="size-5" />} title={t(EXTRA_BN[e] ?? e, e)} />; })}
      </div>
    </Q>
  );
}

// ---------------- Part 3 ----------------
function Rates({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const r = d.rates;
  const set = (fn: (x: Draft["rates"]) => void) => edit((x) => { fn(x.rates); x.rates.done = true; });
  return (
    <Q title={t("দামের নিয়ম", "Price rules")} why={t("রুমের দাম আপনি আগের ধাপে দিয়েছেন। এখানে শুধু সহজ কিছু নিয়ম।", "Room prices are set. These are simple extra rules.")}>
      <div className="space-y-3">
        <Toggle on={r.weekendPct > 0} onClick={() => set((x) => { x.weekendPct = x.weekendPct > 0 ? 0 : 10; })} icon={<CalendarDays className="size-5" />} title={t("শুক্র–শনি দাম একটু বেশি", "Higher price on Fri–Sat")}>
          {r.weekendPct > 0 && <div className="mt-3 flex flex-wrap gap-2">{[10, 15, 20, 30].map((p) => <Chip key={p} on={r.weekendPct === p} onClick={() => set((x) => { x.weekendPct = p; })}>+{num(p, lang)}%</Chip>)}</div>}
        </Toggle>
        <Toggle on={r.minStay > 1} onClick={() => set((x) => { x.minStay = x.minStay > 1 ? 1 : 2; })} icon={<BedDouble className="size-5" />} title={t("কমপক্ষে কত রাত থাকতে হবে", "Minimum nights")}>
          {r.minStay > 1 && <div className="mt-3"><Stepper label={t("রাত", "Nights")} value={r.minStay} set={(n) => set((x) => { x.minStay = n; })} min={1} max={14} /></div>}
        </Toggle>
      </div>
      <button onClick={() => set(() => {})} className="mt-4 text-[14.5px] font-medium text-[#5b6170] underline underline-offset-4">{t("কোনো নিয়ম নেই — সব দিন এক দাম", "No rules — same price every day")}</button>
    </Q>
  );
}
function Toggle({ on, onClick, icon, title, children }: { on: boolean; onClick: () => void; icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className={clsx("rounded-[20px] border-2 p-4 transition-colors", on ? "border-[#ef6b62] bg-[#fff6f5]" : "border-[#e6e8ee] bg-white")}>
      <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fdeceb] text-[#d8372e]">{icon}</span>
        <span className="flex-1 text-[16px] font-bold">{title}</span>
        <span className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-[#d8372e]" : "bg-[#ddd6e6]")}><span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-[left]", on ? "left-6" : "left-1")} /></span>
      </button>
      {children}
    </div>
  );
}

const POLICIES = [
  { id: "flexible", bn: "নমনীয়", en: "Flexible", subBn: "চেক-ইনের ২৪ ঘণ্টা আগে পর্যন্ত ফ্রি বাতিল", subEn: "Free cancellation until 24 h before", emoji: "🙂" },
  { id: "moderate", bn: "মাঝারি", en: "Moderate", subBn: "৫ দিন আগে পর্যন্ত ফ্রি, পরে ১ রাতের দাম", subEn: "Free until 5 days before, then 1 night", emoji: "😐" },
  { id: "strict", bn: "কড়া", en: "Strict", subBn: "৭ দিন আগে ৫০% ফেরত, পরে ফেরত নেই", subEn: "50% back until 7 days, then none", emoji: "🔒" },
] as const;
const TIMES_IN = ["12:00", "13:00", "14:00", "15:00"];
const TIMES_OUT = ["10:00", "11:00", "12:00"];
const hhmm = (v: string, lang: "bn" | "en") => { const [H] = v.split(":").map(Number); return num(`${H % 12 || 12}${H >= 12 ? " PM" : " AM"}`, lang); };
function Policy({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const p = d.policy;
  const [tax, setTax] = useState(false);
  return (
    <Q title={t("বাতিলের নিয়ম ও সময়", "Cancellation & times")} why={t("গেস্ট বুক করার আগে এটা দেখে।", "Guests see this before they book.")}>
      <div role="radiogroup" aria-label={t("বাতিলের নিয়ম", "Cancellation rule")} className="grid gap-3 sm:grid-cols-3">
        {POLICIES.map((x) => (
          <button key={x.id} role="radio" aria-checked={p.preset === x.id} onClick={() => edit((y) => { y.policy.preset = x.id; })}
            className={clsx("relative rounded-[20px] border-2 p-4 text-left transition-colors", p.preset === x.id ? "border-[#ef6b62] bg-[#fff6f5]" : "border-[#e6e8ee] bg-white hover:border-[#d5d8e0]")}>
            <span className="text-[28px]" aria-hidden>{x.emoji}</span>
            <span className="mt-1 block text-[16px] font-bold">{t(x.bn, x.en)}</span>
            <span className="mt-0.5 block text-[13.5px] leading-snug text-[#5b6170]">{t(x.subBn, x.subEn)}</span>
            {p.preset === x.id && <span className="onb-pop absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-[#d8372e] text-white"><Check className="size-4" /></span>}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div><p className="text-[15px] font-bold">{t("চেক-ইন", "Check-in")}</p><div className="mt-2 flex flex-wrap gap-2">{TIMES_IN.map((v) => <Chip key={v} on={p.checkIn === v} onClick={() => edit((y) => { y.policy.checkIn = v; })}>{hhmm(v, lang)}</Chip>)}</div></div>
        <div><p className="text-[15px] font-bold">{t("চেক-আউট", "Check-out")}</p><div className="mt-2 flex flex-wrap gap-2">{TIMES_OUT.map((v) => <Chip key={v} on={p.checkOut === v} onClick={() => edit((y) => { y.policy.checkOut = v; })}>{hhmm(v, lang)}</Chip>)}</div></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-[#f4f5f7] px-4 py-3 text-[14.5px]">
        <span>{t("ভ্যাট", "VAT")} {num(p.vat, lang)}% · {t("সার্ভিস চার্জ", "Service")} {num(p.sc, lang)}%</span>
        <button onClick={() => setTax((x) => !x)} aria-expanded={tax} className="ml-auto font-semibold text-[#c8232e]">{t("বদলান", "Change")}</button>
        {tax && <div className="flex w-full flex-wrap gap-4 pt-2">
          <div><p className="text-[13px] text-[#5b6170]">{t("ভ্যাট", "VAT")}</p><div className="mt-1 flex gap-2">{[0, 5, 7.5, 15].map((v) => <Chip key={v} on={p.vat === v} onClick={() => edit((y) => { y.policy.vat = v; })}>{num(v, lang)}%</Chip>)}</div></div>
          <div><p className="text-[13px] text-[#5b6170]">{t("সার্ভিস চার্জ", "Service")}</p><div className="mt-1 flex gap-2">{[0, 5, 10].map((v) => <Chip key={v} on={p.sc === v} onClick={() => edit((y) => { y.policy.sc = v; })}>{num(v, lang)}%</Chip>)}</div></div>
        </div>}
      </div>
    </Q>
  );
}

// ---------------- Part 4 ----------------
const MODULES = [
  { id: "frontdesk", bn: "ফ্রন্ট ডেস্ক ও বুকিং", en: "Front desk & bookings", icon: BookOpen, locked: true },
  { id: "housekeeping", bn: "হাউসকিপিং", en: "Housekeeping", icon: Brush },
  { id: "staff", bn: "স্টাফ ও হাজিরা", en: "Staff & attendance", icon: UsersRound },
  { id: "inventory", bn: "স্টক / ইনভেন্টরি", en: "Inventory", icon: Boxes },
  { id: "accounts", bn: "হিসাব-নিকাশ", en: "Accounts", icon: Landmark },
  { id: "restaurant", bn: "রেস্টুরেন্ট ও বার", en: "Restaurant & Bar", icon: Utensils, ultra: true },
];
function Modules({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const wantsFood = d.extras.some((e) => e === "Restaurant" || e === "Bar");
  return (
    <Q title={t("কোন কোন কাজ BinGi দিয়ে করবেন?", "What will you run on BinGi?")} why={t("যেগুলো চালান না সেগুলো বন্ধ রাখুন — মেনু ছোট থাকবে। পরে চালু করা যায়।", "Turn off what you don't run. You can turn it on later.")}>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => {
          const on = m.locked || d.modules.includes(m.id);
          return <Tile key={m.id} on={on} locked={m.locked} onClick={() => edit((x) => { x.modules = x.modules.includes(m.id) ? x.modules.filter((y) => y !== m.id) : [...x.modules, m.id]; })}
            icon={<m.icon className="size-5" />} title={t(m.bn, m.en)} badge={m.locked ? t("সবসময় চালু", "Always on") : m.ultra ? t("Ultra প্ল্যানে", "Ultra plan") : undefined} />;
        })}
      </div>
      {(d.modules.includes("restaurant") || wantsFood) && <p className="mt-4 flex gap-2 rounded-2xl bg-[#fdf6e7] px-4 py-3 text-[14px] text-[#7a4a0b]"><CircleAlert className="mt-0.5 size-4 shrink-0" />{t("রেস্টুরেন্ট ও বার Ultra প্ল্যানে আছে — শেষ ধাপে Ultra বাছলে চালু হবে।", "Restaurant & Bar is in Ultra — pick Ultra in the last part to use it.")}</p>}
    </Q>
  );
}
const ROLES: [string, string][] = [["Manager", "ম্যানেজার"], ["Front desk", "ফ্রন্ট ডেস্ক"], ["Housekeeping", "হাউসকিপিং"], ["Accounts", "হিসাব"]];
function Team({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  return (
    <Q title={t("আপনার টিম", "Your team")} why={t("তারা SMS পাবে আর নিজের BinGi ID দিয়ে যোগ দেবে।", "They get an SMS and join with their own BinGi ID.")}>
      <p className="text-[15px] font-bold">{t("কত জন কাজ করেন?", "How many people work here?")}</p>
      <div className="mt-2 flex flex-wrap gap-2">{STAFF.map((s, i) => <Chip key={s} on={d.staff === s} onClick={() => edit((x) => { x.staff = s; })}>{t(["শুধু আমি", "২–৫", "৬–১৫", "১৬–৫০", "৫০+"][i], s)}</Chip>)}</div>
      <p className="mt-6 text-[15px] font-bold">{t("কাউকে এখনই যোগ করবেন? (৩ জন পর্যন্ত)", "Invite someone now? (up to 3)")}</p>
      <div className="mt-2 space-y-2">
        {d.team.map((m, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded-[20px] border-2 border-[#e6e8ee] bg-white p-2.5">
            <input aria-label={`${t("মোবাইল", "Mobile")} ${i + 1}`} inputMode="tel" placeholder="01712 345678" value={m.phone} onChange={(e) => edit((x) => { x.team[i].phone = e.target.value; })} className={field + " h-11 min-w-0 flex-1 basis-[160px]"} />
            <div className="flex flex-wrap gap-1.5">{ROLES.map(([en, bn]) => <Chip key={en} on={m.role === en} onClick={() => edit((x) => { x.team[i].role = en; })}>{t(bn, en)}</Chip>)}</div>
            <button aria-label={`${t("বাদ দিন", "Remove")} ${i + 1}`} onClick={() => edit((x) => { x.team.splice(i, 1); })} className="ml-auto grid size-10 place-items-center rounded-full text-[#5b6170] hover:bg-[#f1f2f5]">✕</button>
          </div>
        ))}
        {d.team.length < 3 && <Ghost onClick={() => edit((x) => { x.team.push({ phone: "", role: "Front desk" }); x.teamLater = false; })}><Plus className="size-[18px]" /> {t("একজন যোগ করুন", "Add a person")}</Ghost>}
      </div>
    </Q>
  );
}

// ---------------- Part 5 ----------------
function Payments({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const p = d.pay;
  const tog = (k: "cash" | "bkash" | "nagad" | "bank") => edit((x) => { x.pay[k] = !x.pay[k]; });
  return (
    <Q title={t("গেস্ট কীভাবে টাকা দেবে?", "How do guests pay?")} why={t("শুরুতে গেস্ট সরাসরি আপনাকে টাকা দেয়। অনলাইন পেমেন্ট যাচাইয়ের পরে চালু হয়।", "Guests pay you directly first. Online payment opens after verification.")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile big on={p.cash} onClick={() => tog("cash")} icon={<Banknote className="size-6" />} title={t("নগদ / কাউন্টারে", "Cash at the desk")} sub={t("সবসময় চালু থাকবে", "Always on")} />
        <Tile big on={p.bkash} onClick={() => tog("bkash")} icon={<Smartphone className="size-6" />} title="bKash" sub={t("গেস্ট আপনার নম্বরে পাঠাবে", "Guest sends to your number")} />
        <Tile big on={p.nagad} onClick={() => tog("nagad")} icon={<Smartphone className="size-6" />} title="Nagad" sub={t("গেস্ট আপনার নম্বরে পাঠাবে", "Guest sends to your number")} />
        <Tile big on={p.bank} onClick={() => tog("bank")} icon={<Landmark className="size-6" />} title={t("ব্যাংক ট্রান্সফার", "Bank transfer")} sub={t("অগ্রিম টাকার জন্য", "For advance payments")} />
      </div>
      <div className="mt-3"><Toggle on={p.bingi === "later"} onClick={() => edit((x) => { x.pay.bingi = x.pay.bingi === "later" ? "" : "later"; })} icon={<Wallet className="size-5" />} title={t("BinGi Payments — অনলাইনে কার্ড/ওয়ালেট (যাচাইয়ের পর আবেদন)", "BinGi Payments — online cards/wallets (apply after verification)")} /></div>
    </Q>
  );
}

function Website({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const plan: PlanId = d.planPicked ? d.plan : recommend(d.units, d.extras);
  const rank = (p: string) => PLAN_ORDER.indexOf(p as (typeof PLAN_ORDER)[number]);
  const old = hotelOf(d).propertyType;
  const fits = (x: (typeof MASTER_LIST)[number]) => x.bestFor.includes(old);
  const themes = MASTER_LIST.filter((x) => rank(x.minPlan) <= rank(plan === "starter" ? "business" : plan)).sort((a, b) => Number(fits(b)) - Number(fits(a))).slice(0, 4);
  return (
    <Q title={t("আপনার ওয়েবসাইট দেখতে কেমন হবে?", "How should your website look?")} why={t("আপনার রুম, দাম আর ছবি দিয়ে আমরা সাজিয়ে দেব। অনুমোদনের আগে ড্রাফট থাকবে।", "We fill it with your rooms and prices. It stays a draft until approval.")}>
      <div role="radiogroup" aria-label={t("ওয়েবসাইটের লুক", "Website look")} className="grid gap-3 sm:grid-cols-2">
        {themes.map((x) => {
          const on = d.site.theme === x.id;
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => edit((y) => { y.site.theme = x.id; y.site.later = false; })}
              className={clsx("relative overflow-hidden rounded-[20px] border-2 text-left transition-colors", on ? "border-[#ef6b62]" : "border-[#e6e8ee] hover:border-[#d5d8e0]")}>
              <Image src={`/themes/${x.id}.jpg`} alt="" width={520} height={260} className="aspect-[16/8] w-full object-cover object-top" />
              <span className="flex flex-wrap items-center gap-2 bg-white p-3"><span className="text-[15.5px] font-bold">{x.name}</span>{fits(x) && <span className="rounded-full bg-[#e9f6ee] px-2 py-0.5 text-[11.5px] font-semibold text-[#1c6b3c]">{t("আপনার জন্য মানানসই", "Good fit")}</span>}</span>
              {on && <span className="onb-pop absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-[#d8372e] text-white shadow"><Check className="size-4" /></span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13.5px] text-[#5b6170]">{t("কিছু লুক নির্দিষ্ট প্ল্যানে পাওয়া যায় — প্ল্যান শেষ ধাপে।", "Some looks need a higher plan — plan is in the last part.")}</p>
    </Q>
  );
}

// ---------------- Part 6 ----------------
function Plan({ d, units }: { d: Draft; units: number }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const [open, setOpen] = useState<PlanId | null>(null);
  const rec = recommend(units, d.extras);
  return (
    <Q title={t("আপনার প্ল্যান বাছাই করুন", "Choose your plan")} sub={t(`${num(TRIAL_DAYS, lang)} দিন ফ্রি। আজ কোনো টাকা লাগবে না। দাম আপনার ${num(units, lang)}টা রুম ধরে।`, `${TRIAL_DAYS} days free. Nothing to pay today. Priced on your ${units} rooms.`)}>
      <div role="radiogroup" aria-label={t("প্ল্যান", "Plan")} className="grid gap-3">
        {(Object.keys(PLANS) as PlanId[]).map((p) => {
          const P = PLANS[p]; const on = d.planPicked && d.plan === p; const q = quote(p, units, d.cycle);
          return (
            <div key={p} className={clsx("rounded-[22px] border-2 transition-colors", on ? "border-[#ef6b62] bg-[#fff6f5]" : "border-[#e6e8ee] bg-white")}>
              <button role="radio" aria-checked={on} onClick={() => edit((x) => { x.plan = p; x.planPicked = true; })} className="flex w-full items-center gap-4 p-4 text-left">
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-[#d8372e] bg-[#d8372e] text-white" : "border-[#d5d8e0]")}>{on && <Check className="size-4" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2 text-[18px] font-bold">{P.label}{rec === p && <span className="rounded-full bg-gradient-to-b from-[#e2483f] to-[#c8232e] px-2 py-0.5 text-[11.5px] font-semibold text-white">{t("আপনার জন্য ভালো", "Recommended")}</span>}</span>
                  <span className="block text-[13.5px] text-[#5b6170]">{t(p === "starter" ? "ছোট গেস্ট হাউস ও বাড়ি" : p === "business" ? "হোটেল ও রিসোর্ট, পুরো HMS" : "পুরো HMS + রেস্টুরেন্ট ও বার", P.for)}</span>
                </span>
                <span className="shrink-0 text-right"><span className="block text-[20px] font-bold">৳{num(money(q.monthly), lang)}</span><span className="text-[12.5px] text-[#5b6170]">{t("মাসে", "/ month")}</span></span>
              </button>
              <button onClick={() => setOpen(open === p ? null : p)} aria-expanded={open === p} className="mx-4 mb-3 text-[13.5px] font-semibold text-[#c8232e]">{open === p ? t("হিসাব লুকান", "Hide details") : t("হিসাব দেখুন", "See details")}</button>
              {open === p && (
                <dl className="onb-in mx-4 mb-4 grid gap-1.5 rounded-2xl bg-white p-3 text-[14px] ring-1 ring-[#e6e8ee]">
                  <Row k={t(`${num(q.billed, lang)}টা রুম × ৳${num(P.perUnit, lang)}`, `${q.billed} units × ৳${P.perUnit}`)} v={`৳${num(money(q.monthly), lang)}`} />
                  {units < MIN_BILLED && <p className="text-[12.5px] text-[#5b6170]">{t(`কমপক্ষে ${num(MIN_BILLED, lang)}টা রুমের বিল হয়`, `Billing starts at ${MIN_BILLED} units`)}</p>}
                  <Row k={t("অ্যাক্টিভেশন (একবার)", "Activation (one time)")} v={P.activation ? `৳${num(money(P.activation), lang)}` : t("নেই", "None")} />
                </dl>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-[14.5px] font-semibold">{t("বিল", "Billing")}</span>
        {([1, 6, 12] as Cycle[]).map((c) => <Chip key={c} on={d.cycle === c} onClick={() => edit((x) => { x.cycle = c; })}>{c === 1 ? t("মাসিক", "Monthly") : t(`${num(c, lang)} মাস`, `${c} months`)}{CYCLE_OFF[c] ? <span className="text-[#1c7d45]">−{num(CYCLE_OFF[c] * 100, lang)}%</span> : null}</Chip>)}
      </div>
      {d.planPicked && (() => { const q = quote(d.plan, units, d.cycle); return (
        <p className="mt-4 rounded-2xl bg-[#f4f5f7] px-4 py-3 text-[14.5px]">{t("ট্রায়ালের পর", "After the trial")}: <b>৳{num(money(q.total), lang)}</b> {q.off ? <span className="text-[#1c7d45]">({t("ছাড়", "saved")} ৳{num(money(q.off), lang)})</span> : null} · <span className="text-[#5b6170]">{t("ভ্যাট থাকলে ইনভয়েসে যোগ হবে", "VAT, if any, on the invoice")}</span></p>
      ); })()}
    </Q>
  );
}
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-3"><dt className="text-[#5b6170]">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>; }

function Verify({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const docs = [["nid", "🪪", "মালিকের NID (সামনে ও পেছনে)", "Owner NID (front & back)", true], ["trade", "📄", "ট্রেড লাইসেন্স", "Trade licence", true], ["tin", "🧾", "TIN সার্টিফিকেট", "TIN certificate", false]] as const;
  return (
    <Q title={t("কাগজপত্র", "Documents")} why={t("ওয়েবসাইট পাবলিক আর অনলাইন পেমেন্টের আগে লাগবে। এখন না দিলেও HMS চালাতে পারবেন।", "Needed before going public and online payment. You can use HMS meanwhile.")}>
      <div className="grid gap-3">
        {docs.map(([k, em, bn, en, req]) => (
          <label key={k} className={clsx("flex cursor-pointer items-center gap-3 rounded-[20px] border-2 p-4 focus-within:ring-4 focus-within:ring-[#ef6b62]/15", d.verify[k] ? "border-[#bfe0cb] bg-[#f4fbf6]" : "border-[#e6e8ee] bg-white")}>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#fdeceb] text-[24px]" aria-hidden>{d.verify[k] ? "✅" : em}</span>
            <span className="min-w-0 flex-1"><span className="block text-[16px] font-bold">{t(bn, en)}{!req && <span className="font-normal text-[#5b6170]"> ({t("ঐচ্ছিক", "optional")})</span>}</span><span className="block truncate text-[13.5px] text-[#5b6170]">{d.verify[k] || t("ছবি বা PDF", "Photo or PDF")}</span></span>
            <span className="inline-flex items-center gap-1 text-[14.5px] font-semibold text-[#c8232e]"><FileUp className="size-4" />{d.verify[k] ? t("বদলান", "Replace") : t("আপলোড", "Upload")}</span>
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) edit((x) => { x.verify[k] = f.name; x.verify.later = false; }); }} />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#5b6170]">{t("প্রোটোটাইপ: শুধু ফাইলের নাম রাখা হয়, কিছু আপলোড হয় না।", "Prototype: only the file name is kept.")}</p>
    </Q>
  );
}

function Ready({ d, counts, go }: { d: Draft; counts: { total: number; published: number; categories: number }; go: (s: StepId) => void }) {
  const { t, lang } = useL();
  const cs = checks(d, counts);
  const sc = score(cs);
  const q = d.planPicked ? quote(d.plan, counts.total, d.cycle) : null;
  return (
    <Q title={t("সব ঠিক আছে?", "All good?")} why={t("জমা দিলে HMS সেটআপ মোডে খুলবে। BinGi যাচাই করে অনুমোদন দেবে।", "After submitting, HMS opens in setup mode while BinGi reviews.")}>
      <div className="flex items-center gap-4 rounded-[22px] bg-gradient-to-br from-[#fff5f4] to-[#f4f5f7] p-4">
        <Ring v={sc} lang={lang} />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-bold">{d.name || t("নাম নেই", "Untitled")}</p>
          <p className="text-[14px] text-[#5b6170]">{num(counts.total, lang)} {t("টা রুম", "rooms")} · {d.city || "—"} · {d.planPicked ? PLANS[d.plan].label : "—"}{q ? ` · ৳${num(money(q.monthly), lang)}/${t("মাস", "mo")}` : ""}</p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {cs.map((c) => (
          <li key={c.id} className={clsx("flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5", c.ok ? "border-[#e3f1e7] bg-[#f6fbf7]" : c.level === "required" ? "border-[#f6cfcb] bg-[#fff6f5]" : "border-[#e6e8ee] bg-white")}>
            <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full", c.ok ? "bg-[#1c7d45] text-white" : c.level === "required" ? "bg-[#d8372e] text-white" : "bg-[#e6e8ee] text-[#5b6170]")}>{c.ok ? <Check className="size-3.5" /> : c.level === "required" ? <CircleAlert className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}</span>
            <span className="min-w-0 flex-1 text-[14.5px] font-medium">{t(c.bn, c.label)}{c.level !== "required" && !c.ok && <span className="text-[12.5px] text-[#5b6170]"> · {t("পরে করা যাবে", "can wait")}</span>}</span>
            {!c.ok && <button onClick={() => go(c.step)} className="text-[13.5px] font-semibold text-[#c8232e]">{t("ঠিক করুন", "Fix")}</button>}
          </li>
        ))}
      </ul>
    </Q>
  );
}
function Ring({ v, lang }: { v: number; lang: "bn" | "en" }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" role="img" aria-label={`${v}%`} className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={v >= 80 ? "#1c7d45" : "#d8372e"} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 500ms ease" }} />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1d1f24">{num(v, lang)}%</text>
    </svg>
  );
}

function Done({ d }: { d: Draft }) {
  const { t } = useL();
  const router = useRouter();
  return (
    <Canvas>
      <Header />
      <Card aside={<KeyCard d={d} step="done" rooms={d.units} />} bar={<KeyCard compact d={d} step="done" rooms={d.units} />} footer={<Foot><Ghost onClick={() => router.push("/onboarding/status")}>{t("স্ট্যাটাস দেখুন", "View status")}</Ghost><Primary onClick={() => router.push("/hms")}>{t("ড্যাশবোর্ডে যান", "Go to dashboard")}</Primary></Foot>}>
        <div className="onb-in pt-6 text-center lg:pt-16">
          <p className="text-[56px] leading-none" aria-hidden>🎉</p>
          <h1 className="mt-4 text-[30px] font-bold leading-tight">{t("অভিনন্দন! সেটআপ জমা হয়েছে", "Congratulations! Setup submitted")}</h1>
          <p className="mx-auto mt-3 max-w-[440px] text-[16px] leading-relaxed text-[#5b6170]">{t(`${d.name || "আপনার property"} এখন সেটআপ মোডে। BinGi যাচাই করছে — এর মধ্যে HMS ব্যবহার শুরু করুন।`, `${d.name || "Your property"} is in setup mode. BinGi is reviewing — start using HMS meanwhile.`)}</p>
        </div>
      </Card>
    </Canvas>
  );
}
