"use client";
// The live property drawing (Remotion composition). It draws only what layoutScene() returns:
// buildings floor by floor (ground with the entrance, basements below the ground line), and zones/blocks as plots
// with the chosen kind inside (cottage, villa, bungalow, cabin, treehouse, tent, houseboat, holiday home).
// Remotion rules followed: every animation is frame-driven (useCurrentFrame + spring/interpolate, no CSS transitions),
// and useCurrentFrame lives in the smallest pieces (one floor, one plot, one unit, one label).
import { createContext, useContext, useId } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { H, W, type BuildingBox, type FloorBox, type PlotBox, type SceneLayout, type UnitKind } from "@/lib/onboarding/scene";

const INK = "#0f1720";
/** Gradient ids are per drawing: a hidden second copy on the page must not own the gradients. */
const Ids = createContext("ps");
const useUrl = () => { const p = useContext(Ids); return (n: string) => `url(#${p}-${n})`; };
const MUTED = "#5b6270";

/** 0 → 1 as the piece appears (soft, no bounce). */
function useAppear(at: number, damping = 18) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 150, mass: 0.7 } });
}

export const PropertyScene: React.FC<{ layout: SceneLayout }> = ({ layout }) => {
  const { groundY, buildings, plots, water, empty } = layout;
  const soil = buildings.some((b) => b.floors.some((f) => f.L < 0));
  const p = `ps${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const url = (n: string) => `url(#${p}-${n})`;
  return (
    <Ids.Provider value={p}>
    <AbsoluteFill style={{ backgroundColor: "#f4f8fc", fontFamily: "inherit" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
        <defs>
          <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9ecfb" /><stop offset="1" stopColor="#f4f8fc" /></linearGradient>
          <linearGradient id={`${p}-glass`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#cfe6f7" /><stop offset="1" stopColor="#8fbfe2" /></linearGradient>
          <linearGradient id={`${p}-water`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe7f5" /><stop offset="1" stopColor="#a9d3ec" /></linearGradient>
          <pattern id={`${p}-soil`} width="18" height="10" patternUnits="userSpaceOnUse"><rect width="18" height="10" fill="#e6d8bf" /><path d="M0 8h7M10 3h6" stroke="#d6c4a5" strokeWidth="1.2" strokeLinecap="round" /></pattern>
        </defs>
        {/* Sky, sun, clouds, far hills — static */}
        <rect x="0" y="0" width={W} height={groundY + 4} fill={url("sky")} />
        <circle cx={W - 52} cy={46} r={30} fill="#fff6dc" opacity={0.55} />
        <circle cx={W - 52} cy={46} r={16} fill="#ffe9a8" />
        <Cloud x={78} y={40} s={0.75} /><Cloud x={262} y={28} s={0.5} />
        <path d={`M0 ${groundY - 6} Q ${W * 0.18} ${groundY - 46} ${W * 0.38} ${groundY - 14} T ${W * 0.72} ${groundY - 22} T ${W} ${groundY - 30} V ${groundY + 4} H 0 Z`} fill="#d6e9cf" />
        {/* Ground */}
        <rect x="0" y={groundY} width={W} height={H - groundY} fill={soil && !plots.length ? url("soil") : "#e4efda"} />
        <rect x="0" y={groundY - 2} width={W} height={8} fill="#cfe3bf" />
        {soil && plots.length > 0 && buildings.map((b) => { const bs = b.floors.filter((f) => f.L < 0); const lo = Math.max(...bs.map((f) => f.y + f.h)); return <rect key={`soil-${b.key}`} x={b.x - 14} y={groundY + 2} width={b.w + 34} height={lo - groundY + 6} rx={6} fill={url("soil")} />; })}
        {empty && <text x={W / 2} y={groundY + 110} textAnchor="middle" fontSize={16} fill={MUTED}>Pick what you rent to see it here</text>}
        {buildings.map((b) => <Building key={b.key} b={b} groundY={groundY} />)}
        {plots.map((p) => <Plot key={p.key} p={p} water={water} />)}
      </svg>
    </AbsoluteFill>
    </Ids.Provider>
  );
};

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return <g opacity={0.9} transform={`translate(${x} ${y}) scale(${s})`}><ellipse cx="0" cy="8" rx="38" ry="12" fill="#fff" /><circle cx="-12" cy="2" r="14" fill="#fff" /><circle cx="10" cy="-2" r="18" fill="#fff" /></g>;
}

// ---------------- Buildings ----------------
const WALL: Record<BuildingBox["style"], [string, string]> = { hotel: ["#f6f3ee", "#ddd6ca"], apartment: ["#efe8dd", "#d7ccbc"], capsule: ["#eef2f6", "#d3dbe4"] };

function Building({ b, groundY }: { b: BuildingBox; groundY: number }) {
  const top = b.floors.filter((f) => f.L >= 0).at(-1);
  const every = top && top.h < 13 ? (top.h < 10 ? 5 : 2) : 1;
  return (
    <g>
      {b.floors.map((f) => <Floor key={f.key} f={f} style={b.style} groundY={groundY} label={f.L <= 0 || f.L % every === 0 || f === top} lobby={f.L === 0 || (f.L === 1 && !b.floors.some((x) => x.L === 0))} />)}
      {top && <Roof b={b} y={top.y} at={top.at + 2} />}
      <BuildingName b={b} />
    </g>
  );
}

function Floor({ f, style, groundY, label, lobby }: { f: FloorBox; style: BuildingBox["style"]; groundY: number; label: boolean; lobby: boolean }) {
  const p = useAppear(f.at);
  const url = useUrl();
  const [wall, side] = f.L < 0 ? ["#d8cfbf", "#c4b9a6"] : WALL[style];
  const d = Math.min(12, f.w * 0.08);
  const n = Math.max(2, Math.round(f.w / 30));
  const cw = f.w / n;
  const wh = Math.max(3, f.h * (f.L < 0 ? 0.22 : 0.5));
  const below = f.L < 0;
  return (
    <g style={{ opacity: p, translate: `0px ${interpolate(p, [0, 1], [below ? -8 : 10, 0])}px` }}>
      {/* right side face for depth */}
      <polygon points={`${f.x + f.w},${f.y} ${f.x + f.w + d},${f.y - d * 0.5} ${f.x + f.w + d},${f.y + f.h - d * 0.5} ${f.x + f.w},${f.y + f.h}`} fill={side} />
      <rect x={f.x} y={f.y} width={f.w} height={f.h} fill={wall} />
      <line x1={f.x} x2={f.x + f.w} y1={f.y + f.h - 0.5} y2={f.y + f.h - 0.5} stroke={below ? "#b9ad98" : "#e1dacd"} strokeWidth={1} />
      {lobby && !below ? (
        <g>
          <rect x={f.x + 6} y={f.y + f.h * 0.22} width={f.w - 12} height={f.h * 0.78 - 1} fill={url("glass")} opacity={0.85} />
          <rect x={f.x + f.w / 2 - Math.min(12, f.w * 0.09)} y={f.y + f.h * 0.3} width={Math.min(24, f.w * 0.18)} height={f.h * 0.7 - 1} fill="#4d5866" />
          <rect x={f.x + f.w / 2 - Math.min(22, f.w * 0.17)} y={f.y + f.h * 0.14} width={Math.min(44, f.w * 0.34)} height={Math.max(3, f.h * 0.12)} rx={2} fill="#d9645b" />
        </g>
      ) : (
        Array.from({ length: n }, (_, i) => {
          const wx = f.x + i * cw + cw * 0.22, ww = cw * 0.56, wy = f.y + (f.h - wh) / 2 - (style === "apartment" && !below ? f.h * 0.06 : 0);
          return style === "capsule" && !below ? (
            <circle key={i} cx={wx + ww / 2} cy={f.y + f.h / 2} r={Math.min(ww, f.h * 0.6) / 2} fill={url("glass")} stroke="#c3ccd6" strokeWidth={1} />
          ) : (
            <g key={i}>
              <rect x={wx} y={wy} width={ww} height={wh} rx={1.5} fill={below ? "#b3aa98" : url("glass")} />
              {!below && wh > 8 && <path d={`M${wx + ww * 0.15} ${wy + wh * 0.8} L${wx + ww * 0.55} ${wy + wh * 0.15}`} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.4} />}
              {style === "apartment" && !below && f.h > 14 && <g><rect x={wx - 2} y={wy + wh + 1} width={ww + 4} height={2.2} fill="#8c96a1" /><path d={`M${wx} ${wy + wh + 1}v-${wh * 0.35}M${wx + ww / 2} ${wy + wh + 1}v-${wh * 0.35}M${wx + ww} ${wy + wh + 1}v-${wh * 0.35}`} stroke="#8c96a1" strokeWidth={1} /></g>}
            </g>
          );
        })
      )}
      {label && <FloorChip x={f.x - 8} y={f.y + f.h / 2} text={f.label} dim={below} />}
      {below && f.L === -1 && <line x1={f.x - 4} x2={f.x + f.w + d + 4} y1={groundY} y2={groundY} stroke="#9fbf86" strokeWidth={2} />}
    </g>
  );
}

function FloorChip({ x, y, text, dim }: { x: number; y: number; text: string; dim?: boolean }) {
  const w = 9 + text.length * 7;
  return <g><rect x={x - w} y={y - 8.5} width={w} height={17} rx={8.5} fill={dim ? "#efe7d9" : "#ffffff"} stroke="#d3d8df" /><text x={x - w / 2} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill={dim ? "#7a6a52" : "#3a414c"}>{text}</text></g>;
}

function Roof({ b, y, at }: { b: BuildingBox; y: number; at: number }) {
  const p = useAppear(at);
  const d = Math.min(12, b.w * 0.08);
  return (
    <g style={{ opacity: p }}>
      <polygon points={`${b.x - 3},${y} ${b.x + b.w + 3},${y} ${b.x + b.w + d + 3},${y - d * 0.5} ${b.x + d - 3},${y - d * 0.5}`} fill="#d8d1c4" />
      <rect x={b.x - 3} y={y - 5} width={b.w + 6} height={5} fill="#c7beaf" />
      <rect x={b.x + b.w * 0.62} y={y - 14} width={b.w * 0.16} height={9} rx={1.5} fill="#bfc6cf" />
    </g>
  );
}

function BuildingName({ b }: { b: BuildingBox }) {
  const frame = useCurrentFrame();
  const name = b.name.length > Math.floor((b.w + 30) / 7.6) ? `${b.name.slice(0, Math.max(3, Math.floor((b.w + 30) / 7.6) - 1))}…` : b.name;
  return <text x={b.x + b.w / 2} y={b.roofY - 20} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={INK}
    style={{ opacity: interpolate(frame, [b.nameAt, b.nameAt + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }) }}>{name}</text>;
}

// ---------------- Zones / blocks ----------------
function Plot({ p, water }: { p: PlotBox; water: boolean }) {
  const a = useAppear(p.at);
  const url = useUrl();
  const name = p.name.length > Math.floor((p.w - 24) / 7) ? `${p.name.slice(0, Math.max(3, Math.floor((p.w - 24) / 7) - 1))}…` : p.name;
  return (
    <g>
      <g style={{ opacity: a, scale: interpolate(a, [0, 1], [0.94, 1]), transformBox: "fill-box", transformOrigin: "center" }}>
        <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={12} fill={water ? url("water") : "#dcebcc"} stroke={water ? "#9cc9e3" : "#b8d39f"} strokeWidth={2} />
        {water
          ? [0.42, 0.62, 0.8].map((k) => <path key={k} d={`M${p.x + 14} ${p.y + p.h * k} q 10 -5 20 0 t 20 0 t 20 0`} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.6} fill="none" />)
          : <g><circle cx={p.x + 14} cy={p.y + p.h - 12} r={7} fill="#9fc98c" /><circle cx={p.x + p.w - 14} cy={p.y + p.h - 12} r={7} fill="#9fc98c" /><path d={`M${p.x + p.w / 2 - 10} ${p.y + p.h} q 6 -18 0 -34`} stroke="#efe6d4" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.8} /></g>}
        <rect x={p.x + 8} y={p.y + 8} width={Math.min(p.w - 16, 14 + name.length * 7)} height={20} rx={10} fill="#ffffff" stroke="#d3d8df" />
        <text x={p.x + 15} y={p.y + 22} fontSize={11.5} fontWeight={700} fill={INK}>{name}</text>
      </g>
      {p.units.map((u) => <Unit key={u.key} u={u} water={water} />)}
    </g>
  );
}

function Unit({ u, water }: { u: PlotBox["units"][number]; water: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - u.at, fps, config: { damping: 11, stiffness: 170, mass: 0.55 } });
  const S = u.size;
  const base = u.kind === "houseboat" ? u.base - S * 0.12 : u.base;
  return (
    <g transform={`translate(${u.cx} ${base})`}>
      <g style={{ opacity: Math.min(1, s * 1.4), scale: interpolate(s, [0, 1], [0.6, 1]), translate: `0px ${interpolate(s, [0, 1], [10, 0])}px`, transformBox: "fill-box", transformOrigin: "center bottom" }}>
        {!water && u.kind !== "houseboat" && <ellipse cx={0} cy={1} rx={S * 0.46} ry={S * 0.06} fill="#000" opacity={0.08} />}
        {!water && u.kind === "houseboat" && <g><ellipse cx={0} cy={S * 0.04} rx={S * 0.66} ry={S * 0.13} fill="#a9d3ec" /><path d={`M${-S * 0.5} ${S * 0.06} q ${S * 0.08} ${-S * 0.04} ${S * 0.16} 0 t ${S * 0.16} 0`} stroke="#fff" strokeOpacity={0.7} strokeWidth={1.2} fill="none" /></g>}
        <UnitArt kind={u.kind} S={S} />
      </g>
    </g>
  );
}

/** Flat illustrations, base line at y = 0, centred on x = 0, about S wide. */
function UnitArt({ kind, S }: { kind: UnitKind; S: number }) {
  const url = useUrl();
  const r = (x: number, y: number, w: number, h: number, fill: string, extra?: Record<string, unknown>) => <rect x={x * S} y={y * S} width={w * S} height={h * S} fill={fill} {...extra} />;
  const poly = (pts: [number, number][], fill: string) => <polygon points={pts.map(([x, y]) => `${x * S},${y * S}`).join(" ")} fill={fill} />;
  const win = (x: number, y: number, w: number, h: number) => <g>{r(x, y, w, h, "#a9d0ea", { rx: 1 })}<path d={`M${(x + w / 2) * S} ${y * S}v${h * S}`} stroke="#ffffff" strokeOpacity={0.8} strokeWidth={1} /></g>;
  switch (kind) {
    case "cottage": return <g>
      {r(0.17, -0.88, 0.09, 0.22, "#9a4632")}
      {r(-0.38, -0.5, 0.76, 0.5, "#f1d4ad", { stroke: "#dcbb8f", strokeWidth: 1 })}
      {poly([[-0.49, -0.47], [0, -0.92], [0.49, -0.47]], "#c45a40")}
      {poly([[-0.49, -0.47], [0, -0.92], [0.04, -0.88], [-0.42, -0.47]], "#a94a34")}
      {r(-0.07, -0.29, 0.14, 0.29, "#7a4a2b", { rx: 1 })}
      {win(-0.3, -0.4, 0.15, 0.13)}{win(0.15, -0.4, 0.15, 0.13)}
    </g>;
    case "villa": return <g>
      {/* two-storey modern villa: flat roofs, glass, timber, pool in front */}
      {r(-0.08, -0.74, 0.5, 0.32, "#fbfaf7", { stroke: "#e2ddd2", strokeWidth: 1 })}
      {r(-0.12, -0.79, 0.58, 0.06, "#8f98a3", { rx: 1 })}
      {r(0.0, -0.68, 0.3, 0.2, url("glass"))}
      {r(-0.5, -0.43, 1, 0.43, "#fbfaf7", { stroke: "#e2ddd2", strokeWidth: 1 })}
      {r(-0.56, -0.5, 1.12, 0.08, "#8f98a3", { rx: 1 })}
      {r(-0.43, -0.36, 0.5, 0.3, url("glass"))}
      <path d={`M${-0.26 * S} ${-0.36 * S}v${0.3 * S}M${-0.1 * S} ${-0.36 * S}v${0.3 * S}`} stroke="#ffffff" strokeWidth={1.2} />
      {r(0.13, -0.38, 0.3, 0.38, "#c99a6b")}
      {r(-0.46, 0.0, 0.62, 0.09, "#7cc7e8", { rx: 2 })}
    </g>;
    case "bungalow": return <g>
      {r(-0.48, -0.36, 0.96, 0.36, "#efe3cf", { stroke: "#dccbb0", strokeWidth: 1 })}
      {poly([[-0.57, -0.34], [-0.36, -0.62], [0.36, -0.62], [0.57, -0.34]], "#80553a")}
      {r(-0.08, -0.25, 0.16, 0.25, "#6a4330", { rx: 1 })}
      {win(-0.38, -0.27, 0.18, 0.13)}{win(0.2, -0.27, 0.18, 0.13)}
      {r(-0.52, -0.34, 0.04, 0.34, "#9b7a5e")}{r(0.48, -0.34, 0.04, 0.34, "#9b7a5e")}
    </g>;
    case "cabin": return <g>
      {r(-0.36, -0.47, 0.72, 0.47, "#b07945")}
      {[0.1, 0.19, 0.28, 0.37].map((k) => <line key={k} x1={-0.36 * S} x2={0.36 * S} y1={-k * S} y2={-k * S} stroke="#8e5d33" strokeWidth={1.2} />)}
      {poly([[-0.47, -0.45], [0, -0.96], [0.47, -0.45]], "#5b4636")}
      {r(-0.08, -0.3, 0.16, 0.3, "#4a3426", { rx: 1 })}
      {r(0.15, -0.36, 0.14, 0.12, "#f6d98b", { rx: 1 })}
    </g>;
    case "treehouse": return <g>
      {r(-0.06, -0.58, 0.12, 0.58, "#8b5a2b")}
      <circle cx={-0.28 * S} cy={-0.8 * S} r={0.24 * S} fill="#79b26f" /><circle cx={0.3 * S} cy={-0.78 * S} r={0.22 * S} fill="#6aa862" /><circle cx={0} cy={-1.04 * S} r={0.22 * S} fill="#5f9d58" />
      {r(-0.33, -0.6, 0.66, 0.05, "#7a4e26")}
      {r(-0.21, -0.87, 0.42, 0.27, "#d9a96f")}
      {poly([[-0.27, -0.86], [0, -1.04], [0.27, -0.86]], "#b5553c")}
      {r(-0.05, -0.79, 0.1, 0.19, "#6b4426")}
      <path d={`M${0.14 * S} 0 L${0.2 * S} ${-0.6 * S} M${0.26 * S} 0 L${0.32 * S} ${-0.6 * S}`} stroke="#7a4e26" strokeWidth={1.4} />
    </g>;
    case "tent": return <g>
      {poly([[-0.47, 0], [0, -0.72], [0.47, 0]], "#f3e7cc")}
      <polygon points={`${-0.47 * S},0 ${0},${-0.72 * S} ${0.47 * S},0`} fill="none" stroke="#cdb68a" strokeWidth={1.4} />
      {poly([[-0.13, 0], [0, -0.42], [0.13, 0]], "#8a7350")}
      <path d={`M${-0.55 * S} ${-0.5 * S} Q 0 ${-0.4 * S} ${0.55 * S} ${-0.5 * S}`} stroke="#7d7466" strokeWidth={0.8} fill="none" />
      {[-0.4, -0.2, 0, 0.2, 0.4].map((k) => <circle key={k} cx={k * S} cy={(-0.46 + Math.abs(k) * 0.08) * S} r={Math.max(1.4, S * 0.022)} fill="#ffcf5a" />)}
    </g>;
    case "houseboat": return <g>
      <path d={`M${-0.52 * S} ${-0.12 * S} L${0.52 * S} ${-0.12 * S} Q${0.46 * S} ${0.07 * S} ${0.34 * S} ${0.07 * S} L${-0.34 * S} ${0.07 * S} Q${-0.46 * S} ${0.07 * S} ${-0.52 * S} ${-0.12 * S} Z`} fill="#8b5a2b" />
      {r(-0.34, -0.44, 0.68, 0.32, "#f6f1e6", { stroke: "#e0d6c3", strokeWidth: 1 })}
      {r(-0.4, -0.51, 0.8, 0.08, "#c45a40", { rx: 1 })}
      {win(-0.28, -0.36, 0.14, 0.12)}{win(-0.07, -0.36, 0.14, 0.12)}{win(0.14, -0.36, 0.14, 0.12)}
    </g>;
    case "holiday": return <g>
      {r(-0.36, -0.66, 0.72, 0.66, "#f5efe6", { stroke: "#e3d9c9", strokeWidth: 1 })}
      {poly([[-0.45, -0.64], [0, -0.99], [0.45, -0.64]], "#4f6d8a")}
      {win(-0.27, -0.56, 0.15, 0.13)}{win(0.12, -0.56, 0.15, 0.13)}{win(-0.27, -0.3, 0.15, 0.13)}
      {r(0.07, -0.3, 0.15, 0.3, "#5a4636", { rx: 1 })}
      <path d={`M${-0.5 * S} 0 v${-0.1 * S} M${-0.42 * S} 0 v${-0.1 * S} M${0.42 * S} 0 v${-0.1 * S} M${0.5 * S} 0 v${-0.1 * S} M${-0.52 * S} ${-0.06 * S} h${0.12 * S} M${0.4 * S} ${-0.06 * S} h${0.12 * S}`} stroke="#c9b48a" strokeWidth={1.2} />
    </g>;
    default: return <g>
      {r(-0.34, -0.44, 0.68, 0.44, "#ece1cf", { stroke: "#d8c8ae", strokeWidth: 1 })}
      {poly([[-0.44, -0.42], [0, -0.78], [0.44, -0.42]], "#6b7a8f")}
      {r(-0.07, -0.27, 0.14, 0.27, "#6b5844", { rx: 1 })}
      {win(0.13, -0.36, 0.14, 0.12)}
    </g>;
  }
}
