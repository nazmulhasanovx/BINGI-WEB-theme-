import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Briefcase, Car, ConciergeBell, Dumbbell, Footprints, MapPin, MessageCircle, Navigation, Presentation, Sparkles, Star, Waves, Wifi } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { formatMoney, showRating } from "@/lib/data";
import { presetFor } from "@/lib/presets";
import { SearchBar } from "@/components/booking/SearchBar";
import { HeroIn, PhotoIn, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Container, MobileMore, SectionHead } from "@/components/ui/Section";
import { ButtonLink } from "@/components/ui/Button";
import { OffersTeaser, QuickLinks, Reviews } from "@/components/sections/HomeSections";
import { T } from "@/lib/i18n";

const ICONS: Record<string, typeof Waves> = { waves: Waves, presentation: Presentation, dumbbell: Dumbbell, wifi: Wifi, car: Car, concierge: ConciergeBell };

/** CITY (Business): premium, fast, practical — split hero with the booking card, location times, meetings. */
export function CityHome({ hotel }: { hotel: Hotel }) {
  const preset = presetFor(hotel.propertyType);
  return (
    <>
      <CityHero hotel={hotel} />
      <QuickLinks hotel={hotel} />
      <Highlights hotel={hotel} />
      <CityRooms hotel={hotel} />
      <Nearby hotel={hotel} />
      {preset.sections.meetings && <Meetings hotel={hotel} />}
      <OffersTeaser hotel={hotel} />
      <Reviews hotel={hotel} />
      <div className="h-10 md:h-20" />
    </>
  );
}

/* ---------- Hero: split on desktop (text + booking left, photo right); app card on phone ---------- */
function CityHero({ hotel }: { hotel: Hotel }) {
  const beach = hotel.nearby?.[0];
  return (
    <section className="relative overflow-hidden md:bg-surface">
      <div className="mx-auto grid max-w-[1240px] md:grid-cols-[1.05fr_1fr] md:items-center md:gap-10 md:px-6 md:py-12 lg:py-16">
        {/* photo (right on desktop, first on phone) */}
        <div className="relative mx-3 mt-2 h-[clamp(240px,36svh,330px)] overflow-hidden rounded-[22px] md:order-2 md:mx-0 md:mt-0 md:h-[clamp(440px,58vh,560px)]">
          <PhotoIn className="absolute inset-0">
            <Image src={hotel.heroPhoto} alt={hotel.name} fill priority fetchPriority="high" sizes="(max-width: 768px) 100vw, 50vw" quality={85} className="object-cover" />
          </PhotoIn>
          <div className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2 md:inset-x-auto md:bottom-5 md:left-5">
            {showRating(hotel) && (
              <span className="flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-semibold backdrop-blur md:px-3 md:py-1.5 md:text-[13px]">
                <Star className="size-3.5 fill-brand text-brand" /> {hotel.reviewScore} · {hotel.reviewCount} reviews
              </span>
            )}
            {beach && (
              <span className="flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[12px] font-semibold backdrop-blur md:px-3 md:py-1.5 md:text-[13px]">
                {beach.mode === "walk" ? <Footprints className="size-3.5 text-action" /> : <Car className="size-3.5 text-action" />} {beach.name} · {beach.time}
              </span>
            )}
          </div>
        </div>

        {/* text + booking */}
        <div className="min-w-0 md:order-1">
          <HeroIn className="px-4 pt-4 md:px-0 md:pt-0" delay={0.1}>
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-action md:text-[13px]">
              <MapPin className="size-3.5" /> {hotel.area}, {hotel.city}
            </p>
            <h1 className="mt-1.5 text-[26px] font-bold leading-[1.12] md:mt-3 md:text-[44px] md:leading-[1.08] lg:text-[52px]">{hotel.tagline}</h1>
            <ul className="mt-5 hidden flex-wrap gap-2 md:flex">
              {hotel.highlights.map((h) => (
                <li key={h} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] font-semibold">{h}</li>
              ))}
            </ul>
          </HeroIn>
          <HeroIn className="mt-4 px-4 md:mt-8 md:px-0" delay={0.25}>
            <div className="[&_#stay-search]:shadow-card md:[&_#stay-search]:grid-cols-2 lg:[&_#stay-search]:grid-cols-2">
              <SearchBar />
            </div>
            <p className="mt-3 hidden text-[13px] text-muted md:block">
              <T>Free cancellation</T> · <T>Pay at the hotel</T> · Check-in {hotel.checkIn}
            </p>
          </HeroIn>
        </div>
      </div>
    </section>
  );
}

/* ---------- Highlights: what a business / city guest checks first ---------- */
function Highlights({ hotel }: { hotel: Hotel }) {
  const items = hotel.facilities.slice(0, 6);
  return (
    <Container className="mt-6 md:mt-14">
      <RevealGroup className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {items.map((f) => {
          const Icon = ICONS[f.icon] ?? Sparkles;
          return (
            <RevealItem key={f.name} className="w-[46%] shrink-0 snap-start sm:w-auto">
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-3.5 md:p-4">
                <Icon className="size-5 text-action" />
                <span className="text-[14px] font-semibold leading-tight md:text-[15px]">{f.name}</span>
                <span className="text-[12px] text-muted md:text-[13px]">{f.short}</span>
              </div>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </Container>
  );
}

/* ---------- Rooms: compact 4-up with price per night ---------- */
function CityRooms({ hotel }: { hotel: Hotel }) {
  const base = `/hotel/${hotel.slug}`;
  return (
    <section className="mt-9 md:mt-20">
      <Container>
        <Reveal>
          <SectionHead title={presetFor(hotel.propertyType).unitsLabel} link={{ href: `${base}/rooms`, label: "All rooms" }} />
        </Reveal>
      </Container>
      <RevealGroup className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:px-6 md:mx-auto md:grid md:max-w-[1240px] md:grid-cols-2 md:gap-4 md:overflow-visible lg:grid-cols-4">
        {hotel.rooms.map((r) => (
          <RevealItem key={r.id} className="w-[72%] max-w-[300px] shrink-0 snap-start md:w-auto md:max-w-none">
            <Link href={`${base}/rooms/${r.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-float active:scale-[0.99]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={r.photos[0]} alt={r.name} fill sizes="(max-width: 768px) 72vw, 300px" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                {r.view && <span className="absolute left-2.5 top-2.5 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-semibold">{r.view} view</span>}
              </div>
              <div className="flex flex-1 flex-col p-3.5 md:p-4">
                <h3 className="text-[16px] font-bold leading-snug">{r.name}</h3>
                <p className="mt-1 text-[12px] text-muted md:text-[13px]">{r.bed} · {r.sizeSqft} sq ft · {r.maxAdults} adults</p>
                <div className="mt-auto flex items-end justify-between pt-3">
                  <p>
                    <span className="text-[17px] font-bold tabular-nums">{formatMoney(r.fromPrice)}</span>
                    <span className="text-[12px] text-muted"> <T>/ night</T></span>
                  </p>
                  <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-action transition-colors group-hover:bg-action group-hover:text-on-action">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>
      <Container>
        <MobileMore href={`${base}/rooms`} label={`See all ${hotel.rooms.length} rooms`} />
      </Container>
    </section>
  );
}

/* ---------- Location: travel times + directions ---------- */
function Nearby({ hotel }: { hotel: Hotel }) {
  if (!hotel.nearby?.length) return null;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`;
  return (
    <section className="mt-9 md:mt-20">
      <Container>
        <Reveal className="overflow-hidden rounded-[22px] border border-line bg-surface md:grid md:grid-cols-[1fr_1.1fr]">
          <div className="p-5 md:p-8">
            <h2 className="text-[20px] font-bold md:text-[28px]">{hotel.area}</h2>
            <p className="mt-1 flex gap-1.5 text-[14px] text-muted"><MapPin className="mt-0.5 size-4 shrink-0" /> {hotel.address}</p>
            <ul className="mt-5 divide-y divide-line">
              {hotel.nearby.map((n) => (
                <li key={n.name} className="flex items-center justify-between gap-3 py-3">
                  <span className="flex items-center gap-3 text-[15px]">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-action">
                      {n.mode === "walk" ? <Footprints className="size-[18px]" /> : <Car className="size-[18px]" />}
                    </span>
                    {n.name}
                  </span>
                  <span className="text-[14px] font-semibold tabular-nums">{n.time}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={maps}><Navigation className="size-4" /> <T>Get directions</T></ButtonLink>
              {hotel.services.some((s) => s.category === "transfer") && <ButtonLink href={`/hotel/${hotel.slug}/experiences`} variant="outline">Airport pickup</ButtonLink>}
            </div>
          </div>
          <div className="relative h-[170px] md:h-auto md:min-h-full">
            <Image src={hotel.gallery.find((g) => /beach/.test(g)) ?? hotel.pagePhotos.explore ?? hotel.gallery[0]} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- Meetings (hotel preset) ---------- */
function Meetings({ hotel }: { hotel: Hotel }) {
  const meet = hotel.services.find((s) => /meeting/i.test(s.name));
  const photo = meet?.photo ?? hotel.gallery.find((g) => /meeting|conference/.test(g));
  if (!meet && !photo) return null;
  const wa = hotel.whatsapp ? `https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I'd like a quote for a meeting room.")}` : `tel:${hotel.phone.replace(/[^+\d]/g, "")}`;
  return (
    <section className="mt-9 md:mt-20">
      <Container>
        <Reveal className="grid overflow-hidden rounded-[22px] bg-ink text-white md:grid-cols-2">
          {photo && (
            <div className="relative min-h-[200px] md:min-h-[320px]">
              <Image src={photo} alt="" fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover opacity-90" />
            </div>
          )}
          <div className="flex flex-col justify-center p-5 md:p-10">
            <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70"><Briefcase className="size-4" /> Business</p>
            <h2 className="mt-2 text-[22px] font-bold md:text-[30px]">Meeting rooms for 6 to 60</h2>
            {meet && <p className="mt-2 text-[15px] text-white/75">From {formatMoney(meet.price)} {meet.unit} · projector, Wi-Fi, tea</p>}
            <div className="mt-5">
              <a href={wa} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-ink active:scale-[0.98]">
                <MessageCircle className="size-4" /> Ask for a quote
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
