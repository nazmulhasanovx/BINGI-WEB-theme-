"use client";
// Settings › Billing & plan (sidebar "Billing & Subscription"): current plan, this month's running bill, how the month-end
// bill arrives (timeline), auto-pay, bills history with invoice PDF, and plan / cycle change requests.
// Prototype: no money moves. Prices come from the one plan table (same as the public pricing page).
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CalendarClock, Check, Download, Lock, Wallet } from "lucide-react";
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

/** Sidebar "Billing & Subscription" opens this page on its own (not inside Settings). */
export function BillingRoute() {
  return <div className="h-full overflow-y-auto"><div className="hms-page hms-page-in max-w-[1180px]"><BillingPage /></div></div>;
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

  return (
    <>
      <PageHead title="Billing" desc={`Your BinGi bill for ${h.name}.`} actions={!enterprise ? <Btn variant="outline" onClick={() => setPlansOpen(true)}>Change plan</Btn> : undefined} />

      {/* 1 — what to pay now */}
      <section aria-label="Pay" className={clsx("rounded-2xl border p-5 sm:p-6", open ? (open.status === "overdue" ? "border-[#f3c4c0] bg-[#fdf3f3]" : "border-[#f1dfb8] bg-[#fffaf0]") : "border-hms-line bg-white")}>
        {open ? (
          <div className="flex flex-wrap items-center gap-5">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[14px] font-semibold"><Badge tone={STATUS[open.status][0]}>{open.status === "overdue" ? "Overdue" : "To pay"}</Badge>{monthName(open.month)} bill</p>
              <p className="mt-2 text-[36px] font-bold leading-none tabular-nums">{tk(open.total)}</p>
              <p className="mt-2 text-[14px] text-hms-muted">{open.status === "overdue" ? "Online booking pauses until this is paid. Your data and bookings stay." : `Pay by ${dLong(open.due)}.`}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => printHtml(invoiceDoc(h, open))} className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-hms-line bg-white px-4 text-[14.5px] font-semibold hover:bg-hms-hover"><Download className="size-4" />Bill PDF</button>
              <button onClick={() => setPaying(open)} className="btn-glow inline-flex h-12 items-center gap-2 rounded-xl px-6 text-[15.5px] font-semibold text-white"><Wallet className="size-5" />Pay now</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8f4ec] text-[#1c7d45]"><Check className="size-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-semibold">Nothing to pay now</p>
              <p className="mt-0.5 text-[14px] text-hms-muted">Next bill: about <b className="text-hms-ink tabular-nums">{tk(cur.total)}</b> on {dLong(tl[3].date)} · pay by {dLong(tl[4].date)}{bl.st.autopay ? " · auto-pay is on" : ""}</p>
            </div>
          </div>
        )}
        {/* short timeline */}
        <ol aria-label="When you pay" className="mt-5 grid grid-cols-3 gap-2 border-t border-black/5 pt-4 text-[13px]">
          {[["Now", open ? `${monthName(open.month)} bill open` : `${monthName(ym)} running`, true], [dShort(tl[3].date), "Bill comes (PDF + SMS)", false], [dShort(tl[4].date), "Pay by this day", false]].map(([d2, txt, on], i) => (
            <li key={i} className="flex items-start gap-2"><span className={clsx("mt-1 size-2.5 shrink-0 rounded-full", on ? "bg-[#c8232e]" : "bg-[#c6ccd4]")} /><span><b className="block font-semibold">{d2 as string}</b><span className="text-hms-muted">{txt as string}</span></span></li>
          ))}
        </ol>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 2 — plan */}
        <Card title="Your plan" action={<Badge tone="blue">{PLAN_LABEL[h.plan]}</Badge>}>
          {enterprise ? <p className="text-[14px]">Billed by agreement with BinGi.</p> : <>
            <p className="text-[28px] font-bold tabular-nums">{tk(cur.rate)}<span className="text-[14px] font-medium text-hms-muted"> per room / month · {cycleLabel}</span></p>
            <p className="mt-1 text-[14px]">{inUse ? `${plural(billed, "room")} billed` : `No rooms published yet — ${plural(MIN_BILLED, "room")} is billed`}</p>
            <p className="mt-2 text-[13px] text-hms-muted">Booking fee {PLANS[plan].fees[0]}% marketplace · {PLANS[plan].fees[1]}% website · 0% walk-in — taken in <Link href="/hms/finance" className="underline underline-offset-2">Finance</Link>, not on this bill.</p>
            {bl.st.change && <p className="mt-3 rounded-xl bg-[#eef3fd] px-3 py-2 text-[13px] text-[#1e3a8a]">Asked: <b>{PLANS[bl.st.change.plan].label} · {CYCLES.find((c) => c[0] === bl.st.change!.cycle)![1]}</b> from {dLong(bl.st.change.from)}. <button onClick={() => { bl.cancelChange(); say("Change request cancelled"); }} className="font-semibold underline underline-offset-2">Cancel</button></p>}
          </>}
        </Card>

        {/* 3 — this month */}
        <Card title={`${monthName(ym)} so far`}>
          <ul className="divide-y divide-hms-line text-[14px]" aria-label="This month's bill">
            {cur.lines.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block font-medium">{l.label}</span><span className="block text-[12.5px] text-hms-muted">{l.detail}</span></span>
                <span className="shrink-0 text-right font-semibold tabular-nums">{l.note === "prepaid" ? <span className="text-hms-muted">Prepaid</span> : l.note === "price-not-set" ? <span className="text-[12.5px] text-[#7a4a0b]">Price not set</span> : tk(l.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex items-baseline justify-between border-t border-hms-line pt-3"><span className="text-[15px] font-semibold">Expected</span><span className="text-[22px] font-bold tabular-nums">{tk(cur.total)}</span></div>
        </Card>
      </div>

      {/* 4 — bills */}
      <Card title="Bills" className="mt-4" pad={false}>
        <ul className="divide-y divide-hms-line" aria-label="Bills">
          {bl.invoices.map((inv) => (
            <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="min-w-0 flex-1"><b className="block text-[14.5px]">{monthName(inv.month)}</b><span className="text-[12.5px] text-hms-muted">{inv.status === "paid" ? `Paid ${inv.paidAt ? dShort(inv.paidAt) : ""} · ${inv.paidBy}` : `Pay by ${dShort(inv.due)}`}</span></span>
              <Badge tone={STATUS[inv.status][0]}>{STATUS[inv.status][1]}</Badge>
              <b className="w-24 text-right tabular-nums">{tk(inv.total)}</b>
              <button onClick={() => printHtml(invoiceDoc(h, inv))} aria-label={`Bill PDF ${monthName(inv.month)}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hms-line px-3 text-[13px] font-semibold hover:bg-hms-hover"><Download className="size-3.5" />PDF</button>
              {inv.status !== "paid" && <button onClick={() => setPaying(inv)} className="btn-glow inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] font-semibold text-white">Pay</button>}
            </li>
          ))}
          {!bl.invoices.length && <li className="px-5 py-6 text-[14px] text-hms-muted">No bills yet. The first one comes on {dLong(tl[3].date)}.</li>}
        </ul>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* 5 — auto-pay */}
        <Card title="Auto-pay" action={<Toggle on={bl.st.autopay} onChange={(v) => { bl.setAutopay(v); say(v ? "Auto-pay on" : "Auto-pay off"); }} label="Auto-pay" />}>
          <p className="text-[14px]">{bl.st.autopay ? "The bill is paid by itself when it comes." : "Off — you pay each bill here."}</p>
          <p className="mt-1 text-[13px] text-hms-muted">First from your BinGi balance (<b className="text-hms-ink tabular-nums">{tk(money.available)}</b> — online booking money BinGi holds for you), then:</p>
          <div role="radiogroup" aria-label="Auto-pay method" className="mt-2.5 flex gap-1.5">{(["bKash", "Card", "Bank"] as const).map((m) => <button key={m} role="radio" aria-checked={bl.st.method === m} onClick={() => bl.setMethod(m)} className={clsx("h-10 flex-1 rounded-xl text-[14px] font-semibold", bl.st.method === m ? "bg-[#ffecec] text-[#c8232e] ring-1 ring-[#f3c4c0]" : "bg-[#eef0f3] text-[#3a414c] hover:bg-[#e3e6eb]")}>{m}</button>)}</div>
        </Card>
        {/* 6 — who gets the bill */}
        <BillingContact h={h} set={set} say={say} />
      </div>

      {/* 7 — rules, folded */}
      <details className="group mt-4 rounded-2xl border border-hms-line bg-white px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold">How billing works<span className="text-[13px] font-medium text-hms-muted group-open:hidden">Show</span><span className="hidden text-[13px] font-medium text-hms-muted group-open:inline">Hide</span></summary>
        <ul className="mt-3 grid gap-2 text-[13.5px] text-hms-muted sm:grid-cols-2">
          <li><b className="text-hms-ink">Pay after use.</b> The bill on the 1st is for the month that just ended.</li>
          <li><b className="text-hms-ink">Rooms.</b> Billed on published rooms (at least {MIN_BILLED}). A room added mid-month counts only for the days left.</li>
          <li><b className="text-hms-ink">6 or 12 months.</b> Paid at the start at the lower rate; monthly bills then only carry extra rooms and add-ons.</li>
          <li><b className="text-hms-ink">Late.</b> Reminders on the 1st, 5th and {DUE_DAY}th. After the {GRACE_DAY}th, online booking pauses until paid — never your data.</li>
        </ul>
      </details>

      {!enterprise && <section aria-label="Demo" className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-hms-line px-4 py-3 text-[13px] text-hms-muted">
        <CalendarClock className="size-4" /><span className="mr-auto">Prototype — no money moves. Demo: see the month end now.</span>
        <Btn variant="outline" disabled={bl.st.invoices.some((i) => i.month === ym)} onClick={() => { bl.demoCloseMonth(ym, cur.lines, cur.total, false); say(`${monthName(ym)} bill is ready`); }}>Make {monthName(ym)} bill</Btn>
        <Btn variant="outline" disabled={!bl.open || bl.open.status === "overdue"} onClick={() => bl.demoOverdue()}>Skip past grace</Btn>
        <Btn variant="ghost" onClick={() => { bl.demoReset(); say("Demo reset"); }}>Reset</Btn>
      </section>}

      {paying && <PaySheet inv={paying} balance={money.available} onClose={() => setPaying(null)} onPaid={(by) => { bl.pay(paying.id, `${by} (demo)`); setPaying(null); say(`${monthName(paying.month)} bill paid · ${by} · demo`); }} />}
      {plansOpen && <PlansSheet current={plan} cycle={bl.st.cycle} rooms={inUse} onClose={() => setPlansOpen(false)} onAsk={(p, c) => { const from = p !== plan && ["starter", "business", "ultra"].indexOf(p) > ["starter", "business", "ultra"].indexOf(plan) ? bl.today : `${nextMonth(bl.today.slice(0, 7))}-01`; bl.askChange({ plan: p, cycle: c, from }); setPlansOpen(false); say("Change request sent to BinGi"); }} />}
      {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><Check className="size-4 text-[#7ee2a8]" />{toast}</div>}
    </>
  );
}

/** Pick a method → confirm. Prototype: marks the bill paid; no gateway is called. */
function PaySheet({ inv, balance, onClose, onPaid }: { inv: Invoice; balance: number; onClose: () => void; onPaid: (by: string) => void }) {
  const [m, setM] = useState<string>(balance >= inv.total ? "BinGi balance" : "bKash");
  const opts = [...(balance >= inv.total ? [{ id: "BinGi balance", sub: `${tk(balance)} available` }] : []), ...METHODS];
  return (
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
    </div>
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
    <Card title="Bills go to" action={dirty ? <Btn onClick={save}>Save</Btn> : undefined}>
      <div className="grid gap-2.5">
        <input aria-label="Billing contact name" placeholder={`Name (e.g. owner of ${h.name})`} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} className={inp} />
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input aria-label="Billing phone" inputMode="tel" placeholder="Phone for SMS" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} className={inp} />
          <input aria-label="Billing email" type="email" placeholder="Email for the PDF" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} className={inp} />
        </div>
      </div>
    </Card>
  );
}

function PlansSheet({ current, cycle, rooms, onClose, onAsk }: { current: PlanId; cycle: Cycle; rooms: number; onClose: () => void; onAsk: (p: PlanId, c: Cycle) => void }) {
  const [c, setC] = useState<Cycle>(cycle);
  const [pick, setPick] = useState<PlanId>(current);
  const billed = Math.max(MIN_BILLED, rooms);
  const order: PlanId[] = ["starter", "business", "ultra"];
  const up = order.indexOf(pick) > order.indexOf(current), down = order.indexOf(pick) < order.indexOf(current);
  return (
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
    </div>
  );
}
