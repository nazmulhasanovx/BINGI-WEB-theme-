"use client";
// Restaurant & Bar — Menu (items, categories) and Tables & QR, following the live screens.
import clsx from "clsx";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { BedDouble, Camera, Crown, ImagePlus, Martini, Minus, PartyPopper, Pencil, Plus, QrCode, Search, Trash2, Trees, UtensilsCrossed } from "lucide-react";
import { PLACE_KIND, isSeated, seatCodesOf, sharesSeats, tk, type Category, type Item, type Place, type PlaceKind } from "@/lib/meals/seed";
import { uid } from "@/lib/meals/store";
import { PhotoButton } from "../photo";
import { Sheet, btnLine, btnPrimary, input, lbl } from "../guests/ui";
import { MealsFrame } from "./frame";
import { Dish, useRestaurant, useToast, type Restaurant } from "./shared";
import { TablePreview } from "./table-preview";

const card = "rounded-2xl border border-hms-line bg-white";
function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onChange} className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-[#1c7d45]" : "bg-[#c5cbd3]")}><span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} /></button>;
}

// =================== Menu ===================
export function MenuPage() {
  const r = useRestaurant();
  const [toast, show] = useToast();
  const [view, setView] = useState<"items" | "cats">("items");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [avail, setAvail] = useState<"all" | "on" | "off">("all");
  const [edit, setEdit] = useState<Item | "new" | null>(null);
  if (!r.m.ready) return <MealsFrame tab="menu"><p role="status" className="p-8 text-[14px] text-hms-muted">Loading…</p></MealsFrame>;
  const st = r.m.st;
  const catName = (id: string) => st.categories.find((c) => c.id === id)?.name ?? "—";
  const list = st.items.filter((i) => (cat === "all" || i.cat === cat) && (avail === "all" || (avail === "on") === i.available) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <MealsFrame tab="menu" toast={toast} outlets={r.m.outlets}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Menu view" className="flex rounded-lg bg-[#e9edf2] p-1">{([["items", `Items · ${st.items.length}`], ["cats", `Categories · ${st.categories.length}`]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={clsx("h-9 rounded-md px-3 text-[13.5px] font-semibold", view === v ? "bg-white shadow-sm" : "text-[#4d5664]")}>{l}</button>)}</div>
        {view === "items" && <button onClick={() => setEdit("new")} className={clsx(btnPrimary, "h-10")}><Plus className="size-4" aria-hidden />Add item</button>}
      </div>
      {view === "items" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[#858c97] bg-white px-3"><Search className="size-4 text-hms-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items by name" aria-label="Search items" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" /></label>
            <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="h-11 w-auto rounded-lg border border-[#858c97] bg-white px-3 text-[15px] outline-none focus:border-hms-ink"><option value="all">All categories</option>{st.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select aria-label="Availability" value={avail} onChange={(e) => setAvail(e.target.value as typeof avail)} className="h-11 w-auto rounded-lg border border-[#858c97] bg-white px-3 text-[15px] outline-none focus:border-hms-ink"><option value="all">All</option><option value="on">Available</option><option value="off">Sold out</option></select>
          </div>
          <section className={clsx(card, "mt-4 overflow-hidden")} aria-label="Menu items">
            {list.length ? <ul className="divide-y divide-hms-line">{list.map((it) => (
              <li key={it.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="group relative">
                  <Dish it={it} className="size-16" />
                  <PhotoButton label={`${it.photo ? "Change" : "Add"} photo of ${it.name}`} onPhoto={(src) => { r.m.saveItem({ ...it, photo: src }); show(`Photo saved · ${it.name}`); }} onError={show} className="absolute inset-0 grid place-items-center rounded-lg bg-black/0 text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100 focus-visible:bg-black/35 focus-visible:opacity-100"><Camera className="size-5" /></PhotoButton>
                </span>
                <div className="min-w-[160px] flex-1"><b className="block text-[15px]">{it.name}</b><span className="text-[12.5px] text-hms-muted">{catName(it.cat)} · {it.prep} min{it.sizes ? ` · ${it.sizes.map((z) => z.name).join(" / ")}` : ""}</span>{!it.photo && <span className="block text-[12px] font-medium text-[#a4500f]">No photo yet</span>}</div>
                <b className="w-[110px] text-right text-[15px] text-[#b11c29] tabular-nums">{it.sizes ? `from ${tk(it.price)}` : tk(it.price)}</b>
                <span className="flex w-[150px] items-center gap-2 text-[13px]"><Switch on={it.available} onChange={() => { r.m.saveItem({ ...it, available: !it.available }); show(`${it.name}: ${it.available ? "sold out" : "available"}`); }} label={`${it.name} available`} /><span className={it.available ? "text-[#1c7d45]" : "text-hms-muted"}>{it.available ? "Available" : "Sold out"}</span></span>
                <span className="flex gap-1.5">{([["pos", "POS"], ["qr", "QR"]] as const).map(([k, l]) => <button key={k} type="button" aria-pressed={it[k]} aria-label={`${it.name} on ${l}`} onClick={() => r.m.saveItem({ ...it, [k]: !it[k] })} className={clsx("rounded-md border px-2 py-1 text-[12px] font-semibold", it[k] ? "border-[#b11c29] text-[#b11c29]" : "border-hms-line text-hms-muted line-through")}>{l}</button>)}</span>
                <button onClick={() => setEdit(it)} aria-label={`Edit ${it.name}`} className="grid size-9 place-items-center rounded-lg border border-hms-line hover:bg-hms-hover"><Pencil className="size-4" /></button>
              </li>
            ))}</ul> : <p className="px-6 py-12 text-center text-[14.5px] text-hms-muted">No item matches.</p>}
          </section>
          <p className="mt-2 text-[12.5px] text-hms-muted">Changes to name, price or availability apply to new orders only.</p>
        </>
      ) : <Categories r={r} onDone={show} />}
      {edit && <ItemSheet r={r} it={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={(m) => { show(m); setEdit(null); }} />}
    </MealsFrame>
  );
}
function Categories({ r, onDone }: { r: Restaurant; onDone: (m: string) => void }) {
  const [name, setName] = useState("");
  const st = r.m.st;
  const dup = st.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  return (
    <section className={clsx(card, "mt-4 p-5")} aria-label="Categories">
      <div className="flex gap-2"><input aria-label="New category name" value={name} onChange={(e) => setName(e.target.value)} placeholder="New category, e.g. Kids' menu" className={input} /><button disabled={!name.trim() || dup} onClick={() => { r.m.saveCategory({ id: uid("c-"), name: name.trim() }); onDone(`${name.trim()} added`); setName(""); }} className={clsx(btnPrimary, "h-11 shrink-0")}>Add</button></div>
      {dup && <p className="mt-1 text-[13px] font-medium text-[#c81e1e]">This category already exists</p>}
      <ul className="mt-4 divide-y divide-hms-line">{st.categories.map((c) => <CatRow key={c.id} c={c} count={st.items.filter((i) => i.cat === c.id).length} r={r} onDone={onDone} />)}</ul>
    </section>
  );
}
function CatRow({ c, count, r, onDone }: { c: Category; count: number; r: Restaurant; onDone: (m: string) => void }) {
  const [n, setN] = useState(c.name);
  return (
    <li className="flex items-center gap-2 py-2.5">
      <input aria-label={`Category name ${c.name}`} value={n} onChange={(e) => setN(e.target.value)} onBlur={() => n.trim() && n.trim() !== c.name ? (r.m.saveCategory({ ...c, name: n.trim() }), onDone("Category renamed")) : setN(c.name)} className="h-10 min-w-0 flex-1 rounded-lg border border-transparent px-2 text-[14.5px] font-semibold hover:border-hms-line focus:border-hms-ink focus:outline-none" />
      <span className="text-[13px] text-hms-muted">{count} item{count === 1 ? "" : "s"}</span>
      <button disabled={count > 0} title={count ? "Move or delete its items first" : undefined} onClick={() => { r.m.removeCategory(c.id); onDone(`${c.name} deleted`); }} aria-label={`Delete ${c.name}`} className="grid size-9 place-items-center rounded-lg text-hms-muted hover:bg-hms-hover disabled:opacity-30"><Trash2 className="size-4" /></button>
    </li>
  );
}
function ItemSheet({ r, it, onClose, onDone }: { r: Restaurant; it?: Item; onClose: () => void; onDone: (m: string) => void }) {
  const [f, setF] = useState<Item>(it ?? { id: uid("i"), name: "", cat: r.m.st.categories[0]?.id ?? "", price: 0, prep: 10, available: true, pos: true, qr: true });
  const [tried, setTried] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const sizes = f.sizes;
  const e = {
    name: !f.name.trim() ? "Enter a name" : r.m.st.items.some((x) => x.id !== f.id && x.name.toLowerCase() === f.name.trim().toLowerCase()) ? "Another item has this name" : "",
    price: sizes ? (sizes.length < 2 || sizes.some((z) => !z.name.trim() || !(z.price > 0)) ? "Each size needs a name and a price (at least 2 sizes)" : new Set(sizes.map((z) => z.name.trim().toLowerCase())).size !== sizes.length ? "Size names must be different" : "") : !(f.price > 0) ? "Enter a price" : "",
    cat: !f.cat ? "Choose a category" : "",
  };
  const setSize = (i: number, z: Partial<{ name: string; price: number }>) => setF({ ...f, sizes: sizes!.map((x, j) => (j === i ? { ...x, ...z } : x)) });
  const bad = Object.values(e).some(Boolean);
  const err = (k: keyof typeof e) => (tried && e[k] ? <p className="mt-1 text-[13px] font-medium text-[#c81e1e]">{e[k]}</p> : null);
  return (
    <Sheet title={it ? `Edit ${it.name}` : "Add item"} sub="Shown on POS and QR menus" onClose={onClose}
      footer={<>{it && <button onClick={() => { if (confirm(`Delete ${it.name}? Old orders keep it.`)) { r.m.removeItem(it.id); onDone(`${it.name} deleted`); } }} className={clsx(btnLine, "text-[#b11c29]")}>Delete</button>}<button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={() => { setTried(true); if (bad) return; r.m.saveItem({ ...f, name: f.name.trim(), ...(f.sizes ? { sizes: f.sizes.map((z) => ({ name: z.name.trim(), price: z.price })), price: Math.min(...f.sizes.map((z) => z.price)) } : {}) }); onDone(it ? `${f.name.trim()} saved` : `${f.name.trim()} added`); }} className={clsx(btnPrimary, "flex-[1.4]")}>Save</button></>}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Dish it={f} className="size-24 rounded-xl" />
          <div className="space-y-2">
            <PhotoButton label={f.photo ? "Change photo" : "Upload photo"} onPhoto={(src) => { setPhotoErr(""); setF({ ...f, photo: src }); }} onError={setPhotoErr} className={clsx(btnLine, "h-10")}><ImagePlus className="size-4" aria-hidden />{f.photo ? "Change photo" : "Upload photo"}</PhotoButton>
            {f.photo && <button type="button" onClick={() => setF({ ...f, photo: undefined })} className="block text-[13px] text-hms-muted underline">Remove photo</button>}
            <p className="text-[12px] text-hms-muted">JPG, PNG or WEBP. Shrunk to 640 px automatically.</p>
            {photoErr && <p role="alert" className="text-[13px] font-medium text-[#c81e1e]">{photoErr}</p>}
          </div>
        </div>
        <div><label htmlFor="it-n" className={lbl}>Name</label><input id="it-n" autoFocus value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} className={input} />{err("name")}</div>
        <div><label htmlFor="it-c" className={lbl}>Category</label><select id="it-c" value={f.cat} onChange={(x) => setF({ ...f, cat: x.target.value })} className={input}>{r.m.st.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{err("cat")}</div>
        <div className="rounded-xl border border-hms-line p-3">
          <label className="flex items-center justify-between gap-3 text-[14px]"><span><b className="block">Sizes</b><span className="text-[12.5px] text-hms-muted">e.g. Half / Full, Regular / Large — each with its own price</span></span><input type="checkbox" role="switch" checked={!!sizes} onChange={(x) => setF({ ...f, sizes: x.target.checked ? [{ name: "Half", price: f.price || 0 }, { name: "Full", price: 0 }] : undefined })} className="size-5 accent-[#b11c29]" /></label>
          {sizes && <ul className="mt-3 space-y-2">{sizes.map((z, i) => (
            <li key={i} className="flex gap-2"><input aria-label={`Size ${i + 1} name`} value={z.name} onChange={(x) => setSize(i, { name: x.target.value })} className="h-10 min-w-0 flex-1 rounded-lg border border-[#858c97] px-2.5 text-[14.5px] outline-none focus:border-hms-ink" /><input aria-label={`Size ${i + 1} price`} inputMode="numeric" value={z.price || ""} onChange={(x) => setSize(i, { price: Number(x.target.value.replace(/\D/g, "")) || 0 })} placeholder="৳" className="h-10 w-28 rounded-lg border border-[#858c97] px-2.5 text-[14.5px] outline-none focus:border-hms-ink" /><button type="button" disabled={sizes.length <= 2} onClick={() => setF({ ...f, sizes: sizes.filter((_, j) => j !== i) })} aria-label={`Remove size ${z.name || i + 1}`} className="grid size-10 place-items-center rounded-lg text-hms-muted hover:bg-hms-hover disabled:opacity-30"><Trash2 className="size-4" /></button></li>
          ))}<li><button type="button" disabled={sizes.length >= 4} onClick={() => setF({ ...f, sizes: [...sizes, { name: "", price: 0 }] })} className="text-[13.5px] font-semibold text-hms-red disabled:opacity-40">+ Add size</button></li></ul>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {sizes ? <div>{err("price")}</div> : <div><label htmlFor="it-p" className={lbl}>Price (৳)</label><input id="it-p" inputMode="numeric" value={f.price || ""} onChange={(x) => setF({ ...f, price: Number(x.target.value.replace(/\D/g, "")) || 0 })} className={input} />{err("price")}</div>}
          <div><label htmlFor="it-t" className={lbl}>Prep time (min)</label><input id="it-t" inputMode="numeric" value={f.prep || ""} onChange={(x) => setF({ ...f, prep: Number(x.target.value.replace(/\D/g, "")) || 0 })} className={input} /></div>
        </div>
        <div><label htmlFor="it-d" className={lbl}>Short description <span className="font-normal text-hms-muted">optional</span></label><input id="it-d" value={f.short ?? ""} onChange={(x) => setF({ ...f, short: x.target.value || undefined })} placeholder="What guests see on the QR menu" className={input} /></div>
        <div className="flex flex-wrap gap-4 text-[14px]">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.veg} onChange={(x) => setF({ ...f, veg: x.target.checked })} className="size-[18px] accent-[#1c7d45]" />Vegetarian</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.pos} onChange={(x) => setF({ ...f, pos: x.target.checked })} className="size-[18px] accent-[#b11c29]" />On POS</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.qr} onChange={(x) => setF({ ...f, qr: x.target.checked })} className="size-[18px] accent-[#b11c29]" />On QR menu</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.available} onChange={(x) => setF({ ...f, available: x.target.checked })} className="size-[18px] accent-[#1c7d45]" />Available now</label>
        </div>
        <p className="text-[12.5px] text-hms-muted">In this prototype the photo is kept in this browser; in the live HMS it is stored with the menu.</p>
      </div>
    </Sheet>
  );
}

// =================== Tables & QR ===================
const KIND_LABEL: Record<PlaceKind, string> = Object.fromEntries(Object.entries(PLACE_KIND).map(([k, v]) => [k, v.label])) as Record<PlaceKind, string>;
type Group = "seated" | "room" | "general";
const KIND_ICON: Record<PlaceKind, typeof UtensilsCrossed> = { table: UtensilsCrossed, private: Crown, bar: Martini, event: PartyPopper, room: BedDouble, general: Trees };
const groupOf = (k: PlaceKind): Group => (k === "room" ? "room" : k === "general" ? "general" : "seated");
export function TablesPage() {
  const r = useRestaurant();
  const [toast, show] = useToast();
  const [k, setK] = useState<"all" | Group>("all");
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<Place | "new" | null>(null);
  const [qr, setQr] = useState<Place | null>(null);
  if (!r.m.ready) return <MealsFrame tab="tables"><p role="status" className="p-8 text-[14px] text-hms-muted">Loading…</p></MealsFrame>;
  const ps = r.m.st.places;
  const n = (x: Group) => ps.filter((p) => groupOf(p.kind) === x).length;
  const list = ps.filter((p) => (k === "all" || groupOf(p.kind) === k) && (!q || `${p.name} ${p.note ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <MealsFrame tab="tables" toast={toast} outlets={r.m.outlets}>
      <div className="grid grid-cols-3 gap-3">
        {([["seated", "Tables & seats", "Public, VIP, bar, event", UtensilsCrossed], ["room", "Room QR", "In-room menus", BedDouble], ["general", "Other spots", "Pool, lobby, garden", QrCode]] as const).map(([id, l, s, I]) => (
          <button key={id} onClick={() => setK(id)} className={clsx(card, "flex items-center gap-3 p-4 text-left hover:border-[#858c97]", k === id && "border-hms-ink")}><span className="grid size-10 place-items-center rounded-xl bg-[#f4f6f8] text-hms-muted"><I className="size-5" aria-hidden /></span><span><b className="block text-[22px] leading-none tabular-nums">{n(id)}</b><span className="text-[13px] font-semibold">{l}</span><span className="hidden text-[12.5px] text-hms-muted sm:block">{s}</span></span></button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <div role="tablist" aria-label="Location type" className="flex flex-wrap gap-1.5">{([["all", `All (${ps.length})`], ["seated", `Tables & seats (${n("seated")})`], ["room", `Room QR (${n("room")})`], ["general", `Other spots (${n("general")})`]] as const).map(([v, l]) => <button key={v} role="tab" aria-selected={k === v} onClick={() => setK(v)} className={clsx("h-9 rounded-full border px-3.5 text-[13.5px] font-semibold", k === v ? "border-hms-ink bg-hms-ink text-white" : "border-hms-line bg-white hover:bg-hms-hover")}>{l}</button>)}</div>
        <label className="ml-auto flex h-10 min-w-[200px] items-center gap-2 rounded-lg border border-hms-line bg-white px-3"><Search className="size-4 text-hms-muted" aria-hidden /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tables, rooms" aria-label="Search locations" className="min-w-0 flex-1 bg-transparent text-[14.5px] outline-none" /></label>
        <button onClick={() => setEdit("new")} className={clsx(btnPrimary, "h-10")}><Plus className="size-4" aria-hidden />Add location</button>
      </div>
      <section className={clsx(card, "mt-4 overflow-hidden")} aria-label="Locations">
        {list.length ? <ul className="divide-y divide-hms-line">{list.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-[150px] flex-1"><b className="block text-[15px]">{p.name}</b><span className="text-[12.5px] text-hms-muted">{KIND_LABEL[p.kind]}{isSeated(p) && seatCodesOf(p).length ? ` · ${seatCodesOf(p).length} seats (${seatCodesOf(p)[0]}–${seatCodesOf(p).at(-1)})${sharesSeats(p) ? " · shared" : " · whole table"}` : ""}{p.note ? ` · ${p.note}` : ""}</span></div>
            <span className="flex w-[150px] items-center gap-2 text-[13px]"><Switch on={p.visible} onChange={() => r.m.savePlace({ ...p, visible: !p.visible })} label={`${p.name} menu visible`} />{p.visible ? "Menu visible" : "Menu hidden"}</span>
            <span className="flex w-[170px] items-center gap-2 text-[13px]"><Switch on={p.accepting} onChange={() => { r.m.savePlace({ ...p, accepting: !p.accepting }); show(`${p.name}: ${p.accepting ? "not taking orders" : "taking orders"}`); }} label={`${p.name} accepting orders`} />{p.accepting ? "Taking orders" : "Not taking orders"}</span>
            <span className="flex gap-2"><button onClick={() => setQr(p)} className={clsx(btnLine, "h-9 px-3")}><QrCode className="size-4" aria-hidden />QR</button><button onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`} className="grid size-9 place-items-center rounded-lg border border-hms-line hover:bg-hms-hover"><Pencil className="size-4" /></button></span>
          </li>
        ))}</ul> : <p className="px-6 py-12 text-center text-[14.5px] text-hms-muted">No location matches.</p>}
      </section>
      {edit && <PlaceSheet r={r} p={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} onDone={(m) => { show(m); setEdit(null); }} />}
      {qr && <QrSheet r={r} p={qr} onClose={() => setQr(null)} />}
    </MealsFrame>
  );
}
function PlaceSheet({ r, p, onClose, onDone }: { r: Restaurant; p?: Place; onClose: () => void; onDone: (m: string) => void }) {
  const [f, setF] = useState<Place>(p ?? { id: uid("p"), name: "", kind: "table", seats: 4, shared: true, visible: true, accepting: true });
  const [codes, setCodes] = useState((p?.seatCodes ?? []).join(", "));
  const [tried, setTried] = useState(false);
  const dup = r.m.st.places.some((x) => x.id !== f.id && x.name.toLowerCase() === f.name.trim().toLowerCase());
  const seated = isSeated(f);
  const custom = codes.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean);
  const dupCode = custom.length !== new Set(custom).size;
  const badSeats = seated && (!(f.seats ?? 0) || (custom.length > 0 && custom.length !== f.seats) || dupCode);
  const bad = !f.name.trim() || dup || badSeats;
  const shown = seated ? seatCodesOf({ ...f, seatCodes: custom.length === f.seats ? custom : undefined }) : [];
  const save = () => {
    setTried(true); if (bad) return;
    const out: Place = { ...f, name: f.name.trim(), seats: seated ? f.seats : undefined, seatCodes: seated && custom.length ? custom : undefined, shared: f.kind === "private" ? false : f.kind === "bar" ? true : f.shared };
    r.m.savePlace(out); onDone(p ? `${out.name} saved` : `${out.name} added`);
  };
  return (
    <Sheet title={p ? `Edit ${p.name}` : "Add table or QR"} sub="Each table, room or spot gets its own QR" onClose={onClose}
      footer={<><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={save} className={clsx(btnPrimary, "flex-[1.4]")}>Save</button></>}>
      <div className="space-y-4">
        {seated ? <TablePreview kind={f.kind} name={f.name.trim() || "T?"} codes={shown} caption={<><span className="text-hms-muted">Seat codes show on each chair</span><span className="tabular-nums">{shown.length} seats · {f.kind === "private" ? "whole table" : sharesSeats({ ...f, shared: f.shared }) ? "shared" : "whole table"}</span></>} />
          : <div className="flex items-center gap-3 rounded-2xl border border-[#e3e7ec] bg-[#f4f6f8] p-4"><span className="grid size-12 place-items-center rounded-xl bg-white text-hms-muted ring-1 ring-hms-line">{f.kind === "room" ? <BedDouble className="size-6" /> : <Trees className="size-6" />}</span><p className="text-[13.5px] text-[#3a414c]"><b className="block text-[14.5px] text-hms-ink">{f.name.trim() || (f.kind === "room" ? "Room 305" : "Pool side")}</b>{PLACE_KIND[f.kind].hint}. No seats — one QR for the whole {f.kind === "room" ? "room" : "spot"}.</p></div>}
        <div><p className={lbl}>Type</p>
          <div role="radiogroup" aria-label="Type" className="grid grid-cols-3 gap-1.5">{(Object.keys(PLACE_KIND) as PlaceKind[]).map((x) => { const I = KIND_ICON[x]; return (
            <button key={x} type="button" role="radio" aria-checked={f.kind === x} title={PLACE_KIND[x].hint} onClick={() => setF({ ...f, kind: x, seats: PLACE_KIND[x].seated ? f.seats ?? (x === "bar" ? 6 : 4) : undefined, shared: x !== "private" })}
              className={clsx("flex h-[68px] flex-col items-center justify-center gap-1 rounded-xl border text-[12.5px] font-semibold", f.kind === x ? "border-hms-ink bg-white shadow-[inset_0_0_0_1px] shadow-hms-ink" : "border-hms-line text-[#4d5664] hover:border-[#858c97]")}>
              <I className="size-5" aria-hidden />{PLACE_KIND[x].label.replace(" / VIP table", " / VIP").replace(" table", "")}
            </button>); })}</div>
          <p className="mt-1.5 text-[12.5px] text-hms-muted">{PLACE_KIND[f.kind].hint}</p>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <div><label htmlFor="pl-n" className={lbl}>Name</label><input id="pl-n" autoFocus value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} placeholder={f.kind === "room" ? "e.g. Room 305" : f.kind === "general" ? "e.g. Pool side" : f.kind === "bar" ? "e.g. Bar" : f.kind === "event" ? "e.g. Banquet hall" : "e.g. T9"} className={input} /></div>
          {seated && <div><p className={lbl}>Seats</p><div className="flex h-11 items-center rounded-xl border border-hms-line">
            <button type="button" aria-label="One seat less" onClick={() => setF({ ...f, seats: Math.max(1, (f.seats ?? 1) - 1) })} className="grid h-full w-10 place-items-center hover:bg-hms-hover"><Minus className="size-4" /></button>
            <span className="w-8 text-center text-[16px] font-bold tabular-nums" aria-live="polite">{f.seats ?? 0}</span>
            <button type="button" aria-label="One seat more" onClick={() => setF({ ...f, seats: Math.min(f.kind === "bar" ? 12 : 16, (f.seats ?? 0) + 1) })} className="grid h-full w-10 place-items-center hover:bg-hms-hover"><Plus className="size-4" /></button>
          </div></div>}
        </div>
        {tried && (dup ? <p className="-mt-2 text-[13px] font-medium text-[#c81e1e]">This name is already used</p> : !f.name.trim() && <p className="-mt-2 text-[13px] font-medium text-[#c81e1e]">Enter a name</p>)}
        {seated && <>
          {(f.kind === "table" || f.kind === "event") && <label className="flex items-start gap-2.5 rounded-xl border border-hms-line p-3 text-[13.5px]"><input type="checkbox" checked={f.shared !== false} onChange={(x) => setF({ ...f, shared: x.target.checked })} className="mt-0.5 size-4 accent-[#b11c29]" /><span><b>Share the table</b><span className="block text-[12.5px] text-hms-muted">An order blocks only its seats; other guests can sit on the free ones. Off = one order takes the whole table.</span></span></label>}
          <details className="rounded-xl border border-hms-line px-3 py-2.5 text-[13.5px]" open={!!codes}>
            <summary className="cursor-pointer font-semibold">Seat codes <span className="font-normal text-hms-muted">· {shown.join(", ")}</span></summary>
            <input id="pl-c" aria-label="Custom seat codes" value={codes} onChange={(x) => setCodes(x.target.value)} placeholder={`Leave empty for 1S…${f.seats ?? 4}S, or e.g. A1, A2, A3`} className={clsx(input, "mt-2")} />
            <p className="mt-1 text-[12px] text-hms-muted">Comma-separated, one per seat.</p>
          </details>
          {tried && badSeats && <p className="text-[13px] font-medium text-[#c81e1e]">{!(f.seats ?? 0) ? "Add at least one seat" : dupCode ? "Each seat code must be different" : `Give ${f.seats} codes, or leave codes empty`}</p>}
        </>}
        <div><label htmlFor="pl-note" className={lbl}>Note <span className="font-normal text-hms-muted">optional</span></label><input id="pl-note" value={f.note ?? ""} onChange={(x) => setF({ ...f, note: x.target.value || undefined })} placeholder="e.g. Beach side" className={input} /></div>
      </div>
    </Sheet>
  );
}
function QrSheet({ r, p, onClose }: { r: Restaurant; p: Place; onClose: () => void }) {
  const url = `https://${r.h.slug}.bingi.app/menu?${PLACE_KIND[p.kind].qr}=${encodeURIComponent(p.name.replace(/^Room /, ""))}&type=${p.kind}`;
  const [svg, setSvg] = useState("");
  useEffect(() => { QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#0f1720", light: "#ffffff" } }).then(setSvg).catch(() => setSvg("")); }, [url]);
  return (
    <Sheet title={`QR · ${p.name}`} sub={KIND_LABEL[p.kind]} onClose={onClose} footer={<button onClick={onClose} className={clsx(btnLine, "flex-1")}>Close</button>}>
      <div className="mx-auto max-w-[280px] rounded-2xl border border-hms-line p-5 text-center">
        <p className="text-[13px] font-semibold text-hms-muted">{r.h.name}</p>
        <p className="text-[18px] font-bold">Scan to order · {p.name}</p>
        <div role="img" aria-label={`QR code for ${p.name}`} className="mx-auto mt-3 size-[200px] [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 break-all text-[12px] text-hms-muted">{url}</p>
      </div>
      <p className="mt-4 text-[13px] text-hms-muted">{isSeated(p) && sharesSeats(p) ? `Guests pick their seat (${seatCodesOf(p).slice(0, 3).join(", ")}…) when they order, so only those seats are blocked. ` : ""}{p.accepting ? "Guests can see the menu and order." : "Not taking orders now — guests only see the menu."} The link is a prototype address; printing and QR styling are in the live HMS.</p>
    </Sheet>
  );
}
