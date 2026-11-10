"use client";
// AUTH-01 phone + OTP (demo code) and OWN-00 My Properties (new / resume / submitted).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setProperty } from "../hms/property";
import { useState, useSyncExternalStore } from "react";
import { ArrowRight, Building2, Clock, Plus, ShieldCheck } from "lucide-react";
import { Header, Primary } from "./shell";
import { newDraft, STEP_TITLE, useOnboarding, validPhone } from "@/lib/onboarding/store";
import { PROPERTY_TYPES } from "@/lib/rooms/catalog";
import { inputCls } from "../hms/staff/ui";

const noop = () => () => {};
const DEMO_OTP = "123456";

export function OnboardingHome() {
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const { st } = useOnboarding();
  return (
    <div className="min-h-dvh bg-[#f6f7f9]">
      <Header right={st.verified ? <SignOut /> : undefined} />
      {!ready ? <p className="p-8 text-[14px] text-[#5b6170]" role="status">Loading…</p> : st.verified ? <MyProperties /> : <Auth />}
    </div>
  );
}

function SignOut() {
  const { update } = useOnboarding();
  return <button onClick={() => update((s) => { s.verified = false; })} className="h-9 rounded-xl px-3 text-[14px] font-medium text-[#4b5160] hover:bg-[#f2f3f6]">Sign out</button>;
}

function Auth() {
  const { update } = useOnboarding();
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPhone(phone)) { setErr("Enter a Bangladesh mobile number, e.g. 01712 345678."); return; }
    setErr(""); setSent(true);
  };
  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== DEMO_OTP) { setErr("That code is not right. Check the SMS and try again."); return; }
    update((s) => { s.phone = phone.replace(/[\s-]/g, ""); s.verified = true; });
  };
  return (
    <main className="mx-auto grid max-w-[1080px] items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#c8232e]">BinGi Hotel Management</p>
        <h1 className="mt-3 text-[40px] font-bold leading-[1.1] tracking-[-0.02em]">Set up your property once.<br />Run it every day.</h1>
        <p className="mt-4 max-w-[460px] text-[16.5px] leading-relaxed text-[#5b6170]">Six short parts: property, accommodations, booking, operations, online and review. Save anytime and come back.</p>
        <ul className="mt-8 space-y-3 text-[15px]">
          {["7-day free trial on the plan you choose", "Rooms, cottages, villas and apartments in one setup", "Help from the BinGi team at any step"].map((t) => (
            <li key={t} className="flex items-center gap-3"><ShieldCheck className="size-5 text-[#1c7d45]" />{t}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgb(16_24_40/0.05),0_12px_32px_-12px_rgb(16_24_40/0.12)] sm:p-8">
        {!sent ? (
          <form onSubmit={send} noValidate>
            <h2 className="text-[24px] font-bold tracking-[-0.01em]">Sign in or create account</h2>
            <p className="mt-1.5 text-[14.5px] text-[#5b6170]">We send a 6-digit code by SMS.</p>
            <label className="mt-6 block text-[14px] font-medium" htmlFor="ph">Mobile number</label>
            <div className="mt-1.5 flex gap-2">
              <span className="grid h-11 place-items-center rounded-xl border border-[#dfe2e8] bg-[#f6f7f9] px-3 text-[14.5px] font-medium">🇧🇩 +880</span>
              <input id="ph" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01712 345678" className={inputCls + " h-11 flex-1 text-[15.5px]"} aria-invalid={!!err} aria-describedby={err ? "pherr" : undefined} />
            </div>
            {err && <p id="pherr" role="alert" className="mt-2 text-[13.5px] text-[#b12a22]">{err}</p>}
            <Primary type="submit" className="mt-6 w-full">Send code</Primary>
            <p className="mt-4 text-[12.5px] leading-relaxed text-[#666d7a]">By continuing you agree to BinGi&apos;s Terms and Privacy Policy.</p>
          </form>
        ) : (
          <form onSubmit={verify} noValidate>
            <h2 className="text-[24px] font-bold tracking-[-0.01em]">Enter the code</h2>
            <p className="mt-1.5 text-[14.5px] text-[#5b6170]">Sent to {phone}. <button type="button" onClick={() => { setSent(false); setCode(""); setErr(""); }} className="font-medium text-[#c8232e] underline-offset-4 hover:underline">Change</button></p>
            <label className="mt-6 block text-[14px] font-medium" htmlFor="otp">6-digit code</label>
            <input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={inputCls + " mt-1.5 h-12 text-center font-mono text-[22px] tracking-[0.4em]"} aria-invalid={!!err} />
            {err && <p role="alert" className="mt-2 text-[13.5px] text-[#b12a22]">{err}</p>}
            <p className="mt-2 rounded-lg bg-hms-amber-soft px-2.5 py-1.5 text-[12.5px] text-hms-amber">Prototype: no SMS is sent. Use code {DEMO_OTP}.</p>
            <Primary type="submit" className="mt-6 w-full" disabled={code.length !== 6}>Verify</Primary>
          </form>
        )}
      </div>
    </main>
  );
}

function MyProperties() {
  const { st, update } = useOnboarding();
  const router = useRouter();
  const start = () => {
    const d = newDraft(st.drafts.length);
    update((s) => { s.drafts.unshift(d); s.current = d.id; });
    router.push("/onboarding/flow");
  };
  const open = (id: string, submitted: boolean) => { update((s) => { s.current = id; }); router.push(submitted ? "/onboarding/status" : "/onboarding/flow"); };
  return (
    <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
      <h1 className="text-[28px] font-bold tracking-[-0.015em]">Your properties</h1>
      <p className="mt-1.5 text-[15px] text-[#5b6170]">Each property has its own setup. Signed in as {st.phone}.</p>
      <button onClick={start} className="mt-6 flex w-full items-center gap-4 rounded-3xl border border-dashed border-[#e2a19c] bg-white p-5 text-left transition-shadow hover:shadow-[0_8px_24px_-12px_rgb(200_35_46/0.35)]">
        <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-b from-[#e2483f] to-[#c8232e] text-white"><Plus className="size-6" /></span>
        <span><span className="block text-[17px] font-semibold">Add a new property</span><span className="text-[14px] text-[#5b6170]">About 10 minutes. You can stop and continue later.</span></span>
        <ArrowRight className="ml-auto size-5 text-[#c8232e]" />
      </button>
      {st.drafts.length > 0 && (
        <ul className="mt-6 space-y-3">
          {st.drafts.map((d) => {
            const type = PROPERTY_TYPES.find((p) => p.slug === d.propertyType)?.label;
            const submitted = d.status !== "draft";
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-[#eceef2] bg-white p-5">
                <span className="grid size-12 place-items-center rounded-2xl bg-[#f2f3f6] text-[#4b5160]"><Building2 className="size-6" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16.5px] font-semibold">{d.name || "Untitled property"}</span>
                  <span className="text-[13.5px] text-[#5b6170]">{[type, d.city].filter(Boolean).join(" · ") || "Not started"}</span>
                </span>
                {submitted
                  ? <span className="rounded-full bg-[#fdf6e7] px-2.5 py-1 text-[12.5px] font-semibold text-[#7a4a0b]">{d.status === "approved" ? "Approved" : d.status === "needs-changes" ? "Needs changes" : "Waiting for approval"}</span>
                  : <span className="inline-flex items-center gap-1 text-[13px] text-[#5b6170]"><Clock className="size-4" /> Next: {STEP_TITLE[d.step]}</span>}
                <button onClick={() => open(d.id, submitted)} className="h-10 rounded-xl border border-[#dfe2e8] px-4 text-[14.5px] font-medium hover:bg-[#f6f7f9]">{submitted ? "View status" : "Continue"}</button>
                {submitted && <Link href="/hms" onClick={() => { update((s) => { s.current = d.id; }); setProperty(d.slug); }} className="h-10 rounded-xl bg-[#1d1f24] px-4 py-2.5 text-[14.5px] font-medium text-white">Open HMS</Link>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-8 text-[13.5px] text-[#5b6170]">Running several properties as a group? Enterprise is set up with you by BinGi sales — use <b>Need help?</b> above.</p>
    </main>
  );
}
