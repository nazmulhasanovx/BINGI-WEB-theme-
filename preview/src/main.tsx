import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/fraunces";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/600.css";
import "./styles.css";
import { createRoot } from "react-dom/client";
import { useEffect, useState, type ReactNode } from "react";
import { split, useRoute } from "../shim/router";
import { NotFoundError } from "../shim/navigation";

import Index from "@/app/themes/page";
import ThemeLab from "@/app/theme-lab/page";
import RootNotFound from "@/app/not-found";
import HotelLayout from "@/app/hotel/[slug]/layout";
import HotelNotFound from "@/app/hotel/[slug]/not-found";
import Home from "@/app/hotel/[slug]/page";
import Rooms from "@/app/hotel/[slug]/rooms/page";
import Room from "@/app/hotel/[slug]/rooms/[room]/page";
import Stay from "@/app/hotel/[slug]/stay/page";
import Checkout from "@/app/hotel/[slug]/checkout/page";
import Confirmation from "@/app/hotel/[slug]/confirmation/page";
import Dining from "@/app/hotel/[slug]/dining/page";
import Experiences from "@/app/hotel/[slug]/experiences/page";
import Offers from "@/app/hotel/[slug]/offers/page";
import Explore from "@/app/hotel/[slug]/explore/page";
import Events from "@/app/hotel/[slug]/events/page";
import Policies from "@/app/hotel/[slug]/policies/page";
import MyTrip from "@/app/hotel/[slug]/my-trip/page";
import HmsLayout from "@/app/hms/layout";
import HmsHome from "@/app/hms/page";
import HmsModule from "@/app/hms/[module]/page";
import HmsWebsite from "@/app/hms/website/[page]/page";

(window as unknown as { __BINGI_SPA__: boolean }).__BINGI_SPA__ = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Comp = (p: any) => ReactNode | Promise<ReactNode>;
const PAGES: Record<string, Comp> = {
  "": Home, rooms: Rooms, stay: Stay, checkout: Checkout, confirmation: Confirmation, dining: Dining,
  experiences: Experiences, offers: Offers, explore: Explore, events: Events, policies: Policies, "my-trip": MyTrip,
};

async function resolve(route: string): Promise<ReactNode> {
  const { path } = split(route);
  const seg = path.split("/").filter(Boolean);
  if (seg.length === 0 || seg[0] === "themes") return await (Index as Comp)({});
  if (seg[0] === "theme-lab") return await (ThemeLab as Comp)({});
  if (seg[0] === "hms") {
    let page: ReactNode;
    try {
      if (seg[1] === "website") {
        if (!seg[2]) { location.replace("#/hms/website/overview"); return null; }
        page = await (HmsWebsite as Comp)({ params: Promise.resolve({ page: seg[2] }) });
      } else if (seg[1]) page = await (HmsModule as Comp)({ params: Promise.resolve({ module: seg[1] }) });
      else page = await (HmsHome as Comp)({});
    } catch (e) {
      if (!(e instanceof NotFoundError)) throw e;
      return <RootNotFound />;
    }
    return await (HmsLayout as Comp)({ children: page });
  }
  if (seg[0] !== "hotel" || !seg[1]) return <RootNotFound />;
  const slug = seg[1];
  const sub = seg.slice(2);
  let page: ReactNode;
  try {
    let P: Comp | undefined;
    let params: Record<string, string> = { slug };
    if (sub[0] === "rooms" && sub[1]) { P = Room; params = { slug, room: sub[1] }; }
    else if (sub.length <= 1) P = PAGES[sub[0] ?? ""];
    if (!P) throw new NotFoundError("");
    page = await P({ params: Promise.resolve(params) });
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
    page = <HotelNotFound />;
  }
  try {
    return await (HotelLayout as Comp)({ params: Promise.resolve({ slug }), children: page });
  } catch (e) {
    if (e instanceof NotFoundError) return <RootNotFound />;
    throw e;
  }
}

function App() {
  const route = useRoute();
  const path = split(route).path;
  const [el, setEl] = useState<ReactNode>(null);
  useEffect(() => {
    let live = true;
    resolve(route).then((n) => live && setEl(n));
    return () => { live = false; };
  // re-resolve only when the path changes; query changes are read by the components themselves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  useEffect(() => {
    // plain in-page anchors (#menu, #about…) scroll instead of changing the route
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a");
      const href = a?.getAttribute("href") ?? "";
      if (href.startsWith("#") && !href.startsWith("#/")) {
        e.preventDefault();
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return <>{el}</>;
}

createRoot(document.getElementById("root")!).render(<App />);
