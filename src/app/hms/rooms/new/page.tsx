import { Suspense } from "react";
import { AddV8Page } from "@/components/hms/rooms/setup-v8";

export default function Page() {
  return <Suspense fallback={null}><AddV8Page /></Suspense>;
}
