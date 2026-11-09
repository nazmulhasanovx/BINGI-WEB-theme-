import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("mx-auto w-full max-w-[1240px] px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionHead({
  eyebrow,
  title,
  sub,
  link,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-action">{eyebrow}</p>}
        <h2 className="text-2xl font-bold md:text-[32px] md:leading-tight">{title}</h2>
        {sub && <p className="mt-2 max-w-xl text-[15px] text-muted md:text-base">{sub}</p>}
      </div>
      {link && (
        <Link href={link.href} className="group hidden shrink-0 items-center gap-1.5 text-[15px] font-semibold text-action sm:flex">
          {link.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function MobileMore({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-[15px] font-semibold text-action sm:hidden">
      {label} <ArrowRight className="size-4" />
    </Link>
  );
}
