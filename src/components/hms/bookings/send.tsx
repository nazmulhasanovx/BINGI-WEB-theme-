"use client";
// Send to guest — one sheet for every booking message: a booking update, any document (PDF), or the details of a
// booking that is not confirmed yet. SMS and email go through Messaging (plan credits first); WhatsApp opens on this
// device. Prototype: SMS/email are recorded in Messaging › History, nothing leaves the browser.
import clsx from "clsx";
import { useMemo, useState } from "react";
import { Eye, FileText, Mail, MessageCircle, MessageSquareText, Send, X } from "lucide-react";
import { smsParts, type Channel } from "@/lib/communication/store";
import { useCommData } from "../communication/data";
import { bMain, bSoft } from "./ui";

export type SendDoc = { id: string; label: string; note?: string; html: () => string };
export type SendSpec = {
  title: string;
  /** Booking code the messages belong to ("" before the booking exists). */
  code: string;
  guest: string; phone: string; email: string;
  /** Ready text for "Booking update" (status, dates, money, link). */
  update: string;
  /** Link the guest can open (booking page / documents). */
  link: string;
  docs: SendDoc[];
  /** Documents ticked when the sheet opens. */
  pick?: string[];
};

/** SMS in plain Latin letters costs 160 characters a credit; one "৳", "→" or "·" turns it into 70. Bangla text stays as written. */
export const smsSafe = (t: string) => t.replace(/৳/g, "Tk ").replace(/→/g, "to").replace(/[·—–]/g, "-").replace(/\u00a0/g, " ");
const normPhone = (p: string) => p.replace(/[^\d+]/g, "");
const waUrl = (phone: string, text: string) => `https://wa.me/${normPhone(phone).replace(/^\+/, "").replace(/^0/, "880")}?text=${encodeURIComponent(text)}`;

/** Text that goes with the chosen documents: email attaches them as PDF; SMS / WhatsApp carry a link. */
export function composeText(s: SendSpec, docs: string[], ch: Channel | "wa") {
  const names = s.docs.filter((d) => docs.includes(d.id)).map((d) => d.label);
  if (!names.length) return s.update;
  const list = names.join(", ");
  return ch === "email"
    ? `${s.update}\n\nAttached (PDF): ${list}.`
    : `${s.update}\n${list}: ${s.link}`;
}

export function SendSheet({ spec, onClose, onSent }: { spec: SendSpec; onClose: () => void; onSent: (summary: string) => void }) {
  const { comm } = useCommData();
  const [phone, setPhone] = useState(spec.phone);
  const [email, setEmail] = useState(spec.email);
  const [chs, setChs] = useState<Record<Channel | "wa", boolean>>({ sms: !!spec.phone, email: !!spec.email, wa: false });
  const [docs, setDocs] = useState<string[]>(spec.pick ?? []);
  const [text, setText] = useState(() => composeText(spec, spec.pick ?? [], spec.email ? "email" : "sms"));
  const [edited, setEdited] = useState(false);
  const [err, setErr] = useState("");
  const [peek, setPeek] = useState<SendDoc | null>(null);
  const toggleDoc = (id: string) => {
    const next = docs.includes(id) ? docs.filter((x) => x !== id) : [...docs, id];
    setDocs(next);
    if (!edited) setText(composeText(spec, next, chs.email && !chs.sms ? "email" : "sms"));
  };
  const parts = smsParts(smsSafe(text));
  const c = comm.credits;
  const any = chs.sms || chs.email || chs.wa;
  const send = () => {
    setErr("");
    if (!any) return setErr("Pick SMS, email or WhatsApp");
    const done: string[] = [];
    const docNames = spec.docs.filter((d) => docs.includes(d.id)).map((d) => d.label);
    const event = docNames.length ? `Sent: ${docNames.join(", ")}` : spec.code ? "Booking update" : "Booking details (not confirmed)";
    if (chs.sms) {
      const e = comm.send({ channel: "sms", to: phone.trim(), guest: spec.guest, booking: spec.code || undefined, event, text: smsSafe(edited ? text : composeText(spec, docs, "sms")) });
      if (e) return setErr(`SMS: ${e}`);
      done.push(`SMS ${phone.trim()}`);
    }
    if (chs.email) {
      const e = comm.send({ channel: "email", to: email.trim(), guest: spec.guest, booking: spec.code || undefined, event, text: edited ? text : composeText(spec, docs, "email") });
      if (e) return setErr(`Email: ${e}${done.length ? ` (${done.join(", ")} already sent)` : ""}`);
      done.push(`Email ${email.trim()}`);
    }
    if (chs.wa) { window.open(waUrl(phone, edited ? text : composeText(spec, docs, "wa")), "_blank", "noopener"); done.push("WhatsApp"); }
    onSent(`${event} · ${done.join(" · ")}`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[rgb(16_24_40/0.18)]" role="dialog" aria-modal="true" aria-label={spec.title} onClick={onClose}>
      <div className="hms-up flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-hms-line px-5 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-hms-coral-soft text-hms-red"><Send className="size-4" /></span>
          <div className="min-w-0 flex-1"><h2 className="text-[17px] font-bold">{spec.title}</h2><p className="truncate text-[13px] text-hms-muted">{spec.guest}{spec.code ? ` · ${spec.code}` : " · not confirmed yet"}</p></div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* where */}
          <section>
            <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-hms-muted">Send by</p>
            <div className="space-y-2">
              <label className={clsx("flex items-center gap-3 rounded-xl border p-3", chs.sms ? "border-hms-ink" : "border-hms-line")}>
                <input type="checkbox" checked={chs.sms} onChange={(e) => setChs({ ...chs, sms: e.target.checked })} className="size-4 accent-[#b11c29]" />
                <MessageSquareText className="size-4 text-hms-muted" /><span className="w-16 text-[14px] font-semibold">SMS</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="01XXX-XXXXXX" aria-label="Phone number" className="h-9 min-w-0 flex-1 rounded-lg border border-hms-line px-2.5 text-[14px]" />
              </label>
              <label className={clsx("flex items-center gap-3 rounded-xl border p-3", chs.email ? "border-hms-ink" : "border-hms-line")}>
                <input type="checkbox" checked={chs.email} onChange={(e) => setChs({ ...chs, email: e.target.checked })} className="size-4 accent-[#b11c29]" />
                <Mail className="size-4 text-hms-muted" /><span className="w-16 text-[14px] font-semibold">Email</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" placeholder="guest@email.com" aria-label="Email address" className="h-9 min-w-0 flex-1 rounded-lg border border-hms-line px-2.5 text-[14px]" />
              </label>
              <label className={clsx("flex items-center gap-3 rounded-xl border p-3", chs.wa ? "border-hms-ink" : "border-hms-line")}>
                <input type="checkbox" checked={chs.wa} onChange={(e) => setChs({ ...chs, wa: e.target.checked })} className="size-4 accent-[#b11c29]" />
                <MessageCircle className="size-4 text-hms-muted" /><span className="text-[14px] font-semibold">WhatsApp</span>
                <span className="ml-auto text-[12.5px] text-hms-muted">opens on this device · no credit</span>
              </label>
            </div>
            <p className="mt-2 text-[12.5px] text-hms-muted">Credits left: SMS {c.sms.left} · Email {c.email.left} · plan credits are used first.{chs.sms && ` This SMS uses ${parts} credit${parts > 1 ? "s" : ""}.`}</p>
          </section>

          {/* what */}
          {spec.docs.length > 0 && (
            <section>
              <p className="mb-2 text-[12.5px] font-semibold uppercase tracking-wide text-hms-muted">Add documents</p>
              <ul className="divide-y divide-hms-line rounded-xl border border-hms-line">
                {spec.docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                    <input type="checkbox" checked={docs.includes(d.id)} onChange={() => toggleDoc(d.id)} aria-label={d.label} className="size-4 accent-[#b11c29]" />
                    <FileText className="size-4 shrink-0 text-hms-muted" />
                    <span className="min-w-0 flex-1"><b className="block text-[14px]">{d.label}</b>{d.note && <span className="text-[12.5px] text-hms-muted">{d.note}</span>}</span>
                    <button onClick={() => setPeek(d)} className={clsx(bSoft, "!h-8 px-2.5 text-[13px]")}><Eye className="size-4" />View</button>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[12.5px] text-hms-muted">Email attaches the documents as PDF. SMS and WhatsApp send a link the guest can open.</p>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between"><p className="text-[12.5px] font-semibold uppercase tracking-wide text-hms-muted">Message</p>{edited && <button onClick={() => { setEdited(false); setText(composeText(spec, docs, "sms")); }} className="text-[12.5px] font-semibold text-hms-red">Reset text</button>}</div>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setEdited(true); }} rows={8} aria-label="Message text" className="w-full rounded-xl border border-hms-line p-3 text-[14px] leading-6" />
            <p className="mt-1 text-right text-[12px] text-hms-muted">{text.length} characters{chs.sms && ` · ${parts} SMS`}</p>
          </section>
          {err && <p role="alert" className="rounded-lg bg-[#fdecec] px-3 py-2 text-[13.5px] font-medium text-[#b42318]">{err}</p>}
        </div>
        <div className="flex items-center gap-2 border-t border-hms-line px-5 py-3">
          <p className="min-w-0 flex-1 text-[12px] text-hms-muted">Prototype: SMS and email are saved in Messaging › History, not really sent.</p>
          <button onClick={onClose} className={bSoft}>Cancel</button>
          <button onClick={send} disabled={!any} className={clsx(bMain, "disabled:opacity-40")}><Send className="size-4" />Send now</button>
        </div>
      </div>
      {peek && <DocPeek doc={peek} onClose={() => setPeek(null)} />}
    </div>
  );
}

/** Look at a document before it goes out. */
export function DocPeek({ doc, onClose }: { doc: { label: string; html: () => string }; onClose: () => void }) {
  const html = useMemo(() => doc.html(), [doc]);
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[rgb(16_24_40/0.25)] p-4" role="dialog" aria-modal="true" aria-label={doc.label} onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="flex h-[min(860px,92vh)] w-[min(860px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-hms-line px-4 py-3"><FileText className="size-4 text-hms-muted" /><b className="flex-1 text-[15px]">{doc.label}</b><button onClick={onClose} aria-label="Close preview" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button></div>
        <iframe title={doc.label} srcDoc={html} className="w-full flex-1 bg-[#f4f6f8]" />
      </div>
    </div>
  );
}
