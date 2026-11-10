import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BedDouble, Car, ChevronDown, Footprints, Navigation, Star, Users } from "lucide-react";
import type { Hotel, RoomCategory } from "@/lib/types";
import { formatMoney, showRating } from "@/lib/data";
import { SearchBar } from "@/components/booking/SearchBar";
import { HeroIn, Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Section";
import { Reviews } from "@/components/sections/HomeSections";
import { DraftSections, DraftText, SiteVisible } from "@/components/site-draft/Draft";
import { T } from "@/lib/i18n";
import { FxScope } from "@/fx/fx";
import { Fireflies, LivePhoto, Tilt } from "@/fx/effects";
import { mapsLink } from "../shared";
import { facIcon } from "../paid-shared";

/** "6 m up" in a room's specs → 6. Rooms without a height are listed but not placed on the ruler. */
const heightOf = (r: RoomCategory) => { const m = r.specs?.join(" ").match(/(\d+(?:\.\d+)?)\s*m\s*up/i); return m ? Number(m[1]) : null; };

/**
 * CANOPY (paid · Tier A) — treehouses and eco stays.
 * 3D photo hero (FX2 depth) with fireflies (FX3), a height ruler built from the treehouses' real heights, deep forest palette.
 */
export function CanopyHome({ hotel }: { hotel: Hotel }) {
  return (
    <FxScope slug={hotel.slug} theme="canopy">
      <DraftSections
        slug={hotel.slug}
        master="canopy"
        items={[
          { id: "hero", node: <Hero hotel={hotel} /> },
          { id: "treehouses", node: <Treehouses hotel={hotel} /> },
          { id: "forest", node: <Forest hotel={hotel} /> },
          { id: "experiences", node: <Experiences hotel={hotel} /> },
          { id: "faq", node: <Faq hotel={hotel} /> },
          { id: "getting-here", node: <GettingHere hotel={hotel} /> },
          { id: "reviews", node: <div className="pb-14 md:pb-20"><Reviews hotel={hotel} /></div> },
        ]}
      />
    </FxScope>
  );
}

function Head({ label, title, light }: { label: string; title: React.ReactNode; light?: boolean }) {
  return (
    <div className="mb-6 md:mb-10">
      <p className={`flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.2em] md:text-[13px] ${light ? "text-[#cfe6c9]" : "text-action"}`}><span aria-hidden className="inline-block h-px w-8 bg-current" /><T>{label}</T></p>
      <h2 className={`mt-3 font-heading text-[30px] leading-[1.06] tracking-[-0.015em] md:text-[52px] ${light ? "text-white" : ""}`}>{typeof title === "string" ? <T>{title}</T> : title}</h2>
    </div>
  );
}

/* ---------- Hero: 3D photo + fireflies ---------- */
function Hero({ hotel }: { hotel: Hotel }) {
  const from = Math.min(...hotel.rooms.map((r) => r.fromPrice));
  return (
    <section className="relative bg-[#0f2418] text-white">
      <div className="relative h-[66svh] min-h-[420px] overflow-hidden md:h-[90svh] md:min-h-[620px]">
        <LivePhoto src={hotel.heroPhoto} alt={hotel.name} mode="depth" strength={1.2} priority />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_22_14/0.35)_0%,rgb(8_22_14/0)_30%,rgb(8_22_14/0.25)_60%,rgb(15_36_24/1)_100%)]" />
        <Fireflies count={30} />
        <Container className="absolute inset-x-0 bottom-0 pb-8 md:pb-20">
          <HeroIn delay={0.05}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#cfe6c9]">{hotel.type} · {hotel.area}, {hotel.city}</p>
            <h1 className="mt-3 max-w-[820px] font-heading text-[44px] leading-[1.0] tracking-[-0.02em] md:text-[92px]"><DraftText slug={hotel.slug} k="hero.title" fallback={hotel.tagline} /></h1>
            <p className="mt-4 max-w-[560px] text-[16px] leading-relaxed text-white/85 md:text-[19px]"><DraftText slug={hotel.slug} k="hero.intro" fallback={hotel.intro} /></p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {Number.isFinite(from) && <span className="rounded-full border border-white/30 px-4 py-2 text-[15px] font-semibold">From {formatMoney(from)} <T>/ night</T></span>}
              {showRating(hotel) && <span className="flex items-center gap-1.5 text-[15px]"><Star className="size-4 fill-[#f4d58d] text-[#f4d58d]" /> <b>{hotel.reviewScore}</b> <span className="text-white/75">· {hotel.reviewCount} <T>reviews</T></span></span>}
            </div>
          </HeroIn>
        </Container>
      </div>
      <Container className="relative z-10 pb-10 md:pb-14">
        <HeroIn delay={0.2} className="mx-auto max-w-[1040px] text-ink"><SearchBar /></HeroIn>
      </Container>
    </section>
  );
}

/* ---------- Treehouses: height ruler + depth cards ---------- */
function Treehouses({ hotel }: { hotel: Hotel }) {
  const base = `/hotel/${hotel.slug}`;
  const placed = hotel.rooms.map((r) => ({ r, h: heightOf(r) })).filter((x) => x.h !== null) as { r: RoomCategory; h: number }[];
  const top = Math.max(8, ...placed.map((p) => Math.ceil(p.h + 1)));
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="Treehouses" title={<DraftText slug={hotel.slug} k="treehouses.title" fallback="How high would you like to sleep?" />} /></Reveal>
        <div className="grid gap-8 lg:grid-cols-[290px_1fr] lg:gap-12">
          {placed.length > 0 && (
            <figure className="hidden lg:block" aria-label="Height of each treehouse">
              <div className="relative h-[520px] rounded-[26px] bg-[linear-gradient(180deg,#e9f3e6,#d6e8cf)] p-5">
                <div className="absolute bottom-5 left-12 top-5 w-px bg-ink/25" />
                {Array.from({ length: top + 1 }, (_, m) => (
                  <span key={m} className="absolute left-3 w-8 text-right text-[11.5px] tabular-nums text-muted" style={{ bottom: `calc(20px + ${(m / top) * 480}px - 7px)` }}>{m} m</span>
                ))}
                {placed.map(({ r, h }) => (
                  <a key={r.id} href={`#tree-${r.id}`} className="absolute left-12 flex items-center gap-2 pl-2" style={{ bottom: `calc(20px + ${(h / top) * 480}px - 14px)` }}>
                    <span className="h-px w-6 bg-action" />
                    <span className="whitespace-nowrap rounded-full bg-surface px-3 py-1 text-[13px] font-semibold shadow-card">{r.name} · {h} m</span>
                  </a>
                ))}
                <span aria-hidden className="absolute inset-x-5 bottom-5 h-2 rounded-full bg-[#8a6b3e]/40" />
              </div>
              <figcaption className="mt-2 text-[12.5px] text-muted">Heights from the property&apos;s room details.</figcaption>
            </figure>
          )}
          <RevealGroup className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 lg:col-start-2">
            {hotel.rooms.map((r) => (
              <SiteVisible key={r.id} slug={hotel.slug} kind="rooms" id={r.id}>
                <RevealItem>
                  <Tilt className="rounded-[24px]">
                    <Link id={`tree-${r.id}`} href={`${base}/rooms/${r.slug}`} className="group block scroll-mt-28 overflow-hidden rounded-[24px] bg-surface shadow-float">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image src={r.photos[0]} alt={r.name} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgb(10_26_16/0.85))]" />
                        {heightOf(r) !== null && <span className="absolute left-3 top-3 rounded-full bg-[#0f2418]/80 px-3 py-1 text-[12.5px] font-semibold text-white backdrop-blur">{heightOf(r)} m up</span>}
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <h3 className="font-heading text-[26px] leading-tight">{r.name}</h3>
                          <p className="mt-1 text-[14px] text-white/85">{r.short}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <p className="flex flex-wrap gap-x-3 text-[13.5px] text-muted"><span className="flex items-center gap-1"><BedDouble className="size-4" /> {r.bed}</span><span className="flex items-center gap-1"><Users className="size-4" /> {r.maxAdults + r.maxChildren}</span></p>
                        <p className="shrink-0 text-right"><b className="text-[18px] tabular-nums">{formatMoney(r.fromPrice)}</b><span className="block text-[12px] text-muted"><T>/ night</T></span></p>
                      </div>
                    </Link>
                  </Tilt>
                </RevealItem>
              </SiteVisible>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Forest life (dark, fireflies) ---------- */
function Forest({ hotel }: { hotel: Hotel }) {
  const photo = hotel.gallery.find((g) => /fog|forest/.test(g)) ?? hotel.heroPhoto;
  return (
    <section className="mt-16 md:mt-28">
      <div className="relative overflow-hidden bg-[#0f2418] py-14 text-white md:py-24">
        <Image src={photo} alt="" fill sizes="100vw" className="object-cover opacity-30" />
        <Fireflies count={22} />
        <Container className="relative">
          <Reveal><Head light label="Life in the forest" title={<DraftText slug={hotel.slug} k="forest.title" fallback="Simple comforts, wild surroundings" />} /></Reveal>
          <RevealGroup className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {hotel.facilities.map((f) => {
              const Icon = facIcon(f.icon);
              return (
                <RevealItem key={f.name} className="rounded-[20px] border border-white/15 bg-white/[0.07] p-4 backdrop-blur-sm md:p-5">
                  <Icon className="size-6 text-[#cfe6c9]" />
                  <p className="mt-2 text-[15.5px] font-semibold">{f.name}</p>
                  <p className="mt-0.5 text-[13.5px] text-white/75">{f.short}</p>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </div>
    </section>
  );
}

/* ---------- Experiences ---------- */
function Experiences({ hotel }: { hotel: Hotel }) {
  const items = hotel.services.filter((s) => s.photo);
  if (!items.length) return null;
  return (
    <section className="mt-16 md:mt-28">
      <Container>
        <Reveal><Head label="With a guide" title={<DraftText slug={hotel.slug} k="experiences.title" fallback="Walks, birds and tea" />} /></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((s) => (
            <SiteVisible key={s.id} slug={hotel.slug} kind="services" id={s.id}>
              <Tilt className="h-full rounded-[22px]">
                <article className="h-full overflow-hidden rounded-[22px] bg-surface shadow-card">
                  <div className="relative aspect-[16/10]"><Image src={s.photo!} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" /></div>
                  <div className="p-5">
                    <h3 className="text-[18px] font-semibold">{s.name}</h3>
                    <p className="mt-1 text-[14.5px] text-muted">{s.short}</p>
                    <p className="mt-3 text-[15px] font-semibold">{s.price ? `${formatMoney(s.price)} · ${s.unit}` : <T>Included</T>}</p>
                  </div>
                </article>
              </Tilt>
            </SiteVisible>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */
function Faq({ hotel }: { hotel: Hotel }) {
  const qa = [{ q: "Check-in and check-out", a: `Check-in ${hotel.checkIn}, check-out ${hotel.checkOut}.` }, { q: "Children", a: hotel.policies.children }, ...(hotel.faq ?? [])];
  return (
    <section className="mt-16 md:mt-28">
      <Container className="max-w-[900px]">
        <Reveal><Head label="Good to know" title={<DraftText slug={hotel.slug} k="copy.before-you-climb-up" fallback="Before you climb up" />} /></Reveal>
        <div className="divide-y divide-line border-y border-line">
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
        <Reveal><Head label="Getting here" title={`${hotel.area}, ${hotel.city}`} /></Reveal>
        <p className="-mt-3 mb-5 text-[15px] text-muted md:-mt-6 md:mb-8">{hotel.address}</p>
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
