// Data adapter. Today: demo data. Later: BinGi HMS public API (see technology/data-contract.md).
import { azureBay, azureBayPaused } from "@/data/azure-bay";
import type { Hotel } from "./types";

const HOTELS: Record<string, Hotel> = { [azureBay.slug]: azureBay, [azureBayPaused.slug]: azureBayPaused };

export async function getHotel(slug: string): Promise<Hotel | null> {
  return HOTELS[slug] ?? null;
}

/** Hotels prerendered at build time. Paused sites render on request. */
export function listHotelSlugs(): string[] {
  return Object.values(HOTELS).filter((h) => h.status === "live").map((h) => h.slug);
}

export function formatMoney(v: number, currency = "BDT"): string {
  const n = new Intl.NumberFormat("en-IN").format(Math.round(v));
  return currency === "BDT" ? `৳${n}` : `${currency} ${n}`;
}

/** Pages that have data. Empty sections disappear from the nav automatically. */
export function availablePages(h: Hotel) {
  return {
    dining: h.outlets.length > 0,
    experiences: h.services.some((s) => s.photo),
    offers: h.offers.some((o) => o.kind === "discount" || h.flags.packages),
    events: h.flags.events,
  };
}

export function visibleOffers(h: Hotel) {
  return h.offers.filter((o) => o.kind === "discount" || h.flags.packages);
}

/** Ratings shown only with 5+ real reviews. */
export function showRating(h: Hotel) {
  return h.reviewScore !== undefined && h.reviewCount >= 5;
}
