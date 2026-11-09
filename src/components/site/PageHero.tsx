import Image from "next/image";
import type { ReactNode } from "react";

/** Inner pages: short hero with the page's own photo (not the Home hero). */
export function PageHero({ eyebrow, title, sub, photo, children }: { eyebrow?: string; title: string; sub?: string; photo?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      {photo && (
        <>
          <Image src={photo} alt="" fill priority sizes="100vw" className="object-cover object-[70%_center] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 via-45% to-white/10" />
        </>
      )}
      <div className="relative mx-auto max-w-[1240px] px-4 py-10 sm:px-6 md:py-16">
        {eyebrow && <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-action">{eyebrow}</p>}
        <h1 className="mt-2 max-w-xl text-[32px] font-bold leading-tight md:text-5xl">{title}</h1>
        {sub && <p className="mt-3 max-w-lg text-[15px] text-ink/70 md:text-[17px]">{sub}</p>}
        {children}
      </div>
    </section>
  );
}
