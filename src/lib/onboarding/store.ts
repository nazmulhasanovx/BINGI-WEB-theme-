"use client";
// Owner onboarding — one flow for every property type (rules 05 §18–19, Onboarding v5.1 adapted to code, 10 Nov 2026).
// PROTOTYPE: everything lives in this browser (localStorage). Production: onboarding draft API + accommodation APIs
// (see claude/design/Rooms_Backend_Handoff_v1.md). Nothing here is sent to BinGi.
import { useCallback, useSyncExternalStore } from "react";
import type { Hotel, PropertyType } from "@/lib/types";
import { teaValley } from "@/data/tea-valley";
import { PROPERTY_TYPES } from "@/lib/rooms/catalog";

export type PlanId = "starter" | "business" | "ultra";
export type Cycle = 1 | 6 | 12;
export type Status = "draft" | "pending" | "needs-changes" | "approved";

export type Draft = {
  id: string; slug: string; created: string; updated: string;
  step: StepId; seen: StepId[];
  // S1
  country: string; propertyType: string; name: string; area: string; city: string; address: string; phone: string;
  units: number; extras: string[]; staff: string;
  plan: PlanId; planPicked: boolean; cycle: Cycle;
  // S3
  rates: { weekendPct: number; breakfast: boolean; breakfastPrice: number; minStay: number; done: boolean };
  existing: { has: boolean | null; rows: { guest: string; checkIn: string; checkOut: string; unit: string }[] };
  policy: { preset: "flexible" | "moderate" | "strict" | ""; checkIn: string; checkOut: string; vat: number; sc: number };
  // S4
  modules: string[]; team: { phone: string; role: string }[]; teamLater: boolean;
  // S5
  pay: { cash: boolean; bkash: boolean; nagad: boolean; bank: boolean; bingi: "later" | "apply" | "" };
  site: { theme: string; later: boolean };
  // S6
  verify: { nid: string; trade: string; tin: string; later: boolean };
  status: Status; submitted?: string; note?: string;
};

export const SECTIONS = [
  { id: "s1", label: "Your property", steps: ["1.1", "1.2", "1.3", "1.4"] },
  { id: "s2", label: "Accommodations", steps: ["2.1", "2.2", "2.3"] },
  { id: "s3", label: "Booking ready", steps: ["3.1", "3.2", "3.3"] },
  { id: "s4", label: "Operations", steps: ["4.1", "4.2"] },
  { id: "s5", label: "Online & payments", steps: ["5.1", "5.2"] },
  { id: "s6", label: "Review & confirm", steps: ["6.1", "6.2", "6.3"] },
] as const;
export type StepId = (typeof SECTIONS)[number]["steps"][number];
export const ORDER: StepId[] = SECTIONS.flatMap((s) => [...s.steps]) as StepId[];
export const STEP_TITLE: Record<StepId, string> = {
  "1.1": "What do you run?", "1.2": "Name and location", "1.3": "What else is there?", "1.4": "Choose your plan",
  "2.1": "Accommodation setup", "2.2": "Add your first units", "2.3": "Check your inventory",
  "3.1": "Rates", "3.2": "Bookings you already have", "3.3": "Policies and taxes",
  "4.1": "Modules", "4.2": "Invite your team",
  "5.1": "How guests pay", "5.2": "Your website",
  "6.1": "Your quote", "6.2": "Verification", "6.3": "Ready to submit",
};
export const sectionOf = (s: StepId) => SECTIONS.findIndex((x) => (x.steps as readonly string[]).includes(s));

// ---------- Pricing (confirmed by Nazmul 9–10 Nov 2026) ----------
export const PLANS: Record<PlanId, { label: string; perUnit: number; activation: number; activationRegular?: number; for: string; restaurant: boolean }> = {
  starter: { label: "Starter", perUnit: 30, activation: 0, for: "Small guest houses and homes", restaurant: false },
  business: { label: "Business", perUnit: 50, activation: 4999, activationRegular: 14500, for: "Hotels and resorts, full HMS", restaurant: false },
  ultra: { label: "Ultra", perUnit: 116, activation: 8999, for: "Full HMS + Restaurant & Bar", restaurant: true },
};
export const MIN_BILLED = 10;
export const CYCLE_OFF: Record<Cycle, number> = { 1: 0, 6: 0.1, 12: 0.25 };
export const TRIAL_DAYS = 7;
export function quote(plan: PlanId, units: number, cycle: Cycle) {
  const p = PLANS[plan];
  const billed = Math.max(MIN_BILLED, units);
  const monthly = billed * p.perUnit;
  const gross = monthly * cycle;
  const off = Math.round(gross * CYCLE_OFF[cycle]);
  const sub = gross - off;
  return { billed, monthly, gross, off, sub, activation: p.activation, activationRegular: p.activationRegular, total: sub + p.activation };
}
/** Restaurant & Bar needs Ultra (rule). Starter is for up to 20 units. */
export function recommend(units: number, extras: string[]): PlanId {
  if (extras.some((e) => e === "Restaurant" || e === "Bar")) return "ultra";
  return units <= 20 && units > 0 ? "starter" : "business";
}

export const EXTRAS = ["Restaurant", "Bar", "Café", "Pool", "Spa", "Event hall", "Airport transfer", "Tours", "Laundry", "Gym"];
export const STAFF = ["Just me", "2–5", "6–15", "16–50", "50+"];
export const COUNTRIES = [{ code: "BD", label: "Bangladesh", currency: "BDT" }];

// ---------- Store ----------
type Root = { v: 1; phone: string; verified: boolean; current: string; drafts: Draft[] };
const KEY = "bingi-onb-v1";
const empty: Root = { v: 1, phone: "", verified: false, current: "", drafts: [] };
const listeners = new Set<() => void>();
let cache: { raw: string | null; st: Root } = { raw: null, st: empty };
function read(): Root {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (raw === cache.raw) return cache.st;
  let st = empty;
  if (raw) try { const p = JSON.parse(raw); if (p?.v === 1 && Array.isArray(p.drafts)) st = p; } catch {}
  cache = { raw, st };
  return st;
}
function write(st: Root) {
  const raw = JSON.stringify(st);
  try { localStorage.setItem(KEY, raw); } catch {}
  cache = { raw, st };
  listeners.forEach((l) => l());
}
const sub = (l: () => void) => {
  listeners.add(l);
  const s = (e: StorageEvent) => { if (e.key === KEY) l(); };
  window.addEventListener("storage", s);
  return () => { listeners.delete(l); window.removeEventListener("storage", s); };
};
export const nowIso = () => new Date().toISOString();

export function useOnboarding() {
  const st = useSyncExternalStore(sub, read, () => empty);
  const update = useCallback((fn: (s: Root) => void) => { const n = structuredClone(read()); fn(n); write(n); }, []);
  const draft = st.drafts.find((d) => d.id === st.current);
  const edit = useCallback((fn: (d: Draft) => void) => update((s) => {
    const d = s.drafts.find((x) => x.id === s.current);
    if (d) { fn(d); d.updated = nowIso(); }
  }), [update]);
  return { st, draft, update, edit };
}
/** Read outside React (HMS shell): submitted onboarding properties appear in the property switcher. */
export function useSubmittedHotels(): Hotel[] {
  const st = useSyncExternalStore(sub, read, () => empty);
  return st.drafts.filter((d) => d.status !== "draft").map(hotelOf);
}
export function onboardingDraftFor(slug: string): Draft | undefined {
  return read().drafts.find((d) => d.slug === slug);
}
export function useDraftFor(slug: string): Draft | undefined {
  const st = useSyncExternalStore(sub, read, () => empty);
  return st.drafts.find((d) => d.slug === slug);
}

export function newDraft(n: number): Draft {
  const id = `onb-${Date.now().toString(36)}`;
  const t = nowIso();
  return {
    id, slug: id, created: t, updated: t, step: "1.1", seen: ["1.1"],
    country: "BD", propertyType: "", name: "", area: "", city: "", address: "", phone: "", units: 0, extras: [], staff: "",
    plan: "business", planPicked: false, cycle: 1,
    rates: { weekendPct: 0, breakfast: false, breakfastPrice: 0, minStay: 1, done: false },
    existing: { has: null, rows: [] },
    policy: { preset: "", checkIn: "14:00", checkOut: "12:00", vat: 15, sc: 10 },
    modules: ["frontdesk", "housekeeping"], team: [], teamLater: false,
    pay: { cash: true, bkash: false, nagad: false, bank: false, bingi: "" },
    site: { theme: "", later: false },
    verify: { nid: "", trade: "", tin: "", later: false },
    status: "draft",
    note: n > 0 ? undefined : undefined,
  };
}

// ---------- Draft → Hotel (so HMS modules can run on the new property) ----------
const OLD_TYPE: Record<string, PropertyType> = {
  hotel: "hotel", resort: "resort", "guest-house": "guest-house", motel: "hotel", hostel: "hostel", homestay: "home",
  "serviced-apartment": "serviced-apartment", "vacation-rental": "villa", lodge: "cottage", other: "other",
};
const hotels = new Map<string, { key: string; h: Hotel }>();
export function hotelOf(d: Draft): Hotel {
  const key = [d.name, d.propertyType, d.city, d.area, d.address, d.phone, d.plan, d.site.theme].join("|");
  const hit = hotels.get(d.slug);
  if (hit && hit.key === key) return hit.h;
  const label = PROPERTY_TYPES.find((p) => p.slug === d.propertyType)?.label ?? "Property";
  const h: Hotel = {
    ...teaValley,
    slug: d.slug, name: d.name || "New property", type: label, stars: 0, propertyType: OLD_TYPE[d.propertyType] ?? "other",
    propertyCode: d.propertyType || undefined,
    tagline: "", intro: "", logoText: d.name || "New property", area: d.area, city: d.city, country: "Bangladesh", address: d.address,
    phone: d.phone, whatsapp: d.phone.replace(/[^\d+]/g, ""), email: "", rooms: [], offers: [], promoCodes: [], reviews: [], reviewCount: 0, reviewScore: undefined,
    plan: d.plan, status: "paused", host: undefined, faq: undefined, dayPlan: undefined, houseRules: undefined,
    theme: { ...teaValley.theme, master: (d.site.theme || "nest") as Hotel["theme"]["master"] },
  };
  hotels.set(d.slug, { key, h });
  return h;
}

// ---------- Readiness ----------
export type Check = { id: string; label: string; level: "required" | "recommended" | "optional"; ok: boolean; step: StepId };
export function checks(d: Draft, units: { total: number; published: number; categories: number }): Check[] {
  return [
    { id: "type", label: "Property type", level: "required", ok: !!d.propertyType, step: "1.1" },
    { id: "basics", label: "Name, location and phone", level: "required", ok: !!(d.name.trim() && d.city.trim() && d.address.trim() && validPhone(d.phone)), step: "1.2" },
    { id: "plan", label: "Plan chosen", level: "required", ok: d.planPicked, step: "1.4" },
    { id: "units", label: "At least one unit added", level: "required", ok: units.total > 0, step: "2.2" },
    { id: "cash", label: "Pay at property (cash) on", level: "required", ok: d.pay.cash, step: "5.1" },
    { id: "rates", label: "Rates checked", level: "recommended", ok: d.rates.done, step: "3.1" },
    { id: "existing", label: "Existing bookings answered", level: "recommended", ok: d.existing.has !== null, step: "3.2" },
    { id: "policy", label: "Cancellation policy", level: "recommended", ok: !!d.policy.preset, step: "3.3" },
    { id: "verify", label: "Verification documents", level: "recommended", ok: !!(d.verify.nid && d.verify.trade), step: "6.2" },
    { id: "team", label: "Team invited", level: "optional", ok: d.team.length > 0, step: "4.2" },
    { id: "site", label: "Website theme chosen", level: "optional", ok: !!d.site.theme, step: "5.2" },
  ];
}
export function score(cs: Check[]) {
  const w = { required: 3, recommended: 2, optional: 1 } as const;
  const total = cs.reduce((a, c) => a + w[c.level], 0);
  const got = cs.reduce((a, c) => a + (c.ok ? w[c.level] : 0), 0);
  return Math.round((got / total) * 100);
}
export const validPhone = (p: string) => /^(\+?880|0)1[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ""));
export const trialLeft = (d: Draft) => {
  if (!d.submitted) return TRIAL_DAYS;
  const used = Math.floor((Date.now() - new Date(d.submitted).getTime()) / 86400000);
  return Math.max(0, TRIAL_DAYS - used);
};
