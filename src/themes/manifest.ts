// Theme Manifest — every master theme describes itself here.
// HMS → Website Management builds its forms, toggles, section list and plan locks from this.
// A new theme = a new Home component + a new manifest entry. No new admin screens.
import type { Hotel, MasterTheme, PropertyType } from "@/lib/types";

export type Plan = Hotel["plan"];
export const PLAN_ORDER: Plan[] = ["starter", "business", "ultra", "enterprise"];
export const PLAN_LABEL: Record<Plan, string> = { starter: "Starter", business: "Business", ultra: "Ultra", enterprise: "Enterprise" };

export type FieldDef = {
  key: string; // stored as `<sectionId>.<key>` in the site record
  label: string;
  type: "text" | "textarea";
  max?: number;
  /** Where the default comes from when the hotel hasn't typed anything. */
  fallback?: (h: Hotel) => string;
  hint?: string;
};

export type DataSource = "rooms" | "reviews" | "offers" | "services" | "facilities" | "nearby" | "host" | "gallery" | "outlets" | "contact";

export type SectionDef = {
  id: string;
  name: string;
  description: string;
  required?: boolean; // cannot be hidden or moved (hero)
  source?: DataSource; // reads HMS data; the admin links to that module
  fields?: FieldDef[];
  /** Only for these property types (e.g. host = guest house / home). */
  propertyTypes?: PropertyType[];
  /** Only from this plan up (e.g. dining = Ultra). */
  minPlan?: Plan;
};

export type PageDef = { id: string; name: string; path: string; system: boolean; minPlan?: Plan; needs?: "dining" | "events" | "experiences" | "offers" };

export type ThemeManifest = {
  id: MasterTheme;
  name: string;
  version: string;
  tagline: string;
  description: string;
  minPlan: Plan;
  bestFor: PropertyType[];
  demo: string; // demo hotel slug, used for the preview
  defaultHeading: "sans" | "serif";
  features: { extras: boolean; promoCode: boolean; advance: boolean; diningPage: boolean; eventsPage: boolean };
  pages: PageDef[];
  sections: SectionDef[];
};

const heroFields: FieldDef[] = [
  { key: "title", label: "Headline", type: "text", max: 70, fallback: (h) => h.tagline, hint: "One line guests read first." },
  { key: "intro", label: "Short intro", type: "textarea", max: 180, fallback: (h) => h.intro },
];

const commonPages: PageDef[] = [
  { id: "home", name: "Home", path: "/", system: true },
  { id: "rooms", name: "Rooms", path: "/rooms", system: true },
  { id: "experiences", name: "Experiences", path: "/experiences", system: false, needs: "experiences" },
  { id: "offers", name: "Offers", path: "/offers", system: false, needs: "offers" },
  { id: "explore", name: "Explore", path: "/explore", system: false },
  { id: "policies", name: "Policies", path: "/policies", system: true },
  { id: "my-trip", name: "My Trip", path: "/my-trip", system: true },
];

export const MANIFESTS: Record<MasterTheme, ThemeManifest> = {
  nest: {
    id: "nest",
    name: "NEST",
    version: "1.0",
    tagline: "Warm and personal",
    description: "One warm page for small hotels, guest houses and homes: rooms, the host and how to get there.",
    minPlan: "starter",
    bestFor: ["guest-house", "home", "hostel", "hotel"],
    demo: "tea-valley",
    defaultHeading: "serif",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Headline, intro, booking bar and three photos.", required: true, fields: heroFields },
      { id: "rooms", name: "Rooms", description: "Every room with a Book button.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 50, fallback: (h) => (h.rooms.length > 1 ? `${h.rooms.length} rooms, each a little different` : "Your room") }] },
      { id: "host", name: "Your host", description: "Host name, note and a message button.", source: "host", propertyTypes: ["guest-house", "home"] },
      { id: "life", name: "Life here", description: "Facilities with one photo.", source: "facilities" },
      { id: "extras", name: "Add to your stay", description: "Meals, walks and pickup guests can add.", source: "services" },
      { id: "getting-here", name: "Getting here", description: "Address, directions and travel times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "book-band", name: "Book your stay", description: "Closing band with rooms and phone.", source: "contact" },
    ],
  },
  city: {
    id: "city",
    name: "CITY",
    version: "2.0",
    tagline: "Clean and practical",
    description: "Editorial city and business hotel layout: wide hero, rooms, meetings and location.",
    minPlan: "business",
    bestFor: ["hotel", "serviced-apartment"],
    demo: "sea-pearl",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Headline, intro, wide photo and docked booking bar.", required: true, fields: heroFields },
      { id: "quick-links", name: "Quick links (phone)", description: "Rooms, experiences and offers tiles on phone." },
      { id: "facts", name: "Key facts", description: "Four facts in one row.", source: "facilities" },
      { id: "rooms", name: "Rooms", description: "Room cards with price per night.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Choose your room" }] },
      { id: "work-stay", name: "Work & unwind", description: "Meeting rooms and pool, two large photos.", source: "services" },
      { id: "location", name: "Location", description: "Travel times and directions.", source: "nearby" },
      { id: "offers", name: "Offers", description: "Direct-booking discounts.", source: "offers" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
  grand: {
    id: "grand",
    name: "GRAND",
    version: "1.0",
    tagline: "Luxury and cinematic",
    description: "Full-screen photos, dining, experiences and events for resorts and premium hotels.",
    minPlan: "ultra",
    bestFor: ["resort", "hotel"],
    demo: "azure-bay",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: true, eventsPage: true },
    pages: [
      ...commonPages.slice(0, 2),
      { id: "dining", name: "Dining", path: "/dining", system: false, minPlan: "ultra", needs: "dining" },
      ...commonPages.slice(2, 5),
      { id: "events", name: "Events", path: "/events", system: false, minPlan: "ultra", needs: "events" },
      ...commonPages.slice(5),
    ],
    sections: [
      { id: "hero", name: "Hero", description: "Full-screen photo with headline and booking bar.", required: true, fields: heroFields },
      { id: "quick-links", name: "Quick links (phone)", description: "Rooms, dining, experiences tiles on phone." },
      { id: "facts", name: "Key facts", description: "Check-in, check-out, cancellation, rating.", source: "facilities" },
      { id: "featured-stays", name: "Featured stays", description: "Featured rooms and villas.", source: "rooms" },
      { id: "dine-do", name: "Dine & do", description: "Restaurants and experiences.", source: "outlets", minPlan: "ultra" },
      { id: "offers", name: "Offers", description: "Direct-booking discounts.", source: "offers" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "location", name: "Location", description: "Map, address and directions.", source: "nearby" },
    ],
  },
};

export const MASTER_LIST: ThemeManifest[] = [MANIFESTS.nest, MANIFESTS.city, MANIFESTS.grand];

export const planAllows = (plan: Plan, min?: Plan) => !min || PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);

/** Sections this hotel can use in this theme (property type + plan). */
export function sectionsFor(m: ThemeManifest, h: Hotel) {
  return m.sections.map((s) => ({
    ...s,
    available: planAllows(h.plan, s.minPlan) && (!s.propertyTypes || s.propertyTypes.includes(h.propertyType)),
  }));
}
