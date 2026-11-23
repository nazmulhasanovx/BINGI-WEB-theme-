// One rule for what a person sees in the HMS (Modules, Plans & Roles v1 — doc 22 Nov 2026):
//   Plan  → is the module in this property's plan?  Starter (Simple mode) HIDES what it lacks;
//           Business / Ultra show a higher plan's module with a LOCK, but only to the Owner and Manager.
//   Role  → none / view / edit per area (Settings › Users & roles). "none" hides the module. Staff never see locks.
//   Billing is Owner only (Accountant can view). Dashboard is everyone's (each role gets its own home).
// Sidebar, mobile tabs, search, the page guard and the dashboard all read this. The backend must check the same rule.
import { can, type Feature } from "./plan";
import type { Hotel } from "./types";
import type { Perm, Role } from "./settings/store";
import { MODULE } from "./hrm/views";

export type Access = "edit" | "view" | "locked" | "hidden";

/** Sidebar module → the plan feature it needs. Modules not listed are in every plan. */
export const MODULE_FEATURE: Partial<Record<string, Feature>> = {
  housekeeping: "housekeeping", meals: "restaurant", staff: "team", inventory: "inventory", "other-services": "services",
  cashbox: "cashbox", operations: "expenses", communication: "communication",
};
/** Sub-pages that need more than their module (Room board needs Business). */
export const PATH_FEATURE: [string, Feature][] = [["/hms/bookings/board", "roomBoard"]];

export const planHas = (h: Pick<Hotel, "plan">, mod: string) => { const f = MODULE_FEATURE[mod]; return !f || can(h, f); };
/** Owner and Manager may see what a higher plan adds (as a lock). */
export const seesLocks = (roleId: string) => roleId === "owner" || roleId === "manager";

export function moduleAccess(h: Pick<Hotel, "plan">, roles: Role[], roleId: string, mod: string): Access {
  if (!planHas(h, mod)) return h.plan !== "starter" && seesLocks(roleId) ? "locked" : "hidden";
  if (mod === "dashboard") return "edit";
  const r = roles.find((x) => x.id === roleId);
  if (!r) return "hidden";
  if (r.locked) return "edit";
  if (mod === "billing") return r.id === "accountant" ? "view" : "hidden";
  const a = MODULE.get(mod)?.area;
  const p: Perm = a ? r.perms[a] ?? "none" : "view";
  return p === "none" ? "hidden" : p;
}

/** Which sidebar module a path belongs to ("" = outside the sidebar, e.g. BinGi news). */
export function moduleOfPath(path: string): string {
  if (path === "/hms" || path === "/hms/") return "dashboard";
  if (path.startsWith("/hms/news") || path.startsWith("/hms/design-system") || path.startsWith("/hms/settings/preferences")) return "";
  if (path.startsWith("/hms/guest-reviews")) return "guests";
  const m = [...MODULE.values()].filter((x) => x.id !== "dashboard").sort((a, b) => b.href.length - a.href.length)
    .find((x) => path.startsWith(x.href.replace("/overview", "")));
  return m?.id ?? "";
}
