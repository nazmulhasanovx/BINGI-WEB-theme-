"use client";
// Settings › Billing & plan (sidebar "Plan & Billing"): current plan, this month's running bill, how the month-end
// bill arrives (timeline), auto-pay, bills history with invoice PDF, and plan / cycle change requests.
// Prototype: no money moves. Prices come from the one plan table (same as the public pricing page).
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, Check, ChevronRight, Download, Lock, ReceiptText, Wallet, X } from "lucide-react";
import { useRooms } from "@/lib/rooms/store";
import { useSettings } from "@/lib/settings/store";
import { useLicences } from "@/lib/licences";
import { ledger, summary, useFinance } from "@/lib/finance/store";
import { messagingCost } from "@/lib/communication/store";
import { DUE_DAY, GRACE_DAY, MIN_BILLED, PLANS, dLong, dShort, daysIn, monthBill, monthName, nextMonth, rateOf, roomsInUse, timeline, useBilling, type Cycle, type Invoice, type Line, type PlanId } from "@/lib/billing/store";
import { MANIFESTS, PLAN_LABEL } from "@/themes/manifest";
import { useCommData } from "../communication/data";
import { printHtml } from "../meals/print";
import { Badge, Btn, Card, PageHead, Toggle } from "../website/ui";

const tk = (n: number) => `৳${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
const CYCLES: [Cycle, string][] = [[1, "Monthly"], [6, "6 months · −10%"], [12, "Yearly · −25%"]];
const STATUS: Record<Invoice["status"], ["green" | "amber" | "red", string]> = { paid: ["green", "Paid"], open: ["amber", "Open"], overdue: ["red", "Overdue"] };

function invoiceDoc(h: { name: string; address?: string }, inv: Invoice) {
  const rows = inv.lines.map((l) => `<tr><td>${l.label}<div class="m">${l.detail}</div></td><td class="r">${l.note === "prepaid" ? "Prepaid" : l.note === "price-not-set" ? "Price not set" : tk(l.amount)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${inv.id}</title><style>body{font:14px/1.5 system-ui,sans-serif;color:#0f1720;margin:40px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}td{border-bottom:1px solid #e3e7ec;padding:10px 0;vertical-align:top}.r{text-align:right;white-space:nowrap}.m{color:#4d5664;font-size:12.5px}.t td{font-weight:700;font-size:16px;border:0}.demo{margin-top:24px;color:#7a4a0b;background:#fdf8ec;padding:8px 12px;border-radius:8px}</style></head><body>
<h1>BinGi subscription bill</h1><p class="m">${inv.id} · ${monthName(inv.month)} · issued ${dLong(inv.issued)} · due ${dLong(inv.due)}</p>
<p><b>${h.name}</b><br><span class="m">${h.address ?? ""}</span></p><table>${rows}<tr class="t"><td>Total</td><td class="r">${tk(inv.total)}</td></tr></table>
<p class="m">${inv.status === "paid" ? `Paid ${inv.paidAt ? dLong(inv.paidAt) : ""} · ${inv.paidBy ?? ""}` : "Not paid yet"}</p>
<p class="demo">Prototype bill — no money moved.</p></body></html>`;
}

/** Sidebar "Plan & Billing" opens this page on its own (not inside Settings). */
export function BillingRoute() {
  return <div className="h-full overflow-y-auto bg-[#f4f5f7]"><div className="hms-page hms-page-in"><BillingPage /></div></div>;
}

const METHODS = [
  { id: "bKash", sub: "Approve in the bKash app" },
  { id: "Nagad", sub: "Approve in the Nagad app" },
  { id: "Card", sub: "Visa · Mastercard · Amex" },
  { id: "Bank", sub: "Bank transfer · 1–2 working days" },
] as const;
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

export function BillingPage() {
  const { h, bk, comm } = useCommData();
  const { st: rooms } = useRooms(h);
  const fin = useFinance(h);
  const lic = useLicences(h.slug);
  const bl = useBilling(h, rooms.units);
  const set = useSettings(h);
  const [plansOpen, setPlansOpen] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [sheet, setSheet] = useState<"" | "month" | "autopay" | "contact" | "fees" | "how">("");
  const [toast, setToast] = useState("");
  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast(""), 2400); };
  const ym = bl.today.slice(0, 7);
  const money = useMemo(() => summary(ledger(h, bk.list, messagingCost(comm.st), fin.st.settlements), fin.st.settlements), [h, bk.list, comm.st, fin.st.settlements]);

  // Add-ons and money owed — each comes from its own module.
  const extra: Line[] = [
    ...lic.list.filter((l) => l.source === "purchase" && l.status !== "ended").map((l) => ({ id: `th-${l.theme}`, label: `Paid theme · ${(MANIFESTS as Record<string, { name: string }>)[l.theme]?.name ?? l.theme}`, detail: "Monthly add-on", amount: 0, note: "price-not-set" })),
    ...(money.owed > 0 ? [{ id: "owed", label: "BinGi fees not covered by online payments", detail: "From Finance (booking fees, SMS)", amount: Math.round(money.owed) }] : []),
  ];
  const cur = monthBill(h, rooms.units, ym, bl.st.cycle, extra);
  const inUse = roomsInUse(rooms.units).length;
  const tl = timeline(ym);
  const enterprise = h.plan === "enterprise";
  const plan = h.plan as PlanId;
  const cycleLabel = CYCLES.find((c) => c[0] === bl.st.cycle)![1].split(" ·")[0];
  const open = bl.open;
  const billed = Math.max(MIN_BILLED, inUse);
  const contact = set.st.profile.billingName;

  return (
    <div className="mx-auto max-w-[780px]">
      <h1 className="text-[28px] font-bold tracking-[-0.02em]">Plan &amp; Billing</h1>

      {/* summary — the one place with the plan, the next bill and Pay */}
      <section aria-label="Pay" className="mt-5 overflow-hidden rounded-[22px] bg-white shadow-[0_1px_2px_rgb(15_23_32/0.06),0_12px_32px_-18px_rgb(15_23_32/0.25)] ring-1 ring-black/[0.04]">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-[#e5484d] to-[#9b1c26] text-white shadow-[0_6px_16px_-8px_rgb(177_28_41/0.8)]"><ReceiptText className="size-7" strokeWidth={1.8} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-semibold leading-tight">BinGi {PLAN_LABEL[h.plan]}</p>
            <p className="text-[14px] text-hms-muted">{enterprise ? "Billed by agreement with BinGi" : `${tk(cur.rate)} per room / month · ${cycleLabel}`}</p>
          </div>
          {!enterprise && <button onClick={() => setPlansOpen(true)} className="h-9 rounded-full bg-[#f1f2f5] px-4 text-[14px] font-semibold text-hms-ink hover:bg-[#e8eaee]">Change plan</button>}
        </div>
        <div className={clsx("flex flex-wrap items-center gap-4 border-t px-5 py-4", open ? (open.status === "overdue" ? "border-[#f3d0cc] bg-[#fdf3f2]" : "border-[#f2e3c3] bg-[#fffaf0]") : "border-hms-line")}>
          <div className="min-w-0 flex-1">
            {open ? <>
              <p className={clsx("text-[13px] font-semibold", open.status === "overdue" ? "text-[#a3261f]" : "text-[#8a5300]")}>{open.status === "overdue" ? "Overdue — online booking is paused until paid" : `${monthName(open.month)} bill · pay by ${dLong(open.due)}`}</p>
              <p className="text-[30px] font-bold leading-tight tabular-nums">{tk(open.total)}</p>
            </> : <>
              <p className="text-[13px] font-medium text-hms-muted">Next bill · {dShort(tl[3].date)} · pay by {dShort(tl[4].date)}</p>
              <p className="text-[30px] font-bold leading-tight tabular-nums">{tk(cur.total)} <span className="text-[14px] font-medium text-hms-muted">so far</span></p>
            </>}
          </div>
          {open ? <span className="flex gap-2">
            <button onClick={() => printHtml(invoiceDoc(h, open))} aria-label={`Bill PDF ${monthName(open.month)}`} className="grid size-11 place-items-center rounded-full bg-white text-hms-ink ring-1 ring-hms-line hover:bg-hms-hover"><Download className="size-[18px]" /></button>
            <button onClick={() => setPaying(open)} className="btn-glow inline-flex h-11 items-center gap-2 rounded-full px-6 text-[15px] font-semibold text-white"><Wallet className="size-[18px]" />Pay now</button>
          </span> : <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#e8f4ec] px-3.5 text-[13.5px] font-semibold text-[#1c7d45]"><Check className="size-4" />Nothing due now</span>}
        </div>
      </section>

      {/* iOS-style rows; each opens a sheet */}
      <ul className="mt-6 divide-y divide-hms-line overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.05]" aria-label="Billing details">
        <IosRow label="Rooms billed" value={enterprise ? "—" : String(billed)} onClick={() => setSheet("month")} />
        <IosRow label="Auto-pay" value={bl.st.autopay ? `On · ${bl.st.method}` : "Off"} onClick={() => setSheet("autopay")} />
        <IosRow label="Bills go to" value={contact || "Not set"} warn={!contact} onClick={() => setSheet("contact")} />
        {!enterprise && <IosRow label="Booking fees" value={`${PLANS[plan].fees[0]}% · ${PLANS[plan].fees[1]}% · 0%`} onClick={() => setSheet("fees")} />}
        <IosRow label="How billing works" onClick={() => setSheet("how")} />
      </ul>
      {bl.st.change && <p className="mt-3 rounded-2xl bg-[#eef3fd] px-4 py-3 text-[13.5px] text-[#1e3a8a]">Asked: <b>{PLANS[bl.st.change.plan].label} · {CYCLES.find((c) => c[0] === bl.st.change!.cycle)![1]}</b> from {dLong(bl.st.change.from)} — BinGi confirms it. <button onClick={() => { bl.cancelChange(); say("Change request cancelled"); }} className="font-semibold underline underline-offset-2">Cancel</button></p>}

      {/* bills */}
      <p className="mb-2 mt-7 px-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-hms-muted">Bills</p>
      <ul className="divide-y divide-hms-line overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.05]" aria-label="Bills">
        {bl.invoices.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 px-5 py-3.5">
            <span className="min-w-0 flex-1"><b className="block text-[15px] font-semibold">{monthName(inv.month)}</b>
              <span className={clsx("text-[13px]", inv.status === "paid" ? "text-hms-muted" : inv.status === "overdue" ? "font-medium text-[#a3261f]" : "font-medium text-[#8a5300]")}>{inv.status === "paid" ? `Paid ${inv.paidAt ? dShort(inv.paidAt) : ""} · ${inv.paidBy}` : inv.status === "overdue" ? "Overdue" : `Pay by ${dShort(inv.due)}`}</span></span>
            <b className="text-[15px] font-semibold tabular-nums">{tk(inv.total)}</b>
            {inv.status !== "paid" && <button onClick={() => setPaying(inv)} className="btn-glow inline-flex h-9 items-center rounded-full px-4 text-[13.5px] font-semibold text-white">Pay</button>}
            <button onClick={() => printHtml(invoiceDoc(h, inv))} aria-label={`Bill PDF ${monthName(inv.month)}`} className="grid size-9 place-items-center rounded-full text-hms-muted hover:bg-hms-hover hover:text-hms-ink"><Download className="size-[18px]" /></button>
          </li>
        ))}
        {!bl.invoices.length && <li className="px-5 py-5 text-[14px] text-hms-muted">No bills yet. The first one comes on {dLong(tl[3].date)}.</li>}
      </ul>

      {!enterprise && <section aria-label="Demo" className="mt-6 flex flex-wrap items-center gap-2 px-1 text-[12.5px] text-hms-muted">
        <CalendarClock className="size-4" /><span className="mr-auto">Prototype — no money moves.</span>
        <Btn variant="outline" disabled={bl.st.invoices.some((i) => i.month === ym)} onClick={() => { bl.demoCloseMonth(ym, cur.lines, cur.total, false); say(`${monthName(ym)} bill is ready`); }}>Make {monthName(ym)} bill</Btn>
        <Btn variant="outline" disabled={!bl.open || bl.open.status === "overdue"} onClick={() => bl.demoOverdue()}>Skip past grace</Btn>
        <Btn variant="ghost" onClick={() => { bl.demoReset(); say("Demo reset"); }}>Reset</Btn>
      </section>}

      {sheet === "month" && <Sheet title={`${monthName(ym)} so far`} onClose={() => setSheet("")}>
        <ul className="divide-y divide-hms-line text-[14.5px]" aria-label="This month's bill">
          {cur.lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3 py-3">
              <span className="min-w-0"><span className="block font-medium">{l.label}</span><span className="block text-[13px] text-hms-muted">{l.detail}</span></span>
              <span className="shrink-0 text-right font-semibold tabular-nums">{l.note === "prepaid" ? <span className="text-hms-muted">Prepaid</span> : l.note === "price-not-set" ? <span className="text-[12.5px] text-[#7a4a0b]">Price not set</span> : tk(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-baseline justify-between border-t border-hms-line pt-3"><span className="font-semibold">Expected on {dShort(tl[3].date)}</span><span className="text-[22px] font-bold tabular-nums">{tk(cur.total)}</span></div>
        <p className="mt-3 text-[13px] text-hms-muted">{inUse ? `${plural(inUse, "room")} published.` : "No rooms published yet."} At least {plural(MIN_BILLED, "room")} is billed.</p>
      </Sheet>}
      {sheet === "autopay" && <Sheet title="Auto-pay" onClose={() => setSheet("")}>
        <div className="flex items-center justify-between gap-3"><span className="text-[15px] font-medium">Pay each bill by itself</span><Toggle on={bl.st.autopay} onChange={(v) => { bl.setAutopay(v); say(v ? "Auto-pay on" : "Auto-pay off"); }} label="Auto-pay" /></div>
        <p className="mt-2 text-[13.5px] text-hms-muted">First from your BinGi balance (<b className="text-hms-ink tabular-nums">{tk(money.available)}</b> — online booking money BinGi holds for you), then:</p>
        <div role="radiogroup" aria-label="Auto-pay method" className="mt-3 flex gap-1.5">{(["bKash", "Card", "Bank"] as const).map((m) => <button key={m} role="radio" aria-checked={bl.st.method === m} onClick={() => bl.setMethod(m)} className={clsx("h-10 flex-1 rounded-xl text-[14px] font-semibold", bl.st.method === m ? "bg-[#ffecec] text-[#c8232e] ring-1 ring-[#f3c4c0]" : "bg-[#f1f2f5] text-[#3a414c] hover:bg-[#e8eaee]")}>{m}</button>)}</div>
      </Sheet>}
      {sheet === "contact" && <Sheet title="Bills go to" onClose={() => setSheet("")}><BillingContact h={h} set={set} say={(t) => { say(t); if (t === "Saved") setSheet(""); }} /></Sheet>}
      {sheet === "fees" && !enterprise && <Sheet title="Booking fees" onClose={() => setSheet("")}>
        <ul className="divide-y divide-hms-line text-[14.5px]">{([["Marketplace", PLANS[plan].fees[0]], ["Website", PLANS[plan].fees[1]], ["Walk-in", 0]] as const).map(([k, v]) => <li key={k} className="flex justify-between py-2.5"><span>{k}</span><b className="tabular-nums">{v}%</b></li>)}</ul>
        <p className="mt-3 text-[13.5px] text-hms-muted">Taken from online payments in <Link href="/hms/finance" className="underline underline-offset-2">Finance</Link> — not on this bill.</p>
      </Sheet>}
      {sheet === "how" && <Sheet title="How billing works" onClose={() => setSheet("")}>
        <ul className="space-y-3 text-[14px] text-hms-muted">
          <li><b className="text-hms-ink">Pay after use.</b> The bill on the 1st is for the month that just ended. Pay by the {DUE_DAY}th.</li>
          <li><b className="text-hms-ink">Rooms.</b> Billed on published rooms (at least {MIN_BILLED}). A room added mid-month counts only for the days left.</li>
          <li><b className="text-hms-ink">6 or 12 months.</b> Paid at the start at the lower rate; monthly bills then only carry extra rooms and add-ons.</li>
          <li><b className="text-hms-ink">Late.</b> Reminders on the 1st, 5th and {DUE_DAY}th. After the {GRACE_DAY}th, online booking pauses until paid — never your data.</li>
        </ul>
      </Sheet>}
      {paying && <PaySheet inv={paying} balance={money.available} onClose={() => setPaying(null)} onPaid={(by) => { bl.pay(paying.id, `${by} (demo)`); setPaying(null); say(`${monthName(paying.month)} bill paid · ${by} · demo`); }} />}
      {plansOpen && <PlansSheet current={plan} cycle={bl.st.cycle} rooms={inUse} onClose={() => setPlansOpen(false)} onAsk={(p, c) => { const from = p !== plan && ["starter", "business", "ultra"].indexOf(p) > ["starter", "business", "ultra"].indexOf(plan) ? bl.today : `${nextMonth(bl.today.slice(0, 7))}-01`; bl.askChange({ plan: p, cycle: c, from }); setPlansOpen(false); say("Change request sent to BinGi"); }} />}
      {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><Check className="size-4 text-[#7ee2a8]" />{toast}</div>}
    </div>
  );
}

function IosRow({ label, value, warn, onClick }: { label: string; value?: string; warn?: boolean; onClick: () => void }) {
  return (
    <li><button onClick={onClick} className="flex min-h-[52px] w-full items-center gap-3 px-5 py-3 text-left hover:bg-[#fafafb]">
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      {value && <span className={clsx("truncate text-[15px] tabular-nums", warn ? "font-medium text-[#8a5300]" : "text-hms-muted")}>{value}</span>}
      <ChevronRight className="size-[18px] shrink-0 text-[#b8bdc7]" aria-hidden />
    </button></li>
  );
}
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="hms-up w-full max-w-[480px] rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[17px] font-bold">{title}</h2><button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full bg-[#f1f2f5] text-hms-muted hover:text-hms-ink"><X className="size-4" /></button></div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Pick a method → confirm. Prototype: marks the bill paid; no gateway is called. */
function PaySheet({ inv, balance, onClose, onPaid }: { inv: Invoice; balance: number; onClose: () => void; onPaid: (by: string) => void }) {
  const [m, setM] = useState<string>(balance >= inv.total ? "BinGi balance" : "bKash");
  const opts = [...(balance >= inv.total ? [{ id: "BinGi balance", sub: `${tk(balance)} available` }] : []), ...METHODS];
  return createPortal(
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Pay bill" onClick={(e) => e.stopPropagation()} className="hms-up w-full max-w-[460px] overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-hms-line px-5 py-4">
          <p className="text-[13px] text-hms-muted">{monthName(inv.month)} bill · {inv.id}</p>
          <p className="text-[28px] font-bold tabular-nums">{tk(inv.total)}</p>
        </div>
        <div role="radiogroup" aria-label="Pay with" className="space-y-2 p-5">
          <p className="text-[13.5px] font-semibold">Pay with</p>
          {opts.map((o) => (
            <button key={o.id} role="radio" aria-checked={m === o.id} onClick={() => setM(o.id)} className={clsx("flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left", m === o.id ? "border-[#c8232e] bg-[#fff6f6]" : "border-hms-line hover:border-[#c9ced6]")}>
              <span className={clsx("size-4 shrink-0 rounded-full border-2", m === o.id ? "border-[#c8232e] bg-[#c8232e] shadow-[inset_0_0_0_3px_white]" : "border-[#b8bdc7]")} />
              <span><b className="block text-[14.5px]">{o.id}</b><span className="text-[12.5px] text-hms-muted">{o.sub}</span></span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-hms-line px-5 py-3.5">
          <p className="mr-auto text-[12.5px] text-hms-muted">Prototype — nothing is charged.</p>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <button onClick={() => onPaid(m)} className="btn-glow inline-flex h-10 items-center rounded-xl px-4 text-[14px] font-semibold text-white">Pay {tk(inv.total)}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Who gets bills and reminders (moved here from Property profile). */
function BillingContact({ h, set, say }: { h: { name: string }; set: ReturnType<typeof useSettings>; say: (t: string) => void }) {
  const p = set.st.profile;
  const [d, setD] = useState({ name: p.billingName, phone: p.billingPhone, email: p.billingEmail });
  const dirty = d.name !== p.billingName || d.phone !== p.billingPhone || d.email !== p.billingEmail;
  const save = () => {
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return say("Check the email");
    if (d.phone && !/^(\+?880|0)1[3-9]\d{8}$/.test(d.phone.replace(/[\s-]/g, ""))) return say("Check the phone number");
    set.save((s) => { s.profile.billingName = d.name.trim(); s.profile.billingPhone = d.phone.trim(); s.profile.billingEmail = d.email.trim(); }, "Billing contact updated");
    say("Saved");
  };
  const inp = "h-10 w-full rounded-lg border border-hms-line bg-white px-3 text-[14px] outline-none focus:border-hms-coral";
  return (
    <div>
      <div className="grid gap-2.5">
        <input aria-label="Billing contact name" placeholder={`Name (e.g. owner of ${h.name})`} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inp} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input aria-label="Billing phone" inputMode="tel" placeholder="Phone for SMS" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} className={inp} />
          <input aria-label="Billing email" type="email" placeholder="Email for the PDF" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} className={inp} />
        </div>
      </div>
      <p className="mt-2 text-[12.5px] text-hms-muted">Gets the bill PDF and reminders by SMS and email.</p>
      <div className="mt-4 flex justify-end"><Btn disabled={!dirty} onClick={save}>Save</Btn></div>
    </div>
  );
}

function PlansSheet({ current, cycle, rooms, onClose, onAsk }: { current: PlanId; cycle: Cycle; rooms: number; onClose: () => void; onAsk: (p: PlanId, c: Cycle) => void }) {
  const [c, setC] = useState<Cycle>(cycle);
  const [pick, setPick] = useState<PlanId>(current);
  const billed = Math.max(MIN_BILLED, rooms);
  const order: PlanId[] = ["starter", "business", "ultra"];
  const up = order.indexOf(pick) > order.indexOf(current), down = order.indexOf(pick) < order.indexOf(current);
  return createPortal(
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Plans & prices" onClick={(e) => e.stopPropagation()} className="hms-up flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-hms-line px-5 py-4">
          <h2 className="mr-auto text-[17px] font-bold">Plans &amp; prices</h2>
          <div role="radiogroup" aria-label="Billing cycle" className="inline-flex gap-0.5 rounded-[12px] border border-hms-line p-1">{CYCLES.map(([k, l]) => <button key={k} role="radio" aria-checked={c === k} onClick={() => setC(k)} className={clsx("h-9 rounded-[10px] px-3 text-[13px] font-semibold", c === k ? "bg-[#ffecec] text-[#c8232e]" : "text-hms-muted hover:text-hms-ink")}>{l}</button>)}</div>
        </div>
        <div className="grid min-h-0 gap-3 overflow-y-auto p-5 md:grid-cols-3">
          {order.map((p) => { const r = rateOf(p, c); const on = pick === p; return (
            <button key={p} role="radio" aria-checked={on} aria-label={`${PLANS[p].label} plan`} onClick={() => setPick(p)} className={clsx("flex flex-col items-stretch justify-start rounded-2xl border p-4 text-left transition-colors", on ? "border-[#f3c4c0] bg-[#fff6f6]" : "border-hms-line hover:border-[#c9ced6]")}>
              <span className="flex items-center justify-between"><b className="text-[16px]">{PLANS[p].label}</b>{p === current && <Badge tone="blue">Current</Badge>}</span>
              <span className="mt-1 block text-[24px] font-bold tabular-nums">৳{r}<span className="text-[13px] font-medium text-hms-muted"> / room / month</span></span>
              <span className="block text-[12.5px] text-hms-muted">{billed} rooms → {tk(billed * r * c)}{c > 1 ? ` every ${c} months` : " a month"}</span>
              <ul className="mt-3 space-y-1 text-[13px]">{PLANS[p].includes.map(([, en]) => <li key={en} className="flex gap-1.5"><Check className="mt-0.5 size-3.5 shrink-0 text-[#16a34a]" />{en}</li>)}</ul>
            </button>
          ); })}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-hms-line px-5 py-3.5">
          <p className="mr-auto min-w-0 flex-1 text-[13px] text-hms-muted">{pick === current && c === cycle ? "This is your plan." : up ? "Upgrade starts today. The new price counts from today on this month's bill." : down ? <><Lock className="mr-1 inline size-3.5" />Downgrade starts on the 1st of next month. Modules not in the new plan lock then; data stays.</> : "Cycle change starts with the next bill."}</p>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          <button disabled={pick === current && c === cycle} onClick={() => onAsk(pick, c)} className="btn-glow inline-flex h-10 items-center rounded-xl px-4 text-[14px] font-semibold text-white disabled:opacity-45">Ask BinGi to change</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
