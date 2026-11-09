"use client";

import Image from "next/image";
import clsx from "clsx";
import { CalendarDays, Users } from "lucide-react";
import type { Hotel } from "@/lib/types";
import type { Quote, StayDraft } from "@/lib/pricing";
import { ratePlans } from "@/lib/pricing";
import { formatMoney } from "@/lib/data";
import { shortDate } from "@/components/booking/BookingProvider";
import { guestLabel } from "@/components/booking/SearchFields";

export function StayHeader({ hotel, stay, compact }: { hotel: Hotel; stay: StayDraft; compact?: boolean }) {
  const room = hotel.rooms.find((r) => r.slug === stay.roomSlug);
  const plan = ratePlans(hotel).find((p) => p.id === stay.plan);
  if (!room) return null;
  return (
    <div className="flex gap-4">
      <span className={clsx("relative shrink-0 overflow-hidden rounded-2xl", compact ? "size-20" : "size-24 md:h-28 md:w-36")}>
        <Image src={room.photos[0]} alt={room.name} fill sizes="144px" className="object-cover" />
      </span>
      <div className="min-w-0">
        <p className="font-bold leading-snug">{room.name}</p>
        <p className="text-[13px] text-muted">{plan?.name}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted"><CalendarDays className="size-4" /> {shortDate(stay.checkIn)} – {shortDate(stay.checkOut)}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted"><Users className="size-4" /> {guestLabel(stay.adults, stay.children)}</p>
      </div>
    </div>
  );
}

export function PriceLines({ q, dueNow }: { q: Quote; dueNow?: number }) {
  return (
    <dl className="space-y-1.5 text-[14px]">
      {q.lines.map((l) => (
        <div key={l.label} className={clsx("flex justify-between gap-3", l.kind === "discount" && "text-emerald-700", l.kind === "tax" && "text-muted")}>
          <dt className="min-w-0">{l.label}</dt>
          <dd className="shrink-0 tabular-nums">{l.amount < 0 ? "−" : ""}{formatMoney(Math.abs(l.amount))}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-bold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(q.total)}</dd>
      </div>
      {dueNow !== undefined && (
        <div className="flex justify-between rounded-xl bg-brand-soft px-3 py-2 font-semibold text-action">
          <dt>Pay now</dt>
          <dd className="tabular-nums">{formatMoney(dueNow)}</dd>
        </div>
      )}
    </dl>
  );
}

export function EmptyStay({ base }: { base: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-action"><CalendarDays className="size-7" /></span>
      <h1 className="mt-5 text-2xl font-bold">No room selected yet</h1>
      <p className="mt-2 text-muted">Pick your dates and a room first. Your selection stays here while you browse.</p>
      <a href={`${base}/rooms`} className="mt-6 inline-flex h-12 items-center rounded-full bg-action px-6 font-semibold text-on-action">See rooms</a>
    </div>
  );
}
