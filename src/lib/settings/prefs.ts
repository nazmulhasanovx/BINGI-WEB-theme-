"use client";
// Personal preferences (this user, this browser): text size, motion and font. Sidebar style lives in the Shell (hms-sidebar-mode).
import { useCallback, useSyncExternalStore } from "react";

export type FontId = "bingi" | "apple" | "google" | "roboto" | "inter" | "jakarta" | "system";
export type Prefs = { zoom: 90 | 100 | 110 | 120; reduceMotion: boolean; font: FontId };
/** HMS fonts. Bangla always shows in Hind Siliguri. SF Pro can't be shipped to other systems, so "Apple" uses the device font on Apple devices. */
export const FONTS: { id: FontId; name: string; by: string; note: string; sample: string }[] = [
  { id: "bingi", name: "BinGi", by: "Instrument Sans + Bricolage Grotesque", note: "Default. Same as the design system.", sample: '"Instrument Sans Variable", "Hind Siliguri", sans-serif' },
  { id: "apple", name: "Apple (SF Pro)", by: "San Francisco — Apple's system font", note: "Shows on Mac, iPhone and iPad. Other devices show their own system font.", sample: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Hind Siliguri", sans-serif' },
  { id: "google", name: "Google Sans Flex", by: "Google Fonts · open licence (OFL)", note: "Google's product font, shipped with the HMS.", sample: '"Google Sans Flex Variable", "Hind Siliguri", sans-serif' },
  { id: "roboto", name: "Roboto", by: "Google Fonts · Android's font (OFL)", note: "Familiar to Android users.", sample: '"Roboto Variable", "Hind Siliguri", sans-serif' },
  { id: "inter", name: "Inter", by: "Open licence (OFL)", note: "Very clear at small sizes.", sample: '"Inter Variable", "Hind Siliguri", sans-serif' },
  { id: "jakarta", name: "Plus Jakarta Sans", by: "Earlier HMS font (OFL)", note: "The font the HMS used before.", sample: '"Plus Jakarta Sans Variable", "Hind Siliguri", sans-serif' },
  { id: "system", name: "Device default", by: "Your computer's own font", note: "Segoe UI on Windows, SF on Apple, Roboto on Android.", sample: 'system-ui, "Segoe UI", Roboto, "Hind Siliguri", sans-serif' },
];
const KEY = "bingi.hms.prefs";
const DEF: Prefs = { zoom: 100, reduceMotion: false, font: "bingi" };
const subs = new Set<() => void>();
let raw: string | null = null; let cached: Prefs = DEF;
const read = (): Prefs => { let r: string | null = null; try { r = localStorage.getItem(KEY); } catch {} if (r !== raw) { raw = r; try { cached = r ? { ...DEF, ...JSON.parse(r) } : DEF; } catch { cached = DEF; } } return cached; };
export function usePrefs() {
  const p = useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, read, () => DEF);
  const set = useCallback((patch: Partial<Prefs>) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch })); } catch {} subs.forEach((f) => f()); }, []);
  return [p, set] as const;
}
