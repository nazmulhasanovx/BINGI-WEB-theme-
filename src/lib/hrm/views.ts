// Department views — what each department sees in the HMS panel: which modules are in its sidebar, where it lands,
// which numbers sit on its home and which quick actions it gets. Layout only: what a person may change still comes from
// their role (Settings → Users & roles), and the backend must check that role. Prototype: saved in this browser.
import { useCallback, useSyncExternalStore } from "react";
import type { Area, Perm, Role } from "@/lib/settings/store";
import type { Dept } from "./store";

export type ViewId = "owner" | "management" | "front" | "housekeeping" | "kitchen" | "maintenance" | "security" | "finance";
export type DeptView = { id: ViewId; name: string; bn: string; dept?: Dept; role: string; home: string; modules: string[]; widgets: string[]; actions: string[] };

/** Sidebar modules (same ids as the HMS sidebar) and the role area that decides view / edit. */
export const MODULES: { id: string; label: string; group: string; area?: Area; href: string }[] = [
  { id: "dashboard", label: "Dashboard", group: "Daily operations", href: "/hms" },
  { id: "bookings", label: "Bookings", group: "Daily operations", area: "Bookings", href: "/hms/bookings" },
  { id: "rooms", label: "Room / Accommodation", group: "Daily operations", area: "Rooms & housekeeping", href: "/hms/rooms" },
  { id: "housekeeping", label: "Housekeeping", group: "Daily operations", area: "Rooms & housekeeping", href: "/hms/housekeeping" },
  { id: "guests", label: "Guests", group: "Daily operations", area: "Guests", href: "/hms/guests" },
  { id: "chat", label: "Chat", group: "Daily operations", area: "Guests", href: "/hms/chat" },
  { id: "meals", label: "Meals", group: "Daily operations", area: "Restaurant", href: "/hms/meals" },
  { id: "staff", label: "Staff", group: "Property & team", area: "Staff", href: "/hms/staff" },
  { id: "inventory", label: "Inventory", group: "Property & team", area: "Inventory", href: "/hms/inventory" },
  { id: "other-services", label: "Other Services", group: "Property & team", area: "Bookings", href: "/hms/other-services" },
  { id: "discounts", label: "Discounts & Rates", group: "Money & pricing", area: "Money", href: "/hms/discounts" },
  { id: "payments", label: "Payments", group: "Money & pricing", area: "Money", href: "/hms/payments" },
  { id: "cashbox", label: "Cashbox", group: "Money & pricing", area: "Money", href: "/hms/cashbox" },
  { id: "finance", label: "Finance", group: "Money & pricing", area: "Money", href: "/hms/finance" },
  { id: "operations", label: "Expenses", group: "Money & pricing", area: "Money", href: "/hms/operations" },
  { id: "billing", label: "Billing & Subscription", group: "Money & pricing", area: "Settings", href: "/hms/settings/billing" },
  { id: "reports", label: "Reports", group: "Reports & online", area: "Reports", href: "/hms/reports" },
  { id: "communication", label: "Communication Center", group: "Reports & online", area: "Guests", href: "/hms/communication" },
  { id: "website", label: "Website Management", group: "Reports & online", area: "Website", href: "/hms/website/overview" },
  { id: "settings", label: "Settings", group: "Settings", area: "Settings", href: "/hms/settings" },
];
export const MODULE = new Map(MODULES.map((m) => [m.id, m]));

/** Home cards. Numbers come from the live modules when the view is used; the preview shows labels only. */
export const WIDGETS: { id: string; label: string; module: string }[] = [
  { id: "occupancy", label: "Occupancy tonight", module: "rooms" },
  { id: "revenue", label: "Today’s revenue", module: "finance" },
  { id: "cash", label: "Cash in drawers", module: "cashbox" },
  { id: "arrivals", label: "Arrivals today", module: "bookings" },
  { id: "departures", label: "Departures today", module: "bookings" },
  { id: "inhouse", label: "Guests in house", module: "bookings" },
  { id: "held", label: "Rooms on hold", module: "bookings" },
  { id: "due", label: "Payment due", module: "payments" },
  { id: "rooms-ready", label: "Rooms ready / to clean", module: "housekeeping" },
  { id: "my-rooms", label: "My cleaning tasks", module: "housekeeping" },
  { id: "inspection", label: "Waiting for inspection", module: "housekeeping" },
  { id: "maintenance", label: "Open maintenance", module: "housekeeping" },
  { id: "orders", label: "Open meal orders", module: "meals" },
  { id: "low-stock", label: "Low stock", module: "inventory" },
  { id: "expenses", label: "Expenses to approve", module: "operations" },
  { id: "on-duty", label: "Staff on duty", module: "staff" },
  { id: "leave", label: "Leave requests", module: "staff" },
  { id: "chats", label: "Unread guest chats", module: "chat" },
  { id: "reviews", label: "New guest reviews", module: "guests" },
];
export const WIDGET = new Map(WIDGETS.map((w) => [w.id, w]));

export const ACTIONS: { id: string; label: string; module: string }[] = [
  { id: "new-booking", label: "New booking", module: "bookings" },
  { id: "walk-in", label: "Walk-in", module: "bookings" },
  { id: "check-in", label: "Check in", module: "bookings" },
  { id: "take-payment", label: "Take payment", module: "payments" },
  { id: "start-cleaning", label: "Start cleaning", module: "housekeeping" },
  { id: "report-issue", label: "Report a problem", module: "housekeeping" },
  { id: "new-order", label: "New meal order", module: "meals" },
  { id: "stock-request", label: "Request stock", module: "inventory" },
  { id: "add-expense", label: "Add expense", module: "operations" },
  { id: "approve-leave", label: "Approve leave", module: "staff" },
  { id: "send-message", label: "Message a guest", module: "chat" },
  { id: "close-day", label: "Close the day", module: "cashbox" },
];
export const ACTION = new Map(ACTIONS.map((a) => [a.id, a]));

export const DEFAULT_VIEWS: DeptView[] = [
  { id: "owner", name: "Owner", bn: "মালিক", role: "owner", home: "dashboard",
    modules: MODULES.map((m) => m.id), widgets: ["occupancy", "revenue", "cash", "due", "expenses", "on-duty"], actions: ["new-booking", "add-expense", "approve-leave", "close-day"] },
  { id: "management", name: "General manager", bn: "ম্যানেজার", dept: "Management", role: "manager", home: "dashboard",
    modules: MODULES.filter((m) => m.id !== "billing").map((m) => m.id), widgets: ["occupancy", "arrivals", "rooms-ready", "due", "expenses", "on-duty"], actions: ["new-booking", "walk-in", "approve-leave", "close-day"] },
  { id: "front", name: "Front desk", bn: "ফ্রন্ট ডেস্ক", dept: "Front Office", role: "front", home: "bookings",
    modules: ["dashboard", "bookings", "rooms", "housekeeping", "guests", "chat", "meals", "other-services", "payments", "cashbox"], widgets: ["arrivals", "departures", "inhouse", "held", "rooms-ready", "chats"], actions: ["new-booking", "walk-in", "check-in", "take-payment"] },
  { id: "housekeeping", name: "Housekeeping", bn: "হাউসকিপিং", dept: "Housekeeping", role: "hk", home: "housekeeping",
    modules: ["dashboard", "housekeeping", "rooms"], widgets: ["my-rooms", "rooms-ready", "inspection", "maintenance"], actions: ["start-cleaning", "report-issue"] },
  { id: "kitchen", name: "Restaurant & kitchen", bn: "রেস্টুরেন্ট ও কিচেন", dept: "Kitchen", role: "fnb", home: "meals",
    modules: ["dashboard", "meals", "inventory", "guests"], widgets: ["orders", "inhouse", "low-stock"], actions: ["new-order", "stock-request"] },
  { id: "maintenance", name: "Maintenance", bn: "মেইনটেন্যান্স", dept: "Maintenance", role: "hk", home: "housekeeping",
    modules: ["dashboard", "housekeeping", "rooms"], widgets: ["maintenance", "rooms-ready", "inspection"], actions: ["report-issue"] },
  { id: "security", name: "Security", bn: "সিকিউরিটি", dept: "Security", role: "", home: "dashboard",
    modules: ["dashboard", "guests"], widgets: ["arrivals", "inhouse"], actions: [] },
  { id: "finance", name: "Accounts & finance", bn: "অ্যাকাউন্টস", dept: "Finance", role: "accountant", home: "finance",
    modules: ["dashboard", "bookings", "payments", "cashbox", "finance", "operations", "inventory", "staff", "reports"], widgets: ["revenue", "cash", "due", "expenses"], actions: ["add-expense", "take-payment", "close-day"] },
];

// ---------- store (browser only) ----------
const KEY = "bingi-dept-views-v1";
const VIEW_AS = "bingi-view-as";
type State = { views: DeptView[] };
let cache: { raw: string | null; st: State } | null = null;
const subs = new Set<() => void>();
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const BASE: State = { views: DEFAULT_VIEWS };
function read(): State {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (cache && cache.raw === raw) return cache.st;
  let st = BASE;
  if (raw) try { const p = JSON.parse(raw) as State; if (Array.isArray(p.views)) st = { views: DEFAULT_VIEWS.map((d) => ({ ...d, ...p.views.find((v) => v.id === d.id) })) }; } catch {}
  cache = { raw, st };
  return st;
}
function write(st: State) { const raw = JSON.stringify(st); try { localStorage.setItem(KEY, raw); } catch {} cache = { raw, st }; subs.forEach((f) => f()); }

export function useDeptViews() {
  const st = useSyncExternalStore(sub, read, () => BASE);
  const save = useCallback((v: DeptView) => write({ views: read().views.map((x) => (x.id === v.id ? v : x)) }), []);
  const reset = useCallback((id: ViewId) => write({ views: read().views.map((x) => (x.id === id ? DEFAULT_VIEWS.find((d) => d.id === id)! : x)) }), []);
  return { views: st.views, save, reset };
}

// "View the HMS as…" — the sidebar shows only that department's modules until you exit (this tab only).
let asCache: string | null | undefined;
const readAs = () => { if (asCache === undefined) { try { asCache = sessionStorage.getItem(VIEW_AS); } catch { asCache = null; } } return asCache; };
export function setViewAs(id: ViewId | null) {
  asCache = id; try { if (id) sessionStorage.setItem(VIEW_AS, id); else sessionStorage.removeItem(VIEW_AS); } catch {}
  subs.forEach((f) => f());
}
export function useViewAs(): DeptView | null {
  const id = useSyncExternalStore(sub, readAs, () => null);
  const { views } = useDeptViews();
  return id ? views.find((v) => v.id === id) ?? null : null;
}
/** Module ids a view keeps; "dashboard" and the home page always stay. */
export const keeps = (v: DeptView) => new Set([...v.modules, "dashboard", v.home]);
export const deptViewFor = (dept: Dept, views: DeptView[]) => views.find((v) => v.dept === dept);

/** What this view's role allows on a module: "dashboard" is always view; the owner role can change everything. */
export function levelOf(v: DeptView, mod: string, roles: Role[]): Perm {
  if (mod === "dashboard") return "view";
  const r = roles.find((x) => x.id === v.role);
  if (!r) return "none";
  if (r.locked) return "edit";
  const a = MODULE.get(mod)?.area;
  return a ? r.perms[a] ?? "none" : "view";
}
/** Sidebar ids for a view: shown in the template AND allowed by the role. */
export const visibleIds = (v: DeptView, roles: Role[]) => new Set([...keeps(v)].filter((m) => levelOf(v, m, roles) !== "none"));
