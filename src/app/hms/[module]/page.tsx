import { notFound } from "next/navigation";
import { ModulePlaceholder } from "@/components/hms/Placeholder";

const MODULES = ["bookings", "housekeeping", "guests", "chat", "meals", "guest-reviews", "inventory", "other-services", "discounts", "payments", "cashbox", "finance", "operations", "billing", "reports", "communication", "settings"];

export function generateStaticParams() {
  return MODULES.map((module) => ({ module }));
}

export default async function ModulePage(props: PageProps<"/hms/[module]">) {
  const { module } = await props.params;
  if (!MODULES.includes(module)) notFound();
  return <ModulePlaceholder id={module} />;
}
