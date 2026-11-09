"use client";

import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Search } from "lucide-react";
import { nights, useBooking } from "./BookingProvider";
import { DateField, GuestSteppers } from "./SearchFields";

export function SearchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { search, submit } = useBooking();
  const n = nights(search);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your stay"
      footer={
        <Button size="lg" className="w-full" onClick={submit}>
          <Search className="size-5" /> {n ? `See rooms · ${n} night${n > 1 ? "s" : ""}` : "See rooms"}
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
      <p className="mt-3 text-sm text-muted">Prices and free rooms update after you pick dates.</p>
    </Sheet>
  );
}
