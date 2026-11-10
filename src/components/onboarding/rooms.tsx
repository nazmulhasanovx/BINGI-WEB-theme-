"use client";
// Part 2 runs the real HMS Rooms screens on the property being set up (same code, onboarding paths).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { ArrowLeft } from "lucide-react";
import { hotelOf, useOnboarding } from "@/lib/onboarding/store";
import { roomsConfigured as readRooms } from "@/lib/rooms/store";
import { PropertyOverride } from "../hms/property";
import { RoomsBase } from "../hms/rooms/parts";
import { SetupPage } from "../hms/rooms/setup";
import { AddPage } from "../hms/rooms/wizard";
import { Header } from "./shell";

const noop = () => () => {};

export function OnbRooms({ page }: { page: "setup" | "new" }) {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  return (
    <div className="flex h-dvh flex-col bg-[#fafafb]">
      <Header right={<Link href="/onboarding/flow" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium hover:bg-[#f6f7f9]"><ArrowLeft className="size-4" /> Back to setup</Link>} />
      <div className="min-h-0 flex-1">
        {!ready ? <p className="p-8 text-[14px] text-[#5b6170]" role="status">Loading…</p>
          : !draft ? <p className="p-8">No property selected. <Link href="/onboarding" className="font-medium text-[#c8232e]">Your properties</Link></p>
          : (
            <PropertyOverride hotel={hotelOf(draft)}>
              <RoomsBase value="/onboarding/rooms">{page === "setup" ? <SetupPage /> : <AddPage />}</RoomsBase>
            </PropertyOverride>
          )}
      </div>
    </div>
  );
}

/** The Rooms screens return to their "home" when done — in onboarding that is part 2. */
export function OnbRoomsHome() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  return ready && draft ? <Back configured={readRooms(hotelOf(draft))} /> : <p className="p-8 text-[14px] text-[#5b6170]" role="status">Returning to setup…</p>;
}
function Back({ configured }: { configured: boolean }) {
  const { edit } = useOnboarding();
  const router = useRouter();
  // Latest edit/router without making them effect deps (the SPA preview router is not referentially stable).
  const api = useRef({ edit, router });
  useEffect(() => { api.current = { edit, router }; });
  useEffect(() => {
    const to = configured ? "2.2" : "2.1";
    api.current.edit((x) => { x.step = to; for (const s of ["2.1", to] as const) if (!x.seen.includes(s)) x.seen.push(s); });
    api.current.router.replace("/onboarding/flow");
  }, [configured]);
  return <p className="p-8 text-[14px] text-[#5b6170]" role="status">Returning to setup…</p>;
}
