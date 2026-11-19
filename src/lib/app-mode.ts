"use client";
// HMS as an app: install it (PWA — Chrome, Edge, Android; Safari "Add to Dock / Home Screen") and full screen.
// The install prompt is caught once per page load; the browser decides when it is offered.
import { useCallback, useEffect, useSyncExternalStore } from "react";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: BIP | null = null;
let installed = false;
const subs = new Set<() => void>();
const ping = () => subs.forEach((f) => f());
const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e as BIP; ping(); });
  window.addEventListener("appinstalled", () => { installed = true; deferred = null; ping(); });
  document.addEventListener("fullscreenchange", ping);
}

/** Running as the installed app (its own window, no browser bar). */
export const isStandalone = () => typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || window.matchMedia?.("(display-mode: window-controls-overlay)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const ua = () => (typeof navigator === "undefined" ? "" : navigator.userAgent);
export const isIOS = () => /iPhone|iPad|iPod/.test(ua()) || (ua().includes("Macintosh") && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);
export const isSafari = () => /Safari/.test(ua()) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua());

export type InstallState = "installed" | "ready" | "manual" | "unsupported";
function installState(): InstallState {
  if (typeof window === "undefined") return "unsupported";
  if (installed || isStandalone()) return "installed";
  if (deferred) return "ready";
  // Safari (Mac: File › Add to Dock · iPhone/iPad: Share › Add to Home Screen) and browsers that have not offered yet.
  return "manual";
}
export function useInstall() {
  const state = useSyncExternalStore(sub, installState, () => "unsupported" as InstallState);
  const install = useCallback(async () => {
    if (!deferred) return "manual" as const;
    const d = deferred; await d.prompt();
    const { outcome } = await d.userChoice;
    deferred = null; if (outcome === "accepted") installed = true; ping();
    return outcome;
  }, []);
  return { state, install, ios: isIOS(), safari: isSafari() };
}

const fsOn = () => typeof document !== "undefined" && !!document.fullscreenElement;
export const fsAllowed = () => typeof document !== "undefined" && !!document.fullscreenEnabled;
export function useFullscreen() {
  const on = useSyncExternalStore(sub, fsOn, () => false);
  const allowed = useSyncExternalStore(sub, fsAllowed, () => false);
  const toggle = useCallback(async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen({ navigationUI: "hide" }); } catch { /* blocked by the browser */ }
    ping();
  }, []);
  return { on, allowed, toggle };
}

/** Registers the HMS service worker (network first + offline page). Skipped where it can't work (file://, previews). */
export function useAppServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol) || !window.isSecureContext) return;
    navigator.serviceWorker.register("/hms-sw.js", { scope: "/hms" }).catch(() => {});
  }, []);
}
