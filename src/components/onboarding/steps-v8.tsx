"use client";
// Onboarding v8 — steps that follow the live HMS fields one to one (21 Nov 2026 live review):
// 1.5 Contact · 2.1 Documents · 2.3 Setup help · 2.4 Start · 2.5 Summary.
import clsx from "clsx";
import { useState } from "react";
import { BadgeCheck, Camera, CircleCheck, ClipboardCheck, CreditCard, FileText, FileUp, Headphones, IdCard, MapPinned, Receipt, Rocket, Wrench } from "lucide-react";
import { PLANS, TRIAL_DAYS, num, quote, recommend, useL, useOnboarding, type Draft, type StepId } from "@/lib/onboarding/store";
import { money } from "../hms/rooms/parts";
import { Chip, Q, Section, Tile, field, label } from "./shell";

// ---------- 1.5 Contact ----------
const NATIONS: [string, string][] = [["Bangladeshi", "বাংলাদেশি"], ["Indian", "ভারতীয়"], ["Other", "অন্য"]];
export function Contact({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const [more, setMore] = useState(!!(d.contact.business || d.contact.year || d.contact.stars || d.contact.website || d.contact.about));
  const c = d.contact;
  const set = (p: Partial<Draft["contact"]>) => edit((x) => { x.contact = { ...x.contact, ...p }; });
  return (
    <Q title={t("যোগাযোগ", "Contact")} sub={t("গেস্ট আর BinGi এই নম্বর ও ইমেইলে যোগাযোগ করবে।", "Guests and BinGi reach you on this number and email.")}>
      <div className="space-y-4">
      <Section n={1} title={t("যোগাযোগের তথ্য", "Contact details")} hint={t("মোবাইল আগেই যাচাই করা", "Your mobile is already verified")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="c-owner" className={label}>{t("যোগাযোগের নাম", "Contact name")} <span className="font-normal text-[#4d5664]">({t("ঐচ্ছিক", "optional")})</span></label><input id="c-owner" value={c.owner} onChange={(e) => set({ owner: e.target.value })} autoComplete="name" className={field + " mt-1.5"} /></div>
        <div>
          <label htmlFor="c-phone" className={label}>{t("মোবাইল", "Mobile")}</label>
          <div className="relative mt-1.5"><input id="c-phone" inputMode="tel" value={d.phone} onChange={(e) => edit((x) => { x.phone = e.target.value; })} className={field + " pr-24"} />
            <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-[#e8f4ec] px-2 py-0.5 text-[12px] font-semibold text-[#1c6b3c]"><BadgeCheck className="size-3.5" />{t("যাচাই হয়েছে", "Verified")}</span></div>
        </div>
        <div><label htmlFor="c-email" className={label}>{t("Property-র ইমেইল", "Property email")} <span className="font-normal text-[#4d5664]">({t("ঐচ্ছিক", "optional")})</span></label><input id="c-email" type="email" value={c.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" placeholder="hello@yourhotel.com" className={field + " mt-1.5"} /></div>
        <div><span className={label}>{t("জাতীয়তা", "Nationality")}</span><div className="mt-1.5 flex flex-wrap gap-2">{NATIONS.map(([en, bn]) => <Chip key={en} on={c.nationality === en} onClick={() => set({ nationality: en })}>{t(bn, en)}</Chip>)}</div></div>
      </div>
      </Section>
      <Section n={2} title={t("ব্যবসার তথ্য", "Business details")} hint={t("সব ঐচ্ছিক — ব্যবসার নাম, স্টার, ওয়েবসাইট", "All optional — business name, stars, website")} action={<button onClick={() => setMore((m) => !m)} aria-expanded={more} className="h-9 rounded-full px-3 text-[14px] font-semibold text-[#b11c29] hover:bg-[#fff4f3]">{more ? t("লুকান", "Hide") : t("যোগ করুন", "Add")}</button>}>
        {more ? (
          <div className="onb-in grid gap-4 sm:grid-cols-2">
            <div><label htmlFor="c-biz" className={label}>{t("ব্যবসার নাম", "Business name")}</label><input id="c-biz" value={c.business} onChange={(e) => set({ business: e.target.value })} placeholder={t("ট্রেড লাইসেন্সের নাম", "As on the trade licence")} className={field + " mt-1.5"} /></div>
            <div><label htmlFor="c-year" className={label}>{t("চালু হয়েছে কোন সালে", "Year established")}</label><input id="c-year" inputMode="numeric" maxLength={4} value={c.year} onChange={(e) => set({ year: e.target.value.replace(/\D/g, "") })} placeholder="2015" className={field + " mt-1.5"} /></div>
            <div><span className={label}>{t("স্টার রেটিং", "Star rating")}</span><div className="mt-1.5 flex flex-wrap gap-2"><Chip on={!c.stars} onClick={() => set({ stars: 0 })}>{t("নেই", "None")}</Chip>{[1, 2, 3, 4, 5].map((n) => <Chip key={n} on={c.stars === n} onClick={() => set({ stars: n })}>{num(n, lang)}★</Chip>)}</div></div>
            <div><label htmlFor="c-web" className={label}>{t("ওয়েবসাইট", "Website")}</label><input id="c-web" value={c.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" className={field + " mt-1.5"} /></div>
            <div className="sm:col-span-2"><label htmlFor="c-about" className={label}>{t("Property সম্পর্কে", "About the property")}</label><textarea id="c-about" rows={3} maxLength={500} value={c.about} onChange={(e) => set({ about: e.target.value })} className={field + " mt-1.5 h-auto py-2.5"} /></div>
          </div>
        ) : <p className="text-[14px] text-[#4d5664]">{c.business || c.website ? [c.business, c.website].filter(Boolean).join(" · ") : t("পরে HMS-এর সেটিংসেও দেওয়া যায়।", "You can also add these later in HMS settings.")}</p>}
      </Section>
      </div>
    </Q>
  );
}

// ---------- 2.1 Documents (live list) ----------
const DOCS: { k: keyof Omit<Draft["docs"], "accept" | "later">; icon: typeof IdCard; bn: string; en: string; req: boolean }[] = [
  { k: "nidFront", icon: IdCard, bn: "NID — সামনের দিক", en: "NID — front", req: true },
  { k: "nidBack", icon: IdCard, bn: "NID — পেছনের দিক", en: "NID — back", req: true },
  { k: "selfie", icon: Camera, bn: "NID হাতে সেলফি", en: "Selfie with NID", req: false },
  { k: "trade", icon: FileText, bn: "ট্রেড লাইসেন্স", en: "Trade licence", req: false },
  { k: "reg", icon: ClipboardCheck, bn: "রেজিস্ট্রেশন সার্টিফিকেট", en: "Registration certificate", req: false },
  { k: "tin", icon: Receipt, bn: "TIN / VAT", en: "TIN / VAT", req: false },
];
const ACCEPT: [string, string][] = [
  ["দেওয়া তথ্য সত্য", "The information I gave is true"],
  ["আমি এই property-র মালিক বা পরিচালনা করি", "I own or manage this property"],
  ["BinGi-র শর্ত ও গোপনীয়তা নীতিতে রাজি", "I agree to BinGi's Terms and Privacy Policy"],
];
export function Documents({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t } = useL();
  const doc = d.docs;
  const row = (x: (typeof DOCS)[number]) => {
    const v = doc[x.k];
    const I = v ? CircleCheck : x.icon;
    return (
      <label key={x.k} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 focus-within:ring-4 focus-within:ring-[#0f1720]/10", v ? "border-[#bfe0cb] bg-[#f4fbf6]" : "border-[#c6ccd4] bg-white hover:border-[#9aa0ac]")}>
        <I className={clsx("size-6 shrink-0", v ? "text-[#1c7d45]" : "text-[#0f1720]")} aria-hidden />
        <span className="min-w-0 flex-1"><span className="block text-[15.5px] font-semibold">{t(x.bn, x.en)}</span><span className="block truncate text-[13px] text-[#4d5664]">{v || t("ছবি বা PDF", "Photo or PDF")}</span></span>
        <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-[#b11c29]"><FileUp className="size-4" />{v ? t("বদলান", "Replace") : t("আপলোড", "Upload")}</span>
        <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) edit((y) => { y.docs[x.k] = f.name; y.docs.later = false; }); }} />
      </label>
    );
  };
  return (
    <Q title={t("কাগজপত্র", "Documents")} sub={t("NID দুই দিক লাগবে। বাকিগুলো থাকলে দিন। এখন না দিলেও HMS চালাতে পারবেন।", "NID front and back are needed. Add the rest if you have them. You can use HMS meanwhile.")}
      why={t("ওয়েবসাইট পাবলিক, অনলাইন বুকিং আর পেমেন্টের আগে BinGi যাচাই করে।", "BinGi verifies these before your website, online booking and payments go live.")}>
      <div className="space-y-4">
        <Section n={1} title={t("জাতীয় পরিচয়পত্র", "National ID")} hint={t("দুই দিকের ছবি লাগবে", "Both sides are needed")}><div className="grid gap-2.5 sm:grid-cols-2">{DOCS.filter((x) => x.req).map(row)}</div></Section>
        <Section n={2} title={t("ব্যবসার কাগজ", "Business papers")} hint={t("ঐচ্ছিক — থাকলে দিন, যাচাই দ্রুত হয়", "Optional — speeds up verification")}><div className="grid gap-2.5 sm:grid-cols-2">{DOCS.filter((x) => !x.req).map(row)}</div></Section>
        <Section n={3} title={t("নিশ্চিত করুন", "Confirm")} hint={t("জমা দেওয়ার আগে তিনটাই লাগবে", "All three are needed before you submit")}>
          <div className="space-y-2.5">
            {ACCEPT.map(([bn, en], i) => (
              <label key={en} className="flex items-start gap-3 text-[14.5px]"><input type="checkbox" checked={doc.accept[i]} onChange={(e) => edit((y) => { y.docs.accept[i] = e.target.checked; })} className="mt-0.5 size-5 shrink-0 accent-[#b11c29]" />{t(bn, en)}</label>
            ))}
          </div>
        </Section>
      </div>
      <p className="mt-3 text-[12.5px] text-[#4d5664]">{t("প্রোটোটাইপ: শুধু ফাইলের নাম রাখা হয়, কিছু আপলোড হয় না।", "Prototype: only the file name is kept; nothing is uploaded.")}</p>
    </Q>
  );
}

// ---------- 2.3 Setup help (live prices) ----------
const HELP = [
  { id: "self", icon: Wrench, bn: "নিজে করবো", en: "I'll do it myself", subBn: "প্ল্যানের সাথে · ভিডিও ও চ্যাট সাহায্য", subEn: "Included · videos and chat help", price: 0 },
  { id: "remote", icon: Headphones, bn: "অনলাইনে সাহায্য", en: "Remote help", subBn: "৩টা সেশন, BinGi টিম স্ক্রিন শেয়ার করে", subEn: "3 sessions with the BinGi team", price: 10000 },
  { id: "onsite", icon: MapPinned, bn: "BinGi টিম আসবে", en: "On-site setup", subBn: "২ দিন, আপনার property-তে", subEn: "2 days at your property", price: 22000 },
] as const;
export function SetupHelp({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  return (
    <Q title={t("সেটআপে সাহায্য", "Setup help")} sub={t("বেশিরভাগ property নিজেই সেটআপ করে। চাইলে আমরা করে দিই।", "Most properties set up on their own. We can do it for you.")}>
      <div role="radiogroup" aria-label={t("সেটআপে সাহায্য", "Setup help")} className="grid gap-2.5">
        {HELP.map((h) => <Tile key={h.id} role="radio" big on={d.help === h.id} onClick={() => edit((x) => { x.help = h.id; })} icon={<h.icon className="size-6" />} title={t(h.bn, h.en)} sub={t(h.subBn, h.subEn)} badge={h.price ? `৳${num(money(h.price), lang)}` : t("ফ্রি", "Free")} />)}
      </div>
      <p className="mt-3 text-[12.5px] text-[#4d5664]">{t("দাম এখনকার HMS অনুযায়ী (একবার)।", "Prices as in the current HMS (one time).")}</p>
    </Q>
  );
}

// ---------- 2.4 Start ----------
export function Start({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const opts = [
    { id: "setup", icon: Wrench, bn: "আগে সেটআপ শেষ করি", en: "Set up first, start later", subBn: "এখন কোনো টাকা লাগবে না। সব তৈরি হলে শুরু করবেন।", subEn: "Nothing to pay now. Start when everything is ready." },
    { id: "trial", icon: Rocket, bn: `${num(TRIAL_DAYS, lang)} দিন ফ্রি ট্রায়াল`, en: `${TRIAL_DAYS}-day free trial`, subBn: "জমা দেওয়ার পর থেকে আপনার প্ল্যানের টুলস দিয়ে", subEn: "From submit, with your plan's tools" },
    { id: "subscribe", icon: CreditCard, bn: "এখনই সাবস্ক্রাইব", en: "Subscribe now", subBn: "জমা দেওয়ার পর পেমেন্ট পেজে যাবেন", subEn: "You go to payment after submitting" },
  ] as const;
  return (
    <Q title={t("কবে শুরু করবেন?", "When do you want to start?")} why={t("ট্রায়ালে শুধু আপনার বাছাই করা প্ল্যানের টুলস থাকে।", "The trial gives only your chosen plan's tools.")}>
      <div role="radiogroup" aria-label={t("কবে শুরু", "Start")} className="grid gap-2.5">
        {opts.map((o) => <Tile key={o.id} role="radio" big on={d.start === o.id} onClick={() => edit((x) => { x.start = o.id; })} icon={<o.icon className="size-6" />} title={t(o.bn, o.en)} sub={t(o.subBn, o.subEn)} />)}
      </div>
      {d.start === "subscribe" && <p className="mt-3 rounded-xl bg-[#fdf6e7] px-3 py-2 text-[13.5px] text-[#7a4a0b]">{t("প্রোটোটাইপ: পেমেন্ট পেজ নেই, কিছু চার্জ হয় না।", "Prototype: no payment page; nothing is charged.")}</p>}
    </Q>
  );
}

// ---------- 2.5 Summary ----------
export function Summary({ d, units, go }: { d: Draft; units: number; go: (s: StepId) => void }) {
  const { t, lang } = useL();
  const plan = d.planPicked ? d.plan : recommend(d);
  const q = quote(plan, units || d.units, d.cycle);
  const n = (v: number) => num(money(v), lang);
  const help = HELP.find((h) => h.id === d.help)!;
  const docs = d.docs.nidFront && d.docs.nidBack;
  const rows: [string, string, StepId][] = [
    [t("কাগজপত্র", "Documents"), docs ? t("NID দেওয়া হয়েছে", "NID added") : t("পরে দেবেন", "Later"), "2.1"],
    [t("প্ল্যান", "Plan"), `${PLANS[plan].label} · ${d.cycle === 1 ? t("মাসিক", "monthly") : t(`${num(d.cycle, lang)} মাস`, `${d.cycle} months`)}`, "2.2"],
    [t("রুম", "Rooms"), t(`${num(q.billed, lang)}টা রুম ধরে`, `${q.billed} rooms`), "2.2"],
    [t("সেটআপে সাহায্য", "Setup help"), `${t(help.bn, help.en)}${help.price ? ` · ৳${n(help.price)}` : ""}`, "2.3"],
    [t("শুরু", "Start"), d.start === "setup" ? t("আগে সেটআপ", "Set up first") : d.start === "trial" ? t("ফ্রি ট্রায়াল", "Free trial") : t("এখনই সাবস্ক্রাইব", "Subscribe now"), "2.4"],
  ];
  return (
    <Q title={t("সারসংক্ষেপ", "Summary")}>
      <ul className="divide-y divide-[#e3e7ec] rounded-xl border border-[#e3e7ec] bg-white">
        {rows.map(([k, v, s]) => <li key={k} className="flex items-center gap-3 px-4 py-3"><span className="w-[130px] shrink-0 text-[14px] text-[#4d5664]">{k}</span><span className="min-w-0 flex-1 text-[15px] font-semibold">{v}</span><button onClick={() => go(s)} aria-label={`${t("বদলান", "Change")} — ${k}`} className="text-[13.5px] font-semibold text-[#b11c29]">{t("বদলান", "Change")}</button></li>)}
      </ul>
      <div className="mt-4 rounded-xl bg-[#e9edf2] p-4 text-[14.5px]">
        <div className="flex justify-between"><span>{t("মাসিক", "Monthly")}</span><b className="tabular-nums">৳{n(q.monthly)}</b></div>
        <div className="mt-1 flex justify-between"><span>{t("অ্যাক্টিভেশন (একবার)", "Activation (one time)")}</span><b className="tabular-nums">৳{n(q.activation)}</b></div>
        {help.price > 0 && <div className="mt-1 flex justify-between"><span>{t("সেটআপে সাহায্য (একবার)", "Setup help (one time)")}</span><b className="tabular-nums">৳{n(help.price)}</b></div>}
        <p className="mt-2 text-[12.5px] text-[#4d5664]">{t("আসল বিল রুম অংশে যোগ করা রুম ধরে। এখন কিছু চার্জ হয় না।", "The real bill follows the rooms you add. Nothing is charged now.")}</p>
      </div>
    </Q>
  );
}
