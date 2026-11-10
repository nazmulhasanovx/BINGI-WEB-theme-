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
import { OverviewPage as StaffOverview } from "@/components/hms/staff/overview";
import { PeoplePage, EmployeePage } from "@/components/hms/staff/people";
import { AttendancePage } from "@/components/hms/staff/attendance";
import { SchedulePage } from "@/components/hms/staff/schedule";
import { LeavePage } from "@/components/hms/staff/leave";
import { PayrollPage, PayrollRunPage } from "@/components/hms/staff/payroll";
import { HiringPage, CandidatePage } from "@/components/hms/staff/hiring";
import { OperationsPage } from "@/components/hms/staff/operations";
import { GuestsPage } from "@/components/hms/guests/list";
import { CatalogPage as SvcCatalog, OrdersPage as SvcOrders, CategoriesPage as SvcCategories } from "@/components/hms/services/pages";
import { StockPage as InvStock, HistoryPage as InvHistory, ReportsPage as InvReports, SetupPage as InvSetup } from "@/components/hms/inventory/pages";
import { GuestProfilePage } from "@/components/hms/guests/profile";
import { ReviewsPage as GuestReviewsPage } from "@/components/hms/guests/reviews";
import { SettingsPage as StaffSettings } from "@/components/hms/staff/settings";
import { UnitsPage, CategoriesPage, ConfigurationPage } from "@/components/hms/rooms/pages";
import { SetupPage as RoomsSetup } from "@/components/hms/rooms/setup";
import { AddPage as RoomsAdd } from "@/components/hms/rooms/wizard";
import { OnboardingHome } from "@/components/onboarding/auth";
import { OnboardingFlow } from "@/components/onboarding/flow";
import { OnboardingStatus } from "@/components/onboarding/status";
const STAFF: Record<string, () => ReactNode> = { "": () => <StaffOverview />, people: () => <PeoplePage />, attendance: () => <AttendancePage />, schedule: () => <SchedulePage />, leave: () => <LeavePage />, payroll: () => <PayrollPage />, hiring: () => <HiringPage />, operations: () => <OperationsPage />, settings: () => <StaffSettings /> };

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
  if (seg[0] === "onboarding") {
    const key = seg.slice(1).join("/");
    const O: Record<string, () => ReactNode> = { "": () => <OnboardingHome />, flow: () => <OnboardingFlow />, status: () => <OnboardingStatus /> };
    return O[key] ? O[key]() : <RootNotFound />;
  }
  if (seg[0] === "hms") {
    let page: ReactNode;
    try {
      if (seg[1] === "website") {
        if (!seg[2]) { location.replace("#/hms/website/overview"); return null; }
        page = await (HmsWebsite as Comp)({ params: Promise.resolve({ page: seg[2] }) });
      } else if (seg[1] === "staff") {
        const [sec = "", id] = seg.slice(2);
        if (id && sec === "people") page = <EmployeePage key={id} id={id} />;
        else if (id && sec === "payroll") page = <PayrollRunPage key={id} id={id} />;
        else if (id && sec === "hiring") page = <CandidatePage key={id} id={id} />;
        else if (STAFF[sec] && !id) page = STAFF[sec]();
        else throw new NotFoundError("not found");
      } else if (seg[1] === "other-services") {
        const O: Record<string, () => ReactNode> = { "": () => <SvcCatalog />, orders: () => <SvcOrders />, categories: () => <SvcCategories /> };
        const sec = seg[2] ?? "";
        if (!O[sec] || seg[3]) throw new NotFoundError("not found");
        page = O[sec]();
      } else if (seg[1] === "inventory") {
        const I: Record<string, () => ReactNode> = { "": () => <InvStock />, history: () => <InvHistory />, reports: () => <InvReports />, setup: () => <InvSetup /> };
        const sec = seg[2] ?? "";
        if (!I[sec] || seg[3]) throw new NotFoundError("not found");
        page = I[sec]();
      } else if (seg[1] === "guests" || seg[1] === "guest-reviews") {
        const sec = seg[1] === "guest-reviews" ? "reviews" : (seg[2] ?? "");
        if (seg[3]) throw new NotFoundError("not found");
        page = sec === "" ? <GuestsPage /> : sec === "reviews" ? <GuestReviewsPage /> : <GuestProfilePage key={sec} id={decodeURIComponent(sec)} />;
      } else if (seg[1] === "rooms") {
        const R: Record<string, () => ReactNode> = { "": () => <UnitsPage />, categories: () => <CategoriesPage />, configuration: () => <ConfigurationPage />, setup: () => <RoomsSetup />, new: () => <RoomsAdd /> };
        const sec = seg[2] ?? "";
        if (!R[sec] || seg[3]) throw new NotFoundError("not found");
        page = R[sec]();
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
