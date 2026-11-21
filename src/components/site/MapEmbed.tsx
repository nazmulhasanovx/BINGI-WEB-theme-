"use client";
// Map that loads only when the guest asks for it (no Google request, cookies or weight until then).
// Uses the public Google Maps embed (no API key). Production: hotel's exact pin from HMS → Property → Location.
import { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { T } from "@/lib/i18n";

export function MapEmbed({ hotel, className = "" }: { hotel: Hotel; className?: string }) {
  const [on, setOn] = useState(false);
  const q = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
  const open = hotel.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${q}`;
  return (
    <div className={`relative overflow-hidden bg-brand-soft ${className}`}>
      {on ? (
        <iframe title={`Map: ${hotel.name}`} src={`https://www.google.com/maps?q=${q}&output=embed`} className="absolute inset-0 size-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      ) : (
        <>
          <svg className="absolute inset-0 size-full text-brand-ring" aria-hidden>
            <defs><pattern id="mapgrid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0H0V36" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#mapgrid)" />
          </svg>
          <div className="relative flex h-full min-h-[inherit] flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-action text-on-action shadow-float"><MapPin className="size-6" /></span>
            <p className="max-w-[260px] text-[15px] font-semibold">{hotel.area}, {hotel.city}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setOn(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-[14px] font-semibold shadow-card"><T>Show map</T></button>
              <a href={open} target="_blank" rel="noopener" className="inline-flex h-11 items-center gap-2 rounded-full bg-surface px-4 text-[14px] font-semibold shadow-card"><Navigation className="size-4" /> <T>Directions</T></a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
