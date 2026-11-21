"use client";
// Panorama hero: the whole property in one wide (aerial) photo, edge to edge, with its places labelled on the photo
// (pool, villas, beach…). Headline + booking bar sit on top. Used by resort themes when the hotel has a panorama photo;
// otherwise the theme's own hero shows. Labels are placed in photo coordinates and follow the photo as it crops.
import Image from "next/image";
import clsx from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Star } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { DraftText } from "@/components/site-draft/Draft";
import { SearchBar } from "@/components/booking/SearchBar";
import { HeroIn, PhotoIn } from "@/components/motion/Reveal";
import { showRating } from "@/lib/data";

type Look = {
  /** Headline font + case for this theme. */
  title: string;
  /** Kicker colour on the dark photo. */
  kicker?: string;
  /** Where the words sit. */
  align?: "left" | "center";
};

/** Where a photo point (px, py in %) lands inside a box using object-cover with the given focus. */
function place(box: { w: number; h: number }, img: { w: number; h: number }, focus: [number, number], px: number, py: number) {
  const s = Math.max(box.w / img.w, box.h / img.h);
  const dw = img.w * s, dh = img.h * s;
  const ox = (box.w - dw) * (focus[0] / 100), oy = (box.h - dh) * (focus[1] / 100);
  return { x: ox + (px / 100) * dw, y: oy + (py / 100) * dh };
}

export function ResortPanorama({ hotel, look, extra }: { hotel: Hotel; look: Look; extra?: ReactNode }) {
  const p = hotel.panorama!;
  const focus = p.focus ?? [50, 50];
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [on, setOn] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const center = look.align === "center";
  const base = `/hotel/${hotel.slug}`;

  return (
    <section aria-label="The whole resort" className="pano relative">
      {/* phone: the photo as a card, places listed under it */}
      <div className="px-3 pt-2 md:hidden">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[26px]">
          <Image src={p.src} alt={p.alt} fill priority sizes="100vw" quality={80} className="object-cover" style={{ objectPosition: `${focus[0]}% ${focus[1]}%` }} />
          <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur">The whole {hotel.propertyType === "villa" ? "estate" : "resort"}</span>
        </div>
        <ul tabIndex={0} aria-label="In the photo" className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
          {p.spots.map((s) => <li key={s.label} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] font-medium">{s.label}</li>)}
        </ul>
        <HeroIn className="pt-4" delay={0.1}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-action">{hotel.area} · {hotel.type}</p>
          <h1 className={clsx("mt-1 text-[28px] leading-[1.1]", look.title)}><DraftText slug={hotel.slug} k="hero.title" fallback={hotel.tagline} /></h1>
        </HeroIn>
      </div>

      {/* tablet / desktop: edge to edge */}
      <div ref={box} className="relative hidden h-[clamp(600px,calc(100svh-var(--pano-top,0px)),940px)] overflow-hidden md:block">
        <PhotoIn className="absolute inset-0">
          <Image src={p.src} alt={p.alt} fill priority fetchPriority="high" sizes="100vw" quality={82} className="object-cover" style={{ objectPosition: `${focus[0]}% ${focus[1]}%` }}
            onLoad={(e) => { const i = e.currentTarget; setNat({ w: i.naturalWidth, h: i.naturalHeight }); }} />
        </PhotoIn>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.38)_0%,rgb(0_0_0/0)_22%,rgb(0_0_0/0)_48%,rgb(0_0_0/0.62)_100%)]" />

        {/* places on the photo */}
        {nat && size.w > 0 && p.spots.map((s, i) => {
          const at = place(size, nat, focus, s.x, s.y);
          if (at.x < 24 || at.x > size.w - 24 || at.y < 90 || at.y > size.h - 150) return null;
          // keep the headline block clear: no label under the words
          const textL = center ? size.w / 2 - 340 : Math.max(24, (size.w - 1240) / 2 + 24);
          const textR = center ? size.w / 2 + 340 : textL + 660;
          if (at.y > size.h - 92 - 360 && at.x > textL - 170 && at.x < textR) return null;
          const right = at.x > size.w * 0.72;
          return (
            <div key={s.label} className="pano-spot absolute" style={{ left: at.x, top: at.y, animationDelay: `${0.5 + i * 0.12}s` }}
              onMouseEnter={() => setOn(i)} onMouseLeave={() => setOn(null)}>
              <span aria-hidden className="absolute -left-[7px] -top-[7px] block size-[14px] rounded-full border-2 border-white bg-white/35 shadow-[0_0_0_6px_rgb(255_255_255/0.18)]" />
              {s.to ? (
                <a href={`${base}${s.to}`} className={clsx("pano-label", right && "pano-label--left", on === i && "is-on")}>{s.label}</a>
              ) : (
                <span className={clsx("pano-label", right && "pano-label--left", on === i && "is-on")}>{s.label}</span>
              )}
            </div>
          );
        })}

        <span className="absolute right-6 top-[calc(var(--header-h)+18px)] rounded-full border border-white/35 bg-black/25 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">The whole {hotel.propertyType === "villa" ? "estate" : "resort"} · from above</span>

        <div className={clsx("absolute inset-x-0 bottom-[92px] mx-auto w-full max-w-[1240px] px-6", center && "text-center")}>
          <HeroIn className={clsx("max-w-[640px] text-white", center && "mx-auto")} delay={0.15}>
            <p className={clsx("text-[12.5px] font-semibold uppercase tracking-[0.18em]", look.kicker ?? "text-white/85")}>
              {hotel.area} · {hotel.city}{hotel.stars ? ` · ${"★".repeat(hotel.stars)}` : ""}
            </p>
            <h1 className={clsx("mt-3 text-[clamp(44px,5.2vw,74px)] leading-[1.02] [text-shadow:0_2px_24px_rgb(0_0_0/0.25)]", look.title)}>
              <DraftText slug={hotel.slug} k="hero.title" fallback={hotel.tagline} />
            </h1>
            <p className={clsx("mt-4 max-w-[520px] text-[16.5px] leading-relaxed text-white/88", center && "mx-auto")}><DraftText slug={hotel.slug} k="hero.intro" fallback={hotel.intro} /></p>
            {showRating(hotel) && (
              <p className={clsx("mt-4 flex items-center gap-1.5 text-[14px] text-white/85", center && "justify-center")}><Star className="size-4 fill-white text-white" /> {hotel.reviewScore} · {hotel.reviewCount} reviews</p>
            )}
          </HeroIn>
        </div>
        {extra}
      </div>

      <div className="relative z-10 mx-auto mt-4 max-w-[1040px] px-4 sm:px-6 md:-mt-[56px]">
        <HeroIn delay={0.3}><SearchBar /></HeroIn>
      </div>
    </section>
  );
}
