"use client";
// Onboarding v7 "easy" — 6 parts, one question per screen, picture answers, live preview, Bangla first.
// Part 2 follows the live HMS room-add flow: presets only, one room type after another.
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BedDouble, Bike, CalendarDays, Boxes, Brush, Building, Building2, Car, Castle, Check, CircleAlert, Coffee, Dumbbell, FileUp, Home, House, Landmark, MapPin,
  PartyPopper, Plus, Shirt, Sparkles, Tent, TreePalm, UsersRound, Utensils, Wallet, Waves, Wine, Bus, BookOpen, Banknote, Smartphone, Lock,
  CircleCheck, Clock, FileText, IdCard, Receipt, Scale, ShieldCheck, Globe, CalendarCheck, ImageIcon,
  ChevronRight, ClipboardList, Wifi, Zap, ConciergeBell, BellRing, Cctv, ArrowUpDown, Umbrella, Trees, Presentation, Flame, Moon, Baby, Store,
} from "lucide-react";
import {
  CYCLE_OFF, EXTRAS, MIN_BILLED, MODULE_PLAN, ORDER, PLANS, SECTIONS, STAFF, sectionOf, TRIAL_DAYS, checks, hotelOf, nowIso, stepOf, num, planRank, quote, recommend, score, useL, useOnboarding, validPhone,
  type Cycle, type Draft, type PlanId, type StepId,
} from "@/lib/onboarding/store";
import { SUGGEST, configFrom } from "@/lib/onboarding/rooms-easy";
import { useRooms } from "@/lib/rooms/store";
import { MASTER_LIST, PLAN_ORDER } from "@/themes/manifest";
import { setProperty } from "../hms/property";
import { money } from "../hms/rooms/parts";
import { MobileSteps, Sidebar, progressOf } from "./sidebar";
import { GuestPreview } from "./preview";
import { AddressSheet } from "./address";
import { FormSlot } from "./rooms-easy";
import { AddRooms, Place, ReviewRooms } from "./rooms-v8";
import { PROP_ALL, PROP_BN, PROP_SUGGEST, configFrom8, propTop } from "@/lib/onboarding/rooms-v8";
import { Contact, Documents, SetupHelp, Start, Summary } from "./steps-v8";
import { PlanV8 } from "./plan-v8";
import { Canvas, Card, Chip, Errors, Foot, Ghost, Header, Later, Next, Pills, Primary, Q, Section, Stepper, SwitchRow, Tile, field, label } from "./shell";

const noop = () => () => {};
import { TYPE_META as TYPES } from "./types";
export { TYPES };
const EXTRA_ICON: Record<string, typeof Utensils> = { Restaurant: Utensils, Bar: Wine, "Café": Coffee, Pool: Waves, Spa: Sparkles, "Event hall": PartyPopper, "Airport transfer": Bus, Tours: Bike, Laundry: Shirt, Gym: Dumbbell };
const EXTRA_BN: Record<string, string> = { Restaurant: "রেস্টুরেন্ট", Bar: "বার", "Café": "ক্যাফে", Pool: "সুইমিং পুল", Spa: "স্পা", "Event hall": "ইভেন্ট হল", "Airport transfer": "পিকআপ", Tours: "ট্যুর", Laundry: "লন্ড্রি", Gym: "জিম" };

export function OnboardingFlow() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  const { t } = useL();
  if (!ready) return <Canvas><Header /><p className="p-8 text-[15px] text-[#4d5664]" role="status">{t("লোড হচ্ছে…", "Loading…")}</p></Canvas>;
  if (!draft) return <Canvas><Header /><div className="p-8"><p className="text-[17px] font-semibold">{t("কোনো property বাছাই করা নেই।", "No property selected.")}</p><Link className="mt-3 inline-block font-semibold text-[#b11c29]" href="/onboarding">{t("আমার property", "My properties")}</Link></div></Canvas>;
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
  const [blocked, setBlocked] = useState<string[]>([]);
  const live = rooms.st.units.filter((u) => u.status !== "archived");
  const counts = { total: live.length, published: 0, categories: rooms.st.categories.filter((c) => !c.archived).length };

  const go = (s: StepId) => { setTried(false); setBlocked([]); edit((x) => { x.step = s; if (!x.seen.includes(s)) x.seen.push(s); }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const i = ORDER.indexOf(stepOf(d.step));
  useEffect(() => { if (stepOf(d.step) !== d.step) edit((x) => { x.step = stepOf(x.step); }); }, [d.step, edit]);
  const next = () => go(ORDER[Math.min(ORDER.length - 1, i + 1)]);
  const back = i > 0 ? () => go(ORDER[i - 1]) : () => router.push("/onboarding");
  const errs = [...errorsFor(d, counts.total, t), ...blocked.map((b) => t(`"${b}"-এ রুম আছে — আগে রুমগুলো বাদ দিন।`, `"${b}" has rooms — remove them first.`))];
  const firstTheme = themesFor(d)[0]?.id;
  const cs = checks(d, counts);
  const pct = progressOf(d, cs);
  const cont = () => {
    if (errs.length) { setTried(true); return; }
    if (d.step === "3.1") rooms.update((s) => { s.config = configFrom8(d, s.config); }, "Accommodation locations set up from onboarding presets");
    // the "Best fit" plan counts as chosen unless the owner picks another (one tap less)
    if (d.step === "2.2" && !d.planPicked) edit((x) => { x.plan = recommend(x); x.planPicked = true; });
    // the owner saw the price rules on this page — count them as checked (defaults are fine)
    if (d.step === "4.1" && !d.rates.done) edit((x) => { x.rates.done = true; });
    // no look picked and not "later": keep the best fit that is shown first
    if (d.step === "5.2" && !d.site.theme && !d.site.later && firstTheme) edit((x) => { x.site.theme = firstTheme; });
    next();
  };
  const submit = () => {
    if (checks(d, counts).some((c) => c.level === "required" && !c.ok)) { setTried(true); return; }
    edit((x) => { x.status = "pending"; x.submitted = nowIso(); x.units = counts.total; });
    setProperty(d.slug);
    setDone(true);
  };

  if (done) return <Done d={d} onEdit={(s) => { setDone(false); go(s); }} />;

  const body: Record<StepId, ReactNode> = {
    "1.1": <PropertyType d={d} />, "1.2": <Name d={d} />, "1.3": <Address d={d} />, "1.4": <Extras d={d} />, "1.5": <Contact d={d} />,
    "2.1": <Documents d={d} />, "2.2": <PlanV8 d={d} units={counts.total} />, "2.3": <SetupHelp d={d} />, "2.4": <Start d={d} />, "2.5": <Summary d={d} units={counts.total} go={go} />,
    "3.1": <Place d={d} st={rooms.st} goStep={go} />, "3.2": <AddRooms d={d} rooms={rooms} onForm={setFormOpen} />, "3.3": <ReviewRooms d={d} rooms={rooms} go={go} />,
    "4.1": <BookingRules d={d} />, "4.2": <Modules d={d} />, "4.3": <Team d={d} />,
    "5.1": <Payments d={d} />, "5.2": <Website d={d} />,
    "6.1": <Ready d={d} counts={counts} go={go} />,
  };
  const later: Partial<Record<StepId, () => void>> = {
    "1.4": next, "2.1": () => { edit((x) => { x.docs.later = true; }); next(); }, "4.3": () => { edit((x) => { x.teamLater = true; }); next(); }, "5.2": () => { edit((x) => { x.site.later = true; }); next(); },
  };
  const required = checks(d, counts).filter((c) => c.level === "required" && !c.ok).map((c) => `${t(c.bn, c.label)} ${t("এখনো বাকি।", "is still missing.")}`);

  return (
    <FormSlot.Provider value={{ slot, setOpen: setFormOpen }}>
    <Canvas>
      <Header title={d.name || t("নতুন property", "New property")} right={<Link href="/onboarding" aria-label={t("সেভ করে বের হন", "Save & exit")} className="inline-flex h-9 items-center whitespace-nowrap rounded-full bg-white px-3.5 text-[14px] font-semibold ring-1 ring-[#e3e7ec]"><span className="sm:hidden">{t("বের হন", "Exit")}</span><span className="hidden sm:inline">{t("সেভ করে বের হন", "Save & exit")}</span></Link>} />
      <Card sidebar={<Sidebar d={d} cs={cs} pct={pct} go={go} />} mobileNav={<MobileSteps d={d} cs={cs} pct={pct} go={go} />} progress={pct}
        wide={d.step === "2.2" || (d.step === "3.2" && formOpen)}
        aside={d.step === "2.2" || d.step === "6.1" || d.step === "3.3" || (d.step === "3.2" && formOpen) ? undefined : <GuestPreview d={d} cats={rooms.st.categories.filter((c) => !c.archived)} units={counts.total} />}
        footer={<>
          <div ref={setSlot} hidden={!formOpen} />
          {!formOpen && <Foot back={back}>
            {later[d.step] && <Later onClick={later[d.step]} />}
            {d.step === "6.1" ? <Primary onClick={submit}>{t("জমা দিন", "Submit")} <Check className="size-[18px]" /></Primary> : <Next onClick={cont} />}
          </Foot>}
        </>}>
        <div>
          {tried && <Errors list={d.step === "6.1" ? required : errs} />}
          <div key={d.step + lang} className="onb-in"><PartIntro step={stepOf(d.step)} />{body[stepOf(d.step)]}</div>
        </div>
      </Card>
    </Canvas>
    </FormSlot.Provider>
  );
}

const PART_ICON = [Building2, ClipboardList, BedDouble, CalendarCheck, Wallet, CircleCheck];
const PART_LINE: [string, string][] = [
  ["নাম, ঠিকানা আর যোগাযোগ — ৫ মিনিট", "Name, address and contact — about 5 minutes"],
  ["কাগজপত্র আর প্ল্যান — কাগজ পরে দিলেও চলবে", "Papers and plan — papers can come later"],
  ["কোথায় কোথায় রুম, তারপর রুম যোগ", "Where your rooms are, then add them"],
  ["নিয়ম, কাজ আর টিম — সাধারণ মান আগেই বসানো", "Rules, tools and team — common settings are filled in"],
  ["গেস্ট কীভাবে টাকা দেবে আর ওয়েবসাইটের লুক", "How guests pay and how your website looks"],
  ["সব মিলিয়ে দেখে জমা দিন", "Check everything and submit"],
];
/** Airbnb-style "Part N of 6" banner on the first page of each part. No extra click. */
function PartIntro({ step }: { step: StepId }) {
  const { t, lang } = useL();
  const k = sectionOf(step);
  if (SECTIONS[k].steps[0] !== step) return null;
  const Icon = PART_ICON[k];
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#fff1f1] to-[#fdf7f2] px-4 py-3 ring-1 ring-[#f6dada]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[#b11c29] shadow-sm"><Icon className="size-5" aria-hidden /></span>
      <span className="min-w-0"><span className="block text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#9b1c26]">{t(`ধাপ ${num(k + 1, lang)} / ${num(SECTIONS.length, lang)}`, `Part ${k + 1} of ${SECTIONS.length}`)} · {t(SECTIONS[k].bn, SECTIONS[k].label)}</span>
        <span className="block text-[14px] text-[#4d5664]">{t(...PART_LINE[k])}</span></span>
    </div>
  );
}

function errorsFor(d: Draft, units: number, t: (bn: string, en: string) => string): string[] {
  const e: string[] = [];
  if (d.step === "1.1" && !d.propertyType) e.push(t("একটা ধরন বাছাই করুন।", "Choose a property type."));
  if (d.step === "1.2" && !d.name.trim()) e.push(t("Property-র নাম লিখুন।", "Enter the property name."));
  if (d.step === "1.3" && !(d.road.trim() && d.city.trim())) e.push(t("ঠিকানা দিন — রাস্তা/এলাকা আর শহর।", "Add the address — road/area and city."));
  if (d.step === "1.5" && !validPhone(d.phone)) e.push(t("সঠিক মোবাইল নম্বর দিন।", "Enter a valid mobile number."));
  if (d.step === "1.5" && d.contact.email && !/^\S+@\S+\.\S+$/.test(d.contact.email)) e.push(t("ইমেইল ঠিক নেই।", "The email doesn't look right."));
  if (d.step === "3.1") {
    if (!d.stay.length) e.push(t("কী ভাড়া দেন — কমপক্ষে একটা বাছাই করুন।", "What you rent — choose at least one."));
    const floor = d.stay.some((s) => s === "ROOM" || s === "APARTMENT");
    if (floor && !d.floors.length) e.push(t("কয় তলা আছে বাছাই করুন।", "Choose the floors."));
  }
  if ((d.step === "3.2" || d.step === "3.3") && !units) e.push(t("কমপক্ষে একটা ধরন আর নম্বর যোগ করুন।", "Add at least one type with numbers."));
  if (d.step === "4.1" && !d.policy.preset) e.push(t("বাতিলের একটা নিয়ম বাছাই করুন।", "Choose a cancellation rule."));
  if (d.step === "4.3" && d.team.some((x) => !validPhone(x.phone))) e.push(t("প্রত্যেকের সঠিক মোবাইল নম্বর দিন।", "Each invite needs a valid mobile number."));
  if (d.step === "5.1") {
    const p = d.pay;
    if (!p.cash) e.push(t("নগদ টাকা নেওয়া চালু রাখতে হবে।", "Pay at property must stay on."));
    if (p.bkash && !validPhone(p.bkashNo ?? "")) e.push(t("সঠিক bKash নম্বর দিন।", "Enter a valid bKash number."));
    if (p.nagad && !validPhone(p.nagadNo ?? "")) e.push(t("সঠিক Nagad নম্বর দিন।", "Enter a valid Nagad number."));
    if (p.bank && !(p.bankName && p.bankHolder?.trim() && /^\d{9,17}$/.test(p.bankAcc ?? ""))) e.push(t("ব্যাংক, অ্যাকাউন্টের নাম আর সঠিক অ্যাকাউন্ট নম্বর দিন।", "Add the bank, account name and a valid account number."));
    if (!p.bingi) e.push(t("BinGi Payments — এখন আবেদন নাকি পরে, বাছাই করুন।", "BinGi Payments — choose apply now or later."));
    if (p.bingi === "apply") {
      const s = p.settle;
      if (!s || (s.method === "bank" ? !(s.holder.trim() && s.bank && /^\d{9,17}$/.test(s.acc) && /^\d{9}$/.test(s.routing)) : !(s.holder.trim() && validPhone(s.wallet))))
        e.push(t("সেটেলমেন্ট অ্যাকাউন্টের সব তথ্য দিন (রাউটিং ৯ সংখ্যা)।", "Complete the settlement account (routing is 9 digits)."));
    }
  }
  return e;
}

// ---------------- Part 1 ----------------
function PropertyType({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  // Presets: the type pre-fills what you rent, floors and zones (owner only confirms later).
  const FLOORS: Record<string, number> = { hotel: 4, resort: 2, "guest-house": 2, homestay: 1, "serviced-apartment": 8, motel: 1, hostel: 2, "vacation-rental": 1, lodge: 1, other: 2 };
  const pick = (slug: string) => edit((x) => {
    x.propertyType = slug;
    if (x.seen.length <= 2) {
      x.stay = [...(SUGGEST[slug] ?? ["ROOM"])];
      x.buildings = ["main"];
      x.floors = Array.from({ length: FLOORS[slug] ?? 2 }, (_, i) => i + 1);
      x.zones = x.stay.some((s) => s === "COTTAGE" || s === "VILLA" || s === "OTHER") ? ["garden"] : [];
      x.types = []; x.extras = [];
    }
  });
  const list = TYPES; // all types at once (22 Nov: no "More types")
  return (
    <Q title={t("আপনি কী ধরনের property চালান?", "What kind of property do you run?")} why={t("ধরন দেখে আমরা রুম, ওয়েবসাইট আর প্ল্যান আগে থেকে সাজিয়ে দিই। পরে বদলানো যায়।", "We pre-fill rooms, website and plan from this. You can change it later.")}>
      <div role="radiogroup" aria-label={t("Property-র ধরন", "Property type")} className="grid gap-3 sm:grid-cols-2">
        {list.map((p) => <Tile key={p.slug} big role="radio" on={d.propertyType === p.slug} onClick={() => pick(p.slug)} icon={<p.icon className="size-6" />} title={t(p.bn, p.en)} sub={t(p.subBn, p.subEn)} />)}
      </div>
      <p className="mt-5 flex w-fit items-center gap-1.5 rounded-full bg-[#e9edf2] px-3 py-1.5 text-[13.5px] text-[#4d5664]"><MapPin className="size-4" aria-hidden /> {t("বাংলাদেশ · টাকা (৳)", "Bangladesh · Taka (৳)")}</p>
    </Q>
  );
}

/** Cover photo, resized in the browser (prototype keeps it in this browser only). */
function Cover({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const pick = (f?: File) => {
    if (!f) return;
    const img = new window.Image();
    img.onload = () => {
      const w = Math.min(960, img.width), h = Math.round((img.height / img.width) * w);
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const url = c.toDataURL("image/jpeg", 0.72);
      URL.revokeObjectURL(img.src);
      edit((x) => { x.cover = url; });
    };
    img.src = URL.createObjectURL(f);
  };
  return (
    <label className="group relative flex aspect-[16/7] cursor-pointer sm:aspect-[4/3] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-[#c6ccd4] bg-[#f9fafb] text-center hover:border-[#9aa0ac] focus-within:ring-4 focus-within:ring-[#0f1720]/10">
      {d.cover ? <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={d.cover} alt="" className="absolute inset-0 size-full object-cover" /><span className="absolute bottom-2 rounded-full bg-white/95 px-2.5 py-1 text-[12.5px] font-semibold shadow">{t("ছবি বদলান", "Change photo")}</span></>
        : <><ImageIcon className="size-6 text-[#b11c29]" aria-hidden /><span className="text-[13.5px] font-semibold">{t("কভার ছবি", "Cover photo")}</span><span className="text-[11.5px] text-[#5b6270]">{t("বাইরে থেকে তোলা", "From outside")}</span></>}
      <input type="file" accept="image/*" className="sr-only" aria-label={t("কভার ছবি", "Cover photo")} onChange={(e) => pick(e.target.files?.[0])} />
    </label>
  );
}
function Name({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  return (
    <Q title={t("আপনার property-র নাম কী?", "What is your property called?")} why={t("গেস্টরা এই নাম ওয়েবসাইট আর বুকিং কনফার্মেশনে দেখবে।", "Guests see this on your website and confirmations.")}>
      <label htmlFor="pname" className="sr-only">{t("Property-র নাম", "Property name")}</label>
      <input id="pname" value={d.name} onChange={(e) => edit((x) => { x.name = e.target.value; })} placeholder={t("যেমন: সী ব্রিজ হোটেল", "e.g. Sea Breeze Hotel")} className={field + " h-14 text-[19px] font-semibold"} maxLength={60} />
      <div className="mt-6 rounded-2xl border border-[#e3e7ec] bg-white p-5">
        <p className="text-[15.5px] font-semibold">{t("ওয়েবসাইটের জন্য", "For your website")} <span className="font-normal text-[#5b6270]">· {t("ঐচ্ছিক", "optional")}</span></p>
        <p className="text-[13.5px] text-[#4d5664]">{t("দিলে ওয়েবসাইট প্রথম দিন থেকেই সাজানো দেখাবে।", "Your website looks finished from day one.")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
          <Cover d={d} />
          <div><label htmlFor="ptag" className={label}>{t("এক লাইনে পরিচিতি", "One-line introduction")}</label>
            <input id="ptag" value={d.tagline ?? ""} onChange={(e) => edit((x) => { x.tagline = e.target.value.slice(0, 80); })} placeholder={t("যেমন: বিচ থেকে ২ মিনিট, পরিবার নিয়ে থাকার জন্য", "e.g. Two minutes from the beach, made for families")} className={field + " mt-1.5"} />
            <p className="mt-1 text-[12.5px] text-[#5b6270]">{t("ওয়েবসাইটের প্রথম পাতায় নামের নিচে দেখাবে।", "Shows under your name on the home page.")}</p></div>
        </div>
      </div>
    </Q>
  );
}

const DIVS: [string, string][] = [["Dhaka", "ঢাকা"], ["Chattogram", "চট্টগ্রাম"], ["Sylhet", "সিলেট"], ["Khulna", "খুলনা"], ["Rajshahi", "রাজশাহী"], ["Barishal", "বরিশাল"], ["Rangpur", "রংপুর"], ["Mymensingh", "ময়মনসিংহ"]];
/** Round 1 (12 Nov): type the address right here; the map pin is optional (prototype map). */
function Address({ d }: { d: Draft }) {
  const [open, setOpen] = useState(false);
  const { edit } = useOnboarding();
  const { t } = useL();
  const set = (k: "road" | "area" | "city" | "division" | "postcode", v: string) => edit((x) => { x[k] = v; x.address = [x.road, x.area, x.city, x.postcode].map((y) => y.trim()).filter(Boolean).join(", "); });
  const inp = (k: "road" | "area" | "city" | "postcode", lab: string, ph: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label htmlFor={`ad-${k}`} className={label}>{lab}</label><input id={`ad-${k}`} value={d[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} {...extra} className={field + " mt-1.5"} /></div>
  );
  return (
    <Q title={t("আপনার property কোথায়?", "Where is your property?")} sub={t("গেস্টরা এই ঠিকানা দেখে আসবে।", "Guests find you by this address.")}>
      <div className="space-y-4">
        <Section n={1} title={t("ঠিকানা", "Address")} hint={t("রাস্তা আর শহর লাগবে, বাকিগুলো ঐচ্ছিক", "Road and city are needed, the rest is optional")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{inp("road", t("রাস্তা / বাড়ি *", "Road / house *"), t("যেমন: কলাতলী রোড, হোটেল মোটেল জোন", "e.g. Kolatoli Road, Hotel-Motel Zone"), { autoComplete: "address-line1" })}</div>
            {inp("city", t("শহর / জেলা *", "City / district *"), t("যেমন: কক্সবাজার", "e.g. Cox's Bazar"), { autoComplete: "address-level2" })}
            {inp("area", t("এলাকা · ঐচ্ছিক", "Area · optional"), t("যেমন: কলাতলী", "e.g. Kolatoli"))}
            <div><label htmlFor="ad-div" className={label}>{t("বিভাগ · ঐচ্ছিক", "Division · optional")}</label><select id="ad-div" value={d.division} onChange={(e) => set("division", e.target.value)} className={field + " mt-1.5"}><option value="">{t("বাছাই করুন", "Choose")}</option>{DIVS.map(([en, bn]) => <option key={en} value={en}>{t(bn, en)}</option>)}</select></div>
            {inp("postcode", t("পোস্টকোড · ঐচ্ছিক", "Postcode · optional"), "4700", { inputMode: "numeric", maxLength: 4 })}
          </div>
        </Section>
        <Section n={2} title={t("ম্যাপে পিন", "Map pin")} hint={t("ঐচ্ছিক — দিলে গেস্ট সহজে খুঁজে পায়", "Optional — helps guests find you")}>
          <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#c6ccd4] bg-[#f9fafb] px-4 py-3.5 text-left hover:border-[#9aa0ac]">
            <span className="grid size-10 place-items-center rounded-xl bg-[#fdecea] text-[#b11c29]"><MapPin className="size-5" aria-hidden /></span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{d.pin ? t("পিন দেওয়া আছে", "Pin added") : t("ম্যাপে পিন দিন", "Add a map pin")}</span><span className="block truncate text-[13px] text-[#4d5664]">{d.address || t("ঠিকানা লিখলে ম্যাপ ওখানে খুলবে", "The map opens at your address")}</span></span>
            <span className="text-[14px] font-semibold text-[#b11c29]">{d.pin ? t("বদলান", "Change") : t("খুলুন", "Open")}</span>
          </button>
        </Section>
        <Section n={3} title={t("আশপাশে কী আছে", "What's nearby")} hint={t("ঐচ্ছিক — ওয়েবসাইটে দেখাবে, যেমন বিচ ৫ মিনিট হেঁটে", "Optional — shown on your website, e.g. Beach · 5 min walk")}>
          <div className="space-y-2">
            {(d.nearby ?? []).map((x, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input aria-label={t(`জায়গা ${i + 1}`, `Place ${i + 1}`)} value={x.name} onChange={(e) => edit((y) => { y.nearby![i].name = e.target.value.slice(0, 40); })} placeholder={t("যেমন: লাবণী বিচ", "e.g. Laboni Beach")} className={field + " h-11 min-w-0 flex-1 basis-[180px]"} />
                <input aria-label={t("কত মিনিট", "Minutes")} inputMode="numeric" value={x.time} onChange={(e) => edit((y) => { y.nearby![i].time = e.target.value.replace(/\D/g, "").slice(0, 3); })} placeholder="5" className={field + " h-11 w-[76px] text-center"} />
                <Pills size="sm" label={t("কীভাবে", "How")} value={x.mode} onChange={(v) => edit((y) => { y.nearby![i].mode = v; })} items={[{ v: "walk" as const, label: t("হেঁটে", "walk") }, { v: "drive" as const, label: t("গাড়িতে", "drive") }]} />
                <button aria-label={t("বাদ দিন", "Remove")} onClick={() => edit((y) => { y.nearby!.splice(i, 1); })} className="grid size-10 place-items-center rounded-full text-[#4d5664] hover:bg-[#e9edf2]">✕</button>
              </div>
            ))}
            {(d.nearby?.length ?? 0) < 4 && <Ghost onClick={() => edit((y) => { y.nearby = [...(y.nearby ?? []), { name: "", time: "", mode: "walk" }]; })}><Plus className="size-[18px]" />{t("একটা জায়গা যোগ করুন", "Add a place")}</Ghost>}
          </div>
        </Section>
      </div>
      {open && <AddressSheet d={d} onClose={() => setOpen(false)} />}
    </Q>
  );
}

const PROP_ICON: Record<string, typeof Utensils> = {
  "Free Wi-Fi": Wifi, Parking: Car, "Power backup": Zap, "24-hour front desk": ConciergeBell, Restaurant: Utensils, "Room service": BellRing, "CCTV security": Cctv,
  Elevator: ArrowUpDown, Breakfast: Coffee, "Airport transfer": Bus, "Swimming pool": Waves, "Beach access": Umbrella, Garden: Trees, "Conference room": Presentation,
  Laundry: Shirt, Bonfire: Flame, Gym: Dumbbell, Bar: Wine, "Café": Coffee, Spa: Sparkles, "Event hall": PartyPopper, "Prayer room": Moon, "Kids play area": Baby,
};
/** v8: the important ones first (by property type), everything else under "show all" with search. */
function Extras({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const [all, setAll] = useState(false);
  const [q, setQ] = useState("");
  const top = propTop(d.propertyType);
  useEffect(() => { if (!d.seen.includes("1.5") && !d.extras.length && PROP_SUGGEST[d.propertyType]) edit((x) => { x.extras = [...PROP_SUGGEST[x.propertyType]]; }); }, [d.propertyType]); // eslint-disable-line react-hooks/exhaustive-deps
  const food = (l: string[]) => l.some((e) => e === "Restaurant" || e === "Bar");
  const tog = (e: string) => edit((x) => {
    const had = food(x.extras);
    x.extras = x.extras.includes(e) ? x.extras.filter((y) => y !== e) : [...x.extras, e];
    // Restaurant/Bar here = the Restaurant & meals tool in part 4 (asked once, not twice).
    if (!had && food(x.extras) && !x.modules.includes("restaurant")) x.modules = [...x.modules, "restaurant"];
    if (had && !food(x.extras)) x.modules = x.modules.filter((y) => y !== "restaurant");
  });
  const nm = (e: string) => t(PROP_BN[e] ?? e, e);
  const hit = (e: string) => !q || nm(e).toLowerCase().includes(q.toLowerCase()) || e.toLowerCase().includes(q.toLowerCase());
  return (
    <Q title={t("কী কী সুবিধা আছে?", "What does your property offer?")} sub={t("জরুরিগুলো আগে। বাকিগুলো \"সব সুবিধা\"-তে।", "The important ones first. The rest are under \"All amenities\".")}>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {top.map((e) => { const I = PROP_ICON[e] ?? Sparkles; return <Tile key={e} on={d.extras.includes(e)} onClick={() => tog(e)} icon={<I className="size-5" />} title={nm(e)} />; })}
      </div>
      {!all ? (
        <button onClick={() => setAll(true)} className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#b11c29]">+ {t("সব সুবিধা দেখুন", "All amenities")}</button>
      ) : (
        <div className="onb-in mt-6 rounded-xl border border-[#e3e7ec] bg-white p-4">
          <label htmlFor="am-q" className="sr-only">{t("খুঁজুন", "Search")}</label>
          <input id="am-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("সুবিধা খুঁজুন", "Search amenities")} className={field} />
          <div className="mt-4 space-y-4">
            {PROP_ALL.map((g) => { const items = g.items.filter((e) => !top.includes(e) && hit(e)); return items.length ? (
              <div key={g.group[1]}><p className="text-[13px] font-semibold text-[#4d5664]">{t(...g.group)}</p><div className="mt-1.5 flex flex-wrap gap-2">{items.map((e) => <Chip key={e} on={d.extras.includes(e)} onClick={() => tog(e)}>{nm(e)}</Chip>)}</div></div>
            ) : null; })}
          </div>
          <p className="mt-4 text-[12.5px] text-[#4d5664]">{t("প্রোটোটাইপ তালিকা। আসল HMS-এ backend-এর পুরো তালিকা থাকবে।", "Prototype list. The real HMS uses the full backend list.")}</p>
        </div>
      )}
      {d.extras.length > 0 && <p className="mt-4 text-[14px] text-[#4d5664]">{t(`${num(d.extras.length, lang)}টা বাছাই`, `${d.extras.length} picked`)}</p>}
    </Q>
  );
}

// ---------------- Part 3 ----------------
function BookingRules({ d }: { d: Draft }) {
  const { t } = useL();
  return (
    <Q title={t("বুকিংয়ের নিয়ম", "Booking rules")} sub={t("সাধারণ নিয়ম আগেই বসানো — মিলিয়ে নিন।", "Common rules are filled in — just check them.")}>
      <div className="space-y-4">
        <Section n={1} title={t("চেক-ইন ও চেক-আউট", "Check-in & check-out")} hint={t("গেস্ট কখন আসবে আর কখন যাবে", "When guests arrive and leave")}><Times d={d} /></Section>
        <Section n={2} title={t("বাতিল ও থাকার নিয়ম", "Cancellation & house rules")} hint={t("বাতিল, বাচ্চা আর পোষা প্রাণী", "Cancellation, children and pets")}><Policy d={d} /></Section>
        <Section n={3} title={t("থাকার নিয়ম", "Stay rules")} hint={t("ঐচ্ছিক — কমপক্ষে কত রাত", "Optional — minimum nights")}><Rates d={d} /></Section>
        <Section n={4} title={t("কর, মুদ্রা ও ভাষা", "Tax, currency & language")} hint={t("বাংলাদেশের জন্য আগেই বসানো", "Already set for Bangladesh")}><Region d={d} /></Section>
      </div>
    </Q>
  );
}
function Rates({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const r = d.rates;
  const set = (fn: (x: Draft["rates"]) => void) => edit((x) => { fn(x.rates); x.rates.done = true; });
  return (
    <div>
      <div className="space-y-3">
        <p className="rounded-xl bg-[#f4f6f8] px-4 py-3 text-[13.5px] text-[#4d5664]">{t("শুক্র–শনির দাম প্রতিটা রুমের ধরনে আলাদা করে দেওয়া হয় (রুম অংশে)।", "Fri–Sat prices are set per room type (in Rooms).")}</p>
        <Toggle on={r.minStay > 1} onClick={() => set((x) => { x.minStay = x.minStay > 1 ? 1 : 2; })} icon={<BedDouble className="size-5" />} title={t("কমপক্ষে কত রাত থাকতে হবে", "Minimum nights")}>
          {r.minStay > 1 && <div className="mt-3"><Stepper label={t("রাত", "Nights")} value={r.minStay} set={(n) => set((x) => { x.minStay = n; })} min={1} max={14} /></div>}
        </Toggle>
      </div>
    </div>
  );
}
function Toggle({ on, onClick, icon, title, children }: { on: boolean; onClick: () => void; icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className={clsx("rounded-xl border p-4 transition-colors", on ? "border-[#b11c29] bg-[#fffafa] shadow-[inset_0_0_0_1px_#b11c29]" : "border-[#d3d8df] bg-white")}>
      <button type="button" role="switch" aria-checked={on} onClick={onClick} className="flex w-full items-center gap-3 text-left">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#ffe7e4] text-[#b11c29]">{icon}</span>
        <span className="flex-1 text-[16px] font-semibold">{title}</span>
        <span className={clsx("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-[#1c7d45]" : "bg-[#c6ccd4]")}><span className={clsx("absolute top-1 size-5 rounded-full bg-white shadow transition-[left]", on ? "left-6" : "left-1")} /></span>
      </button>
      {children}
    </div>
  );
}

const POLICIES = [
  { id: "flexible", bn: "নমনীয়", en: "Flexible", subBn: "চেক-ইনের ২৪ ঘণ্টা আগে পর্যন্ত ফ্রি বাতিল", subEn: "Free cancellation until 24 h before", icon: ShieldCheck },
  { id: "moderate", bn: "মাঝারি", en: "Moderate", subBn: "৫ দিন আগে পর্যন্ত ফ্রি, পরে ১ রাতের দাম", subEn: "Free until 5 days before, then 1 night", icon: Scale },
  { id: "strict", bn: "কড়া", en: "Strict", subBn: "৭ দিন আগে ৫০% ফেরত, পরে ফেরত নেই", subEn: "50% back until 7 days, then none", icon: Lock },
] as const;
const TIMES_IN = ["12:00", "13:00", "14:00", "15:00"];
const TIMES_OUT = ["10:00", "11:00", "12:00"];
const hhmm = (v: string, lang: "bn" | "en") => { const [H] = v.split(":").map(Number); return num(`${H % 12 || 12}${H >= 12 ? " PM" : " AM"}`, lang); };
const ALL_TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
const hhmm2 = (v: string, lang: "bn" | "en") => { const [H, M] = v.split(":").map(Number); return num(`${H % 12 || 12}${M ? ":30" : ""} ${H >= 12 ? "PM" : "AM"}`, lang); };
function Policy({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const p = d.policy;
  return (
    <>
    <div role="radiogroup" aria-label={t("বাতিলের নিয়ম", "Cancellation rule")} className="grid gap-2.5">
      {POLICIES.map((x) => <Tile key={x.id} role="radio" on={p.preset === x.id} onClick={() => edit((y) => { y.policy.preset = x.id; })} icon={<x.icon className="size-5" />} title={t(x.bn, x.en)} sub={t(x.subBn, x.subEn)} />)}
    </div>
    <div className="mt-5 grid gap-4 border-t border-[#e9edf2] pt-5 sm:grid-cols-2">
      <div><p className={label}>{t("বাচ্চা", "Children")}</p><div className="mt-1.5 flex flex-wrap gap-2">{([["all", "সব বয়স", "All ages"], ["6+", "৬+", "6+"], ["12+", "১২+", "12+"], ["none", "শুধু বড়রা", "Adults only"]] as const).map(([v, bn, en]) => <Chip key={v} on={(p.children ?? "all") === v} onClick={() => edit((y) => { y.policy.children = v; })}>{t(bn, en)}</Chip>)}</div></div>
      <div><p className={label}>{t("পোষা প্রাণী", "Pets")}</p><div className="mt-1.5 flex flex-wrap gap-2">{([["no", "না", "No"], ["small", "ছোট, জানিয়ে", "Small, on request"], ["yes", "হ্যাঁ", "Yes"]] as const).map(([v, bn, en]) => <Chip key={v} on={(p.pets ?? "no") === v} onClick={() => edit((y) => { y.policy.pets = v; })}>{t(bn, en)}</Chip>)}</div></div>
    </div>
    </>
  );
}
/** Live: quick chips + "Other" with every half hour. */
function Times({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const p = d.policy;
  const col = (k: "checkIn" | "checkOut", lab: string, quick: string[]) => (
    <div>
      <p className="mb-1.5 text-[13.5px] font-semibold text-[#2b3340]">{lab}</p>
      <div className="flex flex-wrap gap-2">{quick.map((v) => <Chip key={v} on={p[k] === v} onClick={() => edit((y) => { y.policy[k] = v; })}>{hhmm(v, lang)}</Chip>)}</div>
      <label className="mt-2.5 block"><span className="sr-only">{t(`${lab} — অন্য সময়`, `${lab} — other time`)}</span>
        <select value={quick.includes(p[k]) ? "" : p[k]} onChange={(e) => e.target.value && edit((y) => { y.policy[k] = e.target.value; })} className={field + " h-10 text-[14.5px]"}>
          <option value="">{t("অন্য সময়…", "Other time…")}</option>{ALL_TIMES.map((v) => <option key={v} value={v}>{hhmm2(v, lang)}</option>)}
        </select>
      </label>
    </div>
  );
  return <div className="grid gap-5 sm:grid-cols-2">{col("checkIn", t("চেক-ইন", "Check-in"), TIMES_IN)}{col("checkOut", t("চেক-আউট", "Check-out"), TIMES_OUT)}</div>;
}
function Region({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const p = d.policy;
  const sel = (id: string, lab: string, v: string, opts: [string, string][], set: (v: string) => void) => (
    <div><label htmlFor={id} className={label}>{lab}</label><select id={id} value={v} onChange={(e) => set(e.target.value)} className={field + " mt-1.5"}>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><p className={label}>{t("ভ্যাট", "VAT")}</p><div className="mt-1.5 flex flex-wrap gap-2">{[0, 5, 7.5, 15].map((v) => <Chip key={v} on={p.vat === v} onClick={() => edit((y) => { y.policy.vat = v; })}>{num(v, lang)}%</Chip>)}</div></div>
        <div><p className={label}>{t("সার্ভিস চার্জ", "Service charge")}</p><div className="mt-1.5 flex flex-wrap gap-2">{[0, 5, 10].map((v) => <Chip key={v} on={p.sc === v} onClick={() => edit((y) => { y.policy.sc = v; })}>{num(v, lang)}%</Chip>)}</div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {sel("rg-cur", t("মুদ্রা", "Currency"), p.currency ?? "BDT", [["BDT", "BDT ৳"], ["USD", "USD $"], ["INR", "INR ₹"]], (v) => edit((y) => { y.policy.currency = v; }))}
        {sel("rg-tz", t("টাইম জোন", "Time zone"), p.tz ?? "Asia/Dhaka", [["Asia/Dhaka", "Asia/Dhaka"], ["Asia/Kolkata", "Asia/Kolkata"], ["UTC", "UTC"]], (v) => edit((y) => { y.policy.tz = v; }))}
        {sel("rg-lang", t("প্রধান ভাষা", "Primary language"), p.lang ?? "bn", [["bn", "বাংলা"], ["en", "English"]], (v) => edit((y) => { y.policy.lang = v; }))}
      </div>
    </div>
  );
}

// ---------------- Part 4 ----------------
const MODULES = [
  { id: "frontdesk", bn: "ফ্রন্ট ডেস্ক ও বুকিং", en: "Front desk & bookings", icon: BookOpen, locked: true },
  { id: "housekeeping", bn: "হাউসকিপিং", en: "Housekeeping", icon: Brush },
  { id: "staff", bn: "পূর্ণ HRM (স্টাফ, হাজিরা, বেতন)", en: "Full HRM (staff, attendance, payroll)", icon: UsersRound },
  { id: "inventory", bn: "স্টক / ইনভেন্টরি", en: "Inventory", icon: Boxes },
  { id: "accounts", bn: "খরচের হিসাব", en: "Expense management", icon: Landmark },
  { id: "restaurant", bn: "রেস্টুরেন্ট ও মিল", en: "Restaurant & meals", icon: Utensils },
  { id: "services", bn: "অন্যান্য সার্ভিস (লন্ড্রি, গাড়ি, ট্যুর)", en: "Other services (laundry, transport, tours)", icon: Sparkles },
];
function Modules({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const need = recommend(d);
  return (
    <Q title={t("কোন কোন কাজ BinGi দিয়ে করবেন?", "What will you run on BinGi?")} why={t("যেগুলো চালান না সেগুলো বন্ধ রাখুন — মেনু ছোট থাকবে। পরে চালু করা যায়।", "Turn off what you don't run. You can turn it on later.")}>
      <div className="grid gap-2.5">
        {MODULES.map((m) => {
          const on = m.locked || d.modules.includes(m.id);
          const pl = MODULE_PLAN[m.id];
          return <Tile key={m.id} on={on} locked={m.locked} onClick={() => edit((x) => { x.modules = x.modules.includes(m.id) ? x.modules.filter((y) => y !== m.id) : [...x.modules, m.id]; })}
            icon={<m.icon className="size-6" />} title={t(m.bn, m.en)} sub={m.id === "restaurant" && d.extras.some((e) => e === "Restaurant" || e === "Bar") ? t("আপনি বলেছেন রেস্টুরেন্ট/বার আছে, তাই চালু করা আছে", "On because you said you have a restaurant/bar") : undefined} badge={m.locked ? t("সবসময় চালু", "Always on") : pl === "starter" ? undefined : t(`${PLANS[pl].label} থেকে`, `From ${PLANS[pl].label}`)} />;
        })}
      </div>
      <p className="mt-4 rounded-lg border border-[#e3e7ec] bg-white px-4 py-3 text-[14px] text-[#4d5664]">{t("আপনার বাছাই অনুযায়ী মানানসই প্ল্যান:", "Plan that fits your choices:")} <b className="text-[#0f1720]">{PLANS[need].label}</b> · {t("শেষ ধাপে বদলাতে পারবেন", "you can change it in the last part")}</p>
    </Q>
  );
}
const ROLES: [string, string][] = [["Manager", "ম্যানেজার"], ["Front desk", "ফ্রন্ট ডেস্ক"], ["Housekeeping", "হাউসকিপিং"], ["Accounts", "হিসাব"]];
function Team({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  return (
    <Q title={t("আপনার টিম", "Your team")} sub={t("এখন না দিলেও চলবে। তারা SMS পেয়ে নিজের BinGi ID দিয়ে যোগ দেবে।", "Optional now. They get an SMS and join with their own BinGi ID.")}>
      <div className="space-y-4">
        <Section n={1} title={t("টিমের আকার", "Team size")} hint={t("কত জন এখানে কাজ করেন", "How many people work here")}>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#f4f6f8] px-4 py-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#0f1720] text-[14px] font-semibold text-white">{(d.contact?.owner || "Owner").slice(0, 2).toUpperCase()}</span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{d.contact?.owner || t("আপনি", "You")}</span><span className="text-[13px] text-[#4d5664]">{d.phone}</span></span>
            <span className="rounded-full bg-white px-2.5 py-0.5 text-[12.5px] font-semibold">{t("মালিক", "Owner")}</span>
          </div>
          <div className="flex flex-wrap gap-2">{STAFF.map((s, i) => <Chip key={s} on={d.staff === s} onClick={() => edit((x) => { x.staff = s; })}>{t(["শুধু আমি", "২–৫", "৬–১৫", "১৬–৫০", "৫০+"][i], s)}</Chip>)}</div>
        </Section>
        <Section n={2} title={t("কাউকে দাওয়াত দিন", "Invite people")} hint={t("ঐচ্ছিক · ৩ জন পর্যন্ত · প্রতিজনের কাজ বাছুন", "Optional · up to 3 · pick each person's role")}>
          <div className="space-y-2">
            {d.team.map((m, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-[#d3d8df] bg-white p-2.5">
                <input aria-label={`${t("মোবাইল", "Mobile")} ${i + 1}`} inputMode="tel" placeholder="01712 345678" value={m.phone} onChange={(e) => edit((x) => { x.team[i].phone = e.target.value; })} className={field + " h-11 min-w-0 flex-1 basis-[160px]"} />
                <div className="flex flex-wrap gap-1.5">{ROLES.map(([en, bn]) => <Chip key={en} on={m.role === en} onClick={() => edit((x) => { x.team[i].role = en; })}>{t(bn, en)}</Chip>)}</div>
                <button aria-label={`${t("বাদ দিন", "Remove")} ${i + 1}`} onClick={() => edit((x) => { x.team.splice(i, 1); })} className="ml-auto grid size-10 place-items-center rounded-full text-[#4d5664] hover:bg-[#e9edf2]">✕</button>
              </div>
            ))}
            {d.team.length < 3 && <Ghost onClick={() => edit((x) => { x.team.push({ phone: "", role: "Front desk" }); x.teamLater = false; })}><Plus className="size-[18px]" /> {t("একজন যোগ করুন", "Add a person")}</Ghost>}
          </div>
        </Section>
      </div>
    </Q>
  );
}

// ---------------- Part 5 ----------------
const BANKS = ["Sonali Bank", "Janata Bank", "Agrani Bank", "Rupali Bank", "BRAC Bank", "Dutch-Bangla Bank", "The City Bank", "Eastern Bank", "Islami Bank Bangladesh", "Prime Bank", "Mutual Trust Bank", "Bank Asia", "Pubali Bank", "Uttara Bank", "Dhaka Bank", "Southeast Bank", "NCC Bank", "ONE Bank", "AB Bank", "Standard Chartered"];
function In({ id, lab, value, set, ph, mode, hint }: { id: string; lab: string; value?: string; set: (v: string) => void; ph?: string; mode?: "tel" | "numeric"; hint?: string }) {
  return <div><label htmlFor={id} className={label}>{lab}</label><input id={id} value={value ?? ""} onChange={(e) => set(e.target.value)} placeholder={ph} inputMode={mode} className={field + " mt-1.5"} />{hint && <p className="mt-1 text-[12.5px] text-[#4d5664]">{hint}</p>}</div>;
}
function Payments({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const p = d.pay;
  const tog = (k: "cash" | "bkash" | "nagad" | "bank") => edit((x) => { x.pay[k] = !x.pay[k]; });
  const setP = (fn: (x: Draft["pay"]) => void) => edit((x) => { fn(x.pay); });
  const st = p.settle ?? { method: "bank" as const, holder: "", bank: "", acc: "", branch: "", routing: "", wallet: "" };
  const setS = (k: keyof typeof st, v: string) => setP((x) => { x.settle = { ...st, [k]: v } as typeof st; });
  const types: [NonNullable<Draft["pay"]["bkashType"]>, string, string][] = [["personal", "পার্সোনাল", "Personal"], ["merchant", "মার্চেন্ট", "Merchant"], ["agent", "এজেন্ট", "Agent"]];
  return (
    <Q title={t("গেস্ট কীভাবে টাকা দেবে?", "How do guests pay?")} sub={t("নগদ সবসময় চালু। যেগুলো নেন সেগুলো চালু করুন।", "Cash is always on. Turn on what else you accept.")}>
      <div className="space-y-4">
      <Section n={1} title={t("হোটেলে সরাসরি আপনাকে", "At the hotel — paid to you")} hint={t("কাউন্টারে নগদ, আপনার bKash / Nagad বা ব্যাংকে", "Cash at the desk, your bKash / Nagad or bank")}>
      <div className="grid gap-2.5">
        <Tile on={p.cash} onClick={() => tog("cash")} icon={<Banknote className="size-6" />} title={t("নগদ / কাউন্টারে", "Cash at the desk")} sub={t("সবসময় চালু থাকবে", "Always on")} />
        <Tile on={p.bkash} onClick={() => tog("bkash")} icon={<Smartphone className="size-6" />} title="bKash" sub={p.bkash && p.bkashNo ? `${p.bkashNo} · ${t(types.find((x) => x[0] === (p.bkashType ?? "personal"))![1], types.find((x) => x[0] === (p.bkashType ?? "personal"))![2])}` : t("গেস্ট আপনার নম্বরে পাঠাবে", "Guest sends to your number")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <In id="bk-no" lab={t("bKash নম্বর", "bKash number")} value={p.bkashNo} set={(v) => setP((x) => { x.bkashNo = v; })} ph="01712 345678" mode="tel" />
            <In id="bk-name" lab={t("অ্যাকাউন্টের নাম", "Account name")} value={p.bkashName ?? d.name} set={(v) => setP((x) => { x.bkashName = v; })} />
            <div><span className={label}>{t("অ্যাকাউন্টের ধরন", "Account type")}</span><div className="mt-1.5 flex flex-wrap gap-2">{types.map(([v, bn, en]) => <Chip key={v} on={(p.bkashType ?? "personal") === v} onClick={() => setP((x) => { x.bkashType = v; })}>{t(bn, en)}</Chip>)}</div></div>
          </div>
        </Tile>
        <Tile on={p.nagad} onClick={() => tog("nagad")} icon={<Smartphone className="size-6" />} title="Nagad" sub={p.nagad && p.nagadNo ? p.nagadNo : t("গেস্ট আপনার নম্বরে পাঠাবে", "Guest sends to your number")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <In id="ng-no" lab={t("Nagad নম্বর", "Nagad number")} value={p.nagadNo} set={(v) => setP((x) => { x.nagadNo = v; })} ph="01812 345678" mode="tel" />
            <In id="ng-name" lab={t("অ্যাকাউন্টের নাম", "Account name")} value={p.nagadName ?? d.name} set={(v) => setP((x) => { x.nagadName = v; })} />
            <div><span className={label}>{t("অ্যাকাউন্টের ধরন", "Account type")}</span><div className="mt-1.5 flex flex-wrap gap-2">{types.map(([v, bn, en]) => <Chip key={v} on={(p.nagadType ?? "personal") === v} onClick={() => setP((x) => { x.nagadType = v; })}>{t(bn, en)}</Chip>)}</div></div>
          </div>
        </Tile>
        <Tile on={p.bank} onClick={() => tog("bank")} icon={<Landmark className="size-6" />} title={t("ব্যাংক ট্রান্সফার", "Bank transfer")} sub={p.bank && p.bankName ? `${p.bankName} · ${p.bankAcc ?? ""}` : t("গ্রুপ বা অফিসের বুকিংয়ের জন্য", "For group and company bookings")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="bk-bank" className={label}>{t("ব্যাংক", "Bank")}</label><select id="bk-bank" value={p.bankName ?? ""} onChange={(e) => setP((x) => { x.bankName = e.target.value; })} className={field + " mt-1.5"}><option value="">{t("বাছাই করুন", "Choose")}</option>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
            <In id="bk-holder" lab={t("অ্যাকাউন্টের নাম", "Account name")} value={p.bankHolder} set={(v) => setP((x) => { x.bankHolder = v; })} />
            <In id="bk-acc" lab={t("অ্যাকাউন্ট নম্বর", "Account number")} value={p.bankAcc} set={(v) => setP((x) => { x.bankAcc = v.replace(/[^\d]/g, ""); })} mode="numeric" />
            <In id="bk-branch" lab={t("শাখা", "Branch")} value={p.bankBranch} set={(v) => setP((x) => { x.bankBranch = v; })} />
            <div className="sm:col-span-2"><span className={label}>{t("অ্যাকাউন্টের ধরন", "Account type")}</span><div className="mt-1.5 flex flex-wrap gap-2">{([["savings", "সেভিংস", "Savings"], ["current", "কারেন্ট", "Current"], ["business", "বিজনেস", "Business"]] as const).map(([v, bn, en]) => <Chip key={v} on={(p.bankType ?? "current") === v} onClick={() => setP((x) => { x.bankType = v; })}>{t(bn, en)}</Chip>)}</div></div>
          </div>
        </Tile>
      </div>
      {(p.bkash || p.nagad || p.bank) && (
        <div className="mt-4"><label htmlFor="pay-note" className={label}>{t("গেস্টের জন্য নির্দেশনা · ঐচ্ছিক", "Instructions for guests · optional")}</label>
          <textarea id="pay-note" rows={2} value={p.note ?? t("টাকা পাঠিয়ে ট্রানজেকশন আইডি চেক-ইনে দেখান।", "Please send payment and keep the transaction ID for check-in.")} onChange={(e) => setP((x) => { x.note = e.target.value.slice(0, 200); })} className={field + " mt-1.5 h-auto py-2.5"} /></div>
      )}
      </Section>

      <Section n={2} title={t("অনলাইন পেমেন্ট — BinGi-র মাধ্যমে", "Online payments — through BinGi")} hint={t("ওয়েবসাইট আর মার্কেটপ্লেসে গেস্ট SSLCommerz / EPS দিয়ে পে করে। টাকা আগে BinGi-তে আসে, আপনি চাইলে আপনার অ্যাকাউন্টে পাঠানো হয়।", "On your website and the marketplace guests pay through SSLCommerz / EPS. The money comes to BinGi first and is sent to you when you ask.")}>
      <div role="radiogroup" aria-label="BinGi Payments" className="grid gap-2.5">
        <Tile role="radio" on={p.bingi === "apply"} onClick={() => setP((x) => { x.bingi = "apply"; })} icon={<Wallet className="size-6" />} title={t("টাকা কোথায় পাবেন — এখনই দিন", "Where to send your money — add now")} sub={t("ব্যাংক বা bKash মার্চেন্ট", "Bank or bKash merchant")}>
          <div role="radiogroup" aria-label={t("সেটেলমেন্ট কোথায়", "Settle to")} className="flex flex-wrap gap-2">
            <Chip on={st.method === "bank"} onClick={() => setS("method", "bank")}>{t("ব্যাংক অ্যাকাউন্ট", "Bank account")}</Chip>
            <Chip on={st.method === "bkash"} onClick={() => setS("method", "bkash")}>{t("bKash মার্চেন্ট", "bKash merchant")}</Chip>
          </div>
          {st.method === "bank" ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <In id="st-holder" lab={t("অ্যাকাউন্টের নাম (ব্যবসার নামে)", "Account name (business)")} value={st.holder} set={(v) => setS("holder", v)} />
              <div><label htmlFor="st-bank" className={label}>{t("ব্যাংক", "Bank")}</label><select id="st-bank" value={st.bank} onChange={(e) => setS("bank", e.target.value)} className={field + " mt-1.5"}><option value="">{t("বাছাই করুন", "Choose")}</option>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
              <In id="st-acc" lab={t("অ্যাকাউন্ট নম্বর", "Account number")} value={st.acc} set={(v) => setS("acc", v.replace(/\D/g, ""))} mode="numeric" />
              <In id="st-branch" lab={t("শাখা", "Branch")} value={st.branch} set={(v) => setS("branch", v)} />
              <In id="st-routing" lab={t("রাউটিং নম্বর", "Routing number")} value={st.routing} set={(v) => setS("routing", v.replace(/\D/g, ""))} mode="numeric" hint={t("৯ সংখ্যা — চেক বই বা ব্যাংকের অ্যাপে আছে", "9 digits — on your cheque book or bank app")} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <In id="st-holder2" lab={t("মার্চেন্টের নাম", "Merchant name")} value={st.holder} set={(v) => setS("holder", v)} />
              <In id="st-wallet" lab={t("bKash মার্চেন্ট নম্বর", "bKash merchant number")} value={st.wallet} set={(v) => setS("wallet", v)} mode="tel" />
            </div>
          )}
          <p className="mt-3 text-[12.5px] text-[#4d5664]">{t("প্রোটোটাইপ: তথ্য শুধু এই ব্রাউজারে থাকে, কোথাও পাঠানো হয় না।", "Prototype: kept in this browser only, not sent anywhere.")}</p>
        </Tile>
        <Tile role="radio" on={p.bingi === "later"} onClick={() => setP((x) => { x.bingi = "later"; })} icon={<Clock className="size-6" />} title={t("পরে সেটআপ করবো", "Set up later")} sub={t("HMS → সেটিংস → গেস্ট পেমেন্ট থেকে পরে দেবেন", "Add it later in HMS → Settings → Guest payments")} />
      </div>
      </Section>
      </div>
    </Q>
  );
}

/** The four looks shown for this property (best fits first) — the first one is kept if the owner picks none. */
function themesFor(d: Draft) {
  const plan: PlanId = d.planPicked ? d.plan : recommend(d);
  const rank = (p: string) => PLAN_ORDER.indexOf(p as (typeof PLAN_ORDER)[number]);
  const old = hotelOf(d).propertyType;
  const fits = (x: (typeof MASTER_LIST)[number]) => x.bestFor.includes(old);
  return MASTER_LIST.filter((x) => rank(x.minPlan) <= rank(plan === "starter" ? "business" : plan)).sort((a, b) => Number(fits(b)) - Number(fits(a))).slice(0, 4);
}
function Website({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const old = hotelOf(d).propertyType;
  const fits = (x: (typeof MASTER_LIST)[number]) => x.bestFor.includes(old);
  const themes = themesFor(d);
  return (
    <Q title={t("ওয়েবসাইট ও অনলাইন বুকিং", "Website & online booking")} sub={t("আপনার রুম আর দাম দিয়ে সাজানো হবে। অনুমোদনের আগে কিছু পাবলিক হয় না।", "Filled with your rooms and prices. Nothing goes public before approval.")}>
      <div className="space-y-4">
      <Section n={1} title={t("ওয়েবসাইটের লুক", "Website look")} hint={t("আপনার property-র জন্য মানানসইগুলো আগে", "Best fits for your property first")}>
      <div role="radiogroup" aria-label={t("ওয়েবসাইটের লুক", "Website look")} className="grid gap-3 sm:grid-cols-2">
        {themes.map((x) => {
          const on = d.site.theme === x.id;
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => edit((y) => { y.site.theme = x.id; y.site.later = false; })}
              className={clsx("relative overflow-hidden rounded-xl border text-left transition-colors", on ? "border-[#ef6b62]" : "border-[#c6ccd4] hover:border-[#d5d8e0]")}>
              <Image src={`/themes/${x.id}.jpg`} alt="" width={520} height={260} className="aspect-[16/8] w-full object-cover object-top" />
              <span className="flex flex-wrap items-center gap-2 bg-white p-3"><span className="text-[15.5px] font-semibold">{x.name}</span>{fits(x) && <span className="rounded-full bg-[#e9f6ee] px-2 py-0.5 text-[11.5px] font-semibold text-[#1c6b3c]">{t("আপনার জন্য মানানসই", "Good fit")}</span>}</span>
              {on && <span className="onb-pop absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-[#b11c29] text-white shadow"><Check className="size-4" /></span>}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[13.5px] text-[#4d5664]">{t("কিছু লুক নির্দিষ্ট প্ল্যানে পাওয়া যায়।", "Some looks need a higher plan.")}</p>
      </Section>
      <Section n={2} title={t("গেস্টরা কোথায় পাবে", "Where guests can find you")} hint={t("সব বন্ধ রাখা নিরাপদ — যাচাই আর ছবি দেওয়ার পরে চালু করুন", "Safe to keep off — turn on after verification and photos")}>
        <div className="divide-y divide-[#e9edf2] rounded-xl border border-[#e3e7ec]">
          <SwitchRow icon={<Globe className="size-5" />} title={t("ওয়েবসাইট পাবলিক করুন", "Make my website public")} sub={t("রিভিউ করার পরে পাবলিশ হবে", "Published after you review it")} on={!!d.site.public} set={(v) => edit((y) => { y.site.public = v; })} />
          <SwitchRow icon={<CalendarCheck className="size-5" />} title={t("অনলাইন বুকিং নিন", "Accept online booking")} sub={t("প্রস্তুত হলে বুকিং রিকোয়েস্ট আসবে", "Booking requests when ready")} on={!!d.site.online} set={(v) => edit((y) => { y.site.online = v; })} />
          <SwitchRow icon={<Store className="size-5" />} title={t("BinGi মার্কেটপ্লেসে দেখান", "List me on the BinGi marketplace")} sub={t("BinGi রিভিউ করবে", "Reviewed by BinGi")} on={!!d.site.market} set={(v) => edit((y) => { y.site.market = v; })} />
        </div>
        <label className="mt-3 flex items-start gap-3 rounded-xl bg-[#f4f6f8] px-4 py-3 text-[14.5px]"><input type="checkbox" checked={!!d.site.reviewed} onChange={(e) => edit((y) => { y.site.reviewed = e.target.checked; })} className="mt-0.5 size-5 accent-[#b11c29]" /><span><b className="font-semibold">{t("আগের বুকিংগুলো দেখেছি", "I have reviewed existing stays")}</b><span className="block text-[13px] text-[#4d5664]">{t("চলমান রিজার্ভেশন আর বন্ধ রুম মিলিয়ে নিয়েছি", "Current reservations and blocked rooms are checked")}</span></span></label>
      </Section>
      </div>
    </Q>
  );
}

// ---------------- Part 6 ----------------
function Row({ k, v }: { k: string; v: string }) { return <div className="flex justify-between gap-3"><dt className="text-[#4d5664]">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>; }

function Verify({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const docs = [["nid", IdCard, "মালিকের NID (সামনে ও পেছনে)", "Owner NID (front & back)", true], ["trade", FileText, "ট্রেড লাইসেন্স", "Trade licence", true], ["tin", Receipt, "TIN সার্টিফিকেট", "TIN certificate", false]] as const;
  return (
    <Q title={t("কাগজপত্র", "Documents")} why={t("ওয়েবসাইট পাবলিক আর অনলাইন পেমেন্টের আগে লাগবে। এখন না দিলেও HMS চালাতে পারবেন।", "Needed before going public and online payment. You can use HMS meanwhile.")}>
      <div className="grid gap-3">
        {docs.map(([k, DocIcon, bn, en, req]) => (
          <label key={k} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border p-4 focus-within:ring-4 focus-within:ring-[#ef6b62]/15", d.verify[k] ? "border-[#bfe0cb] bg-[#f4fbf6]" : "border-[#c6ccd4] bg-white")}>
            <span className={clsx("grid size-10 place-items-center", d.verify[k] ? "text-[#1c7d45]" : "text-[#0f1720]")} aria-hidden>{d.verify[k] ? <CircleCheck className="size-6" /> : <DocIcon className="size-6" />}</span>
            <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">{t(bn, en)}{!req && <span className="font-normal text-[#4d5664]"> ({t("ঐচ্ছিক", "optional")})</span>}</span><span className="block truncate text-[13.5px] text-[#4d5664]">{d.verify[k] || t("ছবি বা PDF", "Photo or PDF")}</span></span>
            <span className="inline-flex items-center gap-1 text-[14.5px] font-semibold text-[#b11c29]"><FileUp className="size-4" />{d.verify[k] ? t("বদলান", "Replace") : t("আপলোড", "Upload")}</span>
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) edit((x) => { x.verify[k] = f.name; x.verify.later = false; }); }} />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#4d5664]">{t("প্রোটোটাইপ: শুধু ফাইলের নাম রাখা হয়, কিছু আপলোড হয় না।", "Prototype: only the file name is kept.")}</p>
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
      <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-[#fff5f4] to-[#e9edf2] p-4">
        <Ring v={sc} lang={lang} />
        <div className="min-w-0">
          <p className="truncate text-[18px] font-semibold">{d.name || t("নাম নেই", "Untitled")}</p>
          <p className="text-[14px] text-[#4d5664]">{num(counts.total, lang)} {t("টা রুম", "rooms")} · {d.city || "—"} · {d.planPicked ? PLANS[d.plan].label : "—"}{q ? ` · ৳${num(money(q.monthly), lang)}/${t("মাস", "mo")}` : ""}</p>
        </div>
      </div>
      {cs.filter((c) => c.level === "required").every((c) => c.ok) && <p className="mt-4 flex items-center gap-2 rounded-xl border border-[#e3f1e7] bg-[#f6fbf7] px-3 py-2.5 text-[14.5px] font-medium"><span className="grid size-6 place-items-center rounded-full bg-[#1c7d45] text-white"><Check className="size-3.5" /></span>{t("জমা দেওয়ার মতো সব তৈরি", "Everything needed to submit is done")}</p>}
      {cs.some((c) => !c.ok) && <h3 className="mt-5 text-[15px] font-semibold">{t("চাইলে এখন করুন — পরেও করা যাবে", "Optional — now or later")}</h3>}
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {cs.filter((c) => !c.ok).map((c) => (
          <li key={c.id} className={clsx("flex items-center gap-2.5 rounded-xl border px-3 py-2.5", c.ok ? "border-[#e3f1e7] bg-[#f6fbf7]" : c.level === "required" ? "border-[#f6cfcb] bg-[#fff6f5]" : "border-[#c6ccd4] bg-white")}>
            <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full", c.ok ? "bg-[#1c7d45] text-white" : c.level === "required" ? "bg-[#b11c29] text-white" : "bg-[#e3e7ec] text-[#4d5664]")}>{c.ok ? <Check className="size-3.5" /> : c.level === "required" ? <CircleAlert className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}</span>
            <span className="min-w-0 flex-1 text-[14.5px] font-medium">{t(c.bn, c.label)}{c.level !== "required" && !c.ok && <span className="text-[12.5px] text-[#4d5664]"> · {t("পরে করা যাবে", "can wait")}</span>}</span>
            {!c.ok && <button onClick={() => go(c.step)} className="text-[13.5px] font-semibold text-[#b11c29]">{t("ঠিক করুন", "Fix")}</button>}
          </li>
        ))}
      </ul>
      <details className="mt-4 rounded-xl border border-[#e3e7ec] bg-white px-3 py-2.5"><summary className="cursor-pointer text-[14px] font-semibold">{t(`সব দেখুন (${num(cs.filter((c) => c.ok).length, lang)}টা হয়েছে)`, `See everything (${cs.filter((c) => c.ok).length} done)`)}</summary>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">{cs.filter((c) => c.ok).map((c) => <li key={c.id} className="flex items-center gap-2 text-[14px]"><Check className="size-4 text-[#1c7d45]" aria-hidden />{t(c.bn, c.label)}</li>)}</ul>
      </details>
    </Q>
  );
}
function Ring({ v, lang }: { v: number; lang: "bn" | "en" }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" role="img" aria-label={`${v}%`} className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#fff" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={v >= 80 ? "#1c7d45" : "#b11c29"} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 500ms ease" }} />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#0f1720">{num(v, lang)}%</text>
    </svg>
  );
}

/** Check that draws in + one brand-coloured confetti burst. Runs once per property (sessionStorage); reduced motion: static check. */
function Celebrate({ id }: { id: string }) {
  const [burst] = useState(() => { try { const k = `bingi-onb-cheered-${id}`; if (sessionStorage.getItem(k)) return false; sessionStorage.setItem(k, "1"); return true; } catch { return true; } });
  const colors = ["#b11c29", "#e5484d", "#f5a524", "#1c7d45", "#0f1720", "#fbd9d5"];
  const bits = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + (i % 3) * 0.3, r = 90 + (i * 37) % 80;
    return { dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r * 0.8 + 60), rot: (i * 47) % 360, c: colors[i % colors.length], w: i % 3 === 0 ? 10 : 7, delay: (i % 5) * 30 };
  });
  return (
    <span className="relative mx-auto block size-20">
      {burst && bits.map((b, i) => <span key={i} aria-hidden className="onb-burst pointer-events-none absolute left-1/2 top-1/2 block rounded-[2px]" style={{ width: b.w, height: b.w * 0.55, marginLeft: -b.w / 2, background: b.c, animationDelay: `${180 + b.delay}ms`, ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, ["--r" as string]: `${b.rot}deg` }} />)}
      <span className="onb-ring absolute inset-0 grid place-items-center rounded-full bg-[#e9f7ef] ring-8 ring-[#e9f7ef]/50">
        <svg viewBox="0 0 40 40" className="size-11" aria-hidden><circle cx="20" cy="20" r="18" fill="#1c7d45" /><path className="onb-draw" d="M12 20.5l5.5 5.5L28.5 15" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    </span>
  );
}

/** What a professional website still needs. "Go public" stays locked until the required ones are done and BinGi approves. */
function WebsiteReady({ d, onEdit }: { d: Draft; onEdit: (s: StepId) => void }) {
  const { t, lang } = useL();
  const router = useRouter();
  // Each row opens the page where it is fixed.
  const at = (s: StepId) => () => onEdit(s);
  const hms = (href: string) => () => { setProperty(d.slug); router.push(href); };
  const nid = !!(d.docs?.nidFront && d.docs?.nidBack);
  const items = [
    { ok: !!d.name.trim(), bn: "নাম ও ঠিকানা", en: "Name and address", need: true, go: at("1.3") },
    { ok: !!d.cover, bn: "কভার ছবি", en: "Cover photo", need: true, go: at("1.2") },
    { ok: !!d.tagline?.trim(), bn: "এক লাইনে পরিচিতি", en: "One-line introduction", need: true, go: at("1.2") },
    { ok: false, bn: "প্রতিটা রুম টাইপে অন্তত ৫টা ছবি", en: "At least 5 photos per room type", need: true, go: hms("/hms/rooms"), where: ["HMS → রুম", "HMS → Rooms"] as [string, string] },
    { ok: nid, bn: "কাগজপত্র (NID) জমা", en: "Documents (NID) sent", need: true, go: at("2.1"), note: !nid && d.docs?.later ? ["পরে দেবেন বলেছেন · এখনই দিন", "You chose later · send now"] as [string, string] : undefined },
    { ok: (d.nearby ?? []).some((x) => x.name.trim()), bn: "আশপাশের জায়গা", en: "Nearby places", need: false, go: at("1.3") },
    { ok: !!(d.social?.facebook || d.social?.instagram), bn: "Facebook / Instagram লিংক", en: "Facebook / Instagram link", need: false, go: at("1.5") },
  ];
  const done = items.filter((x) => x.ok).length;
  return (
    <section className="mt-4 rounded-xl border border-[#e3e7ec] bg-white p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-semibold">{t("ওয়েবসাইট সাজান", "Finish your website")}</h2><span className="text-[13px] font-semibold tabular-nums text-[#4d5664]">{num(done, lang)}/{num(items.length, lang)}</span></div>
      <p className="mt-1 text-[13.5px] text-[#4d5664]">{t("দরকারি সবগুলো হলে আর BinGi অনুমোদন দিলে ওয়েবসাইট পাবলিক করা যাবে।", "You can make the website public once the required items are done and BinGi approves.")}</p>
      <ul className="mt-3 space-y-2">
        {items.map((x) => (
          <li key={x.en}>
            <button onClick={x.go} className="group flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-[14.5px] hover:bg-[#f4f6f8]">
              {x.ok ? <CircleCheck className="size-[18px] shrink-0 text-[#1c7d45]" /> : <span className="size-[18px] shrink-0 rounded-full border-2 border-[#c6ccd4]" aria-hidden />}
              <span className="min-w-0"><span className={x.ok ? "text-[#4d5664] line-through decoration-[#c6ccd4]" : ""}>{t(x.bn, x.en)}</span>
                {x.where && <span className="ml-1.5 text-[12.5px] text-[#5b6270]">· {t(...x.where)}</span>}
                {x.note && <span className="block text-[12.5px] font-medium text-[#8a5300]">{t(...x.note)}</span>}</span>
              <span className="ml-auto shrink-0 text-[12px] text-[#5b6270]">{x.need ? t("দরকারি", "Required") : t("ঐচ্ছিক", "Optional")}</span>
              {!x.ok && <ChevronRight className="size-4 shrink-0 text-[#b11c29] opacity-60 group-hover:opacity-100" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
      <button disabled className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#e9edf2] text-[14px] font-semibold text-[#5b6270]"><Lock className="size-4" />{t("ওয়েবসাইট পাবলিক করুন — এখনো বন্ধ", "Make website public — locked for now")}</button>
    </section>
  );
}
function Done({ d, onEdit }: { d: Draft; onEdit: (s: StepId) => void }) {
  const { t, lang } = useL();
  const router = useRouter();
  const steps = [
    { icon: ShieldCheck, bn: "BinGi যাচাই করবে", en: "BinGi reviews your setup", subBn: "সাধারণত ১ কার্যদিবসের মধ্যে। কিছু লাগলে ফোন করবে।", subEn: "Usually within 1 working day. We call if anything is needed.", now: true },
    { icon: Globe, bn: "ওয়েবসাইট তৈরি হবে", en: "Your website is created", subBn: "বাছাই করা থিমে, আপনার রুম আর দাম দিয়ে।", subEn: "In the theme you chose, with your rooms and prices." },
    { icon: CalendarCheck, bn: "অনলাইন বুকিং চালু", en: "Online booking opens", subBn: "ওয়েবসাইট ও মার্কেটপ্লেস থেকে বুকিং আসবে।", subEn: "Bookings come from your website and the marketplace." },
  ];
  return (
    <Canvas>
      <Header title={d.name} />
      <main className="mx-auto max-w-[620px] px-4 py-12">
        <div className="text-center">
          <Celebrate id={d.id} />
          <h1 className="onb-rise mt-5 text-[28px] font-semibold leading-tight" style={{ animationDelay: "380ms" }}>{t("অভিনন্দন! সেটআপ জমা হয়েছে 🎉", "Congratulations! Setup submitted 🎉")}</h1>
          <p className="mx-auto mt-3 max-w-[460px] text-[16px] leading-relaxed text-[#4d5664]">{t(`${d.name || "আপনার property"} এখন সেটআপ মোডে। BinGi যাচাই করছে — এর মধ্যে HMS ব্যবহার শুরু করুন।`, `${d.name || "Your property"} is in setup mode. BinGi is reviewing — start using HMS meanwhile.`)}</p>
        </div>
        <section className="onb-rise mt-9 rounded-xl border border-[#e3e7ec] bg-white p-5" style={{ animationDelay: "520ms" }}>
          <h2 className="text-[16px] font-semibold">{t("এরপর কী হবে", "What happens next")}</h2>
          <ol className="mt-4 space-y-4">
            {steps.map((s, i) => (
              <li key={s.en} className="flex gap-3">
                <span className={clsx("grid size-9 shrink-0 place-items-center rounded-lg", s.now ? "bg-[#0f1720] text-white" : "bg-[#e9edf2] text-[#4d5664]")}><s.icon className="size-[18px]" /></span>
                <span className="min-w-0"><span className="block text-[15px] font-semibold">{num(i + 1, lang)}. {t(s.bn, s.en)}{s.now && <span className="ml-2 rounded-md bg-[#fff4e5] px-1.5 py-0.5 text-[11.5px] font-semibold text-[#8a5300]">{t("এখন চলছে", "In progress")}</span>}</span><span className="text-[14px] text-[#4d5664]">{t(s.subBn, s.subEn)}</span></span>
              </li>
            ))}
          </ol>
        </section>
        <WebsiteReady d={d} onEdit={onEdit} />
        <section className="mt-4 rounded-xl border border-[#e3e7ec] bg-white p-5">
          <h2 className="text-[16px] font-semibold">{t("ততক্ষণে যা করতে পারেন", "Meanwhile you can")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/hms/rooms" className="flex items-center gap-3 rounded-lg border border-[#e3e7ec] px-3.5 py-3 text-[14.5px] font-medium hover:border-[#0f1720]"><ImageIcon className="size-5 text-[#4d5664]" />{t("রুমের ছবি দিন", "Add room photos")}</Link>
            <Link href="/hms/staff" className="flex items-center gap-3 rounded-lg border border-[#e3e7ec] px-3.5 py-3 text-[14.5px] font-medium hover:border-[#0f1720]"><UsersRound className="size-5 text-[#4d5664]" />{t("টিম যোগ করুন", "Add your team")}</Link>
          </div>
        </section>
        <div className="mt-8 flex flex-wrap justify-center gap-2"><Ghost onClick={() => router.push("/onboarding/status")}>{t("স্ট্যাটাস দেখুন", "View status")}</Ghost><Primary onClick={() => router.push("/hms")}>{t("ড্যাশবোর্ডে যান", "Go to dashboard")}</Primary></div>
      </main>
    </Canvas>
  );
}
