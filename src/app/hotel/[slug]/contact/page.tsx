import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getHotel } from "@/lib/data";
import { PageHero } from "@/components/site/PageHero";
import { MapEmbed } from "@/components/site/MapEmbed";
import { ContactForm } from "@/components/site/ContactForm";
import { T } from "@/lib/i18n";
import { telLink, waLink } from "@/themes/shared";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage(props: PageProps<"/hotel/[slug]/contact">) {
  const { slug } = await props.params;
  const hotel = await getHotel(slug);
  if (!hotel) notFound();
  const row = "flex min-h-14 items-center gap-4 py-3";
  const ic = "grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-action";
  return (
    <>
      <PageHero slug={hotel.slug} pageId="contact" title="Contact" />
      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-8 sm:px-6 md:py-14 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
        <div className="space-y-6">
          <ul className="divide-y divide-line rounded-3xl border border-line bg-surface px-5">
            <li><a href={telLink(hotel)} className={row}><span className={ic}><Phone className="size-5" /></span><span><span className="block text-[13px] text-muted"><T>Call</T></span><span className="font-semibold">{hotel.phone}</span></span></a></li>
            {hotel.whatsapp && <li><a href={waLink(hotel, `Hello ${hotel.name}`)} target="_blank" rel="noopener" className={row}><span className={ic}><MessageCircle className="size-5" /></span><span><span className="block text-[13px] text-muted">WhatsApp</span><span className="font-semibold">{hotel.whatsapp}</span></span></a></li>}
            <li><a href={`mailto:${hotel.email}`} className={row}><span className={ic}><Mail className="size-5" /></span><span className="min-w-0"><span className="block text-[13px] text-muted"><T>Email</T></span><span className="block break-all font-semibold">{hotel.email}</span></span></a></li>
            <li className={row}><span className={ic}><MapPin className="size-5" /></span><span><span className="block text-[13px] text-muted"><T>Address</T></span><span className="font-semibold">{hotel.address}</span></span></li>
            <li className={row}><span className={ic}><Clock className="size-5" /></span><span><span className="block text-[13px] text-muted"><T>Check-in / check-out</T></span><span className="font-semibold">{hotel.checkIn} · {hotel.checkOut}</span></span></li>
          </ul>
          <MapEmbed hotel={hotel} className="min-h-[300px] rounded-3xl border border-line" />
        </div>
        <ContactForm hotel={hotel} />
      </div>
    </>
  );
}
