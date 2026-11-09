"use client";
// HMS shell — sidebar + header, 1:1 with the live HMS (hms.bingi.app, Nov 2026).
// Every module page renders inside this, so other modules can be designed in this repo too.
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import {
  Activity, Bell, BedDouble, Boxes, Brush, CalendarCheck, Check, ChefHat, ChevronDown, ChevronsLeft, ChevronsUpDown, CreditCard, FileText, Globe,
  Landmark, Languages, LayoutGrid, MessageSquare, Minimize2, Moon, MoreHorizontal, ReceiptText, Search, Send, Settings, Sparkles, Star, Tag,
  UserPlus, Users, Wallet,
} from "lucide-react";
import { PROPERTIES, PropertyProvider, setProperty, useProperty } from "./property";
import { WM_PAGES } from "./website/pages";

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
      { id: "guest-reviews", label: "Guest Reviews", icon: Star, href: "/hms/guest-reviews" },
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

  return (
    <div className="hms-app flex h-dvh overflow-hidden bg-hms-canvas text-[14px]">
      <Sidebar collapsed={isCollapsed} activeId={active.id} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, activeId, onToggle }: { collapsed: boolean; activeId: string; onToggle: () => void }) {
  const hotel = useProperty();
  return (
    <aside className={clsx("hidden shrink-0 flex-col border-r border-hms-line bg-white transition-[width] duration-300 ease-out md:flex", collapsed ? "w-[68px]" : "w-[224px]")}>
      <div className="flex h-14 shrink-0 items-center px-4">
        <span className="relative size-9 overflow-hidden rounded-md">
          <Image src={hotel.heroPhoto} alt={hotel.name} fill sizes="36px" className="object-cover" />
        </span>
      </div>
      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="HMS">
        {GROUPS.map((g) => (
          <div key={g.label} className="mt-3 first:mt-1">
            {!collapsed && <p className="px-2 pb-1.5 text-[12px] font-medium text-hms-muted">{g.label}</p>}
            {g.items.map((i) => (
              <NavItem key={i.id} item={i} active={activeId === i.id} collapsed={collapsed} />
            ))}
          </div>
        ))}
        <div className="mt-3 border-t border-hms-line pt-3">
          <NavItem item={ALL_ITEMS.at(-1)!} active={activeId === "settings"} collapsed={collapsed} />
        </div>
      </nav>
      <div className="shrink-0 border-t border-hms-line p-3">
        {!collapsed && (
          <div className="mb-3 flex rounded-full border border-hms-line bg-hms-hover p-0.5 text-[12px] font-semibold">
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-1.5 shadow-sm">
              <span className="grid size-3 place-items-center rounded-full border-2 border-hms-red"><span className="size-1 rounded-full bg-hms-red" /></span> Flat
            </span>
            <span className="flex flex-1 items-center justify-center gap-1.5 py-1.5 text-hms-muted">
              <span className="size-3 rounded-full border border-hms-line bg-white" /> Expandable
            </span>
          </div>
        )}
        <PropertySwitcher collapsed={collapsed} />
        <button onClick={onToggle} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-hms-muted hover:bg-hms-hover">
          <ChevronsLeft className={clsx("size-4 transition-transform", collapsed && "rotate-180")} /> {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ item, active, collapsed }: { item: Item; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "group my-px flex h-[34px] items-center gap-3 rounded-[10px] px-2.5 text-[15px] transition-colors",
        active ? "bg-hms-red font-medium text-white shadow-[0_6px_16px_-6px_rgb(185_28_44/0.6)]" : "text-hms-ink hover:bg-hms-hover",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
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

function Header() {
  const path = usePathname();
  const crumbs = useCrumbs(path);
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hms-line bg-white px-4">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[15px]">
        {crumbs.map((c, i) => (
          <span key={c.label} className="flex min-w-0 items-center gap-2">
            {i > 0 && <span className="text-hms-muted">›</span>}
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="truncate text-hms-muted hover:text-hms-ink">{c.label}</Link>
            ) : (
              <span className="truncate font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <span className="ml-1 hidden rounded-full bg-hms-amber-soft px-2 py-0.5 text-[11px] font-semibold text-hms-amber lg:inline">Prototype · demo data</span>
      <div className="ml-auto flex items-center gap-1.5">
        <button aria-label="Compact view" className="grid size-9 place-items-center rounded-lg text-hms-muted hover:bg-hms-hover"><Minimize2 className="size-[17px]" /></button>
        <label className="hidden h-9 w-[210px] items-center gap-2 rounded-full bg-hms-hover px-3 text-[13px] text-hms-muted lg:flex">
          <Search className="size-4" />
          <input placeholder="Search rooms, guests" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-hms-muted" />
          <kbd className="font-sans text-[11px] font-semibold">⌘K</kbd>
        </label>
        <button className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-[14px] text-hms-ink hover:bg-hms-hover"><Languages className="size-[17px]" /> EN</button>
        <button aria-label="Dark mode" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><Moon className="size-[17px]" /></button>
        <button aria-label="Notifications" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><Bell className="size-[17px]" /></button>
        <button className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-hms-hover">
          <span className="grid size-8 place-items-center rounded-full bg-hms-coral-soft text-[12px] font-bold text-hms-red">MY</span>
          <span className="hidden text-[14px] font-semibold sm:inline">Md Yeapas</span>
          <ChevronDown className="size-4 text-hms-muted" />
        </button>
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
  if (path.startsWith("/hms/staff/")) {
    const seg = path.split("/")[3];
    const names: Record<string, string> = { people: "People", attendance: "Attendance", schedule: "Schedule", leave: "Leave", payroll: "Payroll & Benefits", hiring: "Hiring", operations: "Team Operations", settings: "Reports & Settings" };
    const sub = path.split("/")[4];
    return [{ label: "Staff", href: "/hms/staff" }, { label: names[seg] ?? "Overview", href: sub ? `/hms/staff/${seg}` : undefined }, ...(sub ? [{ label: decodeURIComponent(sub) }] : [])];
  }
  const item = ALL_ITEMS.find((i) => i.href === path);
  return [{ label: item?.label ?? "Dashboard" }];
}
