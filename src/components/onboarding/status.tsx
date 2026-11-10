"use client";
// WAIT-01 approval status. Hybrid gate: HMS opens right away in setup mode; public listing + online payment wait for approval.
import Link from "next/link";
import clsx from "clsx";
import { useSyncExternalStore } from "react";
import { Check, Clock, Globe, LayoutGrid, Lock, Wallet } from "lucide-react";
import { PLANS, TRIAL_DAYS, hotelOf, trialLeft, useOnboarding, type Status } from "@/lib/onboarding/store";
import { useRooms } from "@/lib/rooms/store";
import { setProperty } from "../hms/property";
import { Header } from "./shell";

const noop = () => () => {};
export const STATUS_LABEL: Record<Status, string> = { draft: "Not submitted", pending: "Waiting for BinGi approval", "needs-changes": "Needs changes", approved: "Approved" };

export function OnboardingStatus() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  return (
    <div className="min-h-dvh bg-[#f6f7f9]">
      <Header right={<Link href="/onboarding" className="inline-flex h-9 items-center rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium hover:bg-[#f6f7f9]">Your properties</Link>} />
      {!ready ? <p className="p-8 text-[14px] text-[#5b6170]" role="status">Loading…</p> : !draft || draft.status === "draft"
        ? <div className="p-8"><p className="text-[16px] font-semibold">This property is not submitted yet.</p><Link href="/onboarding/flow" className="mt-3 inline-block font-medium text-[#c8232e]">Continue setup</Link></div>
        : <Body />}
    </div>
  );
}

function Body() {
  const { draft: d, edit } = useOnboarding();
  const h = hotelOf(d!);
  const rooms = useRooms(h);
  if (!d) return null;
  const approved = d.status === "approved";
  const steps = [
    { label: "Submitted", ok: true },
    { label: "BinGi review", ok: approved, now: d.status === "pending" || d.status === "needs-changes" },
    { label: "Approved", ok: approved },
  ];
  const decide = (s: Status) => {
    edit((x) => { x.status = s; x.note = s === "needs-changes" ? "Please upload a clearer trade licence photo." : undefined; });
    if (s === "approved") rooms.update((st) => { st.categories.forEach((c) => { c.approval = "approved"; }); }, "Categories approved with the property (demo of BinGi review)");
  };
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <p className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold", approved ? "bg-[#eef8f1] text-[#1c6b3c]" : "bg-[#fdf6e7] text-[#7a4a0b]")}>{approved ? <Check className="size-4" /> : <Clock className="size-4" />}{STATUS_LABEL[d.status]}</p>
      <h1 className="mt-3 text-[28px] font-bold tracking-[-0.015em]">{d.name || "Untitled property"}</h1>
      <p className="mt-1 text-[15px] text-[#5b6170]">{PLANS[d.plan].label} plan · free trial: {trialLeft(d)} of {TRIAL_DAYS} days left</p>

      <ol className="mt-6 flex items-center gap-2" aria-label="Approval progress">
        {steps.map((s, i) => (
          <li key={s.label} className="flex flex-1 items-center gap-1.5 sm:gap-2">
            <span className={clsx("grid size-7 shrink-0 place-items-center rounded-full text-[12.5px] font-semibold", s.ok ? "bg-[#1c7d45] text-white" : s.now ? "bg-[#d8372e] text-white" : "bg-[#eef0f3] text-[#5b6170]")}>{s.ok ? <Check className="size-4" /> : i + 1}</span>
            <span className="whitespace-nowrap text-[13.5px] font-medium sm:text-[14px]">{s.label}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-[#e3e6eb]" />}
          </li>
        ))}
      </ol>

      {d.status === "needs-changes" && (
        <div role="alert" className="mt-6 rounded-2xl border border-[#f3c7c3] bg-[#fdf3f2] p-4">
          <p className="font-semibold text-[#9b241d]">BinGi asked for a change</p>
          <p className="mt-1 text-[14.5px] text-[#9b241d]">{d.note}</p>
          <Link href="/onboarding/flow" onClick={() => edit((x) => { x.step = "6.2"; })} className="mt-3 inline-flex h-10 items-center rounded-xl bg-[#1d1f24] px-4 text-[14.5px] font-medium text-white">Fix and resubmit</Link>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Gate icon={LayoutGrid} title="HMS" on text="Open now in setup mode" />
        <Gate icon={Globe} title="Website & listing" on={approved && !!d.site.theme} text={approved ? (d.site.theme ? "Ready to publish" : "Choose a theme in HMS") : "Opens after approval"} />
        <Gate icon={Wallet} title="Online payment" on={false} text={approved ? "Apply in Settings → Connectivity" : "After approval + verification"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/hms" onClick={() => setProperty(d.slug)} className="inline-flex h-11 items-center rounded-xl bg-gradient-to-b from-[#e2483f] to-[#c8232e] px-5 text-[15px] font-semibold text-white">Open HMS</Link>
        {d.status === "needs-changes" ? null : <button onClick={() => edit((x) => { x.status = "draft"; x.step = "6.3"; })} className="h-11 rounded-xl border border-[#dfe2e8] bg-white px-4 text-[15px] font-medium hover:bg-[#f6f7f9]">Edit setup</button>}
      </div>

      <div className="mt-10 rounded-2xl border border-dashed border-[#d6d9e0] p-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#666d7a]">Prototype only — BinGi review (Super Admin)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => decide("approved")} className="h-9 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium">Approve</button>
          <button onClick={() => decide("needs-changes")} className="h-9 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium">Ask for changes</button>
          <button onClick={() => decide("pending")} className="h-9 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium">Back to pending</button>
        </div>
      </div>
    </main>
  );
}

function Gate({ icon: I, title, text, on }: { icon: typeof Lock; title: string; text: string; on: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2] sm:block">
      <span className={clsx("grid size-9 shrink-0 place-items-center rounded-xl", on ? "bg-[#eef8f1] text-[#1c7d45]" : "bg-[#f2f3f6] text-[#666d7a]")}>{on ? <I className="size-5" /> : <Lock className="size-[18px]" />}</span>
      <div className="sm:mt-3"><p className="text-[15px] font-semibold">{title}</p>
      <p className="text-[13.5px] text-[#5b6170]">{text}</p></div>
    </div>
  );
}
