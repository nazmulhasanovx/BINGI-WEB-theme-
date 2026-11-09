import type { Hotel } from "@/lib/types";
import { availablePages } from "@/lib/data";

export interface NavItem {
  href: string;
  label: string;
}

/** Nav shows only pages that have data for this hotel. */
export function buildNav(h: Hotel): NavItem[] {
  const base = `/hotel/${h.slug}`;
  const p = availablePages(h);
  return [
    { href: base, label: "Home" },
    { href: `${base}/rooms`, label: "Rooms" },
    p.dining && { href: `${base}/dining`, label: "Dining" },
    p.experiences && { href: `${base}/experiences`, label: "Experiences" },
    p.offers && { href: `${base}/offers`, label: "Offers" },
    { href: `${base}/explore`, label: "Explore" },
  ].filter(Boolean) as NavItem[];
}
