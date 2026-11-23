"use client";
// HMS Rooms — the same one-page setup and one-page "add room type" as onboarding v8 (21 Nov 2026).
// Runs on the HMS copy of the setup answers (useHmsSetup); saving merges onto the saved setup so existing rooms keep their place.
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { SetupCtx, type SetupHost } from "@/lib/onboarding/store";
import { mergeSetup, useHmsSetup } from "@/lib/rooms/hms-setup";
import { useRooms } from "@/lib/rooms/store";
import { useSettings } from "@/lib/settings/store";
import type { CoreType } from "@/lib/rooms/catalog";
import { AddRooms, Place } from "@/components/onboarding/rooms-v8";
import { FormSlot } from "@/components/onboarding/rooms-easy";
import { PropertyPreview } from "@/components/rooms/property-preview";
import { useProperty } from "../property";
import { Btn } from "../staff/ui";
import { Hydrated, useToast } from "./parts";
import { AddPage } from "./wizard";

function Frame({ title, sub, children, footer, bare, wide }: { title: string; sub: string; children: ReactNode; footer: ReactNode; bare?: boolean; wide?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-[#f4f6f8]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto ${wide ? "max-w-[1240px]" : "max-w-[920px]"} px-4 pb-10 pt-5 sm:px-6`}>
          {!bare && <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-[24px] font-bold tracking-[-0.01em]">{title}</h1><p className="mt-0.5 text-[15px] text-[#4d5664]">{sub}</p></div>
            <Link href="/hms/rooms" className="text-[14.5px] font-medium text-[#4d5664] hover:text-[#0f1720]">Cancel</Link>
          </div>}
          <div className={bare ? "" : "mt-5"}>{children}</div>
        </div>
      </div>
      <div className="border-t border-[#e3e7ec] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className={`mx-auto flex ${wide ? "max-w-[1240px]" : "max-w-[920px]"} flex-wrap items-center gap-2`}>{footer}</div>
      </div>
    </div>
  );
}

function useHost(edit: SetupHost["edit"]): SetupHost {
  return useMemo(() => ({ edit, lang: "en", where: "hms", unitStatus: (ok: boolean) => (ok ? "published" : "draft") }), [edit]);
}

// ---------- Setup (where the rooms are) ----------
export function SetupV8Page() {
  const h = useProperty();
  return <Hydrated><SetupInner key={h.slug} /></Hydrated>;
}
function SetupInner() {
  const h = useProperty();
  const router = useRouter();
  const toast = useToast();
  const { st, update } = useRooms(h);
  const { st: s } = useSettings(h);
  const { d, edit } = useHmsSetup(h, st, s.tax);
  const host = useHost(edit);
  const [loaded] = useState(st.config.version);
  const [stale, setStale] = useState(false);
  const save = () => {
    if (!d.stay.length) return toast("Choose at least one kind");
    if (st.config.version !== loaded) { setStale(true); return; }
    const first = !st.config.configured;
    const used = new Set(st.units.filter((u) => u.status !== "archived").map((u) => u.node));
    update((x) => { x.config = mergeSetup(d, x.config, used); }, first ? "Accommodation setup saved" : `Accommodation setup updated (version ${st.config.version + 1})`);
    toast(first ? "Setup saved — now add your rooms" : "Setup updated");
    router.push(first ? "/hms/rooms/new" : "/hms/rooms/configuration");
  };
  return (
    <SetupCtx.Provider value={host}>
      <Frame wide title={st.config.configured ? "Edit where your rooms are" : "Where are your rooms?"} sub="The same setup as onboarding — the drawing follows every change."
        footer={<><Link href="/hms/rooms" className="h-10 px-2 text-[14.5px] font-medium leading-10 text-[#4d5664] hover:text-[#0f1720]">Back</Link><span className="ml-auto" /><Btn kind="primary" onClick={save}>Save setup</Btn></>}>
        {stale && (
          <div role="alert" className="mb-4 rounded-xl border border-[#f3c4c0] bg-[#ffe7e4] px-4 py-3 text-[14.5px] text-[#a3261f]">Someone else saved the setup while you were editing (now version {st.config.version}). Nothing was saved — reload the page and make your change again.</div>
        )}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
          <div className="min-w-0">
            <PropertyPreview d={d} lang="en" className="mx-auto mb-5 max-w-[440px] lg:hidden" />
            <Place d={d} st={st} head={false} drawing={false} />
            <p className="mt-4 text-[13px] text-[#4d5664]">Rooms you already added keep their numbers and places. A floor, zone or kind that has rooms can&apos;t be removed.</p>
          </div>
          <aside className="hidden lg:block"><div className="sticky top-4"><PropertyPreview d={d} lang="en" /></div></aside>
        </div>
      </Frame>
    </SetupCtx.Provider>
  );
}

// ---------- Add / edit a room type (one page) ----------
export function AddV8Page() {
  const q = useSearchParams();
  const h = useProperty();
  if (q.get("draft")) return <AddPage />; // continue a draft started in the older wizard
  return <Hydrated><AddInner key={`${h.slug}|${q.get("type")}|${q.get("category")}`} type={q.get("type")} category={q.get("category")} /></Hydrated>;
}
const CORES: CoreType[] = ["ROOM", "COTTAGE", "VILLA", "APARTMENT", "OTHER"];
function AddInner({ type, category }: { type: string | null; category: string | null }) {
  const h = useProperty();
  const router = useRouter();
  const rooms = useRooms(h);
  const { st: s } = useSettings(h);
  const { d, edit } = useHmsSetup(h, rooms.st, s.tax);
  const host = useHost(edit);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false); // the room-type form is a panel now: the page frame stays as it is
  const core = type && CORES.includes(type.toUpperCase() as CoreType) ? (type.toUpperCase() as CoreType) : undefined;
  const cat = category ? rooms.st.categories.find((c) => c.id === category) : undefined;
  if (!rooms.st.config.configured) return (
    <Frame title="Add room type" sub="First tell BinGi where your rooms are." footer={<Link href="/hms/rooms/setup" className="ml-auto inline-flex h-10 items-center rounded-xl btn-glow px-4 text-[14.5px] font-semibold text-white">Start setup</Link>}>
      <p className="text-[15px] text-[#4d5664]">Floors, zones and blocks are set once. Then each room type is one page.</p>
    </Frame>
  );
  return (
    <SetupCtx.Provider value={host}>
      <FormSlot.Provider value={{ slot, setOpen }}>
        <Frame bare={open} title={cat ? `Edit ${cat.name}` : "Add room type"} sub="Price, room numbers, photos, amenities and meals — on one page."
          footer={<><div ref={setSlot} hidden={!open} className="w-full" />{!open && <><Link href="/hms/rooms" className="ml-auto inline-flex h-10 items-center rounded-xl btn-glow px-4 text-[14.5px] font-semibold text-white">Done</Link></>}</>}>
          <AddRooms d={d} rooms={rooms} onForm={setOpen} head={false} start={cat ? { cat: cat.id } : core ? { core } : undefined}
            onClose={cat || core ? () => router.push("/hms/rooms") : undefined} />
          <p className="mt-4 text-[13px] text-[#4d5664]">{/* truth label */}New room types wait for BinGi approval. Until then their rooms are saved as drafts (not bookable); after approval new rooms are published straight away.</p>
        </Frame>
      </FormSlot.Provider>
    </SetupCtx.Provider>
  );
}
