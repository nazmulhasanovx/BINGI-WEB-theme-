import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHotel } from "@/lib/data";
import { PageHero } from "@/components/site/PageHero";
import { SearchBar } from "@/components/booking/SearchBar";
import { RoomsResults } from "@/components/rooms/RoomsResults";
import { ListSkeleton } from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Rooms & suites" };

export default async function RoomsPage(props: PageProps<"/hotel/[slug]/rooms">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  return (
    <>
      <PageHero eyebrow="Stay" title="Rooms, suites & villas" sub="Pick your dates to see what is free and the full price." photo={hotel.rooms[1]?.photos[0]} />
      <div className="relative z-10 mx-auto -mt-8 hidden max-w-[1040px] px-6 md:block">
        <SearchBar />
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <RoomsResults hotel={hotel} />
      </Suspense>
    </>
  );
}
