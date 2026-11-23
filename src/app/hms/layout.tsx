import type { Metadata, Viewport } from "next";
import { HmsShell } from "@/components/hms/Shell";

export const metadata: Metadata = {
  title: "BinGi HMS — Website (prototype)", robots: { index: false },
  // Installable as an app (PWA): own window, BinGi HMS icon, shortcuts. Icons: official app icon (src/app/hms/icon.png).
  manifest: "/hms.webmanifest", applicationName: "BinGi HMS",
  appleWebApp: { capable: true, title: "BinGi HMS", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function HmsLayout({ children }: LayoutProps<"/hms">) {
  return <HmsShell>{children}</HmsShell>;
}
