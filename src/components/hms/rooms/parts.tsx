"use client";
// Rooms / Accommodations — shared frame and pieces. Visual language follows the HRM module (same kit).
import { FocusButton, FocusView } from "../focus";
import Link from "next/link";
import clsx from "clsx";
import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BedDouble, Box, Building2, Castle, Check, House, Mountain, Plus, Search, Sailboat, Sparkles, Tent, TreePine, Trees, Warehouse, Home,
  Snowflake, Tv, Wifi, Flame, Bath, Shirt, Refrigerator, Fence, Waves, Coffee,
} from "lucide-react";
import { useProperty } from "../property";
import { useRooms } from "@/lib/rooms/store";
import { AMENITIES, CORE, type CoreType, type PresetSlug } from "@/lib/rooms/catalog";
import { Btn, Menu, Toast } from "../staff/ui";

export const PRESET_ICON: Record<PresetSlug, typeof BedDouble> = {
  room: BedDouble, cottage: House, villa: Castle, apartment: Building2,
  bungalow: Warehouse, cabin: Trees, chalet: Mountain, treehouse: TreePine, glamping: Tent, houseboat: Sailboat, capsule: Box, "holiday-home": Home, custom: Sparkles,
};
export const CORE_ICON: Record<CoreType, typeof BedDouble> = { ROOM: BedDouble, COTTAGE: House, VILLA: Castle, APARTMENT: Building2, OTHER: Sparkles };

/** Backend label policy: "Rooms" only when Room is the sole enabled AND represented type; "Accommodations" when any
 *  non-Room type is enabled or any non-Room category/unit exists (even after its type is disabled), and before setup. */
export function useTitle() {
  const h = useProperty();
  const { st } = useRooms(h);
  const en = st.config.enabled;
  const nonRoomData = st.categories.some((c) => c.core !== "ROOM") || st.units.some((u) => u.core !== "ROOM");
  // Sidebar names (23 Nov 2026, founder): "Rooms" for room-only properties, "Accommodations" once cottages, villas,
  // apartments or other kinds are enabled or exist.
  const nonRoomOn = en.some((k) => k !== "ROOM");
  return !st.config.configured || nonRoomOn || nonRoomData ? "Accommodations" : "Rooms";
}

let toastText: string | null = null;
const subs = new Set<() => void>();
const showToast = (t: string | null) => { toastText = t; subs.forEach((f) => f()); };
export const useToast = () => showToast as (t: string) => void;

/** Where the Rooms screens live: HMS (/hms/rooms) or onboarding (/onboarding/rooms). */
const BaseCtx = createContext("/hms/rooms");
export const RoomsBase = BaseCtx.Provider;
export const useRoomsBase = () => useContext(BaseCtx);

export type RoomsTab = "types" | "units" | "setup";
const TABS: { id: RoomsTab; label: string; href: string }[] = [
  { id: "types", label: "Room types", href: "/hms/rooms" },
  { id: "units", label: "Room numbers", href: "/hms/rooms/numbers" },
  { id: "setup", label: "Setup", href: "/hms/rooms/configuration" },
];

export function RoomsFrame({ tab, children }: { tab: RoomsTab; children: ReactNode }) {
  const h = useProperty();
  const { st, reset, startFresh } = useRooms(h);
  const title = useTitle();
  const toast = useSyncExternalStore((f) => (subs.add(f), () => void subs.delete(f)), () => toastText, () => null);
  return (
    <>
      <FocusView id="rooms" title="Accommodations">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="focus-hide min-w-0">
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.01em]">{title}</h1>
              <p className="mt-0.5 text-[15.5px] text-[#4d5664]">Manage your rooms, prices and availability · {h.name}</p>
            </div>
            <div className="flex items-center gap-2.5">
              {st.config.configured && <FocusButton id="rooms" label="Accommodations" className="h-11 rounded-xl" />}
              {st.config.configured && <Link href="/hms/rooms/new" className="inline-flex h-11 items-center gap-2 rounded-xl btn-glow px-5 text-[14.5px] font-semibold text-white"><Plus className="size-[18px]" /> Add room type</Link>}
              <Menu label="More actions" items={[
                { label: "Reset demo data", onClick: () => { reset(); showToast("Demo data reset"); } },
                { label: "Start setup from scratch (demo)", onClick: () => { startFresh(); showToast("Setup cleared — start again"); }, danger: true },
              ]} />
            </div>
          </div>
          {st.config.configured && (
            <nav className="no-scrollbar mt-4 flex items-center gap-1 overflow-x-auto border-b border-hms-line" aria-label={title}>
              {TABS.map((t) => (
                <Link key={t.id} href={t.href} aria-current={tab === t.id ? "page" : undefined} className={clsx("shrink-0 -mb-px border-b-2 px-3 pb-2.5 pt-1 text-[14.5px] font-semibold transition-colors", tab === t.id ? "border-[#c8232e] text-[#c8232e]" : "border-transparent text-hms-muted hover:text-hms-ink")}>{t.label}</Link>
              ))}
            </nav>
          )}
          <div key={tab} className="hms-page-in mt-4">{st.config.configured ? children : <SetupIntro />}</div>
      </FocusView>
      {toast && <Toast key={toast} text={toast} onDone={() => showToast(null)} />}
    </>
  );
}

function SetupIntro() {
  return (
    <div className="mx-auto mt-6 max-w-[640px] rounded-2xl border border-[#e3e7ec] bg-white p-6 text-center sm:p-8">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#ffe7e4] text-[#b11c29]"><Building2 className="size-6" /></span>
      <h2 className="mt-4 text-[22px] font-semibold">Set up your accommodation once</h2>
      <p className="mx-auto mt-2 max-w-[460px] text-[15px] text-[#4d5664]">Most of it is filled in from your property type. Room numbers are made for you from floors and zones.</p>
      <ol className="mx-auto mt-5 grid max-w-[420px] gap-2 text-left text-[14.5px]">
        {["Check what you rent (set from your property type)", "Floors / levels or zones / blocks — on one page", "Then add each room type on one page"].map((s, i) => (
          <li key={s} className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e9edf2] text-[13px] font-semibold">{i + 1}</span>{s}</li>
        ))}
      </ol>
      <Link href={`${useRoomsBase()}/setup`} className="mt-6 inline-flex h-11 items-center rounded-xl btn-glow px-5 text-[15px] font-semibold text-white">Start setup</Link>
    </div>
  );
}

/** Full-page step layout: stepper on top, sticky footer with Back left and actions right. */
export function Steps({ title, steps, step, onStep, children, footer, maxDone }: { title: string; steps: string[]; step: number; onStep: (i: number) => void; children: ReactNode; footer: ReactNode; maxDone: number }) {
  const base = useRoomsBase();
  return (
    <div className="flex h-full flex-col bg-[#f4f6f8]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1100px] px-4 pb-8 pt-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[24px] font-bold tracking-[-0.01em]">{title}</h1>
            <Link href={base} className="text-[14.5px] font-medium text-[#4d5664] hover:text-[#0f1720]">Cancel</Link>
          </div>
          <ol className="mt-4 hidden gap-2 lg:flex" aria-label="Steps">
            {steps.map((s, i) => {
              const can = i <= maxDone;
              return (
                <li key={s} className="min-w-0 flex-1">
                  <button disabled={!can} onClick={() => onStep(i)} aria-current={i === step ? "step" : undefined}
                    className={clsx("flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[14px] font-medium transition-colors", i === step ? "border-[#ef8f89] bg-[#ffe7e4] text-[#8e1621]" : can ? "border-[#e3e7ec] bg-white hover:bg-[#f4f6f8]" : "border-[#e3e7ec] bg-white text-[#80869a]")}>
                    <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full text-[12.5px]", i < step ? "bg-[#1c7d45] text-white" : i === step ? "bg-[#b11c29] text-white" : "bg-[#e9edf2] text-[#4d5664]")}>{i < step ? <Check className="size-3.5" /> : i + 1}</span>
                    <span className="truncate">{s}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[14px] font-medium text-[#4d5664] lg:hidden">Step {step + 1} of {steps.length} · <span className="text-[#0f1720]">{steps[step]}</span></p>
          <div className="mt-5">{children}</div>
        </div>
      </div>
      <div className="border-t border-[#e3e7ec] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2">{footer}</div>
      </div>
    </div>
  );
}

export function Section({ title, desc, children, right }: { title: string; desc?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e3e7ec] bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 text-[14px] text-[#4d5664]">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Choice card used for types (aria-pressed toggle or radio-like). */
export function ChoiceCard({ on, onClick, icon: Icon, title, sub, badge, disabled }: { on: boolean; onClick: () => void; icon: typeof BedDouble; title: string; sub?: string; badge?: string; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick}
      className={clsx("relative flex min-h-[76px] items-start sm:min-h-[92px] gap-3 rounded-2xl border p-3.5 text-left transition-[border,background,box-shadow] disabled:opacity-50", on ? "border-[#b11c29] bg-[#ffe7e4] shadow-[0_0_0_3px_rgb(216_55_46/0.12)]" : "border-[#e3e7ec] bg-white hover:border-[#858c97]")}>
      <span className={clsx("grid size-10 shrink-0 place-items-center rounded-xl", on ? "bg-[#b11c29] text-white" : "bg-[#e9edf2] text-[#4d5664]")}><Icon className="size-5" /></span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold">{title}</span>
        {sub && <span className="mt-0.5 block text-[13px] leading-snug text-[#4d5664]">{sub}</span>}
      </span>
      {badge && <span className="absolute right-2.5 top-2.5 rounded-md bg-[#e9edf2] px-1.5 py-0.5 text-[11.5px] font-medium text-[#4d5664]">{badge}</span>}
      {on && <span className="absolute bottom-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-[#b11c29] text-white"><Check className="size-3.5" /></span>}
    </button>
  );
}

/** Same as onboarding v8: the amenities most rooms have come first; the full library (search, groups, your own) opens on demand. */
const ROOM_TOP = ["Air conditioning", "Smart TV", "Free Wi-Fi", "Hot water", "Attached bathroom", "Toiletries", "Wardrobe", "Fridge", "Balcony", "Sea view", "Tea & coffee"];
const TOP_ICON: Record<string, typeof BedDouble> = {
  "Air conditioning": Snowflake, "Smart TV": Tv, "Free Wi-Fi": Wifi, "Hot water": Flame, "Attached bathroom": Bath, Toiletries: Sparkles, Wardrobe: Shirt, Fridge: Refrigerator, Balcony: Fence, "Sea view": Waves, "Tea & coffee": Coffee,
};
export function AmenityPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");
  const [all, setAll] = useState(() => value.some((v) => !ROOM_TOP.includes(v)));
  const groups = useMemo(() => {
    const extra = value.filter((v) => !AMENITIES.some((g) => g.items.includes(v)));
    const list = [...AMENITIES, ...(extra.length ? [{ group: "Your own", items: extra }] : [])];
    return list.map((g) => ({ ...g, items: g.items.filter((i) => !ROOM_TOP.includes(i) && i.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.items.length);
  }, [q, value]);
  const toggle = (a: string) => onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  const chip = (a: string, icon?: typeof BedDouble) => {
    const on = value.includes(a); const I = icon;
    return (
      <button key={a} type="button" aria-pressed={on} onClick={() => toggle(a)} className={clsx("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13.5px] transition-colors", on ? "border-[#0f1720] bg-[#0f1720] font-medium text-white" : "border-[#d3d8df] bg-white hover:border-[#9aa0ac]")}>
        {on ? <Check className="size-3.5" /> : I ? <I className="size-3.5 text-[#4d5664]" aria-hidden /> : null}{a}
      </button>
    );
  };
  return (
    <div className="rounded-xl border border-[#e3e7ec] bg-white p-3.5">
      <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-semibold text-[#4d5664]">Most rooms have</p><span className="text-[13px] font-medium text-[#4d5664]" aria-live="polite">{value.length} selected</span></div>
      <div className="mt-2 flex flex-wrap gap-2">{ROOM_TOP.map((a) => chip(a, TOP_ICON[a]))}</div>
      {!all ? (
        <button type="button" onClick={() => setAll(true)} className="mt-3 text-[14px] font-semibold text-[#b11c29]">+ All amenities</button>
      ) : (
        <div className="mt-4 border-t border-[#e3e7ec] pt-3">
          <label className="flex h-9 items-center gap-2 rounded-lg bg-[#e9edf2] px-2.5">
            <Search className="size-4 text-[#4d5664]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search amenities" aria-label="Search amenities" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
          </label>
          <div className="mt-3 max-h-[300px] space-y-3 overflow-y-auto">
            {groups.map((g) => (
              <div key={g.group} role="group" aria-label={g.group}>
                <p className="mb-1.5 text-[12.5px] font-semibold text-[#4d5664]">{g.group}</p>
                <div className="flex flex-wrap gap-1.5">{g.items.map((a) => chip(a))}</div>
              </div>
            ))}
            {!groups.length && <p className="text-[14px] text-[#4d5664]">No amenity matches “{q}”.</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own amenity" aria-label="Add your own amenity" className="h-9 min-w-0 flex-1 rounded-lg border border-[#d3d8df] px-2.5 text-[14px] outline-none focus:border-[#b11c29]" />
            <Btn type="button" className="h-9" disabled={!custom.trim()} onClick={() => { const c = custom.trim(); if (!value.includes(c)) onChange([...value, c]); setCustom(""); }}>Add</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export const coreLabel = (c: CoreType) => CORE[c].label;
export const money = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));

const noop = () => () => {};
/** Editors copy saved data into local state once; render them only after the browser store is read, so they never start from the server seed (that would trip the stale-version check or drop changes). */
export function Hydrated({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  return ready ? <>{children}</> : <div className="p-8 text-[14px] text-[#4d5664]" role="status">Loading…</div>;
}
