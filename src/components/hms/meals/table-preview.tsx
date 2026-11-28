"use client";
// Live table drawing (Remotion <Player> playing TableScene). It builds in when the table type or seats change;
// picking a seat does not replay — the finished frame just shows the new state. Reduced motion: no animation.
import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { TH, TW, TableScene, sceneFrames, type TableSceneProps } from "./table-scene";

function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { const m = window.matchMedia("(prefers-reduced-motion: reduce)"); const on = () => setR(m.matches); on(); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  return r;
}

export function TablePreview({ className, caption, ...props }: TableSceneProps & { className?: string; caption?: React.ReactNode }) {
  const reduced = useReducedMotion();
  const dur = sceneFrames(props.codes.length);
  // A new table type or seat count rebuilds the drawing from the start (fresh Player); picking a seat does not.
  const sig = `${props.kind}|${props.codes.join(",")}`;
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-[#e3e7ec] bg-[#f4f6f8]">
        <Player key={sig} component={TableScene} inputProps={props} durationInFrames={dur} fps={30} compositionWidth={TW} compositionHeight={TH}
          style={{ width: "100%", aspectRatio: `${TW} / ${TH}`, display: "block" }}
          controls={false} loop={false} moveToBeginningWhenEnded={false} initiallyMuted autoPlay={!reduced} initialFrame={reduced ? dur - 1 : 0}
          clickToPlay={false} doubleClickToFullscreen={false} spaceKeyToPlayOrPause={false} initiallyShowControls={false} acknowledgeRemotionLicense />
      </div>
      {caption && <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[12.5px] text-[#5b6270]">{caption}</figcaption>}
    </figure>
  );
}

/** Legend under a table drawing. */
export function SeatLegend({ picked }: { picked?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-[#3fa66b] bg-[#e8f6ee]" />Free</span>
      <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-[#d6453c] bg-[#f3d1ce]" />Taken</span>
      {picked && <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-[#0f1720]" />This order</span>}
    </span>
  );
}
