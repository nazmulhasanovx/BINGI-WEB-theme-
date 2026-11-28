"use client";
// Table drawing for Restaurant & Bar › Tables & QR (Remotion composition, same family as the onboarding property drawing).
// Drawn like a real table seen from a raised angle: wooden top with thickness and legs, place settings, and real
// chairs (legs, cushion, backrest) — or bar stools along a counter. Each chair carries its seat code (1S, 2S…).
// Frame-driven springs only (no CSS transitions). Optional states (taken / picked) tint the cushions.
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { PlaceKind } from "@/lib/meals/seed";

export const TW = 480, TH = 300;
export type TableSceneProps = {
  kind: PlaceKind; name: string; codes: string[];
  taken?: string[]; picked?: string[];
  onSeat?: (code: string) => void;
};
export const sceneFrames = (n: number) => 18 + n * 3 + 14;

const CX = TW / 2, CY = 140, SQ = 0.5; // SQ = depth squash (camera looks down at ~30°)
const TOP_T = 9;       // table-top thickness
const LEG_H = 46;      // table legs (screen px under the top)

type Seat = { code: string; x: number; y: number; a: number }; // a = angle from table centre (radians); 0 = right, π/2 = toward viewer
type Shape = "round" | "long" | "bar";
type L = { shape: Shape; w: number; d: number; seats: Omit<Seat, "code">[]; plates: { x: number; y: number }[] };

function layout(kind: PlaceKind, n: number): L {
  if (kind === "bar") {
    const w = Math.min(420, 80 + n * 56);
    const xs = Array.from({ length: n }, (_, i) => CX - w / 2 + (w / n) * (i + 0.5));
    return { shape: "bar", w, d: 34, seats: xs.map((x) => ({ x, y: CY + 80, a: Math.PI / 2 })), plates: xs.map((x) => ({ x, y: CY + 4 })) };
  }
  if (kind === "private" || (kind === "table" && n <= 4) || n <= 2) {
    const r = n <= 2 ? 66 : n <= 4 ? 76 : 88;
    const R = r + 34;
    const seats = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return { x: CX + Math.cos(a) * (r + 16), y: CY + 18 + Math.sin(a) * R * SQ, a }; });
    const plates = seats.map((s) => ({ x: CX + Math.cos(s.a) * (r - 24), y: CY + Math.sin(s.a) * (r - 24) * SQ }));
    return { shape: "round", w: r * 2, d: r * 2 * SQ, seats, plates };
  }
  const ends = n % 2 === 1 ? 1 : 0;
  const side = Math.floor((n - ends) / 2);
  const w = Math.min(360, 50 + side * 70), d = 104 * SQ;
  const seats: Omit<Seat, "code">[] = [], plates: { x: number; y: number }[] = [];
  for (let i = 0; i < side; i++) { const x = CX - w / 2 + (w / side) * (i + 0.5); seats.push({ x, y: CY - d / 2 + 2, a: -Math.PI / 2 }); plates.push({ x, y: CY - d / 2 + 12 }); }
  for (let i = 0; i < side; i++) { const x = CX - w / 2 + (w / side) * (i + 0.5); seats.push({ x, y: CY + d / 2 + 44, a: Math.PI / 2 }); plates.push({ x, y: CY + d / 2 - 12 }); }
  if (ends) { seats.push({ x: CX + w / 2 + 34, y: CY + 22, a: 0 }); plates.push({ x: CX + w / 2 - 22, y: CY }); }
  return { shape: "long", w, d, seats, plates };
}

function useAppear(at: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 150, mass: 0.7 } });
}

type Tone = { cushion: string; cushionDark: string; tag: string; tagInk: string };
const toneOf = (state: "neutral" | "free" | "taken" | "picked"): Tone => ({
  neutral: { cushion: "#ece3d3", cushionDark: "#d4c6ad", tag: "#ffffff", tagInk: "#3d2f22" },
  free: { cushion: "#cfe9d9", cushionDark: "#9fcfb2", tag: "#16693a", tagInk: "#ffffff" },
  taken: { cushion: "#f1c9c5", cushionDark: "#de9a93", tag: "#b3261e", tagInk: "#ffffff" },
  picked: { cushion: "#3a4350", cushionDark: "#20262e", tag: "#0f1720", tagInk: "#ffffff" },
}[state]);

export const TableScene: React.FC<TableSceneProps> = ({ kind, name, codes, taken, picked, onSeat }) => {
  const L = layout(kind, codes.length);
  const seats: Seat[] = L.seats.map((s, i) => ({ ...s, code: codes[i] }));
  const stateful = !!taken || !!picked;
  const stateOf = (c: string) => (!stateful ? "neutral" : picked?.includes(c) ? "picked" : taken?.includes(c) ? "taken" : "free");
  const behind = seats.filter((s) => Math.sin(s.a) < -0.2), infront = seats.filter((s) => Math.sin(s.a) >= -0.2).sort((a, b) => a.y - b.y);
  const order = (s: Seat) => seats.indexOf(s);
  return (
    <AbsoluteFill style={{ fontFamily: "inherit" }}>
      <svg viewBox={`0 0 ${TW} ${TH}`} width="100%" height="100%" role="img" aria-label={`${name}: ${codes.length} seats`}>
        <defs>
          <linearGradient id="tsBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7f4ef" /><stop offset="1" stopColor="#ece5da" /></linearGradient>
          <linearGradient id="tsOak" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stopColor="#d9b98d" /><stop offset="0.5" stopColor="#c99f6c" /><stop offset="1" stopColor="#b88a57" /></linearGradient>
          <linearGradient id="tsWalnut" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stopColor="#8a5f3e" /><stop offset="0.55" stopColor="#6e4a2f" /><stop offset="1" stopColor="#5a3b24" /></linearGradient>
          <linearGradient id="tsEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9c7246" /><stop offset="1" stopColor="#7c5734" /></linearGradient>
          <linearGradient id="tsEdgeDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d321f" /><stop offset="1" stopColor="#3a2515" /></linearGradient>
          <linearGradient id="tsChairWood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a87b4f" /><stop offset="1" stopColor="#7d5634" /></linearGradient>
          <linearGradient id="tsCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#eef0f2" /></linearGradient>
          <linearGradient id="tsMarble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f4f2ee" /><stop offset="1" stopColor="#dedad3" /></linearGradient>
          <linearGradient id="tsChrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8d949e" /><stop offset="0.45" stopColor="#e7eaee" /><stop offset="1" stopColor="#7b828c" /></linearGradient>
          <radialGradient id="tsShadow"><stop offset="0" stopColor="#2a1d12" stopOpacity="0.28" /><stop offset="1" stopColor="#2a1d12" stopOpacity="0" /></radialGradient>
          <pattern id="tsGrain" width="60" height="8" patternUnits="userSpaceOnUse"><path d="M0 3 Q15 1 30 3 T60 3" fill="none" stroke="#7a5230" strokeOpacity="0.13" strokeWidth="1" /><path d="M0 7 Q20 5.5 40 7 T80 7" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="0.8" /></pattern>
        </defs>
        <rect width={TW} height={TH} fill="url(#tsBg)" />
        {/* floor planks */}
        {Array.from({ length: 9 }, (_, i) => <line key={i} x1={0} y1={170 + i * i * 2.2 + i * 6} x2={TW} y2={170 + i * i * 2.2 + i * 6} stroke="#d9cfbf" strokeOpacity={0.5} strokeWidth={1} />)}

        {behind.map((s) => <Chair key={s.code} s={s} at={12 + order(s) * 3} tone={toneOf(stateOf(s.code))} state={stateOf(s.code)} onSeat={onSeat} bar={L.shape === "bar"} />)}
        <Table L={L} kind={kind} name={name} />
        {infront.map((s) => <Chair key={s.code} s={s} at={12 + order(s) * 3} tone={toneOf(stateOf(s.code))} state={stateOf(s.code)} onSeat={onSeat} bar={L.shape === "bar"} />)}
      </svg>
    </AbsoluteFill>
  );
};

function Table({ L, kind, name }: { L: L; kind: PlaceKind; name: string }) {
  const p = useAppear(0);
  const frame = useCurrentFrame();
  const drop = interpolate(p, [0, 1], [-22, 0]);
  const fade = interpolate(frame, [0, 7], [0, 1], { extrapolateRight: "clamp" });
  const dark = kind === "private";
  const cloth = kind === "event";
  const top = dark ? "url(#tsWalnut)" : "url(#tsOak)";
  const edge = dark ? "url(#tsEdgeDark)" : "url(#tsEdge)";
  const legC = dark ? "#3a2515" : "#6e4b2c";
  const label = <text x={CX} y={CY + (L.shape === "bar" ? 3 : 6)} textAnchor="middle" fontSize={15} fontWeight={800} letterSpacing={0.5} fill={dark ? "#f3e6d3" : cloth ? "#5b6270" : "#4a3220"} opacity={0.9}>{name}</text>;

  if (L.shape === "bar") {
    const x = CX - L.w / 2, y = CY - L.d / 2, panel = 74;
    return (
      <g opacity={fade} transform={`translate(0 ${drop})`}>
        <ellipse cx={CX} cy={y + L.d + panel + 6} rx={L.w / 2 + 20} ry={12} fill="url(#tsShadow)" />
        {/* front panel with slats */}
        <rect x={x + 6} y={y + L.d} width={L.w - 12} height={panel} fill="url(#tsWalnut)" />
        {Array.from({ length: Math.floor((L.w - 12) / 18) }, (_, i) => <line key={i} x1={x + 15 + i * 18} y1={y + L.d + 4} x2={x + 15 + i * 18} y2={y + L.d + panel - 8} stroke="#3a2515" strokeOpacity={0.35} />)}
        <rect x={x + 6} y={y + L.d + panel - 8} width={L.w - 12} height={8} fill="#2e1d10" />
        {/* foot rail */}
        <rect x={x + 10} y={y + L.d + panel - 22} width={L.w - 20} height={4} rx={2} fill="url(#tsChrome)" />
        {/* marble top */}
        <rect x={x} y={y + 6} width={L.w} height={L.d} rx={6} fill="#bdb7ad" />
        <rect x={x} y={y} width={L.w} height={L.d} rx={6} fill="url(#tsMarble)" />
        <rect x={x} y={y} width={L.w} height={L.d} rx={6} fill="none" stroke="#c9c3b8" />
        {L.plates.map((pl, i) => <Glass key={i} x={pl.x} y={pl.y} at={10 + i * 2} />)}
        <g transform={`translate(${x + 18} ${y + L.d + 16})`}><rect x={-4} y={-10} width={Math.max(56, name.length * 9 + 16)} height={20} rx={4} fill="#1d130a" opacity={0.6} /><text x={Math.max(56, name.length * 9 + 16) / 2 - 4} y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#f3e6d3">{name}</text></g>
      </g>
    );
  }

  if (L.shape === "round") {
    const rx = L.w / 2, ry = L.d / 2;
    return (
      <g opacity={fade} transform={`translate(0 ${drop})`}>
        <ellipse cx={CX} cy={CY + TOP_T + LEG_H + 4} rx={rx * 0.9} ry={ry * 0.5} fill="url(#tsShadow)" />
        {/* pedestal + base */}
        <rect x={CX - 7} y={CY + TOP_T} width={14} height={LEG_H} fill={legC} />
        <rect x={CX - 7} y={CY + TOP_T} width={5} height={LEG_H} fill="#fff" opacity={0.12} />
        <ellipse cx={CX} cy={CY + TOP_T + LEG_H} rx={34} ry={8} fill={legC} />
        <ellipse cx={CX} cy={CY + TOP_T + LEG_H - 2} rx={34} ry={7} fill={dark ? "#4d321f" : "#86603a"} />
        {cloth ? <>
          <path d={`M${CX - rx - 4} ${CY} L${CX - rx + 2} ${CY + 40} Q${CX} ${CY + ry + 52} ${CX + rx - 2} ${CY + 40} L${CX + rx + 4} ${CY} Z`} fill="url(#tsCloth)" stroke="#dfe3e8" />
          <ellipse cx={CX} cy={CY} rx={rx + 4} ry={ry + 2} fill="#ffffff" stroke="#e3e7ec" />
        </> : <>
          <ellipse cx={CX} cy={CY + TOP_T} rx={rx} ry={ry} fill={edge} />
          <rect x={CX - rx} y={CY} width={rx * 2} height={TOP_T} fill={edge} />
          <ellipse cx={CX} cy={CY} rx={rx} ry={ry} fill={top} />
          <ellipse cx={CX} cy={CY} rx={rx} ry={ry} fill="url(#tsGrain)" />
          <ellipse cx={CX - rx * 0.25} cy={CY - ry * 0.35} rx={rx * 0.5} ry={ry * 0.28} fill="#fff" opacity={0.12} />
        </>}
        {L.plates.map((pl, i) => <Plate key={i} x={pl.x} y={pl.y} at={14 + i * 2} />)}
        {label}
        {kind === "private" && <Vip y={CY - ry - 6} />}
      </g>
    );
  }

  // long
  const x = CX - L.w / 2, y = CY - L.d / 2;
  const legs = [[x + 12, y + 10], [x + L.w - 12, y + 10], [x + 12, y + L.d - 4], [x + L.w - 12, y + L.d - 4]];
  return (
    <g opacity={fade} transform={`translate(0 ${drop})`}>
      <ellipse cx={CX} cy={y + L.d + TOP_T + LEG_H} rx={L.w / 2 + 10} ry={14} fill="url(#tsShadow)" />
      {legs.map(([lx, ly], i) => <rect key={i} x={lx - 4} y={ly} width={8} height={LEG_H + (i > 1 ? 4 : -4)} rx={2} fill={legC} />)}
      {cloth ? <>
        <path d={`M${x - 4} ${y} L${x - 4} ${y + L.d + 34} Q${CX} ${y + L.d + 44} ${x + L.w + 4} ${y + L.d + 34} L${x + L.w + 4} ${y} Z`} fill="url(#tsCloth)" stroke="#dfe3e8" />
        <rect x={x - 4} y={y - 2} width={L.w + 8} height={L.d + 4} rx={4} fill="#ffffff" stroke="#e3e7ec" />
      </> : <>
        <rect x={x} y={y + TOP_T} width={L.w} height={L.d} rx={8} fill={edge} />
        <rect x={x} y={y} width={L.w} height={L.d} rx={8} fill={top} />
        <rect x={x} y={y} width={L.w} height={L.d} rx={8} fill="url(#tsGrain)" />
        <rect x={x + 10} y={y + 5} width={L.w * 0.45} height={L.d * 0.3} rx={6} fill="#fff" opacity={0.1} />
      </>}
      {L.plates.map((pl, i) => <Plate key={i} x={pl.x} y={pl.y} at={14 + i * 2} />)}
      {label}
    </g>
  );
}

function Vip({ y }: { y: number }) {
  return <g transform={`translate(${CX - 19} ${y - 6})`}><rect width={38} height={16} rx={8} fill="#b11c29" /><text x={19} y={11.5} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#fff" letterSpacing={0.6}>VIP</text></g>;
}

function Plate({ x, y, at }: { x: number; y: number; at: number }) {
  const p = useAppear(at);
  return <g transform={`translate(${x} ${y}) scale(${p})`} opacity={p}>
    <ellipse cx={0} cy={1.5} rx={13} ry={6.5} fill="#000" opacity={0.08} />
    <ellipse cx={0} cy={0} rx={13} ry={6.5} fill="#ffffff" stroke="#e1e4e8" strokeWidth={0.8} />
    <ellipse cx={0} cy={0} rx={8} ry={4} fill="none" stroke="#e8ebee" strokeWidth={0.8} />
    <rect x={-18} y={-4} width={1.6} height={9} rx={0.8} fill="#a7adb5" />
    <rect x={16.4} y={-4} width={1.6} height={9} rx={0.8} fill="#a7adb5" />
  </g>;
}

function Glass({ x, y, at }: { x: number; y: number; at: number }) {
  const p = useAppear(at);
  return <g transform={`translate(${x} ${y}) scale(${p})`} opacity={p}>
    <ellipse cx={0} cy={8} rx={6} ry={2} fill="#000" opacity={0.1} />
    <path d="M-5 -6 L-4 7 L4 7 L5 -6 Z" fill="#dff1f7" stroke="#b9d3dc" strokeWidth={0.8} opacity={0.9} />
    <rect x={-4} y={1} width={8} height={5} fill="#e6a44a" opacity={0.6} />
  </g>;
}

function Chair({ s, at, tone, state, onSeat, bar }: { s: Seat; at: number; tone: Tone; state: string; onSeat?: (c: string) => void; bar: boolean }) {
  const p = useAppear(at);
  const out = interpolate(p, [0, 1], [18, 0]);
  const dx = Math.cos(s.a) * out, dy = Math.sin(s.a) * out * SQ;
  const can = !!onSeat && state !== "taken";
  const tagW = Math.max(24, s.code.length * 7 + 10);
  const press = onSeat ? { role: "button", "aria-label": `Seat ${s.code}, ${state}`, "aria-pressed": state === "picked", onClick: can ? () => onSeat!(s.code) : undefined, style: { cursor: can ? "pointer" : "default" } } : {};

  if (bar) {
    return (
      <g transform={`translate(${s.x + dx} ${s.y + dy})`} opacity={p} {...press}>
        <ellipse cx={0} cy={58} rx={18} ry={5} fill="url(#tsShadow)" />
        <ellipse cx={0} cy={56} rx={14} ry={4} fill="#6b727c" />
        <rect x={-2.5} y={6} width={5} height={50} fill="url(#tsChrome)" />
        <ellipse cx={0} cy={34} rx={11} ry={3.5} fill="none" stroke="#9aa1ab" strokeWidth={2.5} />
        <ellipse cx={0} cy={5} rx={19} ry={8} fill={tone.cushionDark} />
        <ellipse cx={0} cy={1} rx={19} ry={8} fill={tone.cushion} stroke={tone.cushionDark} strokeWidth={1} />
        <g transform={`translate(0 -16)`}><rect x={-tagW / 2} y={-8} width={tagW} height={16} rx={8} fill={tone.tag} stroke={state === "neutral" ? "#d8ccb6" : "none"} /><text x={0} y={4} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={tone.tagInk}>{s.code}</text></g>
        <rect x={-22} y={-26} width={44} height={88} fill="transparent" />
      </g>
    );
  }

  const sin = Math.sin(s.a), cos = Math.cos(s.a);
  const bw = 30 * Math.abs(sin) + 9 * Math.abs(cos); // backrest seen face-on (front/back) or edge-on (sides)
  const ox = cos * 15, oy = sin * 15 * SQ;          // backrest sits on the outer side of the seat
  const backFirst = sin < 0;                         // chair behind the table: its backrest is further away
  const seatW = 19 * Math.abs(sin) + 15 * Math.abs(cos), seatH = 9;
  const back = (
    <g>
      <rect x={ox - bw / 2 - 1} y={oy - 40} width={3} height={42} fill="#6e4b2c" />
      <rect x={ox + bw / 2 - 2} y={oy - 40} width={3} height={42} fill="#6e4b2c" />
      <rect x={ox - bw / 2} y={oy - 42} width={bw} height={26} rx={Math.min(7, bw / 2)} fill="url(#tsChairWood)" />
      {bw > 16 && <rect x={ox - bw / 2 + 4} y={oy - 38} width={bw - 8} height={17} rx={5} fill={sin > 0 ? "#6e4b2c" : tone.cushion} opacity={sin > 0 ? 0.35 : 1} />}
    </g>
  );
  const seat = (
    <g>
      {[[-seatW + 4, 2], [seatW - 4, 2], [-seatW + 7, -3], [seatW - 7, -3]].map(([lx, ly], i) => <rect key={i} x={lx - 1.5} y={ly + 4} width={3} height={18} fill={i < 2 ? "#5a3d24" : "#7d5634"} />)}
      <ellipse cx={0} cy={5} rx={seatW} ry={seatH} fill="#6e4b2c" />
      <ellipse cx={0} cy={1} rx={seatW} ry={seatH} fill={tone.cushion} stroke={tone.cushionDark} strokeWidth={1} />
      <ellipse cx={-seatW * 0.3} cy={-2} rx={seatW * 0.45} ry={seatH * 0.35} fill="#fff" opacity={0.25} />
    </g>
  );
  return (
    <g transform={`translate(${s.x + dx} ${s.y + dy})`} opacity={p} {...press}>
      <ellipse cx={0} cy={24} rx={seatW + 6} ry={7} fill="url(#tsShadow)" />
      {backFirst ? <>{back}{seat}</> : <>{seat}{back}</>}
      <g transform={`translate(${ox * 0.4} ${sin > 0.2 ? oy - 29 : oy - 54})`}><rect x={-tagW / 2} y={-8} width={tagW} height={16} rx={8} fill={tone.tag} stroke={state === "neutral" ? "#d8ccb6" : "none"} /><text x={0} y={4} textAnchor="middle" fontSize={9.5} fontWeight={800} fill={tone.tagInk}>{s.code}</text></g>
      <rect x={-26} y={-64} width={52} height={92} fill="transparent" />
    </g>
  );
}
