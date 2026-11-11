"use client";
// HMS shell — sidebar + header, 1:1 with the live HMS (hms.bingi.app, Nov 2026).
// Every module page renders inside this, so other modules can be designed in this repo too.
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import {
  Activity, BedDouble, Boxes, Brush, CalendarCheck, Check, ChefHat, ChevronDown, ChevronsLeft, ChevronsUpDown, CreditCard, FileText, Globe,
  Landmark, LayoutGrid, Menu as MenuIcon, MessageSquare, MoreHorizontal, X, Plus, ReceiptText, Send, Settings, Sparkles, Star, Tag,
  UserPlus, Users, Wallet,
} from "lucide-react";
import { PROPERTIES, PropertyProvider, setProperty, useProperty } from "./property";
import { SetupModeBanner } from "./setup-mode";
import { useSubmittedHotels } from "@/lib/onboarding/store";
import { WM_PAGES } from "./website/pages";
import { AccountMenu, LanguageMenu, Notifications, SearchBox, type NavTarget } from "./shell-extras";

type Item = { id: string; label: string; icon: typeof Globe; href: string; badge?: number };
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Daily operations",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/hms" },
      { id: "bookings", label: "Bookings", icon: CalendarCheck, href: "/hms/bookings" },
      { id: "rooms", label: "Rooms", icon: BedDouble, href: "/hms/rooms" },
      { id: "housekeeping", label: "Housekeeping", icon: Brush, href: "/hms/housekeeping" },
      { id: "guests", label: "Guests", icon: UserPlus, href: "/hms/guests" },
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/hms/chat" },
      { id: "meals", label: "Meals", icon: ChefHat, href: "/hms/meals", badge: 2 },
    ],
  },
  {
    label: "Property & team",
    items: [
      { id: "staff", label: "Staff", icon: Users, href: "/hms/staff" },
      { id: "inventory", label: "Inventory", icon: Boxes, href: "/hms/inventory" },
      { id: "other-services", label: "Other Services", icon: Sparkles, href: "/hms/other-services" },
    ],
  },
  {
    label: "Money & pricing",
    items: [
      { id: "discounts", label: "Discounts", icon: Tag, href: "/hms/discounts" },
      { id: "payments", label: "Payments", icon: CreditCard, href: "/hms/payments" },
      { id: "cashbox", label: "Cashbox", icon: Wallet, href: "/hms/cashbox" },
      { id: "finance", label: "Finance", icon: Landmark, href: "/hms/finance" },
      { id: "operations", label: "Operations", icon: Activity, href: "/hms/operations" },
      { id: "billing", label: "Billing & Subscription", icon: ReceiptText, href: "/hms/billing" },
    ],
  },
  {
    label: "Reports & online",
    items: [
      { id: "reports", label: "Reports", icon: FileText, href: "/hms/reports" },
      { id: "communication", label: "Communication Center", icon: Send, href: "/hms/communication" },
      { id: "website", label: "Website Management", icon: Globe, href: "/hms/website/overview" },
    ],
  },
];
export const ALL_ITEMS = [...GROUPS.flatMap((g) => g.items), { id: "settings", label: "Settings", icon: Settings, href: "/hms/settings" }];

/** Everything ⌘K can open: modules + their main sub-pages. */
const SEARCH_TARGETS: NavTarget[] = [
  ...[...GROUPS.flatMap((g) => g.items), { id: "settings", label: "Settings", icon: Settings, href: "/hms/settings" }].map((i) => ({ label: i.label, href: i.href, icon: i.icon })),
  { label: "Guest reviews", href: "/hms/guests/reviews", icon: Star }, { label: "Inventory history", href: "/hms/inventory/history", icon: Boxes },
  { label: "Inventory reports", href: "/hms/inventory/reports", icon: Boxes }, { label: "Purchase orders", href: "/hms/inventory/purchase", icon: Boxes }, { label: "Stock count", href: "/hms/inventory/count", icon: Boxes }, { label: "Recipes & sales", href: "/hms/inventory/recipes", icon: Boxes }, { label: "Service orders", href: "/hms/other-services/orders", icon: Sparkles }, { label: "Service catalog", href: "/hms/other-services/catalog", icon: Sparkles }, { label: "Service reports", href: "/hms/other-services/reports", icon: Sparkles },
  { label: "Room categories", href: "/hms/rooms/categories", icon: BedDouble }, { label: "Attendance", href: "/hms/staff/attendance", icon: Users },
  { label: "Payroll", href: "/hms/staff/payroll", icon: Users }, { label: "Add a new property", href: "/onboarding", icon: Plus },
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
  const active = ALL_ITEMS.find((i) => (i.href === "/hms" ? path === "/hms" : path.startsWith(i.href.replace("/overview", "")))) ?? ALL_ITEMS[0];

  const [drawer, setDrawer] = useState(false);
  return (
    <div className="hms-app flex h-dvh overflow-hidden bg-hms-canvas text-[14px]">
      <Sidebar collapsed={isCollapsed} activeId={active.id} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenu={() => setDrawer(true)} />
        <SetupModeBanner />
        <main className="min-h-0 flex-1 pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>
      <TabBar activeId={active.id} onMore={() => setDrawer(true)} />
      {drawer && <MobileDrawer activeId={active.id} onClose={() => setDrawer(false)} />}
    </div>
  );
}

function Sidebar({ collapsed, activeId, onToggle }: { collapsed: boolean; activeId: string; onToggle: () => void }) {
  const hotel = useProperty();
  return (
    <aside className={clsx("hidden shrink-0 flex-col border-r border-hms-line bg-white transition-[width] duration-300 ease-out md:flex", collapsed ? "w-[68px]" : "w-[224px]")}>
      <div className="flex h-14 shrink-0 items-center px-4">
        {hotel.propertyCode !== undefined || hotel.slug.startsWith("onb-")
          ? <span className="grid size-9 place-items-center rounded-md bg-hms-coral-soft text-[13px] font-semibold text-hms-red" aria-label={hotel.name}>{hotel.name.slice(0, 2).toUpperCase()}</span>
          : <span className="relative size-9 overflow-hidden rounded-md">
              <Image src={hotel.heroPhoto} alt={hotel.name} fill sizes="36px" className="object-cover" />
            </span>}
      </div>
      <NavList activeId={activeId} collapsed={collapsed} />
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

// ---------- Sidebar mode (decision 2 Nov): Flat = all items, Expandable = groups fold (accordion) ----------
const MODE_KEY = "hms-sidebar-mode";
const modeSubs = new Set<() => void>();
const readNavMode = () => { try { return localStorage.getItem(MODE_KEY) === "expandable" ? "expandable" : "flat"; } catch { return "flat"; } };
function useNavMode() {
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

function NavList({ activeId, collapsed, big }: { activeId: string; collapsed: boolean; big?: boolean }) {
  const [mode] = useNavMode();
  const [openG, setOpenG] = useState<string[]>([]);
  const fold = mode === "expandable" && !collapsed;
  return (
    <nav className={clsx("no-scrollbar min-h-0 flex-1 overflow-y-auto pb-3", big ? "px-3" : "px-2")} aria-label="HMS">
      {GROUPS.map((g) => {
        const hasActive = g.items.some((i) => i.id === activeId);
        const isOpen = !fold || hasActive || openG.includes(g.label);
        return (
          <div key={g.label} className="mt-2.5 first:mt-0.5">
            {!collapsed && (fold
              ? <button type="button" onClick={() => setOpenG((o) => (o.includes(g.label) ? o.filter((x) => x !== g.label) : [...o, g.label]))} aria-expanded={isOpen} disabled={hasActive}
                  className="flex w-full items-center px-2.5 pb-0.5 text-left text-[11.5px] font-medium text-hms-muted hover:text-hms-ink disabled:cursor-default">
                  <span className="flex-1">{g.label}</span><ChevronDown className={clsx("size-3.5 transition-transform", !isOpen && "-rotate-90")} />
                </button>
              : <p className="px-2.5 pb-0.5 text-[11.5px] font-medium text-hms-muted">{g.label}</p>)}
            {isOpen && <div className={fold ? "hms-fade" : undefined}>{g.items.map((i) => <NavItem key={i.id} item={i} active={activeId === i.id} collapsed={collapsed} big={big} />)}</div>}
          </div>
        );
      })}
      <div className="mt-2.5 border-t border-hms-line pt-2.5">
        <NavItem item={ALL_ITEMS.at(-1)!} active={activeId === "settings"} collapsed={collapsed} big={big} />
      </div>
    </nav>
  );
}

/** Phones: bottom tab bar (iOS style). "More" opens the full menu. */
const TABS = ["dashboard", "bookings", "rooms", "guests"];
function TabBar({ activeId, onMore }: { activeId: string; onMore: () => void }) {
  const items = TABS.map((id) => ALL_ITEMS.find((i) => i.id === id)!);
  const inMore = !TABS.includes(activeId);
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 flex border-t border-hms-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((i) => (
        <Link key={i.id} href={i.href} aria-current={activeId === i.id ? "page" : undefined} className={clsx("flex h-[60px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", activeId === i.id ? "text-hms-red" : "text-hms-muted")}>
          <i.icon className="size-[22px]" strokeWidth={activeId === i.id ? 2.2 : 1.75} />{i.label}
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
        <div className="flex h-14 shrink-0 items-center justify-between px-4"><span className="text-[16px] font-bold">Menu</span><button autoFocus onClick={onClose} aria-label="Close menu" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button></div>
        <NavList activeId={activeId} collapsed={false} big />
        <div className="shrink-0 border-t border-hms-line p-3"><PropertySwitcher collapsed={false} /></div>
      </div>
    </div>
  );
}

function NavItem({ item, active, collapsed, big }: { item: Item; active: boolean; collapsed: boolean; big?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group flex items-center gap-2.5 rounded-lg px-2.5 transition-colors duration-150",
        big ? "h-11 text-[15px]" : "h-[30px] text-[14px]",
        active ? "btn-glow font-medium text-white" : "text-hms-ink hover:bg-hms-hover",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-[17px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
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
        <SearchBox items={SEARCH_TARGETS} />
        <span className="hidden sm:block"><LanguageMenu /></span>
        <Notifications />
        <AccountMenu />
      </div>
    </header>
  );
}

function useCrumbs(path: string): { label: string; href?: string }[] {
  if (path.startsWith("/hms/website")) {
    const id = path.split("/")[3] ?? "overview";
    const page = WM_PAGES.find((p) => p.id === id);
    return [{ label: "Website Management", href: "/hms/website/overview" }, { label: page?.label ?? "Overview" }];
  }
  if (path.startsWith("/hms/rooms")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { categories: "Categories", configuration: "Setup", setup: "Edit setup", new: "Add accommodation" };
    return [{ label: "Rooms", href: seg ? "/hms/rooms" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
  }
  if (path.startsWith("/hms/other-services")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { orders: "Orders", categories: "Setup", catalog: "Service Catalog", reports: "Reports", setup: "Setup" };
    return [{ label: "Other Services", href: seg ? "/hms/other-services" : undefined }, ...(seg ? [{ label: names[seg] ?? seg }] : [])];
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
    const names: Record<string, string> = { people: "People", attendance: "Attendance", schedule: "Schedule", leave: "Leave", payroll: "Payroll & Benefits", hiring: "Hiring", operations: "Team Operations", settings: "Reports & Settings" };
    const sub = path.split("/")[4];
    return [{ label: "Staff", href: "/hms/staff" }, { label: names[seg] ?? "Overview", href: sub ? `/hms/staff/${seg}` : undefined }, ...(sub ? [{ label: decodeURIComponent(sub) }] : [])];
  }
  const item = ALL_ITEMS.find((i) => i.href === path);
  return [{ label: item?.label ?? "Dashboard" }];
}
