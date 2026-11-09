"use client";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useBooking } from "./BookingProvider";

/** Tablet/desktop with an inline search bar on the page → focus it. Otherwise open the sheet. */
export function OpenSearchButton({ label = "Book your stay" }: { label?: string }) {
  const { openSearch } = useBooking();
  const go = () => {
    const bar = document.getElementById("stay-search");
    const input = bar?.querySelector("input");
    if (bar && input && bar.offsetParent !== null) {
      bar.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus({ preventScroll: true });
      try {
        (input as HTMLInputElement).showPicker?.();
      } catch {}
      return;
    }
    openSearch();
  };
  return (
    <Button size="lg" onClick={go}>
      <CalendarDays className="size-5" /> {label}
    </Button>
  );
}
