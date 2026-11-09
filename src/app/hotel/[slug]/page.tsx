import { notFound } from "next/navigation";
import { getHotel } from "@/lib/data";
import { Hero } from "@/components/home/Hero";
import { DineAndDo, FactsStrip, FeaturedStays, LocationBlock, OffersTeaser, Reviews } from "@/components/home/Sections";

export default async function HotelHome(props: PageProps<"/hotel/[slug]">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();

  return (
    <>
      <Hero hotel={hotel} />
      <FactsStrip hotel={hotel} />
      <FeaturedStays hotel={hotel} />
      <DineAndDo hotel={hotel} />
      <OffersTeaser hotel={hotel} />
      <Reviews hotel={hotel} />
      <LocationBlock hotel={hotel} />
    </>
  );
}
