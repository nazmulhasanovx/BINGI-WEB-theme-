"use client";
// The "BinGi key card" — one compact, live summary of the property instead of a big picture on every page.
// It fills in as the owner answers (type, name, address, rooms, plan) and shows the 6-part progress.
import clsx from "clsx";
import { BedDouble, Castle, House, Building, MapPin, Sparkles, Wifi } from "lucide-react";
import { PLANS, SECTIONS, num, sectionOf, useL, type Draft, type StepId } from "@/lib/onboarding/store";
import { STAY } from "@/lib/onboarding/rooms-easy";
import { TYPE_META } from "./types";

const STAY_ICON = { ROOM: BedDouble, COTTAGE: House, VILLA: Castle, APARTMENT: Building, OTHER: Sparkles } as const;

export function KeyCard({ d, step, rooms = 0, compact }: { d: Draft; step: StepId | "done"; rooms?: number; compact?: boolean }) {
  const { t, lang } = useL();
  const ty = TYPE_META.find((x) => x.slug === d.propertyType);
  const I = ty?.icon ?? Building;
  const cur = step === "done" ? 6 : sectionOf(step);
  const floors = d.floors.filter((f) => f > 0).length;
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-[#1d1f24] px-3.5 py-3 text-white">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#d8372e]"><I className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold">{d.name || t("আপনার property", "Your property")}</p>
          <div className="mt-1 flex gap-1" aria-hidden>{SECTIONS.map((s, i) => <span key={s.id} className={clsx("h-1 flex-1 rounded-full", i < cur ? "bg-[#ff8a80]" : i === cur ? "bg-white" : "bg-white/20")} />)}</div>
        </div>
        {rooms > 0 && <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[12.5px] font-semibold">{num(rooms, lang)} {t("রুম", "rooms")}</span>}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-[26px] bg-[#1d1f24] p-5 text-white shadow-[0_24px_50px_-28px_rgb(29_31_36/0.7)]" aria-label={t("আপনার property-র সারাংশ", "Your property summary")}>
      {/* key-card details: chip + contactless mark */}
      <div className="flex items-start justify-between">
        <span className="grid h-8 w-11 place-items-center rounded-md bg-gradient-to-br from-[#f0c86b] to-[#c9973a]"><span className="h-4 w-6 rounded-sm border border-[#8a6420]/50" /></span>
        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-white/60"><Wifi className="size-3.5 rotate-90" />BinGi</span>
      </div>
      <div className="mt-6 flex items-center gap-3">
        <span key={d.propertyType} className="onb-in grid size-11 shrink-0 place-items-center rounded-2xl bg-[#d8372e]"><I className="size-[22px]" /></span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/55">{ty ? t(ty.bn, ty.en) : t("Property-র ধরন", "Property type")}</p>
          <p key={d.name} className="truncate text-[21px] font-bold leading-tight">{d.name || <span className="text-white/55">{t("নাম", "Name")}</span>}</p>
        </div>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-[13.5px] text-white/70"><MapPin className="mt-0.5 size-3.5 shrink-0" />{d.city ? [d.area || d.road, d.city].filter(Boolean).join(", ") : <span className="text-white/55">{t("ঠিকানা", "Address")}</span>}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {d.stay.map((s) => { const S = STAY.find((x) => x.id === s)!; const SI = STAY_ICON[S.id]; return <span key={s} className="onb-in inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] font-medium"><SI className="size-3.5" />{t(S.bn, S.en)}</span>; })}
        {floors > 0 && d.stay.some((s) => s === "ROOM" || s === "APARTMENT") && <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] font-medium">{num(floors, lang)} {t("তলা", "floors")}</span>}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <div><dt className="text-[11.5px] uppercase tracking-[0.1em] text-white/65">{t("রুম", "Rooms")}</dt><dd key={rooms} className="onb-in text-[24px] font-bold tabular-nums">{num(rooms, lang)}</dd></div>
        <div><dt className="text-[11.5px] uppercase tracking-[0.1em] text-white/65">{t("প্ল্যান", "Plan")}</dt><dd className="text-[18px] font-bold leading-[2]">{d.planPicked ? PLANS[d.plan].label : <span className="text-white/55">—</span>}</dd></div>
      </dl>
      <ol className="mt-4 space-y-1.5" aria-label={t("অগ্রগতি", "Progress")}>
        {SECTIONS.map((s, i) => (
          <li key={s.id} className={clsx("flex items-center gap-2 text-[13px]", i === cur ? "font-semibold text-white" : i < cur ? "text-white/70" : "text-white/60")}>
            <span className={clsx("grid size-4 place-items-center rounded-full text-[9px]", i < cur ? "bg-[#ff8a80] text-[#1d1f24]" : i === cur ? "bg-white text-[#1d1f24]" : "border border-white/30")}>{i < cur ? "✓" : ""}</span>
            {t(s.bn, s.label)}
          </li>
        ))}
      </ol>
      <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#d8372e]/25 blur-2xl" />
    </div>
  );
}
