"use client";
// Marketplace listing (listing-only owners) — prototype store.
// PROTOTYPE: everything lives in this browser (localStorage key "bingi-list-v1"). Nothing is sent to BinGi.
// Production: same property / accommodation category / booking tables as the HMS, with property.mode = "listing".
import { useCallback, useSyncExternalStore } from "react";

// ---------- Fees (decided 25 Nov 2026; listing % to be confirmed by Nazmul: 9 / 10 / 11) ----------
export const LISTING_PCT = 9;
export const HMS_PCT = 7;
export const GATEWAY_PCT = 2.5;
/** Placeholder quality gate (audit 1 Nov ticket 31). */
export const MIN_PRICE = 500;
export const DEMO_OTP = "123456";

export type Bed = "double" | "twin" | "single" | "king" | "bunk";
export type RoomType = { key: string; name: string; guests: number; bed: Bed; count: number; price: number; photo: string };
export type Cancel = "flexible" | "moderate" | "strict";
export type ListStatus = "draft" | "review" | "changes" | "live";
export type DemoBooking = { id: string; guest: string; room: string; checkIn: string; nights: number; guests: number; amount: number; online: number; status: "confirmed" | "checked-in" | "completed" | "cancelled" };

export type Listing = {
  id: string; created: string; updated: string; step: number; seen: number;
  type: string; name: string; tagline: string;
  road: string; area: string; city: string; division: string; pin: { x: number; y: number } | null;
  amenities: string[];
  rooms: RoomType[];
  cover: string; photos: string[];
  rules: { checkIn: string; checkOut: string; cancel: Cancel; children: "all" | "6+" | "12+" | "none"; pets: boolean; smoking: boolean };
  guestPay: "full" | "advance" | "both";
  payout: { method: "bkash" | "nagad" | "bank"; wallet: string; holder: string; bank: string; acc: string; branch: string };
  nid: { front: string; back: string };
  agree: boolean;
  status: ListStatus; submitted?: string; approved?: string; note?: string;
  /** Rooms left per room type per day; missing = all rooms open. 0 = closed. key `${roomKey}|${yyyy-mm-dd}` */
  avail: Record<string, number>;
  bookings: DemoBooking[];
};

export const STEPS = [
  { part: 0, bn: "ধরন", en: "Type" },
  { part: 0, bn: "নাম", en: "Name" },
  { part: 0, bn: "ঠিকানা", en: "Location" },
  { part: 0, bn: "সুবিধা", en: "Amenities" },
  { part: 1, bn: "রুমের ধরন", en: "Room types" },
  { part: 1, bn: "ছবি", en: "Photos" },
  { part: 2, bn: "নিয়ম", en: "House rules" },
  { part: 2, bn: "টাকা পাওয়া", en: "Get paid" },
  { part: 2, bn: "রিভিউ ও জমা", en: "Review & submit" },
] as const;
export const PARTS = [
  { bn: "আপনার জায়গা", en: "Your place" },
  { bn: "রুম ও ছবি", en: "Rooms & photos" },
  { bn: "টাকা ও প্রকাশ", en: "Get paid & publish" },
] as const;

export const AMENITIES: [string, string, string][] = [
  ["wifi", "ফ্রি Wi-Fi", "Free Wi-Fi"], ["ac", "এসি", "Air conditioning"], ["parking", "পার্কিং", "Parking"], ["breakfast", "নাস্তা", "Breakfast"],
  ["hot-water", "গরম পানি", "Hot water"], ["generator", "জেনারেটর / IPS", "Generator / IPS"], ["tv", "টিভি", "TV"], ["restaurant", "রেস্টুরেন্ট", "Restaurant"],
  ["pool", "সুইমিং পুল", "Swimming pool"], ["sea-view", "সমুদ্রের ভিউ", "Sea view"], ["lift", "লিফট", "Lift"], ["laundry", "লন্ড্রি", "Laundry"],
  ["room-service", "রুম সার্ভিস", "Room service"], ["airport", "এয়ারপোর্ট ট্রান্সফার", "Airport transfer"], ["kitchen", "রান্নাঘর", "Kitchen"], ["security", "২৪ ঘণ্টা সিকিউরিটি", "24h security"],
];
export const BEDS: Record<Bed, [string, string]> = { double: ["ডাবল বেড", "Double bed"], twin: ["২টা সিঙ্গেল বেড", "Two single beds"], single: ["সিঙ্গেল বেড", "Single bed"], king: ["কিং বেড", "King bed"], bunk: ["বাংক বেড", "Bunk beds"] };
export const CANCEL: Record<Cancel, { bn: string; en: string; subBn: string; subEn: string }> = {
  flexible: { bn: "সহজ", en: "Flexible", subBn: "আসার ১ দিন আগ পর্যন্ত ফ্রি বাতিল", subEn: "Free cancellation until 1 day before arrival" },
  moderate: { bn: "মাঝামাঝি", en: "Moderate", subBn: "৫ দিন আগ পর্যন্ত ফ্রি; এরপর ৫০% কাটা", subEn: "Free until 5 days before; 50% after that" },
  strict: { bn: "কড়া", en: "Strict", subBn: "১৪ দিন আগ পর্যন্ত ৫০% ফেরত; এরপর ফেরত নেই", subEn: "50% back until 14 days before; no refund after" },
};

// ---------- Fee maths ----------
/** One booking: commission on the room total, gateway fee only on the part paid online. */
export function split(amount: number, online: number, pct = LISTING_PCT) {
  const commission = Math.round((amount * pct) / 100);
  const gateway = Math.round((online * GATEWAY_PCT) / 100);
  return { commission, gateway, net: amount - commission - gateway };
}

// ---------- Checks ----------
export type Check = { id: string; bn: string; en: string; ok: boolean; step: number; must: boolean };
export const validPhone = (p: string) => /^(\+?880|0)1[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ""));
export function checks(d: Listing, phone: string): Check[] {
  const rooms = d.rooms.filter((r) => r.name.trim());
  const c = (id: string, bn: string, en: string, ok: boolean, step: number, must = true): Check => ({ id, bn, en, ok, step, must });
  const payoutOk = d.payout.method === "bank" ? !!(d.payout.holder.trim() && d.payout.bank.trim() && d.payout.acc.trim()) : validPhone(d.payout.wallet) && !!d.payout.holder.trim();
  return [
    c("type", "জায়গার ধরন", "Property type", !!d.type, 0),
    c("name", "নাম", "Name", d.name.trim().length >= 3, 1),
    c("address", "ঠিকানা", "Address", !!(d.road.trim() && d.city.trim()), 2),
    c("rooms", "কমপক্ষে ১টা রুমের ধরন", "At least one room type", rooms.length > 0, 4),
    c("price", `প্রতিটা রুমের দাম কমপক্ষে ৳${digits(MIN_PRICE, "bn")}`, `Every room priced at ৳${MIN_PRICE} or more`, rooms.length > 0 && rooms.every((r) => r.price >= MIN_PRICE), 4),
    c("cover", "কভার ছবি", "Cover photo", !!d.cover, 5),
    c("roomPhotos", "প্রতিটা রুমের ধরনের ১টা ছবি", "A photo for every room type", rooms.length > 0 && rooms.every((r) => !!r.photo), 5),
    c("phone", "যাচাই করা মোবাইল নম্বর", "Verified mobile number", validPhone(phone), 1),
    c("payout", "টাকা পাওয়ার অ্যাকাউন্ট", "Payout account", payoutOk, 7),
    c("agree", "শর্তে সম্মতি", "Terms accepted", d.agree, 8),
    c("nid", "NID (প্রথম টাকা তোলার আগে)", "NID (before your first payout)", !!(d.nid.front && d.nid.back), 7, false),
    c("amen", "সুবিধা", "Amenities", d.amenities.length > 0, 3, false),
    c("photos", "আরো ৩টা ছবি", "3 more photos", d.photos.length >= 3, 5, false),
  ];
}

// ---------- Store ----------
type Root = { v: 1; phone: string; verified: boolean; owner: string; listing: Listing | null };
const KEY = "bingi-list-v1";
const empty: Root = { v: 1, phone: "", verified: false, owner: "", listing: null };
const listeners = new Set<() => void>();
let cache: { raw: string | null; st: Root } = { raw: null, st: empty };
function read(): Root {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (raw === cache.raw) return cache.st;
  let st = empty;
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1) st = { ...empty, ...p }; } catch {}
  cache = { raw, st };
  return st;
}
function write(st: Root): boolean {
  const raw = JSON.stringify(st);
  let ok = true;
  try { localStorage.setItem(KEY, raw); } catch { ok = false; }
  if (ok) cache = { raw, st };
  listeners.forEach((l) => l());
  return ok;
}
const sub = (l: () => void) => {
  listeners.add(l);
  const s = (e: StorageEvent) => { if (e.key === KEY) l(); };
  window.addEventListener("storage", s);
  return () => { listeners.delete(l); window.removeEventListener("storage", s); };
};
const nowIso = () => new Date().toISOString();

export function useListing() {
  const st = useSyncExternalStore(sub, read, () => empty);
  /** Returns false when the browser storage is full (photos too big). */
  const update = useCallback((fn: (s: Root) => void) => { const n = structuredClone(read()); fn(n); return write(n); }, []);
  const edit = useCallback((fn: (d: Listing) => void) => update((s) => { if (s.listing) { fn(s.listing); s.listing.updated = nowIso(); } }), [update]);
  return { st, d: st.listing, update, edit };
}

export const newRoom = (n = 0): RoomType => ({ key: `rt-${Date.now().toString(36)}-${n}`, name: "", guests: 2, bed: "double", count: 1, price: 0, photo: "" });
export function newListing(): Listing {
  const t = nowIso();
  return {
    id: `lst-${Date.now().toString(36)}`, created: t, updated: t, step: 0, seen: 0,
    type: "", name: "", tagline: "", road: "", area: "", city: "", division: "Dhaka", pin: null,
    amenities: [], rooms: [newRoom()], cover: "", photos: [],
    rules: { checkIn: "14:00", checkOut: "12:00", cancel: "moderate", children: "all", pets: false, smoking: false },
    guestPay: "both",
    payout: { method: "bkash", wallet: "", holder: "", bank: "", acc: "", branch: "" },
    nid: { front: "", back: "" }, agree: false, status: "draft", avail: {}, bookings: [],
  };
}

// ---------- Formatting ----------
const BN = "০১২৩৪৫৬৭৮৯";
export const digits = (s: string | number, lang: "bn" | "en") => (lang === "bn" ? String(s).replace(/\d/g, (x) => BN[+x]) : String(s));
/** ৳ with lakh grouping (1,25,000). */
export function taka(n: number, lang: "bn" | "en") {
  const neg = n < 0; const s = String(Math.round(Math.abs(n)));
  const last3 = s.slice(-3); const rest = s.slice(0, -3);
  const g = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return (neg ? "−" : "") + "৳" + digits(g, lang);
}
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Resize a picked photo to fit browser storage (max 1000 px, JPEG). */
export function resizePhoto(file: File, max = 1000): Promise<string> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("not an image")); };
    img.src = url;
  });
}

/** Prototype-only sample photos (Unsplash, demo licence — public/demo/CREDITS.md). */
export const SAMPLE = {
  cover: "/demo/sea-pearl/exterior.jpg",
  more: ["/demo/sea-pearl/lobby.jpg", "/demo/sea-pearl/pool.jpg", "/demo/sea-pearl/beach.jpg", "/demo/sea-pearl/rooftop.jpg"],
  rooms: ["/demo/sea-pearl/room-deluxe.jpg", "/demo/sea-pearl/room-standard.jpg", "/demo/sea-pearl/room-suite.jpg", "/demo/sea-pearl/room-super-deluxe.jpg", "/demo/sea-pearl/room-extra.jpg"],
};

/** Prototype: a few labelled sample bookings so the host screens can be tried. */
export function demoBookings(d: Listing): DemoBooking[] {
  const rooms = d.rooms.filter((r) => r.name.trim());
  if (!rooms.length) return [];
  const day = (n: number) => { const x = new Date(); x.setDate(x.getDate() + n); return iso(x); };
  const mk = (i: number, guest: string, off: number, nights: number, status: DemoBooking["status"], full: boolean): DemoBooking => {
    const r = rooms[i % rooms.length];
    const amount = r.price * nights;
    return { id: `DEMO-${1001 + i}`, guest, room: r.name, checkIn: day(off), nights, guests: Math.min(2, r.guests), amount, online: full ? amount : Math.round(amount * 0.3), status };
  };
  return [mk(0, "Rafiq Ahmed", 0, 2, "checked-in", true), mk(1, "Nusrat Jahan", 3, 1, "confirmed", false), mk(2, "Tanvir Hasan", 9, 3, "confirmed", true), mk(3, "Sadia Islam", -6, 2, "completed", false)];
}
