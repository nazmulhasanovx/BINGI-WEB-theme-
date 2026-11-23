"use client";
// Onboarding v8.3 — Plan & billing in the style of the public pricing page (BINGI-PUBLIC-PLATFROM pricing-section):
// gradient billing switch with discount badges · "Your rooms" bar (stepper + slider) · plan cards with the
// per-room price, launch price struck subtly, fees, activation and includes · "Your total cost" breakdown
// with a booking-fee estimate. Prices = the approved table (11 Nov 2026), from store.ts.
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { BedDouble, Calculator, Check, CheckCheck, Minus, Percent, Plus, Sparkles } from "lucide-react";
import { CYCLE_OFF, PLANS, TRIAL_DAYS, num, planRank, quote, recommend, useL, useOnboarding, type Cycle, type Draft, type PlanId } from "@/lib/onboarding/store";
import { money } from "../hms/rooms/parts";
import { Pills } from "./shell";

const ID: PlanId[] = ["starter", "business", "ultra"];
/** Number that counts from the old value to the new one (~450 ms, ease-out), like the public calculator. Reduced motion: jumps. */
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
function N({ v, lang }: { v: number; lang: "bn" | "en" }) {
  const [shown, setShown] = useState(v);
  const from = useRef(v);
  useEffect(() => {
    const start = from.current;
    if (start === v) return;
    if (reduced()) { from.current = v; return; } // shown below as v directly
    let raf = 0; const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 450), e = 1 - Math.pow(1 - k, 3);
      const cur = Math.round(start + (v - start) * e);
      from.current = cur; setShown(cur);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return <span className="inline-block tabular-nums">{num(money(reduced() ? v : shown), lang)}</span>;
}

export function PlanV8({ d, units: made }: { d: Draft; units: number }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const rec = recommend(d);
  const pick = d.planPicked ? d.plan : rec;
  const rooms = made || d.units;
  const setRooms = (n: number) => edit((x) => { x.units = Math.max(1, Math.min(500, Math.round(n) || 1)); });
  const cycleLabel = (c: Cycle) => (c === 1 ? t("মাসিক", "Monthly") : t(`${num(c, lang)} মাস`, `${c} months`));
  return (
    <section>
      <div className="text-center">
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[34px]">
          {t("যত রুম, তত দাম। কিছুই ", "Pay per room. Nothing ")}
          <span className="inline-block rounded-xl border border-dashed border-[#b11c29]/50 bg-[#fdecea] px-2 py-0.5 text-[#b11c29]">{t("লুকানো নয়", "hidden")}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-[520px] text-[15.5px] text-[#4d5664]">{t(`প্রতি রুমের মাসিক রেট। প্রতিটা খরচ আলাদা করে দেখানো। ${num(TRIAL_DAYS, lang)} দিন ফ্রি।`, `A simple monthly rate per room. Every charge shown separately. ${TRIAL_DAYS} days free.`)}</p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="rounded-full border border-[#e3e7ec] bg-white/90 shadow-[0_1px_2px_rgb(15_23_32/0.05),0_6px_18px_-6px_rgb(15_23_32/0.08)]">
          <Pills size="lg" tone="brand" label={t("বিলিং", "Billing")} value={d.cycle} onChange={(c) => edit((x) => { x.cycle = c; })}
            items={([1, 6, 12] as Cycle[]).map((c) => ({ v: c, label: cycleLabel(c), sub: CYCLE_OFF[c] ? `−${num(CYCLE_OFF[c] * 100, lang)}%` : undefined }))} />
        </div>
        <div className="flex w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-[22px] border border-[#e3e7ec] bg-white/90 py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgb(15_23_32/0.05),0_6px_18px_-6px_rgb(15_23_32/0.08)] sm:rounded-full">
          <label htmlFor="plan-rooms" className="flex items-center gap-2 text-[14px] font-medium"><BedDouble className="size-[18px] text-[#b11c29]" aria-hidden />{made ? t("আপনার রুম", "Your rooms") : t("আনুমানিক কয়টা রুম?", "About how many rooms?")}</label>
          {made ? <span className="mr-3 grid h-10 min-w-16 place-items-center rounded-full bg-[#f4f6f8] px-3 text-[16px] font-semibold tabular-nums">{num(made, lang)}</span> : (
            <>
              <div className="flex items-center gap-1">
                <button onClick={() => setRooms(rooms - 1)} className="grid size-10 place-items-center rounded-full hover:bg-[#f4f6f8]" aria-label={t("কম রুম", "Fewer rooms")}><Minus className="size-4" /></button>
                <input id="plan-rooms" inputMode="numeric" value={num(rooms, lang)} onChange={(e) => setRooms(Number(e.target.value.replace(/[০-৯]/g, (x) => String("০১২৩৪৫৬৭৮৯".indexOf(x))).replace(/\D/g, "")))} className="h-10 w-16 rounded-full bg-[#f4f6f8] text-center text-[16px] font-semibold tabular-nums outline-none focus:ring-2 focus:ring-[#0f1720]/15" />
                <button onClick={() => setRooms(rooms + 1)} className="grid size-10 place-items-center rounded-full hover:bg-[#f4f6f8]" aria-label={t("বেশি রুম", "More rooms")}><Plus className="size-4" /></button>
              </div>
              <input type="range" min={1} max={200} value={Math.min(rooms, 200)} onChange={(e) => setRooms(+e.target.value)} aria-label={t("রুম স্লাইডার", "Rooms slider")} className="mr-2 h-10 w-36 accent-[#b11c29]" />
            </>
          )}
        </div>
        <p className="text-center text-[13px] text-[#4d5664]" aria-live="polite">
          {made ? t("রুম অংশে যতগুলো রুম যোগ করেছেন, ততগুলোর বিল।", "Billed on the rooms you added.") : t("আসল বিল হবে রুম অংশে যতগুলো রুম যোগ করবেন ততগুলোর।", "The real bill follows the rooms you add later.")}
        </p>
      </div>

      <div role="radiogroup" aria-label={t("প্ল্যান", "Plan")} className="mt-7 grid gap-4 md:grid-cols-3">
        {ID.map((p) => {
          const P = PLANS[p];
          const on = pick === p;
          const q = quote(p, rooms, d.cycle);
          const rate = Math.round(q.sub / q.billed / d.cycle);
          const low = planRank(p) < planRank(rec);
          return (
            <div key={p} className={clsx("relative flex flex-col rounded-[18px] border p-5 transition-[transform,box-shadow,border-color] duration-300", on ? "border-[#b11c29] bg-gradient-to-b from-[#fff6f5] to-white shadow-[0_18px_40px_-24px_rgb(177_28_41/0.55)] md:-translate-y-1.5" : "border-[#e3e7ec] bg-white shadow-[0_1px_2px_rgb(15_23_32/0.05)] hover:shadow-[0_14px_30px_-22px_rgb(15_23_32/0.35)]")}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[22px] font-semibold tracking-tight">{P.label}</h2>
                {rec === p && <span className="shrink-0 rounded-full bg-[#b11c29] px-3 py-1 text-[12px] font-semibold text-white">{t("আপনার জন্য", "Best fit")}</span>}
              </div>
              <p className="mt-1 min-h-[40px] text-[14px] leading-snug text-[#4d5664]">{t(P.forBn, P.for)}</p>
              <p className="mt-1 flex flex-wrap gap-1.5">{P.tags.map(([bn, en]) => <span key={en} className={clsx("rounded-full px-2 py-0.5 text-[12px] font-semibold", on ? "bg-white text-[#b11c29] ring-1 ring-[#b11c29]/15" : "bg-[#fdecea] text-[#b11c29]")}>{t(bn, en)}</span>)}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[36px] font-semibold leading-none tracking-tight">৳<N v={rate} lang={lang} /></span>
                <span className="text-[14px] text-[#4d5664]">/{t("রুম/মাস", "room/month")}</span>
              </div>
              <p className="mt-1.5 min-h-[18px] text-[12px] text-[#5b6270]">
                {P.perUnitRegular ? <><s>৳{num(P.perUnitRegular, lang)}</s> {t("লঞ্চ দাম", "launch price")}</> : t("সবসময় এই দাম", "always this price")}
                {q.off > 0 && <span className="text-[#4d5664]"> · {t(`বাড়তি সাশ্রয় ৳${num(money(q.off), lang)}`, `extra ৳${money(q.off)} off`)}</span>}
              </p>
              <button role="radio" aria-checked={on} onClick={() => edit((x) => { x.plan = p; x.planPicked = true; })}
                className={clsx("mt-4 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[15px] font-semibold transition-colors", on ? "btn-glow text-white" : "border border-[#d3d8df] bg-white text-[#0f1720] hover:border-[#0f1720]")}>
                {on ? <><Check className="size-4" strokeWidth={3} />{t("বাছাই করা হয়েছে", "Selected")}</> : t(`${P.label} বাছাই করুন`, `Choose ${P.label}`)}
              </button>
              <ul className="mt-4 space-y-2.5 text-[14px] text-[#2b3340]">
                <li className="flex items-start gap-3"><BedDouble className="mt-0.5 size-[18px] shrink-0 text-[#b11c29]" />{d.cycle === 1 ? t(`${num(q.billed, lang)} রুম · ৳${num(money(q.sub), lang)}/মাস`, `${q.billed} ${q.billed === 1 ? "room" : "rooms"} · ৳${money(q.sub)}/month`) : t(`${num(q.billed, lang)} রুম · ${num(d.cycle, lang)} মাসে ৳${num(money(q.sub), lang)}`, `${q.billed} ${q.billed === 1 ? "room" : "rooms"} · ৳${money(q.sub)} for ${d.cycle} months`)}</li>
                <li className="flex items-start gap-3"><Percent className="mt-0.5 size-[18px] shrink-0 text-[#b11c29]" />{t(`বুকিং ফি: মার্কেটপ্লেস ${num(P.fees[0], lang)}% · ওয়েব ${num(P.fees[1], lang)}% · ওয়াক-ইন ${num(P.fees[2], lang)}%`, `Booking fees: Marketplace ${P.fees[0]}% · Web ${P.fees[1]}% · Walk-in ${P.fees[2]}%`)}</li>
                <li className="flex items-start gap-3"><Sparkles className="mt-0.5 size-[18px] shrink-0 text-[#b11c29]" /><Activation p={p} /></li>
              </ul>
              <div className="mt-4 space-y-2 border-t border-[#e9edf2] pt-4">
                <h3 className="text-[14px] font-semibold">{t(...P.includesTitle)}</h3>
                <ul className="space-y-2">{P.includes.map(([bn, en]) => <li key={en} className="flex items-center gap-3 text-[14px] text-[#4d5664]"><span className={clsx("grid size-6 shrink-0 place-content-center rounded-full border text-[#b11c29]", on ? "border-[#b11c29] bg-white" : "border-[#b11c29]/40 bg-[#fff6f5]")}><CheckCheck className="size-3.5" /></span>{t(bn, en)}</li>)}</ul>
              </div>
              {low && <p className="mt-4 rounded-lg bg-[#f4f6f8] px-3 py-2 text-[12.5px] text-[#4d5664]">{t("আপনার বাছাই করা কিছু টুল এই প্ল্যানে নেই — দরকার হলে পরে আপগ্রেড করা যায়।", "Some tools you picked aren't in this plan — you can upgrade later.")}</p>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] border border-dashed border-[#c6ccd4] bg-white px-5 py-4">
        <span className="min-w-0 flex-1"><span className="block text-[16px] font-semibold">Custom</span><span className="text-[14px] text-[#4d5664]">{t("একাধিক property, হোটেল গ্রুপ — কোটেশন রিভিউর পরে", "Hotel groups and chains — quotation after review")}</span></span>
        <span className="text-[14px] font-semibold text-[#b11c29]">{t("উপরে সাহায্য → কল", "Help above → call")}</span>
      </div>

      <Cost d={d} pick={pick} rooms={rooms} made={made} setRooms={setRooms} />
    </section>
  );
}

function Activation({ p }: { p: PlanId }) {
  const { t, lang } = useL();
  const P = PLANS[p];
  if (!P.activation) return <>{t("কোনো অ্যাক্টিভেশন ফি নেই", "No activation fee")}</>;
  const off = P.activationRegular ? Math.round((1 - P.activation / P.activationRegular) * 100) : 0;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {t("অ্যাক্টিভেশন", "Activation")}
      {P.activationRegular && <s className="text-[#5b6270] decoration-[#b11c29]/60">৳{num(money(P.activationRegular), lang)}</s>}
      <b className="font-semibold">৳{num(money(P.activation), lang)}</b>
      {off > 0 && <span className="rounded-full bg-[#fdecea] px-1.5 py-px text-[12px] font-semibold text-[#b11c29]">−{num(off, lang)}%</span>}
    </span>
  );
}

function Row({ label, sub, children, strong, minus }: { label: React.ReactNode; sub?: React.ReactNode; children: React.ReactNode; strong?: boolean; minus?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0"><p className={strong ? "text-[16px] font-semibold" : "text-[15px]"}>{label}</p>{sub && <p className="mt-0.5 text-[13px] tabular-nums text-[#4d5664]">{sub}</p>}</div>
      <div className={clsx("shrink-0 text-right tabular-nums", strong ? "text-[24px] font-semibold tracking-tight" : "text-[15px] font-medium", minus && "text-[#1c7d45]")}>{children}</div>
    </div>
  );
}

/** "What will I actually pay?" — first bill for the chosen plan + a booking-fee estimate. */
function Cost({ d, pick, rooms, made, setRooms }: { d: Draft; pick: PlanId; rooms: number; made: number; setRooms: (n: number) => void }) {
  const { edit } = useOnboarding();
  const { t, lang } = useL();
  const [web, setWeb] = useState(0);
  const [mkt, setMkt] = useState(0);
  const P = PLANS[pick];
  const q = quote(pick, rooms, d.cycle);
  const rate = Math.round(q.sub / q.billed / d.cycle);
  const fees = Math.round((web * P.fees[1] + mkt * P.fees[0]) / 100);
  const tk = (v: number) => <>৳<N v={v} lang={lang} /></>;
  const every = d.cycle === 1 ? t("প্রতি মাসে", "every month") : t(`প্রতি ${num(d.cycle, lang)} মাসে`, `every ${d.cycle} months`);
  return (
    <section aria-labelledby="cost-h" className="mt-6 rounded-[24px] border border-[#e3e7ec] bg-white p-4 shadow-[0_1px_2px_rgb(15_23_32/0.05),0_6px_18px_-6px_rgb(15_23_32/0.08)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="cost-h" className="flex items-center gap-2 text-[18px] font-semibold tracking-tight"><Calculator className="size-5 text-[#b11c29]" aria-hidden />{t("আপনার মোট খরচ", "Your total cost")}</h2>
        <Pills tone="brand" label={t("প্ল্যান", "Plan")} value={pick} onChange={(p) => edit((x) => { x.plan = p; x.planPicked = true; })} items={ID.map((p) => ({ v: p, label: PLANS[p].label }))} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Pills size="sm" label={t("বিলিং", "Billing")} value={d.cycle} onChange={(c) => edit((x) => { x.cycle = c; })}
          items={([1, 6, 12] as Cycle[]).map((c) => ({ v: c, label: c === 1 ? t("মাসিক", "Monthly") : t(`${num(c, lang)} মাস`, `${c} mo`), sub: CYCLE_OFF[c] ? `−${num(CYCLE_OFF[c] * 100, lang)}%` : undefined }))} />
        <div className="flex items-center gap-1 rounded-full border border-[#e3e7ec] bg-[#f4f6f8] py-1 pl-3 pr-1">
          <span className="flex items-center gap-1.5 text-[13.5px] font-medium"><BedDouble className="size-4 text-[#b11c29]" aria-hidden />{t("রুম", "Rooms")}</span>
          {made ? <span className="grid h-8 min-w-12 place-items-center rounded-full bg-white px-2 text-[14.5px] font-semibold tabular-nums">{num(made, lang)}</span> : <>
            <button onClick={() => setRooms(rooms - 1)} disabled={rooms <= 1} className="grid size-8 place-items-center rounded-full hover:bg-white disabled:opacity-40" aria-label={t("কম রুম", "Fewer rooms")}><Minus className="size-3.5" /></button>
            <span className="grid h-8 min-w-12 place-items-center rounded-full bg-white px-2 text-[14.5px] font-semibold tabular-nums" aria-live="polite">{num(rooms, lang)}</span>
            <button onClick={() => setRooms(rooms + 1)} className="grid size-8 place-items-center rounded-full hover:bg-white" aria-label={t("বেশি রুম", "More rooms")}><Plus className="size-3.5" /></button>
          </>}
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="divide-y divide-[#e3e7ec] rounded-2xl bg-[#f4f6f8] px-4 sm:px-5">
          <Row label={t("সাবস্ক্রিপশন", "Subscription")} sub={t(`${num(q.billed, lang)} রুম × ৳${num(P.perUnit, lang)} × ${num(d.cycle, lang)} মাস`, `${q.billed} ${q.billed === 1 ? "room" : "rooms"} × ৳${P.perUnit} × ${d.cycle} ${d.cycle === 1 ? "month" : "months"}`)}>{tk(q.gross)}</Row>
          {q.off > 0 && <Row minus label={t(`${num(d.cycle, lang)} মাসের ছাড়`, `${d.cycle}-month discount`)} sub={t(`রুম প্রতি ৳${num(P.perUnit, lang)} → ৳${num(rate, lang)}`, `৳${P.perUnit} → ৳${rate} per room`)}>−{tk(q.off)}</Row>}
          <Row label={t("অ্যাক্টিভেশন (একবার)", "Activation (one-time)")} sub={P.activationRegular ? <Activation p={pick} /> : undefined}>{P.activation ? tk(P.activation) : <span className="text-[#5b6270]">{t("নেই", "None")}</span>}</Row>
          <Row strong label={t("প্রথম বিল", "First bill")} sub={t(`ট্রায়ালের পরে · এখন কোনো VAT যোগ হয় না`, "After the trial · no VAT added for now")}>{tk(q.total)}</Row>
          <Row label={t("এরপর", "After that")} sub={every}>{tk(q.sub)}</Row>
        </div>
        <div className="rounded-2xl border border-dashed border-[#c6ccd4] p-4 sm:p-5">
          <p className="text-[15px] font-semibold">{t("বুকিং ফি (আনুমানিক)", "Booking fees (estimate)")}</p>
          <p className="mt-1 text-[13px] text-[#4d5664]">{t("অনলাইন বুকিং হলে শুধু তখনই। ওয়াক-ইনে ফি নেই।", "Only when online bookings come in. Walk-ins are free.")}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {([["web", web, setWeb, t(`ওয়েবসাইট · ${num(P.fees[1], lang)}%`, `Website · ${P.fees[1]}%`)], ["mkt", mkt, setMkt, t(`মার্কেটপ্লেস · ${num(P.fees[0], lang)}%`, `Marketplace · ${P.fees[0]}%`)]] as const).map(([id, v, set, l]) => (
              <label key={id} className="block text-[12.5px] text-[#4d5664]">{l}
                <span className="relative mt-1 block"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#5b6270]">৳</span>
                  <input inputMode="numeric" value={v || ""} placeholder="0" onChange={(e) => set(Math.max(0, Number(e.target.value.replace(/\D/g, "").slice(0, 9)) || 0))} aria-label={t("মাসিক বুকিং মূল্য", "Monthly booking value")} className="h-11 w-full rounded-[10px] border border-[#d3d8df] bg-white pl-7 pr-2 text-[15px] tabular-nums outline-none focus:border-[#0f1720]" />
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 flex items-baseline justify-between gap-3 text-[14px] text-[#4d5664]">{t("মাসে আনুমানিক", "About per month")}<span className="text-[18px] font-semibold text-[#0f1720] tabular-nums">{tk(fees)}</span></p>
        </div>
      </div>
    </section>
  );
}
