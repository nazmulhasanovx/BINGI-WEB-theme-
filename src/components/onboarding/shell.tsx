"use client";
import { createPortal } from "react-dom";
// Onboarding v7.2 frame — HMS colours (cool-gray canvas, white card, coral accents).
// One question in a white card; the live "key card" summary sits beside it (no decorative art per page).
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { Check, ChevronRight, CircleHelp, HelpCircle, MessageCircle, Phone, X } from "lucide-react";
import { SECTIONS, sectionOf, setOnbLang, useL, type StepId } from "@/lib/onboarding/store";

export function Header({ right }: { right?: ReactNode }) {
  const [help, setHelp] = useState(false);
  const { t, lang } = useL();
  return (
    <header className="relative z-30 mx-auto flex h-16 max-w-[1080px] items-center gap-2 px-4 sm:px-6">
      <Link href="/onboarding" className="flex items-center" aria-label="BinGi">
        <Image src="/brand/bingi-logo.png" alt="BinGi" width={84} height={28} className="h-7 w-auto" priority />
      </Link>
      <span className="ml-1 hidden rounded-full bg-hms-amber-soft px-2 py-0.5 text-[11px] font-semibold text-hms-amber sm:inline">Prototype</span>
      <div className="ml-auto flex items-center gap-1.5">
        <div role="group" aria-label="Language" className="flex rounded-full bg-white p-0.5 text-[13px] font-semibold ring-1 ring-[#e3e5ea]">
          {(["bn", "en"] as const).map((l) => <button key={l} onClick={() => setOnbLang(l)} aria-pressed={lang === l} className={clsx("h-8 rounded-full px-3", lang === l ? "bg-[#1d1f24] text-white" : "text-[#4b5160]")}>{l === "bn" ? "বাংলা" : "EN"}</button>)}
        </div>
        <button onClick={() => setHelp(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-[14px] font-medium text-[#1d1f24] ring-1 ring-[#e3e5ea]"><HelpCircle className="size-[18px]" aria-hidden /><span className="hidden sm:inline">{t("সাহায্য?", "Help?")}</span><span className="sr-only sm:hidden">{t("সাহায্য", "Help")}</span></button>
        {right}
      </div>
      {help && <HelpSheet onClose={() => setHelp(false)} />}
    </header>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const { t } = useL();
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1d1f24]/10 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={t("সাহায্য", "Help")} onClick={(e) => e.stopPropagation()} className="onb-in w-full max-w-[420px] rounded-t-[28px] bg-white p-6 shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between"><h2 className="text-[19px] font-bold">{t("সেটআপে সাহায্য লাগবে?", "Need help setting up?")}</h2><button onClick={onClose} aria-label={t("বন্ধ করুন", "Close")} className="grid size-9 place-items-center rounded-full hover:bg-[#f2f3f6]"><X className="size-5" /></button></div>
        <p className="mt-1 text-[14.5px] text-[#5b6170]">{t("BinGi টিম ফোনে আপনার সাথে সেটআপ করে দেবে। আপনার কাজ সেভ থাকবে।", "The BinGi team can set it up with you on a call. Your progress is saved.")}</p>
        <div className="mt-4 grid gap-2">
          <button onClick={() => setSent(true)} className="flex items-center gap-3 rounded-2xl border border-[#e6e8ee] p-4 text-left hover:bg-[#f8f9fb]"><span className="grid size-11 place-items-center rounded-2xl bg-[#fdecea] text-[#d8372e]"><Phone className="size-5" /></span><span className="text-[15.5px] font-semibold">{t("আমাকে কল করুন", "Call me back")}</span></button>
          <button onClick={() => setSent(true)} className="flex items-center gap-3 rounded-2xl border border-[#e6e8ee] p-4 text-left hover:bg-[#f8f9fb]"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9f6ee] text-[#1c7d45]"><MessageCircle className="size-5" /></span><span className="text-[15.5px] font-semibold">WhatsApp</span></button>
        </div>
        {sent && <p role="status" className="mt-3 rounded-xl bg-[#eef8f1] px-3 py-2 text-[13.5px] text-[#1c6b3c]">{t("অনুরোধ নেওয়া হয়েছে (প্রোটোটাইপ — এখনো পাঠানো হয় না)।", "Request noted (prototype — not sent yet).")}</p>}
      </div>
    </div>,
    document.body,

  );
}

/** Cool-gray HMS canvas. */
export function Canvas({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh overflow-x-hidden bg-[#f4f5f7]">{children}</div>;
}

export function Dots({ step }: { step: StepId }) {
  const cur = sectionOf(step);
  const { t, lang } = useL();
  const S = SECTIONS[cur];
  const B = "০১২৩৪৫৬";
  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-[#fdecea] px-3 py-1 text-[13px] font-semibold text-[#b12a22]">{lang === "bn" ? `ধাপ ${B[cur + 1]}/৬` : `Step ${cur + 1} of 6`}</span>
      <span className="truncate text-[13.5px] font-medium text-[#5b6170]">{t(S.bn, S.label)}</span>
    </div>
  );
}

/** White question card + live key card (desktop: beside it; phone: slim bar on top). */
export function Card({ aside, bar, children, footer }: { aside: ReactNode; bar: ReactNode; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1080px] gap-6 px-3 pb-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="lg:hidden">{bar}</div>
      <div className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgb(16_24_40/0.05),0_20px_50px_-30px_rgb(16_24_40/0.25)] ring-1 ring-[#e8e9ee]">
        <div className="flex-1 px-5 pb-6 pt-6 sm:px-10 sm:pt-9">{children}</div>
        <div className="sticky bottom-0 z-10 border-t border-[#eef0f3] bg-white/95 px-5 py-3.5 backdrop-blur sm:px-10">{footer}</div>
      </div>
      <aside className="hidden lg:block"><div className="sticky top-6">{aside}</div></aside>
    </div>
  );
}

export function Q({ title, sub, why, children }: { title: string; sub?: ReactNode; why?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { t } = useL();
  return (
    <section>
      <div className="flex items-start gap-2">
        <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.01em] sm:text-[31px]">{title}</h1>
        {why && <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t("কেন জিজ্ঞেস করছি?", "Why we ask")} className="mt-1.5 grid size-8 shrink-0 place-items-center rounded-full text-[#666d7a] hover:bg-[#f1f2f5] hover:text-[#1d1f24]"><CircleHelp className="size-5" /></button>}
      </div>
      {open && why && <p className="onb-in mt-2 rounded-2xl bg-[#f4f5f7] px-4 py-3 text-[14.5px] text-[#4b5160]">{why}</p>}
      {sub && <p className="mt-2 text-[15.5px] leading-relaxed text-[#5b6170]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Foot({ back, children }: { back?: () => void; children: ReactNode }) {
  const { t } = useL();
  return (
    <div className="flex items-center gap-2">
      {back ? <button onClick={back} className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-medium text-[#1d1f24] hover:bg-[#f4f5f7]">← {t("পেছনে", "Back")}</button> : <span />}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}

export function Primary({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={clsx("inline-flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-b from-[#e2483f] to-[#c8232e] px-6 text-[15.5px] font-semibold text-white shadow-[0_10px_22px_-10px_rgb(200_35_46/0.7)] transition-transform active:scale-[0.98] hover:from-[#d8372e] hover:to-[#b11c29] disabled:opacity-50 disabled:shadow-none", className)}>{children}</button>;
}
export function Next({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useL();
  return <Primary {...p}>{children ?? t("এগিয়ে যান", "Continue")}<ChevronRight className="size-[18px]" aria-hidden /></Primary>;
}
export function Later({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useL();
  return <button {...p} className="h-11 rounded-xl px-3 text-[14.5px] font-medium text-[#5b6170] hover:bg-[#f4f5f7]">{children ?? t("পরে করবো", "Later")}</button>;
}
export function Ghost({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={clsx("inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#e6e8ee] bg-white px-4 text-[15px] font-semibold text-[#1d1f24] hover:bg-[#f8f9fb]", className)}>{children}</button>;
}

/** Big icon answer tile (reference: tinted icon square + check badge). */
export function Tile({ on, onClick, title, sub, icon, badge, disabled, locked, role = "button", big }: { on: boolean; onClick: () => void; title: string; sub?: string; icon?: ReactNode; badge?: string; disabled?: boolean; locked?: boolean; role?: "button" | "radio"; big?: boolean }) {
  return (
    <button type="button" role={role === "radio" ? "radio" : undefined} aria-checked={role === "radio" ? on : undefined} aria-pressed={role === "button" ? on : undefined} aria-disabled={locked || undefined}
      onClick={locked ? undefined : onClick} disabled={disabled}
      className={clsx("relative flex items-center gap-3 rounded-[20px] border-2 p-3.5 text-left transition-[border,background,box-shadow] duration-200 disabled:opacity-45", big ? "min-h-[88px]" : "min-h-[68px]",
        on ? "border-[#ef6b62] bg-[#fff6f5] shadow-[0_8px_20px_-12px_rgb(216_55_46/0.6)]" : "border-[#e6e8ee] bg-white hover:border-[#d5d8e0] hover:shadow-[0_6px_16px_-12px_rgb(16_24_40/0.25)]")}>
      {icon && <span className={clsx("grid shrink-0 place-items-center rounded-2xl text-[#d8372e] transition-colors", big ? "size-12" : "size-11", on ? "bg-[#fde3e0]" : "bg-[#fdeceb]")}>{icon}</span>}
      <span className="min-w-0 flex-1 pr-5">
        <span className="block text-[16px] font-bold leading-snug">{title}</span>
        {sub && <span className="mt-0.5 block text-[13.5px] leading-snug text-[#5b6170]">{sub}</span>}
      </span>
      {badge && <span className="absolute bottom-2 right-2.5 rounded-full bg-[#f1f2f5] px-2 py-0.5 text-[11.5px] font-medium text-[#5b6170]">{badge}</span>}
      {on && <span className="onb-pop absolute right-2.5 top-2.5 grid size-6 place-items-center rounded-full bg-[#d8372e] text-white shadow"><Check className="size-4" /></span>}
    </button>
  );
}

export function Chip({ on, onClick, children, disabled, title, label }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean; title?: string; label?: string }) {
  return (
    <button type="button" aria-pressed={on} aria-label={label} onClick={onClick} disabled={disabled} title={title}
      className={clsx("inline-flex h-11 items-center gap-1.5 rounded-full border-2 px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50", on ? "border-[#ef6b62] bg-[#fff6f5] text-[#b12a22]" : "border-[#e6e8ee] bg-white text-[#1d1f24] hover:border-[#d5d8e0]")}>
      {on && <Check className="size-4" aria-hidden />}{children}
    </button>
  );
}

export function Stepper({ value, set, min = 0, max = 99, label }: { value: number; set: (n: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="inline-flex items-center rounded-2xl border-2 border-[#e6e8ee] bg-white" role="group" aria-label={label}>
      <button type="button" aria-label={`${label} −`} onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} className="grid size-11 place-items-center text-[22px] font-semibold disabled:opacity-30">−</button>
      <span className="min-w-[44px] text-center text-[18px] font-bold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={`${label} +`} onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} className="grid size-11 place-items-center text-[22px] font-semibold disabled:opacity-30">+</button>
    </div>
  );
}

export function Errors({ list }: { list: string[] }) {
  if (!list.length) return null;
  return <div role="alert" className="onb-in mb-5 rounded-2xl border border-[#f6cfcb] bg-[#fff4f3] px-4 py-3 text-[14.5px] font-medium text-[#9b241d]">{list.map((e) => <p key={e}>{e}</p>)}</div>;
}

export const field = "h-12 w-full rounded-2xl border-2 border-[#e6e8ee] bg-white px-4 text-[16px] outline-none transition-colors placeholder:text-[#8a8f9c] focus:border-[#ef6b62] focus:ring-4 focus:ring-[#ef6b62]/10";
