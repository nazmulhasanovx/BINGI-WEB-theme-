"use client";
// General enquiry (questions, groups, weddings, corporate). PROTOTYPE: nothing is sent.
// Production: creates an enquiry in HMS → Communication (endpoint not built yet).
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import type { Hotel } from "@/lib/types";
import { T, useT } from "@/lib/i18n";
import { waLink } from "@/themes/shared";

const TOPICS = ["A question about my stay", "Group booking (5+ rooms)", "Wedding / holud / party", "Company stay or meeting", "Something else"];

export function ContactForm({ hotel }: { hotel: Hotel }) {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = "h-12 w-full rounded-2xl border border-line bg-canvas px-4 text-[15px] font-normal outline-none focus:border-brand-ring focus:ring-2 focus:ring-brand-soft";
  if (sent)
    return (
      <div role="status" className="rounded-3xl border border-line bg-surface p-6 md:p-8">
        <h2 className="text-[24px] font-bold"><T>Request noted</T></h2>
        <p className="mt-2 text-[15px] text-muted"><T>Demo: nothing was sent. On a live site the hotel team gets this in BinGi HMS and replies by phone or email.</T></p>
        {hotel.whatsapp && <a href={waLink(hotel, `Hello ${hotel.name}`)} target="_blank" rel="noopener" className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-action px-5 text-[15px] font-semibold text-on-action"><MessageCircle className="size-[18px]" /> WhatsApp</a>}
      </div>
    );
  return (
    <form
      noValidate
      aria-label={t("Send a message")}
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const miss = ["name", "phone", "message"].filter((k) => !String(f.get(k) ?? "").trim());
        if (miss.length) { setErr(t("Please fill in your name, phone and message.")); return; }
        setErr(null); setSent(true);
      }}
      className="rounded-3xl border border-line bg-surface p-5 shadow-card md:p-8"
    >
      <h2 className="text-[24px] font-bold"><T>Send a message</T></h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[14px] font-semibold sm:col-span-2"><T>About</T>
          <select name="topic" className={input}>{TOPICS.map((o) => <option key={o} value={o}>{t(o)}</option>)}</select>
        </label>
        <label className="grid gap-1.5 text-[14px] font-semibold"><T>Your name</T><input name="name" autoComplete="name" required className={input} /></label>
        <label className="grid gap-1.5 text-[14px] font-semibold"><T>Phone</T><input name="phone" type="tel" autoComplete="tel" required className={input} /></label>
        <label className="grid gap-1.5 text-[14px] font-semibold"><T>Email</T> <span className="sr-only">(optional)</span><input name="email" type="email" autoComplete="email" className={input} /></label>
        <label className="grid gap-1.5 text-[14px] font-semibold"><T>Date</T> <span className="sr-only">(optional)</span><input name="date" type="date" className={input} /></label>
        <label className="grid gap-1.5 text-[14px] font-semibold sm:col-span-2"><T>Message</T><textarea name="message" rows={4} required className={`${input} h-auto py-3`} /></label>
      </div>
      {err && <p role="alert" className="mt-4 text-[14px] font-semibold text-[#b42318]">{err}</p>}
      <button type="submit" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-action px-6 text-[15px] font-semibold text-on-action"><T>Send</T></button>
      <p className="mt-3 text-[13px] text-muted"><T>Demo form — nothing is sent yet.</T></p>
    </form>
  );
}
