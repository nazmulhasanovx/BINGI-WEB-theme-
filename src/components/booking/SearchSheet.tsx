"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";
import { nights, useBooking } from "./BookingProvider";
import { DateField, GuestSteppers } from "./SearchFields";
import { useT } from "@/lib/i18n";

export function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { search, submit } = useBooking();
  const n = nights(search);
  const t = useT();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("Your stay")}
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          <Search className="size-5" /> {n ? `${t("See rooms")} · ${n} night${n > 1 ? "s" : ""}` : t("See rooms")}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-2 rounded-3xl border border-line p-1.5">
        <DateField which="checkIn" compact />
        <DateField which="checkOut" compact />
      </div>
      <div className="mt-4 rounded-3xl border border-line px-4">
        <GuestSteppers />
      </div>
    </Sheet>
  );
}
