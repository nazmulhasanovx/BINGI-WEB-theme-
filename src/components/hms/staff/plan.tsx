"use client";
// HR by plan (23 Nov 2026): Business gets Team (the easy staff list); Ultra gets the full HR.
// Same HRM data on both plans — moving to Ultra keeps every person as they are.
import type { ReactNode } from "react";
import { can } from "@/lib/plan";
import { useProperty } from "../property";
import { PlanGate } from "../plan-gate";
import { EasyTeam } from "./easy";

export const useFullHr = () => can(useProperty(), "hrm");

/** Full HR page on Ultra; on Business the Team list (`easy`) or the Ultra plan page. */
export function HrmGate({ children, easy }: { children: ReactNode; easy?: boolean }) {
  const h = useProperty();
  if (can(h, "hrm")) return <>{children}</>;
  if (easy) return <EasyTeam />;
  return <PlanGate h={h} f="hrm" title="Full HR" text="Attendance, schedules, leave, payroll, hiring and HR reports. Your team list stays in Team — moving up keeps everyone." />;
}
