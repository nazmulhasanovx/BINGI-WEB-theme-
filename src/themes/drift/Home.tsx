import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Car, ChevronDown, Footprints, Navigation, Star, Users } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { formatMoney, showRating } from "@/lib/data";
import { SearchBar } from "@/components/booking/SearchBar";
import { HeroIn, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";
import { Reviews } from "@/components/sections/HomeSections";
import { DraftSections, DraftText, SiteVisible } from "@/components/site-draft/Draft";
import { T } from "@/lib/i18n";
import { FxScope } from "@/fx/fx";
import { LivePhoto, Tilt } from "@/fx/effects";
import { mapsLink, waLink } from "../shared";
import { facIcon } from "../paid-shared";

/**
 * DRIFT (paid · Tier B) — houseboats and river stays.
 * The water in the hotel's own hero photo moves (FX2 water); cabins are depth cards (FX1); a day on board is a waterline timeline.
 */
export function DriftHome({ hotel }: { hotel: Hotel }) {
  return (
    <FxScope slug={hotel.slug} theme="drift">
      <div className="bg-[#f4f8f8]">
        <DraftSections
          slug={hotel.slug}
          master="drift"
          items={[
            { id: "hero", node: <Hero hotel={hotel} /> },
            { id: "cabins", node: <Cabins hotel={hotel} /> },
            { id: "day", node: <Day hotel={hotel} /> },
            { id: "life", node: <Life hotel={hotel} /> },
            { id: "extras", node: <Extras hotel={hotel} /> },
            { id: "faq", node: <Faq hotel={hotel} /> },
            { id: "getting-here", node: <GettingHere hotel={hotel} /> },
            { id: "reviews", node: <div className="pb-4"><Reviews hotel={hotel} /></div> },
            { id: "book-band", node: <BookBand hotel={hotel} /> },
          ]}
        />
      </div>
    </FxScope>
  );
}

function Head({ label, title, light }: { label: string; title: React.ReactNode; light?: boolean }) {
  return (
    <div className="mb-6 md:mb-10">
      <p className={`text-[12.5px] font-semibold uppercase tracking-[0.18em] md:text-[13px] ${light ? "text-white/80" : "text-action"}`}><T>{label}</T></p>
      <h2 className={`mt-2 font-heading text-[30px] leading-[1.08] tracking-[-0.02em] md:text-[50px] ${light ? "text-white" : ""}`}>{typeof title === "string" ? <T>{title}</T> : title}</h2>
    </div>
  );
}

/* ---------- Hero: the hotel's photo with living water ---------- */
function Hero({ hotel }: { hotel: Hotel }) {
  const from = Math.min(...hotel.rooms.map((r) => r.fromPrice));
  return (
    <section className="relative">
      <div className="relative h-[62svh] min-h-[380px] overflow-hidden md:h-[88svh] md:min-h-[600px]">
        <LivePhoto src={hotel.heroPhoto} alt={hotel.name} mode="water" horizon={0.5} priority />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(4_30_34/0.10)_0%,rgb(4_30_34/0)_35%,rgb(4_30_34/0.72)_100%)]" />
        <div aria-hidden className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(4_30_34/0.62)_0%,rgb(4_30_34/0.25)_45%,transparent_70%)] md:block" />
        <Container className="absolute inset-x-0 bottom-0 pb-8 md:pb-16">
          <HeroIn delay={0.05}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/85">{hotel.type} · {hotel.area}</p>
            <h1 className="mt-3 max-w-[760px] font-heading text-[42px] leading-[1.02] tracking-[-0.02em] text-white md:text-[84px]"><DraftText slug={hotel.slug} k="hero.title" fallback={hotel.tagline} /></h1>
            <p className="mt-4 hidden max-w-[560px] text-[18px] leading-relaxed text-white/90 md:block"><DraftText slug={hotel.slug} k="hero.intro" fallback={hotel.intro} /></p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-white">
              {Number.isFinite(from) && <span className="rounded-full bg-white/15 px-4 py-2 text-[15px] font-semibold backdrop-blur-md">Cabins from {formatMoney(from)} <T>/ night</T></span>}
              {showRating(hotel) && <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-[15px] backdrop-blur-md"><Star className="size-4 fill-white" /> <b>{hotel.reviewScore}</b> · {hotel.reviewCount} <T>reviews</T></span>}
            </div>
          </HeroIn>
        </Container>
      </div>
      <Container className="relative z-10">
        <p className="mt-5 text-[16px] leading-relaxed text-muted md:hidden"><DraftText slug={hotel.slug} k="hero.intro" fallback={hotel.intro} /></p>
        <HeroIn delay={0.2} className="mx-auto mt-5 max-w-[1040px] md:-mt-10"><SearchBar /></HeroIn>
      </Container>
    </section>
  );
}

/* ---------- Cabins: depth cards ---------- */
function Cabins({ hotel }: { hotel: Hotel }) {
  const base = `/hotel/${hotel.slug}`;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Cabins" title={<DraftText slug={hotel.slug} k="cabins.title" fallback="Choose your cabin" />} /></Reveal>
        <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hotel.rooms.map((r) => (
            <SiteVisible key={r.id} slug={hotel.slug} kind="rooms" id={r.id}>
              <RevealItem>
                <Tilt className="rounded-[26px]">
                  <Link href={`${base}/rooms/${r.slug}`} className="group block overflow-hidden rounded-[26px] bg-surface shadow-float">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image src={r.photos[0]} alt={r.name} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      {r.specs?.[0] && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[12.5px] font-semibold text-ink backdrop-blur">{r.specs[0]}</span>}
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading text-[24px] leading-tight">{r.name}</h3>
                      <p className="mt-1 text-[14.5px] text-muted">{r.short}</p>
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] text-muted">
                        <span className="flex items-center gap-1"><BedDouble className="size-4" /> {r.bed}</span>
                        <span className="flex items-center gap-1"><Users className="size-4" /> {r.maxAdults + r.maxChildren} <T>guests</T></span>
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                        <span><b className="text-[20px] tabular-nums">{formatMoney(r.fromPrice)}</b> <span className="text-[13px] text-muted"><T>/ night</T></span></span>
                        <span className="inline-flex size-10 items-center justify-center rounded-full bg-action text-on-action transition-transform group-hover:translate-x-0.5"><ArrowRight className="size-5" /></span>
                      </div>
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

/* ---------- A day on board: waterline timeline ---------- */
function Day({ hotel }: { hotel: Hotel }) {
  const plan = hotel.dayPlan ?? [];
  if (!plan.length) return null;
  return (
    <section className="mt-16 md:mt-28">
      <div className="relative overflow-hidden bg-[#0d3b3f] py-14 text-white md:py-24">
        <svg aria-hidden className="absolute inset-x-0 top-[58%] h-16 w-full opacity-30 md:top-1/2" viewBox="0 0 1200 60" preserveAspectRatio="none"><path d="M0 30 Q 75 0 150 30 T 300 30 T 450 30 T 600 30 T 750 30 T 900 30 T 1050 30 T 1200 30" fill="none" stroke="white" strokeWidth="2" /></svg>
        <Container className="relative">
          <Reveal><Head light label="On board" title={<DraftText slug={hotel.slug} k="day.title" fallback="A day on the water" />} /></Reveal>
          <ol tabIndex={0} aria-label="A day on board" className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-6">
            {plan.map((p) => (
              <li key={p.time + p.title} className="w-[72%] shrink-0 snap-start rounded-[20px] bg-white/10 p-5 backdrop-blur-sm sm:w-[45%] md:w-auto">
                <p className="font-heading text-[30px] leading-none tabular-nums">{p.time}</p>
                <p className="mt-3 text-[16px] font-semibold">{p.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-white/80">{p.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </div>
    </section>
  );
}

/* ---------- Life on board ---------- */
function Life({ hotel }: { hotel: Hotel }) {
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] md:aspect-[4/5]">
            <LivePhoto src={hotel.gallery[1] ?? hotel.heroPhoto} alt="" mode="water" horizon={0.42} sizes="(max-width: 768px) 100vw, 560px" quality={75} />
          </div>
          <div>
            <Reveal><Head label="On the boat" title={<DraftText slug={hotel.slug} k="life.title" fallback="Everything you need, nothing you don't" />} /></Reveal>
            <RevealGroup className="grid grid-cols-2 gap-3 md:gap-4">
              {hotel.facilities.map((f) => {
                const Icon = facIcon(f.icon);
                return (
                  <RevealItem key={f.name} className="rounded-[18px] bg-surface p-4 shadow-card">
                    <Icon className="size-6 text-action" />
                    <p className="mt-2 text-[15.5px] font-semibold leading-snug">{f.name}</p>
                    <p className="mt-0.5 text-[13.5px] text-muted">{f.short}</p>
                  </RevealItem>
                );
              })}
            </RevealGroup>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Extras ---------- */
function Extras({ hotel }: { hotel: Hotel }) {
  if (!hotel.services.length) return null;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Add to your trip" title={<DraftText slug={hotel.slug} k="extras.title" fallback="Make it yours" />} /></Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {hotel.services.map((s) => (
            <SiteVisible key={s.id} slug={hotel.slug} kind="services" id={s.id}>
              <div className="flex h-full gap-4 rounded-[20px] bg-surface p-4 shadow-card">
                {s.photo && <span className="relative size-20 shrink-0 overflow-hidden rounded-[14px]"><Image src={s.photo} alt="" fill sizes="80px" className="object-cover" /></span>}
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold">{s.name}</p>
                  <p className="mt-0.5 text-[14px] text-muted">{s.short}</p>
                  <p className="mt-2 text-[14.5px] font-semibold">{s.price ? `${formatMoney(s.price)} · ${s.unit}` : <T>Included</T>}</p>
                </div>
              </div>
            </SiteVisible>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */
function Faq({ hotel }: { hotel: Hotel }) {
  const qa = [{ q: "Boarding and return", a: `Boarding ${hotel.checkIn}. Return ${hotel.checkOut}.` }, { q: "Cancellation", a: hotel.policies.cancellation }, ...(hotel.faq ?? [])];
  return (
    <section className="mt-16 md:mt-28">
      <Container className="max-w-[900px]">
        <Reveal><Head label="Questions" title="Before you board" /></Reveal>
        <div className="divide-y divide-line rounded-[22px] bg-surface px-5 shadow-card md:px-7">
          {qa.map((x) => (
            <details key={x.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold md:text-[17px]"><T>{x.q}</T><ChevronDown className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" /></summary>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{x.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Getting here ---------- */
function GettingHere({ hotel }: { hotel: Hotel }) {
  if (!hotel.nearby?.length) return null;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Getting here" title={hotel.address} /></Reveal>
        <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {hotel.nearby.map((n) => (
            <RevealItem key={n.name} className="rounded-[18px] bg-surface p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase text-action">{n.mode === "walk" ? <Footprints className="size-4" /> : <Car className="size-4" />} {n.time}</p>
              <p className="mt-1.5 text-[15.5px] font-semibold leading-snug">{n.name}</p>
            </RevealItem>
          ))}
        </RevealGroup>
        <a href={mapsLink(hotel)} target="_blank" rel="noopener" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-action px-6 text-[15px] font-semibold text-on-action"><Navigation className="size-4" /> <T>Get directions</T></a>
      </Container>
    </section>
  );
}

/* ---------- Closing band ---------- */
function BookBand({ hotel }: { hotel: Hotel }) {
  const photo = hotel.gallery.find((g) => /sunset/.test(g)) ?? hotel.heroPhoto;
  return (
    <section className="mt-12 pb-16 md:mt-20 md:pb-24">
      <Container>
        <div className="relative overflow-hidden rounded-[30px]">
          <div className="relative h-[360px] md:h-[440px]">
            <LivePhoto src={photo} alt="" mode="water" horizon={0.4} sizes="(max-width: 768px) 100vw, 1200px" quality={75} />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(4_30_34/0.78),rgb(4_30_34/0.15))]" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center p-6 text-white md:p-14">
            <h2 className="max-w-[560px] font-heading text-[32px] leading-[1.05] md:text-[56px]"><DraftText slug={hotel.slug} k="book-band.title" fallback="Your cabin is waiting on the water" /></h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/hotel/${hotel.slug}/rooms`} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-ink"><T>See cabins</T> <ArrowRight className="size-4" /></Link>
              <a href={waLink(hotel, `Hi ${hotel.name}, I'd like to ask about a trip.`)} className="inline-flex h-12 items-center rounded-full border border-white/60 px-6 text-[15px] font-semibold text-white"><T>Ask on WhatsApp</T></a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
