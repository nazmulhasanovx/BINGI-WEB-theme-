import { forwardRef, type AnchorHTMLAttributes } from "react";
import { go, toRoute } from "./router";

type Href = string | { pathname?: string; query?: Record<string, string | number | undefined>; hash?: string };
const str = (h: Href) => typeof h === "string" ? h : `${h.pathname ?? ""}${h.query ? "?" + new URLSearchParams(Object.entries(h.query).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString() : ""}${h.hash ? "#" + h.hash : ""}`;
type P = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: Href; prefetch?: boolean; scroll?: boolean; replace?: boolean };
const Link = forwardRef<HTMLAnchorElement, P>(function Link({ href, onClick, prefetch, scroll, replace, ...rest }, ref) {
  void prefetch; void scroll;
  const h = str(href);
  const r = toRoute(h);
  return (
    <a ref={ref} {...rest} href={r ? `#${r}` : h}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !r || e.metaKey || e.ctrlKey || rest.target === "_blank") return;
        e.preventDefault();
        go(r, replace);
      }} />
  );
});
export default Link;
