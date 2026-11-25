import type { CSSProperties } from "react";
type Src = string | { src: string };
const fix = (s: Src) => { const u = typeof s === "string" ? s : s.src; return u.startsWith("/") && !u.startsWith("//") ? "." + u : u; };
export default function Image({ src, alt, fill, className, priority, style, width, height, onLoad, onError, draggable }: { src: Src; alt: string; fill?: boolean; className?: string; priority?: boolean; sizes?: string; quality?: number; style?: CSSProperties; width?: number; height?: number; placeholder?: string; blurDataURL?: string; unoptimized?: boolean; loading?: string; onLoad?: () => void; onError?: () => void; draggable?: boolean }) {
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : { ...style };
  return <img src={fix(src)} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} className={className} style={s} loading={priority ? "eager" : "lazy"} decoding="async" onLoad={onLoad} onError={onError} draggable={draggable} />;
}
