// Website Management — 6 pages, kept simple on purpose (Nazmul, 9 Nov: "easy to use, not complex").
import { Eye, Globe2, LayoutTemplate, Palette, Rows3, Settings2 } from "lucide-react";

export type WmPage = { id: string; label: string; icon: typeof Globe2 };

export const WM_PAGES: WmPage[] = [
  { id: "overview", label: "Overview", icon: Globe2 },
  { id: "design", label: "Design", icon: Palette },
  { id: "homepage", label: "Homepage", icon: LayoutTemplate },
  { id: "content", label: "Content", icon: Rows3 },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "publish", label: "Publish", icon: Eye },
];
