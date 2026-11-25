import { useMemo } from "react";
import { getParams, go, split, toRoute, useRoute } from "./router";

export class NotFoundError extends Error {}
export class RedirectError extends Error { constructor(public to: string) { super("redirect"); } }
export function notFound(): never { throw new NotFoundError("not found"); }
export function redirect(path: string): never { throw new RedirectError(path); }
export function permanentRedirect(path: string): never { throw new RedirectError(path); }
const nav = (href: string, replace?: boolean) => { const r = toRoute(href); if (r) go(r, replace); else if (href) window.open(href, "_blank"); };
export function useRouter() {
  return useMemo(() => ({ push: (p: string) => nav(p), replace: (p: string) => nav(p, true), back: () => history.back(), forward: () => history.forward(), refresh: () => {}, prefetch: () => {} }), []);
}
export function usePathname() { return split(useRoute()).path; }
export function useSearchParams() {
  const q = split(useRoute()).query;
  return useMemo(() => new URLSearchParams(q), [q]);
}
export function useParams<T = Record<string, string>>(): T { useRoute(); return getParams() as T; }
export function useSelectedLayoutSegment() { return split(useRoute()).path.split("/").filter(Boolean)[1] ?? null; }
