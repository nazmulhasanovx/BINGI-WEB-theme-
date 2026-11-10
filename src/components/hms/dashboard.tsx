"use client";
// HMS Dashboard (operating property). Layout from Nazmul's reference (10 Nov 2026):
// greeting → 4 KPIs → Today's priorities + Website & booking → Arriving today + plan card.
// Data: rooms come from the Rooms store, staff from the HRM store, website from Website Management.
// Bookings, QR orders and stock are DEMO fixtures built from this property's own rooms
// (no bookings backend in the prototype) — the header already shows "Prototype · demo data".
import Link from "next/link";
import clsx from "clsx";
import { useMemo } from "react";
import {
  ArrowRight, BedDouble, ChevronRight, Boxes, CalendarCheck, ChefHat, ClipboardCheck, Monitor, Plus, QrCode, Sparkles, UserRoundCheck, UsersRound, Wallet, Brush,
} from "lucide-react";
import type { Hotel } from "@/lib/types";
import { useRooms, TODAY } from "@/lib/rooms/store";
import { useHrm, TODAY as HRM_TODAY } from "@/lib/hrm/store";
import { useSite } from "@/lib/site";
import { PLANS } from "@/lib/onboarding/store";
import { useProperty } from "./property";
import { statusOf, useInventory } from "@/lib/inventory/store";
import { DEMO_GUESTS, demoStays, type BookingStatus } from "@/lib/bookings/demo";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const short = (iso: string) => `${iso.slice(8, 10)} ${MON[Number(iso.slice(5, 7)) - 1]}`;
/** "10–12 Nov" in one month, "30 Nov – 02 Dec" across months. */
const stay = (a: string, b: string) => (a.slice(0, 7) === b.slice(0, 7) ? `${a.slice(8, 10)}–${short(b)}` : `${short(a)} – ${short(b)}`);
const bdt = (n: number) => `BDT ${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;

export function Dashboard() {
  const h = useProperty();
  const { st } = useRooms(h);
  const { st: hrm } = useHrm();
  const site = useSite(h);
  const inv = useInventory(h);
  const lowStock = inv.items.filter((i) => statusOf(i) !== "In stock").length;

  const rooms = useMemo(() => {
    const cat = new Map(st.categories.map((c) => [c.id, c]));
    const live = st.units.filter((u) => u.status === "published");
    const list = (live.length ? live : st.units.filter((u) => u.status !== "archived"));
    return list.map((u) => ({ code: u.code, type: cat.get(u.category)?.name ?? "Room", rate: u.rate ?? cat.get(u.category)?.baseRate ?? 0 }));
  }, [st]);
  const bookings = useMemo(() => demoStays(h.slug, rooms), [h.slug, rooms]);
  const names = useMemo(() => new Map(DEMO_GUESTS.map((g) => [g.id, g.name])), []);

  const arriving = bookings.filter((b) => b.status === "Confirmed" && b.from === TODAY);
  const inHouse = bookings.filter((b) => b.status !== "Checked out" && b.from <= TODAY && b.to > TODAY);
  const departing = bookings.filter((b) => b.status === "Checked in" && b.to === TODAY);
  const occupancy = rooms.length ? Math.round((inHouse.length / rooms.length) * 100) : 0;
  const available = rooms.length - inHouse.length;
  const revenue = inHouse.reduce((s, b) => s + b.total / b.nights, 0);

  const plan = h.plan;
  const hasRestaurant = plan !== "starter";
  const hasHrm = plan === "ultra" || plan === "enterprise";
  const active = hrm.employees.filter((e) => e.status === "active");
  const att = hrm.attendance[HRM_TODAY] ?? {};
  const onDuty = active.filter((e) => att[e.id]?.status === "present" || att[e.id]?.status === "half").length;
  const attIssues = active.filter((e) => !att[e.id] || att[e.id].status === "absent").length;

  const hk = plan !== "starter"; // Housekeeping is a Business+ tool (pricing page)
  const priorities = [
    { icon: Brush, text: departing.length ? `${departing.length} room${departing.length === 1 ? "" : "s"} need cleaning` : "No rooms to clean yet", href: "/hms/housekeeping", show: hk },
    { icon: CalendarCheck, text: departing.length ? `${departing.length} guest${departing.length === 1 ? "" : "s"} checking out` : "No check-outs today", href: "/hms/bookings", show: !hk },
    { icon: QrCode, text: "2 QR orders waiting", href: "/hms/meals", show: hasRestaurant },
    { icon: UserRoundCheck, text: `${attIssues} attendance exception${attIssues === 1 ? "" : "s"}`, href: "/hms/staff/attendance", show: hasHrm },
    { icon: Wallet, text: `${arriving.filter((b) => b.due > 0).length} arrivals with payment due`, href: "/hms/bookings", show: true },
  ].filter((p) => p.show).slice(0, 3);

  const hour = new Date().getHours();
  const day = new Date(`${TODAY}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).replace(",", "");
  const kpis = [
    { label: "Arriving today", value: String(arriving.length), icon: CalendarCheck, card: "bg-[#fdefe7]", ink: "text-[#d9622b]" },
    { label: "Occupancy", value: `${occupancy}%`, sub: `${inHouse.length} of ${rooms.length} rooms`, icon: BedDouble, card: "bg-[#eeebfc]", ink: "text-[#6b55e0]" },
    { label: "Available rooms", value: String(available), icon: BedDouble, card: "bg-[#fdf3d9]", ink: "text-[#a76f00]" },
    { label: "Room revenue today", value: bdt(revenue), icon: Wallet, card: "bg-[#e5f5ec]", ink: "text-[#1c7d45]" },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1280px] space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.01em]">{hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}, Md Yeapas</h1>
            <p className="text-[14px] text-hms-muted">{day}</p>
          </div>
          <Link href="/hms/bookings" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-hms-red px-4 text-[14px] font-semibold text-white shadow-[0_6px_16px_-8px_rgb(185_28_44/0.7)] hover:bg-[#b11c29]"><Plus className="size-4" />New booking</Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className={clsx("flex items-center gap-4 rounded-xl p-4", k.card)}>
              <span className={clsx("grid size-12 shrink-0 place-items-center rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.05)]", k.ink)}><k.icon className="size-[22px]" strokeWidth={1.8} /></span>
              <div className="min-w-0">
                <p className="truncate text-[22px] font-bold leading-tight tabular-nums">{k.value}</p>
                <p className="text-[13.5px] text-[#4b5160]">{k.label}</p>
                {k.sub && <p className="text-[12.5px] text-[#4b5160]">{k.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <section aria-labelledby="pri" className="flex flex-col gap-4 rounded-xl border border-hms-line bg-white p-5 sm:flex-row sm:items-center">
            <span className="hidden size-[104px] shrink-0 place-items-center rounded-2xl bg-[#fdefe7] sm:grid"><span className="grid size-14 place-items-center rounded-xl bg-white text-[#1c7d45] shadow-sm"><ClipboardCheck className="size-7" strokeWidth={1.7} /></span></span>
            <div className="min-w-0 flex-1">
              <h2 id="pri" className="text-[18px] font-bold">Today&apos;s priorities</h2>
              <ul className="mt-2.5 space-y-2">
                {priorities.map((p) => (
                  <li key={p.text}><Link href={p.href} className="flex items-center gap-2.5 text-[14.5px] hover:text-hms-red"><p.icon className="size-[18px] shrink-0 text-hms-red" strokeWidth={1.8} />{p.text}</Link></li>
                ))}
              </ul>
            </div>
            <Link href={hk ? "/hms/housekeeping" : "/hms/bookings"} className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#1d1f24] px-6 text-[14px] font-semibold text-white hover:bg-black">Open tasks</Link>
          </section>
          <WebsiteCard h={h} published={!!site.rec.published} domain={site.rec.domain.status === "verified" || site.rec.domain.status === "live"} />
        </div>

        <div className="grid gap-4 min-[1360px]:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
          <section aria-labelledby="arr" className="min-w-0 rounded-xl border border-hms-line bg-white">
            <div className="flex items-center justify-between px-5 pb-2 pt-4">
              <h2 id="arr" className="text-[18px] font-bold">Arriving today ({arriving.length})</h2>
              <Link href="/hms/bookings" className="text-[13.5px] font-semibold text-hms-red">View all</Link>
            </div>
            {arriving.length ? (
              <div className="overflow-x-auto px-2 pb-3">
                <table className="w-full min-w-[540px] text-[14px]">
                  <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-2.5 py-2 font-medium">Guest</th><th className="px-2.5 py-2 font-medium">Room</th><th className="px-2.5 py-2 font-medium">Stay</th><th className="px-2.5 py-2 font-medium">Booking</th><th className="px-2.5 py-2 font-medium">Payment</th><th className="px-2.5 py-2 text-right font-medium"><span className="sr-only">Action</span></th></tr></thead>
                  <tbody>
                    {arriving.map((b) => { const guest = names.get(b.guestId) ?? "Guest"; return (
                      <tr key={b.code} className="border-t border-hms-line">
                        <td className="px-2.5 py-2.5"><span className="flex items-center gap-2.5"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-hms-coral-soft text-[11px] font-bold text-hms-red">{guest.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span><span className="block max-w-[130px] truncate font-semibold" title={guest}>{guest}</span></span></td>
                        <td className="px-2.5 py-2.5"><span className="font-medium tabular-nums">{b.room}</span><span className="block max-w-[100px] truncate text-[12px] text-hms-muted" title={b.type}>{b.type}</span></td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap tabular-nums">{stay(b.from, b.to)}</td>
                        <td className="px-2.5 py-2.5"><StatusChip s={b.status} /></td>
                        <td className="px-2.5 py-2.5 whitespace-nowrap tabular-nums">{b.due > 0 ? <span className="font-semibold text-hms-red">{bdt(b.due)} due</span> : <span className="text-[#16693a]">Paid</span>}</td>
                        <td className="px-2.5 py-2.5 text-right"><Link href="/hms/bookings" aria-label={`Open booking for ${guest}`} className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-hms-line pl-2.5 pr-1.5 text-[13px] font-medium hover:bg-hms-hover">Open<ChevronRight className="size-3.5" /></Link></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            ) : <p className="px-5 pb-5 text-[14px] text-hms-muted">No arrivals today. Add rooms and publish them to start taking bookings.</p>}
          </section>
          <PlanCard onDuty={onDuty} lowStock={lowStock} hasHrm={hasHrm} hasRestaurant={hasRestaurant} />
        </div>
      </div>
    </div>
  );
}

function StatusChip({ s }: { s: BookingStatus }) {
  const c = s === "Confirmed" ? "bg-[#e5f5ec] text-[#16693a]" : s === "Checked in" ? "bg-[#e8f0fe] text-[#1d4ed8]" : "bg-hms-hover text-[#4b5160]";
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12.5px] font-semibold", c)}>{s === "Confirmed" && "✓ "}{s}</span>;
}

function WebsiteCard({ h, published, domain }: { h: Hotel; published: boolean; domain: boolean }) {
  const fees = h.plan === "enterprise" ? null : PLANS[h.plan].fees;
  const cells: [string, string][] = fees ? [["Marketplace", `${fees[0]}%`], ["Web booking", `${fees[1]}%`], ["Walk-in", `${fees[2]}%`]] : [["Booking fees", "As quoted"]];
  return (
    <section aria-labelledby="web" className="rounded-xl border border-hms-line bg-white p-5">
      <h2 id="web" className="text-[18px] font-bold">Website & booking</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className={clsx("rounded-md px-2 py-0.5 text-[12.5px] font-semibold", published ? "bg-[#e5f5ec] text-[#16693a]" : "bg-[#fdf3d9] text-[#7a5200]")}>{published ? "✓ Published" : "Not published"}</span>
        <span className={clsx("rounded-md px-2 py-0.5 text-[12.5px] font-semibold", domain ? "bg-[#e5f5ec] text-[#16693a]" : "bg-hms-hover text-hms-muted")}>{domain ? "✓ Domain connected" : "Free BinGi address"}</span>
      </div>
      <p className="mt-3 text-[12px] font-medium text-hms-muted">Booking fees · {h.plan === "enterprise" ? "Custom" : PLANS[h.plan].label}</p>
      <dl className="mt-1 grid grid-cols-3 divide-x divide-hms-line">
        {cells.map(([k, v]) => <div key={k} className="px-2 first:pl-0"><dt className="truncate text-[12.5px] text-hms-muted">{k}</dt><dd className="text-[18px] font-bold tabular-nums">{v}</dd></div>)}
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-hms-line pt-3">
        <Link href="/hms/website/design" className="inline-flex items-center gap-1.5 text-[13.5px] text-[#4b5160] hover:text-hms-ink"><Monitor className="size-4" />All themes</Link>
        <Link href="/hms/website/overview" className="inline-flex h-9 items-center rounded-lg border border-hms-line px-3.5 text-[13.5px] font-semibold hover:bg-hms-hover">Manage website</Link>
      </div>
    </section>
  );
}

/** Third card by plan: Ultra = team & inventory · Business = restaurant today · Starter = upgrade. */
function PlanCard({ onDuty, lowStock, hasHrm, hasRestaurant }: { onDuty: number; lowStock: number; hasHrm: boolean; hasRestaurant: boolean }) {
  if (hasHrm) {
    const rows: [typeof UsersRound, string, string][] = [[UsersRound, "Staff on duty", String(onDuty)], [Boxes, "Low stock", `${lowStock} item${lowStock === 1 ? "" : "s"}`], [ChefHat, "Menu items", "48"]];
    return <Rows title="Team & inventory" rows={rows} cta="View operations" href="/hms/operations" />;
  }
  if (hasRestaurant) {
    const rows: [typeof UsersRound, string, string][] = [[QrCode, "QR orders waiting", "2"], [ChefHat, "Orders today", "14"], [Sparkles, "Menu items", "48"]];
    return <Rows title="Restaurant today" rows={rows} cta="Open meals" href="/hms/meals" />;
  }
  return (
    <section className="flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#c8232e] to-[#8f1520] p-5 text-white">
      <div><Sparkles className="size-6" /><h2 className="mt-3 text-[18px] font-bold">Need more tools?</h2><p className="mt-1 text-[14px] text-white/85">Business adds housekeeping, restaurant & QR ordering and expenses — and lower booking fees.</p></div>
      <Link href="/hms/billing" className="mt-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-[14px] font-semibold text-[#b11c29]">See Business <ArrowRight className="size-4" /></Link>
    </section>
  );
}

function Rows({ title, rows, cta, href }: { title: string; rows: [typeof UsersRound, string, string][]; cta: string; href: string }) {
  return (
    <section className="flex flex-col rounded-xl border border-hms-line bg-white p-5">
      <h2 className="text-[18px] font-bold">{title}</h2>
      <ul className="mt-2 flex-1 divide-y divide-hms-line">
        {rows.map(([I, k, v]) => (
          <li key={k} className="flex items-center gap-3 py-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-[#fdefe7] text-[#d9622b]"><I className="size-[18px]" strokeWidth={1.8} /></span>
            <span className="flex-1 text-[14.5px]">{k}</span>
            <span className="text-[18px] font-bold tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className="mt-3 inline-flex h-10 items-center justify-center rounded-lg border border-hms-line text-[14px] font-semibold hover:bg-hms-hover">{cta}</Link>
    </section>
  );
}

