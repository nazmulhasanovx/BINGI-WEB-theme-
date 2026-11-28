// Hash router: the whole app runs from one index.html inside the artifact frame.
import { useSyncExternalStore } from "react";

export const HOME = "/hms";
export function currentRoute(): string {
  const h = typeof location !== "undefined" ? location.hash : "";
  return h.startsWith("#/") ? h.slice(1) : HOME;
}
function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
export function useRoute() {
  return useSyncExternalStore(subscribe, currentRoute, () => HOME);
}
/** Turn "/x?y=1#z" or "./x" into a hash route; returns null for external links. */
export function toRoute(href: string): string | null {
  if (!href || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//")) return null;
  if (href.startsWith("#/")) return href.slice(1);
  if (href.startsWith("#")) return null;
  if (href.startsWith("?")) return split(currentRoute()).path + href;
  if (href.startsWith("/")) return href;
  return null;
}
export function go(path: string, replace = false) {
  if (replace) location.replace(`#${path}`);
  else {
    if (location.hash === `#${path}`) return;
    location.hash = path;
  }
}
export function split(route: string) {
  const [pq, anchor = ""] = route.split("#");
  const [path, query = ""] = pq.split("?");
  return { path: path.replace(/\/+$/, "") || "/", query, anchor };
}
// Route params of the current page (set by the app before rendering).
let params: Record<string, string> = {};
export const setParams = (p: Record<string, string>) => { params = p; };
export const getParams = () => params;
