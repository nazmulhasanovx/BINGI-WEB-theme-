import { notFound } from "next/navigation";
import { getHotel } from "@/lib/data";
import { THEME_HOMES } from "@/themes/registry";

export default async function HotelHome(props: PageProps<"/hotel/[slug]">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const Home = THEME_HOMES[hotel.theme.master] ?? THEME_HOMES.grand;
  return <Home hotel={hotel} />;
}
