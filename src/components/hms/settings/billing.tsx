"use client";
// Settings › Billing & plan (sidebar "Billing & Subscription"): current plan, this month's running bill, how the month-end
// bill arrives (timeline), auto-pay, bills history with invoice PDF, and plan / cycle change requests.
// Prototype: no money moves. Prices come from the one plan table (same as the public pricing page).
import Link from "next/link";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { CalendarClock, Check, CircleAlert, Download, FileText, Lock, Wallet } from "lucide-react";
import { useRooms } from "@/lib/rooms/store";
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
<p class="demo">Prototype bill — no money moved. VAT on the subscription is not decided yet.</p></body></html>`;
}

export function BillingPage() {
  const { h, bk, comm } = useCommData();
  const { st: rooms } = useRooms(h);
  const fin = useFinance(h);
  const lic = useLicences(h.slug);
  const bl = useBilling(h, rooms.units);
  const [plansOpen, setPlansOpen] = useState(false);
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
  const dim = daysIn(ym); const dayNo = Number(bl.today.slice(8, 10));
  const tl = timeline(ym);
  const enterprise = h.plan === "enterprise";
  const plan = h.plan as PlanId;
  const cycleLabel = CYCLES.find((c) => c[0] === bl.st.cycle)![1].split(" ·")[0];

  return (
    <>
      <PageHead title="Billing & plan" desc={`Your BinGi subscription for ${h.name}. Prototype: no money moves.`} actions={!enterprise ? <Btn variant="outline" onClick={() => setPlansOpen(true)}>Plans &amp; prices</Btn> : undefined} />

      {bl.open && (
        <div role="alert" className={clsx("mb-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-[14px]", bl.open.status === "overdue" ? "border-[#f3c4c0] bg-[#fdecec] text-[#8e1621]" : "border-[#f1dfb8] bg-[#fdf8ec] text-[#6b4309]")}>
          <CircleAlert className="size-5 shrink-0" />
          <p className="min-w-0 flex-1"><b className="font-semibold">{bl.open.status === "overdue" ? `${monthName(bl.open.month)} bill is overdue` : `${monthName(bl.open.month)} bill is ready`} · {tk(bl.open.total)}</b> · {bl.open.status === "overdue" ? "After the grace days online booking pauses until paid (proposed rule — not applied in this prototype). Your data and bookings are safe." : `Due ${dLong(bl.open.due)}. Auto-pay could not cover it from your BinGi balance.`}</p>
          <button onClick={() => { bl.pay(bl.open!.id, `${bl.st.method} (demo)`); say(`${bl.open!.id} paid · demo`); }} className="btn-glow inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-semibold text-white"><Wallet className="size-4" />Pay {tk(bl.open.total)}</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Your plan" action={<Badge tone="blue">{PLAN_LABEL[h.plan]}</Badge>}>
          {enterprise ? <p className="text-[14px]">Enterprise is billed by agreement with BinGi. Contact your account manager for changes.</p> : <>
            <p className="text-[28px] font-bold tabular-nums">{tk(cur.rate)}<span className="text-[14px] font-medium text-hms-muted"> / room / month · {cycleLabel}</span></p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px]">
              <dt className="text-hms-muted">Rooms in use</dt><dd className="text-right font-semibold tabular-nums">{inUse}</dd>
              <dt className="text-hms-muted">Rooms billed</dt><dd className="text-right font-semibold tabular-nums">{Math.max(MIN_BILLED, inUse)}{inUse < MIN_BILLED && <span className="font-normal text-hms-muted"> (min {MIN_BILLED})</span>}</dd>
              <dt className="text-hms-muted">Booking fee</dt><dd className="text-right font-semibold">{PLANS[plan].fees[0]}% marketplace · {PLANS[plan].fees[1]}% website · 0% walk-in</dd>
            </dl>
            {bl.st.change && <p className="mt-3 rounded-xl bg-[#eef3fd] px-3 py-2 text-[13px] text-[#1e3a8a]">Change asked: <b>{PLANS[bl.st.change.plan].label} · {CYCLES.find((c) => c[0] === bl.st.change!.cycle)![1]}</b> from {dLong(bl.st.change.from)}. BinGi confirms it. <button onClick={() => { bl.cancelChange(); say("Change request cancelled"); }} className="font-semibold underline underline-offset-2">Cancel</button></p>}
            <p className="mt-3 text-[12.5px] text-hms-muted">Booking and gateway fees are taken from online payments in <Link href="/hms/finance" className="underline underline-offset-2">Finance</Link> — they are not on this bill.</p>
          </>}
        </Card>

        <Card title={`${monthName(ym)} so far`} action={<span className="text-[12.5px] text-hms-muted">Day {Math.min(dayNo, dim)} of {dim}</span>}>
          <ul className="divide-y divide-hms-line text-[14px]" aria-label="This month's bill">
            {cur.lines.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block font-medium">{l.label}</span><span className="block text-[12.5px] text-hms-muted">{l.detail}</span></span>
                <span className="shrink-0 text-right font-semibold tabular-nums">{l.note === "prepaid" ? <span className="text-hms-muted">Prepaid</span> : l.note === "price-not-set" ? <span className="text-[12.5px] text-[#7a4a0b]">Price not set</span> : tk(l.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 flex items-baseline justify-between border-t border-hms-line pt-3"><span className="text-[15px] font-semibold">Expected bill</span><span className="text-[22px] font-bold tabular-nums">{tk(cur.total)}</span></div>
          <p className="mt-1 text-[12.5px] text-hms-muted">Comes on {dLong(tl[3].date)} · due {dLong(tl[4].date)}. VAT on the subscription: not decided yet.</p>
        </Card>
      </div>

      {/* how the month-end bill arrives */}
      <Card title="How your bill comes" desc="Every month, the same steps. Pay after use: the bill on the 1st is for the month that just ended." className="mt-4">
        <ol aria-label="Billing steps" className="grid gap-2 px-5 pb-5 sm:grid-cols-3 xl:grid-cols-6">
          {tl.map((s, i) => {
            const past = s.date < bl.today, now = !past && (i === 0 || tl[i - 1].date < bl.today) && s.date >= bl.today;
            return (
              <li key={s.id} className={clsx("relative rounded-2xl border p-3", now ? "border-[#f3c4c0] bg-[#fff6f6]" : past ? "border-hms-line bg-[#fafafb]" : "border-hms-line bg-white")}>
                <span className={clsx("grid size-7 place-items-center rounded-full text-[12.5px] font-bold", past ? "bg-[#16a34a] text-white" : now ? "bg-[#c8232e] text-white" : "bg-[#eef0f3] text-[#4d5664]")}>{past ? <Check className="size-4" /> : i + 1}</span>
                <p className="mt-2 text-[12.5px] font-semibold text-hms-muted">{dShort(s.date)}{now && " · next"}</p>
                <p className="text-[14px] font-semibold">{s.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-snug text-hms-muted">{s.text}</p>
              </li>
            );
          })}
        </ol>
        <div className="grid gap-2 border-t border-hms-line px-5 py-4 text-[13px] text-hms-muted sm:grid-cols-2">
          <p><b className="text-hms-ink">Rooms:</b> billed on rooms in use (at least {MIN_BILLED}). A room added mid-month is charged only for the days left. A room removed stops from next month.</p>
          <p><b className="text-hms-ink">6 or 12 months:</b> paid at the start of the cycle at the lower rate; month-end bills then only carry extra rooms and add-ons.</p>
          <p><b className="text-hms-ink">New property:</b> nothing is billed in the 7-day trial. The first bill has the activation fee and the rest of that month.</p>
          <p><b className="text-hms-ink">Late:</b> reminders on the 1st, 5th and {DUE_DAY}th. After the {GRACE_DAY}th, online booking pauses until paid — never your data.</p>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card title="Auto-pay">
          <div className="space-y-3 px-0 text-[14px]">
            <div className="flex items-center justify-between gap-3"><span><b className="block font-medium">Pay the bill by itself on the 1st</b><span className="text-[12.5px] text-hms-muted">BinGi balance first ({tk(money.available)} now), then the method below</span></span><Toggle on={bl.st.autopay} onChange={(v) => { bl.setAutopay(v); say(v ? "Auto-pay on" : "Auto-pay off"); }} label="Auto-pay" /></div>
            <div><p className="mb-1.5 text-[13px] font-semibold">Saved method</p>
              <div role="radiogroup" aria-label="Saved method" className="flex gap-1.5">{(["bKash", "Card", "Bank"] as const).map((m) => <button key={m} role="radio" aria-checked={bl.st.method === m} onClick={() => bl.setMethod(m)} className={clsx("h-10 flex-1 rounded-xl text-[14px] font-semibold", bl.st.method === m ? "bg-[#ffecec] text-[#c8232e] ring-1 ring-[#f3c4c0]" : "bg-[#eef0f3] text-[#3a414c] hover:bg-[#e3e6eb]")}>{m}</button>)}</div>
              <p className="mt-1.5 text-[12.5px] text-hms-muted">Charging a saved method is not connected in this prototype.</p>
            </div>
            <p className="text-[12.5px] text-hms-muted">Bills go to the billing contact in <Link href="/hms/settings/profile" className="underline underline-offset-2">Property profile</Link>.</p>
          </div>
        </Card>

        <Card title="Bills" pad={false} action={<span className="text-[12.5px] text-hms-muted">{bl.invoices.length}</span>}>
          <ul className="divide-y divide-hms-line" aria-label="Bills">
            {bl.invoices.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#e8f0fe] text-[#1d4ed8]"><FileText className="size-5" /></span>
                <span className="min-w-0 flex-1"><b className="block text-[14px]">{monthName(inv.month)}</b><span className="text-[12.5px] text-hms-muted">{inv.id} · {inv.status === "paid" ? `paid ${inv.paidAt ? dShort(inv.paidAt) : ""} · ${inv.paidBy}` : `due ${dShort(inv.due)}`}{inv.demo ? " · demo" : ""}</span></span>
                <Badge tone={STATUS[inv.status][0]}>{STATUS[inv.status][1]}</Badge>
                <b className="w-20 text-right tabular-nums">{tk(inv.total)}</b>
                <button onClick={() => printHtml(invoiceDoc(h, inv))} aria-label={`Invoice PDF ${monthName(inv.month)}`} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hms-line px-3 text-[13px] font-semibold hover:bg-hms-hover"><Download className="size-3.5" />PDF</button>
              </li>
            ))}
            {!bl.invoices.length && <li className="px-5 py-6 text-[14px] text-hms-muted">No bills yet.</li>}
          </ul>
        </Card>
      </div>

      {!enterprise && <section aria-label="Demo" className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-hms-line px-4 py-3 text-[13px] text-hms-muted">
        <CalendarClock className="size-4" /><span className="mr-auto">Demo: see the month end now.</span>
        <Btn variant="outline" disabled={bl.st.invoices.some((i) => i.month === ym)} onClick={() => { bl.demoCloseMonth(ym, cur.lines, cur.total, money.available >= cur.total); say(bl.st.autopay && money.available >= cur.total ? `${monthName(ym)} bill paid by auto-pay` : `${monthName(ym)} bill is ready`); }}>Close {monthName(ym)}</Btn>
        <Btn variant="outline" disabled={!bl.open || bl.open.status === "overdue"} onClick={() => bl.demoOverdue()}>Skip past grace</Btn>
        <Btn variant="ghost" onClick={() => { bl.demoReset(); say("Demo reset"); }}>Reset</Btn>
      </section>}

      {plansOpen && <PlansSheet current={plan} cycle={bl.st.cycle} rooms={inUse} onClose={() => setPlansOpen(false)} onAsk={(p, c) => { const from = p !== plan && ["starter", "business", "ultra"].indexOf(p) > ["starter", "business", "ultra"].indexOf(plan) ? bl.today : `${nextMonth(bl.today.slice(0, 7))}-01`; bl.askChange({ plan: p, cycle: c, from }); setPlansOpen(false); say("Change request sent to BinGi"); }} />}
      {toast && <div role="status" className="hms-up fixed bottom-6 left-1/2 z-[95] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-[#0f1720] px-4 py-2.5 text-[14px] font-medium text-white shadow-lg"><Check className="size-4 text-[#7ee2a8]" />{toast}</div>}
    </>
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
