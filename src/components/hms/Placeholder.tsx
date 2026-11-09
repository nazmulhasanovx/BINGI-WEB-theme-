"use client";
import Link from "next/link";
import { Globe, Hammer } from "lucide-react";
import { ALL_ITEMS } from "./Shell";

/** Modules not built in this repo yet. Truthful: no fake data, just where to go. */
export function ModulePlaceholder({ id }: { id: string }) {
  const item = ALL_ITEMS.find((i) => i.id === id);
  return (
    <div className="grid h-full place-items-center p-8">
      <div className="max-w-[440px] text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-hms-muted shadow-sm"><Hammer className="size-6" /></span>
        <h1 className="mt-4 text-[20px] font-semibold">{item?.label ?? "Module"}</h1>
        <p className="mt-2 text-[14px] text-hms-muted">This module runs in the live HMS. In this design repo only the shell is here — it can be designed inside the same frame next.</p>
        <Link href="/hms/website/overview" className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-hms-coral px-5 text-[14px] font-medium text-white"><Globe className="size-4" /> Open Website Management</Link>
      </div>
    </div>
  );
}
