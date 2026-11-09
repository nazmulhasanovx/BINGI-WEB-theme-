"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useBooking } from "@/components/booking/BookingProvider";

/** Phone + small tablet: sticky "from ৳X · Book" bar, appears after the hero. */
export function MobileBookBar({ fromLabel }: { fromLabel: string }) {
  const { openSearch } = useBooking();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 360);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div
      className={clsx(
        "pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 backdrop-blur-xl transition-transform duration-300 md:hidden",
        show ? "translate-y-0" : "translate-y-full",
      )}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Rooms from</p>
          <p className="truncate text-lg font-bold">
            {fromLabel} <span className="text-sm font-medium text-muted">/ night</span>
          </p>
        </div>
        <button onClick={openSearch} tabIndex={show ? 0 : -1} className="h-12 rounded-full bg-action px-7 font-semibold text-on-action active:scale-[0.98]">
          Book
        </button>
      </div>
    </div>
  );
}
