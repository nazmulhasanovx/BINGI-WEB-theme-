// Onboarding v8 (21 Nov 2026) — room-type presets and property amenity shortlists.
// The owner picks the property type once; everything here is pre-filled from it and stays editable.
// Saved through the same accommodation records as the live backend: location → category → unit batch.
import type { CoreType } from "@/lib/rooms/catalog";
import type { Category } from "@/lib/rooms/store";
import type { Draft, TypeRow } from "./store";
import { STAY } from "./rooms-easy";

type Preset = Omit<TypeRow, "on" | "amen"> & { for: string[] };
const BASIC = ["Air conditioning", "Smart TV", "Free Wi-Fi", "Hot water", "Attached bathroom", "Toiletries", "Wardrobe"];
/** Room-type presets per accommodation kind. `for` = property types that get it ticked by default. */
export const TYPE_PRESETS: Preset[] = [
  { key: "std-double", core: "ROOM", name: "Standard Double", kind: "double", bed: "1 Double bed", guests: 2, price: 3000, for: ["hotel", "guest-house", "homestay", "motel", "hostel", "other"] },
  { key: "deluxe", core: "ROOM", name: "Deluxe Room", kind: "double", bed: "1 Queen bed", guests: 2, price: 5000, for: ["hotel", "resort"] },
  { key: "twin", core: "ROOM", name: "Twin Room", kind: "twin", bed: "2 Single beds", guests: 2, price: 4500, for: ["hotel", "guest-house"] },
  { key: "family", core: "ROOM", name: "Family Room", kind: "family", bed: "1 King bed", guests: 4, price: 7000, for: ["resort"] },
  { key: "suite", core: "ROOM", name: "Suite", kind: "double", bed: "1 King bed", guests: 2, price: 9000, for: [] },
  { key: "single", core: "ROOM", name: "Single Room", kind: "single", bed: "1 Single bed", guests: 1, price: 2000, for: [] },
  { key: "cottage", core: "COTTAGE", name: "Garden Cottage", kind: "double", bed: "1 Queen bed", guests: 2, price: 6000, for: ["resort", "lodge"] },
  { key: "cottage-fam", core: "COTTAGE", name: "Family Cottage", kind: "family", bed: "1 King bed", guests: 4, price: 8500, for: [] },
  { key: "villa", core: "VILLA", name: "Private Villa", kind: "family", bed: "1 King bed", guests: 4, price: 15000, bedrooms: 2, bathrooms: 2, for: ["resort", "vacation-rental"] },
  { key: "pool-villa", core: "VILLA", name: "Pool Villa", kind: "family", bed: "1 King bed", guests: 4, price: 25000, bedrooms: 2, bathrooms: 2, for: [] },
  { key: "studio", core: "APARTMENT", name: "Studio Apartment", kind: "double", bed: "1 Queen bed", guests: 2, price: 4000, for: ["serviced-apartment"] },
  { key: "apt-2", core: "APARTMENT", name: "2-Bedroom Apartment", kind: "family", bed: "1 King bed", guests: 4, price: 7000, bedrooms: 2, bathrooms: 2, for: ["serviced-apartment"] },
  { key: "tent", core: "OTHER", name: "Tent", kind: "double", bed: "1 Double bed", guests: 2, price: 2500, for: [] },
];
export const BN_NAME: Record<string, string> = {
  "Standard Double": "স্ট্যান্ডার্ড ডাবল", "Deluxe Room": "ডিলাক্স রুম", "Twin Room": "টুইন রুম", "Family Room": "ফ্যামিলি রুম", Suite: "স্যুট", "Single Room": "সিঙ্গেল রুম",
  "Garden Cottage": "গার্ডেন কটেজ", "Family Cottage": "ফ্যামিলি কটেজ", "Private Villa": "প্রাইভেট ভিলা", "Pool Villa": "পুল ভিলা",
  "Studio Apartment": "স্টুডিও অ্যাপার্টমেন্ট", "2-Bedroom Apartment": "২ বেডরুম অ্যাপার্টমেন্ট", Tent: "তাঁবু",
};
/** Room amenities shown first (the rest sit behind "show all"). Names = the catalog the backend uses. */
export const ROOM_TOP = [...BASIC, "Fridge", "Balcony", "Sea view", "Tea & coffee"];
const upgrade = (p: Preset) => p.price >= 5000;

export function presetTypes(d: Pick<Draft, "propertyType" | "stay">): TypeRow[] {
  const list = TYPE_PRESETS.filter((p) => d.stay.includes(p.core));
  // ticked: presets made for this property type; a kind with none of those gets its first preset ticked
  const firstOf = (core: string) => list.find((q) => q.core === core)?.key;
  const kindHasOwn = (core: string) => list.some((q) => q.core === core && q.for.includes(d.propertyType));
  return list.map((p) => {
    const { for: f, ...rest } = p;
    return {
      ...rest,
      on: f.includes(d.propertyType) || (!kindHasOwn(p.core) && firstOf(p.core) === p.key),
      amen: upgrade(p) ? [...BASIC, "Fridge", "Tea & coffee", ...(d.propertyType === "resort" ? ["Balcony"] : [])] : [...BASIC],
    };
  });
}
/** Keep the owner's edits, add presets for newly picked kinds, drop kinds no longer rented. */
export function syncTypes(d: Draft): TypeRow[] {
  const fresh = presetTypes(d);
  const kept = d.types.filter((r) => d.stay.includes(r.core));
  return [...kept, ...fresh.filter((f) => !kept.some((k) => k.key === f.key))];
}
export const catId = (key: string) => `cat-${key}`;
export function categoryOf(r: TypeRow, prev?: Category): Category {
  const st = STAY.find((s) => s.id === r.core)!;
  return {
    ...(prev ?? {}),
    id: catId(r.key), name: r.name.trim(), core: r.core as CoreType, preset: st.preset, bed: r.bed, maxAdults: r.guests, maxChildren: 0,
    sizeSqft: r.size, bedrooms: r.bedrooms, bathrooms: r.bathrooms, amenities: r.amen, baseRate: r.price, roomKind: r.kind,
    created: prev?.created ?? new Date().toISOString(), approval: prev?.approval ?? "pending",
  };
}

// ---------- Property amenities (step 1.4) ----------
/** Shown first for every type; the extras per type are added after. Everything else is under "show all". */
export const PROP_TOP = ["Free Wi-Fi", "Parking", "Power backup", "24-hour front desk", "Restaurant", "Room service", "CCTV security", "Elevator", "Breakfast", "Airport transfer"];
export const PROP_TYPE_EXTRA: Record<string, string[]> = {
  resort: ["Swimming pool", "Beach access", "Garden"], hotel: ["Conference room", "Laundry"], motel: ["Laundry"], lodge: ["Garden", "Bonfire"],
  "serviced-apartment": ["Laundry", "Gym"], "guest-house": ["Laundry"], "vacation-rental": ["Garden", "Swimming pool"],
};
/** Pre-ticked as a suggestion (the owner checks and unticks). */
export const PROP_SUGGEST: Record<string, string[]> = {
  hotel: ["Free Wi-Fi", "24-hour front desk"], resort: ["Free Wi-Fi", "24-hour front desk"], motel: ["Parking"], "serviced-apartment": ["Free Wi-Fi"],
};
export const PROP_ALL: { group: [string, string]; items: string[] }[] = [
  { group: ["সাধারণ", "General"], items: ["Free Wi-Fi", "Parking", "Power backup", "24-hour front desk", "Elevator", "CCTV security", "Non-smoking property", "Smoking area", "Prayer room", "Luggage storage", "Wheelchair access"] },
  { group: ["খাবার", "Food & drink"], items: ["Restaurant", "Bar", "Café", "Room service", "Breakfast", "Breakfast included", "Lunch included", "Dinner included", "All-inclusive", "Welcome drink", "BBQ"] },
  { group: ["বাইরে ও বিনোদন", "Outdoor & leisure"], items: ["Swimming pool", "Beach access", "Private beach", "Garden", "Kids play area", "Gym", "Spa", "Water sports", "Bonfire", "Live music", "Movie night"] },
  { group: ["সার্ভিস", "Services"], items: ["Airport transfer", "Laundry", "Laundry on request", "Tour desk", "Car rental", "Private driver", "Babysitting", "Doctor on call", "Grocery delivery", "Luggage delivery"] },
  { group: ["ব্যবসা ও ইভেন্ট", "Business & events"], items: ["Conference room", "Event hall", "Wedding service", "Birthday setup", "Photography service", "Printing service"] },
  { group: ["পরিবেশ", "Eco"], items: ["Eco-friendly", "Solar energy", "Recycling"] },
];
export const PROP_BN: Record<string, string> = {
  "Free Wi-Fi": "ফ্রি ওয়াই-ফাই", Parking: "পার্কিং", "Power backup": "জেনারেটর / পাওয়ার ব্যাকআপ", "24-hour front desk": "২৪ ঘণ্টা রিসেপশন", Restaurant: "রেস্টুরেন্ট",
  "Room service": "রুম সার্ভিস", "CCTV security": "সিসিটিভি / নিরাপত্তা", Elevator: "লিফট", Breakfast: "নাস্তা", "Airport transfer": "পিকআপ / এয়ারপোর্ট",
  "Swimming pool": "সুইমিং পুল", "Beach access": "বিচে যাওয়ার পথ", Garden: "বাগান", "Conference room": "কনফারেন্স রুম", Laundry: "লন্ড্রি", Bonfire: "বনফায়ার", Gym: "জিম",
  "Non-smoking property": "ধূমপানমুক্ত", "Smoking area": "ধূমপানের জায়গা", "Prayer room": "নামাজের জায়গা", "Luggage storage": "লাগেজ রাখার জায়গা", "Wheelchair access": "হুইলচেয়ার",
  Bar: "বার", "Café": "ক্যাফে", "Breakfast included": "নাস্তা সহ", "Lunch included": "দুপুরের খাবার সহ", "Dinner included": "রাতের খাবার সহ", "All-inclusive": "অল-ইনক্লুসিভ",
  "Welcome drink": "ওয়েলকাম ড্রিংক", BBQ: "বারবিকিউ", "Private beach": "প্রাইভেট বিচ", "Kids play area": "বাচ্চাদের খেলার জায়গা", Spa: "স্পা", "Water sports": "ওয়াটার স্পোর্টস",
  "Live music": "লাইভ মিউজিক", "Movie night": "মুভি নাইট", "Laundry on request": "চাইলে লন্ড্রি", "Tour desk": "ট্যুর ডেস্ক", "Car rental": "গাড়ি ভাড়া", "Private driver": "ড্রাইভার",
  Babysitting: "বেবিসিটিং", "Doctor on call": "ডাক্তার (কলে)", "Grocery delivery": "বাজার ডেলিভারি", "Luggage delivery": "লাগেজ ডেলিভারি", "Event hall": "ইভেন্ট হল",
  "Wedding service": "বিয়ের সার্ভিস", "Birthday setup": "জন্মদিন সাজানো", "Photography service": "ফটোগ্রাফি", "Printing service": "প্রিন্টিং", "Eco-friendly": "পরিবেশবান্ধব",
  "Solar energy": "সোলার", Recycling: "রিসাইক্লিং",
};
export const propTop = (type: string) => [...PROP_TOP, ...(PROP_TYPE_EXTRA[type] ?? [])];
