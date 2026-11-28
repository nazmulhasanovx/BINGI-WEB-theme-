"use client";
// /list — Marketplace listing landing + sign-in (phone + demo OTP). Bangla first, English toggle.
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, BadgePercent, Camera, CheckCircle2, Home, Wallet } from "lucide-react";
import { Canvas, Header, Primary, field } from "../onboarding/shell";
import { useL } from "@/lib/onboarding/store";
import { DEMO_OTP, GATEWAY_PCT, HMS_PCT, LISTING_PCT, digits, newListing, split, taka, useListing, validPhone } from "@/lib/listing/store";

const noop = () => () => {};

export function ListLanding() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { t, lang } = useL();
  const { st, update } = useListing();
  return (
    <Canvas>
      <Header home="/list" title={t("মার্কেটপ্লেসে লিস্টিং", "List on Marketplace")}
        right={st.verified ? <button onClick={() => update((s) => { s.verified = false; })} className="h-9 rounded-lg px-3 text-[14px] font-semibold text-[#4d5664] hover:bg-[#e9edf2]">{t("বের হন", "Sign out")}</button> : undefined} />
      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
          <section>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[#b11c29] ring-1 ring-[#f1d3d1]"><Home className="size-4" aria-hidden />BinGi Marketplace</p>
            <h1 className="mt-4 text-[32px] font-semibold leading-[1.2] tracking-[-0.02em] sm:text-[44px]">{t("আপনার রুম বিক্রি করুন BinGi Marketplace-এ", "Sell your rooms on the BinGi Marketplace")}</h1>
            <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-[#4d5664]">{t("১০ মিনিটে লিস্টিং। কোনো মাসিক ফি নেই। বুকিং পেলে তবেই কমিশন।", "List in about 10 minutes. No monthly fee. You pay a commission only when you get a booking.")}</p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [BadgePercent, t(`শুধু ${digits(LISTING_PCT, lang)}% কমিশন`, `Only ${LISTING_PCT}% commission`), t("প্রতিটা বুকিংয়ে, আর কিছু না", "Per booking, nothing else")],
                [Camera, t("ছবি আর দাম দিন", "Add photos and prices"), t("রুম নম্বর বা ফ্লোর লাগবে না", "No room numbers or floors needed")],
                [Wallet, t("bKash, Nagad বা ব্যাংকে টাকা", "Paid to bKash, Nagad or bank"), t("আপনার নিজের অ্যাকাউন্টে", "Into your own account")],
              ].map(([Ic, a, b], i) => {
                const I = Ic as typeof Home;
                return <li key={i} className="rounded-2xl border border-[#e3e7ec] bg-white p-4"><I className="size-6 text-[#b11c29]" aria-hidden /><p className="mt-3 text-[15.5px] font-semibold">{a as string}</p><p className="mt-0.5 text-[13.5px] text-[#4d5664]">{b as string}</p></li>;
              })}
            </ul>
            <HowItWorks />
            <Earnings />
          </section>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            {!ready ? <div className="h-[420px] rounded-2xl bg-white" /> : st.verified ? <Signed /> : <SignIn />}
          </aside>
        </div>
      </main>
    </Canvas>
  );
}

function HowItWorks() {
  const { t, lang } = useL();
  const steps = [
    [t("আপনার জায়গা", "Your place"), t("ধরন, নাম, ঠিকানা", "Type, name, address")],
    [t("রুম ও ছবি", "Rooms & photos"), t("রুমের ধরন, দাম, ছবি", "Room types, prices, photos")],
    [t("টাকা ও প্রকাশ", "Get paid & publish"), t("নিয়ম, টাকা পাওয়ার অ্যাকাউন্ট, জমা", "Rules, payout account, submit")],
  ];
  return (
    <div className="mt-10">
      <h2 className="text-[20px] font-semibold">{t("কীভাবে কাজ করে", "How it works")}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map(([a, b], i) => (
          <li key={i} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-[#e3e7ec]">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0f1720] text-[14px] font-semibold text-white">{digits(i + 1, lang)}</span>
            <span><span className="block text-[15px] font-semibold">{a}</span><span className="block text-[13.5px] text-[#4d5664]">{b}</span></span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13.5px] text-[#4d5664]">{t("জমা দেওয়ার পর BinGi টিম লিস্টিং দেখে চালু করে। টাকা তোলার আগে NID লাগবে।", "After you submit, the BinGi team checks the listing and turns it on. Your NID is needed before your first payout.")}</p>
    </div>
  );
}

/** "What you keep" example — the owner types their own price and nights; nothing is assumed. */
function Earnings() {
  const { t, lang } = useL();
  const [price, setPrice] = useState(3000);
  const [nights, setNights] = useState(20);
  const amount = price * nights;
  const l = split(amount, amount, LISTING_PCT);
  const h = split(amount, amount, HMS_PCT);
  const row = (a: string, b: string, strong?: boolean) => <div className={"flex items-baseline justify-between gap-3 py-1.5 " + (strong ? "border-t border-[#e3e7ec] pt-2.5 text-[16px] font-semibold" : "text-[14.5px] text-[#4d5664]")}><span>{a}</span><span className="tabular-nums text-[#0f1720]">{b}</span></div>;
  return (
    <div className="mt-10 rounded-2xl border border-[#e3e7ec] bg-white p-5 sm:p-6">
      <h2 className="text-[20px] font-semibold">{t("হিসাব করে দেখুন", "Work it out")}</h2>
      <p className="mt-1 text-[14px] text-[#4d5664]">{t("আপনার দাম আর মাসে কত রাত বিক্রি হতে পারে লিখুন।", "Type your price and how many nights you might sell in a month.")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[14px] font-semibold">{t("প্রতি রাতের দাম (৳)", "Price per night (৳)")}<input type="number" inputMode="numeric" min={0} value={price || ""} onChange={(e) => setPrice(Math.max(0, +e.target.value))} className={field + " mt-1"} /></label>
        <label className="block text-[14px] font-semibold">{t("মাসে কত রাত", "Nights per month")}<input type="number" inputMode="numeric" min={0} max={999} value={nights || ""} onChange={(e) => setNights(Math.max(0, Math.min(999, +e.target.value)))} className={field + " mt-1"} /></label>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-[#f4f6f8] p-4">
          <p className="text-[13px] font-semibold text-[#4d5664]">{t("শুধু লিস্টিং", "Listing only")}</p>
          {row(t("গেস্টের বুকিং", "Guest bookings"), taka(amount, lang))}
          {row(t(`কমিশন ${digits(LISTING_PCT, lang)}%`, `Commission ${LISTING_PCT}%`), "−" + taka(l.commission, lang))}
          {row(t(`অনলাইন পেমেন্ট ফি ${digits(GATEWAY_PCT, lang)}%`, `Online payment fee ${GATEWAY_PCT}%`), "−" + taka(l.gateway, lang))}
          {row(t("আপনি পাবেন", "You receive"), taka(l.net, lang), true)}
        </div>
        <div className="rounded-xl bg-[#eef8f1] p-4">
          <p className="text-[13px] font-semibold text-[#1c6b3c]">{t("BinGi HMS নিলে", "With BinGi HMS")}</p>
          {row(t("গেস্টের বুকিং", "Guest bookings"), taka(amount, lang))}
          {row(t(`কমিশন ${digits(HMS_PCT, lang)}%`, `Commission ${HMS_PCT}%`), "−" + taka(h.commission, lang))}
          {row(t(`অনলাইন পেমেন্ট ফি ${digits(GATEWAY_PCT, lang)}%`, `Online payment fee ${GATEWAY_PCT}%`), "−" + taka(h.gateway, lang))}
          {row(t("আপনি পাবেন", "You receive"), taka(h.net, lang), true)}
          <p className="mt-2 text-[12.5px] text-[#1c6b3c]">{t("সাথে পুরো হোটেল চালানোর সফটওয়্যার। HMS প্ল্যানের মাসিক দাম আলাদা।", "Plus software to run the whole property. The HMS plan has its own monthly price.")}</p>
        </div>
      </div>
      <p className="mt-3 text-[12.5px] text-[#5b6270]">{t("উদাহরণে সব টাকা অনলাইনে ধরা হয়েছে। হোটেলে নগদ দিলে অনলাইন পেমেন্ট ফি লাগে না।", "The example assumes every taka is paid online. Cash paid at the property has no online payment fee.")}</p>
    </div>
  );
}

function SignIn() {
  const { update } = useListing();
  const { t } = useL();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErr(t("আপনার নাম লিখুন।", "Type your name.")); return; }
    if (!validPhone(phone)) { setErr(t("সঠিক মোবাইল নম্বর দিন, যেমন 01712 345678", "Enter a Bangladesh mobile number, e.g. 01712 345678")); return; }
    setErr(""); setSent(true);
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() !== DEMO_OTP) { setErr(t("কোডটা মেলেনি। SMS দেখে আবার দিন।", "That code is not right. Check the SMS and try again.")); return; }
    update((s) => { s.phone = phone.replace(/[\s-]/g, ""); s.owner = name.trim(); s.verified = true; s.listing ??= newListing(); });
    router.push("/list/setup");
  };
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgb(16_24_40/0.05),0_20px_50px_-30px_rgb(16_24_40/0.25)] ring-1 ring-[#e8e9ee] sm:p-8">
      <Image src="/brand/bingi-master.svg" alt="BinGi" width={96} height={32} className="h-8 w-auto" />
      <h2 className="mt-5 text-[22px] font-semibold">{sent ? t("কোডটা লিখুন", "Enter the code") : t("লিস্টিং শুরু করুন", "Start your listing")}</h2>
      <p className="mt-1 text-[14.5px] text-[#4d5664]">{sent ? t(`${phone} নম্বরে ৬ সংখ্যার কোড পাঠানো হয়েছে।`, `We sent a 6-digit code to ${phone}.`) : t("শুধু নাম আর মোবাইল নম্বর। পাসওয়ার্ড লাগবে না।", "Just your name and mobile number. No password.")}</p>
      {!sent ? (
        <form onSubmit={send} noValidate className="mt-5 grid gap-3">
          <label className="block text-[14px] font-semibold">{t("আপনার নাম", "Your name")}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field + " mt-1"} /></label>
          <label className="block text-[14px] font-semibold">{t("মোবাইল নম্বর", "Mobile number")}<input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="01712 345678" className={field + " mt-1"} /></label>
          {err && <p role="alert" className="text-[14px] font-medium text-[#8e1621]">{err}</p>}
          <Primary type="submit" className="mt-1 w-full">{t("কোড পাঠান", "Send code")}<ArrowRight className="size-[18px]" aria-hidden /></Primary>
        </form>
      ) : (
        <form onSubmit={verify} noValidate className="mt-5 grid gap-3">
          <label className="block text-[14px] font-semibold">{t("৬ সংখ্যার কোড", "6-digit code")}<input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={field + " mt-1 tracking-[0.3em]"} /></label>
          <p className="rounded-lg bg-[#fff7e6] px-3 py-2 text-[13px] text-[#7a5200]">{t(`প্রোটোটাইপ: কোড ${DEMO_OTP}। কোনো SMS যায় না।`, `Prototype: the code is ${DEMO_OTP}. No SMS is sent.`)}</p>
          {err && <p role="alert" className="text-[14px] font-medium text-[#8e1621]">{err}</p>}
          <Primary type="submit" className="w-full">{t("যাচাই করে শুরু করুন", "Verify and start")}</Primary>
          <button type="button" onClick={() => { setSent(false); setCode(""); setErr(""); }} className="h-10 text-[14px] font-semibold text-[#4d5664] underline-offset-4 hover:underline">{t("নম্বর বদলান", "Change number")}</button>
        </form>
      )}
      <p className="mt-5 border-t border-[#e9edf2] pt-4 text-[13px] text-[#4d5664]">{t("পুরো হোটেল চালাতে চান? ", "Want to run your whole property? ")}<Link href="/onboarding" className="font-semibold text-[#0f1720] underline underline-offset-4">{t("BinGi HMS সেটআপ", "Set up BinGi HMS")}</Link></p>
    </div>
  );
}

function Signed() {
  const { st, update } = useListing();
  const { t } = useL();
  const d = st.listing;
  const submitted = d && d.status !== "draft";
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-[#e8e9ee] sm:p-8">
      <p className="text-[14px] text-[#4d5664]">{t("স্বাগতম", "Welcome")}, {st.owner || st.phone}</p>
      <h2 className="mt-1 text-[22px] font-semibold">{d?.name || t("আপনার লিস্টিং", "Your listing")}</h2>
      {submitted
        ? <p className="mt-2 inline-flex items-center gap-1.5 text-[14.5px] font-medium text-[#1c6b3c]"><CheckCircle2 className="size-5" aria-hidden />{d!.status === "live" ? t("মার্কেটপ্লেসে চালু", "Live on the Marketplace") : t("জমা দেওয়া হয়েছে · রিভিউ চলছে", "Submitted · in review")}</p>
        : <p className="mt-2 text-[14.5px] text-[#4d5664]">{t("আপনার কাজ সেভ আছে। যেখানে ছিলেন সেখান থেকে চালিয়ে যান।", "Your work is saved. Carry on where you left off.")}</p>}
      <Link href={submitted ? "/list/host" : "/list/setup"} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg btn-glow px-5 text-[15px] font-semibold text-white">{submitted ? t("ড্যাশবোর্ড খুলুন", "Open dashboard") : t("চালিয়ে যান", "Continue")}<ArrowRight className="size-[18px]" aria-hidden /></Link>
      {!d && <button onClick={() => update((s) => { s.listing = newListing(); })} className="mt-2 h-10 w-full text-[14px] font-semibold">{t("নতুন লিস্টিং", "New listing")}</button>}
    </div>
  );
}
