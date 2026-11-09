import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHotel, formatMoney, listHotelSlugs } from "@/lib/data";
import { ThemeScope } from "@/components/theme/ThemeScope";
import { ThemePreview } from "@/components/theme/ThemePreview";
import { BookingProvider } from "@/components/booking/BookingProvider";
import { TopBar } from "@/components/site/TopBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileBookBar } from "@/components/site/MobileBookBar";
import { buildNav } from "@/components/site/nav";
import { SitePaused } from "@/components/site/SitePaused";

export function generateStaticParams() {
  return listHotelSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata(props: LayoutProps<"/hotel/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const h = await getHotel(slug);
  if (!h) return {};
  return {
    title: { default: `${h.name} — ${h.area}, ${h.city}`, template: `%s · ${h.name}` },
    description: h.intro,
    openGraph: { title: h.name, description: h.tagline, images: [h.heroPhoto] },
  };
}

export default async function HotelLayout(props: LayoutProps<"/hotel/[slug]">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();

  if (hotel.status === "paused")
    return (
      <ThemeScope themeId={hotel.theme.id} heading={hotel.theme.heading}>
        <SitePaused hotel={hotel} />
      </ThemeScope>
    );

  const nav = buildNav(hotel);
  const base = `/hotel/${hotel.slug}`;
  const minPrice = Math.min(...hotel.rooms.map((r) => r.fromPrice));

  return (
    <ThemeScope themeId={hotel.theme.id} heading={hotel.theme.heading}>
      <BookingProvider
        slug={hotel.slug}
        maxAdults={Math.max(...hotel.rooms.map((r) => r.maxAdults)) * 2}
        maxChildren={Math.max(...hotel.rooms.map((r) => r.maxChildren)) * 2}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-full focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float">
          Skip to content
        </a>
        <TopBar hotel={hotel} />
        <SiteHeader nav={nav} logoText={hotel.logoText} phone={hotel.phone} whatsapp={hotel.whatsapp} base={base} />
        <main id="main">{props.children}</main>
        <SiteFooter hotel={hotel} nav={nav} />
        <MobileBookBar fromLabel={formatMoney(minPrice)} />
        <Suspense>
          <ThemePreview defaultTheme={hotel.theme.id} />
        </Suspense>
      </BookingProvider>
    </ThemeScope>
  );
}
