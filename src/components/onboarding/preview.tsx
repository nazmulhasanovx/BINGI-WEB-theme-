"use client";
// Right column (desktop ≥1280): how guests will see the listing, filled live from the answers, plus a tip for the current step.
// It is a sample card: nothing is published until BinGi approves the property.
import { BedDouble, Clock, ImageIcon, Lightbulb, MapPin, ShieldCheck, Wallet } from "lucide-react";
import type { Category } from "@/lib/rooms/store";
import { num, stepOf, useL, type Draft, type StepId } from "@/lib/onboarding/store";
import { TYPE_META } from "./types";

const POLICY: Record<string, [string, string]> = { flexible: ["নমনীয় বাতিল", "Flexible cancellation"], moderate: ["মাঝারি বাতিল", "Moderate cancellation"], strict: ["কড়া বাতিল", "Strict cancellation"] };

const TIP: Partial<Record<StepId, [string, string]>> = {
  "1.1": ["ধরন একবারই বাছবেন — রুম, তলা, নম্বর সব এখান থেকে সাজানো হয়।", "You pick the type once — rooms, floors and numbers are set up from it."],
  "1.2": ["গেস্টরা যে নাম চেনে সেটাই দিন। কভার ছবি আর এক লাইন দিলে ওয়েবসাইট প্রথম দিনেই সাজানো থাকে।", "Use the name guests know. A cover photo and one line make your website look finished from day one."],
  "1.3": ["সঠিক পিন দিলে গেস্ট ম্যাপে সহজে খুঁজে পায়।", "An exact pin helps guests find you on the map."],
  "1.4": ["রেস্টুরেন্ট/বার বাছলে রেস্টুরেন্ট টুল আপনা-আপনি চালু হবে।", "Picking Restaurant/Bar turns on the restaurant tool for you."],
  "1.5": ["বুকিং কনফার্মেশনে এই নম্বর আর ইমেইল যায়।", "Booking confirmations show this number and email."],
  "2.1": ["কাগজ এখন না থাকলে পরে দিন। যাচাই শেষ হলে অনলাইন বুকিং খোলে।", "No papers now? Add them later. Online booking opens after verification."],
  "2.3": ["বেশিরভাগ property নিজেই ১০ মিনিটে সেটআপ করে।", "Most properties finish on their own in about 10 minutes."],
  "2.4": ["আগে সেটআপ করলে এখন কোনো টাকা লাগে না।", "Setting up first costs nothing now."],
  "3.1": ["তলা আর জায়গা ঠিক থাকলে রুম নম্বর আপনা-আপনি তৈরি হয়।", "With the right floors and zones, room numbers are made for you."],
  "3.2": ["দাম পরে HMS-এর রেট ক্যালেন্ডারে দিন অনুযায়ী বদলানো যায়।", "You can change prices by date later in the HMS rates calendar."],
  "4.1": ["চেক-ইন/আউটের সময় পরে ড্যাশবোর্ড থেকে বদলানো যায়।", "You can change check-in/out times later in the dashboard."],
  "4.2": ["যা চালান না বন্ধ রাখুন — মেনু ছোট থাকবে। পরে যেকোনো সময় চালু করা যায়।", "Turn off what you don't run — a shorter menu. Turn on anytime."],
  "4.3": ["টিম এখনই না দিলেও চলবে — ড্যাশবোর্ড থেকে পরে দাওয়াত দিতে পারবেন।", "You can invite your team later from the dashboard."],
  "5.1": ["নগদ সবসময় চালু। অনলাইন পেমেন্ট BinGi যাচাইয়ের পর চালু হয়।", "Cash is always on. Online payments start after BinGi verifies you."],
  "5.2": ["এখান থেকে কিছু পাবলিক হয় না — পরে HMS থেকে পাবলিশ করবেন।", "Nothing goes public here — you publish later from HMS."],
};

/** Accent per free theme — only for this preview; the real colours come from the theme. */
const ACCENT: Record<string, string> = { nest: "#9a5b34", cottage: "#56713f", bunk: "#2f6fb0", city: "#1f2937", villa: "#8a6a3b", flat: "#475569", escape: "#0f766e", grand: "#7c2d3a" };

/** Right column: a mini website that fills in as the owner answers. A sample only — nothing is published here. */
export function GuestPreview({ d, cats, units }: { d: Draft; cats: Category[]; units: number }) {
  const { t, lang } = useL();
  const type = TYPE_META.find((x) => x.slug === d.propertyType);
  const priced = cats.filter((c) => c.baseRate > 0);
  const from = priced.length ? Math.min(...priced.map((c) => c.baseRate)) : 0;
  const money = (v: number) => `৳${num(v.toLocaleString("en-IN"), lang)}`;
  const place = [d.area, d.city].filter(Boolean).join(", ");
  const pays = [d.pay.cash && t("নগদ", "Cash"), d.pay.bkash && "bKash", d.pay.nagad && "Nagad", d.pay.bank && t("ব্যাংক", "Bank")].filter(Boolean).join(" · ");
  const tip = TIP[stepOf(d.step)];
  const TypeIcon = type?.icon ?? BedDouble;
  const theme = d.site.theme || "nest";
  const accent = ACCENT[theme] ?? "#b11c29";
  const near = (d.nearby ?? []).filter((x) => x.name.trim());
  const step = stepOf(d.step);
  const ring = (ids: StepId[]) => (ids.includes(step) ? "rounded-lg ring-2 ring-inset ring-[#b11c29]/45 p-1 -m-1" : "");
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-[#4d5664]">{t("আপনার ওয়েবসাইট", "Your website")} <span className="font-normal">· {t("নমুনা, পাবলিক নয়", "sample, not public")}</span></p>
      <div className="overflow-hidden rounded-xl border border-[#e3e7ec] bg-white shadow-[0_8px_24px_-12px_rgb(15_23_32/0.18)]">
        <div className="flex items-center gap-1.5 border-b border-[#eef0f3] bg-[#f6f7f9] px-3 py-2" aria-hidden>
          <span className="size-2 rounded-full bg-[#e5484d]/70" /><span className="size-2 rounded-full bg-[#f5a524]/70" /><span className="size-2 rounded-full bg-[#30a46c]/70" />
          <span className="ml-2 truncate rounded-md bg-white px-2 py-0.5 text-[11px] text-[#5b6270] ring-1 ring-[#e3e7ec]">{t("ওয়েবসাইটের ঠিকানা পরে ঠিক হবে", "Web address is set later")}</span>
        </div>
        <div className={"relative aspect-[16/9] " + ring(["1.1", "1.2"])} style={d.cover ? undefined : { background: `linear-gradient(135deg, ${accent}, ${accent}cc 55%, #0f1720)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {d.cover && <img src={d.cover} alt="" className="absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 text-[10.5px] font-semibold text-white/90">
            <span className="truncate">{d.name || t("আপনার নাম", "Your name")}</span>
            <span className="flex gap-2"><span>{t("রুম", "Rooms")}</span><span>{t("যোগাযোগ", "Contact")}</span></span>
          </div>
          {!d.cover && <span className="absolute right-3 top-8 flex items-center gap-1 rounded-md bg-white/15 px-1.5 py-0.5 text-[10.5px] text-white/90"><ImageIcon className="size-3" />{t("কভার ছবি নেই", "No cover yet")}</span>}
          <div className="absolute inset-x-0 bottom-0 p-3 text-white">
            {type && <span className="mb-1 inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10.5px] font-semibold"><TypeIcon className="size-3" />{t(type.bn, type.en)}</span>}
            <p className={"text-[17px] font-semibold leading-tight " + (d.name ? "" : "opacity-70")}>{d.name || t("আপনার property-র নাম", "Your property name")}</p>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-white/85">{d.tagline?.trim() || (place ? place : t("এক লাইনের পরিচিতি এখানে", "Your one-line intro goes here"))}</p>
          </div>
        </div>
        <div className="space-y-3 p-3.5">
          <div className={"flex items-center justify-between gap-2 " + ring(["1.3"])}>
            <p className="flex min-w-0 items-center gap-1 text-[12.5px] text-[#4d5664]"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{place || t("এলাকা, শহর", "Area, city")}</span></p>
            <span className="shrink-0 rounded-md px-2 py-1 text-[11.5px] font-semibold text-white" style={{ background: accent }}>{t("বুক করুন", "Book")}</span>
          </div>
          <div className={ring(["3.1", "3.2", "3.3"])}>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#5b6270]">{t("রুম", "Rooms")}{units ? ` · ${num(units, lang)}` : ""}</p>
            {cats.length ? (
              <ul className="mt-1.5 grid grid-cols-2 gap-2">
                {cats.slice(0, 4).map((c) => (
                  <li key={c.id} className="overflow-hidden rounded-lg ring-1 ring-[#e3e7ec]">
                    <div className="aspect-[4/3]" style={{ background: `linear-gradient(160deg, ${accent}33, ${accent}11)` }} />
                    <div className="px-2 py-1.5"><p className="truncate text-[12px] font-semibold">{c.name}</p><p className="text-[11.5px] text-[#4d5664]">{c.baseRate ? <><b className="text-[#0f1720]">{money(c.baseRate)}</b>/{t("রাত", "night")}</> : t("দাম বাকি", "No price yet")}</p></div>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-1.5 rounded-lg border border-dashed border-[#d5dae1] px-3 py-3 text-center text-[12px] text-[#5b6270]">{t("রুম যোগ করলে এখানে দেখাবে", "Rooms show here once added")}</p>}
          </div>
          {near.length > 0 && <div className={ring(["1.3"])}><p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-[#5b6270]">{t("আশপাশে", "Nearby")}</p>
            <p className="mt-1 text-[12px] text-[#4d5664]">{near.map((x) => `${x.name}${x.time ? ` · ${num(x.time, lang)} ${t("মি.", "min")}` : ""}`).join("  ·  ")}</p></div>}
          <ul className={"space-y-1 border-t border-[#eef0f3] pt-2.5 text-[12px] text-[#4d5664] " + ring(["4.1", "5.1"])}>
            {d.policy.preset && <li className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 shrink-0 text-[#8a909c]" />{t(...POLICY[d.policy.preset])}</li>}
            {d.seen.includes("4.1") && <li className="flex items-center gap-1.5"><Clock className="size-3.5 shrink-0 text-[#8a909c]" />{t("চেক-ইন", "Check-in")} {num(d.policy.checkIn, lang)} · {t("চেক-আউট", "Check-out")} {num(d.policy.checkOut, lang)}</li>}
            {d.seen.includes("5.1") && pays && <li className="flex items-center gap-1.5"><Wallet className="size-3.5 shrink-0 text-[#8a909c]" />{pays}</li>}
            {from > 0 && <li className="pt-0.5 text-[12.5px]">{t("শুরু", "From")} <b className="text-[15px] text-[#0f1720]">{money(from)}</b> /{t("রাত", "night")}</li>}
          </ul>
        </div>
      </div>
      {tip && (
        <div className="flex gap-2.5 rounded-xl bg-[#e9edf2] p-3.5 text-[13.5px] leading-relaxed text-[#4d5664]">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-[#b7791f]" />
          <p>{t(...tip)}</p>
        </div>
      )}
    </div>
  );
}
