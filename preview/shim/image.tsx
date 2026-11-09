import type { CSSProperties } from "react";
const files = import.meta.glob("../../public/demo/azure-bay/*.jpg", { eager: true, query: "?inline", import: "default" }) as Record<string, string>;
const map: Record<string, string> = {};
for (const [k, v] of Object.entries(files)) map["/demo/azure-bay/" + k.split("/").pop()] = v;

export default function Image({ src, alt, fill, className, priority, sizes, style, ...rest }: { src: string; alt: string; fill?: boolean; className?: string; priority?: boolean; sizes?: string; style?: CSSProperties; width?: number; height?: number }) {
  void sizes;
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : { ...style };
  return <img src={map[src] ?? src} alt={alt} className={className} style={s} loading={priority ? "eager" : "lazy"} decoding="async" {...rest} />;
}
