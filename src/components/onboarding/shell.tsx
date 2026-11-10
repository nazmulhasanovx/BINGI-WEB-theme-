"use client";
// Onboarding frame: logo header (Help · Save & exit), 6-section progress, one column, sticky footer.
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { Check, HelpCircle, MessageCircle, Phone, X } from "lucide-react";
import { SECTIONS, STEP_TITLE, sectionOf, type Draft, type StepId } from "@/lib/onboarding/store";

export function Header({ right }: { right?: ReactNode }) {
  const [help, setHelp] = useState(false);
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#eceef2] bg-white/90 px-4 backdrop-blur sm:px-6">
      <Link href="/onboarding" className="flex items-center gap-2" aria-label="BinGi onboarding home">
        <Image src="/brand/bingi-logo.png" alt="BinGi" width={84} height={28} className="h-7 w-auto" priority />
      </Link>
      <span className="rounded-full bg-hms-amber-soft px-2 py-0.5 text-[11px] font-semibold text-hms-amber">Prototype</span>
      <div className="ml-auto flex items-center gap-1.5">
        <button onClick={() => setHelp(true)} className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-[14px] font-medium text-[#4b5160] hover:bg-[#f2f3f6]"><HelpCircle className="size-[18px]" aria-hidden /> <span className="hidden sm:inline">Need help?</span><span className="sr-only sm:hidden">Need help?</span></button>
        {right}
      </div>
      {help && <HelpSheet onClose={() => setHelp(false)} />}
    </header>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Help" onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Need help setting up?</h2><button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-[#f2f3f6]"><X className="size-5" /></button></div>
        <p className="mt-1 text-[14px] text-[#5b6170]">The BinGi team can set it up with you on a call. Your progress is saved.</p>
        <div className="mt-4 grid gap-2">
          <button onClick={() => setSent(true)} className="flex items-center gap-3 rounded-2xl border border-[#e3e6eb] p-3.5 text-left hover:bg-[#f9fafb]"><Phone className="size-5 text-[#d8372e]" /><span><span className="block text-[15px] font-medium">Request a call back</span><span className="text-[13px] text-[#5b6170]">We call the phone you signed in with</span></span></button>
          <button onClick={() => setSent(true)} className="flex items-center gap-3 rounded-2xl border border-[#e3e6eb] p-3.5 text-left hover:bg-[#f9fafb]"><MessageCircle className="size-5 text-[#1c7d45]" /><span><span className="block text-[15px] font-medium">Message on WhatsApp</span><span className="text-[13px] text-[#5b6170]">Support number comes from BinGi settings</span></span></button>
        </div>
        {sent && <p role="status" className="mt-3 rounded-xl bg-[#eef8f1] px-3 py-2 text-[13.5px] text-[#1c6b3c]">Request noted (prototype — not sent to BinGi yet).</p>}
      </div>
    </div>
  );
}

/** Left rail on desktop, compact bar on phone. Sections done = every step seen. */
export function Progress({ d, go, bar }: { d: Draft; go: (s: StepId) => void; bar?: boolean }) {
  const cur = sectionOf(d.step);
  if (bar) {
    return (
      <div className="lg:hidden">
        <div className="flex gap-1" aria-hidden>{SECTIONS.map((s, i) => <span key={s.id} className={clsx("h-1.5 flex-1 rounded-full", i < cur ? "bg-[#1c7d45]" : i === cur ? "bg-[#d8372e]" : "bg-[#e3e6eb]")} />)}</div>
        <p className="mt-2 text-[13.5px] font-medium text-[#5b6170]">Part {cur + 1} of 6 · {SECTIONS[cur].label}</p>
      </div>
    );
  }
  return (
    <nav aria-label="Setup progress" className="hidden w-[248px] shrink-0 lg:block">
      <ol className="sticky top-20 space-y-1">
        {SECTIONS.map((s, i) => {
          const done = s.steps.every((x) => d.seen.includes(x)) && i < cur;
          const open = i === cur;
          const seen = s.steps.filter((x) => d.seen.includes(x));
          return (
            <li key={s.id}>
              <button onClick={() => go((seen.at(-1) ?? s.steps[0]) as StepId)} disabled={!seen.length}
                className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14.5px] font-medium disabled:cursor-default", open ? "bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06)] ring-1 ring-[#eceef2]" : "text-[#5b6170] enabled:hover:bg-white/70")}>
                <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full text-[12.5px]", done ? "bg-[#1c7d45] text-white" : open ? "bg-[#d8372e] text-white" : "bg-[#eef0f3] text-[#5b6170]")}>{done ? <Check className="size-3.5" /> : i + 1}</span>
                <span className={open ? "text-[#1d1f24]" : ""}>{s.label}</span>
              </button>
              {open && (
                <ol className="mb-1 ml-[23px] mt-1 border-l border-[#e3e6eb] pl-4">
                  {s.steps.map((x) => (
                    <li key={x}><button onClick={() => go(x)} disabled={!d.seen.includes(x)} aria-current={x === d.step ? "step" : undefined}
                      className={clsx("block w-full py-1 text-left text-[13.5px]", x === d.step ? "font-semibold text-[#b12a22]" : d.seen.includes(x) ? "text-[#4b5160] hover:text-[#1d1f24]" : "text-[#666d7a]")}>{STEP_TITLE[x]}</button></li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Q({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h1 className="text-[26px] font-bold leading-tight tracking-[-0.015em] sm:text-[30px]">{title}</h1>
      {sub && <p className="mt-2 text-[15.5px] leading-relaxed text-[#5b6170]">{sub}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function Footer({ back, children, rail = true }: { back?: () => void; children: ReactNode; rail?: boolean }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-[#eceef2] bg-white/95 backdrop-blur">
      {/* Same columns as the page, so Back / Continue line up with the question, not the window edges. */}
      <div className="mx-auto flex max-w-[1080px] gap-10 px-4 py-3 sm:px-6">
        {rail && <div className="hidden w-[248px] shrink-0 lg:block" />}
        <div className={clsx("flex min-w-0 flex-1 items-center gap-2", rail && "lg:max-w-[720px]")}>
          {back ? <button onClick={back} className="-ml-3 h-11 rounded-xl px-3 text-[15px] font-medium text-[#1d1f24] underline-offset-4 hover:underline">Back</button> : <span />}
          <div className="ml-auto flex items-center gap-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Primary({ children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={clsx("inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#e2483f] to-[#c8232e] px-5 text-[15px] font-semibold text-white shadow-[0_6px_16px_-6px_rgb(200_35_46/0.55)] hover:from-[#d8372e] hover:to-[#b11c29] disabled:opacity-50 disabled:shadow-none", className)}>{children}</button>;
}
export function Later({ children = "I'll do this later", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className="h-11 rounded-xl px-3 text-[14.5px] font-medium text-[#4b5160] hover:bg-[#f2f3f6]">{children}</button>;
}

export function Tile({ on, onClick, title, sub, icon, badge, disabled, locked, role = "button" }: { on: boolean; onClick: () => void; title: string; sub?: string; icon?: ReactNode; badge?: string; disabled?: boolean; locked?: boolean; role?: "button" | "radio" }) {
  return (
    <button type="button" role={role === "radio" ? "radio" : undefined} aria-checked={role === "radio" ? on : undefined} aria-pressed={role === "button" ? on : undefined} aria-disabled={locked || undefined} onClick={locked ? undefined : onClick} disabled={disabled}
      className={clsx("relative flex min-h-[64px] items-center gap-3 rounded-2xl border p-3.5 text-left transition-[border,background,box-shadow] duration-200 disabled:opacity-50", on ? "border-[#e2574e] bg-[#fdf3f2] shadow-[0_0_0_3px_rgb(216_55_46/0.12)]" : "border-[#e3e6eb] bg-white hover:border-[#cfd3db]")}>
      {icon && <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl transition-colors", on ? "bg-[#d8372e] text-white" : "bg-[#f2f3f6] text-[#4b5160]")}>{icon}</span>}
      <span className="min-w-0 flex-1 pr-5">
        <span className="block text-[15px] font-semibold">{title}</span>
        {sub && <span className="mt-0.5 block text-[13px] leading-snug text-[#5b6170]">{sub}</span>}
      </span>
      {badge && <span className="absolute right-2.5 top-2.5 rounded-md bg-[#eef0f3] px-1.5 py-0.5 text-[11.5px] font-medium text-[#4b5160]">{badge}</span>}
      {on && <span className="absolute bottom-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-[#d8372e] text-white"><Check className="size-3.5" /></span>}
    </button>
  );
}

export function Errors({ list }: { list: string[] }) {
  if (!list.length) return null;
  return <div role="alert" className="mb-5 rounded-2xl border border-[#f3c7c3] bg-[#fdf3f2] px-4 py-3 text-[14.5px] text-[#9b241d]">{list.map((e) => <p key={e}>{e}</p>)}</div>;
}
