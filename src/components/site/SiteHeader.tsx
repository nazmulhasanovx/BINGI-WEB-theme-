"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowRight, CalendarDays, Menu, MessageCircle, Phone, User } from "lucide-react";
import { Logo } from "./Logo";
import { Sheet } from "@/components/ui/Sheet";
import { useBooking } from "@/components/booking/BookingProvider";
import type { NavItem } from "./nav";
import { LangToggle, useT } from "@/lib/i18n";
import { useSiteView } from "@/lib/site";
import type { HeaderStyle } from "@/themes/style";

export function SiteHeader({
  nav,
  logoText,
  phone,
  whatsapp,
  base,
  variant = "classic",
}: {
  nav: NavItem[];
  logoText: string;
  phone: string;
  whatsapp?: string;
  base: string;
  /** Header style of the theme (themes/style.ts). */
  variant?: HeaderStyle;
}) {
  // Menu items the hotel turned off in Website Management › Pages & Navigation.
  const doc = useSiteView(base.split("/").pop() ?? "");
  if (doc?.info.phone) phone = doc.info.phone;
  if (doc) whatsapp = doc.info.whatsapp || undefined;
  nav = doc ? nav.filter((n) => doc.pages[n.href === base ? "home" : (n.href.split("/").pop() ?? "")]?.menu !== false) : nav;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const { openSearch } = useBooking();
  const t = useT();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const isActive = (href: string) => (href === base ? pathname === base : pathname.startsWith(href));

  const home = pathname === base;
  const overlay = variant === "overlay" && home;
  const navLink = (n: NavItem, big = false) => (
    <Link
      href={n.href}
      aria-current={isActive(n.href) ? "page" : undefined}
      className={clsx(
        "relative rounded-full px-4 py-2 font-medium transition-colors",
        big ? "text-[14px] uppercase tracking-[0.14em]" : "text-[15px]",
        isActive(n.href) ? "sh-ink text-ink" : "sh-muted text-muted hover:text-ink",
      )}
    >
      {t(n.label)}
      {isActive(n.href) && <span className="sh-bar absolute inset-x-4 -bottom-[13px] h-[2px] rounded-full bg-brand" />}
    </Link>
  );
  const book = (
    <button onClick={openSearch} className="hidden h-11 items-center gap-2 rounded-full bg-action px-5 text-[15px] font-semibold text-on-action shadow-[0_8px_20px_-10px_var(--action)] transition-transform active:scale-[0.98] md:flex">
      <CalendarDays className="size-[18px]" /> {t("Book now")}
    </button>
  );
  const trip = (
    <Link href={`${base}/my-trip`} aria-label={t("My Trip")} title={t("My Trip")} className="sh-ghost hidden size-11 place-items-center rounded-full border border-line text-ink hover:bg-canvas md:grid">
      <User className="size-[18px]" />
    </Link>
  );
  const burger = (always = false) => (
    <button onClick={() => setMenu(true)} aria-label="Open menu" className={clsx("sh-ghost grid size-10 place-items-center rounded-full bg-canvas sm:size-11 sm:border sm:border-line sm:bg-transparent", !always && "lg:hidden")}>
      <Menu className="sh-ink size-5" />
    </button>
  );
  const half = Math.ceil(nav.length / 2);

  return (
    <>
      <header
        data-overlay={overlay ? "1" : undefined}
        data-scrolled={scrolled ? "1" : undefined}
        data-variant={variant}
        className={clsx(
          "site-header sticky top-0 z-40 border-b bg-surface/90 backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200",
          scrolled ? "border-line shadow-[0_6px_20px_-16px_rgb(22_24_29/0.35)]" : variant === "centered" ? "border-line" : "border-transparent",
        )}
      >
        {variant === "centered" ? (
          <div className="relative mx-auto flex h-[var(--header-h)] max-w-[1240px] items-center gap-4 px-4 sm:px-6 lg:grid lg:h-[84px] lg:grid-cols-[1fr_auto_1fr]">
            <nav aria-label="Main" className="hidden lg:block"><ul className="flex items-center gap-1">{nav.slice(0, half).map((n) => <li key={n.href}>{navLink(n, true)}</li>)}</ul></nav>
            <span className="lg:justify-self-center"><Logo text={logoText} href={base} /></span>
            <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:justify-self-end">
              <nav aria-label="More" className="hidden lg:block"><ul className="flex items-center gap-1">{nav.slice(half).map((n) => <li key={n.href}>{navLink(n, true)}</li>)}</ul></nav>
              {trip}
              {burger()}
            </div>
          </div>
        ) : variant === "minimal" ? (
          <div className="mx-auto flex h-[var(--header-h)] max-w-[1240px] items-center gap-3 px-4 sm:px-6">
            <Logo text={logoText} href={base} />
            <div className="ml-auto flex items-center gap-2">
              {book}
              {trip}
              {burger(true)}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-[var(--header-h)] max-w-[1240px] items-center gap-4 px-4 sm:px-6">
            <span className="sh-logo"><Logo text={logoText} href={base} /></span>

            <nav aria-label="Main" className="mx-auto hidden lg:block">
              <ul className="flex items-center gap-1">
                {nav.map((n) => <li key={n.href}>{navLink(n)}</li>)}
              </ul>
            </nav>

            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              {variant === "overlay" ? (
                <>{book}{trip}</>
              ) : (
                <Link
                  href={`${base}/my-trip`}
                  className="hidden h-11 items-center gap-2 rounded-full border border-brand-ring px-4 text-[15px] font-semibold text-action hover:bg-brand-soft md:flex"
                >
                  <User className="size-[18px]" /> {t("My Trip")}
                </Link>
              )}
              {burger()}
            </div>
          </div>
        )}
      </header>

      <Sheet open={menu} onClose={() => setMenu(false)} title={t("Menu")} side="right">
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  onClick={() => setMenu(false)}
                  className={clsx(
                    "flex h-12 items-center justify-between rounded-2xl px-4 text-[17px] font-semibold",
                    isActive(n.href) ? "bg-brand-soft text-action" : "hover:bg-canvas",
                  )}
                >
                  {t(n.label)}
                  <ArrowRight className="size-4 opacity-50" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={() => {
            setMenu(false);
            openSearch();
          }}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-action font-semibold text-on-action"
        >
          <CalendarDays className="size-5" /> {t("Book your stay")}
        </button>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3 text-[15px] font-semibold">
          {t("Language")} <LangToggle />
        </div>
        <div className="mt-4 space-y-2 border-t border-line pt-5 text-[15px]">
          <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="flex h-11 items-center gap-3 rounded-xl px-2 hover:bg-canvas">
            <Phone className="size-5 text-muted" /> {phone}
          </a>
          {whatsapp && (
            <a href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`} className="flex h-11 items-center gap-3 rounded-xl px-2 hover:bg-canvas">
              <MessageCircle className="size-5 text-muted" /> WhatsApp
            </a>
          )}
        </div>
      </Sheet>
    </>
  );
}
