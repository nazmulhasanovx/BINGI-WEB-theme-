// How each theme's site frame looks — so themes don't all share one header.
//   overlay  : transparent over a full-bleed home photo (desktop), solid once you scroll
//   centered : logo in the middle, menu split left/right (heritage, boutique)
//   minimal  : logo, Book now, menu button (design-led, city)
//   classic  : logo, menu, My Trip (small properties, practical)
import type { MasterTheme } from "@/lib/types";

export type HeaderStyle = "classic" | "overlay" | "centered" | "minimal";

const OVERLAY: MasterTheme[] = ["grand", "escape", "isle", "estate", "cottage", "canopy", "summit", "noir", "matir", "roots", "axis", "villa"];
const CENTERED: MasterTheme[] = ["maison", "zamindar", "courtyard", "shanti", "morning", "haven", "drift"];
const MINIMAL: MasterTheme[] = ["pod", "orbit", "aurel", "commons", "reside"];

export function headerStyle(m: MasterTheme): HeaderStyle {
  if (OVERLAY.includes(m)) return "overlay";
  if (CENTERED.includes(m)) return "centered";
  if (MINIMAL.includes(m)) return "minimal";
  return "classic";
}
/** The info line above the header only fits the practical themes. */
export const showTopBar = (m: MasterTheme) => headerStyle(m) === "classic";
