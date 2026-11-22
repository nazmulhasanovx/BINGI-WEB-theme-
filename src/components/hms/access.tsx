"use client";
// Plan × role access in the HMS shell: the hook, the page guard, the view-only strip and the Starter upgrade card.
// Rules: src/lib/access.ts. Prototype: the signed-in person is the Owner; "View the HMS as…" (Staff › Department views)
// switches to that department's role, so every role can be checked here.
import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Eye, ShieldOff, Sparkles } from "lucide-react";
import { can, type Feature } from "@/lib/plan";
import { moduleAccess, moduleOfPath, MODULE_FEATURE, PATH_FEATURE, planHas, seesLocks, type Access } from "@/lib/access";
import { useSettings } from "@/lib/settings/store";
import { MODULE, keeps, useViewAs } from "@/lib/hrm/views";
import { useProperty } from "./property";
import { PlanGate } from "./plan-gate";

export function useAccess() {
  const h = useProperty();
  const { st } = useSettings(h);
  const as = useViewAs();
  const roleId = as ? as.role : "owner";
  const keep = as ? keeps(as) : null;
  const level = (mod: string): Access => {
    const a = moduleAccess(h, st.roles, roleId, mod);
    return keep && mod !== "dashboard" && !keep.has(mod) ? "hidden" : a;
  };
  return { h, roleId, view: as, level, owner: roleId === "owner" };
}

const TEXT: Record<string, string> = {
  housekeeping: "Plan room cleaning, assign attendants and track room readiness after every check-out.",
  meals: "Take restaurant orders, run the kitchen screen and QR menus, and charge meals to the guest's room.",
  staff: "Staff records, attendance, schedules, leave and payroll in one place.",
  inventory: "Stock, purchases, receiving, transfers and recipes for the kitchen and the store.",
  "other-services": "Sell laundry, transport, tours and more, and add them to the guest's bill.",
  cashbox: "Open and close cash shifts, count the drawer and hand over between shifts.",
  operations: "Record bills and daily costs, approve big spends, pay suppliers and see what is left after costs.",
  communication: "Message templates, campaigns and a log of every SMS and email to guests.",
  roomBoard: "See every room and stay on one board and move stays by dragging.",
};

/** Plan-page titles match each module's own gate (Meals is "Restaurant & Bar" there). */
const TITLE: Record<string, string> = { meals: "Restaurant & Bar", operations: "Expenses", "other-services": "Other Services", communication: "Communication Center" };

/** Wraps every HMS page: a module outside the plan shows the plan page (Owner, Manager), outside the role shows "no access". */
export function AccessGuard({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { h, level, roleId } = useAccess();
  const mod = moduleOfPath(path);
  if (!mod) return <>{children}</>;
  const a = level(mod);
  const label = TITLE[mod] ?? MODULE.get(mod)?.label ?? "This page";
  if (!planHas(h, mod)) {
    const f = MODULE_FEATURE[mod] as Feature;
    return seesLocks(roleId) ? <PlanGate h={h} f={f} title={label} text={TEXT[mod] ?? ""} /> : <NoAccess what={label} />;
  }
  const sub = PATH_FEATURE.find(([p]) => path.startsWith(p));
  if (sub && !can(h, sub[1])) return seesLocks(roleId) ? <PlanGate h={h} f={sub[1]} title="Room board" text={TEXT[sub[1]] ?? ""} /> : <NoAccess what="Room board" />;
  if (a === "hidden") return <NoAccess what={label} />;
  return <>{children}</>;
}

export function NoAccess({ what }: { what: string }) {
  return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-[640px] p-6">
      <div role="alert" className="mt-10 rounded-2xl border border-hms-line bg-white p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hms-hover text-hms-muted"><ShieldOff className="size-7" aria-hidden /></span>
        <h1 className="mt-4 text-[22px] font-bold">You don&apos;t have access</h1>
        <p className="mx-auto mt-2 max-w-[420px] text-[14.5px] text-hms-muted">{what} is not part of your role. Ask the owner or manager if you need it.</p>
        <Link href="/hms" className="mt-5 inline-flex h-10 items-center rounded-lg border border-hms-line px-4 text-[14px] font-semibold hover:bg-hms-hover">Go to my home</Link>
      </div>
    </div></div>
  );
}

/** Thin strip above a page the role may only look at. */
export function ViewOnlyBanner() {
  const path = usePathname();
  const { level } = useAccess();
  const mod = moduleOfPath(path);
  if (!mod || mod === "dashboard" || level(mod) !== "view") return null;
  return (
    <div role="status" aria-label="View only" className="flex shrink-0 items-center gap-2 border-b border-hms-line bg-[#f4f6f8] px-4 py-1.5 text-[13px] text-[#4d5664] sm:px-6">
      <Eye className="size-4 shrink-0" aria-hidden />View only — your role can see this page but not change it.
    </div>
  );
}

/** Starter (Simple mode): one upgrade card in the sidebar, for the Owner only. */
export function UpgradeCard({ big }: { big?: boolean }) {
  const { h, owner } = useAccess();
  if (h.plan !== "starter" || !owner) return null;
  return (
    <div className={clsx("mx-2 mb-3 rounded-xl bg-gradient-to-br from-[#b11c29] to-[#7a1320] p-3.5 text-white", big && "mx-3")}>
      <p className="flex items-center gap-1.5 text-[14px] font-bold"><Sparkles className="size-4" aria-hidden />Need more tools?</p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-white/85">Housekeeping, restaurant, cashbox and lower booking fees.</p>
      <Link href="/hms/billing" className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-white text-[13px] font-semibold text-[#8e1621]">See Business<ArrowRight className="size-3.5" aria-hidden /></Link>
    </div>
  );
}
