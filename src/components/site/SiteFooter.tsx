import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import type { HeaderStyle } from "@/themes/style";
import { mapsLink, waLink } from "@/themes/shared";
import type { Hotel } from "@/lib/types";
import type { NavItem } from "./nav";
import { Logo } from "./Logo";
import { Year } from "./Year";
import { availablePages } from "@/lib/data";
import { T } from "@/lib/i18n";
import { DraftInfo } from "@/components/site-draft/Draft";

const icons = {
  facebook: <path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v7h4v-7H17l.5-4h-4V8.8c0-.5.3-.8.5-.8Z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.3" cy="6.7" r="1.1" />
    </>
  ),
  youtube: <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />,
};

function Col({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"><T>{title}</T></p>
      <ul className="mt-3 space-y-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="inline-flex min-h-9 items-center text-[15px] text-ink/80 hover:text-action">
              <T>{l.label}</T>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type L = { href: string; label: string };

function Social({ hotel, center }: { hotel: Hotel; center?: boolean }) {
  const keys = (Object.keys(icons) as (keyof typeof icons)[]).filter((k) => hotel.social[k]);
  if (!keys.length) return null;
  return (
    <div className={`flex gap-2 ${center ? "justify-center" : ""}`}>
      {keys.map((k) => (
        <a key={k} href={hotel.social[k]} aria-label={k} className="grid size-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-brand-ring hover:text-action">
          <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>{icons[k]}</svg>
        </a>
      ))}
    </div>
  );
}

function Bottom({ hotel, center }: { hotel: Hotel; center?: boolean }) {
  return (
    <div className="border-t border-line">
      <div className={`mx-auto flex max-w-[1240px] flex-col-reverse gap-3 px-4 py-4 text-[13px] text-muted sm:flex-row sm:items-center sm:px-6 ${center ? "items-center sm:justify-center sm:gap-8" : "items-start sm:justify-between"}`}>
        <span>© <Year /> {hotel.name}</span>
        <a href="https://technology.bingi.com.bd" className="flex min-h-10 items-center gap-2 hover:text-ink">
          <T>Website & booking by</T>
          <Image src="/brand/bingi-master.svg" alt="BinGi" width={66} height={22} className="h-[22px] w-auto" />
        </a>
      </div>
    </div>
  );
}

function ContactList({ hotel, tel }: { hotel: Hotel; tel: string }) {
  return (
    <ul className="mt-3 space-y-1 text-[15px] text-ink/80">
      <li className="flex min-h-9 items-start gap-3 py-1.5"><MapPin className="mt-0.5 size-[18px] shrink-0 text-muted" /> <DraftInfo slug={hotel.slug} field="address" fallback={hotel.address} /></li>
      <li><a href={tel} className="flex min-h-9 items-center gap-3 hover:text-action"><Phone className="size-[18px] shrink-0 text-muted" /> <DraftInfo slug={hotel.slug} field="phone" fallback={hotel.phone} /></a></li>
      <li><a href={`mailto:${hotel.email}`} className="flex min-h-9 items-center gap-3 break-all hover:text-action"><Mail className="size-[18px] shrink-0 text-muted" /> <DraftInfo slug={hotel.slug} field="email" fallback={hotel.email} /></a></li>
    </ul>
  );
}

/** Footer style follows the theme's header style (themes/style.ts): classic · overlay (resort) · centered (heritage) · minimal (design-led). */
export function SiteFooter({ hotel, nav, variant = "classic" }: { hotel: Hotel; nav: NavItem[]; variant?: HeaderStyle }) {
  const base = `/hotel/${hotel.slug}`;
  const has = (label: string) => nav.some((n) => n.label === label);
  const stay = [
    { href: `${base}/rooms`, label: "Rooms" },
    has("Offers") && { href: `${base}/offers`, label: "Offers" },
    { href: `${base}/my-trip`, label: "My Trip" },
    { href: `${base}/policies`, label: "Policies" },
  ].filter(Boolean) as L[];
  const hotelLinks = [
    has("Dining") && { href: `${base}/dining`, label: "Dining" },
    has("Experiences") && { href: `${base}/experiences`, label: "Experiences" },
    availablePages(hotel).events && { href: `${base}/events`, label: "Events" },
    { href: `${base}/explore`, label: "Explore" },
    { href: `${base}/contact`, label: "Contact" },
  ].filter(Boolean) as L[];
  const all = [...stay, ...hotelLinks.filter((l) => !stay.some((s) => s.href === l.href))];
  const tel = `tel:${hotel.phone.replace(/[^+\d]/g, "")}`;
  const pad = "pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0";

  /* ---- resort: a closing band with the name, then compact columns ---- */
  if (variant === "overlay")
    return (
      <footer data-footer="resort" className={`mt-auto border-t border-line bg-canvas ${pad}`}>
        <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 md:pt-16">
          <div className="flex flex-col gap-6 border-b border-line pb-10 md:flex-row md:items-end md:justify-between md:pb-14">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">{hotel.area} · {hotel.city}</p>
              <p className="mt-2 font-heading text-[34px] leading-[1.05] md:text-[56px]">{hotel.name}</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href={`${base}/rooms`} className="inline-flex h-12 items-center gap-2 rounded-full bg-action px-6 text-[15px] font-semibold text-on-action"><T>Book your stay</T> <ArrowRight className="size-4" /></Link>
              {hotel.whatsapp && <a href={waLink(hotel, `Hello ${hotel.name}`)} className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-semibold"><MessageCircle className="size-[18px]" /> WhatsApp</a>}
              <a href={mapsLink(hotel)} target="_blank" rel="noopener" className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-surface px-5 text-[15px] font-semibold"><Navigation className="size-[18px]" /> <T>Directions</T></a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 py-8 md:py-12 lg:grid-cols-[0.8fr_0.8fr_1.3fr_auto] lg:gap-10">
            <div className="hidden md:block"><Col title="Stay" links={stay} /></div>
            <div className="hidden md:block"><Col title="About" links={hotelLinks} /></div>
            <div className="col-span-2 lg:col-span-1"><p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"><T>Contact</T></p><ContactList hotel={hotel} tel={tel} /></div>
            <div className="col-span-2 lg:col-span-1"><Social hotel={hotel} /></div>
          </div>
        </div>
        <Bottom hotel={hotel} />
      </footer>
    );

  /* ---- heritage: everything centred, one line of links ---- */
  if (variant === "centered")
    return (
      <footer data-footer="heritage" className={`mt-auto border-t border-line bg-surface ${pad}`}>
        <div className="mx-auto max-w-[900px] px-4 py-10 text-center sm:px-6 md:py-16">
          <div className="flex justify-center"><Logo text={hotel.logoText} href={base} /></div>
          <p className="mx-auto mt-3 max-w-md font-heading text-[18px] italic text-muted md:text-[20px]">{hotel.tagline}</p>
          <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-[color:var(--brand)] opacity-60" />
          <nav aria-label="Footer" className="mt-6">
            <ul className="flex flex-wrap justify-center gap-x-1 gap-y-1">
              {all.map((l) => (
                <li key={l.href}><Link href={l.href} className="inline-flex min-h-10 items-center px-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink/75 hover:text-action"><T>{l.label}</T></Link></li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 flex flex-col items-center gap-1 text-[15px] text-ink/80 md:flex-row md:justify-center md:gap-5">
            <span><DraftInfo slug={hotel.slug} field="address" fallback={hotel.address} /></span>
            <a href={tel} className="inline-flex min-h-10 items-center hover:text-action"><DraftInfo slug={hotel.slug} field="phone" fallback={hotel.phone} /></a>
            <a href={`mailto:${hotel.email}`} className="inline-flex min-h-10 items-center break-all hover:text-action"><DraftInfo slug={hotel.slug} field="email" fallback={hotel.email} /></a>
          </div>
          <div className="mt-6"><Social hotel={hotel} center /></div>
        </div>
        <Bottom hotel={hotel} center />
      </footer>
    );

  /* ---- design-led: links + contact in one row, the name set very large ---- */
  if (variant === "minimal")
    return (
      <footer data-footer="wordmark" className={`mt-auto overflow-hidden border-t border-line bg-surface ${pad}`}>
        <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6 md:pt-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <nav aria-label="Footer">
              <ul className="grid grid-cols-2 gap-x-8 sm:flex sm:flex-wrap sm:gap-x-6">
                {all.map((l) => (
                  <li key={l.href}><Link href={l.href} className="inline-flex min-h-10 items-center text-[15px] font-semibold hover:text-action"><T>{l.label}</T></Link></li>
                ))}
              </ul>
            </nav>
            <div className="text-[15px] text-ink/80 lg:text-right">
              <a href={tel} className="flex min-h-10 items-center hover:text-action lg:justify-end"><DraftInfo slug={hotel.slug} field="phone" fallback={hotel.phone} /></a>
              <a href={`mailto:${hotel.email}`} className="flex min-h-10 items-center break-all hover:text-action lg:justify-end"><DraftInfo slug={hotel.slug} field="email" fallback={hotel.email} /></a>
              <p className="mt-1 max-w-[360px] text-muted lg:ml-auto"><DraftInfo slug={hotel.slug} field="address" fallback={hotel.address} /></p>
              <div className="mt-4 lg:flex lg:justify-end"><Social hotel={hotel} /></div>
            </div>
          </div>
          <p aria-hidden style={{ fontSize: `min(${Math.floor(118 / Math.max(hotel.logoText.length, 5))}vw, ${Math.floor(1700 / Math.max(hotel.logoText.length, 5))}px)` }} className="mt-10 select-none whitespace-nowrap font-heading font-bold leading-[0.85] tracking-[-0.04em] text-ink/90 md:mt-14">{hotel.logoText}</p>
        </div>
        <Bottom hotel={hotel} />
      </footer>
    );

  /* ---- classic ---- */
  return (
    <footer data-footer="classic" className={`mt-auto border-t border-line bg-surface ${pad}`}>
      <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 md:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:gap-y-10 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.3fr] lg:gap-10">
          <div className="col-span-2 lg:col-span-1">
            <Logo text={hotel.logoText} href={base} />
            <p className="mt-2 max-w-xs text-[14px] text-muted md:mt-3 md:text-[15px]">{hotel.tagline}</p>
            <div className="mt-5"><Social hotel={hotel} /></div>
          </div>
          <div className="hidden md:block"><Col title="Stay" links={stay} /></div>
          <div className="hidden md:block"><Col title="About" links={hotelLinks} /></div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted"><T>Contact</T></p>
            <ContactList hotel={hotel} tel={tel} />
            <p className="mt-3 text-[13px] text-muted">Check-in {hotel.checkIn} · Check-out {hotel.checkOut}</p>
          </div>
        </div>
      </div>
      <Bottom hotel={hotel} />
    </footer>
  );
}
