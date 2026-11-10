// Theme-owned inner pages (Luxury Collection v2). A theme can replace Rooms and Room detail with its own layout
// and add its own pages (e.g. ISLE → /island). Booking logic stays shared; only the layout changes.
import type { ComponentType } from "react";
import type { Hotel, MasterTheme, RoomCategory } from "@/lib/types";
import { IsleIsland, IsleRoom, IsleRooms } from "./isle/Pages";

export const THEME_ROOMS: Partial<Record<MasterTheme, ComponentType<{ hotel: Hotel }>>> = { isle: IsleRooms };
export const THEME_ROOM: Partial<Record<MasterTheme, ComponentType<{ hotel: Hotel; room: RoomCategory }>>> = { isle: IsleRoom };
export const THEME_EXTRA: Partial<Record<MasterTheme, Record<string, { label: string; Page: ComponentType<{ hotel: Hotel }> }>>> = {
  isle: { island: { label: "The Island", Page: IsleIsland } },
};
