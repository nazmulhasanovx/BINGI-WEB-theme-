// Master themes: one Home layout per master; every other page is shared.
// Add a theme: create src/themes/<name>/Home.tsx, register it here, add a manifest entry (themes/manifest.ts),
// a demo property (src/data) and allow it in PLAN_RULES (lib/data.ts).
import type { ComponentType } from "react";
import type { Hotel, MasterTheme } from "@/lib/types";
import { GrandHome } from "./grand/Home";
import { CityHome } from "./city/Home";
import { NestHome } from "./nest/Home";
import { CottageHome } from "./cottage/Home";
import { VillaHome } from "./villa/Home";
import { FlatHome } from "./flat/Home";
import { EscapeHome } from "./escape/Home";
import { BunkHome } from "./bunk/Home";
import { DriftHome } from "./drift/Home";
import { CanopyHome } from "./canopy/Home";
import { PodHome } from "./pod/Home";
import { OrbitHome } from "./orbit/Home";

export const THEME_HOMES: Record<MasterTheme, ComponentType<{ hotel: Hotel }>> = {
  grand: GrandHome,
  city: CityHome,
  nest: NestHome,
  cottage: CottageHome,
  villa: VillaHome,
  flat: FlatHome,
  escape: EscapeHome,
  bunk: BunkHome,
  drift: DriftHome,
  canopy: CanopyHome,
  pod: PodHome,
  orbit: OrbitHome,
};

export const MASTERS: { id: MasterTheme; name: string; plan: string; demo?: string }[] = [
  { id: "nest", name: "NEST", plan: "Starter", demo: "tea-valley" },
  { id: "cottage", name: "COTTAGE", plan: "Starter", demo: "mistwood" },
  { id: "bunk", name: "BUNK", plan: "Starter", demo: "wave-bunk" },
  { id: "city", name: "CITY", plan: "Business", demo: "sea-pearl" },
  { id: "villa", name: "VILLA", plan: "Business", demo: "shalbon" },
  { id: "flat", name: "FLAT", plan: "Business", demo: "lakeview" },
  { id: "escape", name: "ESCAPE", plan: "Business", demo: "coral-cove" },
  { id: "grand", name: "GRAND", plan: "Ultra", demo: "azure-bay" },
];

/** Paid themes (Theme Store) with their demo properties. */
export const PAID_MASTERS: { id: MasterTheme; name: string; plan: string; demo?: string }[] = [
  { id: "drift", name: "DRIFT", plan: "Paid", demo: "haor-bilash" },
  { id: "canopy", name: "CANOPY", plan: "Paid", demo: "canopy-nest" },
  { id: "pod", name: "POD", plan: "Paid", demo: "skypod" },
  { id: "orbit", name: "ORBIT", plan: "Paid", demo: "altura" },
];
