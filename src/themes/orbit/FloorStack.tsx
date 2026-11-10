"use client";
// ORBIT floor stack (FX4): an isometric 3D stack drawn from the hotel's real room setup
// (HMS → Rooms: buildings, floors, published units). An illustration, not an architectural drawing.
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { formatMoney } from "@/lib/data";
import { useRooms } from "@/lib/rooms/store";
import { useFx } from "@/fx/fx";
import { T } from "@/lib/i18n";

const TONES = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f472b6", "#22d3ee"];

export function FloorStack({ hotel }: { hotel: Hotel }) {
  const { st } = useRooms(hotel);
  const fx = useFx();
  const floors = useMemo(() => {
    const c = st.config;
    return c.nodes
      .filter((n) => n.kind === "floor" && n.active)
      .map((f) => {
        const units = st.units.filter((u) => u.node === f.id && u.status === "published");
        const byCat = new Map<string, number>();
        units.forEach((u) => byCat.set(u.category, (byCat.get(u.category) ?? 0) + 1));
        const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => {
          const cat = st.categories.find((x) => x.id === id);
          const room = hotel.rooms.find((r) => `cat-${r.id}` === id);
          return { id, n, name: cat?.name ?? room?.name ?? "Rooms", price: cat?.baseRate ?? room?.fromPrice ?? 0, room };
        });
        return { id: f.id, level: f.level ?? 0, name: f.name, building: c.nodes.find((b) => b.id === f.parent)?.name ?? "", units: units.length, cats };
      })
      .filter((f) => f.units > 0)
      .sort((a, b) => a.level - b.level);
  }, [st, hotel.rooms]);
  const catTone = useMemo(() => { const ids = [...new Set(floors.flatMap((f) => f.cats.map((c) => c.id)))]; return (id: string) => TONES[ids.indexOf(id) % TONES.length]; }, [floors]);
  const [sel, setSel] = useState<string | null>(null);
  if (!floors.length) return null;
  const cur = floors.find((f) => f.id === sel) ?? floors[floors.length - 1];
  const moving = fx.level !== "calm";
  const gap = floors.length > 10 ? 22 : floors.length > 6 ? 32 : 42;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12">
      <div className="min-w-0">
        <div className="relative mx-auto h-[320px] w-full max-w-[560px] overflow-hidden md:h-[480px]" style={{ perspective: "1400px" }}>
          <div className={clsx("absolute left-1/2 top-[62%] size-0", moving && fx.level === "immersive" && "motion-safe:animate-[orbit-float_9s_ease-in-out_infinite]")}
            style={{ transformStyle: "preserve-3d", transform: "rotateX(58deg) rotateZ(-36deg)" }}>
            {floors.map((f, i) => {
              const tone = catTone(f.cats[0].id);
              const active = f.id === cur.id;
              const style: CSSProperties = {
                width: "min(300px, 56vw)", height: "min(210px, 40vw)", left: "calc(min(300px, 56vw) / -2)", top: "calc(min(210px, 40vw) / -2)",
                transform: `translateZ(${i * gap + (active ? 18 : 0)}px)`,
                background: active ? `linear-gradient(135deg, ${tone}, ${tone}cc)` : `linear-gradient(135deg, ${tone}55, ${tone}33)`,
                boxShadow: active ? `0 0 0 2px #fff, 0 20px 40px -10px ${tone}` : `0 0 0 1px ${tone}88`,
                transition: moving ? "transform .5s cubic-bezier(.2,.8,.2,1), background .4s, box-shadow .4s" : undefined,
              };
              return (
                <button key={f.id} type="button" onClick={() => setSel(f.id)} onPointerEnter={() => setSel(f.id)} aria-label={`${f.name}: ${f.units} rooms`} aria-pressed={active}
                  className="absolute rounded-[14px] backdrop-blur-[2px]" style={style}>
                  <span className={clsx("absolute bottom-2 left-3 text-[13px] font-bold", active ? "text-white" : "text-white/80")}>{f.level === 0 ? "G" : f.level}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] text-muted"><Sparkles className="size-3.5" aria-hidden /> <T>Illustration from the hotel&apos;s room setup — not a floor plan.</T></p>
      </div>

      <div className="min-w-0">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0" role="group" aria-label="Floors">
          {[...floors].reverse().map((f) => (
            <button key={f.id} type="button" onClick={() => setSel(f.id)} aria-pressed={f.id === cur.id}
              className={clsx("shrink-0 rounded-full border px-3.5 py-1.5 text-[14px] font-medium transition-colors", f.id === cur.id ? "border-ink bg-ink text-surface" : "border-line bg-surface hover:border-ink/40")}>
              {f.name}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="mt-4 rounded-[24px] border border-line bg-surface p-5 shadow-card md:p-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-action">{cur.building}</p>
          <h3 className="mt-1 text-[26px] font-bold tracking-[-0.02em]">{cur.name} <span className="font-normal text-muted">· {cur.units} <T>rooms</T></span></h3>
          <ul className="mt-4 space-y-3">
            {cur.cats.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-[16px] bg-canvas p-2.5">
                <span className="relative size-16 shrink-0 overflow-hidden rounded-[12px] bg-line">{c.room?.photos[0] && <Image src={c.room.photos[0]} alt="" fill sizes="64px" className="object-cover" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15.5px] font-semibold"><span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: catTone(c.id) }} /><span className="truncate">{c.name}</span></p>
                  <p className="text-[13.5px] text-muted">{c.n} <T>on this floor</T>{c.room?.view ? ` · ${c.room.view} view` : ""}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-bold tabular-nums">{formatMoney(c.price)}</p>
                  {c.room && <Link href={`/hotel/${hotel.slug}/rooms/${c.room.slug}`} className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-action"><T>View</T> <ArrowRight className="size-3.5" /></Link>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12.5px] text-muted"><T>You book a room type. The exact room number is given at check-in.</T></p>
        </div>
      </div>
    </div>
  );
}
