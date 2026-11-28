import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/playfair-display";
import "@fontsource/anton";
import "@fontsource-variable/archivo";
import "@fontsource/dm-serif-display";
import "@fontsource/dm-serif-display/400-italic.css";
import "@fontsource-variable/montserrat";
import "@fontsource-variable/lora";
import "@fontsource-variable/lora/wght-italic.css";
import "@fontsource-variable/caveat";
import "@fontsource-variable/nunito";
import "@fontsource/alfa-slab-one";
import "@fontsource-variable/nunito-sans";
import "@fontsource/archivo-black";
import "@fontsource-variable/space-grotesk";
import "@fontsource/permanent-marker";
import "@fontsource/libre-baskerville";
import "@fontsource/libre-baskerville/400-italic.css";
import "@fontsource/satisfy";
import "@fontsource/gilda-display";
import "@fontsource-variable/karla";
import "@fontsource/young-serif";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource/italiana";
import "@fontsource-variable/manrope";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@fontsource-variable/work-sans";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/outfit";
import "@fontsource-variable/figtree";
import "@fontsource-variable/mulish";
import "@fontsource-variable/sora";
import "@fontsource-variable/rubik";
import "@fontsource-variable/quicksand";
import "@fontsource-variable/jost";
import "@fontsource/marcellus";
import "@fontsource/spectral/500.css";
import "@fontsource/spectral/500-italic.css";
import "@fontsource-variable/literata";
import "@fontsource-variable/literata/wght-italic.css";
import "@fontsource/rozha-one";
import "@fontsource/prata";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/600.css";
import "./styles.css";
import { createRoot } from "react-dom/client";
import { Component, createElement, isValidElement, cloneElement, useEffect, useState, type ReactNode } from "react";
import { currentRoute, go, setParams, split, toRoute, useRoute, HOME } from "./shim/router";
import { NotFoundError, RedirectError } from "./shim/navigation";

(window as unknown as { __BINGI_SPA__: boolean }).__BINGI_SPA__ = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Mod = { default: (p: any) => any };
const pages = import.meta.glob<Mod>("../../src/app/**/page.tsx");
const layouts = import.meta.glob<Mod>("../../src/app/**/layout.tsx");
const templates = import.meta.glob<Mod>("../../src/app/**/template.tsx");
const notFounds = import.meta.glob<Mod>("../../src/app/**/not-found.tsx");
const dirOf = (k: string) => k.replace("../../src/app", "").replace(/\/(page|layout|template|not-found)\.tsx$/, "") || "";

type Route = { segs: string[]; dir: string; load: () => Promise<Mod>; score: number };
const ROUTES: Route[] = Object.entries(pages).map(([k, load]) => {
  const dir = dirOf(k);
  const segs = dir.split("/").filter(Boolean).filter((s) => !/^\(.*\)$/.test(s));
  const score = segs.reduce((a, s) => a * 3 + (s.startsWith("[") ? 1 : 2), 1);
  return { segs, dir, load, score };
}).sort((a, b) => b.segs.length - a.segs.length || b.score - a.score);

function match(path: string): { r: Route; params: Record<string, string> } | null {
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  let best: { r: Route; params: Record<string, string>; score: number } | null = null;
  for (const r of ROUTES) {
    if (r.segs.length !== parts.length) continue;
    const params: Record<string, string> = {};
    let ok = true;
    r.segs.forEach((s, i) => { if (!ok) return; if (s.startsWith("[")) params[s.slice(1, -1)] = parts[i]; else if (s !== parts[i]) ok = false; });
    if (ok && (!best || r.score > best.score)) best = { r, params, score: r.score };
  }
  return best;
}

const isAsync = (f: unknown) => typeof f === "function" && f.constructor?.name === "AsyncFunction";
/** Render server-style async components ahead of time (the client cannot render them). */
async function deep(n: ReactNode): Promise<ReactNode> {
  if (Array.isArray(n)) return Promise.all(n.map(deep));
  if (!isValidElement(n)) return n;
  const el = n as React.ReactElement<{ children?: ReactNode }>;
  if (isAsync(el.type)) return deep(await (el.type as (p: unknown) => Promise<ReactNode>)(el.props));
  if (el.props && "children" in el.props && el.props.children !== undefined) {
    const c = await deep(el.props.children);
    return cloneElement(el, undefined, c);
  }
  return el;
}
async function call(m: Mod | undefined, props: Record<string, unknown>): Promise<ReactNode> {
  if (!m?.default) return null;
  return isAsync(m.default) ? deep(await m.default(props)) : createElement(m.default, props);
}

async function notFoundFor(dir: string): Promise<ReactNode> {
  const parts = dir.split("/");
  for (let i = parts.length; i >= 1; i--) {
    const d = parts.slice(0, i).join("/");
    const k = `../../src/app${d}/not-found.tsx`;
    if (notFounds[k]) return call(await notFounds[k](), {});
  }
  return call(await notFounds["../../src/app/not-found.tsx"]?.(), {});
}

async function resolve(path: string): Promise<ReactNode> {
  const m = match(path);
  if (!m) return notFoundFor("");
  setParams(m.params);
  const params = Promise.resolve(m.params);
  const sp = Promise.resolve(Object.fromEntries(new URLSearchParams(split(currentRoute()).query)));
  let node: ReactNode;
  try { node = await call(await m.r.load(), { params, searchParams: sp }); }
  catch (e) { if (e instanceof NotFoundError) node = await notFoundFor(m.r.dir); else throw e; }
  // wrap in template + layout of every parent folder, innermost first (root layout renders <html>, skipped)
  const parts = m.r.dir.split("/").filter(Boolean);
  for (let i = parts.length; i >= 1; i--) {
    const d = "/" + parts.slice(0, i).join("/");
    const t = templates[`../../src/app${d}/template.tsx`];
    if (t) node = await call(await t(), { children: node });
    const l = layouts[`../../src/app${d}/layout.tsx`];
    if (l) {
      const lp: Record<string, string> = {};
      parts.slice(0, i).forEach((s, j) => { if (s.startsWith("[")) lp[s.slice(1, -1)] = m.params[s.slice(1, -1)]; });
      try { node = await call(await l(), { children: node, params: Promise.resolve(lp) }); }
      catch (e) { if (e instanceof NotFoundError) return notFoundFor(""); throw e; }
    }
  }
  return node;
}

class Boundary extends Component<{ children: ReactNode; k: string }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidUpdate(p: { k: string }) { if (p.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  componentDidCatch(err: Error) { if (err instanceof RedirectError) { const r = toRoute(err.to); if (r) go(r, true); } }
  render() {
    const e = this.state.err;
    if (!e) return this.props.children;
    if (e instanceof RedirectError) return null;
    return <div style={{ padding: 32, font: "15px system-ui" }}><b>This screen could not open in the preview.</b><pre style={{ whiteSpace: "pre-wrap", color: "#8e1621" }}>{String(e.message)}</pre><a href={`#${HOME}`}>Back to HMS</a></div>;
  }
}

function Crash({ e }: { e: Error }): ReactNode { throw e; }

function App() {
  const route = useRoute();
  const { path, anchor } = split(route);
  const [el, setEl] = useState<ReactNode>(null);
  useEffect(() => {
    let live = true;
    resolve(path).then((n) => { if (!live) return; setEl(n); if (!anchor) window.scrollTo(0, 0); else requestAnimationFrame(() => document.getElementById(anchor)?.scrollIntoView()); })
      .catch((e) => { if (e instanceof RedirectError) { const r = toRoute(e.to); if (r) go(r, true); } else if (live) setEl(<Crash e={e as Error} />); });
    return () => { live = false; };
  }, [path, anchor]);
  useEffect(() => {
    // Plain <a href="/hms/..."> and in-page anchors inside the frame.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href") ?? "";
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      if (href.startsWith("#") && !href.startsWith("#/")) { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
      const r = toRoute(href);
      if (r) { e.preventDefault(); go(r); }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return <Boundary k={path}>{el}</Boundary>;
}

createRoot(document.getElementById("root")!).render(<App />);
