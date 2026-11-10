// Theme-owned inner pages (Luxury Collection v2). A theme can replace Rooms and Room detail with its own layout
// and add its own pages (e.g. ISLE → /island). Booking logic stays shared; only the layout changes.
import type { ComponentType } from "react";
import type { Hotel, MasterTheme, RoomCategory } from "@/lib/types";
import { IsleIsland, IsleRoom, IsleRooms } from "./isle/Pages";
import { SigRooms } from "./sig/RoomsPage";
import { CourtyardStory } from "./sig/courtyard";
import { AxisMeet } from "./sig/axis";
import { ResideLongStay } from "./sig/reside";
import { MorningBreakfast } from "./sig/morning";
import { MatirFarm } from "./sig/matir";
import { SIG_IDS } from "./paid";

export const THEME_ROOMS: Partial<Record<MasterTheme, ComponentType<{ hotel: Hotel }>>> = { isle: IsleRooms, ...Object.fromEntries(SIG_IDS.map((id) => [id, SigRooms])) };
export const THEME_ROOM: Partial<Record<MasterTheme, ComponentType<{ hotel: Hotel; room: RoomCategory }>>> = { isle: IsleRoom };
export const THEME_EXTRA: Partial<Record<MasterTheme, Record<string, { label: string; Page: ComponentType<{ hotel: Hotel }> }>>> = {
  isle: { island: { label: "The Island", Page: IsleIsland } },
  courtyard: { story: { label: "Our Story", Page: CourtyardStory } },
  axis: { meet: { label: "Meet", Page: AxisMeet } },
  reside: { "long-stay": { label: "Long Stay", Page: ResideLongStay } },
  morning: { breakfast: { label: "Breakfast", Page: MorningBreakfast } },
  matir: { farm: { label: "Our Farm", Page: MatirFarm } },
};
