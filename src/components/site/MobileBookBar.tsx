"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useBooking } from "@/components/booking/BookingProvider";
import { useT } from "@/lib/i18n";

/** Phone + small tablet: sticky "from ৳X · Book" bar, appears after the hero. */
export function MobileBookBar({ fromLabel }: { fromLabel: string }) {
  const { openSearch } = useBooking();
  const t = useT();
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  // pages with their own bottom action bar
  const hidden = /\/(rooms\/[^/]+|stay|checkout|confirmation|my-trip|events)(\/|$)/.test(pathname);

  useEffect(() => {
    const on = () => setShow(window.scrollY > 360);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  if (hidden) return null;

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
          <p className="text-xs text-muted">{t("Rooms from")}</p>
          <p className="truncate text-lg font-bold">
            {fromLabel} <span className="text-sm font-medium text-muted">{t("/ night")}</span>
          </p>
        </div>
        <button onClick={openSearch} tabIndex={show ? 0 : -1} className="h-12 rounded-full bg-action px-7 font-semibold text-on-action active:scale-[0.98]">
          {t("Book")}
        </button>
      </div>
    </div>
  );
}
