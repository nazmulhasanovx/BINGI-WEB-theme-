import { Suspense } from "react";
import { ListPage } from "@/components/hms/bookings/list";

export default function Page() {
  return <Suspense><ListPage /></Suspense>;
}
