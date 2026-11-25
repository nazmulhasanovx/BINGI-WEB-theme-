// Print a guest bill, kitchen ticket (KOT) or room charge slip on the browser's printer dialog — 80 mm receipt layout
// (src/lib/bookings/thermal-kit.ts). A hidden iframe keeps the HMS page as it is. Direct thermal printing stays in the live HMS.
export { billHtml, kotHtml, roomSlipHtml, serviceReceiptHtml } from "@/lib/bookings/docs-thermal";

export function printHtml(html: string) {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(f);
  const d = f.contentDocument!;
  d.open(); d.write(html); d.close();
  // Wait for the web fonts (Bangla needs Noto Sans Bengali), but never longer than 1.5 s.
  const go = () => { try { f.contentWindow?.focus(); f.contentWindow?.print(); } catch {} setTimeout(() => f.remove(), 1500); };
  let done = false; const once = () => { if (!done) { done = true; go(); } };
  setTimeout(() => { try { d.fonts?.ready.then(once, once); } catch { once(); } setTimeout(once, 1500); }, 120);
}
