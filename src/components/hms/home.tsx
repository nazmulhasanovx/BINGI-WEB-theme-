"use client";
import { useSyncExternalStore } from "react";
import { useDraftFor } from "@/lib/onboarding/store";
import { ModulePlaceholder } from "./Placeholder";
import { useProperty } from "./property";
import { SetupDashboard } from "./setup-dashboard";

const noop = () => () => {};
/** Onboarding properties get the plan-aware setup dashboard; demo properties keep the placeholder (live HMS dashboard). */
export function HmsHomeSwitch() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const h = useProperty();
  const d = useDraftFor(h.slug);
  if (ready && d && d.status !== "draft") return <SetupDashboard d={d} />;
  return <ModulePlaceholder id="dashboard" />;
}
