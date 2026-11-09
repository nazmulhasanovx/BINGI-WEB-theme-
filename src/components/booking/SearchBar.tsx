"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { shortDate, useBooking } from "./BookingProvider";
import { DateField, GuestIcon, GuestSteppers, guestLabel } from "./SearchFields";

/** Tablet + desktop: inline floating bar. Phone: one pill that opens the bottom sheet. */
export function SearchBar() {
  const { search, submit, openSearch } = useBooking();
  const [guestsOpen, setGuestsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!guestsOpen) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setGuestsOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [guestsOpen]);

  return (
    <>
      {/* phone */}
      <button
        onClick={openSearch}
        className="flex w-full items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 text-left shadow-float md:hidden"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-action">
          <CalendarDays className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">
            {search.checkIn ? `${shortDate(search.checkIn)} – ${shortDate(search.checkOut)}` : "Add your dates"}
          </span>
          <span className="block truncate text-sm text-muted">{guestLabel(search.adults, search.children)}</span>
        </span>
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-action text-on-action">
          <Search className="size-5" />
        </span>
      </button>

      {/* tablet + desktop */}
      <form
        id="stay-search"
        aria-label="Check availability"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="hidden rounded-[28px] border border-line bg-surface p-2 shadow-float md:grid md:grid-cols-[1fr_1fr] md:gap-1 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-center"
      >
        <DateField which="checkIn" />
        <div className="lg:border-l lg:border-line">
          <DateField which="checkOut" />
        </div>
        <div ref={ref} className="relative md:border-t md:border-line lg:border-l lg:border-t-0">
          <button type="button" onClick={() => setGuestsOpen((v) => !v)} aria-expanded={guestsOpen} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left hover:bg-canvas">
            <GuestIcon />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-muted">Guests</span>
              <span className="block truncate text-[15px] font-semibold">{guestLabel(search.adults, search.children)}</span>
            </span>
            <ChevronDown className="size-4 text-muted" />
          </button>
          {guestsOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-3xl border border-line bg-surface px-4 shadow-float lg:left-auto lg:w-80">
              <GuestSteppers />
            </div>
          )}
        </div>
        <div className="flex items-center p-1 md:border-t md:border-line lg:border-t-0">
          <Button type="submit" size="lg" className="w-full lg:w-auto">
            <Search className="size-5" /> Check rooms
          </Button>
        </div>
      </form>
    </>
  );
}
