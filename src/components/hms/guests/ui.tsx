"use client";
// Guests module: one place for guests and their reviews (Nazmul, 10 Nov 2026). Shared frame and small parts.
import Link from "next/link";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Star, X } from "lucide-react";
import type { GuestState } from "@/lib/guests/store";

export function GuestsFrame({ tab, counts, action, children }: { tab: "guests" | "reviews"; counts: { guests: number; reply: number }; action?: ReactNode; children: ReactNode }) {
  const tabs = [
    { id: "guests", label: "Guests", href: "/hms/guests", n: counts.guests, hot: false },
    { id: "reviews", label: "Reviews", href: "/hms/guests/reviews", n: counts.reply, hot: counts.reply > 0 },
  ];
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1280px] p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.01em]">Guests</h1>
            <p className="text-[14px] text-hms-muted">Everyone who stays with you, their visits and what they said.</p>
          </div>
          {action}
        </div>
        <nav aria-label="Guests sections" className="mt-4 flex gap-1 border-b border-hms-line">
          {tabs.map((t) => (
            <Link key={t.id} href={t.href} aria-current={tab === t.id ? "page" : undefined}
              className={clsx("-mb-px flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-[14.5px] font-semibold", tab === t.id ? "border-hms-red text-hms-ink" : "border-transparent text-hms-muted hover:text-hms-ink")}>
              {t.label}
              <span className={clsx("rounded-full px-1.5 text-[12px] font-semibold tabular-nums", t.hot ? "bg-hms-red text-white" : "bg-hms-hover text-[#4b5160]")}>{t.n}{t.hot ? " to reply" : ""}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export const btn = "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-[14px] font-semibold transition-colors disabled:opacity-50";
export const btnPrimary = clsx(btn, "bg-hms-red text-white hover:bg-[#b11c29]");
export const btnLine = clsx(btn, "border border-hms-line bg-white hover:bg-hms-hover");
export const input = "h-11 w-full rounded-lg border border-[#cfd3db] bg-white px-3 text-[15px] outline-none focus:border-hms-ink focus:ring-2 focus:ring-hms-ink/10";
export const lbl = "mb-1.5 block text-[13.5px] font-semibold";

export function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`} role="img">
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-[#f5a524] text-[#f5a524]" : "fill-[#e3e5ea] text-[#e3e5ea]"} />)}
    </span>
  );
}

export function StateChip({ s }: { s: GuestState }) {
  const c: Record<GuestState, string> = {
    "In house": "bg-[#e8f0fe] text-[#1d4ed8]", "Arriving today": "bg-[#fdefe7] text-[#b4501f]", Upcoming: "bg-[#eeebfc] text-[#5b44c9]",
    "Checked out": "bg-hms-hover text-[#4b5160]", "No stay yet": "bg-hms-hover text-[#4b5160]",
  };
  return <span className={clsx("inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-[12.5px] font-semibold", c[s])}>{s}</span>;
}

export function Tag({ tone, children }: { tone: "vip" | "red" | "gray" | "green" | "amber"; children: ReactNode }) {
  const c = { vip: "bg-[#fdf3d9] text-[#7a5200]", red: "bg-[#fde8e8] text-[#a11d2a]", gray: "bg-hms-hover text-[#4b5160]", green: "bg-[#e5f5ec] text-[#16693a]", amber: "bg-[#fdf3d9] text-[#7a5200]" }[tone];
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold", c)}>{children}</span>;
}

/** Right-side sheet, portaled so fixed positioning is never broken by a parent. */
export function Sheet({ title, sub, onClose, children, footer }: { title: string; sub?: string; onClose: () => void; children: ReactNode; footer: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return createPortal(
    <div className="hms-app fixed inset-0 z-[90] flex justify-end bg-black/25" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="onb-in flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-hms-line px-5 py-4">
          <div className="flex-1"><h2 className="text-[18px] font-bold">{title}</h2>{sub && <p className="text-[13.5px] text-hms-muted">{sub}</p>}</div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex gap-2 border-t border-hms-line px-5 py-3">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}
