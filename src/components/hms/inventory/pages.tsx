"use client";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgeDollarSign, ChevronRight, CircleMinus, Download, History, MoreHorizontal, Package, Pencil, Plus, Printer, Search, Store, Tag, TriangleAlert, X } from "lucide-react";
import { MOVE_LABEL, TODAY, fmtQty, statusOf, tk, type Item, type Move, type MoveType, type StockStatus } from "@/lib/inventory/store";
import { btnLine, btnPrimary } from "../guests/ui";
import { InventoryFrame, useInv } from "./frame";

const card = "rounded-xl border border-hms-line bg-white";
const sel = "h-10 rounded-lg border border-hms-line bg-white px-3 text-[14px] outline-none focus:border-hms-ink";
const TONE: Record<string, string> = { "In stock": "bg-[#e5f5ec] text-[#16693a]", "Low stock": "bg-[#fdf3d9] text-[#7a5200]", "Out of stock": "bg-[#fde8e8] text-[#a11d2a]" };
const MOVE_TONE: Record<MoveType, string> = { opening: "bg-hms-hover text-[#4b5160]", receive: "bg-[#e5f5ec] text-[#16693a]", issue: "bg-[#e8f0fe] text-[#1d4ed8]", wastage: "bg-[#fdf3d9] text-[#7a5200]", adjust: "bg-[#eeebfc] text-[#5b44c9]" };
export const Pill = ({ tone, children }: { tone: string; children: React.ReactNode }) => <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-[12.5px] font-semibold", tone)}><span className="size-1.5 rounded-full bg-current" />{children}</span>;
const ICON_TONE: Record<string, string> = { c1: "bg-[#f1edff] text-[#6b55e0]", c2: "bg-[#e8f0fe] text-[#1d4ed8]", c3: "bg-[#fdefe7] text-[#d9622b]", c4: "bg-[#e5f5ec] text-[#1c7d45]" };
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => `${iso.slice(8, 10)} ${MON[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const time = (iso: string) => { const [H, M] = iso.slice(11, 16).split(":").map(Number); return `${String(H % 12 || 12).padStart(2, "0")}:${String(M).padStart(2, "0")} ${H >= 12 ? "PM" : "AM"}`; };
const signed = (n: number, u: string) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmtQty(Math.abs(n), u)}`;

function Search_({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-hms-line bg-white px-3 focus-within:border-hms-ink sm:flex-none">
      <Search className="size-4 text-hms-muted" /><span className="sr-only">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search item or SKU" className="h-full min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
    </label>
  );
}

// ---------------- Stock ----------------
export function StockPage() { return <InventoryFrame tab="stock"><Stock /></InventoryFrame>; }
function Stock() {
  const { inv, open } = useInv();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState<StockStatus | "">("");
  const cats = new Map(inv.st.categories.map((c) => [c.id, c.name]));
  const sups = new Map(inv.st.suppliers.map((s) => [s.id, s.name]));
  const list = inv.items.filter((i) => (!cat || i.category === cat) && (!st || statusOf(i) === st) && (!q || `${i.name} ${i.sku}`.toLowerCase().includes(q.toLowerCase())));
  const low = inv.items.filter((i) => statusOf(i) === "Low stock").length, out = inv.items.filter((i) => statusOf(i) === "Out of stock").length;
  const kpis: [string, number, string, typeof Package, string, StockStatus | ""][] = [
    ["Active Items", inv.items.length, "Items tracked", Package, "bg-[#f1edff] text-[#6b55e0]", ""],
    ["Low Stock", low, "At or below reorder level", TriangleAlert, "bg-[#fdf3d9] text-[#a76f00]", "Low stock"],
    ["Out of Stock", out, "Zero available", CircleMinus, "bg-[#fde8e8] text-[#c8232e]", "Out of stock"],
  ];
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {kpis.map(([l, v, s, I, tone, f]) => (
          <button key={l} onClick={() => setSt(st === f ? "" : f)} aria-pressed={!!f && st === f} className={clsx(card, "flex items-center gap-4 p-4 text-left transition-shadow hover:shadow-[0_2px_10px_-4px_rgb(0_0_0/0.15)]", f && st === f && "border-[#e9b949] ring-2 ring-[#e9b949]/30")}>
            <span className={clsx("grid size-11 shrink-0 place-items-center rounded-xl", tone)}><I className="size-5" /></span>
            <span className="flex-1"><span className="block text-[13.5px] font-semibold">{l}</span><span className="block text-[24px] font-bold leading-tight tabular-nums">{v}</span><span className="text-[12.5px] text-hms-muted">{s}</span></span>
            <ChevronRight className="size-4 text-hms-muted" />
          </button>
        ))}
      </div>
      <section className={clsx(card, "mt-4 overflow-hidden")}>
        <div className="flex flex-wrap items-center gap-3 px-5 py-4">
          <div className="mr-auto"><h2 className="text-[17px] font-bold">Stock Items</h2><p className="text-[13px] text-hms-muted">On-hand quantities by item</p></div>
          <Search_ value={q} onChange={setQ} label="Search stock items" />
          <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className={sel}><option value="">All categories</option>{inv.st.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {st ? <button onClick={() => setSt("")} className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#e9b949] bg-[#fffaf0] px-3 text-[14px] font-medium">{st}<X className="size-3.5" /><span className="sr-only">Clear status filter</span></button>
            : <select aria-label="Status" value={st} onChange={(e) => setSt(e.target.value as StockStatus | "")} className={sel}><option value="">All statuses</option><option>In stock</option><option>Low stock</option><option>Out of stock</option></select>}
        </div>
        {inv.items.length === 0 ? (
          <div className="border-t border-hms-line px-6 py-16 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-hms-coral-soft text-hms-red"><Package className="size-6" /></span>
            <p className="mt-4 text-[18px] font-bold">Add your first item</p>
            <p className="mt-1 text-[14px] text-hms-muted">Start with an item you already keep in stock, such as guest soap or bath towels.</p>
            <button onClick={() => open({ k: "item" })} className={clsx(btnPrimary, "mt-4")}><Plus className="size-4" />Add your first item</button>
          </div>
        ) : list.length === 0 ? (
          <div className="border-t border-hms-line px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-hms-hover text-hms-muted"><Search className="size-5" /></span>
            <p className="mt-3 text-[16px] font-semibold">No items found</p>
            <p className="mt-1 text-[14px] text-hms-muted">{q ? `Nothing matches “${q}”.` : "Nothing matches these filters."} Try another name or SKU.</p>
            <button onClick={() => { setQ(""); setCat(""); setSt(""); }} className={clsx(btnLine, "mt-4")}>Clear search</button>
          </div>
        ) : (
          <div className="overflow-x-auto border-t border-hms-line" tabIndex={0} role="region" aria-label="Stock items">
            <table className="w-full min-w-[820px] text-[14px]">
              <thead><tr className="text-left text-[12.5px] text-hms-muted">
                <th className="px-5 py-2.5 font-medium">Item / SKU</th><th className="px-3 py-2.5 font-medium">Category</th><th className="px-3 py-2.5 font-medium">Default Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium">Available</th><th className="px-3 py-2.5 font-medium">Stock Status</th><th className="px-3 py-2.5 text-right font-medium">Unit Cost</th><th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr></thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-t border-hms-line">
                    <td className="px-5 py-2.5"><span className="flex items-center gap-3"><span className={clsx("grid size-9 shrink-0 place-items-center rounded-lg", ICON_TONE[i.category] ?? "bg-hms-hover text-hms-muted")}><Package className="size-4" /></span><span><span className="block font-semibold">{i.name}</span><span className="text-[12.5px] text-hms-muted">{i.sku}</span></span></span></td>
                    <td className="px-3 py-2.5">{cats.get(i.category) ?? "—"}</td>
                    <td className="px-3 py-2.5">{sups.get(i.supplier) ?? "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums">{fmtQty(i.qty, i.unit)}</td>
                    <td className="px-3 py-2.5"><Pill tone={TONE[statusOf(i)]}>{statusOf(i)}</Pill></td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{tk(i.cost)}</td>
                    <td className="px-5 py-2.5 text-right"><RowMenu item={i} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {inv.items.length > 0 && list.length > 0 && <p className="border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">Showing {list.length} of {inv.items.length} items</p>}
      </section>
    </>
  );
}

function RowMenu({ item }: { item: Item }) {
  const { inv, open } = useInv();
  const [m, setM] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!m) return;
    const c = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setM(false); };
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, [m]);
  const acts: [string, () => void][] = [
    ["Receive stock", () => open({ k: "move", type: "receive", item: item.id })],
    ["Issue stock", () => open({ k: "move", type: "issue", item: item.id })],
    ["Record wastage", () => open({ k: "move", type: "wastage", item: item.id })],
    ["Adjust stock", () => open({ k: "move", type: "adjust", item: item.id })],
    ["Edit item", () => open({ k: "item", item })],
    ["Archive item", () => { if (confirm(`Archive ${item.name}? Its history is kept.`)) inv.archiveItem(item.id); }],
  ];
  return (
    <div ref={ref} className="relative inline-block">
      <button onClick={() => setM((x) => !x)} aria-haspopup="menu" aria-expanded={m} aria-label={`Actions for ${item.name}`} className="grid size-8 place-items-center rounded-lg hover:bg-hms-hover"><MoreHorizontal className="size-4" /></button>
      {m && <div role="menu" className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-hms-line bg-white p-1 text-left shadow-lg">{acts.map(([l, f], k) => <button key={l} role="menuitem" onClick={() => { setM(false); f(); }} className={clsx("block w-full rounded-lg px-3 py-2 text-left text-[14px] hover:bg-hms-hover", k === 4 && "border-t border-hms-line", k === 5 && "text-[#b42318]")}>{l}</button>)}</div>}
    </div>
  );
}

// ---------------- History ----------------
export function HistoryPage() { return <InventoryFrame tab="history"><HistoryView /></InventoryFrame>; }
function HistoryView() {
  const { inv } = useInv();
  const [q, setQ] = useState("");
  const [t, setT] = useState<MoveType | "">("");
  const [d, setD] = useState(TODAY);
  const items = new Map(inv.st.items.map((i) => [i.id, i]));
  const list = inv.st.moves.filter((m) => (!t || m.type === t) && (!d || m.at.startsWith(d)) && (!q || `${items.get(m.item)?.name} ${items.get(m.item)?.sku}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <section className={clsx(card, "overflow-hidden")}>
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <div className="mr-auto"><h2 className="text-[17px] font-bold">Movement History</h2><p className="text-[13px] text-hms-muted">Track stock changes and who recorded them.</p></div>
        <Search_ value={q} onChange={setQ} label="Search movements" />
        <select aria-label="Movement type" value={t} onChange={(e) => setT(e.target.value as MoveType | "")} className={sel}><option value="">All movements</option>{(Object.keys(MOVE_LABEL) as MoveType[]).map((k) => <option key={k} value={k}>{MOVE_LABEL[k]}</option>)}</select>
        <input type="date" aria-label="Date" value={d} onChange={(e) => setD(e.target.value)} className={sel} />
        {d && <button onClick={() => setD("")} className="text-[13.5px] font-semibold text-hms-red">All dates</button>}
      </div>
      {list.length ? (
        <div className="overflow-x-auto border-t border-hms-line" tabIndex={0} role="region" aria-label="Movements">
          <table className="w-full min-w-[860px] text-[14px]">
            <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">Date / Time</th><th className="px-3 py-2.5 font-medium">Item / SKU</th><th className="px-3 py-2.5 font-medium">Movement</th><th className="px-3 py-2.5 text-right font-medium">Change</th><th className="px-3 py-2.5 text-right font-medium">Balance After</th><th className="px-3 py-2.5 font-medium">Reference / Note</th><th className="px-5 py-2.5 font-medium">Recorded By</th></tr></thead>
            <tbody>{list.map((m) => <MoveRow key={m.id} m={m} it={items.get(m.item)} />)}</tbody>
          </table>
        </div>
      ) : <p className="border-t border-hms-line px-5 py-12 text-center text-[14px] text-hms-muted">No movements {d ? `on ${day(d)}` : ""} for these filters.</p>}
      <p className="border-t border-hms-line px-5 py-3 text-[13px] text-hms-muted">{list.length} movement{list.length === 1 ? "" : "s"} · Asia/Dhaka · history can’t be edited or deleted</p>
    </section>
  );
}
function MoveRow({ m, it }: { m: Move; it?: Item }) {
  const u = it?.unit ?? "";
  return (
    <tr className="border-t border-hms-line">
      <td className="whitespace-nowrap px-5 py-2.5"><span className="block font-semibold">{time(m.at)}</span><span className="text-[12.5px] text-hms-muted">{day(m.at)}</span></td>
      <td className="px-3 py-2.5"><span className="block font-semibold">{it?.name ?? "Removed item"}</span><span className="text-[12.5px] text-hms-muted">{it?.sku}</span></td>
      <td className="px-3 py-2.5"><Pill tone={MOVE_TONE[m.type]}>{MOVE_LABEL[m.type]}</Pill></td>
      <td className={clsx("whitespace-nowrap px-3 py-2.5 text-right font-bold tabular-nums", m.change > 0 ? "text-[#16693a]" : "")}>{signed(m.change, u)}</td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">{fmtQty(m.balance, u)}</td>
      <td className="max-w-[260px] px-3 py-2.5">{m.ref && <span className="block font-mono text-[13px]">{m.ref}</span>}{m.note && <span className={m.ref ? "text-[12.5px] text-hms-muted" : ""}>{m.note}</span>}{!m.ref && !m.note && "—"}</td>
      <td className="whitespace-nowrap px-5 py-2.5 text-[#4b5160]">{m.by}</td>
    </tr>
  );
}

// ---------------- Reports ----------------
export function ReportsPage() { return <InventoryFrame tab="reports"><Reports /></InventoryFrame>; }
function Reports() {
  const { inv } = useInv();
  const [from, setFrom] = useState(TODAY), [to, setTo] = useState(TODAY);
  const [range, setRange] = useState({ from: TODAY, to: TODAY });
  const items = new Map(inv.st.items.map((i) => [i.id, i]));
  const moves = inv.st.moves.filter((m) => m.at.slice(0, 10) >= range.from && m.at.slice(0, 10) <= range.to);
  const value = inv.items.reduce((s, i) => s + i.qty * i.cost, 0);
  const review = inv.items.filter((i) => statusOf(i) !== "In stock").sort((a, b) => a.qty - b.qty);
  const low = review.filter((i) => statusOf(i) === "Low stock").length;
  const bad = from > to;
  const label = range.from === range.to ? day(range.from) : `${day(range.from)} – ${day(range.to)}`;
  const csv = () => {
    const rows = [["Item", "SKU", "Unit", "Available", "Status", "Unit cost (BDT)", "Value (BDT)"], ...inv.items.map((i) => [i.name, i.sku, i.unit, i.qty, statusOf(i), i.cost, i.qty * i.cost]), [], ["Movements", label], ["Date/time", "Item", "Movement", "Change", "Balance after", "Reference", "Note", "Recorded by"], ...moves.map((m) => [m.at.replace("T", " "), items.get(m.item)?.name ?? "", MOVE_LABEL[m.type], m.change, m.balance, m.ref, m.note, m.by])];
    const text = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv" }));
    a.download = `inventory-report-${range.from}-to-${range.to}.csv`;
    a.click();
  };
  const kpis: [string, string, string, typeof Package, string][] = [
    ["Estimated Stock Value", tk(Math.round(value)), "Current stock × unit cost", BadgeDollarSign, "bg-[#e5f5ec] text-[#1c7d45]"],
    ["Active Items", String(inv.items.length), "Current stock list", Package, "bg-[#f1edff] text-[#6b55e0]"],
    ["Needs Attention", String(review.length), `${low} low · ${review.length - low} out of stock`, TriangleAlert, "bg-[#fdf3d9] text-[#a76f00]"],
    ["Movements", String(moves.length), "Selected date range", History, "bg-[#e8f0fe] text-[#1d4ed8]"],
  ];
  return (
    <>
      <section className={clsx(card, "flex flex-wrap items-center gap-3 px-5 py-4 print:hidden")}>
        <div className="mr-auto"><h2 className="text-[17px] font-bold">Inventory Report</h2><p className="text-[13px] text-hms-muted">The date range applies to movement activity.</p></div>
        <input type="date" aria-label="From" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={sel} /><ArrowRight className="size-4 text-hms-muted" />
        <input type="date" aria-label="To" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={sel} />
        <button disabled={bad} onClick={() => setRange({ from, to })} className={clsx(btnPrimary, "h-10")}>Apply</button>
        <button onClick={csv} className={clsx(btnLine, "h-10")}><Download className="size-4" />CSV</button>
        <button onClick={() => window.print()} className={clsx(btnLine, "h-10")}><Printer className="size-4" />PDF</button>
      </section>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([l, v, s, I, tone]) => (
          <div key={l} className={clsx(card, "flex items-center gap-4 p-4")}>
            <span className={clsx("grid size-11 shrink-0 place-items-center rounded-xl", tone)}><I className="size-5" /></span>
            <span><span className="block text-[13.5px] font-semibold">{l}</span><span className="block text-[24px] font-bold leading-tight tabular-nums">{v}</span><span className="text-[12.5px] text-hms-muted">{s}</span></span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <section className={clsx(card, "self-start overflow-hidden")}>
          <div className="px-5 py-4"><h3 className="text-[17px] font-bold">Stock to Review</h3><p className="text-[13px] text-hms-muted">Current low-stock and out-of-stock items.</p></div>
          {review.length ? <ul>{review.map((i) => <li key={i.id} className="flex items-center gap-3 border-t border-hms-line px-5 py-3"><span className="flex-1"><span className="block font-semibold">{i.name}</span><span className="text-[13px] text-hms-muted">{fmtQty(i.qty, i.unit)} available · Reorder at {fmtQty(i.reorder, i.unit)}</span></span><Pill tone={TONE[statusOf(i)]}>{statusOf(i)}</Pill></li>)}</ul>
            : <p className="border-t border-hms-line px-5 py-6 text-[14px] text-hms-muted">All items are above their reorder level.</p>}
        </section>
        <section className={clsx(card, "overflow-hidden")}>
          <div className="px-5 py-4"><h3 className="text-[17px] font-bold">Movement Activity</h3><p className="text-[13px] text-hms-muted">{label} · {moves.length} movement{moves.length === 1 ? "" : "s"}</p></div>
          {moves.length ? (
            <table className="w-full border-t border-hms-line text-[14px]">
              <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">Item / SKU</th><th className="px-3 py-2.5 font-medium">Movement</th><th className="px-5 py-2.5 text-right font-medium">Change</th></tr></thead>
              <tbody>{moves.map((m) => { const it = items.get(m.item); return <tr key={m.id} className="border-t border-hms-line"><td className="px-5 py-2.5"><span className="block font-semibold">{it?.name}</span><span className="text-[12.5px] text-hms-muted">{it?.sku}</span></td><td className="px-3 py-2.5"><Pill tone={MOVE_TONE[m.type]}>{MOVE_LABEL[m.type]}</Pill></td><td className="whitespace-nowrap px-5 py-2.5 text-right font-bold tabular-nums">{signed(m.change, it?.unit ?? "")}</td></tr>; })}</tbody>
            </table>
          ) : <p className="border-t border-hms-line px-5 py-6 text-[14px] text-hms-muted">No movements in this date range.</p>}
        </section>
      </div>
    </>
  );
}

// ---------------- Categories & suppliers ----------------
function Block({ title, sub, add, onAdd, rows, icon: I, head }: { title: string; sub: string; add: string; onAdd: () => void; rows: { id: string; name: string; n: number; extra?: string; edit: () => void }[]; icon: typeof Tag; head: string }) {
  return (
    <section className={clsx(card, "self-start overflow-hidden")}>
      <div className="flex items-start gap-3 px-5 py-4"><div className="flex-1"><h2 className="text-[17px] font-bold">{title}</h2><p className="text-[13px] text-hms-muted">{sub}</p></div><button onClick={onAdd} className={clsx(btnLine, "h-9 px-3")}><Plus className="size-4" />{add}</button></div>
      <table className="w-full border-t border-hms-line text-[14px]">
        <thead><tr className="text-left text-[12.5px] text-hms-muted"><th className="px-5 py-2.5 font-medium">{head}</th><th className="px-3 py-2.5 text-right font-medium">Items</th><th className="w-16 px-5 py-2.5 text-right font-medium">Edit</th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t border-hms-line">
            <td className="px-5 py-3"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#f1edff] text-[#6b55e0]"><I className="size-4" /></span><span><span className="block font-semibold">{r.name}</span>{r.extra && <span className="text-[12.5px] text-hms-muted">{r.extra}</span>}</span></span></td>
            <td className="px-3 py-3 text-right tabular-nums">{r.n}</td>
            <td className="px-5 py-3 text-right"><button onClick={r.edit} aria-label={`Edit ${r.name}`} className="grid size-8 place-items-center rounded-lg hover:bg-hms-hover"><Pencil className="size-4" /></button></td>
          </tr>
        ))}</tbody>
      </table>
      {!rows.length && <p className="border-t border-hms-line px-5 py-6 text-[14px] text-hms-muted">Nothing here yet.</p>}
    </section>
  );
}

export function SetupPage() { return <InventoryFrame tab="setup"><Setup /></InventoryFrame>; }
function Setup() {
  const { inv, open } = useInv();
  const count = (k: "category" | "supplier", id: string) => inv.items.filter((i) => i[k] === id).length;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Block title="Categories" sub="Group items so staff can find them faster." add="Add Category" onAdd={() => open({ k: "cat" })} head="Category" icon={Tag}
        rows={inv.st.categories.map((c) => ({ id: c.id, name: c.name, n: count("category", c.id), edit: () => open({ k: "cat", cat: c }) }))} />
      <Block title="Suppliers" sub="Keep the vendors used for stock receiving." add="Add Supplier" onAdd={() => open({ k: "sup" })} head="Supplier" icon={Store}
        rows={inv.st.suppliers.map((s) => ({ id: s.id, name: s.name, n: count("supplier", s.id), extra: [s.contact, s.phone].filter(Boolean).join(" · "), edit: () => open({ k: "sup", sup: s }) }))} />
    </div>
  );
}

