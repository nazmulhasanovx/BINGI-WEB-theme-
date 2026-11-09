"use client";
// Bridges the theme to the site record (HMS → Website Management).
// Live site: published record. Admin preview iframe (?preview=draft): the draft, updating as you type.
// No record (fresh hotel / server render): the theme's defaults from HMS data.
import { useEffect, type ReactNode } from "react";
import type { MasterTheme } from "@/lib/types";
import { slotText, useSiteView } from "@/lib/site";
import { useLang } from "@/lib/i18n";

/** Renders the homepage sections in the order and visibility the hotel chose. */
export function DraftSections({ slug, master, items }: { slug: string; master: MasterTheme; items: { id: string; node: ReactNode }[] }) {
  const doc = useSiteView(slug);
  const state = doc?.sections[master];
  if (!state) return <>{items.map((i) => <SectionFrame key={i.id} id={i.id}>{i.node}</SectionFrame>)}</>;
  const byId = new Map(items.map((i) => [i.id, i]));
  const ordered = [...state.order.filter((id) => byId.has(id)), ...items.map((i) => i.id).filter((id) => !state.order.includes(id))];
  return <>{ordered.filter((id) => !state.hidden.includes(id)).map((id) => <SectionFrame key={id} id={id}>{byId.get(id)!.node}</SectionFrame>)}</>;
}

/** Lets the admin preview scroll to a section (`data-section`). */
function SectionFrame({ id, children }: { id: string; children: ReactNode }) {
  return <div data-section={id} className="contents">{children}</div>;
}

/** A text slot from the manifest (e.g. hero.title), with the HMS value as fallback. */
export function DraftText({ slug, k, fallback }: { slug: string; k: string; fallback: string }) {
  const doc = useSiteView(slug);
  const lang = useLang();
  return <>{slotText(doc, k, fallback, lang)}</>;
}

/** Picks the master layout from the site record (plan-allowed layouts are rendered on the server). */
export function MasterSwitch({ slug, initial, homes }: { slug: string; initial: MasterTheme; homes: Partial<Record<MasterTheme, ReactNode>> }) {
  const doc = useSiteView(slug);
  const master = doc && homes[doc.master] ? doc.master : initial;
  useEffect(() => {
    const el = document.getElementById("hotel-theme");
    if (el) el.dataset.master = master;
  }, [master]);
  return <>{homes[master]}</>;
}

/** Admin preview: scroll to the section being edited (message from Website Management). */
export function PreviewBridge() {
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "bingi:scroll-to") return;
      const el = document.querySelector(`[data-section="${String(e.data.id).replace(/"/g, "")}"] > *`);
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" }); // window only: scrollIntoView would also scroll the admin page around the iframe
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);
  return null;
}

/** Hides a room / offer / review / service the hotel switched off in Website Management. */
export function SiteVisible({ slug, kind, id, children }: { slug: string; kind: "rooms" | "offers" | "reviews" | "services"; id: string; children: ReactNode }) {
  const doc = useSiteView(slug);
  if (!doc) return <>{children}</>;
  const hidden = kind === "reviews" ? doc.hiddenReviews.includes(id) : doc[kind][id]?.visible === false;
  return hidden ? null : <>{children}</>;
}

/** Contact details from Website Management › Property Info. */
export function DraftInfo({ slug, field, fallback }: { slug: string; field: "phone" | "email" | "address" | "whatsapp"; fallback: string }) {
  const doc = useSiteView(slug);
  return <>{doc?.info[field] || fallback}</>;
}
