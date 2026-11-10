import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Car, Footprints, Maximize2, Navigation, Star, Users } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { formatMoney, showRating } from "@/lib/data";
import { SearchBar } from "@/components/booking/SearchBar";
import { HeroIn, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";
import { OffersTeaser, Reviews } from "@/components/sections/HomeSections";
import { DraftSections, DraftText, SiteVisible } from "@/components/site-draft/Draft";
import { T } from "@/lib/i18n";
import { FxScope } from "@/fx/fx";
import { LivePhoto, Tilt } from "@/fx/effects";
import { mapsLink } from "../shared";
import { facIcon } from "../paid-shared";
import { FloorStack } from "./FloorStack";

/**
 * ORBIT (paid · Tier C) — city and tower hotels.
 * 3D photo of the tower (FX2), a 3D floor stack from the real room setup (FX4), depth room cards (FX1).
 */
export function OrbitHome({ hotel }: { hotel: Hotel }) {
  return (
    <FxScope slug={hotel.slug} theme="orbit">
      <DraftSections
        slug={hotel.slug}
        master="orbit"
        items={[
          { id: "hero", node: <Hero hotel={hotel} /> },
          { id: "floors", node: <Floors hotel={hotel} /> },
          { id: "rooms", node: <Rooms hotel={hotel} /> },
          { id: "amenities", node: <Amenities hotel={hotel} /> },
          { id: "location", node: <Location hotel={hotel} /> },
          { id: "offers", node: <OffersTeaser hotel={hotel} /> },
          { id: "reviews", node: <div className="pb-14 md:pb-20"><Reviews hotel={hotel} /></div> },
        ]}
      />
    </FxScope>
  );
}

function Head({ label, title }: { label: string; title: React.ReactNode }) {
  return (
    <div className="mb-6 md:mb-10">
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.22em] text-action md:text-[13px]"><T>{label}</T></p>
      <h2 className="mt-2 text-[30px] font-bold leading-[1.04] tracking-[-0.035em] md:text-[56px]">{typeof title === "string" ? <T>{title}</T> : title}</h2>
    </div>
  );
}

/* ---------- Hero: tower in 3D photo ---------- */
function Hero({ hotel }: { hotel: Hotel }) {
  const from = Math.min(...hotel.rooms.map((r) => r.fromPrice));
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[70%] bg-[radial-gradient(60%_80%_at_80%_0%,var(--brand-soft),transparent_70%)]" />
      <Container className="relative pt-6 md:pt-14">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12">
          <HeroIn delay={0.05} className="order-2 md:order-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-action">{hotel.type} · {hotel.area}, {hotel.city}</p>
            <h1 className="mt-3 text-[42px] font-bold leading-[0.98] tracking-[-0.045em] md:text-[80px]"><DraftText slug={hotel.slug} k="hero.title" fallback={hotel.tagline} /></h1>
            <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-muted md:text-[19px]"><DraftText slug={hotel.slug} k="hero.intro" fallback={hotel.intro} /></p>
            <div className="mt-5 flex flex-wrap gap-2">
              {hotel.highlights.map((x) => <span key={x} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-[14px] font-medium">{x}</span>)}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-[15px]">
              {Number.isFinite(from) && <span>From <b className="text-[20px] tabular-nums">{formatMoney(from)}</b> <span className="text-muted"><T>/ night</T></span></span>}
              {showRating(hotel) && <span className="flex items-center gap-1.5"><Star className="size-4 fill-brand text-brand" /> <b>{hotel.reviewScore}</b> <span className="text-muted">· {hotel.reviewCount} <T>reviews</T></span></span>}
            </div>
          </HeroIn>
          <HeroIn delay={0.1} className="order-1 md:order-2">
            <Tilt max={6} className="rounded-[32px]">
              <div className="relative h-[46svh] min-h-[300px] overflow-hidden rounded-[32px] shadow-float md:h-[640px]">
                <LivePhoto src={hotel.heroPhoto} alt={hotel.name} mode="depth" strength={1.4} priority sizes="(max-width: 768px) 100vw, 640px" />
              </div>
            </Tilt>
          </HeroIn>
        </div>
        <HeroIn delay={0.2} className="relative z-10 mx-auto mt-8 max-w-[1040px] md:mt-12"><SearchBar /></HeroIn>
      </Container>
    </section>
  );
}

/* ---------- 3D floors ---------- */
function Floors({ hotel }: { hotel: Hotel }) {
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Floor by floor" title={<DraftText slug={hotel.slug} k="floors.title" fallback="Find your floor" />} /></Reveal>
        <FloorStack hotel={hotel} />
      </Container>
    </section>
  );
}

/* ---------- Rooms ---------- */
function Rooms({ hotel }: { hotel: Hotel }) {
  const base = `/hotel/${hotel.slug}`;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Rooms & suites" title={<DraftText slug={hotel.slug} k="rooms.title" fallback="Rooms with a view" />} /></Reveal>
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hotel.rooms.map((r) => (
            <SiteVisible key={r.id} slug={hotel.slug} kind="rooms" id={r.id}>
              <RevealItem>
                <Tilt className="rounded-[22px]">
                  <Link href={`${base}/rooms/${r.slug}`} className="group block overflow-hidden rounded-[22px] bg-surface shadow-card">
                    <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[4/5]"><Image src={r.photos[0]} alt={r.name} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" /></div>
                    <div className="p-4">
                      <h3 className="text-[18px] font-bold leading-tight">{r.name}</h3>
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
                        <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {r.bed}</span>
                        <span className="flex items-center gap-1"><Users className="size-3.5" /> {r.maxAdults + r.maxChildren}</span>
                        {r.sizeSqft && <span className="flex items-center gap-1"><Maximize2 className="size-3.5" /> {r.sizeSqft} sqft</span>}
                      </p>
                      <p className="mt-3"><b className="text-[18px] tabular-nums">{formatMoney(r.fromPrice)}</b> <span className="text-[12.5px] text-muted"><T>/ night</T></span></p>
                    </div>
                  </Link>
                </Tilt>
              </RevealItem>
            </SiteVisible>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}

/* ---------- Amenities: bento ---------- */
function Amenities({ hotel }: { hotel: Hotel }) {
  const g = hotel.gallery;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="In the building" title={<DraftText slug={hotel.slug} k="amenities.title" fallback="Work, swim, unwind" />} /></Reveal>
        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          {g[1] && <div className="relative h-[260px] overflow-hidden rounded-[24px] md:col-span-2 md:row-span-2 md:h-auto md:min-h-[460px]"><LivePhoto src={g[1]} alt="" mode="depth" sizes="(max-width: 768px) 100vw, 800px" quality={75} /></div>}
          {g[0] && <div className="relative h-[220px] overflow-hidden rounded-[24px]"><Image src={g[0]} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" /></div>}
          <div className="grid grid-cols-2 gap-3 rounded-[24px] bg-surface p-4 shadow-card">
            {hotel.facilities.slice(0, 4).map((f) => {
              const Icon = facIcon(f.icon);
              return <div key={f.name}><Icon className="size-5 text-action" /><p className="mt-1.5 text-[14.5px] font-semibold leading-snug">{f.name}</p><p className="text-[12.5px] text-muted">{f.short}</p></div>;
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Location ---------- */
function Location({ hotel }: { hotel: Hotel }) {
  if (!hotel.nearby?.length) return null;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Location" title={hotel.address} /></Reveal>
        <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hotel.nearby.map((n) => (
            <RevealItem key={n.name} className="rounded-[18px] border border-line bg-surface p-4">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase text-action">{n.mode === "walk" ? <Footprints className="size-4" /> : <Car className="size-4" />} {n.time}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold leading-snug">{n.name}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <a href={mapsLink(hotel)} target="_blank" rel="noopener" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-action px-6 text-[15px] font-semibold text-on-action"><Navigation className="size-4" /> <T>Get directions</T> <ArrowRight className="size-4" /></a>
      </Container>
    </section>
  );
}
