import { notFound } from "next/navigation";
import { PLAN_RULES, getHotel } from "@/lib/data";
import { THEME_HOMES } from "@/themes/registry";
import { MasterSwitch } from "@/components/site-draft/Draft";
import type { MasterTheme } from "@/lib/types";

// Every layout the plan allows is rendered; the site record (HMS → Website Management) picks which one shows.
export default async function HotelHome(props: PageProps<"/hotel/[slug]">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const allowed = PLAN_RULES[hotel.plan].masters as readonly MasterTheme[];
  const homes = Object.fromEntries(
    allowed.map((m) => {
      const Home = THEME_HOMES[m];
      return [m, <Home key={m} hotel={hotel} />];
    }),
  );
  return <MasterSwitch slug={hotel.slug} initial={hotel.theme.master} homes={homes} />;
}
