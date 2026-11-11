"use client";
// Bookings view mode, per browser: "easy" = front-desk essentials; "details" = every field, filter and the full bill.
// Same data either way — switching mode never changes or hides bookings.
import { useCallback, useSyncExternalStore } from "react";

export type BkMode = "easy" | "details";
const KEY = "bingi.bookings.mode";
const subs = new Set<() => void>();
const read = (): BkMode => { try { return localStorage.getItem(KEY) === "details" ? "details" : "easy"; } catch { return "easy"; } };

export function useBkMode() {
  const mode = useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, read, () => "easy" as BkMode);
  const setMode = useCallback((m: BkMode) => { try { localStorage.setItem(KEY, m); } catch {} subs.forEach((f) => f()); }, []);
  return { mode, setMode };
}
