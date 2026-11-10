"use client";
// Onboarding flow — 6 sections, 17 steps, one question per screen. Accommodation steps reuse the HMS Rooms module.
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BedDouble, BookOpen, Boxes, Brush, Building, Building2, Car, Castle, Check, CircleAlert, FileUp, House, Landmark, Plus, Sparkles, Tent, Trash2,
  TreePalm, Users, UsersRound, Utensils, Wallet,
} from "lucide-react";
import {
  CYCLE_OFF, EXTRAS, MIN_BILLED, ORDER, PLANS, STAFF, STEP_TITLE, TRIAL_DAYS, checks, hotelOf, nowIso, quote, recommend, score, useOnboarding, validPhone,
  type Cycle, type Draft, type PlanId, type StepId,
} from "@/lib/onboarding/store";
import { PROPERTY_TYPES, CORE, preset as presetOf } from "@/lib/rooms/catalog";
import { useRooms, nodePath } from "@/lib/rooms/store";
import { MASTER_LIST, PLAN_ORDER } from "@/themes/manifest";
import { setProperty } from "../hms/property";
import { inputCls } from "../hms/staff/ui";
import { money } from "../hms/rooms/parts";
import { Errors, Footer, Header, Later, Primary, Progress, Q, Tile } from "./shell";

const noop = () => () => {};
const TYPE_ICON: Record<string, typeof Building2> = {
  hotel: Building2, resort: TreePalm, "guest-house": House, motel: Car, hostel: BedDouble, homestay: House,
  "serviced-apartment": Building, "vacation-rental": Castle, lodge: Tent, other: Sparkles,
};
const TYPE_SUB: Record<string, string> = {
  hotel: "Rooms on floors", resort: "Rooms, cottages, villas", "guest-house": "A few rooms, personal", motel: "Roadside rooms, parking",
  hostel: "Private rooms and pods", homestay: "Rooms in your home", "serviced-apartment": "Apartments with service", "vacation-rental": "Whole villas or homes",
  lodge: "Cabins and nature stays", other: "Something different",
};

export function OnboardingFlow() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { draft } = useOnboarding();
  if (!ready) return <div className="min-h-dvh bg-[#f6f7f9]"><Header /><p className="p-8 text-[14px] text-[#5b6170]" role="status">Loading…</p></div>;
  if (!draft) return <div className="min-h-dvh bg-[#f6f7f9]"><Header /><div className="p-8"><p className="text-[16px] font-semibold">No property selected.</p><Link className="mt-3 inline-block font-medium text-[#c8232e]" href="/onboarding">Go to your properties</Link></div></div>;
  return <Flow key={draft.id} d={draft} />;
}

function Flow({ d }: { d: Draft }) {
  const { edit, st } = useOnboarding();
  const router = useRouter();
  const h = hotelOf(d);
  const rooms = useRooms(h);
  const [tried, setTried] = useState(false);
  const units = rooms.st.units.filter((u) => u.status !== "archived");
  const counts = { total: units.length, published: units.filter((u) => u.status === "published").length, categories: rooms.st.categories.filter((c) => !c.archived).length };

  const go = (s: StepId) => { setTried(false); edit((x) => { x.step = s; if (!x.seen.includes(s)) x.seen.push(s); }); window.scrollTo({ top: 0 }); };
  const i = ORDER.indexOf(d.step);
  const next = () => go(ORDER[Math.min(ORDER.length - 1, i + 1)]);
  const back = i > 0 ? () => go(ORDER[i - 1]) : () => router.push("/onboarding");
  const errs = errorsFor(d, counts.total);
  const cont = () => { if (errs.length) { setTried(true); return; } next(); };

  const body: Record<StepId, ReactNode> = {
    "1.1": <PropertyType d={d} />, "1.2": <Basics d={d} accountPhone={st.phone} />, "1.3": <Extras d={d} />, "1.4": <Plan d={d} />,
    "2.1": <SetupStep d={d} configured={rooms.st.config.configured} enabled={rooms.st.config.enabled.map((t) => CORE[t].label)} nodes={rooms.st.config.nodes.length} />,
    "2.2": <UnitsStep st={rooms.st} />, "2.3": <InventoryReview st={rooms.st} go={go} />,
    "3.1": <Rates d={d} st={rooms.st} setRate={(id, v) => rooms.update((s) => { const c = s.categories.find((x) => x.id === id); if (c) c.baseRate = v; }, "Base price changed in onboarding")} />,
    "3.2": <Existing d={d} codes={units.map((u) => u.code)} />, "3.3": <Policy d={d} />,
    "4.1": <Modules d={d} />, "4.2": <Team d={d} />,
    "5.1": <Payments d={d} />, "5.2": <Website d={d} />,
    "6.1": <QuoteStep d={d} units={counts.total} />, "6.2": <Verify d={d} />, "6.3": <Ready d={d} counts={counts} go={go} />,
  };
  const later: Partial<Record<StepId, () => void>> = {
    "1.3": next, "3.2": next, "4.2": () => { edit((x) => { x.teamLater = true; }); next(); },
    "5.2": () => { edit((x) => { x.site.later = true; }); next(); }, "6.2": () => { edit((x) => { x.verify.later = true; }); next(); },
  };
  const submit = () => {
    const cs = checks(d, counts);
    if (cs.some((c) => c.level === "required" && !c.ok)) { setTried(true); return; }
    edit((x) => { x.status = "pending"; x.submitted = nowIso(); });
    setProperty(d.slug);
    router.push("/onboarding/status");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f7f9]">
      <Header right={<Link href="/onboarding" className="inline-flex h-9 items-center rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14px] font-medium hover:bg-[#f6f7f9]">Save &amp; exit</Link>} />
      <div className="mx-auto flex w-full max-w-[1080px] flex-1 gap-10 px-4 pb-10 pt-6 sm:px-6 lg:pt-10">
        <Progress d={d} go={go} />
        <main className="min-w-0 flex-1 lg:max-w-[720px]">
          <Progress d={d} go={go} bar />
          <div className="mt-5 lg:mt-0">
            {tried && <Errors list={d.step === "6.3" ? checks(d, counts).filter((c) => c.level === "required" && !c.ok).map((c) => `${c.label} is still missing.`) : errs} />}
            <div key={d.step} className="onb-in">{body[d.step]}</div>
          </div>
        </main>
      </div>
      <Footer back={back}>
        {later[d.step] && <Later onClick={later[d.step]} />}
        {d.step === "6.3"
          ? <Primary onClick={submit}>Submit &amp; open HMS</Primary>
          : d.step === "2.1" && !rooms.st.config.configured ? <Primary onClick={() => router.push("/onboarding/rooms/setup")}>Start setup</Primary>
          : d.step === "2.2" && !counts.total ? <Primary onClick={() => router.push("/onboarding/rooms/new")}>Add units</Primary>
          : <Primary onClick={cont}>Continue</Primary>}
      </Footer>
    </div>
  );
}

function errorsFor(d: Draft, units: number): string[] {
  const e: string[] = [];
  if (d.step === "1.1" && !d.propertyType) e.push("Choose what kind of property you run.");
  if (d.step === "1.2") {
    if (!d.name.trim()) e.push("Add the property name.");
    if (!d.city.trim()) e.push("Add the city or district.");
    if (!d.address.trim()) e.push("Add the address guests will use.");
    if (!validPhone(d.phone)) e.push("Add a Bangladesh mobile number for the front desk.");
    if (!(d.units > 0)) e.push("How many rooms or units do you have? (a rough number is fine)");
  }
  if (d.step === "1.4" && !d.planPicked) e.push("Choose a plan. You can change it before you pay.");
  if (d.step === "2.2" && !units) e.push("Add at least one unit.");
  if (d.step === "3.2" && d.existing.has === true && d.existing.rows.some((r) => !r.guest.trim() || !r.checkIn || !r.checkOut || r.checkOut <= r.checkIn)) e.push("Each booking needs a guest name and a check-out after check-in.");
  if (d.step === "3.3" && !d.policy.preset) e.push("Choose a cancellation policy.");
  if (d.step === "4.2" && d.team.some((t) => !validPhone(t.phone))) e.push("Each invite needs a Bangladesh mobile number.");
  if (d.step === "5.1" && !d.pay.cash) e.push("Pay at property must stay on — it is how guests pay until online payment is approved.");
  return e;
}

// ---------------- S1 ----------------
function PropertyType({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  return (
    <Q title="What kind of property do you run?" sub="This sets sensible defaults. You can add any type of accommodation later.">
      <div role="radiogroup" aria-label="Property type" className="grid gap-3 sm:grid-cols-2">
        {PROPERTY_TYPES.map((p) => {
          const I = TYPE_ICON[p.slug] ?? Sparkles;
          return <Tile key={p.slug} role="radio" on={d.propertyType === p.slug} onClick={() => edit((x) => { x.propertyType = p.slug; })} icon={<I className="size-5" />} title={p.label} sub={TYPE_SUB[p.slug]} />;
        })}
      </div>
      <p className="mt-5 text-[13.5px] text-[#5b6170]">Country: <b className="text-[#1d1f24]">Bangladesh</b> · currency BDT · time Asia/Dhaka. Other countries come later.</p>
    </Q>
  );
}

function Basics({ d, accountPhone }: { d: Draft; accountPhone: string }) {
  const { edit } = useOnboarding();
  const f = (label: string, value: string | number, set: (v: string) => void, p: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
    const id = "f-" + label.replace(/\W+/g, "-").toLowerCase();
    return <div><label htmlFor={id} className="block text-[14px] font-medium">{label}</label><input id={id} value={value} onChange={(e) => set(e.target.value)} {...p} className={inputCls + " mt-1.5 h-11 text-[15px]"} /></div>;
  };
  return (
    <Q title="Name and location" sub="Guests see this on your website and booking confirmations.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{f("Property name", d.name, (v) => edit((x) => { x.name = v; }), { placeholder: "e.g. Sea Breeze Hotel", autoComplete: "organization" })}</div>
        {f("Area", d.area, (v) => edit((x) => { x.area = v; }), { placeholder: "e.g. Kolatoli" })}
        {f("City / district", d.city, (v) => edit((x) => { x.city = v; }), { placeholder: "e.g. Cox's Bazar" })}
        <div className="sm:col-span-2">{f("Full address", d.address, (v) => edit((x) => { x.address = v; }), { placeholder: "Road, area, city, postcode", autoComplete: "street-address" })}</div>
        <div>
          {f("Front desk mobile", d.phone, (v) => edit((x) => { x.phone = v; }), { inputMode: "tel", placeholder: "01712 345678" })}
          {!d.phone && accountPhone && <button type="button" onClick={() => edit((x) => { x.phone = accountPhone; })} className="mt-1.5 text-[13px] font-medium text-[#c8232e]">Use {accountPhone}</button>}
        </div>
        {f("Rooms / units (about)", d.units || "", (v) => edit((x) => { x.units = Math.max(0, Math.min(2000, Number(v.replace(/\D/g, "")) || 0)); }), { inputMode: "numeric", placeholder: "e.g. 24" })}
      </div>
      <p className="mt-4 text-[13px] text-[#5b6170]">The unit number only sizes your plan. You add the real units in part 2.</p>
    </Q>
  );
}

function Extras({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const t = (e: string) => edit((x) => { x.extras = x.extras.includes(e) ? x.extras.filter((y) => y !== e) : [...x.extras, e]; });
  return (
    <Q title="What else is there?" sub="Pick everything guests can use or order. It decides which modules and website sections you get.">
      <div className="flex flex-wrap gap-2">
        {EXTRAS.map((e) => (
          <button key={e} type="button" aria-pressed={d.extras.includes(e)} onClick={() => t(e)} className={clsx("inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14.5px] font-medium transition-colors", d.extras.includes(e) ? "border-[#e2574e] bg-[#fdf3f2] text-[#9b241d]" : "border-[#e3e6eb] bg-white hover:border-[#cfd3db]")}>
            {d.extras.includes(e) && <Check className="size-4" />}{e}
          </button>
        ))}
      </div>
      <h2 className="mt-8 text-[16px] font-semibold">How many people work here?</h2>
      <div role="radiogroup" aria-label="Staff size" className="mt-3 flex flex-wrap gap-2">
        {STAFF.map((s) => <button key={s} role="radio" aria-checked={d.staff === s} onClick={() => edit((x) => { x.staff = s; })} className={clsx("h-10 rounded-full border px-4 text-[14.5px] font-medium", d.staff === s ? "border-[#1d1f24] bg-[#1d1f24] text-white" : "border-[#e3e6eb] bg-white")}>{s}</button>)}
      </div>
    </Q>
  );
}

function Plan({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const rec = recommend(d.units, d.extras);
  const wantsFood = d.extras.some((e) => e === "Restaurant" || e === "Bar");
  const q = quote(d.plan, d.units, d.cycle);
  return (
    <Q title="Choose your plan" sub={<>Start with a {TRIAL_DAYS}-day free trial of the plan you choose. Nothing to pay today.</>}>
      <div role="radiogroup" aria-label="Plan" className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(PLANS) as PlanId[]).map((p) => {
          const P = PLANS[p]; const on = d.planPicked && d.plan === p;
          return (
            <button key={p} role="radio" aria-checked={on} onClick={() => edit((x) => { x.plan = p; x.planPicked = true; })}
              className={clsx("relative rounded-2xl border p-4 text-left transition-[border,box-shadow]", on ? "border-[#e2574e] bg-[#fdf3f2] shadow-[0_0_0_3px_rgb(216_55_46/0.12)]" : "border-[#e3e6eb] bg-white hover:border-[#cfd3db]")}>
              <span className="block text-[17px] font-bold">{P.label}</span>
              <span className="mt-1 block text-[13px] text-[#5b6170]">{P.for}</span>
              <span className="mt-3 block text-[22px] font-bold">৳{P.perUnit}<span className="text-[13px] font-medium text-[#5b6170]"> / unit / month</span></span>
              {rec === p && <span className="absolute right-3 top-3 rounded-full bg-gradient-to-b from-[#e2483f] to-[#c8232e] px-2 py-0.5 text-[11px] font-semibold text-white">Recommended</span>}
              <span className="mt-1 block text-[12.5px] text-[#5b6170]">{P.activation ? <>Activation ৳{money(P.activation)}{P.activationRegular && <s className="ml-1">৳{money(P.activationRegular)}</s>}</> : "No activation fee"}</span>
            </button>
          );
        })}
      </div>
      {wantsFood && d.planPicked && d.plan !== "ultra" && <p role="note" className="mt-3 flex gap-2 rounded-xl bg-[#fdf6e7] px-3 py-2 text-[13.5px] text-[#7a4a0b]"><CircleAlert className="mt-0.5 size-4 shrink-0" />Restaurant &amp; Bar is in Ultra. On {PLANS[d.plan].label} the restaurant module stays off.</p>}
      <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[14px] font-medium">Billing</span>
          <div role="radiogroup" aria-label="Billing cycle" className="flex max-w-full flex-wrap rounded-xl bg-[#f2f3f6] p-1">
            {([1, 6, 12] as Cycle[]).map((c) => <button key={c} role="radio" aria-checked={d.cycle === c} onClick={() => edit((x) => { x.cycle = c; })} className={clsx("h-9 rounded-lg px-3 text-[14px] font-medium", d.cycle === c ? "bg-white shadow-sm" : "text-[#5b6170]")}>{c === 1 ? "Monthly" : `${c} months`}{CYCLE_OFF[c] ? <span className="ml-1 text-[#1c7d45]">−{CYCLE_OFF[c] * 100}%</span> : null}</button>)}
          </div>
        </div>
        <dl className="mt-4 grid gap-1.5 text-[14.5px]">
          <Row k={`${q.billed} units × ৳${PLANS[d.plan].perUnit} × ${d.cycle} ${d.cycle === 1 ? "month" : "months"}`} v={`৳${money(q.gross)}`} />
          {q.off > 0 && <Row k={`${d.cycle}-month discount`} v={`−৳${money(q.off)}`} green />}
          <Row k="Activation (one time)" v={q.activation ? `৳${money(q.activation)}` : "৳0"} />
          <Row k="After the free trial" v={`৳${money(q.total)}`} bold />
        </dl>
        <p className="mt-3 text-[12.5px] text-[#666d7a]">{d.units < MIN_BILLED ? `Billing starts at ${MIN_BILLED} units. ` : ""}VAT and other fees, if any, appear on the invoice. The final quote comes from BinGi billing.</p>
      </div>
    </Q>
  );
}
function Row({ k, v, bold, green }: { k: string; v: string; bold?: boolean; green?: boolean }) {
  return <div className={clsx("flex justify-between gap-4", bold && "border-t border-[#eceef2] pt-2 font-semibold")}><dt className={bold ? "" : "text-[#5b6170]"}>{k}</dt><dd className={clsx("tabular-nums", green && "text-[#1c7d45]")}>{v}</dd></div>;
}

// ---------------- S2 (Rooms module) ----------------
function SetupStep({ configured, enabled, nodes }: { d: Draft; configured: boolean; enabled: string[]; nodes: number }) {
  return (
    <Q title="Accommodation setup" sub="Four short screens: which types you have, where they are (buildings, floors, zones), how they are numbered, and a review. Done once — the same setup works in HMS later.">
      {configured ? (
        <div className="rounded-2xl bg-white p-5 ring-1 ring-[#eceef2]">
          <p className="flex items-center gap-2 text-[15.5px] font-semibold text-[#1c6b3c]"><Check className="size-5" /> Setup saved</p>
          <p className="mt-2 text-[14.5px] text-[#4b5160]">Types: {enabled.join(", ")} · {nodes} locations</p>
          <Link href="/onboarding/rooms/setup" className="mt-4 inline-flex h-10 items-center rounded-xl border border-[#dfe2e8] px-4 text-[14.5px] font-medium hover:bg-[#f6f7f9]">Edit setup</Link>
        </div>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-4">
          {["Types", "Locations", "Numbering", "Review"].map((s, i) => <li key={s} className="rounded-2xl bg-white p-4 ring-1 ring-[#eceef2]"><span className="text-[12.5px] font-semibold text-[#c8232e]">{i + 1}</span><span className="mt-1 block text-[15px] font-semibold">{s}</span></li>)}
        </ol>
      )}
    </Q>
  );
}

type RS = ReturnType<typeof useRooms>["st"];
function UnitsStep({ st }: { st: RS }) {
  const live = st.units.filter((u) => u.status !== "archived");
  const cats = st.categories.filter((c) => !c.archived);
  return (
    <Q title="Add your first units" sub="Create a category (e.g. Deluxe Double) and pick its room numbers. Add all your units now, or at least one to continue.">
      {cats.length ? (
        <ul className="space-y-2">
          {cats.map((c) => { const n = live.filter((u) => u.category === c.id).length; return (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2]">
              <span className="min-w-0 flex-1"><span className="block truncate text-[15.5px] font-semibold">{c.name}</span><span className="text-[13.5px] text-[#5b6170]">{presetOf(c.preset).label} · ৳{money(c.baseRate)} / night</span></span>
              <span className="text-[14.5px] font-semibold tabular-nums">{n} {n === 1 ? "unit" : "units"}</span>
              <Link href={`/onboarding/rooms/new?category=${c.id}`} className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#dfe2e8] px-3 text-[14px] font-medium hover:bg-[#f6f7f9]"><Plus className="size-4" />Add</Link>
            </li>); })}
        </ul>
      ) : <p className="rounded-2xl bg-white p-5 text-[14.5px] text-[#5b6170] ring-1 ring-[#eceef2]">No units yet.</p>}
      <Link href="/onboarding/rooms/new" className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-[#e2a19c] bg-white px-4 text-[15px] font-medium text-[#b12a22] hover:bg-[#fdf6f5]"><Plus className="size-[18px]" /> Add another category</Link>
    </Q>
  );
}

function InventoryReview({ st, go }: { st: RS; go: (s: StepId) => void }) {
  const live = st.units.filter((u) => u.status !== "archived");
  const cats = st.categories.filter((c) => !c.archived);
  return (
    <Q title="Check your inventory" sub={`${live.length} ${live.length === 1 ? "unit" : "units"} in ${cats.length} ${cats.length === 1 ? "category" : "categories"}. New categories are checked by BinGi after you submit; until then units stay drafts (not bookable).`}>
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceef2]">
        {cats.map((c) => {
          const us = live.filter((u) => u.category === c.id);
          return (
            <div key={c.id} className="border-b border-[#f0f1f4] p-4 last:border-0">
              <div className="flex items-center justify-between gap-3"><p className="font-semibold">{c.name}</p><span className="text-[13px] text-[#5b6170]">{c.approval === "approved" ? "Approved" : "Waiting for BinGi approval"}</span></div>
              <p className="mt-1 text-[13.5px] text-[#5b6170]">{[...new Set(us.map((u) => nodePath(st.config, u.node)))].join(" · ")}</p>
              <p className="mt-2 flex flex-wrap gap-1.5">{us.slice(0, 24).map((u) => <span key={u.id} className="rounded-md bg-[#f2f3f6] px-1.5 py-0.5 font-mono text-[12.5px]">{u.code}</span>)}{us.length > 24 && <span className="text-[12.5px] text-[#5b6170]">+{us.length - 24} more</span>}</p>
            </div>
          );
        })}
      </div>
      <button onClick={() => go("2.2")} className="mt-4 text-[14.5px] font-medium text-[#c8232e] underline-offset-4 hover:underline">Add or change units</button>
    </Q>
  );
}

// ---------------- S3 ----------------
function Rates({ d, st, setRate }: { d: Draft; st: RS; setRate: (id: string, v: number) => void }) {
  const { edit } = useOnboarding();
  const cats = st.categories.filter((c) => !c.archived);
  const r = d.rates;
  const set = (fn: (x: Draft["rates"]) => void) => edit((x) => { fn(x.rates); x.rates.done = true; });
  return (
    <Q title="Rates" sub="Base price per night for each category, plus a few simple rules. Full rate calendar is in HMS → Discounts & Rates.">
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceef2]">
        {cats.length ? cats.map((c) => (
          <div key={c.id} className="flex items-center gap-3 border-b border-[#f0f1f4] p-4 last:border-0">
            <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
            <label className="sr-only" htmlFor={`rate-${c.id}`}>Base price for {c.name}</label>
            <span className="text-[14px] text-[#5b6170]">৳</span>
            <div className="w-[130px] shrink-0"><input id={`rate-${c.id}`} inputMode="numeric" value={c.baseRate || ""} onChange={(e) => { setRate(c.id, Number(e.target.value.replace(/\D/g, "")) || 0); edit((x) => { x.rates.done = true; }); }} className={inputCls + " text-right tabular-nums"} /></div>
          </div>
        )) : <p className="p-4 text-[14.5px] text-[#5b6170]">Add units in part 2 first.</p>}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="wk" className="block text-[14px] font-medium">Weekend (Fri–Sat) extra</label>
          <div className="mt-1.5 flex items-center gap-2"><input id="wk" inputMode="numeric" value={r.weekendPct || ""} placeholder="0" onChange={(e) => set((x) => { x.weekendPct = Math.min(200, Number(e.target.value.replace(/\D/g, "")) || 0); })} className={inputCls + " h-11 !w-[100px]"} /><span className="whitespace-nowrap text-[14px] text-[#5b6170]">% more</span></div></div>
        <div><label htmlFor="ms" className="block text-[14px] font-medium">Minimum stay</label>
          <div className="mt-1.5 flex items-center gap-2"><input id="ms" inputMode="numeric" value={r.minStay} onChange={(e) => set((x) => { x.minStay = Math.max(1, Math.min(30, Number(e.target.value.replace(/\D/g, "")) || 1)); })} className={inputCls + " h-11 !w-[100px]"} /><span className="whitespace-nowrap text-[14px] text-[#5b6170]">night{r.minStay > 1 ? "s" : ""}</span></div></div>
        <div className="sm:col-span-2 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2]">
          <label className="flex items-center gap-3 text-[15px] font-medium"><input type="checkbox" checked={r.breakfast} onChange={(e) => set((x) => { x.breakfast = e.target.checked; })} className="size-5 accent-[#d8372e]" /> Offer a &quot;with breakfast&quot; rate</label>
          {r.breakfast && <div className="mt-3 flex items-center gap-2 pl-8"><label htmlFor="bf" className="text-[14px] text-[#5b6170]">Breakfast per adult ৳</label><input id="bf" inputMode="numeric" value={r.breakfastPrice || ""} onChange={(e) => set((x) => { x.breakfastPrice = Number(e.target.value.replace(/\D/g, "")) || 0; })} className={inputCls + " !w-[110px]"} /></div>}
        </div>
      </div>
    </Q>
  );
}

function Existing({ d, codes }: { d: Draft; codes: string[] }) {
  const { edit } = useOnboarding();
  const rows = d.existing.rows;
  return (
    <Q title="Do you already have bookings?" sub="Guests who booked by phone or Facebook. Adding them keeps those units blocked so nothing is double-booked.">
      <div role="radiogroup" aria-label="Existing bookings" className="grid gap-3 sm:grid-cols-2">
        <Tile role="radio" on={d.existing.has === true} onClick={() => edit((x) => { x.existing.has = true; if (!x.existing.rows.length) x.existing.rows.push({ guest: "", checkIn: "", checkOut: "", unit: "" }); })} title="Yes, add them" sub="One line per booking" icon={<BookOpen className="size-5" />} />
        <Tile role="radio" on={d.existing.has === false} onClick={() => edit((x) => { x.existing.has = false; })} title="No bookings yet" icon={<Check className="size-5" />} />
      </div>
      {d.existing.has && (
        <div className="mt-5 space-y-3">
          {rows.map((r, i) => {
            const set = (fn: (x: typeof r) => void) => edit((x) => { fn(x.existing.rows[i]); });
            return (
              <div key={i} className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-[#eceef2] sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]">
                <input aria-label={`Guest name ${i + 1}`} placeholder="Guest name" value={r.guest} onChange={(e) => set((x) => { x.guest = e.target.value; })} className={inputCls} />
                <input aria-label={`Check-in ${i + 1}`} type="date" value={r.checkIn} onChange={(e) => set((x) => { x.checkIn = e.target.value; })} className={inputCls} />
                <input aria-label={`Check-out ${i + 1}`} type="date" value={r.checkOut} onChange={(e) => set((x) => { x.checkOut = e.target.value; })} className={inputCls} />
                <select aria-label={`Unit ${i + 1}`} value={r.unit} onChange={(e) => set((x) => { x.unit = e.target.value; })} className={inputCls}><option value="">Any unit</option>{codes.map((c) => <option key={c}>{c}</option>)}</select>
                <button aria-label={`Remove booking ${i + 1}`} onClick={() => edit((x) => { x.existing.rows.splice(i, 1); })} className="grid size-10 place-items-center rounded-xl text-[#5b6170] hover:bg-[#f2f3f6]"><Trash2 className="size-[18px]" /></button>
              </div>
            );
          })}
          <button onClick={() => edit((x) => { x.existing.rows.push({ guest: "", checkIn: "", checkOut: "", unit: "" }); })} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe2e8] bg-white px-3 text-[14.5px] font-medium hover:bg-[#f6f7f9]"><Plus className="size-4" /> Add booking</button>
          <p className="text-[13px] text-[#5b6170]">Prototype: kept with this setup. They become HMS bookings when the backend is connected.</p>
        </div>
      )}
    </Q>
  );
}

const POLICIES = [
  { id: "flexible", title: "Flexible", sub: "Free cancellation until 24 hours before check-in" },
  { id: "moderate", title: "Moderate", sub: "Free until 5 days before; after that, first night charged" },
  { id: "strict", title: "Strict", sub: "50% refund until 7 days before; no refund after" },
] as const;
function Policy({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const p = d.policy;
  return (
    <Q title="Policies and taxes" sub="Shown to guests before they book. You can write your own wording later in Settings.">
      <div role="radiogroup" aria-label="Cancellation policy" className="grid gap-3">
        {POLICIES.map((x) => <Tile key={x.id} role="radio" on={p.preset === x.id} onClick={() => edit((y) => { y.policy.preset = x.id; })} title={x.title} sub={x.sub} />)}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {([["Check-in from", "checkIn", "time"], ["Check-out by", "checkOut", "time"], ["VAT %", "vat", "num"], ["Service charge %", "sc", "num"]] as const).map(([label, k, t]) => (
          <div key={k}><label htmlFor={`p-${k}`} className="block text-[14px] font-medium">{label}</label>
            <input id={`p-${k}`} type={t === "time" ? "time" : "text"} inputMode={t === "num" ? "numeric" : undefined} value={p[k]} onChange={(e) => edit((y) => { if (t === "time") (y.policy[k] as string) = e.target.value; else (y.policy[k] as number) = Math.min(100, Number(e.target.value.replace(/\D/g, "")) || 0); })} className={inputCls + " mt-1.5 h-11"} /></div>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#5b6170]">VAT 15% and service charge 10% are common in Bangladesh — check with your accountant.</p>
    </Q>
  );
}

// ---------------- S4 ----------------
const MODULES = [
  { id: "frontdesk", title: "Front desk & bookings", sub: "Bookings, calendar, check-in/out", icon: BookOpen, locked: true },
  { id: "housekeeping", title: "Housekeeping", sub: "Cleaning tasks, room status", icon: Brush },
  { id: "staff", title: "Staff & HRM", sub: "People, attendance, payroll", icon: UsersRound },
  { id: "inventory", title: "Inventory", sub: "Stock, purchases, stores", icon: Boxes },
  { id: "accounts", title: "Accounts", sub: "Expenses, cashbox, reports", icon: Landmark },
  { id: "restaurant", title: "Restaurant & Bar", sub: "Menu, orders, kitchen", icon: Utensils, ultra: true },
];
function Modules({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const ultra = d.plan === "ultra";
  return (
    <Q title="Which modules will you use?" sub="Turn off what you don't run — the menu stays short. You can turn them on later.">
      <div className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => {
          const blocked = m.ultra && !ultra;
          const on = m.locked || (!blocked && d.modules.includes(m.id));
          return <Tile key={m.id} on={on} disabled={m.locked || blocked} onClick={() => edit((x) => { x.modules = x.modules.includes(m.id) ? x.modules.filter((y) => y !== m.id) : [...x.modules, m.id]; })} icon={<m.icon className="size-5" />} title={m.title} sub={blocked ? "Needs the Ultra plan" : m.sub} badge={m.locked ? "Always on" : blocked ? "Ultra" : undefined} />;
        })}
      </div>
      <p className="mt-4 text-[13px] text-[#5b6170]">Plan limits (staff logins, outlets) are applied by BinGi billing.</p>
    </Q>
  );
}

const ROLES = ["Manager", "Front desk", "Housekeeping", "Accounts", "Restaurant"];
function Team({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  return (
    <Q title="Invite your team" sub="Up to 3 people now. They get an SMS to join with their own BinGi ID. More staff can be added in HMS → Staff.">
      <div className="space-y-3">
        {d.team.map((t, i) => (
          <div key={i} className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-[#eceef2] sm:grid-cols-[1fr_200px_auto]">
            <input aria-label={`Mobile ${i + 1}`} inputMode="tel" placeholder="01712 345678" value={t.phone} onChange={(e) => edit((x) => { x.team[i].phone = e.target.value; })} className={inputCls} />
            <select aria-label={`Role ${i + 1}`} value={t.role} onChange={(e) => edit((x) => { x.team[i].role = e.target.value; })} className={inputCls}>{ROLES.filter((r) => r !== "Restaurant" || d.plan === "ultra").map((r) => <option key={r}>{r}</option>)}</select>
            <button aria-label={`Remove invite ${i + 1}`} onClick={() => edit((x) => { x.team.splice(i, 1); })} className="grid size-10 place-items-center rounded-xl text-[#5b6170] hover:bg-[#f2f3f6]"><Trash2 className="size-[18px]" /></button>
          </div>
        ))}
        {d.team.length < 3 && <button onClick={() => edit((x) => { x.team.push({ phone: "", role: "Front desk" }); x.teamLater = false; })} className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-[#dfe2e8] bg-white px-4 text-[15px] font-medium hover:bg-[#f6f7f9]"><Users className="size-[18px]" /> Add a person</button>}
      </div>
      <p className="mt-4 text-[13px] text-[#5b6170]">Prototype: invites are not sent.</p>
    </Q>
  );
}

// ---------------- S5 ----------------
function Payments({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const p = d.pay;
  const tog = (k: "cash" | "bkash" | "nagad" | "bank") => edit((x) => { x.pay[k] = !x.pay[k]; });
  return (
    <Q title="How do guests pay?" sub="Guests pay you directly at first. Online card/wallet payment through BinGi needs verification and approval.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile on={p.cash} onClick={() => tog("cash")} icon={<Wallet className="size-5" />} title="Pay at property" sub="Cash or card at the desk — required" />
        <Tile on={p.bkash} onClick={() => tog("bkash")} icon={<Wallet className="size-5" />} title="bKash (send money)" sub="Guest sends to your number, you confirm" />
        <Tile on={p.nagad} onClick={() => tog("nagad")} icon={<Wallet className="size-5" />} title="Nagad (send money)" sub="Guest sends to your number, you confirm" />
        <Tile on={p.bank} onClick={() => tog("bank")} icon={<Landmark className="size-5" />} title="Bank transfer" sub="For advance payments" />
      </div>
      <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2]">
        <p className="text-[15.5px] font-semibold">BinGi Payments (online)</p>
        <p className="mt-1 text-[13.5px] text-[#5b6170]">Automatic card and wallet payments on your website. Not live yet in this prototype; you can apply after verification.</p>
        <div role="radiogroup" aria-label="BinGi Payments" className="mt-3 flex flex-wrap gap-2">
          {([["later", "Apply after verification"], ["", "Not now"]] as const).map(([v, l]) => <button key={l} role="radio" aria-checked={p.bingi === v} onClick={() => edit((x) => { x.pay.bingi = v; })} className={clsx("h-10 rounded-full border px-4 text-[14.5px] font-medium", p.bingi === v ? "border-[#1d1f24] bg-[#1d1f24] text-white" : "border-[#e3e6eb] bg-white")}>{l}</button>)}
        </div>
      </div>
    </Q>
  );
}

function Website({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const rank = (p: string) => PLAN_ORDER.indexOf(p as (typeof PLAN_ORDER)[number]);
  const old = hotelOf(d).propertyType;
  const fits = (t: (typeof MASTER_LIST)[number]) => t.bestFor.includes(old);
  const themes = MASTER_LIST.filter((t) => rank(t.minPlan) <= rank(d.plan)).sort((a, b) => Number(fits(b)) - Number(fits(a)));
  return (
    <Q title="Your website" sub="Pick a look. We fill it with your rooms, prices and photos. It stays a draft until BinGi approves your property.">
      <div role="radiogroup" aria-label="Website theme" className="grid gap-3 sm:grid-cols-2">
        {themes.map((t) => {
          const on = d.site.theme === t.id;
          return (
            <button key={t.id} role="radio" aria-checked={on} onClick={() => edit((x) => { x.site.theme = t.id; x.site.later = false; })}
              className={clsx("overflow-hidden rounded-2xl border text-left transition-[border,box-shadow]", on ? "border-[#e2574e] shadow-[0_0_0_3px_rgb(216_55_46/0.12)]" : "border-[#e3e6eb] hover:border-[#cfd3db]")}>
              <Image src={`/themes/${t.id}.jpg`} alt="" width={560} height={300} className="aspect-[16/8] w-full object-cover" />
              <span className="block bg-white p-3"><span className="flex items-center gap-2 text-[15px] font-semibold">{t.name}{fits(t) && <span className="rounded-md bg-[#eef8f1] px-1.5 py-0.5 text-[11.5px] font-medium text-[#1c6b3c]">Fits your property</span>}{on && <Check className="ml-auto size-4 text-[#d8372e]" />}</span><span className="text-[13px] text-[#5b6170]">{t.tagline}</span></span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] text-[#5b6170]">Themes shown are the ones included in {PLANS[d.plan].label}. Edit everything later in HMS → Website Management.</p>
    </Q>
  );
}

// ---------------- S6 ----------------
function QuoteStep({ d, units }: { d: Draft; units: number }) {
  const n = Math.max(units, 0);
  const q = quote(d.plan, n, d.cycle);
  return (
    <Q title="Your quote" sub={`Based on the ${n} ${n === 1 ? "unit" : "units"} you added. Free for ${TRIAL_DAYS} days; billing starts after the trial and BinGi approval.`}>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-[#eceef2]">
        <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#c8232e]">{PLANS[d.plan].label} · {d.cycle === 1 ? "monthly" : `${d.cycle} months`}</p>
        <dl className="mt-3 grid gap-2 text-[15px]">
          <Row k={`Units added`} v={String(n)} />
          <Row k={`Units billed (minimum ${MIN_BILLED})`} v={String(q.billed)} />
          <Row k={`${q.billed} × ৳${PLANS[d.plan].perUnit} × ${d.cycle} ${d.cycle === 1 ? "month" : "months"}`} v={`৳${money(q.gross)}`} />
          {q.off > 0 && <Row k={`${Math.round(CYCLE_OFF[d.cycle] * 100)}% for ${d.cycle} months`} v={`−৳${money(q.off)}`} green />}
          <Row k="Activation (one time)" v={`৳${money(q.activation)}`} />
          <Row k="Total after trial" v={`৳${money(q.total)}`} bold />
        </dl>
        {d.units !== n && d.units > 0 && <p className="mt-3 text-[13px] text-[#5b6170]">You estimated {d.units} units in part 1; the quote uses the {n} you actually added.</p>}
      </div>
      <p className="mt-3 text-[13px] text-[#666d7a]">VAT and other fees, if any, appear on the invoice. Prototype quote — the final amount comes from BinGi billing.</p>
    </Q>
  );
}

function Verify({ d }: { d: Draft }) {
  const { edit } = useOnboarding();
  const docs = [["nid", "Owner NID (front and back)", true], ["trade", "Trade licence", true], ["tin", "TIN certificate", false]] as const;
  return (
    <Q title="Verification" sub="Needed before your website goes public and before online payments. You can use HMS while BinGi checks them.">
      <div className="space-y-3">
        {docs.map(([k, label, req]) => (
          <label key={k} className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#eceef2] focus-within:ring-2 focus-within:ring-[#e2574e]">
            <span className={clsx("grid size-10 place-items-center rounded-xl", d.verify[k] ? "bg-[#eef8f1] text-[#1c7d45]" : "bg-[#f2f3f6] text-[#4b5160]")}>{d.verify[k] ? <Check className="size-5" /> : <FileUp className="size-5" />}</span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{label}{!req && <span className="font-normal text-[#5b6170]"> (optional)</span>}</span><span className="block truncate text-[13px] text-[#5b6170]">{d.verify[k] || "PDF or photo"}</span></span>
            <span className="text-[14px] font-medium text-[#c8232e]">{d.verify[k] ? "Replace" : "Upload"}</span>
            <input type="file" accept="image/*,application/pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) edit((x) => { x.verify[k] = f.name; x.verify.later = false; }); }} />
          </label>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[#5b6170]">Prototype: only the file name is kept; nothing is uploaded.</p>
    </Q>
  );
}

function Ready({ d, counts, go }: { d: Draft; counts: { total: number; published: number; categories: number }; go: (s: StepId) => void }) {
  const cs = checks(d, counts);
  const sc = score(cs);
  const groups = [["required", "Required to submit"], ["recommended", "Recommended"], ["optional", "Optional"]] as const;
  return (
    <Q title="Ready to submit" sub="After you submit, HMS opens in setup mode. BinGi checks your property; public listing and online payment open after approval.">
      <div className="flex items-center gap-5 rounded-2xl bg-white p-5 ring-1 ring-[#eceef2]">
        <Ring v={sc} />
        <div><p className="text-[17px] font-semibold">{sc}% ready</p><p className="text-[14px] text-[#5b6170]">{cs.filter((c) => c.level === "required" && !c.ok).length ? "Finish the required items to submit." : "All required items done. You can submit now."}</p></div>
      </div>
      {groups.map(([lv, label]) => (
        <div key={lv} className="mt-5">
          <h2 className="text-[14px] font-semibold text-[#5b6170]">{label}</h2>
          <ul className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-[#eceef2]">
            {cs.filter((c) => c.level === lv).map((c) => (
              <li key={c.id} className="flex items-center gap-3 border-b border-[#f0f1f4] px-4 py-3 last:border-0">
                <span className={clsx("grid size-6 place-items-center rounded-full", c.ok ? "bg-[#1c7d45] text-white" : lv === "required" ? "bg-[#fdf3f2] text-[#b12a22] ring-1 ring-[#f3c7c3]" : "bg-[#f2f3f6] text-[#666d7a]")}>{c.ok ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}</span>
                <span className="flex-1 text-[15px]">{c.label}</span>
                {!c.ok && <button onClick={() => go(c.step)} className="text-[14px] font-medium text-[#c8232e] underline-offset-4 hover:underline">Fix</button>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-4 text-[13px] text-[#5b6170]">{STEP_TITLE["6.3"]}: {d.name || "your property"} · {PLANS[d.plan].label} · {TRIAL_DAYS}-day trial.</p>
    </Q>
  );
}
function Ring({ v }: { v: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${v}% ready`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#eef0f3" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={v >= 80 ? "#1c7d45" : "#d8372e"} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 400ms ease" }} />
      <text x="32" y="37" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1d1f24">{v}</text>
    </svg>
  );
}
