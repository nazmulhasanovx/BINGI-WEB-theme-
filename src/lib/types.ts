import type { ThemeId } from "./theme";

export type Money = number; // in hotel currency units (BDT)

export interface RoomCategory {
  id: string;
  slug: string;
  name: string;
  kind: "room" | "suite" | "villa" | "cottage";
  short: string;
  description: string;
  fromPrice: Money; // per night, before tax
  maxAdults: number;
  maxChildren: number;
  bed: string;
  sizeSqft?: number;
  view?: string;
  units: number;
  amenities: string[];
  photos: string[];
  featured?: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: "spa" | "transfer" | "dining" | "celebration" | "activity" | "stay";
  short: string;
  price: Money;
  unit: string; // "per person", "per trip"…
  photo?: string;
  addToStay: boolean; // can be added to a booking as an extra
}

export interface Outlet {
  id: string;
  name: string;
  kind: "restaurant" | "bar" | "cafe" | "room-service";
  short: string;
  hours: string;
  location: string;
  photo?: string;
  tableRequest: boolean; // D4: endpoint to confirm — shown as "Request a table"
}

export interface MenuItem {
  id: string;
  outletId: string;
  name: string;
  tags: string[];
  short: string;
  price: Money;
  photo?: string;
}

export interface Offer {
  id: string;
  title: string;
  short: string;
  kind: "discount" | "package"; // packages = planned, hidden unless flag on
  value: string; // "15% off"
  conditions: string;
  photo?: string;
  validUntil?: string;
}

export interface Review {
  id: string;
  name: string;
  from: string;
  score: number; // out of 5
  text: string;
  stayed: string; // "Oct 2026"
}

export type PaymentMethod =
  | { kind: "pay-at-property" }
  | { kind: "mfs-manual"; provider: "bKash" | "Nagad" | "Rocket"; number: string }
  | { kind: "advance"; percent: number }
  | { kind: "card-online"; gatewayApproved: boolean };

export interface Hotel {
  slug: string;
  name: string;
  type: string; // "5-star beach resort"
  stars?: number;
  tagline: string;
  intro: string;
  logoText: string;
  heroPhoto: string;
  area: string;
  city: string;
  country: string;
  address: string;
  mapUrl?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  currency: "BDT";
  checkIn: string;
  checkOut: string;
  highlights: string[];
  facilities: { name: string; short: string; icon: string }[];
  gallery: string[];
  rooms: RoomCategory[];
  services: ServiceItem[];
  outlets: Outlet[];
  menu: MenuItem[];
  offers: Offer[];
  reviews: Review[];
  reviewScore?: number;
  reviewCount: number;
  policies: { cancellation: string; children: string; pets: string; tax: string };
  payments: PaymentMethod[];
  taxes: { vatPercent: number; serviceChargePercent: number; inclusive: boolean };
  social: { facebook?: string; instagram?: string; youtube?: string };
  theme: { id: ThemeId; heading: "sans" | "serif" };
  flags: { packages: boolean; events: boolean };
  plan: "starter" | "business" | "ultra" | "enterprise";
}
