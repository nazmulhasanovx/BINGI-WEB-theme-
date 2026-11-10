// Re-mounts on every HMS navigation, so each page enters with a short fade (off with reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="hms-page-in h-full">{children}</div>;
}
