"use client";
import Link from "next/link";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BedDouble, CircleCheck, History, Lock, MoreHorizontal, Package, Pencil, Plus, RefreshCw, Search, Shirt, Sparkles, Tag } from "lucide-react";
import { hasServices, orderTotal, tk, useServices, whenLabel, type Order, type Service, type SvcCategory } from "@/lib/services/store";
import { TODAY } from "@/lib/rooms/store";
import { useProperty } from "../property";
import { btnIcon, btnLine, btnPrimary } from "../guests/ui";
import { CancelSheet, CategorySheet, DetailsSheet, OrderSheet, PayPill, PreviewSheet, ServiceSheet } from "./sheets";

type Open = { k: "service"; item?: Service } | { k: "order"; order?: Order; service?: string } | { k: "details"; id: string } | { k: "cancel"; id: string } | { k: "cat"; cat?: SvcCategory } | { k: "preview"; id: string };
type Ctx = { svc: ReturnType<typeof useServices>; open: (o: Open) => void };
const C = createContext<Ctx | null>(null);
const useSvc = () => useContext(C)!;
type Tab = "catalog" | "orders" | "categories";
const TABS: { id: Tab; label: string; href: string; icon: typeof Package }[] = [
  { id: "catalog", label: "Service Catalog", href: "/hms/other-services", icon: Package },
  { id: "orders", label: "Order History", href: "/hms/other-services/orders", icon: History },
  { id: "categories", label: "Categories", href: "/hms/other-services/categories", icon: Tag },
];
const card = "rounded-xl border border-hms-line bg-white";
const sel = "h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px] outline-none focus:border-hms-ink";
const ICON: Record<string, [typeof Package, string]> = { t: [BedDouble, "bg-[#e8f0fe] text-[#1d4ed8]"], g: [Shirt, "bg-[#f1edff] text-[#6b55e0]"], e: [Sparkles, "bg-[#fdefe7] text-[#d9622b]"] };
const iconFor = (cat: string) => ICON[cat] ?? [Package, "bg-hms-hover text-[#4d5664]"];

function Frame({ tab, children }: { tab: Tab; children: ReactNode }) {
  const h = useProperty();
  const svc = useServices(h);
  const [o, setO] = useState<Open | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2600); return () => clearTimeout(t); }, [toast]);
  if (!hasServices(h)) return (
    <div className="h-full overflow-y-auto"><div className="mx-auto max-w-[720px] p-6"><div className="mt-10 rounded-2xl border border-hms-line bg-white p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hms-coral-soft text-hms-red"><Lock className="size-7" /></span>
      <h1 className="mt-4 text-[22px] font-bold">Other Services is part of Business</h1>
      <p className="mx-auto mt-2 max-w-[440px] text-[14.5px] text-hms-muted">Sell airport transfers, laundry, extra beds and experiences, and charge them to the guest’s booking. {h.name} is on the Starter plan.</p>
      <Link href="/hms/billing" className={clsx(btnPrimary, "mt-5")}>See Business plan</Link>
    </div></div></div>
  );
  const get = (id: string) => svc.st.orders.find((x) => x.id === id);
  const det = o?.k === "details" || o?.k === "cancel" ? get(o.id) : undefined;
  const prev = o?.k === "preview" ? svc.st.services.find((x) => x.id === o.id) : undefined;
  return (
    <C.Provider value={{ svc, open: setO }}>
      <div className="h-full overflow-y-auto"><div className="mx-auto max-w-[1280px] p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-[24px] font-bold tracking-[-0.01em]">Other Services</h1><p className="text-[14px] text-hms-muted">Manage your service catalog and record guest service orders.</p></div>
          <div className="flex flex-wrap gap-2">
            {tab === "categories" ? <button onClick={() => setO({ k: "cat" })} className={btnLine}><Plus className="size-4" />Add Category</button> : <button onClick={() => setO({ k: "service" })} className={btnLine}><Plus className="size-4" />Add Service</button>}
            <button onClick={() => setO({ k: "order" })} className={btnPrimary}><Plus className="size-4" />New Service Order</button>
            <button onClick={() => setToast("Up to date")} aria-label="Refresh" className={btnIcon}><RefreshCw className="size-4" /></button>
          </div>
        </div>
        <nav aria-label="Other Services sections" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-hms-line">
          {TABS.map((t) => <Link key={t.id} href={t.href} aria-current={tab === t.id ? "page" : undefined} className={clsx("-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-[14.5px] font-semibold", tab === t.id ? "border-hms-red text-hms-ink" : "border-transparent text-hms-muted hover:text-hms-ink")}><t.icon className="size-4" />{t.label}</Link>)}
        </nav>
        <div className="mt-5">{children}</div>
      </div></div>
      {o?.k === "service" && <ServiceSheet svc={svc} item={o.item} onClose={() => setO(null)} />}
      {o?.k === "order" && <OrderSheet svc={svc} order={o.order} serviceId={o.service} onClose={() => setO(null)} onDone={(_, m) => setToast(m)} />}
      {o?.k === "details" && det && <DetailsSheet svc={svc} order={det} onClose={() => setO(null)} onEdit={() => setO({ k: "order", order: det })} onCancel={() => setO({ k: "cancel", id: det.id })} />}
      {o?.k === "cancel" && det && <CancelSheet svc={svc} order={det} onClose={() => setO(null)} onDone={setToast} />}
      {o?.k === "cat" && <CategorySheet svc={svc} cat={o.cat} onClose={() => setO(null)} />}
      {o?.k === "preview" && prev && <PreviewSheet svc={svc} item={prev} onClose={() => setO(null)} onBack={() => setO({ k: "service", item: prev })} />}
      {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><CircleCheck className="size-4 text-[#7ee2a8]" />{toast}</div>}
    </C.Provider>
  );
}

function Menu({ label, items }: { label: string; items: [string, () => void, boolean?][] }) {
  const [m, setM] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!m) return; const c = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setM(false); }; document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, [m]);
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setM((x) => !x)} aria-haspopup="menu" aria-expanded={m} aria-label={label} className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><MoreHorizontal className="size-4" /></button>
      {m && <div role="menu" className="hms-pop absolute right-0 top-10 z-20 w-48 rounded-xl border border-hms-line bg-white p-1 text-left shadow-lg">{items.map(([l, f, danger]) => <button key={l} role="menuitem" onClick={() => { setM(false); f(); }} className={clsx("block w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-hms-hover", danger && "text-[#c81e1e]")}>{l}</button>)}</div>}
    </div>
  );
}
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-hms-line bg-white px-3 focus-within:border-hms-ink sm:flex-none"><Search className="size-4 text-hms-muted" /><span className="sr-only">{placeholder}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none" /></label>;
}

// ---------------- Catalog ----------------
export function CatalogPage() { const sp = useSearchParams(); return <Frame tab="catalog"><Catalog key={sp.get("category") ?? ""} /></Frame>; }
function Catalog() {
  const { svc, open } = useSvc();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState(sp.get("category") ?? "");
  const [st, setSt] = useState<"active" | "archived" | "all">("active");
  const cats = new Map(svc.st.categories.map((c) => [c.id, c.name]));
  const list = svc.st.services.filter((s) => (st === "all" || (st === "archived") === !!s.archived) && (!cat || s.category === cat) && (!q || s.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <section className={clsx(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="mr-auto"><h2 className="text-[17px] font-bold">Service Catalog</h2><p className="text-[13px] text-hms-muted">Browse services and start an order from the list.</p></div>
        <SearchBox value={q} onChange={setQ} placeholder="Search services" />
        <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className={sel}><option value="">All categories</option>{svc.st.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select aria-label="Status" value={st} onChange={(e) => setSt(e.target.value as typeof st)} className={clsx(sel, st === "archived" && "border-[#e9b949] bg-[#fffaf0]")}><option value="active">Active services</option><option value="archived">Archived</option><option value="all">All services</option></select>
      </div>
      {list.length ? (
        <div className="overflow-x-auto border-t border-hms-line" tabIndex={0} role="region" aria-label="Services">
          <table className="w-full min-w-[820px] text-[14px]">
            <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">Service</th><th className="px-3 py-2.5 font-medium">Category</th><th className="px-3 py-2.5 font-medium">Duration</th><th className="px-3 py-2.5 text-right font-medium">Unit Price</th><th className="px-3 py-2.5 font-medium">Status</th><th className="px-5 py-2.5 text-right font-medium">Actions</th></tr></thead>
            <tbody>{list.map((s) => { const [I, tone] = iconFor(s.category); return (
              <tr key={s.id} className="border-t border-hms-line">
                <td className="px-5 py-2.5"><span className="flex items-center gap-3"><span className={clsx("grid size-9 shrink-0 place-items-center rounded-lg", tone)}><I className="size-4" /></span><span><span className="block font-semibold">{s.name}</span>{s.image && !s.archived && <span className="text-[12px] text-[#16693a]">On website</span>}</span></span></td>
                <td className="px-3 py-2.5">{cats.get(s.category) ?? "—"}</td><td className="px-3 py-2.5">{s.duration || "—"}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums">{tk(s.price)}</td>
                <td className="px-3 py-2.5">{s.archived ? <span className="inline-flex items-center gap-1.5 rounded-md bg-hms-hover px-2 py-0.5 text-[12.5px] font-semibold text-[#4d5664]"><span className="size-1.5 rounded-full bg-current" />Archived</span> : <span className="inline-flex items-center gap-1.5 rounded-md bg-[#e5f5ec] px-2 py-0.5 text-[12.5px] font-semibold text-[#16693a]"><span className="size-1.5 rounded-full bg-current" />Active</span>}</td>
                <td className="px-5 py-2.5"><span className="flex justify-end gap-2">
                  {!s.archived && <button onClick={() => open({ k: "order", service: s.id })} aria-label={`Order ${s.name}`} className={clsx(btnLine, "h-9 px-3")}><Plus className="size-4" />Order</button>}
                  <button onClick={() => open({ k: "service", item: s })} aria-label={`Edit ${s.name}`} className="grid size-9 place-items-center rounded-lg border border-hms-line bg-white hover:bg-hms-hover"><Pencil className="size-4" /></button>
                  <Menu label={`More for ${s.name}`} items={[["Website preview", () => open({ k: "preview", id: s.id })], s.archived ? ["Restore service", () => svc.setArchived(s.id, false)] : ["Archive service", () => svc.setArchived(s.id, true), true]]} />
                </span></td>
              </tr>); })}</tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-hms-line px-6 py-14 text-center"><p className="text-[16px] font-semibold">{st === "archived" ? "No archived services" : "No services found"}</p><p className="mt-1 text-[14px] text-hms-muted">{q ? "Try another name." : "Add your first service, like an airport transfer."}</p>
          {!q && st !== "archived" && <button onClick={() => open({ k: "service" })} className={clsx(btnPrimary, "mt-4")}><Plus className="size-4" />Add Service</button>}</div>
      )}
      <p className="border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">{list.length} {st === "all" ? "" : st} service{list.length === 1 ? "" : "s"}</p>
    </section>
  );
}

// ---------------- Orders ----------------
export function OrdersPage() { return <Frame tab="orders"><Orders /></Frame>; }
function Orders() {
  const { svc, open } = useSvc();
  const [q, setQ] = useState("");
  const [pay, setPay] = useState("");
  const [d, setD] = useState("");
  const name = (id: string) => svc.st.services.find((s) => s.id === id)?.name ?? "Service";
  const list = svc.st.orders.filter((o) => {
    if (pay === "Cancelled" ? !o.cancelled : pay && (o.cancelled || o.payment !== pay)) return false;
    if (d && o.created.slice(0, 10) !== d && !(o.when !== "now" && o.when.date === d)) return false;
    const k = q.toLowerCase();
    return !k || `${o.id} ${name(o.service)} ${o.booking?.code ?? ""} ${o.booking?.guest ?? ""} ${o.walkIn?.name ?? ""}`.toLowerCase().includes(k);
  });
  const unpaid = svc.st.orders.filter((o) => !o.cancelled && o.payment === "Unpaid").reduce((s, o) => s + orderTotal(o), 0);
  const today = svc.st.orders.filter((o) => !o.cancelled && o.created.startsWith(TODAY));
  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[["Orders today", String(today.length)], ["Sales today", tk(today.reduce((s, o) => s + orderTotal(o), 0))], ["Unpaid on bookings", tk(unpaid)]].map(([k, v]) => <div key={k} className={clsx(card, "px-3 py-2.5 sm:px-4 sm:py-3")}><p className="text-[12px] text-hms-muted sm:text-[13px]">{k}</p><p className="text-[16px] font-bold tabular-nums sm:text-[22px]">{v}</p></div>)}
      </div>
      <section className={clsx(card, "overflow-hidden")}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="mr-auto"><h2 className="text-[17px] font-bold">Order History</h2><p className="text-[13px] text-hms-muted">Find service orders and check how each one was charged.</p></div>
          <SearchBox value={q} onChange={setQ} placeholder="Search order, booking or service" />
          <select aria-label="Payment" value={pay} onChange={(e) => setPay(e.target.value)} className={sel}><option value="">All payments</option><option>Unpaid</option><option>Paid</option><option>Cancelled</option></select>
          <input type="date" aria-label="Date" value={d} onChange={(e) => setD(e.target.value)} className={sel} />{d && <button onClick={() => setD("")} className="text-[13.5px] font-semibold text-hms-red">All dates</button>}
        </div>
        {list.length ? (
          <div className="overflow-x-auto border-t border-hms-line" tabIndex={0} role="region" aria-label="Orders">
            <table className="w-full min-w-[860px] text-[14px]">
              <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">Service / Order</th><th className="px-3 py-2.5 font-medium">Booking / Walk-in</th><th className="px-3 py-2.5 font-medium">Requested Time</th><th className="px-3 py-2.5 font-medium">Payment</th><th className="px-3 py-2.5 text-right font-medium">Total</th><th className="px-5 py-2.5 text-right font-medium">Actions</th></tr></thead>
              <tbody>{list.map((o) => (
                <tr key={o.id} className={clsx("border-t border-hms-line", o.cancelled && "text-hms-muted")}>
                  <td className="px-5 py-2.5"><span className="block font-semibold">{name(o.service)}</span><span className="text-[12.5px] text-hms-muted">{o.id}</span></td>
                  <td className="px-3 py-2.5">{o.method === "booking" ? <><span className="block font-semibold">{o.booking?.code}</span><span className="text-[12.5px] text-hms-muted">Room {o.booking?.room} · {o.booking?.guest}</span></> : <><span className="block font-semibold">Walk-in</span><span className="text-[12.5px] text-hms-muted">Cash sale{o.walkIn?.name && o.walkIn.name !== "Walk-in Guest" ? ` · ${o.walkIn.name}` : ""}</span></>}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">{whenLabel(o)}</td>
                  <td className="px-3 py-2.5"><PayPill o={o} /></td>
                  <td className={clsx("whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums", o.cancelled && "line-through")}>{tk(orderTotal(o))}</td>
                  <td className="px-5 py-2.5"><span className="flex justify-end gap-2">
                    <button onClick={() => open({ k: "details", id: o.id })} className={clsx(btnLine, "h-9 px-3")}>View Details</button>
                    <Menu label={`More for ${o.id}`} items={[
                      ...(!o.cancelled && o.method === "booking" && o.payment === "Unpaid" ? [["Edit order", () => open({ k: "order", order: o })] as [string, () => void]] : []),
                      ...(!o.cancelled ? [["Cancel order", () => open({ k: "cancel", id: o.id }), true] as [string, () => void, boolean]] : []),
                      ["View details", () => open({ k: "details", id: o.id })],
                    ]} />
                  </span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="border-t border-hms-line px-5 py-12 text-center text-[14px] text-hms-muted">No orders match these filters.</p>}
        <p className="border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">{list.length} service order{list.length === 1 ? "" : "s"} · booking charges are paid with the booking at checkout</p>
      </section>
    </>
  );
}

// ---------------- Categories ----------------
export function CategoriesPage() { return <Frame tab="categories"><Categories /></Frame>; }
function Categories() {
  const { svc, open } = useSvc();
  const router = useRouter();
  return (
    <section className={clsx(card, "overflow-hidden")}>
      <div className="px-5 py-4"><h2 className="text-[17px] font-bold">Categories</h2><p className="text-[13px] text-hms-muted">Group related services so your team can find them quickly.</p></div>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Categories">
      <table className="w-full min-w-[560px] border-t border-hms-line text-[14px]">
        <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">Category</th><th className="px-3 py-2.5 text-right font-medium">Active Services</th><th className="px-3 py-2.5 text-right font-medium">Archived</th><th className="px-5 py-2.5 text-right font-medium">Actions</th></tr></thead>
        <tbody>{svc.st.categories.map((c) => { const [I, tone] = iconFor(c.id); const a = svc.st.services.filter((s) => s.category === c.id && !s.archived).length, ar = svc.st.services.filter((s) => s.category === c.id && s.archived).length; return (
          <tr key={c.id} className="border-t border-hms-line">
            <td className="px-5 py-3"><span className="flex items-center gap-3"><span className={clsx("grid size-9 place-items-center rounded-lg", tone)}><I className="size-4" /></span><span><span className="block font-semibold">{c.name}</span><span className="text-[12.5px] text-hms-muted">{c.slug}</span></span></span></td>
            <td className="px-3 py-3 text-right font-semibold tabular-nums text-hms-red">{a}</td><td className="px-3 py-3 text-right tabular-nums">{ar}</td>
            <td className="px-5 py-3"><span className="flex justify-end gap-2"><button onClick={() => open({ k: "cat", cat: c })} aria-label={`Edit ${c.name}`} className="grid size-9 place-items-center rounded-lg border border-hms-line hover:bg-hms-hover"><Pencil className="size-4" /></button><button onClick={() => router.push(`/hms/other-services?category=${c.id}`)} className={clsx(btnLine, "h-9 px-3")}>View Services</button></span></td>
          </tr>); })}</tbody>
      </table>
      </div>
      <p className="border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">{svc.st.categories.length} service categories</p>
    </section>
  );
}
