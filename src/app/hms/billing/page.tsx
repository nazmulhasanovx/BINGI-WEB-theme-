import { Suspense } from "react";
import { BillingRoute } from "@/components/hms/settings/billing";

export default function Page() {
  return <Suspense fallback={null}><BillingRoute /></Suspense>;
}
