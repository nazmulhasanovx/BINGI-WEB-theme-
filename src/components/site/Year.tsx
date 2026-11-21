"use client";
import { useEffect, useState } from "react";
/** Current year for the footer © line, filled in on the client so pages stay static. */
export function Year() {
  const [y, setY] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the year must be read after prerender
  useEffect(() => setY(new Date().getFullYear()), []);
  return <>{y ?? ""}</>;
}
