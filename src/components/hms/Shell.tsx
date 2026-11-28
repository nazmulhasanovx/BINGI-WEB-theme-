"use client";
// HMS shell — sidebar + header, 1:1 with the live HMS (hms.bingi.app, Nov 2026).
// Every module page renders inside this, so other modules can be designed in this repo too.
import { ChatBadge } from "./chat/page";
// Plan × role (src/lib/access.ts): Starter hides what its plan lacks; Business/Ultra show a higher plan's module with a lock
// (Owner + Manager only); a role without the module never sees it.
import { AccessGuard, UpgradeCard, ViewOnlyBanner, useAccess } from "./access";
import { moduleOfPath } from "@/lib/access";
import { MealsBadge } from "./meals/shared";
import Link from "next/link";
import { imgSrc } from "@/lib/img";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import { usePrefs } from "@/lib/settings/prefs";
import { S_PAGES } from "./settings/frame";
import { useSettings } from "@/lib/settings/store";
import {
  Activity, BedDouble, Boxes, Brush, CalendarCheck, Check, ChefHat, ChevronDown, ChevronsLeft, ChevronsUpDown, CreditCard, FileText, Globe,
  Landmark, LayoutGrid, Lock, Menu as MenuIcon, MessageSquare, MoreHorizontal, X, Plus, ReceiptText, Send, Settings, Sparkles, Star, Tag,
  UserPlus, Users, Wallet, Megaphone, Palette, Eye } from "lucide-react";
import { PROPERTIES, PropertyProvider, setProperty, useProperty } from "./property";
import { SetupModeBanner } from "./setup-mode";
import { useSubmittedHotels } from "@/lib/onboarding/store";
import { WM_PAGES } from "./website/pages";
import { AccountMenu, LanguageMenu, Notifications, SearchBox, type NavTarget } from "./shell-extras";
import { NewsBanner, NewsPopup } from "./news";
import { FullscreenButton } from "./app-install";
import { FOCUS_MODULES, FocusBar, useFocusMode } from "./focus";
import { useAppServiceWorker } from "@/lib/app-mode";
import { setViewAs, useViewAs } from "@/lib/hrm/views";
import { useBilling, monthName, dShort } from "@/lib/billing/store";
import { useRooms } from "@/lib/rooms/store";
import { can, type Feature } from "@/lib/plan";
import { useTitle } from "./rooms/parts";

type Item = { id: string; label: string; icon: typeof Globe; href: string; badge?: number };
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Daily work",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/hms" },
      { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/hms/bookings" },
      { id: "rooms", label: "Rooms", icon: BedDouble, href: "/hms/rooms" },
      { id: "housekeeping", label: "Housekeeping", icon: Brush, href: "/hms/housekeeping" },
      { id: "guests", label: "Guests", icon: UserPlus, href: "/hms/guests" },
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/hms/chat" },
      { id: "meals", label: "Restaurant & Bar", icon: ChefHat, href: "/hms/meals" },
    ],
  },
  {
    label: "Team & property",
    items: [
      { id: "staff", label: "Team", icon: Users, href: "/hms/staff" },
      { id: "inventory", label: "Inventory", icon: Boxes, href: "/hms/inventory" },
      { id: "other-services", label: "Services", icon: Sparkles, href: "/hms/other-services" },
    ],
  },
  {
    label: "Money",
    items: [
      { id: "discounts", label: "Rates & Discounts", icon: Tag, href: "/hms/discounts" },
      { id: "payments", label: "Payments", icon: CreditCard, href: "/hms/payments" },
      { id: "cashbox", label: "Cashbox", icon: Wallet, href: "/hms/cashbox" },
      { id: "finance", label: "Finance", icon: Landmark, href: "/hms/finance" },
      { id: "operations", label: "Expenses", icon: Activity, href: "/hms/operations" },
      { id: "billing", label: "Plan & Billing", icon: ReceiptText, href: "/hms/billing" },
    ],
  },
  {
    label: "Online & reports",
    items: [
      { id: "reports", label: "Reports", icon: FileText, href: "/hms/reports" },
      { id: "communication", label: "Messaging", icon: Send, href: "/hms/communication" },
      { id: "website", label: "Website", icon: Globe, href: "/hms/website/overview" },
    ],
  },
];
/** Expandable sidebar: each main module opens to show its own sub-pages (the same tabs the module page has).
 *  f = plan feature the sub-page needs (missing → hidden, or a lock for Owner/Manager on Business/Ultra);
 *  edit = only roles that can change this module; boss = Owner, Manager and Accountant only. */
type Sub = { label: string; href: string; f?: Feature; edit?: true; boss?: true };
const SUBS: Record<string, Sub[]> = {
  bookings: [
    { label: "All bookings", href: "/hms/bookings" }, { label: "Calendar", href: "/hms/bookings/calendar" },
    { label: "Room board", href: "/hms/bookings/board", f: "roomBoard" }, { label: "Waitlist", href: "/hms/bookings/waitlist" },
    { label: "Day close", href: "/hms/bookings/close", edit: true, boss: true }, { label: "Booking reports", href: "/hms/bookings/reports", boss: true },
  ],
  rooms: [{ label: "Room types", href: "/hms/rooms" }, { label: "Room numbers", href: "/hms/rooms/numbers" }, { label: "Setup", href: "/hms/rooms/configuration", edit: true, boss: true }],
  housekeeping: [{ label: "Tasks", href: "/hms/housekeeping" }, { label: "Maintenance", href: "/hms/housekeeping?tab=maintenance" }, { label: "Checklist", href: "/hms/housekeeping?tab=checklist", edit: true }],
  guests: [{ label: "All guests", href: "/hms/guests" }, { label: "Reviews", href: "/hms/guests/reviews" }],
  meals: [
    { label: "Overview", href: "/hms/meals" }, { label: "POS", href: "/hms/meals/pos" }, { label: "Orders", href: "/hms/meals/orders" },
    { label: "Kitchen", href: "/hms/meals/kitchen" }, { label: "Menu", href: "/hms/meals/menu", edit: true }, { label: "Tables & QR", href: "/hms/meals/tables", edit: true, f: "qrOrdering" },
    { label: "Reports", href: "/hms/meals/reports", boss: true }, { label: "Cashbox", href: "/hms/meals/cashbox" }, { label: "Settings", href: "/hms/meals/settings", edit: true, boss: true },
  ],
  staff: [
    { label: "Overview", href: "/hms/staff" }, { label: "People", href: "/hms/staff/people", f: "hrm" }, { label: "Attendance", href: "/hms/staff/attendance", f: "hrm" },
    { label: "Schedule", href: "/hms/staff/schedule", f: "hrm" }, { label: "Leave", href: "/hms/staff/leave", f: "hrm" }, { label: "Payroll", href: "/hms/staff/payroll", f: "hrm", boss: true },
    { label: "Hiring", href: "/hms/staff/hiring", f: "hrm", boss: true }, { label: "Department views", href: "/hms/staff/views", edit: true, boss: true }, { label: "HR settings & reports", href: "/hms/staff/settings", f: "hrm", edit: true, boss: true },
  ],
  inventory: [
    { label: "Stock", href: "/hms/inventory" }, { label: "Purchase orders", href: "/hms/inventory/purchase" }, { label: "Stock count", href: "/hms/inventory/count" },
    { label: "Recipes & sales", href: "/hms/inventory/recipes", f: "restaurant" }, { label: "History", href: "/hms/inventory/history" }, { label: "Reports", href: "/hms/inventory/reports", boss: true }, { label: "Setup", href: "/hms/inventory/setup", edit: true, boss: true },
  ],
  "other-services": [{ label: "Today", href: "/hms/other-services" }, { label: "Orders", href: "/hms/other-services/orders" }, { label: "Service catalog", href: "/hms/other-services/catalog", edit: true }, { label: "Reports", href: "/hms/other-services/reports", boss: true }, { label: "Setup", href: "/hms/other-services/setup", edit: true, boss: true }],
  discounts: [{ label: "Rates calendar", href: "/hms/discounts" }, { label: "Discount campaigns", href: "/hms/discounts/campaigns", edit: true }],
  payments: [{ label: "Today", href: "/hms/payments" }, { label: "To collect", href: "/hms/payments?tab=collect" }, { label: "Refunds due", href: "/hms/payments?tab=refunds" }, { label: "Transactions", href: "/hms/payments?tab=all" }],
  cashbox: [{ label: "Today", href: "/hms/cashbox" }, { label: "Movements", href: "/hms/cashbox/movements" }, { label: "Closed days", href: "/hms/cashbox/days", boss: true }],
  finance: [{ label: "Overview", href: "/hms/finance" }, { label: "Ledger", href: "/hms/finance?tab=ledger" }, { label: "Payouts", href: "/hms/finance?tab=settlements" }, { label: "Statement", href: "/hms/finance?tab=statement" }],
  operations: [{ label: "Overview", href: "/hms/operations" }, { label: "Expenses", href: "/hms/operations?tab=list" }, { label: "Supplier bills", href: "/hms/operations?tab=bills" }, { label: "Payees", href: "/hms/operations?tab=payees" }, { label: "Categories & rules", href: "/hms/operations?tab=categories", edit: true, boss: true }],
  reports: [{ label: "Daily sales", href: "/hms/reports?r=daily" }, { label: "Revenue & profit", href: "/hms/reports?r=profit", boss: true }, { label: "Occupancy, ADR, RevPAR", href: "/hms/reports?r=occupancy" }],
  communication: [{ label: "Overview", href: "/hms/communication" }, { label: "Automatic messages", href: "/hms/communication?tab=auto", edit: true }, { label: "History", href: "/hms/communication?tab=history" }, { label: "Credits", href: "/hms/communication?tab=credits", boss: true }],
  website: [
    { label: "Overview", href: "/hms/website/overview" }, { label: "Theme & style", href: "/hms/website/design", edit: true }, { label: "Rooms", href: "/hms/website/rooms", edit: true },
    { label: "Booking engine", href: "/hms/website/booking", edit: true }, { label: "Inquiries", href: "/hms/website/inquiries" }, { label: "Reviews", href: "/hms/website/reviews" }, { label: "Online on/off", href: "/hms/website/online", edit: true, boss: true },
  ],
  settings: [
    { label: "Overview", href: "/hms/settings" }, { label: "Property profile", href: "/hms/settings/profile", edit: true }, { label: "Booking policies", href: "/hms/settings/policies", edit: true },
    { label: "Taxes & pricing", href: "/hms/settings/taxes", edit: true, boss: true }, { label: "Guest payments", href: "/hms/settings/payments", edit: true, boss: true }, { label: "Invoices & documents", href: "/hms/settings/documents", edit: true },
    { label: "Guest messages", href: "/hms/settings/messages", edit: true }, { label: "Users & roles", href: "/hms/settings/users", edit: true, boss: true }, { label: "Activity log", href: "/hms/settings/activity", boss: true },
  ],
};
const BOSS = ["owner", "manager", "accountant"];
/** Sub-pages this person sees for a module, by plan and role (Owner sees all; others by their role). */
function useSubs() {
  const { h, roleId, level } = useAccess();
  return (mod: string) => (SUBS[mod] ?? []).flatMap((x): (Sub & { locked?: boolean })[] => {
    if (x.boss && !BOSS.includes(roleId)) return [];
    if (x.edit && level(mod) !== "edit") return [];
    if (x.f && !can(h, x.f)) return h.plan !== "starter" && (roleId === "owner" || roleId === "manager") ? [{ ...x, locked: true }] : [];
    return [x];
  });
}

/** Names that depend on the property (23 Nov 2026 sidebar names): Rooms → "Accommodations" when cottages, villas or
 *  apartments exist; Team → "Team & HR" on plans with the full HR. */
export function useNavLabel() {
  const h = useProperty();
  const rooms = useTitle();
  const fullHr = can(h, "hrm");
  return (id: string, label: string) => (id === "rooms" ? rooms : id === "staff" ? (fullHr ? "Team & HR" : "Team") : label);
}

export const ALL_ITEMS = [...GROUPS.flatMap((g) => g.items), { id: "settings", label: "Settings", icon: Settings, href: "/hms/settings" }];

/** Everything ⌘K can open: modules + their main sub-pages. */
const SEARCH_TARGETS: NavTarget[] = [
  ...[...GROUPS.flatMap((g) => g.items), { id: "settings", label: "Settings", icon: Settings, href: "/hms/settings" }].map((i) => ({ label: i.label, href: i.href, icon: i.icon })),
  { label: "Guest reviews", href: "/hms/guests/reviews", icon: Star }, { label: "Inventory history", href: "/hms/inventory/history", icon: Boxes },
  { label: "Inventory reports", href: "/hms/inventory/reports", icon: Boxes }, { label: "Purchase orders", href: "/hms/inventory/purchase", icon: Boxes }, { label: "Stock count", href: "/hms/inventory/count", icon: Boxes }, { label: "Recipes & sales", href: "/hms/inventory/recipes", icon: Boxes }, { label: "Service orders", href: "/hms/other-services/orders", icon: Sparkles }, { label: "Service catalog", href: "/hms/other-services/catalog", icon: Sparkles }, { label: "Service reports", href: "/hms/other-services/reports", icon: Sparkles }, { label: "Rates calendar", href: "/hms/discounts", icon: Tag }, { label: "New booking", href: "/hms/bookings/new", icon: CalendarCheck }, { label: "Walk-in (quick check-in)", href: "/hms/bookings/walkin", icon: CalendarCheck }, { label: "Room board", href: "/hms/bookings/board", icon: CalendarCheck }, { label: "Booking reports (occupancy, ADR, RevPAR)", href: "/hms/bookings/reports", icon: CalendarCheck }, { label: "Waitlist", href: "/hms/bookings/waitlist", icon: CalendarCheck }, { label: "Housekeeping", href: "/hms/housekeeping", icon: CalendarCheck }, { label: "Booking calendar", href: "/hms/bookings/calendar", icon: CalendarCheck }, { label: "All bookings", href: "/hms/bookings", icon: CalendarCheck }, { label: "Day close (night audit)", href: "/hms/bookings/close", icon: CalendarCheck }, { label: "Booking policies", href: "/hms/settings/policies", icon: CalendarCheck }, { label: "Daily sales report", href: "/hms/reports?r=daily", icon: FileText }, { label: "Revenue & profit report", href: "/hms/reports?r=profit", icon: FileText }, { label: "Occupancy, ADR, RevPAR", href: "/hms/reports?r=occupancy", icon: FileText }, { label: "Payments to collect", href: "/hms/payments?tab=collect", icon: CreditCard }, { label: "Expenses waiting approval", href: "/hms/operations?tab=list", icon: Activity }, { label: "Supplier bills to pay", href: "/hms/operations?tab=bills", icon: Activity }, { label: "Expense categories & approval rule", href: "/hms/operations?tab=categories", icon: Activity }, { label: "Refunds due", href: "/hms/payments?tab=refunds", icon: CreditCard }, { label: "Cash movements", href: "/hms/cashbox/movements", icon: Wallet }, { label: "Cashbox closed days", href: "/hms/cashbox/days", icon: Wallet }, { label: "Restaurant cashbox", href: "/hms/meals/cashbox", icon: Wallet }, { label: "Restaurant POS (new order)", href: "/hms/meals/pos", icon: ChefHat }, { label: "Kitchen orders", href: "/hms/meals/kitchen", icon: ChefHat }, { label: "Restaurant menu", href: "/hms/meals/menu", icon: ChefHat }, { label: "Restaurant orders", href: "/hms/meals/orders", icon: ChefHat }, { label: "Restaurant cash settings", href: "/hms/meals/cash-settings", icon: Wallet }, { label: "Discount campaigns", href: "/hms/discounts/campaigns", icon: Tag },
  { label: "Room types", href: "/hms/rooms", icon: BedDouble }, { label: "Room numbers", href: "/hms/rooms/numbers", icon: BedDouble }, { label: "Attendance", href: "/hms/staff/attendance", icon: Users },
  { label: "Payroll", href: "/hms/staff/payroll", icon: Users }, { label: "Add a new property", href: "/onboarding", icon: Plus },
  { label: "BinGi news · server updates & what’s new", href: "/hms/news", icon: Megaphone },
  { label: "Design system · tokens, components & code (developers)", href: "/hms/design-system", icon: Palette },
];

const modeSub = (l: () => void) => (window.addEventListener("storage", l), () => window.removeEventListener("storage", l));
const readMode = () => {
  try {
    return localStorage.getItem("hms-sidebar") === "collapsed";
  } catch {
    return false;
  }
};

export function HmsShell({ children }: { children: ReactNode }) {
  return (
    <PropertyProvider>
      <ShellInner>{children}</ShellInner>
    </PropertyProvider>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const [prefs] = usePrefs();
  useSettings(useProperty()); // keeps the hotel VAT / service charge in step with Settings for every module
  useAppServiceWorker(); // makes the HMS installable as an app (network first + offline page)
  const path = usePathname();
  const collapsedStored = useSyncExternalStore(modeSub, readMode, () => false);
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const isCollapsed = collapsed ?? collapsedStored;
  const toggle = () => {
    const next = !isCollapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("hms-sidebar", next ? "collapsed" : "open");
    } catch {}
  };
  // Pages outside the sidebar (BinGi news) highlight nothing.
  const active = ALL_ITEMS.find((i) => (i.href === "/hms" ? path === "/hms" : path.startsWith(i.href.replace("/overview", "")))) ?? (path.startsWith("/hms/news") || path.startsWith("/hms/design-system") ? { id: "" } : ALL_ITEMS[0]);

  const [drawer, setDrawer] = useState(false);
  const mod = moduleOfPath(path);
  const focusTitle = FOCUS_MODULES[mod];
  const [focus] = useFocusMode(focusTitle ? mod : "_none");
  if (focus && focusTitle) return (
    <div data-font={prefs.font} className={clsx("hms-app flex h-dvh flex-col overflow-hidden bg-hms-canvas text-[14px]", prefs.reduceMotion && "hms-no-motion")}>
      <FocusBar id={mod} title={focusTitle} />
      <main style={prefs.zoom !== 100 ? { zoom: prefs.zoom / 100 } : undefined} className="min-h-0 flex-1 [&_.focus-hide]:hidden [&_.hms-page]:max-w-none"><AccessGuard>{children}</AccessGuard></main>
    </div>
  );
  return (
    <div data-font={prefs.font} className={clsx("hms-app flex h-dvh overflow-hidden bg-hms-canvas text-[14px]", prefs.reduceMotion && "hms-no-motion")}>
      <Sidebar collapsed={isCollapsed} activeId={active.id} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setDrawer(true)} />
        <NewsBanner />
        <ViewAsBanner />
        <BillBanner />
        <SetupModeBanner />
        <ViewOnlyBanner />
        <main style={prefs.zoom !== 100 ? { zoom: prefs.zoom / 100 } : undefined} className="min-h-0 flex-1 pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0"><AccessGuard>{children}</AccessGuard></main>
      </div>
      <TabBar activeId={active.id} onMore={() => setDrawer(true)} />
      {drawer && <MobileDrawer activeId={active.id} onClose={() => setDrawer(false)} />}
      <NewsPopup />
    </div>
  );
}

function Sidebar({ collapsed, activeId, onToggle }: { collapsed: boolean; activeId: string; onToggle: () => void }) {
  return (
    <aside className={clsx("hidden shrink-0 flex-col border-r border-hms-line bg-white transition-[width] duration-300 ease-out md:flex", collapsed ? "w-[68px]" : "w-[224px]")}>
      {/* Official BinGi HMS logo (the property shows in the switcher at the bottom). */}
      <Link href="/hms" aria-label="BinGi HMS — Dashboard" className={clsx("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-5")}>
        {/* eslint-disable-next-line @next/next/no-img-element -- brand asset, inlined in the single-file preview */}
        <img src={imgSrc(collapsed ? "/brand/bingi-hms-mark.svg" : "/brand/bingi-hms.svg")} alt="BinGi HMS" className={collapsed ? "h-9 w-auto object-contain" : "h-8 w-auto"} />
      </Link>
      <NavList activeId={activeId} collapsed={collapsed} />
      {!collapsed && <UpgradeCard />}
      <div className="shrink-0 border-t border-hms-line p-3">
        {!collapsed && <ModeSwitch />}
        <PropertySwitcher collapsed={collapsed} />
        <button onClick={onToggle} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-hms-muted hover:bg-hms-hover">
          <ChevronsLeft className={clsx("size-4 transition-transform", collapsed && "rotate-180")} /> {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

// ---------- Sidebar mode: Flat = modules only; Expandable = each module opens to its sub-pages (by plan + role) ----------
const MODE_KEY = "hms-sidebar-mode";
const modeSubs = new Set<() => void>();
const readNavMode = () => { try { return localStorage.getItem(MODE_KEY) === "expandable" ? "expandable" : "flat"; } catch { return "flat"; } };
export function useNavMode() {
  const mode = useSyncExternalStore((f) => { modeSubs.add(f); return () => { modeSubs.delete(f); }; }, readNavMode, () => "flat");
  const set = (m: "flat" | "expandable") => { try { localStorage.setItem(MODE_KEY, m); } catch {} modeSubs.forEach((f) => f()); };
  return [mode, set] as const;
}
function ModeSwitch() {
  const [mode, set] = useNavMode();
  return (
    <div role="radiogroup" aria-label="Sidebar mode" className="mb-3 flex rounded-full border border-hms-line bg-hms-hover p-0.5 text-[12px] font-semibold">
      {(["flat", "expandable"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => set(m)} className={clsx("flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors", mode === m ? "bg-white shadow-sm" : "text-hms-muted hover:text-hms-ink")}>
          {mode === m ? <span className="grid size-3 place-items-center rounded-full border-2 border-hms-red"><span className="size-1 rounded-full bg-hms-red" /></span> : <span className="size-3 rounded-full border border-hms-line bg-white" />}
          {m === "flat" ? "Flat" : "Expandable"}
        </button>
      ))}
    </div>
  );
}

/** Ids the sidebar shows: allowed by the plan (or locked) and by the role / department view. */
function useShown() {
  const { level } = useAccess();
  return { show: (id: string) => level(id) !== "hidden", locked: (id: string) => level(id) === "locked" };
}
/** Month-end bill: shows on every page while a BinGi bill is open (not on the billing page itself). */
function BillBanner() {
  const h = useProperty();
  const path = usePathname();
  const { st } = useRooms(h);
  const { open } = useBilling(h, st.units);
  if (!open || path.startsWith("/hms/billing")) return null;
  const late = open.status === "overdue";
  return (
    <div role="region" aria-label="BinGi bill" className={clsx("flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2 text-[13.5px] sm:px-6", late ? "border-[#f3c4c0] bg-[#fdecec] text-[#8e1621]" : "border-[#f1dfb8] bg-[#fdf8ec] text-[#6b4309]")}>
      <p className="min-w-0 flex-1"><b className="font-semibold">{monthName(open.month)} BinGi bill {late ? "is overdue" : "is ready"} · ৳{new Intl.NumberFormat("en-IN").format(open.total)}</b>{late ? " · pay to keep online booking on" : ` · due ${dShort(open.due)}`}</p>
      <Link href="/hms/billing" className="font-semibold underline underline-offset-4">{late ? "Pay now" : "See bill"}</Link>
    </div>
  );
}

function ViewAsBanner() {
  const as = useViewAs();
  if (!as) return null;
  return (
    <div role="region" aria-label="Viewing as" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#cfdcf7] bg-[#eef3fd] px-4 py-2 text-[13.5px] text-[#1e3a8a] sm:px-6">
      <Eye className="size-4 shrink-0" aria-hidden /><p className="min-w-0 flex-1"><b className="font-semibold">Viewing the HMS as {as.name}</b> · the sidebar shows only what they see. Their role still decides what they can change.</p>
      <Link href="/hms/staff/views" className="font-semibold underline underline-offset-4">Edit view</Link>
      <button onClick={() => setViewAs(null)} className="h-8 rounded-lg border border-[#cfdcf7] bg-white px-3 font-semibold text-hms-ink hover:bg-[#f7f9ff]">Exit</button>
    </div>
  );
}

function NavList({ activeId, collapsed, big }: { activeId: string; collapsed: boolean; big?: boolean }) {
  const [mode] = useNavMode();
  const { show, locked } = useShown();
  const subsOf = useSubs();
  const [openM, setOpenM] = useState<Record<string, boolean>>({});
  const fold = mode === "expandable" && !collapsed;
  const row = (i: Item) => {
    const subs = fold && !locked(i.id) ? subsOf(i.id) : [];
    const active = activeId === i.id;
    const isOpen = subs.length > 1 && (openM[i.id] ?? active);
    return (
      <div key={i.id}>
        <div className="relative">
          <NavItem item={i} active={active} collapsed={collapsed} big={big} locked={locked(i.id)} padRight={subs.length > 1} />
          {subs.length > 1 && <button type="button" onClick={() => setOpenM((o) => ({ ...o, [i.id]: !isOpen }))} aria-expanded={isOpen} aria-label={`${isOpen ? "Hide" : "Show"} ${i.label} pages`}
            className={clsx("absolute right-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md", active ? "text-white hover:bg-white/15" : "text-hms-muted hover:bg-black/5 hover:text-hms-ink")}>
            <ChevronDown className={clsx("size-3.5 transition-transform duration-200", !isOpen && "-rotate-90")} />
          </button>}
        </div>
        {isOpen && <SubList subs={subs} big={big} />}
      </div>
    );
  };
  return (
    <nav className={clsx("no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3", big ? "px-3" : "px-2")} aria-label="HMS">
      {GROUPS.map((g0) => ({ ...g0, items: g0.items.filter((i) => show(i.id)) })).filter((g) => g.items.length).map((g) => (
        <div key={g.label} className="mt-2.5 first:mt-0.5">
          {!collapsed && <p className="px-2.5 pb-0.5 text-[11.5px] font-medium text-hms-muted">{g.label}</p>}
          {g.items.map(row)}
        </div>
      ))}
      {show("settings") && <div className="mt-2.5 border-t border-hms-line pt-2.5">{row(ALL_ITEMS.at(-1)!)}</div>}
    </nav>
  );
}

/** The open module's sub-pages: a thin guide line on the left, the current page in red. */
function SubList({ subs, big }: { subs: (Sub & { locked?: boolean })[]; big?: boolean }) {
  const path = usePathname();
  const sp = useSearchParams();
  const score = (x: Sub) => {
    const [p, q] = x.href.split("?");
    if (p !== path && !(p !== "/hms/settings" && p.length > 5 && path.startsWith(p + "/") && !subs.some((y) => y.href.split("?")[0] === path))) return 0;
    if (!q) return [...sp.keys()].some((k) => subs.some((y) => y.href.includes(`?${k}=`))) ? 1 : 2;
    const [k, v] = q.split("="); return sp.get(k) === v ? 3 : 0;
  };
  const best = Math.max(0, ...subs.map(score));
  return (
    <ul className="hms-fade mb-1 ml-[19px] mt-0.5 border-l border-hms-line pl-2">
      {subs.map((x) => { const on = best > 0 && score(x) === best; return (
        <li key={x.href}><Link href={x.href} aria-current={on ? "page" : undefined}
          className={clsx("flex items-center gap-1.5 rounded-md px-2 transition-colors", big ? "h-10 text-[14.5px]" : "h-[27px] text-[13px]", on ? "bg-hms-coral-soft font-semibold text-hms-red" : "text-[#4d5664] hover:bg-hms-hover hover:text-hms-ink")}>
          <span className="min-w-0 flex-1 truncate">{x.label}</span>{x.locked && <Lock aria-label="Not in your plan" className="size-3 shrink-0 text-hms-muted" />}
        </Link></li>
      ); })}
    </ul>
  );
}

/** Phones: bottom tab bar (iOS style). "More" opens the full menu. */
const TABS = ["dashboard", "bookings", "rooms", "guests"];
function TabBar({ activeId, onMore }: { activeId: string; onMore: () => void }) {
  const { show } = useShown();
  const name = useNavLabel();
  const items = [...TABS.filter(show), ...ALL_ITEMS.map((i) => i.id).filter((id) => show(id) && !TABS.includes(id))].slice(0, 4).map((id) => ALL_ITEMS.find((i) => i.id === id)!);
  const inMore = !TABS.includes(activeId);
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hms-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((i) => (
        <Link key={i.id} href={i.href} aria-current={activeId === i.id ? "page" : undefined} className={clsx("flex h-[60px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", activeId === i.id ? "text-hms-red" : "text-hms-muted")}>
          <i.icon className="size-[22px]" strokeWidth={activeId === i.id ? 2.2 : 1.75} />{name(i.id, i.label)}
        </Link>
      ))}
      <button onClick={onMore} aria-label="More — all modules" className={clsx("flex h-[60px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", inMore ? "text-hms-red" : "text-hms-muted")}>
        <MenuIcon className="size-[22px]" strokeWidth={inMore ? 2.2 : 1.75} />More
      </button>
    </nav>
  );
}

function MobileDrawer({ activeId, onClose }: { activeId: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="hms-fade fixed inset-0 z-[80] bg-black/30 md:hidden" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => { e.stopPropagation(); if ((e.target as HTMLElement).closest("a")) onClose(); }} className="hms-drawer-l flex h-full w-[min(300px,86vw)] flex-col bg-white shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between px-4">{/* eslint-disable-next-line @next/next/no-img-element -- brand asset */}<img src={imgSrc("/brand/bingi-hms.svg")} alt="BinGi HMS" className="h-7 w-auto" /><button autoFocus onClick={onClose} aria-label="Close menu" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button></div>
        <NavList activeId={activeId} collapsed={false} big />
        <UpgradeCard big />
        <div className="shrink-0 border-t border-hms-line p-3"><PropertySwitcher collapsed={false} /></div>
      </div>
    </div>
  );
}

function NavItem({ item, active, collapsed, big, locked, padRight }: { item: Item; active: boolean; collapsed: boolean; big?: boolean; locked?: boolean; padRight?: boolean }) {
  const Icon = item.icon;
  const label = useNavLabel()(item.id, item.label);
  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group flex items-center gap-2.5 rounded-lg px-2.5 transition-colors duration-150",
        big ? "h-11 text-[15px]" : "h-[30px] text-[14px]",
        active ? "btn-glow font-medium text-white" : "text-hms-ink hover:bg-hms-hover",
        collapsed && "justify-center px-0",
        padRight && "pr-8",
      )}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
      {!collapsed && locked ? <Lock aria-label={`Not in your plan`} className={clsx("size-3.5 shrink-0", active ? "text-white/80" : "text-hms-muted")} /> : null}
      {!collapsed && item.id === "chat" ? <ChatBadge active={active} /> : null}
      {!collapsed && item.id === "meals" ? <MealsBadge active={active} /> : null}
      {!collapsed && item.badge ? (
        <span className={clsx("grid size-5 place-items-center rounded-full text-[11px] font-semibold", active ? "bg-white/20" : "bg-hms-coral-soft text-hms-red")}>{item.badge}</span>
      ) : null}
    </Link>
  );
}

/** Live HMS shows the workspace card here; in this prototype it also switches the demo property. */
function PropertySwitcher({ collapsed }: { collapsed: boolean }) {
  const hotel = useProperty();
  const mine = useSubmittedHotels();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={clsx("flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left hover:bg-hms-hover", collapsed && "justify-center")} aria-expanded={open}>
        <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-hms-coral text-[11px] font-bold text-white">
          MY<span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-green-500" />
        </span>
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{hotel.name}</span>
              <span className="block truncate text-[12px] text-hms-muted">{hotel.plan[0].toUpperCase() + hotel.plan.slice(1)} · active</span>
            </span>
            <MoreHorizontal className="size-4 text-hms-muted" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 max-h-[min(70vh,560px)] w-[260px] overflow-y-auto rounded-2xl border border-hms-line bg-white p-1.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25)]">
          <Link href="/onboarding" onClick={() => setOpen(false)} className="mb-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-semibold text-hms-red hover:bg-hms-coral-soft"><span className="grid size-8 place-items-center rounded-lg bg-hms-coral-soft"><Plus className="size-4" /></span>Add a new property</Link>
          {mine.length > 0 && <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-hms-muted">Your properties</p>}
          {mine.length > 0 && mine.map((p) => (
            <button key={p.slug} onClick={() => { setProperty(p.slug); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-hms-hover">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-hms-coral-soft text-[12px] font-semibold text-hms-red">{p.name.slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{p.name}</span>
              {p.slug === hotel.slug && <Check className="size-4 text-hms-red" />}
            </button>
          ))}
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-hms-muted">Demo properties</p>
          {PROPERTIES.map((p) => (
            <button
              key={p.slug}
              onClick={() => {
                setProperty(p.slug);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-hms-hover"
            >
              <span className="relative size-8 shrink-0 overflow-hidden rounded-lg">
                <Image src={p.heroPhoto} alt="" fill sizes="32px" className="object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{p.name}</span>
                <span className="block text-[12px] text-hms-muted">{p.plan[0].toUpperCase() + p.plan.slice(1)} · {p.theme.master.toUpperCase()}</span>
              </span>
              {p.slug === hotel.slug && <Check className="size-4 text-hms-red" />}
            </button>
          ))}
          <p className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-2 text-[11px] text-hms-muted"><ChevronsUpDown className="size-3" /> Production: the user&apos;s own properties</p>
        </div>
      )}
    </div>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const crumbs = useCrumbs(path);
  const { show } = useShown();
  const targets = SEARCH_TARGETS.filter((t) => { const m = moduleOfPath(t.href.split("?")[0]); return !m || show(m); });
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hms-line bg-white px-3 sm:gap-3 sm:px-4">
      <button onClick={onMenu} aria-label="Open menu" className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-hms-hover md:hidden"><MenuIcon className="size-5" /></button>
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[15px]">
        {crumbs.map((c, i) => (
          <span key={c.label} className={clsx("min-w-0 items-center gap-2", i < crumbs.length - 1 ? "hidden sm:flex" : "flex")}>
            {i > 0 && <span className="hidden text-hms-muted sm:inline">›</span>}
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="truncate text-hms-muted hover:text-hms-ink">{c.label}</Link>
            ) : (
              <span className="truncate font-semibold sm:font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <span className="ml-1 hidden rounded-full bg-hms-amber-soft px-2 py-0.5 text-[11px] font-semibold text-hms-amber lg:inline">Prototype · demo data</span>
      <Link href="/onboarding" aria-label="Add a new property (onboarding)" className="ml-1 hidden h-8 shrink-0 items-center gap-1.5 rounded-lg btn-glow px-2.5 text-[12.5px] font-semibold text-white sm:inline-flex"><Plus className="size-4" aria-hidden /><span>New property</span></Link>
      <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
        <SearchBox items={targets} />
        <span className="hidden sm:block"><LanguageMenu /></span>
        <FullscreenButton className="hidden sm:grid" />
        <Notifications />
        <AccountMenu />
      </div>
    </header>
  );
}

function useCrumbs(path: string): { label: string; href?: string }[] {
  const name = useNavLabel();
  if (path.startsWith("/hms/settings")) {
    const id = path.split("/")[3] ?? "overview";
    const page = S_PAGES.find((p) => p.id === id);
    return id === "overview" ? [{ label: "Settings" }] : [{ label: "Settings", href: "/hms/settings" }, { label: page?.label ?? "Overview" }];
  }
  if (path.startsWith("/hms/website")) {
    const id = path.split("/")[3] ?? "overview";
    const page = WM_PAGES.find((p) => p.id === id);
    return [{ label: "Website", href: "/hms/website/overview" }, { label: page?.label ?? "Overview" }];
  }
  if (path.startsWith("/hms/rooms")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { categories: "Room types", numbers: "Room numbers", configuration: "Setup", setup: "Edit setup", new: "Add room type" };
    return [{ label: name("rooms", "Rooms"), href: seg ? "/hms/rooms" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
  }
  if (path.startsWith("/hms/meals/")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { pos: "POS", orders: "Orders", kitchen: "Kitchen", menu: "Menu", tables: "Tables & QR", reports: "Reports", settings: "Settings", cashbox: "Cashbox", "cash-settings": "Cash settings" };
    return [{ label: "Restaurant & Bar", href: "/hms/meals" }, { label: names[seg] ?? seg }];
  }
  if (path.startsWith("/hms/bookings")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { calendar: "Calendar", list: "All bookings", new: "New booking", view: "Booking", close: "Day close", settings: "Settings", board: "Room board", waitlist: "Waitlist", reports: "Reports", group: "Group booking", walkin: "Walk-in" };
    return [{ label: "Bookings", href: seg ? "/hms/bookings" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
  }
  if (path.startsWith("/hms/cashbox")) {
    const seg = path.split("/")[3];
    return [{ label: "Cashbox", href: seg ? "/hms/cashbox" : undefined }, ...(seg ? [{ label: seg === "movements" ? "Movements" : seg === "days" ? "Closed days" : seg }] : [])];
  }
  if (path.startsWith("/hms/news")) return [{ label: "BinGi news" }];
  if (path.startsWith("/hms/design-system")) return [{ label: "Design system" }];
  if (path.startsWith("/hms/discounts")) {
    const seg = path.split("/")[3];
    return [{ label: "Rates & Discounts", href: seg ? "/hms/discounts" : undefined }, ...(seg ? [{ label: seg === "campaigns" ? "Discounts" : seg }] : [])];
  }
  if (path.startsWith("/hms/other-services")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { orders: "Orders", categories: "Setup", catalog: "Service Catalog", reports: "Reports", setup: "Setup" };
    return [{ label: "Services", href: seg ? "/hms/other-services" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
  }
  if (path.startsWith("/hms/inventory")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { history: "History", reports: "Reports", setup: "Setup", purchase: "Purchase orders", count: "Stock count", recipes: "Recipes & sales" };
    return [{ label: "Inventory", href: seg ? "/hms/inventory" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
  }
  if (path.startsWith("/hms/guests") || path === "/hms/guest-reviews") {
    const seg = path === "/hms/guest-reviews" ? "reviews" : path.split("/")[3];
    return [{ label: "Guests", href: seg ? "/hms/guests" : undefined }, ...(seg ? [{ label: seg === "reviews" ? "Reviews" : decodeURIComponent(seg) }] : [])];
  }
  if (path.startsWith("/hms/staff/")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { people: "People", attendance: "Attendance", schedule: "Schedule", views: "Department views", leave: "Leave", payroll: "Payroll & Benefits", hiring: "Hiring", operations: "Team Operations", settings: "Reports & Settings" };
    const sub = path.split("/")[4];
    return [{ label: name("staff", "Team"), href: "/hms/staff" }, { label: names[seg] ?? "Overview", href: sub ? `/hms/staff/${seg}` : undefined }, ...(sub ? [{ label: decodeURIComponent(sub) }] : [])];
  }
  const item = ALL_ITEMS.find((i) => i.href === path);
  return [{ label: item ? name(item.id, item.label) : "Dashboard" }];
}
