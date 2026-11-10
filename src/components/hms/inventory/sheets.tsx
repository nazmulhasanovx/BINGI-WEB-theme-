"use client";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, CircleAlert, Info, SlidersHorizontal } from "lucide-react";
import { UNITS, fmtQty, q, type Category, type Item, type MoveType, type Supplier, type Unit } from "@/lib/inventory/store";
import type { useInventory } from "@/lib/inventory/store";
import { Sheet, btnLine, btnPrimary, input, lbl } from "../guests/ui";

type Inv = ReturnType<typeof useInventory>;
const Err = ({ children }: { children: ReactNode }) => <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-[#c81e1e]"><CircleAlert className="size-3.5" />{children}</p>;
const Hint = ({ children }: { children: ReactNode }) => <p className="flex items-center gap-2 rounded-lg bg-[#f4f2fb] px-3 py-2 text-[13px] text-[#4d5664]"><Info className="size-4 shrink-0 text-[#6b55e0]" />{children}</p>;
const Foot = ({ onClose, label, onSave, disabled }: { onClose: () => void; label: string; onSave: () => void; disabled?: boolean }) => (
  <><button onClick={onClose} className={clsx(btnLine, "flex-1")}>Cancel</button><button onClick={onSave} disabled={disabled} className={clsx(btnPrimary, "flex-1")}>{label}</button></>
);
function Fold({ title, sub, open: o = false, children }: { title: string; sub: string; open?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="rounded-xl border border-hms-line">
      <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <SlidersHorizontal className="size-4 text-hms-muted" /><span className="flex-1 text-[14px] font-semibold">{title}</span>
        <span className="hidden text-[12.5px] text-hms-muted sm:inline">{sub}</span><ChevronDown className={clsx("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-3 border-t border-hms-line p-4">{children}</div>}
    </div>
  );
}
function QtyInput({ id, value, onChange, unit, invalid }: { id: string; value: string; onChange: (v: string) => void; unit: string; invalid?: boolean }) {
  return (
    <div className={clsx("flex h-11 items-center rounded-lg border bg-white pr-3 focus-within:ring-2", invalid ? "border-[#c81e1e] focus-within:ring-[#c81e1e]/15" : "border-[#858c97] focus-within:border-hms-ink focus-within:ring-hms-ink/10")}>
      <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))} aria-invalid={invalid} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none" />
      <span className="text-[13px] text-hms-muted">{unit}</span>
    </div>
  );
}

// ---------------- Item ----------------
export function ItemSheet({ inv, item, onClose }: { inv: Inv; item?: Item; onClose: () => void }) {
  const cats = inv.st.categories, sups = inv.st.suppliers;
  const [f, setF] = useState(() => ({
    name: item?.name ?? "", unit: (item?.unit ?? "pcs") as Unit, opening: "", category: item?.category ?? cats[0]?.id ?? "", sku: item?.sku ?? "",
    supplier: item?.supplier ?? "", reorder: item ? String(item.reorder) : "", cost: item ? String(item.cost) : "",
  }));
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const sku = f.sku.trim() || inv.nextSku(f.category);
  const dupName = inv.items.some((i) => i.id !== item?.id && i.name.trim().toLowerCase() === f.name.trim().toLowerCase());
  const dupSku = inv.st.items.some((i) => i.id !== item?.id && i.sku.toUpperCase() === sku.toUpperCase());
  const errs = { name: !f.name.trim() ? "Enter the item name" : dupName ? "An item with this name already exists" : "", sku: dupSku ? "This SKU is already used" : "" };
  const save = () => {
    setTried(true);
    if (errs.name || errs.sku) return;
    inv.saveItem({ id: item?.id ?? inv.newId("i"), name: f.name.trim(), sku: sku.toUpperCase(), unit: f.unit, category: f.category, supplier: f.supplier, reorder: q(Number(f.reorder) || 0), cost: Number(f.cost) || 0, qty: item?.qty ?? 0 }, item ? undefined : Number(f.opening) || 0);
    onClose();
  };
  return (
    <Sheet title={item ? "Edit Item" : "Add Item"} sub={item ? `${item.sku} · stock changes only through movements` : "Create an item and set its starting quantity."} onClose={onClose} footer={<Foot onClose={onClose} label="Save Item" onSave={save} />}>
      <div className="space-y-4">
        <p className="text-[14px] font-semibold">Item details</p>
        <div><label htmlFor="it-name" className={lbl}>Item Name</label><input id="it-name" autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Bath Mat" className={input} />{tried && errs.name && <Err>{errs.name}</Err>}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="it-unit" className={lbl}>Unit</label><select id="it-unit" value={f.unit} onChange={(e) => set("unit", e.target.value)} className={input}>{UNITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          {item ? <div><p className={lbl}>Available</p><p className="flex h-11 items-center rounded-lg bg-[#f4f6f8] px-3 text-[15px] font-semibold">{fmtQty(item.qty, item.unit)}</p></div>
            : <div><label htmlFor="it-open" className={lbl}>Opening Stock</label><QtyInput id="it-open" value={f.opening} onChange={(v) => set("opening", v)} unit={f.unit} /></div>}
        </div>
        <Fold title="Item settings" sub="SKU, category, supplier & more" open={!!item}>
          <div className="grid grid-cols-2 gap-3">
            <div><label htmlFor="it-cat" className={lbl}>Category</label><select id="it-cat" value={f.category} onChange={(e) => set("category", e.target.value)} className={input}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}{!cats.length && <option value="">No categories yet</option>}</select></div>
            <div><label htmlFor="it-sku" className={lbl}>SKU</label><input id="it-sku" value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder={sku} className={input} />{tried && errs.sku && <Err>{errs.sku}</Err>}</div>
            <div><label htmlFor="it-sup" className={lbl}>Default Supplier</label><select id="it-sup" value={f.supplier} onChange={(e) => set("supplier", e.target.value)} className={input}><option value="">None</option>{sups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label htmlFor="it-re" className={lbl}>Reorder Level</label><QtyInput id="it-re" value={f.reorder} onChange={(v) => set("reorder", v)} unit={f.unit} /></div>
            <div className="col-span-2"><label htmlFor="it-cost" className={lbl}>Unit Cost (৳)</label><input id="it-cost" inputMode="decimal" value={f.cost} onChange={(e) => set("cost", e.target.value.replace(/[^\d.]/g, ""))} placeholder="0" className={input} /></div>
          </div>
        </Fold>
        {!item && <Hint>Enter 0 if this item has no stock yet. Low-stock alerts use the reorder level.</Hint>}
      </div>
    </Sheet>
  );
}

// ---------------- Movements ----------------
const MOVE_UI: Record<Exclude<MoveType, "opening">, { title: string; sub: string; qty: string; save: string; noteReq: boolean }> = {
  receive: { title: "Receive Stock", sub: "Add stock received from a supplier.", qty: "Quantity Received", save: "Save Receipt", noteReq: false },
  issue: { title: "Issue Stock", sub: "Record stock used by your property.", qty: "Quantity Issued", save: "Save Issue", noteReq: false },
  wastage: { title: "Record Wastage", sub: "Record damaged or unusable stock.", qty: "Wasted Quantity", save: "Save Wastage", noteReq: true },
  adjust: { title: "Adjust Stock", sub: "Reconcile the balance after a physical count.", qty: "Counted Quantity", save: "Save Adjustment", noteReq: true },
};
export function MoveSheet({ inv, type, itemId, onClose, onDone }: { inv: Inv; type: Exclude<MoveType, "opening">; itemId?: string; onClose: () => void; onDone: (msg: string) => void }) {
  const ui = MOVE_UI[type];
  const [id, setId] = useState(itemId ?? inv.items[0]?.id ?? "");
  const it = inv.items.find((x) => x.id === id);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [ref, setRef] = useState("");
  const [sup, setSup] = useState(it?.supplier ?? "");
  const [cost, setCost] = useState(it ? String(it.cost) : "");
  const [err, setErr] = useState("");
  const n = Number(amt);
  const after = !it || amt === "" ? null : q(type === "receive" ? it.qty + n : type === "adjust" ? n : it.qty - n);
  const over = !!it && (type === "issue" || type === "wastage") && amt !== "" && n > it.qty;
  const pick = (v: string) => { setId(v); const x = inv.items.find((y) => y.id === v); setSup(x?.supplier ?? ""); setCost(x ? String(x.cost) : ""); setErr(""); };
  const save = () => {
    if (ui.noteReq && !note.trim()) { setErr("Add a short note — it shows in Movement History."); return; }
    const e = inv.move(type, id, n, { note: note.trim(), ref: ref.trim(), supplier: type === "receive" ? sup : undefined, cost: type === "receive" ? Number(cost) || undefined : undefined });
    if (e) { setErr(e); return; }
    onDone(`${ui.title.replace("Record ", "")} saved — ${it?.name}`);
    onClose();
  };
  if (!inv.items.length) return <Sheet title={ui.title} onClose={onClose} footer={<button onClick={onClose} className={clsx(btnLine, "flex-1")}>Close</button>}><p className="text-[14.5px] text-hms-muted">Add an item first, then record its movements.</p></Sheet>;
  return (
    <Sheet title={ui.title} sub={ui.sub} onClose={onClose} footer={<Foot onClose={onClose} label={ui.save} onSave={save} disabled={!it || amt === "" || over || (type !== "adjust" && !(n > 0))} />}>
      <div className="space-y-4">
        <p className="text-[14px] font-semibold">Movement details</p>
        <div><label htmlFor="mv-item" className={lbl}>Stock Item</label>
          <select id="mv-item" value={id} onChange={(e) => pick(e.target.value)} className={input}>{inv.items.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.sku}</option>)}</select></div>
        <div><label htmlFor="mv-qty" className={lbl}>{ui.qty}</label><QtyInput id="mv-qty" value={amt} onChange={(v) => { setAmt(v); setErr(""); }} unit={it?.unit ?? ""} invalid={over} />
          {over && it && <Err>Enter {fmtQty(it.qty, it.unit)} or less. This item has {fmtQty(it.qty, it.unit)} available.</Err>}
          {type === "adjust" && <p className="mt-1 text-[12.5px] text-hms-muted">Enter the total quantity you physically counted.</p>}</div>
        {it && (
          <div className="flex items-center gap-3 rounded-lg bg-[#f4f6f8] px-4 py-3">
            <span className="flex-1"><span className="block text-[14px] font-semibold">Stock balance</span><span className="text-[12.5px] text-hms-muted">{type === "adjust" && after !== null ? `Adjustment of ${after - it.qty > 0 ? "+" : ""}${fmtQty(q(after - it.qty), it.unit)}` : "After saving"}</span></span>
            <span className="tabular-nums text-[14.5px] font-semibold">{fmtQty(it.qty, it.unit)}</span><ArrowRight className="size-4 text-hms-muted" />
            <span className={clsx("tabular-nums text-[15px] font-bold", after === null ? "text-hms-muted" : after < 0 ? "text-[#c81e1e]" : "text-[#16693a]")}>{after === null ? "—" : fmtQty(after, it.unit)}</span>
          </div>
        )}
        {type === "adjust" && <Hint>The change appears in Movement History with the counted balance.</Hint>}
        {type === "receive" ? (
          <Fold title="Supplier & cost details" sub="Supplier, unit cost & invoice" open>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="mv-sup" className={lbl}>Supplier</label><select id="mv-sup" value={sup} onChange={(e) => setSup(e.target.value)} className={input}><option value="">None</option>{inv.st.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label htmlFor="mv-cost" className={lbl}>Unit Cost (৳)</label><input id="mv-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^\d.]/g, ""))} className={input} /></div>
              <div className="col-span-2"><label htmlFor="mv-ref" className={lbl}>Supplier Invoice / Reference</label><input id="mv-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. INV-CS-105" className={input} /></div>
            </div>
          </Fold>
        ) : null}
        <div><label htmlFor="mv-note" className={clsx(lbl, "flex justify-between")}>Note <span className="font-normal text-hms-muted">{ui.noteReq ? "Required" : "Optional"}</span></label>
          <textarea id="mv-note" rows={3} value={note} onChange={(e) => { setNote(e.target.value); setErr(""); }} placeholder={type === "issue" ? "e.g. Housekeeping use" : type === "wastage" ? "e.g. Packaging damaged during storage" : type === "adjust" ? "e.g. Physical count at shift handover" : "e.g. Morning delivery"} className={clsx(input, "h-auto py-2.5")} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">{(type === "issue" ? ["Housekeeping use", "Breakfast service", "Room minibar", "Restaurant"] : type === "wastage" ? ["Damaged", "Expired", "Spilled"] : type === "adjust" ? ["Physical count", "Shift handover"] : ["Morning delivery"]).map((x) => <button key={x} type="button" onClick={() => setNote(x)} className="h-7 rounded-md border border-hms-line px-2 text-[12.5px] hover:bg-hms-hover">{x}</button>)}</div>
        </div>
        {type !== "receive" && (
          <Fold title="Additional details" sub="Reference">
            <div><label htmlFor="mv-ref2" className={lbl}>Reference</label><input id="mv-ref2" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. Room 204 or KOT-118" className={input} /></div>
          </Fold>
        )}
        {err && <Err>{err}</Err>}
      </div>
    </Sheet>
  );
}

// ---------------- Category & supplier ----------------
export function CategorySheet({ inv, cat, onClose }: { inv: Inv; cat?: Category; onClose: () => void }) {
  const [name, setName] = useState(cat?.name ?? "");
  const [tried, setTried] = useState(false);
  const dup = inv.st.categories.some((c) => c.id !== cat?.id && c.name.trim().toLowerCase() === name.trim().toLowerCase());
  const used = cat ? inv.items.filter((i) => i.category === cat.id).length : 0;
  const save = () => { setTried(true); if (!name.trim() || dup) return; inv.saveCategory({ id: cat?.id ?? inv.newId("c"), name: name.trim() }); onClose(); };
  return (
    <Sheet title={cat ? "Edit Category" : "Add Category"} sub={cat ? `${used} item${used === 1 ? "" : "s"}` : "Create an inventory category."} onClose={onClose} footer={<Foot onClose={onClose} label="Save Category" onSave={save} />}>
      <div className="space-y-4">
        <p className="text-[14px] font-semibold">Category details</p>
        <div><label htmlFor="cat-name" className={lbl}>Category Name</label><input id="cat-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maintenance Supplies" className={input} />
          {tried && !name.trim() && <Err>Enter a name</Err>}{tried && dup && <Err>This category already exists</Err>}</div>
        <Hint>Use categories to group and filter stock items.</Hint>
        {cat && <button type="button" disabled={used > 0} onClick={() => { inv.removeCategory(cat.id); onClose(); }} className="text-[13.5px] font-semibold text-[#c81e1e] disabled:text-hms-muted">{used ? "Move its items to another category to delete it" : "Delete category"}</button>}
      </div>
    </Sheet>
  );
}

export function SupplierSheet({ inv, sup, onClose }: { inv: Inv; sup?: Supplier; onClose: () => void }) {
  const [f, setF] = useState<Supplier>(sup ?? { id: inv.newId("s"), name: "", contact: "", phone: "", email: "", address: "" });
  const [tried, setTried] = useState(false);
  const set = (k: keyof Supplier, v: string) => setF((x) => ({ ...x, [k]: v }));
  const dup = inv.st.suppliers.some((s) => s.id !== f.id && s.name.trim().toLowerCase() === f.name.trim().toLowerCase());
  const badEmail = !!f.email && !/^\S+@\S+\.\S+$/.test(f.email);
  const used = inv.items.filter((i) => i.supplier === f.id).length;
  const save = () => { setTried(true); if (!f.name.trim() || dup || badEmail) return; inv.saveSupplier({ ...f, name: f.name.trim() }); onClose(); };
  const opt = <span className="font-normal text-hms-muted">Optional</span>;
  return (
    <Sheet title={sup ? "Edit Supplier" : "Add Supplier"} sub={sup ? `${used} item${used === 1 ? "" : "s"} use this supplier` : "Create a supplier record."} onClose={onClose} footer={<Foot onClose={onClose} label="Save Supplier" onSave={save} />}>
      <div className="space-y-4">
        <p className="text-[14px] font-semibold">Supplier details</p>
        <div><label htmlFor="sp-name" className={lbl}>Supplier Name</label><input id="sp-name" autoFocus value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Seaside Essentials" className={input} />{tried && !f.name.trim() && <Err>Enter a name</Err>}{tried && dup && <Err>This supplier already exists</Err>}</div>
        <div><label htmlFor="sp-c" className={clsx(lbl, "flex justify-between")}>Contact Name {opt}</label><input id="sp-c" value={f.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Vendor representative" className={input} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="sp-p" className={clsx(lbl, "flex justify-between")}>Phone {opt}</label><input id="sp-p" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXX-XXXXXX" className={input} /></div>
          <div><label htmlFor="sp-e" className={clsx(lbl, "flex justify-between")}>Email {opt}</label><input id="sp-e" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="Enter email" className={input} />{tried && badEmail && <Err>Check the email</Err>}</div>
        </div>
        <div><label htmlFor="sp-a" className={clsx(lbl, "flex justify-between")}>Address {opt}</label><textarea id="sp-a" rows={3} value={f.address} onChange={(e) => set("address", e.target.value)} placeholder="Enter address" className={clsx(input, "h-auto py-2.5")} /></div>
        {sup && <button type="button" disabled={used > 0} onClick={() => { inv.removeSupplier(sup.id); onClose(); }} className="text-[13.5px] font-semibold text-[#c81e1e] disabled:text-hms-muted">{used ? "Items use this supplier — change them to delete it" : "Delete supplier"}</button>}
      </div>
    </Sheet>
  );
}
