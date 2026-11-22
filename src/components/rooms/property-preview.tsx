"use client";
// Live property drawing beside the property setup (onboarding 3.1 and HMS → Rooms → Setup).
// A Remotion <Player> plays the PropertyScene composition; when the answers change, it replays from the first piece
// that changed (a new floor, a renamed block, a new zone), so the owner sees exactly what they just did.
// Reduced motion: no replay — it jumps to the finished drawing.
import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Draft } from "@/lib/onboarding/store";
import { useL } from "@/lib/onboarding/store";
import { H, W, layoutScene, sceneLabel, sceneModel } from "@/lib/onboarding/scene";
import { PropertyScene } from "./property-scene";

const FPS = 30;

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

export function PropertyPreview({ d, className, lang }: { d: Draft; className?: string; /** Force a language (HMS screens are English). */ lang?: "bn" | "en" }) {
  const L = useL();
  const t = lang ? (bn: string, en: string) => (lang === "bn" ? bn : en) : L.t;
  const model = useMemo(() => sceneModel(d), [d]);
  const layout = useMemo(() => layoutScene(model), [model]);
  const ref = useRef<PlayerRef>(null);
  const prev = useRef<Map<string, number> | null>(null);
  const reduced = useReducedMotion();
  const sig = layout.order.map((o) => o.key).join("|");

  // Replay from the first new/changed piece (first mount: build from the start).
  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const end = layout.duration - 1;
    const before = prev.current;
    prev.current = new Map(layout.order.map((o) => [o.key, o.at]));
    if (reduced) { p.pause(); p.seekTo(end); return; }
    if (!before) return; // first view: the Player's autoPlay builds it from the start
    const changed = layout.order.find((o) => !before.has(o.key));
    if (!changed) { p.pause(); p.seekTo(end); return; }
    p.seekTo(Math.max(0, changed.at - 2));
    p.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, reduced]);

  const counts = [
    model.buildings.length ? `${model.buildings.length} ${t("বিল্ডিং", model.buildings.length === 1 ? "building" : "buildings")}` : "",
    model.buildings.length ? `${model.buildings.reduce((a, b) => a + b.top + (b.ground ? 1 : 0) + b.basements, 0)} ${t("তলা", "levels")}` : "",
    model.zones.length ? `${model.zones.length} ${d.place.zoneStyle === "block" ? t("ব্লক", model.zones.length === 1 ? "block" : "blocks") : t("জোন", model.zones.length === 1 ? "zone" : "zones")}` : "",
  ].filter(Boolean).join(" · ");

  return (
    <figure className={className} data-testid="property-drawing">
      <div className="overflow-hidden rounded-2xl border border-[#e3e7ec] bg-[#f4f8fc] shadow-[0_1px_2px_rgba(15,23,32,0.04)]" role="img" aria-label={sceneLabel(d, model)}>
        <Player
          ref={ref}
          component={PropertyScene}
          inputProps={{ layout }}
          durationInFrames={layout.duration}
          fps={FPS}
          compositionWidth={W}
          compositionHeight={H}
          style={{ width: "100%", aspectRatio: `${W} / ${H}`, display: "block" }}
          controls={false}
          loop={false}
          moveToBeginningWhenEnded={false}
          initiallyMuted
          autoPlay={!reduced}
          initialFrame={reduced ? layout.duration - 1 : 0}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          initiallyShowControls={false}
          acknowledgeRemotionLicense
        />
      </div>
      <figcaption className="mt-2 flex items-center justify-between gap-2 px-1 text-[13px] text-[#5b6270]">
        <span className="font-semibold text-[#3a414c]">{t("লাইভ ছবি", "Live drawing")}</span>
        <span className="tabular-nums">{counts}</span>
      </figcaption>
    </figure>
  );
}
