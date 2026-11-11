"use client";
import Link from "next/link";
import { ArrowRight, Hammer } from "lucide-react";
import { ALL_ITEMS } from "./Shell";

/** What each not-yet-designed module does (same page header as built modules). */
const ABOUT: Record<string, [string, string]> = {
  bookings: ["Reservations, calendar and check-in / check-out.", "Live in HMS"],
  housekeeping: ["Room cleaning status, tasks and inspections.", "Live in HMS"],
  chat: ["Messages with guests and the team.", "Live in HMS"],
  meals: ["Restaurant & bar orders, menu, KOT and QR ordering.", "Live in HMS"],
  discounts: ["Promo codes and seasonal offers.", "Live in HMS"],
  payments: ["Payments received, refunds and payment methods.", "Live in HMS"],
  cashbox: ["Daily cash drawer: open, cash in/out, close.", "Live in HMS"],
  finance: ["Income, expenses and accounts.", "Live in HMS"],
  operations: ["Daily operations overview.", "Live in HMS"],
  billing: ["Your BinGi plan, invoices and subscription.", "Live in HMS"],
  reports: ["Occupancy, revenue and performance reports.", "Live in HMS"],
  communication: ["SMS, email and WhatsApp messaging to guests.", "Live in HMS"],
  settings: ["Property, team roles, taxes and connections.", "Live in HMS"],
};
const DONE = [["Dashboard", "/hms"], ["Room / Accommodation", "/hms/rooms"], ["Discounts & Rates", "/hms/discounts"], ["Cashbox", "/hms/cashbox"], ["Restaurant & Bar", "/hms/meals"], ["Guests", "/hms/guests"], ["Staff", "/hms/staff"], ["Inventory", "/hms/inventory"], ["Other Services", "/hms/other-services"], ["Website", "/hms/website/overview"]];

/** Modules not built in this repo yet. Truthful: no fake data — says where the module lives today. */
export function ModulePlaceholder({ id }: { id: string }) {
  const item = ALL_ITEMS.find((i) => i.id === id);
  const [about, where] = ABOUT[id] ?? ["", "Live in HMS"];
  return (
    <div className="h-full overflow-y-auto"><div className="hms-page">
      <h1 className="text-[24px] font-bold tracking-[-0.01em]">{item?.label ?? "Module"}</h1>
      <p className="text-[14px] text-hms-muted">{about}</p>
      <section className="mt-5 rounded-xl border border-hms-line bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-hms-hover text-hms-muted"><Hammer className="size-6" /></span>
          <div className="flex-1">
            <p className="flex flex-wrap items-center gap-2 text-[16px] font-bold">Not redesigned yet <span className="rounded-md bg-[#e5f5ec] px-2 py-0.5 text-[12px] font-semibold text-[#16693a]">{where}</span></p>
            <p className="mt-1 max-w-[560px] text-[14px] text-[#4d5664]">This module works today in the live HMS (hms.bingi.app). In this design prototype only the shell is here — it will be redesigned inside the same frame.</p>
          </div>
        </div>
        <div className="mt-6 border-t border-hms-line pt-5">
          <p className="text-[13px] font-semibold text-hms-muted">Redesigned in this prototype</p>
          <div className="mt-2 flex flex-wrap gap-2">{DONE.map(([l, h]) => <Link key={h} href={h} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hms-line px-3 text-[13.5px] font-medium hover:bg-hms-hover">{l}<ArrowRight className="size-3.5 text-hms-muted" /></Link>)}</div>
        </div>
      </section>
    </div></div>
  );
}
