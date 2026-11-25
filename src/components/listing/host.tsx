"use client";
// /list/host — listing mode for Marketplace-only owners: no HMS sidebar, 5 simple tabs.
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, BadgeCheck, Camera, CalendarDays, CheckCircle2, Clock, Home, Inbox, ListChecks, Pencil, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { Canvas, Ghost, Header, Pills } from "../onboarding/shell";
import { useL } from "@/lib/onboarding/store";
import { BEDS, CANCEL, GATEWAY_PCT, HMS_PCT, LISTING_PCT, demoBookings, digits, iso, resizePhoto, split, taka, useListing, type DemoBooking, type Listing } from "@/lib/listing/store";

const noop = () => () => {};
type Tab = "today" | "bookings" | "calendar" | "payouts" | "listing";

export function ListHost() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { st, d } = useListing();
  const { t } = useL();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!st.verified) router.replace("/list");
    else if (!d || d.status === "draft") router.replace("/list/setup");
  }, [ready, st.verified, d, router]);
  if (!ready || !d || d.status === "draft") return <Canvas><Header home="/list" /><p className="p-8 text-[15px] text-[#4d5664]" role="status">{t("লোড হচ্ছে…", "Loading…")}</p></Canvas>;
  return <Dash d={d} />;
}

function Dash({ d }: { d: Listing }) {
  const { t, lang } = useL();
  const [tab, setTab] = useState<Tab>("today");
  const tabs: { v: Tab; label: string; icon: typeof Home }[] = [
    { v: "today", label: t("আজ", "Today"), icon: Home },
    { v: "bookings", label: t("বুকিং", "Bookings"), icon: Inbox },
    { v: "calendar", label: t("ক্যালেন্ডার", "Calendar"), icon: CalendarDays },
    { v: "payouts", label: t("টাকা", "Payouts"), icon: Wallet },
    { v: "listing", label: t("লিস্টিং", "Listing"), icon: ListChecks },
  ];
  return (
    <Canvas>
      <Header home="/list" title={d.name} badge={<span className={clsx("hidden rounded-full px-2 py-0.5 text-[12px] font-semibold sm:inline", d.status === "live" ? "bg-[#e8f4ec] text-[#1c6b3c]" : "bg-[#fff2d9] text-[#7a5200]")}>{d.status === "live" ? t("চালু", "Live") : t("রিভিউ চলছে", "In review")}</span>} />
      <div className="border-b border-[#e3e7ec] bg-white">
        <nav aria-label={t("হোস্ট মেনু", "Host menu")} className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-3 sm:px-6 [scrollbar-width:none]">
          {tabs.map((x) => { const I = x.icon; const on = tab === x.v; return (
            <button key={x.v} onClick={() => setTab(x.v)} aria-current={on ? "page" : undefined} className={clsx("relative inline-flex h-12 shrink-0 items-center gap-2 px-3 text-[14.5px] font-semibold transition-colors", on ? "text-[#0f1720]" : "text-[#5b6270] hover:text-[#0f1720]")}>
              <I className="size-[18px]" aria-hidden />{x.label}{on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t bg-[#b11c29]" />}
            </button>); })}
        </nav>
      </div>
      <main className="mx-auto max-w-[1120px] px-4 pb-16 pt-6 sm:px-6">
        <StatusBanner d={d} />
        <div key={tab} className="onb-in mt-6">
          {tab === "today" && <Today d={d} go={setTab} />}
          {tab === "bookings" && <Bookings d={d} />}
          {tab === "calendar" && <Calendar d={d} />}
          {tab === "payouts" && <Payouts d={d} />}
          {tab === "listing" && <ListingTab d={d} />}
        </div>
        <p className="mt-10 text-center text-[12.5px] text-[#7a5200]">{t(`প্রোটোটাইপ · তথ্য শুধু এই ব্রাউজারে · কমিশন ${digits(LISTING_PCT, lang)}% (চূড়ান্ত হয়নি)`, `Prototype · data stays in this browser · commission ${LISTING_PCT}% (not final)`)}</p>
      </main>
    </Canvas>
  );
}

function StatusBanner({ d }: { d: Listing }) {
  const { t } = useL();
  const { edit } = useListing();
  if (d.status === "live") return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#eef8f1] px-4 py-3.5 ring-1 ring-[#cfe8d7]">
      <BadgeCheck className="size-6 text-[#1c7d45]" aria-hidden />
      <p className="min-w-[200px] flex-1 text-[15px] font-semibold text-[#1c6b3c]">{t("আপনার লিস্টিং BinGi Marketplace-এ চালু আছে", "Your listing is live on the BinGi Marketplace")}</p>
      <button onClick={() => edit((x) => { x.status = "review"; x.approved = undefined; })} className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-[#7a5200] hover:bg-[#fff2d9]">{t("প্রোটোটাইপ: রিভিউতে ফেরত", "Prototype: back to review")}</button>
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff8eb] px-4 py-3.5 ring-1 ring-[#f3dfb6]">
      <Clock className="size-6 text-[#a36b00]" aria-hidden />
      <div className="min-w-[200px] flex-1"><p className="text-[15px] font-semibold">{t("রিভিউ চলছে", "In review")}</p><p className="text-[13.5px] text-[#5b6270]">{t("BinGi টিম ছবি, দাম আর তথ্য দেখছে। চালু হলে SMS পাবেন। এখনো গেস্ট বুক করতে পারবে না।", "The BinGi team is checking photos, prices and details. You will get an SMS when it is live. Guests cannot book yet.")}</p></div>
      <button onClick={() => edit((x) => { x.status = "live"; x.approved = new Date().toISOString(); })} className="h-10 rounded-lg bg-[#fff2d9] px-3 text-[13.5px] font-semibold text-[#7a5200] hover:bg-[#ffe9bf]">{t("প্রোটোটাইপ: অনুমোদন দেখান", "Prototype: simulate approval")}</button>
    </div>
  );
}

const rows = (d: Listing) => d.bookings;
function totals(list: DemoBooking[]) {
  const ok = list.filter((b) => b.status !== "cancelled");
  return ok.reduce((a, b) => { const s = split(b.amount, b.online); return { amount: a.amount + b.amount, commission: a.commission + s.commission, gateway: a.gateway + s.gateway, net: a.net + s.net, online: a.online + b.online }; }, { amount: 0, commission: 0, gateway: 0, net: 0, online: 0 });
}
const addDays = (s: string, n: number) => { const x = new Date(s + "T00:00:00"); x.setDate(x.getDate() + n); return iso(x); };

function DemoFill({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  if (d.bookings.length) return null;
  return <button onClick={() => edit((x) => { x.bookings = demoBookings(x); })} className="mt-3 h-10 rounded-lg bg-[#fff7e6] px-3 text-[13.5px] font-semibold text-[#7a5200]">{t("প্রোটোটাইপ: নমুনা বুকিং যোগ করুন", "Prototype: add sample bookings")}</button>;
}

function Today({ d, go }: { d: Listing; go: (t: Tab) => void }) {
  const { t, lang } = useL();
  const today = iso(new Date());
  const list = rows(d);
  const arriving = list.filter((b) => b.checkIn === today && b.status !== "cancelled");
  const inHouse = list.filter((b) => b.status === "checked-in");
  const soon = list.filter((b) => b.checkIn > today && b.checkIn <= addDays(today, 7) && b.status === "confirmed");
  const month = totals(list.filter((b) => b.checkIn.slice(0, 7) === today.slice(0, 7)));
  const stat = (label: string, value: string, sub?: string) => <div className="rounded-2xl bg-white p-4 ring-1 ring-[#e3e7ec]"><p className="text-[13px] font-medium text-[#4d5664]">{label}</p><p className="mt-1 text-[26px] font-semibold tabular-nums tracking-tight">{value}</p>{sub && <p className="text-[12.5px] text-[#5b6270]">{sub}</p>}</div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stat(t("আজ আসছে", "Arriving today"), digits(arriving.length, lang))}
          {stat(t("এখন আছে", "Staying now"), digits(inHouse.length, lang))}
          {stat(t("৭ দিনে আসছে", "Next 7 days"), digits(soon.length, lang))}
          {stat(t("এ মাসে পাবেন", "This month you receive"), taka(month.net, lang), t("কমিশন ও ফি বাদে", "after commission and fees"))}
        </div>
        <section className="mt-6 rounded-2xl bg-white ring-1 ring-[#e3e7ec]">
          <h2 className="border-b border-[#e9edf2] px-4 py-3 text-[16px] font-semibold">{t("সামনের বুকিং", "Coming up")}</h2>
          {[...arriving, ...soon].length === 0
            ? <div className="px-4 py-8 text-center"><Inbox className="mx-auto size-8 text-[#9aa0ac]" aria-hidden /><p className="mt-2 text-[15px] font-medium">{t("এখনো কোনো বুকিং নেই", "No bookings yet")}</p><p className="text-[13.5px] text-[#4d5664]">{d.status === "live" ? t("গেস্ট বুক করলে এখানে দেখাবে, আর SMS পাবেন।", "When a guest books it shows here and you get an SMS.") : t("লিস্টিং চালু হলে বুকিং আসবে।", "Bookings arrive once the listing is live.")}</p><DemoFill d={d} /></div>
            : <ul className="divide-y divide-[#e9edf2]">{[...arriving, ...soon].map((b) => <BookingRow key={b.id} b={b} />)}</ul>}
        </section>
      </div>
      <aside className="grid content-start gap-4">
        <Todo d={d} go={go} />
        <Upgrade d={d} />
      </aside>
    </div>
  );
}

function Todo({ d, go }: { d: Listing; go: (t: Tab) => void }) {
  const { t } = useL();
  const items = [
    { ok: !!(d.nid.front && d.nid.back), label: t("NID দিন — প্রথম টাকা তোলার আগে লাগবে", "Add your NID — needed before your first payout"), tab: "payouts" as Tab },
    { ok: Object.keys(d.avail).length > 0, label: t("ক্যালেন্ডারে বন্ধের দিনগুলো দিন", "Close the dates you cannot sell"), tab: "calendar" as Tab },
    { ok: d.photos.length >= 3, label: t("আরো ৩টা ছবি দিন", "Add 3 more photos"), tab: "listing" as Tab },
  ];
  if (items.every((i) => i.ok)) return null;
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-[#e3e7ec]">
      <h2 className="text-[15.5px] font-semibold">{t("যা বাকি", "To do")}</h2>
      <ul className="mt-2 space-y-1">{items.map((i) => <li key={i.label}><button onClick={() => go(i.tab)} disabled={i.ok} className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-2 text-left text-[14px] enabled:hover:bg-[#f4f6f8] disabled:text-[#5b6270]">{i.ok ? <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-[#1c7d45]" aria-hidden /> : <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-[#b11c29]" aria-hidden />}<span className={i.ok ? "line-through" : ""}>{i.label}</span></button></li>)}</ul>
    </section>
  );
}

/** Upgrade nudge: the saving is worked out from the owner's own bookings only. */
function Upgrade({ d }: { d: Listing }) {
  const { t, lang } = useL();
  const tot = totals(d.bookings);
  const saved = Math.round((tot.amount * (LISTING_PCT - HMS_PCT)) / 100);
  return (
    <section className="rounded-2xl bg-[#0f1720] p-5 text-white">
      <Sparkles className="size-6 text-[#ffb4ae]" aria-hidden />
      <h2 className="mt-3 text-[17px] font-semibold">{t("পুরো হোটেল চালান BinGi HMS দিয়ে", "Run your whole property with BinGi HMS")}</h2>
      <p className="mt-1 text-[14px] leading-relaxed text-white/75">{t(`ফ্রন্ট ডেস্ক, হাউসকিপিং, নিজের ওয়েবসাইট — আর মার্কেটপ্লেস কমিশন ${digits(LISTING_PCT, lang)}% থেকে কমে ${digits(HMS_PCT, lang)}%।`, `Front desk, housekeeping, your own website — and Marketplace commission drops from ${LISTING_PCT}% to ${HMS_PCT}%.`)}</p>
      {saved > 0 && <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[14px]">{t(`আপনার এ পর্যন্ত বুকিংয়ে HMS থাকলে বাঁচত ${taka(saved, lang)}`, `On your bookings so far, HMS would have saved ${taka(saved, lang)}`)}</p>}
      <Link href="/onboarding" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-white px-4 text-[14px] font-semibold text-[#0f1720]">{t("HMS দেখুন", "See BinGi HMS")}<ArrowRight className="size-4" aria-hidden /></Link>
      <p className="mt-2 text-[12px] text-white/60">{t("আপনার রুম, দাম আর ছবি HMS-এ চলে যাবে, আবার লিখতে হবে না (পরিকল্পিত)।", "Your rooms, prices and photos move to the HMS — no retyping (planned).")}</p>
    </section>
  );
}

const STATUS: Record<DemoBooking["status"], [string, string, string]> = {
  confirmed: ["কনফার্ম", "Confirmed", "bg-[#e9f1fb] text-[#1d4f8f]"],
  "checked-in": ["এখন আছে", "Staying", "bg-[#e8f4ec] text-[#1c6b3c]"],
  completed: ["শেষ", "Completed", "bg-[#e9edf2] text-[#4d5664]"],
  cancelled: ["বাতিল", "Cancelled", "bg-[#fdecea] text-[#9b241d]"],
};
function fmtDate(s: string, lang: "bn" | "en") {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "short" });
}
function BookingRow({ b }: { b: DemoBooking }) {
  const { t, lang } = useL();
  const s = split(b.amount, b.online);
  const [bn, en, cls] = STATUS[b.status];
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="min-w-[180px] flex-1"><p className="truncate text-[15px] font-semibold">{b.guest} <span className="ml-1 rounded bg-[#fff2d9] px-1 py-0.5 text-[10.5px] font-semibold text-[#7a5200]">DEMO</span></p><p className="truncate text-[13px] text-[#4d5664]">{b.room} · {fmtDate(b.checkIn, lang)} · {t(`${digits(b.nights, lang)} রাত`, `${b.nights} night${b.nights > 1 ? "s" : ""}`)} · {t(`${digits(b.guests, lang)} জন`, `${b.guests} guests`)}</p></div>
      <span className={clsx("rounded-full px-2 py-0.5 text-[12px] font-semibold", cls)}>{t(bn, en)}</span>
      <div className="ml-auto text-right"><p className="text-[15px] font-semibold tabular-nums">{taka(s.net, lang)}</p><p className="text-[12px] text-[#5b6270]">{t("আপনি পাবেন", "you receive")}</p></div>
    </li>
  );
}

function Bookings({ d }: { d: Listing }) {
  const { t, lang } = useL();
  const list = [...d.bookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn));
  if (!list.length) return <div className="rounded-2xl bg-white px-4 py-12 text-center ring-1 ring-[#e3e7ec]"><Inbox className="mx-auto size-8 text-[#9aa0ac]" aria-hidden /><p className="mt-2 text-[15px] font-medium">{t("এখনো কোনো বুকিং নেই", "No bookings yet")}</p><DemoFill d={d} /></div>;
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#e3e7ec]">
      <table className="w-full min-w-[760px] text-[14px]">
        <thead><tr className="border-b border-[#e9edf2] text-left text-[12.5px] font-semibold uppercase tracking-wide text-[#5b6270]">
          {[t("বুকিং", "Booking"), t("গেস্ট", "Guest"), t("রুম", "Room"), t("আসা", "Arrival"), t("অবস্থা", "Status"), t("মোট", "Total"), t("অনলাইনে এসেছে", "Paid online"), t("কমিশন + ফি", "Commission + fee"), t("আপনি পাবেন", "You receive")].map((h, i) => <th key={h} className={clsx("px-3 py-2.5", i >= 5 && "text-right")}>{h}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-[#e9edf2]">
          {list.map((b) => { const s = split(b.amount, b.online); const [bn, en, cls] = STATUS[b.status]; return (
            <tr key={b.id}>
              <td className="px-3 py-3 font-mono text-[12.5px]">{b.id}</td>
              <td className="px-3 py-3 font-medium">{b.guest}</td>
              <td className="px-3 py-3">{b.room}</td>
              <td className="px-3 py-3">{fmtDate(b.checkIn, lang)} · {digits(b.nights, lang)}{t("রাত", "n")}</td>
              <td className="px-3 py-3"><span className={clsx("rounded-full px-2 py-0.5 text-[12px] font-semibold", cls)}>{t(bn, en)}</span></td>
              <td className="px-3 py-3 text-right tabular-nums">{taka(b.amount, lang)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{taka(b.online, lang)}</td>
              <td className="px-3 py-3 text-right tabular-nums text-[#9b241d]">−{taka(s.commission + s.gateway, lang)}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{taka(s.net, lang)}</td>
            </tr>); })}
        </tbody>
      </table>
      <p className="border-t border-[#e9edf2] px-3 py-2.5 text-[12.5px] text-[#5b6270]">{t("DEMO = প্রোটোটাইপের নমুনা বুকিং। অগ্রিম বুকিংয়ে বাকি টাকা গেস্ট হোটেলে আপনাকে দেয়; সেখান থেকে কমিশন পরের হিসাবে কাটা হয়।", "DEMO = prototype sample booking. With an advance, the guest pays the rest to you at the property; that commission is taken in the next statement.")}</p>
    </div>
  );
}

function Calendar({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  const rooms = d.rooms.filter((r) => r.name.trim());
  const [key, setKey] = useState(rooms[0]?.key ?? "");
  const room = rooms.find((r) => r.key === key) ?? rooms[0];
  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + i); return iso(x); }), []);
  if (!room) return null;
  const booked = (day: string) => d.bookings.filter((b) => b.room === room.name && b.status !== "cancelled" && b.checkIn <= day && day < addDays(b.checkIn, b.nights)).length;
  const open = (day: string) => d.avail[`${room.key}|${day}`] ?? room.count;
  const set = (day: string, n: number) => edit((x) => { const k = `${room.key}|${day}`; if (n >= room.count) delete x.avail[k]; else x.avail[k] = Math.max(0, n); });
  const first = new Date(days[0] + "T00:00:00").getDay();
  const wk = lang === "bn" ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {rooms.length > 1 && <Pills label={t("রুমের ধরন", "Room type")} value={room.key} onChange={setKey} items={rooms.map((r) => ({ v: r.key, label: r.name }))} size="sm" />}
        <p className="text-[14px] text-[#4d5664]">{t(`${digits(room.count, lang)}টা রুম · ${taka(room.price, lang)}/রাত`, `${room.count} room${room.count > 1 ? "s" : ""} · ${taka(room.price, lang)}/night`)}</p>
      </div>
      <p className="mt-2 text-[13.5px] text-[#4d5664]">{t("কোনো দিনে ট্যাপ করুন: খোলা ↔ বন্ধ। একাধিক রুম থাকলে − / + দিয়ে কয়টা বিক্রি করবেন ঠিক করুন।", "Tap a day to switch open ↔ closed. With more than one room, use − / + to set how many to sell.")}</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {wk.map((w) => <p key={w} className="pb-1 text-center text-[12px] font-semibold text-[#5b6270]">{w}</p>)}
        {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
        {days.map((day) => {
          const n = open(day); const b = booked(day); const closed = n === 0; const left = Math.max(0, n - b);
          return (
            <div key={day} className={clsx("rounded-xl p-1.5 text-center ring-1 transition-colors sm:p-2", closed ? "bg-[#f4f6f8] ring-[#e3e7ec]" : left === 0 ? "bg-[#fff5f4] ring-[#f3c7c3]" : "bg-white ring-[#d3d8df]")}>
              <button onClick={() => set(day, closed ? room.count : 0)} aria-label={`${fmtDate(day, lang)}: ${closed ? t("বন্ধ", "closed") : t(`${digits(left, lang)}টা খালি`, `${left} left`)}`} className="w-full">
                <span className="block text-[13px] font-semibold tabular-nums">{digits(new Date(day + "T00:00:00").getDate(), lang)}{(day === days[0] || day.endsWith("-01")) && <span className="ml-1 text-[11px] font-medium text-[#5b6270]">{new Date(day + "T00:00:00").toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", { month: "short" })}</span>}</span>
                <span className={clsx("block text-[11px] font-medium sm:text-[12px]", closed ? "text-[#80869a] line-through" : left === 0 ? "text-[#9b241d]" : "text-[#1c6b3c]")}>{closed ? t("বন্ধ", "Closed") : left === 0 ? t("ভরা", "Full") : t(`${digits(left, lang)} খালি`, `${left} left`)}</span>
              </button>
              {room.count > 1 && !closed && <div className="mt-1 hidden items-center justify-center gap-1 sm:flex"><button onClick={() => set(day, n - 1)} aria-label={t("একটা কম", "One fewer")} className="grid size-6 place-items-center rounded-full text-[14px] hover:bg-[#e9edf2]">−</button><button onClick={() => set(day, n + 1)} disabled={n >= room.count} aria-label={t("একটা বেশি", "One more")} className="grid size-6 place-items-center rounded-full text-[14px] hover:bg-[#e9edf2] disabled:opacity-30">+</button></div>}
            </div>
          );
        })}
      </div>
      <p className="mt-4 rounded-lg bg-[#f4f6f8] px-3 py-2.5 text-[13px] text-[#4d5664]">{t("অন্য সাইটেও (Booking.com, Airbnb) বিক্রি করলে iCal দিয়ে ক্যালেন্ডার মেলানো যাবে — পরিকল্পিত।", "If you also sell on other sites (Booking.com, Airbnb), calendars can sync with iCal — planned.")}</p>
    </div>
  );
}

function Payouts({ d }: { d: Listing }) {
  const { t, lang } = useL();
  const tot = totals(d.bookings);
  const p = d.payout;
  const masked = p.method === "bank" ? `${p.bank} ····${p.acc.slice(-4)}` : `${p.method === "bkash" ? "bKash" : "Nagad"} ····${p.wallet.replace(/\D/g, "").slice(-3)}`;
  const nid = !!(d.nid.front && d.nid.back);
  const line = (a: string, b: string, cls?: string) => <div className={clsx("flex justify-between gap-3 py-2", cls)}><span>{a}</span><span className="tabular-nums">{b}</span></div>;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-2xl bg-white p-5 ring-1 ring-[#e3e7ec]">
        <h2 className="text-[16px] font-semibold">{t("হিসাব", "Statement")}</h2>
        <p className="text-[13px] text-[#5b6270]">{t("বাতিল বুকিং বাদে সব বুকিং", "All bookings except cancelled")}</p>
        <div className="mt-3 divide-y divide-[#e9edf2] text-[14.5px]">
          {line(t("গেস্টের মোট বুকিং", "Guest bookings total"), taka(tot.amount, lang))}
          {line(t("অনলাইনে এসেছে", "Paid online"), taka(tot.online, lang), "text-[#4d5664]")}
          {line(t(`কমিশন ${digits(LISTING_PCT, lang)}%`, `Commission ${LISTING_PCT}%`), "−" + taka(tot.commission, lang), "text-[#9b241d]")}
          {line(t(`পেমেন্ট ফি ${digits(GATEWAY_PCT, lang)}% (অনলাইনের ওপর)`, `Payment fee ${GATEWAY_PCT}% (on online part)`), "−" + taka(tot.gateway, lang), "text-[#9b241d]")}
          {line(t("আপনি পাবেন", "You receive"), taka(tot.net, lang), "text-[16px] font-semibold")}
        </div>
        {!d.bookings.length && <DemoFill d={d} />}
        <p className="mt-3 text-[12.5px] text-[#5b6270]">{t("টাকা পাঠানোর সময়সূচি (সাপ্তাহিক / মাসিক) এখনো ঠিক হয়নি।", "Payout schedule (weekly / monthly) is not decided yet.")}</p>
      </section>
      <aside className="grid content-start gap-4">
        <section className="rounded-2xl bg-white p-4 ring-1 ring-[#e3e7ec]">
          <p className="text-[13px] font-medium text-[#4d5664]">{t("টাকা যাবে", "Paid to")}</p>
          <p className="mt-1 text-[16px] font-semibold">{masked}</p>
          <p className="text-[13px] text-[#4d5664]">{p.holder}</p>
        </section>
        <section className={clsx("rounded-2xl p-4 ring-1", nid ? "bg-[#eef8f1] ring-[#cfe8d7]" : "bg-[#fff5f4] ring-[#f3c7c3]")}>
          <p className="flex items-center gap-2 text-[15px] font-semibold">{nid ? <CheckCircle2 className="size-5 text-[#1c7d45]" aria-hidden /> : <ShieldAlert className="size-5 text-[#b11c29]" aria-hidden />}{nid ? t("NID দেওয়া হয়েছে", "NID added") : t("টাকা তোলার আগে NID লাগবে", "NID needed before payout")}</p>
          <p className="mt-1 text-[13px] text-[#4d5664]">{nid ? t("BinGi টিম যাচাই করবে (প্রোটোটাইপ)।", "The BinGi team will verify it (prototype).") : t("NID-এর দুই দিকের ছবি দিন। লিস্টিং চালু থাকবে।", "Add both sides of your NID. Your listing stays live.")}</p>
          <NidPick d={d} />
        </section>
      </aside>
    </div>
  );
}

function NidPick({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t } = useL();
  const [err, setErr] = useState("");
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {(["front", "back"] as const).map((k) => (
        <label key={k} className="relative block cursor-pointer overflow-hidden rounded-lg border border-[#d3d8df] bg-white">
          {d.nid[k] ? <img src={d.nid[k]} alt="" className="aspect-[3/2] w-full object-cover" /> : <span className="flex aspect-[3/2] flex-col items-center justify-center gap-1 text-[13px] font-semibold text-[#0f1720]"><Camera className="size-5" aria-hidden />{k === "front" ? t("সামনের দিক", "Front") : t("পেছনের দিক", "Back")}</span>}
          {d.nid[k] && <span className="absolute inset-x-0 bottom-0 bg-white/90 py-1 text-center text-[12px] font-semibold">{t("বদলান", "Change")}</span>}
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { const u = await resizePhoto(f, 900); if (edit((x) => { x.nid[k] = u; }) === false) setErr(t("ব্রাউজারে জায়গা নেই।", "This browser is out of space.")); } catch { setErr(t("এটা ছবি না।", "That is not an image.")); } }} />
        </label>
      ))}
      {err && <p role="alert" className="col-span-2 text-[13px] font-medium text-[#9b241d]">{err}</p>}
    </div>
  );
}

function ListingTab({ d }: { d: Listing }) {
  const { edit } = useListing();
  const { t, lang } = useL();
  const router = useRouter();
  const rooms = d.rooms.filter((r) => r.name.trim());
  const editAt = (step: number) => { edit((x) => { x.status = "draft"; x.step = step; x.seen = 8; }); router.push("/list/setup"); };
  const block = (title: string, step: number, body: React.ReactNode) => (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-[#e3e7ec] sm:p-5">
      <div className="flex items-center justify-between gap-3"><h2 className="text-[15.5px] font-semibold">{title}</h2><button onClick={() => editAt(step)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[14px] font-semibold hover:bg-[#f4f6f8]"><Pencil className="size-4" aria-hidden />{t("বদলান", "Edit")}</button></div>
      <div className="mt-2 text-[14px] text-[#4d5664]">{body}</div>
    </section>
  );
  return (
    <div>
      {d.status === "live" && <p className="mb-4 rounded-lg bg-[#f4f6f8] px-3 py-2.5 text-[13.5px] text-[#4d5664]">{t("বদলালে লিস্টিং আবার রিভিউতে যাবে (প্রোটোটাইপ নিয়ম)।", "Editing sends the listing back to review (prototype rule).")}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {block(t("নাম ও ঠিকানা", "Name & address"), 1, <><p className="font-semibold text-[#0f1720]">{d.name}</p><p>{[d.road, d.area, d.city].filter(Boolean).join(", ")}</p>{d.tagline && <p className="mt-1">{d.tagline}</p>}</>)}
        {block(t("রুম ও দাম", "Rooms & prices"), 4, <ul className="space-y-1">{rooms.map((r) => <li key={r.key} className="flex justify-between gap-2"><span className="truncate">{r.name} · {t(...BEDS[r.bed])} · {digits(r.count, lang)}{t("টা", "×")}</span><span className="tabular-nums text-[#0f1720]">{taka(r.price, lang)}</span></li>)}</ul>)}
        {block(t("ছবি", "Photos"), 5, <div className="flex gap-2 overflow-x-auto">{[d.cover, ...rooms.map((r) => r.photo), ...d.photos].filter(Boolean).slice(0, 8).map((p, i) => <img key={i} src={p} alt="" className="size-16 shrink-0 rounded-lg object-cover" />)}</div>)}
        {block(t("নিয়ম", "House rules"), 6, <p>{t("চেক-ইন", "Check-in")} {d.rules.checkIn} · {t("চেক-আউট", "Check-out")} {d.rules.checkOut} · {t(CANCEL[d.rules.cancel].bn, CANCEL[d.rules.cancel].en)}</p>)}
        {block(t("টাকা পাওয়া ও NID", "Payout & NID"), 7, <p>{d.payout.method === "bank" ? d.payout.bank : d.payout.method === "bkash" ? "bKash" : "Nagad"} · NID {d.nid.front && d.nid.back ? t("দেওয়া হয়েছে", "added") : t("বাকি", "missing")}</p>)}
      </div>
      <Ghost onClick={() => editAt(8)} className="mt-5">{t("পুরো লিস্টিং দেখুন", "Review the whole listing")}</Ghost>
    </div>
  );
}
