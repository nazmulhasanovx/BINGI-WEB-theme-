import { notFound } from "next/navigation";
import { getHotel } from "@/lib/data";
import { PageHero } from "@/components/site/PageHero";
import { ButtonLink } from "@/components/ui/Button";

// Preview-only stand-in for pages that are scheduled in later build phases.
// Each real page replaces this as its phase lands.
const PHASES: Record<string, { title: string; phase: string; photo?: string }> = {
  dining: { title: "Dining", phase: "B4", photo: "/demo/azure-bay/dining-hero.jpg" },
  experiences: { title: "Experiences", phase: "B4", photo: "/demo/azure-bay/exp-island.jpg" },
  offers: { title: "Offers", phase: "B4", photo: "/demo/azure-bay/offer-escape.jpg" },
  explore: { title: "Explore the resort", phase: "B5", photo: "/demo/azure-bay/about-video.jpg" },
  policies: { title: "Policies", phase: "B5" },
  "my-trip": { title: "My Trip", phase: "B6" },
};

export function generateStaticParams() {
  return Object.keys(PHASES).map((k) => ({ rest: [k] }));
}

export default async function Upcoming(props: PageProps<"/hotel/[slug]/[...rest]">) {
  const { slug, rest } = await props.params;
  const hotel = await getHotel(slug);
  const info = PHASES[rest[0]];
  if (!hotel || !info) notFound();
  return (
    <>
      <PageHero eyebrow={hotel.name} title={info.title} photo={info.photo} />
      <div className="mx-auto max-w-[1240px] px-4 py-14 sm:px-6">
        <div className="max-w-lg rounded-3xl border border-dashed border-brand-ring bg-surface p-6">
          <p className="text-sm font-semibold text-action">Preview build</p>
          <p className="mt-1 text-[15px] text-muted">This page is built in phase {info.phase} of the GRAND theme.</p>
          <ButtonLink href={`/hotel/${slug}`} variant="outline" className="mt-4">Back to Home</ButtonLink>
        </div>
      </div>
    </>
  );
}
