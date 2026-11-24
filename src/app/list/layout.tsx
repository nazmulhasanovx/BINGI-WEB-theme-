import type { Metadata } from "next";

export const metadata: Metadata = { title: "BinGi Marketplace — List your property (prototype)", robots: { index: false } };

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
