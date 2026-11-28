"use client";
// Table drawing for Restaurant & Bar (Remotion composition, same style as the onboarding property drawing).
// The table and its seats build in (frame-driven springs, no CSS transitions); each seat shows its code (1S, 2S…)
// and state: free (green), taken by an open order (red), picked for this order (dark). Seats can be tapped.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PlaceKind } from "@/lib/meals/seed";

export const TW = 480, TH = 300;
export type TableSceneProps = {
  kind: PlaceKind; name: string; codes: string[];
  taken?: string[]; picked?: string[];
  /** Tap a seat (POS: pick / unpick). Left out = drawing only. */
  onSeat?: (code: string) => void;
};
export const sceneFrames = (n: number) => 16 + n * 3 + 12;

type Seat = { code: string; x: number; y: number; rot: number; stool?: boolean };
const CX = TW / 2, CY = TH / 2 + 8, SQ = 0.6; // SQ: depth squash — the table is seen from above at an angle

/** Where the seats go for each kind and seat count. */
function layout(kind: PlaceKind, n: number): { shape: "round" | "long" | "bar"; w: number; h: number; seats: Omit<Seat, "code">[] } {
  if (kind === "bar") {
    const w = Math.min(400, 70 + n * 52);
    return { shape: "bar", w, h: 46, seats: Array.from({ length: n }, (_, i) => ({ x: CX - w / 2 + (w / n) * (i + 0.5), y: CY + 62, rot: 0, stool: true })) };
  }
  if (kind === "private" || (kind === "table" && n <= 4) || n <= 2) {
    const r = n <= 2 ? 62 : n <= 4 ? 72 : 84;
    const R = r + 46;
    return { shape: "round", w: r * 2, h: r * 2 * SQ, seats: Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R * SQ, rot: (a * 180) / Math.PI + 270 }; }) };
  }
  // Long table: seats along both sides, one at each end when the count is odd.
  const ends = n % 2 === 1 ? 1 : 0;
  const side = Math.floor((n - ends) / 2);
  const w = Math.min(380, 60 + side * 62), h = 92 * SQ + 18;
  const seats: Omit<Seat, "code">[] = [];
  for (let i = 0; i < side; i++) seats.push({ x: CX - w / 2 + (w / side) * (i + 0.5), y: CY - h / 2 - 34, rot: 180 });
  for (let i = 0; i < side; i++) seats.push({ x: CX - w / 2 + (w / side) * (i + 0.5), y: CY + h / 2 + 34, rot: 0 });
  if (ends) seats.push({ x: CX + w / 2 + 44, y: CY, rot: -90 });
  return { shape: "long", w, h, seats };
}

function useAppear(at: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping: 16, stiffness: 160, mass: 0.7 } });
}

export const TableScene: React.FC<TableSceneProps> = ({ kind, name, codes, taken = [], picked = [], onSeat }) => {
  const L = layout(kind, codes.length);
  const seats: Seat[] = L.seats.map((s, i) => ({ ...s, code: codes[i] }));
  // Back row first so front chairs overlap the table edge, like a real view.
  const back = seats.filter((s) => s.y < CY), front = seats.filter((s) => s.y >= CY);
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4f6f8", fontFamily: "inherit" }}>
      <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" height="100%" role="img" aria-label={`${name}: ${codes.length} seats`}>
        <defs>
          <pattern id="tsFloor" width="40" height="24" patternUnits="userSpaceOnUse"><rect width="40" height="24" fill="#f4f6f8" /><path d="M0 24 L20 0 M20 24 L40 0" stroke="#e6e9ee" strokeWidth="1" /></pattern>
          <linearGradient id="tsWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f1e6d4" /><stop offset="1" stopColor="#e2d1b6" /></linearGradient>
        </defs>
        <rect width={TW} height={TH} fill="url(#tsFloor)" />
        {back.map((s, i) => <Chair key={s.code} s={s} at={10 + i * 3} taken={taken.includes(s.code)} picked={picked.includes(s.code)} onSeat={onSeat} />)}
        <Top L={L} kind={kind} name={name} />
        {front.map((s, i) => <Chair key={s.code} s={s} at={10 + (back.length + i) * 3} taken={taken.includes(s.code)} picked={picked.includes(s.code)} onSeat={onSeat} />)}
      </svg>
    </AbsoluteFill>
  );
};

function Top({ L, kind, name }: { L: ReturnType<typeof layout>; kind: PlaceKind; name: string }) {
  const p = useAppear(0);
  const frame = useCurrentFrame();
  const drop = interpolate(p, [0, 1], [-18, 0]);
  const depth = L.shape === "bar" ? 26 : 14;
  return (
    <g opacity={interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" })} transform={`translate(0 ${drop})`}>
      {/* shadow */}
      <ellipse cx={CX} cy={CY + L.h / 2 + depth + 6} rx={L.w / 2 + 6} ry={10} fill="#0f1720" opacity={0.07 * p} />
      {L.shape === "round" ? <>
        <ellipse cx={CX} cy={CY + depth} rx={L.w / 2} ry={L.h / 2} fill="#cdb99c" />
        <rect x={CX - L.w / 2} y={CY} width={L.w} height={depth} fill="#cdb99c" />
        <ellipse cx={CX} cy={CY} rx={L.w / 2} ry={L.h / 2} fill="url(#tsWood)" stroke="#c9b28f" strokeWidth={1.2} />
      </> : <>
        <rect x={CX - L.w / 2} y={CY - L.h / 2 + depth} width={L.w} height={L.h} rx={L.shape === "bar" ? 10 : 14} fill={L.shape === "bar" ? "#4a3b2c" : "#cdb99c"} />
        <rect x={CX - L.w / 2} y={CY - L.h / 2} width={L.w} height={L.h} rx={L.shape === "bar" ? 10 : 14} fill={L.shape === "bar" ? "#6b5640" : "url(#tsWood)"} stroke={L.shape === "bar" ? "#4a3b2c" : "#c9b28f"} strokeWidth={1.2} />
      </>}
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize={17} fontWeight={800} fill={L.shape === "bar" ? "#fff" : "#4a3b2c"}>{name}</text>
      {kind === "private" && <g transform={`translate(${CX - 20} ${CY - L.h / 2 - 2})`}><rect width={40} height={16} rx={8} fill="#b11c29" /><text x={20} y={11.5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#fff">VIP</text></g>}
      {kind === "event" && <text x={CX} y={CY + 20} textAnchor="middle" fontSize={10} fontWeight={700} fill="#8a6f4d">EVENT</text>}
    </g>
  );
}

function Chair({ s, at, taken, picked, onSeat }: { s: Seat; at: number; taken: boolean; picked: boolean; onSeat?: (c: string) => void }) {
  const p = useAppear(at);
  const fill = picked ? "#0f1720" : taken ? "#f3d1ce" : "#e8f6ee";
  const edge = picked ? "#0f1720" : taken ? "#d6453c" : "#3fa66b";
  const ink = picked ? "#ffffff" : taken ? "#a3302a" : "#16693a";
  const can = !!onSeat && !taken;
  return (
    <g transform={`translate(${s.x} ${s.y}) scale(${p})`} opacity={p} style={{ cursor: can ? "pointer" : "default" }} onClick={can ? () => onSeat!(s.code) : undefined}
      role={onSeat ? "button" : undefined} aria-label={onSeat ? `Seat ${s.code}${taken ? ", taken" : picked ? ", picked" : ", free"}` : undefined} aria-pressed={onSeat ? picked : undefined}>
      {s.stool ? <>
        <rect x={-3} y={6} width={6} height={18} fill="#9aa1ad" />
        <ellipse cx={0} cy={26} rx={13} ry={5} fill="#0f1720" opacity={0.08} />
        <ellipse cx={0} cy={4} rx={19} ry={10} fill={edge} />
        <ellipse cx={0} cy={0} rx={19} ry={10} fill={fill} stroke={edge} strokeWidth={1.5} />
        <text x={0} y={4} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={ink}>{s.code}</text>
      </> : <>
        <g transform={`rotate(${s.rot})`}>
          <rect x={-17} y={9} width={34} height={7} rx={3.5} fill={edge} opacity={0.9} />
        </g>
        <rect x={-17} y={-12} width={34} height={26} rx={8} fill={edge} />
        <rect x={-17} y={-15} width={34} height={26} rx={8} fill={fill} stroke={edge} strokeWidth={1.5} />
        <text x={0} y={2} textAnchor="middle" fontSize={11} fontWeight={800} fill={ink}>{s.code}</text>
      </>}
    </g>
  );
}
