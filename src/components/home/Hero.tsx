import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { SearchBar } from "@/components/booking/SearchBar";
import { OpenSearchButton } from "@/components/booking/OpenSearchButton";
import { HeroIn, PhotoIn } from "@/components/motion/Reveal";
import { T } from "@/lib/i18n";

export function Hero({ hotel }: { hotel: Hotel }) {
  const base = `/hotel/${hotel.slug}`;
  return (
    <section className="relative">
      <div className="relative h-[clamp(460px,72svh,560px)] overflow-hidden md:h-[clamp(520px,64vh,620px)]">
        <PhotoIn className="absolute inset-0">
          <Image src={hotel.heroPhoto} alt={`${hotel.name}`} fill priority fetchPriority="high" sizes="100vw" quality={85} className="object-cover object-[65%_center] md:object-center" />
        </PhotoIn>
        {/* light scrims (no dark overlay): bottom on phone, left on tablet/desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/75 via-35% to-transparent to-65% md:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-white/95 via-white/70 via-40% to-transparent to-70% md:block" />

        <div className="absolute inset-x-0 bottom-0 pb-8 md:inset-y-0 md:flex md:items-center md:pb-16">
          <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
            <HeroIn className="max-w-[560px]" delay={0.15}>
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-action">
                {hotel.name}
                <span className="hidden sm:inline"> · {hotel.type}</span>
              </p>
              <h1 className="mt-3 text-[34px] font-bold leading-[1.08] xs:text-[38px] md:text-5xl lg:text-[56px]">{hotel.tagline}</h1>
              <div className="mt-7 hidden gap-3 md:flex">
                <OpenSearchButton />
                <ButtonLink href={`${base}/explore`} variant="white" size="lg">
                  <T>Explore the resort</T> <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </HeroIn>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto -mt-4 max-w-[1040px] px-4 sm:px-6 md:-mt-[52px] lg:-mt-11">
        <HeroIn delay={0.35}>
          <SearchBar />
        </HeroIn>
      </div>
    </section>
  );
}
