"use client";
// Role home (Modules, Plans & Roles v1): every role except Owner and Manager lands on its own home — its numbers,
// its quick actions and one list of today's work. Money numbers only show to roles that can see money.
// Cards come from the department view (Staff › Department views); every number is read from the live modules.
import Link from "next/link";
import clsx from "clsx";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { TODAY, useRooms } from "@/lib/rooms/store";
import { useHrm, TODAY as HRM_TODAY } from "@/lib/hrm/store";
import { useStays, useBookings } from "@/lib/bookings/store";
import { useGuestNames } from "@/lib/guests/store";
import { toCollect } from "@/lib/payments/ledger";
import { useExpenses } from "@/lib/expenses/store";
import { statusOf, useInventory } from "@/lib/inventory/store";
import { useHousekeeping } from "@/lib/housekeeping/store";
import { useCashbox } from "@/lib/cashbox/store";
import { ACTION, WIDGET, type DeptView } from "@/lib/hrm/views";
import { useRestaurant } from "./meals/shared";
import { useChatData } from "./chat/page";
import { useAccess } from "./access";

const bdt = (n: number) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
const HREF: Record<string, string> = {
  "new-booking": "/hms/bookings/new", "walk-in": "/hms/bookings/walkin", "check-in": "/hms/bookings", "take-payment": "/hms/payments?tab=collect",
  "start-cleaning": "/hms/housekeeping", "report-issue": "/hms/housekeeping", "new-order": "/hms/meals/pos", "stock-request": "/hms/inventory",
  "add-expense": "/hms/operations", "approve-leave": "/hms/staff/leave", "send-message": "/hms/chat", "close-day": "/hms/cashbox",
};
const OPEN_ORDER = new Set(["approval", "queued", "preparing", "ready"]);

export function RoleHome({ v }: { v: DeptView }) {
  const { h, level } = useAccess();
  const { st: rooms } = useRooms(h);
  const stays = useStays(h);
  const bk = useBookings(h);
  const gmap = useGuestNames(h);
  const names = useMemo(() => new Map([...gmap].map(([id, g]) => [id, g.name])), [gmap]);
  const refs = useMemo(() => stays.filter((s) => s.status !== "Checked out").map((s) => ({ code: s.code, guest: names.get(s.guestId) ?? "Guest" })), [stays, names]);
  const cb = useCashbox(h, refs);
  const hk = useHousekeeping(h);
  const { st: hrm } = useHrm();
  const inv = useInventory(h);
  const ex = useExpenses(h);
  const rest = useRestaurant();
  const chat = useChatData().chat;

  const units = rooms.units.filter((u) => u.status === "published");
  const arriving = stays.filter((b) => b.status === "Confirmed" && b.from === TODAY);
  const inHouse = stays.filter((b) => b.status !== "Checked out" && b.from <= TODAY && b.to > TODAY);
  const departing = stays.filter((b) => b.status === "Checked in" && b.to === TODAY);
  const tasks = hk.st.tasks.filter((t) => t.status !== "Done");
  const active = hrm.employees.filter((e) => e.status === "active");
  const att = hrm.attendance[HRM_TODAY] ?? {};
  const orders = rest.m.st.orders.filter((o) => o.at.startsWith(TODAY) && OPEN_ORDER.has(o.status));
  const low = inv.items.filter((i) => statusOf(i) !== "In stock");
  const toReceive = inv.st.pos.filter((p) => p.status === "approved" || p.status === "partial");
  const leaves = hrm.leaves.filter((l) => l.status === "pending");
  const collect = toCollect(bk.list, TODAY).filter((x) => x.rank <= 3);

  const val: Record<string, string> = {
    occupancy: units.length ? `${Math.round((inHouse.length / units.length) * 100)}%` : "0%",
    revenue: bdt(inHouse.reduce((s, b) => s + b.total / b.nights, 0)),
    cash: bdt(cb.t.now),
    arrivals: String(arriving.length), departures: String(departing.length), inhouse: String(inHouse.length),
    held: String(bk.list.filter((b) => b.status === "On hold").length),
    due: String(collect.length),
    "rooms-ready": `${units.filter((u) => hk.isReady(u.code)).length} / ${units.length}`,
    "my-rooms": String(tasks.length),
    inspection: String(tasks.filter((t) => t.status === "Review").length),
    maintenance: String(units.filter((u) => u.ooo).length),
    orders: String(orders.length),
    "low-stock": String(low.length), "to-receive": String(toReceive.length),
    expenses: String(ex.st.expenses.filter((e) => e.status === "pending").length),
    "on-duty": String(active.filter((e) => att[e.id]?.status === "present" || att[e.id]?.status === "half").length),
    absent: String(active.filter((e) => !att[e.id] || att[e.id].status === "absent").length),
    leave: String(leaves.length),
    chats: String(chat.unread),
  };
  const cards = v.widgets.filter((w) => WIDGET.has(w) && val[w] !== undefined && level(WIDGET.get(w)!.module) !== "hidden" && level(WIDGET.get(w)!.module) !== "locked");
  const actions = v.actions.filter((a) => ACTION.has(a) && level(ACTION.get(a)!.module) === "edit");

  // One list of today's work, by the view's home module.
  const list: { title: string; href: string; rows: [string, string][]; empty: string } = (() => {
    switch (v.home) {
      case "housekeeping": return { title: "Cleaning tasks", href: "/hms/housekeeping", empty: "No open cleaning tasks.", rows: tasks.slice(0, 6).map((t) => [`Room ${t.room} · ${t.kind}`, t.status === "Review" ? "Waiting for inspection" : t.status]) };
      case "meals": return { title: "Open orders", href: "/hms/meals/orders", empty: "No open orders.", rows: orders.slice(0, 6).map((o) => [`${o.no} · ${o.place ?? o.room ?? o.service}`, o.status === "approval" ? "Waiting approval" : o.status[0].toUpperCase() + o.status.slice(1)]) };
      case "finance": return { title: "To collect today", href: "/hms/payments?tab=collect", empty: "Nothing to collect today.", rows: collect.slice(0, 6).map((x) => [x.b.code, bdt(x.due)]) };
      case "inventory": return { title: "Low stock", href: "/hms/inventory", empty: "Everything is in stock.", rows: low.slice(0, 6).map((i) => [i.name, statusOf(i)]) };
      case "staff": return { title: "Leave requests", href: "/hms/staff/leave", empty: "No leave requests waiting.", rows: leaves.slice(0, 6).map((l) => [hrm.employees.find((e) => e.id === l.emp)?.name ?? l.emp, `${l.type} · ${l.days} day${l.days === 1 ? "" : "s"}`]) };
      default: return { title: "Arriving today", href: "/hms/bookings", empty: "No arrivals today.", rows: arriving.slice(0, 6).map((b) => [`${names.get(b.guestId) ?? "Guest"} · Room ${b.room}`, b.due > 0 ? `${bdt(b.due)} due` : "Paid"]) };
    }
  })();
  const hour = new Date().getHours();
  const day = new Date(`${TODAY}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).replace(",", "");

  return (
    <div className="h-full overflow-y-auto">
      <div className="hms-page space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-[-0.01em]">{hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}</h1>
            <p className="text-[14px] text-hms-muted">{v.name} · {day}</p>
          </div>
          {actions.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Quick actions">
            {actions.map((a, i) => <Link key={a} href={HREF[a] ?? "/hms"} className={clsx("inline-flex h-10 items-center rounded-lg px-4 text-[14px] font-semibold", i === 0 ? "btn-glow text-white" : "border border-hms-line bg-white hover:bg-hms-hover")}>{ACTION.get(a)!.label}</Link>)}
          </div>}
        </div>
        {cards.length > 0 && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Today">
          {cards.map((w) => (
            <div key={w} className="rounded-xl border border-hms-line bg-white p-4">
              <p className="text-[22px] font-bold leading-tight tabular-nums">{val[w]}</p>
              <p className="text-[13.5px] text-[#4d5664]">{WIDGET.get(w)!.label}</p>
            </div>
          ))}
        </div>}
        <section aria-labelledby="rh-list" className="rounded-xl border border-hms-line bg-white">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 id="rh-list" className="text-[18px] font-bold">{list.title}</h2>
            <Link href={list.href} className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-hms-red">Open<ArrowRight className="size-3.5" aria-hidden /></Link>
          </div>
          {list.rows.length ? <ul className="divide-y divide-hms-line border-t border-hms-line">
            {list.rows.map(([a, b], i) => <li key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-[14.5px]"><span className="min-w-0 truncate font-medium">{a}</span><span className="shrink-0 text-[13.5px] text-hms-muted">{b}</span></li>)}
          </ul> : <p className="px-5 pb-5 text-[14px] text-hms-muted">{list.empty}</p>}
        </section>
      </div>
    </div>
  );
}
