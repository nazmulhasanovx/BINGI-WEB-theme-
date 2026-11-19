"use client";
// "Get the app" (install BinGi HMS from the browser) and full screen — header button, account menu, My preferences card.
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Check, Download, Maximize2, Minimize2, Monitor, Smartphone, X } from "lucide-react";
import { imgSrc } from "@/lib/img";
import { useFullscreen, useInstall } from "@/lib/app-mode";

export const APP_ICON = "/hms-app/icon-192.png";

export function FullscreenButton({ className }: { className?: string }) {
  const fs = useFullscreen();
  if (!fs.allowed) return null;
  const Icon = fs.on ? Minimize2 : Maximize2;
  return (
    <button onClick={fs.toggle} aria-pressed={fs.on} aria-label={fs.on ? "Exit full screen" : "Full screen"} title={fs.on ? "Exit full screen (Esc)" : "Full screen"}
      className={clsx("grid size-9 place-items-center rounded-lg hover:bg-hms-hover", className)}><Icon className="size-[18px]" /></button>
  );
}

/** Small logo + text block used in the menu and preferences. */
export function AppBadge({ size = 44 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element -- official BinGi HMS app icon
  return <img src={imgSrc(APP_ICON)} alt="BinGi HMS app icon" width={size} height={size} style={{ width: size, height: size }} className="shrink-0 rounded-[22%] shadow-[0_2px_6px_rgb(0_0_0/0.12)]" />;
}

export function InstallSheet({ onClose }: { onClose: () => void }) {
  const { state, install, ios, safari } = useInstall();
  const fs = useFullscreen();
  const [msg, setMsg] = useState("");
  // Inside a preview (no app manifest on the page) the browser can't install the HMS — say so instead of steps.
  const [preview] = useState(() => typeof document !== "undefined" && !document.querySelector('link[rel="manifest"]'));
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const steps = ios
    ? ["Open this page in Safari", "Tap the Share button", "Tap “Add to Home Screen”, then Add"]
    : safari
      ? ["In Safari’s menu bar choose File", "Choose “Add to Dock…”", "Click Add — BinGi HMS opens in its own window"]
      : ["Click the install icon at the right of the address bar", "Or open the browser menu (⋮) › “Install BinGi HMS” / “Apps › Install”", "Click Install — it opens in its own window"];
  return (
    <div className="hms-fade fixed inset-0 z-[90] flex items-end justify-center bg-[#0f1720]/25 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Get the BinGi HMS app" onClick={(e) => e.stopPropagation()} className="hms-up w-full max-w-[460px] overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-start gap-3 px-5 pb-3 pt-5">
          <AppBadge size={56} />
          <div className="min-w-0 flex-1"><h2 className="text-[18px] font-bold">BinGi HMS app</h2><p className="text-[13.5px] text-hms-muted">Opens in its own window with the BinGi HMS icon — on your computer, phone or tablet. <span lang="bn">অ্যাপের মতো ব্যবহার করুন।</span></p></div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg hover:bg-hms-hover"><X className="size-5" /></button>
        </div>
        <div className="space-y-3 px-5 pb-5">
          {preview ? (
            <p className="rounded-xl bg-[#eef3fd] px-3.5 py-3 text-[13.5px] text-[#1e3a8a]">This is a preview page, so it can&apos;t be installed from here. Open the HMS on its own website and use “Get the app” there.</p>
          ) : state === "installed" ? (
            <p className="flex items-center gap-2 rounded-xl bg-[#e5f5ec] px-3.5 py-3 text-[14px] font-medium text-[#16693a]"><Check className="size-4" />Installed — you&apos;re using the app now.</p>
          ) : state === "ready" ? (
            <button onClick={async () => { const r = await install(); setMsg(r === "accepted" ? "Installed. Find BinGi HMS with your apps." : r === "dismissed" ? "Not installed. You can install any time from here." : ""); }}
              className="btn-glow inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14.5px] font-semibold text-white"><Download className="size-4" />Install BinGi HMS</button>
          ) : (
            <div className="rounded-xl border border-hms-line p-3.5">
              <p className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold">{ios ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}{ios ? "On iPhone or iPad" : safari ? "On Mac (Safari)" : "On Chrome or Edge"}</p>
              <ol className="space-y-1.5 text-[13.5px] text-hms-muted">{steps.map((s, i) => <li key={s} className="flex gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#ffecec] text-[11.5px] font-bold text-[#c8232e]">{i + 1}</span>{s}</li>)}</ol>
            </div>
          )}
          {msg && <p role="status" className="text-[13.5px] text-hms-muted">{msg}</p>}
          {fs.allowed && <button onClick={fs.toggle} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-hms-line bg-white text-[14.5px] font-semibold hover:bg-hms-hover">{fs.on ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}{fs.on ? "Exit full screen" : "Use full screen now"}</button>}
          <p className="text-[12px] text-hms-muted">Same account and data as the browser. Needs the internet; without it a short offline page shows. Prototype: installs this preview site.</p>
        </div>
      </div>
    </div>
  );
}

/** Settings › My preferences card. */
export function AppCard({ onOpen }: { onOpen: () => void }) {
  const { state } = useInstall();
  const fs = useFullscreen();
  return (
    <div className="flex flex-wrap items-center gap-4">
      <AppBadge />
      <div className="min-w-0 flex-1"><p className="text-[14.5px] font-medium">BinGi HMS app</p><p className="text-[13px] text-hms-muted">{state === "installed" ? "Installed on this device." : "Install it from the browser — it opens in its own window with the BinGi HMS icon."}</p></div>
      {fs.allowed && <button onClick={fs.toggle} className="inline-flex h-10 items-center gap-2 rounded-xl border border-hms-line bg-white px-3.5 text-[14px] font-semibold hover:bg-hms-hover">{fs.on ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}{fs.on ? "Exit full screen" : "Full screen"}</button>}
      {state !== "installed" && <button onClick={onOpen} className="btn-glow inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[14px] font-semibold text-white"><Download className="size-4" />Get the app</button>}
    </div>
  );
}
