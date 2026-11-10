// Theme Store catalog — paid aesthetic/3D themes (plan: claude/design/Paid_Themes_Plan_v2.md).
// Included themes come with the subscription; these are bought per property as a monthly add-on.
// Prices are NOT decided: they come from Super Admin versioned pricing (null = not set yet).
import type { Hotel, MasterTheme, PaidTheme, PropertyType } from "@/lib/types";
import { PLAN_RULES } from "@/lib/data";

export type Tier = "A" | "B" | "C";
export const TIER: Record<Tier, { name: string; desc: string }> = {
  A: { name: "Aesthetic", desc: "Depth cards and 3D photo" },
  B: { name: "Living", desc: "+ live backgrounds (water, light, sky)" },
  C: { name: "Immersive", desc: "+ interactive 3D built from your own data" },
};
/** Monthly price per property, from Super Admin pricing. null until BinGi sets it. */
export const TIER_PRICE: Record<Tier, number | null> = { A: null, B: null, C: null };

export type Motion = "calm" | "lively" | "immersive";
export const MOTION_LABEL: Record<Motion, { name: string; desc: string }> = {
  calm: { name: "Calm", desc: "No moving effects. Fastest." },
  lively: { name: "Lively", desc: "Soft depth and gentle motion." },
  immersive: { name: "Immersive 3D", desc: "Full 3D effects on capable devices." },
};

export type StoreTheme = {
  id: PaidTheme | string;
  name: string;
  tier: Tier;
  status: "available" | "coming-soon";
  tagline: string;
  description: string;
  bestFor: string;
  propertyTypes: PropertyType[];
  fx: string[];
  /** Highest motion level the theme offers. */
  maxMotion: Motion;
  /** Needed plan (only ATLAS: multi-property data). */
  minPlan?: Hotel["plan"];
  /** Included theme the site returns to if the licence ends and the hotel had no included theme chosen. */
  fallback?: MasterTheme;
  demo?: string;
};

export const STORE: StoreTheme[] = [
  { id: "drift", name: "DRIFT", tier: "B", status: "available", tagline: "Life on the water", description: "For houseboats and river stays: the water in your own hero photo moves, cabins read like a deck plan and a day on board is laid out hour by hour.", bestFor: "Houseboats, river cruises, lake stays", propertyTypes: ["other", "resort", "villa"], fx: ["Living water on your photo", "Depth cards"], maxMotion: "immersive", fallback: "escape", demo: "haor-bilash" },
  { id: "canopy", name: "CANOPY", tier: "A", status: "available", tagline: "Up in the trees", description: "For treehouses and eco stays: your forest photo gains depth as guests move, fireflies come out at dusk and every treehouse shows how high it sits.", bestFor: "Treehouses, eco lodges, jungle stays", propertyTypes: ["cottage", "other", "resort"], fx: ["3D photo (depth parallax)", "Fireflies", "Depth cards"], maxMotion: "lively", fallback: "cottage", demo: "canopy-nest" },
  { id: "pod", name: "POD", tier: "B", status: "available", tagline: "Sleep in the future", description: "For capsule hotels and pod hostels: a glowing capsule wall built from your real bed data, so guests see pod types, levels and prices at a glance.", bestFor: "Capsule hotels, pod hostels, transit stays", propertyTypes: ["hostel", "other"], fx: ["Capsule wall from your beds", "Neon light field", "Depth cards"], maxMotion: "immersive", fallback: "bunk", demo: "skypod" },
  { id: "orbit", name: "ORBIT", tier: "C", status: "available", tagline: "Every floor, at a glance", description: "For city and tower hotels: a 3D floor stack drawn from your room setup — tap a floor to see its rooms, views and prices.", bestFor: "City hotels, tower hotels, business hotels", propertyTypes: ["hotel", "serviced-apartment"], fx: ["3D floor stack from your Rooms setup", "3D photo", "Depth cards"], maxMotion: "immersive", fallback: "city", demo: "altura" },
  { id: "starcamp", name: "STARCAMP", tier: "A", status: "coming-soon", tagline: "Nights under the stars", description: "Glamping and camping with a live night sky and a day/night switch.", bestFor: "Glamping, tents, camps", propertyTypes: ["other", "cottage"], fx: ["Starfield", "Day / night"], maxMotion: "lively" },
  { id: "uthan", name: "UTHAN", tier: "A", status: "coming-soon", tagline: "Home in the village", description: "Village homestays with a hand-drawn 2.5D village and the host's story, Bangla first.", bestFor: "Village homestays, host families", propertyTypes: ["home", "guest-house"], fx: ["Illustrated parallax"], maxMotion: "lively" },
  { id: "prism", name: "PRISM", tier: "A", status: "coming-soon", tagline: "Light and glass", description: "Boutique and design hotels with glass layers and refracted light.", bestFor: "Boutique and design hotels", propertyTypes: ["hotel"], fx: ["Glass cards", "Light refraction"], maxMotion: "lively" },
  { id: "summit", name: "SUMMIT", tier: "B", status: "coming-soon", tagline: "Above the clouds", description: "Hill and mountain lodges with drifting fog and layered ridges.", bestFor: "Hill resorts, chalets, mountain lodges", propertyTypes: ["resort", "cottage"], fx: ["Fog", "Layered ridges"], maxMotion: "immersive" },
  { id: "haven", name: "HAVEN", tier: "B", status: "coming-soon", tagline: "Breathe slower", description: "Wellness and spa retreats with soft shapes that move to a breathing rhythm.", bestFor: "Wellness retreats, spas, yoga stays", propertyTypes: ["resort"], fx: ["Breathing shapes"], maxMotion: "immersive" },
  { id: "noir", name: "NOIR", tier: "B", status: "coming-soon", tagline: "After dark", description: "Dark luxury for rooftop and night-life hotels, with city lights.", bestFor: "Rooftop hotels, night luxury", propertyTypes: ["hotel"], fx: ["City lights", "Dark luxury"], maxMotion: "immersive" },
  { id: "zamindar", name: "ZAMINDAR", tier: "C", status: "coming-soon", tagline: "A house with a story", description: "Heritage houses and rajbaris told as a scroll story.", bestFor: "Heritage hotels, palaces", propertyTypes: ["hotel", "guest-house"], fx: ["Scroll story", "3D photo"], maxMotion: "immersive" },
  { id: "atlas", name: "ATLAS", tier: "C", status: "coming-soon", tagline: "All your properties", description: "Hotel groups: a 3D map of Bangladesh with every property you run.", bestFor: "Hotel groups and chains", propertyTypes: ["hotel", "resort"], fx: ["3D map from your properties"], maxMotion: "immersive", minPlan: "enterprise" },
];

export const PAID_IDS: PaidTheme[] = ["drift", "canopy", "pod", "orbit"];
export const isPaid = (m: string): m is PaidTheme => (PAID_IDS as string[]).includes(m);
export const storeTheme = (id: string) => STORE.find((t) => t.id === id);

/** Motion levels a theme allows (paid themes only; included themes stay calm). */
export function motionLevels(m: string): Motion[] {
  const t = storeTheme(m);
  if (!t) return ["calm"];
  return t.maxMotion === "immersive" ? ["calm", "lively", "immersive"] : t.maxMotion === "lively" ? ["calm", "lively"] : ["calm"];
}

/** Included theme the site shows when a paid licence is not active. */
export function fallbackMaster(h: Hotel): MasterTheme {
  const allowed = PLAN_RULES[h.plan].masters as readonly MasterTheme[];
  if (!isPaid(h.theme.master) && allowed.includes(h.theme.master)) return h.theme.master;
  const f = storeTheme(h.theme.master)?.fallback;
  return f && allowed.includes(f) ? f : allowed[0];
}
