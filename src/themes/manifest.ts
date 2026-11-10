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
  /** Paid themes are bought in the Theme Store (any plan); they are not unlocked by the plan. */
  paid?: boolean;
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
  cottage: {
    id: "cottage",
    name: "COTTAGE",
    version: "1.0",
    tagline: "Earthy and slow",
    description: "For cottages, eco-lodges and hill or village stays: one big row per cottage, the day told hour by hour, clear directions.",
    minPlan: "starter",
    bestFor: ["cottage", "guest-house", "home", "resort"],
    demo: "mistwood",
    defaultHeading: "serif",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Arched photo, headline, intro and booking bar.", required: true, fields: heroFields },
      { id: "cottages", name: "Cottages", description: "One large row per cottage with a Book button.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 60, fallback: () => "Each cottage has its own corner of the hill" }] },
      { id: "day", name: "A day here", description: "Morning to night, from meals, walks and the bonfire.", source: "services" },
      { id: "host", name: "Your host", description: "Host note and a message button.", source: "host" },
      { id: "getting-here", name: "Getting here", description: "Travel times, address and directions.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "book-band", name: "Book your stay", description: "Closing photo band with prices and phone.", source: "contact" },
    ],
  },
  villa: {
    id: "villa",
    name: "VILLA",
    version: "1.0",
    tagline: "Private and spacious",
    description: "For private villas and pool villas: whole-villa specs, a photo walk-through, what is included and house rules.",
    minPlan: "business",
    bestFor: ["villa", "home", "resort"],
    demo: "shalbon",
    defaultHeading: "serif",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Full-width photo, headline and booking bar.", required: true, fields: heroFields },
      { id: "villas", name: "The villas", description: "Each villa with bedrooms, guests, size and pool.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 50, fallback: () => "Choose your villa" }] },
      { id: "inside", name: "Inside", description: "Photo walk-through of living, kitchen, bedrooms and pool.", source: "gallery" },
      { id: "included", name: "Included & on request", description: "Housekeeping, cook, BBQ and pickup.", source: "services" },
      { id: "rules", name: "House rules", description: "Check-in, deposit, guests and quiet hours.", source: "contact" },
      { id: "location", name: "Location", description: "Travel times and directions.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "enquire", name: "Events & long stays", description: "WhatsApp band for parties, shoots and long stays.", source: "contact" },
    ],
  },
  flat: {
    id: "flat",
    name: "FLAT",
    version: "1.0",
    tagline: "Practical long stays",
    description: "For flats and serviced apartments: nightly and monthly prices, long-stay codes, what each flat has and the neighbourhood.",
    minPlan: "business",
    bestFor: ["serviced-apartment", "home", "hotel"],
    demo: "lakeview",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Headline, nightly and monthly price, photo and booking bar.", required: true, fields: heroFields },
      { id: "apartments", name: "Apartments", description: "Each flat with size, bedrooms, kitchen and price per night / month.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 50, fallback: () => "Find your flat" }] },
      { id: "long-stay", name: "Long-stay prices", description: "Weekly and monthly codes from HMS discounts.", source: "offers" },
      { id: "amenities", name: "Every flat has", description: "Kitchen, Wi-Fi, washer, backup power and security.", source: "facilities" },
      { id: "neighbourhood", name: "Neighbourhood", description: "Walk and drive times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "faq", name: "Questions", description: "Check-in, ID, utilities and cleaning.", source: "contact" },
    ],
  },
  escape: {
    id: "escape",
    name: "ESCAPE",
    version: "1.0",
    tagline: "Relaxed and sunny",
    description: "For beach, island and nature resorts on the Business plan: big photos, stays, things to do and how to get there.",
    minPlan: "business",
    bestFor: ["resort", "hotel", "cottage"],
    demo: "coral-cove",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Full-screen photo, headline and floating booking bar.", required: true, fields: heroFields },
      { id: "stays", name: "Stays", description: "Rooms and cottages in a swipe row.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Where you'll sleep" }] },
      { id: "days", name: "Your days", description: "Activities guests can add.", source: "services" },
      { id: "unwind", name: "Eat & unwind", description: "Meals, spa and the pool from facilities.", source: "facilities" },
      { id: "offers", name: "Offers", description: "Direct-booking discounts.", source: "offers" },
      { id: "getting-here", name: "Getting here", description: "Ferry, road and travel times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
  bunk: {
    id: "bunk",
    name: "BUNK",
    version: "1.0",
    tagline: "Young and social",
    description: "For hostels and backpacker stays: price per bed, dorms and privates, hostel life and simple house rules.",
    minPlan: "starter",
    bestFor: ["hostel", "guest-house"],
    demo: "wave-bunk",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Big headline, bed price and photo collage.", required: true, fields: heroFields },
      { id: "beds", name: "Pick your bed", description: "Dorm beds and private rooms with price per bed.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Pick your bed" }] },
      { id: "life", name: "Hostel life", description: "Common areas, events and add-ons.", source: "facilities" },
      { id: "rules", name: "House rules", description: "Quiet hours, lockers, ID and age.", source: "contact" },
      { id: "getting-here", name: "Getting here", description: "Bus, beach and travel times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
  drift: {
    id: "drift",
    name: "DRIFT",
    version: "1.0",
    tagline: "Life on the water",
    description: "Paid theme for houseboats and river stays: living water on your photo, cabins as depth cards, a day on board.",
    minPlan: "starter",
    paid: true,
    bestFor: ["other", "resort", "villa"],
    demo: "haor-bilash",
    defaultHeading: "serif",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Your photo with moving water, headline and booking bar.", required: true, fields: heroFields },
      { id: "cabins", name: "Cabins", description: "Every cabin as a depth card with price.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Choose your cabin" }] },
      { id: "day", name: "A day on board", description: "Timeline from Property Info › Day plan (hidden when empty).", source: "contact", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "A day on the water" }] },
      { id: "life", name: "On the boat", description: "Facilities with a living photo.", source: "facilities" },
      { id: "extras", name: "Add to your trip", description: "Canoe, pickup and other extras.", source: "services" },
      { id: "faq", name: "Questions", description: "Boarding, season and network.", source: "contact" },
      { id: "getting-here", name: "Getting here", description: "Boarding point and travel times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
      { id: "book-band", name: "Closing band", description: "Sunset photo with Book and WhatsApp.", source: "contact", fields: [{ key: "title", label: "Headline", type: "text", max: 60, fallback: () => "Your cabin is waiting on the water" }] },
    ],
  },
  canopy: {
    id: "canopy",
    name: "CANOPY",
    version: "1.0",
    tagline: "Up in the trees",
    description: "Paid theme for treehouses and eco stays: 3D photo with fireflies and a height ruler from your treehouses.",
    minPlan: "starter",
    paid: true,
    bestFor: ["cottage", "other", "resort"],
    demo: "canopy-nest",
    defaultHeading: "serif",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "3D photo, fireflies, headline and booking bar.", required: true, fields: heroFields },
      { id: "treehouses", name: "Treehouses", description: "Height ruler (from room details like “6 m up”) and depth cards.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 50, fallback: () => "How high would you like to sleep?" }] },
      { id: "forest", name: "Life in the forest", description: "Facilities on a dark forest band.", source: "facilities" },
      { id: "experiences", name: "Experiences", description: "Guided walks and activities with photos.", source: "services" },
      { id: "faq", name: "Good to know", description: "Stairs, children, power, wildlife.", source: "contact" },
      { id: "getting-here", name: "Getting here", description: "Travel times and directions.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
  pod: {
    id: "pod",
    name: "POD",
    version: "1.0",
    tagline: "Sleep in the future",
    description: "Paid theme for capsule hotels: neon light field and a capsule wall built from your real bed setup.",
    minPlan: "starter",
    paid: true,
    bestFor: ["hostel", "other"],
    demo: "skypod",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Neon field, capsule photo, pod price and booking bar.", required: true, fields: heroFields },
      { id: "wall", name: "Capsule wall", description: "Pods drawn from HMS › Rooms beds; pick a pod type.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Pick your pod type" }] },
      { id: "stays", name: "Pods and rooms", description: "Every stay type as a depth card.", source: "rooms" },
      { id: "facilities", name: "Inside", description: "Showers, lockers, lounge.", source: "facilities" },
      { id: "rules", name: "Good to know", description: "Check-in, house rules and questions.", source: "contact" },
      { id: "getting-here", name: "Getting here", description: "Airport and travel times.", source: "nearby" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
  orbit: {
    id: "orbit",
    name: "ORBIT",
    version: "1.0",
    tagline: "Every floor, at a glance",
    description: "Paid theme for city and tower hotels: 3D photo of the building and a 3D floor stack from your Rooms setup.",
    minPlan: "starter",
    paid: true,
    bestFor: ["hotel", "serviced-apartment"],
    demo: "altura",
    defaultHeading: "sans",
    features: { extras: true, promoCode: true, advance: true, diningPage: false, eventsPage: false },
    pages: commonPages,
    sections: [
      { id: "hero", name: "Hero", description: "Tower in 3D photo, headline, highlights and booking bar.", required: true, fields: heroFields },
      { id: "floors", name: "Floor by floor", description: "3D floor stack from HMS › Rooms floors and units.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Find your floor" }] },
      { id: "rooms", name: "Rooms & suites", description: "Room cards with size and price.", source: "rooms", fields: [{ key: "title", label: "Section title", type: "text", max: 40, fallback: () => "Rooms with a view" }] },
      { id: "amenities", name: "In the building", description: "Pool, lobby and facilities bento.", source: "facilities" },
      { id: "location", name: "Location", description: "Walk and drive times.", source: "nearby" },
      { id: "offers", name: "Offers", description: "Direct-booking discounts.", source: "offers" },
      { id: "reviews", name: "Reviews", description: "Guest reviews (rating shows from 5 reviews).", source: "reviews" },
    ],
  },
};

export const MASTER_LIST: ThemeManifest[] = [MANIFESTS.nest, MANIFESTS.cottage, MANIFESTS.bunk, MANIFESTS.city, MANIFESTS.villa, MANIFESTS.flat, MANIFESTS.escape, MANIFESTS.grand];
/** Paid themes (Theme Store). */
export const PAID_LIST: ThemeManifest[] = [MANIFESTS.drift, MANIFESTS.canopy, MANIFESTS.pod, MANIFESTS.orbit];

export const planAllows = (plan: Plan, min?: Plan) => !min || PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);

/** Sections this hotel can use in this theme (property type + plan). */
export function sectionsFor(m: ThemeManifest, h: Hotel) {
  return m.sections.map((s) => ({
    ...s,
    available: planAllows(h.plan, s.minPlan) && (!s.propertyTypes || s.propertyTypes.includes(h.propertyType)),
  }));
}
