// Signature Collection — themed Rooms page: the theme's own header (type, colour, photo, wording) over the shared
// availability + pricing engine (RoomsResults), so search, dates and prices behave exactly like every other theme.
import Image from "next/image";
import { Suspense } from "react";
import type { Hotel } from "@/lib/types";
import { SearchBar } from "@/components/booking/SearchBar";
import { RoomsResults } from "@/components/rooms/RoomsResults";
import { ListSkeleton } from "@/components/ui/Skeleton";

const WORDS: Record<string, [string, string]> = {
  aurel: ["Accommodations", "Rooms for every stay."], courtyard: ["Accommodations", "Suites with character"], axis: ["Accommodations", "Stays for every business journey."],
  waypoint: ["Stay your way", "Rooms for the road"], shanti: ["Stay", "Our guest rooms"], reside: ["Apartments", "Find your ideal stay."],
  commons: ["Ways to stay", "Beds & rooms"], roots: ["Stay with us", "Our rooms"], morning: ["Rest well", "Our rooms"], matir: ["Stay", "Our cottages"],
};

export function SigRooms({ hotel }: { hotel: Hotel }) {
  const [kick, title] = WORDS[hotel.theme.master] ?? ["Stay", "Rooms"];
  return (
    <>
      <header className="relative overflow-hidden">
        <div className="relative h-[34svh] min-h-[240px] md:h-[380px]">
          <Image src={hotel.pagePhotos.rooms ?? hotel.heroPhoto} alt="" fill priority sizes="100vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1240px] px-4 pb-10 text-white sm:px-6 md:pb-16">
            <p className="sig-caps text-white/85">{kick} · {hotel.name}</p>
            <h1 className="lux-display mt-2 text-[44px] text-white md:text-[72px]">{title}</h1>
          </div>
        </div>
      </header>
      <div className="relative z-10 mx-auto -mt-8 hidden max-w-[1040px] px-6 md:block"><SearchBar /></div>
      <Suspense fallback={<ListSkeleton />}><RoomsResults hotel={hotel} /></Suspense>
    </>
  );
}
