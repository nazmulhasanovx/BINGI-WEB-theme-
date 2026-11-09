import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Hotel } from "@/lib/types";
import type { NavItem } from "./nav";
import { Logo } from "./Logo";
import { T } from "@/lib/i18n";

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

export function SiteFooter({ hotel, nav }: { hotel: Hotel; nav: NavItem[] }) {
  const base = `/hotel/${hotel.slug}`;
  const links = [
    ...nav.filter((n) => n.href !== base),
    ...(hotel.flags.events ? [{ href: `${base}/events`, label: "Events" }] : []),
    { href: `${base}/policies`, label: "Policies" },
  ];
  return (
    <footer className="border-t border-line bg-surface pb-24 md:pb-0">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr] md:py-14">
        <div>
          <Logo text={hotel.logoText} href={base} />
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">{hotel.intro}</p>
          <div className="mt-5 flex gap-2">
            {(Object.keys(icons) as (keyof typeof icons)[]).map((k) =>
              hotel.social[k] ? (
                <a key={k} href={hotel.social[k]} aria-label={k} className="grid size-10 place-items-center rounded-full border border-line text-muted hover:border-brand-ring hover:text-action">
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>{icons[k]}</svg>
                </a>
              ) : null,
            )}
          </div>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm font-semibold"><T>Visit</T></p>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 text-[15px] text-muted md:grid-cols-1 md:gap-y-1.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-block py-1.5 hover:text-ink md:py-0.5"><T>{l.label}</T></Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold"><T>Contact</T></p>
          <ul className="mt-3 space-y-3 text-[15px] text-muted">
            <li className="flex gap-3"><MapPin className="mt-0.5 size-[18px] shrink-0" /> {hotel.address}</li>
            <li><a href={`tel:${hotel.phone.replace(/[^+\d]/g, "")}`} className="flex gap-3 hover:text-ink"><Phone className="size-[18px] shrink-0" /> {hotel.phone}</a></li>
            <li><a href={`mailto:${hotel.email}`} className="flex gap-3 hover:text-ink"><Mail className="size-[18px] shrink-0" /> {hotel.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-5 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {hotel.name}</span>
          <span><T>Website & booking by</T> <span className="font-semibold text-ink">BinGi</span></span>
        </div>
      </div>
    </footer>
  );
}
