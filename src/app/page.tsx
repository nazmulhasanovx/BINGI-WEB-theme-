import Link from "next/link";
import Image from "next/image";
import { listHotelSlugs } from "@/lib/data";

export default function Index() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <Image src="/brand/bingi-logo.png" alt="BinGi" width={120} height={40} className="h-10 w-auto" priority />
      <p className="mt-6 text-sm font-semibold text-action">Web Themes · GRAND</p>
      <h1 className="mt-2 text-3xl font-bold">Theme preview</h1>
      <ul className="mt-8 space-y-3">
        {listHotelSlugs().map((s) => (
          <li key={s}>
            <Link className="block rounded-2xl border border-line bg-surface p-4 font-semibold shadow-card hover:border-brand-ring" href={`/hotel/${s}`}>
              /hotel/{s} <span className="font-normal text-muted">— demo hotel</span>
            </Link>
          </li>
        ))}
        <li>
          <Link className="block rounded-2xl border border-line bg-surface p-4 font-semibold shadow-card hover:border-brand-ring" href="/theme-lab">
            /theme-lab <span className="font-normal text-muted">— 10 colour themes + contrast check</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
