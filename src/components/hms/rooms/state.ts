"use client";
// Tonight's state of each room (Available / Booked tonight / Out of order / Draft / Archived) — shared by Room types and Room numbers.
import { useMemo } from "react";
import { TODAY, type RoomsState } from "@/lib/rooms/store";
import { demoStays } from "@/lib/bookings/demo";
import { useProperty } from "../property";

export type UnitState = "available" | "booked" | "ooo" | "draft" | "archived";
export const STATE: Record<UnitState, { label: string; tone: "green" | "blue" | "amber" | "gray"; dot: string }> = {
  available: { label: "Available", tone: "green", dot: "bg-[#1c7d45]" },
  booked: { label: "Booked tonight", tone: "blue", dot: "bg-[#2457c5]" },
  ooo: { label: "Out of order", tone: "amber", dot: "bg-[#b26a00]" },
  draft: { label: "Draft", tone: "gray", dot: "bg-[#7b8190]" },
  archived: { label: "Archived", tone: "gray", dot: "bg-[#7b8190]" },
};

/** Tonight's state per unit. Bookings come from the same demo stays as Dashboard and Guests (no bookings backend yet). */
export function useUnitStates(st: RoomsState) {
  const h = useProperty();
  return useMemo(() => {
    const cat = new Map(st.categories.map((c) => [c.id, c]));
    const live = st.units.filter((u) => u.status === "published");
    const list = live.length ? live : st.units.filter((u) => u.status !== "archived");
    const stays = demoStays(h.slug, list.map((u) => ({ code: u.code, type: cat.get(u.category)?.name ?? "Room", rate: u.rate ?? cat.get(u.category)?.baseRate ?? 0 })));
    const tonight = new Set(stays.filter((s) => s.status !== "Checked out" && s.from <= TODAY && s.to > TODAY).map((s) => s.room));
    const m = new Map<string, UnitState>();
    for (const u of st.units) m.set(u.id, u.status !== "published" ? u.status : u.ooo ? "ooo" : tonight.has(u.code) ? "booked" : "available");
    return m;
  }, [st, h.slug]);
}

