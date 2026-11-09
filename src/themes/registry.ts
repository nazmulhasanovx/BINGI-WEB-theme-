// Master themes: one Home layout per master; every other page is shared.
// Add a theme: create src/themes/<name>/Home.tsx, register it here, add a demo hotel.
import type { ComponentType } from "react";
import type { Hotel, MasterTheme } from "@/lib/types";
import { GrandHome } from "./grand/Home";
import { CityHome } from "./city/Home";

export const THEME_HOMES: Record<MasterTheme, ComponentType<{ hotel: Hotel }>> = {
  grand: GrandHome,
  city: CityHome,
  nest: CityHome, // NEST is next — uses CITY until built
};

export const MASTERS: { id: MasterTheme; name: string; plan: string; demo?: string }[] = [
  { id: "nest", name: "NEST", plan: "Starter" },
  { id: "city", name: "CITY", plan: "Business", demo: "sea-pearl" },
  { id: "grand", name: "GRAND", plan: "Ultra", demo: "azure-bay" },
];
