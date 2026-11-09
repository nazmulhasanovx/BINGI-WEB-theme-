import type { Hotel } from "@/lib/types";
import { Hero } from "./Hero";
import { DineAndDo, FactsStrip, FeaturedStays, LocationBlock, OffersTeaser, QuickLinks, Reviews } from "@/components/sections/HomeSections";

/** GRAND (Ultra): luxury, photo-led, dining + experiences up front. */
export function GrandHome({ hotel }: { hotel: Hotel }) {
  return (
    <>
      <Hero hotel={hotel} />
      <QuickLinks hotel={hotel} />
      <FactsStrip hotel={hotel} />
      <FeaturedStays hotel={hotel} />
      <DineAndDo hotel={hotel} />
      <OffersTeaser hotel={hotel} />
      <Reviews hotel={hotel} />
      <LocationBlock hotel={hotel} />
    </>
  );
}
