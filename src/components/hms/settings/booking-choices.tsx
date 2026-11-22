"use client";
// Settings › How guests book (22 Nov 2026). Live HMS "Booking Requests" (marketplace only) — now for the website and
// the marketplace: full payment, partial advance, booking request. At least one choice stays on per channel.
// Website checkout reads this (lib/site-rules). Marketplace: saved here; the marketplace app is a separate product.
import clsx from "clsx";
import { useContext, useState } from "react";
import { CreditCard, MessageSquareText, SlidersHorizontal } from "lucide-react";
import { bookingOf, type BookCh } from "@/lib/settings/store";
import { Badge, Card, PageHead, Toggle } from "../website/ui";
import { SCtx } from "./pages";

type Ch = "website" | "marketplace";
const OPTS = [
  { k: "full", icon: CreditCard, title: "Full payment", desc: "Guest pays the whole stay online. Booking is confirmed at once.", best: "Sure money, fewer no-shows" },
  { k: "partial", icon: SlidersHorizontal, title: "Advance payment", desc: "Guest pays a part now, the rest at the hotel.", best: "Commitment now, flexible for the guest" },
  { k: "request", icon: MessageSquareText, title: "Booking request", desc: "Guest sends a request. You confirm, decline or call back.", best: "Price talks, groups, special requests" },
] as const;
const tk = (n: number) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

export function BookingChoicesPage() {
  const { s, save, toast } = useContext(SCtx)!;
  const saved = bookingOf(s);
  const [d, setD] = useState(saved);
  const [tab, setTab] = useState<Ch>("website");
  const [err, setErr] = useState("");
  const dirty = JSON.stringify(d) !== JSON.stringify(saved);
  const shown: Ch = tab === "marketplace" && d.same ? "website" : tab;
  const c = d[shown];
  const set = (patch: Partial<BookCh>) => {
    const n = { ...c, ...patch };
    if (!n.full && !n.partial && !n.request) { setErr("At least one choice must stay on."); return; }
    setErr(""); setD({ ...d, [shown]: n, ...(shown === "website" && d.same ? { marketplace: n } : {}) });
  };
  const locked = tab === "marketplace" && d.same;
  const example = 10000;
  return (
    <>
      <PageHead title="How guests book" desc="What a guest can do when booking online." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Channel" className="inline-flex rounded-full bg-[#eef0f3] p-1">
          {(["website", "marketplace"] as Ch[]).map((x) => <button key={x} role="tab" aria-selected={tab === x} onClick={() => { setTab(x); setErr(""); }} className={clsx("h-9 rounded-full px-5 text-[14px] font-semibold", tab === x ? "bg-white text-hms-ink shadow-[0_1px_3px_rgb(0_0_0/0.1)]" : "text-hms-muted")}>{x === "website" ? "Your website" : "BinGi Marketplace"}</button>)}
        </div>
        {tab === "marketplace" && <label className="ml-auto flex items-center gap-2.5 text-[14px] font-medium">Same as website<Toggle label="Marketplace same as website" on={d.same} onChange={(v) => setD({ ...d, same: v, marketplace: v ? { ...d.website } : d.marketplace })} /></label>}
      </div>
      {locked && <p className="mb-3 rounded-xl bg-[#f4f6f8] px-4 py-2.5 text-[13.5px] text-hms-muted">The marketplace uses your website choices. Turn off “Same as website” to set it apart.</p>}

      <div className={clsx("grid gap-3 md:grid-cols-3", locked && "pointer-events-none opacity-60")} aria-disabled={locked || undefined}>
        {OPTS.map((o) => {
          const on = c[o.k];
          return (
            <section key={o.k} aria-label={o.title} className={clsx("flex flex-col rounded-2xl border bg-white p-4 transition-colors", on ? "border-[#f0b8b2] shadow-[inset_0_0_0_1px_#f0b8b2]" : "border-hms-line")}>
              <div className="flex items-start gap-3">
                <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-[#fdecea] text-[#c8232e]" : "bg-[#f1f2f5] text-hms-muted")}><o.icon className="size-5" /></span>
                <div className="min-w-0 flex-1"><p className="text-[15px] font-semibold">{o.title}</p><p className="mt-0.5 text-[13px] leading-snug text-hms-muted">{o.desc}</p></div>
                <Toggle label={`${o.title} on ${tab}`} on={on} onChange={(v) => set({ [o.k]: v } as Partial<BookCh>)} />
              </div>
              {o.k === "partial" && on && (
                <div className="mt-3 rounded-xl bg-[#f7f8fa] px-3 py-2.5 text-[14px]">
                  <span className="flex items-center gap-1.5">Advance<input inputMode="numeric" aria-label={`Advance percent on ${tab}`} value={String(c.pct)} onChange={(e) => set({ pct: Math.min(100, Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0)) })} className="h-9 w-16 rounded-lg border border-hms-line bg-white text-center font-semibold tabular-nums outline-none focus:border-hms-coral" />%</span>
                  <span className="mt-1 block text-[12.5px] text-hms-muted">On a {tk(example)} stay: {tk(example * c.pct / 100)} now, {tk(example - example * c.pct / 100)} at the hotel.</span>
                </div>
              )}
              <p className="mt-auto pt-3 text-[12.5px] text-hms-muted">Best for: {o.best}</p>
            </section>
          );
        })}
      </div>
      {err && <p role="alert" className="mt-3 text-[13.5px] font-medium text-[#a3261f]">{err}</p>}

      <Card title="What the guest sees" className="mt-4">
        <ul className="space-y-2" aria-label="Guest checkout preview">
          {OPTS.filter((o) => c[o.k]).map((o) => (
            <li key={o.k} className="flex items-center gap-3 rounded-xl border border-hms-line px-4 py-3">
              <span className="size-4 shrink-0 rounded-full border-2 border-[#b8bdc7]" aria-hidden />
              <span className="text-[14.5px]"><b className="font-semibold">{o.k === "full" ? "Pay in full now" : o.k === "partial" ? `Pay ${c.pct}% now` : "Request to book"}</b> <span className="text-hms-muted">· {o.k === "full" ? "bKash, Nagad or card" : o.k === "partial" ? "rest at the hotel" : "the hotel confirms first"}</span></span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] text-hms-muted">{tab === "website" ? "Your website checkout follows this now." : <>Saved for the marketplace. <Badge tone="amber">Prototype</Badge> The marketplace app reads it when connected.</>} Payment numbers come from Guest payments.</p>
      </Card>

      {dirty && (
        <div className="sticky bottom-3 z-10 mt-5 flex items-center gap-3 rounded-2xl border border-hms-line bg-white/95 px-4 py-3 shadow-[0_6px_24px_rgb(0_0_0/0.08)] backdrop-blur">
          <span className="flex-1 text-[14px] font-medium">Unsaved changes</span>
          <button onClick={() => { setD(saved); setErr(""); }} className="h-10 rounded-xl border border-hms-line px-4 text-[14px] font-semibold hover:bg-hms-hover">Discard</button>
          <button onClick={() => { save((x) => { x.booking = d; x.policy.websitePay = d.website.partial ? "advance" : d.website.full ? "full" : "hotel"; x.policy.advancePct = d.website.pct; }, "How guests book updated"); toast("Saved"); }} className="btn-glow h-10 rounded-xl px-5 text-[14px] font-semibold text-white">Save</button>
        </div>
      )}
    </>
  );
}
