import { notFound } from "next/navigation";
import { ModulePlaceholder } from "@/components/hms/Placeholder";

const MODULES = ["chat"];

export function generateStaticParams() {
  return MODULES.map((module) => ({ module }));
}

export default async function ModulePage(props: PageProps<"/hms/[module]">) {
  const { module } = await props.params;
  if (!MODULES.includes(module)) notFound();
  return <ModulePlaceholder id={module} />;
}
