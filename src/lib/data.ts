// Data adapter. Today: demo data. Later: BinGi HMS public API (see technology/data-contract.md).
import { azureBay, azureBayPaused } from "@/data/azure-bay";
import { seaPearl } from "@/data/sea-pearl";
import { teaValley } from "@/data/tea-valley";
import type { Hotel } from "./types";

const HOTELS: Record<string, Hotel> = { [azureBay.slug]: azureBay, [seaPearl.slug]: seaPearl, [teaValley.slug]: teaValley, [azureBayPaused.slug]: azureBayPaused };

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

/** Plan → which master layout and modules the website may show. */
export const PLAN_RULES = {
  starter: { masters: ["nest"], restaurant: false, events: false },
  business: { masters: ["nest", "city"], restaurant: false, events: false },
  ultra: { masters: ["nest", "city", "grand"], restaurant: true, events: true },
  enterprise: { masters: ["nest", "city", "grand"], restaurant: true, events: true },
} as const;

/** Pages shown = allowed by the plan AND have data. Empty sections disappear from the nav automatically. */
export function availablePages(h: Hotel) {
  const rule = PLAN_RULES[h.plan];
  return {
    dining: rule.restaurant && h.outlets.length > 0,
    experiences: h.services.some((s) => s.photo),
    offers: h.offers.some((o) => o.kind === "discount" || h.flags.packages),
    events: rule.events && h.flags.events,
  };
}

export function visibleOffers(h: Hotel) {
  return h.offers.filter((o) => o.kind === "discount" || h.flags.packages);
}

/** Ratings shown only with 5+ real reviews. */
export function showRating(h: Hotel) {
  return h.reviewScore !== undefined && h.reviewCount >= 5;
}
