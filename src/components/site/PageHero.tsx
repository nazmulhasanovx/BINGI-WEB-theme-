import Image from "next/image";
import type { ReactNode } from "react";
import { HeroIn, PhotoIn } from "@/components/motion/Reveal";

/** Inner pages: short hero with the page's own photo (not the Home hero). */
export function PageHero({ eyebrow, title, sub, photo, children }: { eyebrow?: string; title: string; sub?: string; photo?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-canvas md:border-b md:border-line md:bg-surface">
      {photo && (
        <>
          <PhotoIn className="absolute inset-0 hidden md:block">
            <Image src={photo} alt="" fill priority sizes="100vw" quality={85} className="object-cover object-[70%_center] opacity-90" />
          </PhotoIn>
          <div className="absolute inset-0 hidden bg-gradient-to-r from-white via-white/85 via-45% to-white/10 md:block" />
        </>
      )}
      <HeroIn className="relative mx-auto max-w-[1240px] px-4 pb-4 pt-5 sm:px-6 md:py-16">
        {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-action">{eyebrow}</p>}
        <h1 className="max-w-xl text-[30px] font-bold leading-tight md:mt-2 md:text-5xl">{title}</h1>
        {sub && <p className="mt-3 max-w-lg text-[15px] text-ink/70 md:text-[17px]">{sub}</p>}
        {children}
      </HeroIn>
    </section>
  );
}
