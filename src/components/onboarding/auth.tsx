"use client";
// S0 — phone + OTP (demo code), then "আমার property" (new / continue / status). Bangla first.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowRight, Building2, Clock, Mail, Plus, ShieldCheck } from "lucide-react";
import { setProperty } from "../hms/property";
import { Canvas, Ghost, Header, Primary, field } from "./shell";

import { SECTIONS, STEP_TITLE, newDraft, num, stepOf, useL, useOnboarding, validPhone } from "@/lib/onboarding/store";

import { TYPE_META as TYPES } from "./types";

const noop = () => () => {};
const DEMO_OTP = "123456";

export function OnboardingHome() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { st } = useOnboarding();
  const { t } = useL();
  return (
    <Canvas>
      <Header right={st.verified ? <SignOut /> : undefined} />
      {!ready ? <p className="p-8 text-[15px] text-[#4d5664]" role="status">{t("লোড হচ্ছে…", "Loading…")}</p> : st.verified ? <MyProperties /> : <Auth />}
    </Canvas>
  );
}

function SignOut() {
  const { update } = useOnboarding();
  const { t } = useL();
  return <button onClick={() => update((s) => { s.verified = false; })} className="h-9 rounded-full bg-white px-3.5 text-[14px] font-semibold shadow-sm ring-1 ring-black/5">{t("বের হন", "Sign out")}</button>;
}

function Auth() {
  const { update } = useOnboarding();
  const { t, lang } = useL();
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPhone(phone)) { setErr(t("সঠিক মোবাইল নম্বর দিন, যেমন 01712 345678", "Enter a Bangladesh mobile number, e.g. 01712 345678")); return; }
    setErr(""); setSent(true);
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== DEMO_OTP) { setErr(t("কোডটা মেলেনি। SMS দেখে আবার দিন।", "That code is not right. Check the SMS and try again.")); return; }
    update((s) => { s.phone = phone.replace(/[\s-]/g, ""); s.verified = true; });
  };
  return (
    <main className="mx-auto max-w-[1180px] px-3 py-6 sm:px-6 sm:py-10">
      <div className="grid min-h-[620px] gap-3 rounded-2xl bg-white p-3 shadow-[0_1px_2px_rgb(16_24_40/0.05),0_20px_50px_-30px_rgb(16_24_40/0.25)] ring-1 ring-[#e8e9ee] lg:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-8 sm:px-12">
          <div className="mx-auto w-full max-w-[400px]">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#f4f6f8] ring-8 ring-[#f4f6f8]/60"><span className="grid size-12 place-items-center rounded-full bg-white shadow-sm"><Image src="/brand/bingi-hms-mark.svg" alt="" width={26} height={26} className="size-[26px]" /></span></span>
            {!sent ? (
              <form onSubmit={send} noValidate className="mt-5">
                <h1 className="text-center text-[26px] font-semibold leading-tight">{t("আপনার property সেটআপ করুন", "Set up your property")}</h1>
                <p className="mt-1.5 text-center text-[15px] text-[#4d5664]">{t("মোবাইল নম্বর দিয়ে শুরু করুন। নতুন হলে এই নম্বরেই অ্যাকাউন্ট খুলবে।", "Start with your mobile number. New here? This creates your account.")}</p>
                <label className="mt-7 block text-[14.5px] font-semibold" htmlFor="ph">{t("মোবাইল নম্বর", "Mobile number")}</label>
                <div className="mt-1.5 flex gap-2">
                  <span className="grid h-11 place-items-center rounded-lg border border-[#c6ccd4] bg-[#f4f6f8] px-3 text-[14.5px] font-semibold">+880</span>
                  <input id="ph" inputMode="tel" autoComplete="tel" autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712 345678" className={field + " flex-1 text-[16px]"} aria-invalid={!!err} aria-describedby={err ? "pherr" : undefined} />
                </div>
                {err && <p id="pherr" role="alert" className="mt-2 text-[14px] font-medium text-[#8e1621]">{err}</p>}
                <Primary type="submit" className="mt-5 w-full">{t("কোড পাঠান", "Send code")}</Primary>
                <div className="my-6 flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[#80869a]"><span className="h-px flex-1 bg-[#e3e7ec]" />{t("অথবা", "or continue with")}<span className="h-px flex-1 bg-[#e3e7ec]" /></div>
                <div className="grid gap-2.5">
                  <button type="button" disabled title={t("প্রোটোটাইপে নেই", "Not in the prototype")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d3d8df] bg-white text-[14.5px] font-semibold text-[#0f1720] disabled:cursor-not-allowed disabled:opacity-60"><GoogleMark />Google</button>
                  <button type="button" disabled title={t("প্রোটোটাইপে নেই", "Not in the prototype")} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d3d8df] bg-white text-[14.5px] font-semibold text-[#0f1720] disabled:cursor-not-allowed disabled:opacity-60"><Mail className="size-[18px]" />{t("ইমেইল", "Email")}</button>
                </div>
                <p className="mt-2 text-center text-[12.5px] text-[#80869a]">{t("Google ও ইমেইল — প্রোটোটাইপে বন্ধ। আগে মোবাইল যাচাই হবে।", "Google and email are off in the prototype. Mobile is verified first.")}</p>
                <p className="mt-6 text-center text-[13px] text-[#4d5664]">{t("চালিয়ে গেলে আপনি BinGi-র শর্ত ও গোপনীয়তা নীতিতে রাজি।", "By continuing you agree to BinGi's Terms and Privacy Policy.")}</p>
              </form>
            ) : (
              <form onSubmit={verify} noValidate className="mt-5">
                <h1 className="text-center text-[26px] font-semibold leading-tight">{t("কোডটা দিন", "Enter the code")}</h1>
                <p className="mt-1.5 text-center text-[15px] text-[#4d5664]">{t(`${num(phone, lang)} নম্বরে পাঠানো হয়েছে।`, `Sent to ${phone}.`)} <button type="button" onClick={() => { setSent(false); setCode(""); setErr(""); }} className="font-semibold text-[#b11c29]">{t("নম্বর বদলান", "Change")}</button></p>
                <label className="mt-7 block text-[14.5px] font-semibold" htmlFor="otp">{t("৬ সংখ্যার কোড", "6-digit code")}</label>
                <input id="otp" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={field + " mt-1.5 h-14 text-center font-mono text-[26px] tracking-[0.45em]"} aria-invalid={!!err} />
                {err && <p role="alert" className="mt-2 text-[14px] font-medium text-[#8e1621]">{err}</p>}
                <p className="mt-3 rounded-lg bg-[#fdf6e7] px-3 py-2 text-[13.5px] text-[#7a4a0b]">{t(`প্রোটোটাইপ: SMS যায় না। কোড ${DEMO_OTP} দিন।`, `Prototype: no SMS is sent. Use code ${DEMO_OTP}.`)}</p>
                <Primary type="submit" className="mt-5 w-full" disabled={code.length !== 6}>{t("যাচাই করুন", "Verify")}</Primary>
              </form>
            )}
          </div>
        </div>
        <div className="relative hidden overflow-hidden rounded-xl lg:block">
          <Image src="/demo/coral-cove/hero.jpg" alt="" fill sizes="590px" className="object-cover" priority />
          <div className="absolute inset-x-5 bottom-5 rounded-xl bg-white/95 p-5 shadow-lg backdrop-blur">
            <p className="text-[17px] font-semibold">{t("একবার property-র ধরন বাছুন — বাকিটা পরের ধাপ, পরের ধাপ।", "Pick your property type once — then just Next, Next.")}</p>
            <ol className="mt-3 flex flex-wrap gap-1.5">
              {SECTIONS.map((x, i) => <li key={x.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[12.5px] font-semibold text-[#4d5664]"><span className="grid size-4 place-items-center rounded-full bg-white text-[10.5px]">{num(i + 1, lang)}</span>{t(x.bn, x.label)}</li>)}
            </ol>
            <p className="mt-3 flex items-center gap-1.5 text-[13px] text-[#4d5664]"><ShieldCheck className="size-4 text-[#1c7d45]" />{t("প্রায় ১০ মিনিট · যেকোনো সময় থামিয়ে পরে চালিয়ে যান", "About 10 minutes · stop anytime and continue later")}</p>
          </div>
          <span className="absolute left-4 top-4 rounded-md bg-white/90 px-2 py-0.5 text-[11.5px] font-semibold text-[#4d5664]">{t("ডেমো ছবি", "Demo photo")}</span>
        </div>
      </div>
    </main>
  );
}

function GoogleMark() {
  return <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" /><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" /><path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" /><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" /></svg>;
}

function MyProperties() {
  const { st, update } = useOnboarding();
  const { t, lang } = useL();
  const router = useRouter();
  const start = () => {
    const d = newDraft(st.drafts.length);
    d.phone = st.phone;
    update((s) => { s.drafts.unshift(d); s.current = d.id; });
    router.push("/onboarding/flow");
  };
  const open = (id: string, submitted: boolean) => { update((s) => { s.current = id; }); router.push(submitted ? "/onboarding/status" : "/onboarding/flow"); };
  return (
    <main className="mx-auto max-w-[760px] px-4 pb-10 pt-4 sm:px-6">
      <h1 className="text-[30px] font-semibold">{t("আমার property", "My properties")}</h1>
      <p className="mt-1 text-[15.5px] text-[#4d5664]">{t("প্রতিটা property-র আলাদা সেটআপ।", "Each property has its own setup.")} · {num(st.phone, lang)}</p>
      <button onClick={start} className="mt-6 flex w-full items-center gap-4 rounded-xl border border-dashed border-[#efb7b1] bg-white p-5 text-left transition-shadow hover:shadow-[0_14px_30px_-18px_rgb(200_35_46/0.5)]">
        <span className="grid size-14 place-items-center rounded-xl bg-[#b11c29] text-white"><Plus className="size-7" /></span>
        <span><span className="block text-[19px] font-semibold">{t("নতুন property যোগ করুন", "Add a new property")}</span><span className="text-[14.5px] text-[#4d5664]">{t("প্রায় ৮–১০ মিনিট", "About 8–10 minutes")}</span></span>
        <ArrowRight className="ml-auto size-6 text-[#b11c29]" />
      </button>
      {st.drafts.length > 0 && (
        <ul className="mt-5 space-y-3">
          {st.drafts.map((d) => {
            const ty = TYPES.find((x) => x.slug === d.propertyType);
            const I = ty?.icon ?? Building2;
            const submitted = d.status !== "draft";
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e8e9ee]">
                <span className="grid size-12 place-items-center rounded-xl bg-[#ffe7e4] text-[#b11c29]"><I className="size-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-semibold">{d.name || t("নাম নেই", "Untitled property")}</span>
                  <span className="text-[14px] text-[#4d5664]">{[ty ? t(ty.bn, ty.en) : null, d.city].filter(Boolean).join(" · ") || t("শুরু হয়নি", "Not started")}</span>
                </span>
                {submitted
                  ? <span className="rounded-full bg-[#fdf6e7] px-3 py-1 text-[13px] font-semibold text-[#7a4a0b]">{d.status === "approved" ? t("অনুমোদিত", "Approved") : d.status === "needs-changes" ? t("ঠিক করতে হবে", "Needs changes") : t("অনুমোদনের অপেক্ষায়", "Waiting for approval")}</span>
                  : <span className="inline-flex items-center gap-1 text-[13.5px] text-[#4d5664]"><Clock className="size-4" /> {t("পরের ধাপ", "Next")}: {t(...STEP_TITLE[stepOf(d.step)])}</span>}
                <Ghost onClick={() => open(d.id, submitted)} className="h-10">{submitted ? t("স্ট্যাটাস", "Status") : t("চালিয়ে যান", "Continue")}</Ghost>
                {submitted && <Link href="/hms" onClick={() => { update((s) => { s.current = d.id; }); setProperty(d.slug); }} className="inline-flex h-10 items-center rounded-xl bg-[#0f1720] px-4 text-[14.5px] font-semibold text-white">{t("HMS খুলুন", "Open HMS")}</Link>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-8 text-[14px] text-[#4d5664]">{t("অনেকগুলো property একসাথে? Enterprise প্ল্যান BinGi টিম সেটআপ করে দেয় — উপরে সাহায্য চাপুন।", "Several properties as a group? BinGi sets up Enterprise with you — tap Help above.")}</p>
    </main>
  );
}
