import type { CSSProperties } from "react";
const files = import.meta.glob("../.images/*.jpg", { eager: true, query: "?inline", import: "default" }) as Record<string, string>;
import logo from "../../public/brand/bingi-logo.png?inline";
const map: Record<string, string> = { "/brand/bingi-logo.png": logo };
for (const [k, v] of Object.entries(files)) map["/demo/azure-bay/" + k.split("/").pop()] = v;

export default function Image({ src, alt, fill, className, priority, sizes, quality, style, width, height }: { src: string; alt: string; fill?: boolean; className?: string; priority?: boolean; sizes?: string; quality?: number; style?: CSSProperties; width?: number; height?: number }) {
  void sizes;
  void quality;
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : { ...style };
  return <img src={map[src] ?? src} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} className={className} style={s} loading={priority ? "eager" : "lazy"} decoding="async" />;
}
