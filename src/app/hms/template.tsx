import { ViewTransition } from "react";

// Re-mounts on every HMS navigation. Browsers with view transitions crossfade old → new page (sidebar and header
// stay still); others get a short CSS fade. Both are off with reduced motion.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition default="hms-route">
      <div className="hms-route hms-page-in h-full">{children}</div>
    </ViewTransition>
  );
}
