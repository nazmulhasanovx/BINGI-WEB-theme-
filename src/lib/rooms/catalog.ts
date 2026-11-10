// Accommodation catalog — from the BinGi Accommodation spec V1.2 (repo: Room-Accomodation-).
// 6 backend Core Types (booking engines) · 14 visible cards (presets that map to a Core Type).
import type { PropertyType } from "@/lib/types";

export type CoreType = "ROOM" | "COTTAGE" | "VILLA" | "APARTMENT" | "DORMITORY" | "OTHER";
export const CORE_TYPES: CoreType[] = ["ROOM", "COTTAGE", "VILLA", "APARTMENT", "DORMITORY", "OTHER"];

export const CORE: Record<CoreType, { label: string; plural: string; desc: string; strategy: "floor" | "zone"; inventory: string }> = {
  ROOM: { label: "Room", plural: "Rooms", desc: "Rooms inside a building, on floors.", strategy: "floor", inventory: "Whole unit" },
  COTTAGE: { label: "Cottage", plural: "Cottages", desc: "Standalone cottages in a zone or garden.", strategy: "zone", inventory: "Whole unit" },
  VILLA: { label: "Villa", plural: "Villas", desc: "Private villas, usually with their own space.", strategy: "zone", inventory: "Whole unit" },
  APARTMENT: { label: "Apartment", plural: "Apartments", desc: "Flats in a tower or building, on floors.", strategy: "floor", inventory: "Whole unit" },
  DORMITORY: { label: "Dormitory", plural: "Dormitories", desc: "Shared rooms where each bed is sold.", strategy: "floor", inventory: "Per bed (or whole room)" },
  OTHER: { label: "Other", plural: "Other stays", desc: "Anything else, sold as a whole unit.", strategy: "zone", inventory: "Whole unit" },
};

export type PresetSlug =
  | "room" | "cottage" | "villa" | "apartment" | "dormitory"
  | "bungalow" | "cabin" | "chalet" | "treehouse" | "glamping" | "houseboat" | "capsule" | "holiday-home"
  | "custom";
export type Preset = { slug: PresetSlug; label: string; core: CoreType; prefix: string; group: "standard" | "specialty" | "other"; desc: string; example: string };

export const PRESETS: Preset[] = [
  { slug: "room", label: "Room", core: "ROOM", prefix: "", group: "standard", desc: "Standard, deluxe, suite…", example: "101, 201" },
  { slug: "cottage", label: "Cottage", core: "COTTAGE", prefix: "C", group: "standard", desc: "Standalone cottage", example: "C01" },
  { slug: "villa", label: "Villa", core: "VILLA", prefix: "V", group: "standard", desc: "Private villa", example: "V01" },
  { slug: "apartment", label: "Apartment", core: "APARTMENT", prefix: "A", group: "standard", desc: "Studio, 1BR, 2BR…", example: "A101" },
  { slug: "dormitory", label: "Dormitory", core: "DORMITORY", prefix: "D", group: "standard", desc: "Beds sold one by one", example: "D101-B01" },
  { slug: "bungalow", label: "Bungalow", core: "COTTAGE", prefix: "B", group: "specialty", desc: "Works like a cottage", example: "B01" },
  { slug: "cabin", label: "Cabin", core: "COTTAGE", prefix: "CB", group: "specialty", desc: "Works like a cottage", example: "CB01" },
  { slug: "chalet", label: "Chalet", core: "COTTAGE", prefix: "CH", group: "specialty", desc: "Works like a cottage", example: "CH01" },
  { slug: "treehouse", label: "Treehouse", core: "OTHER", prefix: "TH", group: "specialty", desc: "Whole unit", example: "TH01" },
  { slug: "glamping", label: "Tent / Glamping", core: "OTHER", prefix: "GL", group: "specialty", desc: "Whole unit", example: "GL01" },
  { slug: "houseboat", label: "Houseboat", core: "OTHER", prefix: "HB", group: "specialty", desc: "Whole unit", example: "HB01" },
  { slug: "capsule", label: "Capsule / Pod", core: "OTHER", prefix: "CP", group: "specialty", desc: "Whole pod, or a bed in a dorm", example: "CP01" },
  { slug: "holiday-home", label: "Holiday Home", core: "VILLA", prefix: "H", group: "specialty", desc: "Villa, or an apartment in a tower", example: "H01" },
  { slug: "custom", label: "Other / Custom", core: "OTHER", prefix: "", group: "other", desc: "Name it yourself", example: "Custom" },
];
export const preset = (slug: string) => PRESETS.find((p) => p.slug === slug) ?? PRESETS[PRESETS.length - 1];
/** Standard cards are fixed; specialty + custom can be switched to the Core Type that matches the real building. */
export const coreChoices = (p: Preset): CoreType[] =>
  p.group === "standard" ? [p.core]
  : p.slug === "holiday-home" ? ["VILLA", "APARTMENT"]
  : p.slug === "capsule" ? ["OTHER", "DORMITORY"]
  : p.group === "specialty" && p.core === "COTTAGE" ? ["COTTAGE", "VILLA", "OTHER"]
  : ["OTHER", "COTTAGE", "VILLA", "ROOM", "APARTMENT"];

// Property Types (spec: 10, single-select) and what they suggest — never a hard restriction.
export const PROPERTY_TYPES: { slug: string; label: string; suggest: CoreType[] }[] = [
  { slug: "hotel", label: "Hotel", suggest: ["ROOM", "APARTMENT", "DORMITORY"] },
  { slug: "resort", label: "Resort", suggest: ["ROOM", "COTTAGE", "VILLA", "APARTMENT", "DORMITORY", "OTHER"] },
  { slug: "guest-house", label: "Guest House", suggest: ["ROOM", "APARTMENT", "DORMITORY"] },
  { slug: "motel", label: "Motel", suggest: ["ROOM", "COTTAGE", "APARTMENT"] },
  { slug: "hostel", label: "Hostel", suggest: ["DORMITORY", "ROOM", "APARTMENT"] },
  { slug: "homestay", label: "Homestay", suggest: ["ROOM", "APARTMENT", "COTTAGE", "VILLA"] },
  { slug: "serviced-apartment", label: "Serviced Apartment", suggest: ["APARTMENT", "ROOM", "VILLA"] },
  { slug: "vacation-rental", label: "Vacation Rental", suggest: ["VILLA", "COTTAGE", "APARTMENT", "ROOM", "OTHER"] },
  { slug: "lodge", label: "Lodge / Retreat", suggest: ["ROOM", "COTTAGE", "VILLA", "DORMITORY", "OTHER"] },
  { slug: "other", label: "Other / Custom Property", suggest: [...CORE_TYPES] },
];
/** The demo hotel records use the website's older property list; map them onto the spec's 10 types. */
export function propertyTypeOf(t: PropertyType) {
  const map: Record<PropertyType, string> = { hotel: "hotel", resort: "resort", "guest-house": "guest-house", home: "homestay", "serviced-apartment": "serviced-apartment", hostel: "hostel", cottage: "lodge", villa: "vacation-rental", other: "other" };
  return PROPERTY_TYPES.find((p) => p.slug === map[t]) ?? PROPERTY_TYPES[PROPERTY_TYPES.length - 1];
}

// Full amenities library (searchable multi-select). Saved on the Category once.
export const AMENITIES: { group: string; items: string[] }[] = [
  { group: "Basics", items: ["Free Wi-Fi", "Air conditioning", "Fan", "Hot water", "Smart TV", "Work desk", "Wardrobe", "Safe", "Iron", "Hair dryer"] },
  { group: "Bathroom", items: ["Attached bathroom", "Shared bathroom", "Rain shower", "Bathtub", "Toiletries", "Towels"] },
  { group: "Food & drink", items: ["Tea & coffee", "Minibar", "Kitchenette", "Full kitchen", "Fridge", "Microwave", "Dining table", "Breakfast included"] },
  { group: "View & outdoor", items: ["Sea view", "Lake view", "Garden view", "Hill view", "Balcony", "Terrace", "Private deck", "Private pool", "Plunge pool", "BBQ area"] },
  { group: "Space", items: ["Living room", "Sofa bed", "Washer", "Wood stove", "Reading corner", "Extra bed on request"] },
  { group: "Dorm & shared", items: ["Locker", "Privacy curtain", "Reading light", "Own socket", "Bunk bed", "Pod bed", "Common lounge"] },
  { group: "Access & safety", items: ["Wheelchair access", "Lift", "Smoke detector", "Parking", "Pet friendly", "24h security"] },
];
export const ALL_AMENITIES = AMENITIES.flatMap((g) => g.items);

// ---------------- numbering ----------------
export type Template = "floor" | "prefix" | "sequential" | "zone" | "custom";
export const TEMPLATES: { v: Template; label: string; example: string; for: ("floor" | "zone")[] }[] = [
  { v: "floor", label: "Floor-based", example: "101, 102 · 201", for: ["floor"] },
  { v: "prefix", label: "Prefix + number", example: "C01, C02", for: ["zone", "floor"] },
  { v: "sequential", label: "Sequential", example: "001, 002", for: ["zone", "floor"] },
  { v: "zone", label: "Zone code + number", example: "G-C01, L-C01", for: ["zone"] },
  { v: "custom", label: "Custom / manual", example: "SKY-501, HB-01", for: ["zone", "floor"] },
];
export const pad = (n: number, d: number) => String(n).padStart(d, "0");
export const CODE_RE = /^[A-Z0-9][A-Z0-9-]{0,13}$/;

/** YouTube links only (watch, youtu.be, shorts). Returns the 11-char video id or null. */
export function youtubeId(url: string): string | null {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else if (/^\/(shorts|embed|live)\//.test(u.pathname)) id = u.pathname.split("/")[2];
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}
