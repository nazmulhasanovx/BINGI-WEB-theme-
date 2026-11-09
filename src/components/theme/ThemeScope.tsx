import type { CSSProperties, ReactNode } from "react";
import { tokensFor, type ThemeId } from "@/lib/theme";

/** Applies a hotel's colour theme to everything inside it (server-rendered, no flash). */
export function ThemeScope({
  themeId,
  heading,
  children,
}: {
  themeId: ThemeId;
  heading: "sans" | "serif";
  children: ReactNode;
}) {
  return (
    <div id="hotel-theme" data-theme={themeId} data-heading={heading} style={tokensFor(themeId) as CSSProperties}>
      {children}
    </div>
  );
}
