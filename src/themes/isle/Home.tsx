import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Hotel, RoomCategory } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";
import { SiteVisible } from "@/components/site-draft/Draft";
import { T } from "@/lib/i18n";
import { photo } from "../shared";
import { Amenities, Arrival, Dining, Experiences, Facts, Head, LuxHero, LuxPage, Mosaic, Quote, Reserve, RoomRows, Sec, Timeline, roomHref } from "../lux/kit";

/**
 * ISLE (Luxury Collection) — island and overwater villa resorts.
 * Airy sand-white page, light serif, villas grouped by where they stand (over water / on the beach), the day told by the tide.
 */
export function IsleHome({ hotel }: { hotel: Hotel }) {
  return (
    <LuxPage
      hotel={hotel}
      master="isle"
      parts={{
        hero: <LuxHero hotel={hotel} variant="center" />,
        facts: <Facts hotel={hotel} />,
        signature: <Waters hotel={hotel} />,
        rooms: (
          <Sec>
            <Container>
              <Head hotel={hotel} k="rooms.title" eyebrow="Villas" title="Twenty-two ways to be alone" center />
              <RoomRows hotel={hotel} />
            </Container>
          </Sec>
        ),
        journey: <Timeline hotel={hotel} items={hotel.dayPlan} eyebrow="The tide" title="A day, by the water" k="journey.title" center />,
        experiences: <Experiences hotel={hotel} eyebrow="On the island" title="Days worth remembering" />,
        dining: <Dining hotel={hotel} eyebrow="Dining" title="Fish from the morning boats" />,
        amenities: <Amenities hotel={hotel} />,
        gallery: <Mosaic hotel={hotel} eyebrow="The island" title="Blue, from every side" />,
        reviews: <Quote hotel={hotel} />,
        arrival: <Arrival hotel={hotel} src={photo(hotel, /jetty/)} eyebrow="Arrival" title="By speedboat, forty minutes" />,
        reserve: <Reserve hotel={hotel} src={photo(hotel, /sunset/)} title="The lagoon is waiting" />,
      }}
    />
  );
}

const overWater = (r: RoomCategory) => /water|lagoon|reef/i.test(r.view ?? "");

/** Signature: villas grouped by where they stand. */
function Waters({ hotel }: { hotel: Hotel }) {
  const groups = [
    { key: "water", label: "Over the water", line: "On stilts above the lagoon. Sea steps from your deck.", rooms: hotel.rooms.filter(overWater), src: photo(hotel, /villas-row|walkway/) },
    { key: "beach", label: "On the beach", line: "Garden villas in the palms, the sand at your door.", rooms: hotel.rooms.filter((r) => !overWater(r)), src: photo(hotel, /palm|beach/) },
  ].filter((g) => g.rooms.length);
  if (!groups.length) return null;
  return (
    <Sec>
      <Container>
        <Reveal><Head hotel={hotel} k="signature.title" eyebrow="Where you'll stay" title="Choose your water" center /></Reveal>
        <RevealGroup className="grid gap-5 md:grid-cols-2 md:gap-7">
          {groups.map((g) => (
            <RevealItem key={g.key} className="relative overflow-hidden rounded-[var(--lux-r)] text-white">
              <div className="absolute inset-0"><Image src={g.src} alt="" fill sizes="(max-width: 768px) 100vw, 620px" className="object-cover" /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5" />
              <div className="relative flex min-h-[460px] flex-col justify-end p-6 md:min-h-[600px] md:p-10">
                <p className="lux-eyebrow !text-white/85">{g.rooms.length} <T>{g.rooms.length === 1 ? "villa type" : "villa types"}</T></p>
                <h3 className="lux-display mt-3 text-[38px] text-white md:text-[52px]"><T>{g.label}</T></h3>
                <p className="mt-2 max-w-[420px] text-[15.5px] text-white/85"><T>{g.line}</T></p>
                <ul className="mt-6 divide-y divide-white/25 border-t border-white/25">
                  {g.rooms.map((r) => (
                    <SiteVisible key={r.id} slug={hotel.slug} kind="rooms" id={r.id}>
                      <li>
                        <Link href={roomHref(hotel, r)} className="group flex items-center justify-between gap-4 py-3.5">
                          <span className="text-[16px] font-semibold">{r.name}</span>
                          <span className="flex shrink-0 items-center gap-2 text-[14px] tabular-nums text-white/90">{formatMoney(r.fromPrice)}<ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden /></span>
                        </Link>
                      </li>
                    </SiteVisible>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Sec>
  );
}
